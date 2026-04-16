import React from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { User } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface NavbarProps {
  user: any;
  isAdmin: boolean;
  onToggleAdmin: () => void;
  showAdmin: boolean;
}

export default function Navbar({ user, isAdmin, onToggleAdmin, showAdmin }: NavbarProps) {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/popup-blocked') {
        toast.error('Trình duyệt đã chặn cửa sổ đăng nhập. Vui lòng cho phép popup hoặc mở ứng dụng trong tab mới.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        // User closed the popup, no need for error toast
      } else {
        toast.error('Lỗi đăng nhập: ' + (error.message || 'Vui lòng thử lại hoặc mở trong tab mới.'));
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="border-b border-black/10 bg-[#E4E3E0] px-6 py-4 flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center">
          <span className="text-[#E4E3E0] font-bold text-xs">BC</span>
        </div>
        <h1 className="font-serif italic text-xl tracking-tight">Artist Chain Vote</h1>
      </div>
      
      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-4">
            {isAdmin && (
              <button 
                onClick={onToggleAdmin}
                className={`text-[10px] uppercase tracking-widest font-mono px-3 py-1 transition-colors ${
                  showAdmin ? 'bg-black text-[#E4E3E0]' : 'border border-black hover:bg-black hover:text-[#E4E3E0]'
                }`}
              >
                {showAdmin ? 'Quay lại' : 'Quản trị'}
              </button>
            )}
            <div className="flex items-center gap-2">
              <img 
                src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                alt="Profile" 
                className="w-8 h-8 rounded-full border border-black/20"
                referrerPolicy="no-referrer"
              />
              <span className="text-xs font-mono hidden sm:inline">{user.displayName}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="text-[10px] uppercase tracking-widest font-mono border border-black px-3 py-1 hover:bg-black hover:text-[#E4E3E0] transition-colors"
            >
              Đăng xuất
            </button>
          </div>
        ) : (
          <button 
            onClick={handleLogin}
            className="text-[10px] uppercase tracking-widest font-mono border border-black px-4 py-2 hover:bg-black hover:text-[#E4E3E0] transition-colors flex items-center gap-2"
          >
            <User size={14} />
            Kết nối ví (Google)
          </button>
        )}
      </div>
    </nav>
  );
}
