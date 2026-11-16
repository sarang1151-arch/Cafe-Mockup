import * as THREE from 'three';

function finalizeColorTexture(canvas: HTMLCanvasElement, maxAniso: number): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.max(1, maxAniso);
  tex.needsUpdate = true;
  return tex;
}

/**
 * Linear-space (NoColorSpace) organic micro-bump/roughness map for baked crusts,
 * stoneware, gelato scoops, and roasted surfaces.
 */
export function createOrganicBumpTexture(seed = 1, contrast = 1): THREE.DataTexture {
  const size = 256;
  const data = new Uint8Array(size * size * 4);
  let s = (seed * 9301 + 49297) % 233280;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  // Multi-scale value grid for smooth organic pores + fine grain
  const coarseN = 32;
  const coarse = new Float32Array(coarseN * coarseN);
  for (let i = 0; i < coarse.length; i++) coarse[i] = rand();

  for (let y = 0; y < size; y++) {
    const gy = (y / size) * (coarseN - 1);
    const y0 = Math.floor(gy);
    const y1 = Math.min(coarseN - 1, y0 + 1);
    const ty = gy - y0;

    for (let x = 0; x < size; x++) {
      const gx = (x / size) * (coarseN - 1);
      const x0 = Math.floor(gx);
      const x1 = Math.min(coarseN - 1, x0 + 1);
      const tx = gx - x0;

      const c00 = coarse[y0 * coarseN + x0];
      const c10 = coarse[y0 * coarseN + x1];
      const c01 = coarse[y1 * coarseN + x0];
      const c11 = coarse[y1 * coarseN + x1];
      const cTop = c00 + (c10 - c00) * tx;
      const cBot = c01 + (c11 - c01) * tx;
      const smoothVal = cTop + (cBot - cTop) * ty;

      const fine = rand() * 0.35;
      const raw = Math.min(1, Math.max(0, 0.5 + (smoothVal * 0.65 + fine - 0.5) * contrast));
      const byte = Math.round(raw * 255);
      const idx = (y * size + x) * 4;
      data[idx] = byte;
      data[idx + 1] = byte;
      data[idx + 2] = byte;
      data[idx + 3] = 255;
    }
  }

  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Artisanal speckled stoneware glaze texture (wheel-thrown rings + iron flecks).
 */
export function createStonewareTexture(
  baseHex: string,
  speckleHex: string,
  maxAniso: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 512, 512);

  // Subtle wheel-throwing concentric rings
  ctx.strokeStyle = speckleHex;
  for (let r = 24; r < 250; r += 9) {
    ctx.globalAlpha = 0.04;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(256, 256, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Fine mineral iron speckles
  ctx.fillStyle = speckleHex;
  for (let i = 0; i < 650; i++) {
    const x = (Math.sin(i * 12.9898) * 0.5 + 0.5) * 512;
    const y = (Math.cos(i * 78.233) * 0.5 + 0.5) * 512;
    const rad = 0.6 + (i % 4) * 0.45;
    ctx.globalAlpha = 0.14 + (i % 5) * 0.05;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  return finalizeColorTexture(canvas, maxAniso);
}

/**
 * Salvaged walnut or warm acacia woodgrain texture.
 */
export function createWoodGrainTexture(
  baseHex: string,
  grainHex: string,
  maxAniso: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = grainHex;
  for (let i = 0; i < 95; i++) {
    const yBase = (i / 95) * 512;
    ctx.globalAlpha = 0.08 + (i % 4) * 0.04;
    ctx.lineWidth = 1.2 + (i % 3) * 1.1;
    ctx.beginPath();
    ctx.moveTo(0, yBase);
    for (let x = 0; x <= 512; x += 32) {
      const wave = Math.sin(x * 0.015 + i * 0.45) * 8 + Math.cos(x * 0.04 - i) * 3;
      ctx.lineTo(x, yBase + wave);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  return finalizeColorTexture(canvas, maxAniso);
}

/**
 * Barista steamed oat-milk rosette / heart latte art on Uji matcha or honey cortado crema.
 */
export function createLatteArtTexture(
  mode: 'matcha' | 'cortado',
  maxAniso: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const cx = 256;
  const cy = 256;

  // Rich base crema / ceremonial Uji matcha foam
  const baseGrad = ctx.createRadialGradient(cx, cy, 18, cx, cy, 256);
  if (mode === 'matcha') {
    baseGrad.addColorStop(0, '#6B9646');
    baseGrad.addColorStop(0.72, '#537B34');
    baseGrad.addColorStop(0.94, '#3F6325');
    baseGrad.addColorStop(1, '#7BA356');
  } else {
    baseGrad.addColorStop(0, '#A96B37');
    baseGrad.addColorStop(0.7, '#8B5023');
    baseGrad.addColorStop(0.93, '#6B3915');
    baseGrad.addColorStop(1, '#B87A44');
  }
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, 512, 512);

  // Micro-crema mottling
  for (let i = 0; i < 320; i++) {
    const angle = i * 2.39996;
    const r = Math.sqrt(i / 320) * 238;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    ctx.fillStyle = mode === 'matcha' ? 'rgba(238, 245, 226, 0.08)' : 'rgba(250, 235, 212, 0.08)';
    ctx.beginPath();
    ctx.arc(x, y, 2 + (i % 4), 0, Math.PI * 2);
    ctx.fill();
  }

  // Steamed milk tulip / Rosetta petals
  ctx.save();
  ctx.translate(cx, cy);
  const milkColor = '#FBF6EC';

  const drawHeartLobe = (yOffset: number, scale: number, alpha: number) => {
    ctx.save();
    ctx.translate(0, yOffset);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = milkColor;
    ctx.beginPath();
    ctx.moveTo(0, 42);
    ctx.bezierCurveTo(-68, -6, -82, -62, -36, -78);
    ctx.bezierCurveTo(-10, -86, 0, -56, 0, -44);
    ctx.bezierCurveTo(0, -56, 10, -86, 36, -78);
    ctx.bezierCurveTo(82, -62, 68, -6, 0, 42);
    ctx.fill();
    ctx.restore();
  };

  if (mode === 'matcha') {
    // 4-tier Kyoto rosette tulip
    drawHeartLobe(46, 1.38, 0.92);
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#5D873C';
    ctx.beginPath();
    ctx.ellipse(0, 12, 58, 36, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawHeartLobe(12, 1.05, 0.95);
    ctx.fillStyle = '#5D873C';
    ctx.beginPath();
    ctx.ellipse(0, -18, 40, 24, 0, 0, Math.PI * 2);
    ctx.fill();

    drawHeartLobe(-22, 0.74, 0.97);
    drawHeartLobe(-58, 0.44, 0.98);

    // Pull-through barista stem line
    ctx.strokeStyle = '#537B34';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, -90);
    ctx.lineTo(0, 115);
    ctx.stroke();
  } else {
    // Classic Gibraltar honey cortado Rosetta + Coorg wildflower honey spiral
    drawHeartLobe(28, 1.32, 0.94);
    ctx.fillStyle = '#8F5325';
    ctx.beginPath();
    ctx.ellipse(0, -4, 48, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    drawHeartLobe(-18, 0.88, 0.96);
    drawHeartLobe(-54, 0.48, 0.98);

    // Golden honey drizzle ring
    ctx.strokeStyle = 'rgba(222, 146, 40, 0.78)';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let t = 0; t < Math.PI * 3.5; t += 0.1) {
      const rr = 22 + t * 16;
      const hx = Math.cos(t) * rr;
      const hy = Math.sin(t) * rr;
      if (t === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.stroke();
  }

  ctx.restore();
  return finalizeColorTexture(canvas, maxAniso);
}

/**
 * Culinary baked & charred surface textures (sourdough crumb, wood-fired pizza,
 * Basque caramelized top, panini sear stripes, brownie crinkle, cardamom brioche).
 */
export function createCulinarySurfaceTexture(
  mode:
    | 'sourdough-crumb'
    | 'neapolitan-pizza'
    | 'bianca-pizza'
    | 'focaccia-grill'
    | 'basque-top'
    | 'brownie-crinkle'
    | 'cardamom-brioche'
    | 'coffee-grounds',
  maxAniso: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  if (mode === 'sourdough-crumb') {
    ctx.fillStyle = '#DFC9A3';
    ctx.fillRect(0, 0, 512, 512);
    // Open fermentation alveoli holes
    for (let i = 0; i < 220; i++) {
      const x = ((i * 73) % 480) + 16;
      const y = ((i * 137) % 480) + 16;
      const rx = 3 + (i % 7) * 2.1;
      const ry = 2.5 + ((i * 3) % 6) * 1.8;
      ctx.fillStyle = i % 3 === 0 ? '#B7986C' : '#CBB086';
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, (i % 5) * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (mode === 'neapolitan-pizza' || mode === 'bianca-pizza') {
    const cx = 256;
    const cy = 256;
    // Outer cornicione dough
    ctx.fillStyle = '#D9A566';
    ctx.fillRect(0, 0, 512, 512);

    // Wood-fired leopard char spots around rim
    for (let i = 0; i < 85; i++) {
      const ang = (i / 85) * Math.PI * 2 + (i % 3) * 0.08;
      const rad = 188 + (i % 5) * 11;
      const x = cx + Math.cos(ang) * rad;
      const y = cy + Math.sin(ang) * rad;
      ctx.fillStyle = i % 3 === 0 ? '#2B160B' : '#7A3E18';
      ctx.globalAlpha = 0.55 + (i % 4) * 0.1;
      ctx.beginPath();
      ctx.ellipse(x, y, 5 + (i % 6) * 2, 4 + (i % 4) * 2, ang, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Inner sauce or garlic-confit bianca bed
    const innerGrad = ctx.createRadialGradient(cx, cy, 12, cx, cy, 182);
    if (mode === 'neapolitan-pizza') {
      innerGrad.addColorStop(0, '#B9291C');
      innerGrad.addColorStop(0.82, '#9E1F14');
      innerGrad.addColorStop(1, '#C9854B');
    } else {
      innerGrad.addColorStop(0, '#EFE2C4');
      innerGrad.addColorStop(0.82, '#DFCA9F');
      innerGrad.addColorStop(1, '#CFA065');
    }
    ctx.fillStyle = innerGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 184, 0, Math.PI * 2);
    ctx.fill();

    // Herb & olive oil flecks
    for (let i = 0; i < 140; i++) {
      const ang = i * 2.4;
      const rad = Math.sqrt(i / 140) * 168;
      ctx.fillStyle =
        mode === 'neapolitan-pizza' ? 'rgba(130, 22, 12, 0.45)' : 'rgba(168, 124, 58, 0.35)';
      ctx.beginPath();
      ctx.arc(cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad, 3 + (i % 4), 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (mode === 'focaccia-grill') {
    ctx.fillStyle = '#C98E4B';
    ctx.fillRect(0, 0, 512, 512);
    // Golden olive-oil dimples
    for (let i = 0; i < 90; i++) {
      const x = ((i * 61) % 490) + 11;
      const y = ((i * 109) % 490) + 11;
      ctx.fillStyle = '#A66C2E';
      ctx.beginPath();
      ctx.arc(x, y, 5 + (i % 4) * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Cast-iron panini press sear bars
    ctx.save();
    ctx.translate(256, 256);
    ctx.rotate(-0.48);
    for (let y = -360; y <= 360; y += 54) {
      const g = ctx.createLinearGradient(0, y - 9, 0, y + 9);
      g.addColorStop(0, 'rgba(52, 26, 11, 0)');
      g.addColorStop(0.5, 'rgba(46, 22, 9, 0.78)');
      g.addColorStop(1, 'rgba(52, 26, 11, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(-380, y - 9, 760, 18);
    }
    ctx.restore();
  } else if (mode === 'basque-top') {
    const grad = ctx.createRadialGradient(256, 256, 20, 256, 256, 260);
    grad.addColorStop(0, '#9E4E1B');
    grad.addColorStop(0.65, '#6E310E');
    grad.addColorStop(1, '#3B1807');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);
  } else if (mode === 'brownie-crinkle') {
    ctx.fillStyle = '#2A160E';
    ctx.fillRect(0, 0, 512, 512);
    // Shiny papery Valrhona cocoa crinkle fissures
    ctx.strokeStyle = '#140905';
    ctx.lineWidth = 3.5;
    for (let i = 0; i < 36; i++) {
      ctx.beginPath();
      let x = ((i * 89) % 460) + 26;
      let y = ((i * 53) % 460) + 26;
      ctx.moveTo(x, y);
      for (let s = 0; s < 5; s++) {
        x += Math.cos(i + s * 1.7) * 34;
        y += Math.sin(i * 1.3 + s) * 34;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  } else if (mode === 'cardamom-brioche') {
    const g = ctx.createLinearGradient(0, 0, 512, 512);
    g.addColorStop(0, '#B96B27');
    g.addColorStop(0.5, '#D48A3B');
    g.addColorStop(1, '#9A5219');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);
    // Freshly mortared Malabar black/green cardamom flecks
    for (let i = 0; i < 420; i++) {
      const x = ((i * 97) % 504) + 4;
      const y = ((i * 151) % 504) + 4;
      ctx.fillStyle = i % 4 === 0 ? '#2D3A1E' : '#24140A';
      ctx.globalAlpha = 0.65;
      ctx.beginPath();
      ctx.arc(x, y, 1.3 + (i % 3) * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else if (mode === 'coffee-grounds') {
    ctx.fillStyle = '#2B170C';
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 600; i++) {
      const x = ((i * 67) % 500) + 6;
      const y = ((i * 131) % 500) + 6;
      ctx.fillStyle = i % 5 === 0 ? '#8C582B' : '#1A0D06';
      ctx.beginPath();
      ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return finalizeColorTexture(canvas, maxAniso);
}

/**
 * Sliced fruit & botanical garnish cross-sections (key lime wheel, roasted black fig, banana coin).
 */
export function createFruitCutTexture(
  mode: 'lime-wheel' | 'fig-cut' | 'banana-coin',
  maxAniso: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const cx = 128;
  const cy = 128;

  if (mode === 'lime-wheel') {
    ctx.fillStyle = '#3F7A28';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#F2F5E4';
    ctx.beginPath();
    ctx.arc(cx, cy, 114, 0, Math.PI * 2);
    ctx.fill();

    // 10 translucent key-lime segments
    for (let s = 0; s < 10; s++) {
      const a0 = (s / 10) * Math.PI * 2 + 0.04;
      const a1 = ((s + 1) / 10) * Math.PI * 2 - 0.04;
      ctx.fillStyle = '#9EC94D';
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos((a0 + a1) / 2) * 10, cy + Math.sin((a0 + a1) / 2) * 10);
      ctx.arc(cx, cy, 104, a0, a1);
      ctx.closePath();
      ctx.fill();
    }
  } else if (mode === 'fig-cut') {
    ctx.fillStyle = '#2D172B';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#E8D8C3';
    ctx.beginPath();
    ctx.arc(cx, cy, 112, 0, Math.PI * 2);
    ctx.fill();

    const g = ctx.createRadialGradient(cx, cy, 8, cx, cy, 98);
    g.addColorStop(0, '#D93B52');
    g.addColorStop(0.75, '#9E1F38');
    g.addColorStop(1, '#F0DFC8');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, 98, 0, Math.PI * 2);
    ctx.fill();

    // Tiny golden fig seeds
    ctx.fillStyle = '#F3C879';
    for (let i = 0; i < 95; i++) {
      const a = i * 2.4;
      const r = 18 + Math.sqrt(i / 95) * 65;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Caramelized banana coin
    ctx.fillStyle = '#E8C56B';
    ctx.fillRect(0, 0, 256, 256);
    const g = ctx.createRadialGradient(cx, cy, 6, cx, cy, 118);
    g.addColorStop(0, '#D49E3D');
    g.addColorStop(0.55, '#F6E6B4');
    g.addColorStop(0.92, '#D99B38');
    g.addColorStop(1, '#8C4E16');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, 118, 0, Math.PI * 2);
    ctx.fill();

    // 3 tiny banana core seed marks
    ctx.strokeStyle = '#7A4A1C';
    ctx.lineWidth = 3;
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * 20, cy + Math.sin(a) * 20);
      ctx.stroke();
    }
  }

  return finalizeColorTexture(canvas, maxAniso);
}

/**
 * Speckled oatmeal ceramic coupe plate with kiln-toasted rust-brown rim
 * (matched 1:1 to Quad-View & Rustic Avocado Toast reference photos).
 */
export function createArtisanCoupePlateTexture(maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;
  const cx = 512;
  const cy = 512;

  // Warm oatmeal stoneware glaze with subtle inner pooling gradient
  const baseGrad = ctx.createRadialGradient(cx, cy, 40, cx, cy, 512);
  baseGrad.addColorStop(0, '#EBE6DD');
  baseGrad.addColorStop(0.74, '#E3DDD2');
  baseGrad.addColorStop(0.89, '#D8CFC1');
  baseGrad.addColorStop(0.955, '#9A6E47');
  baseGrad.addColorStop(0.985, '#6B4426');
  baseGrad.addColorStop(1, '#54331B');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, 1024, 1024);

  // Subtle concentric potter's wheel throwing striations
  for (let r = 36; r < 486; r += 7) {
    ctx.strokeStyle = r % 14 === 0 ? 'rgba(92, 66, 44, 0.045)' : 'rgba(255, 252, 246, 0.05)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Kiln-brushed radial glaze ticks along the toasted brown outer rim
  ctx.save();
  ctx.translate(cx, cy);
  for (let i = 0; i < 360; i++) {
    const a = (i / 360) * Math.PI * 2;
    const len = 18 + (i % 5) * 5;
    ctx.strokeStyle = i % 2 === 0 ? 'rgba(72, 42, 21, 0.36)' : 'rgba(168, 124, 82, 0.25)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * (506 - len), Math.sin(a) * (506 - len));
    ctx.lineTo(Math.cos(a) * 510, Math.sin(a) * 510);
    ctx.stroke();
  }
  ctx.restore();

  // Dense iron-oxide & espresso mineral speckles across entire ceramic glaze
  const speckleColors = ['#3B2415', '#5C3C24', '#7D573A', '#26170E', '#8C6240'];
  for (let i = 0; i < 2600; i++) {
    const a = i * 2.399963;
    const normR = Math.sqrt(((i * 97) % 2600) / 2600);
    const rad = normR * 502;
    const x = cx + Math.cos(a) * rad + Math.sin(i * 3.1) * 4;
    const y = cy + Math.sin(a) * rad + Math.cos(i * 2.7) * 4;
    const size = i % 19 === 0 ? 2.6 + (i % 3) * 0.9 : 0.7 + (i % 4) * 0.55;
    ctx.fillStyle = speckleColors[i % speckleColors.length];
    ctx.globalAlpha = i % 19 === 0 ? 0.62 : 0.22 + (i % 5) * 0.08;
    ctx.beginPath();
    ctx.ellipse(x, y, size, size * (0.75 + (i % 3) * 0.15), a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  return finalizeColorTexture(canvas, maxAniso);
}

/**
 * Blistered dark-amber & mahogany country sourdough outer crust wall with
 * oven-spring vertical cracks and dusty artisan flour patches.
 */
export function createRusticSourdoughCrustTexture(maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const baseG = ctx.createLinearGradient(0, 0, 0, 256);
  baseG.addColorStop(0, '#3D1E0B');
  baseG.addColorStop(0.28, '#6B3B19');
  baseG.addColorStop(0.68, '#7A4620');
  baseG.addColorStop(1, '#4A2610');
  ctx.fillStyle = baseG;
  ctx.fillRect(0, 0, 1024, 256);

  // Dark wood-oven char blisters & golden caramel mottling
  for (let i = 0; i < 420; i++) {
    const x = ((i * 79) % 1024);
    const y = ((i * 43) % 240) + 8;
    const rx = 8 + (i % 9) * 3.5;
    const ry = 5 + (i % 6) * 2.5;
    ctx.fillStyle = i % 4 === 0 ? '#241005' : i % 3 === 0 ? '#9C622E' : '#522B11';
    ctx.globalAlpha = 0.35 + (i % 4) * 0.1;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, (i % 5) * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Vertical oven-spring scoring cracks (matching FRONT VIEW & SIDE VIEW)
  for (let c = 0; c < 18; c++) {
    const cx = 36 + c * 56 + ((c * 17) % 22);
    ctx.strokeStyle = '#B88248';
    ctx.lineWidth = 3 + (c % 3) * 1.5;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.moveTo(cx, 18);
    ctx.quadraticCurveTo(cx + (c % 2 === 0 ? 10 : -10), 128, cx + (c % 3) * 4, 238);
    ctx.stroke();
  }

  // Soft artisan baker's flour dusting patches on crust wall
  for (let f = 0; f < 130; f++) {
    const fx = ((f * 113) % 1024);
    const fy = 40 + ((f * 67) % 190);
    const rad = 10 + (f % 6) * 5;
    const fg = ctx.createRadialGradient(fx, fy, 1, fx, fy, rad);
    fg.addColorStop(0, 'rgba(232, 222, 206, 0.42)');
    fg.addColorStop(1, 'rgba(232, 222, 206, 0)');
    ctx.fillStyle = fg;
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(fx, fy, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = finalizeColorTexture(canvas, maxAniso);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

/**
 * Chunky fork-smashed & diced ripe Hass avocado flesh texture (buttery yellow-green
 * core blending into rich emerald peel-edge green + fine pepper/herb specks).
 */
export function createSmashedAvocadoTexture(maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#7E9F38';
  ctx.fillRect(0, 0, 512, 512);

  const avoShades = ['#98B848', '#B8CA5B', '#688B2B', '#547520', '#C9D872', '#759933'];
  for (let i = 0; i < 520; i++) {
    const x = ((i * 83) % 512);
    const y = ((i * 139) % 512);
    const rx = 10 + (i % 7) * 4.5;
    const ry = 8 + ((i * 3) % 6) * 4;
    ctx.fillStyle = avoShades[i % avoShades.length];
    ctx.globalAlpha = 0.58;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, i * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fine cracked pepper & herb specks mixed into the mash
  for (let s = 0; s < 220; s++) {
    const sx = ((s * 97) % 504) + 4;
    const sy = ((s * 151) % 504) + 4;
    ctx.fillStyle = s % 4 === 0 ? '#8C2315' : '#231D16';
    ctx.globalAlpha = 0.65;
    ctx.beginPath();
    ctx.arc(sx, sy, 1.2 + (s % 3) * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const tex = finalizeColorTexture(canvas, maxAniso);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * Porcelain-white poached egg dome texture with warm golden yolk-blush around the
 * front cleft, crushed red Aleppo chili flakes, coarse cracked black pepper, and herb flecks.
 */
export function createSeasonedPoachedEggTexture(maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#FCFBF8';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle warm golden yolk glow around the front split cleft (cx=264, cy=325)
  const yolkGlow = ctx.createRadialGradient(264, 320, 8, 264, 300, 145);
  yolkGlow.addColorStop(0, 'rgba(245, 148, 8, 0.85)');
  yolkGlow.addColorStop(0.32, 'rgba(238, 142, 18, 0.28)');
  yolkGlow.addColorStop(0.72, 'rgba(235, 155, 42, 0.08)');
  yolkGlow.addColorStop(1, 'rgba(252, 251, 248, 0)');
  ctx.fillStyle = yolkGlow;
  ctx.fillRect(0, 0, 512, 512);

  // Crushed red chili flakes, cracked black peppercorns, and toasted spice dust across crown
  for (let i = 0; i < 290; i++) {
    const a = i * 2.39996;
    const rad = Math.sqrt(i / 290) * 195;
    const x = 256 + Math.cos(a) * rad + Math.sin(i * 1.9) * 8;
    const y = 248 + Math.sin(a) * rad * 0.92 + Math.cos(i * 2.3) * 8;

    if (i % 5 === 0) {
      // Crushed crimson chili flake
      ctx.fillStyle = i % 10 === 0 ? '#8E190E' : '#BD2E18';
      ctx.globalAlpha = 0.88;
      ctx.beginPath();
      ctx.ellipse(x, y, 3.2 + (i % 3), 1.9 + (i % 2), a, 0, Math.PI * 2);
      ctx.fill();
    } else if (i % 3 === 0) {
      // Coarse cracked black peppercorn
      ctx.fillStyle = '#1C1613';
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(x, y, 1.6 + (i % 3) * 0.85, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Fine golden-paprika / toasted za'atar spice dust
      ctx.fillStyle = i % 7 === 0 ? '#3E6B24' : '#B86919';
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.arc(x, y, 1.2 + (i % 2) * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  return finalizeColorTexture(canvas, maxAniso);
}

