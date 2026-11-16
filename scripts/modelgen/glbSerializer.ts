import * as THREE from 'three';

export interface GlbMaterialSpec {
  name: string;
  baseColorFactor?: [number, number, number, number];
  baseColorTextureIndex?: number;
  normalTextureIndex?: number;
  normalScale?: number;
  metallicRoughnessTextureIndex?: number;
  metallicFactor: number;
  roughnessFactor: number;
  emissiveFactor?: [number, number, number];
  doubleSided?: boolean;
  alphaBlend?: boolean;
}

export interface GlbMeshPart {
  name: string;
  geometry: THREE.BufferGeometry;
  materialIndex: number;
  position?: [number, number, number];
  rotationY?: number;
}

export interface GlbTextureEntry {
  name: string;
  data: Buffer;
  wrapSRepeat?: boolean;
  wrapTRepeat?: boolean;
}

function ensureCleanGeometry(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  const clean = geo.clone();
  if (!clean.attributes.normal) {
    clean.computeVertexNormals();
  }
  for (const key of Object.keys(clean.attributes)) {
    if (key !== 'position' && key !== 'normal' && key !== 'uv' && key !== 'color') {
      clean.deleteAttribute(key);
    }
  }
  return clean;
}

export function serializeToGlb(
  rootName: string,
  parts: GlbMeshPart[],
  materials: GlbMaterialSpec[],
  pngBuffers: GlbTextureEntry[]
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

  const images = pngBuffers.map((img) => ({
    name: img.name,
    bufferView: appendBuffer(img.data),
    mimeType: 'image/png',
  }));

  const samplers = [
    { magFilter: 9729, minFilter: 9987, wrapS: 33071, wrapT: 33071 },
    { magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 33071 },
    { magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 },
  ];

  const textures = pngBuffers.map((img, idx) => ({
    sampler: img.wrapSRepeat && img.wrapTRepeat ? 2 : img.wrapSRepeat ? 1 : 0,
    source: idx,
  }));

  const gltfMaterials = materials.map((m) => {
    const pbr: Record<string, unknown> = {
      metallicFactor: m.metallicFactor,
      roughnessFactor: m.roughnessFactor,
    };
    if (m.baseColorFactor) pbr.baseColorFactor = m.baseColorFactor;
    if (m.baseColorTextureIndex !== undefined) {
      pbr.baseColorTexture = { index: m.baseColorTextureIndex };
    }
    if (m.metallicRoughnessTextureIndex !== undefined) {
      pbr.metallicRoughnessTexture = { index: m.metallicRoughnessTextureIndex };
    }

    const matObj: Record<string, unknown> = {
      name: m.name,
      pbrMetallicRoughness: pbr,
    };
    if (m.normalTextureIndex !== undefined) {
      matObj.normalTexture = {
        index: m.normalTextureIndex,
        scale: m.normalScale ?? 0.85,
      };
    }
    if (m.metallicRoughnessTextureIndex !== undefined) {
      matObj.occlusionTexture = {
        index: m.metallicRoughnessTextureIndex,
        strength: 0.65,
      };
    }
    if (m.emissiveFactor) matObj.emissiveFactor = m.emissiveFactor;
    if (m.doubleSided) matObj.doubleSided = true;
    if (m.alphaBlend) matObj.alphaMode = 'BLEND';
    return matObj;
  });

  const meshes: Array<Record<string, unknown>> = [];
  const childNodeIndices: number[] = [];
  const nodes: Array<Record<string, unknown>> = [{ name: rootName, children: childNodeIndices }];

  for (const part of parts) {
    const geo = ensureCleanGeometry(part.geometry);
    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
    const normAttr = geo.getAttribute('normal') as THREE.BufferAttribute;
    const uvAttr = geo.getAttribute('uv') as THREE.BufferAttribute | undefined;
    const colAttr = geo.getAttribute('color') as THREE.BufferAttribute | undefined;

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
      componentType: 5126,
      count: posAttr.count,
      type: 'VEC3',
      min,
      max,
    });

    const normArray = new Float32Array(normAttr.count * 3);
    for (let i = 0; i < normAttr.count; i++) {
      const nx = normAttr.getX(i);
      const ny = normAttr.getY(i);
      const nz = normAttr.getZ(i);
      const len = Math.hypot(nx, ny, nz) || 1;
      normArray[i * 3] = nx / len;
      normArray[i * 3 + 1] = ny / len;
      normArray[i * 3 + 2] = nz / len;
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

    if (colAttr) {
      const colArray = new Float32Array(colAttr.count * 3);
      for (let i = 0; i < colAttr.count; i++) {
        colArray[i * 3] = colAttr.getX(i);
        colArray[i * 3 + 1] = colAttr.getY(i);
        colArray[i * 3 + 2] = colAttr.getZ(i);
      }
      const colBv = appendBuffer(Buffer.from(colArray.buffer), 34962);
      const colAcc = accessors.length;
      accessors.push({
        bufferView: colBv,
        componentType: 5126,
        count: colAttr.count,
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
      for (let i = 0; i < idxCount; i++) idxTyped[i] = geo.index.getX(i);
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
    meshes.push({ name: part.name, primitives: [prim] });

    const nodeObj: Record<string, unknown> = { name: part.name, mesh: meshIndex };
    if (part.position) nodeObj.translation = part.position;
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
    asset: { version: '2.0', generator: 'WillowCafe-Photoreal3DBuilder' },
    scene: 0,
    scenes: [{ name: 'Scene', nodes: [0] }],
    nodes,
    meshes,
    materials: gltfMaterials,
    ...(textures.length > 0 ? { textures, images, samplers } : {}),
    accessors,
    bufferViews,
    buffers: [{ byteLength: binBuffer.length }],
  };

  const jsonBytes = Buffer.from(JSON.stringify(gltfJson), 'utf8');
  const jsonPad = (4 - (jsonBytes.length % 4)) % 4;
  const jsonChunk = jsonPad > 0 ? Buffer.concat([jsonBytes, Buffer.alloc(jsonPad, 0x20)]) : jsonBytes;

  const binPad = (4 - (binBuffer.length % 4)) % 4;
  const binChunk = binPad > 0 ? Buffer.concat([binBuffer, Buffer.alloc(binPad, 0x00)]) : binBuffer;

  const totalLength = 12 + 8 + jsonChunk.length + 8 + binChunk.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);

  const jsonHdr = Buffer.alloc(8);
  jsonHdr.writeUInt32LE(jsonChunk.length, 0);
  jsonHdr.writeUInt32LE(0x4e4f534a, 4);

  const binHdr = Buffer.alloc(8);
  binHdr.writeUInt32LE(binChunk.length, 0);
  binHdr.writeUInt32LE(0x004e4942, 4);

  return Buffer.concat([header, jsonHdr, jsonChunk, binHdr, binChunk]);
}

/* ============================================================================
   REUSABLE PHOTOREALISTIC CULINARY GEOMETRY BUILDERS
   ============================================================================ */

export function setPlanarTopUVs(geo: THREE.BufferGeometry, radius: number, rotRad = 0) {
  const pos = geo.attributes.position;
  const uvs = new Float32Array(pos.count * 2);
  const c = Math.cos(rotRad);
  const s = Math.sin(rotRad);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const rx = x * c - z * s;
    const rz = x * s + z * c;
    uvs[i * 2] = rx / (radius * 2) + 0.5;
    uvs[i * 2 + 1] = rz / (radius * 2) + 0.5;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
}

export function setCylindricalSideUVs(
  geo: THREE.BufferGeometry,
  minY: number,
  maxY: number,
  repeatU = 1
) {
  const pos = geo.attributes.position;
  const uvs = new Float32Array(pos.count * 2);
  const spanY = Math.max(0.01, maxY - minY);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const u = (Math.atan2(z, x) / (Math.PI * 2) + 0.5) * repeatU;
    const v = 1 - Math.max(0, Math.min(1, (y - minY) / spanY));
    uvs[i * 2] = u;
    uvs[i * 2 + 1] = v;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
}

export function buildCoupePlateGeo(
  radius = 1.72,
  groundY = -0.3,
  rimHeight = 0.24
): THREE.BufferGeometry {
  const pts = [
    new THREE.Vector2(0, groundY),
    new THREE.Vector2(radius * 0.62, groundY),
    new THREE.Vector2(radius * 0.74, groundY + rimHeight * 0.14),
    new THREE.Vector2(radius * 0.94, groundY + rimHeight * 0.66),
    new THREE.Vector2(radius, groundY + rimHeight),
    new THREE.Vector2(radius * 0.976, groundY + rimHeight * 1.07),
    new THREE.Vector2(radius * 0.935, groundY + rimHeight * 0.92),
    new THREE.Vector2(radius * 0.78, groundY + rimHeight * 0.4),
    new THREE.Vector2(radius * 0.54, groundY + 0.074),
    new THREE.Vector2(0, groundY + 0.07),
  ];
  const geo = new THREE.LatheGeometry(pts, 84);
  setPlanarTopUVs(geo, radius);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds a high-density Shirley-Chiu concentric circular food relief mesh whose height
 * at every (dx, dz) in [-1, 1] is sculpted by a custom culinary height function and mapped
 * 1:1 to the extracted circular TOP VIEW photograph.
 */
export function buildPhotoSculptedDiscGeo(
  radius: number,
  segments: number,
  heightFn: (dx: number, dz: number, r: number, u: number, v: number) => number,
  uvRadiusScale = 0.495
): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(2, 2, segments, segments);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const uvs = new Float32Array(pos.count * 2);

  for (let i = 0; i < pos.count; i++) {
    const sx = pos.getX(i);
    const sz = pos.getZ(i);
    let dx = 0;
    let dz = 0;
    if (sx !== 0 || sz !== 0) {
      const rSq = Math.abs(sx) > Math.abs(sz) ? sx : sz;
      const phi =
        Math.abs(sx) > Math.abs(sz)
          ? (Math.PI / 4) * (sz / sx)
          : Math.PI / 2 - (Math.PI / 4) * (sx / sz);
      dx = rSq * Math.cos(phi);
      dz = rSq * Math.sin(phi);
    }
    const r = Math.min(1, Math.hypot(dx, dz));
    const u = dx * uvRadiusScale + 0.5;
    const v = dz * uvRadiusScale + 0.5;
    const y = heightFn(dx, dz, r, u, v);

    pos.setXYZ(i, dx * radius, y, dz * radius);
    uvs[i * 2] = u;
    uvs[i * 2 + 1] = v;
  }

  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  return geo;
}

export function createOrganicLeafGeo(
  length = 0.24,
  width = 0.13,
  camber = 0.042
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.quadraticCurveTo(width, length * 0.35, width * 0.72, length * 0.75);
  shape.quadraticCurveTo(width * 0.22, length * 0.98, 0, length);
  shape.quadraticCurveTo(-width * 0.22, length * 0.98, -width * 0.72, length * 0.75);
  shape.quadraticCurveTo(-width, length * 0.35, 0, 0);

  const geo = new THREE.ShapeGeometry(shape, 12);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const z = -pos.getZ(i);
    const x = pos.getX(i);
    const t = Math.max(0, Math.min(1, z / length));
    pos.setY(i, Math.sin(t * Math.PI) * camber - Math.abs(x) * 0.16);
  }
  geo.deleteAttribute('uv');
  geo.computeVertexNormals();
  return geo;
}
