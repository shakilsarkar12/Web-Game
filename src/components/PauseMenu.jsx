// PauseMenu.jsx - In-game pause menu & options
import React from 'react';
import { Play, RotateCcw, CloudRain, Monitor } from 'lucide-react';

export const PauseMenu = ({
  isOpen,
  onResume,
  onRestart,
  isRainEnabled,
  onToggleRain,
  graphicsQuality = 'high',
  onSetGraphicsQuality
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center animate-scale-in">
        <h2 className="text-2xl font-black text-white tracking-wide mb-1">খেলা সাময়িক বিরতি</h2>
        <p className="text-xs text-slate-400 mb-5">GAME PAUSED • BATTLE FOR DHAKA</p>

        <div className="space-y-3">
          <button
            onClick={onResume}
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>খেলায় ফিরুন (Resume)</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm rounded-xl border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-4 h-4 text-rose-400" />
            <span>নতুন ম্যাচ শুরু (Restart)</span>
          </button>

          <button
            onClick={() => onToggleRain(!isRainEnabled)}
            className="w-full py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700/60 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <CloudRain className="w-4 h-4 text-cyan-400" />
            <span>বর্ষার বৃষ্টি: {isRainEnabled ? 'অন (ON)' : 'অফ (OFF)'}</span>
          </button>

          {/* Graphics Quality Preset Selector */}
          <div className="pt-2 text-left">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-amber-400" />
              <span>গ্রাফিক্স কোয়ালিটি (GRAPHICS)</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {['low', 'medium', 'high'].map(preset => (
                <button
                  key={preset}
                  onClick={() => onSetGraphicsQuality && onSetGraphicsQuality(preset)}
                  className={`py-1.5 rounded-lg text-xs font-bold uppercase transition cursor-pointer border ${
                    graphicsQuality === preset
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                      : 'bg-slate-800/70 border-slate-700/70 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {preset === 'low' ? 'Low' : preset === 'medium' ? 'Med' : 'High'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 pt-3.5 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
          <div>টিপস: [V] ক্যামেরা চেঞ্জ, [B] শপ, [G] গ্রেনেড, [F] কিক</div>
        </div>
      </div>
    </div>
  );
};

