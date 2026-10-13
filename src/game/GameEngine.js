// GameEngine.js - Core Three.js runtime orchestrating world, player, combat, AI, and HUD events
import * as THREE from 'three';
import { World } from './World.js';
import { Player } from './Player.js';
import { WeaponSystem } from './WeaponSystem.js';
import { EnemyManager } from './EnemyManager.js';
import { ParticleSystem } from './ParticleSystem.js';
import { DropManager } from './DropManager.js';
import { soundEngine } from '../audio/SoundEngine.js';

export class GameEngine {
  constructor(canvasContainer, uiCallbacks) {
    this.container = canvasContainer;
    this.uiCallbacks = uiCallbacks; // { setStats, addHitmarker, showWaveBanner, onGameOver, etc. }

    // State
    this.isRunning = false;
    this.isPaused = false;
    this.score = 0;
    this.takaCoins = 150; // Starting money
    this.kills = 0;
    this.headshots = 0;

    // Animation frame tracking for leak-free cancel
    this.animFrameId = null;

    // Driveable CNG Auto-Rickshaw state
    this.isDrivingCNG = false;

    // Floating Combat RPG text markers
    this.floatingTexts = [];

    // Monsoon Weather & Tong Dokan Steam Timers
    this.lightningTimer = 0;
    this.steamTimer = 0;

    // Killstreak combo tracker
    this.killStreak = 0;
    this.lastKillTime = 0;

    // Reusable math temporaries to eliminate per-frame allocations
    this._projVector = new THREE.Vector3();
    this._cngCamOffset = new THREE.Vector3();
    this._cngLookTarget = new THREE.Vector3();
    this._shakeOffset = new THREE.Vector3();
    this._yAxis = new THREE.Vector3(0, 1, 0);

    // High-performance HUD update throttling (15Hz regular stats, instant on combat changes)
    this.hudUpdateTimer = 0;
    this.hudUpdateInterval = 0.066; // ~15 FPS React UI sync
    this.hudDirty = true;

    // Graphics Quality setting
    this.graphicsQuality = 'high';

    // Clock
    this.clock = new THREE.Clock();


    // Input state
    this.input = {
      moveForward: false,
      moveBackward: false,
      moveLeft: false,
      moveRight: false,
      jump: false,
      sprint: false,
      isShooting: false,
      mouseDeltaX: 0,
      mouseDeltaY: 0
    };

    this.initThree();
    this.initGameSystems();
    this.bindEvents();
  }

