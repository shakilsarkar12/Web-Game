// Player.js - Player controller with FPS, TPS, Top-Down perspectives, stamina sprint, jump, and collision physics
import * as THREE from 'three';
import { soundEngine } from '../audio/SoundEngine.js';

export class Player {
  constructor(camera, scene, world) {
    this.camera = camera;
    this.scene = scene;
    this.world = world;

    // Position & Physics - Spawn on open street
    this.position = new THREE.Vector3(0, 1.7, 12);
    this.velocity = new THREE.Vector3();
    this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');
    this.isGrounded = true;
    this.radius = 0.5;

    // Movement Speeds
    this.walkSpeed = 7.0;
    this.sprintSpeed = 12.0;
    this.jumpForce = 8.5;
    this.gravity = 22.0;

    // Stats & Perks
    this.health = 100;
    this.maxHealth = 100;
    this.armor = 50;
    this.maxArmor = 100;
    this.stamina = 100;
    this.maxStamina = 100;

    // Roguelite Perk Multipliers
    this.moveSpeedMult = 1.0;
    this.damageMult = 1.0;
    this.vampireLifesteal = 0;
    this.electricAmmo = false;

    // Audio Timers
    this.stepTimer = 0;
    this.heartbeatTimer = 0;

    // Perspectives: 'FPS', 'TPS', 'TOPDOWN'
    this.perspective = 'FPS';

    // Reusable math temporaries to eliminate per-frame allocations
    this._moveVector = new THREE.Vector3();
    this._nextPos = new THREE.Vector3();
    this._tpsOffset = new THREE.Vector3();
    this._tpsEuler = new THREE.Euler(0, 0, 0, 'YXZ');
    this._yAxis = new THREE.Vector3(0, 1, 0);

    // 3D Player Character Model (rendered in TPS & TopDown)
    this.characterMesh = this.buildPlayerMesh();
    this.scene.add(this.characterMesh);
    this.characterMesh.visible = false; // Hidden in FPS
  }


