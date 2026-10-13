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
      SNIPER: { current: 5, reserve: 25 }
    };

    // Grenades
    this.grenades = 4;
    this.activeGrenades = [];

    // Weapon timing
    this.lastShotTime = 0;
    this.isReloading = false;
    this.reloadProgress = 0;
    this.isADS = false;

    // Weapon Sway, Recoil & Bobbing offsets
    this.recoilOffset = new THREE.Vector3(0, 0, 0);
    this.recoilRotation = new THREE.Vector3(0, 0, 0);
    this.swayOffset = new THREE.Vector3(0, 0, 0);
    this.bobOffset = new THREE.Vector3(0, 0, 0);

    // 3D Gun Group attached to camera
    this.gunGroup = new THREE.Group();
    this.camera.add(this.gunGroup);

    // Soft illumination light specifically for the held weapon
    const gunAmbient = new THREE.PointLight(0xffeedd, 1.2, 3);
    gunAmbient.position.set(0.1, 0.2, -0.2);
    this.gunGroup.add(gunAmbient);

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
    // --- 1. RIFLE (Thresher Mk II) ---
    const rifleGroup = new THREE.Group();
    const rifleMat = new THREE.MeshStandardMaterial({ color: 0x242b35, metalness: 0.8, roughness: 0.3 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8d5b36, roughness: 0.7 });

    // Main receiver
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.45), rifleMat);
    receiver.position.set(0, 0, 0);
    rifleGroup.add(receiver);

    // Wooden handguard
    const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 0.3), woodMat);
    handguard.position.set(0, -0.01, -0.32);
    rifleGroup.add(handguard);

    // Barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.55, 8), rifleMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.02, -0.42);
    rifleGroup.add(barrel);

    // Holographic Reflex Sight
    const sight = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.08), rifleMat);
    sight.position.set(0, 0.08, -0.05);
    rifleGroup.add(sight);

    const redDot = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff0033 }));
    redDot.position.set(0, 0.08, -0.05);
    rifleGroup.add(redDot);

    // Magazine
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.1), rifleMat);
    mag.position.set(0, -0.12, -0.08);
    mag.rotation.x = 0.25;
    rifleGroup.add(mag);

    this.gunMeshes.RIFLE = rifleGroup;
    this.gunGroup.add(rifleGroup);

    // --- 2. SHOTGUN (Shadhinota-12) ---
    const shotGroup = new THREE.Group();
    const shotMat = new THREE.MeshStandardMaterial({ color: 0x1f242d, metalness: 0.9, roughness: 0.2 });

    const shotBody = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.14, 0.5), shotMat);
    shotGroup.add(shotBody);

    const shotBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.6, 8), shotMat);
    shotBarrel.rotation.x = Math.PI / 2;
    shotBarrel.position.set(0, 0.04, -0.45);
    shotGroup.add(shotBarrel);

    const pump = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.2), new THREE.MeshStandardMaterial({ color: 0x3d4852 }));
    pump.position.set(0, -0.01, -0.35);
    shotGroup.add(pump);

    this.gunMeshes.SHOTGUN = shotGroup;
    this.gunGroup.add(shotGroup);

    // --- 3. SMG (Bengal Viper) ---
    const smgGroup = new THREE.Group();
    const smgMat = new THREE.MeshStandardMaterial({ color: 0x111620, metalness: 0.7, roughness: 0.4 });

    const smgBody = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 0.35), smgMat);
    smgGroup.add(smgBody);

    const smgMag = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.2, 0.07), smgMat);
    smgMag.position.set(0, -0.14, 0.02);
    smgGroup.add(smgMag);

    this.gunMeshes.SMG = smgGroup;
    this.gunGroup.add(smgGroup);

    // --- 4. SNIPER (Padma-50) ---
    const snipGroup = new THREE.Group();
    const snipMat = new THREE.MeshStandardMaterial({ color: 0x2b3748, metalness: 0.85, roughness: 0.3 });

    const snipBody = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.13, 0.65), snipMat);
    snipGroup.add(snipBody);

    const snipBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.85, 8), snipMat);
    snipBarrel.rotation.x = Math.PI / 2;
    snipBarrel.position.set(0, 0.03, -0.65);
    snipGroup.add(snipBarrel);

    // Long Scope
    const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 12), snipMat);
    scope.rotation.x = Math.PI / 2;
    scope.position.set(0, 0.1, -0.1);
    snipGroup.add(scope);

    this.gunMeshes.SNIPER = snipGroup;
    this.gunGroup.add(snipGroup);
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
    this.isADS = isAiming;
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

    // Muzzle flash
    this.muzzleLight.intensity = 4.0;
    this.muzzleLightTimer = 0.06;

    // Apply Recoil Kick
    const kickZ = this.isADS ? 0.06 : 0.12;
    const kickRot = this.isADS ? 0.04 : 0.09;
    this.recoilOffset.z = kickZ;
    this.recoilRotation.x = kickRot;

    // Raycast Shooting logic
    const hits = [];
    const origin = new THREE.Vector3();
    this.camera.getWorldPosition(origin);

    for (let p = 0; p < w.pellets; p++) {
      // Calculate spread direction
      const spreadFactor = this.isADS ? w.spread * 0.3 : w.spread;
      const spreadX = (Math.random() - 0.5) * spreadFactor;
      const spreadY = (Math.random() - 0.5) * spreadFactor;

      const dir = new THREE.Vector3(spreadX, spreadY, -1);
      dir.unproject(this.camera);
      dir.sub(origin).normalize();

      const raycaster = new THREE.Raycaster(origin, dir, 0.1, w.range);

      // 1. Check Explosive Barrels
      if (barrels && barrels.length > 0) {
        for (let b of barrels) {
          if (!b.isExploded) {
            const bIntersects = raycaster.intersectObject(b.mesh, false);
            if (bIntersects.length > 0) {
              hits.push({ type: 'barrel', target: b, point: bIntersects[0].point });
              break;
            }
          }
        }
      }

      // 2. Check Enemies
      if (enemies && enemies.length > 0) {
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

              // Blood splatter particle
              if (particleSystem) {
                particleSystem.spawnBlood(hitPoint, dir);
              }
              break;
            }
          }
        }
      }

      // Spawn bullet tracer particle
      if (particleSystem) {
        particleSystem.spawnTracer(origin, dir, w.range);
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

  update(delta, mouseDeltaX, mouseDeltaY, isMoving, isSprinting) {
    // 1. Muzzle Flash Decay
    if (this.muzzleLightTimer > 0) {
      this.muzzleLightTimer -= delta;
      if (this.muzzleLightTimer <= 0) {
        this.muzzleLight.intensity = 0;
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

    // 3. Recoil Recovery
    this.recoilOffset.lerp(new THREE.Vector3(0, 0, 0), delta * 12);
    this.recoilRotation.lerp(new THREE.Vector3(0, 0, 0), delta * 14);

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
      this.bobOffset.lerp(new THREE.Vector3(0, 0, 0), delta * 8);
    }

    // 6. ADS vs Hip-Fire Position Interpolation
    // Hip-fire default: bottom-right
    const hipPos = new THREE.Vector3(0.24, -0.22, -0.45);
    // ADS position: center aligned with camera
    const adsPos = new THREE.Vector3(0.0, -0.11, -0.32);

    const targetBasePos = this.isADS ? adsPos : hipPos;
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
        this.activeGrenades.splice(i, 1);
        soundEngine.playExplosion();
      }
    }

    return explodedGrenades;
  }
}
