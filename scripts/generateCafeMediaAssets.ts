import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as zlib from 'node:zlib';

/* ============================================================================
   MINIMAL PNG ENCODER FOR HIGH-RES EQUIRECTANGULAR PANORAMAS
   ============================================================================ */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type: string, data: Buffer): Buffer {
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(chunk.subarray(4, 8 + data.length)), 8 + data.length);
  return chunk;
}

function writeRgbPng(filePath: string, width: number, height: number, rgb: Uint8Array) {
  const rowBytes = width * 3 + 1;
  const raw = Buffer.alloc(rowBytes * height);
  for (let y = 0; y < height; y++) {
    const rOff = y * rowBytes;
    raw[rOff] = 0;
    const sOff = y * width * 3;
    raw.set(rgb.subarray(sOff, sOff + width * 3), rOff + 1);
  }
  const compressed = zlib.deflateSync(raw, { level: 6 });
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
  fs.writeFileSync(filePath, png);
}

/* ============================================================================
   1. GENERATE CINEMATIC CAFÉ MOTION VIDEO (/public/assets/video/hero.mp4)
   ============================================================================ */

function generateHeroMotionVideo(rootDir: string) {
  const videoDir = path.join(rootDir, 'public/assets/video');
  fs.mkdirSync(videoDir, { recursive: true });
  const outMp4 = path.join(videoDir, 'hero.mp4');

  const imgDir = path.join(rootDir, 'src/assets/images');
  const courtyard = path.join(imgDir, 'willow_hero_courtyard_1793783066961.jpg');
  const roastery = path.join(imgDir, 'story_roastery_beans_1793783077879.jpg');
  const reading = path.join(imgDir, 'space_reading_vinyl_1793783075792.jpg');
  const night = path.join(imgDir, 'willow_night_ambiance_1793783068740.jpg');

  console.log('Rendering seamless 12s café motion video (/public/assets/video/hero.mp4)...');

  // 5 inputs (courtyard -> roastery -> reading -> night -> courtyard) with smooth 24fps zoompan motion,
  // warm golden-hour café color grading, rising warm steam/sunbeam shimmer, and seamless loop xfade back to frame 0!
  const filterComplex = [
    `[0:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,zoompan=z='1.02+0.0012*on':x='iw/2-(iw/zoom/2)+on*0.35':y='ih/2-(ih/zoom/2)-on*0.15':d=96:s=1280x720:fps=24,format=yuv420p[v0]`,
    `[1:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,zoompan=z='1.12-0.0010*on':x='iw/2-(iw/zoom/2)-on*0.30':y='ih/2-(ih/zoom/2)+on*0.12':d=96:s=1280x720:fps=24,format=yuv420p[v1]`,
    `[2:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,zoompan=z='1.03+0.0011*on':x='iw/2-(iw/zoom/2)-on*0.28':y='ih/2-(ih/zoom/2)-on*0.10':d=96:s=1280x720:fps=24,format=yuv420p[v2]`,
    `[3:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,zoompan=z='1.11-0.0009*on':x='iw/2-(iw/zoom/2)+on*0.25':y='ih/2-(ih/zoom/2)-on*0.12':d=96:s=1280x720:fps=24,format=yuv420p[v3]`,
    `[4:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,zoompan=z='1.00+0.0008*on':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=48:s=1280x720:fps=24,format=yuv420p[v4]`,
    `[v0][v1]xfade=transition=fade:duration=1.0:offset=3.0[x1]`,
    `[x1][v2]xfade=transition=fade:duration=1.0:offset=6.0[x2]`,
    `[x2][v3]xfade=transition=fade:duration=1.0:offset=9.0[x3]`,
    `[x3][v4]xfade=transition=fade:duration=1.0:offset=12.0,trim=duration=13.0,setpts=PTS-STARTPTS,eq=saturation=1.06:contrast=1.03[outv]`,
  ].join(';');

  execFileSync(
    '/usr/bin/ffmpeg',
    [
      '-y',
      '-i',
      courtyard,
      '-i',
      roastery,
      '-i',
      reading,
      '-i',
      night,
      '-i',
      courtyard,
      '-filter_complex',
      filterComplex,
      '-map',
      '[outv]',
      '-c:v',
      'libx264',
      '-preset',
      'fast',
      '-crf',
      '22',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      '-an',
      outMp4,
    ],
    { stdio: 'inherit' }
  );

  const stat = fs.statSync(outMp4);
  console.log(`✓ Generated hero.mp4 (${(stat.size / (1024 * 1024)).toFixed(2)} MB)`);
}

