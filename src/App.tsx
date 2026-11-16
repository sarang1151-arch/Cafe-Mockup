import React, { Suspense, lazy, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CafeProvider } from './context/CafeContext';
import { CinematicIntro } from './components/CinematicIntro';
import { CustomCursorAndSteam } from './components/CustomCursorAndSteam';
import { ReadingProgressBar } from './components/ReadingProgressBar';
import { NavbarAndOverlay } from './components/NavbarAndOverlay';
import { OrderDrawer } from './components/OrderDrawer';
import { ChalkboardModal } from './components/ChalkboardModal';
import { BookReaderModal } from './components/BookReaderModal';
import { FloatingActions } from './components/FloatingActions';
import { VinylMiniDock } from './components/VinylPlayer';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';

gsap.registerPlugin(ScrollTrigger);

// Lazy-load secondary multi-page routes to keep initial bundle snappy on mobile
const MenuPage = lazy(() => import('./pages/MenuPage').then((m) => ({ default: m.MenuPage })));
const SpacePage = lazy(() => import('./pages/SpacePage').then((m) => ({ default: m.SpacePage })));
const BooksMusicPage = lazy(() =>
  import('./pages/BooksMusicPage').then((m) => ({ default: m.BooksMusicPage }))
);
const ReservationsPage = lazy(() =>
  import('./pages/ReservationsPage').then((m) => ({ default: m.ReservationsPage }))
);
const StoryPage = lazy(() => import('./pages/StoryPage').then((m) => ({ default: m.StoryPage })));
const GalleryPage = lazy(() =>
  import('./pages/GalleryPage').then((m) => ({ default: m.GalleryPage }))
);
const ContactPage = lazy(() =>
  import('./pages/ContactPage').then((m) => ({ default: m.ContactPage }))
);

const WillowRouteLoader: React.FC = () => (
  <div
    className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center px-6"
    role="status"
    aria-live="polite"
  >
    <div className="w-9 h-9 rounded-full border-2 border-[#C9893B]/30 border-t-[#C9893B] animate-spin" />
    <p className="font-serif text-xl text-[var(--willow-text-secondary)]">
      Preparing the courtyard...
    </p>
  </div>
);

const AnimatedRoutesShell: React.FC = () => {
  const location = useLocation();
  const isInfiniteGallery = location.pathname === '/gallery';
  const atmosphereRef = useRef<HTMLDivElement | null>(null);

  // Subtle multi-plane parallax for the willow-atmosphere ambient light-leak overlay
  useEffect(() => {
    const el = atmosphereRef.current;
    if (!el) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      el.style.setProperty('--willow-atmo-x1', '0px');
      el.style.setProperty('--willow-atmo-y1', '0px');
      el.style.setProperty('--willow-atmo-x2', '0px');
      el.style.setProperty('--willow-atmo-y2', '0px');
      return;
    }

    let targetProgress = 0;
    let currentProgress = 0;
    let rafId = 0;
    let isTicking = false;

    const computeScrollProgress = () => {
      const doc = document.documentElement;
      const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
      const rawRatio = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      // Blend full-page ratio with initial scroll offset so first few scrolls feel immediate
      const immediate = Math.min(1, window.scrollY / 2400);
      return rawRatio * 0.65 + immediate * 0.35;
    };

    const applyOffsets = (p: number) => {
      const y1 = -p * 62;
      const x1 = Math.sin(p * Math.PI) * 26;
      const y2 = -p * 108;
      const x2 = -Math.sin(p * Math.PI) * 34;

      el.style.setProperty('--willow-atmo-x1', `${x1.toFixed(2)}px`);
      el.style.setProperty('--willow-atmo-y1', `${y1.toFixed(2)}px`);
      el.style.setProperty('--willow-atmo-x2', `${x2.toFixed(2)}px`);
      el.style.setProperty('--willow-atmo-y2', `${y2.toFixed(2)}px`);
    };

    const step = () => {
      const diff = targetProgress - currentProgress;
      if (Math.abs(diff) < 0.0005) {
        currentProgress = targetProgress;
        applyOffsets(currentProgress);
        isTicking = false;
        return;
      }
      currentProgress += diff * 0.12;
      applyOffsets(currentProgress);
      rafId = requestAnimationFrame(step);
    };

    const onScrollOrResize = () => {
      targetProgress = computeScrollProgress();
      if (!isTicking) {
        isTicking = true;
        rafId = requestAnimationFrame(step);
      }
    };

    targetProgress = computeScrollProgress();
    currentProgress = targetProgress;
    applyOffsets(currentProgress);

    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [location.pathname]);

  // Lenis smooth scrolling synced with GSAP ScrollTrigger
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || isInfiniteGallery) return;

    const lenis = new Lenis({
      duration: 1.05,
      smoothWheel: true,
      prevent: (node) => Boolean(node?.closest?.('[data-lenis-prevent="true"]')),
    });

    lenis.on('scroll', ScrollTrigger.update);

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [isInfiniteGallery]);

  // Reset scroll position on route transition
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    ScrollTrigger.refresh();
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen flex flex-col willow-shell transition-colors duration-300">
      {/* Dedicated non-blocking grain & golden-hour light-leak layer (never overrides background-color) */}
      <div
        ref={atmosphereRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden willow-atmosphere"
      />

      <CinematicIntro />
      <CustomCursorAndSteam />
      <ReadingProgressBar />
      <NavbarAndOverlay />
      <OrderDrawer />
      <ChalkboardModal />
      <BookReaderModal />
      <VinylMiniDock />
      <FloatingActions />

      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 flex-1"
        >
          <Suspense fallback={<WillowRouteLoader />}>
            <Routes location={location}>
              <Route path="/" element={<HomePage />} />
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/space" element={<SpacePage />} />
              <Route path="/books-music" element={<BooksMusicPage />} />
              <Route path="/reservations" element={<ReservationsPage />} />
              <Route path="/story" element={<StoryPage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="*" element={<HomePage />} />
            </Routes>
          </Suspense>
        </motion.main>
      </AnimatePresence>

      {!isInfiniteGallery && (
        <div className="relative z-10">
          <Footer />
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <CafeProvider>
      <BrowserRouter>
        <AnimatedRoutesShell />
      </BrowserRouter>
    </CafeProvider>
  );
}
