import * as fs from 'node:fs';
import * as zlib from 'node:zlib';

export interface RawImage {
  width: number;
  height: number;
  rgba: Uint8Array;
}

function paethPredictor(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

export function decodePng(filePath: string): RawImage {
  const buf = fs.readFileSync(filePath);
  let pos = 8;
  let width = 0;
  let height = 0;
  let colorType = 2;
  const idats: Buffer[] = [];

  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    if (type === 'IHDR') {
      width = buf.readUInt32BE(pos + 8);
      height = buf.readUInt32BE(pos + 12);
      colorType = buf[pos + 17];
    } else if (type === 'IDAT') {
      idats.push(buf.subarray(pos + 8, pos + 8 + len));
    }
    pos += 12 + len;
  }

  const raw = zlib.inflateSync(Buffer.concat(idats));
  const bpp = colorType === 6 ? 4 : colorType === 2 ? 3 : 1;
  const stride = width * bpp + 1;
  const rgba = new Uint8Array(width * height * 4);
  const prev = new Uint8Array(width * bpp);
  const curr = new Uint8Array(width * bpp);

  for (let y = 0; y < height; y++) {
    const filter = raw[y * stride];
    for (let i = 0; i < width * bpp; i++) {
      const x = raw[y * stride + 1 + i];
      const a = i >= bpp ? curr[i - bpp] : 0;
      const b = prev[i];
      const c = i >= bpp ? prev[i - bpp] : 0;
      let val = x;
      if (filter === 1) val = (x + a) & 255;
      else if (filter === 2) val = (x + b) & 255;
      else if (filter === 3) val = (x + ((a + b) >> 1)) & 255;
      else if (filter === 4) val = (x + paethPredictor(a, b, c)) & 255;
      curr[i] = val;
    }
    prev.set(curr);

    for (let x = 0; x < width; x++) {
      const si = x * bpp;
      const di = (y * width + x) * 4;
      if (bpp === 1) {
        rgba[di] = curr[si];
        rgba[di + 1] = curr[si];
        rgba[di + 2] = curr[si];
        rgba[di + 3] = 255;
      } else {
        rgba[di] = curr[si];
        rgba[di + 1] = curr[si + 1];
        rgba[di + 2] = curr[si + 2];
        rgba[di + 3] = bpp === 4 ? curr[si + 3] : 255;
      }
    }
  }

  return { width, height, rgba };
}

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

function makePngChunk(type: string, data: Buffer): Buffer {
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, 8 + data.length));
  chunk.writeUInt32BE(crc, 8 + data.length);
  return chunk;
}

