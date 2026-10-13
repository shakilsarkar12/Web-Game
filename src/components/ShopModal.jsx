// ShopModal.jsx - Dhaka Street Supply Shop / Tong Dokan Armory
import React from 'react';
import { ShoppingCart, Heart, Shield, Bomb, Zap, Crosshair, X, Flame } from 'lucide-react';
import { soundEngine } from '../audio/SoundEngine.js';

export const ShopModal = ({ isOpen, onClose, takaCoins, onBuyItem }) => {
  if (!isOpen) return null;

  const shopItems = [
    {
      id: 'medkit',
      name: 'ফার্স্ট এইড ইনজেকশন (Medkit)',
      desc: '+৫০ স্বাস্থ্য (HP) পুনরুদ্ধার করুন',
      price: 80,
      icon: Heart,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/30'
    },
    {
      id: 'kevlar',
      name: 'কেভলার বুলেটপ্রুফ ভেস্ট (Armor)',
      desc: '+৫০ বর্ম (Armor) বডি প্রটেকশন',
      price: 120,
      icon: Shield,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
    },
    {
      id: 'ammo_resupply',
      name: 'ফুল মিলিটারি অ্যামো রিফিল (Ammo Refill)',
      desc: 'সব অস্ত্রের গোলাবারুদ ও ২টি গ্রেনেড রিফিল',
      price: 100,
      icon: Zap,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    },
    {
      id: 'shotgun_boost',
      name: 'স্বাধীনতা-১২ শটগান টিউনিং',
      desc: 'প্যালেট স্প্রেড ও ড্যামেজ বৃদ্ধি (+২৫% ক্ষতি)',
      price: 220,
      icon: Crosshair,
      color: 'text-orange-400 bg-orange-500/10 border-orange-500/30'
    },
    {
      id: 'smg_drum',
      name: 'বেঙ্গল ভাইপার ড্রাম ম্যাগাজিন',
      desc: 'ম্যাগাজিন সাইজ বাড়িয়ে ৬০ রাউন্ড করুন',
      price: 260,
      icon: Bomb,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30'
    },
    {
      id: 'airstrike',
      name: 'জরুরি এয়ারস্ট্রাইক সাপোর্ট (Tactical Nuke)',
      desc: 'মাঠের সমস্ত জম্বি ও দানব এক নিমেষে ধ্বংস করুন!',
      price: 450,
      icon: Flame,
      color: 'text-red-500 bg-red-500/20 border-red-500/40'
    }
  ];

  const handleBuy = (item) => {
    if (takaCoins >= item.price) {
      soundEngine.playCoinPickup();
      onBuyItem(item);
    } else {
      soundEngine.playEmptyClick();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="bg-slate-800/80 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-wide">মায়া টং দোকান ও সাপ্লাই আর্মোরি</h2>
              <p className="text-xs text-slate-400 font-medium">Dhaka Street Resistance Outpost • [B] চাপলে বন্ধ হবে</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="bg-emerald-950/60 border border-emerald-500/40 px-4 py-1.5 rounded-xl text-emerald-400 font-bold font-mono text-lg">
              ৳{takaCoins}
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Shop Item Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
          {shopItems.map(item => {
            const Icon = item.icon;
            const canAfford = takaCoins >= item.price;

            return (
              <div
                key={item.id}
                className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col justify-between transition-all group"
              >
                <div className="flex items-start space-x-3 mb-3">
                  <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${item.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm group-hover:text-amber-400 transition">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-700/60">
                  <div className="font-mono font-black text-amber-400 text-sm">
                    ৳{item.price}
                  </div>
                  <button
                    disabled={!canAfford}
                    onClick={() => handleBuy(item)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md ${
                      canAfford
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer active:scale-95'
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {canAfford ? 'কিনুন (Buy)' : 'টাকা কম'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>টিপস: জম্বি মারলে ও হেডশট করলে বেশি টাকা পাওয়া যায়!</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition"
          >
            খেলায় ফিরুন (Resume)
          </button>
        </div>
      </div>
    </div>
  );
};
