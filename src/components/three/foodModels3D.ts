import * as THREE from 'three';
import { isSoftwareGl } from './webglUtils';
import {
  createArtisanCoupePlateTexture,
  createCulinarySurfaceTexture,
  createFruitCutTexture,
  createLatteArtTexture,
  createOrganicBumpTexture,
  createRusticSourdoughCrustTexture,
  createSeasonedPoachedEggTexture,
  createSmashedAvocadoTexture,
  createStonewareTexture,
  createWoodGrainTexture,
} from './foodTextures3D';

const GROUND_Y = -0.3;

export interface DishDynamicActors {
  floatingIce?: THREE.Object3D[];
  risingBubbles?: { mesh: THREE.InstancedMesh; basePositions: Float32Array; speeds: Float32Array };
  coffeeDrip?: { drop: THREE.Mesh; topY: number; bottomY: number };
}

export interface BuiltDish3D {
  root: THREE.Group;
  actors: DishDynamicActors;
  dispose: () => void;
}

class ResourceTracker {
  private geometries: THREE.BufferGeometry[] = [];
  private materials: THREE.Material[] = [];
  private textures: THREE.Texture[] = [];

  geo<T extends THREE.BufferGeometry>(g: T): T {
    this.geometries.push(g);
    return g;
  }

  mat<T extends THREE.Material>(m: T): T {
    this.materials.push(m);
    return m;
  }

  tex<T extends THREE.Texture>(t: T): T {
    this.textures.push(t);
    return t;
  }

  mesh(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    castShadow = true,
    receiveShadow = true
  ): THREE.Mesh {
    const m = new THREE.Mesh(geometry, material);
    m.castShadow = castShadow && !isSoftwareGl;
    m.receiveShadow = receiveShadow && !isSoftwareGl;
    return m;
  }

  dispose() {
    this.geometries.forEach((g) => g.dispose());
    this.materials.forEach((m) => m.dispose());
    this.textures.forEach((t) => t.dispose());
    this.geometries = [];
    this.materials = [];
    this.textures = [];
  }
}

// Reusable scratch objects for InstancedMesh placement
const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

function createOpticalGlassMat(tr: ResourceTracker, tint = 0xffffff): THREE.MeshPhysicalMaterial {
  return tr.mat(
    new THREE.MeshPhysicalMaterial({
      color: tint,
      metalness: 0,
      roughness: 0.06,
      transmission: isSoftwareGl ? 0 : 0.92,
      transparent: true,
      opacity: isSoftwareGl ? 0.34 : 1,
      ior: 1.52,
      thickness: 0.55,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      depthWrite: false,
    })
  );
}

function createLeafGeometry(tr: ResourceTracker, length = 0.34, width = 0.16, arch = 0.06): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.quadraticCurveTo(width, length * 0.42, 0, length);
  shape.quadraticCurveTo(-width, length * 0.42, 0, 0);

  const geo = tr.geo(
    new THREE.ExtrudeGeometry(shape, {
      depth: 0.012,
      bevelEnabled: true,
      bevelThickness: 0.006,
      bevelSize: 0.006,
      bevelSegments: 2,
      curveSegments: 12,
    })
  );
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const z = pos.getZ(i);
    const t = Math.min(1, Math.max(0, -z / Math.max(0.01, length)));
    const bendY = Math.sin(t * Math.PI) * arch - t * t * (arch * 0.45);
    pos.setY(i, pos.getY(i) + bendY);
  }
  geo.computeVertexNormals();
  return geo;
}

function addStonewarePlate(
  parent: THREE.Group,
  tr: ResourceTracker,
  maxAniso: number,
  radius = 1.62,
  glazeHex = '#F3ECE0',
  speckleHex = '#6E5844',
  accentRimHex?: string
): number {
  const tex = tr.tex(createStonewareTexture(glazeHex, speckleHex, maxAniso));
  const mat = tr.mat(
    new THREE.MeshPhysicalMaterial({
      map: tex,
      roughness: 0.28,
      metalness: 0.02,
      clearcoat: 0.48,
      clearcoatRoughness: 0.18,
    })
  );

  const pts = [
    new THREE.Vector2(0, GROUND_Y),
    new THREE.Vector2(radius * 0.68, GROUND_Y),
    new THREE.Vector2(radius * 0.74, GROUND_Y + 0.03),
    new THREE.Vector2(radius * 0.96, GROUND_Y + 0.13),
    new THREE.Vector2(radius, GROUND_Y + 0.19),
    new THREE.Vector2(radius * 0.94, GROUND_Y + 0.21),
    new THREE.Vector2(radius * 0.74, GROUND_Y + 0.09),
    new THREE.Vector2(0, GROUND_Y + 0.08),
  ];
  const plate = tr.mesh(tr.geo(new THREE.LatheGeometry(pts, 64)), mat);
  parent.add(plate);

  if (accentRimHex) {
    const rim = tr.mesh(
      tr.geo(new THREE.TorusGeometry(radius * 0.965, 0.014, 12, 64)),
      tr.mat(
        new THREE.MeshStandardMaterial({
          color: accentRimHex,
          roughness: 0.32,
          metalness: 0.28,
        })
      ),
      false,
      true
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = GROUND_Y + 0.205;
    parent.add(rim);
  }

  return GROUND_Y + 0.082; // Interior resting floor Y
}

function addStonewareBowl(
  parent: THREE.Group,
  tr: ResourceTracker,
  maxAniso: number,
  radius = 1.48,
  glazeHex = '#EFE6D5',
  speckleHex = '#5B4635'
): number {
  const tex = tr.tex(createStonewareTexture(glazeHex, speckleHex, maxAniso));
  const mat = tr.mat(
    new THREE.MeshPhysicalMaterial({
      map: tex,
      roughness: 0.3,
      metalness: 0.02,
      clearcoat: 0.45,
      side: THREE.DoubleSide,
    })
  );

  const pts = [
    new THREE.Vector2(0, GROUND_Y),
    new THREE.Vector2(radius * 0.52, GROUND_Y),
    new THREE.Vector2(radius * 0.62, GROUND_Y + 0.06),
    new THREE.Vector2(radius * 0.92, GROUND_Y + 0.28),
    new THREE.Vector2(radius, GROUND_Y + 0.46),
    new THREE.Vector2(radius * 0.94, GROUND_Y + 0.48),
    new THREE.Vector2(radius * 0.84, GROUND_Y + 0.28),
    new THREE.Vector2(radius * 0.54, GROUND_Y + 0.11),
    new THREE.Vector2(0, GROUND_Y + 0.1),
  ];
  const bowl = tr.mesh(tr.geo(new THREE.LatheGeometry(pts, 64)), mat);
  parent.add(bowl);
  return GROUND_Y + 0.11;
}

function addWalnutBoard(
  parent: THREE.Group,
  tr: ResourceTracker,
  maxAniso: number,
  width = 2.6,
  depth = 1.85
): number {
  const woodTex = tr.tex(createWoodGrainTexture('#5C3D28', '#331E11', maxAniso));
  const mat = tr.mat(
    new THREE.MeshStandardMaterial({
      map: woodTex,
      roughness: 0.62,
      metalness: 0.04,
    })
  );

  const hw = width * 0.5;
  const hd = depth * 0.5;
  const r = 0.24;
  const s = new THREE.Shape();
  s.moveTo(-hw + r, -hd);
  s.lineTo(hw - r, -hd);
  s.quadraticCurveTo(hw, -hd, hw, -hd + r);
  s.lineTo(hw, hd - r);
  s.quadraticCurveTo(hw, hd, hw - r, hd);
  s.lineTo(-hw + r, hd);
  s.quadraticCurveTo(-hw, hd, -hw, hd - r);
  s.lineTo(-hw, -hd + r);
  s.quadraticCurveTo(-hw, -hd, -hw + r, -hd);

  const boardGeo = tr.geo(
    new THREE.ExtrudeGeometry(s, {
      depth: 0.11,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 3,
    })
  );
  boardGeo.rotateX(Math.PI / 2);
  const board = tr.mesh(boardGeo, mat);
  board.position.y = GROUND_Y + 0.13;
  parent.add(board);

  // Sculpted paddle handle on right side
  const handleGeo = tr.geo(new THREE.CapsuleGeometry(0.11, 0.42, 6, 16));
  handleGeo.rotateZ(Math.PI / 2);
  handleGeo.scale(1, 0.45, 1);
  const handle = tr.mesh(handleGeo, mat);
  handle.position.set(hw + 0.22, GROUND_Y + 0.075, 0);
  parent.add(handle);

  return GROUND_Y + 0.15;
}

function addBrassSpoonOrFork(
  parent: THREE.Group,
  tr: ResourceTracker,
  kind: 'spoon' | 'fork',
  x: number,
  y: number,
  z: number,
  rotY: number
) {
  const brassMat = tr.mat(
    new THREE.MeshPhysicalMaterial({
      color: 0xd4a15a,
      metalness: 0.92,
      roughness: 0.2,
      clearcoat: 0.3,
    })
  );

  const utensil = new THREE.Group();
  const stem = tr.mesh(tr.geo(new THREE.BoxGeometry(0.045, 0.016, 0.95)), brassMat);
  utensil.add(stem);

  if (kind === 'spoon') {
    const bowlGeo = tr.geo(new THREE.SphereGeometry(0.13, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.5));
    bowlGeo.scale(0.82, 0.35, 1.35);
    bowlGeo.rotateX(Math.PI);
    const bowl = tr.mesh(bowlGeo, brassMat);
    bowl.position.set(0, 0.01, -0.54);
    utensil.add(bowl);
  } else {
    const head = tr.mesh(tr.geo(new THREE.BoxGeometry(0.14, 0.016, 0.12)), brassMat);
    head.position.set(0, 0, -0.5);
    utensil.add(head);
    for (let t = -1; t <= 1; t++) {
      const tine = tr.mesh(tr.geo(new THREE.BoxGeometry(0.022, 0.014, 0.22)), brassMat);
      tine.position.set(t * 0.046, 0.005, -0.64);
      utensil.add(tine);
    }
  }

  utensil.position.set(x, y, z);
  utensil.rotation.y = rotY;
  parent.add(utensil);
}

/* ============================================================================
   1. CEREMONIAL UJI MATCHA LATTE (matcha-latte)
   ============================================================================ */
function buildMatchaLatte(root: THREE.Group, tr: ResourceTracker, maxAniso: number) {
  // Carved dark walnut tray coaster
  const woodTex = tr.tex(createWoodGrainTexture('#4B301E', '#26150B', maxAniso));
  const woodMat = tr.mat(new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.64, metalness: 0.04 }));
  const coasterPts = [
    new THREE.Vector2(0, GROUND_Y),
    new THREE.Vector2(1.48, GROUND_Y),
    new THREE.Vector2(1.56, GROUND_Y + 0.06),
    new THREE.Vector2(1.48, GROUND_Y + 0.11),
    new THREE.Vector2(1.36, GROUND_Y + 0.07),
    new THREE.Vector2(0, GROUND_Y + 0.07),
  ];
  root.add(tr.mesh(tr.geo(new THREE.LatheGeometry(coasterPts, 56)), woodMat));

  // Hand-thrown speckled stoneware chawan mug
  const ceramicTex = tr.tex(createStonewareTexture('#EAE0CE', '#594738', maxAniso));
  const ceramicMat = tr.mat(
    new THREE.MeshPhysicalMaterial({
      map: ceramicTex,
      roughness: 0.34,
      clearcoat: 0.42,
      side: THREE.DoubleSide,
    })
  );
  const cupPts = [
    new THREE.Vector2(0, GROUND_Y + 0.07),
    new THREE.Vector2(0.72, GROUND_Y + 0.07),
    new THREE.Vector2(0.96, GROUND_Y + 0.35),
    new THREE.Vector2(1.08, GROUND_Y + 0.85),
    new THREE.Vector2(1.11, GROUND_Y + 1.12),
    new THREE.Vector2(1.03, GROUND_Y + 1.14),
    new THREE.Vector2(0.98, GROUND_Y + 0.82),
    new THREE.Vector2(0.68, GROUND_Y + 0.16),
    new THREE.Vector2(0, GROUND_Y + 0.15),
  ];
  const cup = tr.mesh(tr.geo(new THREE.LatheGeometry(cupPts, 56)), ceramicMat);
  cup.position.set(-0.18, 0, 0.05);
  root.add(cup);

  // Curved stoneware ear handle
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.16, GROUND_Y + 0.94, 0.05),
    new THREE.Vector3(-1.54, GROUND_Y + 0.88, 0.05),
    new THREE.Vector3(-1.52, GROUND_Y + 0.46, 0.05),
    new THREE.Vector3(-1.06, GROUND_Y + 0.38, 0.05),
  ]);
  root.add(tr.mesh(tr.geo(new THREE.TubeGeometry(handleCurve, 28, 0.075, 14, false)), ceramicMat));

  // Domed ceremonial Uji matcha oat-milk rosette foam
  const latteTex = tr.tex(createLatteArtTexture('matcha', maxAniso));
  const bumpTex = tr.tex(createOrganicBumpTexture(11, 0.6));
  const foamGeo = tr.geo(new THREE.CircleGeometry(1.01, 56));
  foamGeo.rotateX(-Math.PI / 2);
  const pos = foamGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const r = Math.hypot(pos.getX(i), pos.getZ(i));
    pos.setY(i, Math.max(0, 1 - (r / 1.01) ** 2) * 0.055);
  }
  foamGeo.computeVertexNormals();
  const foam = tr.mesh(
    foamGeo,
    tr.mat(
      new THREE.MeshStandardMaterial({
        map: latteTex,
        bumpMap: bumpTex,
        bumpScale: 0.012,
        roughness: 0.36,
      })
    )
  );
  foam.position.set(-0.18, GROUND_Y + 1.03, 0.05);
  root.add(foam);

  // Hand-carved bamboo chasen whisk resting beside cup
  const bambooMat = tr.mat(new THREE.MeshStandardMaterial({ color: 0xc9a368, roughness: 0.52 }));
  const whiskGroup = new THREE.Group();
  const whiskStem = tr.mesh(tr.geo(new THREE.CylinderGeometry(0.13, 0.14, 0.42, 20)), bambooMat);
  whiskGroup.add(whiskStem);
  const threadRing = tr.mesh(
    tr.geo(new THREE.TorusGeometry(0.138, 0.014, 10, 24)),
    tr.mat(new THREE.MeshStandardMaterial({ color: 0x221812, roughness: 0.7 }))
  );
  threadRing.rotation.x = Math.PI / 2;
  threadRing.position.y = 0.18;
  whiskGroup.add(threadRing);

  // Delicate curved bamboo chasen tines
  for (let i = 0; i < 18; i++) {
    const ang = (i / 18) * Math.PI * 2;
    const tineCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(ang) * 0.12, 0.2, Math.sin(ang) * 0.12),
      new THREE.Vector3(Math.cos(ang) * 0.22, 0.45, Math.sin(ang) * 0.22),
      new THREE.Vector3(Math.cos(ang) * 0.15, 0.66, Math.sin(ang) * 0.15),
      new THREE.Vector3(Math.cos(ang) * 0.06, 0.72, Math.sin(ang) * 0.06),
    ]);
    whiskGroup.add(tr.mesh(tr.geo(new THREE.TubeGeometry(tineCurve, 14, 0.009, 6, false)), bambooMat));
  }
  whiskGroup.position.set(1.06, GROUND_Y + 0.28, 0.22);
  whiskGroup.rotation.z = 0.12;
  root.add(whiskGroup);
}

