import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, RotateCcw, ZoomIn, ZoomOut, X } from 'lucide-react';
import { GALLERY_FRAMES, GalleryCard } from '../data/cafeConfig';
import { ResilientImage } from '../components/ResilientImage';

const TILE_W = 1140;
const TILE_H = 880;

const CARD_LAYOUT = [
  { x: 40, y: 40, w: 340, h: 240 },
  { x: 420, y: 30, w: 290, h: 290 },
  { x: 750, y: 55, w: 350, h: 245 },
  { x: 60, y: 330, w: 280, h: 350 },
  { x: 385, y: 365, w: 360, h: 250 },
  { x: 785, y: 345, w: 300, h: 300 },
  { x: 385, y: 650, w: 330, h: 205 },
  { x: 755, y: 675, w: 345, h: 185 },
];

export const GalleryPage: React.FC = () => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const planeRef = useRef<HTMLDivElement | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<'All' | GalleryCard['category']>('All');
  const [zoom, setZoom] = useState(1);
  const [lightboxItem, setLightboxItem] = useState<GalleryCard | null>(null);

  const posRef = useRef({ x: -120, y: -80, vx: 0, vy: 0 });

  useEffect(() => {
    const viewport = viewportRef.current;
    const plane = planeRef.current;
    if (!viewport || !plane) return;

    let dragging = false;
    let prevX = 0;
    let prevY = 0;
    let movedDist = 0;
    let rafId = 0;

    const wrapCoord = (val: number, span: number) => {
      return (((val % span) + span) % span) - span;
    };

    const onPointerDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement | null)?.closest('button')) return;
      dragging = true;
      movedDist = 0;
      prevX = e.clientX;
      prevY = e.clientY;
      posRef.current.vx = 0;
      posRef.current.vy = 0;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      movedDist += Math.hypot(dx, dy);
      posRef.current.x += dx;
      posRef.current.y += dy;
      posRef.current.vx = dx * 0.85;
      posRef.current.vy = dy * 0.85;
      prevX = e.clientX;
      prevY = e.clientY;
    };

    const onPointerUp = () => {
      dragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      posRef.current.x -= e.deltaX * 0.85;
      posRef.current.y -= e.deltaY * 0.85;
    };

    viewport.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp);
    viewport.addEventListener('wheel', onWheel, { passive: false });

    const tick = () => {
      if (!dragging) {
        posRef.current.x += posRef.current.vx;
        posRef.current.y += posRef.current.vy;
        posRef.current.vx *= 0.93;
        posRef.current.vy *= 0.93;
      }

      const wx = wrapCoord(posRef.current.x, TILE_W);
      const wy = wrapCoord(posRef.current.y, TILE_H);

      if (planeRef.current) {
        planeRef.current.style.transform = `translate3d(${wx}px, ${wy}px, 0)`;
      }

      viewport.dataset.dragged = movedDist > 8 ? 'true' : 'false';

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      viewport.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      viewport.removeEventListener('wheel', onWheel);
    };
  }, []);

  const resetCanvas = () => {
    posRef.current = { x: -120, y: -80, vx: 0, vy: 0 };
    setZoom(1);
  };

  return (
    <div className="relative h-[calc(100vh-4rem)] min-h-[580px] w-full overflow-hidden willow-shell select-none">
      {/* Top Overlay Header */}
      <div className="pointer-events-none absolute top-5 inset-x-5 sm:inset-x-8 z-20 flex flex-wrap items-start justify-between gap-4">
        <div className="pointer-events-auto p-4 rounded-xl willow-card border max-w-md">
          <h1 className="font-serif text-2xl sm:text-3xl text-[var(--willow-text)]">
            Infinite Courtyard Canvas
          </h1>
          <p className="text-xs text-[var(--willow-text-secondary)] mt-0.5">
            Drag or swipe in any direction with momentum inertia · Tap any photograph to inspect
          </p>
        </div>

        {/* Category Filter + Zoom Controls */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center p-1 rounded-xl willow-card border gap-1">
            {(['All', 'Space', 'Food & Coffee', 'Books & Vinyl'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-[var(--willow-btn-primary-bg)] text-[var(--willow-btn-primary-fg)] font-semibold'
                    : 'text-[var(--willow-text-secondary)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="inline-flex items-center p-1 rounded-xl willow-card border gap-1">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.75, +(z - 0.12).toFixed(2)))}
              aria-label="Zoom out canvas"
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--willow-subtle)] cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.3, +(z + 0.12).toFixed(2)))}
              aria-label="Zoom in canvas"
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--willow-subtle)] cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={resetCanvas}
              aria-label="Reset canvas position"
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--willow-subtle)] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Free-Drag 3x3 Tiled Infinite Viewport */}
      <div
        ref={viewportRef}
        data-cursor="cup"
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
      >
        <div
          className="w-full h-full origin-center transition-transform duration-200 ease-out"
          style={{ transform: `scale(${zoom})` }}
        >
          <div ref={planeRef} className="relative will-change-transform">
            {[0, 1, 2].map((tx) =>
              [0, 1, 2].map((ty) => (
                <div
                  key={`tile-${tx}-${ty}`}
                  className="absolute"
                  style={{
                    left: `${tx * TILE_W}px`,
                    top: `${ty * TILE_H}px`,
                    width: `${TILE_W}px`,
                    height: `${TILE_H}px`,
                  }}
                >
                  {GALLERY_FRAMES.map((frame, idx) => {
                    const box = CARD_LAYOUT[idx % CARD_LAYOUT.length];
                    const dimmed =
                      categoryFilter !== 'All' && frame.category !== categoryFilter;

                    return (
                      <figure
                        key={`${tx}-${ty}-${frame.id}`}
                        onClick={() => {
                          if (viewportRef.current?.dataset.dragged === 'true') return;
                          setLightboxItem(frame);
                        }}
                        style={{
                          left: `${box.x}px`,
                          top: `${box.y}px`,
                          width: `${box.w}px`,
                          height: `${box.h}px`,
                          opacity: dimmed ? 0.22 : 1,
                        }}
                        className="group absolute rounded-xl overflow-hidden willow-card border transition-opacity duration-300 cursor-pointer"
                      >
                        <ResilientImage
                          src={frame.image}
                          alt={frame.title}
                          draggable={false}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <figcaption className="absolute inset-x-0 bottom-0 p-3.5 bg-gradient-to-t from-black/80 via-black/35 to-transparent text-[#F4EDE0] flex items-end justify-between gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div>
                            <p className="text-[10px] text-[#C9893B]">{frame.category}</p>
                            <p className="font-serif text-lg leading-tight">{frame.title}</p>
                          </div>
                          <Maximize2 className="w-4 h-4 shrink-0 text-[#F4EDE0]/80" />
                        </figcaption>
                      </figure>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Full-Screen Lightbox Modal */}
      {lightboxItem && (
        <div
          onClick={() => setLightboxItem(null)}
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full rounded-2xl overflow-hidden bg-[#1C1611] text-[#F4EDE0] border border-[#F4EDE0]/15 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setLightboxItem(null)}
              aria-label="Close lightbox"
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-lg bg-black/60 text-[#F4EDE0] flex items-center justify-center hover:bg-[#C9893B] hover:text-[#14100C] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="max-h-[70vh] overflow-hidden bg-black flex items-center justify-center">
              <ResilientImage
                src={lightboxItem.image}
                alt={lightboxItem.title}
                className="w-full max-h-[70vh] object-contain"
              />
            </div>
            <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-[#C9893B]">{lightboxItem.category}</p>
                <h2 className="font-serif text-2xl sm:text-3xl">{lightboxItem.title}</h2>
                <p className="text-xs text-[#F4EDE0]/75 mt-1">{lightboxItem.caption}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
