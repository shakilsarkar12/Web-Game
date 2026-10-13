// WeaponSystem.js - 4 guns, ADS aiming, recoil, procedural sway, bobbing, reload, and grenade ballistics
import * as THREE from 'three';
import { soundEngine } from '../audio/SoundEngine.js';

export const WEAPON_TYPES = {
  RIFLE: {
    id: 'rifle',
    name: 'Thresher Mk II',
    subname: 'Assault Rifle',
    damage: 38,
    fireRate: 0.11, // seconds between shots
    magSize: 30,
    reloadTime: 1.8,
    range: 120,
    pellets: 1,
    spread: 0.015,
    auto: true
  },
  SHOTGUN: {
    id: 'shotgun',
    name: 'Shadhinota-12',
    subname: 'Tactical Shotgun',
    damage: 22, // 22 * 7 pellets = 154 max
    fireRate: 0.65,
    magSize: 8,
    reloadTime: 2.2,
    range: 45,
    pellets: 7,
    spread: 0.08,
    auto: false
  },
  SMG: {
    id: 'smg',
    name: 'Bengal Viper',
    subname: 'Submachine Gun',
    damage: 24,
    fireRate: 0.075,
    magSize: 42,
    reloadTime: 1.4,
    range: 75,
    pellets: 1,
    spread: 0.035,
    auto: true
  },
  SNIPER: {
    id: 'sniper',
    name: 'Padma-50',
    subname: 'Heavy Sniper',
    damage: 220,
    fireRate: 1.1,
    magSize: 5,
    reloadTime: 2.5,
    range: 200,
    pellets: 1,
    spread: 0.002,
    auto: false
  },
  ROCKET: {
    id: 'rocket',
    name: 'Meghna-RPG',
    subname: 'Rocket Launcher',
    damage: 420,
    fireRate: 1.5,
    magSize: 1,
    reloadTime: 2.7,
    range: 180,
    pellets: 1,
    spread: 0.002,
    auto: false
  }
};

export class WeaponSystem {
  constructor(camera, scene) {
    this.camera = camera;
    this.scene = scene;

    this.weapons = { ...WEAPON_TYPES };
    this.currentWeaponKey = 'RIFLE';
    this.currentWeapon = this.weapons.RIFLE;

    // Ammo state per weapon
    this.ammo = {
      RIFLE: { current: 30, reserve: 180 },
      SHOTGUN: { current: 8, reserve: 48 },
      SMG: { current: 42, reserve: 210 },
      SNIPER: { current: 5, reserve: 25 },
      ROCKET: { current: 1, reserve: 6 }
    };

    // Grenades & Rockets
    this.grenades = 4;
    this.activeGrenades = [];
    this.activeRockets = [];

    // Weapon timing
    this.lastShotTime = 0;
    this.lastMeleeTime = 0;
    this.cameraShake = 0;
    this.isReloading = false;
    this.reloadProgress = 0;
    this.isADS = false;

    // Weapon Sway, Recoil & Bobbing offsets
    this.recoilOffset = new THREE.Vector3(0, 0, 0);
    this.recoilRotation = new THREE.Vector3(0, 0, 0);
    this.swayOffset = new THREE.Vector3(0, 0, 0);
    this.bobOffset = new THREE.Vector3(0, 0, 0);

    // Pre-allocated vectors to eliminate per-frame GC allocations
    this._hipPos = new THREE.Vector3(0.24, -0.22, -0.45);
    this._adsPos = new THREE.Vector3(0.0, -0.11, -0.32);
    this._zeroVec = new THREE.Vector3(0, 0, 0);
    this._originVec = new THREE.Vector3();
    this._shootDir = new THREE.Vector3();
    this._impactPt = new THREE.Vector3();
    this._raycaster = new THREE.Raycaster();

    // 3D Gun Group attached to camera
    this.gunGroup = new THREE.Group();
    this.camera.add(this.gunGroup);

    // Soft illumination light specifically for the held weapon
    const gunAmbient = new THREE.PointLight(0xffeedd, 1.2, 3);
    gunAmbient.position.set(0.1, 0.2, -0.2);
    this.gunGroup.add(gunAmbient);

    // Barrel tip coordinates for dynamic muzzle flashes
    this.barrelTips = {
      RIFLE: new THREE.Vector3(0, 0.02, -0.72),
      SHOTGUN: new THREE.Vector3(0, 0.035, -0.75),
      SMG: new THREE.Vector3(0, 0.02, -0.48),
      SNIPER: new THREE.Vector3(0, 0.03, -1.05),
      ROCKET: new THREE.Vector3(0, 0, -0.85)
    };

    // 3D Starburst Muzzle Flash Mesh (three intersecting star planes + fiery core)
    this.muzzleFlashGroup = new THREE.Group();
    const flashGeo = new THREE.PlaneGeometry(0.35, 0.35);
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffd166,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const p1 = new THREE.Mesh(flashGeo, flashMat);
    const p2 = new THREE.Mesh(flashGeo, flashMat);
    p2.rotation.z = Math.PI / 3;
    const p3 = new THREE.Mesh(flashGeo, flashMat);
    p3.rotation.z = (Math.PI / 3) * 2;
    this.muzzleFlashGroup.add(p1, p2, p3);

    const flashCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    this.muzzleFlashGroup.add(flashCore);
    this.muzzleFlashGroup.visible = false;
    this.gunGroup.add(this.muzzleFlashGroup);

    // Build procedural 3D gun models
    this.gunMeshes = {};
    this.buildGunModels();
    this.switchWeapon('RIFLE');

    // Muzzle flash point light
    this.muzzleLight = new THREE.PointLight(0xffaa33, 0, 8);
    this.gunGroup.add(this.muzzleLight);
    this.muzzleLightTimer = 0;
  }

