import React, { useEffect, useRef } from 'react';

interface VelocityMarqueeProps {
  text?: string;
  baseSpeed?: number;
  className?: string;
}

export const VelocityMarquee: React.FC<VelocityMarqueeProps> = ({
  text = 'Coffee · Food · Books · Music · Sourdough · Single-Origin · ',
  baseSpeed = 0.038,
  className = '',
}) => {
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    let offsetPercent = 0;
    let direction = 1;
    let scrollBoost = 0;
    let lastScrollY = window.scrollY;
    let lastTime = performance.now();
    let rafId = 0;

    const onScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY;
      lastScrollY = currentY;
      if (Math.abs(delta) > 0.5) {
        direction = delta >= 0 ? 1 : -1;
        scrollBoost = Math.min(0.28, Math.abs(delta) * 0.0045);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    const tick = (now: number) => {
      const dt = Math.min(48, now - lastTime);
      lastTime = now;

      scrollBoost *= 0.92;
      const velocity = (baseSpeed + scrollBoost) * direction * (dt / 16.67);
      offsetPercent -= velocity;

      if (offsetPercent <= -50) offsetPercent += 50;
      if (offsetPercent > 0) offsetPercent -= 50;

      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(${offsetPercent}%, 0, 0)`;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
    };
  }, [baseSpeed]);

  return (
    <div
      className={`w-full overflow-hidden py-5 border-y border-[var(--willow-border)] select-none ${className}`}
      aria-hidden="true"
    >
      <div ref={trackRef} className="flex w-max whitespace-nowrap will-change-transform">
        <span className="font-serif text-3xl sm:text-5xl md:text-6xl font-normal tracking-tight text-[var(--willow-text)] opacity-85 pr-6">
          {text}
          {text}
        </span>
        <span className="font-serif text-3xl sm:text-5xl md:text-6xl font-normal tracking-tight text-[var(--willow-text)] opacity-85 pr-6">
          {text}
          {text}
        </span>
      </div>
    </div>
  );
};
