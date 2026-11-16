import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Visual reading progress indicator that sits at the very top of the browser viewport.
 * Fills smoothly from left to right as the user scrolls down long-form content pages
 * (Story, Menu, Books & Music, Home), rendered in Willow's warm artisanal amber aesthetic.
 */
export const ReadingProgressBar: React.FC = () => {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    // Reset state on route transition
    setProgress(0);
    setIsVisible(false);

    const updateProgress = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      const maxScroll = docHeight - winHeight;

      if (maxScroll > 60) {
        setIsVisible(true);
        const p = Math.min(1, Math.max(0, scrollY / maxScroll));
        setProgress(p);
      } else {
        // Page has no or negligible overflow
        setIsVisible(false);
        setProgress(0);
      }
    };

    const onScrollOrResize = () => {
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = 0;
          updateProgress();
        });
      }
    };

    // Defer initial check slightly to allow DOM & images to settle
    const timer = setTimeout(updateProgress, 120);

    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);

    return () => {
      clearTimeout(timer);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [location.pathname]);

  if (!isVisible) return null;

  return (
    <div
      role="progressbar"
      aria-label="Reading progress"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="pointer-events-none fixed top-0 inset-x-0 z-40 h-[3px] overflow-hidden"
    >
      {/* Background hairline track */}
      <div className="absolute inset-0 bg-[#2A1D14]/10 dark:bg-[#F4EDE0]/10 backdrop-blur-[1px]" />

      {/* Progress fill: artisanal cafe amber to golden honey gradient */}
      <div
        className="h-full w-full bg-gradient-to-r from-[#C9893B] via-[#DDA052] to-[#E5AA60] origin-left shadow-[0_0_8px_rgba(201,137,59,0.55)] transition-transform duration-100 ease-out will-change-transform"
        style={{
          transform: `scaleX(${progress})`,
        }}
      />

      {/* Luminous ember dot leading the scroll fill */}
      <div
        className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#FAF6F0] shadow-[0_0_6px_#C9893B] transition-[left] duration-100 ease-out"
        style={{
          left: `calc(${progress * 100}% - 3px)`,
          opacity: progress > 0.008 && progress < 0.995 ? 1 : 0,
        }}
      />
    </div>
  );
};
