import React, { useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  doc, 
  runTransaction, 
  serverTimestamp,
  getDocs,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { Artist, Vote, UserProfile } from './types';
import { createVoteHash } from './services/blockchain';
import Navbar from './components/Navbar';
import ArtistCard from './components/ArtistCard';
import Leaderboard from './components/Leaderboard';
import VoteHistory from './components/VoteHistory';
import AdminDashboard from './components/AdminDashboard';
import { Toaster, toast } from 'react-hot-toast';
import { Shield, Activity, Database, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const INITIAL_ARTISTS = [
  { name: 'Sơn Tùng M-TP', genre: 'V-Pop', photoUrl: '/images/artists/son-tung.jpg' },
  { name: 'Đen Vâu', genre: 'Rap/Hip-Hop', photoUrl: '/images/artists/denvau.jpg' },
  { name: 'Hoàng Thùy Linh', genre: 'Pop/Folk', photoUrl: '/images/artists/htl.jpg' },
  { name: 'Suboi', genre: 'Rap', photoUrl: '/images/artists/suboi.jpg' },
  { name: 'Binz', genre: 'Rap/Pop', photoUrl: '/images/artists/binz.jpg' },
  { name: 'Mỹ Tâm', genre: 'Pop', photoUrl: '/images/artists/mytam.jpg' },
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingInProgress, setVotingInProgress] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch or create user profile
        const userRef = doc(db, 'users', currentUser.uid);
        let userSnap;
        try {
          userSnap = await getDoc(userRef);
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
          return;
        }
        
        const isAdminEmail = currentUser.email === 'dii342005@gmail.com';

        if (!userSnap.exists()) {
          const newProfile: UserProfile = {
            uid: currentUser.uid,
            email: currentUser.email || '',
            displayName: currentUser.displayName || 'Anonymous',
            photoURL: currentUser.photoURL || '',
            hasVoted: false,
            role: isAdminEmail ? 'admin' : 'user'
          };
          try {
            await setDoc(userRef, newProfile);
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `users/${currentUser.uid}`);
          }
          setUserProfile(newProfile);
        } else {
          const existingData = userSnap.data() as UserProfile;
          // Ensure admin role if email matches
          if (isAdminEmail && existingData.role !== 'admin') {
            const updatedProfile = { ...existingData, role: 'admin' as const };
            try {
              await setDoc(userRef, updatedProfile, { merge: true });
            } catch (error) {
              handleFirestoreError(error, OperationType.WRITE, `users/${currentUser.uid}`);
            }
            setUserProfile(updatedProfile);
          } else {
            setUserProfile(existingData);
          }
        }
      } else {
        setUserProfile(null);
        setShowAdmin(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Artists Listener & Seeding
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'artists'), (snapshot) => {
      if (snapshot.empty) {
        // Seed initial data (only if empty)
        const seed = async () => {
          for (const artist of INITIAL_ARTISTS) {
            const newArtistRef = doc(collection(db, 'artists'));
            try {
              await setDoc(newArtistRef, { ...artist, voteCount: 0 });
            } catch (error) {
              handleFirestoreError(error, OperationType.CREATE, 'artists');
            }
          }
        };
        seed();
      } else {
        const currentArtists = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Artist));
        setArtists(currentArtists);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'artists');
    });
    return () => unsubscribe();
  }, []);

  // Auto-update artist photos (Admin only)
  useEffect(() => {
    if (userProfile?.role === 'admin' && artists.length > 0) {
      const updatePhotos = async () => {
        for (const localArtist of INITIAL_ARTISTS) {
          const dbArtist = artists.find(a => a.name === localArtist.name);
          if (dbArtist && dbArtist.photoUrl.includes('picsum.photos')) {
            const artistRef = doc(db, 'artists', dbArtist.id);
            try {
              await setDoc(artistRef, { ...dbArtist, photoUrl: localArtist.photoUrl }, { merge: true });
            } catch (error) {
              handleFirestoreError(error, OperationType.UPDATE, `artists/${dbArtist.id}`);
            }
          }
        }
      };
      updatePhotos();
    }
  }, [userProfile, artists]);

  // Votes Listener (Blockchain)
  useEffect(() => {
    const q = query(collection(db, 'votes'), orderBy('timestamp', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setVotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vote)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'votes');
    });
    return () => unsubscribe();
  }, []);

  const handleVote = async (artistId: string) => {
    if (!user || !userProfile) {
      toast.error('Vui lòng kết nối ví (đăng nhập) để bình chọn');
      return;
    }

    if (userProfile.hasVoted) {
      toast.error('Bạn đã thực hiện bình chọn trong chu kỳ này');
      return;
    }

    setVotingInProgress(true);
    const voteToast = toast.loading('Đang khai thác giao dịch và phát sóng lên mạng lưới...');

    try {
      await runTransaction(db, async (transaction) => {
        // 1. Get latest vote for previous hash
        const latestVoteQuery = query(collection(db, 'votes'), orderBy('timestamp', 'desc'), limit(1));
        const latestVoteSnap = await getDocs(latestVoteQuery);
        const previousHash = latestVoteSnap.empty ? '0'.repeat(64) : latestVoteSnap.docs[0].data().hash;

        // 2. Get artist and user docs
        const artistRef = doc(db, 'artists', artistId);
        const userRef = doc(db, 'users', user.uid);
        
        const artistSnap = await transaction.get(artistRef);
        const userSnap = await transaction.get(userRef);

        if (!artistSnap.exists()) throw new Error('Không tìm thấy nghệ sĩ');
        if (userSnap.data()?.hasVoted) throw new Error('Đã bình chọn rồi');

        // 3. Calculate new hash
        const timestamp = Date.now();
        const hash = createVoteHash(user.uid, artistId, timestamp, previousHash);

        // 4. Perform updates
        const newVoteRef = doc(collection(db, 'votes'));
        transaction.set(newVoteRef, {
          userId: user.uid,
          artistId,
          timestamp: serverTimestamp(),
          previousHash,
          hash,
          userName: user.displayName || 'Người dùng ẩn danh'
        });

        transaction.update(artistRef, {
          voteCount: (artistSnap.data().voteCount || 0) + 1
        });

        transaction.update(userRef, {
          hasVoted: true
        });
      });

      toast.success('Bình chọn đã được ghi lại trên blockchain!', { id: voteToast });
      setUserProfile(prev => prev ? { ...prev, hasVoted: true } : null);
    } catch (error: any) {
      console.error('Voting error:', error);
      if (error.message && error.message.includes('permission-denied')) {
        handleFirestoreError(error, OperationType.WRITE, 'votes/artists/users');
      }
      toast.error(error.message || 'Giao dịch thất bại. Vui lòng thử lại.', { id: voteToast });
    } finally {
      setVotingInProgress(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center font-mono">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] uppercase tracking-widest animate-pulse">Đang đồng bộ với mạng lưới...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-black selection:bg-black selection:text-[#E4E3E0]">
      <Toaster position="bottom-right" />
      <Navbar 
        user={user} 
        isAdmin={userProfile?.role === 'admin'} 
        onToggleAdmin={() => setShowAdmin(!showAdmin)}
        showAdmin={showAdmin}
      />

      <main className="max-w-7xl mx-auto px-6 py-12">
        {showAdmin ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AdminDashboard artists={artists} />
          </motion.div>
        ) : (
          <>
            {/* Hero Section */}
            <header className="mb-16">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-black/60">Trạng thái mạng: Hoạt động</span>
          </div>
          <h2 className="text-6xl sm:text-8xl font-serif italic tracking-tighter leading-[0.85] mb-6">
            Tương Lai Của <br />
            <span className="not-italic font-sans font-black uppercase">Bình Chọn Nghệ Sĩ</span>
          </h2>
          <div className="max-w-2xl">
            <p className="font-mono text-xs text-black/60 leading-relaxed uppercase tracking-wide">
              Nền tảng bình chọn phi tập trung, minh bạch và không thể thay đổi. Mỗi phiếu bầu là một giao dịch được bảo mật bằng mật mã, đảm bảo tính toàn vẹn tuyệt đối trong việc lựa chọn những nghệ sĩ vĩ đại nhất thế giới.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content: Artist Grid */}
          <div className="lg:col-span-8 space-y-12">
            <div className="flex items-center justify-between border-b border-black/10 pb-4">
              <div className="flex items-center gap-2">
                <Activity size={16} />
                <h3 className="text-[10px] uppercase tracking-[0.2em] font-mono font-bold">Ứng Cử Viên Đang Hoạt Động</h3>
              </div>
              <div className="text-[10px] font-mono text-black/40">
                TỔNG SỐ NGHỆ SĨ: {artists.length}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {artists.map((artist) => (
                  <motion.div
                    key={artist.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ArtistCard 
                      artist={artist} 
                      onVote={handleVote}
                      disabled={votingInProgress}
                      hasVoted={!!userProfile?.hasVoted}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Sidebar: Stats & Ledger */}
          <aside className="lg:col-span-4 space-y-8">
            <Leaderboard artists={artists} />
            <VoteHistory votes={votes} />
            
            {/* Tech Info Card */}
            <div className="border border-black/10 p-6 bg-white/50 space-y-4">
              <div className="flex items-center gap-2 text-black/40">
                <Database size={14} />
                <span className="text-[10px] font-mono uppercase tracking-widest">Thông số giao thức</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-black/5 pb-2">
                  <span className="text-[9px] font-mono text-black/40 uppercase">Thuật toán</span>
                  <span className="text-[10px] font-mono font-bold">SHA-256</span>
                </div>
                <div className="flex justify-between items-center border-b border-black/5 pb-2">
                  <span className="text-[9px] font-mono text-black/40 uppercase">Đồng thuận</span>
                  <span className="text-[10px] font-mono font-bold">Mỗi người một phiếu</span>
                </div>
                <div className="flex justify-between items-center border-b border-black/5 pb-2">
                  <span className="text-[9px] font-mono text-black/40 uppercase">Mạng lưới</span>
                  <span className="text-[10px] font-mono font-bold">Mainnet Beta</span>
                </div>
              </div>
              <div className="flex items-start gap-2 pt-2">
                <Info size={12} className="text-black/30 mt-0.5" />
                <p className="text-[8px] font-mono text-black/40 leading-normal uppercase">
                  Tất cả các giao dịch là cuối cùng và được ghi lại trên sổ cái không thể thay đổi. Việc xác minh được thực hiện theo thời gian thực trên toàn mạng lưới phân tán.
                </p>
              </div>
            </div>
          </aside>
        </div>
        </>
        )}
      </main>

      <footer className="border-t border-black/10 mt-24 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-black flex items-center justify-center">
              <Shield className="text-[#E4E3E0]" size={20} />
            </div>
            <div>
              <h4 className="font-serif italic text-lg">Artist Chain Vote</h4>
              <p className="text-[9px] font-mono text-black/40 uppercase tracking-widest">© 2026 Giao Thức Bình Chọn Phi Tập Trung</p>
            </div>
          </div>
          
          <div className="flex gap-8">
            <a href="#" className="text-[10px] font-mono uppercase tracking-widest hover:underline">Sách trắng</a>
            <a href="#" className="text-[10px] font-mono uppercase tracking-widest hover:underline">Khám phá mạng lưới</a>
            <a href="#" className="text-[10px] font-mono uppercase tracking-widest hover:underline">Tài liệu API</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
