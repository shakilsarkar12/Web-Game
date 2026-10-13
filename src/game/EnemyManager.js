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
    color: 0x3a483e, // Decayed diseased zombie greenish-charcoal (high contrast against daylight pavement)
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

  buildEnemyMesh(typeKey, type) {
    const s = type.scale;
    const root = new THREE.Group();

    // Archetype-specific color palettes and materials
    let skinColor = type.color;
    let clothColor = 0x1e293b;
    let eyeColor = 0xf87171;

    if (typeKey === 'GHOUL') {
      skinColor = 0x475549; // Decayed olive-grey flesh
      clothColor = 0x2b4c6f; // Dhaka traditional lungi blue
      eyeColor = 0xfb7185;
    } else if (typeKey === 'RUNNER') {
      skinColor = 0x7f1d1d; // Ferocious sinewy crimson
      clothColor = 0x450a0a;
      eyeColor = 0xfacc15; // Feral predatory yellow eyes
    } else if (typeKey === 'SPITTER') {
      skinColor = 0x274e2b; // Bile-toned pestilence green
      clothColor = 0x14532d;
      eyeColor = 0x4ade80; // Luminous toxic green eyes
    } else if (typeKey === 'BRUTE') {
      skinColor = 0x334155; // Concrete slate hide
      clothColor = 0x1e293b;
      eyeColor = 0xf97316; // Blazing molten amber eyes
    } else if (typeKey === 'BOSS') {
      skinColor = 0x18181b; // Obsidian demonic flesh
      clothColor = 0x7f1d1d;
      eyeColor = 0xef4444; // Demonic crimson eyes
    }

    const skinMat = new THREE.MeshStandardMaterial({
      color: skinColor,
      roughness: typeKey === 'SPITTER' ? 0.35 : 0.75,
      metalness: typeKey === 'BRUTE' ? 0.25 : 0.05
    });

    const clothMat = new THREE.MeshStandardMaterial({
      color: clothColor,
      roughness: 0.85
    });

    // 1. Torso Group (pivoted at hip height for natural sway and bounce)
    const torsoGroup = new THREE.Group();
    const hipY = 0.9 * s;
    torsoGroup.position.set(0, hipY, 0);
    root.add(torsoGroup);

    // Torso Dimensions by archetype
    let torsoWidth = 0.65 * s;
    let torsoHeight = 0.85 * s;
    let torsoDepth = 0.42 * s;

    if (typeKey === 'BRUTE') {
      torsoWidth = 1.15 * s;
      torsoHeight = 1.1 * s;
      torsoDepth = 0.65 * s;
    } else if (typeKey === 'BOSS') {
      torsoWidth = 1.05 * s;
      torsoHeight = 1.2 * s;
      torsoDepth = 0.6 * s;
    } else if (typeKey === 'RUNNER') {
      torsoWidth = 0.52 * s;
      torsoHeight = 0.72 * s;
      torsoDepth = 0.55 * s;
      torsoGroup.rotation.x = 0.35; // Hunched predatory forward posture
    }

    const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(torsoWidth, torsoHeight, torsoDepth), skinMat);
    torsoMesh.position.set(0, torsoHeight * 0.5, 0);
    torsoGroup.add(torsoMesh);

    // Dhaka Traditional Lungi Wrap for GHOUL
    let lungi = null;
    if (typeKey === 'GHOUL') {
      lungi = new THREE.Mesh(
        new THREE.BoxGeometry(0.72 * s, 0.52 * s, 0.48 * s),
        clothMat
      );
      lungi.position.set(0, 0.15 * s, 0);
      torsoGroup.add(lungi);
    }

    // Concrete Pauldron Armor & Rebar Spikes for BRUTE
    let pauldrons = [];
    if (typeKey === 'BRUTE') {
      const pauldronMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.85, metalness: 0.35 });
      const pauldronGeo = new THREE.BoxGeometry(0.48 * s, 0.32 * s, 0.58 * s);
      const pauldronL = new THREE.Mesh(pauldronGeo, pauldronMat);
      pauldronL.position.set(-0.68 * s, torsoHeight * 0.88, 0);
      pauldronL.rotation.z = -0.28;
      torsoGroup.add(pauldronL);

      const pauldronR = new THREE.Mesh(pauldronGeo, pauldronMat);
      pauldronR.position.set(0.68 * s, torsoHeight * 0.88, 0);
      pauldronR.rotation.z = 0.28;
      torsoGroup.add(pauldronR);

      pauldrons = [pauldronL, pauldronR];
    }

    // Pulsing Luminous Toxic Acid Sac on Chest for SPITTER
    let acidSac = null;
    if (typeKey === 'SPITTER') {
      const acidMat = new THREE.MeshStandardMaterial({
        color: 0x22c55e,
        emissive: 0x15803d,
        emissiveIntensity: 0.85,
        roughness: 0.2,
        transparent: true,
        opacity: 0.92
      });
      acidSac = new THREE.Mesh(new THREE.SphereGeometry(0.32 * s, 12, 10), acidMat);
      acidSac.position.set(0, torsoHeight * 0.6, 0.26 * s);
      torsoGroup.add(acidSac);
    }

    // Dorsal Spines / Blade Crests for RUNNER & BOSS
    let spines = [];
    if (typeKey === 'RUNNER' || typeKey === 'BOSS') {
      const spineMat = new THREE.MeshStandardMaterial({
        color: typeKey === 'BOSS' ? 0x991b1b : 0x1f2937,
        roughness: 0.5
      });
      const numSpines = typeKey === 'BOSS' ? 5 : 4;
      for (let sp = 0; sp < numSpines; sp++) {
        const spineCone = new THREE.Mesh(
          new THREE.ConeGeometry(0.08 * s, 0.32 * s, 5),
          spineMat
        );
        spineCone.rotation.x = -Math.PI / 3;
        spineCone.position.set(0, 0.2 * s + sp * 0.18 * s, -torsoDepth * 0.52);
        torsoGroup.add(spineCone);
        spines.push(spineCone);
      }
    }

    // 2. Head Group (pivoted at neck atop torso)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, torsoHeight, 0);
    torsoGroup.add(headGroup);

    let headSize = 0.42 * s;
    if (typeKey === 'BRUTE') headSize = 0.52 * s;
    if (typeKey === 'BOSS') headSize = 0.56 * s;
    if (typeKey === 'RUNNER') headSize = 0.38 * s;

    const headMat = new THREE.MeshStandardMaterial({
      color: typeKey === 'BOSS' ? 0x09090b : skinColor,
      roughness: 0.6
    });
    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(headSize, headSize, headSize), headMat);
    headMesh.position.set(0, headSize * 0.5, 0);
    headGroup.add(headMesh);

    // Glowing Demonic / Infected Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: eyeColor });
    const eyeRadius = 0.055 * s;
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(eyeRadius, 8, 8), eyeMat);
    eyeL.position.set(-headSize * 0.28, headSize * 0.55, headSize * 0.52);
    headGroup.add(eyeL);

    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(eyeRadius, 8, 8), eyeMat);
    eyeR.position.set(headSize * 0.28, headSize * 0.55, headSize * 0.52);
    headGroup.add(eyeR);

    // Articulated Lower Jaw (drops on attacks, roars, and slime spits)
    const jawMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.7 });
    const jaw = new THREE.Mesh(new THREE.BoxGeometry(headSize * 0.85, headSize * 0.22, headSize * 0.75), jawMat);
    jaw.position.set(0, headSize * 0.1, headSize * 0.15);
    headGroup.add(jaw);

    // Boss Demonic Curved Horns
    let horns = [];
    if (typeKey === 'BOSS') {
      const hornMat = new THREE.MeshStandardMaterial({
        color: 0x991b1b,
        emissive: 0x450a0a,
        roughness: 0.4
      });
      const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.12 * s, 0.65 * s, 6), hornMat);
      hornL.position.set(-headSize * 0.48, headSize * 0.95, -0.05 * s);
      hornL.rotation.z = 0.55;
      hornL.rotation.x = -0.25;
      headGroup.add(hornL);

      const hornR = new THREE.Mesh(new THREE.ConeGeometry(0.12 * s, 0.65 * s, 6), hornMat);
      hornR.position.set(headSize * 0.48, headSize * 0.95, -0.05 * s);
      hornR.rotation.z = -0.55;
      hornR.rotation.x = -0.25;
      headGroup.add(hornR);

      horns = [hornL, hornR];
    }

    // 3. Left & Right Arm Groups (pivoted at shoulder joints)
    const armWidth = (typeKey === 'BRUTE' ? 0.35 : 0.22) * s;
    const armLength = (typeKey === 'BRUTE' ? 0.95 : 0.82) * s;
    const armMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.7 });

    const armL = new THREE.Group();
    armL.position.set(-(torsoWidth * 0.5 + armWidth * 0.55), torsoHeight * 0.9, 0);
    const armLMesh = new THREE.Mesh(new THREE.BoxGeometry(armWidth, armLength, armWidth), armMat);
    armLMesh.position.set(0, -armLength * 0.5, 0);
    armL.add(armLMesh);
    torsoGroup.add(armL);

    const armR = new THREE.Group();
    armR.position.set(torsoWidth * 0.5 + armWidth * 0.55, torsoHeight * 0.9, 0);
    const armRMesh = new THREE.Mesh(new THREE.BoxGeometry(armWidth, armLength, armWidth), armMat);
    armRMesh.position.set(0, -armLength * 0.5, 0);
    armR.add(armRMesh);
    torsoGroup.add(armR);

    // Massive Stone Knuckles / Reinforced Fists for BRUTE
    if (typeKey === 'BRUTE') {
      const fistMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
      const fistL = new THREE.Mesh(new THREE.BoxGeometry(0.42 * s, 0.36 * s, 0.42 * s), fistMat);
      fistL.position.set(0, -armLength, 0);
      armL.add(fistL);

      const fistR = new THREE.Mesh(new THREE.BoxGeometry(0.42 * s, 0.36 * s, 0.42 * s), fistMat);
      fistR.position.set(0, -armLength, 0);
      armR.add(fistR);
    }

    // 4. Left & Right Leg Groups (pivoted at hip joints on root)
    const legWidth = (typeKey === 'BRUTE' ? 0.35 : 0.24) * s;
    const legLength = 0.9 * s;
    const legMat = new THREE.MeshStandardMaterial({ color: clothColor, roughness: 0.8 });

    const legL = new THREE.Group();
    legL.position.set(-torsoWidth * 0.28, hipY, 0);
    const legLMesh = new THREE.Mesh(new THREE.BoxGeometry(legWidth, legLength, legWidth), legMat);
    legLMesh.position.set(0, -legLength * 0.5, 0);
    legL.add(legLMesh);
    root.add(legL);

    const legR = new THREE.Group();
    legR.position.set(torsoWidth * 0.28, hipY, 0);
    const legRMesh = new THREE.Mesh(new THREE.BoxGeometry(legWidth, legLength, legWidth), legMat);
    legRMesh.position.set(0, -legLength * 0.5, 0);
    legR.add(legRMesh);
    root.add(legR);

    return {
      group: root,
      torsoGroup,
      torsoMesh,
      lungi,
      headGroup,
      headMesh,
      jaw,
      eyeL,
      eyeR,
      armL,
      armR,
      legL,
      legR,
      acidSac,
      spines,
      pauldrons,
      horns,
      baseTorsoY: hipY
    };
  }

  spawnEnemy(typeKey) {
    const type = ENEMY_TYPES[typeKey] || ENEMY_TYPES.GHOUL;
    const spawnPt = this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)];

    // Randomize slightly around spawn point
    const spawnX = spawnPt.x + (Math.random() - 0.5) * 8;
    const spawnZ = spawnPt.z + (Math.random() - 0.5) * 8;

    const meshData = this.buildEnemyMesh(typeKey, type);
    meshData.group.position.set(spawnX, 0, spawnZ);
    this.scene.add(meshData.group);

    const enemy = {
      id: Math.random().toString(36).substring(7),
      type: typeKey,
      typeData: type,
      mesh: meshData.group,
      position: meshData.group.position,
      torsoGroup: meshData.torsoGroup,
      headGroup: meshData.headGroup,
      jaw: meshData.jaw,
      acidSac: meshData.acidSac,
      spines: meshData.spines,
      horns: meshData.horns,
      armL: meshData.armL,
      armR: meshData.armR,
      legL: meshData.legL,
      legR: meshData.legR,
      baseTorsoY: meshData.baseTorsoY,
      hp: type.hp,
      maxHp: type.hp,
      speed: type.speed,
      damage: type.damage,
      isAlive: true,
      isDying: false,
      deathProgress: 0,
      deathFallDir: 1,
      flinchTimer: 0,
      attackTimer: 0,
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

      // Procedural Ragdoll Collapse on Death
      if (e.isDying) {
        e.deathProgress += delta * 1.35;
        const t = Math.min(1.0, e.deathProgress);

        // Hips drop to pavement
        e.mesh.position.y = THREE.MathUtils.lerp(0, 0.12 * e.typeData.scale, t);

        // Knees buckle
        e.legL.rotation.x = THREE.MathUtils.lerp(e.legL.rotation.x, -1.2, t);
        e.legR.rotation.x = THREE.MathUtils.lerp(e.legR.rotation.x, -1.1, t);

        // Torso collapses forward or backward based on knockback direction
        const targetTorsoX = (e.deathFallDir || 1) * 1.35;
        e.torsoGroup.rotation.x = THREE.MathUtils.lerp(e.torsoGroup.rotation.x, targetTorsoX, t);
        e.torsoGroup.rotation.z = THREE.MathUtils.lerp(e.torsoGroup.rotation.z, 0.45, t);

        // Arms go limp and splay outwards
        e.armL.rotation.x = THREE.MathUtils.lerp(e.armL.rotation.x, 0.6, t);
        e.armL.rotation.z = THREE.MathUtils.lerp(e.armL.rotation.z, -0.65, t);
        e.armR.rotation.x = THREE.MathUtils.lerp(e.armR.rotation.x, 0.6, t);
        e.armR.rotation.z = THREE.MathUtils.lerp(e.armR.rotation.z, 0.65, t);

        // Head droops
        if (e.headGroup) {
          e.headGroup.rotation.x = THREE.MathUtils.lerp(e.headGroup.rotation.x, 0.65, t);
        }
        continue;
      }

      if (!e.isAlive) continue;

      // Hit Flinch Recovery
      if (e.flinchTimer > 0) {
        e.flinchTimer -= delta;
        const flinchFactor = Math.sin(Math.max(0, e.flinchTimer / 0.18) * Math.PI);
        if (e.headGroup) e.headGroup.rotation.x = -flinchFactor * 0.45;
        if (e.torsoGroup) e.torsoGroup.rotation.x = -flinchFactor * 0.2;
      }

      // Attack Animation Timer
      if (e.attackTimer > 0) {
        e.attackTimer -= delta;
      }

      // Direction vector to player
      this._toPlayer.subVectors(playerPosition, e.position);
      const dist = this._toPlayer.length();
      this._toPlayer.y = 0;
      if (dist > 0.001) this._toPlayer.normalize();

      // Look at player
      this._lookTarget.set(playerPosition.x, e.position.y, playerPosition.z);
      e.mesh.lookAt(this._lookTarget);

      // Archetype-Specific Locomotion Animations
      e.animTime += delta * e.speed * (e.type === 'RUNNER' ? 3.2 : 2.0);

      if (e.type === 'GHOUL') {
        // Asymmetric shambling limp
        const swingL = Math.sin(e.animTime) * 0.65;
        const swingR = Math.sin(e.animTime + 0.3) * -0.55;
        e.legL.rotation.x = swingL;
        e.legR.rotation.x = swingR;
        e.armL.rotation.x = -swingL * 0.8;
        e.armR.rotation.x = -swingR * 0.8;

        // Torso roll and hip bob
        e.torsoGroup.rotation.z = Math.sin(e.animTime) * 0.1;
        e.torsoGroup.position.y = e.baseTorsoY + Math.abs(Math.sin(e.animTime)) * 0.06 * e.typeData.scale;
      } else if (e.type === 'RUNNER') {
        // Low predatory quadrupedal scuttling sprint
        const swing = Math.sin(e.animTime) * 0.85;
        e.legL.rotation.x = swing;
        e.legR.rotation.x = -swing;
        e.armL.rotation.x = -swing * 1.1;
        e.armR.rotation.x = swing * 1.1;

        e.torsoGroup.rotation.x = 0.45 + Math.sin(e.animTime * 2) * 0.08;
        e.torsoGroup.position.y = e.baseTorsoY + Math.abs(Math.sin(e.animTime)) * 0.05 * e.typeData.scale;
      } else if (e.type === 'SPITTER') {
        // Cautious stalking gait + pulsing acid sac
        const swing = Math.sin(e.animTime) * 0.5;
        e.legL.rotation.x = swing;
        e.legR.rotation.x = -swing;
        e.armL.rotation.x = -swing * 0.7;
        e.armR.rotation.x = swing * 0.7;

        if (e.acidSac) {
          const sacPulse = 1.0 + Math.sin(e.animTime * 3.5) * 0.12;
          e.acidSac.scale.set(sacPulse, sacPulse, sacPulse);
        }
      } else if (e.type === 'BRUTE') {
        // Heavy stomping walk with ground impact feel
        const swing = Math.sin(e.animTime) * 0.45;
        e.legL.rotation.x = swing;
        e.legR.rotation.x = -swing;
        e.armL.rotation.x = -swing * 0.6;
        e.armR.rotation.x = swing * 0.6;

        e.torsoGroup.rotation.z = Math.sin(e.animTime) * 0.12;
        e.torsoGroup.position.y = e.baseTorsoY + Math.abs(Math.sin(e.animTime)) * 0.08 * e.typeData.scale;
      } else if (e.type === 'BOSS') {
        // Authoritative intimidating demonic stride
        const swing = Math.sin(e.animTime) * 0.55;
        e.legL.rotation.x = swing;
        e.legR.rotation.x = -swing;
        e.armL.rotation.x = -swing * 0.75;
        e.armR.rotation.x = swing * 0.75;

        e.torsoGroup.rotation.z = Math.sin(e.animTime) * 0.08;
        e.torsoGroup.position.y = e.baseTorsoY + Math.abs(Math.sin(e.animTime)) * 0.1 * e.typeData.scale;
      }

      // Dynamic Attack Wind-Up, Slash, and Recovery
      if (e.attackTimer > 0) {
        const attackNorm = 1.0 - (e.attackTimer / 0.55); // 0 to 1
        if (attackNorm < 0.35) {
          // Wind-up: arms pull back, torso arches, jaw drops open
          const pullBack = -0.5 - attackNorm * 2.2;
          e.armL.rotation.x = pullBack;
          e.armR.rotation.x = pullBack;
          if (e.jaw) e.jaw.rotation.x = 0.35;
        } else {
          // Forward strike & recovery
          const strikeT = (attackNorm - 0.35) / 0.65;
          const strikeAngle = -Math.PI * 0.65 * (1.0 - strikeT);
          e.armL.rotation.x = strikeAngle;
          e.armR.rotation.x = strikeAngle;
          if (e.jaw) e.jaw.rotation.x = 0.35 * (1.0 - strikeT);
        }
      }

      // Enemy behavior by type
      if (e.type === 'BOSS') {
        // Boss Enrage at 50% HP
        const hpRatio = e.hp / e.maxHp;
        if (hpRatio <= 0.5 && !e.isEnraged) {
          e.isEnraged = true;
          e.speed = e.typeData.speed * 1.35;
          soundEngine.playBossRoar();
          e.mesh.traverse(c => {
            if (c.isMesh && c.material) {
              if (c.material.color) c.material.color.setHex(0xb91c1c);
              if (c.material.emissive) {
                c.material.emissive.setHex(0x7f1d1d);
                c.material.emissiveIntensity = 0.6;
              }
            }
          });
        }

        // Periodic Ground Slam Shockwave Attack
        e.lastSlamTime = e.lastSlamTime || 0;
        if (now - e.lastSlamTime > 5.5 && dist < 12) {
          e.lastSlamTime = now;
          e.attackTimer = 0.8;
          // Overhead dual arm slam wind-up
          e.armL.rotation.x = -2.6;
          e.armR.rotation.x = -2.6;
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
        // Spitter keeps distance and shoots toxic balls with regurgitation wind-up
        if (now - e.lastAttackTime > e.typeData.attackCooldown) {
          e.lastAttackTime = now;
          e.attackTimer = 0.5;
          if (e.acidSac) {
            e.acidSac.scale.set(1.4, 1.4, 1.4);
          }
          if (e.jaw) e.jaw.rotation.x = 0.45;
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
            e.attackTimer = 0.55;

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

    // Trigger hit flinch reaction
    enemy.flinchTimer = 0.18;

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
      enemy.deathFallDir = -1; // Fall backwards from knockback
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
    if (!enemy.isAlive && enemy.isDying) return; // Prevent double execution
    enemy.isAlive = false;
    enemy.isDying = true;
    enemy.deathProgress = 0;
    if (!enemy.deathFallDir) {
      enemy.deathFallDir = Math.random() > 0.4 ? 1 : -1;
    }

    soundEngine.playZombieSound('death');

    // Spawn explosion / dissolve particles
    if (particleSystem) {
      particleSystem.spawnDeathParticles(enemy.position, enemy.typeData.color);
    }

    const timerId = setTimeout(() => {
      this.deathTimers.delete(timerId);
      this.disposeEnemy(enemy);
      const idx = this.enemies.indexOf(enemy);
      if (idx !== -1) {
        this.enemies.splice(idx, 1);
      }
    }, 1200);

    this.deathTimers.add(timerId);

    // Trigger reward & drop immediately
    if (onEnemyKilled) {
      onEnemyKilled(enemy, isHeadshot);
    }
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
