# 🇧🇩 Battle for Dhaka: 3D Survival Shooter (Web Game)

[![React](https://img.shields.io/badge/React-19.x-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r182-black?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Web Audio API](https://img.shields.io/badge/Audio-Procedural_Web_Audio-orange?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![License](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)

A high-octane, next-generation **3D Web Browser Survival Shooter** built from ground up using **Three.js**, **React 19**, and **Vite**. Set in a dystopian, zombie-infested **Dhaka City, Bangladesh**, players defend iconic urban landmarks against mutating waves of ghouls, crawlers, toxic spitters, titans, and monstrous bosses.

> 💡 **Architectural Philosophy:** 100% self-contained and instant-loading (<500ms). Zero heavy external asset downloads. All 3D materials, city signs, vehicle artwork, and audio effects are generated entirely procedurally using HTML5 Canvas textures and the Web Audio API synthesis engine.

---

## 📑 Table of Contents
1. [Game Overview & Lore](#-game-overview--lore)
2. [Key Gameplay Features](#-key-gameplay-features)
3. [Complete Codebase Architecture & File Map](#-complete-codebase-architecture--file-map)
4. [Technical Deep-Dive & Systems Design](#-technical-deep-dive--systems-design)
5. [Complete Controls & Input Guide](#-complete-controls--input-guide)
6. [Installation & Development Setup](#-installation--development-setup)
7. [Future Roadmap & AI Development Suggestions](#-future-roadmap--ai-development-suggestions)
8. [AI Agent Contributor Guidelines](#-ai-agent-contributor-guidelines)

---

## 🌆 Game Overview & Lore

The year is 2035. An unnatural chemical catastrophe strikes the heart of Dhaka, turning streets like Mirpur Road, New Market, and Nilkhet into ground zero for a supernatural viral scourge. As an elite operative of the Dhaka City Resistance:
- You hold the central roundabout monument near **Dhaka College** and **Bismillah Tailors**.
- You commandeer iconic Dhaka transport—including **Driveable Green CNG Auto-Rickshaws** and traditional hand-painted **Cycle Rickshaws**.
- You trade loot at **মায়া টং দোকান (Maya Tea Stall Outpost)** for military rations, Kevlar, and heavy weaponry.
- You endure intense **Dhaka monsoon thunderstorms**, dodge toxic vomit, and survive waves of grotesque mutants.

---

## 🎮 Key Gameplay Features

### 1. 🚗 Interactive Driveable Green CNG Auto-Rickshaw
- Walk up to the green CNG parked on the street to trigger the **`[E] DRIVE GREEN CNG`** prompt.
- Hop in and drive with full physics simulation (`WASD`).
- Procedural **2-stroke engine sound synthesis** that dynamically pitches up with acceleration.
- Working forward spotlights/headlights cutting through the Dhaka fog.
- Authentic dual-tone electric Dhaka horn on `H` (*"পিপ পিপ"*).
- **Roadkill Physics:** Colliding with zombies at high speed deals massive roadkill crush damage (up to 350+ DMG), flinging corpses with blood splatters.
- Press `E` anytime to exit safely back to on-foot combat.

### 2. 🔫 5-Tier Weapon Arsenal + Throwables
| Weapon | Type | Damage | Fire Rate | Mag Size | Special Feature |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Thresher Mk II** | Assault Rifle | 38 | 0.11s | 30 | Full-auto, reflex red-dot sight, balanced recoil |
| **Shadhinota-12** | Tactical Shotgun | 22 x 7 | 0.65s | 8 | 7-pellet devastating close-range cone spread |
| **Bengal Viper** | Submachine Gun | 24 | 0.075s | 42 (up to 60) | High-RPM bullet hose, ultra-fast reload |
| **Padma-50** | Heavy Sniper | 220 | 1.1s | 5 | Anti-material rounds, 2.2x headshot critical multiplier |
| **Meghna-RPG** | Rocket Launcher | 420 | 1.5s | 1 | Physical rocket projectile with smoke trail, 14m AOE devastation |
| **Combat Grenades** | Throwable | 250 | — | 4 (max 6) | Physics bouncing arc trajectory (`G`), 2.2s fuse timer |

### 3. 🎯 Padma-50 Tactical Sniper Scope
- Right-click ADS zoom switches to a circular high-powered scope overlay with crosshair mil-dots, cyan targeting lines, and sniper breath-hold sound effects.

### 4. 🥋 Quick Melee Combat Strike (`F`)
- Instant forward metal kick dealing 75 damage and applying radial knockback to create breathing room when overwhelmed.

### 5. 💥 Floating Combat RPG Damage Text
- High-performance 2D screen-projected damage markers:
  - 🟡 **Gold:** Critical headshots (`-120 CRIT!`)
  - ⚪ **White:** Standard ballistic hits (`-38`)
  - 🟠 **Orange:** Grenade & RPG detonations (`-420 💥`)
  - 🔵 **Cyan:** Melee kick attacks (`-75 🥋`)
  - 🔴 **Crimson:** Vehicle roadkill impacts (`-200 🚗`)

### 6. 🌩️ Dynamic Dhaka Monsoon Thunderstorm
- Randomly occurring blinding lightning flashes illuminate the skyline and colonial buildings, accompanied by procedural rolling bass thunderclaps.
- Toggleable monsoon rain with falling particle streaks and reflective asphalt puddles.

### 7. 🔥 Multikill Combo Streaks
- Rapid consecutive kills within 3.2 seconds trigger celebratory banners and audio fanfares:
  - 2 Kills: **🔥 ডাবল কিল! (DOUBLE KILL)**
  - 3 Kills: **⚡ ট্রিপল কিল! (TRIPLE KILL)**
  - 4 Kills: **💥 কোয়াড কিল! (QUAD KILL)**
  - 5+ Kills: **👑 ঢাকাইয়া ডমিনেটর! (DHAKA DOMINATOR)**

### 8. 👹 Gulshan Nightmare Boss with Enrage Phase
- Spawns in boss waves with an on-screen boss health bar.
- **Enrage Mode:** At <50% HP, the boss roars, turns fiery red, gains +35% movement speed.
- **Earthquake Stomp:** Periodically slams the asphalt, creating expanding red ground shockwaves that damage and stagger the player.

### 9. 🎲 Roguelite Level-Up Perks
After each wave, the player chooses 1 of 3 randomized perks:
- **Speed Cola:** +25% sprint & walk speed.
- **Juggernaut:** +35 max HP and immediate full heal.
- **Rapid Fire:** -30% weapon fire delay across all firearms.
- **Vampire Lifesteal:** +4 HP restored on every enemy elimination.
- **Electric Chain Lightning:** Bullets arc 30 electrical damage to nearby foes.
- **Master Grenadier:** +2 extra grenade capacity.

### 10. 🏪 Maya Tea Stall Armory Shop (`B`)
- Exchange earned ৳ Taka for First Aid medkits, Kevlar Armor, Ammo crates, Meghna-RPG rockets, shotgun tuning, SMG drum mags, and emergency Tactical Nuke airstrikes.

---

## 📁 Complete Codebase Architecture & File Map

```
c:\Shakil's Project\Research\
├── index.html                   # HTML entry point, viewport meta, root container
├── package.json                 # Dependencies (React 19, Three.js, Lucide-react, Vite)
├── vite.config.js               # Vite bundler configuration with React plugin
├── src/
│   ├── main.jsx                 # React root DOM hydration
│   ├── App.jsx                  # Master React controller wiring UI modals and GameEngine
│   ├── index.css                # Vanilla CSS design system, typography, animations
│   ├── audio/
│   │   └── SoundEngine.js       # 100% Procedural Web Audio API sound synthesizer
│   ├── game/
│   │   ├── GameEngine.js        # Core Three.js runtime orchestrating world, player, AI, combat
│   │   ├── World.js             # 3D Dhaka City generator, buildings, landmarks, CNG, lights
│   │   ├── Player.js            # Player controller, FPS/TPS/TopDown views, stamina, collision
│   │   ├── WeaponSystem.js      # 5 guns, RPG ballistics, sway, bobbing, recoil, grenades, melee
│   │   ├── EnemyManager.js      # Wave director, 5 enemy classes, procedural walk AI, Boss enrage
│   │   ├── ParticleSystem.js    # Tracers, blood, explosions, rain, kettle steam, rocket smoke
│   │   ├── DropManager.js       # Floating loot pickups (coins, medkits, ammo crates, nuke)
│   │   └── TextureGenerator.js  # Procedural HTML5 canvas textures (Bengali signs, rickshaw art)
│   └── components/
│       ├── HUD.jsx              # Cyberpunk HUD, radar minimap, sniper scope, CNG dash, damage text
│       ├── MainMenu.jsx         # Start screen with difficulty/camera options & weather toggle
│       ├── ShopModal.jsx        # In-game resistance armory modal (`B`)
│       ├── PerkModal.jsx        # Post-wave roguelite level-up 3-card perk selector
│       ├── PauseMenu.jsx        # Escape/P pause menu with settings
│       ├── GameOverModal.jsx    # Mission failed score summary and stats screen
│       └── TouchControls.jsx    # Dual virtual joysticks & buttons for mobile/tablet browsers
```

### Detailed File Responsibilities

| File | Primary Role & Internal Mechanics |
| :--- | :--- |
| **`GameEngine.js`** | Manages the Three.js `PerspectiveCamera`, `Scene`, `WebGLRenderer`, and animation loop (`animate`). Dispatches stats to React HUD every frame. Handles pointer lock, keyboard input, CNG driving state, floating text coordinate projection (`Vector3.project(camera)`), and environmental timers. |
| **`World.js`** | Generates the Dhaka crossroads: 8 commercial high-rises with illuminated windows, colonial Dhaka College facade, Bismillah Tailors neon billboard, Maya Tea Stall (`টং দোকান`) with steam kettle, cycle rickshaws with painted hoods/backplates, explosive red fuel barrels, overhead drooping electric wires, rain puddles, and the driveable Green CNG. |
| **`Player.js`** | Manages player position, velocity, and collision sliding. Supports 3 perspectives: `FPS` (camera at head), `TPS` (over-the-shoulder chase camera with procedural walking limbs), and `TOPDOWN` (tactical isometric birds-eye). Manages health, armor, stamina sprint, and jumping physics. |
| **`WeaponSystem.js`** | Builds procedural 3D low-poly gun models attached to the camera. Simulates weapon sway, bobbing, recoil kicks, reload progress, shell casing ejections, physical bouncing grenades, quick melee kick strike (`F`), and Meghna-RPG physical rocket ballistics with smoke trails. |
| **`EnemyManager.js`** | Controls wave progression and spawns 5 enemy types: `Street Ghoul` (standard), `Rabid Crawler` (fast runner), `Toxic Spitter` (ranged acid shooter), `Dhaka Titan` (heavy tank), and `Gulshan Nightmare Boss` (enrages at <50% HP, stomps ground shockwaves). Procedural sinusoidal walk cycles. |
| **`ParticleSystem.js`** | High-performance particle manager pooling bullet tracers, blood splatters, fireball sparks, acid splatters, brass casings, electric chain arcs, monsoon rain, kettle steam puffs, RPG rocket smoke trails, and ground shockwave rings. |
| **`SoundEngine.js`** | Zero-asset Web Audio API procedural synth. Generates realistic gunshots, rocket whoosh, reloads, footsteps, heartbeat, hitmarkers, explosions, CNG 2-stroke engine oscillator, dual CNG horn, rickshaw bells, thunderclaps, and killstreak fanfares. |
| **`DropManager.js`** | Spawns and animates 3D bobbing and rotating pickups from defeated enemies: Taka Coins, Health Medkits, Military Ammo Crates, and Tactical Nuke powerups. |
| **`TextureGenerator.js`** | Generates high-res canvas textures in memory: Bismillah Tailors signboard, Maya Cha signboard, Bangladesh National Flag, and traditional Dhaka Rickshaw floral art backplates. |
| **`HUD.jsx`** | Cyberpunk Dhaka HUD overlay: 360° radar minimap with enemy tracking, health/armor/stamina bars, floating RPG combat damage numbers, CNG dashboard (`KM/H` speedometer), tactical sniper scope, multikill combo banners, and weapon slot indicators. |

---

## 🔬 Technical Deep-Dive & Systems Design

### 1. Zero-Asset Architecture (Pure Procedural Generation)
Instead of loading megabytes of heavy `.gltf` or `.mp3` files that could fail, cause latency, or break CORS:
- **3D Meshes:** Built exclusively using Three.js procedural primitives (`BoxGeometry`, `CylinderGeometry`, `ConeGeometry`, `SphereGeometry`, `RingGeometry`).
- **Textures:** Rendered dynamically at runtime via HTML5 2D Canvas contexts in `TextureGenerator.js` and converted to `THREE.CanvasTexture`.
- **Sound:** Synthesized in real-time via `AudioContext` using oscillators (`sawtooth`, `triangle`, `sine`), noise buffers, and biquad lowpass/bandpass filters.

### 2. State Synchronization: Three.js Loop vs React VDOM
- The Three.js engine runs in a continuous `requestAnimationFrame` loop at 60 FPS in `GameEngine.js`.
- High-frequency mutations (camera movement, particle physics, enemy positions) occur directly in WebGL memory without touching React state.
- React HUD state (`stats`) is pushed via `uiCallbacks.setStats` once per frame, ensuring butter-smooth 60fps rendering without DOM thrashing.

### 3. Collision Detection & Wall Sliding
- World props and buildings register axis-aligned bounding boxes (AABB) in `world.colliders`.
- `world.checkCollision(position, radius)` checks sphere-to-box overlaps.
- If a forward move collides, `Player.js` attempts independent sliding along the X and Z axes, ensuring smooth movement around corners and obstacles.

### 4. Vehicle Physics: Driveable CNG Auto-Rickshaw
- Positioned in world space with heading angle `rotY` and velocity vector.
- Acceleration, braking, and rolling friction curve simulated in `World.js`.
- Turning speed dynamically scales with forward momentum to mimic genuine three-wheeler handling.
- Enemies within 2.6m of the moving CNG suffer collision impulse proportional to vehicle speed (`speed * 14`).

---

## 🕹️ Complete Controls & Input Guide

| Action | Keyboard / Mouse Control | Mobile / Touch Screen |
| :--- | :--- | :--- |
| **Movement** | `W`, `A`, `S`, `D` or Arrow Keys | Left Virtual Joystick |
| **Look / Aim** | Mouse Movement (Pointer Lock) | Right Touch Drag Area |
| **Drive / Exit CNG** | `E` (when near parked CNG) | On-Screen Action Button |
| **CNG Horn / Rickshaw Bell** | `H` (*"পিপ পিপ" / Tring Tring!*) | Horn Button |
| **Sprint** | `Shift` (consumes Stamina) | Sprint Toggle Button |
| **Jump** | `Space` | Jump Button |
| **Fire Active Weapon** | `Left Click` (auto-fire supported) | Fire Touch Button |
| **Aim Down Sights (ADS)** | `Right Click` (Sniper zoom on Padma-50) | Scope Touch Button |
| **Quick Melee Kick** | `F` (Melee knockback & damage) | Melee Touch Button |
| **Switch Weapons** | `1`, `2`, `3`, `4`, `5` (Rifle/Shotgun/SMG/Sniper/RPG) | Weapon Selector Strip |
| **Reload Weapon** | `R` | Reload Button |
| **Throw Grenade** | `G` | Grenade Button |
| **Camera Perspective** | `V` (Cycles FPS ➔ TPS ➔ Top-Down) | View Toggle Icon |
| **Open Armory Shop** | `B` | Shop Button on HUD |
| **Pause / Resume** | `P` or `Esc` | Pause Icon |

---

## 🚀 Installation & Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (Version 18.x or newer recommended)
- `npm` or `pnpm`

### Local Setup Steps
```bash
# 1. Clone the repository
git clone https://github.com/shakilsarkar12/Web-Game.git

# 2. Enter workspace
cd Web-Game

# 3. Install dependencies
npm install

# 4. Start development server
npm run dev
```
Open **`http://localhost:5173`** in Chrome, Firefox, Edge, or Brave.

### Building for Production
```bash
npm run build
```
Generates an optimized, tree-shaken static bundle in `dist/`, ready for 1-click deployment to **Vercel**, **Netlify**, or **GitHub Pages**.

---

## 🔮 Future Roadmap & AI Development Suggestions

If you are an **AI coding assistant** or **developer** picking up this codebase for future iterations, here are the most impactful, high-value feature extensions recommended:

### 🌟 Phase 1: Multiplayer & Co-Op Survival (High Priority)
- **Tech Stack:** [PartyKit](https://partykit.io/) or [Colyseus](https://colyseus.io/) over WebSockets.
- **Features:**
  - 2-to-4 player co-op resistance cell.
  - Driver & Gunner mechanics: Player 1 drives the Green CNG while Player 2 sits in the back shooting out the window!
  - Player revive mechanic when downed.

### 🌟 Phase 2: Story Campaign & Objective Missions
- **Mission 1 (Old Dhaka Rescue):** Navigate the narrow alleys of Shakhari Bazaar to rescue trapped civilians.
- **Mission 2 (Ahsan Manzil Defense):** Defend the historic Pink Palace against an amphibious horde rising from the Buriganga River.
- **Mission 3 (Hatirjheel Escape):** Race a speedboat or CNG across Hatirjheel bridges to reach the safe military outpost.

### 🌟 Phase 3: Expanded Map & Iconic Dhaka Landmarks
- **Lalbagh Fort:** Mughal-era fortress with courtyards and ramparts for defensive sniping.
- **Shahbagh & Curzon Hall:** Red-brick British-Mughal collegiate architecture with courtyard choke points.
- **Dhaka Elevated Expressway:** Rooftop highway warfare above the flooded metropolis.

### 🌟 Phase 4: Extended Vehicle Fleet
- **Rideable Cycle Rickshaw:** Pedal-powered getaway vehicle with high stamina drain and a speed turbo bell!
- **Dhaka "Leguna" (Human Hauler):** Light transport pickup truck with passenger flatbed for mounting mounted turrets.
- **Red BRTC Double-Decker Bus:** Massive mobile fortress that can be fortified with barricades.

### 🌟 Phase 5: Custom 3D Character Models & Animation (GLTF Pipeline)
- Introduce low-poly GLTF/GLB models for Bangladeshi resistance fighters wearing lungis, kurtas, and military vests with Mixamo skeletal animations (idle, run, reload, kick, death).

### 🌟 Phase 6: WebGL Shaders & Visual Post-Processing
- Integrate Three.js `EffectComposer`:
  - **UnrealBloomPass:** Make the Bengali neon signs and muzzle flashes genuinely glow with cyberpunk luminescence.
  - **Screen Rain Drops:** Screen-space refraction droplets sliding down the camera lens during monsoon rain.
  - **Dynamic Day/Night Sky:** Smooth golden hour dusk transitioning into foggy, moonlit Dhaka night.

### 🌟 Phase 7: Sound & Authentic Bengali Voice Lines
- Record or synthesize authentic Bengali tactical voice barks:
  - *"সাবধান, পেছনে শত্রু!"* (Watch out, enemy behind!)
  - *"রিলোড করছি, কভার দাও!"* (Reloading, cover me!)
  - *"চা খেয়ে শক্তি নাও!"* (Drink tea and recharge!)

### 🌟 Phase 8: Persistent Progression & Global Leaderboards
- Save player stats (highest wave, total kills, unlocked perks, weapon skins) to `IndexedDB` or Supabase/Firebase.
- Global leaderboard ranking the best Dhaka defenders worldwide.

---

## 🤖 AI Agent Contributor Guidelines

When an AI assistant (like Antigravity, Claude, or GPT) works on this repository:
1. **Preserve Zero-Asset Reliability:** Do not introduce large external assets that could fail to load or require CORS permissions without prior approval. Keep procedural canvas textures and Web Audio API synths as the primary backbone.
2. **Respect the Cultural Theme:** Maintain the authentic Dhaka cultural flavor (rickshaw art, Bengali typography, local tea stalls, CNG auto-rickshaws, Bangladesh landmarks).
3. **Keep Vanilla CSS Styling:** Maintain styling in `src/index.css` or component inline styles. Avoid adding Tailwind build-step dependencies unless explicitly configured.
4. **Three.js Object Lifecycle:** Always dispose of unused geometries, materials, and line objects to prevent WebGL memory leaks when adding new particle systems or weapon types.
5. **Pointer Lock & Input Management:** Ensure all interactive modals (`ShopModal`, `PerkModal`, `PauseMenu`) correctly release pointer lock on open, and request pointer lock on resume.

---

## 📄 License
This project is open-source under the **MIT License**. Created with passion for 3D web game development and the vibrant spirit of Dhaka City.