  initThree() {
    // 1. Scene - "Bright Cinematic Urban Survival — Dhaka After Rain"
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x8fa6b5);
    this.scene.fog = new THREE.FogExp2(0x8fa6b5, 0.007);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      500
    );
    this.scene.add(this.camera);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.container.appendChild(this.renderer.domElement);
  }

  initGameSystems() {
    this.world = new World(this.scene);
    this.player = new Player(this.camera, this.scene, this.world);
    this.weaponSystem = new WeaponSystem(this.camera, this.scene);
    this.particles = new ParticleSystem(this.scene);
    this.drops = new DropManager(this.scene);
    this.enemyManager = new EnemyManager(this.scene, this.world);
    this.enemyManager.onWaveComplete = (wave) => {
      this.isPaused = true;
      if (document.exitPointerLock) document.exitPointerLock();
      if (this.uiCallbacks.onWaveComplete) {
        this.uiCallbacks.onWaveComplete(wave);
      }
    };
  }

  startNextWave() {
    this.isPaused = false;
    this.enemyManager.nextWave();
    this.uiCallbacks.showWaveBanner(
      this.enemyManager.currentWave,
      `ওয়েভ ${this.enemyManager.currentWave} শুরু হয়েছে!`
    );
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.requestPointerLock();
    }
  }

  start() {
    this.isRunning = true;
    this.clock.start();
    soundEngine.ensureContext();
    soundEngine.startMusic();

    // Start wave 1
    this.enemyManager.startWave(1);
    this.uiCallbacks.showWaveBanner(1, '৫ জন শত্রু আসছে (Wave 1 incoming)');

    this.animate();
  }

  bindEvents() {
    this.onKeyDown = this.handleKeyDown.bind(this);
    this.onKeyUp = this.handleKeyUp.bind(this);
    this.onMouseDown = this.handleMouseDown.bind(this);
    this.onMouseUp = this.handleMouseUp.bind(this);
    this.onMouseMove = this.handleMouseMove.bind(this);
    this.onResize = this.handleResize.bind(this);
    this.onContextMenu = e => e.preventDefault();

    this.onRequestLock = () => {
      if (this.isRunning && !this.isPaused && document.pointerLockElement !== this.renderer.domElement) {
        this.renderer.domElement.requestPointerLock();
      }
    };

    this.onWindowClick = (e) => {
      if (this.isRunning && !this.isPaused && !e.target.closest('button, .modal, [role="dialog"]')) {
        this.onRequestLock();
      }
    };

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('resize', this.onResize);
    window.addEventListener('click', this.onWindowClick);

    this.renderer.domElement.addEventListener('contextmenu', this.onContextMenu);
    this.renderer.domElement.addEventListener('click', this.onRequestLock);
    if (this.container) this.container.addEventListener('click', this.onRequestLock);
  }

  setGraphicsQuality(preset = 'high') {
    this.graphicsQuality = preset;
    if (!this.renderer) return;

    if (preset === 'low') {
      this.renderer.setPixelRatio(1.0);
      this.renderer.shadowMap.enabled = false;
    } else if (preset === 'medium') {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.BasicShadowMap;
    } else {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFShadowMap;
    }

    if (this.scene) {
      this.scene.background.setHex(0x8fa6b5);
      if (this.scene.fog) {
        this.scene.fog.color.setHex(0x8fa6b5);
        this.scene.fog.density = 0.007;
      }
    }

    if (this.world) {
      this.world.applyGraphicsQuality(preset);
    }
  }


  handleKeyDown(e) {
    if (!this.isRunning) return;

    const key = (e.key || '').toLowerCase();

    // Movement: WASD or Arrow Keys
    if (e.code === 'KeyW' || key === 'w' || e.code === 'ArrowUp') {
      this.input.moveForward = true;
    } else if (e.code === 'KeyS' || key === 's' || e.code === 'ArrowDown') {
      this.input.moveBackward = true;
    } else if (e.code === 'KeyA' || key === 'a' || e.code === 'ArrowLeft') {
      this.input.moveLeft = true;
    } else if (e.code === 'KeyD' || key === 'd' || e.code === 'ArrowRight') {
      this.input.moveRight = true;
    } else if (e.code === 'Space' || key === ' ') {
      this.input.jump = true;
    } else if (e.shiftKey || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      this.input.sprint = true;
    }

    // Weapon switching (1, 2, 3, 4, 5)
    if (e.code === 'Digit1' || key === '1') this.weaponSystem.switchWeapon('RIFLE');
    if (e.code === 'Digit2' || key === '2') this.weaponSystem.switchWeapon('SHOTGUN');
    if (e.code === 'Digit3' || key === '3') this.weaponSystem.switchWeapon('SMG');
    if (e.code === 'Digit4' || key === '4') this.weaponSystem.switchWeapon('SNIPER');
    if (e.code === 'Digit5' || key === '5') this.weaponSystem.switchWeapon('ROCKET');

    // Driveable Green CNG Auto-Rickshaw [E]
    if (e.code === 'KeyE' || key === 'e') {
      if (!this.isDrivingCNG) {
        if (this.world.driveableCNG) {
          const d = this.player.position.distanceTo(this.world.driveableCNG.position);
          if (d < 5.5) {
            this.isDrivingCNG = true;
            this.world.driveableCNG.isOccupied = true;
            soundEngine.startCNGEngine();
            this.uiCallbacks.showNotification('🚗 সিএনজিতে উঠেছেন! [WASD] ড্রাইভ | [H] হর্ন | [E] প্রস্থান');
          } else {
            this.uiCallbacks.showNotification('সিএনজির কাছে এসে [E] চাপুন');
          }
        }
      } else {
        this.isDrivingCNG = false;
        if (this.world.driveableCNG) {
          this.world.driveableCNG.isOccupied = false;
          this.player.position.set(
            this.world.driveableCNG.position.x + 2.0,
            1.7,
            this.world.driveableCNG.position.z
          );
        }
        soundEngine.stopCNGEngine();
        this.uiCallbacks.showNotification('সিএনজি থেকে প্রস্থান করেছেন');
      }
    }

    // Reload
    if (e.code === 'KeyR' || key === 'r') this.weaponSystem.reload();

    // Quick Melee Kick / Combat Strike [F]
    if (e.code === 'KeyF' || key === 'f') {
      const dir = new THREE.Vector3();
      this.camera.getWorldDirection(dir);
      const meleeHits = this.weaponSystem.melee(
        performance.now() * 0.001,
        this.player.position,
        dir,
        this.enemyManager.enemies,
        this.particles
      );
      if (meleeHits && meleeHits.length > 0) {
        meleeHits.forEach(h => {
          this.enemyManager.damageEnemy(
            h.enemy,
            h.damage,
            false,
            (en, hs) => this.handleEnemyKilled(en, hs),
            this.particles,
            h.knockbackDir,
            d => this.addFloatingDamageText({ ...d, type: 'kick' })
          );
          this.uiCallbacks.addHitmarker(h.damage, false);
        });
        this.uiCallbacks.showNotification('মেটাল কিক স্ট্রাইক! (-৭৫ ড্যামেজ)');
      }
    }

    // Grenade
    if (e.code === 'KeyG' || key === 'g') {
      const dir = new THREE.Vector3();
      this.camera.getWorldDirection(dir);
      this.weaponSystem.throwGrenade(this.player.position, dir, this.world);
    }

    // Camera Perspective Switch
    if (e.code === 'KeyV' || key === 'v') {
      const newMode = this.player.togglePerspective();
      this.uiCallbacks.showNotification(`Camera: ${newMode}`);
    }

    // Dhaka Horn / Rickshaw Bell [H]
    if (e.code === 'KeyH' || key === 'h') {
      if (this.isDrivingCNG) {
        soundEngine.playCNGHorn();
        this.uiCallbacks.showNotification('🚨 সিএনজি হর্ন! (পিপ পিপ)');
      } else {
        soundEngine.playRickshawBell();
        this.uiCallbacks.showNotification('ঢাকাইয়া রিকশার ঘণ্টা! (Tring Tring)');
      }
    }

    // Open Supply Shop (B)
    if (e.code === 'KeyB' || key === 'b') {
      this.toggleShop();
    }

    // Pause Game (Escape / P)
    if (e.code === 'KeyP' || key === 'p' || e.code === 'Escape') {
      this.togglePause();
    }
  }

  handleKeyUp(e) {
    const key = (e.key || '').toLowerCase();

    if (e.code === 'KeyW' || key === 'w' || e.code === 'ArrowUp') this.input.moveForward = false;
    if (e.code === 'KeyS' || key === 's' || e.code === 'ArrowDown') this.input.moveBackward = false;
    if (e.code === 'KeyA' || key === 'a' || e.code === 'ArrowLeft') this.input.moveLeft = false;
    if (e.code === 'KeyD' || key === 'd' || e.code === 'ArrowRight') this.input.moveRight = false;
    if (e.code === 'Space' || key === ' ') this.input.jump = false;
    if (!e.shiftKey) this.input.sprint = false;
  }

  handleMouseDown(e) {
    if (!this.isRunning || this.isPaused) return;

    if (e.button === 0) {
      // Left Click: Shoot
      this.input.isShooting = true;
      this.fireActiveWeapon();
    } else if (e.button === 2) {
      // Right Click: ADS Aim
      this.weaponSystem.setADS(true);
    }
  }

  handleMouseUp(e) {
    if (e.button === 0) {
      this.input.isShooting = false;
    } else if (e.button === 2) {
      this.weaponSystem.setADS(false);
    }
  }

  handleMouseMove(e) {
    if (document.pointerLockElement === this.renderer.domElement) {
      this.input.mouseDeltaX = e.movementX || 0;
      this.input.mouseDeltaY = e.movementY || 0;
    }
  }

  handleResize() {
    if (!this.container || !this.renderer) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      if (document.exitPointerLock) document.exitPointerLock();
    } else {
      this.clock.getDelta(); // flush delta
    }
    this.uiCallbacks.onPauseChange(this.isPaused);
  }

  toggleShop() {
    this.isPaused = true;
    if (document.exitPointerLock) document.exitPointerLock();
    this.uiCallbacks.onShopToggle(true);
  }

  fireActiveWeapon() {
    const time = performance.now() * 0.001;
    const hits = this.weaponSystem.shoot(
      time,
      this.enemyManager.enemies,
      this.world.explosiveBarrels,
      this.particles
    );

    if (hits && hits.length > 0) {
      hits.forEach(hit => {
        if (hit.type === 'enemy') {
          // Electric Ammo Perk Chain Lightning
          if (this.player.electricAmmo) {
            soundEngine.playElectricZap();
            for (let other of this.enemyManager.enemies) {
              if (other !== hit.enemy && other.isAlive && other.position.distanceTo(hit.enemy.position) < 9) {
                this.particles.spawnLightningChain(hit.enemy.position, other.position);
                this.enemyManager.damageEnemy(
                  other,
                  30,
                  false,
                  (en, hs) => this.handleEnemyKilled(en, hs),
                  this.particles
                );
              }
            }
          }

          const finalDmg = Math.round(hit.damage * this.player.damageMult);
          this.enemyManager.damageEnemy(
            hit.enemy,
            finalDmg,
            hit.isHeadshot,
            (enemy, headshot) => this.handleEnemyKilled(enemy, headshot),
            this.particles,
            null,
            d => this.addFloatingDamageText(d)
          );

          this.uiCallbacks.addHitmarker(finalDmg, hit.isHeadshot);
        } else if (hit.type === 'barrel') {
          this.enemyManager.detonateBarrel(
            hit.target,
            this.particles,
            (enemy, headshot) => this.handleEnemyKilled(enemy, headshot)
          );
        }
      });
    }
  }

  addFloatingDamageText({ pos, amount, isHeadshot, type = 'normal' }) {
    let color = '#f8fafc';
    let text = `-${amount}`;
    if (isHeadshot) {
      color = '#facc15';
      text = `-${amount} CRIT!`;
    } else if (type === 'kick') {
      color = '#38bdf8';
      text = `-${amount} 🥋`;
    } else if (type === 'rocket' || type === 'grenade') {
      color = '#fb923c';
      text = `-${amount} 💥`;
    } else if (type === 'cng') {
      color = '#f43f5e';
      text = `-${amount} 🚗`;
    }

    this.floatingTexts.push({
      id: Math.random().toString(36).substring(2, 9),
      pos: pos ? pos.clone() : new THREE.Vector3(),
      text,
      color,
      isHeadshot,
      life: 0.85,
      maxLife: 0.85
    });
  }

  handleEnemyKilled(enemy, isHeadshot) {
    this.kills++;
    if (isHeadshot) this.headshots++;

    // Multikill combo streak
    const now = performance.now() * 0.001;
    if (now - this.lastKillTime < 3.2) {
      this.killStreak++;
    } else {
      this.killStreak = 1;
    }
    this.lastKillTime = now;

    if (this.killStreak >= 2) {
      const titles = {
        2: '🔥 ডাবল কিল! (DOUBLE KILL)',
        3: '⚡ ট্রিপল কিল! (TRIPLE KILL)',
        4: '💥 কোয়াড কিল! (QUAD KILL)',
        5: '👑 ঢাকাইয়া ডমিনেটর! (DOMINATOR)'
      };
      const title = titles[Math.min(5, this.killStreak)] || `🏆 ${this.killStreak}x স্ট্রিক!`;
      soundEngine.playKillstreak(this.killStreak);
      if (this.uiCallbacks.showCombo) {
        this.uiCallbacks.showCombo(this.killStreak, title);
      }
    }

    // Vampire Perk Lifesteal
    if (this.player.vampireLifesteal > 0) {
      this.player.heal(this.player.vampireLifesteal);
    }

    const baseReward = enemy.typeData.reward;
    const reward = isHeadshot ? Math.round(baseReward * 1.5) : baseReward;
    this.takaCoins += reward;
    this.score += reward * 10;

    // Drop loot at death position
    this.drops.spawnDrop(enemy.position);

    this.uiCallbacks.showNotification(`+৳${reward} ${enemy.typeData.name} eliminated!`);
  }

  handlePlayerDamaged(amount) {
    const isDead = this.player.takeDamage(amount);
    soundEngine.playPlayerHurt();

    if (isDead) {
      this.handleGameOver();
    }
  }

  handleCollectDrop(type) {
    if (type === 'COIN') {
      const reward = 50;
      this.takaCoins += reward;
      this.score += 500;
      this.uiCallbacks.showNotification(`+৳${reward} কুড়িয়ে পেয়েছেন!`);
    } else if (type === 'HEALTH') {
      this.player.heal(45);
      this.uiCallbacks.showNotification('+৪৫ স্বাস্থ্য পূরণ (First Aid)');
    } else if (type === 'AMMO') {
      Object.keys(this.weaponSystem.ammo).forEach(k => {
        this.weaponSystem.ammo[k].reserve += this.weaponSystem.weapons[k].magSize * 2;
      });
      this.weaponSystem.grenades = Math.min(6, this.weaponSystem.grenades + 2);
      this.uiCallbacks.showNotification('গোলাবারুদ ও গ্রেনেড রিফিল হয়েছে!');
    } else if (type === 'POWERUP_NUKE') {
      // Obliterate all active enemies
      this.enemyManager.enemies.forEach(e => {
        if (e.isAlive) {
          this.enemyManager.damageEnemy(e, 9999, false, (en, hs) => this.handleEnemyKilled(en, hs), this.particles);
        }
      });
      soundEngine.playExplosion();
      this.uiCallbacks.showNotification('🚨 পারমাণবিক বিস্ফোরণ! সব শত্রু ধ্বংস!');
    }
  }

  handleGameOver() {
    this.isRunning = false;
    if (document.exitPointerLock) document.exitPointerLock();
    soundEngine.stopMusic();

    this.uiCallbacks.onGameOver({
      score: this.score,
      kills: this.kills,
      headshots: this.headshots,
      wave: this.enemyManager.currentWave,
      takaCoins: this.takaCoins
    });
  }

  animate() {
    if (!this.isRunning) return;
    this.animFrameId = requestAnimationFrame(this.animate.bind(this));

    if (this.isPaused) return;

    const delta = Math.min(this.clock.getDelta(), 0.1);

    // 1. Update Player / Driveable CNG Auto-Rickshaw
    let playerStatus = { isMoving: false, isSprinting: false };

    if (this.isDrivingCNG && this.world.driveableCNG) {
      // CNG Driving mode: hide first-person gun
      this.weaponSystem.gunGroup.visible = false;

      this.world.driveableCNG.update(delta, this.input);
      soundEngine.updateCNGEnginePitch(Math.abs(this.world.driveableCNG.speed));

      // Sync player coordinates
      this.player.position.copy(this.world.driveableCNG.position);

      // Third-Person Follow Camera behind CNG (reusing vectors)
      const cngRot = this.world.driveableCNG.rotation.y;
      this._cngCamOffset.set(0, 2.8, -6.5).applyAxisAngle(this._yAxis, cngRot);
      this.camera.position.copy(this.world.driveableCNG.position).add(this._cngCamOffset);

      this._cngLookTarget.set(0, 1.4, 6.0).applyAxisAngle(this._yAxis, cngRot).add(this.world.driveableCNG.position);
      this.camera.lookAt(this._cngLookTarget);

      // Roadkill Collision with Enemies
      if (Math.abs(this.world.driveableCNG.speed) > 2.8) {
        for (let i = 0; i < this.enemyManager.enemies.length; i++) {
          const e = this.enemyManager.enemies[i];
          if (e.isAlive && e.position.distanceTo(this.world.driveableCNG.position) < 2.6) {
            const roadkillDmg = Math.round(Math.abs(this.world.driveableCNG.speed) * 14);
            const kDir = new THREE.Vector3(0, 0, 1).applyAxisAngle(this._yAxis, cngRot);
            this.enemyManager.damageEnemy(
              e,
              roadkillDmg,
              false,
              (en, hs) => this.handleEnemyKilled(en, hs),
              this.particles,
              kDir,
              d => this.addFloatingDamageText({ ...d, type: 'cng' })
            );
            soundEngine.playCarImpact();
            this.particles.spawnBlood(e.position, kDir);
            this.uiCallbacks.showNotification('🚨 রোডকিল! সিএনজি ক্র্যাশ (+৳৫০)');
            this.hudDirty = true;
          }
        }
      }
    } else {
      // Normal On-Foot Movement: gun visible only in FPS
      this.weaponSystem.gunGroup.visible = (this.player.perspective === 'FPS');

      playerStatus = this.player.update(delta, this.input);

      // Continuous Automatic Fire
      if (this.input.isShooting && this.weaponSystem.currentWeapon.auto) {
        this.fireActiveWeapon();
      }
    }

    // 2. Update Weapons (Grenades, Meghna-RPG rockets)
    const weaponUpdates = this.weaponSystem.update(
      delta,
      this.input.mouseDeltaX,
      this.input.mouseDeltaY,
      playerStatus.isMoving,
      playerStatus.isSprinting,
      this.particles,
      this.enemyManager.enemies
    );

    // Reset mouse deltas after applying
    this.input.mouseDeltaX = 0;
    this.input.mouseDeltaY = 0;

    // Handle Grenade Detonations
    if (weaponUpdates && weaponUpdates.grenades && weaponUpdates.grenades.length > 0) {
      weaponUpdates.grenades.forEach(pos => {
        this.particles.spawnExplosion(pos);
        const radius = 10;
        for (let i = 0; i < this.enemyManager.enemies.length; i++) {
          const e = this.enemyManager.enemies[i];
          if (e.isAlive) {
            const d = e.position.distanceTo(pos);
            if (d <= radius) {
              const dmg = Math.round(250 * (1 - d / radius));
              const kDir = new THREE.Vector3().subVectors(e.position, pos).normalize();
              this.enemyManager.damageEnemy(
                e,
                dmg,
                false,
                (en, hs) => this.handleEnemyKilled(en, hs),
                this.particles,
                kDir,
                d2 => this.addFloatingDamageText({ ...d2, type: 'grenade' })
              );
            }
          }
        }
      });
      this.hudDirty = true;
    }

    // Handle Meghna-RPG Rocket Detonations
    if (weaponUpdates && weaponUpdates.rockets && weaponUpdates.rockets.length > 0) {
      weaponUpdates.rockets.forEach(pos => {
        this.particles.spawnExplosion(pos);
        this.weaponSystem.cameraShake = 0.55;
        const radius = 14;
        for (let i = 0; i < this.enemyManager.enemies.length; i++) {
          const e = this.enemyManager.enemies[i];
          if (e.isAlive) {
            const d = e.position.distanceTo(pos);
            if (d <= radius) {
              const dmg = Math.round(400 * (1 - d / radius));
              const kDir = new THREE.Vector3().subVectors(e.position, pos).normalize();
              this.enemyManager.damageEnemy(
                e,
                dmg,
                false,
                (en, hs) => this.handleEnemyKilled(en, hs),
                this.particles,
                kDir,
                d2 => this.addFloatingDamageText({ ...d2, type: 'rocket' })
              );
            }
          }
        }
      });
      this.hudDirty = true;
    }

    // 3. Update Enemy AI
    this.enemyManager.update(
      delta,
      this.player.position,
      dmg => this.handlePlayerDamaged(dmg),
      (en, hs) => this.handleEnemyKilled(en, hs),
      this.particles
    );

    // 4. Update Particles
    this.particles.update(delta);

    // 5. Update Loot Drops
    this.drops.update(delta, this.player.position, type => this.handleCollectDrop(type));

    // 6. Dynamic Weather & Atmospheric Steam
    this.lightningTimer += delta;
    if (this.lightningTimer > 26.0) {
      this.lightningTimer = 0;
      this.world.triggerLightning();
      if (this.uiCallbacks.triggerScreenLightning) {
        this.uiCallbacks.triggerScreenLightning();
      }
    }

    this.steamTimer += delta;
    if (this.steamTimer > 0.16) {
      this.steamTimer = 0;
      this.particles.spawnSteam(new THREE.Vector3(1.2, 2.0, 0.6));
    }

    // 7. Update Floating Combat RPG Text
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= delta;
      ft.pos.y += delta * 1.5;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
        this.hudDirty = true;
      }
    }

    // Apply zero-drift camera recoil & explosion shake
    if (this.weaponSystem.cameraShake > 0) {
      this._shakeOffset.set(
        (Math.random() - 0.5) * this.weaponSystem.cameraShake,
        (Math.random() - 0.5) * this.weaponSystem.cameraShake,
        0
      );
      this.camera.position.add(this._shakeOffset);
      this.weaponSystem.cameraShake = Math.max(0, this.weaponSystem.cameraShake - delta * 0.25);
    }

    // 8. Throttled React HUD state synchronization
    this.hudUpdateTimer += delta;
    const hasFloating = this.floatingTexts.length > 0;
    if (this.hudDirty || this.hudUpdateTimer >= this.hudUpdateInterval || hasFloating) {
      this.hudDirty = false;
      this.hudUpdateTimer = 0;
      this.dispatchHUDUpdate();
    }

    // 9. Render Three.js Scene
    this.renderer.render(this.scene, this.camera);
  }

  dispatchHUDUpdate() {
    const ammoState = this.weaponSystem.ammo[this.weaponSystem.currentWeaponKey];
    const distToCNG = this.world.driveableCNG ? this.player.position.distanceTo(this.world.driveableCNG.position) : 999;
    const canDriveCNG = distToCNG < 5.5 && !this.isDrivingCNG;

    // Project floating texts without vector allocations
    const projectedTexts = [];
    const w = window.innerWidth;
    const h = window.innerHeight;

    for (let i = 0; i < this.floatingTexts.length; i++) {
      const ft = this.floatingTexts[i];
      this._projVector.copy(ft.pos).project(this.camera);
      if (this._projVector.z > -1 && this._projVector.z < 1) {
        projectedTexts.push({
          id: ft.id,
          text: ft.text,
          x: (this._projVector.x * 0.5 + 0.5) * w,
          y: (-(this._projVector.y * 0.5) + 0.5) * h,
          opacity: Math.max(0, ft.life / ft.maxLife),
          color: ft.color,
          isCrit: ft.isHeadshot
        });
      }
    }

    // Gather active enemy coordinates for radar in a single loop
    let activeBoss = null;
    let aliveCount = 0;
    const enemyPositions = [];

    for (let i = 0; i < this.enemyManager.enemies.length; i++) {
      const e = this.enemyManager.enemies[i];
      if (e.isAlive) {
        aliveCount++;
        enemyPositions.push({ x: e.position.x, z: e.position.z });
        if (e.type === 'BOSS') {
          activeBoss = e;
        }
      }
    }

    this.uiCallbacks.setStats({
      health: Math.round(this.player.health),
      maxHealth: this.player.maxHealth,
      armor: Math.round(this.player.armor),
      stamina: Math.round(this.player.stamina),
      currentWeapon: this.weaponSystem.currentWeapon,
      ammo: ammoState.current,
      reserveAmmo: ammoState.reserve,
      grenades: this.weaponSystem.grenades,
      isReloading: this.weaponSystem.isReloading,
      isADS: this.weaponSystem.isADS,
      isDrivingCNG: this.isDrivingCNG,
      cngSpeed: this.world.driveableCNG ? Math.round(Math.abs(this.world.driveableCNG.speed) * 3.6) : 0,
      canDriveCNG,
      floatingTexts: projectedTexts,
      activeBoss,
      score: this.score,
      takaCoins: this.takaCoins,
      wave: this.enemyManager.currentWave,
      perspective: this.isDrivingCNG ? 'CNG DRIVE' : this.player.perspective,
      enemiesAlive: aliveCount,
      enemiesRemaining: this.enemyManager.enemiesRemainingToSpawn,
      playerPos: { x: this.player.position.x, z: this.player.position.z, rotY: this.player.rotation.y },
      enemies: enemyPositions
    });
  }

  destroy() {
    this.isRunning = false;

    // 1. Cancel animation frame
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    // 2. Stop audio
    soundEngine.stopMusic();
    soundEngine.stopCNGEngine();

    // 3. Remove event listeners
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('click', this.onWindowClick);

    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.removeEventListener('contextmenu', this.onContextMenu);
      this.renderer.domElement.removeEventListener('click', this.onRequestLock);
    }
    if (this.container && this.onRequestLock) {
      this.container.removeEventListener('click', this.onRequestLock);
    }

    // 4. Destroy subsystems
    if (this.particles) this.particles.destroy();
    if (this.enemyManager) this.enemyManager.destroy();
    if (this.drops) this.drops.destroy();
    if (this.player) this.player.destroy();
    if (this.weaponSystem) this.weaponSystem.destroy();
    if (this.world) this.world.destroy();

    // 5. Dispose WebGLRenderer
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
      this.renderer = null;
    }
  }
}

