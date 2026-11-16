import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MoveHorizontal, Sun, Moon } from 'lucide-react';
import { CAFE_360_SCENES, CAFE_ASSETS, Cafe360Scene } from '../data/cafeConfig';
import { Panorama360Viewer } from '../components/three/Panorama360Viewer';
import { ResilientImage } from '../components/ResilientImage';
import { ScrollRevealHeading } from '../components/ScrollRevealHeading';
import { VelocityMarquee } from '../components/VelocityMarquee';

export const SpacePage: React.FC = () => {
  const [activeScene, setActiveScene] = useState<Cafe360Scene>(CAFE_360_SCENES[1]); // Start inside Main Hall
  const [splitPercent, setSplitPercent] = useState(52); // 0..100 for Day/Night Split Slider
  const splitContainerRef = useRef<HTMLDivElement | null>(null);

  const updateSplitFromPointer = (clientX: number) => {
    const el = splitContainerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / Math.max(1, rect.width)) * 100;
    setSplitPercent(Math.max(4, Math.min(96, pct)));
  };

  return (
    <div className="space-y-14 py-10 sm:py-14">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl space-y-2">
          <p className="font-hand text-xl text-[var(--willow-amber-text)]">
            Step Inside The Willow · 360° Immersive Tour
          </p>
          <ScrollRevealHeading
            as="h1"
            className="font-serif text-3xl sm:text-5xl font-normal text-[var(--willow-text)]"
          >
            Step Inside The Willow
          </ScrollRevealHeading>
          <p className="text-xs sm:text-sm text-[var(--willow-text-secondary)] leading-relaxed max-w-xl">
            Look around every corner in 360°—drag with mouse or touch, pinch to zoom, enable mobile gyroscope, or tap interactive room hotspots across our six spaces.
          </p>
        </div>
      </div>

      {/* 1. 360° EQUIDIRECTANGULAR SPHERE EXPERIENCE + ACTIVE SCENE ARCHITECTURAL CARD */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
        <div className="lg:col-span-8">
          <Panorama360Viewer activeScene={activeScene} onSelectScene={setActiveScene} />
        </div>

        <div className="lg:col-span-4 p-5 sm:p-6 rounded-2xl willow-card border flex flex-col justify-between space-y-5">
          <div className="space-y-3.5">
            <div className="aspect-[16/10] rounded-xl overflow-hidden">
              <ResilientImage
                src={activeScene.thumbnail}
                alt={activeScene.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-[var(--willow-amber-text)] font-mono tabular-nums">
              <span>Scene {activeScene.num} / 06</span>
              <span aria-hidden="true">·</span>
              <span>{activeScene.seatingCount}</span>
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl text-[var(--willow-text)]">{activeScene.name}</h2>
            <p className="text-xs font-medium text-[var(--willow-sage)]">{activeScene.subtitle}</p>
            <p className="text-xs sm:text-sm text-[var(--willow-text-secondary)] leading-relaxed">
              {activeScene.story}
            </p>

            <div className="pt-2.5 border-t border-[var(--willow-border)] space-y-1.5 text-xs text-[var(--willow-text-secondary)]">
              <p>
                <strong className="text-[var(--willow-text)]">Soundscape:</strong>{' '}
                {activeScene.acousticDetail}
              </p>
              <p>
                <strong className="text-[var(--willow-text)]">Light Character:</strong>{' '}
                {activeScene.lightingDetail}
              </p>
            </div>
          </div>

          <Link
            to="/reservations"
            className="w-full py-2.5 px-4 rounded-lg bg-[var(--willow-btn-primary-bg)] text-[var(--willow-btn-primary-fg)] text-xs font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <span>Book a Seat in {activeScene.shortName}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* Scroll-Reactive Marquee Transition Band */}
      <VelocityMarquee text="EXTERIOR · MAIN HALL · READING NOOK · VINYL CORNER · TERRACE · DESSERT COUNTER · " />

      {/* 2. INTERACTIVE SPLIT-SCREEN "DAY TO NIGHT" COMPARISON SLIDER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-[var(--willow-amber-text)]">
              Golden Morning to Candlelit Dusk
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl text-[var(--willow-text)]">
              Drag Between Morning Sun & Evening Vinyl
            </h2>
          </div>

          <div className="flex items-center gap-3 text-xs tabular-nums">
            <button
              type="button"
              onClick={() => setSplitPercent(88)}
              className="px-3 py-1.5 rounded-lg willow-card border hover:border-[var(--willow-amber)] flex items-center gap-1.5 cursor-pointer"
            >
              <Sun className="w-3.5 h-3.5 text-[#C9893B]" />
              <span>09:00 AM Light</span>
            </button>
            <button
              type="button"
              onClick={() => setSplitPercent(12)}
              className="px-3 py-1.5 rounded-lg willow-card border hover:border-[var(--willow-amber)] flex items-center gap-1.5 cursor-pointer"
            >
              <Moon className="w-3.5 h-3.5 text-[#C9893B]" />
              <span>08:30 PM Glow</span>
            </button>
          </div>
        </div>

        <div
          ref={splitContainerRef}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            updateSplitFromPointer(e.clientX);
          }}
          onPointerMove={(e) => {
            if (e.buttons === 1) {
              updateSplitFromPointer(e.clientX);
            }
          }}
          role="slider"
          aria-label="Day to Night lighting comparison slider"
          aria-valuemin={4}
          aria-valuemax={96}
          aria-valuenow={Math.round(splitPercent)}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') setSplitPercent((p) => Math.max(4, p - 5));
            if (e.key === 'ArrowRight') setSplitPercent((p) => Math.min(96, p + 5));
          }}
          className="relative w-full aspect-[16/9] max-h-[540px] rounded-2xl overflow-hidden border border-[var(--willow-border-strong)] cursor-ew-resize select-none touch-none"
        >
          {/* Base Layer: Evening Candlelit Vinyl Room */}
          <ResilientImage
            src={CAFE_ASSETS.nightAmbiance}
            alt="Evening candlelit vinyl ambience at The Willow Café"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="pointer-events-none absolute bottom-4 right-4 sm:bottom-5 sm:right-5 px-3.5 py-2 rounded-lg bg-[#14100C]/85 text-[#F4EDE0] text-xs">
            08:30 PM · Velvet Banquettes & 33⅓ RPM Vinyl
          </div>

          {/* Clipped Top Layer: Morning Golden-Hour Courtyard */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - splitPercent}% 0 0)` }}
          >
            <ResilientImage
              src={CAFE_ASSETS.heroCourtyard}
              alt="Morning golden-hour sunlight streaming through arched windows"
              className="w-full h-full object-cover"
            />
            <div className="pointer-events-none absolute bottom-4 left-4 sm:bottom-5 sm:left-5 px-3.5 py-2 rounded-lg bg-[#FAF6F0]/92 text-[#2A1D14] text-xs font-medium">
              09:00 AM · Arched Windows & Sourdough Morning
            </div>
          </div>

          {/* Vertical Divider & Brass Drag Handle */}
          <div
            className="pointer-events-none absolute inset-y-0 w-0.5 bg-[#C9893B] shadow-lg"
            style={{ left: `${splitPercent}%` }}
          >
            <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#C9893B] text-[#14100C] shadow-xl flex items-center justify-center">
              <MoveHorizontal className="w-4 h-4" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
