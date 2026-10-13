// HUD.jsx - Futuristic Cyberpunk Dhaka In-Game HUD & Radar Minimap
import React from 'react';
import { Shield, Heart, Zap, Crosshair, Bomb, Radio, Coins, Eye, Bell } from 'lucide-react';

export const HUD = ({ stats, hitmarkers, notifications, waveBanner, comboBanner, onOpenShop }) => {
  if (!stats) return null;

  const {
    health = 100,
    maxHealth = 100,
    armor = 50,
    stamina = 100,
    currentWeapon,
    ammo = 30,
    reserveAmmo = 120,
    grenades = 4,
    isReloading = false,
    isADS = false,
    isDrivingCNG = false,
    cngSpeed = 0,
    canDriveCNG = false,
    floatingTexts = [],
    activeBoss = null,
    score = 0,
    takaCoins = 150,
    wave = 1,
    perspective = 'FPS',
    enemiesAlive = 0,
    enemiesRemaining = 0,
    playerPos = { x: 0, z: 0, rotY: 0 },
    enemies = []
  } = stats;

  const healthPct = Math.max(0, Math.min(100, (health / maxHealth) * 100));
  const armorPct = Math.max(0, Math.min(100, armor));
  const staminaPct = Math.max(0, Math.min(100, stamina));
  const isSniperScopeActive = isADS && currentWeapon && currentWeapon.id === 'sniper';

  // Minimap radar calculations
  const radarRadius = 60;
  const mapScale = 1.1; // meters to radar pixels

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-4 font-sans text-white">
      {/* Low Health Heartbeat Pulsating Red Vignette */}
      {health <= 30 && (
        <div className="absolute inset-0 pointer-events-none animate-pulse border-4 border-rose-600/60 shadow-[inset_0_0_100px_rgba(225,29,72,0.65)] z-10" />
      )}

      {/* Floating Combat RPG Damage Numbers */}
      {floatingTexts && floatingTexts.map(ft => (
        <div
          key={ft.id}
          className={`absolute font-black pointer-events-none transform -translate-x-1/2 -translate-y-1/2 z-20 ${
            ft.isCrit ? 'text-2xl font-mono' : 'text-base font-mono'
          }`}
          style={{
            left: `${ft.x}px`,
            top: `${ft.y}px`,
            color: ft.color,
            opacity: ft.opacity,
            textShadow: '0 2px 8px rgba(0,0,0,0.9)'
          }}
        >
          {ft.text}
        </div>
      ))}

      {/* CNG Drive Interaction Prompt */}
      {canDriveCNG && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-emerald-950/95 border-2 border-emerald-400 px-6 py-2.5 rounded-2xl shadow-[0_0_35px_rgba(16,185,129,0.7)] flex items-center gap-3 animate-bounce z-20 pointer-events-none">
          <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-emerald-300 font-black text-sm tracking-wider">
            [E] সিএনজি ড্রাইভ করুন (DRIVE GREEN CNG)
          </span>
        </div>
      )}

      {/* CNG Driving Vehicle HUD Dashboard */}
      {isDrivingCNG && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-slate-900/95 border-2 border-emerald-500 rounded-2xl px-6 py-2.5 shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center gap-6 z-20 pointer-events-none animate-scale-in">
          <div className="text-center">
            <div className="text-[10px] text-emerald-400 uppercase font-bold tracking-widest">সিএনজি ট্যাক্সি</div>
            <div className="text-2xl font-black font-mono text-emerald-300">{cngSpeed} <span className="text-xs text-slate-400">KM/H</span></div>
          </div>
          <div className="h-8 w-px bg-slate-700"></div>
          <div className="text-xs text-slate-300 font-semibold space-y-0.5">
            <div>[WASD] ড্রাইভ ও স্পিড</div>
            <div>[H] ঢাকাইয়া হর্ন • [E] প্রস্থান</div>
          </div>
        </div>
      )}

      {/* Multikill Combo Banner */}
      {comboBanner && comboBanner.show && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 py-3 px-8 rounded-2xl bg-gradient-to-r from-amber-600 via-rose-600 to-amber-600 text-white font-black text-xl tracking-wider border border-amber-300 shadow-[0_0_40px_rgba(245,158,11,0.8)] animate-scale-in z-30">
          {comboBanner.title}
        </div>
      )}

      {/* Sniper Scope Overlay */}
      {isSniperScopeActive && (
        <div className="absolute inset-0 z-20 pointer-events-none bg-slate-950/85 flex items-center justify-center">
          <div className="relative w-[460px] h-[460px] rounded-full border-4 border-cyan-400/80 shadow-[0_0_120px_rgba(0,0,0,0.95)] overflow-hidden flex items-center justify-center bg-transparent">
            {/* Crosshair lines */}
            <div className="absolute w-full h-0.5 bg-cyan-400/80"></div>
            <div className="absolute h-full w-0.5 bg-cyan-400/80"></div>
            {/* Center circle */}
            <div className="w-8 h-8 rounded-full border border-cyan-400/60 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]"></div>
            </div>
            {/* Scope details */}
            <span className="absolute bottom-6 font-mono text-[10px] tracking-widest text-cyan-400">PADMA-50 • TACTICAL SNIPER ZOOM</span>
          </div>
        </div>
      )}

      {/* Boss Health Bar on Top Center */}
      {activeBoss && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 w-80 sm:w-96 bg-slate-900/90 border border-rose-500/80 rounded-2xl p-3 shadow-[0_0_25px_rgba(244,63,94,0.5)] z-20">
          <div className="flex justify-between text-xs font-black text-rose-400 tracking-wider mb-1">
            <span className="flex items-center gap-1.5 uppercase">
              <Radio className="w-4 h-4 text-rose-500 animate-ping" /> {activeBoss.name}
            </span>
            <span className="font-mono text-white">{Math.round((activeBoss.hp / activeBoss.maxHp) * 100)}%</span>
          </div>
          <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-rose-500/40">
            <div
              className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 rounded-full transition-all duration-150"
              style={{ width: `${Math.max(0, (activeBoss.hp / activeBoss.maxHp) * 100)}%` }}
            />
          </div>
        </div>
      )}
      {/* 1. TOP HEADER: Score, Taka, Wave & Objectives */}
      <div className="flex justify-between items-start">
        {/* Top Left: Score & Currency */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-xl p-3 shadow-2xl flex items-center space-x-5 pointer-events-auto">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">SCORE</div>
            <div className="text-2xl font-black text-amber-400 font-mono tracking-tight">{score.toLocaleString()}</div>
          </div>
          <div className="h-8 w-px bg-slate-700"></div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
              <Coins className="w-3 h-3 text-emerald-400" />
              <span>TAKA (টাকা)</span>
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight">৳{takaCoins}</div>
          </div>
          <button
            onClick={onOpenShop}
            className="ml-2 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95"
          >
            <span>সাপ্লাই শপ [B]</span>
          </button>
        </div>

        {/* Top Center: Wave Status */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-xl px-6 py-2.5 shadow-2xl text-center">
          <div className="text-xs uppercase tracking-widest text-slate-400 font-bold">
            WAVE {wave} • ঢাকা সারভাইভাল
          </div>
          <div className="text-sm font-semibold text-rose-400 flex items-center justify-center gap-2 mt-0.5">
            <Radio className="w-4 h-4 animate-pulse text-rose-500" />
            <span>{enemiesAlive + enemiesRemaining} জন শত্রু অবশিষ্ট</span>
          </div>
        </div>

        {/* Top Right: Minimap Radar */}
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-2xl p-2 shadow-2xl flex flex-col items-center">
          <div className="radar-display relative rounded-full bg-slate-950/90 border-2 border-emerald-500/40 overflow-hidden flex items-center justify-center shadow-inner">
            {/* Radar sweep lines */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(16,185,129,0.15)_46%,transparent_47%)]"></div>
            <div className="absolute inset-0 border-t border-slate-800/80"></div>
            <div className="absolute inset-0 border-l border-slate-800/80"></div>

            {/* Compass Marks */}
            <span className="absolute top-1 text-[9px] font-bold text-slate-400">N</span>
            <span className="absolute bottom-1 text-[9px] font-bold text-slate-400">S</span>
            <span className="absolute right-1.5 text-[9px] font-bold text-slate-400">E</span>
            <span className="absolute left-1.5 text-[9px] font-bold text-slate-400">W</span>

            {/* Enemies on Radar */}
            {enemies.map((e, idx) => {
              const dx = (e.x - playerPos.x) * mapScale;
              const dz = (e.z - playerPos.z) * mapScale;
              const dist = Math.sqrt(dx * dx + dz * dz);

              if (dist > radarRadius - 4) return null; // out of radar bounds

              return (
                <div
                  key={idx}
                  className="absolute w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.9)] animate-pulse"
                  style={{
                    transform: `translate(${dx}px, ${dz}px)`
                  }}
                />
              );
            })}

            {/* Player Center Arrow */}
            <div
              className="w-3 h-3 border-l-2 border-r-2 border-b-[6px] border-l-transparent border-r-transparent border-b-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] z-10"
              style={{
                transform: `rotate(${-playerPos.rotY}rad)`
              }}
            />
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-1">
            <Eye className="w-3 h-3 text-cyan-400" />
            <span>ভিউ: {perspective} [V]</span>
          </div>
        </div>
      </div>

      {/* 2. CENTER: Dynamic Crosshair, Hitmarkers, Wave Banner */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        {/* Dynamic Crosshair */}
        <div className="relative w-8 h-8 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.9)]"></div>
          <div className="absolute w-4 h-0.5 bg-cyan-400/80 -left-3"></div>
          <div className="absolute w-4 h-0.5 bg-cyan-400/80 -right-3"></div>
          <div className="absolute h-4 w-0.5 bg-cyan-400/80 -top-3"></div>
          <div className="absolute h-4 w-0.5 bg-cyan-400/80 -bottom-3"></div>
        </div>

        {/* Hitmarkers & Damage numbers */}
        {hitmarkers && hitmarkers.map(hm => (
          <div
            key={hm.id}
            className={`absolute font-black text-lg animate-ping duration-300 pointer-events-none ${
              hm.isHeadshot ? 'text-amber-400 text-2xl shadow-red-500' : 'text-rose-400'
            }`}
            style={{
              transform: `translate(${(Math.random() - 0.5) * 40}px, ${-30 - Math.random() * 20}px)`
            }}
          >
            {hm.isHeadshot ? `HEADSHOT! -${hm.damage}` : `-${hm.damage}`}
          </div>
        ))}

        {/* Wave Banner */}
        {waveBanner && waveBanner.show && (
          <div className="absolute -translate-y-24 bg-gradient-to-r from-transparent via-rose-950/90 to-transparent py-4 px-16 text-center border-y border-rose-500/50 shadow-[0_0_50px_rgba(244,63,94,0.4)] animate-bounce">
            <div className="text-3xl font-black tracking-widest text-white drop-shadow-md">
              WAVE {waveBanner.wave}
            </div>
            <div className="text-sm font-semibold text-rose-300 mt-1">
              {waveBanner.message}
            </div>
          </div>
        )}
      </div>

      {/* Notifications Toast */}
      <div className="absolute left-6 bottom-28 space-y-1.5 pointer-events-none">
        {notifications && notifications.slice(-3).map(n => (
          <div key={n.id} className="bg-slate-900/90 border-l-4 border-amber-400 px-3 py-1.5 rounded-r-lg text-xs font-medium text-slate-200 shadow-md animate-fade-in">
            {n.text}
          </div>
        ))}
      </div>

      {/* 3. BOTTOM BAR: Health, Armor, Weapon & Ammo */}
      <div className="flex justify-between items-end">
        {/* Bottom Left: Vitals (HP, Armor, Stamina) */}
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 shadow-2xl w-80 space-y-2.5">
          {/* Health Bar */}
          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="flex items-center gap-1.5 text-rose-400">
                <Heart className="w-3.5 h-3.5 fill-rose-500" /> স্বাস্থ্য (HP)
              </span>
              <span className="font-mono text-rose-300">{health} / {maxHealth}</span>
            </div>
            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full transition-all duration-200 shadow-[0_0_10px_rgba(244,63,94,0.6)]"
                style={{ width: `${healthPct}%` }}
              />
            </div>
          </div>

          {/* Armor Bar */}
          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Shield className="w-3.5 h-3.5 fill-cyan-500" /> বর্ম (ARMOR)
              </span>
              <span className="font-mono text-cyan-300">{armor} / 100</span>
            </div>
            <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-200 shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                style={{ width: `${armorPct}%` }}
              />
            </div>
          </div>

          {/* Stamina Bar */}
          <div>
            <div className="flex justify-between text-[11px] font-semibold mb-0.5">
              <span className="flex items-center gap-1 text-amber-400">
                <Zap className="w-3 h-3 fill-amber-500" /> স্ট্যামিনা (SPRINT)
              </span>
              <span className="font-mono text-amber-300">{stamina}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all duration-150"
                style={{ width: `${staminaPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Bottom Right: Current Weapon & Ammo */}
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 shadow-2xl flex items-center space-x-6">
          {/* Grenade indicator */}
          <div className="text-center border-r border-slate-700 pr-5">
            <div className="flex items-center justify-center gap-1 text-amber-400">
              <Bomb className="w-5 h-5" />
              <span className="font-mono text-xl font-bold">{grenades}</span>
            </div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold mt-0.5">[G] গ্রেনেড</div>
          </div>

          {/* Main Gun & Ammo count */}
          <div>
            <div className="flex items-baseline space-x-2">
              <div className="text-4xl font-black font-mono tracking-tighter text-white">
                {isDrivingCNG ? (
                  <span className="text-emerald-400 text-2xl font-bold">সিএনজি মোড</span>
                ) : isReloading ? (
                  <span className="text-amber-400 text-2xl font-bold animate-pulse">RELOADING...</span>
                ) : (
                  <>
                    <span className={ammo <= (currentWeapon && currentWeapon.id === 'rocket' ? 0 : 5) ? 'text-rose-500 animate-pulse' : 'text-emerald-400'}>{ammo}</span>
                    <span className="text-slate-500 text-xl font-medium"> / {reserveAmmo}</span>
                  </>
                )}
              </div>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-slate-200">
                  {isDrivingCNG ? 'গ্রিন সিএনজি ট্যাক্সি' : (currentWeapon ? currentWeapon.name : 'Weapon')}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  {isDrivingCNG ? '[WASD] ড্রাইভ • [H] হর্ন • [E] প্রস্থান' : `${currentWeapon ? currentWeapon.subname : ''} • [1-5] অস্ত্র • [F] কিক`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