/* ============================================================================
   2. WILD BLUEBERRY BASQUE CHEESECAKE (blueberry-cheesecake)
   ============================================================================ */
function buildBlueberryCheesecake(root: THREE.Group, tr: ResourceTracker, maxAniso: number) {
  const floorY = addStonewarePlate(root, tr, maxAniso, 1.65, '#F6F0E4', '#705A46', '#C9893B');
  const bump = tr.tex(createOrganicBumpTexture(23, 0.9));

  // Wedge profile helper (triangular pastry slice centered nicely on plate)
  const makeWedgeGeo = (height: number, bevel = 0.025) => {
    const s = new THREE.Shape();
    const r = 1.55;
    const halfAngle = 0.42;
    s.moveTo(-0.75, 0);
    s.lineTo(-0.75 + Math.cos(-halfAngle) * r, Math.sin(-halfAngle) * r);
    s.absarc(-0.75, 0, r, -halfAngle, halfAngle, false);
    s.closePath();

    const g = tr.geo(
      new THREE.ExtrudeGeometry(s, {
        depth: height,
        bevelEnabled: true,
        bevelThickness: bevel,
        bevelSize: bevel,
        bevelSegments: 3,
        curveSegments: 24,
      })
    );
    g.rotateX(-Math.PI / 2);
    return g;
  };

  // 1. Toasted brown-butter digestive crumb base
  const crumbMat = tr.mat(
    new THREE.MeshStandardMaterial({
      color: 0x9c612d,
      bumpMap: bump,
      bumpScale: 0.035,
      roughness: 0.88,
    })
  );
  const crumbLayer = tr.mesh(makeWedgeGeo(0.13, 0.015), crumbMat);
  crumbLayer.position.set(0.05, floorY + 0.015, 0.05);
  root.add(crumbLayer);

  // 2. Creamy Madagascar vanilla Basque body
  const creamMat = tr.mat(
    new THREE.MeshStandardMaterial({
      color: 0xf7ecd5,
      bumpMap: bump,
      bumpScale: 0.012,
      roughness: 0.52,
    })
  );
  const cheeseBody = tr.mesh(makeWedgeGeo(0.58, 0.028), creamMat);
  cheeseBody.position.set(0.05, floorY + 0.145, 0.05);
  root.add(cheeseBody);

  // 3. Caramelized burnt Basque top & outer crust collar
  const basqueTex = tr.tex(createCulinarySurfaceTexture('basque-top', maxAniso));
  const burntTop = tr.mesh(
    makeWedgeGeo(0.06, 0.02),
    tr.mat(new THREE.MeshStandardMaterial({ map: basqueTex, roughness: 0.44 }))
  );
  burntTop.position.set(0.05, floorY + 0.72, 0.05);
  root.add(burntTop);

  // 4. Glossy Nilgiri wild blueberry compote glaze + dripping ribbons
  const compoteMat = tr.mat(
    new THREE.MeshPhysicalMaterial({
      color: 0x3b1338,
      roughness: 0.12,
      clearcoat: 0.96,
      clearcoatRoughness: 0.08,
    })
  );
  const glazePoolGeo = tr.geo(new THREE.SphereGeometry(0.42, 28, 18));
  glazePoolGeo.scale(1.35, 0.16, 0.95);
  const glazePool = tr.mesh(glazePoolGeo, compoteMat);
  glazePool.position.set(0.18, floorY + 0.81, 0.05);
  root.add(glazePool);

  // Compote drips cascading down wedge side
  const drip1 = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.12, floorY + 0.8, 0.25),
    new THREE.Vector3(0.14, floorY + 0.62, 0.31),
    new THREE.Vector3(0.15, floorY + 0.36, 0.32),
  ]);
  const drip2 = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.36, floorY + 0.79, -0.32),
    new THREE.Vector3(0.38, floorY + 0.54, -0.4),
  ]);
  root.add(tr.mesh(tr.geo(new THREE.TubeGeometry(drip1, 16, 0.042, 10, false)), compoteMat));
  root.add(tr.mesh(tr.geo(new THREE.TubeGeometry(drip2, 14, 0.036, 10, false)), compoteMat));

  // 5. Seven plump 3D wild blueberries with dusty bloom & crown dimple
  const berryMat = tr.mat(
    new THREE.MeshStandardMaterial({
      color: 0x262447,
      roughness: 0.36,
      metalness: 0.05,
    })
  );
  const berryCoords = [
    [0.02, floorY + 0.89, 0.04, 0.11],
    [0.22, floorY + 0.9, 0.14, 0.115],
    [0.24, floorY + 0.89, -0.09, 0.105],
    [0.42, floorY + 0.88, 0.02, 0.11],
    [-0.14, floorY + 0.87, -0.02, 0.095],
    [-0.42, floorY + 0.09, 0.64, 0.105],
    [-0.22, floorY + 0.09, 0.72, 0.095],
  ];
  berryCoords.forEach(([bx, by, bz, br]) => {
    const bGeo = tr.geo(new THREE.SphereGeometry(br, 20, 16));
    bGeo.scale(1.06, 0.88, 1.06);
    const b = tr.mesh(bGeo, berryMat);
    b.position.set(bx, by, bz);
    root.add(b);
  });

  // 6. Fresh garden mint sprig on crown
  const mintMat = tr.mat(new THREE.MeshStandardMaterial({ color: 0x3f7a38, roughness: 0.45, side: THREE.DoubleSide }));
  const leafGeo = createLeafGeometry(tr, 0.32, 0.15, 0.06);
  const leaf1 = tr.mesh(leafGeo, mintMat);
  leaf1.position.set(0.14, floorY + 0.93, 0.02);
  leaf1.rotation.set(0.18, 0.5, -0.15);
  root.add(leaf1);

  const leaf2 = tr.mesh(leafGeo, mintMat);
  leaf2.scale.setScalar(0.82);
  leaf2.position.set(0.14, floorY + 0.93, 0.02);
  leaf2.rotation.set(0.24, -1.3, 0.12);
  root.add(leaf2);

  // 7. Brushed brass pastry fork resting on plate
  addBrassSpoonOrFork(root, tr, 'fork', 0.55, floorY + 0.06, 0.82, -0.58);
}

/* ============================================================================
   3. WILD MUSHROOM & TRUFFLE TAGLIATELLE (truffle-pasta)
   ============================================================================ */
function buildTrufflePasta(root: THREE.Group, tr: ResourceTracker, maxAniso: number) {
  const floorY = addStonewareBowl(root, tr, maxAniso, 1.54, '#EAE0CF', '#5C4735');

  // Glossy Normandy cultured butter & white truffle emulsion pool
  const saucePool = tr.mesh(
    tr.geo(new THREE.CylinderGeometry(1.05, 0.92, 0.06, 48)),
    tr.mat(
      new THREE.MeshPhysicalMaterial({
        color: 0xd9b36c,
        roughness: 0.18,
        clearcoat: 0.85,
      })
    )
  );
  saucePool.position.y = floorY + 0.03;
  root.add(saucePool);

  // 18 flat golden hand-rolled egg tagliatelle ribbons coiled into a restaurant chef's nest
  const pastaMat = tr.mat(
    new THREE.MeshPhysicalMaterial({
      color: 0xedc46b,
      roughness: 0.32,
      clearcoat: 0.5,
      clearcoatRoughness: 0.22,
    })
  );
  const ribbonProfile = new THREE.Shape();
  ribbonProfile.moveTo(-0.055, -0.012);
  ribbonProfile.lineTo(0.055, -0.012);
  ribbonProfile.lineTo(0.055, 0.012);
  ribbonProfile.lineTo(-0.055, 0.012);
  ribbonProfile.closePath();

  for (let n = 0; n < 18; n++) {
    const phase = (n / 18) * Math.PI * 2;
    const pts: THREE.Vector3[] = [];
    const turns = 1.65;
    for (let s = 0; s <= 18; s++) {
      const t = s / 18;
      const angle = phase + t * Math.PI * 2 * turns;
      const rad = (0.86 - t * 0.56) * (0.88 + 0.14 * Math.sin(n * 1.9 + t * 5));
      const y =
        floorY +
        0.08 +
        Math.sin(t * Math.PI) * (0.28 + (n % 4) * 0.11) +
        t * 0.32 +
        Math.cos(angle * 2) * 0.035;
      pts.push(new THREE.Vector3(Math.cos(angle) * rad, y, Math.sin(angle) * rad));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const ribbonGeo = tr.geo(
      new THREE.ExtrudeGeometry(ribbonProfile, {
        steps: 34,
        bevelEnabled: false,
        extrudePath: curve,
      })
    );
    root.add(tr.mesh(ribbonGeo, pastaMat));
  }

  // 6 Seared roasted shiitake & chanterelle mushroom slices
  const mushroomCapMat = tr.mat(new THREE.MeshStandardMaterial({ color: 0x4e2e1a, roughness: 0.46 }));
  const mushroomInnerMat = tr.mat(new THREE.MeshStandardMaterial({ color: 0xd8c19e, roughness: 0.68 }));

  const mushShape = new THREE.Shape();
  mushShape.moveTo(-0.06, 0);
  mushShape.lineTo(-0.07, 0.14);
  mushShape.quadraticCurveTo(-0.24, 0.14, -0.22, 0.25);
  mushShape.quadraticCurveTo(0, 0.38, 0.22, 0.25);
  mushShape.quadraticCurveTo(0.24, 0.14, 0.07, 0.14);
  mushShape.lineTo(0.06, 0);
  mushShape.closePath();
  const mushGeo = tr.geo(
    new THREE.ExtrudeGeometry(mushShape, {
      depth: 0.045,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.012,
      bevelSegments: 2,
    })
  );

  const mushSpots = [
    [0.36, floorY + 0.42, 0.28, 0.4, 0.8],
    [-0.38, floorY + 0.44, 0.22, 1.8, 0.7],
    [0.08, floorY + 0.56, -0.28, -0.9, 0.9],
    [-0.24, floorY + 0.34, -0.44, 2.5, 0.6],
    [0.48, floorY + 0.28, -0.18, -0.2, 0.75],
    [-0.05, floorY + 0.62, 0.08, 0.9, 0.85],
  ];
  mushSpots.forEach(([mx, my, mz, ry, rx], idx) => {
    const m = tr.mesh(mushGeo, idx % 2 === 0 ? mushroomCapMat : mushroomInnerMat);
    m.position.set(mx, my, mz);
    m.rotation.set(rx, ry, 0.2);
    root.add(m);
  });

  // 4 Wavy white Alba truffle shavings crowning the pasta nest
  const truffleMat = tr.mat(
    new THREE.MeshStandardMaterial({
      color: 0xe6d6bc,
      roughness: 0.55,
      side: THREE.DoubleSide,
    })
  );
  for (let k = 0; k < 4; k++) {
    const disc = tr.geo(new THREE.CircleGeometry(0.2, 24));
    disc.rotateX(-Math.PI / 2);
    const p = disc.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const ang = Math.atan2(p.getZ(i), p.getX(i));
      const r = Math.hypot(p.getX(i), p.getZ(i));
      p.setY(i, Math.sin(ang * 5 + k) * (r * 0.18));
    }
    disc.computeVertexNormals();
    const shave = tr.mesh(disc, truffleMat);
    const a = (k / 4) * Math.PI * 2 + 0.3;
    shave.position.set(Math.cos(a) * 0.16, floorY + 0.66 + k * 0.025, Math.sin(a) * 0.16);
    shave.rotation.set(0.25 * Math.cos(k), a, 0.2 * Math.sin(k));
    root.add(shave);
  }

  // Charred country sourdough slice leaning on bowl rim + parsley flecks
  const breadTex = tr.tex(createCulinarySurfaceTexture('sourdough-crumb', maxAniso));
  const toastGeo = tr.geo(new THREE.BoxGeometry(0.68, 0.09, 0.42));
  const toast = tr.mesh(toastGeo, tr.mat(new THREE.MeshStandardMaterial({ map: breadTex, roughness: 0.78 })));
  toast.position.set(0.95, floorY + 0.36, 0.48);
  toast.rotation.set(0.32, -0.52, -0.44);
  root.add(toast);
}

/* ============================================================================
   4. 18H SINGLE-ORIGIN COLD BREW (cold-brew)
   ============================================================================ */