export function encodePngRgb(img: RawImage): Buffer {
  const { width, height, rgba } = img;
  const rowBytes = width * 3 + 1;
  const raw = Buffer.alloc(rowBytes * height);

  for (let y = 0; y < height; y++) {
    const rowStart = y * rowBytes;
    raw[rowStart] = 0;
    for (let x = 0; x < width; x++) {
      const si = (y * width + x) * 4;
      const di = rowStart + 1 + x * 3;
      raw[di] = rgba[si];
      raw[di + 1] = rgba[si + 1];
      raw[di + 2] = rgba[si + 2];
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 6 });
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    sig,
    makePngChunk('IHDR', ihdr),
    makePngChunk('IDAT', compressed),
    makePngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function cubicHermite(A: number, B: number, C: number, D: number, t: number): number {
  const a = -A / 2 + (3 * B) / 2 - (3 * C) / 2 + D / 2;
  const b = A - (5 * B) / 2 + 2 * C - D / 2;
  const c = -A / 2 + C / 2;
  const d = B;
  return a * t * t * t + b * t * t + c * t + d;
}

export function sampleBicubic(img: RawImage, fx: number, fy: number, out: [number, number, number]) {
  const cx = Math.max(0, Math.min(img.width - 1.001, fx));
  const cy = Math.max(0, Math.min(img.height - 1.001, fy));
  const x1 = Math.floor(cx);
  const y1 = Math.floor(cy);
  const tx = cx - x1;
  const ty = cy - y1;

  const xs = [
    Math.max(0, x1 - 1),
    x1,
    Math.min(img.width - 1, x1 + 1),
    Math.min(img.width - 1, x1 + 2),
  ];
  const ys = [
    Math.max(0, y1 - 1),
    y1,
    Math.min(img.height - 1, y1 + 1),
    Math.min(img.height - 1, y1 + 2),
  ];

  for (let c = 0; c < 3; c++) {
    const rowVals = [0, 0, 0, 0];
    for (let j = 0; j < 4; j++) {
      const rOff = ys[j] * img.width;
      rowVals[j] = cubicHermite(
        img.rgba[(rOff + xs[0]) * 4 + c],
        img.rgba[(rOff + xs[1]) * 4 + c],
        img.rgba[(rOff + xs[2]) * 4 + c],
        img.rgba[(rOff + xs[3]) * 4 + c],
        tx
      );
    }
    const v = cubicHermite(rowVals[0], rowVals[1], rowVals[2], rowVals[3], ty);
    out[c] = Math.max(0, Math.min(255, Math.round(v)));
  }
}

export function sharpenRawImage(img: RawImage, amount = 0.34): RawImage {
  const { width, height, rgba } = img;
  const out = new Uint8Array(rgba.length);
  out.set(rgba);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const n1 = ((y - 1) * width + x) * 4;
      const n2 = ((y + 1) * width + x) * 4;
      const n3 = (y * width + (x - 1)) * 4;
      const n4 = (y * width + (x + 1)) * 4;
      for (let c = 0; c < 3; c++) {
        const avg = (rgba[n1 + c] + rgba[n2 + c] + rgba[n3 + c] + rgba[n4 + c]) * 0.25;
        const val = rgba[idx + c] + (rgba[idx + c] - avg) * amount;
        out[idx + c] = Math.max(0, Math.min(255, Math.round(val)));
      }
    }
  }
  return { width, height, rgba: out };
}

export function cropResizeCrisp(
  src: RawImage,
  x0: number,
  y0: number,
  w: number,
  h: number,
  outW: number,
  outH: number,
  sharpen = 0.32
): RawImage {
  const rgba = new Uint8Array(outW * outH * 4);
  const rgb: [number, number, number] = [0, 0, 0];
  for (let y = 0; y < outH; y++) {
    const fy = y0 + ((y + 0.5) / outH) * h;
    for (let x = 0; x < outW; x++) {
      const fx = x0 + ((x + 0.5) / outW) * w;
      sampleBicubic(src, fx, fy, rgb);
      const di = (y * outW + x) * 4;
      rgba[di] = rgb[0];
      rgba[di + 1] = rgb[1];
      rgba[di + 2] = rgb[2];
      rgba[di + 3] = 255;
    }
  }
  const base = { width: outW, height: outH, rgba };
  return sharpen > 0 ? sharpenRawImage(base, sharpen) : base;
}

export function estimateCornerStudioBg(img: RawImage): [number, number, number] {
  const { width, height, rgba } = img;
  const pts = [
    [3, 3],
    [width - 4, 3],
    [3, Math.min(height - 4, Math.floor(height * 0.18))],
    [width - 4, Math.min(height - 4, Math.floor(height * 0.18))],
  ];
  let r = 0;
  let g = 0;
  let b = 0;
  for (const [px, py] of pts) {
    const i = (py * width + px) * 4;
    r += rgba[i];
    g += rgba[i + 1];
    b += rgba[i + 2];
  }
  return [r / pts.length, g / pts.length, b / pts.length];
}

export interface CircleSubjectBounds {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  bg: [number, number, number];
}

export function detectSubjectCircleInTopView(topImg: RawImage, threshold = 22): CircleSubjectBounds {
  const { width, height, rgba } = topImg;
  const bg = estimateCornerStudioBg(topImg);

  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;
  let found = 0;

  for (let y = 4; y < height - 4; y++) {
    for (let x = 4; x < width - 4; x++) {
      const i = (y * width + x) * 4;
      const dist = Math.hypot(rgba[i] - bg[0], rgba[i + 1] - bg[1], rgba[i + 2] - bg[2]);
      const sat = Math.max(rgba[i], rgba[i + 1], rgba[i + 2]) - Math.min(rgba[i], rgba[i + 1], rgba[i + 2]);
      if (dist > threshold || sat > 20) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        found++;
      }
    }
  }

  if (found < 100) {
    return { cx: width * 0.5, cy: height * 0.5, rx: width * 0.43, ry: height * 0.43, bg };
  }

  return {
    cx: (minX + maxX) * 0.5,
    cy: (minY + maxY) * 0.5,
    rx: Math.max(24, (maxX - minX) * 0.49),
    ry: Math.max(24, (maxY - minY) * 0.49),
    bg,
  };
}

