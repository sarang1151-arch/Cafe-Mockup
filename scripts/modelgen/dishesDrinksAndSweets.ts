import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  buildCleanPlateFromTopRaw,
  buildMaskedSideStripRaw,
  buildPbrMapsFromAlbedo,
  detectSubjectCircleInTopView,
  encodePngRgb,
  extractCircularTopRaw,
  RawImage,
  sampleBicubic,
} from './imagePbrUtils';
import {
  buildCoupePlateGeo,
  buildPhotoSculptedDiscGeo,
  createOrganicLeafGeo,
  GlbMaterialSpec,
  GlbMeshPart,
  serializeToGlb,
  setCylindricalSideUVs,
  setPlanarTopUVs,
} from './glbSerializer';

export interface DishMultiViews {
  quadCard: RawImage;
  topView: RawImage;
  sideView: RawImage;
  frontView: RawImage;
  threeQuarterView: RawImage;
}

/**
 * Builds a closed watertight 3D food volume from a circular/contour top photograph and
 * a masked side strip so top & angled surfaces show 100% real TOP VIEW detail while
 * steep lower side walls show seamless baked crust/brioche from SIDE/FRONT views.
 */
function buildWatertightSculptedPastryParts(
  topFoodRaw: RawImage,
  gridSegs: number,
  maxRadiusX: number,
  maxRadiusZ: number,
  floorY: number,
  shapeFn: (
    nx: number,
    nz: number,
    lum: number,
    rgb: [number, number, number]
  ) => { inside: number; topY: number; waistScale?: number }
): { crownGeo: THREE.BufferGeometry; sideSkirtGeo: THREE.BufferGeometry } {
  const crownGeo = new THREE.PlaneGeometry(2, 2, gridSegs, gridSegs);
  crownGeo.rotateX(-Math.PI / 2);
  const pos = crownGeo.attributes.position;
  const uvs = new Float32Array(pos.count * 2);
  const rgb: [number, number, number] = [0, 0, 0];

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

    const u = dx * 0.48 + 0.5;
    const v = dz * 0.48 + 0.5;
    sampleBicubic(topFoodRaw, u * (topFoodRaw.width - 1), v * (topFoodRaw.height - 1), rgb);
    const lum = (rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114) / 255;

    const evalPt = shapeFn(dx, dz, lum, rgb);
    const edgeTuck = evalPt.inside < 1 ? 0.88 + 0.12 * evalPt.inside : 1.0;
    const wx = dx * maxRadiusX * edgeTuck;
    const wz = dz * maxRadiusZ * edgeTuck;
    const wy = floorY + Math.max(0.005, evalPt.topY * evalPt.inside);

    pos.setXYZ(i, wx, wy, wz);
    uvs[i * 2] = u;
    uvs[i * 2 + 1] = v;
  }

  crownGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  crownGeo.computeVertexNormals();

  // Matching lower perimeter brioche/pastry skirt tucked cleanly onto the plate floor
  const radialSegs = 88;
  const heightSegs = 14;
  const sideSkirtGeo = new THREE.CylinderGeometry(1, 1, 1, radialSegs, heightSegs, true);
  const sPos = sideSkirtGeo.attributes.position;
  const sUvs = new Float32Array(sPos.count * 2);

  for (let i = 0; i < sPos.count; i++) {
    const vx = sPos.getX(i);
    const vy = sPos.getY(i) + 0.5; // 0 (bottom) .. 1 (mid-crown tuck)
    const vz = sPos.getZ(i);
    const ang = Math.atan2(vz, vx);
    const dx = Math.cos(ang);
    const dz = Math.sin(ang);

    // Find contour radius in direction (dx, dz)
    let contourR = 0.62;
    for (let probe = 0.98; probe >= 0.25; probe -= 0.025) {
      const pu = dx * probe * 0.48 + 0.5;
      const pv = dz * probe * 0.48 + 0.5;
      sampleBicubic(topFoodRaw, pu * (topFoodRaw.width - 1), pv * (topFoodRaw.height - 1), rgb);
      const plum = (rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114) / 255;
      if (shapeFn(dx * probe, dz * probe, plum, rgb).inside > 0.22) {
        contourR = probe;
        break;
      }
    }

    const belly = Math.sin(vy * Math.PI * 0.85) * 0.06 + 0.92;
    const wx = dx * contourR * maxRadiusX * belly;
    const wz = dz * contourR * maxRadiusZ * belly;
    const wy = floorY + 0.01 + vy * 0.28;

    sPos.setXYZ(i, wx, wy, wz);
    sUvs[i * 2] = (ang / (Math.PI * 2) + 0.5) * 1.5;
    sUvs[i * 2 + 1] = 1 - vy;
  }

  sideSkirtGeo.setAttribute('uv', new THREE.BufferAttribute(sUvs, 2));
  sideSkirtGeo.computeVertexNormals();

  return { crownGeo, sideSkirtGeo };
}