function buildColdBrew(
  root: THREE.Group,
  tr: ResourceTracker,
  maxAniso: number,
  actors: DishDynamicActors
) {
  // Walnut coaster
  const woodTex = tr.tex(createWoodGrainTexture('#4D3220', '#29170C', maxAniso));
  const coaster = tr.mesh(
    tr.geo(new THREE.CylinderGeometry(1.05, 1.08, 0.08, 48)),
    tr.mat(new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.65 }))
  );
  coaster.position.y = GROUND_Y + 0.04;
  root.add(coaster);

  const glassBaseY = GROUND_Y + 0.08;

  // Deep mahogany-garnet Ethiopian Yirgacheffe cold brew column inside glass
  const brewMat = tr.mat(
    new THREE.MeshPhysicalMaterial({
      color: 0x3b1507,
      roughness: 0.08,
      metalness: 0,
      transmission: isSoftwareGl ? 0 : 0.45,
      transparent: true,
      opacity: isSoftwareGl ? 0.92 : 0.96,
      ior: 1.35,
      attenuationColor: new THREE.Color(0xb84a14),
      attenuationDistance: 0.65,
      clearcoat: 0.9,
    })
  );
  const liquid = tr.mesh(tr.geo(new THREE.CylinderGeometry(0.74, 0.66, 1.48, 48)), brewMat, false, false);
  liquid.position.y = glassBaseY + 0.88;
  liquid.renderOrder = 2;
  root.add(liquid);

  // Hand-carved crystal ice sphere + secondary crystal cube (bobbing gently)
  const iceMat = tr.mat(
    new THREE.MeshPhysicalMaterial({
      color: 0xf4f9ff,
      roughness: 0.1,
      transmission: isSoftwareGl ? 0 : 0.88,
      transparent: true,
      opacity: isSoftwareGl ? 0.55 : 0.95,
      ior: 1.31,
      thickness: 0.8,
      clearcoat: 1,
    })
  );
  const iceSphere = tr.mesh(tr.geo(new THREE.IcosahedronGeometry(0.46, 2)), iceMat, false, false);
  iceSphere.position.set(0.03, glassBaseY + 1.38, 0.02);
  iceSphere.renderOrder = 3;
  root.add(iceSphere);

  const iceCube = tr.mesh(tr.geo(new THREE.DodecahedronGeometry(0.34, 1)), iceMat, false, false);
  iceCube.position.set(-0.08, glassBaseY + 0.66, -0.05);
  iceCube.renderOrder = 3;
  root.add(iceCube);
  actors.floatingIce = [iceSphere, iceCube];

  // Tall heavy-bottomed crystal rocks/highball glass (rendered cleanly around liquid)
  const glassPts = [
    new THREE.Vector2(0, glassBaseY),
    new THREE.Vector2(0.72, glassBaseY),
    new THREE.Vector2(0.84, glassBaseY + 1.82),
    new THREE.Vector2(0.8, glassBaseY + 1.84),
    new THREE.Vector2(0.69, glassBaseY + 0.14),
    new THREE.Vector2(0, glassBaseY + 0.14),
  ];
  const glass = tr.mesh(
    tr.geo(new THREE.LatheGeometry(glassPts, 48)),
    createOpticalGlassMat(tr, 0xffffff),
    false,
    false
  );
  glass.renderOrder = 6;
  root.add(glass);

  // Condensation droplets on exterior of cold glass (InstancedMesh)
  const dropGeo = tr.geo(new THREE.SphereGeometry(0.018, 8, 8));
  const dropMat = tr.mat(new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, clearcoat: 1 }));
  const drops = new THREE.InstancedMesh(dropGeo, dropMat, 42);
  for (let i = 0; i < 42; i++) {
    const a = i * 2.39996;
    const h = 0.25 + ((i * 37) % 140) / 100;
    const r = 0.72 + (h / 1.82) * 0.12;
    _dummy.position.set(Math.cos(a) * r, glassBaseY + h, Math.sin(a) * r);
    _dummy.scale.set(1, 1.3, 1);
    _dummy.rotation.set(0, 0, 0);
    _dummy.updateMatrix();
    drops.setMatrixAt(i, _dummy.matrix);
  }
  drops.instanceMatrix.needsUpdate = true;
  drops.computeBoundingSphere();
  root.add(drops);

  // Sculpted Valencia orange peel spiral twist perched on crystal rim
  const peelCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.66, glassBaseY + 1.56, 0.18),
    new THREE.Vector3(0.82, glassBaseY + 1.88, 0.12),
    new THREE.Vector3(0.94, glassBaseY + 1.74, -0.08),
    new THREE.Vector3(0.82, glassBaseY + 1.48, -0.22),
    new THREE.Vector3(0.95, glassBaseY + 1.26, -0.1),
  ]);
  const peel = tr.mesh(
    tr.geo(new THREE.TubeGeometry(peelCurve, 36, 0.055, 10, false)),
    tr.mat(new THREE.MeshStandardMaterial({ color: 0xe66a15, roughness: 0.35 }))
  );
  peel.scale.set(1, 1, 0.55);
  root.add(peel);
}

/* ============================================================================
   5. AVOCADO & POACHED EGG TARTINE (avocado-toast)
      Sculpted 1:1 from Quad-View (Top / Front / Side / 3-4) & Rustic Hero Photo:
      - Speckled oatmeal ceramic coupe plate with kiln-toasted rust-brown rim
      - Thick rustic country sourdough slice (flour-dusted blistered crust + scoring cracks)
      - Chunky fork-smashed & diced Hass avocado mound edge-to-edge
      - Split pasture-raised poached egg with cascading runny golden yolk waterfall & plate puddle
      - Crumbled white sheep's-milk feta clusters + fallen plate crumbs
      - Arching magenta-purple microgreen stems with green sorrel & burgundy micro-leaves
      - Coarse cracked black pepper, red Aleppo chili flakes & whole toasted coriander seeds
   ============================================================================ */
