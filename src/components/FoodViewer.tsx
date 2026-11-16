import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, OrbitControls, useGLTF } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Box, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { MenuItem } from '../data/cafeConfig';
import {
  createBespokeDishPlateCanvas,
  createRadialDepthMapTexture,
  FoodViewerItemConfig,
  getFoodViewerConfig,
} from '../data/foodViewerConfig';
import { probeStaticAsset } from '../utils/assetProbe';
import { createSoftParticleTexture, isSoftwareGl } from './three/webglUtils';
import { ResilientImage } from './ResilientImage';

export interface FoodViewerProps {
  dish: MenuItem;
  className?: string;
}

type CameraPreset = 'chef' | 'front' | 'side' | 'overhead' | null;
type ViewerTab = 'auto3d' | 'depth' | 'photo' | 'quad';

// Pre-allocated vectors outside useFrame so per-frame updates allocate zero GC objects
const _targetCamPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();

/**
 * Error boundary around useGLTF so a malformed or missing GLB at '/assets/models/<dish-name>.glb'
 * seamlessly falls back to the radial depth-displaced image mesh without interrupting rendering.
 */
class GlbErrorBoundary extends React.Component<
  { fallback: React.ReactNode; resetKey: string; onError?: () => void; children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: { resetKey: string }) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch() {
    this.props.onError?.();
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

/**
 * Zero-network procedural studio environment map (RoomEnvironment + PMREMGenerator)
 * providing crisp PBR reflections for ceramic glazes, glassware, cast iron, and glossy sauces.
 */
const StudioEnvironment: React.FC = () => {
  const { gl, scene } = useThree();

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    const prevEnv = scene.environment;
    scene.environment = envRT.texture;
    pmrem.dispose();

    return () => {
      scene.environment = prevEnv;
      envRT.dispose();
    };
  }, [gl, scene]);

  return null;
};

/**
 * Loads, normalizes, and centers a real 3D GLB food model from '/assets/models/<dish-name>.glb'
 */