/**
 * Extracts a crisp circular UV-clamped RawImage from TOP VIEW (zero grey studio background bleed)
 */
export function extractCircularTopRaw(topImg: RawImage, radiusScale = 0.96, size = 512): RawImage {
  const bounds = detectSubjectCircleInTopView(topImg);
  const rgba = new Uint8Array(size * size * 4);
  const rgb: [number, number, number] = [0, 0, 0];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (x + 0.5) / (size * 0.5) - 1;
      const nz = (y + 0.5) / (size * 0.5) - 1;
      const r = Math.hypot(nx, nz);
      const ang = Math.atan2(nz, nx);
      const clampedR = Math.min(radiusScale, r * radiusScale);
      const sx = bounds.cx + Math.cos(ang) * clampedR * bounds.rx;
      const sy = bounds.cy + Math.sin(ang) * clampedR * bounds.ry;
      sampleBicubic(topImg, sx, sy, rgb);

      const di = (y * size + x) * 4;
      rgba[di] = rgb[0];
      rgba[di + 1] = rgb[1];
      rgba[di + 2] = rgb[2];
      rgba[di + 3] = 255;
    }
  }

  return sharpenRawImage({ width: size, height: size, rgba }, 0.24);
}

/**
 * Extracts a clean stoneware plate texture from TOP VIEW where the central food footprint
 * is seamlessly inpainted using real speckled glaze from the outer plate well (r = 0.74..0.90),
 * while preserving the real kiln-toasted outer rim!
 */
export function buildCleanPlateFromTopRaw(
  topImg: RawImage,
  wellInnerR = 0.74,
  wellOuterR = 0.9,
  radiusScale = 0.965,
  size = 384
): RawImage {
  const bounds = detectSubjectCircleInTopView(topImg);
  const rgba = new Uint8Array(size * size * 4);
  const rgb: [number, number, number] = [0, 0, 0];
  const wellRgb: [number, number, number] = [0, 0, 0];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (x + 0.5) / (size * 0.5) - 1;
      const nz = (y + 0.5) / (size * 0.5) - 1;
      const r = Math.hypot(nx, nz);
      const ang = Math.atan2(nz, nx);
      const clampedR = Math.min(radiusScale, r * radiusScale);

      sampleBicubic(
        topImg,
        bounds.cx + Math.cos(ang) * clampedR * bounds.rx,
        bounds.cy + Math.sin(ang) * clampedR * bounds.ry,
        rgb
      );

      if (r < wellInnerR + 0.08) {
        const blend = Math.max(0, Math.min(1, (wellInnerR + 0.08 - r) / 0.14));
        const sampleR =
          (wellInnerR + (wellOuterR - wellInnerR) * (0.5 + 0.42 * Math.sin(x * 0.05 + y * 0.04))) *
          radiusScale;
        const sampleAng = ang + Math.sin(x * 0.025 - y * 0.03) * 0.35;
        sampleBicubic(
          topImg,
          bounds.cx + Math.cos(sampleAng) * sampleR * bounds.rx,
          bounds.cy + Math.sin(sampleAng) * sampleR * bounds.ry,
          wellRgb
        );
        rgb[0] = Math.round(rgb[0] * (1 - blend) + wellRgb[0] * blend);
        rgb[1] = Math.round(rgb[1] * (1 - blend) + wellRgb[1] * blend);
        rgb[2] = Math.round(rgb[2] * (1 - blend) + wellRgb[2] * blend);
      }

      const di = (y * size + x) * 4;
      rgba[di] = rgb[0];
      rgba[di + 1] = rgb[1];
      rgba[di + 2] = rgb[2];
      rgba[di + 3] = 255;
    }
  }

  return { width: size, height: size, rgba };
}

