export interface Artist {
  id: string;
  name: string;
  genre: string;
  photoUrl: string;
  voteCount: number;
}

export interface Vote {
  id: string;
  userId: string;
  artistId: string;
  timestamp: any;
  previousHash: string;
  hash: string;
  userName: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  hasVoted?: boolean;
  role?: 'admin' | 'user';
}
