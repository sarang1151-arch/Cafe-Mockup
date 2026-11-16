import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  buildCleanPlateFromTopRaw,
  buildMaskedSideStripRaw,
  buildPbrMapsFromAlbedo,
  cropResizeCrisp,
  encodePngRgb,
  extractCircularTopRaw,
  RawImage,
  sampleBicubic,
} from './imagePbrUtils';
import {
  buildCoupePlateGeo,
  buildPhotoSculptedDiscGeo,
  createOrganicLeafGeo,
  GlbMeshPart,
  serializeToGlb,
  setCylindricalSideUVs,
} from './glbSerializer';
import type { DishMultiViews } from './dishesDrinksAndSweets';

export function buildSavoryAndBowlsGlb(id: string, views: DishMultiViews): Buffer | null {
  const dummy = new THREE.Object3D();

  switch (id) {
    // ========================================================================
    // 3: WILD MUSHROOM & TRUFFLE TAGLIATELLE (100% PHOTO-SCULPTED NEST)
    // ========================================================================
    case 'truffle-pasta': {
      const pastaTopRaw = extractCircularTopRaw(views.topView, 0.89, 512);
      const pastaPbr = buildPbrMapsFromAlbedo(pastaTopRaw, {
        normalStrength: 2.6,
        baseRoughness: 0.32,
        glossyDark: true,
        glossyWhiteCream: true,
        size: 256,
      });

      const bowlSideRaw = buildMaskedSideStripRaw(
        views.sideView,
        views.frontView,
        0.55,
        0.72,
        0.14,
        512,
        256
      );
      const bowlPbr = buildPbrMapsFromAlbedo(bowlSideRaw, {
        normalStrength: 1.3,
        baseRoughness: 0.26,
        size: 256,
      });

      const bowlR = 1.68;
      const bowlPts = [
        new THREE.Vector2(0, -0.3),
        new THREE.Vector2(0.88, -0.3),
        new THREE.Vector2(1.38, -0.09),
        new THREE.Vector2(bowlR, 0.28),
        new THREE.Vector2(bowlR - 0.055, 0.31),
        new THREE.Vector2(bowlR - 0.115, 0.24),
        new THREE.Vector2(1.2, -0.05),
        new THREE.Vector2(0, -0.12),
      ];
      const bowlGeo = new THREE.LatheGeometry(bowlPts, 84);
      setCylindricalSideUVs(bowlGeo, -0.3, 0.31, 1);
      bowlGeo.computeVertexNormals();

      const rgb: [number, number, number] = [0, 0, 0];
      const moundGeo = buildPhotoSculptedDiscGeo(
        1.48,
        104,
        (dx, dz, r, u, v) => {
          sampleBicubic(
            pastaTopRaw,
            u * (pastaTopRaw.width - 1),
            v * (pastaTopRaw.height - 1),
            rgb
          );
          const lum = (rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114) / 255;
          // Twirled chef's pasta mound matching SIDE/FRONT views + shaved Parmigiano peak in center
          const dome = Math.pow(Math.cos(r * Math.PI * 0.5), 1.35) * 0.44;
          const parmigianoPeak =
            r < 0.36 ? Math.cos((r / 0.36) * Math.PI * 0.5) * 0.09 * lum : 0;
          const ribbonRelief = (lum - 0.4) * 0.095 * (1 - Math.pow(r, 3));
          const organicTwirl =
            Math.sin(Math.atan2(dz, dx) * 5 + r * 10) * 0.022 * (1 - r * r);
          return 0.09 + dome + parmigianoPeak + ribbonRelief + organicTwirl;
        },
        0.49
      );

      return serializeToGlb(
        'WildMushroomTruffleTagliatelle',
        [
          { name: 'SpeckledStonewarePastaBowl', geometry: bowlGeo, materialIndex: 0 },
          { name: 'PhotoSculptedTagliatelleMound', geometry: moundGeo, materialIndex: 1 },
        ],
        [
          {
            name: 'StonewareBowlMat',
            baseColorTextureIndex: 1,
            normalTextureIndex: 3,
            normalScale: 0.45,
            metallicRoughnessTextureIndex: 5,
            metallicFactor: 0.02,
            roughnessFactor: 0.26,
          },
          {
            name: 'TruffleTagliatelleMoundMat',
            baseColorTextureIndex: 0,
            normalTextureIndex: 2,
            normalScale: 0.95,
            metallicRoughnessTextureIndex: 4,
            metallicFactor: 0.0,
            roughnessFactor: 0.32,
          },
        ],
        [
          { name: 'pasta-top-albedo', data: encodePngRgb(pastaTopRaw) },
          { name: 'pasta-bowl-albedo', data: encodePngRgb(bowlSideRaw), wrapSRepeat: true },
          { name: 'pasta-top-normal', data: pastaPbr.normalPng },
          { name: 'pasta-bowl-normal', data: bowlPbr.normalPng, wrapSRepeat: true },
          { name: 'pasta-top-orm', data: pastaPbr.ormPng },
          { name: 'pasta-bowl-orm', data: bowlPbr.ormPng, wrapSRepeat: true },
        ]
      );
    }

    // ========================================================================
    // 8: AMAZONIAN ACAI & TOASTED PECAN BOWL (100% PHOTO-SCULPTED TOPPINGS)
    // ========================================================================
    case 'acai-bowl': {
      const acaiTopRaw = extractCircularTopRaw(views.topView, 0.9, 512);
      const acaiPbr = buildPbrMapsFromAlbedo(acaiTopRaw, {
        normalStrength: 2.4,
        baseRoughness: 0.28,
        glossyDark: true,
        glossyWhiteCream: true,
        size: 256,
      });

      const bowlSideRaw = buildMaskedSideStripRaw(
        views.sideView,
        views.frontView,
        0.48,
        0.74,
        0.15,
        512,
        256
      );
      const bowlPbr = buildPbrMapsFromAlbedo(bowlSideRaw, {
        normalStrength: 1.4,
        baseRoughness: 0.28,
        size: 256,
      });

      const bowlR = 1.5;
      const bowlPts = [
        new THREE.Vector2(0, -0.3),
        new THREE.Vector2(0.74, -0.3),
        new THREE.Vector2(1.24, -0.04),
        new THREE.Vector2(bowlR, 0.56),
        new THREE.Vector2(bowlR - 0.065, 0.585),
        new THREE.Vector2(bowlR - 0.115, 0.49),
        new THREE.Vector2(0, 0.44),
      ];
      const bowlGeo = new THREE.LatheGeometry(bowlPts, 80);
      setCylindricalSideUVs(bowlGeo, -0.3, 0.585, 1);
      bowlGeo.computeVertexNormals();

      const rgb: [number, number, number] = [0, 0, 0];
      const acaiGeo = buildPhotoSculptedDiscGeo(
        bowlR - 0.085,
        104,
        (dx, dz, r, u, v) => {
          sampleBicubic(
            acaiTopRaw,
            u * (acaiTopRaw.width - 1),
            v * (acaiTopRaw.height - 1),
            rgb
          );
          const rN = rgb[0] / 255;
          const gN = rgb[1] / 255;
          const bN = rgb[2] / 255;
          const lum = rN * 0.299 + gN * 0.587 + bN * 0.114;

          // Sculpt real fruit & granola relief directly under exact pixels in TOP VIEW!
          const isBanana = lum > 0.68 ? (lum - 0.68) * 0.28 : 0;
          const isStrawberry = rN - gN > 0.28 && rN > 0.45 ? (rN - gN) * 0.22 : 0;
          const isGranola = rN > 0.42 && gN > 0.26 && bN < 0.25 ? 0.045 * lum : 0;
          const isBlueberry = lum < 0.16 && r < 0.88 ? (0.16 - lum) * 0.34 : 0;

          const baseSmoothie = 0.47 + Math.pow(Math.cos(r * Math.PI * 0.5), 1.65) * 0.095;
          const edgeTuck = r > 0.92 ? -((r - 0.92) / 0.08) * 0.03 : 0;
          return (
            baseSmoothie +
            (isBanana + isStrawberry + isGranola + isBlueberry) * (1 - Math.pow(r, 4)) +
            edgeTuck
          );
        },
        0.49
      );

      return serializeToGlb(
        'AmazonianAcaiPecanBowl',
        [
          { name: 'SpeckledSmoothieBowl', geometry: bowlGeo, materialIndex: 0 },
          { name: 'PhotoSculptedAcaiFruitSurface', geometry: acaiGeo, materialIndex: 1 },
        ],
        [
          {
            name: 'SmoothieBowlCeramicMat',
            baseColorTextureIndex: 1,
            normalTextureIndex: 3,
            normalScale: 0.45,
            metallicRoughnessTextureIndex: 5,
            metallicFactor: 0.02,
            roughnessFactor: 0.28,
          },
          {
            name: 'AcaiFruitCompoteMat',
            baseColorTextureIndex: 0,
            normalTextureIndex: 2,
            normalScale: 0.9,
            metallicRoughnessTextureIndex: 4,
            metallicFactor: 0.0,
            roughnessFactor: 0.28,
          },
        ],
        [
          { name: 'acai-top-albedo', data: encodePngRgb(acaiTopRaw) },
          { name: 'acai-bowl-albedo', data: encodePngRgb(bowlSideRaw), wrapSRepeat: true },
          { name: 'acai-top-normal', data: acaiPbr.normalPng },
          { name: 'acai-bowl-normal', data: bowlPbr.normalPng, wrapSRepeat: true },
          { name: 'acai-top-orm', data: acaiPbr.ormPng },
          { name: 'acai-bowl-orm', data: bowlPbr.ormPng, wrapSRepeat: true },
        ]
      );
    }

    // ========================================================================
    // 9: TUSCAN FOCACCIA & SMOKED PROVOLONE PRESS (CLEAN PLATE + LAYERED CUTS)
    // ========================================================================
    case 'tuscan-panini': {
      const cleanPlateRaw = buildCleanPlateFromTopRaw(views.topView, 0.78, 0.92, 0.96, 384);
      const topFullRaw = extractCircularTopRaw(views.topView, 0.96, 512);
      const topPbr = buildPbrMapsFromAlbedo(topFullRaw, {
        normalStrength: 2.4,
        baseRoughness: 0.44,
        glossyWarmYolk: true,
        size: 256,
      });

      // Full vertical sandwich cross-section (top bread + melted provolone + heirloom tomato + pesto + bottom bread)
      const sidePressRaw = buildMaskedSideStripRaw(
        views.sideView,
        views.frontView,
        0.41,
        0.67,
        0.1,
        512,
        256
      );
      const sidePbr = buildPbrMapsFromAlbedo(sidePressRaw, {
        normalStrength: 2.2,
        baseRoughness: 0.4,
        glossyWarmYolk: true,
        glossyWhiteCream: true,
        size: 256,
      });

      const plateR = 1.72;
      const floorY = -0.22;
      const plateGeo = buildCoupePlateGeo(plateR, -0.3, 0.2);

      // Exact pressed focaccia rectangle dimensions & diagonal angle in TOP VIEW
      const hw = 0.88;
      const hd = 0.6;
      const cornerR = 0.075;
      const sandwichH = 0.56;
      const paniniAngle = 0.68; // matches diagonal focaccia orientation in TOP VIEW!

      const focShape = new THREE.Shape();
      focShape.moveTo(-hw + cornerR, -hd);
      focShape.lineTo(hw - cornerR, -hd);
      focShape.quadraticCurveTo(hw, -hd, hw, -hd + cornerR);
      focShape.lineTo(hw, hd - cornerR);
      focShape.quadraticCurveTo(hw, hd, hw - cornerR, hd);
      focShape.lineTo(-hw + cornerR, hd);
      focShape.quadraticCurveTo(-hw, hd, -hw, hd - cornerR);
      focShape.lineTo(-hw, -hd + cornerR);
      focShape.quadraticCurveTo(-hw, -hd, -hw + cornerR, -hd);

      // Perimeter wall of the whole pressed sandwich mapped with real layered SIDE + FRONT cross-section!
      const sideWallGeo = new THREE.ExtrudeGeometry(focShape, {
        depth: sandwichH,
        bevelEnabled: false,
        curveSegments: 16,
      });
      sideWallGeo.rotateX(-Math.PI / 2);
      sideWallGeo.translate(0, floorY + 0.015, 0);
      setCylindricalSideUVs(sideWallGeo, floorY + 0.015, floorY + 0.015 + sandwichH, 2);
      sideWallGeo.computeVertexNormals();

      // Sculpted golden rosemary & sea-salt top focaccia crown mapped 1:1 from TOP VIEW!
      const topCrownGeo = new THREE.PlaneGeometry(hw * 2, hd * 2, 64, 48);
      topCrownGeo.rotateX(-Math.PI / 2);
      const tPos = topCrownGeo.attributes.position;
      const tUvs = new Float32Array(tPos.count * 2);
      const rgb: [number, number, number] = [0, 0, 0];
      const cosA = Math.cos(-paniniAngle);
      const sinA = Math.sin(-paniniAngle);

      for (let i = 0; i < tPos.count; i++) {
        let lx = tPos.getX(i);
        let lz = tPos.getZ(i);
        // Round corners slightly to match focShape
        const ax = Math.max(0, Math.abs(lx) - (hw - cornerR));
        const az = Math.max(0, Math.abs(lz) - (hd - cornerR));
        const cDist = Math.hypot(ax, az);
        if (cDist > cornerR) {
          const scaleBack = cornerR / cDist;
          lx = Math.sign(lx) * (hw - cornerR + ax * scaleBack);
          lz = Math.sign(lz) * (hd - cornerR + az * scaleBack);
        }

        // Map to TOP VIEW plate coordinates by rotating by -paniniAngle
        const rx = lx * cosA - lz * sinA;
        const rz = lx * sinA + lz * cosA;
        const u = rx / (plateR * 2) + 0.5;
        const v = rz / (plateR * 2) + 0.5;
        sampleBicubic(topFullRaw, u * (topFullRaw.width - 1), v * (topFullRaw.height - 1), rgb);
        const lum = (rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114) / 255;

        const edgeFactor =
          (1 - Math.pow(lx / hw, 8)) * (1 - Math.pow(lz / hd, 8));
        const focacciaDimples = (lum - 0.45) * 0.048 * edgeFactor + edgeFactor * 0.028;
        tPos.setXYZ(i, lx, floorY + 0.015 + sandwichH + focacciaDimples, lz);
        tUvs[i * 2] = u;
        tUvs[i * 2 + 1] = v;
      }
      topCrownGeo.setAttribute('uv', new THREE.BufferAttribute(tUvs, 2));
      topCrownGeo.computeVertexNormals();

      return serializeToGlb(
        'TuscanFocacciaProvolonePress',
        [
          { name: 'DarkBronzeCeramicPlate', geometry: plateGeo, materialIndex: 0 },
          { name: 'PressedPaniniLayeredSides', geometry: sideWallGeo, materialIndex: 2, rotationY: paniniAngle },
          { name: 'RosemaryFocacciaTopCrown', geometry: topCrownGeo, materialIndex: 1, rotationY: paniniAngle },
        ],
        [
          {
            name: 'DarkBronzePlateMat',
            baseColorTextureIndex: 0,
            metallicFactor: 0.06,
            roughnessFactor: 0.28,
          },
          {
            name: 'RosemaryOliveOilFocacciaMat',
            baseColorTextureIndex: 1,
            normalTextureIndex: 3,
            normalScale: 0.9,
            metallicRoughnessTextureIndex: 5,
            metallicFactor: 0.0,
            roughnessFactor: 0.44,
          },
          {
            name: 'PaniniProvoloneCrossSectionMat',
            baseColorTextureIndex: 2,
            normalTextureIndex: 4,
            normalScale: 0.85,
            metallicRoughnessTextureIndex: 6,
            metallicFactor: 0.0,
            roughnessFactor: 0.38,
          },
        ],
        [
          { name: 'panini-plate-clean', data: encodePngRgb(cleanPlateRaw) },
          { name: 'panini-top-albedo', data: encodePngRgb(topFullRaw) },
          { name: 'panini-side-albedo', data: encodePngRgb(sidePressRaw), wrapSRepeat: true },
          { name: 'panini-top-normal', data: topPbr.normalPng },
          { name: 'panini-side-normal', data: sidePbr.normalPng, wrapSRepeat: true },
          { name: 'panini-top-orm', data: topPbr.ormPng },
          { name: 'panini-side-orm', data: sidePbr.ormPng, wrapSRepeat: true },
        ]
      );
    }

    // ========================================================================
    // 10 & 11: MARGHERITA D.O.P & BLACK FIG HOT HONEY BURRATA BIANCA
    // ========================================================================
    case 'margherita-pizza':
    case 'burrata-fig-pizza': {
      const isBurrata = id === 'burrata-fig-pizza';
      const topPieRaw = extractCircularTopRaw(views.topView, isBurrata ? 0.91 : 0.95, 512);
      const topPbr = buildPbrMapsFromAlbedo(topPieRaw, {
        normalStrength: 2.5,
        baseRoughness: isBurrata ? 0.3 : 0.38,
        glossyDark: true,
        glossyWarmYolk: true,
        glossyWhiteCream: true,
        size: 256,
      });

      const vesselSideRaw = buildMaskedSideStripRaw(
        views.sideView,
        views.frontView,
        isBurrata ? 0.56 : 0.52,
        isBurrata ? 0.72 : 0.66,
        0.14,
        512,
        192
      );

      const plateR = 1.76;
      const plateGeo = buildCoupePlateGeo(plateR, -0.3, isBurrata ? 0.28 : 0.11);
      setCylindricalSideUVs(plateGeo, -0.3, isBurrata ? -0.02 : -0.18, 1);

      const pieR = isBurrata ? 1.56 : 1.66;
      const rgb: [number, number, number] = [0, 0, 0];

      const pieGeo = buildPhotoSculptedDiscGeo(
        pieR,
        108,
        (dx, dz, r, u, v) => {
          sampleBicubic(
            topPieRaw,
            u * (topPieRaw.width - 1),
            v * (topPieRaw.height - 1),
            rgb
          );
          const lum = (rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114) / 255;

          if (isBurrata) {
            // Central whole Pugliese Burrata ball in TOP/SIDE views sits in r < 0.33!
            const burrataR = Math.hypot(dx, dz - 0.01) / 0.335;
            const burrataDome =
              burrataR < 1 ? Math.sqrt(Math.max(0, 1 - burrataR * burrataR)) * 0.35 : 0;
            // Quartered figs, prosciutto & arugula salad bed around burrata
            const saladBed =
              (1 - Math.pow(r, 2.4)) * 0.14 +
              (lum - 0.35) * 0.065 * (burrataR >= 1 ? 1 - Math.pow(r, 4) : 0.15);
            return -0.16 + saladBed + burrataDome;
          } else {
            // Wood-fired Neapolitan Margherita D.O.P: puffy blistered cornicione outer ring + melted fior di latte
            const cornicione =
              r > 0.73
                ? Math.sin(((r - 0.73) / 0.27) * Math.PI) *
                  (0.2 + Math.sin(Math.atan2(dz, dx) * 9) * 0.024 + lum * 0.04)
                : 0;
            const mozzarellaRelief = r <= 0.74 ? lum * 0.055 + 0.04 * (1 - r * r) : 0;
            return -0.19 + cornicione + mozzarellaRelief;
          }
        },
        0.49
      );

      // For Margherita, add a blistered outer perimeter dough skirt so side view shows full wood-fired crust!
      const parts: GlbMeshPart[] = [
        {
          name: isBurrata ? 'StonewareSaladPlateBowl' : 'DarkArtisanPizzaPlatter',
          geometry: plateGeo,
          materialIndex: 0,
        },
        {
          name: isBurrata ? 'PhotoSculptedFigAndBurrataCrown' : 'PhotoSculptedNeapolitanPie',
          geometry: pieGeo,
          materialIndex: 1,
        },
      ];

      if (!isBurrata) {
        const crustRimGeo = new THREE.TorusGeometry(pieR * 0.89, 0.125, 20, 84);
        crustRimGeo.rotateX(Math.PI / 2);
        crustRimGeo.scale(1, 0.78, 1);
        crustRimGeo.translate(0, -0.115, 0);
        setCylindricalSideUVs(crustRimGeo, -0.22, 0.02, 2);
        crustRimGeo.computeVertexNormals();
        parts.push({ name: 'BlisteredCornicionePerimeter', geometry: crustRimGeo, materialIndex: 0 });
      }

      return serializeToGlb(
        isBurrata ? 'BlackFigBurrataBianca' : 'NeapolitanMargheritaDOP',
        parts,
        [
          {
            name: isBurrata ? 'StonewareBowlMat' : 'WoodFiredPlatterMat',
            baseColorTextureIndex: 1,
            metallicFactor: isBurrata ? 0.02 : 0.12,
            roughnessFactor: isBurrata ? 0.26 : 0.52,
          },
          {
            name: isBurrata ? 'BurrataAndFigCompoteMat' : 'WoodFiredMargheritaMat',
            baseColorTextureIndex: 0,
            normalTextureIndex: 2,
            normalScale: 0.95,
            metallicRoughnessTextureIndex: 3,
            metallicFactor: 0.0,
            roughnessFactor: isBurrata ? 0.22 : 0.36,
          },
        ],
        [
          { name: `${id}-top-albedo`, data: encodePngRgb(topPieRaw) },
          { name: `${id}-side-albedo`, data: encodePngRgb(vesselSideRaw), wrapSRepeat: true },
          { name: `${id}-top-normal`, data: topPbr.normalPng },
          { name: `${id}-top-orm`, data: topPbr.ormPng },
        ]
      );
    }

    // ========================================================================
    // 15: AVOCADO & POACHED EGG TARTINE (QUAD-VIEW + HERO MULTI-VIEW SCULPT)
    // ========================================================================
    case 'avocado-toast': {
      // views.topView = 768x512 crisp TOP VIEW from Quad-View_Avocado_Toast_with_Poached_Egg_a4af8684.png
      // views.frontView = 768x512 FRONT VIEW (with real runny golden yolk waterfall on crust!)
      // views.sideView = 768x512 SIDE VIEW
      const pCx = views.topView.width * (377 / 768);
      const pCy = views.topView.height * (243 / 512);
      const pRx = views.topView.width * (254.5 / 768);
      const pRy = views.topView.height * (242.0 / 512);

      // 1. Clean 512x512 Plate Texture (preserves real scattered peppercorns, feta & yolk drops outside the toast!)
      const plateSize = 512;
      const plateRgba = new Uint8Array(plateSize * plateSize * 4);
      const fullTopRgba = new Uint8Array(plateSize * plateSize * 4);
      const rgb: [number, number, number] = [0, 0, 0];
      const wellRgb: [number, number, number] = [0, 0, 0];

      const tartineAng = 0.38; // exact diagonal toast rotation in TOP VIEW
      const cosT = Math.cos(tartineAng);
      const sinT = Math.sin(tartineAng);

      for (let y = 0; y < plateSize; y++) {
        for (let x = 0; x < plateSize; x++) {
          const nx = (x + 0.5) / (plateSize * 0.5) - 1;
          const nz = (y + 0.5) / (plateSize * 0.5) - 1;
          const r = Math.hypot(nx, nz);
          const ang = Math.atan2(nz, nx);
          const clampedR = Math.min(0.99, r);

          sampleBicubic(
            views.topView,
            pCx + Math.cos(ang) * clampedR * pRx,
            pCy + Math.sin(ang) * clampedR * pRy,
            rgb
          );

          const di = (y * plateSize + x) * 4;
          fullTopRgba[di] = rgb[0];
          fullTopRgba[di + 1] = rgb[1];
          fullTopRgba[di + 2] = rgb[2];
          fullTopRgba[di + 3] = 255;

          // Inpaint ONLY the toast footprint on the plate floor so there's zero double-toast shadow,
          // while preserving 100% of the real plate spices, feta crumbs & runny yolk drops outside the slice!
          const lx = nx * cosT + nz * sinT;
          const lz = -nx * sinT + nz * cosT;
          const toastDist = Math.hypot(lx / 0.62, lz / 0.35);

          if (toastDist < 1.03) {
            const blend = Math.max(0, Math.min(1, (1.03 - toastDist) / 0.16));
            const wellAng = -2.35 + Math.sin(x * 0.04 + y * 0.03) * 0.35;
            const wellRad = 0.68 + (Math.sin(x * 0.06) * 0.5 + 0.5) * 0.13;
            sampleBicubic(
              views.topView,
              pCx + Math.cos(wellAng) * wellRad * pRx,
              pCy + Math.sin(wellAng) * wellRad * pRy,
              wellRgb
            );
            rgb[0] = Math.round(rgb[0] * (1 - blend) + wellRgb[0] * blend);
            rgb[1] = Math.round(rgb[1] * (1 - blend) + wellRgb[1] * blend);
            rgb[2] = Math.round(rgb[2] * (1 - blend) + wellRgb[2] * blend);
          }

          plateRgba[di] = rgb[0];
          plateRgba[di + 1] = rgb[1];
          plateRgba[di + 2] = rgb[2];
          plateRgba[di + 3] = 255;
        }
      }

      const cleanPlateRaw: RawImage = { width: plateSize, height: plateSize, rgba: plateRgba };
      const fullTopRaw: RawImage = { width: plateSize, height: plateSize, rgba: fullTopRgba };
      const topPbr = buildPbrMapsFromAlbedo(fullTopRaw, {
        normalStrength: 2.4,
        baseRoughness: 0.34,
        glossyWarmYolk: true,
        glossyWhiteCream: true,
        size: 256,
      });

      // 2. Real Blistered Sourdough Crust Strip from FRONT VIEW (includes golden yolk waterfall!) + SIDE VIEW
      const frontCrustCrop = cropResizeCrisp(
        views.frontView,
        views.frontView.width * 0.19,
        views.frontView.height * 0.52,
        views.frontView.width * 0.62,
        views.frontView.height * 0.21,
        512,
        160,
        0.28
      );
      const crustPbr = buildPbrMapsFromAlbedo(frontCrustCrop, {
        normalStrength: 2.5,
        baseRoughness: 0.72,
        glossyWarmYolk: true,
        size: 256,
      });

      const plateR = 1.74;
      const floorY = -0.22;
      const plateGeo = buildCoupePlateGeo(plateR, -0.3, 0.255);

      // Exact country sourdough boule slice contour in local toast space (lx in [-1.06, +1.06], lz in [-0.55, +0.55])
      const breadShape = new THREE.Shape();
      breadShape.moveTo(-0.84, -0.5);
      breadShape.quadraticCurveTo(-0.3, -0.55, 0.2, -0.52);
      breadShape.quadraticCurveTo(0.68, -0.51, 0.93, -0.4);
      breadShape.quadraticCurveTo(1.12, -0.17, 1.05, 0.14);
      breadShape.quadraticCurveTo(0.96, 0.44, 0.6, 0.51);
      breadShape.quadraticCurveTo(0.05, 0.56, -0.56, 0.5);
      breadShape.quadraticCurveTo(-1.0, 0.44, -1.07, 0.12);
      breadShape.quadraticCurveTo(-1.1, -0.26, -0.84, -0.5);

      const breadDepth = 0.27;
      const crustWallGeo = new THREE.ExtrudeGeometry(breadShape, {
        depth: breadDepth,
        bevelEnabled: true,
        bevelThickness: 0.022,
        bevelSize: 0.02,
        bevelSegments: 3,
        curveSegments: 40,
      });
      crustWallGeo.rotateX(-Math.PI / 2);
      crustWallGeo.translate(0, floorY + 0.02, 0);

      // Map FRONT VIEW sourdough crust (with golden yolk waterfall centered on +Z front face!) around perimeter
      const cPos = crustWallGeo.attributes.position;
      const cUvs = new Float32Array(cPos.count * 2);
      for (let i = 0; i < cPos.count; i++) {
        const x = cPos.getX(i);
        const y = cPos.getY(i);
        const z = cPos.getZ(i);
        // Front face (+Z, angle around PI/2) maps to u = 0.5 where the golden yolk drip is in FRONT VIEW!
        const ang = Math.atan2(z, x); // +PI/2 at front (+Z)
        const u = ((ang - Math.PI * 0.5) / (Math.PI * 2) + 1.5) % 1.0;
        // Mirror u smoothly so back face wraps cleanly without hard seam
        const mirroredU = u <= 0.5 ? u * 2 * 0.88 + 0.06 : (1 - u) * 2 * 0.88 + 0.06;
        const v = 1 - Math.max(0.04, Math.min(0.96, (y - floorY) / (breadDepth + 0.05)));
        cUvs[i * 2] = mirroredU;
        cUvs[i * 2 + 1] = v;
      }
      crustWallGeo.setAttribute('uv', new THREE.BufferAttribute(cUvs, 2));
      crustWallGeo.computeVertexNormals();

      // 3. High-density 112x80 Photo-Sculpted Smashed Hass Avocado + Poached Egg + Runny Yolk + Feta Crown!
      const crownGeo = new THREE.PlaneGeometry(2.14, 1.1, 112, 80);
      crownGeo.rotateX(-Math.PI / 2);
      const tPos = crownGeo.attributes.position;
      const tUvs = new Float32Array(tPos.count * 2);

      for (let i = 0; i < tPos.count; i++) {
        const gx = tPos.getX(i) / 1.07; // -1 .. +1
        const gz = tPos.getZ(i) / 0.55; // -1 .. +1

        // Conform outer vertices smoothly to the rounded boule slice outline!
        const rEllip = Math.hypot(gx, gz);
        const clampScale = rEllip > 0.98 ? 0.98 / rEllip : 1.0;
        const lx = gx * clampScale * 1.05;
        const lz = gz * clampScale * 0.52;

        // Rotate local (lx, lz) into world/plate TOP VIEW coordinates (rotationY = -tartineAng)
        const wx = lx * cosT - lz * sinT;
        const wz = lx * sinT + lz * cosT;

        const u = wx / (plateR * 2) + 0.5;
        const v = wz / (plateR * 2) + 0.5;
        sampleBicubic(fullTopRaw, u * (plateSize - 1), v * (plateSize - 1), rgb);
        const rN = rgb[0] / 255;
        const gN = rgb[1] / 255;
        const bN = rgb[2] / 255;
        const lum = rN * 0.299 + gN * 0.587 + bN * 0.114;

        // Edge taper so avocado bed tucks cleanly into the toasted sourdough rim
        const edgeEnv = Math.max(0, Math.min(1, (0.98 - Math.min(0.98, rEllip)) / 0.15));

        // Plump Poached Egg Dome centered at (lx: +0.08, lz: -0.02) with radii (0.50, 0.37) matching TOP/FRONT/SIDE views!
        const eggDx = (lx - 0.08) / 0.51;
        const eggDz = (lz + 0.02) / 0.38;
        const eggR = Math.hypot(eggDx, eggDz);
        let eggHeight = 0;
        if (eggR < 1.0) {
          eggHeight = Math.pow(Math.cos(eggR * Math.PI * 0.5), 1.15) * 0.33;
          // Subtle yolk-split cleft on the front (+lz) slope of the poached egg!
          if (eggDz > 0.1 && Math.abs(eggDx) < 0.26) {
            const cleft = (1 - Math.abs(eggDx) / 0.26) * Math.sin(Math.min(1, eggDz) * Math.PI);
            eggHeight -= cleft * 0.055;
          }
        }

        // Chunky fork-smashed Hass avocado bed + crumbled feta & spice micro-relief
        const avoBed =
          edgeEnv * (0.145 + Math.sin(lx * 11 + lz * 9) * 0.018 + (lum - 0.4) * 0.055);
        const wy = floorY + breadDepth + 0.015 + avoBed + eggHeight * edgeEnv;

        tPos.setXYZ(i, lx, wy, lz);
        tUvs[i * 2] = u;
        tUvs[i * 2 + 1] = v;
      }
      crownGeo.setAttribute('uv', new THREE.BufferAttribute(tUvs, 2));
      crownGeo.computeVertexNormals();

      // 4. Delicate 3D Arched Red-Veined Sorrel Micro-Leaves rising gracefully at left crown (like FRONT/SIDE views)
      const leafGeos: THREE.BufferGeometry[] = [];
      const microLeaf = createOrganicLeafGeo(0.2, 0.105, 0.038);
      [
        [-0.36, floorY + breadDepth + 0.36, -0.08, 0.22, 0.6, -0.18, 1.0],
        [-0.22, floorY + breadDepth + 0.44, -0.14, 0.28, 1.9, 0.15, 0.86],
        [-0.46, floorY + breadDepth + 0.29, 0.08, -0.18, 3.5, 0.22, 0.82],
      ].forEach(([px, py, pz, rx, ry, rz, sc]) => {
        dummy.position.set(px, py, pz);
        dummy.rotation.set(rx, ry, rz);
        dummy.scale.setScalar(sc);
        dummy.updateMatrix();
        const lg = microLeaf.clone().toNonIndexed();
        lg.applyMatrix4(dummy.matrix);
        lg.computeVertexNormals();
        leafGeos.push(lg);
      });

      return serializeToGlb(
        'AvocadoPoachedEggTartine',
        [
          { name: 'SpeckledCeramicCoupePlate', geometry: plateGeo, materialIndex: 0 },
          { name: 'SourdoughBlisteredCrust', geometry: crustWallGeo, materialIndex: 2, rotationY: -tartineAng },
          { name: 'PhotoSculptedAvocadoAndPoachedEgg', geometry: crownGeo, materialIndex: 1, rotationY: -tartineAng },
          {
            name: 'SorrelMicrogreenCanopy',
            geometry: mergeGeometries(leafGeos, false)!,
            materialIndex: 3,
            rotationY: -tartineAng,
          },
        ],
        [
          {
            name: 'CeramicCoupePlateMat',
            baseColorTextureIndex: 0,
            normalTextureIndex: 3,
            normalScale: 0.45,
            metallicRoughnessTextureIndex: 5,
            metallicFactor: 0.02,
            roughnessFactor: 0.24,
          },
          {
            name: 'PoachedEggAndAvocadoYolkMat',
            baseColorTextureIndex: 1,
            normalTextureIndex: 3,
            normalScale: 0.9,
            metallicRoughnessTextureIndex: 5,
            metallicFactor: 0.0,
            roughnessFactor: 0.22,
          },
          {
            name: 'SourdoughCrustAndYolkDripMat',
            baseColorTextureIndex: 2,
            normalTextureIndex: 4,
            normalScale: 0.95,
            metallicRoughnessTextureIndex: 6,
            metallicFactor: 0.0,
            roughnessFactor: 0.68,
          },
          {
            name: 'FreshSorrelMicroLeafMat',
            baseColorFactor: [0.27, 0.47, 0.14, 1.0],
            metallicFactor: 0.0,
            roughnessFactor: 0.38,
            doubleSided: true,
          },
        ],
        [
          { name: 'avo-plate-clean', data: encodePngRgb(cleanPlateRaw) },
          { name: 'avo-top-albedo', data: encodePngRgb(fullTopRaw) },
          { name: 'avo-crust-albedo', data: encodePngRgb(frontCrustCrop) },
          { name: 'avo-top-normal', data: topPbr.normalPng },
          { name: 'avo-crust-normal', data: crustPbr.normalPng },
          { name: 'avo-top-orm', data: topPbr.ormPng },
          { name: 'avo-crust-orm', data: crustPbr.ormPng },
        ]
      );
    }

    default:
      return null;
  }
}
