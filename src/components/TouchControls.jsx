// TouchControls.jsx - Mobile & tablet virtual joysticks and touch combat buttons
import React, { useState } from 'react';
import { Crosshair, Bomb, RotateCcw, ArrowUp } from 'lucide-react';

export const TouchControls = ({ onAction }) => {
  const [isTouchDevice] = useState(() => {
    return typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  });

  if (!isTouchDevice || !onAction) return null;

  const handleMove = (dir, active) => {
    onAction('move', { dir, active });
  };

  const handleShoot = (active) => {
    onAction('shoot', { active });
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-30 flex justify-between items-end p-6">
      {/* Left D-PAD for movement */}
      <div className="pointer-events-auto flex flex-col items-center space-y-1">
        <button
          onTouchStart={() => handleMove('forward', true)}
          onTouchEnd={() => handleMove('forward', false)}
          className="w-14 h-14 bg-slate-800/80 active:bg-amber-500/80 border border-slate-600 rounded-2xl flex items-center justify-center text-white"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
        <div className="flex space-x-2">
          <button
            onTouchStart={() => handleMove('left', true)}
            onTouchEnd={() => handleMove('left', false)}
            className="w-14 h-14 bg-slate-800/80 active:bg-amber-500/80 border border-slate-600 rounded-2xl flex items-center justify-center text-white"
          >
            ←
          </button>
          <button
            onTouchStart={() => handleMove('backward', true)}
            onTouchEnd={() => handleMove('backward', false)}
            className="w-14 h-14 bg-slate-800/80 active:bg-amber-500/80 border border-slate-600 rounded-2xl flex items-center justify-center text-white"
          >
            ↓
          </button>
          <button
            onTouchStart={() => handleMove('right', true)}
            onTouchEnd={() => handleMove('right', false)}
            className="w-14 h-14 bg-slate-800/80 active:bg-amber-500/80 border border-slate-600 rounded-2xl flex items-center justify-center text-white"
          >
            →
          </button>
        </div>
      </div>

      {/* Right Action Buttons */}
      <div className="pointer-events-auto flex items-end space-x-3">
        {/* Secondary buttons */}
        <div className="flex flex-col space-y-2">
          <button
            onTouchStart={() => onAction('reload')}
            className="w-12 h-12 bg-slate-800/80 active:bg-amber-500/80 border border-slate-600 rounded-full flex items-center justify-center text-white"
          >
            <RotateCcw className="w-5 h-5 text-amber-400" />
          </button>
          <button
            onTouchStart={() => onAction('grenade')}
            className="w-12 h-12 bg-slate-800/80 active:bg-amber-500/80 border border-slate-600 rounded-full flex items-center justify-center text-white"
          >
            <Bomb className="w-5 h-5 text-rose-400" />
          </button>
          <button
            onTouchStart={() => onAction('jump', { active: true })}
            onTouchEnd={() => onAction('jump', { active: false })}
            className="w-12 h-12 bg-slate-800/80 active:bg-amber-500/80 border border-slate-600 rounded-full flex items-center justify-center text-white font-bold"
          >
            JUMP
          </button>
        </div>

        {/* Big Fire Button */}
        <button
          onTouchStart={() => handleShoot(true)}
          onTouchEnd={() => handleShoot(false)}
          className="w-20 h-20 bg-rose-600/90 active:bg-rose-500 border-2 border-rose-400 rounded-full flex items-center justify-center text-white shadow-2xl active:scale-95"
        >
          <Crosshair className="w-9 h-9" />
        </button>
      </div>
    </div>
  );
};
