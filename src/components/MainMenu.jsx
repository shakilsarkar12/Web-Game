// MainMenu.jsx - High-impact title screen and setup lobby
import React, { useState } from 'react';
import { Play, CloudRain, Volume2, VolumeX, BookOpen, Sparkles, Monitor } from 'lucide-react';
import { soundEngine } from '../audio/SoundEngine.js';

export const MainMenu = ({
  onStartGame,
  onToggleWeather,
  isRainEnabled,
  graphicsQuality = 'high',
  onSetGraphicsQuality
}) => {
  const [selectedMap, setSelectedMap] = useState('dhaka');
  const [difficulty, setDifficulty] = useState('medium');
  const [perspective, setPerspective] = useState('FPS');
  const [showControlsModal, setShowControlsModal] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const handleStart = () => {
    soundEngine.ensureContext();
    onStartGame({ selectedMap, difficulty, perspective });
  };


  const handleToggleSound = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-gradient-to-t from-slate-950 via-slate-900/90 to-slate-950 select-none">
      {/* Background Graphic Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(217,119,6,0.12)_0%,transparent_70%)] pointer-events-none"></div>

      {/* Main Card */}
      <div className="relative w-full max-w-lg bg-slate-900/95 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(0,0,0,0.8)] backdrop-blur-xl">
        {/* Top Header Buttons */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => setShowControlsModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-full text-xs font-semibold border border-slate-600/50 transition cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>কীভাবে খেলবেন (Controls)</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onToggleWeather(!isRainEnabled)}
              className={`p-2 rounded-full border transition cursor-pointer ${
                isRainEnabled
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title="বর্ষার বৃষ্টি চালু/বন্ধ করুন"
            >
              <CloudRain className="w-4 h-4" />
            </button>
            <button
              onClick={handleToggleSound}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full border border-slate-700 text-slate-300 transition cursor-pointer"
              title="সাউন্ড"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>
        </div>

        {/* Title & Lore */}
        <div className="mb-6">
          <div className="text-[11px] font-black uppercase tracking-widest text-amber-500 mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" /> A 3D CITY SURVIVAL SHOOTER
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none drop-shadow-md">
            BATTLE FOR <span className="text-amber-400">DHAKA</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2.5 leading-relaxed font-normal">
            ঢাকার রাজপথে নেমে এসেছে রক্তপিপাসু দানবদের ঝাঁক। রিকশা, টং দোকান আর ঐতিহাসিক ঢাকা কলেজের মোড়ে অস্ত্র হাতে টিকে থাকুন যত রাত পারেন!
          </p>
        </div>

        {/* Map Selection */}
        <div className="mb-5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
            ম্যাপ নির্বাচন (MAP)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedMap('dhaka')}
              className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                selectedMap === 'dhaka'
                  ? 'bg-amber-500/15 border-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <div className="font-bold text-sm">Dhaka City</div>
              <div className="text-[10px] text-amber-400/90 font-medium">ধানমন্ডি ও ঢাকা কলেজ</div>
            </button>

            <button
              onClick={() => setSelectedMap('village')}
              className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                selectedMap === 'village'
                  ? 'bg-amber-500/15 border-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <div className="font-bold text-sm">Hollowmere Village</div>
              <div className="text-[10px] text-slate-500 font-medium">গ্রাম্য বাংকার এলাকা</div>
            </button>
          </div>
        </div>

        {/* Difficulty & Camera Row */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Difficulty */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
              কঠিনতা (DIFFICULTY)
            </label>
            <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700">
              {['easy', 'medium', 'hard'].map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg uppercase transition cursor-pointer ${
                    difficulty === d
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Camera View */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 block flex items-center justify-between">
              <span>ক্যামেরা ভিউ</span>
              <span className="text-[9px] text-amber-400 font-mono">[V] toggle</span>
            </label>
            <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700">
              {[
                { id: 'FPS', label: 'FPS' },
                { id: 'TPS', label: 'TPS' },
                { id: 'TOPDOWN', label: 'Top' }
              ].map(c => (
                <button
                  key={c.id}
                  onClick={() => setPerspective(c.id)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                    perspective === c.id
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Graphics Quality Selector */}
        <div className="mb-5 text-left">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-amber-400" />
              <span>গ্রাফিক্স কোয়ালিটি (GRAPHICS QUALITY)</span>
            </span>
            <span className="text-[10px] text-amber-400/90 font-mono uppercase">{graphicsQuality}</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'low', label: 'Low', desc: 'Max FPS' },
              { id: 'medium', label: 'Medium', desc: 'Balanced' },
              { id: 'high', label: 'High', desc: 'Full Quality' }
            ].map(q => (
              <button
                key={q.id}
                onClick={() => onSetGraphicsQuality && onSetGraphicsQuality(q.id)}
                className={`py-2 px-1 rounded-xl border text-center transition cursor-pointer ${
                  graphicsQuality === q.id
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                    : 'bg-slate-800/40 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                <div className="text-xs font-bold">{q.label}</div>
                <div className="text-[9px] text-slate-400">{q.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Big Start Button */}
        <button
          onClick={handleStart}
          className="w-full py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-lg tracking-wide rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.5)] transition duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
        >

          <Play className="w-6 h-6 fill-slate-950" />
          <span>যুদ্ধ শুরু করুন (PLAY GAME)</span>
        </button>

        <div className="text-center mt-3 text-[11px] text-slate-500 font-medium">
          ব্রাউজারে কোনো ইনস্টলেশন ছাড়াই ফুল ৩ডি স্মুথ ৬০ এফপিএস গেমপ্লে
        </div>
      </div>

      {/* Controls Modal */}
      {showControlsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <span>কন্ট্রোলস গাইড (Controls Cheat Sheet)</span>
            </h2>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="font-semibold text-slate-400">মুভমেন্ট (হাঁটা/দৌড়ানো):</span>
                <span className="font-mono font-bold text-amber-400">W, A, S, D</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="font-semibold text-slate-400">দ্রুত দৌড় (Sprint):</span>
                <span className="font-mono font-bold text-amber-400">Shift</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="font-semibold text-slate-400">লাফ (Jump):</span>
                <span className="font-mono font-bold text-amber-400">Space</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="font-semibold text-slate-400">গুলি ছোড়া (Fire Weapon):</span>
                <span className="font-mono font-bold text-amber-400">মাউস লেফট ক্লিক</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="font-semibold text-slate-400">নিশানা তাক করা (ADS Scope):</span>
                <span className="font-mono font-bold text-amber-400">মাউস রাইট ক্লিক</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="font-semibold text-slate-400">অস্ত্র বদল (Switch Weapons):</span>
                <span className="font-mono font-bold text-amber-400">1, 2, 3, 4 কী</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="font-semibold text-slate-400">রিলোড (Reload):</span>
                <span className="font-mono font-bold text-amber-400">R</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="font-semibold text-slate-400">গ্রেনেড নিক্ষেপ (Grenade):</span>
                <span className="font-mono font-bold text-amber-400">G</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="font-semibold text-slate-400">মেটাল কিক / হাতাহাতি (Quick Melee):</span>
                <span className="font-mono font-bold text-amber-400">F</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="font-semibold text-slate-400">ক্যামেরা ভিউ সুইচ (Perspective):</span>
                <span className="font-mono font-bold text-amber-400">V (FPS/TPS/Top)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="font-semibold text-slate-400">সাপ্লাই শপ (Buy Items):</span>
                <span className="font-mono font-bold text-amber-400">B</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="font-semibold text-slate-400">রিকশার ঘণ্টা (Bell sound):</span>
                <span className="font-mono font-bold text-amber-400">H (Tring Tring)</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="font-semibold text-slate-400">পজ / সেটিংস (Pause):</span>
                <span className="font-mono font-bold text-amber-400">P বা Esc</span>
              </div>
            </div>

            <button
              onClick={() => setShowControlsModal(false)}
              className="mt-6 w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition cursor-pointer"
            >
              বুঝেছি, ফিরে যান (Close)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
