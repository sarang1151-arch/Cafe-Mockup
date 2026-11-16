import * as THREE from 'three';
import { DISH_MEDIA_CONFIG, MenuItem } from './cafeConfig';

export interface FoodViewerItemConfig {
  /** Path to real 3D GLB model at /assets/models/<dish-name>.glb */
  glb: string;
  /** Primary dish photograph (moodboard crop or uploaded dish photo) */
  image: string;
  /** Optional drop-in custom dish photo override at /assets/dishes/<dish-name>.jpg */
  dropPhotoPath: string;
  /** Optional custom grayscale depth map override at /assets/depth/<dish-name>-depth.png */
  depthMap: string;
  /** Height of radial depth displacement when rendering pseudo-3D fallback mesh */
  displacementScale: number;
  /** Radial dome exponent (lower = fuller central mound, higher = wider flatter profile) */
  domePower: number;
  /** Ceramic / vessel plate glaze color */
  rimColor: string;
  /** Outer kiln-toasted rim accent color */
  rimBandColor: string;
  /** Whether warm rising steam / aroma particles are active */
  hasSteam: boolean;
  /** Studio rim light hex tint */
  accentHex: string;
  /** Optional 4-panel turnaround reference sheet */
  referenceSheet?: string;
}

/**
 * Single source-of-truth config mapping each menu item slug (<dish-name>)
 * to '/assets/models/<dish-name>.glb', its dish photo, and radial depth parameters.
 */
