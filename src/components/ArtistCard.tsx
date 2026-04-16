import React from 'react';
import { Artist } from '../types';
import { Vote as VoteIcon } from 'lucide-react';

interface ArtistCardProps {
  artist: Artist;
  onVote: (id: string) => void;
  disabled: boolean;
  hasVoted: boolean;
}

export default function ArtistCard({ artist, onVote, disabled, hasVoted }: ArtistCardProps) {
  return (
    <div className="border border-black/10 bg-white p-4 flex flex-col gap-4 group hover:border-black transition-colors">
      <div className="aspect-square overflow-hidden bg-[#f0f0f0] relative">
        <img 
          src={artist.photoUrl} 
          alt={artist.name} 
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 ease-in-out"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-2 right-2 bg-black text-[#E4E3E0] px-2 py-1 text-[10px] font-mono">
          {artist.voteCount} PHIẾU
        </div>
      </div>
      
      <div className="flex flex-col gap-1">
        <h3 className="font-serif italic text-lg leading-tight">{artist.name}</h3>
        <p className="text-[10px] font-mono text-black/50 uppercase tracking-wider">{artist.genre}</p>
      </div>

      <button
        onClick={() => onVote(artist.id)}
        disabled={disabled || hasVoted}
        className={`mt-auto flex items-center justify-center gap-2 py-2 text-[10px] uppercase tracking-widest font-mono border transition-all duration-300
          ${hasVoted 
            ? 'border-black/10 text-black/30 cursor-not-allowed' 
            : 'border-black hover:bg-black hover:text-[#E4E3E0]'
          }
        `}
      >
        <VoteIcon size={14} />
        {hasVoted ? 'Đã ghi nhận' : 'Bình chọn'}
      </button>
    </div>
  );
}
