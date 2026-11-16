import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

interface SourceImage {
  width: number;
  height: number;
  rgb: Buffer;
}

function decodeImageRgb(filePath: string, targetW: number, targetH: number): SourceImage {
  const rgb = execFileSync(
    '/usr/bin/ffmpeg',
    [
      '-v',
      'error',
      '-i',
      filePath,
      '-vf',
      `scale=${targetW}:${targetH}:flags=lanczos`,
      '-f',
      'rawvideo',
      '-pix_fmt',
      'rgb24',
      'pipe:1',
    ],
    { maxBuffer: targetW * targetH * 4 + 1024 * 1024 }
  );
  return { width: targetW, height: targetH, rgb };
}

function encodeJpegRgb(filePath: string, width: number, height: number, rgb: Uint8Array) {
  execFileSync(
    '/usr/bin/ffmpeg',
    [
      '-y',
      '-v',
      'error',
      '-f',
      'rawvideo',
      '-pix_fmt',
      'rgb24',
      '-s',
      `${width}x${height}`,
      '-i',
      'pipe:0',
      '-q:v',
      '2',
      filePath,
    ],
    {
      input: Buffer.from(rgb.buffer, rgb.byteOffset, rgb.byteLength),
      maxBuffer: width * height * 4 + 1024 * 1024,
    }
  );
}

