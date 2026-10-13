// GameOverModal.jsx - Match summary, statistics, high-scores, and retry loop
import React, { useEffect, useState } from 'react';
import { Trophy, Skull, Crosshair, RotateCcw, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

export const GameOverModal = ({ data, onRestart }) => {
  const score = data ? data.score || 0 : 0;
  const kills = data ? data.kills || 0 : 0;
  const headshots = data ? data.headshots || 0 : 0;
  const wave = data ? data.wave || 1 : 1;

  const [isHighScore] = useState(() => {
    if (typeof window === 'undefined') return false;
    const savedBest = parseInt(localStorage.getItem('dhaka_game_best_score') || '0', 10);
    return (data ? data.score || 0 : 0) > savedBest && (data ? data.score || 0 : 0) > 0;
  });

  useEffect(() => {
    if (isHighScore) {
      localStorage.setItem('dhaka_game_best_score', score.toString());
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [isHighScore, score]);

  if (!data) return null;


  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-lg flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center animate-scale-in">
        {/* Banner */}
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-500 flex items-center justify-center mx-auto mb-4">
          <Skull className="w-8 h-8" />
        </div>

        <h2 className="text-3xl font-black text-white tracking-tight">আপনি বীরের মতো লড়েছেন!</h2>
        <p className="text-xs text-rose-400 font-semibold tracking-wider uppercase mt-1">
          DHAKA FALLEN • MISSION REPORT
        </p>

        {isHighScore && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/50 rounded-full text-amber-300 text-xs font-bold animate-pulse">
            <Trophy className="w-3.5 h-3.5" />
            <span>নতুন রেকর্ড! NEW HIGH SCORE</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 my-6 text-left">
          <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Award className="w-3 h-3 text-amber-400" /> ফাইনাল স্কোর
            </div>
            <div className="text-2xl font-black text-amber-400 font-mono mt-0.5">{score.toLocaleString()}</div>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Trophy className="w-3 h-3 text-cyan-400" /> সারভাইভড ওয়েভ
            </div>
            <div className="text-2xl font-black text-cyan-400 font-mono mt-0.5">WAVE {wave}</div>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Skull className="w-3 h-3 text-rose-400" /> মোট কিল (KILLS)
            </div>
            <div className="text-2xl font-black text-rose-400 font-mono mt-0.5">{kills}</div>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Crosshair className="w-3 h-3 text-purple-400" /> হেডশট (HEADSHOTS)
            </div>
            <div className="text-2xl font-black text-purple-400 font-mono mt-0.5">{headshots}</div>
          </div>
        </div>

        {/* Play Again Button */}
        <button
          onClick={onRestart}
          className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-base rounded-2xl transition shadow-[0_0_25px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <RotateCcw className="w-5 h-5 text-slate-950" />
          <span>পুনরায় লড়াই করুন (PLAY AGAIN)</span>
        </button>
      </div>
    </div>
  );
};