function buildAvocadoToast(root: THREE.Group, tr: ResourceTracker, maxAniso: number) {
  const bump = tr.tex(createOrganicBumpTexture(31, 0.95));

  // 1. Handmade Speckled Oatmeal Ceramic Coupe Plate (radius 1.74, planar top UVs for toasted rim)
  const plateR = 1.74;
  const coupePts = [
    new THREE.Vector2(0, GROUND_Y),
    new THREE.Vector2(1.06, GROUND_Y),
    new THREE.Vector2(1.22, GROUND_Y + 0.035),
    new THREE.Vector2(1.62, GROUND_Y + 0.165),
    new THREE.Vector2(plateR, GROUND_Y + 0.255),
    new THREE.Vector2(plateR - 0.035, GROUND_Y + 0.275),
    new THREE.Vector2(plateR - 0.085, GROUND_Y + 0.25),
    new THREE.Vector2(1.38, GROUND_Y + 0.125),
    new THREE.Vector2(0.88, GROUND_Y + 0.082),
    new THREE.Vector2(0, GROUND_Y + 0.076),
  ];
  const plateGeo = tr.geo(new THREE.LatheGeometry(coupePts, 72));
  const pPos = plateGeo.attributes.position;
  const pUv = plateGeo.attributes.uv;
  for (let i = 0; i < pPos.count; i++) {
    const px = pPos.getX(i);
    const pz = pPos.getZ(i);
    pUv.setXY(i, px / (plateR * 2) + 0.5, 1 - (pz / (plateR * 2) + 0.5));
  }
  pUv.needsUpdate = true;

  const coupeTex = tr.tex(createArtisanCoupePlateTexture(maxAniso));
  const plateMat = tr.mat(
    new THREE.MeshPhysicalMaterial({
      map: coupeTex,
      bumpMap: bump,
      bumpScale: 0.006,
      roughness: 0.26,
      metalness: 0.02,
      clearcoat: 0.56,
      clearcoatRoughness: 0.16,
    })
  );
  root.add(tr.mesh(plateGeo, plateMat));

  const plateFloorY = GROUND_Y + 0.082;

  // Tartine assembly angled diagonally on the coupe plate just like TOP VIEW & 3/4 VIEW
  const tartineGroup = new THREE.Group();
  tartineGroup.rotation.y = 0.36;
  root.add(tartineGroup);

  // 2. Thick Rustic Country Sourdough Slice (boule center-cut silhouette)
  // Note: after rotateX(-PI/2), shape +Y maps to -Z (back) and shape -Y maps to +Z (front yolk cascade side)
  const breadShape = new THREE.Shape();
  breadShape.moveTo(-0.86, -0.52);
  breadShape.quadraticCurveTo(-0.32, -0.57, 0.18, -0.54);
  breadShape.quadraticCurveTo(0.68, -0.53, 0.94, -0.42);
  breadShape.quadraticCurveTo(1.14, -0.18, 1.07, 0.14);
  breadShape.quadraticCurveTo(0.98, 0.45, 0.62, 0.52);
  breadShape.quadraticCurveTo(0.05, 0.57, -0.58, 0.52);
  breadShape.quadraticCurveTo(-1.02, 0.46, -1.09, 0.12);
  breadShape.quadraticCurveTo(-1.12, -0.28, -0.86, -0.52);

  const sliceGeo = tr.geo(
    new THREE.ExtrudeGeometry(breadShape, {
      depth: 0.25,
      bevelEnabled: true,
      bevelThickness: 0.024,
      bevelSize: 0.024,
      bevelSegments: 3,
      curveSegments: 32,
    })
  );
  sliceGeo.rotateX(-Math.PI / 2);

  // Normalize UVs cleanly for top crumb face vs vertical crust wall
  const sPos = sliceGeo.attributes.position;
  const sNorm = sliceGeo.attributes.normal;
  const sUv = sliceGeo.attributes.uv;
  for (let i = 0; i < sPos.count; i++) {
    const x = sPos.getX(i);
    const y = sPos.getY(i);
    const z = sPos.getZ(i);
    // Subtle handmade boule crust undulation
    const organicWave = Math.sin(x * 4.2 + z * 3.1) * 0.012;
    sPos.setY(i, y + (y > 0.12 ? organicWave : 0));

    if (Math.abs(sNorm.getY(i)) > 0.65) {
      sUv.setXY(i, x * 0.45 + 0.5, z * 0.45 + 0.5);
    } else {
      const perim = Math.atan2(z, x) / (Math.PI * 2) + 0.5;
      sUv.setXY(i, perim * 2.2, Math.min(1, Math.max(0, (y + 0.03) / 0.3)));
    }
  }
  sliceGeo.computeVertexNormals();

  const crumbTex = tr.tex(createCulinarySurfaceTexture('sourdough-crumb', maxAniso));
  const crustTex = tr.tex(createRusticSourdoughCrustTexture(maxAniso));
  const crumbMat = tr.mat(
    new THREE.MeshStandardMaterial({
      map: crumbTex,
      bumpMap: bump,
      bumpScale: 0.028,
      roughness: 0.82,
    })
  );
  const crustMat = tr.mat(
    new THREE.MeshStandardMaterial({
      map: crustTex,
      bumpMap: bump,
      bumpScale: 0.036,
      roughness: 0.78,
    })
  );

  // ExtrudeGeometry uses group 0 for top/bottom caps and group 1 for side/bevel walls
  const sourdoughSlice = new THREE.Mesh(sliceGeo, [crumbMat, crustMat]);
  sourdoughSlice.castShadow = !isSoftwareGl;
  sourdoughSlice.receiveShadow = !isSoftwareGl;
  sourdoughSlice.position.set(0, plateFloorY + 0.024, 0);
  tartineGroup.add(sourdoughSlice);

  const toastTopY = plateFloorY + 0.295;

  // 3. Sculpted Fork-Smashed Hass Avocado Mound + 48 Chunky Beveled Avocado Cubes
  const avoTex = tr.tex(createSmashedAvocadoTexture(maxAniso));
  const avoBaseMat = tr.mat(
    new THREE.MeshPhysicalMaterial({
      map: avoTex,
      bumpMap: bump,
      bumpScale: 0.032,
      roughness: 0.46,
      clearcoat: 0.18,
      clearcoatRoughness: 0.35,
    })
  );

  const avoMoundGeo = tr.geo(new THREE.PlaneGeometry(1.98, 0.96, 36, 22));
  avoMoundGeo.rotateX(-Math.PI / 2);
  const mPos = avoMoundGeo.attributes.position;
  for (let i = 0; i < mPos.count; i++) {
    const mx = mPos.getX(i);
    const mz = mPos.getZ(i);
    // Elliptical rounded-loaf mask so mash tapers cleanly inside crust edge
    const nx = mx / 0.99;
    const nz = mz / 0.48;
    const edgeDist = Math.hypot(nx * 0.92, nz);
    const mask = Math.max(0, 1 - Math.pow(Math.min(1.08, edgeDist), 2.6));
    // Slight nest depression around poached egg center (0.14, 0.02)
    const eggDist = Math.hypot((mx - 0.14) / 0.46, (mz - 0.02) / 0.4);
    const nestDip = eggDist < 1 ? (1 - eggDist * eggDist) * 0.055 : 0;
    const mashRidges =
      (Math.sin(mx * 9.5 + mz * 6.2) * 0.024 + Math.cos(mx * 14.0 - mz * 11.0) * 0.016) * mask;
    mPos.setXYZ(i, mx * (0.94 + 0.06 * mask), mask * 0.175 - nestDip + mashRidges, mz * (0.94 + 0.06 * mask));
  }
  avoMoundGeo.computeVertexNormals();
  const avoMound = tr.mesh(avoMoundGeo, avoBaseMat);
  avoMound.position.set(0, toastTopY - 0.01, 0);
  tartineGroup.add(avoMound);

  // 48 Chunky diced & fork-crushed Hass avocado pieces (giving realistic chunky FRONT & SIDE silhouettes)
  const chunkGeo = tr.geo(new THREE.DodecahedronGeometry(0.105, 0));
  const chunkMat = tr.mat(
    new THREE.MeshPhysicalMaterial({
      map: avoTex,
      bumpMap: bump,
      bumpScale: 0.018,
      roughness: 0.42,
      clearcoat: 0.22,
    })
  );
  const avoChunks = new THREE.InstancedMesh(chunkGeo, chunkMat, 48);
  avoChunks.castShadow = !isSoftwareGl;
  avoChunks.receiveShadow = !isSoftwareGl;
  const avoPalette = [0x8eb042, 0xa8c254, 0x739631, 0x5d8024, 0xbcd068];

  for (let i = 0; i < 48; i++) {
    const col = i % 12;
    const row = Math.floor(i / 12); // 0..3
    const jitterX = Math.sin(i * 7.3) * 0.055;
    const jitterZ = Math.cos(i * 5.9) * 0.045;
    const cx = -0.86 + (col / 11) * 1.72 + jitterX;
    const cz = -0.37 + (row / 3) * 0.74 + jitterZ;

    // Taper corners to stay within boule slice outline
    const cornerR = Math.hypot(cx / 1.0, cz / 0.5);
    const inBounds = cornerR < 1.02;
    const distEgg = Math.hypot(cx - 0.15, cz - 0.02);
    const underEggCenter = distEgg < 0.34;

    const cy = toastTopY + (underEggCenter ? 0.07 : 0.115 + (1 - Math.min(1, cornerR)) * 0.055 + (i % 3) * 0.015);
    _dummy.position.set(cx, cy, cz);
    _dummy.rotation.set(i * 0.7, i * 1.15, i * 0.45);
    if (!inBounds) {
      _dummy.scale.setScalar(0.001);
    } else {
      _dummy.scale.set(1.22 + (i % 3) * 0.18, 0.68 + (i % 2) * 0.18, 1.05 + ((i * 2) % 3) * 0.15);
    }
    _dummy.updateMatrix();
    avoChunks.setMatrixAt(i, _dummy.matrix);
    _color.setHex(avoPalette[i % avoPalette.length]);
    avoChunks.setColorAt(i, _color);
  }
  avoChunks.instanceMatrix.needsUpdate = true;
  if (avoChunks.instanceColor) avoChunks.instanceColor.needsUpdate = true;
  avoChunks.computeBoundingSphere();
  tartineGroup.add(avoChunks);

  // 4. Split Pasture-Raised Poached Egg with Vertex-Sculpted Front V-Cleft
  const eggX = 0.15;
  const eggZ = 0.02;
  const eggBaseY = toastTopY + 0.16;

  const eggGeo = tr.geo(new THREE.SphereGeometry(0.5, 56, 40));
  const ePos = eggGeo.attributes.position;
  const eUv = eggGeo.attributes.uv;
  for (let i = 0; i < ePos.count; i++) {
    let vx = ePos.getX(i) * 1.06;
    let vy = ePos.getY(i) * 0.48;
    let vz = ePos.getZ(i) * 0.92;

    const ang = Math.atan2(vz, vx);
    // Soft organic poached albumen skirt ripples
    const skirtWave = 1 + Math.sin(ang * 5 + 0.6) * 0.045 + Math.cos(ang * 9) * 0.02;
    vx *= skirtWave;
    vz *= skirtWave;

    // Flatten lower pillow gently onto avocado bed
    if (vy < 0) {
      vy *= 0.48;
    }

    // Carve natural front V-cleft split (+Z side slightly right of center) where golden yolk spills out
    if (vz > -0.02 && vy > -0.08) {
      const cleftCenter = 0.03;
      const dx = Math.abs(vx - cleftCenter);
      const cleftHalfWidth = 0.07 + Math.max(0, vz) * 0.28;
      if (dx < cleftHalfWidth) {
        const cleftDepth = (1 - dx / cleftHalfWidth) * Math.min(1, (vz + 0.02) / 0.34);
        vy -= cleftDepth * 0.145;
      }
    }

    ePos.setXYZ(i, vx, vy, vz);
    eUv.setXY(i, vx / 1.15 + 0.5, vz / 1.02 + 0.5);
  }
  eggGeo.computeVertexNormals();

  const eggTex = tr.tex(createSeasonedPoachedEggTexture(maxAniso));
  const eggMat = tr.mat(
    new THREE.MeshPhysicalMaterial({
      map: eggTex,
      roughness: 0.18,
      metalness: 0,
      clearcoat: 0.78,
      clearcoatRoughness: 0.12,
    })
  );
  const poachedEgg = tr.mesh(eggGeo, eggMat);
  poachedEgg.position.set(eggX, eggBaseY + 0.11, eggZ);
  tartineGroup.add(poachedEgg);

  // 5. Cascading Glossy Runny Golden Egg Yolk Waterfall & Plate Puddle
  const yolkMat = tr.mat(
    new THREE.MeshPhysicalMaterial({
      color: 0xf48c06,
      emissive: new THREE.Color(0x3b1600),
      emissiveIntensity: 0.16,
      roughness: 0.045,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.025,
    })
  );

  // 5a. Glowing liquid yolk reservoir inside the split poached egg cleft
  const innerYolkGeo = tr.geo(new THREE.SphereGeometry(0.16, 28, 20));
  innerYolkGeo.scale(0.82, 0.62, 1.35);
  const innerYolk = tr.mesh(innerYolkGeo, yolkMat);
  innerYolk.position.set(eggX + 0.03, eggBaseY + 0.165, eggZ + 0.21);
  innerYolk.rotation.x = 0.28;
  tartineGroup.add(innerYolk);

  // 5b. Primary cascading runny yolk stream flowing over avocado & down vertical sourdough crust
  const cascadeCurveMain = new THREE.CatmullRomCurve3([
    new THREE.Vector3(eggX + 0.03, eggBaseY + 0.175, eggZ + 0.22),
    new THREE.Vector3(eggX + 0.04, eggBaseY + 0.11, eggZ + 0.39),
    new THREE.Vector3(eggX + 0.045, toastTopY + 0.11, 0.52),
    new THREE.Vector3(eggX + 0.05, toastTopY - 0.03, 0.565),
    new THREE.Vector3(eggX + 0.055, plateFloorY + 0.14, 0.575),
    new THREE.Vector3(eggX + 0.06, plateFloorY + 0.022, 0.61),
  ]);
  const mainYolkStream = tr.mesh(
    tr.geo(new THREE.TubeGeometry(cascadeCurveMain, 44, 0.062, 16, false)),
    yolkMat
  );
  mainYolkStream.scale.set(1.18, 1, 0.72);
  tartineGroup.add(mainYolkStream);

  // Secondary organic yolk lobe widening the cascade at the avocado lip
  const cascadeCurveSide = new THREE.CatmullRomCurve3([
    new THREE.Vector3(eggX - 0.015, eggBaseY + 0.15, eggZ + 0.26),
    new THREE.Vector3(eggX + 0.0, toastTopY + 0.12, 0.49),
    new THREE.Vector3(eggX + 0.02, plateFloorY + 0.19, 0.565),
    new THREE.Vector3(eggX + 0.035, plateFloorY + 0.025, 0.6),
  ]);
  const sideYolkStream = tr.mesh(
    tr.geo(new THREE.TubeGeometry(cascadeCurveSide, 32, 0.044, 14, false)),
    yolkMat
  );
  tartineGroup.add(sideYolkStream);

  // 5c. Glossy golden yolk puddle pooling on the speckled coupe plate + secondary drop (matching TOP & 3/4 VIEWS)
  const puddleGeo = tr.geo(new THREE.SphereGeometry(0.19, 28, 18));
  puddleGeo.scale(1.12, 0.13, 0.88);
  const yolkPuddle = tr.mesh(puddleGeo, yolkMat);
  yolkPuddle.position.set(eggX + 0.055, plateFloorY + 0.014, 0.65);
  tartineGroup.add(yolkPuddle);

  const dropGeo = tr.geo(new THREE.SphereGeometry(0.075, 20, 14));
  dropGeo.scale(1.1, 0.18, 0.92);
  const yolkDrop = tr.mesh(dropGeo, yolkMat);
  yolkDrop.position.set(eggX + 0.34, plateFloorY + 0.011, 0.59);
  tartineGroup.add(yolkDrop);

  // 6. Crumbled White Sheep's-Milk Feta Clusters & Scattered Plate Crumbs
  const fetaMat = tr.mat(
    new THREE.MeshStandardMaterial({
      color: 0xfcfbf7,
      bumpMap: bump,
      bumpScale: 0.025,
      roughness: 0.84,
    })
  );
  const fetaClusterCoords: [number, number, number, number][] = [
    [-0.44, toastTopY + 0.22, 0.24, 0.088],
    [-0.64, toastTopY + 0.2, 0.06, 0.075],
    [-0.52, toastTopY + 0.23, -0.22, 0.082],
    [-0.24, toastTopY + 0.24, -0.26, 0.072],
    [0.78, toastTopY + 0.2, 0.12, 0.092],
    [0.68, toastTopY + 0.21, -0.24, 0.078],
    [0.54, toastTopY + 0.22, -0.32, 0.068],
    [-0.78, toastTopY + 0.18, 0.28, 0.064],
  ];
  const curdSubGeo = tr.geo(new THREE.DodecahedronGeometry(1, 0));
  fetaClusterCoords.forEach(([fx, fy, fz, fSize], idx) => {
    for (let c = 0; c < 3; c++) {
      const curd = tr.mesh(curdSubGeo, fetaMat);
      const ang = idx * 1.7 + c * 2.1;
      curd.scale.set(fSize * 1.1, fSize * 0.78, fSize * 0.95);
      curd.position.set(fx + Math.cos(ang) * fSize * 0.45, fy + (c % 2) * 0.018, fz + Math.sin(ang) * fSize * 0.45);
      curd.rotation.set(c, idx, c * 0.6);
      tartineGroup.add(curd);
    }
  });

  // 7. Delicate Arching Purple-Stemmed Microgreens (Red-Veined Sorrel & Micro-Amaranth)
  const purpleStemMat = tr.mat(
    new THREE.MeshStandardMaterial({ color: 0x731b46, roughness: 0.48 })
  );
  const sorrelLeafMat = tr.mat(
    new THREE.MeshStandardMaterial({ color: 0x4b7f24, roughness: 0.42, side: THREE.DoubleSide })
  );
  const amaranthLeafMat = tr.mat(
    new THREE.MeshStandardMaterial({ color: 0x5c193b, roughness: 0.46, side: THREE.DoubleSide })
  );
  const microLeafGeo = createLeafGeometry(tr, 0.165, 0.088, 0.032);

  const microShoots: { pts: [number, number, number][]; burgundyTip?: boolean }[] = [
    // Tall signature stem arching up from left avocado over top-left crown of poached egg (FRONT & HERO VIEWS)
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

  microShoots.forEach((shoot, sIdx) => {
    const curve = new THREE.CatmullRomCurve3(shoot.pts.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
    const stem = tr.mesh(tr.geo(new THREE.TubeGeometry(curve, 20, 0.0085, 7, false)), purpleStemMat);
    tartineGroup.add(stem);

    // Pair of micro-cotyledon leaves at tip + mid-stem leaf
    const tip = curve.getPointAt(1);
    const mid = curve.getPointAt(0.62);
    const leafMat = shoot.burgundyTip ? amaranthLeafMat : sorrelLeafMat;

    const tipL1 = tr.mesh(microLeafGeo, leafMat);
    tipL1.position.copy(tip);
    tipL1.rotation.set(0.22, sIdx * 1.1, -0.18);
    tipL1.scale.setScalar(0.95);
    tartineGroup.add(tipL1);

    const tipL2 = tr.mesh(microLeafGeo, leafMat);
    tipL2.position.copy(tip);
    tipL2.rotation.set(0.28, sIdx * 1.1 + 2.4, 0.16);
    tipL2.scale.setScalar(0.8);
    tartineGroup.add(tipL2);

    const midLeaf = tr.mesh(microLeafGeo, sIdx % 2 === 0 ? amaranthLeafMat : sorrelLeafMat);
    midLeaf.position.copy(mid);
    midLeaf.rotation.set(0.18, sIdx * 1.7 - 1.1, 0.12);
    midLeaf.scale.setScalar(0.76);
    tartineGroup.add(midLeaf);
  });

  // 8. Physical 3D Seasoning Grains: Coarse Black Pepper, Red Chili Flakes, Toasted Coriander Seeds & Plate Feta Crumbs
  const spiceGeo = tr.geo(new THREE.DodecahedronGeometry(0.018, 0));
  const spiceMat = tr.mat(new THREE.MeshStandardMaterial({ roughness: 0.65 }));
  const totalGrains = 92;
  const grains = new THREE.InstancedMesh(spiceGeo, spiceMat, totalGrains);

  for (let i = 0; i < totalGrains; i++) {
    if (i < 34) {
      // Zone A: Seasoning across white poached egg dome
      const a = i * 2.39996;
      const r = Math.sqrt((i + 0.5) / 34) * 0.42;
      const gx = eggX + Math.cos(a) * r;
      const gz = eggZ + Math.sin(a) * r * 0.86;
      const domeH = Math.sqrt(Math.max(0, 1 - (r / 0.48) ** 2)) * 0.235;
      _dummy.position.set(gx, eggBaseY + 0.115 + domeH, gz);
      _dummy.scale.set(i % 3 === 0 ? 1.35 : 0.75, 0.42, 0.9);
      _color.setHex(i % 3 === 0 ? 0xa82212 : i % 2 === 0 ? 0x1b1613 : 0xc4731b);
    } else if (i < 62) {
      // Zone B: Seasoning across chunky smashed avocado
      const k = i - 34;
      const gx = -0.84 + ((k * 47) % 168) / 100;
      const gz = -0.38 + ((k * 73) % 76) / 100;
      _dummy.position.set(gx, toastTopY + 0.21, gz);
      _dummy.scale.set(1.1, 0.55, 0.95);
      _color.setHex(k % 3 === 0 ? 0xa82212 : k % 2 === 0 ? 0x1d1714 : 0x9e7138);
    } else {
      // Zone C: Scattered whole toasted coriander seeds, peppercorns, chili & tiny feta crumbs on the speckled plate!
      const p = i - 62;
      const sideSign = p % 4 === 0 ? -1 : 1; // Mostly foreground (+Z) like HERO & 3/4 VIEWS, some behind (-Z) like TOP VIEW
      const px = -0.85 + ((p * 61) % 175) / 100;
      const pz = sideSign * (0.64 + ((p * 37) % 62) / 100);
      const pr = Math.hypot(px, pz);
      const lift = pr > 0.9 ? (pr - 0.9) * 0.09 : 0;
      _dummy.position.set(px, plateFloorY + 0.012 + lift, pz);
      if (p % 4 === 0) {
        // Tiny white fallen feta crumb
        _dummy.scale.set(1.6, 1.1, 1.4);
        _color.setHex(0xfbf9f2);
      } else if (p % 3 === 0) {
        // Round golden-brown toasted coriander seed
        _dummy.scale.set(1.45, 1.35, 1.45);
        _color.setHex(0xa6793e);
      } else if (p % 2 === 0) {
        // Cracked black peppercorn
        _dummy.scale.set(1.05, 0.9, 1.05);
        _color.setHex(0x1c1714);
      } else {
        // Crimson chili flake
        _dummy.scale.set(1.35, 0.35, 1.0);
        _color.setHex(0xa62314);
      }
    }
    _dummy.rotation.set(i * 0.5, i * 1.3, i * 0.8);
    _dummy.updateMatrix();
    grains.setMatrixAt(i, _dummy.matrix);
    grains.setColorAt(i, _color);
  }
  grains.instanceMatrix.needsUpdate = true;
  if (grains.instanceColor) grains.instanceColor.needsUpdate = true;
  grains.computeBoundingSphere();
  tartineGroup.add(grains);
}

/* ============================================================================
   6. WILLOW SIGNATURE HONEY CORTADO (willow-cortado)
   ============================================================================ */
function buildWillowCortado(root: THREE.Group, tr: ResourceTracker, maxAniso: number) {
  // Small salvaged walnut serving tray
  const woodTex = tr.tex(createWoodGrainTexture('#523522', '#2B190E', maxAniso));
  const woodMat = tr.mat(new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.62 }));
  const tray = tr.mesh(tr.geo(new THREE.CylinderGeometry(1.52, 1.44, 0.1, 56)), woodMat);
  tray.position.y = GROUND_Y + 0.05;
  root.add(tray);

  const baseY = GROUND_Y + 0.1;

  // Warm layered double-ristretto + Coorg honey milk body inside Gibraltar glass
  const cortadoBody = tr.mesh(
    tr.geo(new THREE.CylinderGeometry(0.66, 0.5, 1.04, 8)),
    tr.mat(new THREE.MeshStandardMaterial({ color: 0x8d5227, roughness: 0.28 })),
    false,
    false
  );
  cortadoBody.position.set(-0.22, baseY + 0.66, 0);
  cortadoBody.renderOrder = 2;
  root.add(cortadoBody);

  // Golden honey layer at bottom of Gibraltar glass
  const honeyBase = tr.mesh(
    tr.geo(new THREE.CylinderGeometry(0.51, 0.47, 0.16, 8)),
    tr.mat(new THREE.MeshPhysicalMaterial({ color: 0xd98719, roughness: 0.12, clearcoat: 0.9 })),
    false,
    false
  );
  honeyBase.position.set(-0.22, baseY + 0.22, 0);
  honeyBase.renderOrder = 2;
  root.add(honeyBase);

  // Domed honey-cortado Rosetta latte art top
  const artTex = tr.tex(createLatteArtTexture('cortado', maxAniso));
  const foamTop = tr.mesh(
    tr.geo(new THREE.CircleGeometry(0.66, 40)),
    tr.mat(new THREE.MeshStandardMaterial({ map: artTex, roughness: 0.34 }))
  );
  foamTop.rotation.x = -Math.PI / 2;
  foamTop.position.set(-0.22, baseY + 1.185, 0);
  foamTop.renderOrder = 3;
  root.add(foamTop);

  // Iconic octagonal faceted Gibraltar cortado glass
  const gibraltarPts = [
    new THREE.Vector2(0, baseY),
    new THREE.Vector2(0.54, baseY),
    new THREE.Vector2(0.74, baseY + 1.32),
    new THREE.Vector2(0.7, baseY + 1.34),
    new THREE.Vector2(0.5, baseY + 0.14),
    new THREE.Vector2(0, baseY + 0.14),
  ];
  const glass = tr.mesh(
    tr.geo(new THREE.LatheGeometry(gibraltarPts, 8)),
    createOpticalGlassMat(tr, 0xffffff),
    false,
    false
  );
  glass.position.x = -0.22;
  glass.renderOrder = 6;
  root.add(glass);

  // Petite brass demitasse spoon + toasted almond cantucci biscotti on walnut tray
  addBrassSpoonOrFork(root, tr, 'spoon', 0.72, baseY + 0.03, 0.22, 0.28);

  const biscottiGeo = tr.geo(new THREE.CapsuleGeometry(0.14, 0.65, 8, 16));
  biscottiGeo.rotateZ(Math.PI / 2);
  biscottiGeo.scale(1, 0.52, 0.85);
  const biscotti = tr.mesh(
    biscottiGeo,
    tr.mat(new THREE.MeshStandardMaterial({ color: 0xc28546, roughness: 0.78 }))
  );
  biscotti.position.set(0.54, baseY + 0.08, -0.45);
  biscotti.rotation.y = -0.5;
  root.add(biscotti);
}

