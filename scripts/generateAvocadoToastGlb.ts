import * as fs from 'node:fs';
import * as path from 'node:path';
import * as zlib from 'node:zlib';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/* ============================================================================
   PURE NODE PNG DECODER & ENCODER (ZERO EXTERNAL DEPENDENCIES)
   ============================================================================ */

interface RawImage {
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

function decodePng(filePath: string): RawImage {
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

function encodePngRgb(img: RawImage): Buffer {
  const { width, height, rgba } = img;
  const rowBytes = width * 3 + 1;
  const raw = Buffer.alloc(rowBytes * height);

  for (let y = 0; y < height; y++) {
    const rowStart = y * rowBytes;
    raw[rowStart] = 0; // Filter 0 (None)
    for (let x = 0; x < width; x++) {
      const si = (y * width + x) * 4;
      const di = rowStart + 1 + x * 3;
      raw[di] = rgba[si];
      raw[di + 1] = rgba[si + 1];
      raw[di + 2] = rgba[si + 2];
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit
  ihdr[9] = 2; // RGB
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

function sampleBilinear(img: RawImage, fx: number, fy: number, out: [number, number, number]) {
  const cx = Math.max(0, Math.min(img.width - 1.001, fx));
  const cy = Math.max(0, Math.min(img.height - 1.001, fy));
  const x0 = Math.floor(cx);
  const y0 = Math.floor(cy);
  const x1 = Math.min(img.width - 1, x0 + 1);
  const y1 = Math.min(img.height - 1, y0 + 1);
  const tx = cx - x0;
  const ty = cy - y0;

  const i00 = (y0 * img.width + x0) * 4;
  const i10 = (y0 * img.width + x1) * 4;
  const i01 = (y1 * img.width + x0) * 4;
  const i11 = (y1 * img.width + x1) * 4;

  for (let c = 0; c < 3; c++) {
    const top = img.rgba[i00 + c] * (1 - tx) + img.rgba[i10 + c] * tx;
    const bot = img.rgba[i01 + c] * (1 - tx) + img.rgba[i11 + c] * tx;
    out[c] = Math.round(top * (1 - ty) + bot * ty);
  }
}

/* ============================================================================
   EXTRACT & SYNTHESIZE REAL PHOTOGRAPHIC TEXTURES FROM UPLOADED IMAGES
   ============================================================================ */

function buildPlateAlbedoFromQuadView(quadImg: RawImage): Buffer {
  // TOP VIEW plate rim center & radii measured at pixel precision:
  const pCx = 377;
  const pCy = 243;
  const pRx = 254.5;
  const pRy = 242.0;

  const size = 512;
  const out = new Uint8Array(size * size * 4);
  const rgb: [number, number, number] = [0, 0, 0];
  const cleanRgb: [number, number, number] = [0, 0, 0];

  // Diagonal rotation matching the toast in TOP VIEW (~21.5 deg)
  const cosA = Math.cos(0.38);
  const sinA = Math.sin(0.38);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Normalized plate space [-1, 1] where +X is right, +Z (y) is front/down
      const nx = (x + 0.5) / (size * 0.5) - 1;
      const nz = (y + 0.5) / (size * 0.5) - 1;
      const r = Math.hypot(nx, nz);
      const ang = Math.atan2(nz, nx);

      // Clamp outer pixels > 0.992 to the toasted brown ceramic rim so 3D Lathe lip has zero gray studio bg
      const clampedR = Math.min(0.99, r);
      const sx = pCx + Math.cos(ang) * clampedR * pRx;
      const sy = pCy + Math.sin(ang) * clampedR * pRy;
      sampleBilinear(quadImg, sx, sy, rgb);

      // Cleanly replace the central toast footprint on the plate floor using real speckled stoneware glaze
      // sampled from the upper-left clean ceramic well of TOP VIEW, while preserving all real scattered
      // plate spices, yolk drops, and toasted rim around the toast!
      const lx = nx * cosA - nz * sinA;
      const lz = nx * sinA + nz * cosA;
      const toastDist = Math.hypot(lx / 0.64, lz / 0.36);

      if (toastDist < 1.05) {
        const blend = Math.max(0, Math.min(1, (1.05 - toastDist) / 0.2));
        // Sample clean speckled ceramic well from top-left arc of TOP VIEW (angle ~ -2.35 rad, radius 0.68..0.82)
        const wellAng = -2.35 + Math.sin(x * 0.045 + y * 0.03) * 0.38;
        const wellRad = 0.68 + ((Math.sin(x * 0.07) * 0.5 + 0.5) * 0.13);
        sampleBilinear(
          quadImg,
          pCx + Math.cos(wellAng) * wellRad * pRx,
          pCy + Math.sin(wellAng) * wellRad * pRy,
          cleanRgb
        );
        rgb[0] = Math.round(rgb[0] * (1 - blend) + cleanRgb[0] * blend);
        rgb[1] = Math.round(rgb[1] * (1 - blend) + cleanRgb[1] * blend);
        rgb[2] = Math.round(rgb[2] * (1 - blend) + cleanRgb[2] * blend);
      }

      const di = (y * size + x) * 4;
      out[di] = rgb[0];
      out[di + 1] = rgb[1];
      out[di + 2] = rgb[2];
      out[di + 3] = 255;
    }
  }

  return encodePngRgb({ width: size, height: size, rgba: out });
}

function buildSourdoughCrustTexture(quadImg: RawImage): Buffer {
  // Sample real blistered, flour-dusted crust strip from SIDE VIEW (x: 132..468, y: 816..886)
  // and cross-fade horizontal ends for a 100% seamless 360° perimeter wrap
  const w = 512;
  const h = 128;
  const out = new Uint8Array(w * h * 4);
  const rgbA: [number, number, number] = [0, 0, 0];
  const rgbB: [number, number, number] = [0, 0, 0];

  const srcX0 = 136;
  const srcW = 324;
  const srcY0 = 816;
  const srcH = 68;

  for (let y = 0; y < h; y++) {
    const v = y / (h - 1);
    const sy = srcY0 + v * srcH;
    for (let x = 0; x < w; x++) {
      const u = x / w;
      // Seamless tile blend using two offset lookups
      const sx1 = srcX0 + ((u * srcW) % srcW);
      const sx2 = srcX0 + (((u + 0.5) * srcW) % srcW);
      sampleBilinear(quadImg, sx1, sy, rgbA);
      sampleBilinear(quadImg, sx2, sy, rgbB);

      // Smooth cosine blend near u=0/1 seam
      const seamDist = Math.min(u, 1 - u);
      const wA = seamDist < 0.18 ? 0.5 - 0.5 * Math.cos((seamDist / 0.18) * Math.PI) : 1;

      const di = (y * w + x) * 4;
      out[di] = Math.round(rgbA[0] * wA + rgbB[0] * (1 - wA));
      out[di + 1] = Math.round(rgbA[1] * wA + rgbB[1] * (1 - wA));
      out[di + 2] = Math.round(rgbA[2] * wA + rgbB[2] * (1 - wA));
      out[di + 3] = 255;
    }
  }

  return encodePngRgb({ width: w, height: h, rgba: out });
}

function buildHassAvocadoAlbedo(heroImg: RawImage): Buffer {
  // Sample rich green smashed Hass avocado patch from Rustic_Avocado_Toast hero photo
  // (right-side bright green Hass avocado zone x: 1020..1210, y: 265..455)
  const size = 256;
  const out = new Uint8Array(size * size * 4);
  const rgbA: [number, number, number] = [0, 0, 0];
  const rgbB: [number, number, number] = [0, 0, 0];

  const patchX = 1025;
  const patchY = 275;
  const patchSize = 165;

  for (let y = 0; y < size; y++) {
    const v = y / size;
    for (let x = 0; x < size; x++) {
      const u = x / size;
      sampleBilinear(heroImg, patchX + u * patchSize, patchY + v * patchSize, rgbA);
      sampleBilinear(
        heroImg,
        patchX + ((u + 0.5) % 1) * patchSize,
        patchY + ((v + 0.5) % 1) * patchSize,
        rgbB
      );

      const wx = Math.min(u, 1 - u) < 0.2 ? Math.min(u, 1 - u) / 0.2 : 1;
      const wy = Math.min(v, 1 - v) < 0.2 ? Math.min(v, 1 - v) / 0.2 : 1;
      const weight = wx * wy;

      const di = (y * size + x) * 4;
      out[di] = Math.round(rgbA[0] * weight + rgbB[0] * (1 - weight));
      out[di + 1] = Math.round(rgbA[1] * weight + rgbB[1] * (1 - weight));
      out[di + 2] = Math.round(rgbA[2] * weight + rgbB[2] * (1 - weight));
      out[di + 3] = 255;
    }
  }

  return encodePngRgb({ width: size, height: size, rgba: out });
}

function buildSeasonedEggAlbedo(heroImg: RawImage): Buffer {
  // Sample real seasoned poached egg dome from Rustic_Avocado_Toast hero photo
  // (egg center around x: 835, y: 315, rx: 210, ry: 155) blended softly into porcelain albumen at outer skirt
  const size = 512;
  const out = new Uint8Array(size * size * 4);
  const rgb: [number, number, number] = [0, 0, 0];

  const eCx = 842;
  const eCy = 308;
  const eRx = 198;
  const eRy = 148;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (x + 0.5) / (size * 0.5) - 1;
      const nz = (y + 0.5) / (size * 0.5) - 1;
      const r = Math.hypot(nx, nz);

      const clampedNx = nx / Math.max(1, r / 0.92);
      const clampedNz = nz / Math.max(1, r / 0.92);
      sampleBilinear(heroImg, eCx + clampedNx * eRx, eCy + clampedNz * eRy, rgb);

      // Softly brighten outer albumen skirt (r > 0.72) toward clean poached egg white (#FAF8F4)
      // so zero green avocado pixels from outside the egg bleed onto the lower egg skirt
      if (r > 0.68) {
        const skirtFade = Math.min(1, (r - 0.68) / 0.24);
        rgb[0] = Math.round(rgb[0] * (1 - skirtFade) + 250 * skirtFade);
        rgb[1] = Math.round(rgb[1] * (1 - skirtFade) + 248 * skirtFade);
        rgb[2] = Math.round(rgb[2] * (1 - skirtFade) + 243 * skirtFade);
      }

      const di = (y * size + x) * 4;
      out[di] = rgb[0];
      out[di + 1] = rgb[1];
      out[di + 2] = rgb[2];
      out[di + 3] = 255;
    }
  }

  return encodePngRgb({ width: size, height: size, rgba: out });
}

/* ============================================================================
   3D GEOMETRY HELPERS
   ============================================================================ */

function createLeafGeometry(length = 0.17, width = 0.092, camber = 0.034): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.quadraticCurveTo(width, length * 0.36, width * 0.72, length * 0.76);
  shape.quadraticCurveTo(width * 0.25, length * 0.98, 0, length);
  shape.quadraticCurveTo(-width * 0.25, length * 0.98, -width * 0.72, length * 0.76);
  shape.quadraticCurveTo(-width, length * 0.36, 0, 0);