  buildGunModels() {
    // --- 1. RIFLE (Thresher Mk II - Bangladeshi Tactical Assault Rifle) ---
    const rifleGroup = new THREE.Group();
    const rifleMat = new THREE.MeshStandardMaterial({ color: 0x1e242d, metalness: 0.85, roughness: 0.28 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x7c4a27, roughness: 0.72 });
    const darkSteelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });

    // Lower & Upper Receiver
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.46), rifleMat);
    receiver.position.set(0, 0, 0);
    rifleGroup.add(receiver);

    // Ejection port & bolt carrier
    const boltCarrier = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.14), darkSteelMat);
    boltCarrier.position.set(0.042, 0.03, -0.02);
    rifleGroup.add(boltCarrier);

    // Ergonomic Combat Pistol Grip
    const rifleGrip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.15, 0.07), darkSteelMat);
    rifleGrip.position.set(0, -0.11, 0.12);
    rifleGrip.rotation.x = -0.35;
    rifleGroup.add(rifleGrip);

    // Vented Teak Wood Handguard
    const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.085, 0.3), woodMat);
    handguard.position.set(0, -0.01, -0.32);
    rifleGroup.add(handguard);

    // Upper Gas Tube
    const gasTube = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.28, 8), darkSteelMat);
    gasTube.rotation.x = Math.PI / 2;
    gasTube.position.set(0, 0.045, -0.32);
    rifleGroup.add(gasTube);

    // Fluted Barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.58, 8), rifleMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.02, -0.45);
    rifleGroup.add(barrel);

    // Birdcage Muzzle Brake
    const muzzleBrake = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.018, 0.08, 8), darkSteelMat);
    muzzleBrake.rotation.x = Math.PI / 2;
    muzzleBrake.position.set(0, 0.02, -0.7);
    rifleGroup.add(muzzleBrake);

    // Tactical Reflex Optic Sight Frame
    const sight = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.065, 0.09), darkSteelMat);
    sight.position.set(0, 0.085, -0.05);
    rifleGroup.add(sight);

    const redDot = new THREE.Mesh(new THREE.SphereGeometry(0.007, 8, 8), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    redDot.position.set(0, 0.085, -0.05);
    rifleGroup.add(redDot);

    // Curved 30-round Banana Magazine
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.22, 0.11), rifleMat);
    mag.position.set(0, -0.13, -0.07);
    mag.rotation.x = 0.28;
    rifleGroup.add(mag);

    this.gunMeshes.RIFLE = rifleGroup;
    this.gunGroup.add(rifleGroup);

    // --- 2. SHOTGUN (Shadhinota-12 Tactical 12-Gauge) ---
    const shotGroup = new THREE.Group();
    const shotMat = new THREE.MeshStandardMaterial({ color: 0x1c212a, metalness: 0.85, roughness: 0.25 });
    const pumpMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 });

    // Main Heavy Receiver
    const shotBody = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.14, 0.52), shotMat);
    shotGroup.add(shotBody);

    // Heavy 12-Gauge Main Barrel
    const shotBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.65, 8), shotMat);
    shotBarrel.rotation.x = Math.PI / 2;
    shotBarrel.position.set(0, 0.035, -0.46);
    shotGroup.add(shotBarrel);

    // Under-barrel Tubular Magazine
    const magTube = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.55, 8), shotMat);
    magTube.rotation.x = Math.PI / 2;
    magTube.position.set(0, -0.02, -0.42);
    shotGroup.add(magTube);

    // Ventilated Heat Shield
    const heatShield = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.02, 0.42), darkSteelMat);
    heatShield.position.set(0, 0.065, -0.38);
    shotGroup.add(heatShield);

    // Ribbed Tactical Pump Forend
    const pump = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.095, 0.22), pumpMat);
    pump.position.set(0, -0.02, -0.36);
    shotGroup.add(pump);

    // High-Vis Neon Green Fiber Optic Front Sight
    const frontSight = new THREE.Mesh(new THREE.SphereGeometry(0.007, 8, 8), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
    frontSight.position.set(0, 0.065, -0.72);
    shotGroup.add(frontSight);

    // Tactical Stock
    const shotStock = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.13, 0.35), pumpMat);
    shotStock.position.set(0, -0.04, 0.35);
    shotGroup.add(shotStock);

    this.gunMeshes.SHOTGUN = shotGroup;
    this.gunGroup.add(shotGroup);

    // --- 3. SMG (Bengal Viper 9mm Tactical SMG) ---
    const smgGroup = new THREE.Group();
    const smgMat = new THREE.MeshStandardMaterial({ color: 0x111620, metalness: 0.8, roughness: 0.35 });

    // Compact Frame
    const smgBody = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.11, 0.38), smgMat);
    smgGroup.add(smgBody);

    // Top Picatinny Rail
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.02, 0.28), darkSteelMat);
    rail.position.set(0, 0.065, -0.04);
    smgGroup.add(rail);

    // Micro Holographic Sight
    const smgSight = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.05, 0.07), darkSteelMat);
    smgSight.position.set(0, 0.095, -0.04);
    smgGroup.add(smgSight);

    const greenDot = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 8), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
    greenDot.position.set(0, 0.095, -0.04);
    smgGroup.add(greenDot);

    // Barrel & Multi-Port Compensator
    const smgBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.28, 8), smgMat);
    smgBarrel.rotation.x = Math.PI / 2;
    smgBarrel.position.set(0, 0.02, -0.32);
    smgGroup.add(smgBarrel);

    const smgComp = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.06), darkSteelMat);
    smgComp.position.set(0, 0.02, -0.46);
    smgGroup.add(smgComp);

    // Extended Forward-Angled 42-Round Magazine
    const smgMag = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.24, 0.075), smgMat);
    smgMag.position.set(0, -0.15, 0.02);
    smgMag.rotation.x = 0.2;
    smgGroup.add(smgMag);

    // Skeletonized Folding Wire Stock
    const wireStock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, 0.25), darkSteelMat);
    wireStock.position.set(0, -0.02, 0.28);
    smgGroup.add(wireStock);

    this.gunMeshes.SMG = smgGroup;
    this.gunGroup.add(smgGroup);

    // --- 4. SNIPER (Padma-50 .50 BMG Heavy Anti-Material Rifle) ---
    const snipGroup = new THREE.Group();
    const snipMat = new THREE.MeshStandardMaterial({ color: 0x242d3c, metalness: 0.85, roughness: 0.28 });

    // Massive Chassis
    const snipBody = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.14, 0.68), snipMat);
    snipGroup.add(snipBody);

    // Heavy Fluted .50 Cal Barrel
    const snipBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.95, 8), darkSteelMat);
    snipBarrel.rotation.x = Math.PI / 2;
    snipBarrel.position.set(0, 0.03, -0.68);
    snipGroup.add(snipBarrel);

    // Oversized Multi-Chamber Arrowhead Muzzle Brake
    const snipBrake = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 0.14), darkSteelMat);
    snipBrake.position.set(0, 0.03, -1.02);
    snipGroup.add(snipBrake);

    // High-Magnification Variable Sniper Scope Tube
    const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.36, 12), darkSteelMat);
    scope.rotation.x = Math.PI / 2;
    scope.position.set(0, 0.12, -0.1);
    snipGroup.add(scope);

    // Scope Mount Rings & Elevation Turrets
    const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.03, 8), darkSteelMat);
    turret.position.set(0, 0.155, -0.1);
    snipGroup.add(turret);

    // Folded Tactical Bipod Legs under forend
    const bipodL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.18, 0.02), darkSteelMat);
    bipodL.position.set(-0.06, -0.06, -0.42);
    bipodL.rotation.z = -0.3;
    snipGroup.add(bipodL);

    const bipodR = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.18, 0.02), darkSteelMat);
    bipodR.position.set(0.06, -0.06, -0.42);
    bipodR.rotation.z = 0.3;
    snipGroup.add(bipodR);

    // Heavy Box Magazine
    const snipMag = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.16, 0.12), darkSteelMat);
    snipMag.position.set(0, -0.13, -0.05);
    snipGroup.add(snipMag);

    this.gunMeshes.SNIPER = snipGroup;
    this.gunGroup.add(snipGroup);

    // --- 5. ROCKET (Meghna-RPG Anti-Tank Launcher) ---
    const rpgGroup = new THREE.Group();
    const rpgMat = new THREE.MeshStandardMaterial({ color: 0x2c4a25, roughness: 0.55, metalness: 0.45 });
    const woodGripMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
    const warheadMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.4 });

    // Main Military Launch Tube
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.92, 12), rpgMat);
    tube.rotation.x = Math.PI / 2;
    tube.position.set(0, 0, -0.2);
    rpgGroup.add(tube);

    // Rear Conical Exhaust Blast Nozzle
    const exhaust = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.18, 12), rpgMat);
    exhaust.rotation.x = -Math.PI / 2;
    exhaust.position.set(0, 0, 0.32);
    rpgGroup.add(exhaust);

    // Insulated Teak Wooden Heat Shield Center Collar
    const heatCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.056, 0.32, 12), woodGripMat);
    heatCollar.rotation.x = Math.PI / 2;
    heatCollar.position.set(0, 0, -0.08);
    rpgGroup.add(heatCollar);

    // Forward Pistol Grip & Trigger
    const rpgGrip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.15, 0.06), woodGripMat);
    rpgGrip.position.set(0, -0.11, -0.18);
    rpgGrip.rotation.x = 0.2;
    rpgGroup.add(rpgGrip);

    // PGO-7 Optical Sight Box & Mount Bracket
    const pgoScope = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.12), darkSteelMat);
    pgoScope.position.set(-0.065, 0.08, -0.18);
    rpgGroup.add(pgoScope);

    // Loaded PG-7V Shaped Charge Rocket Warhead
    const warhead = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.26, 12), warheadMat);
    warhead.rotation.x = Math.PI / 2;
    warhead.position.set(0, 0, -0.78);
    rpgGroup.add(warhead);

    // Rocket Fuse Tip
    const fuseTip = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.08, 8), darkSteelMat);
    fuseTip.rotation.x = Math.PI / 2;
    fuseTip.position.set(0, 0, -0.92);
    rpgGroup.add(fuseTip);

    this.gunMeshes.ROCKET = rpgGroup;
    this.gunGroup.add(rpgGroup);
  }

  switchWeapon(key) {
    if (!this.weapons[key]) return;
    this.currentWeaponKey = key;
    this.currentWeapon = this.weapons[key];
    this.isReloading = false;

    // Show only the selected mesh
    Object.keys(this.gunMeshes).forEach(k => {
      this.gunMeshes[k].visible = k === key;
    });

    soundEngine.playReload();
  }

  setADS(isAiming) {
    const wasADS = this.isADS;
    this.isADS = isAiming;
    if (!wasADS && isAiming && this.currentWeaponKey === 'SNIPER') {
      soundEngine.playSniperBreath();
    }
  }

  // Quick Melee Attack (Kick / Combat Knife, F key)
  melee(currentTime, playerPosition, cameraDirection, enemies, particleSystem) {
    if (currentTime - this.lastMeleeTime < 0.6) return null;
    this.lastMeleeTime = currentTime;

    let didHit = false;
    const hitEnemies = [];
    const meleeRange = 3.0;

    if (enemies && enemies.length > 0) {
      for (let e of enemies) {
        if (e.isAlive) {
          const toEnemy = new THREE.Vector3().subVectors(e.position, playerPosition);
          const dist = toEnemy.length();
          toEnemy.normalize();
          const dot = cameraDirection.dot(toEnemy);

          // In front of player within cone and range
          if (dist <= meleeRange && dot > 0.4) {
            didHit = true;
            hitEnemies.push({
              enemy: e,
              damage: 75,
              isHeadshot: false,
              knockbackDir: toEnemy.clone()
            });

            if (particleSystem) {
              particleSystem.spawnBlood(e.position.clone().add(new THREE.Vector3(0, 1.2, 0)), toEnemy);
            }
          }
        }
      }
    }

    soundEngine.playMelee(didHit);

    // Melee thrust recoil
    this.recoilOffset.z = 0.16;
    this.cameraShake = 0.04;

    return hitEnemies;
  }

  // Shoot weapon (returns hits for damage calculation)
  shoot(currentTime, enemies, barrels, particleSystem) {
    if (this.isReloading) return null;

    const w = this.currentWeapon;
    const ammoState = this.ammo[this.currentWeaponKey];

    // Check fire rate
    if (currentTime - this.lastShotTime < w.fireRate) return null;

    // Check ammo
    if (ammoState.current <= 0) {
      soundEngine.playEmptyClick();
      this.reload();
      this.lastShotTime = currentTime;
      return null;
    }

    // Deduct ammo & update time
    ammoState.current--;
    this.lastShotTime = currentTime;

    // Sound
    soundEngine.playGunshot(w.id);

    // 3D Starburst Muzzle Flash Mesh & Point Light
    const tip = this.barrelTips[this.currentWeaponKey] || this.barrelTips.RIFLE;
    this.muzzleFlashGroup.position.copy(tip);
    this.muzzleFlashGroup.rotation.z = Math.random() * Math.PI * 2;
    const isHeavy = this.currentWeaponKey === 'SNIPER' || this.currentWeaponKey === 'ROCKET';
    const isShotgun = this.currentWeaponKey === 'SHOTGUN';
    const baseFlashScale = isHeavy ? 1.55 : (isShotgun ? 1.25 : 0.95);
    const flashScale = baseFlashScale * (0.85 + Math.random() * 0.3);
    this.muzzleFlashGroup.scale.set(flashScale, flashScale, flashScale);
    this.muzzleFlashGroup.visible = true;

    this.muzzleLight.position.copy(tip);
    this.muzzleLight.intensity = isHeavy ? 6.5 : (isShotgun ? 5.2 : 4.0);
    this.muzzleLightTimer = 0.055;

    // Camera recoil shake & recoil kick per weapon archetype
    let kickZ = 0.08;
    let kickRot = 0.06;
    let shake = 0.035;

    if (this.currentWeaponKey === 'SNIPER') {
      kickZ = this.isADS ? 0.12 : 0.22;
      kickRot = 0.14;
      shake = 0.06;
    } else if (this.currentWeaponKey === 'SHOTGUN') {
      kickZ = this.isADS ? 0.09 : 0.16;
      kickRot = 0.11;
      shake = 0.05;
    } else if (this.currentWeaponKey === 'SMG') {
      kickZ = this.isADS ? 0.025 : 0.05;
      kickRot = 0.04;
      shake = 0.018;
    } else if (this.currentWeaponKey === 'ROCKET') {
      kickZ = 0.24;
      kickRot = 0.18;
      shake = 0.085;
    } else {
      kickZ = this.isADS ? 0.045 : 0.09;
      kickRot = 0.06;
      shake = 0.025;
    }

    this.cameraShake = shake;
    this.recoilOffset.z = kickZ;
    this.recoilRotation.x = kickRot;

    // Eject brass cartridge
    this.camera.getWorldPosition(this._originVec);
    if (particleSystem) {
      particleSystem.spawnShellCasing(this._originVec, this.camera.rotation);
    }

    // Meghna-RPG Rocket Launching
    if (this.currentWeaponKey === 'ROCKET') {
      const rocketGeo = new THREE.ConeGeometry(0.08, 0.35, 8);
      const rocketMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, metalness: 0.6 });
      const rocketMesh = new THREE.Mesh(rocketGeo, rocketMat);
      rocketMesh.rotation.x = Math.PI / 2;
      rocketMesh.position.copy(this._originVec);
      this.scene.add(rocketMesh);

      const dir = new THREE.Vector3(0, 0, -1);
      dir.unproject(this.camera);
      dir.sub(this._originVec).normalize();

      this.activeRockets.push({
        mesh: rocketMesh,
        position: this._originVec.clone(),
        velocity: dir.clone().multiplyScalar(46),
        direction: dir.clone(),
        life: 3.5
      });
      return [];
    }

    // Raycast Shooting logic
    const hits = [];

    for (let p = 0; p < w.pellets; p++) {
      // Calculate spread direction
      const spreadFactor = this.isADS ? w.spread * 0.3 : w.spread;
      const spreadX = (Math.random() - 0.5) * spreadFactor;
      const spreadY = (Math.random() - 0.5) * spreadFactor;

      this._shootDir.set(spreadX, spreadY, -1);
      this._shootDir.unproject(this.camera);
      this._shootDir.sub(this._originVec).normalize();

      this._raycaster.set(this._originVec, this._shootDir);
      this._raycaster.near = 0.1;
      this._raycaster.far = w.range;
      const raycaster = this._raycaster;
      let hitTarget = false;

      // 1. Check Explosive Barrels
      if (barrels && barrels.length > 0) {
        for (let b of barrels) {
          if (!b.isExploded) {
            const bIntersects = raycaster.intersectObject(b.mesh, false);
            if (bIntersects.length > 0) {
              hits.push({ type: 'barrel', target: b, point: bIntersects[0].point });
              hitTarget = true;
              break;
            }
          }
        }
      }

      // 2. Check Enemies
      if (!hitTarget && enemies && enemies.length > 0) {
        for (let e of enemies) {
          if (e.isAlive && e.mesh) {
            const intersects = raycaster.intersectObjects(e.mesh.children.length ? e.mesh.children : [e.mesh], true);
            if (intersects.length > 0) {
              const hitPoint = intersects[0].point;
              // Check if headshot (upper half of enemy)
              const isHeadshot = hitPoint.y > e.position.y + 1.2;
              const dmg = isHeadshot ? w.damage * 2.2 : w.damage;

              hits.push({
                type: 'enemy',
                enemy: e,
                damage: Math.round(dmg),
                isHeadshot,
                point: hitPoint
              });

              hitTarget = true;

              // Blood splatter particle
              if (particleSystem) {
                particleSystem.spawnBlood(hitPoint, this._shootDir);
              }
              break;
            }
          }
        }
      }

      // 3. World / Environment impact (sparks and dust on missed shots)
      if (!hitTarget && particleSystem) {
        this._impactPt.copy(this._originVec).addScaledVector(this._shootDir, Math.min(30, w.range));
        particleSystem.spawnConcreteImpact(this._impactPt);
      }

      // Spawn bullet tracer particle
      if (particleSystem) {
        particleSystem.spawnTracer(this._originVec, this._shootDir, w.range);
      }
    }

    return hits;
  }

  reload() {
    const ammoState = this.ammo[this.currentWeaponKey];
    const w = this.currentWeapon;

    if (this.isReloading || ammoState.current >= w.magSize || ammoState.reserve <= 0) {
      return;
    }

    this.isReloading = true;
    this.reloadProgress = 0;
    soundEngine.playReload();
  }

  throwGrenade(origin, forwardDirection, world) {
    if (this.grenades <= 0) return false;
    this.grenades--;

    soundEngine.playGrenadeThrow();

    // 3D Grenade mesh
    const geo = new THREE.SphereGeometry(0.18, 12, 12);
    const mat = new THREE.MeshStandardMaterial({ color: 0x276749, roughness: 0.5 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(origin);
    this.scene.add(mesh);

    // Initial throw velocity
    const velocity = forwardDirection.clone().multiplyScalar(22);
    velocity.y += 6.5; // Arc trajectory

    this.activeGrenades.push({
      mesh,
      velocity,
      fuseTime: 2.2, // seconds
      radius: 0.18,
      world
    });

    return true;
  }

  update(delta, mouseDeltaX, mouseDeltaY, isMoving, isSprinting, particleSystem = null, enemies = null) {
    // 1. Muzzle Flash Decay
    if (this.muzzleLightTimer > 0) {
      this.muzzleLightTimer -= delta;
      if (this.muzzleLightTimer <= 0) {
        this.muzzleLight.intensity = 0;
        this.muzzleFlashGroup.visible = false;
      }
    }

    // 2. Reload Progress
    if (this.isReloading) {
      this.reloadProgress += delta / this.currentWeapon.reloadTime;
      if (this.reloadProgress >= 1) {
        const ammoState = this.ammo[this.currentWeaponKey];
        const needed = this.currentWeapon.magSize - ammoState.current;
        const toLoad = Math.min(needed, ammoState.reserve);
        ammoState.current += toLoad;
        ammoState.reserve -= toLoad;
        this.isReloading = false;
        this.reloadProgress = 0;
      }
    }

    // 3. Recoil Recovery (Zero Allocation)
    this.recoilOffset.lerp(this._zeroVec, delta * 12);
    this.recoilRotation.lerp(this._zeroVec, delta * 14);

    // 4. Mouse Sway
    const targetSwayX = -mouseDeltaX * 0.0003;
    const targetSwayY = -mouseDeltaY * 0.0003;
    this.swayOffset.x = THREE.MathUtils.lerp(this.swayOffset.x, targetSwayX, delta * 10);
    this.swayOffset.y = THREE.MathUtils.lerp(this.swayOffset.y, targetSwayY, delta * 10);

    // 5. Walking / Sprinting Bobbing
    const time = performance.now() * 0.005;
    const bobSpeed = isSprinting ? 2.2 : 1.4;
    const bobAmount = isSprinting ? 0.045 : 0.022;

    if (isMoving && !this.isADS) {
      this.bobOffset.x = Math.sin(time * bobSpeed) * bobAmount;
      this.bobOffset.y = Math.cos(time * bobSpeed * 2) * bobAmount * 0.6;
    } else {
      this.bobOffset.lerp(this._zeroVec, delta * 8);
    }

    // 6. ADS vs Hip-Fire Position Interpolation (Pre-allocated vectors)
    const targetBasePos = this.isADS ? this._adsPos : this._hipPos;
    const currentMesh = this.gunMeshes[this.currentWeaponKey];

    if (currentMesh) {
      currentMesh.position.x = THREE.MathUtils.lerp(
        currentMesh.position.x,
        targetBasePos.x + this.swayOffset.x + this.bobOffset.x,
        delta * 16
      );
      currentMesh.position.y = THREE.MathUtils.lerp(
        currentMesh.position.y,
        targetBasePos.y + this.swayOffset.y + this.bobOffset.y,
        delta * 16
      );
      currentMesh.position.z = THREE.MathUtils.lerp(
        currentMesh.position.z,
        targetBasePos.z + this.recoilOffset.z,
        delta * 16
      );

      // Rotation (recoil tilt + sway)
      currentMesh.rotation.x = this.recoilRotation.x;
      currentMesh.rotation.y = this.swayOffset.x * 2;
    }

    // 7. Update Active Grenades Physics
    const explodedGrenades = [];
    for (let i = this.activeGrenades.length - 1; i >= 0; i--) {
      const g = this.activeGrenades[i];
      g.fuseTime -= delta;

      // Gravity & Velocity
      g.velocity.y -= 18.0 * delta; // Gravity
      g.mesh.position.addScaledVector(g.velocity, delta);
      g.mesh.rotation.x += 8 * delta;
      g.mesh.rotation.z += 6 * delta;

      // Ground bounce
      if (g.mesh.position.y <= 0.2) {
        g.mesh.position.y = 0.2;
        g.velocity.y = -g.velocity.y * 0.45; // Bounce absorption
        g.velocity.x *= 0.7; // Friction
        g.velocity.z *= 0.7;
      }

      // Explode when fuse ends
      if (g.fuseTime <= 0) {
        explodedGrenades.push(g.mesh.position.clone());
        this.scene.remove(g.mesh);
        if (g.mesh.geometry) g.mesh.geometry.dispose();
        if (g.mesh.material) g.mesh.material.dispose();
        this.activeGrenades.splice(i, 1);
        soundEngine.playExplosion();
      }
    }

    // 8. Update Active Meghna-RPG Rockets
    const explodedRockets = [];
    for (let i = this.activeRockets.length - 1; i >= 0; i--) {
      const r = this.activeRockets[i];
      r.life -= delta;
      r.position.addScaledVector(r.velocity, delta);
      r.mesh.position.copy(r.position);
      r.mesh.lookAt(r.position.clone().add(r.direction));

      if (particleSystem) {
        particleSystem.spawnRocketSmoke(r.position);
      }

      let hit = r.life <= 0 || r.position.y <= 0.25;

      if (!hit && enemies && enemies.length > 0) {
        for (let e of enemies) {
          if (e.isAlive && e.position.distanceTo(r.position) < 2.0) {
            hit = true;
            break;
          }
        }
      }

      if (hit) {
        explodedRockets.push(r.position.clone());
        this.scene.remove(r.mesh);
        r.mesh.traverse(child => {
          if (child.isMesh) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
          }
        });
        this.activeRockets.splice(i, 1);
        soundEngine.playExplosion();
      }
    }

    return {
      grenades: explodedGrenades,
      rockets: explodedRockets
    };
  }

  destroy() {
    this.activeGrenades.forEach(g => {
      this.scene.remove(g.mesh);
      if (g.mesh.geometry) g.mesh.geometry.dispose();
      if (g.mesh.material) g.mesh.material.dispose();
    });
    this.activeGrenades.length = 0;

    this.activeRockets.forEach(r => {
      this.scene.remove(r.mesh);
      r.mesh.traverse(child => {
        if (child.isMesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        }
      });
    });
    this.activeRockets.length = 0;

    if (this.gunGroup) {
      this.camera.remove(this.gunGroup);
      this.gunGroup.traverse(child => {
        if (child.isMesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
            else child.material.dispose();
          }
        }
      });
    }
  }
}