/* ============================================================================
   7. V60 HAND-POURED HUILA RESERVE (pourover-geisha)
   ============================================================================ */
function buildPouroverGeisha(
  root: THREE.Group,
  tr: ResourceTracker,
  maxAniso: number,
  actors: DishDynamicActors
) {
  const woodTex = tr.tex(createWoodGrainTexture('#4E3320', '#26150A', maxAniso));
  const woodMat = tr.mat(new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.62 }));

  // Wooden pour-over tray base
  const base = tr.mesh(tr.geo(new THREE.BoxGeometry(2.65, 0.1, 1.65)), woodMat);
  base.position.y = GROUND_Y + 0.05;
  root.add(base);
  const topY = GROUND_Y + 0.1;

  // Ruby-amber Colombian Huila filter coffee inside carafe
  const filterCoffeeMat = tr.mat(
    new THREE.MeshPhysicalMaterial({
      color: 0x5c1f09,
      roughness: 0.08,
      transmission: isSoftwareGl ? 0 : 0.52,
      transparent: true,
      opacity: 0.94,
      ior: 1.34,
      attenuationColor: new THREE.Color(0xc8541b),
      attenuationDistance: 0.7,
    })
  );
  const carafeLiquidPts = [
    new THREE.Vector2(0, topY + 0.06),
    new THREE.Vector2(0.68, topY + 0.06),
    new THREE.Vector2(0.76, topY + 0.34),
    new THREE.Vector2(0.56, topY + 0.68),
    new THREE.Vector2(0, topY + 0.68),
  ];
  const carafeLiquid = tr.mesh(tr.geo(new THREE.LatheGeometry(carafeLiquidPts, 48)), filterCoffeeMat, false, false);
  carafeLiquid.position.x = -0.36;
  carafeLiquid.renderOrder = 2;
  root.add(carafeLiquid);

  // Hourglass glass Hario range server carafe
  const serverPts = [
    new THREE.Vector2(0, topY + 0.01),
    new THREE.Vector2(0.72, topY + 0.01),
    new THREE.Vector2(0.84, topY + 0.36),
    new THREE.Vector2(0.52, topY + 0.92),
    new THREE.Vector2(0.58, topY + 1.16),
    new THREE.Vector2(0.54, topY + 1.17),
    new THREE.Vector2(0.48, topY + 0.92),
    new THREE.Vector2(0.79, topY + 0.36),
    new THREE.Vector2(0.68, topY + 0.05),
    new THREE.Vector2(0, topY + 0.05),
  ];
  const serverGlass = tr.mesh(
    tr.geo(new THREE.LatheGeometry(serverPts, 48)),
    createOpticalGlassMat(tr, 0xffffff),
    false,
    false
  );
  serverGlass.position.x = -0.36;
  serverGlass.renderOrder = 6;
  root.add(serverGlass);

  // Heatproof walnut collar around carafe neck
  const collar = tr.mesh(tr.geo(new THREE.CylinderGeometry(0.56, 0.58, 0.22, 40, 1, true)), woodMat);
  collar.position.set(-0.36, topY + 0.94, 0);
  root.add(collar);

  // Ribbed white ceramic V60 60-degree cone dripper perched atop server
  const v60Tex = tr.tex(createStonewareTexture('#F7F3EA', '#8C7A68', maxAniso));
  const v60Mat = tr.mat(
    new THREE.MeshPhysicalMaterial({ map: v60Tex, roughness: 0.25, clearcoat: 0.6, side: THREE.DoubleSide })
  );
  const v60Pts = [
    new THREE.Vector2(0.58, topY + 1.15),
    new THREE.Vector2(0.22, topY + 1.15),
    new THREE.Vector2(0.82, topY + 1.98),
    new THREE.Vector2(0.76, topY + 2.0),
    new THREE.Vector2(0.18, topY + 1.18),
  ];
  const v60Cone = tr.mesh(tr.geo(new THREE.LatheGeometry(v60Pts, 48)), v60Mat);
  v60Cone.position.x = -0.36;
  root.add(v60Cone);

  // V60 ring handle
  const v60Handle = tr.mesh(tr.geo(new THREE.TorusGeometry(0.18, 0.035, 12, 28, Math.PI * 1.3)), v60Mat);
  v60Handle.position.set(-1.04, topY + 1.62, 0);
  v60Handle.rotation.z = 0.65;
  root.add(v60Handle);

  // Unbleached paper cone + freshly bloomed dark Huila coffee bed
  const paperCone = tr.mesh(
    tr.geo(new THREE.ConeGeometry(0.75, 0.82, 40, 1, true)),
    tr.mat(new THREE.MeshStandardMaterial({ color: 0xe6d4b3, roughness: 0.88, side: THREE.DoubleSide }))
  );
  paperCone.rotation.x = Math.PI;
  paperCone.position.set(-0.36, topY + 1.64, 0);
  root.add(paperCone);

  const groundsTex = tr.tex(createCulinarySurfaceTexture('coffee-grounds', maxAniso));
  const grounds = tr.mesh(
    tr.geo(new THREE.CircleGeometry(0.54, 36)),
    tr.mat(new THREE.MeshStandardMaterial({ map: groundsTex, roughness: 0.72 }))
  );
  grounds.rotation.x = -Math.PI / 2;
  grounds.position.set(-0.36, topY + 1.68, 0);
  root.add(grounds);

  // Live golden coffee droplet falling into carafe
  const drop = tr.mesh(
    tr.geo(new THREE.SphereGeometry(0.036, 12, 12)),
    filterCoffeeMat,
    false,
    false
  );
  drop.scale.set(0.85, 1.4, 0.85);
  drop.position.set(-0.36, topY + 1.05, 0);
  drop.renderOrder = 4;
  root.add(drop);
  actors.coffeeDrip = { drop, topY: topY + 1.12, bottomY: topY + 0.68 };

  // Companion handleless ceramic tasting cup filled with Huila pour-over
  const cupPts = [
    new THREE.Vector2(0, topY),
    new THREE.Vector2(0.34, topY),
    new THREE.Vector2(0.44, topY + 0.56),
    new THREE.Vector2(0.39, topY + 0.57),
    new THREE.Vector2(0.3, topY + 0.08),
    new THREE.Vector2(0, topY + 0.08),
  ];
  const cup = tr.mesh(tr.geo(new THREE.LatheGeometry(cupPts, 40)), v60Mat);
  cup.position.set(0.82, 0, 0.16);
  root.add(cup);

  const cupCoffee = tr.mesh(tr.geo(new THREE.CircleGeometry(0.38, 32)), filterCoffeeMat);
  cupCoffee.rotation.x = -Math.PI / 2;
  cupCoffee.position.set(0.82, topY + 0.46, 0.16);
  root.add(cupCoffee);
}

/* ============================================================================
   8. POMEGRANATE, HIBISCUS & MINT SPRITZ (hibiscus-spritz)
   ============================================================================ */
