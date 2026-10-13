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
    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x121722);
    this.scene.fog = new THREE.FogExp2(0x121722, 0.015);

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
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.container.appendChild(this.renderer.domElement);
  }

  initGameSystems() {
    this.world = new World(this.scene);
    this.player = new Player(this.camera, this.scene, this.world);
    this.weaponSystem = new WeaponSystem(this.camera, this.scene);
    this.particles = new ParticleSystem(this.scene);
    this.drops = new DropManager(this.scene);
    this.enemyManager = new EnemyManager(this.scene, this.world);
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

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('resize', this.onResize);

    // Context menu disable for right click aim
    this.renderer.domElement.addEventListener('contextmenu', e => e.preventDefault());

    // Pointer Lock
    const requestLock = () => {
      if (this.isRunning && !this.isPaused && document.pointerLockElement !== this.renderer.domElement) {
        this.renderer.domElement.requestPointerLock();
      }
    };
    this.renderer.domElement.addEventListener('click', requestLock);
    if (this.container) this.container.addEventListener('click', requestLock);
    window.addEventListener('click', (e) => {
      // If clicking outside modals/buttons, lock pointer
      if (this.isRunning && !this.isPaused && !e.target.closest('button, .modal, [role="dialog"]')) {
        requestLock();
      }
    });
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

    // Weapon switching (1, 2, 3, 4)
    if (e.code === 'Digit1' || key === '1') this.weaponSystem.switchWeapon('RIFLE');
    if (e.code === 'Digit2' || key === '2') this.weaponSystem.switchWeapon('SHOTGUN');
    if (e.code === 'Digit3' || key === '3') this.weaponSystem.switchWeapon('SMG');
    if (e.code === 'Digit4' || key === '4') this.weaponSystem.switchWeapon('SNIPER');

    // Reload
    if (e.code === 'KeyR' || key === 'r') this.weaponSystem.reload();

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

    // Rickshaw Horn / Bell for fun!
    if (e.code === 'KeyH' || key === 'h') {
      soundEngine.playRickshawBell();
      this.uiCallbacks.showNotification('ঢাকাইয়া রিকশার ঘণ্টা! (Tring Tring)');
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
          this.enemyManager.damageEnemy(
            hit.enemy,
            hit.damage,
            hit.isHeadshot,
            (enemy, headshot) => this.handleEnemyKilled(enemy, headshot),
            this.particles
          );

          this.uiCallbacks.addHitmarker(hit.damage, hit.isHeadshot);
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

  handleEnemyKilled(enemy, isHeadshot) {
    this.kills++;
    if (isHeadshot) this.headshots++;

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
    requestAnimationFrame(this.animate.bind(this));

    if (this.isPaused) return;

    const delta = Math.min(this.clock.getDelta(), 0.1);

    // 1. Update Player
    const playerStatus = this.player.update(delta, this.input);

    // 2. Continuous Automatic Fire
    if (this.input.isShooting && this.weaponSystem.currentWeapon.auto) {
      this.fireActiveWeapon();
    }

    // 3. Update Weapons
    const explodedGrenades = this.weaponSystem.update(
      delta,
      this.input.mouseDeltaX,
      this.input.mouseDeltaY,
      playerStatus.isMoving,
      playerStatus.isSprinting
    );

    // Reset mouse deltas after applying
    this.input.mouseDeltaX = 0;
    this.input.mouseDeltaY = 0;

    // Handle exploded grenades AOE damage
    if (explodedGrenades && explodedGrenades.length > 0) {
      explodedGrenades.forEach(pos => {
        this.particles.spawnExplosion(pos);
        const radius = 10;
        this.enemyManager.enemies.forEach(e => {
          if (e.isAlive) {
            const d = e.position.distanceTo(pos);
            if (d <= radius) {
              const dmg = Math.round(250 * (1 - d / radius));
              this.enemyManager.damageEnemy(e, dmg, false, (en, hs) => this.handleEnemyKilled(en, hs), this.particles);
            }
          }
        });
      });
    }

    // 4. Update Enemy AI
    this.enemyManager.update(
      delta,
      this.player.position,
      dmg => this.handlePlayerDamaged(dmg),
      (en, hs) => this.handleEnemyKilled(en, hs),
      this.particles
    );

    // 5. Update Particles
    this.particles.update(delta);

    // 6. Update Loot Drops
    this.drops.update(delta, this.player.position, type => this.handleCollectDrop(type));

    // 7. Update HUD state
    const ammoState = this.weaponSystem.ammo[this.weaponSystem.currentWeaponKey];
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
      score: this.score,
      takaCoins: this.takaCoins,
      wave: this.enemyManager.currentWave,
      perspective: this.player.perspective,
      enemiesAlive: this.enemyManager.enemies.filter(e => e.isAlive).length,
      enemiesRemaining: this.enemyManager.enemiesRemainingToSpawn,
      playerPos: { x: this.player.position.x, z: this.player.position.z, rotY: this.player.rotation.y },
      enemies: this.enemyManager.enemies.filter(e => e.isAlive).map(e => ({ x: e.position.x, z: e.position.z }))
    });

    // 8. Render Three.js Scene
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    this.isRunning = false;
    soundEngine.stopMusic();
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('resize', this.onResize);
    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