export function buildDrinksAndSweetsGlb(id: string, views: DishMultiViews): Buffer | null {
  const dummy = new THREE.Object3D();

  switch (id) {
    // ========================================================================
    // 1 & 5: CEREMONIAL UJI MATCHA LATTE & WILLOW SIGNATURE HONEY CORTADO
    // ========================================================================
    case 'matcha-latte':
    case 'willow-cortado': {
      const isMatcha = id === 'matcha-latte';
      const foamRaw = extractCircularTopRaw(views.topView, 0.9, 512);
      const foamPbr = buildPbrMapsFromAlbedo(foamRaw, {
        normalStrength: 1.45,
        baseRoughness: 0.26,
        glossyWhiteCream: true,
        size: 256,
      });

      // Cup wall strictly inside cup silhouette (zero grey studio bg!)
      const cupSideRaw = buildMaskedSideStripRaw(
        views.sideView,
        views.frontView,
        0.34,
        0.66,
        0.16,
        512,
        256
      );
      const cupPbr = buildPbrMapsFromAlbedo(cupSideRaw, {
        normalStrength: 1.35,
        baseRoughness: 0.28,
        size: 256,
      });

      // Saucer stoneware texture extracted from real saucer lip in SIDE + FRONT views
      const saucerStripRaw = buildMaskedSideStripRaw(
        views.sideView,
        views.frontView,
        0.68,
        0.76,
        0.12,
        256,
        128
      );

      const saucerGeo = buildCoupePlateGeo(1.44, -0.3, 0.16);
      setCylindricalSideUVs(saucerGeo, -0.3, -0.12, 1);

      const cupTopR = isMatcha ? 0.9 : 0.79;
      const cupH = isMatcha ? 0.96 : 0.93;
      const cupBaseY = -0.225;
      const cupPts = [
        new THREE.Vector2(0, cupBaseY),
        new THREE.Vector2(cupTopR * 0.56, cupBaseY),
        new THREE.Vector2(cupTopR * 0.76, cupBaseY + cupH * 0.28),
        new THREE.Vector2(cupTopR * 0.96, cupBaseY + cupH * 0.74),
        new THREE.Vector2(cupTopR, cupBaseY + cupH),
        new THREE.Vector2(cupTopR * 0.935, cupBaseY + cupH + 0.012),
        new THREE.Vector2(cupTopR * 0.89, cupBaseY + cupH * 0.88),
        new THREE.Vector2(0, cupBaseY + cupH * 0.86),
      ];
      const cupGeo = new THREE.LatheGeometry(cupPts, 80);
      setCylindricalSideUVs(cupGeo, cupBaseY, cupBaseY + cupH + 0.012, 1);
      cupGeo.computeVertexNormals();

      // Silky microfoam meniscus with subtle surface tension dome & latte art micro-relief
      const foamGeo = buildPhotoSculptedDiscGeo(
        cupTopR * 0.905,
        76,
        (dx, dz, r, u, v) => {
          const rgb: [number, number, number] = [0, 0, 0];
          sampleBicubic(foamRaw, u * (foamRaw.width - 1), v * (foamRaw.height - 1), rgb);
          const lum = (rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114) / 255;
          const dome = Math.pow(Math.cos(r * Math.PI * 0.5), 1.35) * 0.068;
          const meniscusLip = r > 0.88 ? Math.pow((r - 0.88) / 0.12, 2) * 0.018 : 0;
          const milkRelief = lum * 0.012 * (1 - r * r);
          return cupBaseY + cupH - 0.045 + dome + meniscusLip + milkRelief;
        },
        0.49
      );

      const parts: GlbMeshPart[] = [
        { name: 'StonewareSaucer', geometry: saucerGeo, materialIndex: 0 },
        { name: 'CeramicCupBody', geometry: cupGeo, materialIndex: 1 },
        { name: 'LatteArtMicrofoam', geometry: foamGeo, materialIndex: 2 },
      ];

      if (isMatcha) {
        const handleCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(cupTopR * 0.92, cupBaseY + cupH * 0.78, 0),
          new THREE.Vector3(cupTopR * 1.32, cupBaseY + cupH * 0.75, 0),
          new THREE.Vector3(cupTopR * 1.34, cupBaseY + cupH * 0.42, 0),
          new THREE.Vector3(cupTopR * 0.8, cupBaseY + cupH * 0.26, 0),
        ]);
        const handleGeo = new THREE.TubeGeometry(handleCurve, 36, 0.066, 16, false);
        handleGeo.scale(1, 1.12, 0.78);
        setCylindricalSideUVs(handleGeo, cupBaseY + 0.15, cupBaseY + cupH, 1);
        handleGeo.computeVertexNormals();
        parts.push({ name: 'CeramicCupHandle', geometry: handleGeo, materialIndex: 0 });
      }

      return serializeToGlb(
        isMatcha ? 'CeremonialUjiMatchaLatte' : 'WillowHoneyCortado',
        parts,
        [
          {
            name: 'StonewareSaucerMat',
            baseColorTextureIndex: 2,
            normalTextureIndex: 4,
            normalScale: 0.45,
            metallicFactor: 0.02,
            roughnessFactor: 0.26,
          },
          {
            name: 'CeramicCupPlateMat',
            baseColorTextureIndex: 1,
            normalTextureIndex: 4,
            normalScale: 0.55,
            metallicRoughnessTextureIndex: 5,
            metallicFactor: 0.02,
            roughnessFactor: 0.25,
          },
          {
            name: 'SilkyLatteFoamMat',
            baseColorTextureIndex: 0,
            normalTextureIndex: 3,
            normalScale: 0.5,
            metallicRoughnessTextureIndex: 6,
            metallicFactor: 0.0,
            roughnessFactor: 0.28,
          },
        ],
        [
          { name: `${id}-foam-albedo`, data: encodePngRgb(foamRaw) },
          { name: `${id}-cup-albedo`, data: encodePngRgb(cupSideRaw), wrapSRepeat: true },
          { name: `${id}-saucer-albedo`, data: encodePngRgb(saucerStripRaw), wrapSRepeat: true },
          { name: `${id}-foam-normal`, data: foamPbr.normalPng },
          { name: `${id}-cup-normal`, data: cupPbr.normalPng, wrapSRepeat: true },
          { name: `${id}-cup-orm`, data: cupPbr.ormPng, wrapSRepeat: true },
          { name: `${id}-foam-orm`, data: foamPbr.ormPng },
        ]
      );
    }

    // ========================================================================
    // 4 & 7: 18H SINGLE-ORIGIN COLD BREW & POMEGRANATE HIBISCUS SPRITZ
    // ========================================================================
    case 'cold-brew':
    case 'hibiscus-spritz': {
      const isSpritz = id === 'hibiscus-spritz';
      const topRaw = extractCircularTopRaw(views.topView, 0.9, 512);
      const topPbr = buildPbrMapsFromAlbedo(topRaw, {
        normalStrength: 2.3,
        baseRoughness: 0.14,
        glossyDark: true,
        glossyWhiteCream: true,
        size: 256,
      });

      // Strictly sample inside the glass liquid column (insetFrac=0.18 -> zero grey studio backdrop!)
      const sideLiqRaw = buildMaskedSideStripRaw(
        views.sideView,
        views.frontView,
        isSpritz ? 0.28 : 0.23,
        0.77,
        0.18,
        512,
        384
      );
      const sidePbr = buildPbrMapsFromAlbedo(sideLiqRaw, {
        normalStrength: 1.8,
        baseRoughness: 0.14,
        glossyDark: true,
        size: 256,
      });

      const baseR = isSpritz ? 0.68 : 0.61;
      const topR = isSpritz ? 0.79 : 0.76;
      const glassH = isSpritz ? 1.68 : 1.94;
      const botY = -0.3;

      const glassPts = [
        new THREE.Vector2(0, botY),
        new THREE.Vector2(baseR, botY),
        new THREE.Vector2(baseR + 0.015, botY + 0.16),
        new THREE.Vector2(topR, botY + glassH),
        new THREE.Vector2(topR - 0.036, botY + glassH + 0.008),
        new THREE.Vector2(topR - 0.045, botY + glassH - 0.04),
        new THREE.Vector2(baseR - 0.042, botY + 0.19),
        new THREE.Vector2(0, botY + 0.185),
      ];
      const glassGeo = new THREE.LatheGeometry(glassPts, 72);
      glassGeo.deleteAttribute('uv');
      glassGeo.computeVertexNormals();

      const liqBotY = botY + 0.2;
      const liqTopY = botY + glassH - 0.13;
      const liqGeo = new THREE.CylinderGeometry(
        topR - 0.052,
        baseR - 0.048,
        liqTopY - liqBotY,
        72,
        16,
        true
      );
      liqGeo.translate(0, (liqBotY + liqTopY) * 0.5, 0);
      setCylindricalSideUVs(liqGeo, liqBotY, liqTopY, 1);
      liqGeo.computeVertexNormals();

      // Bottom liquid disc cap
      const botCapGeo = new THREE.CircleGeometry(baseR - 0.048, 48);
      botCapGeo.rotateX(Math.PI / 2);
      botCapGeo.translate(0, liqBotY, 0);
      setPlanarTopUVs(botCapGeo, baseR);

      // Photo-sculpted top liquid & real ice-cube crown mapped 1:1 from TOP VIEW
      const crownGeo = buildPhotoSculptedDiscGeo(
        topR - 0.05,
        84,
        (dx, dz, r, u, v) => {
          const rgb: [number, number, number] = [0, 0, 0];
          sampleBicubic(topRaw, u * (topRaw.width - 1), v * (topRaw.height - 1), rgb);
          const lum = (rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114) / 255;
          // Bright translucent ice facets in TOP VIEW rise organically above the meniscus
          const icePeak = Math.max(0, lum - 0.26) * 0.16 * (1 - Math.pow(r, 4));
          const wave = Math.sin(dx * 7 + dz * 6) * 0.012 * (1 - r * r);
          return liqTopY - 0.01 + icePeak + wave;
        },
        0.49
      );

      const parts: GlbMeshPart[] = [
        { name: 'BeverageLiquidColumn', geometry: liqGeo, materialIndex: 1 },
        { name: 'BeverageBottomCap', geometry: botCapGeo, materialIndex: 0 },
        { name: 'PhotoSculptedIceCrown', geometry: crownGeo, materialIndex: 0 },
        { name: 'CrystalTumblerGlass', geometry: glassGeo, materialIndex: 2 },
      ];

      const mats: GlbMaterialSpec[] = [
        {
          name: 'TopMeniscusCompoteMat',
          baseColorTextureIndex: 0,
          normalTextureIndex: 2,
          normalScale: 0.9,
          metallicRoughnessTextureIndex: 4,
          metallicFactor: 0.02,
          roughnessFactor: 0.12,
        },
        {
          name: 'BeverageColumnMat',
          baseColorTextureIndex: 1,
          normalTextureIndex: 3,
          normalScale: 0.65,
          metallicRoughnessTextureIndex: 5,
          metallicFactor: 0.02,
          roughnessFactor: 0.14,
        },
        {
          name: 'CrystalGlassWallMat',
          baseColorFactor: [0.97, 0.98, 0.99, 0.24],
          metallicFactor: 0.06,
          roughnessFactor: 0.04,
          alphaBlend: true,
        },
      ];

      if (isSpritz) {
        // Fresh garden mint sprig & ruby pomegranate arils emerging at rim just like SIDE/FRONT/3-4 views
        const leafGeos: THREE.BufferGeometry[] = [];
        const baseLeaf = createOrganicLeafGeo(0.34, 0.17, 0.055);
        [
          [0.18, 0.35, -0.22, 1.02],
          [-0.24, 2.2, 0.2, 0.86],
          [0.28, 4.1, 0.14, 0.72],
        ].forEach(([rx, ry, rz, sc]) => {
          dummy.position.set(-0.16, liqTopY + 0.09, -0.1);
          dummy.rotation.set(rx, ry, rz);
          dummy.scale.setScalar(sc);
          dummy.updateMatrix();
          const lg = baseLeaf.clone().toNonIndexed();
          lg.applyMatrix4(dummy.matrix);
          lg.computeVertexNormals();
          leafGeos.push(lg);
        });
        parts.push({
          name: 'FreshGardenMintSprig',
          geometry: mergeGeometries(leafGeos, false)!,
          materialIndex: 3,
        });
        mats.push({
          name: 'GardenMintMat',
          baseColorFactor: [0.22, 0.52, 0.16, 1.0],
          metallicFactor: 0.0,
          roughnessFactor: 0.36,
          doubleSided: true,
        });
      }

      return serializeToGlb(
        isSpritz ? 'PomegranateHibiscusSpritz' : 'SingleOriginColdBrew',
        parts,
        mats,
        [
          { name: `${id}-top-albedo`, data: encodePngRgb(topRaw) },
          { name: `${id}-side-albedo`, data: encodePngRgb(sideLiqRaw), wrapSRepeat: true },
          { name: `${id}-top-normal`, data: topPbr.normalPng },
          { name: `${id}-side-normal`, data: sidePbr.normalPng, wrapSRepeat: true },
          { name: `${id}-top-orm`, data: topPbr.ormPng },
          { name: `${id}-side-orm`, data: sidePbr.ormPng, wrapSRepeat: true },
        ]
      );
    }

    // ========================================================================
    // 6: V60 HAND-POURED HUILA RESERVE (CARAFE + RIBBED V60 + KRAFT FILTER)
    // ========================================================================
    case 'pourover-geisha': {
      const brewTopRaw = extractCircularTopRaw(views.topView, 0.72, 384);
      const brewPbr = buildPbrMapsFromAlbedo(brewTopRaw, {
        normalStrength: 1.5,
        baseRoughness: 0.1,
        glossyDark: true,
        size: 256,
      });
      const carafeBrewSideRaw = buildMaskedSideStripRaw(
        views.sideView,
        views.frontView,
        0.72,
        0.84,
        0.18,
        256,
        128
      );
      const kraftFilterRaw = buildMaskedSideStripRaw(
        views.sideView,
        views.frontView,
        0.21,
        0.44,
        0.18,
        256,
        128
      );

      const botY = -0.3;

      // Borosilicate Hario Range Server Carafe
      const carafePts = [
        new THREE.Vector2(0, botY),
        new THREE.Vector2(0.7, botY),
        new THREE.Vector2(0.84, botY + 0.26),
        new THREE.Vector2(0.72, botY + 0.68),
        new THREE.Vector2(0.48, botY + 0.98),
        new THREE.Vector2(0.56, botY + 1.05),
        new THREE.Vector2(0.44, botY + 1.05),
        new THREE.Vector2(0.66, botY + 0.67),
        new THREE.Vector2(0.78, botY + 0.26),
        new THREE.Vector2(0, botY + 0.055),
      ];
      const carafeGeo = new THREE.LatheGeometry(carafePts, 64);
      carafeGeo.deleteAttribute('uv');
      carafeGeo.computeVertexNormals();

      // Brewed deep ruby-mahogany Huila coffee in lower carafe bulb
      const coffeePts = [
        new THREE.Vector2(0, botY + 0.065),
        new THREE.Vector2(0.68, botY + 0.075),
        new THREE.Vector2(0.765, botY + 0.26),
        new THREE.Vector2(0.73, botY + 0.42),
        new THREE.Vector2(0, botY + 0.42),
      ];
      const coffeeGeo = new THREE.LatheGeometry(coffeePts, 64);
      setCylindricalSideUVs(coffeeGeo, botY + 0.065, botY + 0.42, 1);
      coffeeGeo.computeVertexNormals();

      // Upper Hario V60 Glass Cone + Dripper Base Collar
      const v60BaseY = botY + 1.04;
      const v60Pts = [
        new THREE.Vector2(0.58, v60BaseY),
        new THREE.Vector2(0.18, v60BaseY + 0.04),
        new THREE.Vector2(0.79, v60BaseY + 0.78),
        new THREE.Vector2(0.74, v60BaseY + 0.78),
        new THREE.Vector2(0.14, v60BaseY + 0.07),
      ];
      const v60Geo = new THREE.LatheGeometry(v60Pts, 64);
      v60Geo.deleteAttribute('uv');
      v60Geo.computeVertexNormals();

      // Unbleached Kraft V60 Paper Filter Cone rising slightly above glass cone (exact photo match!)
      const filterGeo = new THREE.ConeGeometry(0.81, 0.86, 56, 8, true);
      filterGeo.rotateX(Math.PI);
      filterGeo.translate(0, v60BaseY + 0.49, 0);
      setCylindricalSideUVs(filterGeo, v60BaseY + 0.06, v60BaseY + 0.92, 1);
      filterGeo.computeVertexNormals();

      // Wet dark Huila coffee bloom bed inside filter mapped from TOP VIEW
      const bloomBedGeo = buildPhotoSculptedDiscGeo(
        0.54,
        48,
        (dx, dz, r) =>
          v60BaseY + 0.58 + Math.cos(r * Math.PI * 0.5) * 0.032 + Math.sin(dx * 9 + dz * 9) * 0.008,
        0.49
      );

      // Carafe & V60 glass side handles matching SIDE/FRONT/3-4 views
      const cHandle = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.52, botY + 0.94, 0),
          new THREE.Vector3(1.02, botY + 0.84, 0),
          new THREE.Vector3(1.04, botY + 0.34, 0),
          new THREE.Vector3(0.78, botY + 0.22, 0),
        ]),
        28,
        0.044,
        12,
        false
      );
      cHandle.deleteAttribute('uv');

      const vHandle = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.74, v60BaseY + 0.72, 0),
          new THREE.Vector3(1.06, v60BaseY + 0.66, 0),
          new THREE.Vector3(0.98, v60BaseY + 0.36, 0),
          new THREE.Vector3(0.46, v60BaseY + 0.26, 0),
        ]),
        24,
        0.036,
        10,
        false
      );
      vHandle.deleteAttribute('uv');

      return serializeToGlb(
        'V60HandPouredHuilaReserve',
        [
          { name: 'HuilaCoffeeCarafeFill', geometry: coffeeGeo, materialIndex: 3 },
          { name: 'UnbleachedPaperFilter', geometry: filterGeo, materialIndex: 2 },
          { name: 'CoffeeBloomBed', geometry: bloomBedGeo, materialIndex: 0 },
          { name: 'GlassSharingCarafe', geometry: carafeGeo, materialIndex: 1 },
          { name: 'GlassV60Dripper', geometry: v60Geo, materialIndex: 1 },
          { name: 'CarafeGlassHandle', geometry: cHandle, materialIndex: 1 },
          { name: 'V60GlassHandle', geometry: vHandle, materialIndex: 1 },
        ],
        [
          {
            name: 'WetCoffeeBloomMat',
            baseColorTextureIndex: 0,
            normalTextureIndex: 3,
            normalScale: 0.75,
            metallicRoughnessTextureIndex: 4,
            metallicFactor: 0.02,
            roughnessFactor: 0.14,
          },
          {
            name: 'BorosilicateGlassMat',
            baseColorFactor: [0.97, 0.98, 0.99, 0.25],
            metallicFactor: 0.06,
            roughnessFactor: 0.04,
            alphaBlend: true,
            doubleSided: true,
          },
          {
            name: 'KraftFilterPaperMat',
            baseColorTextureIndex: 2,
            metallicFactor: 0.0,
            roughnessFactor: 0.82,
            doubleSided: true,
          },
          {
            name: 'RubyHuilaBrewCompoteMat',
            baseColorTextureIndex: 1,
            metallicFactor: 0.02,
            roughnessFactor: 0.08,
          },
        ],
        [
          { name: 'v60-bloom-top', data: encodePngRgb(brewTopRaw) },
          { name: 'v60-carafe-brew', data: encodePngRgb(carafeBrewSideRaw), wrapSRepeat: true },
          { name: 'v60-kraft-paper', data: encodePngRgb(kraftFilterRaw), wrapSRepeat: true },
          { name: 'v60-bloom-normal', data: brewPbr.normalPng },
          { name: 'v60-bloom-orm', data: brewPbr.ormPng },
        ]
      );
    }

    // ========================================================================
    // 2: WILD BLUEBERRY BASQUE CHEESECAKE (PHOTO-SCULPTED WEDGE + REAL SIDES)
    // ========================================================================
    case 'blueberry-cheesecake': {
      // Preserve real berry compote puddle on plate while keeping plate rim clean
      const fullTopRaw = extractCircularTopRaw(views.topView, 0.965, 512);
      const topPbr = buildPbrMapsFromAlbedo(fullTopRaw, {
        normalStrength: 2.3,
        baseRoughness: 0.34,
        glossyDark: true,
        glossyWhiteCream: true,
        size: 256,
      });

      // Extract clean masked Basque cheese + cookie crust + purple drip side cross-section!
      const sideCheeseRaw = buildMaskedSideStripRaw(
        views.sideView,
        views.frontView,
        0.38,
        0.66,
        0.16,
        512,
        256
      );
      const sidePbr = buildPbrMapsFromAlbedo(sideCheeseRaw, {
        normalStrength: 1.9,
        baseRoughness: 0.42,
        glossyDark: true,
        size: 256,
      });

      const plateR = 1.72;
      const plateFloorY = -0.22;
      const plateGeo = buildCoupePlateGeo(plateR, -0.3, 0.22);

      // Exact Basque Cheesecake Wedge geometry aligned with the slice in TOP VIEW!
      // In TOP VIEW, wedge tip points toward bottom-left (~2.45 rad) and curved burnt crust is at top-right (~-0.70 rad)
      const tipX = -0.52;
      const tipZ = 0.48;
      const bisectorAng = -0.72; // points toward top-right curved crust
      const halfSpan = 0.48; // ~55 deg wedge angle
      const wedgeLen = 1.38;
      const cakeH = 0.58;

      const cBis = Math.cos(bisectorAng);
      const sBis = Math.sin(bisectorAng);

      // 1. Side walls & cookie base extruded cleanly along the exact TOP VIEW wedge footprint
      const shape2D = new THREE.Shape();
      // ExtrudeGeometry + rotateX(-PI/2) maps shapeY -> -worldZ, so negate Z when building 2D shape!
      const pLeftX = tipX + Math.cos(bisectorAng - halfSpan) * wedgeLen;
      const pLeftZ = tipZ + Math.sin(bisectorAng - halfSpan) * wedgeLen;
      shape2D.moveTo(tipX, -tipZ);
      shape2D.lineTo(pLeftX, -pLeftZ);
      shape2D.absarc(
        tipX,
        -tipZ,
        wedgeLen,
        -(bisectorAng - halfSpan),
        -(bisectorAng + halfSpan),
        true
      );
      shape2D.closePath();

      const wedgeWallGeo = new THREE.ExtrudeGeometry(shape2D, {
        depth: cakeH,
        bevelEnabled: false,
        curveSegments: 36,
      });
      wedgeWallGeo.rotateX(-Math.PI / 2);
      wedgeWallGeo.translate(0, plateFloorY + 0.01, 0);

      // Map side cross-section UVs cleanly along distance from tip (u) and height (v)
      const wPos = wedgeWallGeo.attributes.position;
      const wUvs = new Float32Array(wPos.count * 2);
      for (let i = 0; i < wPos.count; i++) {
        const x = wPos.getX(i);
        const y = wPos.getY(i);
        const z = wPos.getZ(i);
        const along = ((x - tipX) * cBis + (z - tipZ) * sBis) / wedgeLen;
        const u = Math.max(0.04, Math.min(0.96, along * 0.48 + 0.02));
        const v = 1 - Math.max(0.03, Math.min(0.97, (y - plateFloorY) / (cakeH + 0.02)));
        wUvs[i * 2] = u;
        wUvs[i * 2 + 1] = v;
      }
      wedgeWallGeo.setAttribute('uv', new THREE.BufferAttribute(wUvs, 2));
      wedgeWallGeo.computeVertexNormals();

      // 2. High-density photo-sculpted top crown of the wedge (real berries & burnt Basque ridge from TOP VIEW!)
      const segU = 56;
      const segV = 44;
      const topVerts: number[] = [];
      const topUvs: number[] = [];
      const topIndices: number[] = [];
      const rgb: [number, number, number] = [0, 0, 0];

      for (let iu = 0; iu <= segU; iu++) {
        const rFrac = iu / segU; // 0 at tip -> 1 at burnt Basque back crust
        const rad = rFrac * wedgeLen;
        for (let iv = 0; iv <= segV; iv++) {
          const aFrac = (iv / segV) * 2 - 1; // -1 .. +1 across wedge width
          const ang = bisectorAng + aFrac * halfSpan;
          const wx = tipX + Math.cos(ang) * rad;
          const wz = tipZ + Math.sin(ang) * rad;

          const u = wx / (plateR * 2) + 0.5;
          const v = wz / (plateR * 2) + 0.5;
          sampleBicubic(fullTopRaw, u * (fullTopRaw.width - 1), v * (fullTopRaw.height - 1), rgb);
          const lum = (rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114) / 255;

          // Dark purple blueberries (low lum, blue/red tint) bulge up as plump 3D berries!
          const isBerry = lum < 0.34 && rFrac < 0.86 ? (0.34 - lum) * 0.42 : 0;
          // Raised caramelized Basque rim at the back arc (rFrac > 0.82)
          const basqueLip = rFrac > 0.8 ? Math.sin(((rFrac - 0.8) / 0.2) * Math.PI) * 0.085 : 0;
          // Slight bevel tuck right at the cut edges so top meets side walls seamlessly
          const edgeBevel =
            rFrac < 0.04 || rFrac > 0.98 || Math.abs(aFrac) > 0.96 ? -0.012 : 0.012;

          const wy = plateFloorY + 0.01 + cakeH + isBerry + basqueLip + edgeBevel;
          topVerts.push(wx, wy, wz);
          topUvs.push(u, v);
        }
      }

      for (let iu = 0; iu < segU; iu++) {
        for (let iv = 0; iv < segV; iv++) {
          const a = iu * (segV + 1) + iv;
          const b = a + 1;
          const c = (iu + 1) * (segV + 1) + iv;
          const d = c + 1;
          topIndices.push(a, c, b, b, c, d);
        }
      }

      const wedgeCrownGeo = new THREE.BufferGeometry();
      wedgeCrownGeo.setAttribute('position', new THREE.Float32BufferAttribute(topVerts, 3));
      wedgeCrownGeo.setAttribute('uv', new THREE.Float32BufferAttribute(topUvs, 2));
      wedgeCrownGeo.setIndex(topIndices);
      wedgeCrownGeo.computeVertexNormals();

      // 3. Caramelized Basque outer arc crust band along r = wedgeLen
      const backArcShape = new THREE.Shape();
      backArcShape.absarc(
        tipX,
        -tipZ,
        wedgeLen + 0.018,
        -(bisectorAng - halfSpan),
        -(bisectorAng + halfSpan),
        true
      );
      backArcShape.absarc(
        tipX,
        -tipZ,
        wedgeLen - 0.07,
        -(bisectorAng + halfSpan),
        -(bisectorAng - halfSpan),
        false
      );
      backArcShape.closePath();
      const burntBackGeo = new THREE.ExtrudeGeometry(backArcShape, {
        depth: cakeH + 0.055,
        bevelEnabled: true,
        bevelThickness: 0.018,
        bevelSize: 0.014,
        bevelSegments: 2,
        curveSegments: 28,
      });
      burntBackGeo.rotateX(-Math.PI / 2);
      burntBackGeo.translate(0, plateFloorY + 0.008, 0);
      burntBackGeo.deleteAttribute('uv');
      burntBackGeo.computeVertexNormals();

      return serializeToGlb(
        'WildBlueberryBasqueCheesecake',
        [
          { name: 'CeramicCoupePlate', geometry: plateGeo, materialIndex: 0 },
          { name: 'CreamyBasqueWedgeSides', geometry: wedgeWallGeo, materialIndex: 1 },
          { name: 'PhotoSculptedBlueberryCrown', geometry: wedgeCrownGeo, materialIndex: 2 },
          { name: 'CaramelizedBasqueBackCrust', geometry: burntBackGeo, materialIndex: 3 },
        ],
        [
          {
            name: 'CoupePlateMat',
            baseColorTextureIndex: 0,
            normalTextureIndex: 2,
            normalScale: 0.45,
            metallicRoughnessTextureIndex: 4,
            metallicFactor: 0.02,
            roughnessFactor: 0.24,
          },
          {
            name: 'BasqueCheeseSliceSideMat',
            baseColorTextureIndex: 1,
            normalTextureIndex: 3,
            normalScale: 0.7,
            metallicRoughnessTextureIndex: 5,
            metallicFactor: 0.0,
            roughnessFactor: 0.42,
          },
          {
            name: 'BlueberryCompoteCrownMat',
            baseColorTextureIndex: 0,
            normalTextureIndex: 2,
            normalScale: 0.95,
            metallicRoughnessTextureIndex: 4,
            metallicFactor: 0.02,
            roughnessFactor: 0.16,
            doubleSided: true,
          },
          {
            name: 'CaramelizedBasqueCrustMat',
            baseColorFactor: [0.33, 0.16, 0.08, 1],
            metallicFactor: 0.0,
            roughnessFactor: 0.54,
          },
        ],
        [
          { name: 'cheesecake-top-albedo', data: encodePngRgb(fullTopRaw) },
          { name: 'cheesecake-side-albedo', data: encodePngRgb(sideCheeseRaw) },
          { name: 'cheesecake-top-normal', data: topPbr.normalPng },
          { name: 'cheesecake-side-normal', data: sidePbr.normalPng },
          { name: 'cheesecake-top-orm', data: topPbr.ormPng },
          { name: 'cheesecake-side-orm', data: sidePbr.ormPng },
        ]
      );
    }

    // ========================================================================
    // 12: VALRHONA 70% WARM SKILLET BROWNIE (PHOTO-SCULPTED SCOOP & DRIZZLE)
    // ========================================================================
    case 'skillet-brownie': {
      // Extract the inner cast-iron skillet food well (brownie + vanilla gelato scoop + chocolate drizzle)
      const bounds = detectSubjectCircleInTopView(views.topView);
      // Skillet handle extends to top-right, so center the circular pan well slightly left-down of full bbox
      const panCx = views.topView.width * 0.455;
      const panCy = views.topView.height * 0.525;
      const panRadPx = Math.min(bounds.rx, bounds.ry) * 0.76;

      const size = 512;
      const brownieRgba = new Uint8Array(size * size * 4);
      const rgb: [number, number, number] = [0, 0, 0];
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const nx = (x + 0.5) / (size * 0.5) - 1;
          const nz = (y + 0.5) / (size * 0.5) - 1;
          const r = Math.min(0.98, Math.hypot(nx, nz));
          const ang = Math.atan2(nz, nx);
          sampleBicubic(
            views.topView,
            panCx + Math.cos(ang) * r * panRadPx,
            panCy + Math.sin(ang) * r * panRadPx,
            rgb
          );
          const di = (y * size + x) * 4;
          brownieRgba[di] = rgb[0];
          brownieRgba[di + 1] = rgb[1];
          brownieRgba[di + 2] = rgb[2];
          brownieRgba[di + 3] = 255;
        }
      }
      const brownieTopRaw: RawImage = { width: size, height: size, rgba: brownieRgba };
      const browniePbr = buildPbrMapsFromAlbedo(brownieTopRaw, {
        normalStrength: 2.3,
        baseRoughness: 0.44,
        glossyDark: true,
        glossyWhiteCream: true,
        size: 256,
      });

      // Cork trivet coaster
      const corkGeo = new THREE.CylinderGeometry(1.3, 1.26, 0.08, 64);
      corkGeo.translate(0, -0.26, 0);
      corkGeo.deleteAttribute('uv');

      // Matte black seasoned cast-iron skillet body with pouring spouts feel
      const panR = 1.46;
      const panPts = [
        new THREE.Vector2(0, -0.22),
        new THREE.Vector2(1.26, -0.22),
        new THREE.Vector2(panR, 0.28),
        new THREE.Vector2(panR - 0.075, 0.3),
        new THREE.Vector2(1.22, -0.12),
        new THREE.Vector2(0, -0.12),
      ];
      const panGeo = new THREE.LatheGeometry(panPts, 76);
      panGeo.deleteAttribute('uv');
      panGeo.computeVertexNormals();

      // Authentic flat teardrop cast-iron handle with hanging hole (matching TOP & 3/4 views!)
      const hShape = new THREE.Shape();
      hShape.moveTo(panR - 0.1, -0.12);
      hShape.quadraticCurveTo(panR + 0.42, -0.09, panR + 0.86, -0.16);
      hShape.absarc(panR + 0.92, 0, 0.16, -Math.PI * 0.5, Math.PI * 0.5, false);
      hShape.quadraticCurveTo(panR + 0.42, 0.09, panR - 0.1, 0.12);
      hShape.closePath();

      const holePath = new THREE.Path();
      holePath.absarc(panR + 0.9, 0, 0.055, 0, Math.PI * 2, true);
      hShape.holes.push(holePath);

      const handleGeo = new THREE.ExtrudeGeometry(hShape, {
        depth: 0.065,
        bevelEnabled: true,
        bevelThickness: 0.015,
        bevelSize: 0.012,
        bevelSegments: 2,
        curveSegments: 20,
      });
      handleGeo.rotateX(-Math.PI / 2);
      handleGeo.translate(0, 0.22, 0);
      handleGeo.deleteAttribute('uv');
      handleGeo.computeVertexNormals();

      // Continuous 96x96 3D sculpted brownie + central Madagascar vanilla gelato scoop + real chocolate drizzle!
      const dessertGeo = buildPhotoSculptedDiscGeo(
        1.29,
        96,
        (dx, dz, r, u, v) => {
          sampleBicubic(brownieTopRaw, u * (size - 1), v * (size - 1), rgb);
          const lum = (rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114) / 255;

          // Central gelato scoop sits around (dx: -0.02, dz: -0.03) with radius ~0.39 in pan space
          const scoopR = Math.hypot(dx + 0.02, dz + 0.03) / 0.41;
          const scoopDome =
            scoopR < 1 ? Math.sqrt(Math.max(0, 1 - scoopR * scoopR)) * 0.46 : 0;

          // Fudge brownie base bed + walnut chunks & crinkly crust relief
          const brownieBase = 0.06 + (1 - r * r) * 0.09 + lum * 0.045 * (scoopR >= 1 ? 1 : 0.2);
          const crinkle = Math.sin(dx * 14 + dz * 11) * 0.012 * (1 - r * r);
          return brownieBase + scoopDome + crinkle;
        },
        0.49
      );

      return serializeToGlb(
        'ValrhonaWarmSkilletBrownie',
        [
          { name: 'CorkTrivetCoaster', geometry: corkGeo, materialIndex: 2 },
          { name: 'CastIronSkilletPan', geometry: panGeo, materialIndex: 0 },
          { name: 'CastIronTeardropHandle', geometry: handleGeo, materialIndex: 0, rotationY: 0.62 },
          { name: 'PhotoSculptedBrownieAndGelato', geometry: dessertGeo, materialIndex: 1 },
        ],
        [
          {
            name: 'SeasonedCastIronMat',
            baseColorFactor: [0.11, 0.11, 0.12, 1],
            metallicFactor: 0.48,
            roughnessFactor: 0.5,
          },
          {
            name: 'ValrhonaAndGelatoGanacheMat',
            baseColorTextureIndex: 0,
            normalTextureIndex: 1,
            normalScale: 0.85,
            metallicRoughnessTextureIndex: 2,
            metallicFactor: 0.0,
            roughnessFactor: 0.34,
          },
          {
            name: 'CorkTrivetMat',
            baseColorFactor: [0.69, 0.51, 0.33, 1],
            metallicFactor: 0.0,
            roughnessFactor: 0.86,
          },
        ],
        [
          { name: 'brownie-top-albedo', data: encodePngRgb(brownieTopRaw) },
          { name: 'brownie-top-normal', data: browniePbr.normalPng },
          { name: 'brownie-top-orm', data: browniePbr.ormPng },
        ]
      );
    }

    // ========================================================================
    // 13: BROWN BUTTER & GREEN CARDAMOM KNOT (WATERTIGHT PHOTO-SCULPTED BUN)
    // ========================================================================
    case 'cardamom-knot': {
      const cleanPlateRaw = buildCleanPlateFromTopRaw(views.topView, 0.68, 0.88, 0.965, 384);
      const topFullRaw = extractCircularTopRaw(views.topView, 0.965, 512);
      const topPbr = buildPbrMapsFromAlbedo(topFullRaw, {
        normalStrength: 2.5,
        baseRoughness: 0.34,
        glossyDark: true,
        size: 256,
      });

      const briocheSideRaw = buildMaskedSideStripRaw(
        views.sideView,
        views.frontView,
        0.26,
        0.69,
        0.16,
        512,
        256
      );
      const sidePbr = buildPbrMapsFromAlbedo(briocheSideRaw, {
        normalStrength: 1.9,
        baseRoughness: 0.42,
        size: 256,
      });

      const plateR = 1.68;
      const floorY = -0.22;
      const plateGeo = buildCoupePlateGeo(plateR, -0.3, 0.2);

      // Sculpt true 3D multi-tiered Scandinavian cardamom knot from TOP + SIDE profiles!
      const { crownGeo, sideSkirtGeo } = buildWatertightSculptedPastryParts(
        topFullRaw,
        96,
        plateR,
        plateR,
        floorY,
        (nx, nz, lum, rgb) => {
          // Bun occupies central ~62% of the plate radius with organic braided lobes
          const r = Math.hypot(nx / 0.61, nz / 0.63);
          const sat = (Math.max(rgb[0], rgb[1], rgb[2]) - Math.min(rgb[0], rgb[1], rgb[2])) / 255;
          const inside = Math.max(0, Math.min(1, (1.04 - r) / 0.16));
          // Two-tier Scandinavian knot profile visible in SIDE/FRONT views: plump base + braided top knot
          const baseDome = Math.pow(Math.max(0, 1 - Math.min(1, r * 0.95) ** 2), 0.72) * 0.48;
          const upperKnot =
            r < 0.68 ? Math.pow(Math.cos((r / 0.68) * Math.PI * 0.5), 1.3) * 0.34 : 0;
          const braidCrevices = (lum * 0.085 + sat * 0.045) * inside;
          return { inside, topY: baseDome + upperKnot + braidCrevices };
        }
      );

      return serializeToGlb(
        'BrownButterCardamomKnot',
        [
          { name: 'SpeckledPastryPlate', geometry: plateGeo, materialIndex: 0 },
          { name: 'GoldenBriocheLowerSkirt', geometry: sideSkirtGeo, materialIndex: 2 },
          { name: 'PhotoSculptedCardamomCrown', geometry: crownGeo, materialIndex: 1 },
        ],
        [
          {
            name: 'CleanPastryPlateMat',
            baseColorTextureIndex: 0,
            metallicFactor: 0.02,
            roughnessFactor: 0.24,
          },
          {
            name: 'GlazedCardamomCrownMat',
            baseColorTextureIndex: 1,
            normalTextureIndex: 3,
            normalScale: 0.95,
            metallicRoughnessTextureIndex: 5,
            metallicFactor: 0.02,
            roughnessFactor: 0.3,
          },
          {
            name: 'BakedBriocheSideMat',
            baseColorTextureIndex: 2,
            normalTextureIndex: 4,
            normalScale: 0.75,
            metallicRoughnessTextureIndex: 6,
            metallicFactor: 0.0,
            roughnessFactor: 0.42,
          },
        ],
        [
          { name: 'cardamom-plate-clean', data: encodePngRgb(cleanPlateRaw) },
          { name: 'cardamom-top-albedo', data: encodePngRgb(topFullRaw) },
          { name: 'cardamom-side-albedo', data: encodePngRgb(briocheSideRaw), wrapSRepeat: true },
          { name: 'cardamom-top-normal', data: topPbr.normalPng },
          { name: 'cardamom-side-normal', data: sidePbr.normalPng, wrapSRepeat: true },
          { name: 'cardamom-top-orm', data: topPbr.ormPng },
          { name: 'cardamom-side-orm', data: sidePbr.ormPng, wrapSRepeat: true },
        ]
      );
    }

    // ========================================================================
    // 14: TWICE-BAKED ROASTED ALMOND CROISSANT (SCULPTED CRESCENT + FLAKES)
    // ========================================================================
    case 'almond-croissant': {
      const cleanPlateRaw = buildCleanPlateFromTopRaw(views.topView, 0.76, 0.91, 0.965, 384);
      const topFullRaw = extractCircularTopRaw(views.topView, 0.965, 512);
      const topPbr = buildPbrMapsFromAlbedo(topFullRaw, {
        normalStrength: 2.6,
        baseRoughness: 0.42,
        size: 256,
      });

      const croissantSideRaw = buildMaskedSideStripRaw(
        views.sideView,
        views.frontView,
        0.38,
        0.69,
        0.14,
        512,
        256
      );
      const sidePbr = buildPbrMapsFromAlbedo(croissantSideRaw, {
        normalStrength: 2.2,
        baseRoughness: 0.48,
        size: 256,
      });

      const plateR = 1.7;
      const floorY = -0.22;
      const plateGeo = buildCoupePlateGeo(plateR, -0.3, 0.2);

      // In TOP VIEW, the diamond/crescent almond croissant runs along Z (vertical axis of TOP VIEW: dz in [-0.90, +0.90], dx width tapers toward tips!)
      const { crownGeo, sideSkirtGeo } = buildWatertightSculptedPastryParts(
        topFullRaw,
        104,
        plateR,
        plateR,
        floorY,
        (nx, nz, lum, rgb) => {
          // Exact diamond/crescent envelope matching TOP VIEW croissant!
          const lenT = Math.abs(nz) / 0.89;
          const halfWidthAtZ = Math.max(0.08, 0.52 * Math.pow(Math.max(0, 1 - lenT * lenT), 0.72));
          const d = Math.hypot(lenT, nx / halfWidthAtZ);
          const inside = Math.max(0, Math.min(1, (1.04 - d) / 0.14));

          // Laminated croissant arch profile from SIDE/FRONT views (tall flaky center, tapering crisp tips)
          const archLong = Math.pow(Math.max(0, 1 - Math.min(1, lenT) ** 1.75), 0.85);
          const archCross = Math.pow(
            Math.max(0, 1 - Math.min(1, Math.abs(nx) / halfWidthAtZ) ** 1.9),
            0.75
          );
          // Laminated dough bands + flaked almond & snow-sugar crown relief
          const laminationWave = Math.cos(nz * 15.5) * 0.022 * archLong;
          const almondFlakeRelief = lum * 0.065 * archCross;
          const topY = (0.64 * archLong * archCross + laminationWave + almondFlakeRelief) * inside;
          return { inside, topY };
        }
      );

      return serializeToGlb(
        'TwiceBakedAlmondCroissant',
        [
          { name: 'SpeckledPastryPlate', geometry: plateGeo, materialIndex: 0 },
          { name: 'LaminatedCroissantLowerCrust', geometry: sideSkirtGeo, materialIndex: 2, rotationY: 1.25 },
          { name: 'PhotoSculptedAlmondCroissantCrown', geometry: crownGeo, materialIndex: 1, rotationY: 1.25 },
        ],
        [
          {
            name: 'CleanPastryPlateMat',
            baseColorTextureIndex: 0,
            metallicFactor: 0.02,
            roughnessFactor: 0.24,
          },
          {
            name: 'FlakyAlmondCroissantTopMat',
            baseColorTextureIndex: 1,
            normalTextureIndex: 3,
            normalScale: 1.0,
            metallicRoughnessTextureIndex: 5,
            metallicFactor: 0.0,
            roughnessFactor: 0.42,
          },
          {
            name: 'GoldenCroissantPerimeterMat',
            baseColorTextureIndex: 2,
            normalTextureIndex: 4,
            normalScale: 0.85,
            metallicRoughnessTextureIndex: 6,
            metallicFactor: 0.0,
            roughnessFactor: 0.48,
          },
        ],
        [
          { name: 'croissant-plate-clean', data: encodePngRgb(cleanPlateRaw) },
          { name: 'croissant-top-albedo', data: encodePngRgb(topFullRaw) },
          { name: 'croissant-side-albedo', data: encodePngRgb(croissantSideRaw), wrapSRepeat: true },
          { name: 'croissant-top-normal', data: topPbr.normalPng },
          { name: 'croissant-side-normal', data: sidePbr.normalPng, wrapSRepeat: true },
          { name: 'croissant-top-orm', data: topPbr.ormPng },
          { name: 'croissant-side-orm', data: sidePbr.ormPng, wrapSRepeat: true },
        ]
      );
    }

    default:
      return null;
  }
}