const GlbFoodModel: React.FC<{ url: string }> = ({ url }) => {
  const gltf = useGLTF(url);
  const { gl } = useThree();

  const normalizedScene = useMemo(() => {
    const maxAniso = gl.capabilities.getMaxAnisotropy();
    const clone = gltf.scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 0.001);
    const scale = 3.36 / maxDim;

    clone.scale.setScalar(scale);
    clone.position.set(
      -center.x * scale,
      -box.min.y * scale - 0.3,
      -center.z * scale
    );

    clone.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        const std = mesh.material as THREE.MeshStandardMaterial | undefined;
        const isTransparentGlass = Boolean(std?.transparent && std.opacity < 0.95);

        mesh.castShadow = !isSoftwareGl && !isTransparentGlass;
        mesh.receiveShadow = !isSoftwareGl;

        if (std) {
          if (std.map) {
            std.map.colorSpace = THREE.SRGBColorSpace;
            std.map.anisotropy = maxAniso;
            std.map.needsUpdate = true;
          }
          [std.normalMap, std.roughnessMap, std.metalnessMap, std.aoMap].forEach((dataTex) => {
            if (dataTex) {
              dataTex.colorSpace = THREE.NoColorSpace;
              dataTex.anisotropy = maxAniso;
              dataTex.needsUpdate = true;
            }
          });
          if (mesh.geometry.getAttribute('color')) {
            std.vertexColors = true;
          }
          if (
            std.normalMap &&
            mesh.geometry.index &&
            mesh.geometry.attributes.uv &&
            !mesh.geometry.attributes.tangent
          ) {
            mesh.geometry.computeTangents();
          }

          const matName = std.name || '';
          if (isTransparentGlass || matName.includes('Glass') || matName.includes('Ice')) {
            const isOuterGlass = matName.includes('Glass');
            mesh.renderOrder = isOuterGlass ? 4 : 3;
            mesh.material = new THREE.MeshPhysicalMaterial({
              name: matName,
              color: std.color,
              transparent: true,
              opacity: isSoftwareGl ? (isOuterGlass ? 0.28 : 0.78) : 1.0,
              transmission: isSoftwareGl ? 0 : isOuterGlass ? 0.88 : 0.62,
              ior: isOuterGlass ? 1.51 : 1.31,
              thickness: isOuterGlass ? 0.32 : 0.45,
              depthWrite: false,
              roughness: isOuterGlass ? 0.045 : 0.09,
              metalness: 0.04,
              envMapIntensity: 1.35,
              clearcoat: 1.0,
              clearcoatRoughness: 0.04,
              side: std.side,
            });
          } else if (
            matName.includes('Croissant') ||
            matName.includes('Brioche') ||
            matName.includes('Sourdough') ||
            matName.includes('Focaccia') ||
            matName.includes('Crust')
          ) {
            mesh.material = new THREE.MeshPhysicalMaterial({
              name: matName,
              color: std.color,
              map: std.map,
              normalMap: std.normalMap,
              normalScale: std.normalScale,
              roughnessMap: std.roughnessMap,
              metalnessMap: std.metalnessMap,
              aoMap: std.aoMap,
              aoMapIntensity: std.aoMapIntensity,
              roughness: std.roughness,
              metalness: std.metalness,
              sheen: 0.38,
              sheenRoughness: 0.68,
              sheenColor: new THREE.Color('#F5D7B2'),
              clearcoat: matName.includes('Cardamom') || matName.includes('YolkDrip') ? 0.32 : 0.08,
              clearcoatRoughness: 0.28,
              side: std.side,
            });
          } else if (
            matName.includes('Yolk') ||
            matName.includes('PoachedEgg') ||
            matName.includes('Plate') ||
            matName.includes('Saucer') ||
            matName.includes('Bowl') ||
            matName.includes('Burrata') ||
            matName.includes('Compote') ||
            matName.includes('Ganache') ||
            matName.includes('Foam') ||
            matName.includes('Mound') ||
            matName.includes('Margherita')
          ) {
            const isHighGloss =
              matName.includes('Yolk') ||
              matName.includes('Compote') ||
              matName.includes('Ganache');
            const isCreamy =
              matName.includes('PoachedEgg') ||
              matName.includes('Burrata') ||
              matName.includes('Foam');
            mesh.material = new THREE.MeshPhysicalMaterial({
              name: matName,
              color: std.color,
              map: std.map,
              normalMap: std.normalMap,
              normalScale: std.normalScale,
              roughnessMap: std.roughnessMap,
              metalnessMap: std.metalnessMap,
              aoMap: std.aoMap,
              aoMapIntensity: std.aoMapIntensity,
              emissive: std.emissive,
              emissiveIntensity: matName.includes('RunnyGoldenYolk') ? 1.0 : 0.0,
              roughness: std.roughness,
              metalness: std.metalness,
              envMapIntensity: 1.15,
              clearcoat: isHighGloss ? 0.85 : isCreamy ? 0.62 : 0.46,
              clearcoatRoughness: isHighGloss ? 0.08 : isCreamy ? 0.16 : 0.2,
              side: std.side,
            });
          }
        }
      }
    });

    return clone;
  }, [gltf.scene, gl]);

  return <primitive object={normalizedScene} />;
};

/**
 * Builds a concentric-disk-mapped circular mesh (Shirley–Chiu square-to-disk mapping)
 * so radial depth displacement produces a clean, round plated dish with uniform quad density
 * and aspect-ratio-correct center-cropped UVs.
 */
