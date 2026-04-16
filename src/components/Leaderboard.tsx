import React from 'react';
import { Artist } from '../types';
import { Trophy, Music, TrendingUp } from 'lucide-react';

interface LeaderboardProps {
  artists: Artist[];
}

export default function Leaderboard({ artists }: LeaderboardProps) {
  const sortedArtists = [...artists].sort((a, b) => b.voteCount - a.voteCount);
  const topArtist = sortedArtists[0];

  return (
    <div className="border border-black bg-white overflow-hidden">
      <div className="bg-black text-[#E4E3E0] p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-yellow-400" />
          <h2 className="text-xs uppercase tracking-[0.2em] font-mono font-bold">Bảng xếp hạng</h2>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-mono opacity-50">
          <TrendingUp size={12} />
          DỮ LIỆU TRỰC TIẾP
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        {sortedArtists.map((artist, index) => (
          <div key={artist.id} className="flex items-center gap-4 group">
            <div className="w-8 h-8 flex items-center justify-center font-mono text-xs border border-black/10 group-hover:bg-black group-hover:text-[#E4E3E0] transition-colors">
              {index + 1}
            </div>
            
            <div className="flex-1 flex items-center gap-3">
              <div className="w-10 h-10 overflow-hidden bg-black/5">
                <img 
                  src={artist.photoUrl} 
                  alt={artist.name} 
                  className="w-full h-full object-cover grayscale"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-serif italic text-sm leading-none mb-1">{artist.name}</span>
                <span className="text-[9px] font-mono text-black/40 uppercase tracking-wider">{artist.genre}</span>
              </div>
            </div>
            
            <div className="text-right">
              <div className="font-mono text-xs font-bold">{artist.voteCount}</div>
              <div className="text-[8px] font-mono text-black/30 uppercase tracking-widest">PHIẾU</div>
            </div>
          </div>
        ))}
      </div>
      
      {topArtist && (
        <div className="bg-black/5 p-4 border-t border-black/10 flex items-center gap-3">
          <Music size={16} className="text-black/40" />
          <p className="text-[10px] font-mono text-black/60 uppercase tracking-widest">
            Dẫn đầu: <span className="text-black font-bold">{topArtist.name}</span>
          </p>
        </div>
      )}
    </div>
  );
}
