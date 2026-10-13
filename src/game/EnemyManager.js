// EnemyManager.js - Wave director, 5 enemy classes, procedural walking animations, and combat AI
import * as THREE from 'three';
import { soundEngine } from '../audio/SoundEngine.js';

export const ENEMY_TYPES = {
  GHOUL: {
    id: 'ghoul',
    name: 'Street Ghoul',
    hp: 80,
    speed: 3.8,
    damage: 15,
    attackRange: 1.8,
    attackCooldown: 1.2,
    reward: 20,
    color: 0x4a5568,
    scale: 1.0
  },
  RUNNER: {
    id: 'runner',
    name: 'Rabid Crawler',
    hp: 45,
    speed: 6.8,
    damage: 12,
    attackRange: 1.6,
    attackCooldown: 0.8,
    reward: 30,
    color: 0x742a2a,
    scale: 0.85
  },
  SPITTER: {
    id: 'spitter',
    name: 'Toxic Spitter',
    hp: 110,
    speed: 2.8,
    damage: 22,
    attackRange: 18.0, // Ranged attacks
    attackCooldown: 2.4,
    reward: 45,
    color: 0x276749,
    scale: 1.1
  },
  BRUTE: {
    id: 'brute',
    name: 'Dhaka Titan',
    hp: 420,
    speed: 2.2,
    damage: 38,
    attackRange: 2.4,
    attackCooldown: 1.8,
    reward: 80,
    color: 0x2d3748,
    scale: 1.65
  },
  BOSS: {
    id: 'boss',
    name: 'GULSHAN NIGHTMARE',
    hp: 1400,
    speed: 3.2,
    damage: 50,
    attackRange: 3.2,
    attackCooldown: 1.5,
    reward: 350,
    color: 0x1a202c,
    scale: 2.4
  }
};

export class EnemyManager {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.enemies = [];
    this.enemyProjectiles = [];

    // Wave parameters
    this.currentWave = 1;
    this.enemiesRemainingToSpawn = 0;
    this.waveSpawnTimer = 0;
    this.waveState = 'PREPARING'; // 'PREPARING', 'ACTIVE', 'COMPLETED'
    this.waveIntermissionTimer = 3.0;