/**
 * Per-row horizontal silhouette span detector on SIDE or FRONT view so we sample strictly INSIDE
 * the cup/glass/bowl/sandwich/cake and NEVER sample light-grey studio background!
 */
function findRowForegroundSpan(
  img: RawImage,
  fy: number,
  bg: [number, number, number],
  insetFrac = 0.08
): [number, number] {
  const y = Math.max(0, Math.min(img.height - 1, Math.round(fy)));
  let left = Math.floor(img.width * 0.32);
  let right = Math.ceil(img.width * 0.68);
  let foundLeft = -1;
  let foundRight = -1;

  for (let x = 6; x < img.width - 6; x++) {
    const i = (y * img.width + x) * 4;
    const dist = Math.hypot(img.rgba[i] - bg[0], img.rgba[i + 1] - bg[1], img.rgba[i + 2] - bg[2]);
    const sat =
      Math.max(img.rgba[i], img.rgba[i + 1], img.rgba[i + 2]) -
      Math.min(img.rgba[i], img.rgba[i + 1], img.rgba[i + 2]);
    if (dist > 22 || sat > 18) {
      if (foundLeft < 0) foundLeft = x;
      foundRight = x;
    }
  }

  if (foundLeft >= 0 && foundRight - foundLeft >= 24) {
    const span = foundRight - foundLeft;
    left = foundLeft + span * insetFrac;
    right = foundRight - span * insetFrac;
  }
  return [left, right];
}

export function buildMaskedSideStripRaw(
  sideImg: RawImage,
  frontImg: RawImage,
  yFracStart: number,
  yFracEnd: number,
  insetFrac = 0.1,
  outW = 512,
  outH = 256
): RawImage {
  const bgSide = estimateCornerStudioBg(sideImg);
  const bgFront = estimateCornerStudioBg(frontImg);
  const rgba = new Uint8Array(outW * outH * 4);
  const rgbA: [number, number, number] = [0, 0, 0];
  const rgbB: [number, number, number] = [0, 0, 0];

  for (let y = 0; y < outH; y++) {
    const v = y / (outH - 1);
    const fySide = (yFracStart + v * (yFracEnd - yFracStart)) * sideImg.height;
    const fyFront = (yFracStart + v * (yFracEnd - yFracStart)) * frontImg.height;
    const [sL, sR] = findRowForegroundSpan(sideImg, fySide, bgSide, insetFrac);
    const [fL, fR] = findRowForegroundSpan(frontImg, fyFront, bgFront, insetFrac);

    for (let x = 0; x < outW; x++) {
      const u = x / outW;
      const localA = Math.abs(((u * 2) % 2) - 1);
      const fxSide = sL + localA * Math.max(2, sR - sL);
      const fxFront = fL + (1 - localA) * Math.max(2, fR - fL);

      sampleBicubic(sideImg, fxSide, fySide, rgbA);
      sampleBicubic(frontImg, fxFront, fyFront, rgbB);

      const blend = 0.5 - 0.5 * Math.cos(u * Math.PI * 2);
      const di = (y * outW + x) * 4;
      rgba[di] = Math.round(rgbA[0] * (1 - blend) + rgbB[0] * blend);
      rgba[di + 1] = Math.round(rgbA[1] * (1 - blend) + rgbB[1] * blend);
      rgba[di + 2] = Math.round(rgbA[2] * (1 - blend) + rgbB[2] * blend);
      rgba[di + 3] = 255;
    }
  }

  return sharpenRawImage({ width: outW, height: outH, rgba }, 0.22);
}

/**
 * Generates a tangent-space normal map + glTF metallicRoughness map directly from an albedo RawImage
 * so baked crusts, crema, berries, avocado, egg yolk, pasta ribbons, and cheese catch lifelike micro-specular light!
 */