  buildPlayerMesh() {
    const group = new THREE.Group();

    // Military camo tactical vest & body
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x276749, roughness: 0.8 });
    const vestMat = new THREE.MeshStandardMaterial({ color: 0x1a202c, roughness: 0.6 });

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.45), bodyMat);
    torso.position.y = 1.25;
    group.add(torso);

    // Armor Plate
    const vest = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.65, 0.48), vestMat);
    vest.position.y = 1.3;
    group.add(vest);

    // Head with tactical helmet
    const headMat = new THREE.MeshStandardMaterial({ color: 0xd69e2e });
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), headMat);
    head.position.y = 1.95;
    group.add(head);

    const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.25, 0.46), vestMat);
    helmet.position.y = 2.12;
    group.add(helmet);

    // Arms
    const armMat = new THREE.MeshStandardMaterial({ color: 0x276749 });
    this.armL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.2), armMat);
    this.armL.position.set(-0.45, 1.25, 0);
    group.add(this.armL);

    this.armR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.2), armMat);
    this.armR.position.set(0.45, 1.25, 0);
    group.add(this.armR);

    // Legs
    const legMat = new THREE.MeshStandardMaterial({ color: 0x2d3748 });
    this.legL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.8, 0.25), legMat);
    this.legL.position.set(-0.2, 0.4, 0);
    group.add(this.legL);

    this.legR = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.8, 0.25), legMat);
    this.legR.position.set(0.2, 0.4, 0);
    group.add(this.legR);

    return group;
  }

  setPerspective(mode) {
    this.perspective = mode;
    this.characterMesh.visible = (mode !== 'FPS');
  }

  togglePerspective() {
    if (this.perspective === 'FPS') this.setPerspective('TPS');
    else if (this.perspective === 'TPS') this.setPerspective('TOPDOWN');
    else this.setPerspective('FPS');
    return this.perspective;
  }

  takeDamage(amount) {
    let remaining = amount;
    // Armor absorbs 50% first
    if (this.armor > 0) {
      const absorbed = Math.min(this.armor, Math.round(amount * 0.5));
      this.armor -= absorbed;
      remaining -= absorbed;
    }
    this.health = Math.max(0, this.health - remaining);
    return this.health <= 0;
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  addArmor(amount) {
    this.armor = Math.min(this.maxArmor, this.armor + amount);
  }

  update(delta, input) {
    // 1. Stamina Management
    const isSprinting = input.sprint && this.stamina > 10 && (input.moveForward || input.moveBackward || input.moveLeft || input.moveRight);
    if (isSprinting) {
      this.stamina = Math.max(0, this.stamina - 28 * delta);
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + 20 * delta);
    }

    const currentSpeed = (isSprinting ? this.sprintSpeed : this.walkSpeed) * this.moveSpeedMult;

    // 2. Mouse Look & Rotation
    if (input.mouseDeltaX || input.mouseDeltaY) {
      this.rotation.y -= input.mouseDeltaX * 0.0022;
      this.rotation.x -= input.mouseDeltaY * 0.0022;
      // Clamp vertical pitch (-85 to +85 degrees)
      this.rotation.x = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, this.rotation.x));
    }

    // 3. Horizontal Movement Calculation
    this._moveVector.set(0, 0, 0);
    if (input.moveForward) this._moveVector.z -= 1;
    if (input.moveBackward) this._moveVector.z += 1;
    if (input.moveLeft) this._moveVector.x -= 1;
    if (input.moveRight) this._moveVector.x += 1;

    if (this._moveVector.lengthSq() > 0) {
      this._moveVector.normalize();
      // Rotate by player's yaw
      this._moveVector.applyAxisAngle(this._yAxis, this.rotation.y);
      this._moveVector.multiplyScalar(currentSpeed * delta);

      // Check collision before moving
      this._nextPos.copy(this.position).add(this._moveVector);
      if (!this.world.checkCollision(this._nextPos, this.radius)) {
        this.position.add(this._moveVector);
      } else {
        // Try sliding along X or Z individually
        this._nextPos.set(this.position.x + this._moveVector.x, this.position.y, this.position.z);
        if (!this.world.checkCollision(this._nextPos, this.radius)) {
          this.position.x += this._moveVector.x;
        }
        this._nextPos.set(this.position.x, this.position.y, this.position.z + this._moveVector.z);
        if (!this.world.checkCollision(this._nextPos, this.radius)) {
          this.position.z += this._moveVector.z;
        }
      }
    }

    // 4. Jump & Gravity
    if (input.jump && this.isGrounded) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
    }

    this.velocity.y -= this.gravity * delta;
    this.position.y += this.velocity.y * delta;

    // Ground floor check
    if (this.position.y <= 1.7) {
      this.position.y = 1.7;
      this.velocity.y = 0;
      this.isGrounded = true;
    }

    // 5. Update Camera according to Perspective
    if (this.perspective === 'FPS') {
      this.camera.position.copy(this.position);
      this.camera.quaternion.setFromEuler(this.rotation);
      this.characterMesh.visible = false;
    } else if (this.perspective === 'TPS') {
      // Over-the-shoulder third-person
      this.characterMesh.visible = true;
      this.characterMesh.position.set(this.position.x, this.position.y - 1.7, this.position.z);
      this.characterMesh.rotation.y = this.rotation.y;

      this._tpsOffset.set(0.9, 0.4, 3.2);
      this._tpsEuler.set(this.rotation.x * 0.4, this.rotation.y, 0, 'YXZ');
      this._tpsOffset.applyEuler(this._tpsEuler);
      this.camera.position.copy(this.position).add(this._tpsOffset);
      this.camera.quaternion.setFromEuler(this.rotation);
    } else if (this.perspective === 'TOPDOWN') {
      // Isometric tactical birds-eye
      this.characterMesh.visible = true;
      this.characterMesh.position.set(this.position.x, this.position.y - 1.7, this.position.z);
      this.characterMesh.rotation.y = this.rotation.y;

      this.camera.position.set(this.position.x, this.position.y + 16, this.position.z + 10);
      this.camera.lookAt(this.position.x, this.position.y, this.position.z);
    }

    // 6. Limb Walking Animation for TPS / Top-Down View
    const isMoving = this._moveVector.lengthSq() > 0;
    if (this.characterMesh && this.characterMesh.visible) {
      if (isMoving) {
        this.walkAnimTime = (this.walkAnimTime || 0) + delta * (isSprinting ? 14 : 9);
        const legSwing = Math.sin(this.walkAnimTime) * 0.65;
        if (this.legL) this.legL.rotation.x = legSwing;
        if (this.legR) this.legR.rotation.x = -legSwing;
        if (this.armL) this.armL.rotation.x = -legSwing * 0.6;
        if (this.armR) this.armR.rotation.x = legSwing * 0.6;
      } else {
        if (this.legL) this.legL.rotation.x = 0;
        if (this.legR) this.legR.rotation.x = 0;
        if (this.armL) this.armL.rotation.x = 0;
        if (this.armR) this.armR.rotation.x = 0;
      }
    }

    // 7. Audio: Footsteps & Low HP Heartbeat
    if (isMoving) {
      this.stepTimer += delta;
      if (this.stepTimer >= (isSprinting ? 0.24 : 0.38)) {
        soundEngine.playFootstep();
        this.stepTimer = 0;
      }
    } else {
      this.stepTimer = 0;
    }

    if (this.health > 0 && this.health <= 30) {
      this.heartbeatTimer += delta;
      if (this.heartbeatTimer >= 0.9) {
        soundEngine.playHeartbeat();
        this.heartbeatTimer = 0;
      }
    }

    return {
      isMoving,
      isSprinting
    };
  }

  destroy() {
    if (this.characterMesh) {
      this.scene.remove(this.characterMesh);
      this.characterMesh.traverse(child => {
        if (child.isMesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
            else child.material.dispose();
          }
        }
      });
      this.characterMesh = null;
    }
  }
}

