# Battle for Dhaka: 3D Survival Shooter (Web Game)

A high-performance, fast-loading 3D wave survival shooter running entirely in modern web browsers with **Three.js** and **React**. Defend the streets of Dhaka (Dhaka College, Dhanmondi, Gulshan) against hordes of ghouls and mutant beasts.

---

## 🎮 Key Features

- **Iconic Dhaka Setting:** Stylized 3D Dhaka environment featuring traditional Cycle Rickshaws with authentic hand-painted hoods and backplates, Green CNGs, street tea stall (*টং দোকান / "মায়া চা"*) with hot steaming samovar, colonial Dhaka College red-brick facade, commercial high-rises with Bengali neon signs, overhead tangled power cables, and reflective rain puddles.
- **Driveable Green CNG Auto-Rickshaw (`E`):** Approach the parked green CNG and press `E` to drive! Features 2-stroke engine sound, working headlights, responsive steering, authentic dual-tone Dhaka horn (`H` - *"পিপ পিপ"*), and violent Roadkill physics running over zombie swarms!
- **Dynamic Multi-Perspective Camera:** Switch seamlessly mid-game between **First-Person (FPS)**, **Third-Person (TPS)**, and **Top-Down Tactical** views with `V`.
- **5 Distinct Weapons + Throwables:**
  - *Thresher Mk II* (Assault Rifle)
  - *Shadhinota-12* (Tactical Shotgun)
  - *Bengal Viper* (Rapid SMG)
  - *Padma-50* (Heavy Anti-Material Sniper with Tactical Scope Overlay)
  - *Meghna-RPG* (Heavy Rocket Launcher with physical rocket ballistics and smoke trail)
  - *Physics Grenades* (`G`) with bouncing ballistics and AOE shockwaves.
- **Floating Combat RPG Damage Text:** Real-time damage numbers floating above targets (critical headshots in gold `-120 CRIT!`, regular hits in white, explosions in orange `-350 💥`, melee kick in cyan, roadkill in crimson `-200 🚗`).
- **Dynamic Monsoon Thunderstorm & Lightning:** Sudden atmospheric lightning flashes illuminate Dhaka streets followed by deep synthesized rolling bass thunder.
- **Multikill Combo Streaks:** Double Kill, Triple Kill, Quad Kill, and Dhaka Dominator announcements with celebratory fanfares.
- **Boss Enrage & Ground Shockwave:** Gulshan Nightmare boss enrages at 50% HP, turns fiery crimson, speeds up, and stomps ground earthquake shockwaves.
- **Refined Gunplay & Melee:** Right-click **ADS (Aim Down Sights)**, recoil kick, procedural weapon sway, bobbing, reload animations, and quick metal kick attack (`F`).
- **In-Game Resistance Shop (`B`):** Earn ৳ Taka per kill and headshot to buy Medkits, Kevlar Armor vests, ammo crates, RPG rocket packs, weapon damage tuning, drum magazines, and emergency Airstrikes.
- **Roguelite Level-Up Perks:** After clearing each wave, pick 1 of 3 randomized perks (Speed Cola, Juggernaut, Rapid Fire, Vampire Lifesteal, Electric Chain Lightning, Master Grenadier).
- **Procedural Web Audio Engine:** Zero external MP3 downloads required. Realistic procedural synthesis for gunshots, rocket launch whoosh, reloads, asphalt footsteps, low HP heartbeat, headshot hitmarkers, explosions, CNG engine & horn, thunder rolls, and iconic rickshaw bells (`H`).
- **Tactical Minimap Radar & Scope:** Real-time 360-degree compass radar with direction arrow and blinking enemy blips, plus tactical sniper zoom for Padma-50.
- **Mobile & Touch Controls:** Dual on-screen virtual joysticks and touch buttons for mobile and tablet browsers.

---

## 🕹️ Controls

| Action | Key / Control |
| :--- | :--- |
| **Move / Drive** | `W`, `A`, `S`, `D` or Arrow Keys |
| **Drive / Exit CNG Auto-Rickshaw** | `E` (when near the green CNG) |
| **CNG Horn / Rickshaw Bell** | `H` (*"পিপ পিপ" / Tring Tring!*) |
| **Sprint** | `Shift` (drains stamina) |
| **Jump** | `Space` |
| **Fire Weapon** | `Left Click` (auto-fire supported) |
| **Aim Down Sights (ADS)** | `Right Click` (Sniper scope zoom on Padma-50) |
| **Quick Melee Kick** | `F` (Melee knockback & damage) |
| **Switch Weapon** | `1`, `2`, `3`, `4`, `5` (Assault / Shotgun / SMG / Sniper / RPG) |
| **Reload** | `R` |
| **Throw Grenade** | `G` |
| **Toggle Perspective** | `V` (FPS / TPS / Top-down) |
| **Open Supply Shop** | `B` |
| **Pause / Resume** | `P` or `Esc` |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation & Run

```bash
# Clone the repository
git clone https://github.com/shakilsarkar12/Web-Game.git

# Navigate into the project folder
cd Web-Game

# Install dependencies
npm install

# Start the local development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to play!

### Production Build

```bash
npm run build
```
The output will be generated inside the `dist/` directory, ready to be hosted on Vercel, Netlify, or GitHub Pages.

---

## 🛠️ Built With
- **Three.js** (WebGL 3D Engine & Procedural Geometries)
- **React 19** & **Vite**
- **Web Audio API** (100% Procedural sound synthesis)
- **Lucide Icons**