function buildConcentricDishDiscGeometry(
  radius = 1.54,
  segments = 104,
  imgAspect = 1
): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(2, 2, segments, segments);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;

  const uScale = imgAspect > 1 ? 1 / imgAspect : 1;
  const vScale = imgAspect < 1 ? imgAspect : 1;

  for (let i = 0; i < pos.count; i++) {
    const sx = pos.getX(i);
    const sz = pos.getZ(i);

    let dx = 0;
    let dz = 0;
    if (sx !== 0 || sz !== 0) {
      let r = 0;
      let phi = 0;
      if (Math.abs(sx) > Math.abs(sz)) {
        r = sx;
        phi = (Math.PI / 4) * (sz / sx);
      } else {
        r = sz;
        phi = Math.PI / 2 - (Math.PI / 4) * (sx / sz);
      }
      dx = r * Math.cos(phi);
      dz = r * Math.sin(phi);
    }

    pos.setXYZ(i, dx * radius, 0, dz * radius);

    const u = 0.5 + dx * 0.485 * uScale;
    const v = 0.5 - dz * 0.485 * vScale;
    uv.setXY(i, u, v);
  }

  pos.needsUpdate = true;
  uv.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/**
 * Fallback 3D Dish Renderer when '/assets/models/<dish-name>.glb' is missing:
 * Renders a radial depth-displaced dish photograph mesh nestled inside a grounded
 * artisan stoneware coupe plate with subtle pointer parallax tilt.
 */