export const FOOD_VIEWER_CONFIG: Record<string, FoodViewerItemConfig> = {
  'matcha-latte': {
    glb: '/assets/models/matcha-latte.glb',
    image: DISH_MEDIA_CONFIG['matcha-latte'].image,
    dropPhotoPath: DISH_MEDIA_CONFIG['matcha-latte'].dropPhotoPath,
    depthMap: '/assets/depth/matcha-latte-depth.png',
    displacementScale: 0.44,
    domePower: 1.55,
    rimColor: '#EAE3D5',
    rimBandColor: '#5B6E49',
    hasSteam: true,
    accentHex: '#6E8B57',
    referenceSheet: DISH_MEDIA_CONFIG['matcha-latte'].referenceSheet,
  },
  'blueberry-cheesecake': {
    glb: '/assets/models/blueberry-cheesecake.glb',
    image: DISH_MEDIA_CONFIG['blueberry-cheesecake'].image,
    dropPhotoPath: DISH_MEDIA_CONFIG['blueberry-cheesecake'].dropPhotoPath,
    depthMap: '/assets/depth/blueberry-cheesecake-depth.png',
    displacementScale: 0.48,
    domePower: 1.5,
    rimColor: '#EFE9DD',
    rimBandColor: '#6D5468',
    hasSteam: false,
    accentHex: '#593B6B',
    referenceSheet: DISH_MEDIA_CONFIG['blueberry-cheesecake'].referenceSheet,
  },
  'truffle-pasta': {
    glb: '/assets/models/truffle-pasta.glb',
    image: DISH_MEDIA_CONFIG['truffle-pasta'].image,
    dropPhotoPath: DISH_MEDIA_CONFIG['truffle-pasta'].dropPhotoPath,
    depthMap: '/assets/depth/truffle-pasta-depth.png',
    displacementScale: 0.46,
    domePower: 1.6,
    rimColor: '#EAE0CF',
    rimBandColor: '#6A4E35',
    hasSteam: true,
    accentHex: '#C9893B',
    referenceSheet: DISH_MEDIA_CONFIG['truffle-pasta'].referenceSheet,
  },
  'cold-brew': {
    glb: '/assets/models/cold-brew.glb',
    image: DISH_MEDIA_CONFIG['cold-brew'].image,
    dropPhotoPath: DISH_MEDIA_CONFIG['cold-brew'].dropPhotoPath,
    depthMap: '/assets/depth/cold-brew-depth.png',
    displacementScale: 0.45,
    domePower: 1.45,
    rimColor: '#3A2619',
    rimBandColor: '#8B5428',
    hasSteam: false,
    accentHex: '#7B4620',
    referenceSheet: DISH_MEDIA_CONFIG['cold-brew'].referenceSheet,
  },
  'avocado-toast': {
    glb: '/assets/models/avocado-toast.glb',
    image: DISH_MEDIA_CONFIG['avocado-toast'].image,
    dropPhotoPath: DISH_MEDIA_CONFIG['avocado-toast'].dropPhotoPath,
    depthMap: '/assets/depth/avocado-toast-depth.png',
    displacementScale: 0.48,
    domePower: 1.65,
    rimColor: '#E5DED2',
    rimBandColor: '#6B4426',
    hasSteam: true,
    accentHex: '#7A9652',
    referenceSheet: DISH_MEDIA_CONFIG['avocado-toast'].referenceSheet,
  },
  'willow-cortado': {
    glb: '/assets/models/willow-cortado.glb',
    image: DISH_MEDIA_CONFIG['willow-cortado'].image,
    dropPhotoPath: DISH_MEDIA_CONFIG['willow-cortado'].dropPhotoPath,
    depthMap: '/assets/depth/willow-cortado-depth.png',
    displacementScale: 0.42,
    domePower: 1.5,
    rimColor: '#4A301F',
    rimBandColor: '#9C6234',
    hasSteam: true,
    accentHex: '#9C6234',
    referenceSheet: DISH_MEDIA_CONFIG['willow-cortado'].referenceSheet,
  },
  'pourover-geisha': {
    glb: '/assets/models/pourover-geisha.glb',
    image: DISH_MEDIA_CONFIG['pourover-geisha'].image,
    dropPhotoPath: DISH_MEDIA_CONFIG['pourover-geisha'].dropPhotoPath,
    depthMap: '/assets/depth/pourover-geisha-depth.png',
    displacementScale: 0.44,
    domePower: 1.5,
    rimColor: '#F2ECE1',
    rimBandColor: '#8E4B28',
    hasSteam: true,
    accentHex: '#8E4B28',
    referenceSheet: DISH_MEDIA_CONFIG['pourover-geisha'].referenceSheet,
  },
  'hibiscus-spritz': {
    glb: '/assets/models/hibiscus-spritz.glb',
    image: DISH_MEDIA_CONFIG['hibiscus-spritz'].image,
    dropPhotoPath: DISH_MEDIA_CONFIG['hibiscus-spritz'].dropPhotoPath,
    depthMap: '/assets/depth/hibiscus-spritz-depth.png',
    displacementScale: 0.44,
    domePower: 1.55,
    rimColor: '#EAE2D6',
    rimBandColor: '#9E2A47',
    hasSteam: false,
    accentHex: '#A62C46',
    referenceSheet: DISH_MEDIA_CONFIG['hibiscus-spritz'].referenceSheet,
  },
  'acai-bowl': {
    glb: '/assets/models/acai-bowl.glb',
    image: DISH_MEDIA_CONFIG['acai-bowl'].image,
    dropPhotoPath: DISH_MEDIA_CONFIG['acai-bowl'].dropPhotoPath,
    depthMap: '/assets/depth/acai-bowl-depth.png',
    displacementScale: 0.46,
    domePower: 1.65,
    rimColor: '#E6DDD0',
    rimBandColor: '#69365E',
    hasSteam: false,
    accentHex: '#69365E',
    referenceSheet: DISH_MEDIA_CONFIG['acai-bowl'].referenceSheet,
  },
  'tuscan-panini': {
    glb: '/assets/models/tuscan-panini.glb',
    image: DISH_MEDIA_CONFIG['tuscan-panini'].image,
    dropPhotoPath: DISH_MEDIA_CONFIG['tuscan-panini'].dropPhotoPath,
    depthMap: '/assets/depth/tuscan-panini-depth.png',
    displacementScale: 0.45,
    domePower: 1.7,
    rimColor: '#E9E1D3',
    rimBandColor: '#8C6239',
    hasSteam: true,
    accentHex: '#B87838',
    referenceSheet: DISH_MEDIA_CONFIG['tuscan-panini'].referenceSheet,
  },
  'margherita-pizza': {
    glb: '/assets/models/margherita-pizza.glb',
    image: DISH_MEDIA_CONFIG['margherita-pizza'].image,
    dropPhotoPath: DISH_MEDIA_CONFIG['margherita-pizza'].dropPhotoPath,
    depthMap: '/assets/depth/margherita-pizza-depth.png',
    displacementScale: 0.36,
    domePower: 2.25,
    rimColor: '#4E3320',
    rimBandColor: '#B8432E',
    hasSteam: true,
    accentHex: '#B8432E',
    referenceSheet: DISH_MEDIA_CONFIG['margherita-pizza'].referenceSheet,
  },
  'burrata-fig-pizza': {
    glb: '/assets/models/burrata-fig-pizza.glb',
    image: DISH_MEDIA_CONFIG['burrata-fig-pizza'].image,
    dropPhotoPath: DISH_MEDIA_CONFIG['burrata-fig-pizza'].dropPhotoPath,
    depthMap: '/assets/depth/burrata-fig-pizza-depth.png',
    displacementScale: 0.38,
    domePower: 2.15,
    rimColor: '#4A301E',
    rimBandColor: '#7B3E59',
    hasSteam: true,
    accentHex: '#7B3E59',
    referenceSheet: DISH_MEDIA_CONFIG['burrata-fig-pizza'].referenceSheet,
  },
  'skillet-brownie': {
    glb: '/assets/models/skillet-brownie.glb',
    image: DISH_MEDIA_CONFIG['skillet-brownie'].image,
    dropPhotoPath: DISH_MEDIA_CONFIG['skillet-brownie'].dropPhotoPath,
    depthMap: '/assets/depth/skillet-brownie-depth.png',
    displacementScale: 0.46,
    domePower: 1.55,
    rimColor: '#252220',
    rimBandColor: '#613822',
    hasSteam: true,
    accentHex: '#5A321E',
    referenceSheet: DISH_MEDIA_CONFIG['skillet-brownie'].referenceSheet,
  },
  'cardamom-knot': {
    glb: '/assets/models/cardamom-knot.glb',
    image: DISH_MEDIA_CONFIG['cardamom-knot'].image,
    dropPhotoPath: DISH_MEDIA_CONFIG['cardamom-knot'].dropPhotoPath,
    depthMap: '/assets/depth/cardamom-knot-depth.png',
    displacementScale: 0.47,
    domePower: 1.55,
    rimColor: '#ECE4D7',
    rimBandColor: '#B57B42',
    hasSteam: true,
    accentHex: '#B57B42',
    referenceSheet: DISH_MEDIA_CONFIG['cardamom-knot'].referenceSheet,
  },
  'almond-croissant': {
    glb: '/assets/models/almond-croissant.glb',
    image: DISH_MEDIA_CONFIG['almond-croissant'].image,
    dropPhotoPath: DISH_MEDIA_CONFIG['almond-croissant'].dropPhotoPath,
    depthMap: '/assets/depth/almond-croissant-depth.png',
    displacementScale: 0.47,
    domePower: 1.6,
    rimColor: '#EFE7DA',
    rimBandColor: '#C58B43',
    hasSteam: true,
    accentHex: '#C58B43',
    referenceSheet: DISH_MEDIA_CONFIG['almond-croissant'].referenceSheet,
  },
};

