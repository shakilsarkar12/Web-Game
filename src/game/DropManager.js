// DropManager.js - Loot drops: Taka Coins, Health Packs, Ammo Crates, and Tactical Powerups
import * as THREE from 'three';
import { soundEngine } from '../audio/SoundEngine.js';

export const DROP_TYPES = {
  COIN: { id: 'coin', label: '৳ Taka Coin', color: 0xecc94b, pickupRadius: 1.8 },
  HEALTH: { id: 'health', label: 'First Aid Kit', color: 0x48bb78, pickupRadius: 2.0 },
  AMMO: { id: 'ammo', label: 'Ammo Supply', color: 0x3182ce, pickupRadius: 2.0 },
  POWERUP_NUKE: { id: 'nuke', label: 'Tactical Nuke', color: 0xe53e3e, pickupRadius: 2.2 }
};

export class DropManager {
  constructor(scene) {
    this.scene = scene;
    this.drops = [];
  }

  spawnDrop(position, forcedType = null) {
    let typeKey = forcedType;
    if (!typeKey) {
      const rand = Math.random();
      if (rand < 0.55) typeKey = 'COIN';
      else if (rand < 0.78) typeKey = 'AMMO';
      else if (rand < 0.94) typeKey = 'HEALTH';
      else typeKey = 'POWERUP_NUKE';
    }

    const type = DROP_TYPES[typeKey];
    const group = new THREE.Group();

    if (typeKey === 'COIN') {
      // Golden coin
      const geo = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 16);
      const mat = new THREE.MeshStandardMaterial({ color: 0xecc94b, metalness: 0.9, roughness: 0.2 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = Math.PI / 2;
      group.add(mesh);
    } else if (typeKey === 'HEALTH') {
      // White health box with cross
      const geo = new THREE.BoxGeometry(0.5, 0.4, 0.3);
      const mat = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const box = new THREE.Mesh(geo, mat);
      group.add(box);

      const crossGeo = new THREE.BoxGeometry(0.3, 0.1, 0.32);
      const crossMat = new THREE.MeshBasicMaterial({ color: 0xe53e3e });
      const cross = new THREE.Mesh(crossGeo, crossMat);
      group.add(cross);
    } else if (typeKey === 'AMMO') {
      // Military green ammo tin
      const geo = new THREE.BoxGeometry(0.45, 0.35, 0.6);
      const mat = new THREE.MeshStandardMaterial({ color: 0x276749, roughness: 0.5 });
      const box = new THREE.Mesh(geo, mat);
      group.add(box);
    } else {
      // Nuke powerup (Red skull orb)
      const geo = new THREE.DodecahedronGeometry(0.4);
      const mat = new THREE.MeshBasicMaterial({ color: 0xe53e3e, wireframe: true });
      const orb = new THREE.Mesh(geo, mat);
      group.add(orb);
    }

    group.position.copy(position);
    group.position.y = 0.6;
    this.scene.add(group);

    this.drops.push({
      group,
      type: typeKey,
      typeData: type,
      life: 25.0 // Despawns after 25s
    });
  }

  update(delta, playerPos, onCollectDrop) {
    const time = performance.now() * 0.003;

    for (let i = this.drops.length - 1; i >= 0; i--) {
      const drop = this.drops[i];
      drop.life -= delta;

      // Spin & hover animation
      drop.group.rotation.y += 2.5 * delta;
      drop.group.position.y = 0.6 + Math.sin(time + i) * 0.12;

      // Check player proximity pickup
      const dist = drop.group.position.distanceTo(playerPos);
      if (dist <= drop.typeData.pickupRadius) {
        soundEngine.playCoinPickup();
        onCollectDrop(drop.type);

        this.scene.remove(drop.group);
        this.drops.splice(i, 1);
        continue;
      }

      // Despawn timeout
      if (drop.life <= 0) {
        this.scene.remove(drop.group);
        this.drops.splice(i, 1);
      }
    }
  }
}
