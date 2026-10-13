// TextureGenerator.js - Generates authentic procedural canvas textures for Dhaka City with caching & disposal
import * as THREE from 'three';

export class TextureGenerator {
  static _cache = new Map();

  // Signboard with authentic Bengali text & neon borders
  static createSignboardTexture({ title, subtitle, bgColor = '#1a202c', textColor = '#f6e05e', borderColor = '#e53e3e', isNeon = false }) {
    const key = `sign_${title}_${subtitle}_${bgColor}_${textColor}_${borderColor}_${isNeon}`;
    if (this._cache.has(key)) return this._cache.get(key);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border / Neon glow
    if (isNeon) {
      ctx.shadowColor = borderColor;
      ctx.shadowBlur = 18;
    }
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 12;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Title (Bengali text)
    ctx.shadowBlur = isNeon ? 12 : 0;
    ctx.shadowColor = textColor;
    ctx.fillStyle = textColor;
    ctx.font = 'bold 54px "Hind Siliguri", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, canvas.width / 2, subtitle ? 100 : 128);

    // Subtitle
    if (subtitle) {
      ctx.font = '32px "Hind Siliguri", "Segoe UI", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 0;
      ctx.fillText(subtitle, canvas.width / 2, 175);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    this._cache.set(key, texture);
    return texture;
  }

  // Bangladesh Flag Texture
  static createBDFlagTexture() {
    const key = 'flag_bd';
    if (this._cache.has(key)) return this._cache.get(key);

    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');

    // Bottle green background
    ctx.fillStyle = '#006a4e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Red circle (slightly offset to the left as per official standard)
    ctx.fillStyle = '#f42a41';
    ctx.beginPath();
    ctx.arc(225, 150, 100, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    this._cache.set(key, texture);
    return texture;
  }

  // Authentic Traditional Rickshaw Backplate Art Texture
  static createRickshawArtTexture() {
    const key = 'rickshaw_art';
    if (this._cache.has(key)) return this._cache.get(key);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Bright yellow/turquoise background
    ctx.fillStyle = '#f6ad55';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Vibrant floral border
    ctx.strokeStyle = '#e53e3e';
    ctx.lineWidth = 16;
    ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);

    ctx.strokeStyle = '#3182ce';
    ctx.lineWidth = 8;
    ctx.strokeRect(28, 28, canvas.width - 56, canvas.height - 56);

    // Peacock / floral motif center
    ctx.fillStyle = '#2b6cb0';
    ctx.beginPath();
    ctx.arc(256, 256, 120, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(256, 256, 90, 0, Math.PI * 2);
    ctx.fill();

    // Bengali traditional text
    ctx.fillStyle = '#9b2c2c';
    ctx.font = 'bold 44px "Hind Siliguri", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ঢাকা মেট্রো', 256, 220);

    ctx.fillStyle = '#1a202c';
    ctx.font = 'bold 36px "Segoe UI", sans-serif';
    ctx.fillText('DHAKA CITY', 256, 280);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    this._cache.set(key, texture);
    return texture;
  }

  // Road with Yellow Dashed Centerlines, Aggregate Weathering, and Pedestrian Crossings
  static createAsphaltTexture() {
    const key = 'asphalt_main_v2';
    if (this._cache.has(key)) return this._cache.get(key);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Weathered medium-dark slate asphalt (readable, clearly paved, not pitch black)
    ctx.fillStyle = '#3d4653';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Multi-tone aggregate gravel noise & stone aggregate texture
    for (let i = 0; i < 6500; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const shade = Math.floor(45 + Math.random() * 40);
      const isLightSpeck = Math.random() > 0.82;
      ctx.fillStyle = isLightSpeck
        ? `rgb(${shade + 30}, ${shade + 32}, ${shade + 35})`
        : `rgb(${shade}, ${shade + 2}, ${shade + 5})`;
      const size = Math.random() > 0.7 ? 2 : 1.5;
      ctx.fillRect(x, y, size, size);
    }

    // Weathered tire-wear lanes and subtle street grime
    ctx.fillStyle = 'rgba(42, 50, 60, 0.4)';
    ctx.fillRect(40, 0, 85, canvas.height);
    ctx.fillRect(canvas.width - 125, 0, 85, canvas.height);

    // Subtle rain-washed micro-cracks
    ctx.strokeStyle = 'rgba(30, 36, 44, 0.35)';
    ctx.lineWidth = 1;
    for (let c = 0; c < 8; c++) {
      const startX = 60 + Math.random() * (canvas.width - 120);
      const startY = Math.random() * canvas.height;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(startX + (Math.random() - 0.5) * 24, startY + 18);
      ctx.stroke();
    }

    // Pedestrian Zebra Crossing stripes at intersection approach (top zone)
    ctx.fillStyle = 'rgba(241, 245, 249, 0.75)';
    const zebraCount = 8;
    const zebraWidth = 36;
    const zebraGap = 20;
    const startZebraX = (canvas.width - (zebraCount * zebraWidth + (zebraCount - 1) * zebraGap)) / 2;
    for (let z = 0; z < zebraCount; z++) {
      ctx.fillRect(startZebraX + z * (zebraWidth + zebraGap), 8, zebraWidth, 24);
    }

    // Yellow center divider line (Vibrant Dashed Road Marking)
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(canvas.width / 2 - 5, 50, 10, 140);
    ctx.fillRect(canvas.width / 2 - 5, 270, 10, 160);

    // Crisp white side edge guide stripes
    ctx.fillStyle = 'rgba(241, 245, 249, 0.85)';
    ctx.fillRect(16, 0, 4, canvas.height);
    ctx.fillRect(canvas.width - 20, 0, 4, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 4);
    texture.colorSpace = THREE.SRGBColorSpace;
    this._cache.set(key, texture);
    return texture;
  }

  // Caution hazard tape (Black and Yellow diagonal stripes)
  static createHazardTexture() {
    const key = 'hazard_tape';
    if (this._cache.has(key)) return this._cache.get(key);

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f6e05e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#1a202c';
    const stripeWidth = 40;
    for (let x = -canvas.height; x < canvas.width + canvas.height; x += stripeWidth * 2) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + stripeWidth, 0);
      ctx.lineTo(x + stripeWidth - canvas.height, canvas.height);
      ctx.lineTo(x - canvas.height, canvas.height);
      ctx.closePath();
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    this._cache.set(key, texture);
    return texture;
  }

  // Tea Stall (টং দোকান) Poster Texture
  static createTongDokanTexture() {
    return TextureGenerator.createSignboardTexture({
      title: 'মায়া স্পেশাল চা',
      subtitle: 'মালাই চা ও বিস্কুট',
      bgColor: '#742a2a',
      textColor: '#feebc8',
      borderColor: '#dd6b20',
      isNeon: true
    });
  }

  // Dispose all cached textures cleanly on complete shutdown
  static disposeAll() {
    this._cache.forEach(tex => tex?.dispose());
    this._cache.clear();
  }
}

