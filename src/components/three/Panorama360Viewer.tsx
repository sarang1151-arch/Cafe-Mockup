import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as THREE from 'three';
import {
  ArrowRight,
  Compass,
  Info,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Sparkles,
  Video,
  X,
} from 'lucide-react';
import {
  CAFE_360_SCENES,
  Cafe360Scene,
  PanoHotspot,
  TOUR_360_VIDEO_CONFIG,
} from '../../data/cafeConfig';
import { probeStaticAsset } from '../../utils/assetProbe';
import { createConfiguredRenderer, isSoftwareGl, scheduleNextFrame } from './webglUtils';
import { ResilientImage } from '../ResilientImage';

interface Panorama360ViewerProps {
  activeScene: Cafe360Scene;
  onSelectScene: (scene: Cafe360Scene) => void;
}

interface ProjectedHotspot {
  hotspot: PanoHotspot;
  x: number;
  y: number;
  visible: boolean;
}

function sphericalToVector3(yawDeg: number, pitchDeg: number, radius = 42): THREE.Vector3 {
  const phi = THREE.MathUtils.degToRad(90 - pitchDeg);
  const theta = THREE.MathUtils.degToRad(yawDeg);
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.cos(phi),
    -radius * Math.sin(phi) * Math.cos(theta)
  );
}