    // Outer spawn points in Dhaka streets
    this.spawnPoints = [
      new THREE.Vector3(0, 0, -65),
      new THREE.Vector3(0, 0, 65),
      new THREE.Vector3(-65, 0, 0),
      new THREE.Vector3(65, 0, 0),
      new THREE.Vector3(-45, 0, -45),
      new THREE.Vector3(45, 0, -45),
      new THREE.Vector3(-45, 0, 45),
      new THREE.Vector3(45, 0, 45)
    ];
  }

  startWave(waveNumber) {
    this.currentWave = waveNumber;
    this.waveState = 'ACTIVE';

    // Calculate count & compositions
    const baseCount = 6 + waveNumber * 4;
    this.enemiesRemainingToSpawn = baseCount;
    soundEngine.playWaveStart();
  }

  spawnEnemy(typeKey) {
    const type = ENEMY_TYPES[typeKey] || ENEMY_TYPES.GHOUL;
    const spawnPt = this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)];

    // Randomize slightly around spawn point
    const pos = new THREE.Vector3(
      spawnPt.x + (Math.random() - 0.5) * 8,
      0,
      spawnPt.z + (Math.random() - 0.5) * 8
    );

    // 3D Enemy Mesh Group
    const group = new THREE.Group();
    const s = type.scale;

    // Torso
    const torsoMat = new THREE.MeshStandardMaterial({ color: type.color, roughness: 0.7 });
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7 * s, 1.0 * s, 0.45 * s), torsoMat);
    torso.position.y = 1.3 * s;
    group.add(torso);

    // Head
    const headMat = new THREE.MeshStandardMaterial({ color: 0x1a202c, roughness: 0.5 });
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5 * s, 0.5 * s, 0.5 * s), headMat);
    head.position.y = 2.05 * s;
    group.add(head);

    // Glowing Red/Green Demonic Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: typeKey === 'SPITTER' ? 0x48bb78 : 0xf56565 });
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.06 * s, 6, 6), eyeMat);
    eyeL.position.set(-0.14 * s, 2.1 * s, 0.26 * s);
    group.add(eyeL);

    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.06 * s, 6, 6), eyeMat);
    eyeR.position.set(0.14 * s, 2.1 * s, 0.26 * s);
    group.add(eyeR);

    // Left Arm & Right Arm (for procedural attack & walk swing)
    const armMat = new THREE.MeshStandardMaterial({ color: type.color });
    const armGeo = new THREE.BoxGeometry(0.22 * s, 0.8 * s, 0.22 * s);

    const armL = new THREE.Mesh(armGeo, armMat);
    armL.position.set(-0.48 * s, 1.2 * s, 0);
    group.add(armL);

    const armR = new THREE.Mesh(armGeo, armMat);
    armR.position.set(0.48 * s, 1.2 * s, 0);
    group.add(armR);

    // Left Leg & Right Leg
    const legGeo = new THREE.BoxGeometry(0.25 * s, 0.9 * s, 0.25 * s);
    const legL = new THREE.Mesh(legGeo, torsoMat);
    legL.position.set(-0.22 * s, 0.45 * s, 0);
    group.add(legL);

    const legR = new THREE.Mesh(legGeo, torsoMat);
    legR.position.set(0.22 * s, 0.45 * s, 0);
    group.add(legR);

    group.position.copy(pos);
    this.scene.add(group);

    const enemy = {
      id: Math.random().toString(36).substring(7),
      type: typeKey,
      typeData: type,
      mesh: group,
      position: group.position,
      armL,
      armR,
      legL,
      legR,
      hp: type.hp,
      maxHp: type.hp,
      speed: type.speed,
      damage: type.damage,
      isAlive: true,
      lastAttackTime: 0,
      animTime: Math.random() * 10
    };

    this.enemies.push(enemy);
  }

  update(delta, playerPosition, onPlayerDamaged, onEnemyKilled, particleSystem) {
    const now = performance.now() * 0.001;

    // 1. Spawning Logic during Active Wave
    if (this.waveState === 'ACTIVE') {
      this.waveSpawnTimer -= delta;
      if (this.waveSpawnTimer <= 0 && this.enemiesRemainingToSpawn > 0) {
        this.waveSpawnTimer = Math.max(0.6, 2.2 - this.currentWave * 0.15);

        // Pick enemy type based on wave
        let typeToSpawn = 'GHOUL';
        const rand = Math.random();

        if (this.currentWave >= 5 && this.enemiesRemainingToSpawn === 1) {
          typeToSpawn = 'BOSS'; // Spawn Boss on wave 5, 10, etc.
        } else if (this.currentWave >= 4 && rand < 0.2) {
          typeToSpawn = 'BRUTE';
        } else if (this.currentWave >= 3 && rand < 0.35) {
          typeToSpawn = 'SPITTER';
        } else if (this.currentWave >= 2 && rand < 0.5) {
          typeToSpawn = 'RUNNER';
        }

        this.spawnEnemy(typeToSpawn);
        this.enemiesRemainingToSpawn--;
      }

      // Check if all spawned and all dead
      if (this.enemiesRemainingToSpawn <= 0 && this.enemies.every(e => !e.isAlive)) {
        this.waveState = 'COMPLETED';
        this.waveIntermissionTimer = 4.0;
      }
    } else if (this.waveState === 'COMPLETED') {
      this.waveIntermissionTimer -= delta;
      if (this.waveIntermissionTimer <= 0) {
        this.startWave(this.currentWave + 1);
      }
    }

    // 2. Enemy AI, Movement & Combat
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (!e.isAlive) continue;

      e.animTime += delta * e.speed * 2.5;

      // Direction vector to player
      const toPlayer = new THREE.Vector3().subVectors(playerPosition, e.position);
      const dist = toPlayer.length();
      toPlayer.y = 0;
      toPlayer.normalize();

      // Look at player
      e.mesh.lookAt(new THREE.Vector3(playerPosition.x, e.position.y, playerPosition.z));

      // Procedural walking animation
      const swing = Math.sin(e.animTime) * 0.6;
      e.legL.rotation.x = swing;
      e.legR.rotation.x = -swing;
      e.armL.rotation.x = -swing;
      e.armR.rotation.x = swing;

      // Enemy behavior by type
      if (e.type === 'SPITTER' && dist < 16 && dist > 7) {
        // Spitter keeps distance and shoots toxic balls
        if (now - e.lastAttackTime > e.typeData.attackCooldown) {
          e.lastAttackTime = now;
          this.shootToxicSlime(e.position, playerPosition);
        }
      } else {
        // Chase player
        if (dist > e.typeData.attackRange) {
          const moveStep = toPlayer.clone().multiplyScalar(e.speed * delta);
          const nextPos = e.position.clone().add(moveStep);

          // Separation check from other enemies
          for (let j = 0; j < this.enemies.length; j++) {
            if (i !== j && this.enemies[j].isAlive) {
              const other = this.enemies[j];
              const d = e.position.distanceTo(other.position);
              if (d < 1.2) {
                const push = new THREE.Vector3().subVectors(e.position, other.position).normalize().multiplyScalar(0.04);
                nextPos.add(push);
              }
            }
          }

          e.position.copy(nextPos);
        } else {
          // In attack range - Melee Attack
          if (now - e.lastAttackTime > e.typeData.attackCooldown) {
            e.lastAttackTime = now;
            // Attack animation (arm swipe forward)
            e.armL.rotation.x = -Math.PI / 2;
            e.armR.rotation.x = -Math.PI / 2;

            onPlayerDamaged(e.damage);
            soundEngine.playZombieSound('hit');
          }
        }
      }
    }

    // 3. Update Toxic Slime Projectiles
    for (let pIdx = this.enemyProjectiles.length - 1; pIdx >= 0; pIdx--) {
      const proj = this.enemyProjectiles[pIdx];
      proj.mesh.position.addScaledVector(proj.velocity, delta);
      proj.life -= delta;

      // Check hit player
      const distToPlayer = proj.mesh.position.distanceTo(playerPosition);
      if (distToPlayer < 1.4) {
        onPlayerDamaged(proj.damage);
        soundEngine.playPlayerHurt();
        this.scene.remove(proj.mesh);
        this.enemyProjectiles.splice(pIdx, 1);
        continue;
      }

      // Check expire or ground hit
      if (proj.life <= 0 || proj.mesh.position.y <= 0.1) {
        if (particleSystem) {
          particleSystem.spawnAcidSplash(proj.mesh.position);
        }
        this.scene.remove(proj.mesh);
        this.enemyProjectiles.splice(pIdx, 1);
      }
    }
  }

  shootToxicSlime(fromPos, toPlayerPos) {
    const geo = new THREE.SphereGeometry(0.25, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: 0x48bb78 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(fromPos);
    mesh.position.y += 1.6;
    this.scene.add(mesh);

    const dir = new THREE.Vector3().subVectors(toPlayerPos, mesh.position).normalize();
    const velocity = dir.multiplyScalar(18);

    this.enemyProjectiles.push({
      mesh,
      velocity,
      damage: 20,
      life: 3.5
    });
  }

  // Apply damage to an enemy
  damageEnemy(enemy, amount, isHeadshot, onEnemyKilled, particleSystem) {
    if (!enemy.isAlive) return;

    enemy.hp -= amount;
    soundEngine.playHitmarker(isHeadshot);

    // Flash white on hit
    enemy.mesh.traverse(child => {
      if (child.isMesh && child.material && child.material.color) {
        const origColor = child.material.color.getHex();
        child.material.color.setHex(0xffffff);
        setTimeout(() => {
          if (child && child.material) child.material.color.setHex(origColor);
        }, 60);
      }
    });

    if (enemy.hp <= 0) {
      this.killEnemy(enemy, isHeadshot, onEnemyKilled, particleSystem);
    }
  }

  killEnemy(enemy, isHeadshot, onEnemyKilled, particleSystem) {
    enemy.isAlive = false;
    soundEngine.playZombieSound('death');

    // Spawn explosion / dissolve particles
    if (particleSystem) {
      particleSystem.spawnDeathParticles(enemy.position, enemy.typeData.color);
    }

    // Death tilt animation and removal
    enemy.mesh.rotation.x = Math.PI / 2;
    enemy.position.y = 0.2;

    setTimeout(() => {
      this.scene.remove(enemy.mesh);
    }, 1200);

    // Trigger reward & drop
    onEnemyKilled(enemy, isHeadshot);
  }

  // Explode explosive barrel in area
  detonateBarrel(barrel, particleSystem, onEnemyKilled) {
    if (barrel.isExploded) return;
    barrel.isExploded = true;
    soundEngine.playExplosion();

    if (particleSystem) {
      particleSystem.spawnExplosion(barrel.position);
    }

    // Damage enemies in 12m radius
    const explosionRadius = 12;
    for (let e of this.enemies) {
      if (e.isAlive) {
        const d = e.position.distanceTo(barrel.position);
        if (d <= explosionRadius) {
          const falloff = 1 - d / explosionRadius;
          const dmg = Math.round(300 * falloff);
          this.damageEnemy(e, dmg, false, onEnemyKilled, particleSystem);
        }
      }
    }

    // Remove barrel mesh
    this.scene.remove(barrel.mesh);
  }
}
