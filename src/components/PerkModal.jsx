// PerkModal.jsx - Roguelite wave-upgrade card selection
import React from 'react';
import { Zap, Heart, Sparkles, Flame, Crosshair } from 'lucide-react';
import { soundEngine } from '../audio/SoundEngine.js';

const ALL_PERKS = [
  {
    id: 'speed_boost',
    name: 'স্পিড কোলা (Speed Cola)',
    sub: 'Tactical Agility',
    desc: 'দৌড়ানোর গতি ২৫% বৃদ্ধি পায়',
    icon: Zap,
    color: 'from-amber-500/20 to-orange-500/20 border-amber-500/50 text-amber-400'
  },
  {
    id: 'juggernaut',
    name: 'লৌহমানব (Juggernaut)',
    sub: 'Maximum Armor & Vitality',
    desc: '+৩৫ সর্বোচ্চ স্বাস্থ্য এবং তাৎক্ষণিক ফুল হেলথ',
    icon: Heart,
    color: 'from-rose-500/20 to-pink-500/20 border-rose-500/50 text-rose-400'
  },
  {
    id: 'rapid_fire',
    name: 'ডাবল ট্যাপ (Double Tap)',
    sub: 'Overclocked Trigger',
    desc: 'সব অস্ত্রের ফায়ার রেট ৩০% বৃদ্ধি পাবে',
    icon: Crosshair,
    color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/50 text-cyan-400'
  },
  {
    id: 'vampire',
    name: 'ভ্যাম্পায়ার রাউন্ডস (Lifesteal)',
    sub: 'Blood Siphon',
    desc: 'প্রতিটি শত্রু কিল করার পর ৪ এইচপি (HP) হিল হবে',
    icon: Sparkles,
    color: 'from-purple-500/20 to-fuchsia-500/20 border-purple-500/50 text-purple-400'
  },
  {
    id: 'electric',
    name: 'ইলেকট্রিক শকওয়েভ (Chain Lightning)',
    sub: 'Telsa Bullets',
    desc: 'বুলেট লাগলে পার্শ্ববর্তী শত্রুদের গায়ে বিদ্যুৎ চমকাবে',
    icon: Zap,
    color: 'from-sky-500/20 to-indigo-500/20 border-sky-500/50 text-sky-400'
  },
  {
    id: 'grenadier',
    name: 'মাস্টার গ্রেনেডিয়ার (Grenadier)',
    sub: 'Demolition Expert',
    desc: '+২টি অতিরিক্ত গ্রেনেড এবং ৫০% বেশি বিস্ফোরণ ব্যাসার্ধ',
    icon: Flame,
    color: 'from-red-500/20 to-amber-500/20 border-red-500/50 text-red-400'
  }
];

export const PerkModal = ({ isOpen, wave, onSelectPerk }) => {
  // Unconditionally call useMemo at the top of the hook hierarchy
  const perks = React.useMemo(() => {
    // Deterministic rotation based on wave to keep render pure and predictable
    const offset = (wave * 2) % ALL_PERKS.length;
    return [
      ALL_PERKS[offset % ALL_PERKS.length],
      ALL_PERKS[(offset + 1) % ALL_PERKS.length],
      ALL_PERKS[(offset + 3) % ALL_PERKS.length]
    ];
  }, [wave]);

  if (!isOpen) return null;

  const handleSelect = (perk) => {
    soundEngine.playPerkSelect();
    onSelectPerk(perk);
  };


  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-700/90 rounded-3xl p-6 sm:p-8 shadow-2xl text-center animate-scale-in">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/50 rounded-full text-amber-300 text-xs font-bold uppercase mb-2">
          <Sparkles className="w-3.5 h-3.5" /> WAVE {wave} বিজয়ী!
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">একটি ট্যাকটিক্যাল পারক বেছে নিন</h2>
        <p className="text-xs text-slate-400 mt-1 mb-6">ROGUE SURVIVAL LEVEL UP • পরবর্তী ওয়েভের জন্য আপনার শক্তি বাড়ান</p>

        {/* 3 Perk Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {perks.map(perk => {
            const Icon = perk.icon;
            return (
              <button
                key={perk.id}
                onClick={() => handleSelect(perk)}
                className={`bg-gradient-to-b ${perk.color} bg-slate-800/60 hover:bg-slate-800 border rounded-2xl p-5 text-left transition-all duration-200 transform hover:scale-105 active:scale-95 flex flex-col justify-between cursor-pointer group shadow-lg`}
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-slate-900/80 border border-slate-700 flex items-center justify-center mb-3 group-hover:rotate-6 transition">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">{perk.sub}</div>
                  <h3 className="text-base font-bold text-white mt-0.5 leading-snug">{perk.name}</h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed font-normal">{perk.desc}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-700/60 text-xs font-bold text-amber-400 flex items-center justify-between">
                  <span>সিলেক্ট করুন</span>
                  <span>➔</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="text-[11px] text-slate-500">
          পারক নির্বাচন করলেই পরবর্তী ওয়েভ স্বয়ংক্রিয়ভাবে শুরু হবে!
        </div>
      </div>
    </div>
  );
};
