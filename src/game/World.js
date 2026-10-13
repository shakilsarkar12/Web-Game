// World.js - 3D Dhaka City Generator (Roads, Buildings, Rickshaws, Tong Dokan, Landmarks, Barrels)
import * as THREE from 'three';
import { TextureGenerator } from './TextureGenerator.js';

export class World {
  constructor(scene) {
    this.scene = scene;
    this.colliders = []; // Bounding boxes for collision detection
    this.explosiveBarrels = []; // Objects that explode when shot
    this.streetLights = [];
    this.worldMeshes = [];
    this.roadSize = 160;

    // Reusable collision sphere to eliminate garbage in hot loop
    this._checkSphere = new THREE.Sphere();

    this.buildLighting();
    this.buildGroundAndRoads();
    this.buildBuildings();
    this.buildRickshawsAndVehicles();
    this.buildTongDokanAndStreetStalls();
    this.buildStreetProps();
    this.buildExplosiveBarrels();
  }


  buildLighting() {
    // "Bright Cinematic Urban Survival — Dhaka After Rain"
    // Ambient soft daylight fill (reduces black shadow crushing while preserving depth)
    this.ambientLight = new THREE.AmbientLight(0xdce7ee, 0.85);
    this.scene.add(this.ambientLight);

    // Hemisphere light: soft overcast blue-gray sky, neutral weathered concrete pavement bounce
    this.hemiLight = new THREE.HemisphereLight(0xb0c4d2, 0x4d5550, 0.75);
    this.scene.add(this.hemiLight);

    // Diffused sun disc in the overcast sky
    const sunGeo = new THREE.SphereGeometry(14, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfffaed });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    sun.position.set(60, 110, 40);
    this.scene.add(sun);

    // Main directional sunlight filtering through clouds (soft warm daylight)
    this.dirLight = new THREE.DirectionalLight(0xfff5e6, 1.3);
    this.dirLight.position.set(55, 85, 35);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 250;
    const d = 85;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.scene.add(this.dirLight);

    // Warm streetlights as secondary urban accents
    const streetLightPositions = [
      [-25, 6, -20], [25, 6, -20],
      [-25, 6, 20], [25, 6, 20],
      [0, 6, -45], [0, 6, 45],
      [-45, 6, 0], [45, 6, 0]
    ];