export function buildPbrMapsFromAlbedo(
  albedo: RawImage,
  opts: {
    normalStrength?: number;
    baseRoughness?: number;
    glossyDark?: boolean;
    glossyWarmYolk?: boolean;
    glossyWhiteCream?: boolean;
    size?: number;
  } = {}
): { normalPng: Buffer; ormPng: Buffer } {
  const size = opts.size ?? Math.min(256, albedo.width);
  const scaled =
    albedo.width === size && albedo.height === size
      ? albedo
      : cropResizeCrisp(albedo, 0, 0, albedo.width, albedo.height, size, size, 0);

  const normalStrength = opts.normalStrength ?? 2.2;
  const baseRough = opts.baseRoughness ?? 0.46;

  const lum = new Float32Array(size * size);
  for (let i = 0; i < size * size; i++) {
    const r = scaled.rgba[i * 4] / 255;
    const g = scaled.rgba[i * 4 + 1] / 255;
    const b = scaled.rgba[i * 4 + 2] / 255;
    lum[i] = r * 0.299 + g * 0.587 + b * 0.114;
  }

  const normRgba = new Uint8Array(size * size * 4);
  const ormRgba = new Uint8Array(size * size * 4);

  const getL = (x: number, y: number) => {
    const cx = Math.max(0, Math.min(size - 1, x));
    const cy = Math.max(0, Math.min(size - 1, y));
    return lum[cy * size + cx];
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Multi-scale Sobel gradient (fine + medium culinary relief)
      const dx1 =
        getL(x + 1, y - 1) +
        2 * getL(x + 1, y) +
        getL(x + 1, y + 1) -
        (getL(x - 1, y - 1) + 2 * getL(x - 1, y) + getL(x - 1, y + 1));
      const dy1 =
        getL(x - 1, y + 1) +
        2 * getL(x, y + 1) +
        getL(x + 1, y + 1) -
        (getL(x - 1, y - 1) + 2 * getL(x, y - 1) + getL(x + 1, y - 1));

      const dx2 = getL(x + 3, y) - getL(x - 3, y);
      const dy2 = getL(x, y + 3) - getL(x, y - 3);

      const nx = -(dx1 * 0.65 + dx2 * 0.85) * normalStrength;
      const ny = -(dy1 * 0.65 + dy2 * 0.85) * normalStrength;
      const nz = 1.0;
      const invLen = 1 / Math.hypot(nx, ny, nz);

      const idx = (y * size + x) * 4;
      normRgba[idx] = Math.round((nx * invLen * 0.5 + 0.5) * 255);
      normRgba[idx + 1] = Math.round((ny * invLen * 0.5 + 0.5) * 255);
      normRgba[idx + 2] = Math.round((nz * invLen * 0.5 + 0.5) * 255);
      normRgba[idx + 3] = 255;

      // Per-pixel roughness modulation (glTF metallicRoughness: R=occlusion, G=roughness, B=metalness)
      const rCol = scaled.rgba[idx] / 255;
      const gCol = scaled.rgba[idx + 1] / 255;
      const bCol = scaled.rgba[idx + 2] / 255;
      const l = lum[y * size + x];
      const sat = Math.max(rCol, gCol, bCol) - Math.min(rCol, gCol, bCol);

      let rough = baseRough + (0.5 - l) * 0.18 + Math.min(0.18, Math.hypot(dx1, dy1) * 0.22);

      // Glossy dark berries, chocolate drizzle, balsamic fig glaze, espresso crema
      if (opts.glossyDark && l < 0.28) {
        rough = 0.1 + l * 0.45;
      }
      // Glossy warm runny egg yolk / hot honey / olive oil sheen
      if (opts.glossyWarmYolk && rCol > 0.72 && gCol > 0.36 && bCol < 0.24 && sat > 0.48) {
        rough = 0.06;
      }
      // Silky poached egg white, burrata, fior di latte, microfoam heart, vanilla gelato
      if (opts.glossyWhiteCream && l > 0.78 && sat < 0.2) {
        rough = Math.min(rough, 0.18);
      }

      const clampedRough = Math.max(0.05, Math.min(0.92, rough));
      const ao = Math.max(0.68, Math.min(1.0, 0.88 + l * 0.16));
      ormRgba[idx] = Math.round(ao * 255); // R: Ambient Occlusion
      ormRgba[idx + 1] = Math.round(clampedRough * 255); // G: Roughness
      ormRgba[idx + 2] = 5; // B: Metalness (~0.02 dielectric food/ceramic)
      ormRgba[idx + 3] = 255;
    }
  }

  return {
    normalPng: encodePngRgb({ width: size, height: size, rgba: normRgba }),
    ormPng: encodePngRgb({ width: size, height: size, rgba: ormRgba }),
  };
}