  const geo = new THREE.ShapeGeometry(shape, 10);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const z = -pos.getZ(i);
    const x = pos.getX(i);
    const t = Math.max(0, Math.min(1, z / length));
    const arch = Math.sin(t * Math.PI) * camber - Math.abs(x) * 0.16;
    pos.setY(i, arch);
  }
  geo.computeVertexNormals();
  return geo;
}

function ensureCleanIndexedGeometry(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  const clean = geo.clone();
  if (!clean.attributes.normal) {
    clean.computeVertexNormals();
  }
  // Keep only standard glTF attributes
  for (const key of Object.keys(clean.attributes)) {
    if (key !== 'position' && key !== 'normal' && key !== 'uv' && key !== 'color') {
      clean.deleteAttribute(key);
    }
  }
  return clean;
}

/* ============================================================================
   MINIMAL SPEC-COMPLIANT GLTF 2.0 BINARY (.GLB) SERIALIZER
   ============================================================================ */

interface GlbMaterialSpec {
  name: string;
  baseColorFactor?: [number, number, number, number];
  baseColorTextureIndex?: number;
  metallicFactor: number;
  roughnessFactor: number;
  emissiveFactor?: [number, number, number];
  doubleSided?: boolean;
}

interface GlbMeshPart {
  name: string;
  geometry: THREE.BufferGeometry;
  materialIndex: number;
  position?: [number, number, number];
  rotationY?: number;
}

