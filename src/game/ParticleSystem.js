// ParticleSystem.js - High-performance GPU-friendly particle effects with object pooling
import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;

    // Active particle collections
    this.particles = [];
    this.tracers = [];
    this.shockwaves = [];

    // Rain system
    this.rainDrops = null;
    this.isRainEnabled = false;

    // Reusable math temporaries to eliminate per-frame garbage
    this._tempVec1 = new THREE.Vector3();
    this._tempVec2 = new THREE.Vector3();
    this._tempEuler = new THREE.Euler();

    // Shared Geometries & Materials (allocated once, never duplicated)
    this.initSharedResources();

    // Pools for zero-allocation reuse
    this.particlePool = []; // Available reusable mesh wrappers
    this.tracerPool = [];   // Available reusable tracer lines
    this.shockwavePool = []; // Available reusable shockwave meshes

    this.initRainSystem();
  }

  initSharedResources() {
    // 1. Geometries
    this.geomSphereTiny = new THREE.SphereGeometry(0.045, 4, 4);
    this.geomSphereSmall = new THREE.SphereGeometry(0.07, 4, 4);
    this.geomSphereMed = new THREE.SphereGeometry(0.08, 5, 5);
    this.geomSphereExplodeSmall = new THREE.SphereGeometry(0.12, 6, 6);
    this.geomSphereExplodeLarge = new THREE.SphereGeometry(0.24, 6, 6);
    this.geomBoxDebris = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    this.geomCasing = new THREE.CylinderGeometry(0.015, 0.015, 0.06, 6);
    this.geomRingShockwave = new THREE.RingGeometry(0.5, 0.8, 32);

    // 2. Materials
    this.matBlood = new THREE.MeshBasicMaterial({ color: 0x9b2c2c });
    this.matFire = new THREE.MeshBasicMaterial({ color: 0xdd6b20 });
    this.matSpark = new THREE.MeshBasicMaterial({ color: 0xecc94b });
    this.matAcid = new THREE.MeshBasicMaterial({ color: 0x48bb78 });
    this.matDust = new THREE.MeshBasicMaterial({ color: 0x718096, transparent: true, opacity: 0.8 });
    this.matImpactSpark = new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.85 });
    this.matCasing = new THREE.MeshStandardMaterial({ color: 0xd69e2e, metalness: 0.9, roughness: 0.2 });
    this.matSteam = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 });
    this.matRocketSmoke = new THREE.MeshBasicMaterial({ color: 0xcbd5e1, transparent: true, opacity: 0.5 });
    this.matShockwave = new THREE.MeshBasicMaterial({
      color: 0xf43f5e,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });

    this.matTracer = new THREE.LineBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.85 });
    this.matLightning = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.9 });

    // Cache for death particle materials by color to avoid duplicate instances
    this.deathMatCache = new Map();
  }

  getDeathMaterial(colorHex) {
    if (!this.deathMatCache.has(colorHex)) {
      this.deathMatCache.set(colorHex, new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.8 }));
    }
    return this.deathMatCache.get(colorHex);
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

  // Acquire or create a pooled Mesh particle
  acquireParticle(geo, mat) {
    let pObj = null;
    if (this.particlePool.length > 0) {
      pObj = this.particlePool.pop();
      pObj.mesh.geometry = geo;
      pObj.mesh.material = mat;
      pObj.mesh.visible = true;
      pObj.mesh.scale.set(1, 1, 1);
      pObj.mesh.rotation.set(0, 0, 0);
    } else {
      const mesh = new THREE.Mesh(geo, mat);
      this.scene.add(mesh);
      pObj = {
        mesh,
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 1,
        gravity: 9.8
      };
    }
    return pObj;
  }

  recycleParticle(pObj) {
    pObj.mesh.visible = false;
    // Cap pool size to prevent unbounded memory retention
    if (this.particlePool.length < 250) {
      this.particlePool.push(pObj);
    } else {
      this.scene.remove(pObj.mesh);
    }
  }

  // Bullet Tracers with reusable Line pool
  spawnTracer(startPos, direction, length = 80) {
    this._tempVec1.copy(startPos).addScaledVector(direction, length);

    let tObj = null;
    if (this.tracerPool.length > 0) {
      tObj = this.tracerPool.pop();
      const posAttr = tObj.line.geometry.attributes.position;
      posAttr.setXYZ(0, startPos.x, startPos.y, startPos.z);
      posAttr.setXYZ(1, this._tempVec1.x, this._tempVec1.y, this._tempVec1.z);
      posAttr.needsUpdate = true;
      tObj.line.material = this.matTracer;
      tObj.line.visible = true;
      tObj.life = 0.05;
    } else {
      const positions = new Float32Array([
        startPos.x, startPos.y, startPos.z,
        this._tempVec1.x, this._tempVec1.y, this._tempVec1.z
      ]);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const line = new THREE.Line(geo, this.matTracer);
      this.scene.add(line);
      tObj = { line, life: 0.05, isLightning: false };
    }

    this.tracers.push(tObj);
  }

  // Electric Chain Zap Arcs
  spawnLightningChain(startPos, endPos) {
    this._tempVec1.lerpVectors(startPos, endPos, 0.5);
    this._tempVec1.x += (Math.random() - 0.5) * 0.8;
    this._tempVec1.y += (Math.random() - 0.5) * 0.8;
    this._tempVec1.z += (Math.random() - 0.5) * 0.8;

    const positions = new Float32Array([
      startPos.x, startPos.y, startPos.z,
      this._tempVec1.x, this._tempVec1.y, this._tempVec1.z,
      endPos.x, endPos.y, endPos.z
    ]);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const line = new THREE.Line(geo, this.matLightning);
    this.scene.add(line);

    this.tracers.push({ line, life: 0.12, isLightning: true });
  }

  // Blood Splatters
  spawnBlood(position, _normal) {
    const count = 12;
    for (let i = 0; i < count; i++) {
      const p = this.acquireParticle(this.geomSphereTiny, this.matBlood);
      p.mesh.position.copy(position);
      p.velocity.set(
        (Math.random() - 0.5) * 4,
        Math.random() * 3 + 1,
        (Math.random() - 0.5) * 4
      );
      p.life = 0.45;
      p.maxLife = 0.45;
      p.gravity = 9.8;
      this.particles.push(p);
    }
  }

  // Explosions (Grenades, Barrels, RPG)
  spawnExplosion(position) {
    const count = 36;
    for (let i = 0; i < count; i++) {
      const isFire = Math.random() > 0.35;
      const geo = Math.random() > 0.5 ? this.geomSphereExplodeSmall : this.geomSphereExplodeLarge;
      const mat = isFire ? this.matFire : this.matSpark;

      const p = this.acquireParticle(geo, mat);
      p.mesh.position.copy(position);
      p.velocity.set(
        (Math.random() - 0.5) * 16,
        Math.random() * 13 + 2,
        (Math.random() - 0.5) * 16
      );
      p.life = 0.7;
      p.maxLife = 0.7;
      p.gravity = 8.0;
      this.particles.push(p);
    }
  }

  // Acid Splash
  spawnAcidSplash(position) {
    const count = 10;
    for (let i = 0; i < count; i++) {
      const p = this.acquireParticle(this.geomSphereMed, this.matAcid);
      p.mesh.position.copy(position);
      p.velocity.set(
        (Math.random() - 0.5) * 5,
        Math.random() * 4 + 1,
        (Math.random() - 0.5) * 5
      );
      p.life = 0.5;
      p.maxLife = 0.5;
      p.gravity = 9.0;
      this.particles.push(p);
    }
  }

  // Enemy Death Disintegration
  spawnDeathParticles(position, colorHex = 0x4a5568) {
    const count = 16;
    const mat = this.getDeathMaterial(colorHex);
    for (let i = 0; i < count; i++) {
      const p = this.acquireParticle(this.geomBoxDebris, mat);
      p.mesh.position.copy(position);
      p.mesh.position.y += Math.random() * 1.5;
      p.velocity.set(
        (Math.random() - 0.5) * 6,
        Math.random() * 5 + 1.5,
        (Math.random() - 0.5) * 6
      );
      p.life = 0.6;
      p.maxLife = 0.6;
      p.gravity = 9.8;
      this.particles.push(p);
    }
  }

  // Concrete / Asphalt Bullet Impact (sparks + dust puffs)
  spawnConcreteImpact(position) {
    const count = 6;
    for (let i = 0; i < count; i++) {
      const isSpark = i < 3;
      const geo = isSpark ? this.geomSphereTiny : this.geomSphereSmall;
      const mat = isSpark ? this.matImpactSpark : this.matDust;

      const p = this.acquireParticle(geo, mat);
      p.mesh.position.copy(position);
      p.velocity.set(
        (Math.random() - 0.5) * 4,
        Math.random() * 3 + 1,
        (Math.random() - 0.5) * 4
      );
      p.life = 0.28;
      p.maxLife = 0.28;
      p.gravity = 8.0;
      this.particles.push(p);
    }
  }

  // Brass Bullet Shell Casing Ejection
  spawnShellCasing(position, dir) {
    const p = this.acquireParticle(this.geomCasing, this.matCasing);
    p.mesh.position.copy(position);
    p.mesh.rotation.z = Math.PI / 2;

    this._tempEuler.set(0, dir.y || 0, 0);
    this._tempVec1.set(1, 0, 0).applyEuler(this._tempEuler);

    const speed = 2.5 + Math.random();
    p.velocity.set(
      this._tempVec1.x * speed,
      2.0,
      this._tempVec1.z * speed - (Math.random() - 0.5)
    );
    p.life = 0.6;
    p.maxLife = 0.6;
    p.gravity = 12.0;
    this.particles.push(p);
  }

  // Steaming Tea Stall & Hot Chai Puffs
  spawnSteam(position) {
    const p = this.acquireParticle(this.geomSphereMed, this.matSteam);
    p.mesh.position.copy(position);
    p.mesh.position.x += (Math.random() - 0.5) * 0.3;
    p.mesh.position.z += (Math.random() - 0.5) * 0.3;

    p.velocity.set(
      (Math.random() - 0.5) * 0.3,
      0.8 + Math.random() * 0.5,
      (Math.random() - 0.5) * 0.3
    );
    p.life = 1.2;
    p.maxLife = 1.2;
    p.gravity = -0.2;
    this.particles.push(p);
  }

  // RPG Rocket Smoke Trail
  spawnRocketSmoke(position) {
    const p = this.acquireParticle(this.geomSphereExplodeSmall, this.matRocketSmoke);
    p.mesh.position.copy(position);

    p.velocity.set(
      (Math.random() - 0.5) * 0.6,
      (Math.random() - 0.5) * 0.6,
      (Math.random() - 0.5) * 0.6
    );
    p.life = 0.5;
    p.maxLife = 0.5;
    p.gravity = 0.5;
    this.particles.push(p);
  }

  // Boss Ground Slam Shockwave Ring
  spawnShockwave(position) {
    let sw = null;
    if (this.shockwavePool.length > 0) {
      sw = this.shockwavePool.pop();
      sw.mesh.visible = true;
      sw.mesh.position.copy(position);
      sw.mesh.position.y = 0.08;
      sw.mesh.scale.set(1, 1, 1);
      sw.life = 0.8;
      sw.maxLife = 0.8;
      sw.maxRadius = 10.0;
    } else {
      const mesh = new THREE.Mesh(this.geomRingShockwave, this.matShockwave.clone());
      mesh.position.copy(position);
      mesh.position.y = 0.08;
      mesh.rotation.x = Math.PI / 2;
      this.scene.add(mesh);
      sw = { mesh, radius: 0.8, maxRadius: 10.0, life: 0.8, maxLife: 0.8 };
    }
    this.shockwaves.push(sw);
  }

  update(delta) {
    // 1. Tracers decay & recycling
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      t.life -= delta;
      if (t.life <= 0) {
        if (!t.isLightning && this.tracerPool.length < 40) {
          t.line.visible = false;
          this.tracerPool.push(t);
        } else {
          this.scene.remove(t.line);
          if (t.isLightning) {
            t.line.geometry.dispose();
          }
        }
        this.tracers.splice(i, 1);
      }
    }

    // 2. Active physics particles update & recycling
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;

      p.velocity.y -= p.gravity * delta;
      p.mesh.position.addScaledVector(p.velocity, delta);

      // Scale shrink
      const progress = p.life / p.maxLife;
      p.mesh.scale.setScalar(Math.max(0.001, progress));

      if (p.life <= 0 || p.mesh.position.y < 0) {
        this.recycleParticle(p);
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

    // 4. Ground Shockwaves
    if (this.shockwaves.length > 0) {
      for (let i = this.shockwaves.length - 1; i >= 0; i--) {
        const sw = this.shockwaves[i];
        sw.life -= delta;
        const progress = (sw.maxLife - sw.life) / sw.maxLife;
        const scale = 1 + progress * (sw.maxRadius - 1);
        sw.mesh.scale.set(scale, scale, 1);
        if (sw.mesh.material) {
          sw.mesh.material.opacity = Math.max(0, (sw.life / sw.maxLife) * 0.85);
        }
        if (sw.life <= 0) {
          sw.mesh.visible = false;
          if (this.shockwavePool.length < 8) {
            this.shockwavePool.push(sw);
          } else {
            this.scene.remove(sw.mesh);
            if (sw.mesh.material) sw.mesh.material.dispose();
          }
          this.shockwaves.splice(i, 1);
        }
      }
    }
  }

  destroy() {
    // 1. Remove & clean all active particles and pools
    [...this.particles, ...this.particlePool].forEach(p => {
      this.scene.remove(p.mesh);
    });
    this.particles.length = 0;
    this.particlePool.length = 0;

    // 2. Tracers
    [...this.tracers, ...this.tracerPool].forEach(t => {
      this.scene.remove(t.line);
      t.line.geometry.dispose();
    });
    this.tracers.length = 0;
    this.tracerPool.length = 0;

    // 3. Shockwaves
    [...this.shockwaves, ...this.shockwavePool].forEach(sw => {
      this.scene.remove(sw.mesh);
      if (sw.mesh.material) sw.mesh.material.dispose();
    });
    this.shockwaves.length = 0;
    this.shockwavePool.length = 0;

    // 4. Rain
    if (this.rainDrops) {
      this.scene.remove(this.rainDrops);
      this.rainDrops.geometry.dispose();
      this.rainDrops.material.dispose();
      this.rainDrops = null;
    }

    // 5. Shared Geometries
    [
      this.geomSphereTiny,
      this.geomSphereSmall,
      this.geomSphereMed,
      this.geomSphereExplodeSmall,
      this.geomSphereExplodeLarge,
      this.geomBoxDebris,
      this.geomCasing,
      this.geomRingShockwave
    ].forEach(geo => geo?.dispose());

    // 6. Shared Materials
    [
      this.matBlood,
      this.matFire,
      this.matSpark,
      this.matAcid,
      this.matDust,
      this.matImpactSpark,
      this.matCasing,
      this.matSteam,
      this.matRocketSmoke,
      this.matShockwave,
      this.matTracer,
      this.matLightning
    ].forEach(mat => mat?.dispose());

    this.deathMatCache.forEach(mat => mat?.dispose());
    this.deathMatCache.clear();
  }
}