const RadialDepthDisplacedDish: React.FC<{
  dishId: string;
  config: FoodViewerItemConfig;
  reducedMotion: boolean;
}> = ({ dishId, config, reducedMotion }) => {
  const { gl, invalidate } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  const [textures, setTextures] = useState<{
    colorTex: THREE.Texture;
    depthTex: THREE.Texture;
    aspect: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const maxAniso = gl.capabilities.getMaxAnisotropy();

    const applyLoadedImage = async (
      imgSource: HTMLImageElement | HTMLCanvasElement,
      aspect: number
    ) => {
      if (cancelled) return;

      const colorTex =
        imgSource instanceof HTMLCanvasElement
          ? new THREE.CanvasTexture(imgSource)
          : new THREE.Texture(imgSource);
      colorTex.colorSpace = THREE.SRGBColorSpace;
      colorTex.anisotropy = maxAniso;
      colorTex.minFilter = THREE.LinearMipmapLinearFilter;
      colorTex.magFilter = THREE.LinearFilter;
      colorTex.needsUpdate = true;

      let depthTex: THREE.Texture | null = null;
      const hasCustomDepth = await probeStaticAsset(config.depthMap, 'image');
      if (!cancelled && hasCustomDepth) {
        depthTex = await new Promise<THREE.Texture | null>((resolve) => {
          new THREE.TextureLoader().load(
            config.depthMap,
            (loaded) => {
              loaded.colorSpace = THREE.NoColorSpace;
              loaded.wrapS = THREE.ClampToEdgeWrapping;
              loaded.wrapT = THREE.ClampToEdgeWrapping;
              resolve(loaded);
            },
            undefined,
            () => resolve(null)
          );
        });
      }

      if (cancelled) {
        colorTex.dispose();
        depthTex?.dispose();
        return;
      }

      const finalDepth = depthTex || createRadialDepthMapTexture(config.domePower, imgSource);

      setTextures((prev) => {
        prev?.colorTex.dispose();
        prev?.depthTex.dispose();
        return { colorTex, depthTex: finalDepth, aspect };
      });
      invalidate();
    };

    (async () => {
      let resolvedUrl = config.image;
      const hasDroppedPhoto = await probeStaticAsset(config.dropPhotoPath, 'image');
      if (hasDroppedPhoto) {
        resolvedUrl = config.dropPhotoPath;
      }

      if (resolvedUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const aspect =
            img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1;
          void applyLoadedImage(img, aspect);
        };
        img.onerror = () => {
          const fallbackCanvas = createBespokeDishPlateCanvas(dishId);
          void applyLoadedImage(fallbackCanvas, 1);
        };
        img.src = resolvedUrl;
      } else {
        const fallbackCanvas = createBespokeDishPlateCanvas(dishId);
        void applyLoadedImage(fallbackCanvas, 1);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    dishId,
    config.image,
    config.dropPhotoPath,
    config.depthMap,
    config.domePower,
    gl,
    invalidate,
  ]);

  const latestTexRef = useRef(textures);
  latestTexRef.current = textures;
  useEffect(() => {
    return () => {
      latestTexRef.current?.colorTex.dispose();
      latestTexRef.current?.depthTex.dispose();
    };
  }, []);

  const discGeometry = useMemo(() => {
    return buildConcentricDishDiscGeometry(1.52, isSoftwareGl ? 64 : 104, textures?.aspect ?? 1);
  }, [textures?.aspect]);

  useEffect(() => {
    return () => discGeometry.dispose();
  }, [discGeometry]);

  const { plateBaseGeo, plateRimGeo } = useMemo(() => {
    const basePts = [
      new THREE.Vector2(0, -0.3),
      new THREE.Vector2(1.06, -0.3),
      new THREE.Vector2(1.24, -0.25),
      new THREE.Vector2(1.58, -0.09),
      new THREE.Vector2(1.68, 0.04),
      new THREE.Vector2(1.62, 0.08),
      new THREE.Vector2(1.48, -0.02),
      new THREE.Vector2(0, -0.06),
    ];
    const pBase = new THREE.LatheGeometry(basePts, 64);
    const pRim = new THREE.TorusGeometry(1.63, 0.048, 16, 72);
    pRim.rotateX(Math.PI / 2);
    return { plateBaseGeo: pBase, plateRimGeo: pRim };
  }, []);

  useEffect(() => {
    return () => {
      plateBaseGeo.dispose();
      plateRimGeo.dispose();
    };
  }, [plateBaseGeo, plateRimGeo]);

  useFrame((state, delta) => {
    if (!groupRef.current || reducedMotion || isSoftwareGl) return;
    const targetRx = -state.pointer.y * 0.08;
    const targetRz = -state.pointer.x * 0.08;
    groupRef.current.rotation.x = THREE.MathUtils.damp(
      groupRef.current.rotation.x,
      targetRx,
      5,
      delta
    );
    groupRef.current.rotation.z = THREE.MathUtils.damp(
      groupRef.current.rotation.z,
      targetRz,
      5,
      delta
    );
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={plateBaseGeo} castShadow={!isSoftwareGl} receiveShadow={!isSoftwareGl}>
        <meshPhysicalMaterial
          color={config.rimColor}
          roughness={0.28}
          metalness={0.02}
          clearcoat={0.55}
          clearcoatRoughness={0.18}
        />
      </mesh>

      <mesh
        geometry={plateRimGeo}
        position={[0, 0.055, 0]}
        castShadow={!isSoftwareGl}
        receiveShadow={!isSoftwareGl}
      >
        <meshStandardMaterial color={config.rimBandColor} roughness={0.42} metalness={0.04} />
      </mesh>

      {textures && (
        <mesh
          geometry={discGeometry}
          position={[0, -0.04, 0]}
          castShadow={!isSoftwareGl}
          receiveShadow={!isSoftwareGl}
        >
          <meshStandardMaterial
            map={textures.colorTex}
            displacementMap={textures.depthTex}
            displacementScale={config.displacementScale}
            displacementBias={-0.02}
            bumpMap={textures.depthTex}
            bumpScale={0.042}
            roughness={0.38}
            metalness={0.02}
          />
        </mesh>
      )}
    </group>
  );
};

/**
 * Subtle warm rising steam wisps for hot coffee & kitchen plates
 */
const RisingSteamParticles: React.FC<{ active: boolean; reducedMotion: boolean }> = ({
  active,
  reducedMotion,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const particleTex = useMemo(() => createSoftParticleTexture(), []);

  useEffect(() => {
    return () => particleTex.dispose();
  }, [particleTex]);

  const seeds = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const rad = 0.16 + (i % 3) * 0.22;
        return {
          baseX: Math.cos(angle) * rad,
          baseZ: Math.sin(angle) * rad,
          phase: i * 0.68,
          speed: 0.34 + (i % 3) * 0.07,
          scale: 0.58 + (i % 3) * 0.16,
        };
      }),
    []
  );

  useFrame((state) => {
    if (!active || reducedMotion || isSoftwareGl || !groupRef.current) return;
    const t = state.clock.getElapsedTime();
    const children = groupRef.current.children as THREE.Sprite[];
    for (let i = 0; i < children.length; i++) {
      const sprite = children[i];
      const s = seeds[i];
      const cycle = (t * s.speed + s.phase) % 1;
      sprite.position.set(
        s.baseX + Math.sin(t * 1.2 + s.phase) * 0.1,
        0.48 + cycle * 1.35,
        s.baseZ + Math.cos(t * 1.0 + s.phase) * 0.1
      );
      (sprite.material as THREE.SpriteMaterial).opacity = Math.sin(cycle * Math.PI) * 0.18;
    }
  });

  if (!active || reducedMotion) return null;

  return (
    <group ref={groupRef}>
      {seeds.map((s, idx) => (
        <sprite
          key={idx}
          position={[s.baseX, 0.55 + idx * 0.14, s.baseZ]}
          scale={[s.scale, s.scale, 1]}
        >
          <spriteMaterial
            map={particleTex}
            color="#FAF6F0"
            transparent
            opacity={0.14}
            depthWrite={false}
          />
        </sprite>
      ))}
    </group>
  );
};