export function getFoodViewerConfig(dish: MenuItem): FoodViewerItemConfig {
  const mapped = FOOD_VIEWER_CONFIG[dish.id];
  if (mapped) return mapped;
  return {
    glb: dish.glb || `/assets/models/${dish.id}.glb`,
    image: dish.image,
    dropPhotoPath: dish.dropPhotoPath || `/assets/dishes/${dish.id}.jpg`,
    depthMap: dish.depthMap || `/assets/depth/${dish.id}-depth.png`,
    displacementScale: 0.44,
    domePower: 1.65,
    rimColor: '#EAE2D5',
    rimBandColor: '#7A5436',
    hasSteam: dish.hasSteam,
    accentHex: dish.accentHex || '#C9893B',
    referenceSheet: dish.referenceSheet,
  };
}

/**
 * Generates a smooth 512x512 radial depth map (linear NoColorSpace) for round café plates:
 * - Outer coupe rim ridge (0.85 <= r <= 1.0)
 * - Gently recessed inner plate well (0.72 <= r < 0.85)
 * - Smooth central culinary relief dome (0 <= r < 0.76)
 * - Blended with blurred luminance relief from the dish image when available
 */
export function createRadialDepthMapTexture(
  domePower = 1.65,
  sourceImage?: HTMLImageElement | HTMLCanvasElement | null
): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Sample optional blurred luminance from dish image so food details catch 3D relief
  let lumPixels: Uint8ClampedArray | null = null;
  if (sourceImage) {
    try {
      const lumCanvas = document.createElement('canvas');
      lumCanvas.width = size;
      lumCanvas.height = size;
      const lCtx = lumCanvas.getContext('2d');
      if (lCtx) {
        lCtx.filter = 'blur(6px)';
        const sw = sourceImage.width || size;
        const sh = sourceImage.height || size;
        const crop = Math.min(sw, sh);
        const sx = (sw - crop) * 0.5;
        const sy = (sh - crop) * 0.5;
        lCtx.drawImage(sourceImage, sx, sy, crop, crop, 0, 0, size, size);
        lumPixels = lCtx.getImageData(0, 0, size, size).data;
      }
    } catch {
      lumPixels = null;
    }
  }

  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;
  const half = size * 0.5;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (x - half) / half;
      const ny = (y - half) / half;
      const r = Math.min(1.2, Math.hypot(nx, ny));

      // 1. Central radial food mound
      let radialH = 0;
      if (r < 0.78) {
        const t = r / 0.78;
        radialH = 0.14 + 0.78 * Math.pow(Math.cos(t * Math.PI * 0.5), domePower);
      } else if (r < 0.88) {
        // Plate well transition into raised ceramic lip
        const u = (r - 0.78) / 0.1;
        radialH = 0.14 + u * u * 0.2;
      } else if (r <= 1.0) {
        // Outer ceramic coupe rim lip tapering cleanly at r = 1
        const v = (r - 0.88) / 0.12;
        radialH = 0.34 * (1 - v * v * 0.85);
      }

      // 2. Blend subtle luminance relief inside the food zone (r < 0.76)
      if (lumPixels && r < 0.76) {
        const pIdx = (y * size + x) * 4;
        const lum =
          (lumPixels[pIdx] * 0.299 + lumPixels[pIdx + 1] * 0.587 + lumPixels[pIdx + 2] * 0.114) /
          255;
        const foodWeight = 1 - Math.pow(r / 0.76, 2);
        radialH = radialH * 0.76 + (0.2 + lum * 0.75) * 0.24 * foodWeight + radialH * 0.24 * (1 - foodWeight);
      }

      const byte = Math.max(0, Math.min(255, Math.round(radialH * 255)));
      const idx = (y * size + x) * 4;
      data[idx] = byte;
      data[idx + 1] = byte;
      data[idx + 2] = byte;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  // Keep depth/displacement map in linear space (NoColorSpace)
  tex.colorSpace = THREE.NoColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates a bespoke overhead culinary plate canvas for secondary menu items
 * that do not yet have a dedicated photograph on disk, ensuring zero photo reuse
 * and zero blank textures when rendering the radial depth-displaced fallback mesh.
 */
