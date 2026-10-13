# Battle for Dhaka: 3D Survival Shooter (Web Game)

A high-performance, fast-loading 3D wave survival shooter running entirely in modern web browsers with **Three.js** and **React**. Defend the streets of Dhaka (Dhaka College, Dhanmondi) against hordes of hollows and mutant beasts.

---

## 🎮 Key Features

- **Iconic Dhaka Setting:** Stylized 3D Dhaka environment featuring traditional Cycle Rickshaws with authentic hand-painted hoods and backplates, Green CNGs, street tea stall (*টং দোকান / "মায়া চা"*) with samovar, colonial Dhaka College red-brick facade, commercial high-rises with Bengali neon signs, and overhead tangled power cables.
- **Dynamic Multi-Perspective Camera:** Switch seamlessly mid-game between **First-Person (FPS)**, **Third-Person (TPS)**, and **Top-Down Tactical** views with `V`.
- **4 Distinct Weapons + Throwables:**
  - *Thresher Mk II* (Assault Rifle)
  - *Shadhinota-12* (Tactical Shotgun)
  - *Bengal Viper* (Rapid SMG)
  - *Padma-50* (Heavy Anti-Material Sniper)
  - *Physics Grenades* (`G`) with bouncing ballistics and AOE shockwaves.
- **Refined Gunplay:** Right-click **ADS (Aim Down Sights)**, recoil kick, procedural weapon sway, bobbing, and reload animations.
- **Interactive Environment:** Red explosive fuel barrels that chain-react and wipe out swarms when shot.
- **In-Game Resistance Shop (`B`):** Earn ৳ Taka per kill and headshot to buy Medkits, Kevlar Armor vests, ammo crates, weapon damage tuning, drum magazines, and emergency Airstrikes.
- **Enemy AI Horde Director:** 5 unique enemy archetypes (Street Ghouls, Rabid Crawlers, Toxic Spitters, Dhaka Titans, and Gulshan Nightmare Bosses) with procedural walking animations and separation physics.
- **Procedural Web Audio Engine:** Zero external MP3 downloads required. Realistic procedural synthesis for gunshots, reloads, headshot hitmarkers, explosions, zombie groans, and iconic Dhaka rickshaw bells (`H`).
- **Tactical Minimap Radar:** Real-time 360-degree compass radar with direction arrow and blinking enemy blips.
- **Mobile & Touch Controls:** Dual on-screen virtual joysticks and touch buttons for mobile and tablet browsers.

---

## 🕹️ Controls

| Action | Key / Control |
| :--- | :--- |
| **Move** | `W`, `A`, `S`, `D` |
| **Sprint** | `Shift` (drains stamina) |
| **Jump** | `Space` |
| **Fire** | `Left Click` (auto-fire supported) |
| **Aim Down Sights (ADS)** | `Right Click` |
| **Switch Weapon** | `1`, `2`, `3`, `4` |
| **Reload** | `R` |
| **Throw Grenade** | `G` |
| **Toggle Perspective** | `V` (FPS / TPS / Top-down) |
| **Open Supply Shop** | `B` |
| **Rickshaw Bell** | `H` (*Tring Tring!*) |
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
- **Web Audio API** (Procedural sound synthesis)
- **Lucide Icons**
