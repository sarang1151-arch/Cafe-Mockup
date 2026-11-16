import { execFileSync, spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

const SRC_W = 1600;
const SRC_H = 900;
const OUT_W = 1280;
const OUT_H = 720;
const FPS = 30;
const TOTAL_SECONDS = 16;
const TOTAL_FRAMES = FPS * TOTAL_SECONDS; // 480 frames
const FX_W = 320;
const FX_H = 180;

function decodeImageToRgb(imgPath: string): Uint8Array {
  const buf = execFileSync(
    '/usr/bin/ffmpeg',
    [
      '-v',
      'error',
      '-i',
      imgPath,
      '-vf',
      `scale=${SRC_W}:${SRC_H}:force_original_aspect_ratio=increase,crop=${SRC_W}:${SRC_H}`,
      '-f',
      'rawvideo',
      '-pix_fmt',
      'rgb24',
      'pipe:1',
    ],
    { maxBuffer: SRC_W * SRC_H * 4 }
  );
  return new Uint8Array(buf.buffer, buf.byteOffset, SRC_W * SRC_H * 3);
}

function hash2(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function valueNoise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy);
  const b = hash2(ix + 1, iy);
  const c = hash2(ix, iy + 1);
  const d = hash2(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm(x: number, y: number): number {
  return (
    0.55 * valueNoise(x, y) +
    0.30 * valueNoise(x * 2.03 + 7.1, y * 2.03 + 3.4) +
    0.15 * valueNoise(x * 4.07 + 13.7, y * 4.07 + 9.2)
  );
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

interface Mote {
  x0: number;
  y0: number;
  vx: number;
  vy: number;
  size: number;
  phase: number;
  warmth: number;
}

const MOTES: Mote[] = Array.from({ length: 42 }, (_, i) => ({
  x0: hash2(i * 3.1, 1.7),
  y0: hash2(i * 5.7, 9.3),
  vx: (hash2(i * 2.3, 4.1) - 0.35) * 0.035,
  vy: -0.022 - hash2(i * 7.9, 2.5) * 0.028,
  size: 0.006 + hash2(i * 11.3, 6.1) * 0.011,
  phase: hash2(i * 13.7, 8.9) * Math.PI * 2,
  warmth: 0.65 + hash2(i * 17.1, 3.3) * 0.35,
}));

/**
 * Adds a curling volumetric steam plume in normalized source-image UV space (0..1)
 */
function evalSteamPlume(
  u: number,
  v: number,
  srcU: number,
  srcV: number,
  widthU: number,
  heightV: number,
  timeSec: number,
  strength: number
): number {
  const dy = srcV - v;
  if (dy <= 0 || dy > heightV) return 0;
  const riseFrac = dy / heightV; // 0 at cup rim -> 1 at top of plume
  const sway =
    Math.sin(riseFrac * 5.2 - timeSec * 2.4 + srcU * 10) * widthU * (0.32 + riseFrac * 0.85);
  const spread = widthU * (0.42 + riseFrac * 1.45);
  const dx = (u - (srcU + sway)) / spread;
  if (Math.abs(dx) > 1.35) return 0;

  const radial = Math.exp(-dx * dx * 2.1);
  const verticalEnv = smoothstep(0, 0.14, riseFrac) * (1 - smoothstep(0.55, 1.0, riseFrac));
  const wispy = fbm(u * 26 - sway * 8, v * 22 + timeSec * 1.55);
  const detail = Math.max(0, wispy - 0.32) * 1.65;
  return radial * verticalEnv * detail * strength;
}

/**
 * Renders one single shot at local time `localSec` (0..4.9s) into an RGB buffer of OUT_W x OUT_H.
 */
function renderShotFrame(
  shotIdx: number,
  srcRgb: Uint8Array,
  localSec: number,
  globalSec: number,
  outRgb: Uint8Array,
  fxAddR: Float32Array,
  fxAddG: Float32Array,
  fxAddB: Float32Array
) {
  // 1. Camera trajectory per shot (noticeable, silky cinema dolly & pan!)
  let scale = 1.12;
  let panU = 0; // -1..1
  let panV = 0;
  const p = localSec / 4.9; // 0..1 across shot + overlap

  if (shotIdx === 0) {
    // Courtyard: smooth push-in toward sunlit arches & steaming latte cup
    scale = 1.04 + p * 0.12;
    panU = -0.35 + p * 0.65;
    panV = 0.15 - p * 0.30;
  } else if (shotIdx === 1) {
    // Roastery: slow pull-out & lateral pan across cast-iron Probat roaster
    scale = 1.16 - p * 0.10;
    panU = 0.35 - p * 0.70;
    panV = -0.18 + p * 0.32;
  } else if (shotIdx === 2) {
    // Reading Nook & Vinyl: smooth right-to-left dolly from turntable toward emerald armchair
    scale = 1.06 + p * 0.10;
    panU = 0.45 - p * 0.85;
    panV = 0.08 - p * 0.20;
  } else {
    // Night Vaults: intimate push-in toward flickering candles & glowing hi-fi tubes
    scale = 1.05 + p * 0.12;
    panU = -0.30 + p * 0.60;
    panV = 0.20 - p * 0.35;
  }

  const cropW = SRC_W / scale;
  const cropH = SRC_H / scale;
  const maxOffX = (SRC_W - cropW) * 0.5;
  const maxOffY = (SRC_H - cropH) * 0.5;
  const originX = maxOffX + panU * maxOffX;
  const originY = maxOffY + panV * maxOffY;

  // 2. Compute low-frequency atmospheric light, steam & bokeh on FX_W x FX_H grid
  fxAddR.fill(0);
  fxAddG.fill(0);
  fxAddB.fill(0);

  for (let fy = 0; fy < FX_H; fy++) {
    const outV = (fy + 0.5) / FX_H;
    const imgV = (originY + outV * cropH) / SRC_H;

    for (let fx = 0; fx < FX_W; fx++) {
      const outU = (fx + 0.5) / FX_W;
      const imgU = (originX + outU * cropW) / SRC_W;
      const idx = fy * FX_W + fx;

      let ar = 0;
      let ag = 0;
      let ab = 0;

      if (shotIdx === 0) {
        // Rising steam from foreground ceramic latte art cup (u=0.165, v=0.815)
        const s1 = evalSteamPlume(imgU, imgV, 0.166, 0.815, 0.036, 0.25, globalSec, 56);
        // Subtle steam from courtyard couple's coffee cup (u=0.808, v=0.625)
        const s2 = evalSteamPlume(imgU, imgV, 0.808, 0.625, 0.018, 0.13, globalSec + 1.7, 28);
        const steam = s1 + s2;
        ar += steam * 1.04;
        ag += steam * 0.98;
        ab += steam * 0.90;

        // Golden-hour sunbeam streaming diagonally from arched left window & right archway
        const beamCoord = imgU * 0.82 - imgV * 0.52;
        const rayWave =
          0.5 +
          0.5 * Math.sin(beamCoord * 22 - globalSec * 1.1) * Math.cos(beamCoord * 11 + globalSec * 0.7);
        const leftWindowMask =
          smoothstep(0.0, 0.12, imgU) * (1 - smoothstep(0.28, 0.56, imgU)) * (1 - smoothstep(0.35, 0.92, imgV));
        const sunBreath = 0.75 + 0.25 * Math.sin(globalSec * 1.4);
        const ray = leftWindowMask * rayWave * 22 * sunBreath;
        ar += ray * 1.25;
        ag += ray * 0.92;
        ab += ray * 0.48;

        // Bookshelf brass lamp warm glow at (0.478, 0.215)
        const dLamp = Math.hypot(imgU - 0.478, (imgV - 0.215) * 0.85);
        if (dLamp < 0.16) {
          const g = Math.exp(-dLamp * dLamp * 95) * (10 + 4 * Math.sin(globalSec * 3.1));
          ar += g * 1.3;
          ag += g * 0.9;
          ab += g * 0.4;
        }
      } else if (shotIdx === 1) {
        // Roastery billowing steam/smoke from Probat cooling tray (0.54, 0.58) & upper chimney (0.55, 0.24)
        const traySmoke = evalSteamPlume(imgU, imgV, 0.542, 0.585, 0.062, 0.34, globalSec * 0.95, 52);
        const hopperSmoke = evalSteamPlume(imgU, imgV, 0.552, 0.255, 0.055, 0.24, globalSec * 1.1 + 2.3, 46);
        const smoke = traySmoke + hopperSmoke;
        ar += smoke * 1.05;
        ag += smoke * 0.96;
        ab += smoke * 0.86;

        // Warm morning sunbeam shafts from arched left doorway
        const archMask = (1 - smoothstep(0.06, 0.42, imgU)) * (1 - smoothstep(0.25, 0.85, imgV));
        const shaft = archMask * (0.55 + 0.45 * Math.sin((imgU * 18 - imgV * 9) - globalSec * 1.25)) * 24;
        ar += shaft * 1.28;
        ag += shaft * 0.94;
        ab += shaft * 0.50;
      } else if (shotIdx === 2) {
        // Reading Nook: steam from ceramic cup beside emerald velvet armchair (0.205, 0.702)
        const cupSteam = evalSteamPlume(imgU, imgV, 0.205, 0.702, 0.026, 0.20, globalSec * 1.05, 50);
        ar += cupSteam * 1.04;
        ag += cupSteam * 0.99;
        ab += cupSteam * 0.92;

        // Spinning vinyl record specular glint at (0.614, 0.545)
        const vx = (imgU - 0.614) / 0.042;
        const vy = (imgV - 0.545) / 0.014;
        const vr = Math.hypot(vx, vy);
        if (vr > 0.22 && vr < 1.0) {
          const ang = Math.atan2(vy, vx) - globalSec * 3.49; // 33.3 RPM = 3.49 rad/s!
          const sheen = Math.pow(Math.max(0, Math.cos(ang * 2)), 6) * (1 - Math.abs(vr - 0.62) * 1.8);
          if (sheen > 0) {
            ar += sheen * 34;
            ag += sheen * 28;
            ab += sheen * 22;
          }
        }

        // Warm reading lamp glow at (0.785, 0.39) & brass dome at (0.282, 0.31)
        const dL1 = Math.hypot(imgU - 0.785, imgV - 0.39);
        const dL2 = Math.hypot(imgU - 0.282, imgV - 0.31);
        const lampPulse = 1 + 0.18 * Math.sin(globalSec * 2.6);
        const lg = (Math.exp(-dL1 * dL1 * 80) * 16 + Math.exp(-dL2 * dL2 * 95) * 13) * lampPulse;
        ar += lg * 1.25;
        ag += lg * 0.95;
        ab += lg * 0.52;
      } else {
        // Shot 3: Candlelit Night Vaults — 3 flickering candles + Edison filaments + spinning vinyl!
        const candles: [number, number, number][] = [
          [0.122, 0.878, 0.0],
          [0.264, 0.715, 2.1],
          [0.356, 0.608, 4.3],
        ];
        for (const [cu, cv, ph] of candles) {
          const dc = Math.hypot(imgU - cu, (imgV - cv) * 0.9);
          if (dc < 0.16) {
            const flicker =
              0.72 +
              0.18 * Math.sin(globalSec * 9.5 + ph) +
              0.14 * Math.sin(globalSec * 17.3 + ph * 1.7) +
              0.08 * Math.cos(globalSec * 27.1 + ph);
            const halo = Math.exp(-dc * dc * 125) * 34 * flicker;
            ar += halo * 1.38;
            ag += halo * 0.86;
            ab += halo * 0.32;
          }
        }

        // Hanging Edison filament bulbs warm shimmer
        const bulbs: [number, number, number][] = [
          [0.725, 0.145, 1.1],
          [0.858, 0.312, 2.8],
          [0.946, 0.422, 4.5],
        ];
        for (const [bu, bv, bph] of bulbs) {
          const db = Math.hypot(imgU - bu, imgV - bv);
          if (db < 0.14) {
            const pulse = 0.82 + 0.18 * Math.sin(globalSec * 4.2 + bph);
            const bglow = Math.exp(-db * db * 110) * 20 * pulse;
            ar += bglow * 1.3;
            ag += bglow * 0.92;
            ab += bglow * 0.42;
          }
        }

        // Spinning vinyl record sheen on evening turntable (0.662, 0.625)
        const nvx = (imgU - 0.662) / 0.062;
        const nvy = (imgV - 0.625) / 0.018;
        const nvr = Math.hypot(nvx, nvy);
        if (nvr > 0.22 && nvr < 1.0) {
          const ang = Math.atan2(nvy, nvx) - globalSec * 3.49;
          const sheen = Math.pow(Math.max(0, Math.cos(ang * 2)), 6) * 32;
          ar += sheen * 1.15;
          ag += sheen * 0.88;
          ab += sheen * 0.55;
        }
      }

      fxAddR[idx] = ar;
      fxAddG[idx] = ag;
      fxAddB[idx] = ab;
    }
  }

  // Stamp floating golden dust motes / evening bokeh orbs into FX buffer
  for (let m = 0; m < MOTES.length; m++) {
    const mote = MOTES[m];
    const mu = (((mote.x0 + mote.vx * globalSec) % 1) + 1) % 1;
    const mv = (((mote.y0 + mote.vy * globalSec) % 1) + 1) % 1;
    const twinkle = 0.45 + 0.55 * Math.sin(globalSec * 3.2 + mote.phase);
    const intensity = (shotIdx === 3 ? 28 : 22) * twinkle;
    const cx = mu * FX_W;
    const cy = mv * FX_H;
    const rad = Math.max(1.4, mote.size * FX_W);
    const x0 = Math.max(0, Math.floor(cx - rad - 1));
    const x1 = Math.min(FX_W - 1, Math.ceil(cx + rad + 1));
    const y0 = Math.max(0, Math.floor(cy - rad - 1));
    const y1 = Math.min(FX_H - 1, Math.ceil(cy + rad + 1));

    for (let yy = y0; yy <= y1; yy++) {
      for (let xx = x0; xx <= x1; xx++) {
        const d2 = ((xx - cx) * (xx - cx) + (yy - cy) * (yy - cy)) / (rad * rad);
        if (d2 < 1) {
          const w = (1 - d2) * (1 - d2) * intensity;
          const fi = yy * FX_W + xx;
          fxAddR[fi] += w * 1.25;
          fxAddG[fi] += w * (0.85 + mote.warmth * 0.15);
          fxAddB[fi] += w * 0.48;
        }
      }
    }
  }

  // 3. Full-resolution 1280x720 pass: sub-pixel bilinear camera sampling + localized foliage breeze + FX composite
  const stepX = cropW / OUT_W;
  const stepY = cropH / OUT_H;

  for (let y = 0; y < OUT_H; y++) {
    const baseSrcY = originY + (y + 0.5) * stepY;
    const imgV = baseSrcY / SRC_H;

    // FX vertical bilinear coords
    const fyc = ((y + 0.5) / OUT_H) * FX_H - 0.5;
    const fy0 = Math.max(0, Math.min(FX_H - 1, Math.floor(fyc)));
    const fy1 = Math.min(FX_H - 1, fy0 + 1);
    const fwy = Math.max(0, Math.min(1, fyc - fy0));

    for (let x = 0; x < OUT_W; x++) {
      let sx = originX + (x + 0.5) * stepX;
      let sy = baseSrcY;
      const imgU = sx / SRC_W;

      // Gentle living breeze sway on courtyard plants & hanging ivy in Shot 0
      if (shotIdx === 0) {
        const inForegroundMonstera =
          imgU > 0.44 && imgU < 0.72 && imgV > 0.40 && imgV < 0.96;
        const inHangingIvy = imgU > 0.56 && imgV < 0.44;
        const inCourtyardFern = imgU > 0.72 && imgV > 0.34 && imgV < 0.88;
        if (inForegroundMonstera || inHangingIvy || inCourtyardFern) {
          const mask = inForegroundMonstera
            ? Math.sin(((imgU - 0.44) / 0.28) * Math.PI) * Math.sin(((imgV - 0.40) / 0.56) * Math.PI)
            : 0.65;
          sx += Math.sin(globalSec * 2.15 + imgV * 11.0 + imgU * 5.0) * 4.8 * mask;
          sy += Math.cos(globalSec * 1.75 + imgU * 9.0) * 2.1 * mask;
        }
      }

      // Clamp & bilinear sample source RGB
      const csx = Math.max(0, Math.min(SRC_W - 1.001, sx));
      const csy = Math.max(0, Math.min(SRC_H - 1.001, sy));
      const x0 = csx | 0;
      const y0 = csy | 0;
      const wx = csx - x0;
      const wy = csy - y0;
      const w00 = (1 - wx) * (1 - wy);
      const w10 = wx * (1 - wy);
      const w01 = (1 - wx) * wy;
      const w11 = wx * wy;

      const i00 = (y0 * SRC_W + x0) * 3;
      const i10 = i00 + 3;
      const i01 = i00 + SRC_W * 3;
      const i11 = i01 + 3;

      let r =
        srcRgb[i00] * w00 + srcRgb[i10] * w10 + srcRgb[i01] * w01 + srcRgb[i11] * w11;
      let g =
        srcRgb[i00 + 1] * w00 +
        srcRgb[i10 + 1] * w10 +
        srcRgb[i01 + 1] * w01 +
        srcRgb[i11 + 1] * w11;
      let b =
        srcRgb[i00 + 2] * w00 +
        srcRgb[i10 + 2] * w10 +
        srcRgb[i01 + 2] * w01 +
        srcRgb[i11 + 2] * w11;

      // Bilinear sample FX additive light & steam
      const fxc = ((x + 0.5) / OUT_W) * FX_W - 0.5;
      const fx0 = Math.max(0, Math.min(FX_W - 1, Math.floor(fxc)));
      const fx1 = Math.min(FX_W - 1, fx0 + 1);
      const fwx = Math.max(0, Math.min(1, fxc - fx0));

      const f00 = fy0 * FX_W + fx0;
      const f10 = fy0 * FX_W + fx1;
      const f01 = fy1 * FX_W + fx0;
      const f11 = fy1 * FX_W + fx1;
      const fw00 = (1 - fwx) * (1 - fwy);
      const fw10 = fwx * (1 - fwy);
      const fw01 = (1 - fwx) * fwy;
      const fw11 = fwx * fwy;

      const addR =
        fxAddR[f00] * fw00 + fxAddR[f10] * fw10 + fxAddR[f01] * fw01 + fxAddR[f11] * fw11;
      const addG =
        fxAddG[f00] * fw00 + fxAddG[f10] * fw10 + fxAddG[f01] * fw01 + fxAddG[f11] * fw11;
      const addB =
        fxAddB[f00] * fw00 + fxAddB[f10] * fw10 + fxAddB[f01] * fw01 + fxAddB[f11] * fw11;

      // Soft screen-like highlight rolloff so steam & sunbeams never clip harshly
      r = r + addR * (1 - r / 340);
      g = g + addG * (1 - g / 340);
      b = b + addB * (1 - b / 340);

      const outIdx = (y * OUT_W + x) * 3;
      outRgb[outIdx] = r < 0 ? 0 : r > 255 ? 255 : r;
      outRgb[outIdx + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
      outRgb[outIdx + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
    }
  }
}

async function main() {
  const rootDir = process.cwd();
  const imgDir = path.join(rootDir, 'src/assets/images');
  const videoDir = path.join(rootDir, 'public/assets/video');
  fs.mkdirSync(videoDir, { recursive: true });

  const shotPaths = [
    path.join(imgDir, 'willow_hero_courtyard_1793783066961.jpg'),
    path.join(imgDir, 'story_roastery_beans_1793783077879.jpg'),
    path.join(imgDir, 'space_reading_vinyl_1793783075792.jpg'),
    path.join(imgDir, 'willow_night_ambiance_1793783068740.jpg'),
  ];

  console.log('Decoding 4 high-res Willow Café scenes...');
  const shots = shotPaths.map((p) => decodeImageToRgb(p));

  const outFilmPath = path.join(videoDir, 'willow-cafe-film.mp4');
  const outHeroPath = path.join(videoDir, 'hero.mp4');

  console.log(`Synthesizing ${TOTAL_FRAMES} living 30fps HD frames (${OUT_W}x${OUT_H})...`);

  const ff = spawn(
    '/usr/bin/ffmpeg',
    [
      '-y',
      '-f',
      'rawvideo',
      '-pix_fmt',
      'rgb24',
      '-s',
      `${OUT_W}x${OUT_H}`,
      '-r',
      String(FPS),
      '-i',
      'pipe:0',
      '-c:v',
      'libx264',
      '-preset',
      'fast',
      '-crf',
      '19',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      '-an',
      outFilmPath,
    ],
    { stdio: ['pipe', 'inherit', 'inherit'] }
  );

  const bufA = new Uint8Array(OUT_W * OUT_H * 3);
  const bufB = new Uint8Array(OUT_W * OUT_H * 3);
  const fxR = new Float32Array(FX_W * FX_H);
  const fxG = new Float32Array(FX_W * FX_H);
  const fxB = new Float32Array(FX_W * FX_H);

  const shotLen = 4.0; // 4 seconds per café chapter (16s total)
  const fadeDur = 0.85; // Smooth optical dissolve between chapters + seamless loop back to 0!

  for (let f = 0; f < TOTAL_FRAMES; f++) {
    const t = f / FPS;
    const shotIdx = Math.min(3, Math.floor(t / shotLen));
    const localT = t - shotIdx * shotLen;

    // Note: during final dissolve (15.15s..16.0s), globalSec for Shot 0 wraps toward 0 so frame 479 -> frame 0 is seamless!
    renderShotFrame(shotIdx, shots[shotIdx], localT, t, bufA, fxR, fxG, fxB);

    if (localT > shotLen - fadeDur) {
      const blendT = smoothstep(shotLen - fadeDur, shotLen, localT);
      const nextIdx = (shotIdx + 1) % 4;
      const nextLocalT = localT - shotLen + fadeDur; // 0..fadeDur into incoming shot
      const nextGlobalT = nextIdx === 0 ? localT - shotLen : t;
      renderShotFrame(nextIdx, shots[nextIdx], Math.max(0, nextLocalT * 0.35), nextGlobalT, bufB, fxR, fxG, fxB);

      const nBytes = bufA.length;
      const inv = 1 - blendT;
      for (let i = 0; i < nBytes; i++) {
        bufA[i] = bufA[i] * inv + bufB[i] * blendT;
      }
    }

    const canContinue = ff.stdin.write(Buffer.from(bufA.buffer.slice(0)));
    if (!canContinue) {
      await new Promise<void>((resolve) => ff.stdin.once('drain', resolve));
    }
  }

  ff.stdin.end();
  await new Promise<void>((resolve, reject) => {
    ff.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}`));
    });
  });

  // Sync hero.mp4 as well so both /assets/video/willow-cafe-film.mp4 and /assets/video/hero.mp4 serve the living film
  fs.copyFileSync(outFilmPath, outHeroPath);

  const stat = fs.statSync(outFilmPath);
  console.log(
    `✓ Living Café Film generated: ${outFilmPath} & ${outHeroPath} (${(
      stat.size /
      (1024 * 1024)
    ).toFixed(2)} MB)`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