function serializeToGlb(
  parts: GlbMeshPart[],
  materials: GlbMaterialSpec[],
  pngBuffers: { name: string; data: Buffer; wrapRepeat?: boolean }[]
): Buffer {
  const binChunks: Buffer[] = [];
  let byteOffset = 0;

  const bufferViews: Array<Record<string, unknown>> = [];
  const accessors: Array<Record<string, unknown>> = [];

  const appendBuffer = (data: Buffer, target?: number): number => {
    const pad = (4 - (data.length % 4)) % 4;
    const padded = pad > 0 ? Buffer.concat([data, Buffer.alloc(pad)]) : data;
    const viewIndex = bufferViews.length;
    const view: Record<string, unknown> = {
      buffer: 0,
      byteOffset,
      byteLength: data.length,
    };
    if (target) view.target = target;
    bufferViews.push(view);
    binChunks.push(padded);
    byteOffset += padded.length;
    return viewIndex;
  };

  // 1. Embed PNG textures into bufferViews
  const images = pngBuffers.map((img) => {
    const bv = appendBuffer(img.data);
    return {
      name: img.name,
      bufferView: bv,
      mimeType: 'image/png',
    };
  });

  const samplers = [
    {
      magFilter: 9729, // LINEAR
      minFilter: 9987, // LINEAR_MIPMAP_LINEAR
      wrapS: 33071, // CLAMP_TO_EDGE
      wrapT: 33071,
    },
    {
      magFilter: 9729,
      minFilter: 9987,
      wrapS: 10497, // REPEAT
      wrapT: 33071,
    },
    {
      magFilter: 9729,
      minFilter: 9987,
      wrapS: 10497, // REPEAT
      wrapT: 10497,
    },
  ];

  const textures = pngBuffers.map((img, idx) => ({
    sampler: img.name.includes('crust') ? 1 : img.wrapRepeat ? 2 : 0,
    source: idx,
  }));

  // 2. Materials
  const gltfMaterials = materials.map((m) => {
    const pbr: Record<string, unknown> = {
      metallicFactor: m.metallicFactor,
      roughnessFactor: m.roughnessFactor,
    };
    if (m.baseColorFactor) {
      pbr.baseColorFactor = m.baseColorFactor;
    }
    if (m.baseColorTextureIndex !== undefined) {
      pbr.baseColorTexture = { index: m.baseColorTextureIndex };
    }
    const matObj: Record<string, unknown> = {
      name: m.name,
      pbrMetallicRoughness: pbr,
    };
    if (m.emissiveFactor) matObj.emissiveFactor = m.emissiveFactor;
    if (m.doubleSided) matObj.doubleSided = true;
    return matObj;
  });

  // 3. Meshes & Nodes
  const meshes: Array<Record<string, unknown>> = [];
  const childNodeIndices: number[] = [];
  const nodes: Array<Record<string, unknown>> = [
    {
      name: 'AvocadoPoachedEggTartine',
      children: childNodeIndices,
    },
  ];

  for (const part of parts) {
    const geo = ensureCleanIndexedGeometry(part.geometry);
    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
    const normAttr = geo.getAttribute('normal') as THREE.BufferAttribute;
    const uvAttr = geo.getAttribute('uv') as THREE.BufferAttribute | undefined;
    const colorAttr = geo.getAttribute('color') as THREE.BufferAttribute | undefined;

    // Position bounds
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    const posArray = new Float32Array(posAttr.count * 3);
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      const z = posAttr.getZ(i);
      posArray[i * 3] = x;
      posArray[i * 3 + 1] = y;
      posArray[i * 3 + 2] = z;
      if (x < min[0]) min[0] = x;
      if (y < min[1]) min[1] = y;
      if (z < min[2]) min[2] = z;
      if (x > max[0]) max[0] = x;
      if (y > max[1]) max[1] = y;
      if (z > max[2]) max[2] = z;
    }

    const posBv = appendBuffer(Buffer.from(posArray.buffer), 34962);
    const posAcc = accessors.length;
    accessors.push({
      bufferView: posBv,
      componentType: 5126, // FLOAT
      count: posAttr.count,
      type: 'VEC3',
      min,
      max,
    });

    const normArray = new Float32Array(normAttr.count * 3);
    for (let i = 0; i < normAttr.count; i++) {
      // Ensure unit length normals for strict glTF 2.0 validators
      let nx = normAttr.getX(i);
      let ny = normAttr.getY(i);
      let nz = normAttr.getZ(i);
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len;
      ny /= len;
      nz /= len;
      normArray[i * 3] = nx;
      normArray[i * 3 + 1] = ny;
      normArray[i * 3 + 2] = nz;
    }
    const normBv = appendBuffer(Buffer.from(normArray.buffer), 34962);
    const normAcc = accessors.length;
    accessors.push({
      bufferView: normBv,
      componentType: 5126,
      count: normAttr.count,
      type: 'VEC3',
    });

    const primAttrs: Record<string, number> = {
      POSITION: posAcc,
      NORMAL: normAcc,
    };

    if (uvAttr) {
      const uvArray = new Float32Array(uvAttr.count * 2);
      for (let i = 0; i < uvAttr.count; i++) {
        uvArray[i * 2] = uvAttr.getX(i);
        uvArray[i * 2 + 1] = uvAttr.getY(i);
      }
      const uvBv = appendBuffer(Buffer.from(uvArray.buffer), 34962);
      const uvAcc = accessors.length;
      accessors.push({
        bufferView: uvBv,
        componentType: 5126,
        count: uvAttr.count,
        type: 'VEC2',
      });
      primAttrs.TEXCOORD_0 = uvAcc;
    }

    if (colorAttr) {
      const colArray = new Float32Array(colorAttr.count * 3);
      for (let i = 0; i < colorAttr.count; i++) {
        colArray[i * 3] = colorAttr.getX(i);
        colArray[i * 3 + 1] = colorAttr.getY(i);
        colArray[i * 3 + 2] = colorAttr.getZ(i);
      }
      const colBv = appendBuffer(Buffer.from(colArray.buffer), 34962);
      const colAcc = accessors.length;
      accessors.push({
        bufferView: colBv,
        componentType: 5126,
        count: colorAttr.count,
        type: 'VEC3',
      });
      primAttrs.COLOR_0 = colAcc;
    }

    const prim: Record<string, unknown> = {
      attributes: primAttrs,
      material: part.materialIndex,
    };

    if (geo.index) {
      const idxCount = geo.index.count;
      const useUint32 = posAttr.count > 65535;
      const idxTyped = useUint32 ? new Uint32Array(idxCount) : new Uint16Array(idxCount);
      for (let i = 0; i < idxCount; i++) {
        idxTyped[i] = geo.index.getX(i);
      }
      const idxBv = appendBuffer(Buffer.from(idxTyped.buffer), 34963);
      const idxAcc = accessors.length;
      accessors.push({
        bufferView: idxBv,
        componentType: useUint32 ? 5125 : 5123,
        count: idxCount,
        type: 'SCALAR',
      });
      prim.indices = idxAcc;
    }

    const meshIndex = meshes.length;
    meshes.push({
      name: part.name,
      primitives: [prim],
    });

    const nodeObj: Record<string, unknown> = {
      name: part.name,
      mesh: meshIndex,
    };
    if (part.position) {
      nodeObj.translation = part.position;
    }
    if (part.rotationY) {
      const half = part.rotationY * 0.5;
      nodeObj.rotation = [0, Math.sin(half), 0, Math.cos(half)];
    }

    const nodeIdx = nodes.length;
    nodes.push(nodeObj);
    childNodeIndices.push(nodeIdx);
  }

  const binBuffer = Buffer.concat(binChunks);

  const gltfJson: Record<string, unknown> = {
    asset: {
      version: '2.0',
      generator: 'WillowCafe-AvocadoTartine-3DBuilder',
    },
    scene: 0,
    scenes: [{ name: 'Scene', nodes: [0] }],
    nodes,
    meshes,
    materials: gltfMaterials,
    textures,
    images,
    samplers,
    accessors,
    bufferViews,
    buffers: [{ byteLength: binBuffer.length }],
  };

  const jsonBytes = Buffer.from(JSON.stringify(gltfJson), 'utf8');
  const jsonPad = (4 - (jsonBytes.length % 4)) % 4;
  const jsonChunkData =
    jsonPad > 0 ? Buffer.concat([jsonBytes, Buffer.alloc(jsonPad, 0x20)]) : jsonBytes;

  const binPad = (4 - (binBuffer.length % 4)) % 4;
  const binChunkData = binPad > 0 ? Buffer.concat([binBuffer, Buffer.alloc(binPad, 0x00)]) : binBuffer;

  const totalLength = 12 + 8 + jsonChunkData.length + 8 + binChunkData.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0); // 'glTF'
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunkData.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4); // 'JSON'

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binChunkData.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4); // 'BIN\0'

  return Buffer.concat([header, jsonHeader, jsonChunkData, binHeader, binChunkData]);
}

