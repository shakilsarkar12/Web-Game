# 🇧🇩 Battle for Dhaka: 3D Survival Shooter (Web Game)

[![React](https://img.shields.io/badge/React-19.x-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r186-black?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Linter](https://img.shields.io/badge/Oxlint-0_Errors_|_0_Warnings-emerald?style=for-the-badge)](https://oxc.rs/)
[![Web Audio API](https://img.shields.io/badge/Audio-Procedural_Web_Audio-orange?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![License](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)

A high-octane, next-generation **3D Web Browser Survival Shooter** built from ground up using **Three.js**, **React 19**, and **Vite**. Set in a dystopian, zombie-infested **Dhaka City, Bangladesh**, players defend iconic urban landmarks against mutating waves of ghouls, crawlers, toxic spitters, titans, and monstrous bosses.

> 💡 **Architectural Philosophy:** 100% self-contained and instant-loading (<500ms). Zero heavy external asset downloads. All 3D materials, city signs, vehicle artwork, and audio effects are generated entirely procedurally using HTML5 Canvas textures and the Web Audio API synthesis engine.

---

## 📑 Table of Contents
1. [Game Overview & Lore](#-game-overview--lore)
2. [Key Gameplay Features](#-key-gameplay-features)
3. [Complete Codebase Architecture & File Map](#-complete-codebase-architecture--file-map)
4. [Performance Engineering & Engine Architecture](#-performance-engineering--engine-architecture)
5. [Visual Direction & Lighting: Dhaka After Rain](#-visual-direction--lighting-dhaka-after-rain)
6. [Graphics Quality & Device Scaling System](#-graphics-quality--device-scaling-system)
7. [Complete Controls & Input Guide](#-complete-controls--input-guide)
8. [Installation & Development Setup](#-installation--development-setup)
9. [Future Roadmap & AI Development Suggestions](#-future-roadmap--ai-development-suggestions)
10. [AI Agent Contributor Guidelines](#-ai-agent-contributor-guidelines)

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
- Toggleable monsoon rain with falling particle streaks, puddle splashes, and wet road surface reflections.

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
│   ├── index.css                # Pure Vanilla CSS design system, layout tokens, animations
│   ├── audio/
│   │   └── SoundEngine.js       # 100% Procedural Web Audio API sound synthesizer
│   ├── game/
│   │   ├── GameEngine.js        # Core Three.js runtime orchestrating world, player, AI, combat
│   │   ├── World.js             # 3D Dhaka City generator, buildings, landmarks, CNG, lights
│   │   ├── Player.js            # Player controller, FPS/TPS/TopDown views, stamina, collision
│   │   ├── WeaponSystem.js      # 5 guns, RPG ballistics, sway, bobbing, recoil, grenades, melee
│   │   ├── EnemyManager.js      # Spatial hash AI, 5 enemy classes, walk cycles, Boss enrage
│   │   ├── ParticleSystem.js    # Object-pooled tracers, blood, explosions, rain, casings
│   │   ├── DropManager.js       # Floating loot pickups (coins, medkits, ammo crates, nuke)
│   │   └── TextureGenerator.js  # Cached procedural canvas textures (Bengali signs, rickshaw art)
│   └── components/
│       ├── HUD.jsx              # Cyberpunk HUD, radar minimap, sniper scope, CNG dash, damage text
│       ├── MainMenu.jsx         # Start screen with graphics preset toggle, weather, and start mission
│       ├── ShopModal.jsx        # In-game resistance armory modal (`B`)
│       ├── PerkModal.jsx        # Post-wave roguelite level-up 3-card perk selector
│       ├── PauseMenu.jsx        # Sleek centered pause menu with real-time graphics settings
│       ├── GameOverModal.jsx    # Mission failed score summary, persistent best-score & confetti
│       └── TouchControls.jsx    # Virtual joysticks & mobile/tablet action buttons
```

### Detailed File Responsibilities

| File | Primary Role & Internal Mechanics |
| :--- | :--- |
| **`GameEngine.js`** | Orchestrates `Scene`, `Camera`, `Renderer`, simulation physics, decoupled HUD throttling (~15Hz), transient camera shake offset, pointer lock, and full system `destroy()`. |
| **`World.js`** | Generates procedural Dhaka buildings, Dhaka College facade, Bismillah Tailors neon billboard, Maya Tea Stall (`টং দোকান`), cycle rickshaws, and handles graphics quality scaling (shadow maps, point lights). |
| **`Player.js`** | Manages player coordinates, collision sliding, health, armor, stamina, view modes (`FPS`, `TPS`, `TOPDOWN`), and reuses temporary vectors in movement loops. |
| **`WeaponSystem.js`** | 3D procedural gun models, ADS aim down sights, physical rocket ballistics, bouncing grenades, kick melee (`F`), and bullet raycasting. |
| **`EnemyManager.js`** | Manages wave spawning, 5 enemy archetypes, spatial hash grid ($4\text{m}$ cells) to eliminate $O(N^2)$ distance checks, toxic slime projectile pooling, and safe resource disposal on death. |
| **`ParticleSystem.js`** | Object pools for mesh particles, bullet tracers, and shockwaves. Shared geometries & materials to achieve zero allocations during combat. |
| **`TextureGenerator.js`** | In-memory canvas texture synthesis with global caching (`_cache`) to prevent VRAM texture duplication across identical street props. |
| **`SoundEngine.js`** | Real-time procedural audio synth using Web Audio API nodes (`OscillatorNode`, `GainNode`, `BiquadFilterNode`, noise generators) for gunshots, thunder, CNG motor, and horns. |
| **`HUD.jsx`** | High-performance overlay displaying 360° radar, ammo, health, floating combat damage markers, and multikill combo fanfare. |

---

## ⚡ Performance Engineering & Engine Architecture

To ensure the game runs smoothly across a broad spectrum of hardware—from low-power mobile devices to high-refresh desktop monitors—the codebase adheres to strict graphics and memory management standards:

```
┌──────────────────────────────────────────────────────────────┐
│                    HIGH-FREQUENCY SIMULATION                 │
│              Three.js Animation Loop (60 - 120 FPS)          │
│                                                              │
│  ┌─────────────────┐   ┌─────────────────┐   ┌────────────┐  │
│  │ Particle Pools  │   │ Spatial Hash AI │   │ Vector3    │  │
│  │ (Zero Allocs)   │   │ (O(N) vs O(N²)) │   │ Temporaries│  │
│  └─────────────────┘   └─────────────────┘   └────────────┘  │
└──────────────────────────────┬───────────────────────────────┘
                               │
            Throttled HUD Sync │ (15Hz Timer OR Immediate Dirty Flag)
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                      REACT UI LAYER (15 Hz)                  │
│  HUD.jsx • Minimap • Health Bars • Hitmarkers • Combat Text  │
└──────────────────────────────────────────────────────────────┘
```

### 1. Object Pooling (Zero Garbage Collection Thrashing)
- **Particles:** Pre-allocated mesh pool (`particlePool`) recycling box particles with shared `BoxGeometry` and color-keyed materials.
- **Tracers:** Pre-allocated line pool (`tracerPool`) with shared line geometries.
- **Shockwaves:** Reusable ring meshes for explosive detonations and boss stomps.
- **Slime Projectiles:** Toxic spitter ranged attacks draw from an active/inactive pool (`slimePool`), eliminating GC pauses.

### 2. Spatial Hash Grid Enemy AI ($O(N)$ vs $O(N^2)$)
- Replaced nested pairwise enemy checks with a 2D spatial hash grid (`4m` bucket size).
- During wave updates, enemies only compare distances against neighbors within the same or adjacent 8 grid cells.
- Solves performance degradation at high wave counts (30-40+ concurrent enemies).

### 3. Decoupled Simulation & React HUD Throttling
- The WebGL rendering loop runs at full display refresh rate (60–120 FPS).
- General HUD updates (radar minimap, stats, coords) are throttled to ~15Hz (`0.066s` intervals).
- High-priority combat events (taking damage, weapon firing, reload, wave start) immediately set a dirty flag to push UI updates with zero perceptible latency.

### 4. Vector & Euler Math Object Reuse
- Hot loops in `Player.js`, `EnemyManager.js`, `WeaponSystem.js`, and `ParticleSystem.js` reuse module-scoped scratch objects (`_tempVec1`, `_tempVec2`, `_toPlayer`, `_moveStep`, `_lookTarget`, `_pushVec`) instead of allocating `new THREE.Vector3()` every frame.

### 5. Transient Camera Shake (Zero Coordinate Drift)
- Screen shake is computed as an isolated transient vector `_shakeOffset` relative to base camera coordinates.
- Prevents cumulative floating-point drift previously caused by applying random offsets directly to the persistent camera transform.

### 6. Texture Caching & Memory Deallocation
- `TextureGenerator._cache` stores generated HTML5 Canvas textures. Subsequent props and rickshaws reuse existing texture instances.
- Comprehensive `destroy()` lifecycle routines traverse and dispose geometries, materials, and textures when restarting matches or unmounting the React tree.

---

## 🌅 Visual Direction & Lighting: "Dhaka After Rain"

The game adopts the art direction **"Bright Cinematic Urban Survival — Dhaka After Rain"**, shifting away from pitch-black murky night into a high-visibility, overcast daylight late afternoon after intense monsoon rain:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   SCENE LIGHTING & ATMOSPHERE MATRIX                   │
│                                                                        │
│   Sky: Overcast Blue-Gray (#8FA6B5)  │  Exponential Fog: 0.007 Density │
│                                                                        │
│   ┌─────────────────────┐   ┌──────────────────┐   ┌────────────────┐  │
│   │ AmbientLight        │   │ HemisphereLight  │   │ DirectionalSun │  │
│   │ 0xdce7ee (0.85)     │   │ Sky: 0xb0c4d2    │   │ 0xfff5e6 (1.3) │  │
│   │ Soft daylight fill  │   │ Ground: 0x4d5550 │   │ Angled shadows │  │
│   └─────────────────────┘   └──────────────────┘   └────────────────┘  │
│                                                                        │
│   Streetlights: Warm Amber PointLights (0xf59e0b) as secondary accents  │
│   Tone Mapping: ACESFilmicToneMapping (Exposure: 1.05)                 │
└────────────────────────────────────────────────────────────────────────┘
```

### 1. Overcast Atmosphere & Aerial Perspective
- **Sky Background:** Soft overcast blue-gray (`#8FA6B5`) with a diffused daylight sun disc (`0xfffaed`).
- **Subtle Atmospheric Fog:** `THREE.FogExp2(0x8fa6b5, 0.007)` replacing heavy black fog (`0.015`). Nearby combat spaces and streets remain crisp and clear, while distant high-rises recede naturally into soft daylight mist without disappearing into an inky void.

### 2. Balanced Lighting Harmony
- **Ambient Light (`0xdce7ee`, 0.85):** Diffuse daylight fill that eliminates pitch-black crushing in alleys and building shadows, preserving depth and geometry contours.
- **Hemisphere Light (`0xb0c4d2` sky / `0x4d5550` ground, 0.75):** Balances cool skylight from above with neutral concrete pavement bounce from below.
- **Directional Sunlight (`0xfff5e6`, 1.3):** Filtered warm daylight casting clean, soft directional shadows across the streets.
- **Streetlight Accents (`0xf59e0b`, 1.25):** Warm sodium lamps on street corners acting as secondary urban accents that pop against the cool overcast daylight.
- **Tone Mapping:** `THREE.ACESFilmicToneMapping` with exposure tuned to `1.05` for high dynamic range without washed-out highlights.

### 3. Paved Surfaces & Road Infrastructure
- **Weathered Asphalt (`TextureGenerator.createAsphaltTexture`):** Slate asphalt (`#3d4653`) with 6,500 multi-tone aggregate gravel specks, subtle tire grime lanes, vibrant yellow dashed dividers (`#f59e0b`), white boundary lanes, and authentic pedestrian zebra crossings.
- **Raised Concrete Sidewalks & Curbs (`0x94a3b8`):** Clean, weathered concrete curbs providing stark visual separation between footpaths and roads.
- **Restrained Rain Puddles (`0x6e8799`):** Metallic sheen (`0.15`) and low roughness (`0.08`) reflecting the overcast sky in road depressions without turning the road into a blinding mirror.
- **Shahbagh-style Roundabout Island:** Lush rain-washed tropical greenery (`0x388554`) with a bright concrete monument base (`0xf1f5f9`) flying the Bangladesh flag.

### 4. Distinct Architectural Palette
- **Dhaka College:** Colonial terracotta red-brick facade (`0xa8433a`) with authentic Bengali neon signboard.
- **Bismillah Tailors Plaza:** Neutral commercial architectural concrete gray (`0x788390`).
- **Dhanmondi 27 Tower:** Commercial slate/blue-gray high-rise (`0x58697c`).
- **Hotel Al-Kaderia Building:** Weathered warm beige/biscuit concrete (`0x8c7865`).
- **Distant High-rises:** Architectural variety of pale concrete (`0x8895a5`), weathered beige-gray (`0x75808d`), muted sage (`0x6a7d76`), and classic blue-gray (`0x61758a`).
- **Reflective Glass Windows:** Architectural daylight glass panes (`0x3e4c59`, roughness 0.25) with ~28% warm interior lights (`0xffe4a0`).

### 5. Combat & Target Readability
- **Enemy Silhouettes:** Street Ghouls updated to a diseased decayed greenish-charcoal (`0x3a483e`), providing immediate target acquisition against light concrete roads.
- **Muzzle Flashes & Tracers:** High-contrast ballistic tracers (`0xffd166`), blood splatters, and RPG smoke trails remain vibrant and crisp in daylight.

---

## 🎨 Graphics Quality & Device Scaling System

Players can select graphics quality presets in both the **Main Menu** and **Pause Menu**:

| Setting | LOW | MEDIUM (Default) | HIGH |
| :--- | :--- | :--- | :--- |
| **Target Hardware** | Mobile / Intel iGPU | Standard Laptops / GTX 1060 | Dedicated Gaming GPUs |
| **Pixel Ratio** | Clamped to `1.0` | Clamped to `1.5` | Native (`window.devicePixelRatio`, up to `2.0`) |
| **Shadows** | Disabled (`false`) | Enabled (`1024 x 1024`) | Enabled (`2048 x 2048` PCFSoft) |
| **Streetlights** | Spotlights Only | Spotlights + Ambient Fill | Full Point Lights + Ambient Fill |
| **Monsoon Rain** | 500 Falling Streaks | 1,000 Falling Streaks | 1,500 Falling Streaks + Surface Reflections |

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

### Quality Verification Commands
```bash
# Run ultra-fast Oxlint check (should output 0 errors, 0 warnings)
npm run lint

# Compile production bundle
npm run build
```
Generates an optimized, tree-shaken static bundle in `dist/` ready for 1-click deployment on **Vercel**, **Netlify**, or **GitHub Pages**.

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
3. **Use the Pure Vanilla CSS Design System:** Maintain layout utilities in `src/index.css` (`max-w-sm`, `max-w-md`, `grid-cols-3`, etc.). Do not assume external Tailwind build tools are present.
4. **Three.js Object Lifecycle:** Always dispose of unused geometries, materials, and line objects to prevent WebGL memory leaks when adding new particle systems or weapon types.
5. **Pointer Lock & Input Management:** Ensure all interactive modals (`ShopModal`, `PerkModal`, `PauseMenu`) correctly release pointer lock on open, and request pointer lock on resume.

---

## 📄 License
This project is open-source under the **MIT License**. Created with passion for 3D web game development and the vibrant spirit of Dhaka City.