function buildHibiscusSpritz(
  root: THREE.Group,
  tr: ResourceTracker,
  maxAniso: number,
  actors: DishDynamicActors
) {
  // Travertine stone coaster
  const stoneTex = tr.tex(createStonewareTexture('#EAE2D3', '#9E8E77', maxAniso));
  const coaster = tr.mesh(
    tr.geo(new THREE.CylinderGeometry(0.98, 1.0, 0.07, 48)),
    tr.mat(new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.58 }))
  );
  coaster.position.y = GROUND_Y + 0.035;
  root.add(coaster);

  const baseY = GROUND_Y + 0.07;

  // Luminous ruby-crimson hibiscus & pomegranate tonic inside goblet bowl
  const spritzMat = tr.mat(
    new THREE.MeshPhysicalMaterial({
      color: 0xa81332,
      roughness: 0.06,
      transmission: isSoftwareGl ? 0 : 0.58,
      transparent: true,
      opacity: 0.92,
      ior: 1.34,
      attenuationColor: new THREE.Color(0xe62952),
      attenuationDistance: 0.75,
      clearcoat: 0.9,
    })
  );
  const liquidPts = [
    new THREE.Vector2(0, baseY + 0.86),
    new THREE.Vector2(0.45, baseY + 0.94),
    new THREE.Vector2(0.82, baseY + 1.34),
    new THREE.Vector2(0.78, baseY + 1.82),
    new THREE.Vector2(0, baseY + 1.82),
  ];
  const liquid = tr.mesh(tr.geo(new THREE.LatheGeometry(liquidPts, 48)), spritzMat, false, false);
  liquid.renderOrder = 2;
  root.add(liquid);

  // 26 Pebble ice cubes & ruby pomegranate arils inside spritz (InstancedMesh)
  const pebbleGeo = tr.geo(new THREE.DodecahedronGeometry(0.11, 1));
  const pebbleMat = tr.mat(
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.14,
      transmission: isSoftwareGl ? 0 : 0.8,
      transparent: true,
      opacity: 0.72,
    })
  );
  const pebbles = new THREE.InstancedMesh(pebbleGeo, pebbleMat, 26);
  for (let i = 0; i < 26; i++) {
    const a = i * 2.39996;
    const rad = Math.sqrt((i + 0.5) / 26) * 0.58;
    const py = baseY + 1.56 + ((i % 4) - 1.5) * 0.08;
    _dummy.position.set(Math.cos(a) * rad, py, Math.sin(a) * rad);
    _dummy.rotation.set(i, i * 0.7, 0);
    _dummy.scale.setScalar(0.85 + (i % 3) * 0.15);
    _dummy.updateMatrix();
    pebbles.setMatrixAt(i, _dummy.matrix);
  }
  pebbles.instanceMatrix.needsUpdate = true;
  pebbles.computeBoundingSphere();
  pebbles.renderOrder = 3;
  root.add(pebbles);

  // Rising botanical tonic bubbles (animated InstancedMesh)
  const bubbleCount = 28;
  const bubbleGeo = tr.geo(new THREE.SphereGeometry(0.02, 8, 8));
  const bubbleMat = tr.mat(new THREE.MeshBasicMaterial({ color: 0xffeef2, transparent: true, opacity: 0.7 }));
  const bubbleMesh = new THREE.InstancedMesh(bubbleGeo, bubbleMat, bubbleCount);
  bubbleMesh.frustumCulled = false;
  const basePos = new Float32Array(bubbleCount * 3);
  const speeds = new Float32Array(bubbleCount);
  for (let i = 0; i < bubbleCount; i++) {
    const a = i * 2.4;
    const r = ((i * 19) % 52) / 100;
    basePos[i * 3] = Math.cos(a) * r;
    basePos[i * 3 + 1] = (i / bubbleCount);
    basePos[i * 3 + 2] = Math.sin(a) * r;
    speeds[i] = 0.35 + (i % 5) * 0.12;
  }
  bubbleMesh.renderOrder = 4;
  root.add(bubbleMesh);
  actors.risingBubbles = { mesh: bubbleMesh, basePositions: basePos, speeds };

  // Key-lime wheel + fresh garden mint sprig garnish
  const limeTex = tr.tex(createFruitCutTexture('lime-wheel', maxAniso));
  const limeWheel = tr.mesh(
    tr.geo(new THREE.CylinderGeometry(0.34, 0.34, 0.045, 32)),
    tr.mat(new THREE.MeshStandardMaterial({ map: limeTex, roughness: 0.38 }))
  );
  limeWheel.position.set(0.68, baseY + 1.98, 0.12);
  limeWheel.rotation.set(0.3, 0.2, 1.15);
  limeWheel.renderOrder = 4;
  root.add(limeWheel);

  const mintGeo = createLeafGeometry(tr, 0.34, 0.16, 0.07);
  const mintMat = tr.mat(new THREE.MeshStandardMaterial({ color: 0x3b8032, roughness: 0.44, side: THREE.DoubleSide }));
  const m1 = tr.mesh(mintGeo, mintMat);
  m1.position.set(-0.24, baseY + 1.88, 0.16);
  m1.rotation.set(0.32, 0.6, -0.2);
  root.add(m1);
  const m2 = tr.mesh(mintGeo, mintMat);
  m2.scale.setScalar(0.84);
  m2.position.set(-0.24, baseY + 1.88, 0.16);
  m2.rotation.set(0.38, -0.9, 0.25);
  root.add(m2);

  // Stemmed crystal balloon spritz goblet
  const gobletPts = [
    new THREE.Vector2(0, baseY),
    new THREE.Vector2(0.64, baseY),
    new THREE.Vector2(0.58, baseY + 0.05),
    new THREE.Vector2(0.08, baseY + 0.12),
    new THREE.Vector2(0.065, baseY + 0.8),
    new THREE.Vector2(0.48, baseY + 0.92),
    new THREE.Vector2(0.88, baseY + 1.35),
    new THREE.Vector2(0.8, baseY + 2.04),
    new THREE.Vector2(0.76, baseY + 2.04),
    new THREE.Vector2(0.83, baseY + 1.35),
    new THREE.Vector2(0.44, baseY + 0.95),
    new THREE.Vector2(0, baseY + 0.85),
  ];
  const goblet = tr.mesh(
    tr.geo(new THREE.LatheGeometry(gobletPts, 52)),
    createOpticalGlassMat(tr, 0xffffff),
    false,
    false
  );
  goblet.renderOrder = 6;
  root.add(goblet);
}

/* ============================================================================
   9. AMAZONIAN ACAI & TOASTED PECAN BOWL (acai-bowl)
   ============================================================================ */
function buildAcaiBowl(root: THREE.Group, tr: ResourceTracker, maxAniso: number) {
  // Hand-carved thick coconut-wood bowl
  const woodTex = tr.tex(createWoodGrainTexture('#3E2516', '#1F1108', maxAniso));
  const bowlMat = tr.mat(new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.56, side: THREE.DoubleSide }));
  const bowlPts = [
    new THREE.Vector2(0, GROUND_Y),
    new THREE.Vector2(0.66, GROUND_Y),
    new THREE.Vector2(1.18, GROUND_Y + 0.34),
    new THREE.Vector2(1.36, GROUND_Y + 0.88),
    new THREE.Vector2(1.25, GROUND_Y + 0.9),
    new THREE.Vector2(1.08, GROUND_Y + 0.38),
    new THREE.Vector2(0.56, GROUND_Y + 0.1),
    new THREE.Vector2(0, GROUND_Y + 0.1),
  ];
  root.add(tr.mesh(tr.geo(new THREE.LatheGeometry(bowlPts, 56)), bowlMat));

  const surfaceY = GROUND_Y + 0.76;

  // Swirled velvety deep-violet Amazonian acai smoothie dome
  const acaiGeo = tr.geo(new THREE.CircleGeometry(1.22, 64));
  acaiGeo.rotateX(-Math.PI / 2);
  const pos = acaiGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const r = Math.hypot(x, z);
    const ang = Math.atan2(z, x);
    const dome = Math.max(0, 1 - (r / 1.22) ** 2) * 0.14;
    const swirl = Math.sin(r * 16 - ang * 2) * 0.018 * (1 - r / 1.3);
    pos.setY(i, dome + swirl);
  }
  acaiGeo.computeVertexNormals();
  const acai = tr.mesh(
    acaiGeo,
    tr.mat(new THREE.MeshPhysicalMaterial({ color: 0x521b49, roughness: 0.3, clearcoat: 0.42 }))
  );
  acai.position.y = surfaceY;
  root.add(acai);

  // Row 1: 6 Shingled caramelized banana coins
  const bananaTex = tr.tex(createFruitCutTexture('banana-coin', maxAniso));
  const bananaMat = tr.mat(new THREE.MeshStandardMaterial({ map: bananaTex, roughness: 0.42 }));
  const coinGeo = tr.geo(new THREE.CylinderGeometry(0.22, 0.22, 0.055, 28));
  for (let b = 0; b < 6; b++) {
    const coin = tr.mesh(coinGeo, bananaMat);
    const zPos = -0.62 + b * 0.25;
    coin.position.set(-0.48, surfaceY + 0.13 + (3 - Math.abs(b - 2.5)) * 0.012, zPos);
    coin.rotation.set(0.34, 0.1, 0.15);
    root.add(coin);
  }

  // Row 2: Maple-toasted pecan halves & golden granola clusters (InstancedMesh)
  const granolaGeo = tr.geo(new THREE.DodecahedronGeometry(0.068, 1));
  const granolaMat = tr.mat(new THREE.MeshStandardMaterial({ roughness: 0.72 }));
  const granola = new THREE.InstancedMesh(granolaGeo, granolaMat, 38);
  for (let i = 0; i < 38; i++) {
    const gx = -0.14 + (((i * 37) % 34) / 100 - 0.17);
    const gz = -0.78 + (i / 38) * 1.56;
    const r = Math.hypot(gx, gz);
    if (r > 1.05) {
      _dummy.scale.setScalar(0.001);
    } else {
      _dummy.position.set(gx, surfaceY + 0.14 + (i % 3) * 0.02, gz);
      _dummy.rotation.set(i, i * 1.3, 0);
      _dummy.scale.set(1.25, 0.85, 1);
    }
    _dummy.updateMatrix();
    granola.setMatrixAt(i, _dummy.matrix);
    _color.setHex(i % 3 === 0 ? 0x6e3b1c : 0xc7893e);
    granola.setColorAt(i, _color);
  }
  granola.instanceMatrix.needsUpdate = true;
  if (granola.instanceColor) granola.instanceColor.needsUpdate = true;
  granola.computeBoundingSphere();
  root.add(granola);

  // Row 3: Fresh berries + white chia-coconut pudding cloud
  const berryGeo = tr.geo(new THREE.SphereGeometry(0.105, 18, 14));
  const berryMat = tr.mat(new THREE.MeshStandardMaterial({ color: 0x231d3d, roughness: 0.34 }));
  for (let k = 0; k < 8; k++) {
    const berry = tr.mesh(berryGeo, berryMat);
    berry.position.set(0.45 + (k % 2) * 0.18, surfaceY + 0.13, -0.58 + k * 0.17);
    root.add(berry);
  }

  const chiaDollop = tr.mesh(
    tr.geo(new THREE.SphereGeometry(0.24, 24, 16)),
    tr.mat(new THREE.MeshStandardMaterial({ color: 0xf7f3eb, roughness: 0.45 }))
  );
  chiaDollop.scale.set(1.1, 0.52, 1.1);
  chiaDollop.position.set(0.52, surfaceY + 0.11, 0.12);
  root.add(chiaDollop);
}

/* ============================================================================
   10. TUSCAN FOCACCIA & SMOKED PROVOLONE PRESS (tuscan-panini)
   ============================================================================ */
function buildTuscanPanini(root: THREE.Group, tr: ResourceTracker, maxAniso: number) {
  const boardTopY = addWalnutBoard(root, tr, maxAniso, 2.8, 1.92);
  const grillTex = tr.tex(createCulinarySurfaceTexture('focaccia-grill', maxAniso));
  const crumbTex = tr.tex(createCulinarySurfaceTexture('sourdough-crumb', maxAniso));
  const bump = tr.tex(createOrganicBumpTexture(41, 0.85));

  const buildHalfPanini = (): THREE.Group => {
    const half = new THREE.Group();
    // Triangular diagonal-cut focaccia slab shape
    const tri = new THREE.Shape();
    tri.moveTo(-0.68, -0.52);
    tri.lineTo(0.68, -0.52);
    tri.lineTo(-0.68, 0.58);
    tri.closePath();

    const breadSlabGeo = tr.geo(
      new THREE.ExtrudeGeometry(tri, {
        depth: 0.13,
        bevelEnabled: true,
        bevelThickness: 0.022,
        bevelSize: 0.022,
        bevelSegments: 3,
      })
    );
    breadSlabGeo.rotateX(Math.PI / 2);

    const topBreadMat = tr.mat(
      new THREE.MeshStandardMaterial({ map: grillTex, bumpMap: bump, bumpScale: 0.022, roughness: 0.68 })
    );
    const botBreadMat = tr.mat(
      new THREE.MeshStandardMaterial({ map: crumbTex, bumpMap: bump, bumpScale: 0.022, roughness: 0.78 })
    );

    const bottomBread = tr.mesh(breadSlabGeo, botBreadMat);
    bottomBread.position.y = 0.15;
    half.add(bottomBread);

    // Pistachio-basil pesto spread
    const pesto = tr.mesh(
      breadSlabGeo,
      tr.mat(new THREE.MeshStandardMaterial({ color: 0x457326, roughness: 0.45 }))
    );
    pesto.scale.set(0.95, 0.25, 0.95);
    pesto.position.y = 0.19;
    half.add(pesto);

    // Sun-blushed heirloom tomato slices & grilled courgette ribbons
    const tomatoGeo = tr.geo(new THREE.CylinderGeometry(0.24, 0.24, 0.04, 24));
    const tomatoMat = tr.mat(new THREE.MeshPhysicalMaterial({ color: 0xc22b1d, roughness: 0.24, clearcoat: 0.6 }));
    const t1 = tr.mesh(tomatoGeo, tomatoMat);
    t1.position.set(-0.34, 0.22, -0.2);
    half.add(t1);
    const t2 = tr.mesh(tomatoGeo, tomatoMat);
    t2.position.set(-0.08, 0.22, -0.32);
    half.add(t2);

    const zukeMat = tr.mat(new THREE.MeshStandardMaterial({ color: 0x3b6326, roughness: 0.5 }));
    const zuke = tr.mesh(tr.geo(new THREE.BoxGeometry(0.76, 0.035, 0.26)), zukeMat);
    zuke.position.set(-0.24, 0.255, -0.14);
    zuke.rotation.y = -0.68;
    half.add(zuke);

    // Melted smoked provolone cheese oozing gently over diagonal cut
    const cheeseMat = tr.mat(
      new THREE.MeshPhysicalMaterial({ color: 0xf5dc98, roughness: 0.22, clearcoat: 0.55 })
    );
    const cheese = tr.mesh(breadSlabGeo, cheeseMat);
    cheese.scale.set(0.99, 0.32, 0.99);
    cheese.position.set(0.02, 0.31, 0.02);
    half.add(cheese);

    // Crisp rosemary sea-salt focaccia top with grill marks
    const topBread = tr.mesh(breadSlabGeo, topBreadMat);
    topBread.position.y = 0.46;
    half.add(topBread);

    return half;
  };

  const backHalf = buildHalfPanini();
  backHalf.position.set(-0.38, boardTopY, -0.06);
  backHalf.rotation.y = 0.22;
  root.add(backHalf);

  const frontHalf = buildHalfPanini();
  frontHalf.position.set(0.32, boardTopY + 0.14, 0.18);
  frontHalf.rotation.set(0.18, -0.35, 0.22);
  root.add(frontHalf);

  // Small ceramic ramekin of emerald pistachio-basil pesto on the board corner
  const ramekinMat = tr.mat(new THREE.MeshStandardMaterial({ color: 0xf4ede0, roughness: 0.35 }));
  const ramekin = tr.mesh(tr.geo(new THREE.CylinderGeometry(0.3, 0.25, 0.24, 32)), ramekinMat);
  ramekin.position.set(-0.92, boardTopY + 0.12, 0.48);
  root.add(ramekin);

  const pestoDip = tr.mesh(
    tr.geo(new THREE.CircleGeometry(0.26, 28)),
    tr.mat(new THREE.MeshPhysicalMaterial({ color: 0x4b7d28, roughness: 0.3, clearcoat: 0.45 }))
  );
  pestoDip.rotation.x = -Math.PI / 2;
  pestoDip.position.set(-0.92, boardTopY + 0.242, 0.48);
  root.add(pestoDip);
}

