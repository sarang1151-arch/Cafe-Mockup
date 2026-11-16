import React, { useEffect, useRef, useState } from 'react';
import { useCafe } from '../context/CafeContext';

interface SteamPuff {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  turbulence: number;
  phase: number;
  phaseSpeed: number;
  growth: number;
  fade: number;
}

export const CustomCursorAndSteam: React.FC = () => {
  const { steamTrailEnabled, theme } = useCafe();
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDesktopPointer, setIsDesktopPointer] = useState(false);
  const [isHoveringInteractive, setIsHoveringInteractive] = useState(false);
  const [pointerVisible, setPointerVisible] = useState(false);

  useEffect(() => {
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setIsDesktopPointer(finePointer && !reduced);
  }, []);

  useEffect(() => {
    if (!isDesktopPointer) return;

    let mouseX = -100;
    let mouseY = -100;
    let prevMouseX = -100;
    let prevMouseY = -100;
    let curX = -100;
    let curY = -100;
    let prevCurX = -100;
    let prevCurY = -100;
    let velX = 0;
    let velY = 0;
    let smoothedSpeed = 0;
    let initialized = false;
    let lastPuffTime = 0;
    let lastMoveTime = performance.now();
    const puffs: SteamPuff[] = [];

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    const resize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const spawnPuff = (x: number, y: number, speedFactor: number, moveVx: number, moveVy: number) => {
      // Turbulence & dispersion scale up strongly when mouse moves fast
      const turb = 0.35 + speedFactor * 2.8;
      const spreadAngle = Math.random() * Math.PI * 2;
      const burstSpeed = (0.15 + Math.random() * 0.45) * speedFactor * 2.1;

      // Slight trailing drag opposite fast movement + lateral curl dispersion
      const wakeVx = -moveVx * 0.085 + Math.cos(spreadAngle) * burstSpeed;
      const wakeVy = -moveVy * 0.045 + Math.sin(spreadAngle) * burstSpeed * 0.65;

      puffs.push({
        x: x + (Math.random() - 0.5) * (5 + speedFactor * 14),
        y: y - 10 + (Math.random() - 0.5) * (3 + speedFactor * 8),
        vx: (Math.random() - 0.5) * (0.34 + speedFactor * 1.4) + wakeVx,
        vy: -0.58 - Math.random() * (0.42 + speedFactor * 0.6) + wakeVy,
        radius: 3.4 + Math.random() * (4.2 + speedFactor * 3.5),
        alpha: Math.max(0.14, 0.25 - speedFactor * 0.05),
        turbulence: turb,
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: 0.045 + Math.random() * 0.05 + speedFactor * 0.07,
        growth: 0.15 + speedFactor * 0.24,
        fade: 0.0046 + speedFactor * 0.0024,
      });

      if (puffs.length > 56) {
        puffs.shift();
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const now = performance.now();
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!initialized) {
        curX = mouseX;
        curY = mouseY;
        prevCurX = mouseX;
        prevCurY = mouseY;
        prevMouseX = mouseX;
        prevMouseY = mouseY;
        lastMoveTime = now;
        initialized = true;
      }

      const dt = Math.max(4, Math.min(64, now - lastMoveTime));
      const dx = mouseX - prevMouseX;
      const dy = mouseY - prevMouseY;
      // Normalize velocity to ~16.67ms frame units
      const normScale = 16.67 / dt;
      velX = dx * normScale;
      velY = dy * normScale;
      const instSpeed = Math.hypot(velX, velY);
      smoothedSpeed = Math.min(48, smoothedSpeed * 0.55 + instSpeed * 0.45);

      prevMouseX = mouseX;
      prevMouseY = mouseY;
      lastMoveTime = now;
      setPointerVisible(true);

      const target = e.target as HTMLElement | null;
      const interactive = Boolean(
        target?.closest(
          'a, button, input, select, textarea, summary, [role="button"], [data-cursor="cup"]'
        )
      );
      setIsHoveringInteractive(interactive);

      // Normalized 0..1+ speed factor (0 = still, ~0.3 = gentle drift, 1.0+ = fast sweep)
      const speedFactor = Math.min(1.6, smoothedSpeed / 22);
      const spawnInterval = Math.max(20, 52 - speedFactor * 24);

      if (steamTrailEnabled && now - lastPuffTime > spawnInterval) {
        lastPuffTime = now;
        const count = speedFactor > 0.65 ? 2 : 1;
        for (let c = 0; c < count; c++) {
          spawnPuff(curX, curY, speedFactor, velX, velY);
        }
      }
    };

    const onPointerLeave = () => {
      setPointerVisible(false);
    };

    const onPointerEnter = () => {
      setPointerVisible(true);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('mouseleave', onPointerLeave);
    document.addEventListener('mouseenter', onPointerEnter);

    let rafId = 0;
    const tick = () => {
      prevCurX = curX;
      prevCurY = curY;
      curX += (mouseX - curX) * 0.25;
      curY += (mouseY - curY) * 0.25;

      const curVx = curX - prevCurX;
      const curVy = curY - prevCurY;
      const liveSpeed = Math.hypot(curVx, curVy);
      smoothedSpeed = Math.max(liveSpeed, smoothedSpeed * 0.91);
      const liveSpeedFactor = Math.min(1.6, smoothedSpeed / 20);

      if (cursorRef.current) {
        // Position coffee mug top-left rim directly at the pointer hotspot (3px, 7px inside SVG)
        cursorRef.current.style.transform = `translate3d(${curX}px, ${curY}px, 0) translate(-3px, -7px)`;
      }

      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (steamTrailEnabled && initialized) {
          for (let i = puffs.length - 1; i >= 0; i--) {
            const p = puffs[i];

            // 1. Swirl & curl turbulence increases with puff's turbulence + live wind
            p.phase += p.phaseSpeed;
            const swirlForce = (0.018 + liveSpeedFactor * 0.04) * p.turbulence;
            p.vx += Math.sin(p.phase) * swirlForce + (Math.random() - 0.5) * swirlForce * 0.85;
            p.vy += Math.cos(p.phase * 0.8) * swirlForce * 0.35 - 0.008; // gentle thermal buoyancy

            // 2. Proximity wind gust when fast-moving mug sweeps past existing steam
            if (liveSpeed > 2.5) {
              const distX = p.x - curX;
              const distY = p.y - curY;
              const distSq = distX * distX + distY * distY;
              const influenceRadius = 135;
              if (distSq < influenceRadius * influenceRadius && distSq > 1) {
                const dist = Math.sqrt(distSq);
                const falloff = 1 - dist / influenceRadius;
                const gust = falloff * liveSpeedFactor * 0.16;
                // Push outward laterally + carry along partial air wake
                p.vx += curVx * gust * 0.45 + (distX / dist) * gust * 1.4;
                p.vy += curVy * gust * 0.35 + (distY / dist) * gust * 0.8;
                p.turbulence = Math.min(4.8, p.turbulence + falloff * liveSpeedFactor * 0.12);
              }
            }

            // 3. Air resistance so extreme gusts disperse smoothly into soft eddies
            p.vx *= 0.965;
            p.vy = p.vy * 0.982 - 0.012;

            p.x += p.vx;
            p.y += p.vy;
            p.radius += p.growth + liveSpeedFactor * 0.04;
            p.alpha -= p.fade;

            if (p.alpha <= 0) {
              puffs.splice(i, 1);
              continue;
            }

            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
            if (theme === 'dark') {
              grad.addColorStop(0, `rgba(244, 237, 224, ${p.alpha})`);
              grad.addColorStop(1, 'rgba(201, 137, 59, 0)');
            } else {
              grad.addColorStop(0, `rgba(201, 137, 59, ${p.alpha * 0.95})`);
              grad.addColorStop(1, 'rgba(42, 29, 20, 0)');
            }
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('mouseleave', onPointerLeave);
      document.removeEventListener('mouseenter', onPointerEnter);
    };
  }, [isDesktopPointer, steamTrailEnabled, theme]);

  if (!isDesktopPointer) return null;

  return (
    <>
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-[139]"
        aria-hidden="true"
      />
      {/* Pure Coffee Mug Cursor — ZERO surrounding circle, ring, or border */}
      <div
        ref={cursorRef}
        className="pointer-events-none fixed top-0 left-0 z-[140] select-none"
        style={{
          opacity: pointerVisible ? 1 : 0,
        }}
        aria-hidden="true"
      >
        <div
          className="pointer-events-none transition-transform duration-150 ease-out"
          style={{
            transform: isHoveringInteractive
              ? 'scale(1.24) rotate(-9deg)'
              : 'scale(1) rotate(0deg)',
            filter:
              theme === 'dark'
                ? 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.72))'
                : 'drop-shadow(0 2px 5px rgba(42, 29, 20, 0.28))',
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="pointer-events-none block"
          >
            {/* Subtle rising steam wisps above the mug rim */}
            <path
              d="M8.5 3.2C8.5 4.3 9.5 4.7 9.5 5.8"
              stroke="#C9893B"
              strokeWidth="1.45"
              strokeLinecap="round"
            />
            <path
              d="M12.2 2.4C12.2 3.7 13.3 4.2 13.3 5.5"
              stroke={theme === 'dark' ? '#F4EDE0' : '#9E631B'}
              strokeWidth="1.45"
              strokeLinecap="round"
            />
            {/* Ceramic coffee mug body (no outer circle enclosure) */}
            <path
              d="M5 8.2H16.6V13.6C16.6 16.8 14.0 19.2 10.8 19.2C7.6 19.2 5 16.8 5 13.6V8.2Z"
              fill={theme === 'dark' ? '#2A1D14' : '#FAF6F0'}
              stroke="#C9893B"
              strokeWidth="1.75"
              strokeLinejoin="round"
            />
            {/* Rich espresso crema surface line */}
            <path
              d="M6.4 10.3H15.2"
              stroke="#C9893B"
              strokeOpacity="0.65"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            {/* Mug handle */}
            <path
              d="M16.6 9.6H18.1C19.65 9.6 20.8 10.75 20.8 12.25C20.8 13.75 19.65 14.9 18.1 14.9H16.6"
              stroke="#C9893B"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Saucer base line */}
            <path
              d="M4.2 21.1H17.4"
              stroke={theme === 'dark' ? '#F4EDE0' : '#4A3323'}
              strokeOpacity="0.8"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </>
  );
};