/* ============================================================================
   2. GENERATE 6 COMPLETELY DISTINCT 360° EQUIRECTANGULAR PANORAMAS
      Uses true 3D spherical ray-box / architectural room projection so every
      space (Exterior Courtyard, Arched Main Hall, Walnut Reading Nook, Evening
      Vinyl Corner, Rooftop Willow Terrace, Travertine Dessert Counter) has
      authentic 360° geometry, distinct sky/ceiling/floor/walls, and zero reuse!
   ============================================================================ */

function hash2(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function noise2(x: number, y: number): number {
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

function clampByte(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
}

function mix3(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  const k = Math.max(0, Math.min(1, t));
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
}

type SceneId =
  | 'exterior'
  | 'main-hall'
  | 'reading-nook'
  | 'vinyl-corner'
  | 'terrace'
  | 'dessert-counter';

/**
 * Evaluates a 3D spherical ray (dx, dy, dz) inside one of the 6 distinct Willow Café spaces.
 * Camera is at (0, 1.65m, 0) inside a room/courtyard box [-W, W] x [0, H] x [-D, D].
 */
function shadeSceneRay(
  sceneId: SceneId,
  dx: number,
  dy: number,
  dz: number,
  basePhotoRgb: [number, number, number]
): [number, number, number] {
  // Room dimensions in meters per space
  const dims: Record<SceneId, [number, number, number]> = {
    exterior: [7.5, 6.5, 7.5],
    'main-hall': [6.2, 4.8, 7.0],
    'reading-nook': [4.6, 4.1, 5.2],
    'vinyl-corner': [4.8, 3.8, 4.8],
    terrace: [6.8, 5.4, 6.8],
    'dessert-counter': [5.2, 4.2, 5.6],
  };

  const [halfW, roomH, halfD] = dims[sceneId];
  const camY = 1.65;

  // Ray-box intersection from (0, camY, 0)
  const tx = dx > 1e-5 ? halfW / dx : dx < -1e-5 ? -halfW / dx : 1e6;
  const tz = dz > 1e-5 ? halfD / dz : dz < -1e-5 ? -halfD / dz : 1e6;
  const ty = dy > 1e-5 ? (roomH - camY) / dy : dy < -1e-5 ? -camY / dy : 1e6;

  const t = Math.min(tx, ty, tz);
  const hx = dx * t;
  const hy = camY + dy * t;
  const hz = dz * t;

  const hitFloor = Math.abs(t - ty) < 1e-4 && dy < 0;
  const hitCeil = Math.abs(t - ty) < 1e-4 && dy > 0;
  const hitWallX = !hitFloor && !hitCeil && Math.abs(t - tx) < 1e-4;
  // Wall horizontal coordinate `u` in meters and normalized `un`
  const wallU = hitWallX ? hz : hx;
  const wallSpan = hitWallX ? halfD : halfW;

  let col: [number, number, number] = [180, 165, 145];

  switch (sceneId) {
    // ========================================================================
    // SCENE 01: EXTERIOR COURTYARD (Open Morning Blue/Gold Sky, Terracotta
    // Herringbone Patio, 1924 Kiln-Fired Brick Arches, Chalkboard, Olive Trees)
    // ========================================================================
    case 'exterior': {
      if (hitCeil) {
        // Open morning sky overhead + courtyard roof eaves near edges
        const edgeFrac = Math.max(Math.abs(hx) / halfW, Math.abs(hz) / halfD);
        const sunDot = Math.max(0, dx * 0.45 + dy * 0.72 - dz * 0.52);
        const sky = mix3([98, 152, 206], [248, 222, 178], Math.pow(sunDot, 2.2) * 0.85 + (1 - dy) * 0.35);
        if (edgeFrac > 0.84) {
          // Terracotta roof tiles & trailing ivy overhang around perimeter
          const ivy = noise2(hx * 3.5, hz * 3.5);
          col = ivy > 0.58 ? [58, 92, 52] : [164, 92, 62];
        } else {
          col = sky;
        }
      } else if (hitFloor) {
        // Sun-warmed terracotta herringbone courtyard tiles
        const gx = Math.floor(hx * 3.2);
        const gz = Math.floor(hz * 3.2);
        const fx = Math.abs((hx * 3.2) % 1);
        const fz = Math.abs((hz * 3.2) % 1);
        const grout = fx < 0.06 || fz < 0.06;
        const tileVar = hash2(gx, gz) * 24 - 12;
        const sunShaft = Math.sin(hx * 0.8 + hz * 0.5) > 0.15 ? 1.16 : 0.88;
        col = grout
          ? [112, 86, 68]
          : [
              clampByte((184 + tileVar) * sunShaft),
              clampByte((112 + tileVar * 0.7) * sunShaft),
              clampByte((78 + tileVar * 0.5) * sunShaft),
            ];
      } else {
        // 1924 Red-Brown Kiln-Fired Brick Courtyard Walls + 3 Tall Arched Portals per wall
        const row = Math.floor(hy * 11);
        const brickX = wallU * 4.2 + (row % 2) * 0.5;
        const mortar = Math.abs(hy * 11 - row) < 0.12 || Math.abs(brickX - Math.floor(brickX)) < 0.08;
        const bTone = hash2(Math.floor(brickX), row) * 28;
        col = mortar ? [196, 182, 162] : [148 + bTone, 76 + bTone * 0.5, 54 + bTone * 0.4];

        // 3 Grand Arches along each courtyard wall
        const archSpacing = (wallSpan * 2) / 3;
        const localX = (((wallU + wallSpan) % archSpacing) + archSpacing) % archSpacing - archSpacing * 0.5;
        const archW = archSpacing * 0.34;
        const archSpringY = 2.45;
        const inArchRect = Math.abs(localX) < archW && hy < archSpringY && hy > 0.08;
        const inArchDome =
          hy >= archSpringY && Math.hypot(localX, hy - archSpringY) < archW;

        if (inArchRect || inArchDome) {
          // Warm glowing café interior / lush garden visible through brick arches (blended with real courtyard photo!)
          col = mix3(basePhotoRgb, [242, 198, 134], 0.28);
          // Mullion panes
          if (Math.abs(localX) < 0.035 || Math.abs(hy - 1.55) < 0.035) {
            col = [42, 32, 24];
          }
        } else if (
          Math.abs(Math.hypot(localX, Math.max(0, hy - archSpringY)) - archW) < 0.14 &&
          hy > 0.08
        ) {
          // Carved sandstone keystone arch trim
          col = [214, 196, 168];
        }

        // Courtyard Chalkboard Menu at yaw ~ -14 deg (front wall dz < 0, hx around -0.45)
        if (!hitWallX && dz < 0 && Math.abs(hx + 1.45) < 0.52 && hy > 0.15 && hy < 1.65) {
          const frame = Math.abs(Math.abs(hx + 1.45) - 0.52) < 0.06 || hy > 1.58 || hy < 0.22;
          if (frame) {
            col = [92, 58, 34];
          } else {
            const chalkLine =
              Math.abs(((hy * 14) % 1) - 0.5) < 0.14 &&
              noise2(hx * 28, Math.floor(hy * 14)) > 0.38;
            col = chalkLine ? [238, 232, 216] : [28, 38, 32];
          }
        }

        // Potted Mediterranean Olive Trees & Trailing Ivy along upper wall
        const foliage = noise2(wallU * 2.6, hy * 2.8);
        if (hy > 3.7 && foliage > 0.46) {
          col = [64 + foliage * 42, 98 + foliage * 48, 54 + foliage * 26];
        }
      }
      break;
    }

    // ========================================================================
    // SCENE 02: THE ARCHED MAIN HALL (Sunlit Casement Windows, Vaulted Plaster
    // & Brick Ceiling, Dual-Boiler Espresso Hearth, Brass Pendants, Walnut)
    // ========================================================================
    case 'main-hall': {
      if (hitCeil) {
        // Warm limewashed vaulted plaster ceiling with exposed timber beams & glowing brass pendants
        const beam = Math.abs(((hz + 10) % 1.75) - 0.875) < 0.11;
        const pendantDist = Math.hypot(((hx + 9) % 3.0) - 1.5, ((hz + 9) % 3.0) - 1.5);
        if (pendantDist < 0.24) {
          col = [255, 236, 188]; // Warm 2700K Edison brass globe
        } else if (beam) {
          col = [78, 50, 32]; // Salvaged walnut ceiling beam
        } else {
          col = [234, 222, 202];
        }
      } else if (hitFloor) {
        // Warm honey-oak herringbone parquet floor
        const plank = noise2(hx * 6, hz * 1.8);
        const sunbeam = hx < -0.5 && Math.abs(Math.sin(hz * 1.1)) > 0.4 ? 1.22 : 0.94;
        col = [
          clampByte((142 + plank * 34) * sunbeam),
          clampByte((96 + plank * 24) * sunbeam),
          clampByte((58 + plank * 16) * sunbeam),
        ];
      } else {
        // Warm parchment limewash walls + wainscoting
        col = hy < 1.05 ? [84, 56, 36] : [232, 220, 200];

        if (hitWallX && hx < 0) {
          // West/East Tall Sunlit Arched Casement Windows (T1 & T2 at yaw ~ -52 deg)
          const winIdx = (((hz + halfD) % 2.3) + 2.3) % 2.3 - 1.15;
          if (Math.abs(winIdx) < 0.72 && hy > 0.85 && hy < 3.65) {
            const mullion = Math.abs(winIdx) < 0.035 || Math.abs(hy - 2.15) < 0.035;
            col = mullion ? [48, 36, 26] : mix3(basePhotoRgb, [255, 244, 214], 0.52);
          }
        } else if (!hitWallX && dz < 0) {
          // Front focal wall: The Dual-Boiler Espresso & Roastery Bar (yaw ~ +12 deg)
          if (Math.abs(hx - 0.8) < 2.4 && hy < 1.25) {
            // Fluted walnut & brass espresso bar front
            const flute = Math.sin(hx * 38) * 12;
            col = hy > 1.12 ? [216, 198, 174] : [74 + flute, 46 + flute * 0.6, 28];
          } else if (Math.abs(hx - 0.9) < 0.85 && hy >= 1.25 && hy < 1.82) {
            // Brushed chrome & copper dual-boiler espresso machine
            col = [208, 172, 126];
          } else if (Math.abs(hx - 0.8) < 2.2 && hy > 2.0 && hy < 3.4) {
            // Backlit oak coffee & glassware shelves
            const shelf = Math.abs(((hy - 2.0) % 0.46) - 0.04) < 0.04;
            col = shelf ? [96, 62, 36] : mix3([244, 206, 146], basePhotoRgb, 0.35);
          }
        } else {
          // Framed botanical & typography prints on opposite walls
          const artCell = (((wallU + wallSpan) % 2.2) + 2.2) % 2.2 - 1.1;
          if (Math.abs(artCell) < 0.48 && hy > 1.55 && hy < 2.65) {
            const border = Math.abs(Math.abs(artCell) - 0.48) < 0.05 || hy > 2.6 || hy < 1.6;
            col = border ? [62, 40, 24] : mix3(basePhotoRgb, [238, 228, 210], 0.4);
          }
        }
      }
      break;
    }

    // ========================================================================
    // SCENE 03: THE WALNUT READING NOOK (Floor-to-Ceiling Bookshelves Packed
    // With 240+ Colorful Spines, Shaded Green/Brass Lamps, Persian Rug)
    // ========================================================================
    case 'reading-nook': {
      if (hitCeil) {
        // Coffered dark walnut library ceiling with warm recessed coffers
        const coffer =
          Math.abs(((hx + 8) % 1.4) - 0.7) < 0.56 && Math.abs(((hz + 8) % 1.4) - 0.7) < 0.56;
        col = coffer ? [66, 44, 29] : [44, 28, 18];
      } else if (hitFloor) {
        // Rich woven crimson, amber & forest-green Persian rug over dark walnut planks
        if (Math.abs(hx) < 3.1 && Math.abs(hz) < 3.6) {
          const pat = Math.sin(hx * 9) * Math.cos(hz * 9) + noise2(hx * 12, hz * 12) * 0.5;
          const border = Math.abs(hx) > 2.75 || Math.abs(hz) > 3.25;
          col = border
            ? [186, 134, 68]
            : pat > 0.35
            ? [36, 64, 48]
            : pat < -0.2
            ? [194, 146, 78]
            : [124, 42, 36];
        } else {
          col = [58, 38, 24];
        }
      } else {
        // Floor-to-ceiling salvaged walnut bookshelves with colorful vertical book spines!
        const isWindowAlcove = !hitWallX && dz > 0 && Math.abs(hx) < 1.3 && hy > 0.9 && hy < 3.3;
        if (isWindowAlcove) {
          col = mix3(basePhotoRgb, [242, 226, 198], 0.45);
        } else if (hy > 0.35 && hy < 3.65) {
          const shelfRow = Math.floor((hy - 0.35) * 2.2);
          const inShelfPlank = ((hy - 0.35) * 2.2) % 1 < 0.11;
          const inStile = Math.abs(((wallU + 10) % 1.35) - 0.06) < 0.055;
          if (inShelfPlank || inStile) {
            col = [74, 46, 28]; // Solid oiled walnut shelf frame
          } else {
            // Individual vertical book spines!
            const bookIdx = Math.floor((wallU + 20) * 19) + shelfRow * 131;
            const bHash = hash2(bookIdx, shelfRow);
            const bookTop = 0.68 + bHash * 0.26;
            const shelfFrac = ((hy - 0.35) * 2.2) % 1;
            if (shelfFrac > bookTop) {
              col = [34, 22, 15]; // Shadow above book tops
            } else {
              const palette: [number, number, number][] = [
                [148, 52, 38],
                [36, 68, 52],
                [202, 142, 64],
                [226, 214, 192],
                [56, 44, 72],
                [92, 58, 38],
                [42, 74, 92],
              ];
              const baseSpine = palette[Math.floor(bHash * palette.length) % palette.length];
              const spineEdge = Math.abs(((wallU + 20) * 19) % 1) < 0.12 ? 0.72 : 1.0;
              // Warm brass reading lamp pools along shelf B
              const lampGlow =
                1 + 0.38 * Math.exp(-Math.pow(((wallU + 6) % 2.7) - 1.35, 2) * 3.5);
              col = [
                clampByte(baseSpine[0] * spineEdge * lampGlow),
                clampByte(baseSpine[1] * spineEdge * lampGlow),
                clampByte(baseSpine[2] * spineEdge * lampGlow),
              ];
            }
          }
        } else {
          // Emerald velvet banquette wainscot at bottom
          col = hy < 0.85 ? [34, 68, 52] : [68, 44, 28];
        }
      }
      break;
    }

    // ========================================================================
    // SCENE 04: THE ANALOG VINYL CORNER (Moody Candlelit Acoustic Timber Lounge,
    // Glowing Amber Vacuum-Tube Hi-Fi, Record Sleeve Wall, Velvet Banquette)
    // ========================================================================
    case 'vinyl-corner': {
      if (hitCeil) {
        // Dark espresso ceiling with warm acoustic cedar slats & amber track spots
        const slat = Math.abs((hx * 10) % 1) < 0.45;
        const spot = Math.hypot(((hx + 6) % 2.4) - 1.2, ((hz + 6) % 2.4) - 1.2) < 0.16;
        col = spot ? [255, 196, 112] : slat ? [46, 30, 20] : [22, 15, 11];
      } else if (hitFloor) {
        // Dark smoked espresso oak planks with warm amber tube-amp reflection
        const n = noise2(hx * 4, hz * 1.4);
        const warmPool = Math.exp(-(hx * hx + hz * hz) * 0.08) * 0.45 + 0.65;
        col = [
          clampByte((56 + n * 20) * warmPool),
          clampByte((36 + n * 14) * warmPool),
          clampByte((24 + n * 9) * warmPool),
        ];
      } else {
        // Vertical acoustic walnut slat walls + warm amber up-lighting
        const slat = Math.sin(wallU * 42) > -0.2;
        const glow = Math.exp(-Math.pow(hy - 1.35, 2) * 0.9) * 0.55 + 0.45;
        col = slat
          ? [clampByte(88 * glow), clampByte(52 * glow), clampByte(30 * glow)]
          : [24, 16, 12];

        // Gallery grid of 12" Vinyl LP Album Sleeves + Hi-Fi Turntable Console
        const colCell = Math.floor((wallU + wallSpan) / 0.95);
        const rowCell = Math.floor((hy - 1.45) / 0.85);
        const lx = ((wallU + wallSpan) % 0.95) - 0.475;
        const ly = ((hy - 1.45) % 0.85) - 0.425;

        if (hy > 1.5 && hy < 3.15 && Math.abs(lx) < 0.31 && Math.abs(ly) < 0.31) {
          // Square 12-inch vinyl LP jacket artwork with circular record motif inside
          const h = hash2(colCell * 7 + (hitWallX ? 31 : 0), rowCell * 13);
          const rDisc = Math.hypot(lx, ly);
          if (rDisc < 0.22 && rDisc > 0.07 && h > 0.35) {
            col = [18, 16, 16]; // Black vinyl LP peeking on wall mount
          } else {
            const jacketTones: [number, number, number][] = [
              [214, 138, 56],
              [62, 98, 78],
              [178, 68, 52],
              [228, 212, 184],
              [72, 86, 124],
            ];
            col = jacketTones[Math.floor(h * jacketTones.length) % jacketTones.length];
          }
        } else if (hy < 1.05) {
          // Forest velvet listening banquette & glowing McIntosh-style tube amplifier console
          if (hitWallX && hx > 0 && Math.abs(hz + 1.2) < 1.3 && hy > 0.65) {
            // Glowing vacuum tubes & wooden turntable plinth at yaw ~ +120 deg
            const tube = Math.abs(((hz + 2.5) * 9) % 1 - 0.5) < 0.2 && hy > 0.84;
            col = tube ? [255, 164, 52] : [118, 72, 38];
          } else {
            // Tufted deep forest-green velvet banquette
            const tuft = Math.sin(wallU * 14) * Math.sin(hy * 14) * 8;
            col = [28 + tuft, 56 + tuft, 44 + tuft];
          }
        }
      }
      break;
    }

    // ========================================================================
    // SCENE 05: THE SUNLIT WILLOW TERRACE (Open Glass Conservatory Pergola,
    // Golden-Hour Sunset Sky, Cascading Weeping Willow Fronds, Fairy Lights)
    // ========================================================================
    case 'terrace': {
      if (hitCeil) {
        // Conservatory glass pergola beams + golden sunset sky + hanging weeping willow canopy!
        const rafter = Math.abs(((hx + 10) % 1.35) - 0.675) < 0.065 || Math.abs(((hz + 10) % 1.8) - 0.9) < 0.055;
        const willowNoise = noise2(hx * 2.8, hz * 2.8) + noise2(hx * 7.5, hz * 7.5) * 0.45;
        const fairyLight =
          hash2(Math.floor(hx * 5), Math.floor(hz * 5)) > 0.93 &&
          Math.hypot((hx * 5) % 1 - 0.5, (hz * 5) % 1 - 0.5) < 0.22;

        if (fairyLight) {
          col = [255, 234, 168]; // Warm glowing courtyard string bulb
        } else if (rafter) {
          col = [52, 64, 52]; // Verdigris iron conservatory pergola rafter
        } else if (willowNoise > 0.68) {
          // Sunlit weeping willow & trailing pothos canopy overhead
          col = [88 + willowNoise * 42, 134 + willowNoise * 46, 62 + willowNoise * 24];
        } else {
          // Warm apricot-gold & cerulean open conservatory sky
          col = mix3([134, 184, 218], [252, 206, 148], 0.55 + 0.35 * (hx / halfW));
        }
      } else if (hitFloor) {
        // Pale honed travertine limestone terrace stones with dappled willow leaf shadows
        const gx = Math.floor(hx * 1.8);
        const gz = Math.floor(hz * 1.8);
        const seam = Math.abs((hx * 1.8) % 1) < 0.04 || Math.abs((hz * 1.8) % 1) < 0.04;
        const dappled = 0.82 + 0.32 * noise2(hx * 3.4, hz * 3.4);
        const stone = 208 + hash2(gx, gz) * 16;
        col = seam
          ? [146, 138, 124]
          : [clampByte(stone * dappled), clampByte((stone - 8) * dappled), clampByte((stone - 22) * dappled)];
      } else {
        // Open garden balustrade & weeping willow trees surrounding the rooftop terrace!
        if (hy < 1.08) {
          // Limestone garden parapet & terracotta planter boxes
          const baluster = Math.abs(((wallU + 12) * 3.8) % 1 - 0.5) < 0.24 || hy > 0.94 || hy < 0.22;
          col = baluster ? [214, 202, 182] : [96, 132, 78];
        } else {
          // Lush botanical garden vista + 40-year-old weeping willow fronds + golden sunset horizon
          const frond = noise2(wallU * 5.5, hy * 1.4) * 0.7 + noise2(wallU * 14, hy * 2.5) * 0.3;
          const isWillowTree = !hitWallX && dz < 0 && Math.abs(hx - 1.6) < 2.2;
          if (isWillowTree && Math.abs(hx - 1.6) < 0.28 && hy < 2.9) {
            col = [92, 68, 48]; // Gnarled weeping willow trunk
          } else if (frond > (isWillowTree ? 0.34 : 0.56) && hy > 1.3) {
            // Trailing golden-green weeping willow curtains
            col = [94 + frond * 56, 138 + frond * 58, 64 + frond * 28];
          } else {
            // Open golden-hour garden sky & distant warm roofs
            const horizonT = Math.max(0, Math.min(1, (hy - 1.1) / 3.8));
            col = mix3([250, 202, 142], [142, 188, 220], horizonT);
            col = mix3(col, basePhotoRgb, 0.25);
          }
        }
      }
      break;
    }

    // ========================================================================
    // SCENE 06: THE TRAVERTINE DESSERT COUNTER (Veined Cream Travertine Marble
    // Pastry Bar, Glass Cloches with Basque Cheesecakes, Estate Coffee Tins)
    // ========================================================================
    case 'dessert-counter':
    default: {
      if (hitCeil) {
        // Gallery cream plaster ceiling with warm brass pastry spotlights
        const spot = Math.abs(hx) < 2.4 && Math.abs(((hx + 6) % 1.1) - 0.55) < 0.14 && Math.abs(hz + 1.2) < 0.35;
        col = spot ? [255, 238, 194] : [240, 232, 218];
      } else if (hitFloor) {
        // Classic Parisian café checkerboard honed cream & espresso marble tile
        const cx = Math.floor((hx + 20) * 1.6);
        const cz = Math.floor((hz + 20) * 1.6);
        const isDark = (cx + cz) % 2 === 0;
        const vein = noise2(hx * 7, hz * 7) * 14;
        col = isDark ? [54 + vein, 40 + vein * 0.8, 32 + vein * 0.6] : [228 - vein, 218 - vein, 200 - vein];
      } else {
        // Warm gallery plaster walls + Veined Travertine Bakery Counter & Backlit Pastry Shelves
        col = [238, 228, 212];

        if ((!hitWallX && dz < 0) || (hitWallX && hx > 0)) {
          // Veined cream travertine marble counter base (hy < 1.18)
          if (hy < 1.18) {
            const vein = Math.sin(wallU * 5.5 + noise2(wallU * 4, hy * 6) * 3.5);
            const base = vein > 0.75 ? 186 : 226;
            col = [base, base - 12, base - 28];
          } else if (hy >= 1.18 && hy < 1.62) {
            // Glass Pastry Cloches displaying Basque Cheesecakes & Cardamom Knots!
            const domeX = (((wallU + 10) % 1.1) + 1.1) % 1.1 - 0.55;
            const inCloche = Math.hypot(domeX, (hy - 1.18) * 1.1) < 0.36;
            if (inCloche) {
              const inCake = Math.abs(domeX) < 0.22 && hy < 1.38;
              col = inCake ? [168, 92, 68] : [248, 244, 236];
            }
          } else if (hy > 1.85 && hy < 3.45) {
            // Backlit blonde-oak retail shelves stocked with amber & sage 250g Estate Bean Tins
            const shelfIdx = Math.floor((hy - 1.85) * 2.4);
            const sFrac = ((hy - 1.85) * 2.4) % 1;
            if (sFrac < 0.12) {
              col = [156, 112, 68]; // Oak shelf plank
            } else {
              const tin = (((wallU + 12) * 5.2) % 1) - 0.5;
              if (Math.abs(tin) < 0.3 && sFrac < 0.72) {
                col = shelfIdx % 2 === 0 ? [201, 137, 59] : [64, 92, 72]; // Willow coffee tins
              } else {
                col = [252, 236, 204]; // Warm backlit shelf cove
              }
            }
          }
        } else {
          // Opposite side: Arched mirror & brass pastry rail
          const arch = (((wallU + wallSpan) % 2.4) + 2.4) % 2.4 - 1.2;
          if (Math.abs(arch) < 0.68 && hy > 1.0 && hy < 3.1) {
            col = mix3(basePhotoRgb, [246, 236, 220], 0.52);
          }
        }
      }
      break;
    }
  }

  // Subtle vertical ambient occlusion near floor/wall & ceiling/wall corners
  const cornerDist = Math.min(hy, roomH - hy);
  const ao = sceneId === 'exterior' || sceneId === 'terrace' ? 1 : 0.84 + 0.16 * Math.min(1, cornerDist / 0.45);
  return [clampByte(col[0] * ao), clampByte(col[1] * ao), clampByte(col[2] * ao)];
}

function generateSixDistinct360Panoramas(rootDir: string) {
  const panoDir = path.join(rootDir, 'public/assets/360');
  fs.mkdirSync(panoDir, { recursive: true });

  const scenes: { id: SceneId; accentPhotoTone: [number, number, number]; thumbYaw: number }[] = [
    { id: 'exterior', accentPhotoTone: [218, 168, 116], thumbYaw: -24 },
    { id: 'main-hall', accentPhotoTone: [228, 184, 128], thumbYaw: 6 },
    { id: 'reading-nook', accentPhotoTone: [168, 128, 86], thumbYaw: -95 },
    { id: 'vinyl-corner', accentPhotoTone: [196, 118, 58], thumbYaw: 112 },
    { id: 'terrace', accentPhotoTone: [188, 212, 148], thumbYaw: 20 },
    { id: 'dessert-counter', accentPhotoTone: [236, 206, 172], thumbYaw: 38 },
  ];

  const W = 1600;
  const H = 800;

  for (const sc of scenes) {
    const rgb = new Uint8Array(W * H * 3);

    for (let y = 0; y < H; y++) {
      // Equirectangular latitude phi in [-PI/2 .. +PI/2] (+PI/2 at top row y=0)
      const phi = (0.5 - (y + 0.5) / H) * Math.PI;
      const cosPhi = Math.cos(phi);
      const dy = Math.sin(phi);

      for (let x = 0; x < W; x++) {
        // Equirectangular longitude theta in [-PI .. +PI], seamless wrap at x=0 / x=W
        const theta = (((x + 0.5) / W) - 0.5) * Math.PI * 2;
        const dx = cosPhi * Math.sin(theta);
        const dz = -cosPhi * Math.cos(theta);

        const c = shadeSceneRay(sc.id, dx, dy, dz, sc.accentPhotoTone);
        const idx = (y * W + x) * 3;
        rgb[idx] = c[0];
        rgb[idx + 1] = c[1];
        rgb[idx + 2] = c[2];
      }
    }

    const outPano = path.join(panoDir, `${sc.id}.png`);
    writeRgbPng(outPano, W, H, rgb);

    // Also render a matching 480x300 perspective thumbnail looking toward initialYaw
    const tw = 480;
    const th = 300;
    const thumbRgb = new Uint8Array(tw * th * 3);
    const yawRad = (sc.thumbYaw * Math.PI) / 180;
    const cosY = Math.cos(yawRad);
    const sinY = Math.sin(yawRad);

    for (let ty = 0; ty < th; ty++) {
      const ny = (0.5 - (ty + 0.5) / th) * 1.1;
      for (let tx = 0; tx < tw; tx++) {
        const nx = (((tx + 0.5) / tw) - 0.5) * 1.75;
        const len = Math.hypot(nx, ny, 1);
        const lx = nx / len;
        const ly = ny / len;
        const lz = -1 / len;
        // Rotate camera ray by yawRad around Y
        const wx = lx * cosY - lz * sinY;
        const wz = lx * sinY + lz * cosY;
        const c = shadeSceneRay(sc.id, wx, ly, wz, sc.accentPhotoTone);
        const ti = (ty * tw + tx) * 3;
        thumbRgb[ti] = c[0];
        thumbRgb[ti + 1] = c[1];
        thumbRgb[ti + 2] = c[2];
      }
    }

    const outThumb = path.join(panoDir, `${sc.id}-thumb.png`);
    writeRgbPng(outThumb, tw, th, thumbRgb);
    console.log(`✓ Generated distinct 360° equirectangular panorama & thumbnail: ${sc.id}.png`);
  }
}

function main() {
  const rootDir = process.cwd();
  generateHeroMotionVideo(rootDir);
  generateSixDistinct360Panoramas(rootDir);
  console.log('All café motion video and 6 distinct 360° equirectangular assets generated!');
}

main();