/* ============================================================================
   11. WOOD-FIRED NEAPOLITAN MARGHERITA D.O.P (margherita-pizza)
   ============================================================================ */
function buildMargheritaPizza(root: THREE.Group, tr: ResourceTracker, maxAniso: number) {
  // Round warm acacia pizza peel
  const woodTex = tr.tex(createWoodGrainTexture('#6B4429', '#3B2110', maxAniso));
  const peelMat = tr.mat(new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.64 }));
  const peel = tr.mesh(tr.geo(new THREE.CylinderGeometry(1.78, 1.74, 0.09, 64)), peelMat);
  peel.position.y = GROUND_Y + 0.045;
  root.add(peel);

  const handle = tr.mesh(tr.geo(new THREE.BoxGeometry(0.62, 0.08, 0.34)), peelMat);
  handle.position.set(1.92, GROUND_Y + 0.045, 0);
  root.add(handle);

  const baseTopY = GROUND_Y + 0.092;
  const pizzaTex = tr.tex(createCulinarySurfaceTexture('neapolitan-pizza', maxAniso));
  const bump = tr.tex(createOrganicBumpTexture(52, 0.85));

  // Center San Marzano D.O.P sauce & sourdough disc
  const pieDisc = tr.mesh(
    tr.geo(new THREE.CylinderGeometry(1.48, 1.48, 0.06, 56)),
    tr.mat(new THREE.MeshStandardMaterial({ map: pizzaTex, bumpMap: bump, bumpScale: 0.02, roughness: 0.54 }))
  );
  pieDisc.position.y = baseTopY + 0.03;
  root.add(pieDisc);

  // Airy, blistered wood-fired Neapolitan cornicione (undulating 3D crust rim)
  const rimGeo = tr.geo(new THREE.TorusGeometry(1.44, 0.19, 24, 72));
  rimGeo.rotateX(Math.PI / 2);
  const rPos = rimGeo.attributes.position;
  for (let i = 0; i < rPos.count; i++) {
    const x = rPos.getX(i);
    const z = rPos.getZ(i);
    const y = rPos.getY(i);
    const a = Math.atan2(z, x);
    const blister = 1 + Math.sin(a * 7) * 0.06 + Math.cos(a * 13) * 0.04;
    rPos.setXYZ(i, x * blister, y * (0.72 + Math.sin(a * 5) * 0.14), z * blister);
  }
  rimGeo.computeVertexNormals();
  const cornicione = tr.mesh(
    rimGeo,
    tr.mat(new THREE.MeshStandardMaterial({ map: pizzaTex, bumpMap: bump, bumpScale: 0.03, roughness: 0.68 }))
  );
  cornicione.position.y = baseTopY + 0.11;
  root.add(cornicione);

  // 7 Melted puddles of creamy Fior di Latte mozzarella
  const mozzMat = tr.mat(
    new THREE.MeshPhysicalMaterial({
      color: 0xfbf6ea,
      roughness: 0.22,
      clearcoat: 0.62,
    })
  );
  const mozzSpots = [
    [0, 0, 0.3],
    [0.66, 0.18, 0.28],
    [-0.64, 0.24, 0.27],
    [0.32, -0.68, 0.29],
    [-0.38, -0.62, 0.26],
    [0.52, 0.65, 0.25],
    [-0.54, 0.62, 0.26],
  ];
  mozzSpots.forEach(([mx, mz, mr], idx) => {
    const blobGeo = tr.geo(new THREE.SphereGeometry(mr, 24, 16));
    blobGeo.scale(1.15, 0.14, 0.94);
    const blob = tr.mesh(blobGeo, mozzMat);
    blob.position.set(mx, baseTopY + 0.068, mz);
    blob.rotation.y = idx * 0.9;
    root.add(blob);
  });

  // 6 Curled sweet courtyard basil leaves
  const basilGeo = createLeafGeometry(tr, 0.34, 0.17, 0.065);
  const basilMat = tr.mat(new THREE.MeshStandardMaterial({ color: 0x2e7523, roughness: 0.4, side: THREE.DoubleSide }));
  for (let b = 0; b < 6; b++) {
    const a = (b / 6) * Math.PI * 2 + 0.4;
    const rad = 0.45 + (b % 2) * 0.32;
    const leaf = tr.mesh(basilGeo, basilMat);
    leaf.position.set(Math.cos(a) * rad, baseTopY + 0.11, Math.sin(a) * rad);
    leaf.rotation.set(0.14, -a + 0.6, 0.08);
    root.add(leaf);
  }
}

/* ============================================================================
   12. BLACK FIG, HOT HONEY & BURRATA BIANCA (burrata-fig-pizza)
   ============================================================================ */
function buildBurrataFigPizza(root: THREE.Group, tr: ResourceTracker, maxAniso: number) {
  // Dark charred slate serving board
  const slateTex = tr.tex(createStonewareTexture('#24201D', '#3D352E', maxAniso));
  const board = tr.mesh(
    tr.geo(new THREE.CylinderGeometry(1.78, 1.75, 0.08, 64)),
    tr.mat(new THREE.MeshStandardMaterial({ map: slateTex, roughness: 0.72 }))
  );
  board.position.y = GROUND_Y + 0.04;
  root.add(board);

  const baseTopY = GROUND_Y + 0.082;
  const biancaTex = tr.tex(createCulinarySurfaceTexture('bianca-pizza', maxAniso));
  const bump = tr.tex(createOrganicBumpTexture(61, 0.85));

  // Garlic-confit bianca sourdough base + blistered cornicione
  const disc = tr.mesh(
    tr.geo(new THREE.CylinderGeometry(1.46, 1.46, 0.06, 56)),
    tr.mat(new THREE.MeshStandardMaterial({ map: biancaTex, bumpMap: bump, bumpScale: 0.02, roughness: 0.56 }))
  );
  disc.position.y = baseTopY + 0.03;
  root.add(disc);

  const rimGeo = tr.geo(new THREE.TorusGeometry(1.42, 0.18, 22, 68));
  rimGeo.rotateX(Math.PI / 2);
  rimGeo.scale(1, 0.76, 1);
  const rim = tr.mesh(
    rimGeo,
    tr.mat(new THREE.MeshStandardMaterial({ map: biancaTex, bumpMap: bump, bumpScale: 0.03, roughness: 0.66 }))
  );
  rim.position.y = baseTopY + 0.11;
  root.add(rim);

  // Centerpiece torn Pugliese Burrata pouch + glossy stracciatella cream spill
  const burrataMat = tr.mat(
    new THREE.MeshPhysicalMaterial({ color: 0xfcf9f2, roughness: 0.16, clearcoat: 0.82 })
  );
  const creamSpill = tr.mesh(tr.geo(new THREE.CylinderGeometry(0.55, 0.62, 0.04, 36)), burrataMat);
  creamSpill.position.y = baseTopY + 0.07;
  root.add(creamSpill);

  const burrataBall = tr.mesh(tr.geo(new THREE.SphereGeometry(0.36, 32, 24)), burrataMat);
  burrataBall.scale.set(1.12, 0.74, 1.08);
  burrataBall.position.y = baseTopY + 0.24;
  root.add(burrataBall);

  // 6 Quartered jammy Black Mission figs + toasted walnuts + rocket leaves
  const figTex = tr.tex(createFruitCutTexture('fig-cut', maxAniso));
  const figMat = tr.mat(new THREE.MeshStandardMaterial({ map: figTex, roughness: 0.35 }));
  const figGeo = tr.geo(new THREE.SphereGeometry(0.22, 20, 16, 0, Math.PI));
  const rocketGeo = createLeafGeometry(tr, 0.36, 0.11, 0.05);
  const rocketMat = tr.mat(new THREE.MeshStandardMaterial({ color: 0x3b6e24, roughness: 0.48, side: THREE.DoubleSide }));
  const walnutMat = tr.mat(new THREE.MeshStandardMaterial({ color: 0x704321, roughness: 0.68 }));

  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const fx = Math.cos(a) * 0.82;
    const fz = Math.sin(a) * 0.82;

    const fig = tr.mesh(figGeo, figMat);
    fig.position.set(fx, baseTopY + 0.11, fz);
    fig.rotation.set(-Math.PI / 2 + 0.28, 0, a);
    root.add(fig);

    const rocket = tr.mesh(rocketGeo, rocketMat);
    rocket.position.set(Math.cos(a + 0.5) * 0.68, baseTopY + 0.09, Math.sin(a + 0.5) * 0.68);
    rocket.rotation.set(0.18, -a, 0.1);
    root.add(rocket);

    const nut = tr.mesh(tr.geo(new THREE.DodecahedronGeometry(0.09, 1)), walnutMat);
    nut.scale.set(1.2, 0.7, 0.95);
    nut.position.set(Math.cos(a + 0.28) * 1.02, baseTopY + 0.1, Math.sin(a + 0.28) * 1.02);
    root.add(nut);
  }

  // Shimmering chili-infused hot wildflower honey spiral drizzle
  const honeyPts: THREE.Vector3[] = [];
  for (let s = 0; s <= 40; s++) {
    const t = (s / 40) * Math.PI * 4.5;
    const rad = 0.15 + (s / 40) * 1.02;
    honeyPts.push(new THREE.Vector3(Math.cos(t) * rad, baseTopY + (rad < 0.38 ? 0.42 - rad * 0.4 : 0.11), Math.sin(t) * rad));
  }
  const honeyDrizzle = tr.mesh(
    tr.geo(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(honeyPts), 72, 0.016, 8, false)),
    tr.mat(new THREE.MeshPhysicalMaterial({ color: 0xd97814, roughness: 0.08, clearcoat: 1 }))
  );
  root.add(honeyDrizzle);
}

/* ============================================================================
   13. VALRHONA 70% WARM SKILLET BROWNIE (skillet-brownie)
   ============================================================================ */
