import React from 'react';
import { Vote } from '../types';
import { ShieldCheck, Clock, Hash } from 'lucide-react';

interface VoteHistoryProps {
  votes: Vote[];
}

export default function VoteHistory({ votes }: VoteHistoryProps) {
  return (
    <div className="border border-black/10 bg-white overflow-hidden">
      <div className="bg-black text-[#E4E3E0] p-3 flex items-center gap-2">
        <ShieldCheck size={16} />
        <h2 className="text-[10px] uppercase tracking-[0.2em] font-mono font-bold">Sổ cái bình chọn bất biến</h2>
      </div>
      
      <div className="divide-y divide-black/5 max-h-[400px] overflow-y-auto">
        {votes.length === 0 ? (
          <div className="p-8 text-center text-black/30 font-mono text-[10px] uppercase tracking-widest">
            Chưa có giao dịch nào được ghi lại
          </div>
        ) : (
          votes.map((vote, index) => (
            <div key={vote.id} className="p-4 hover:bg-black/5 transition-colors group">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center text-[8px] font-mono">
                    {votes.length - index}
                  </div>
                  <span className="text-[11px] font-bold font-serif italic">{vote.userName}</span>
                </div>
                <div className="flex items-center gap-1 text-[9px] font-mono text-black/40">
                  <Clock size={10} />
                  {new Date(vote.timestamp?.seconds * 1000).toLocaleString()}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Hash size={10} className="text-black/30" />
                  <span className="text-[8px] font-mono text-black/40 truncate w-full">
                    HASH: <span className="text-black/80">{vote.hash}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={10} className="text-black/30" />
                  <span className="text-[8px] font-mono text-black/40 truncate w-full">
                    PREV: <span className="text-black/80">{vote.previousHash}</span>
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="bg-[#f9f9f9] p-2 border-t border-black/10">
        <p className="text-[8px] font-mono text-black/40 text-center uppercase tracking-widest">
          Được bảo mật bởi thuật toán băm SHA-256
        </p>
      </div>
    </div>
  );
}
