// ParticleSystem.js - High-performance GPU-friendly particle effects
import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.tracers = [];
    this.rainDrops = null;
    this.isRainEnabled = false;

    this.initRainSystem();
  }

  initRainSystem() {
    const rainCount = 1800;
    const rainGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(rainCount * 3);

    for (let i = 0; i < rainCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 120;
      positions[i + 1] = Math.random() * 40;
      positions[i + 2] = (Math.random() - 0.5) * 120;
    }

    rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const rainMat = new THREE.PointsMaterial({
      color: 0x90cdf4,
      size: 0.18,
      transparent: true,
      opacity: 0.55
    });

    this.rainDrops = new THREE.Points(rainGeo, rainMat);
    this.rainDrops.visible = false;
    this.scene.add(this.rainDrops);
  }

  toggleRain(enabled) {
    this.isRainEnabled = enabled;
    if (this.rainDrops) {
      this.rainDrops.visible = enabled;
    }
  }

  // Bullet Tracers
  spawnTracer(startPos, direction, length = 80) {
    const endPos = startPos.clone().addScaledVector(direction, length);
    const points = [startPos, endPos];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.85 });
    const line = new THREE.Line(geo, mat);

    this.scene.add(line);
    this.tracers.push({ line, life: 0.05 });
  }

  // Blood Splatters
  spawnBlood(position, normal) {
    const count = 14;
    for (let i = 0; i < count; i++) {
      const geo = new THREE.SphereGeometry(0.045, 4, 4);
      const mat = new THREE.MeshBasicMaterial({ color: 0x9b2c2c });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(position);

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        Math.random() * 3 + 1,
        (Math.random() - 0.5) * 4
      );

      this.scene.add(mesh);
      this.particles.push({ mesh, velocity, life: 0.45, maxLife: 0.45, gravity: 9.8 });
    }
  }

  // Explosions (Grenades & Barrels)
  spawnExplosion(position) {
    // Fireball sparks
    const count = 45;
    for (let i = 0; i < count; i++) {
      const geo = new THREE.SphereGeometry(Math.random() * 0.2 + 0.1, 6, 6);
      const isFire = Math.random() > 0.3;
      const mat = new THREE.MeshBasicMaterial({
        color: isFire ? 0xdd6b20 : 0xecc94b
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(position);

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 16,
        Math.random() * 14 + 2,
        (Math.random() - 0.5) * 16
      );

      this.scene.add(mesh);
      this.particles.push({ mesh, velocity, life: 0.7, maxLife: 0.7, gravity: 8.0 });
    }
  }

  // Acid Splash
  spawnAcidSplash(position) {
    const count = 12;
    for (let i = 0; i < count; i++) {
      const geo = new THREE.SphereGeometry(0.08, 4, 4);
      const mat = new THREE.MeshBasicMaterial({ color: 0x48bb78 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(position);

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        Math.random() * 4 + 1,
        (Math.random() - 0.5) * 5
      );

      this.scene.add(mesh);
      this.particles.push({ mesh, velocity, life: 0.5, maxLife: 0.5, gravity: 9.0 });
    }
  }

  // Enemy Death Disintegration
  spawnDeathParticles(position, colorHex = 0x4a5568) {
    const count = 18;
    for (let i = 0; i < count; i++) {
      const geo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
      const mat = new THREE.MeshStandardMaterial({ color: colorHex });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(position);
      mesh.position.y += Math.random() * 1.5;

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        Math.random() * 5 + 1.5,
        (Math.random() - 0.5) * 6
      );

      this.scene.add(mesh);
      this.particles.push({ mesh, velocity, life: 0.6, maxLife: 0.6, gravity: 9.8 });
    }
  }

  update(delta) {
    // 1. Tracers decay
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      t.life -= delta;
      if (t.life <= 0) {
        this.scene.remove(t.line);
        this.tracers.splice(i, 1);
      }
    }

    // 2. Active physics particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;

      p.velocity.y -= p.gravity * delta;
      p.mesh.position.addScaledVector(p.velocity, delta);

      // Scale shrink
      const progress = p.life / p.maxLife;
      p.mesh.scale.setScalar(progress);

      if (p.life <= 0 || p.mesh.position.y < 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }

    // 3. Dhaka Monsoon Rain
    if (this.isRainEnabled && this.rainDrops) {
      const positions = this.rainDrops.geometry.attributes.position.array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] -= 32 * delta; // Fall speed
        if (positions[i] < 0) {
          positions[i] = 38; // Reset to top
        }
      }
      this.rainDrops.geometry.attributes.position.needsUpdate = true;
    }
  }
}