function buildSkilletBrownie(root: THREE.Group, tr: ResourceTracker, maxAniso: number) {
  // Round wooden trivet coaster
  const woodTex = tr.tex(createWoodGrainTexture('#5E3F29', '#301C0E', maxAniso));
  const trivet = tr.mesh(
    tr.geo(new THREE.CylinderGeometry(1.38, 1.42, 0.08, 48)),
    tr.mat(new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.68 }))
  );
  trivet.position.y = GROUND_Y + 0.04;
  root.add(trivet);

  const panY = GROUND_Y + 0.08;

  // Seasoned matte-black cast-iron skillet + classic handle
  const ironBump = tr.tex(createOrganicBumpTexture(73, 0.65));
  const ironMat = tr.mat(
    new THREE.MeshStandardMaterial({
      color: 0x1e1d1c,
      bumpMap: ironBump,
      bumpScale: 0.015,
      roughness: 0.62,
      metalness: 0.58,
      side: THREE.DoubleSide,
    })
  );
  const skilletPts = [
    new THREE.Vector2(0, panY),
    new THREE.Vector2(1.16, panY),
    new THREE.Vector2(1.32, panY + 0.38),
    new THREE.Vector2(1.24, panY + 0.4),
    new THREE.Vector2(1.1, panY + 0.09),
    new THREE.Vector2(0, panY + 0.09),
  ];
  const skillet = tr.mesh(tr.geo(new THREE.LatheGeometry(skilletPts, 56)), ironMat);
  skillet.position.x = -0.16;
  root.add(skillet);

  const handleShape = new THREE.Shape();
  handleShape.moveTo(0, -0.11);
  handleShape.lineTo(0.88, -0.15);
  handleShape.quadraticCurveTo(1.04, 0, 0.88, 0.15);
  handleShape.lineTo(0, 0.11);
  handleShape.closePath();
  const hole = new THREE.Path();
  hole.absellipse(0.76, 0, 0.11, 0.055, 0, Math.PI * 2, false, 0);
  handleShape.holes.push(hole);

  const skHandleGeo = tr.geo(
    new THREE.ExtrudeGeometry(handleShape, {
      depth: 0.06,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.015,
      bevelSegments: 2,
    })
  );
  skHandleGeo.rotateX(Math.PI / 2);
  const skHandle = tr.mesh(skHandleGeo, ironMat);
  skHandle.position.set(1.06, panY + 0.37, 0);
  skHandle.rotation.z = 0.06;
  root.add(skHandle);

  // Baked Valrhona 70% dark chocolate brownie with crackly crust
  const brownieTex = tr.tex(createCulinarySurfaceTexture('brownie-crinkle', maxAniso));
  const brownieGeo = tr.geo(new THREE.CylinderGeometry(1.18, 1.08, 0.28, 48, 4));
  const brownie = tr.mesh(
    brownieGeo,
    tr.mat(new THREE.MeshStandardMaterial({ map: brownieTex, bumpMap: ironBump, bumpScale: 0.03, roughness: 0.56 }))
  );
  brownie.position.set(-0.16, panY + 0.22, 0);
  root.add(brownie);

  // Melting Madagascar vanilla bean gelato scoop + cream pool
  const gelatoMat = tr.mat(
    new THREE.MeshStandardMaterial({
      color: 0xfbf5e6,
      bumpMap: ironBump,
      bumpScale: 0.018,
      roughness: 0.44,
    })
  );
  const meltSkirt = tr.mesh(tr.geo(new THREE.CylinderGeometry(0.42, 0.58, 0.08, 36)), gelatoMat);
  meltSkirt.position.set(-0.16, panY + 0.39, 0);
  root.add(meltSkirt);

  const scoop = tr.mesh(tr.geo(new THREE.SphereGeometry(0.44, 32, 24)), gelatoMat);
  scoop.scale.set(1.04, 0.9, 1.04);
  scoop.position.set(-0.16, panY + 0.62, 0);
  root.add(scoop);

  // Glossy warm Valrhona chocolate ganache drizzle + roasted Piedmont hazelnuts
  const ganacheMat = tr.mat(
    new THREE.MeshPhysicalMaterial({ color: 0x210d06, roughness: 0.08, clearcoat: 0.96 })
  );
  for (let d = -2; d <= 2; d++) {
    const zOff = d * 0.16;
    const radAtZ = Math.sqrt(Math.max(0.05, 0.44 * 0.44 - zOff * zOff));
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.16 - radAtZ * 1.35, panY + 0.38, zOff),
      new THREE.Vector3(-0.16 - radAtZ * 0.7, panY + 0.76, zOff),
      new THREE.Vector3(-0.16, panY + 0.98 - Math.abs(d) * 0.06, zOff),
      new THREE.Vector3(-0.16 + radAtZ * 0.7, panY + 0.76, zOff),
      new THREE.Vector3(-0.16 + radAtZ * 1.35, panY + 0.38, zOff),
    ]);
    root.add(tr.mesh(tr.geo(new THREE.TubeGeometry(curve, 24, 0.02, 8, false)), ganacheMat));
  }

  // Chopped roasted hazelnuts & flaky sea salt
  const nutGeo = tr.geo(new THREE.DodecahedronGeometry(0.06, 0));
  const nutMat = tr.mat(new THREE.MeshStandardMaterial({ color: 0x9e6734, roughness: 0.55 }));
  const nuts = new THREE.InstancedMesh(nutGeo, nutMat, 22);
  for (let i = 0; i < 22; i++) {
    const a = i * 2.4;
    const r = 0.25 + ((i * 29) % 68) / 100;
    const ny = r < 0.44 ? panY + 0.95 - r * 0.5 : panY + 0.39;
    _dummy.position.set(-0.16 + Math.cos(a) * r, ny, Math.sin(a) * r);
    _dummy.rotation.set(i, i * 0.8, 0);
    _dummy.scale.setScalar(0.8 + (i % 3) * 0.22);
    _dummy.updateMatrix();
    nuts.setMatrixAt(i, _dummy.matrix);
  }
  nuts.instanceMatrix.needsUpdate = true;
  nuts.computeBoundingSphere();
  root.add(nuts);
}

/* ============================================================================
   14. BROWN BUTTER & GREEN CARDAMOM KNOT (cardamom-knot)
   ============================================================================ */
function buildCardamomKnot(root: THREE.Group, tr: ResourceTracker, maxAniso: number) {
  const floorY = addStonewarePlate(root, tr, maxAniso, 1.56, '#F4ECE0', '#695340', '#C9893B');

  const briocheTex = tr.tex(createCulinarySurfaceTexture('cardamom-brioche', maxAniso));
  briocheTex.wrapS = THREE.RepeatWrapping;
  briocheTex.wrapT = THREE.RepeatWrapping;
  briocheTex.repeat.set(5, 2);

  const briocheMat = tr.mat(
    new THREE.MeshPhysicalMaterial({
      map: briocheTex,
      roughness: 0.3,
      clearcoat: 0.72,
      clearcoatRoughness: 0.2,
    })
  );

  // True 3D Scandinavian braided brioche trefoil knot (continuous intertwined dough strand)
  const knotPts: THREE.Vector3[] = [];
  const steps = 96;
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const r = 0.52 + 0.26 * Math.cos(3 * t);
    const x = r * Math.cos(2 * t);
    const z = r * Math.sin(2 * t);
    const y = floorY + 0.29 + 0.16 * Math.sin(3 * t) + (1 - Math.hypot(x, z) / 0.9) * 0.12;
    knotPts.push(new THREE.Vector3(x, y, z));
  }
  const knotCurve = new THREE.CatmullRomCurve3(knotPts, true);
  const knotGeo = tr.geo(new THREE.TubeGeometry(knotCurve, 140, 0.2, 20, true));
  knotGeo.scale(1.12, 0.86, 1.12);
  const knotMesh = tr.mesh(knotGeo, briocheMat);
  knotMesh.position.y = 0.04;
  root.add(knotMesh);

  // 34 Crystalline white pearl sugar nibs scattered over glazed brioche (InstancedMesh)
  const sugarGeo = tr.geo(new THREE.DodecahedronGeometry(0.032, 0));
  const sugarMat = tr.mat(new THREE.MeshStandardMaterial({ color: 0xfcfaf5, roughness: 0.32 }));
  const pearlSugar = new THREE.InstancedMesh(sugarGeo, sugarMat, 34);
  for (let i = 0; i < 34; i++) {
    const u = (i / 34 + (i % 3) * 0.011) % 1;
    const pt = knotCurve.getPointAt(u);
    const offsetAngle = i * 1.9;
    _dummy.position.set(
      pt.x * 1.12 + Math.cos(offsetAngle) * 0.08,
      pt.y * 0.86 + 0.21,
      pt.z * 1.12 + Math.sin(offsetAngle) * 0.08
    );
    _dummy.rotation.set(i, i * 0.6, i * 0.3);
    _dummy.scale.setScalar(0.85 + (i % 3) * 0.2);
    _dummy.updateMatrix();
    pearlSugar.setMatrixAt(i, _dummy.matrix);
  }
  pearlSugar.instanceMatrix.needsUpdate = true;
  pearlSugar.computeBoundingSphere();
  root.add(pearlSugar);

  // 2 Whole green Malabar cardamom pods on plate rim
  const podMat = tr.mat(new THREE.MeshStandardMaterial({ color: 0x6f8748, roughness: 0.58 }));
  const podGeo = tr.geo(new THREE.SphereGeometry(0.08, 12, 10));
  podGeo.scale(1.9, 0.75, 0.85);
  const pod1 = tr.mesh(podGeo, podMat);
  pod1.position.set(0.95, floorY + 0.06, 0.56);
  pod1.rotation.y = 0.5;
  root.add(pod1);
  const pod2 = tr.mesh(podGeo, podMat);
  pod2.position.set(0.82, floorY + 0.06, 0.72);
  pod2.rotation.y = -0.7;
  root.add(pod2);
}

/* ============================================================================
   15. TWICE-BAKED ROASTED ALMOND CROISSANT (almond-croissant)
   ============================================================================ */
function buildAlmondCroissant(root: THREE.Group, tr: ResourceTracker, maxAniso: number) {
  const floorY = addStonewarePlate(root, tr, maxAniso, 1.62, '#FAF6EE', '#85705C', '#C9893B');
  const pastryTex = tr.tex(createCulinarySurfaceTexture('cardamom-brioche', maxAniso));
  const bump = tr.tex(createOrganicBumpTexture(88, 0.75));

  const viennoiserieMat = tr.mat(
    new THREE.MeshPhysicalMaterial({
      map: pastryTex,
      bumpMap: bump,
      bumpScale: 0.02,
      roughness: 0.36,
      clearcoat: 0.52,
      clearcoatRoughness: 0.25,
    })
  );

  // 9 Overlapping tapered laminated crescent lobes forming a classic French croissant
  const croissantGroup = new THREE.Group();
  const lobeCount = 9;
  for (let i = 0; i < lobeCount; i++) {
    const norm = (i / (lobeCount - 1)) * 2 - 1; // -1 .. 1
    const arcAngle = norm * 0.92;
    const arcR = 0.92;
    const sizeFactor = Math.cos(norm * Math.PI * 0.44);

    const lobeGeo = tr.geo(new THREE.SphereGeometry(0.46, 28, 22));
    lobeGeo.scale(0.58 * (0.65 + sizeFactor * 0.45), 0.72 * sizeFactor + 0.14, 0.95 * sizeFactor + 0.22);

    const lobe = tr.mesh(lobeGeo, viennoiserieMat);
    const lx = Math.sin(arcAngle) * arcR;
    const lz = (Math.cos(arcAngle) - 0.82) * arcR * 0.85;
    const ly = floorY + 0.22 + sizeFactor * 0.18;
    lobe.position.set(lx, ly, lz);
    lobe.rotation.y = arcAngle * 0.95;
    croissantGroup.add(lobe);
  }

  // Twice-baked roasted almond frangipane cream ribbon along the crown
  const frangipanePts: THREE.Vector3[] = [];
  for (let s = -3; s <= 3; s++) {
    const n = s / 3.4;
    const a = n * 0.78;
    const sf = Math.cos(n * Math.PI * 0.44);
    frangipanePts.push(
      new THREE.Vector3(
        Math.sin(a) * 0.88,
        floorY + 0.42 + sf * 0.28,
        (Math.cos(a) - 0.82) * 0.78
      )
    );
  }
  const frangipane = tr.mesh(
    tr.geo(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(frangipanePts), 36, 0.15, 14, false)),
    tr.mat(new THREE.MeshStandardMaterial({ color: 0xd9a868, bumpMap: bump, bumpScale: 0.03, roughness: 0.74 }))
  );
  frangipane.scale.set(1, 0.52, 1);
  frangipane.position.y = 0.22;
  croissantGroup.add(frangipane);

  // 46 Thin toasted flaked almond petals blanketing the frangipane crown (InstancedMesh)
  const almondGeo = tr.geo(new THREE.SphereGeometry(0.11, 12, 10));
  almondGeo.scale(1.25, 0.16, 0.82);
  const almondMat = tr.mat(new THREE.MeshStandardMaterial({ roughness: 0.48 }));
  const almonds = new THREE.InstancedMesh(almondGeo, almondMat, 46);
  const crownCurve = new THREE.CatmullRomCurve3(frangipanePts);

  for (let i = 0; i < 46; i++) {
    const u = (i + 0.5) / 46;
    const pt = crownCurve.getPointAt(u);
    const spreadZ = ((i % 5) - 2) * 0.075;
    const spreadX = (((i * 3) % 5) - 2) * 0.04;
    _dummy.position.set(pt.x + spreadX, pt.y * 0.52 + 0.31 - Math.abs(spreadZ) * 0.22, pt.z + spreadZ);
    _dummy.rotation.set(0.35 * Math.sin(i), i * 1.1, 0.3 * Math.cos(i));
    _dummy.scale.setScalar(0.85 + (i % 3) * 0.16);
    _dummy.updateMatrix();
    almonds.setMatrixAt(i, _dummy.matrix);
    _color.setHex(i % 4 === 0 ? 0xc88943 : i % 2 === 0 ? 0xf2dfc0 : 0xe4c696);
    almonds.setColorAt(i, _color);
  }
  almonds.instanceMatrix.needsUpdate = true;
  if (almonds.instanceColor) almonds.instanceColor.needsUpdate = true;
  almonds.computeBoundingSphere();
  croissantGroup.add(almonds);

  root.add(croissantGroup);
}

/* ============================================================================
   PUBLIC DISPATCHER FOR ALL 15 WILLOW CAFÉ MENU ITEMS
   ============================================================================ */
export function buildRealFoodModel3D(dishId: string, maxAniso: number): BuiltDish3D {
  const root = new THREE.Group();
  const tr = new ResourceTracker();
  const actors: DishDynamicActors = {};

  switch (dishId) {
    case 'matcha-latte':
      buildMatchaLatte(root, tr, maxAniso);
      break;
    case 'blueberry-cheesecake':
      buildBlueberryCheesecake(root, tr, maxAniso);
      break;
    case 'truffle-pasta':
      buildTrufflePasta(root, tr, maxAniso);
      break;
    case 'cold-brew':
      buildColdBrew(root, tr, maxAniso, actors);
      break;
    case 'avocado-toast':
      buildAvocadoToast(root, tr, maxAniso);
      break;
    case 'willow-cortado':
      buildWillowCortado(root, tr, maxAniso);
      break;
    case 'pourover-geisha':
      buildPouroverGeisha(root, tr, maxAniso, actors);
      break;
    case 'hibiscus-spritz':
      buildHibiscusSpritz(root, tr, maxAniso, actors);
      break;
    case 'acai-bowl':
      buildAcaiBowl(root, tr, maxAniso);
      break;
    case 'tuscan-panini':
      buildTuscanPanini(root, tr, maxAniso);
      break;
    case 'margherita-pizza':
      buildMargheritaPizza(root, tr, maxAniso);
      break;
    case 'burrata-fig-pizza':
      buildBurrataFigPizza(root, tr, maxAniso);
      break;
    case 'skillet-brownie':
      buildSkilletBrownie(root, tr, maxAniso);
      break;
    case 'cardamom-knot':
      buildCardamomKnot(root, tr, maxAniso);
      break;
    case 'almond-croissant':
    default:
      buildAlmondCroissant(root, tr, maxAniso);
      break;
  }

  return {
    root,
    actors,
    dispose: () => {
      root.traverse((obj) => {
        if ((obj as THREE.InstancedMesh).isInstancedMesh) {
          (obj as THREE.InstancedMesh).dispose();
        }
      });
      tr.dispose();
    },
  };
}