/**
 * Smooth camera preset controller + OrbitControls inside R3F Canvas
 */
const StageCameraRig: React.FC<{
  autoRotate: boolean;
  reducedMotion: boolean;
  presetRequest: { preset: CameraPreset; nonce: number };
}> = ({ autoRotate, reducedMotion, presetRequest }) => {
  const { camera, invalidate } = useThree();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const activePresetRef = useRef<CameraPreset>(null);

  useEffect(() => {
    if (presetRequest.preset) {
      activePresetRef.current = presetRequest.preset;
      invalidate();
    }
  }, [presetRequest, invalidate]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    const preset = activePresetRef.current;
    if (!controls || !preset) return;

    if (preset === 'chef') {
      _targetCamPos.set(0.32, 2.45, 4.55);
      _targetLookAt.set(0, 0.15, 0);
    } else if (preset === 'front') {
      _targetCamPos.set(1.15, 0.96, 4.55);
      _targetLookAt.set(0, 0.14, 0);
    } else if (preset === 'side') {
      _targetCamPos.set(-2.45, 0.94, 4.05);
      _targetLookAt.set(0, 0.14, 0);
    } else {
      _targetCamPos.set(0, 4.85, 0.09);
      _targetLookAt.set(0, 0.04, 0);
    }

    const alpha = isSoftwareGl ? 1 : 1 - Math.exp(-7 * Math.min(delta, 0.05));
    camera.position.lerp(_targetCamPos, alpha);
    controls.target.lerp(_targetLookAt, alpha);
    controls.update();

    if (camera.position.distanceToSquared(_targetCamPos) < 0.002) {
      camera.position.copy(_targetCamPos);
      controls.target.copy(_targetLookAt);
      controls.update();
      activePresetRef.current = null;
    } else {
      invalidate();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan={false}
      enableDamping={!isSoftwareGl}
      dampingFactor={0.065}
      minDistance={2.8}
      maxDistance={6.6}
      minPolarAngle={0.02}
      maxPolarAngle={Math.PI * 0.48}
      target={[0, 0.15, 0]}
      autoRotate={autoRotate && !isSoftwareGl && !reducedMotion}
      autoRotateSpeed={1.15}
      onStart={() => {
        activePresetRef.current = null;
      }}
    />
  );
};

export const FoodViewer: React.FC<FoodViewerProps> = ({ dish, className = '' }) => {
  const config = useMemo(() => getFoodViewerConfig(dish), [dish]);

  const reducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const [tab, setTab] = useState<ViewerTab>('auto3d');
  const [hasGlb, setHasGlb] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(() => !reducedMotion && !isSoftwareGl);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [presetRequest, setPresetRequest] = useState<{ preset: CameraPreset; nonce: number }>({
    preset: null,
    nonce: 0,
  });
  const [photoTilt, setPhotoTilt] = useState({ rx: 0, ry: 0 });

  // Probe '/assets/models/<dish-name>.glb' first; if missing, automatically render radial depth mesh fallback
  useEffect(() => {
    let active = true;
    setHasGlb(false);
    probeStaticAsset(config.glb, 'binary-or-model').then((exists) => {
      if (active) setHasGlb(exists);
    });
    return () => {
      active = false;
    };
  }, [config.glb]);

  useEffect(() => {
    if (tab === 'quad' && !config.referenceSheet) {
      setTab('auto3d');
    }
  }, [config.referenceSheet, tab]);

  const triggerPreset = useCallback((preset: CameraPreset) => {
    setPresetRequest((prev) => ({ preset, nonce: prev.nonce + 1 }));
  }, []);

  const handlePhotoTilt = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
    setPhotoTilt({ rx: -ny * 7, ry: nx * 7 });
  }, []);

  const isCanvasActive = tab === 'auto3d' || tab === 'depth';

  const depthFallbackNode = (
    <RadialDepthDisplacedDish
      dishId={dish.id}
      config={config}
      reducedMotion={reducedMotion}
    />
  );

  return (
    <div
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'h' || e.key === 'H') setDockCollapsed((c) => !c);
      }}
      aria-label={`Interactive 3D food viewer for ${dish.name}`}
      className={`relative w-full h-[380px] sm:h-[450px] rounded-2xl bg-[var(--willow-subtle)] border border-[var(--willow-border)] overflow-hidden select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9893B] ${className}`}
    >
      {/* Minimal Top-Left Spec Label (Solid surface — zero backdrop-filter over WebGL) */}
      <div className="pointer-events-none absolute top-4 left-4 z-10 max-w-[calc(100%-2rem)] flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--willow-surface)] border border-[var(--willow-border)] text-xs text-[var(--willow-text-secondary)]">
        <Box className="w-3.5 h-3.5 text-[var(--willow-amber)] shrink-0" />
        <span className="truncate">
          {tab === 'photo'
            ? `${dish.shortLabel || dish.name} · Plate Photo`
            : tab === 'quad'
            ? `${dish.shortLabel || dish.name} · Quad-View Reference`
            : tab === 'depth'
            ? `${dish.shortLabel || dish.name} · Radial Depth Mesh · Drag & zoom`
            : hasGlb
            ? `${dish.shortLabel || dish.name} · 3D GLB Model · Drag 360° & zoom`
            : `${dish.shortLabel || dish.name} · Radial Depth 3D · Drag & zoom`}
        </span>
      </div>

      {/* React-Three-Fiber Studio Canvas */}
      <div
        data-cursor="cup"
        className={`w-full h-full cursor-grab active:cursor-grabbing touch-none transition-opacity duration-200 ${
          isCanvasActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <Canvas
          shadows={!isSoftwareGl}
          dpr={isSoftwareGl ? 1 : [1, 2]}
          frameloop={isSoftwareGl ? 'demand' : 'always'}
          camera={{ position: [0.32, 2.45, 4.55], fov: 34, near: 0.1, far: 40 }}
          gl={{
            antialias: !isSoftwareGl,
            alpha: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.08,
          }}
        >
          <StudioEnvironment />

          {/* Balanced 3-Point Warm/Cool Studio Lighting Rig */}
          <hemisphereLight args={['#F6F2FF', '#3B2A1D', 0.95]} />
          <directionalLight
            position={[3.4, 5.8, 3.8]}
            intensity={2.05}
            color="#FFE7C4"
            castShadow={!isSoftwareGl}
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-left={-2.6}
            shadow-camera-right={2.6}
            shadow-camera-top={2.6}
            shadow-camera-bottom={-2.6}
            shadow-camera-near={0.5}
            shadow-camera-far={16}
            shadow-bias={-0.0005}
            shadow-normalBias={0.02}
          />
          <directionalLight position={[-3.8, 3.2, 2.4]} intensity={0.68} color="#DBE6F5" />
          <pointLight
            position={[-2.8, 2.4, -2.8]}
            intensity={2.4}
            distance={12}
            color={config.accentHex}
          />

          {/* Primary GLB Loader ('/assets/models/<dish-name>.glb') -> Radial Depth-Displaced Image Mesh Fallback */}
          {tab === 'depth' ? (
            depthFallbackNode
          ) : hasGlb ? (
            <GlbErrorBoundary
              resetKey={config.glb}
              fallback={depthFallbackNode}
              onError={() => setHasGlb(false)}
            >
              <Suspense fallback={depthFallbackNode}>
                <GlbFoodModel url={config.glb} />
              </Suspense>
            </GlbErrorBoundary>
          ) : (
            depthFallbackNode
          )}

          {/* Grounded Contact Shadows */}
          <ContactShadows
            position={[0, -0.305, 0]}
            opacity={0.52}
            scale={4.8}
            blur={2.2}
            far={2.2}
            resolution={isSoftwareGl ? 128 : 512}
            frames={isSoftwareGl ? 1 : Infinity}
            color="#140E09"
          />

          {/* Atmospheric Rising Steam Particles */}
          <RisingSteamParticles active={config.hasSteam} reducedMotion={reducedMotion} />

          {/* OrbitControls with Auto-Rotate, Drag-to-Rotate, Pinch-to-Zoom & Preset Damping */}
          <StageCameraRig
            autoRotate={autoRotate}
            reducedMotion={reducedMotion}
            presetRequest={presetRequest}
          />
        </Canvas>
      </div>

      {/* Optional 2D Plate Photo View */}
      {tab === 'photo' && (
        <div
          onPointerMove={handlePhotoTilt}
          onPointerLeave={() => setPhotoTilt({ rx: 0, ry: 0 })}
          className="absolute inset-0 w-full h-full flex items-center justify-center p-6 sm:p-8"
          style={{ perspective: '900px' }}
        >
          <div
            className="relative w-full max-w-md aspect-[4/3] rounded-xl overflow-hidden shadow-xl border border-[var(--willow-border)] transition-transform duration-150 ease-out"
            style={{
              transform: `rotateX(${photoTilt.rx}deg) rotateY(${photoTilt.ry}deg)`,
            }}
          >
            <ResilientImage
              src={config.image}
              dropPhotoPath={config.dropPhotoPath}
              fallbackLabel={`Add photo: ${dish.shortLabel || dish.name}`}
              alt={dish.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent flex items-end p-4">
              <p className="text-xs text-[#F4EDE0]/95">{dish.ingredients.join(' · ')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Optional Quad-View Turnaround Reference Sheet */}
      {tab === 'quad' && config.referenceSheet && (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center p-5 sm:p-7 pb-14">
          <div className="relative w-full h-full max-w-xl rounded-xl overflow-hidden shadow-xl border border-[var(--willow-border)] bg-[#EAE7E1]">
            <ResilientImage
              src={config.referenceSheet}
              alt={`${dish.name} quad-view turnaround`}
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Unified Collapsible Bottom Control Dock (Solid Surface Over WebGL) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center max-w-[94%]">
        <button
          type="button"
          onClick={() => setDockCollapsed((c) => !c)}
          aria-expanded={!dockCollapsed}
          aria-label={dockCollapsed ? 'Show 3D controls' : 'Hide 3D controls'}
          className="mb-1 px-2.5 py-0.5 rounded-md bg-[#2A1D14] text-[#F4EDE0]/85 hover:text-[#C9893B] border border-[#F4EDE0]/15 text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
        >
          {dockCollapsed ? (
            <>
              <ChevronUp className="w-3 h-3" />
              <span>Controls</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              <span>Hide</span>
            </>
          )}
        </button>

        {!dockCollapsed && (
          <div className="flex flex-wrap items-center justify-center gap-1 p-1 rounded-xl bg-[#2A1D14] text-[#F4EDE0] shadow-lg border border-[#F4EDE0]/15">
            <button
              type="button"
              onClick={() => setTab('auto3d')}
              className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap cursor-pointer ${
                tab === 'auto3d'
                  ? 'bg-[#C9893B] text-[#14100C] font-semibold'
                  : 'text-[#F4EDE0]/80 hover:text-[#F4EDE0]'
              }`}
            >
              {hasGlb ? '3D GLB' : '3D Dish'}
            </button>

            {hasGlb && (
              <button
                type="button"
                onClick={() => setTab('depth')}
                className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap cursor-pointer ${
                  tab === 'depth'
                    ? 'bg-[#C9893B] text-[#14100C] font-semibold'
                    : 'text-[#F4EDE0]/80 hover:text-[#F4EDE0]'
                }`}
              >
                Depth 3D
              </button>
            )}

            <button
              type="button"
              onClick={() => setTab('photo')}
              className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap cursor-pointer ${
                tab === 'photo'
                  ? 'bg-[#C9893B] text-[#14100C] font-semibold'
                  : 'text-[#F4EDE0]/80 hover:text-[#F4EDE0]'
              }`}
            >
              Photo
            </button>

            {config.referenceSheet && (
              <button
                type="button"
                onClick={() => setTab('quad')}
                className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap cursor-pointer ${
                  tab === 'quad'
                    ? 'bg-[#C9893B] text-[#14100C] font-semibold'
                    : 'text-[#F4EDE0]/80 hover:text-[#F4EDE0]'
                }`}
              >
                Quad-View
              </button>
            )}

            {isCanvasActive && (
              <>
                <span aria-hidden="true" className="w-px h-4 bg-[#F4EDE0]/15 mx-0.5" />

                <button
                  type="button"
                  onClick={() => triggerPreset('chef')}
                  className="px-2 py-1.5 rounded-lg text-xs text-[#F4EDE0]/80 hover:text-[#C9893B] transition-colors whitespace-nowrap cursor-pointer"
                >
                  3/4
                </button>

                <button
                  type="button"
                  onClick={() => triggerPreset('front')}
                  className="px-2 py-1.5 rounded-lg text-xs text-[#F4EDE0]/80 hover:text-[#C9893B] transition-colors whitespace-nowrap cursor-pointer"
                >
                  Front
                </button>

                <button
                  type="button"
                  onClick={() => triggerPreset('side')}
                  className="px-2 py-1.5 rounded-lg text-xs text-[#F4EDE0]/80 hover:text-[#C9893B] transition-colors whitespace-nowrap cursor-pointer"
                >
                  Side
                </button>

                <button
                  type="button"
                  onClick={() => triggerPreset('overhead')}
                  className="px-2 py-1.5 rounded-lg text-xs text-[#F4EDE0]/80 hover:text-[#C9893B] transition-colors whitespace-nowrap cursor-pointer"
                >
                  Top
                </button>

                <button
                  type="button"
                  onClick={() => setAutoRotate((s) => !s)}
                  className={`px-2 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap cursor-pointer ${
                    autoRotate
                      ? 'text-[#C9893B] font-medium'
                      : 'text-[#F4EDE0]/75 hover:text-[#F4EDE0]'
                  }`}
                >
                  {autoRotate ? 'Spin: On' : 'Spin: Off'}
                </button>

                <button
                  type="button"
                  onClick={() => triggerPreset('chef')}
                  title="Reset 3D angle"
                  aria-label="Reset 3D angle"
                  className="w-7 h-7 rounded-lg text-[#F4EDE0]/80 hover:text-[#C9893B] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodViewer;