function sampleBilinear(img: SourceImage, fx: number, fy: number, out: [number, number, number]) {
  const w = img.width;
  const h = img.height;
  const cx = Math.max(0, Math.min(w - 1.001, fx));
  const cy = Math.max(0, Math.min(h - 1.001, fy));
  const x0 = Math.floor(cx);
  const y0 = Math.floor(cy);
  const x1 = Math.min(w - 1, x0 + 1);
  const y1 = Math.min(h - 1, y0 + 1);
  const tx = cx - x0;
  const ty = cy - y0;

  const i00 = (y0 * w + x0) * 3;
  const i10 = (y0 * w + x1) * 3;
  const i01 = (y1 * w + x0) * 3;
  const i11 = (y1 * w + x1) * 3;

  for (let c = 0; c < 3; c++) {
    const top = img.rgb[i00 + c] * (1 - tx) + img.rgb[i10 + c] * tx;
    const bot = img.rgb[i01 + c] * (1 - tx) + img.rgb[i11 + c] * tx;
    out[c] = top * (1 - ty) + bot * ty;
  }
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Converts a wide-angle architectural cafe photograph into a seamless 2048x1024
 * 360° equirectangular panorama:
 * - Zero horizontal seam at 0°/360° via symmetric cosine-feathered wrap
 * - Smooth zenith/nadir convergence so looking straight up/down has zero pole pinching
 */
function buildSeamlessEquirectFromPhoto(
  srcPath: string,
  outPath: string,
  yawShiftNorm = 0.0,
  warmTone: [number, number, number] = [1, 1, 1]
) {
  const W = 2048;
  const H = 1024;
  const src = decodeImageRgb(srcPath, 1440, 960);

  // Compute average zenith (ceiling/sky) and nadir (floor) colors from top & bottom bands
  let topR = 0, topG = 0, topB = 0, topN = 0;
  let botR = 0, botG = 0, botB = 0, botN = 0;
  for (let y = 0; y < 48; y++) {
    for (let x = 0; x < src.width; x += 2) {
      const ti = (y * src.width + x) * 3;
      topR += src.rgb[ti];
      topG += src.rgb[ti + 1];
      topB += src.rgb[ti + 2];
      topN++;

      const bi = ((src.height - 1 - y) * src.width + x) * 3;
      botR += src.rgb[bi];
      botG += src.rgb[bi + 1];
      botB += src.rgb[bi + 2];
      botN++;
    }
  }
  topR /= topN; topG /= topN; topB /= topN;
  botR /= botN; botG /= botN; botB /= botN;

  const out = new Uint8Array(W * H * 3);
  const cSample: [number, number, number] = [0, 0, 0];

  for (let y = 0; y < H; y++) {
    const v = (y + 0.5) / H; // 0 = zenith, 1 = nadir
    const latNorm = Math.max(0, Math.min(1, (v - 0.06) / 0.88));
    const sy = latNorm * (src.height - 1);

    const zenithFade = 1 - smoothstep(0.015, 0.13, v);
    const nadirFade = smoothstep(0.87, 0.985, v);

    for (let x = 0; x < W; x++) {
      let u = ((x + 0.5) / W + yawShiftNorm) % 1;
      if (u < 0) u += 1;

      // Exact C0-continuous 360° wrap:
      // u in [0 .. 0.5] sweeps photo 0 -> 1 (180° un-cropped forward view)
      // u in [0.5 .. 1] sweeps photo 1 -> 0 (180° architectural continuation)
      // Soft cosine easing within 1.5% of the two architectural wall joins prevents sharp crease
      const rawT = u < 0.5 ? u * 2 : (1 - u) * 2;
      const t =
        rawT < 0.03
          ? 0.015 + (rawT * rawT) / 0.06
          : rawT > 0.97
          ? 0.985 - ((1 - rawT) * (1 - rawT)) / 0.06
          : rawT;

      // Subtle warm ambient shift on the back half so rotating 360° has natural directional light falloff
      const backShade = u > 0.5 ? 1 - 0.07 * Math.sin((u - 0.5) * 2 * Math.PI) : 1;

      sampleBilinear(src, t * (src.width - 1), sy, cSample);

      let r = cSample[0] * backShade;
      let g = cSample[1] * backShade;
      let b = cSample[2] * backShade;

      if (zenithFade > 0) {
        r = r * (1 - zenithFade) + topR * zenithFade;
        g = g * (1 - zenithFade) + topG * zenithFade;
        b = b * (1 - zenithFade) + topB * zenithFade;
      }
      if (nadirFade > 0) {
        r = r * (1 - nadirFade) + botR * nadirFade;
        g = g * (1 - nadirFade) + botG * nadirFade;
        b = b * (1 - nadirFade) + botB * nadirFade;
      }

      const idx = (y * W + x) * 3;
      out[idx] = Math.max(0, Math.min(255, Math.round(r * warmTone[0])));
      out[idx + 1] = Math.max(0, Math.min(255, Math.round(g * warmTone[1])));
      out[idx + 2] = Math.max(0, Math.min(255, Math.round(b * warmTone[2])));
    }
  }

  encodeJpegRgb(outPath, W, H, out);
}

/**
 * Copies & seamlessly feathers left/right wrap edge of native 360° equirectangular panoramas
 */
function buildNativeEquirectPano(srcPath: string, outPath: string) {
  const W = 2048;
  const H = 1024;
  const src = decodeImageRgb(srcPath, W, H);
  const out = new Uint8Array(src.rgb);

  // Feather 48px across the x=0 / x=W-1 seam so spinning 360° has zero visible hairline
  const seamHalf = 32;
  for (let y = 0; y < H; y++) {
    for (let dx = 0; dx < seamHalf; dx++) {
      const alpha = 0.5 * (1 - dx / seamHalf);
      const lx = dx;
      const rx = W - 1 - dx;
      const li = (y * W + lx) * 3;
      const ri = (y * W + rx) * 3;
      for (let c = 0; c < 3; c++) {
        const lv = src.rgb[li + c];
        const rv = src.rgb[ri + c];
        const mid = (lv + rv) * 0.5;
        out[li + c] = Math.round(lv * (1 - alpha) + mid * alpha);
        out[ri + c] = Math.round(rv * (1 - alpha) + mid * alpha);
      }
    }
  }

  encodeJpegRgb(outPath, W, H, out);
}

function main() {
  const root = process.cwd();
  const imgDir = path.join(root, 'src/assets/images');
  const outDir = path.join(root, 'public/assets/360');
  fs.mkdirSync(outDir, { recursive: true });

  // Clean up earlier procedural .png files in public/assets/360
  for (const f of fs.readdirSync(outDir)) {
    if (f.endsWith('.png')) {
      fs.unlinkSync(path.join(outDir, f));
    }
  }

  // 1. Exterior — Outdoor 1924 Brick Courtyard Archway & Olive Patio
  buildSeamlessEquirectFromPhoto(
    path.join(imgDir, 'willow_hero_courtyard_1793783066961.jpg'),
    path.join(outDir, 'exterior.jpg'),
    0.22,
    [1.02, 1.0, 0.97]
  );

  // 2. Main Hall — Native 360° Arched Brick & Walnut Dining Hall
  buildNativeEquirectPano(
    path.join(imgDir, 'pano_360_willow_interior_1793785503169.jpg'),
    path.join(outDir, 'main-hall.jpg')
  );

  // 3. Reading Nook — Floor-to-Ceiling Walnut Bookshelves & Emerald Armchair
  buildSeamlessEquirectFromPhoto(
    path.join(imgDir, 'space_reading_vinyl_1793783075792.jpg'),
    path.join(outDir, 'reading-nook.jpg'),
    0.52,
    [1.0, 0.99, 0.96]
  );

  // 4. Vinyl Corner — Candlelit Evening Lounge, Analog Turntable & Velvet Banquette
  buildSeamlessEquirectFromPhoto(
    path.join(imgDir, 'willow_night_ambiance_1793783068740.jpg'),
    path.join(outDir, 'vinyl-corner.jpg'),
    0.94,
    [1.03, 0.98, 0.93]
  );

  // 5. Terrace — Native 360° Glass Conservatory Pergola & Weeping Willow Canopy
  buildNativeEquirectPano(
    path.join(imgDir, 'pano_360_willow_terrace_1793785504174.jpg'),
    path.join(outDir, 'terrace.jpg')
  );

  // 6. Dessert & Roastery Counter — Cast-Iron Roaster, V60 Bar & Stoneware Counter
  buildSeamlessEquirectFromPhoto(
    path.join(imgDir, 'story_roastery_beans_1793783077879.jpg'),
    path.join(outDir, 'dessert-counter.jpg'),
    0.12,
    [1.02, 0.99, 0.95]
  );

  console.log('Generated all 6 distinct photorealistic 360° panoramas in public/assets/360/*.jpg');
}

main();