    streetLightPositions.forEach(([x, y, z]) => {
      const pLight = new THREE.PointLight(0xf59e0b, 1.25, 26, 1.5);
      pLight.position.set(x, y, z);
      this.scene.add(pLight);
      this.streetLights.push(pLight);

      // Light post mesh
      const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 6, 8);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(x, 3, z);
      this.scene.add(pole);

      // Lamp head
      const lampHeadGeo = new THREE.ConeGeometry(0.6, 0.4, 8);
      const lampHeadMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
      const lampHead = new THREE.Mesh(lampHeadGeo, lampHeadMat);
      lampHead.position.set(x, 5.9, z);
      this.scene.add(lampHead);

      // Add collider for pole
      this.addBoxCollider(pole.position, new THREE.Vector3(0.5, 6, 0.5));
    });

    this.buildOverheadCables();
    this.buildPuddles();
  }

  buildOverheadCables() {
    // Tangled Dhaka electric cables strung across poles
    const cablePairs = [
      [new THREE.Vector3(-25, 5.8, -20), new THREE.Vector3(25, 5.8, -20)],
      [new THREE.Vector3(-25, 5.8, 20), new THREE.Vector3(25, 5.8, 20)],
      [new THREE.Vector3(0, 5.8, -45), new THREE.Vector3(0, 5.8, 45)],
      [new THREE.Vector3(-45, 5.8, 0), new THREE.Vector3(45, 5.8, 0)]
    ];

    const cableMat = new THREE.LineBasicMaterial({ color: 0x111620, linewidth: 2 });

    cablePairs.forEach(([start, end]) => {
      // 2-3 cables with slight sag
      for (let c = 0; c < 3; c++) {
        const mid = new THREE.Vector3().lerpVectors(start, end, 0.5);
        mid.y -= 0.6 + c * 0.25; // Cable sag

        const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
        const points = curve.getPoints(20);
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geo, cableMat);
        this.scene.add(line);
      }
    });
  }

  buildPuddles() {
    // Reflective rain puddles on Dhaka asphalt (subtle daylight overcast sky reflection)
    const puddlePositions = [
      { x: -3, z: 6, r: 2.2 },
      { x: 4, z: -8, r: 2.8 },
      { x: -5, z: -15, r: 1.9 },
      { x: 6, z: 14, r: 2.4 }
    ];

    const puddleMat = new THREE.MeshStandardMaterial({
      color: 0x6e8799,
      roughness: 0.08,
      metalness: 0.15,
      transparent: true,
      opacity: 0.65
    });

    puddlePositions.forEach(p => {
      const geo = new THREE.CircleGeometry(p.r, 24);
      const mesh = new THREE.Mesh(geo, puddleMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(p.x, 0.035, p.z);
      this.scene.add(mesh);
    });
  }

  buildGroundAndRoads() {
    // Main terrain / Ground (Natural weathered concrete & urban soil)
    const groundGeo = new THREE.PlaneGeometry(this.roadSize * 1.5, this.roadSize * 1.5);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x5a6575,
      roughness: 0.9
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Asphalt Crossroads (Dhaka Main Avenue - weathered after rain)
    const asphaltTex = TextureGenerator.createAsphaltTexture();
    const roadMat = new THREE.MeshStandardMaterial({
      map: asphaltTex,
      roughness: 0.65,
      metalness: 0.08
    });

    // North-South Road
    const nsRoadGeo = new THREE.PlaneGeometry(16, this.roadSize);
    const nsRoad = new THREE.Mesh(nsRoadGeo, roadMat);
    nsRoad.rotation.x = -Math.PI / 2;
    nsRoad.position.y = 0.02;
    nsRoad.receiveShadow = true;
    this.scene.add(nsRoad);

    // East-West Road
    const ewRoadGeo = new THREE.PlaneGeometry(this.roadSize, 16);
    const ewRoad = new THREE.Mesh(ewRoadGeo, roadMat);
    ewRoad.rotation.x = -Math.PI / 2;
    ewRoad.position.y = 0.025;
    ewRoad.receiveShadow = true;
    this.scene.add(ewRoad);

    // Sidewalks / Footpaths (Clean Weathered Raised Concrete Curbs)
    const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.85 });
    const curbPositions = [
      { x: -20, z: -20, w: 20, h: 20 },
      { x: 20, z: -20, w: 20, h: 20 },
      { x: -20, z: 20, w: 20, h: 20 },
      { x: 20, z: 20, w: 20, h: 20 }
    ];

    curbPositions.forEach(c => {
      const curbGeo = new THREE.BoxGeometry(c.w, 0.25, c.h);
      const curb = new THREE.Mesh(curbGeo, sidewalkMat);
      curb.position.set(c.x, 0.125, c.z);
      curb.receiveShadow = true;
      this.scene.add(curb);
    });

    // Center Roundabout (চত্বর / Shahbagh style circle with vibrant rain-washed foliage)
    const roundaboutGeo = new THREE.CylinderGeometry(6, 6, 0.35, 32);
    const roundaboutMat = new THREE.MeshStandardMaterial({ color: 0x388554, roughness: 0.85 });
    const roundabout = new THREE.Mesh(roundaboutGeo, roundaboutMat);
    roundabout.position.set(0, 0.175, 0);
    this.scene.add(roundabout);
    // (Roundabout is walk-able terrain, no blocking collider)

    // Monument in Roundabout with Bangladesh Flag
    const monumentBaseGeo = new THREE.BoxGeometry(2, 2.5, 2);
    const monumentBaseMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.6 });
    const monumentBase = new THREE.Mesh(monumentBaseGeo, monumentBaseMat);
    monumentBase.position.set(0, 1.4, 0);
    this.scene.add(monumentBase);
    this.addBoxCollider(monumentBase.position, new THREE.Vector3(2.2, 3, 2.2));

    // Flagpole
    const poleGeo = new THREE.CylinderGeometry(0.06, 0.06, 7, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e0, metalness: 0.7 });
    const flagpole = new THREE.Mesh(poleGeo, poleMat);
    flagpole.position.set(0, 5.5, 0);
    this.scene.add(flagpole);

    // Bangladesh Flag
    const flagGeo = new THREE.PlaneGeometry(2.4, 1.5);
    const flagMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.createBDFlagTexture(),
      side: THREE.DoubleSide
    });
    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(1.2, 8, 0);
    flag.rotation.y = 0.2;
    this.scene.add(flag);
  }

  buildBuildings() {
    const buildingData = [
      // Dhaka College Building (Historic Red Brick Colonial Architecture)
      {
        x: -28, z: -35, w: 22, d: 18, h: 14,
        color: 0xa8433a,
        sign: { title: 'ঢাকা কলেজ', subtitle: 'DHAKA COLLEGE', bg: '#742a2a', border: '#ecc94b', isNeon: true }
      },
      // Commercial Plaza (Bismillah Tailors & Electronics) - Neutral Architectural Concrete Gray
      {
        x: 28, z: -35, w: 20, d: 20, h: 22,
        color: 0x788390,
        sign: { title: 'বিসমিল্লাহ টেইলার্স', subtitle: 'Bismillah Tailors & Fabrics', bg: '#1a365d', border: '#63b3ed', isNeon: true }
      },
      // Dhanmondi 27 Tower - Slate/Blue-Gray Commercial High-Rise
      {
        x: -28, z: 35, w: 20, d: 20, h: 26,
        color: 0x58697c,
        sign: { title: 'ধানমন্ডি ২৭', subtitle: 'Dhanmondi Commercial Center', bg: '#234e52', border: '#4fd1c5', isNeon: true }
      },
      // Hotel Al-Kaderia Building - Weathered Warm Beige Concrete
      {
        x: 28, z: 35, w: 22, d: 18, h: 16,
        color: 0x8c7865,
        sign: { title: 'হোটেল আল-কাদেরিয়া', subtitle: 'বিরিয়ানি ও কাবাব ঘর', bg: '#7b341e', border: '#f6ad55', isNeon: true }
      },
      // Background Outer High-rises (Varied Palette visible against soft overcast sky)
      { x: -55, z: -15, w: 18, d: 24, h: 32, color: 0x8895a5 }, // Pale concrete tower
      { x: 55, z: -15, w: 18, d: 24, h: 28, color: 0x75808d },  // Weathered beige-gray
      { x: -55, z: 25, w: 22, d: 18, h: 24, color: 0x6a7d76 },  // Muted sage-concrete
      { x: 55, z: 25, w: 22, d: 18, h: 35, color: 0x61758a }   // Classic blue-gray high-rise
    ];

    buildingData.forEach(b => {
      const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
      const mat = new THREE.MeshStandardMaterial({
        color: b.color,
        roughness: 0.85
      });
      const building = new THREE.Mesh(geo, mat);
      building.position.set(b.x, b.h / 2, b.z);
      building.castShadow = true;
      building.receiveShadow = true;
      this.scene.add(building);

      this.addBoxCollider(building.position, new THREE.Vector3(b.w, b.h, b.d));

      // Roof water tank (iconic Dhaka rooftop detail)
      const tankGeo = new THREE.CylinderGeometry(1.2, 1.2, 2.2, 12);
      const tankMat = new THREE.MeshStandardMaterial({ color: 0x2b6cb0, roughness: 0.5 });
      const tank = new THREE.Mesh(tankGeo, tankMat);
      tank.position.set(b.x - b.w / 4, b.h + 1.1, b.z - b.d / 4);
      this.scene.add(tank);

      // Windows Grid
      this.createBuildingWindows(building, b);

      // Signboard
      if (b.sign) {
        const signGeo = new THREE.PlaneGeometry(9, 3.5);
        const signTex = TextureGenerator.createSignboardTexture({
          title: b.sign.title,
          subtitle: b.sign.subtitle,
          bgColor: b.sign.bg,
          borderColor: b.sign.border,
          textColor: '#ffffff',
          isNeon: b.sign.isNeon
        });
        const signMat = new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide });
        const signMesh = new THREE.Mesh(signGeo, signMat);

        // Position sign facing the street
        if (b.z < 0) {
          signMesh.position.set(b.x, 7, b.z + b.d / 2 + 0.1);
        } else {
          signMesh.position.set(b.x, 7, b.z - b.d / 2 - 0.1);
          signMesh.rotation.y = Math.PI;
        }
        this.scene.add(signMesh);
      }
    });
  }

  createBuildingWindows(building, data) {
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x3e4c59,
      roughness: 0.25,
      metalness: 0.4
    });
    const litMat = new THREE.MeshBasicMaterial({ color: 0xffe4a0 });
    const rows = Math.floor(data.h / 4);
    const cols = Math.floor(data.w / 4);

    for (let r = 1; r < rows; r++) {
      for (let c = 1; c < cols; c++) {
        // ~28% warm interior light, rest daylight reflective glass
        const isLit = Math.random() > 0.72;
        const winGeo = new THREE.PlaneGeometry(1.2, 1.5);
        const win = new THREE.Mesh(winGeo, isLit ? litMat : glassMat);
        const offsetZ = data.z < 0 ? data.d / 2 + 0.05 : -data.d / 2 - 0.05;
        win.position.set(
          data.x - data.w / 2 + c * 3.5,
          r * 3.5,
          data.z + offsetZ
        );
        if (data.z > 0) win.rotation.y = Math.PI;
        this.scene.add(win);
      }
    }
  }

  buildRickshawsAndVehicles() {
    // Spawn Cycle Rickshaws
    const rickshawPositions = [
      { x: -10, z: -14, rot: 0.3 },
      { x: 12, z: -16, rot: -0.6 },
      { x: -12, z: 18, rot: 1.2 },
      { x: 14, z: 14, rot: -2.1 }
    ];

    rickshawPositions.forEach(p => {
      this.createCycleRickshaw(p.x, p.z, p.rot);
    });

    // Spawn Static Green CNG Auto-Rickshaw
    this.createCNGRickshaw(-14, -6, 1.57);

    // Spawn Interactive Driveable Green CNG Auto-Rickshaw
    this.driveableCNG = this.createDriveableCNG(-3.5, 8.5, 1.57);
  }

  triggerLightning() {
    if (!this.dirLight || !this.ambientLight) return;
    const origDir = this.dirLight.intensity;
    const origAmb = this.ambientLight.intensity;
    this.dirLight.intensity = 4.2;
    this.ambientLight.intensity = 2.4;
    this.ambientLight.color.setHex(0xe0f2fe);

    setTimeout(() => {
      if (this.dirLight) this.dirLight.intensity = origDir;
      if (this.ambientLight) {
        this.ambientLight.intensity = origAmb;
        this.ambientLight.color.setHex(0xdce7ee);
      }
    }, 140);
  }

  createDriveableCNG(x, z, rot) {
    const group = new THREE.Group();

    // Body (Dhaka Green with Yellow Stripe)
    const bodyGeo = new THREE.BoxGeometry(1.8, 1.6, 2.8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1c4e34, roughness: 0.5 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 1.1, 0);
    group.add(body);

    // Yellow stripe
    const stripeGeo = new THREE.BoxGeometry(1.82, 0.25, 2.82);
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xd97706 });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.set(0, 1.1, 0);
    group.add(stripe);

    // Metal safety mesh wire windows
    const windowGeo = new THREE.BoxGeometry(1.84, 0.6, 1.5);
    const windowMat = new THREE.MeshBasicMaterial({ color: 0x0f172a, wireframe: true });
    const win = new THREE.Mesh(windowGeo, windowMat);
    win.position.set(0, 1.4, -0.2);
    group.add(win);

    // Windshield
    const windshieldGeo = new THREE.PlaneGeometry(1.6, 0.7);
    const windshieldMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1
    });
    const windshield = new THREE.Mesh(windshieldGeo, windshieldMat);
    windshield.position.set(0, 1.45, 1.41);
    group.add(windshield);

    // 3 Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.16, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });

    // Front steerable wheel
    const frontWheel = new THREE.Mesh(wheelGeo, wheelMat);
    frontWheel.rotation.z = Math.PI / 2;
    frontWheel.position.set(0, 0.42, 1.1);
    group.add(frontWheel);

    // Rear Left Wheel
    const rearL = new THREE.Mesh(wheelGeo, wheelMat);
    rearL.rotation.z = Math.PI / 2;
    rearL.position.set(-0.85, 0.42, -0.8);
    group.add(rearL);

    // Rear Right Wheel
    const rearR = new THREE.Mesh(wheelGeo, wheelMat);
    rearR.rotation.z = Math.PI / 2;
    rearR.position.set(0.85, 0.42, -0.8);
    group.add(rearR);

    // Dual Forward Spotlights / Headlights
    const spotL = new THREE.SpotLight(0xffedd5, 3.5, 35, Math.PI / 6, 0.4);
    spotL.position.set(-0.6, 1.0, 1.4);
    const targetL = new THREE.Object3D();
    targetL.position.set(-0.6, 0.5, 12);
    group.add(spotL);
    group.add(targetL);
    spotL.target = targetL;

    const spotR = new THREE.SpotLight(0xffedd5, 3.5, 35, Math.PI / 6, 0.4);
    spotR.position.set(0.6, 1.0, 1.4);
    const targetR = new THREE.Object3D();
    targetR.position.set(0.6, 0.5, 12);
    group.add(spotR);
    group.add(targetR);
    spotR.target = targetR;

    group.position.set(x, 0, z);
    group.rotation.y = rot;
    this.scene.add(group);

    const cngObj = {
      group,
      frontWheel,
      position: new THREE.Vector3(x, 0, z),
      rotation: { y: rot },
      speed: 0,
      maxForwardSpeed: 24.0,
      maxReverseSpeed: -8.0,
      accel: 16.0,
      steerAngle: 0,
      isOccupied: false,
      update: (delta, input) => {
        const cng = cngObj;
        // Throttle & Braking
        if (input.moveForward) {
          cng.speed = Math.min(cng.maxForwardSpeed, cng.speed + cng.accel * delta);
        } else if (input.moveBackward) {
          cng.speed = Math.max(cng.maxReverseSpeed, cng.speed - cng.accel * delta);
        } else {
          // Rolling friction
          if (cng.speed > 0) {
            cng.speed = Math.max(0, cng.speed - 10.0 * delta);
          } else if (cng.speed < 0) {
            cng.speed = Math.min(0, cng.speed + 10.0 * delta);
          }
        }

        // Steering
        const steerTarget = (input.moveLeft ? 0.45 : 0) - (input.moveRight ? 0.45 : 0);
        cng.steerAngle = THREE.MathUtils.lerp(cng.steerAngle, steerTarget, delta * 8);
        frontWheel.rotation.y = cng.steerAngle;

        // Apply turning scaled by speed
        if (Math.abs(cng.speed) > 0.2) {
          const turnDir = cng.speed > 0 ? 1 : -1;
          cng.rotation.y += cng.steerAngle * turnDir * delta * 2.4;
        }

        // Move along heading
        const heading = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), cng.rotation.y);
        const nextPos = cng.position.clone().addScaledVector(heading, cng.speed * delta);

        // Keep inside street boundary
        const bound = 62;
        if (Math.abs(nextPos.x) < bound && Math.abs(nextPos.z) < bound) {
          cng.position.copy(nextPos);
        } else {
          cng.speed *= -0.3; // gentle bounce
        }

        group.position.copy(cng.position);
        group.rotation.y = cng.rotation.y;
      }
    };
    return cngObj;
  }

  createCycleRickshaw(x, z, rot) {
    const group = new THREE.Group();

    // Passenger seat
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x3182ce, roughness: 0.8 });

    // Passenger seat
    const seatGeo = new THREE.BoxGeometry(1.6, 0.8, 1.2);
    const seat = new THREE.Mesh(seatGeo, seatMat);
    seat.position.set(0, 0.9, -0.4);
    group.add(seat);

    // Decorative Hood / Canopy (Painted traditional floral hood)
    const hoodGeo = new THREE.CylinderGeometry(0.9, 0.9, 1.5, 12, 1, false, 0, Math.PI);
    const hoodMat = new THREE.MeshStandardMaterial({ color: 0xe53e3e, side: THREE.DoubleSide });
    const hood = new THREE.Mesh(hoodGeo, hoodMat);
    hood.rotation.z = Math.PI / 2;
    hood.position.set(0, 1.7, -0.4);
    group.add(hood);

    // Rickshaw Art Backplate
    const artGeo = new THREE.PlaneGeometry(1.2, 0.8);
    const artMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.createRickshawArtTexture(),
      roughness: 0.4
    });
    const artPlate = new THREE.Mesh(artGeo, artMat);
    artPlate.position.set(0, 0.8, -1.02);
    artPlate.rotation.y = Math.PI;
    group.add(artPlate);

    // Three Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.1, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a202c, metalness: 0.8 });

    // Front wheel
    const frontWheel = new THREE.Mesh(wheelGeo, wheelMat);
    frontWheel.rotation.z = Math.PI / 2;
    frontWheel.position.set(0, 0.45, 1.2);
    group.add(frontWheel);

    // Rear left wheel
    const rearL = new THREE.Mesh(wheelGeo, wheelMat);
    rearL.rotation.z = Math.PI / 2;
    rearL.position.set(-0.85, 0.45, -0.4);
    group.add(rearL);

    // Rear right wheel
    const rearR = new THREE.Mesh(wheelGeo, wheelMat);
    rearR.rotation.z = Math.PI / 2;
    rearR.position.set(0.85, 0.45, -0.4);
    group.add(rearR);

    group.position.set(x, 0, z);
    group.rotation.y = rot;
    this.scene.add(group);

    this.addBoxCollider(new THREE.Vector3(x, 0.9, z), new THREE.Vector3(2.0, 2.0, 2.8));
  }

  createCNGRickshaw(x, z, rot) {
    const group = new THREE.Group();

    // Body (Dhaka Green with Yellow Stripe)
    const bodyGeo = new THREE.BoxGeometry(1.8, 1.6, 2.8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x276749, roughness: 0.5 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 1.1, 0);
    group.add(body);

    // Yellow stripe
    const stripeGeo = new THREE.BoxGeometry(1.82, 0.25, 2.82);
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xd69e2e });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.set(0, 1.1, 0);
    group.add(stripe);

    // Metal safety mesh wire windows
    const windowGeo = new THREE.BoxGeometry(1.84, 0.6, 1.5);
    const windowMat = new THREE.MeshBasicMaterial({ color: 0x1a202c, wireframe: true });
    const win = new THREE.Mesh(windowGeo, windowMat);
    win.position.set(0, 1.4, -0.2);
    group.add(win);

    group.position.set(x, 0, z);
    group.rotation.y = rot;
    this.scene.add(group);

    this.addBoxCollider(new THREE.Vector3(x, 1.0, z), new THREE.Vector3(2.2, 2.0, 3.2));
  }

  buildTongDokanAndStreetStalls() {
    // Traditional Dhaka Tea Stall ("মায়া চা ঘর")
    const stallGroup = new THREE.Group();

    // Wooden / tin stall frame
    const stallBaseGeo = new THREE.BoxGeometry(4.5, 2.8, 2.5);
    const stallBaseMat = new THREE.MeshStandardMaterial({ color: 0x5a3d28, roughness: 0.9 });
    const stall = new THREE.Mesh(stallBaseGeo, stallBaseMat);
    stall.position.set(0, 1.4, 0);
    stallGroup.add(stall);

    // Corrugated tin roof
    const roofGeo = new THREE.BoxGeometry(5.0, 0.2, 3.2);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x4a5568, metalness: 0.6 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 2.9, 0);
    roof.rotation.x = 0.08;
    stallGroup.add(roof);

    // Tea kettle / Samovar
    const kettleGeo = new THREE.CylinderGeometry(0.35, 0.45, 0.8, 12);
    const kettleMat = new THREE.MeshStandardMaterial({ color: 0xd69e2e, metalness: 0.8 });
    const kettle = new THREE.Mesh(kettleGeo, kettleMat);
    kettle.position.set(1.2, 2.0, 0.6);
    stallGroup.add(kettle);

    // Wooden tea bench for customers
    const benchGeo = new THREE.BoxGeometry(3.6, 0.45, 0.7);
    const benchMat = new THREE.MeshStandardMaterial({ color: 0x744210 });
    const bench = new THREE.Mesh(benchGeo, benchMat);
    bench.position.set(0, 0.35, 2.2);
    stallGroup.add(bench);

    // Signboard: "মায়া স্পেশাল চা"
    const signGeo = new THREE.PlaneGeometry(3.8, 1.2);
    const signMat = new THREE.MeshBasicMaterial({
      map: TextureGenerator.createTongDokanTexture(),
      side: THREE.DoubleSide
    });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 2.6, 1.26);
    stallGroup.add(sign);

    stallGroup.position.set(-14, 0, -18);
    this.scene.add(stallGroup);

    this.addBoxCollider(new THREE.Vector3(-14, 1.5, -18), new THREE.Vector3(5.0, 3.0, 4.0));
  }

  buildStreetProps() {
    // Traffic barricades / Checkpoint
    const barrierTex = TextureGenerator.createHazardTexture();
    const barrierMat = new THREE.MeshStandardMaterial({ map: barrierTex });

    const barrierPositions = [
      { x: -5, z: -10, rot: 0.1 },
      { x: 5, z: 10, rot: -0.2 }
    ];

    barrierPositions.forEach(p => {
      const barGeo = new THREE.BoxGeometry(3.0, 1.0, 0.4);
      const bar = new THREE.Mesh(barGeo, barrierMat);
      bar.position.set(p.x, 0.5, p.z);
      bar.rotation.y = p.rot;
      this.scene.add(bar);
      this.addBoxCollider(bar.position, new THREE.Vector3(3.2, 1.2, 0.8));
    });

    // Street trees / greenery on corners
    const treePositions = [
      { x: -16, z: -16 }, { x: 16, z: -16 },
      { x: -16, z: 16 }, { x: 16, z: 16 }
    ];

    treePositions.forEach(p => {
      // Trunk
      const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 3, 8);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3d28 });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(p.x, 1.5, p.z);
      this.scene.add(trunk);

      // Leaves (Low-poly lush foliage)
      const leavesGeo = new THREE.DodecahedronGeometry(2.2, 1);
      const leavesMat = new THREE.MeshStandardMaterial({ color: 0x2e8540, roughness: 0.8 });
      const leaves = new THREE.Mesh(leavesGeo, leavesMat);
      leaves.position.set(p.x, 4.2, p.z);
      this.scene.add(leaves);

      this.addCylinderCollider(trunk.position, 0.6, 3);
    });
  }

  buildExplosiveBarrels() {
    // Interactive red explosive barrels placed strategically around Dhaka streets
    const barrelPositions = [
      { x: -8, z: -4 },
      { x: 8, z: -4 },
      { x: -6, z: 12 },
      { x: 7, z: 15 },
      { x: -15, z: 5 },
      { x: 15, z: -5 }
    ];

    const barrelGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.4, 16);
    const barrelMat = new THREE.MeshStandardMaterial({
      color: 0xe53e3e,
      roughness: 0.4,
      metalness: 0.3
    });

    barrelPositions.forEach((p, idx) => {
      const barrel = new THREE.Mesh(barrelGeo, barrelMat);
      barrel.position.set(p.x, 0.7, p.z);
      barrel.castShadow = true;
      this.scene.add(barrel);

      const barrelObj = {
        mesh: barrel,
        position: barrel.position,
        radius: 0.6,
        isExploded: false,
        id: `barrel_${idx}`
      };

      this.explosiveBarrels.push(barrelObj);
      this.addCylinderCollider(barrel.position, 0.6, 1.4);
    });
  }

  addBoxCollider(pos, size) {
    const min = new THREE.Vector3(pos.x - size.x / 2, pos.y - size.y / 2, pos.z - size.z / 2);
    const max = new THREE.Vector3(pos.x + size.x / 2, pos.y + size.y / 2, pos.z + size.z / 2);
    this.colliders.push(new THREE.Box3(min, max));
  }

  addCylinderCollider(pos, radius, height) {
    const min = new THREE.Vector3(pos.x - radius, pos.y - height / 2, pos.z - radius);
    const max = new THREE.Vector3(pos.x + radius, pos.y + height / 2, pos.z + radius);
    this.colliders.push(new THREE.Box3(min, max));
  }

  // Check if a point/sphere collides with any world obstacle (Zero-allocation check)
  checkCollision(pos, radius = 0.5) {
    this._checkSphere.center.copy(pos);
    this._checkSphere.radius = radius;

    for (let i = 0; i < this.colliders.length; i++) {
      if (this.colliders[i].intersectsSphere(this._checkSphere)) {
        return true;
      }
    }
    // Boundary check (within Dhaka map zone)
    const limit = this.roadSize / 2 - 2;
    if (Math.abs(pos.x) > limit || Math.abs(pos.z) > limit) {
      return true;
    }
    return false;
  }

  // Adaptive graphics quality presets (Low, Medium, High)
  applyGraphicsQuality(preset = 'high') {
    if (!this.dirLight) return;

    if (preset === 'low') {
      this.dirLight.castShadow = false;
      this.streetLights.forEach(l => {
        l.distance = 18;
        l.intensity = 0.9;
      });
    } else if (preset === 'medium') {
      this.dirLight.castShadow = true;
      this.dirLight.shadow.mapSize.set(1024, 1024);
      if (this.dirLight.shadow.map) {
        this.dirLight.shadow.map.dispose();
        this.dirLight.shadow.map = null;
      }
      this.streetLights.forEach(l => {
        l.distance = 22;
        l.intensity = 1.1;
      });
    } else {
      // High
      this.dirLight.castShadow = true;
      this.dirLight.shadow.mapSize.set(2048, 2048);
      if (this.dirLight.shadow.map) {
        this.dirLight.shadow.map.dispose();
        this.dirLight.shadow.map = null;
      }
      this.streetLights.forEach(l => {
        l.distance = 26;
        l.intensity = 1.25;
      });
    }
  }

  destroy() {
    this.colliders.length = 0;
    this.explosiveBarrels.length = 0;
    this.streetLights.length = 0;

    // Traverse scene children and safely dispose of all world meshes, geometries, and materials
    const toRemove = [];
    this.scene.traverse(child => {
      if (child.isMesh) {
        toRemove.push(child);
      }
    });

    toRemove.forEach(mesh => {
      this.scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    });
  }
}

