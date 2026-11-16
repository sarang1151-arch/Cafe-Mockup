import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  Disc3,
  Pause,
  Play,
  RotateCw,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Volume2,
} from 'lucide-react';
import {
  VINYL_MUSIC_STYLES,
  VINYL_PLAYLIST,
  VinylMusicStyle,
} from '../data/cafeConfig';
import { useCafe } from '../context/CafeContext';
import { vinylAudio } from '../utils/audioEngine';

function formatSeconds(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

export const VinylPlayer: React.FC = () => {
  const {
    isPlayingVinyl,
    activeTrackIndex,
    musicStyle,
    rpm,
    crackleLevel,
    volume,
    toggleVinyl,
    startVinyl,
    selectTrack,
    nextTrack,
    prevTrack,
    setMusicStyle,
    setRpm,
    setCrackleLevel,
    setVolume,
  } = useCafe();

  const shouldReduceMotion = useReducedMotion();
  const activeTrack = VINYL_PLAYLIST[activeTrackIndex] || VINYL_PLAYLIST[0];
  const activeStyleMeta = useMemo(
    () => VINYL_MUSIC_STYLES.find((s) => s.id === musicStyle) || VINYL_MUSIC_STYLES[0],
    [musicStyle]
  );

  // Elapsed playback time inside active track (loops cleanly or advances track)
  const [elapsedSec, setElapsedSec] = useState(0);
  useEffect(() => {
    setElapsedSec(0);
  }, [activeTrackIndex]);

  useEffect(() => {
    if (!isPlayingVinyl) return;
    const stepMs = 500;
    const increment = rpm === 45 ? 0.58 : 0.5;
    const id = window.setInterval(() => {
      setElapsedSec((prev) => {
        const next = prev + increment;
        if (next >= activeTrack.durationSec) {
          return 0;
        }
        return next;
      });
    }, stepMs);
    return () => window.clearInterval(id);
  }, [isPlayingVinyl, rpm, activeTrack.durationSec]);

  // Physics-driven Vinyl Platter Rotation + Manual Pointer Spin
  const platterRef = useRef<HTMLDivElement | null>(null);
  const discElemRef = useRef<HTMLDivElement | null>(null);
  const rotationRef = useRef<number>(0);
  const angularVelRef = useRef<number>(0); // deg per frame
  const isDraggingRef = useRef<boolean>(false);
  const dragMovedDegRef = useRef<number>(0);
  const prevPointerAngleRef = useRef<number>(0);
  const lastCueTimestampRef = useRef<number>(0);
  const [isDraggingPlatter, setIsDraggingPlatter] = useState(false);
  const [spinStatusNote, setSpinStatusNote] = useState<string | null>(null);

  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(48, Math.max(4, now - lastTime)) / 16.667; // Normalized 60fps frame
      lastTime = now;

      if (!isDraggingRef.current) {
        const baseSpeed = isPlayingVinyl ? (rpm === 45 ? 1.35 : 0.85) : 0;
        // Smoothly ease extra manual spin inertia back to target platter speed
        angularVelRef.current += (baseSpeed - angularVelRef.current) * 0.08 * dt;
        if (Math.abs(angularVelRef.current) < 0.005 && !isPlayingVinyl) {
          angularVelRef.current = 0;
        }
        rotationRef.current = (rotationRef.current + angularVelRef.current * dt) % 360000;

        // Reflect inertia velocity in audio pitch briefly
        const extra = angularVelRef.current - baseSpeed;
        vinylAudio.setSpinPitchOffset(Math.abs(extra) > 0.15 ? extra * 0.03 : 0);
      }

      if (discElemRef.current && !shouldReduceMotion) {
        discElemRef.current.style.transform = `rotate(${rotationRef.current.toFixed(2)}deg)`;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      vinylAudio.setSpinPitchOffset(0);
    };
  }, [isPlayingVinyl, rpm, shouldReduceMotion]);

  const getPointerAngleDeg = (clientX: number, clientY: number): number => {
    const el = platterRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI;
  };

  const handlePlatterPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    setIsDraggingPlatter(true);
    dragMovedDegRef.current = 0;
    prevPointerAngleRef.current = getPointerAngleDeg(e.clientX, e.clientY);
  };

  const handlePlatterPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const angle = getPointerAngleDeg(e.clientX, e.clientY);
    let delta = angle - prevPointerAngleRef.current;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    prevPointerAngleRef.current = angle;

    rotationRef.current += delta;
    angularVelRef.current = delta * 0.85;
    dragMovedDegRef.current += Math.abs(delta);

    if (discElemRef.current && !shouldReduceMotion) {
      discElemRef.current.style.transform = `rotate(${rotationRef.current.toFixed(2)}deg)`;
    }

    // Gentle pitch-bend & groove cue while spinning manually
    vinylAudio.setSpinPitchOffset(delta * 0.025);
    const now = performance.now();
    if (Math.abs(delta) > 4 && now - lastCueTimestampRef.current > 110) {
      lastCueTimestampRef.current = now;
      vinylAudio.playManualSpinCue(delta / 8);
    }

    // Scrub playback progress slightly with spin direction
    if (Math.abs(delta) > 0.5) {
      setElapsedSec((prev) => {
        const next = prev + delta * 0.08;
        if (next < 0) return activeTrack.durationSec + next;
        if (next >= activeTrack.durationSec) return next - activeTrack.durationSec;
        return next;
      });
    }
  };

  const handlePlatterPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    isDraggingRef.current = false;
    setIsDraggingPlatter(false);

    // Tap (< 6 deg drag) toggles play/pause; deliberate spin starts playback if paused
    if (dragMovedDegRef.current < 6) {
      toggleVinyl();
    } else if (!isPlayingVinyl && dragMovedDegRef.current >= 22) {
      startVinyl();
      setSpinStatusNote('Record spun into motion');
      window.setTimeout(() => setSpinStatusNote(null), 1800);
    }
  };

  const handleSpinImpulse = () => {
    angularVelRef.current = 11.5;
    vinylAudio.playManualSpinCue(1.5);
    if (!isPlayingVinyl) {
      startVinyl();
    }
    setSpinStatusNote('Flicked platter');
    window.setTimeout(() => setSpinStatusNote(null), 1400);
  };

  const progressRatio = Math.min(1, elapsedSec / Math.max(1, activeTrack.durationSec));
  // Arm sweeps smoothly from outer groove (21deg) to inner run-out (33deg)
  const tonearmDeg = isPlayingVinyl ? 21 + progressRatio * 12 : -5;

  return (
    <section
      aria-label="Interactive Analog Vinyl Player"
      className="p-5 sm:p-8 lg:p-10 rounded-2xl bg-[#1B1511] text-[#F4EDE0] border border-[#F4EDE0]/12 space-y-8 shadow-xl"
    >
      {/* Top Section Header + Live Mode */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-[#F4EDE0]/10">
        <div className="space-y-1">
          <p className="text-xs font-mono text-[#C9893B] tracking-wide">
            Now Playing · Analog Turntable &amp; Style Synthesizer
          </p>
          <h2 className="font-serif text-2xl sm:text-4xl text-[#F4EDE0]">
            Willow Listening Room
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-[#F4EDE0]/75">
          <span>Drag or flick the record to spin manually</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums text-[#C9893B]">
            {isPlayingVinyl ? `${rpm === 33 ? '33⅓' : '45'} RPM Active` : 'Standby'}
          </span>
        </div>
      </div>

      {/* Main Split: Turntable Deck (Left) + Dynamic Style & Now Playing Track List (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* LEFT COLUMN: Interactive Direct-Drive Plinth + Transport */}
        <div className="lg:col-span-6 flex flex-col items-center space-y-5">
          <div className="relative w-full max-w-[390px] aspect-square rounded-2xl bg-gradient-to-br from-[#523622] via-[#3A2416] to-[#26170E] p-5 sm:p-7 border border-white/15 shadow-2xl flex items-center justify-center select-none">
            {/* Ambient warm lamp glow matching active music style */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-4 rounded-2xl opacity-25 blur-2xl transition-colors duration-500"
              style={{ backgroundColor: activeStyleMeta.accentHex }}
            />

            {/* Strobe Cast-Aluminum Platter Ring */}
            <div
              ref={platterRef}
              onPointerDown={handlePlatterPointerDown}
              onPointerMove={handlePlatterPointerMove}
              onPointerUp={handlePlatterPointerUp}
              onPointerCancel={handlePlatterPointerUp}
              role="slider"
              tabIndex={0}
              aria-label="Interactive vinyl record platter. Click to play or pause, drag to spin manually."
              aria-valuemin={0}
              aria-valuemax={activeTrack.durationSec}
              aria-valuenow={Math.round(elapsedSec)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleVinyl();
                } else if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  handleSpinImpulse();
                }
              }}
              className={`relative w-[80%] aspect-square rounded-full bg-[#120E0B] p-2.5 shadow-inner flex items-center justify-center border border-white/15 touch-none ${
                isDraggingPlatter ? 'cursor-grabbing' : 'cursor-grab'
              }`}
            >
              {/* Spinning 12-inch Vinyl Disc */}
              <div
                ref={discElemRef}
                className="w-full h-full rounded-full bg-[#090807] relative flex items-center justify-center will-change-transform"
              >
                {/* Micro-grooves */}
                <div className="pointer-events-none absolute inset-2.5 rounded-full border border-white/10" />
                <div className="pointer-events-none absolute inset-6 rounded-full border border-white/8" />
                <div className="pointer-events-none absolute inset-9.5 rounded-full border border-white/10" />
                <div className="pointer-events-none absolute inset-13 rounded-full border border-white/7" />
                <div className="pointer-events-none absolute inset-17 rounded-full border border-white/10" />

                {/* Anisotropic Specular Highlight */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-full opacity-25"
                  style={{
                    background:
                      'conic-gradient(from 35deg, transparent 0deg, rgba(255,255,255,0.5) 24deg, transparent 56deg, transparent 180deg, rgba(255,255,255,0.45) 205deg, transparent 235deg)',
                  }}
                />

                {/* Center Label with Dynamic Style & Track Accent */}
                <div
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center text-center p-2.5 border-2 border-black/35 shadow-inner transition-colors duration-300"
                  style={{ backgroundColor: activeTrack.labelColor, color: '#FAF6F0' }}
                >
                  <span className="text-[8px] font-mono tracking-wider uppercase opacity-85">
                    {activeStyleMeta.shortLabel}
                  </span>
                  <span className="font-serif text-[11px] sm:text-xs font-semibold line-clamp-2 mt-0.5 leading-tight">
                    {activeTrack.title}
                  </span>
                  <div className="w-3 h-3 rounded-full bg-[#120E0B] mt-1.5 border border-white/35" />
                </div>
              </div>
            </div>

            {/* Articulated Brass Tonearm */}
            <div
              className="pointer-events-none absolute top-5 right-5 w-24 h-56 origin-[76%_14%] transition-transform duration-700 ease-out"
              style={{ transform: `rotate(${tonearmDeg.toFixed(1)}deg)` }}
            >
              <div className="absolute top-3 right-3 w-9 h-9 rounded-full bg-gradient-to-br from-[#D7A259] to-[#7D5726] border border-white/25 shadow-md" />
              <div className="absolute top-7 right-[26px] w-1.5 h-40 bg-gradient-to-b from-[#E5D5BC] to-[#9E8B70] rounded-full origin-top rotate-[8deg] shadow-md" />
              <div className="absolute bottom-3 right-[33px] w-4 h-7 rounded-xs bg-[#1C1611] border border-[#C9893B]/65 rotate-[14deg]" />
            </div>

            {/* Bottom-Left RPM Switch */}
            <div className="absolute bottom-3.5 left-3.5 flex items-center gap-1 bg-black/60 p-1 rounded-lg border border-white/15">
              {([33, 45] as const).map((speed) => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => setRpm(speed)}
                  className={`px-2 py-1 rounded text-[11px] font-mono tabular-nums cursor-pointer transition-colors ${
                    rpm === speed
                      ? 'bg-[#C9893B] text-[#14100C] font-semibold'
                      : 'text-[#F4EDE0]/75 hover:text-[#F4EDE0]'
                  }`}
                >
                  {speed === 33 ? '33⅓' : '45'}
                </button>
              ))}
            </div>

            {/* Bottom-Right Direct-Spin Impulse + Drop Needle */}
            <div className="absolute bottom-3.5 right-3.5 flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleSpinImpulse}
                title="Give the record an analog spin impulse"
                className="px-2.5 py-2 rounded-lg bg-black/60 hover:bg-black/80 text-[#F4EDE0] border border-white/15 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5 text-[#C9893B]" />
                <span className="hidden sm:inline">Spin</span>
              </button>
              <button
                type="button"
                onClick={toggleVinyl}
                className="px-3.5 py-2 rounded-lg bg-[#C9893B] hover:bg-[#DDA052] text-[#14100C] text-xs font-semibold flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
              >
                {isPlayingVinyl ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlayingVinyl ? 'Lift Arm' : 'Drop Needle'}</span>
              </button>
            </div>
          </div>

          {/* Now Playing Readout & Interactive Scrubber */}
          <div className="w-full max-w-[390px] p-4 rounded-xl bg-[#14100C] border border-[#F4EDE0]/12 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[11px] font-mono text-[#C9893B]">
                  {isPlayingVinyl && !shouldReduceMotion ? (
                    <span className="inline-flex items-end gap-0.5 h-3" aria-hidden="true">
                      <span className="w-0.5 bg-[#C9893B] animate-[pulse_0.7s_ease-in-out_infinite] h-2.5" />
                      <span className="w-0.5 bg-[#C9893B] animate-[pulse_0.5s_ease-in-out_infinite] h-3" />
                      <span className="w-0.5 bg-[#C9893B] animate-[pulse_0.85s_ease-in-out_infinite] h-1.5" />
                    </span>
                  ) : (
                    <Disc3 className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {spinStatusNote ||
                      (isPlayingVinyl ? 'Now Playing' : 'Ready on Platter')}
                  </span>
                </div>
                <h3 className="font-serif text-xl text-[#F4EDE0] truncate mt-0.5">
                  {activeTrack.title}
                </h3>
                <p className="text-xs text-[#F4EDE0]/65 truncate">
                  {activeTrack.artist} · {activeTrack.album} ({activeTrack.year})
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={prevTrack}
                  aria-label="Previous vinyl record"
                  className="w-8 h-8 rounded-lg border border-white/12 hover:border-[#C9893B] flex items-center justify-center text-[#F4EDE0]/80 hover:text-[#C9893B] transition-colors cursor-pointer"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={nextTrack}
                  aria-label="Next vinyl record"
                  className="w-8 h-8 rounded-lg border border-white/12 hover:border-[#C9893B] flex items-center justify-center text-[#F4EDE0]/80 hover:text-[#C9893B] transition-colors cursor-pointer"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Interactive Groove Scrubber */}
            <div className="space-y-1">
              <input
                type="range"
                min={0}
                max={activeTrack.durationSec}
                value={Math.floor(elapsedSec)}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setElapsedSec(val);
                  rotationRef.current += 18;
                }}
                aria-label="Seek track groove position"
                className="w-full h-1.5 accent-[#C9893B] cursor-pointer"
              />
              <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-[#F4EDE0]/60">
                <span>{formatSeconds(elapsedSec)}</span>
                <span>{activeTrack.keySignature}</span>
                <span>{activeTrack.duration}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Dynamic Background Music Style Switcher + Now Playing Track List */}
        <div className="lg:col-span-6 space-y-6">
          {/* 1. Dynamic Background Music Style Switcher */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#14100C] border border-[#F4EDE0]/12 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-[#F4EDE0] flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#C9893B]" />
                <span>Background Music Style</span>
              </span>
              <span className="text-[11px] font-mono text-[#C9893B]">
                Live Web Audio Synth
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {VINYL_MUSIC_STYLES.map((styleOpt) => {
                const isActive = musicStyle === styleOpt.id;
                return (
                  <button
                    key={styleOpt.id}
                    type="button"
                    onClick={() => setMusicStyle(styleOpt.id)}
                    aria-pressed={isActive}
                    className={`relative px-3 py-2 rounded-lg border text-left text-xs transition-colors cursor-pointer ${
                      isActive
                        ? 'border-[#C9893B] text-[#14100C] font-semibold'
                        : 'border-[#F4EDE0]/12 bg-[#1B1511] text-[#F4EDE0]/80 hover:border-[#C9893B]/60'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="willow-vinyl-style-pill"
                        transition={
                          shouldReduceMotion
                            ? { duration: 0 }
                            : { type: 'spring', stiffness: 400, damping: 30 }
                        }
                        className="absolute inset-0 rounded-lg bg-[#C9893B]"
                      />
                    )}
                    <span className="relative z-10 block truncate">{styleOpt.label}</span>
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeStyleMeta.id}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.18 }}
                className="pt-1 space-y-0.5"
              >
                <p className="text-xs text-[#F4EDE0]/80 leading-relaxed">
                  {activeStyleMeta.description}
                </p>
                <p className="text-[11px] font-mono text-[#C9893B]/90">
                  {activeStyleMeta.timbreNote}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* 2. Analog Preamp Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#14100C] border border-[#F4EDE0]/12 text-xs">
            <label className="space-y-1.5 block">
              <span className="flex items-center justify-between text-[#F4EDE0]/80">
                <span className="flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-[#C9893B]" />
                  <span>Tube Amp Volume</span>
                </span>
                <span className="font-mono tabular-nums">{Math.round(volume * 100)}%</span>
              </span>
              <input
                type="range"
                min={0.05}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full accent-[#C9893B] cursor-pointer"
              />
            </label>

            <label className="space-y-1.5 block">
              <span className="flex items-center justify-between text-[#F4EDE0]/80">
                <span className="flex items-center gap-1.5">
                  <Disc3 className="w-3.5 h-3.5 text-[#C9893B]" />
                  <span>Vinyl Crackle Warmth</span>
                </span>
                <span className="font-mono tabular-nums">{Math.round(crackleLevel * 1000)}</span>
              </span>
              <input
                type="range"
                min={0}
                max={0.14}
                step={0.01}
                value={crackleLevel}
                onChange={(e) => setCrackleLevel(Number(e.target.value))}
                className="w-full accent-[#C9893B] cursor-pointer"
              />
            </label>
          </div>

          {/* 3. 'Now Playing' Crate Track List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#F4EDE0]/75">
              <span className="font-medium text-[#F4EDE0]">Now Playing Crate</span>
              <span className="font-mono tabular-nums text-[11px] text-[#F4EDE0]/55">
                {VINYL_PLAYLIST.length} LP Pressings
              </span>
            </div>

            <div className="divide-y divide-[#F4EDE0]/10 border-t border-b border-[#F4EDE0]/10">
              {VINYL_PLAYLIST.map((track, idx) => {
                const isSelected = idx === activeTrackIndex;
                const recStyle = VINYL_MUSIC_STYLES.find((s) => s.id === track.recommendedStyle);
                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => selectTrack(idx, true)}
                    className={`w-full py-3.5 px-3 flex items-center justify-between gap-4 text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#F4EDE0]/10 text-[#C9893B]'
                        : 'hover:bg-[#F4EDE0]/5 text-[#F4EDE0]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/25"
                        style={{ backgroundColor: track.labelColor }}
                      />
                      <span className="font-mono text-xs tabular-nums opacity-65 shrink-0">
                        0{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-serif text-base sm:text-lg leading-snug truncate">
                          {track.title}
                        </p>
                        <p className="text-[11px] text-[#F4EDE0]/60 truncate">
                          {track.artist} · {track.keySignature}
                          {recStyle ? ` · Suited to ${recStyle.shortLabel}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      {isSelected && isPlayingVinyl && (
                        <span className="text-[10px] font-mono text-[#C9893B] hidden sm:inline">
                          Spinning
                        </span>
                      )}
                      <span className="font-mono text-xs tabular-nums text-[#F4EDE0]/70">
                        {track.duration}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * Compact persistent listening dock shown on desktop/tablet when vinyl is playing
 * outside /books-music so visitors can switch tracks or styles while browsing the café.
 */
export const VinylMiniDock: React.FC = () => {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const {
    isPlayingVinyl,
    activeTrackIndex,
    musicStyle,
    toggleVinyl,
    nextTrack,
    setMusicStyle,
  } = useCafe();

  if (!isPlayingVinyl || location.pathname === '/books-music') {
    return null;
  }

  const activeTrack = VINYL_PLAYLIST[activeTrackIndex] || VINYL_PLAYLIST[0];

  return (
    <AnimatePresence>
      <motion.aside
        key="vinyl-mini-dock"
        aria-label="Now Playing Mini Vinyl Bar"
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.24 }}
        className="hidden sm:flex fixed bottom-5 left-5 z-30 items-center gap-2.5 px-3 py-2 rounded-xl bg-[#1B1511]/95 text-[#F4EDE0] border border-[#F4EDE0]/15 shadow-xl backdrop-blur-md max-w-[420px]"
      >
        <Link
          to="/books-music"
          aria-label="Open full Vinyl Player"
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border border-white/20 animate-spin"
          style={{
            backgroundColor: activeTrack.labelColor,
            animationDuration: '4.5s',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#120E0B]" />
        </Link>

        <div className="min-w-0 flex-1 pr-1">
          <Link
            to="/books-music"
            className="block font-serif text-xs text-[#F4EDE0] hover:text-[#C9893B] truncate transition-colors"
          >
            {activeTrack.title}
          </Link>
          <p className="text-[10px] text-[#F4EDE0]/60 truncate">
            {activeTrack.artist}
          </p>
        </div>

        <select
          aria-label="Change background music style"
          value={musicStyle}
          onChange={(e) => setMusicStyle(e.target.value as VinylMusicStyle)}
          className="px-2 py-1 rounded-md bg-[#14100C] border border-[#F4EDE0]/15 text-[11px] text-[#C9893B] focus:outline-none focus:border-[#C9893B] cursor-pointer"
        >
          {VINYL_MUSIC_STYLES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.shortLabel}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={nextTrack}
          aria-label="Next vinyl track"
          className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-[#F4EDE0]/80 hover:text-[#C9893B] cursor-pointer transition-colors"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={toggleVinyl}
          aria-label="Pause vinyl player"
          className="w-7 h-7 rounded-lg bg-[#C9893B] hover:bg-[#DDA052] text-[#14100C] flex items-center justify-center cursor-pointer transition-colors"
        >
          <Pause className="w-3.5 h-3.5" />
        </button>
      </motion.aside>
    </AnimatePresence>
  );
};