export const Panorama360Viewer: React.FC<Panorama360ViewerProps> = ({
  activeScene,
  onSelectScene,
}) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasMountRef = useRef<HTMLDivElement | null>(null);

  const [selectedHotspot, setSelectedHotspot] = useState<PanoHotspot | null>(null);
  const [projectedHotspots, setProjectedHotspots] = useState<ProjectedHotspot[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [gyroActive, setGyroActive] = useState(false);
  const [gyroSupported, setGyroSupported] = useState(false);

  // 4K 360° video state (uses real /assets/video/tour-360.mp4 when dropped, or guided 360° still pan fallback)
  const [availableVideoUrl, setAvailableVideoUrl] = useState<string | null>(null);
  const [isVideoTourPlaying, setIsVideoTourPlaying] = useState(false);
  const [usingCustomPanoFile, setUsingCustomPanoFile] = useState(false);
  const [showAssetGuide, setShowAssetGuide] = useState(false);

  const swapSceneFnRef = useRef<((scene: Cafe360Scene, resolvedUrl: string) => void) | null>(null);
  const toggleVideoTextureFnRef = useRef<((enable: boolean) => void) | null>(null);
  const viewAnglesRef = useRef({
    lon: activeScene.initialYaw,
    lat: activeScene.initialPitch,
    velLon: 0,
    velLat: 0,
    fov: 68,
    targetFov: 68,
  });
  const activeSceneRef = useRef<Cafe360Scene>(activeScene);
  const activeHotspotsRef = useRef<PanoHotspot[]>(activeScene.hotspots);
  const isVideoTourPlayingRef = useRef(isVideoTourPlaying);
  const gyroActiveRef = useRef(gyroActive);

  useEffect(() => {
    activeSceneRef.current = activeScene;
    activeHotspotsRef.current = activeScene.hotspots;
    setSelectedHotspot(null);
  }, [activeScene]);

  useEffect(() => {
    isVideoTourPlayingRef.current = isVideoTourPlaying;
    toggleVideoTextureFnRef.current?.(isVideoTourPlaying);
  }, [isVideoTourPlaying]);

  useEffect(() => {
    gyroActiveRef.current = gyroActive;
  }, [gyroActive]);

  // Detect mobile gyroscope support & probe 4K / mobile 360° video files
  useEffect(() => {
    const hasOrientation = typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
    const isCoarsePointer = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
    setGyroSupported(hasOrientation && isCoarsePointer);

    let cancelled = false;
    (async () => {
      const isMobileScreen = window.innerWidth < 768;
      if (isMobileScreen) {
        const hasMobileVid = await probeStaticAsset(TOUR_360_VIDEO_CONFIG.mobileSrc, 'video');
        if (!cancelled && hasMobileVid) {
          setAvailableVideoUrl(TOUR_360_VIDEO_CONFIG.mobileSrc);
          return;
        }
      }
      const has4kVid = await probeStaticAsset(TOUR_360_VIDEO_CONFIG.desktop4kSrc, 'video');
      if (!cancelled && has4kVid) {
        setAvailableVideoUrl(TOUR_360_VIDEO_CONFIG.desktop4kSrc);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Fullscreen listener
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Load each space's dedicated 360° equirectangular panorama directly (with fallback guard)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const hasCustomPano = await probeStaticAsset(activeScene.panoSrc, 'image');
      if (cancelled) return;
      setUsingCustomPanoFile(true);
      const urlToLoad = hasCustomPano ? activeScene.panoSrc : activeScene.fallbackPanoSrc;
      swapSceneFnRef.current?.(activeScene, urlToLoad);
    })();
    return () => {
      cancelled = true;
    };
  }, [activeScene]);

  // Main Three.js 360° Equirectangular Sphere Engine
  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const renderer = createConfiguredRenderer(false);
    const width = container.clientWidth || 720;
    const height = container.clientHeight || 480;
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(68, width / height, 0.1, 200);
    camera.position.set(0, 0, 0.01);

    // Inverted outer sphere (base scene) + inner crossfade sphere for silky scene transitions
    const baseGeo = new THREE.SphereGeometry(60, 64, 48);
    baseGeo.scale(-1, 1, 1);

    const fadeGeo = new THREE.SphereGeometry(58, 64, 48);
    fadeGeo.scale(-1, 1, 1);

    const texLoader = new THREE.TextureLoader();
    const loadedTextures = new Map<string, THREE.Texture>();

    const maxAnisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const getOrLoadTexture = (url: string, onReady?: (tex: THREE.Texture) => void): THREE.Texture => {
      const cached = loadedTextures.get(url);
      if (cached) {
        onReady?.(cached);
        return cached;
      }
      const tex = texLoader.load(url, (loaded) => {
        loaded.colorSpace = THREE.SRGBColorSpace;
        loaded.anisotropy = maxAnisotropy;
        onReady?.(loaded);
      });
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = maxAnisotropy;
      loadedTextures.set(url, tex);
      return tex;
    };

    const initialTex = getOrLoadTexture(activeSceneRef.current.panoSrc);

    const baseMat = new THREE.MeshBasicMaterial({
      map: initialTex,
      color: new THREE.Color(activeScene.tintHex),
    });
    const baseSphere = new THREE.Mesh(baseGeo, baseMat);
    scene.add(baseSphere);

    const fadeMat = new THREE.MeshBasicMaterial({
      map: initialTex,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const fadeSphere = new THREE.Mesh(fadeGeo, fadeMat);
    fadeSphere.visible = false;
    scene.add(fadeSphere);

    let fadeProgress = 1; // 1 = settled
    let pendingTargetTex: THREE.Texture | null = null;
    let pendingTint = new THREE.Color(activeScene.tintHex);

    // Optional 360° Video Element & VideoTexture
    let videoEl: HTMLVideoElement | null = null;
    let videoTex: THREE.VideoTexture | null = null;

    swapSceneFnRef.current = (nextScene: Cafe360Scene, resolvedUrl: string) => {
      getOrLoadTexture(resolvedUrl, (nextTex) => {
        pendingTargetTex = nextTex;
        pendingTint = new THREE.Color(nextScene.tintHex);
        fadeMat.map = nextTex;
        fadeMat.color.copy(pendingTint);
        fadeMat.opacity = 0;
        fadeMat.needsUpdate = true;
        fadeSphere.visible = true;
        fadeProgress = 0;

        // Smoothly orient toward the room's signature focal angle
        viewAnglesRef.current.lon = nextScene.initialYaw;
        viewAnglesRef.current.lat = nextScene.initialPitch;
        viewAnglesRef.current.velLon = 0;
        viewAnglesRef.current.velLat = 0;
      });
    };

    toggleVideoTextureFnRef.current = (enable: boolean) => {
      if (enable && availableVideoUrl) {
        if (!videoEl) {
          videoEl = document.createElement('video');
          videoEl.src = availableVideoUrl;
          videoEl.crossOrigin = 'anonymous';
          videoEl.loop = true;
          videoEl.muted = true;
          videoEl.playsInline = true;
          videoTex = new THREE.VideoTexture(videoEl);
          videoTex.colorSpace = THREE.SRGBColorSpace;
        }
        videoEl.play().catch(() => {
          // Autoplay guard
        });
        if (videoTex) {
          baseMat.map = videoTex;
          baseMat.color.set(0xffffff);
          baseMat.needsUpdate = true;
        }
      } else if (videoEl) {
        videoEl.pause();
        const currentScene = activeSceneRef.current;
        const fallbackTex = getOrLoadTexture(currentScene.panoSrc);
        baseMat.map = fallbackTex;
        baseMat.color.set(currentScene.tintHex);
        baseMat.needsUpdate = true;
      }
    };

    // Pointer Drag & Multi-touch Pinch-to-Zoom Controls
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    const activePointers = new Map<number, { x: number; y: number }>();
    let lastPinchDist = 0;

    const onPointerDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement | null)?.closest('button, a, [data-hotspot-card]')) return;
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (activePointers.size === 1) {
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        viewAnglesRef.current.velLon = 0;
        viewAnglesRef.current.velLat = 0;
      } else if (activePointers.size === 2) {
        const pts = Array.from(activePointers.values());
        lastPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!activePointers.has(e.pointerId)) return;
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (activePointers.size === 2) {
        const pts = Array.from(activePointers.values());
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (lastPinchDist > 0) {
          const delta = lastPinchDist - dist;
          viewAnglesRef.current.targetFov = THREE.MathUtils.clamp(
            viewAnglesRef.current.targetFov + delta * 0.12,
            38,
            85
          );
        }
        lastPinchDist = dist;
        return;
      }

      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;

      const sensitivity = (viewAnglesRef.current.fov / 68) * 0.17;
      viewAnglesRef.current.lon -= dx * sensitivity;
      viewAnglesRef.current.lat = THREE.MathUtils.clamp(
        viewAnglesRef.current.lat + dy * sensitivity,
        -65,
        65
      );
      viewAnglesRef.current.velLon = -dx * sensitivity * 0.65;
      viewAnglesRef.current.velLat = dy * sensitivity * 0.65;
    };

    const onPointerUp = (e: PointerEvent) => {
      activePointers.delete(e.pointerId);
      if (activePointers.size === 0) {
        isDragging = false;
        lastPinchDist = 0;
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      viewAnglesRef.current.targetFov = THREE.MathUtils.clamp(
        viewAnglesRef.current.targetFov + e.deltaY * 0.04,
        38,
        85
      );
    };

    // Mobile Gyroscope Orientation Handler
    const onDeviceOrientation = (e: DeviceOrientationEvent) => {
      if (!gyroActiveRef.current) return;
      if (e.alpha == null || e.beta == null) return;
      viewAnglesRef.current.lon = -e.alpha;
      viewAnglesRef.current.lat = THREE.MathUtils.clamp(e.beta - 65, -55, 55);
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    container.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('deviceorientation', onDeviceOrientation);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 640;
      const h = container.clientHeight || 440;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();
    const lookTarget = new THREE.Vector3();
    const loopIds = { raf: 0, timer: 0 };
    let hotspotSyncFrame = 0;

    const tick = () => {
      const dt = Math.min(clock.getDelta(), 0.05);

      // Smooth inertia when released
      if (!isDragging && !gyroActiveRef.current) {
        viewAnglesRef.current.lon += viewAnglesRef.current.velLon;
        viewAnglesRef.current.lat = THREE.MathUtils.clamp(
          viewAnglesRef.current.lat + viewAnglesRef.current.velLat,
          -65,
          65
        );
        viewAnglesRef.current.velLon *= 0.92;
        viewAnglesRef.current.velLat *= 0.92;

        // Gentle guided 360° pan when Video/Tour Play is active
        if (isVideoTourPlayingRef.current) {
          viewAnglesRef.current.lon += dt * 7.5;
        } else if (Math.abs(viewAnglesRef.current.velLon) < 0.01 && !isSoftwareGl) {
          viewAnglesRef.current.lon += dt * 1.1;
        }
      }

      // Smooth FOV zoom
      if (Math.abs(viewAnglesRef.current.fov - viewAnglesRef.current.targetFov) > 0.05) {
        viewAnglesRef.current.fov = THREE.MathUtils.damp(
          viewAnglesRef.current.fov,
          viewAnglesRef.current.targetFov,
          8,
          dt
        );
        camera.fov = viewAnglesRef.current.fov;
        camera.updateProjectionMatrix();
      }

      // Smooth scene crossfade
      if (fadeProgress < 1 && pendingTargetTex) {
        fadeProgress = Math.min(1, fadeProgress + dt * 2.1);
        fadeMat.opacity = fadeProgress;
        if (fadeProgress >= 1) {
          baseMat.map = pendingTargetTex;
          baseMat.color.copy(pendingTint);
          baseMat.needsUpdate = true;
          fadeSphere.visible = false;
          fadeMat.opacity = 0;
        }
      }

      // Convert lon/lat to camera target
      const phi = THREE.MathUtils.degToRad(90 - viewAnglesRef.current.lat);
      const theta = THREE.MathUtils.degToRad(viewAnglesRef.current.lon);
      lookTarget.set(
        50 * Math.sin(phi) * Math.sin(theta),
        50 * Math.cos(phi),
        -50 * Math.sin(phi) * Math.cos(theta)
      );
      camera.lookAt(lookTarget);
      camera.updateMatrixWorld();

      // Project 3D spherical hotspots onto 2D screen coordinates
      hotspotSyncFrame++;
      if (hotspotSyncFrame % 2 === 0 && container) {
        const w = container.clientWidth || 640;
        const h = container.clientHeight || 440;
        const camDir = new THREE.Vector3();
        camera.getWorldDirection(camDir);

        const nextProjected: ProjectedHotspot[] = activeHotspotsRef.current.map((hs) => {
          const worldPos = sphericalToVector3(hs.yaw, hs.pitch, 42);
          const toPoint = worldPos.clone().normalize();
          const inFront = camDir.dot(toPoint) > 0.15;
          const ndc = worldPos.project(camera);
          const sx = (ndc.x * 0.5 + 0.5) * w;
          const sy = (-ndc.y * 0.5 + 0.5) * h;
          const topSafe = w < 640 ? 118 : 76;
          const insideBounds = sx > 32 && sx < w - 32 && sy > topSafe && sy < h - 84;
          return {
            hotspot: hs,
            x: sx,
            y: sy,
            visible: inFront && insideBounds,
          };
        });
        setProjectedHotspots(nextProjected);
      }

      renderer.render(scene, camera);
      scheduleNextFrame(renderer, tick, loopIds);
    };

    tick();

    return () => {
      cancelAnimationFrame(loopIds.raf);
      window.clearTimeout(loopIds.timer);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      container.removeEventListener('wheel', onWheel);
      window.removeEventListener('deviceorientation', onDeviceOrientation);

      if (videoEl) {
        videoEl.pause();
        videoEl.src = '';
      }
      videoTex?.dispose();
      loadedTextures.forEach((tx) => tx.dispose());
      baseGeo.dispose();
      fadeGeo.dispose();
      baseMat.dispose();
      fadeMat.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [availableVideoUrl]);

  const handleToggleGyro = useCallback(async () => {
    if (gyroActive) {
      setGyroActive(false);
      return;
    }
    const devOrient = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };
    if (typeof devOrient.requestPermission === 'function') {
      try {
        const perm = await devOrient.requestPermission();
        if (perm === 'granted') setGyroActive(true);
      } catch {
        setGyroActive(false);
      }
    } else {
      setGyroActive(true);
    }
  }, [gyroActive]);

  const handleToggleFullscreen = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {
        // Ignore iframe fullscreen restrictions if blocked
      });
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="relative w-full h-[500px] sm:h-[580px] rounded-2xl overflow-hidden border border-[var(--willow-border)] bg-[#14100C] text-[#F4EDE0] select-none"
    >
      {/* Three.js 360° Equirectangular Sphere Viewport */}
      <div
        ref={canvasMountRef}
        data-cursor="cup"
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
      />

      {/* Top Control Bar: Scene Title + Video Tour + Gyro + Fullscreen */}
      <div className="pointer-events-none absolute top-4 inset-x-4 z-20 flex flex-wrap items-start justify-between gap-3">
        <div className="pointer-events-auto px-3.5 py-2 rounded-xl bg-[#14100C]/82 border border-[#F4EDE0]/15 space-y-0.5">
          <div className="flex items-center gap-2 text-[11px] font-mono text-[#C9893B]">
            <span>360° VIEW · {activeScene.num}/06</span>
            <span>·</span>
            <span>{activeScene.shortName}</span>
          </div>
          <p className="text-xs text-[#F4EDE0]/80">
            Drag or swipe 360° · Pinch or scroll to zoom · Tap pins to inspect
          </p>
        </div>

        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          {/* 4K 360° Video Play/Pause Toggle */}
          <button
            type="button"
            onClick={() => setIsVideoTourPlaying((p) => !p)}
            className={`px-3 py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              isVideoTourPlaying
                ? 'bg-[#C9893B] text-[#14100C] border-[#C9893B] font-semibold'
                : 'bg-[#14100C]/82 text-[#F4EDE0] border-[#F4EDE0]/20 hover:border-[#C9893B]'
            }`}
          >
            {isVideoTourPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <Video className="w-3.5 h-3.5" />
            <span>{availableVideoUrl ? '4K 360° Video' : isVideoTourPlaying ? 'Pause 360° Pan' : '360° Tour'}</span>
          </button>

          {/* Optional Mobile Gyroscope Toggle */}
          {gyroSupported && (
            <button
              type="button"
              onClick={handleToggleGyro}
              className={`px-3 py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                gyroActive
                  ? 'bg-[#C9893B] text-[#14100C] border-[#C9893B] font-semibold'
                  : 'bg-[#14100C]/82 text-[#F4EDE0] border-[#F4EDE0]/20 hover:border-[#C9893B]'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Gyro {gyroActive ? 'On' : 'Off'}</span>
            </button>
          )}

          {/* Asset Drop Guide Button (shown while custom /assets/360/ footage hasn't been dropped yet) */}
          {!usingCustomPanoFile && (
            <button
              type="button"
              onClick={() => setShowAssetGuide((v) => !v)}
              title="Where to place your 360° photos & 4K video"
              className="px-2.5 py-2 rounded-xl bg-[#14100C]/82 border border-[#F4EDE0]/20 hover:border-[#C9893B] text-xs text-[#F4EDE0]/85 flex items-center gap-1 cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-[#C9893B]" />
              <span className="hidden sm:inline">360° Source</span>
            </button>
          )}

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen 360 view' : 'Enter fullscreen 360 view'}
            className="w-9 h-9 rounded-xl bg-[#14100C]/82 border border-[#F4EDE0]/20 hover:border-[#C9893B] text-[#F4EDE0] flex items-center justify-center transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Clear Drop-Path Note Popup when viewing Preview Panoramas */}
      {showAssetGuide && !usingCustomPanoFile && (
        <div
          data-hotspot-card
          className="absolute top-20 right-4 z-30 w-80 max-w-[calc(100%-2rem)] p-4 rounded-xl bg-[#1C1611] border border-[#C9893B]/50 text-[#F4EDE0] shadow-2xl space-y-2 text-xs"
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[#C9893B]">360° Media Drop Paths</span>
            <button
              type="button"
              onClick={() => setShowAssetGuide(false)}
              aria-label="Close 360 guide"
              className="text-[#F4EDE0]/70 hover:text-[#F4EDE0] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[#F4EDE0]/80 leading-relaxed">
            Showing equirectangular preview panorama. Drop your captured 360° files at these paths to load automatically:
          </p>
          <div className="p-2.5 rounded-lg bg-[#14100C] font-mono text-[10px] text-[#E8DEC8] space-y-1">
            <p>/public{activeScene.panoSrc}</p>
            <p>/public{TOUR_360_VIDEO_CONFIG.desktop4kSrc}</p>
            <p>/public{TOUR_360_VIDEO_CONFIG.mobileSrc}</p>
          </div>
        </div>
      )}

      {/* Interactive Projected 3D Hotspots */}
      {projectedHotspots.map(({ hotspot, x, y, visible }) =>
        visible ? (
          <button
            key={hotspot.id}
            type="button"
            onClick={() => setSelectedHotspot(hotspot)}
            style={{
              left: `${x}px`,
              top: `${y}px`,
              transform: 'translate(-50%, -50%)',
            }}
            className="group absolute z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#14100C]/88 hover:bg-[#C9893B] text-[#F4EDE0] hover:text-[#14100C] border border-[#C9893B] shadow-lg transition-colors cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-[#C9893B] group-hover:text-[#14100C] shrink-0" />
            <span className="text-xs font-medium whitespace-nowrap">{hotspot.badge}</span>
          </button>
        ) : null
      )}

      {/* Selected Hotspot Info Card */}
      {selectedHotspot && (
        <div
          data-hotspot-card
          className="absolute bottom-24 left-4 right-4 sm:left-6 sm:right-auto sm:w-96 z-30 p-5 rounded-2xl bg-[#1C1611]/96 border border-[#C9893B]/60 text-[#F4EDE0] shadow-2xl space-y-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-[#C9893B]">
                {selectedHotspot.badge}
              </p>
              <h3 className="font-serif text-2xl leading-snug mt-0.5">{selectedHotspot.title}</h3>
            </div>
            <button
              type="button"
              onClick={() => setSelectedHotspot(null)}
              aria-label="Close hotspot details"
              className="w-7 h-7 rounded-lg bg-[#F4EDE0]/10 hover:bg-[#F4EDE0]/20 flex items-center justify-center shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-[#F4EDE0]/80 leading-relaxed">
            {selectedHotspot.description}
          </p>
          <Link
            to={selectedHotspot.ctaTo}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C9893B] hover:text-[#DDA052] transition-colors"
          >
            <span>{selectedHotspot.ctaLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Bottom 6-Scene Thumbnail Switcher Dock */}
      <div className="absolute bottom-3 inset-x-3 sm:inset-x-4 z-20">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar p-1.5 rounded-xl bg-[#14100C]/88 border border-[#F4EDE0]/15">
          {CAFE_360_SCENES.map((sc) => {
            const isActive = sc.id === activeScene.id;
            return (
              <button
                key={sc.id}
                type="button"
                onClick={() => onSelectScene(sc)}
                className={`shrink-0 flex items-center gap-2.5 p-1.5 pr-3 rounded-lg border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#C9893B] text-[#14100C] border-[#C9893B] font-semibold'
                    : 'bg-[#1C1611]/90 text-[#F4EDE0]/85 border-[#F4EDE0]/10 hover:border-[#C9893B]/60'
                }`}
              >
                <ResilientImage
                  src={sc.thumbnail}
                  alt={sc.shortName}
                  compactPlaceholder
                  className="w-9 h-7 rounded object-cover shrink-0"
                />
                <div className="text-left">
                  <p className="text-[10px] font-mono leading-none opacity-75">{sc.num}</p>
                  <p className="text-xs leading-tight whitespace-nowrap">{sc.shortName}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