/* ============================================================================
   BUILD REFERENCE-MATCHED AVOCADO & POACHED EGG TARTINE 3D MODEL
   ============================================================================ */

function main() {
  const rootDir = process.cwd();
  const quadPath = path.join(
    rootDir,
    'public/assets/aistudio/Quad-View_Avocado_Toast_with_Poached_Egg_a4af8684.png'
  );
  const heroPath = path.join(
    rootDir,
    'public/assets/aistudio/Rustic_Avocado_Toast_with_Runny_Egg_edf32a26.png'
  );

  const quadImg = decodePng(quadPath);
  const heroImg = decodePng(heroPath);

  // Extract 4 real photographic PNG textures
  const platePng = buildPlateAlbedoFromQuadView(quadImg);
  const crustPng = buildSourdoughCrustTexture(quadImg);
  const avoPng = buildHassAvocadoAlbedo(heroImg);
  const eggPng = buildSeasonedEggAlbedo(heroImg);

  const materials: GlbMaterialSpec[] = [
    // 0: Speckled Ceramic Coupe Plate (mapped from TOP VIEW)
    {
      name: 'CeramicCoupePlateMat',
      baseColorTextureIndex: 0,
      metallicFactor: 0.02,
      roughnessFactor: 0.24,
    },
    // 1: Rustic Blistered Sourdough Crust Wall (mapped from SIDE/FRONT VIEW)
    {
      name: 'SourdoughCrustMat',
      baseColorTextureIndex: 1,
      metallicFactor: 0.0,
      roughnessFactor: 0.78,
    },
    // 2: Toasted Country Sourdough Crumb Cap
    {
      name: 'SourdoughCrumbMat',
      baseColorFactor: [0.83, 0.71, 0.53, 1.0],
      metallicFactor: 0.0,
      roughnessFactor: 0.84,
    },
    // 3: Smashed & Diced Hass Avocado Flesh (mapped from Rustic Hero)
    {
      name: 'HassAvocadoMat',
      baseColorTextureIndex: 2,
      metallicFactor: 0.0,
      roughnessFactor: 0.42,
    },
    // 4: Seasoned Poached Egg Dome (mapped from Rustic Hero)
    {
      name: 'PoachedEggMat',
      baseColorTextureIndex: 3,
      metallicFactor: 0.0,
      roughnessFactor: 0.16,
    },
    // 5: Glossy Runny Golden Yolk Waterfall & Plate Puddle
    {
      name: 'RunnyGoldenYolkMat',
      baseColorFactor: [0.96, 0.54, 0.025, 1.0],
      emissiveFactor: [0.18, 0.065, 0.0],
      metallicFactor: 0.02,
      roughnessFactor: 0.045,
    },
    // 6: Whipped & Crumbled Sheep's-Milk Feta
    {
      name: 'CrumbledFetaMat',
      baseColorFactor: [0.985, 0.98, 0.955, 1.0],
      metallicFactor: 0.0,
      roughnessFactor: 0.86,
    },
    // 7: Magenta-Purple Microgreen Stems
    {
      name: 'PurpleMicroStemMat',
      baseColorFactor: [0.45, 0.1, 0.27, 1.0],
      metallicFactor: 0.0,
      roughnessFactor: 0.46,
    },
    // 8: Fresh Green Red-Veined Sorrel Micro-Leaves
    {
      name: 'SorrelMicroLeafMat',
      baseColorFactor: [0.29, 0.49, 0.14, 1.0],
      metallicFactor: 0.0,
      roughnessFactor: 0.42,
      doubleSided: true,
    },
    // 9: Deep Burgundy Micro-Amaranth Leaves
    {
      name: 'AmaranthMicroLeafMat',
      baseColorFactor: [0.37, 0.09, 0.23, 1.0],
      metallicFactor: 0.0,
      roughnessFactor: 0.45,
      doubleSided: true,
    },
    // 10: Vertex-Colored 3D Seasoning Grains (Peppercorns, Chili Flakes, Toasted Coriander Seeds)
    {
      name: 'ArtisanSeasoningGrainsMat',
      baseColorFactor: [1, 1, 1, 1],
      metallicFactor: 0.0,
      roughnessFactor: 0.65,
    },
  ];

  const GROUND_Y = -0.3;
  const plateR = 1.74;
  const plateFloorY = GROUND_Y + 0.082;
  const tartineRotY = 0.36;

  const parts: GlbMeshPart[] = [];

  // -------------------------------------------------------------------------
  // PART 1: Handmade Speckled Ceramic Coupe Plate (glTF UV flipY=false aware!)
  // -------------------------------------------------------------------------
  const coupePts = [
    new THREE.Vector2(0, GROUND_Y),
    new THREE.Vector2(1.06, GROUND_Y),
    new THREE.Vector2(1.22, GROUND_Y + 0.035),
    new THREE.Vector2(1.62, GROUND_Y + 0.165),
    new THREE.Vector2(plateR, GROUND_Y + 0.255),
    new THREE.Vector2(plateR - 0.035, GROUND_Y + 0.276),
    new THREE.Vector2(plateR - 0.088, GROUND_Y + 0.25),
    new THREE.Vector2(1.38, GROUND_Y + 0.125),
    new THREE.Vector2(0.88, GROUND_Y + 0.082),
    new THREE.Vector2(0, GROUND_Y + 0.076),
  ];
  const plateGeo = new THREE.LatheGeometry(coupePts, 84);
  const pPos = plateGeo.attributes.position;
  const pUv = plateGeo.attributes.uv;
  for (let i = 0; i < pPos.count; i++) {
    const px = pPos.getX(i);
    const pz = pPos.getZ(i);
    // In glTF 2.0 (flipY = false), u = 0..1 maps -X..+X, v = 0..1 maps -Z (top/back)..+Z (bottom/front)
    pUv.setXY(i, px / (plateR * 2) + 0.5, pz / (plateR * 2) + 0.5);
  }
  plateGeo.computeVertexNormals();
  parts.push({ name: 'CeramicCoupePlate', geometry: plateGeo, materialIndex: 0 });

  // -------------------------------------------------------------------------
  // PART 2A & 2B: Thick Country Sourdough Boule Slice (Crumb Cap + Crust Wall)
  // -------------------------------------------------------------------------
  const breadShape = new THREE.Shape();
  breadShape.moveTo(-0.86, -0.52);
  breadShape.quadraticCurveTo(-0.32, -0.57, 0.18, -0.54);
  breadShape.quadraticCurveTo(0.68, -0.53, 0.94, -0.42);
  breadShape.quadraticCurveTo(1.14, -0.18, 1.07, 0.14);
  breadShape.quadraticCurveTo(0.98, 0.45, 0.62, 0.52);
  breadShape.quadraticCurveTo(0.05, 0.57, -0.58, 0.52);
  breadShape.quadraticCurveTo(-1.02, 0.46, -1.09, 0.12);
  breadShape.quadraticCurveTo(-1.12, -0.28, -0.86, -0.52);

  const sliceGeo = new THREE.ExtrudeGeometry(breadShape, {
    depth: 0.255,
    bevelEnabled: true,
    bevelThickness: 0.024,
    bevelSize: 0.024,
    bevelSegments: 3,
    curveSegments: 36,
  });
  sliceGeo.rotateX(-Math.PI / 2);
  sliceGeo.translate(0, plateFloorY + 0.024, 0);

  const sPos = sliceGeo.attributes.position;
  const sNorm = sliceGeo.attributes.normal;
  const sUv = sliceGeo.attributes.uv;
  for (let i = 0; i < sPos.count; i++) {
    const x = sPos.getX(i);
    const y = sPos.getY(i);
    const z = sPos.getZ(i);
    const organicWave = Math.sin(x * 4.2 + z * 3.1) * 0.012;
    if (y > plateFloorY + 0.14) {
      sPos.setY(i, y + organicWave);
    }
    if (Math.abs(sNorm.getY(i)) > 0.65) {
      sUv.setXY(i, x * 0.45 + 0.5, z * 0.45 + 0.5);
    } else {
      const perim = Math.atan2(z, x) / (Math.PI * 2) + 0.5;
      // glTF flipY=false: v=0 is top of crust, v=1 is bottom of crust
      const vCrust = 1 - Math.min(1, Math.max(0, (y - plateFloorY) / 0.295));
      sUv.setXY(i, perim * 2.0, vCrust);
    }
  }
  sliceGeo.computeVertexNormals();

  // Split ExtrudeGeometry groups (group 0 = crumb caps, group 1 = crust walls) into clean single-material meshes
  const nonIdxSlice = sliceGeo.toNonIndexed();
  for (const g of sliceGeo.groups) {
    const subGeo = new THREE.BufferGeometry();
    const start = g.start;
    const end = g.start + g.count;
    subGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(
        (nonIdxSlice.attributes.position.array as Float32Array).slice(start * 3, end * 3),
        3
      )
    );
    subGeo.setAttribute(
      'normal',
      new THREE.BufferAttribute(
        (nonIdxSlice.attributes.normal.array as Float32Array).slice(start * 3, end * 3),
        3
      )
    );
    subGeo.setAttribute(
      'uv',
      new THREE.BufferAttribute(
        (nonIdxSlice.attributes.uv.array as Float32Array).slice(start * 2, end * 2),
        2
      )
    );
    const isCap = g.materialIndex === 0;
    parts.push({
      name: isCap ? 'SourdoughCrumbCap' : 'SourdoughBlisteredCrust',
      geometry: subGeo,
      materialIndex: isCap ? 2 : 1,
      rotationY: tartineRotY,
    });
  }

  const toastTopY = plateFloorY + 0.3;

  // -------------------------------------------------------------------------
  // PART 3: Sculpted Fork-Smashed Hass Avocado Mound + 54 Beveled Chunks
  // -------------------------------------------------------------------------
  const avoMoundGeo = new THREE.PlaneGeometry(1.98, 0.96, 42, 26);
  avoMoundGeo.rotateX(-Math.PI / 2);
  const mPos = avoMoundGeo.attributes.position;
  const mUv = avoMoundGeo.attributes.uv;
  for (let i = 0; i < mPos.count; i++) {
    const mx = mPos.getX(i);
    const mz = mPos.getZ(i);
    const nx = mx / 0.99;
    const nz = mz / 0.48;
    const edgeDist = Math.hypot(nx * 0.92, nz);
    const mask = Math.max(0, 1 - Math.pow(Math.min(1.08, edgeDist), 2.6));
    const eggDist = Math.hypot((mx - 0.15) / 0.46, (mz - 0.02) / 0.4);
    const nestDip = eggDist < 1 ? (1 - eggDist * eggDist) * 0.055 : 0;
    const mashRidges =
      (Math.sin(mx * 9.5 + mz * 6.2) * 0.024 + Math.cos(mx * 14.0 - mz * 11.0) * 0.016) * mask;
    mPos.setXYZ(
      i,
      mx * (0.94 + 0.06 * mask),
      toastTopY - 0.01 + mask * 0.18 - nestDip + mashRidges,
      mz * (0.94 + 0.06 * mask)
    );
    mUv.setXY(i, mx * 0.85 + 0.5, mz * 0.85 + 0.5);
  }
  avoMoundGeo.computeVertexNormals();

  // Merge 54 chunky beveled Hass avocado cubes with the mound so Front/Side views show authentic chunky avocado
  const avoGeos: THREE.BufferGeometry[] = [avoMoundGeo.toNonIndexed()];
  const baseChunk = new THREE.DodecahedronGeometry(0.105, 0);
  const dummy = new THREE.Object3D();

  for (let i = 0; i < 54; i++) {
    const col = i % 11;
    const row = Math.floor(i / 11); // 0..4
    const jitterX = Math.sin(i * 7.3) * 0.055;
    const jitterZ = Math.cos(i * 5.9) * 0.042;
    const cx = -0.86 + (col / 10) * 1.72 + jitterX;
    const cz = -0.38 + (row / 4) * 0.76 + jitterZ;

    const cornerR = Math.hypot(cx / 1.0, cz / 0.5);
    if (cornerR >= 1.02) continue;

    const distEgg = Math.hypot(cx - 0.15, cz - 0.02);
    const underEgg = distEgg < 0.34;
    const cy =
      toastTopY +
      (underEgg ? 0.07 : 0.115 + (1 - Math.min(1, cornerR)) * 0.058 + (i % 3) * 0.016);

    dummy.position.set(cx, cy, cz);
    dummy.rotation.set(i * 0.7, i * 1.15, i * 0.45);
    dummy.scale.set(1.24 + (i % 3) * 0.18, 0.7 + (i % 2) * 0.18, 1.06 + ((i * 2) % 3) * 0.15);
    dummy.updateMatrix();

    const g = baseChunk.clone().toNonIndexed();
    g.applyMatrix4(dummy.matrix);
    // Planar UVs into Hass avocado photograph
    const gp = g.attributes.position;
    const uvs = new Float32Array(gp.count * 2);
    for (let k = 0; k < gp.count; k++) {
      uvs[k * 2] = gp.getX(k) * 0.9 + 0.5;
      uvs[k * 2 + 1] = gp.getZ(k) * 0.9 + 0.5;
    }
    g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    g.computeVertexNormals();
    avoGeos.push(g);
  }

  const mergedAvocado = mergeGeometries(avoGeos, false)!;
  parts.push({
    name: 'HassAvocadoMoundAndChunks',
    geometry: mergedAvocado,
    materialIndex: 3,
    rotationY: tartineRotY,
  });

  // -------------------------------------------------------------------------
  // PART 4: Split Pasture-Raised Poached Egg with Front V-Cleft
  // -------------------------------------------------------------------------
  const eggX = 0.15;
  const eggZ = 0.02;
  const eggBaseY = toastTopY + 0.165;

  const eggGeo = new THREE.SphereGeometry(0.5, 60, 44);
  const ePos = eggGeo.attributes.position;
  const eUv = eggGeo.attributes.uv;
  for (let i = 0; i < ePos.count; i++) {
    let vx = ePos.getX(i) * 1.06;
    let vy = ePos.getY(i) * 0.48;
    let vz = ePos.getZ(i) * 0.92;

    const ang = Math.atan2(vz, vx);
    const skirtWave = 1 + Math.sin(ang * 5 + 0.6) * 0.045 + Math.cos(ang * 9) * 0.02;
    vx *= skirtWave;
    vz *= skirtWave;

    if (vy < 0) vy *= 0.48;

    // Carve natural front V-cleft split (+Z side) where golden yolk spills out
    if (vz > -0.02 && vy > -0.08) {
      const cleftCenter = 0.03;
      const dx = Math.abs(vx - cleftCenter);
      const cleftHalfWidth = 0.07 + Math.max(0, vz) * 0.28;
      if (dx < cleftHalfWidth) {
        const cleftDepth = (1 - dx / cleftHalfWidth) * Math.min(1, (vz + 0.02) / 0.34);
        vy -= cleftDepth * 0.148;
      }
    }

    ePos.setXYZ(i, vx + eggX, vy + eggBaseY + 0.11, vz + eggZ);
    // glTF flipY=false: u = left..right, v = back(-Z)..front(+Z)
    eUv.setXY(i, vx / 1.12 + 0.5, vz / 1.0 + 0.5);
  }
  eggGeo.computeVertexNormals();
  parts.push({
    name: 'SplitPoachedEgg',
    geometry: eggGeo,
    materialIndex: 4,
    rotationY: tartineRotY,
  });

  // -------------------------------------------------------------------------
  // PART 5: Cascading Glossy Runny Golden Yolk Waterfall & Plate Puddle
  // -------------------------------------------------------------------------
  const yolkGeos: THREE.BufferGeometry[] = [];

  const innerYolk = new THREE.SphereGeometry(0.16, 28, 20);
  innerYolk.scale(0.84, 0.62, 1.36);
  innerYolk.rotateX(0.28);
  innerYolk.translate(eggX + 0.03, eggBaseY + 0.165, eggZ + 0.21);
  yolkGeos.push(innerYolk.toNonIndexed());

  const cascadeMain = new THREE.CatmullRomCurve3([
    new THREE.Vector3(eggX + 0.03, eggBaseY + 0.175, eggZ + 0.22),
    new THREE.Vector3(eggX + 0.04, eggBaseY + 0.11, eggZ + 0.39),
    new THREE.Vector3(eggX + 0.045, toastTopY + 0.11, 0.52),
    new THREE.Vector3(eggX + 0.05, toastTopY - 0.03, 0.568),
    new THREE.Vector3(eggX + 0.055, plateFloorY + 0.14, 0.578),
    new THREE.Vector3(eggX + 0.06, plateFloorY + 0.022, 0.612),
  ]);
  const mainTube = new THREE.TubeGeometry(cascadeMain, 48, 0.064, 16, false);
  mainTube.scale(1.16, 1, 0.75);
  mainTube.translate(-(eggX + 0.045) * 0.16, 0, 0.55 * 0.25);
  yolkGeos.push(mainTube.toNonIndexed());

  const cascadeSide = new THREE.CatmullRomCurve3([
    new THREE.Vector3(eggX - 0.015, eggBaseY + 0.15, eggZ + 0.26),
    new THREE.Vector3(eggX + 0.0, toastTopY + 0.12, 0.49),
    new THREE.Vector3(eggX + 0.02, plateFloorY + 0.19, 0.568),
    new THREE.Vector3(eggX + 0.038, plateFloorY + 0.025, 0.605),
  ]);
  const sideTube = new THREE.TubeGeometry(cascadeSide, 36, 0.045, 14, false);
  yolkGeos.push(sideTube.toNonIndexed());

  const puddleGeo = new THREE.SphereGeometry(0.195, 28, 18);
  puddleGeo.scale(1.14, 0.13, 0.9);
  puddleGeo.translate(eggX + 0.058, plateFloorY + 0.014, 0.655);
  yolkGeos.push(puddleGeo.toNonIndexed());

  const dropGeo = new THREE.SphereGeometry(0.075, 20, 14);
  dropGeo.scale(1.1, 0.18, 0.92);
  dropGeo.translate(eggX + 0.34, plateFloorY + 0.011, 0.59);
  yolkGeos.push(dropGeo.toNonIndexed());

  yolkGeos.forEach((yg) => yg.deleteAttribute('uv'));
  const mergedYolk = mergeGeometries(yolkGeos, false)!;
  mergedYolk.computeVertexNormals();
  parts.push({
    name: 'RunnyGoldenYolkCascade',
    geometry: mergedYolk,
    materialIndex: 5,
    rotationY: tartineRotY,
  });

  // -------------------------------------------------------------------------
  // PART 6: Crumbled White Sheep's-Milk Feta Clusters
  // -------------------------------------------------------------------------
  const fetaGeos: THREE.BufferGeometry[] = [];
  const curdBase = new THREE.DodecahedronGeometry(1, 0);
  const fetaCoords: [number, number, number, number][] = [
    [-0.44, toastTopY + 0.22, 0.24, 0.088],
    [-0.64, toastTopY + 0.2, 0.06, 0.076],
    [-0.52, toastTopY + 0.23, -0.22, 0.082],
    [-0.24, toastTopY + 0.24, -0.26, 0.072],
    [0.78, toastTopY + 0.2, 0.12, 0.092],
    [0.68, toastTopY + 0.21, -0.24, 0.078],
    [0.54, toastTopY + 0.22, -0.32, 0.068],
    [-0.78, toastTopY + 0.18, 0.28, 0.064],
  ];
  fetaCoords.forEach(([fx, fy, fz, fSize], idx) => {
    for (let c = 0; c < 3; c++) {
      const ang = idx * 1.7 + c * 2.1;
      dummy.position.set(
        fx + Math.cos(ang) * fSize * 0.45,
        fy + (c % 2) * 0.018,
        fz + Math.sin(ang) * fSize * 0.45
      );
      dummy.rotation.set(c, idx, c * 0.6);
      dummy.scale.set(fSize * 1.1, fSize * 0.78, fSize * 0.95);
      dummy.updateMatrix();
      const cg = curdBase.clone().toNonIndexed();
      cg.deleteAttribute('uv');
      cg.applyMatrix4(dummy.matrix);
      cg.computeVertexNormals();
      fetaGeos.push(cg);
    }
  });
  parts.push({
    name: 'CrumbledFetaClusters',
    geometry: mergeGeometries(fetaGeos, false)!,
    materialIndex: 6,
    rotationY: tartineRotY,
  });

  // -------------------------------------------------------------------------
  // PART 7 & 8: Arching Purple Microgreen Stems + Sorrel & Amaranth Leaves
  // -------------------------------------------------------------------------
  const stemGeos: THREE.BufferGeometry[] = [];
  const sorrelLeafGeos: THREE.BufferGeometry[] = [];
  const amaranthLeafGeos: THREE.BufferGeometry[] = [];
  const baseLeafGeo = createLeafGeometry(0.168, 0.09, 0.032);

  const microShoots: { pts: [number, number, number][]; burgundyTip?: boolean }[] = [
    {
      pts: [
        [-0.36, toastTopY + 0.2, 0.05],
        [-0.24, eggBaseY + 0.28, 0.02],
        [-0.04, eggBaseY + 0.42, -0.04],
        [0.14, eggBaseY + 0.41, -0.08],
      ],
    },
    {
      pts: [
        [-0.48, toastTopY + 0.19, 0.12],
        [-0.38, eggBaseY + 0.26, 0.08],
        [-0.18, eggBaseY + 0.36, 0.06],
      ],
    },
    {
      pts: [
        [-0.62, toastTopY + 0.18, 0.16],
        [-0.68, toastTopY + 0.34, 0.22],
        [-0.54, toastTopY + 0.42, 0.18],
      ],
    },
    {
      pts: [
        [-0.56, toastTopY + 0.18, -0.08],
        [-0.64, toastTopY + 0.33, -0.14],
        [-0.46, toastTopY + 0.4, -0.18],
      ],
    },
    {
      pts: [
        [-0.42, toastTopY + 0.19, 0.24],
        [-0.5, toastTopY + 0.3, 0.32],
        [-0.36, toastTopY + 0.34, 0.29],
      ],
      burgundyTip: true,
    },
    {
      pts: [
        [-0.68, toastTopY + 0.17, 0.02],
        [-0.8, toastTopY + 0.27, 0.08],
        [-0.72, toastTopY + 0.32, 0.15],
      ],
      burgundyTip: true,
    },
    {
      pts: [
        [-0.28, toastTopY + 0.2, -0.22],
        [-0.18, eggBaseY + 0.25, -0.26],
        [-0.02, eggBaseY + 0.33, -0.22],
      ],
    },
  ];

  const placeLeaf = (
    targetArr: THREE.BufferGeometry[],
    pos: THREE.Vector3,
    rx: number,
    ry: number,
    rz: number,
    sc: number
  ) => {
    dummy.position.copy(pos);
    dummy.rotation.set(rx, ry, rz);
    dummy.scale.setScalar(sc);
    dummy.updateMatrix();
    const lg = baseLeafGeo.clone().toNonIndexed();
    lg.deleteAttribute('uv');
    lg.applyMatrix4(dummy.matrix);
    lg.computeVertexNormals();
    targetArr.push(lg);
  };

  microShoots.forEach((shoot, sIdx) => {
    const curve = new THREE.CatmullRomCurve3(
      shoot.pts.map(([x, y, z]) => new THREE.Vector3(x, y, z))
    );
    const sg = new THREE.TubeGeometry(curve, 22, 0.0088, 7, false).toNonIndexed();
    sg.deleteAttribute('uv');
    sg.computeVertexNormals();
    stemGeos.push(sg);

    const tip = curve.getPointAt(1);
    const mid = curve.getPointAt(0.62);
    const tipTarget = shoot.burgundyTip ? amaranthLeafGeos : sorrelLeafGeos;

    placeLeaf(tipTarget, tip, 0.22, sIdx * 1.1, -0.18, 0.96);
    placeLeaf(tipTarget, tip, 0.28, sIdx * 1.1 + 2.4, 0.16, 0.82);
    placeLeaf(
      sIdx % 2 === 0 ? amaranthLeafGeos : sorrelLeafGeos,
      mid,
      0.18,
      sIdx * 1.7 - 1.1,
      0.12,
      0.78
    );
  });

  parts.push({
    name: 'PurpleMicrogreenStems',
    geometry: mergeGeometries(stemGeos, false)!,
    materialIndex: 7,
    rotationY: tartineRotY,
  });
  parts.push({
    name: 'SorrelMicroLeaves',
    geometry: mergeGeometries(sorrelLeafGeos, false)!,
    materialIndex: 8,
    rotationY: tartineRotY,
  });
  parts.push({
    name: 'AmaranthMicroLeaves',
    geometry: mergeGeometries(amaranthLeafGeos, false)!,
    materialIndex: 9,
    rotationY: tartineRotY,
  });

  // -------------------------------------------------------------------------
  // PART 9: 94 Physical 3D Seasoning Grains (Vertex-Colored Single Mesh)
  // -------------------------------------------------------------------------
  const grainGeos: THREE.BufferGeometry[] = [];
  const baseSpice = new THREE.DodecahedronGeometry(0.018, 0);
  const cTmp = new THREE.Color();

  for (let i = 0; i < 94; i++) {
    let hex = 0x1b1613;
    if (i < 34) {
      const a = i * 2.39996;
      const r = Math.sqrt((i + 0.5) / 34) * 0.42;
      const gx = eggX + Math.cos(a) * r;
      const gz = eggZ + Math.sin(a) * r * 0.86;
      const domeH = Math.sqrt(Math.max(0, 1 - (r / 0.48) ** 2)) * 0.236;
      dummy.position.set(gx, eggBaseY + 0.116 + domeH, gz);
      dummy.scale.set(i % 3 === 0 ? 1.35 : 0.78, 0.42, 0.9);
      hex = i % 3 === 0 ? 0xa82212 : i % 2 === 0 ? 0x1b1613 : 0xc4731b;
    } else if (i < 64) {
      const k = i - 34;
      const gx = -0.84 + ((k * 47) % 168) / 100;
      const gz = -0.38 + ((k * 73) % 76) / 100;
      dummy.position.set(gx, toastTopY + 0.21, gz);
      dummy.scale.set(1.1, 0.55, 0.95);
      hex = k % 3 === 0 ? 0xa82212 : k % 2 === 0 ? 0x1d1714 : 0x9e7138;
    } else {
      const p = i - 64;
      const sideSign = p % 4 === 0 ? -1 : 1;
      const px = -0.85 + ((p * 61) % 175) / 100;
      const pz = sideSign * (0.64 + ((p * 37) % 62) / 100);
      const pr = Math.hypot(px, pz);
      const lift = pr > 0.9 ? (pr - 0.9) * 0.09 : 0;
      dummy.position.set(px, plateFloorY + 0.013 + lift, pz);
      if (p % 4 === 0) {
        dummy.scale.set(1.6, 1.1, 1.4);
        hex = 0xfbf9f2;
      } else if (p % 3 === 0) {
        dummy.scale.set(1.45, 1.35, 1.45);
        hex = 0xa6793e;
      } else if (p % 2 === 0) {
        dummy.scale.set(1.05, 0.9, 1.05);
        hex = 0x1c1714;
      } else {
        dummy.scale.set(1.35, 0.35, 1.0);
        hex = 0xa62314;
      }
    }

    dummy.rotation.set(i * 0.5, i * 1.3, i * 0.8);
    dummy.updateMatrix();
    const gg = baseSpice.clone().toNonIndexed();
    gg.deleteAttribute('uv');
    gg.applyMatrix4(dummy.matrix);
    gg.computeVertexNormals();

    cTmp.setHex(hex);
    // Convert sRGB hex to linear RGB for glTF COLOR_0
    cTmp.convertSRGBToLinear();
    const count = gg.attributes.position.count;
    const cols = new Float32Array(count * 3);
    for (let v = 0; v < count; v++) {
      cols[v * 3] = cTmp.r;
      cols[v * 3 + 1] = cTmp.g;
      cols[v * 3 + 2] = cTmp.b;
    }
    gg.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    grainGeos.push(gg);
  }

  parts.push({
    name: 'ArtisanSpicesAndCorianderSeeds',
    geometry: mergeGeometries(grainGeos, false)!,
    materialIndex: 10,
    rotationY: tartineRotY,
  });

  // Pack & write /public/assets/models/avocado-toast.glb
  const glbBuffer = serializeToGlb(parts, materials, [
    { name: 'plate_albedo', data: platePng },
    { name: 'crust_albedo', data: crustPng },
    { name: 'avocado_albedo', data: avoPng, wrapRepeat: true },
    { name: 'egg_albedo', data: eggPng },
  ]);

  const outPath = path.join(rootDir, 'public/assets/models/avocado-toast.glb');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, glbBuffer);

  console.log(
    `Generated ${outPath} (${(glbBuffer.length / 1024).toFixed(1)} KB, ${parts.length} mesh nodes)`
  );
}

main();
