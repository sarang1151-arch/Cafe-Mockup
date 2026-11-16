import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Volume2, VolumeX } from 'lucide-react';
import { useCafe } from '../context/CafeContext';
import { CAFE_ASSETS } from '../data/cafeConfig';

const INTRO_SESSION_KEY = 'willow_intro_v2_seen';
const TITLE_CHARS = Array.from('The Willow Café');

export const CinematicIntro: React.FC = () => {
  const { toggleVinyl, isPlayingVinyl } = useCafe();

  const [mounted, setMounted] = useState(() => {
    if (typeof window === 'undefined') return false;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return false;
    try {
      return sessionStorage.getItem(INTRO_SESSION_KEY) !== 'true';
    } catch {
      return true;
    }
  });

  // Sound is strictly OFF by default per specification
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [doorsOpen, setDoorsOpen] = useState(false);

  const soundEnabledRef = useRef(false);
  const isPlayingVinylRef = useRef(isPlayingVinyl);
  const finishedRef = useRef(false);

  useEffect(() => {
    isPlayingVinylRef.current = isPlayingVinyl;
  }, [isPlayingVinyl]);

  const triggerDoorSplit = useCallback(
    (immediate = false) => {
      if (finishedRef.current) return;
      finishedRef.current = true;

      try {
        sessionStorage.setItem(INTRO_SESSION_KEY, 'true');
      } catch {
        // Ignore storage errors
      }

      setProgress(100);
      setDoorsOpen(true);

      // Notify Hero section to run its entrance reveal as the café doors swing/split open
      window.dispatchEvent(new CustomEvent('willow:intro-doors-opening'));

      if (immediate) {
        window.setTimeout(() => setMounted(false), 420);
      } else {
        window.setTimeout(() => setMounted(false), 820);
      }
    },
    []
  );

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundEnabledRef.current = next;
    // Start or pause subtle café vinyl audio immediately on user gesture
    if (next && !isPlayingVinylRef.current) {
      toggleVinyl();
    } else if (!next && isPlayingVinylRef.current) {
      toggleVinyl();
    }
  };

  useEffect(() => {
    if (!mounted) return;

    // Preload critical hero & first-fold imagery while driving smooth 0 -> 100 counter (< 4s total)
    const preloadUrls = [
      CAFE_ASSETS.heroCourtyard,
      CAFE_ASSETS.singleMatchaLatte,
      CAFE_ASSETS.singleBlueberryCheesecake,
      CAFE_ASSETS.trufflePasta,
    ];

    let loadedAssets = 0;
    preloadUrls.forEach((url) => {
      const img = new Image();
      img.onload = () => {
        loadedAssets += 1;
      };
      img.onerror = () => {
        loadedAssets += 1;
      };
      img.src = url;
    });

    const durationMs = 2350; // Counter reaches 100 at ~2.35s, doors finish splitting at ~3.25s (< 4.0s)
    const startTime = performance.now();
    let rafId = 0;
    let splitTimer = 0;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const timeRatio = Math.min(1, elapsed / durationMs);
      const assetRatio = loadedAssets / preloadUrls.length;
      const blended = Math.min(1, timeRatio * 0.82 + assetRatio * 0.18);
      const eased = 1 - Math.pow(1 - blended, 2.4);
      const pct = timeRatio >= 1 ? 100 : Math.min(99, Math.round(eased * 100));

      setProgress(pct);

      if (timeRatio < 1 && !finishedRef.current) {
        rafId = requestAnimationFrame(tick);
      } else if (!finishedRef.current) {
        setProgress(100);
        splitTimer = window.setTimeout(() => {
          triggerDoorSplit(false);
        }, 120);
      }
    };

    rafId = requestAnimationFrame(tick);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        triggerDoorSplit(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(splitTimer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [mounted, triggerDoorSplit]);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-[100] pointer-events-auto overflow-hidden select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Opening The Willow Café"
    >
      {/* LEFT CAFÉ DOOR PANEL */}
      <motion.div
        initial={{ x: '0%' }}
        animate={{ x: doorsOpen ? '-102%' : '0%' }}
        transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
        className="absolute inset-y-0 left-0 w-1/2 bg-[#14100C] border-r border-[#C9893B]/30"
      >
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'radial-gradient(circle at 100% 50%, rgba(201, 137, 59, 0.18), transparent 68%)',
          }}
        />
        {/* Subtle Café Door Brass Handle Bar */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-[3px] h-20 rounded-full bg-[#C9893B]/45" />
      </motion.div>

      {/* RIGHT CAFÉ DOOR PANEL */}
      <motion.div
        initial={{ x: '0%' }}
        animate={{ x: doorsOpen ? '102%' : '0%' }}
        transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
        className="absolute inset-y-0 right-0 w-1/2 bg-[#14100C] border-l border-[#C9893B]/30"
      >
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'radial-gradient(circle at 0% 50%, rgba(201, 137, 59, 0.18), transparent 68%)',
          }}
        />
        {/* Subtle Café Door Brass Handle Bar */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-[3px] h-20 rounded-full bg-[#C9893B]/45" />
      </motion.div>

      {/* FOREGROUND INTRO CONTENT (Fades cleanly as doors part) */}
      <motion.div
        animate={{
          opacity: doorsOpen ? 0 : 1,
          scale: doorsOpen ? 1.04 : 1,
        }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
        className="relative z-10 h-full w-full flex flex-col items-center justify-between px-6 py-7 text-[#F4EDE0]"
      >
        {/* Top Controls: Sound Toggle (OFF by default) + Skip Button */}
        <div className="w-full max-w-6xl flex items-center justify-between gap-4 text-xs">
          <button
            type="button"
            onClick={handleToggleSound}
            aria-pressed={soundEnabled}
            className="px-3.5 py-2 rounded-lg border border-[#F4EDE0]/20 hover:border-[#C9893B] text-[#F4EDE0]/85 hover:text-[#C9893B] transition-colors flex items-center gap-2 cursor-pointer"
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-[#C9893B]" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-[#F4EDE0]/65" />
            )}
            <span>Sound: {soundEnabled ? 'On' : 'Off'}</span>
          </button>

          <button
            type="button"
            onClick={() => triggerDoorSplit(true)}
            className="px-4 py-2 rounded-lg border border-[#F4EDE0]/20 hover:border-[#C9893B] text-[#F4EDE0]/85 hover:text-[#C9893B] transition-colors cursor-pointer"
          >
            Skip
          </button>
        </div>

        {/* Center Sequence: Rising Steam -> Letter-by-Letter "The Willow Café" -> "Coffee · Food · Books" */}
        <div className="flex flex-col items-center text-center max-w-2xl my-auto">
          {/* Rising Steam SVG */}
          <svg
            viewBox="0 0 120 92"
            className="w-24 h-20 mb-3 overflow-visible"
            aria-hidden="true"
          >
            <motion.path
              d="M42 78 C 34 58, 52 38, 40 12"
              fill="none"
              stroke="#C9893B"
              strokeWidth="1.8"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0, y: 6 }}
              animate={{
                pathLength: [0, 1, 1],
                opacity: [0, 0.8, 0],
                y: [6, -4, -14],
              }}
              transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.path
              d="M60 82 C 70 58, 50 34, 62 6"
              fill="none"
              stroke="#F4EDE0"
              strokeWidth="2.1"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0, y: 8 }}
              animate={{
                pathLength: [0, 1, 1],
                opacity: [0, 0.9, 0],
                y: [8, -4, -16],
              }}
              transition={{ duration: 2.3, delay: 0.2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.path
              d="M78 78 C 86 58, 70 38, 80 14"
              fill="none"
              stroke="#C9893B"
              strokeWidth="1.7"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0, y: 6 }}
              animate={{
                pathLength: [0, 1, 1],
                opacity: [0, 0.72, 0],
                y: [6, -4, -12],
              }}
              transition={{ duration: 2.2, delay: 0.4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.path
              d="M36 86 Q 60 92 84 86"
              fill="none"
              stroke="#C9893B"
              strokeWidth="1.5"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.75 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            />
          </svg>

          {/* Letter-by-Letter Drawing Headline */}
          <h1
            className="font-serif text-4xl sm:text-6xl md:text-7xl font-normal tracking-tight text-[#F4EDE0] flex flex-wrap justify-center"
            aria-label="The Willow Café"
          >
            {TITLE_CHARS.map((ch, idx) => (
              <motion.span
                key={`${ch}-${idx}`}
                initial={{ opacity: 0, y: 18, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{
                  duration: 0.44,
                  delay: 0.14 + idx * 0.055,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="inline-block"
              >
                {ch === ' ' ? '\u00A0' : ch}
              </motion.span>
            ))}
          </h1>

          {/* Tagline Revealing After Wordmark */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 1.15, ease: [0.22, 1, 0.36, 1] }}
            className="mt-3 text-xs sm:text-sm uppercase tracking-[0.28em] text-[#C9893B]"
          >
            Coffee · Food · Books
          </motion.p>
        </div>

        {/* Bottom Asset Progress Counter (0 to 100) */}
        <div className="w-full max-w-xs space-y-2 text-center">
          <div className="flex items-center justify-between text-xs font-mono tabular-nums text-[#F4EDE0]/75">
            <span>Opening the courtyard</span>
            <span className="text-[#C9893B] font-semibold">{progress}%</span>
          </div>
          <div className="h-[2px] w-full rounded-full bg-[#F4EDE0]/15 overflow-hidden">
            <div
              className="h-full bg-[#C9893B] transition-[width] duration-75 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};
