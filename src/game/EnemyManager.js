// EnemyManager.js - Wave director, 5 enemy classes, spatial grid optimization, procedural animations, and combat AI
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

    // Reusable math temporaries (zero allocations in hot loop)
    this._toPlayer = new THREE.Vector3();
    this._moveStep = new THREE.Vector3();
    this._lookTarget = new THREE.Vector3();
    this._pushVec = new THREE.Vector3();
    this._tempPos = new THREE.Vector3();

    // Lightweight spatial hash / grid for fast enemy separation
    this.cellSize = 4.0;
    this.spatialGrid = new Map();

    // Shared resources for toxic slime projectiles
    this.slimeGeo = new THREE.SphereGeometry(0.25, 8, 8);
    this.slimeMat = new THREE.MeshBasicMaterial({ color: 0x48bb78 });
    this.slimePool = [];

    // Active death timeout tracker for leak-free cancellations
    this.deathTimers = new Set();
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
    const spawnX = spawnPt.x + (Math.random() - 0.5) * 8;
    const spawnZ = spawnPt.z + (Math.random() - 0.5) * 8;

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

    group.position.set(spawnX, 0, spawnZ);
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

  nextWave() {
    this.startWave(this.currentWave + 1);
  }

  // Populate spatial hash grid for active enemies
  buildSpatialGrid() {
    this.spatialGrid.clear();
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (!e.isAlive) continue;

      const cx = Math.floor(e.position.x / this.cellSize);
      const cz = Math.floor(e.position.z / this.cellSize);
      const key = `${cx},${cz}`;

      let cell = this.spatialGrid.get(key);
      if (!cell) {
        cell = [];
        this.spatialGrid.set(key, cell);
      }
      cell.push(e);
    }
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
          soundEngine.playBossRoar();
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
      let hasAlive = false;
      for (let i = 0; i < this.enemies.length; i++) {
        if (this.enemies[i].isAlive) {
          hasAlive = true;
          break;
        }
      }

      if (this.enemiesRemainingToSpawn <= 0 && !hasAlive) {
        this.waveState = 'COMPLETED';
        if (this.onWaveComplete) {
          this.onWaveComplete(this.currentWave);
        }
      }
    }

    // 2. Build Spatial Grid for O(1) local neighbor lookups
    this.buildSpatialGrid();

    // 3. Enemy AI, Movement & Combat
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (!e.isAlive) continue;

      e.animTime += delta * e.speed * 2.5;

      // Direction vector to player
      this._toPlayer.subVectors(playerPosition, e.position);
      const dist = this._toPlayer.length();
      this._toPlayer.y = 0;
      if (dist > 0.001) this._toPlayer.normalize();

      // Look at player
      this._lookTarget.set(playerPosition.x, e.position.y, playerPosition.z);
      e.mesh.lookAt(this._lookTarget);

      // Procedural walking animation
      const swing = Math.sin(e.animTime) * 0.6;
      e.legL.rotation.x = swing;
      e.legR.rotation.x = -swing;
      e.armL.rotation.x = -swing;
      e.armR.rotation.x = swing;

      // Enemy behavior by type
      if (e.type === 'BOSS') {
        // Boss Enrage at 50% HP
        const hpRatio = e.hp / e.maxHp;
        if (hpRatio <= 0.5 && !e.isEnraged) {
          e.isEnraged = true;
          e.speed = e.typeData.speed * 1.35;
          soundEngine.playBossRoar();
          e.mesh.traverse(c => {
            if (c.isMesh && c.material && c.material.color) {
              c.material.color.setHex(0xb91c1c);
            }
          });
        }

        // Periodic Ground Slam Shockwave Attack
        e.lastSlamTime = e.lastSlamTime || 0;
        if (now - e.lastSlamTime > 5.5 && dist < 12) {
          e.lastSlamTime = now;
          if (particleSystem) {
            particleSystem.spawnShockwave(e.position);
          }
          soundEngine.playBossSlam();
          if (dist < 6) {
            onPlayerDamaged(30);
          }
        }
      }

      if (e.type === 'SPITTER' && dist < 16 && dist > 7) {
        // Spitter keeps distance and shoots toxic balls
        if (now - e.lastAttackTime > e.typeData.attackCooldown) {
          e.lastAttackTime = now;
          this.shootToxicSlime(e.position, playerPosition);
        }
      } else {
        // Chase player
        if (dist > e.typeData.attackRange) {
          this._moveStep.copy(this._toPlayer).multiplyScalar(e.speed * delta);
          e.position.add(this._moveStep);

          // Fast spatial grid neighbor separation check (only checks 3x3 adjacent cells)
          const cx = Math.floor(e.position.x / this.cellSize);
          const cz = Math.floor(e.position.z / this.cellSize);

          for (let ox = -1; ox <= 1; ox++) {
            for (let oz = -1; oz <= 1; oz++) {
              const cellKey = `${cx + ox},${cz + oz}`;
              const neighbors = this.spatialGrid.get(cellKey);
              if (!neighbors) continue;

              for (let n = 0; n < neighbors.length; n++) {
                const other = neighbors[n];
                if (other === e || !other.isAlive) continue;

                const dx = e.position.x - other.position.x;
                const dz = e.position.z - other.position.z;
                const dSq = dx * dx + dz * dz;

                if (dSq < 1.44 && dSq > 0.0001) { // 1.2m radius
                  const d = Math.sqrt(dSq);
                  const pushStrength = (1.2 - d) * 0.06;
                  e.position.x += (dx / d) * pushStrength;
                  e.position.z += (dz / d) * pushStrength;
                }
              }
            }
          }
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

    // 4. Update Toxic Slime Projectiles
    for (let pIdx = this.enemyProjectiles.length - 1; pIdx >= 0; pIdx--) {
      const proj = this.enemyProjectiles[pIdx];
      proj.mesh.position.addScaledVector(proj.velocity, delta);
      proj.life -= delta;

      // Check hit player
      const distToPlayer = proj.mesh.position.distanceTo(playerPosition);
      if (distToPlayer < 1.4) {
        onPlayerDamaged(proj.damage);
        soundEngine.playPlayerHurt();
        this.recycleToxicSlime(proj);
        this.enemyProjectiles.splice(pIdx, 1);
        continue;
      }

      // Check expire or ground hit
      if (proj.life <= 0 || proj.mesh.position.y <= 0.1) {
        if (particleSystem) {
          particleSystem.spawnAcidSplash(proj.mesh.position);
        }
        this.recycleToxicSlime(proj);
        this.enemyProjectiles.splice(pIdx, 1);
      }
    }
  }

  shootToxicSlime(fromPos, toPlayerPos) {
    let proj = null;
    if (this.slimePool.length > 0) {
      proj = this.slimePool.pop();
      proj.mesh.visible = true;
      proj.mesh.position.copy(fromPos);
      proj.mesh.position.y += 1.6;
      proj.life = 3.5;
    } else {
      const mesh = new THREE.Mesh(this.slimeGeo, this.slimeMat);
      mesh.position.copy(fromPos);
      mesh.position.y += 1.6;
      this.scene.add(mesh);
      proj = {
        mesh,
        velocity: new THREE.Vector3(),
        damage: 20,
        life: 3.5
      };
    }

    this._toPlayer.subVectors(toPlayerPos, proj.mesh.position).normalize();
    proj.velocity.copy(this._toPlayer).multiplyScalar(18);
    this.enemyProjectiles.push(proj);
  }

  recycleToxicSlime(proj) {
    proj.mesh.visible = false;
    if (this.slimePool.length < 15) {
      this.slimePool.push(proj);
    } else {
      this.scene.remove(proj.mesh);
    }
  }

  // Apply damage to an enemy
  damageEnemy(enemy, amount, isHeadshot, onEnemyKilled, particleSystem, knockbackDir = null, onDamageText = null) {
    if (!enemy.isAlive) return;

    enemy.hp -= amount;
    soundEngine.playHitmarker(isHeadshot);

    if (onDamageText) {
      this._tempPos.copy(enemy.position);
      this._tempPos.y += 1.8;
      onDamageText({
        pos: this._tempPos.clone(),
        amount,
        isHeadshot
      });
    }

    // Physical Knockback impulse
    if (knockbackDir) {
      this._pushVec.copy(knockbackDir).normalize().multiplyScalar(2.0);
      this._pushVec.y = 0;
      enemy.position.add(this._pushVec);
    }

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

    // Death tilt animation
    enemy.mesh.rotation.x = Math.PI / 2;
    enemy.position.y = 0.2;

    const timerId = setTimeout(() => {
      this.deathTimers.delete(timerId);
      this.disposeEnemy(enemy);
      const idx = this.enemies.indexOf(enemy);
      if (idx !== -1) {
        this.enemies.splice(idx, 1);
      }
    }, 1200);

    this.deathTimers.add(timerId);

    // Trigger reward & drop
    onEnemyKilled(enemy, isHeadshot);
  }

  disposeEnemy(enemy) {
    if (!enemy || !enemy.mesh) return;
    this.scene.remove(enemy.mesh);
    enemy.mesh.traverse(child => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });
    enemy.mesh = null;
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
    const explosionRadiusSq = explosionRadius * explosionRadius;

    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.isAlive) {
        const dx = e.position.x - barrel.position.x;
        const dz = e.position.z - barrel.position.z;
        const dSq = dx * dx + dz * dz;
        if (dSq <= explosionRadiusSq) {
          const d = Math.sqrt(dSq);
          const falloff = 1 - d / explosionRadius;
          const dmg = Math.round(300 * falloff);
          this.damageEnemy(e, dmg, false, onEnemyKilled, particleSystem);
        }
      }
    }

    // Remove barrel mesh
    this.scene.remove(barrel.mesh);
  }

  destroy() {
    // Clear all pending death timeouts
    this.deathTimers.forEach(id => clearTimeout(id));
    this.deathTimers.clear();

    // Clean up all enemies and their meshes/geometries/materials
    this.enemies.forEach(e => this.disposeEnemy(e));
    this.enemies.length = 0;

    // Clean up projectiles and pool
    this.enemyProjectiles.forEach(p => {
      this.scene.remove(p.mesh);
    });
    this.enemyProjectiles.length = 0;

    this.slimePool.forEach(p => {
      this.scene.remove(p.mesh);
    });
    this.slimePool.length = 0;

    if (this.slimeGeo) this.slimeGeo.dispose();
    if (this.slimeMat) this.slimeMat.dispose();

    this.spatialGrid.clear();
  }
}