export function createBespokeDishPlateCanvas(dishId: string): HTMLCanvasElement {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const cy = size / 2;

  // Base speckled ceramic plate background
  const plateGrad = ctx.createRadialGradient(cx, cy, 60, cx, cy, 512);
  plateGrad.addColorStop(0, '#EFE9DE');
  plateGrad.addColorStop(0.76, '#E4DDD0');
  plateGrad.addColorStop(0.92, '#D3C7B5');
  plateGrad.addColorStop(1, '#755033');
  ctx.fillStyle = plateGrad;
  ctx.fillRect(0, 0, size, size);

  // Ceramic speckles
  for (let i = 0; i < 900; i++) {
    const a = i * 2.39996;
    const rad = Math.sqrt(i / 900) * 495;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(72,46,28,0.28)' : 'rgba(120,84,54,0.22)';
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, 1.4 + (i % 3) * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  switch (dishId) {
    case 'pourover-geisha': {
      // Ruby-amber Colombian Huila pour-over bloom swirl in ceramic V60 / carafe
      const brewG = ctx.createRadialGradient(cx - 24, cy - 24, 24, cx, cy, 330);
      brewG.addColorStop(0, '#C85A20');
      brewG.addColorStop(0.45, '#7A280C');
      brewG.addColorStop(0.85, '#361005');
      brewG.addColorStop(1, '#F6F1E7');
      ctx.fillStyle = brewG;
      ctx.beginPath();
      ctx.arc(cx, cy, 335, 0, Math.PI * 2);
      ctx.fill();

      // Spiral V60 pour-over crema rings
      ctx.strokeStyle = 'rgba(238, 178, 118, 0.55)';
      ctx.lineWidth = 8;
      ctx.beginPath();
      for (let t = 0; t < 38; t += 0.15) {
        const r = t * 7.2;
        const x = cx + Math.cos(t) * r;
        const y = cy + Math.sin(t) * r;
        if (t === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      break;
    }

    case 'hibiscus-spritz': {
      // Luminous ruby hibiscus & pomegranate tonic with ice crystals, arils & mint
      const spritzG = ctx.createRadialGradient(cx, cy, 30, cx, cy, 340);
      spritzG.addColorStop(0, '#EA3B62');
      spritzG.addColorStop(0.6, '#A81535');
      spritzG.addColorStop(1, '#5E0A1D');
      ctx.fillStyle = spritzG;
      ctx.beginPath();
      ctx.arc(cx, cy, 340, 0, Math.PI * 2);
      ctx.fill();

      // Translucent ice facets + pomegranate arils
      for (let i = 0; i < 28; i++) {
        const a = i * 2.1;
        const r = 45 + (i % 6) * 42;
        ctx.fillStyle = i % 3 === 0 ? 'rgba(255,245,248,0.45)' : '#69061B';
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, i % 3 === 0 ? 34 : 11, 0, Math.PI * 2);
        ctx.fill();
      }
      // Fresh garden mint leaves
      ctx.fillStyle = '#3E7B34';
      ctx.beginPath();
      ctx.ellipse(cx - 55, cy - 35, 68, 32, -0.5, 0, Math.PI * 2);
      ctx.ellipse(cx + 20, cy - 65, 56, 26, 0.4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'acai-bowl': {
      // Velvety purple Amazonian açaí smoothie base + banana coins, granola & berries
      const acaiG = ctx.createRadialGradient(cx, cy, 40, cx, cy, 365);
      acaiG.addColorStop(0, '#6B2860');
      acaiG.addColorStop(0.7, '#4B1843');
      acaiG.addColorStop(1, '#330F2E');
      ctx.fillStyle = acaiG;
      ctx.beginPath();
      ctx.arc(cx, cy, 365, 0, Math.PI * 2);
      ctx.fill();

      // Curved row of sliced banana coins
      for (let b = 0; b < 7; b++) {
        const ang = -1.2 + b * 0.28;
        const bx = cx + Math.cos(ang) * 210;
        const by = cy + Math.sin(ang) * 210;
        ctx.fillStyle = '#F7EAB5';
        ctx.beginPath();
        ctx.arc(bx, by, 44, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#DFC97E';
        ctx.beginPath();
        ctx.arc(bx, by, 14, 0, Math.PI * 2);
        ctx.fill();
      }
      // Toasted oat granola clusters & blueberries
      for (let g = 0; g < 65; g++) {
        const gx = cx - 220 + ((g * 43) % 240);
        const gy = cy - 60 + ((g * 67) % 260);
        ctx.fillStyle = g % 4 === 0 ? '#242246' : '#C68B46';
        ctx.beginPath();
        ctx.arc(gx, gy, g % 4 === 0 ? 15 : 9 + (g % 5), 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'tuscan-panini': {
      // Pressed golden-brown grill-marked ciabatta panini with basil pesto & mozzarella
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.24);
      ctx.fillStyle = '#C98A46';
      ctx.beginPath();
      ctx.roundRect(-310, -175, 620, 350, 56);
      ctx.fill();

      // Melted mozzarella & roasted red pepper peek along seam
      ctx.fillStyle = '#F8EFE0';
      ctx.fillRect(-285, -18, 570, 36);
      ctx.fillStyle = '#B82E1F';
      ctx.fillRect(-250, -8, 500, 16);

      // Diagonal cast-iron panini press sear marks
      ctx.strokeStyle = '#4A240D';
      ctx.lineWidth = 14;
      for (let m = -240; m <= 240; m += 68) {
        ctx.beginPath();
        ctx.moveTo(m - 55, -150);
        ctx.lineTo(m + 55, 150);
        ctx.stroke();
      }
      ctx.restore();
      break;
    }

    case 'burrata-fig-pizza': {
      // Blistered wood-fired cornicione crust + creamy burrata + roasted purple figs + arugula
      ctx.fillStyle = '#C88B4B';
      ctx.beginPath();
      ctx.arc(cx, cy, 395, 0, Math.PI * 2);
      ctx.fill();

      // Charred leopard spots on crust
      for (let c = 0; c < 34; c++) {
        const a = (c / 34) * Math.PI * 2;
        ctx.fillStyle = '#2B160B';
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * 368, cy + Math.sin(a) * 368, 12 + (c % 4) * 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // San Marzano & aged balsamic base
      ctx.fillStyle = '#8F291D';
      ctx.beginPath();
      ctx.arc(cx, cy, 330, 0, Math.PI * 2);
      ctx.fill();

      // Quartered black mission figs & torn burrata clouds + central whole burrata
      for (let f = 0; f < 6; f++) {
        const a = (f / 6) * Math.PI * 2;
        const fx = cx + Math.cos(a) * 195;
        const fy = cy + Math.sin(a) * 195;
        ctx.fillStyle = '#4E1A3D';
        ctx.beginPath();
        ctx.arc(fx, fy, 42, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#C94A6A';
        ctx.beginPath();
        ctx.arc(fx, fy, 26, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#FAF7F0';
      ctx.beginPath();
      ctx.arc(cx, cy, 96, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'skillet-brownie': {
      // Cast-iron skillet dark Valrhona fudge brownie + Madagascar vanilla gelato + salted caramel
      ctx.fillStyle = '#1E1B1A';
      ctx.beginPath();
      ctx.arc(cx, cy, 405, 0, Math.PI * 2);
      ctx.fill();

      const brownieG = ctx.createRadialGradient(cx, cy, 30, cx, cy, 355);
      brownieG.addColorStop(0, '#4A2616');
      brownieG.addColorStop(1, '#2B140B');
      ctx.fillStyle = brownieG;
      ctx.beginPath();
      ctx.arc(cx, cy, 355, 0, Math.PI * 2);
      ctx.fill();

      // Vanilla bean gelato scoop in center
      const scoopG = ctx.createRadialGradient(cx - 25, cy - 25, 12, cx, cy, 125);
      scoopG.addColorStop(0, '#FFFDF7');
      scoopG.addColorStop(1, '#EADBC0');
      ctx.fillStyle = scoopG;
      ctx.beginPath();
      ctx.arc(cx, cy, 122, 0, Math.PI * 2);
      ctx.fill();

      // Salted caramel ribbons
      ctx.strokeStyle = '#C97A22';
      ctx.lineWidth = 10;
      for (let r = -180; r <= 180; r += 60) {
        ctx.beginPath();
        ctx.moveTo(cx - 230, cy + r);
        ctx.bezierCurveTo(cx - 80, cy + r - 50, cx + 80, cy + r + 50, cx + 230, cy + r);
        ctx.stroke();
      }
      break;
    }

    case 'almond-croissant':
    default: {
      // Twice-baked golden laminated frangipane croissant with toasted sliced almonds & snow sugar
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.22);
      for (let seg = -3; seg <= 3; seg++) {
        const sx = seg * 78;
        const sy = Math.abs(seg) * 18;
        const rx = 95 - Math.abs(seg) * 11;
        const ry = 148 - Math.abs(seg) * 18;
        const g = ctx.createRadialGradient(sx, sy - 20, 10, sx, sy, ry);
        g.addColorStop(0, '#E3A44E');
        g.addColorStop(0.7, '#B86E24');
        g.addColorStop(1, '#7A4212');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(sx, sy, rx, ry, seg * 0.12, 0, Math.PI * 2);
        ctx.fill();
      }
      // Toasted flaked almonds + powdered sugar veil
      for (let a = 0; a < 52; a++) {
        const ax = -210 + ((a * 53) % 420);
        const ay = -85 + ((a * 37) % 175);
        ctx.fillStyle = a % 2 === 0 ? '#F4DFB6' : '#D9AB6C';
        ctx.beginPath();
        ctx.ellipse(ax, ay, 18, 9, a * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      break;
    }
  }

  return canvas;
}
