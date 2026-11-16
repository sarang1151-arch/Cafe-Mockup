import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Compass,
  Gift,
  Maximize2,
  Pause,
  Play,
  Plus,
  X,
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  BOOKSHELF_PICKS,
  BRAND_CONFIG,
  CAFE_ASSETS,
  CAFE_VIDEO_CHAPTERS,
  CURRENCIES,
  CurrencyCode,
  GALLERY_FRAMES,
  GUEST_REVIEWS,
  HERO_VIDEO_CONFIG,
  MENU_ITEMS,
} from '../data/cafeConfig';
import { useCafe } from '../context/CafeContext';
import { VelocityMarquee } from '../components/VelocityMarquee';
import { ScrollRevealHeading } from '../components/ScrollRevealHeading';
import { ResilientImage } from '../components/ResilientImage';

gsap.registerPlugin(ScrollTrigger);

const PILLARS = [
  {
    num: '01',
    title: 'Single-Origin Coffee',
    subtitle: 'Roasted in 5kg cast-iron micro-batches',
    copy: 'From shade-grown Chikmagalur Selection 795 pulled at 93.5°C to 18-hour cold-immersion Ethiopian Yirgacheffe over hand-carved crystal ice, every cup honours farm terroir and unhurried extraction.',
    image: CAFE_ASSETS.roasteryBeans,
    ctaLabel: 'Explore Coffee & Cold Brews',
    ctaTo: '/menu',
  },
  {
    num: '02',
    title: 'Honest Sourdough & Pasta',
    subtitle: '48-hour wild fermentation & hand-rolled egg ribbons',
    copy: 'Our courtyard kitchen bakes blistered country loaves at dawn, rolls golden tagliatelle tossed with roasted wild mushrooms and white truffle oil, and fires Neapolitan D.O.P pies at 450°C.',
    image: CAFE_ASSETS.trufflePasta,
    ctaLabel: 'Browse Kitchen Plates',
    ctaTo: '/menu',
  },
  {
    num: '03',
    title: 'Two Hundred Curated Books',
    subtitle: 'Floor-to-ceiling salvaged walnut shelves',
    copy: 'Borrow any volume for the afternoon—from Tanizaki’s essays on shadow and Murakami’s rain-soaked novels to annotated culinary memoirs—tucked into an emerald velvet armchair.',
    image: CAFE_ASSETS.readingVinyl,
    ctaLabel: 'Inspect the Bookshelf',
    ctaTo: '/books-music',
  },
  {
    num: '04',
    title: 'Analog Vinyl Sessions',
    subtitle: 'Good Food. Better Music. · 33⅓ RPM daily',
    copy: 'Every afternoon our wooden turntable drops the needle on 1970s Tokyo jazz trios, chamber folk, and mellow soul through warm tube amplification that invites conversation rather than drowning it.',
    image: CAFE_ASSETS.nightAmbiance,
    ctaLabel: 'Spin the Turntable',
    ctaTo: '/books-music',
  },
];

type MoodKey = 'cosy' | 'energetic' | 'sweet' | 'light';

const MOOD_SUGGESTIONS: Record<
  MoodKey,
  {
    label: string;
    headline: string;
    note: string;
    drinkId: string;
    dishId: string;
    bookId: string;
    bookTitle: string;
  }
> = {
  cosy: {
    label: 'Cosy & Unhurried',
    headline: 'Warm Matcha & Truffle Tagliatelle by the Window',
    note: 'Earthy stone-ground Kyoto Uji matcha paired with hand-rolled wild mushroom tagliatelle and charred country sourdough.',
    drinkId: 'matcha-latte',
    dishId: 'truffle-pasta',
    bookId: 'in-praise-of-shadows',
    bookTitle: 'In Praise of Shadows — Jun’ichirō Tanizaki',
  },
  energetic: {
    label: 'Focused & Energetic',
    headline: '18h Cold Brew & Avocado Poached-Egg Tartine',
    note: 'Crisp bergamot-bright Ethiopian immersion cold brew alongside slow-fermented sourdough, Hass avocado, and za’atar.',
    drinkId: 'cold-brew',
    dishId: 'avocado-toast',
    bookId: 'atomic-habits',
    bookTitle: 'Atomic Habits — James Clear',
  },
  sweet: {
    label: 'Sweet Craving',
    headline: 'Honey Cortado & Wild Blueberry Basque Cheesecake',
    note: 'Velvety double ristretto with Coorg forest honey balancing caramelized Basque cream cheese and Nilgiri berry compote.',
    drinkId: 'willow-cortado',
    dishId: 'blueberry-cheesecake',
    bookId: 'creative-act',
    bookTitle: 'The Creative Act — Rick Rubin',
  },
  light: {
    label: 'Light Courtyard Bite',
    headline: 'Ruby Hibiscus Spritz & Amazonian Acai Bowl',
    note: 'Botanical pomegranate-mint tonic over crushed ice paired with organic acai, toasted pecan granola, and fresh fruit.',
    drinkId: 'hibiscus-spritz',
    dishId: 'acai-bowl',
    bookId: 'braiding-sweetgrass',
    bookTitle: 'Braiding Sweetgrass — Robin Wall Kimmerer',
  },
};

const STATS = [
  { target: 12000, suffix: '+', label: 'Cups poured this year', sub: 'Chikmagalur, Huila & Uji Kyoto' },
  { target: 240, suffix: '+', label: 'Books on our walnut shelves', sub: 'Fiction, essays, architecture & food' },
  { target: 48, suffix: '+', label: 'Analog vinyl LP pressings', sub: 'Spun daily at 33⅓ RPM' },
  { target: 5, suffix: ' yrs', label: 'Of slow mornings & good days', sub: 'Est. 2021 in the brick arcade' },
];

export const HomePage: React.FC = () => {
  const {
    openStatus,
    formatPrice,
    currency,
    setCurrency,
    addToCart,
    setIsChalkboardOpen,
    setReadingBook,
    openBookById,
  } = useCafe();

  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [activePillarIdx, setActivePillarIdx] = useState(0);
  const [selectedMood, setSelectedMood] = useState<MoodKey>('cosy');
  const [reviewIdx, setReviewIdx] = useState(0);
  const [countersStarted, setCountersStarted] = useState(false);
  const [counterVals, setCounterVals] = useState<number[]>(STATS.map(() => 0));
  const [activeVideoUrl, setActiveVideoUrl] = useState<string>(HERO_VIDEO_CONFIG.videoSrc);
  const [videoFailed, setVideoFailed] = useState(false);
  const [isCafeVideoPlaying, setIsCafeVideoPlaying] = useState(true);
  const [videoTimeSec, setVideoTimeSec] = useState(0);
  const [videoDurationSec, setVideoDurationSec] = useState(16);
  // 0 at initial page load (top), smoothly approaches 1 as the user scrolls down
  const [bgScrollBlend, setBgScrollBlend] = useState(0);

  const heroSectionRef = useRef<HTMLElement | null>(null);
  const heroContentRef = useRef<HTMLDivElement | null>(null);
  const heroVideoBoxRef = useRef<HTMLDivElement | null>(null);
  const heroFrameVideoRef = useRef<HTMLVideoElement | null>(null);
  const fixedBgVideoRef = useRef<HTMLVideoElement | null>(null);

  const specialsRef = useRef<HTMLDivElement | null>(null);
  const statsRef = useRef<HTMLDivElement | null>(null);
  const gallerySectionRef = useRef<HTMLDivElement | null>(null);
  const pillarTriggersRef = useRef<(HTMLDivElement | null)[]>([]);
  const homeContentRef = useRef<HTMLDivElement | null>(null);

  const dailySpecials = MENU_ITEMS.filter((m) => m.isDailySpecial);

  const handleVideoLoadError = useCallback(() => {
    if (activeVideoUrl !== HERO_VIDEO_CONFIG.fallbackVideoSrc) {
      setActiveVideoUrl(HERO_VIDEO_CONFIG.fallbackVideoSrc);
    } else {
      setVideoFailed(true);
    }
  }, [activeVideoUrl]);

  const toggleHeroCafeVideo = useCallback(() => {
    const vid = heroFrameVideoRef.current;
    if (!vid || videoFailed) return;
    if (vid.paused) {
      vid.play().catch(() => {});
      setIsCafeVideoPlaying(true);
    } else {
      vid.pause();
      setIsCafeVideoPlaying(false);
    }
  }, [videoFailed]);

  const seekCafeVideoChapter = useCallback(
    (startSec: number) => {
      const vid = heroFrameVideoRef.current;
      const bgVid = fixedBgVideoRef.current;
      if (vid && !videoFailed) {
        vid.currentTime = startSec;
        vid.play().catch(() => {});
        setIsCafeVideoPlaying(true);
        setVideoTimeSec(startSec);
      }
      if (bgVid && !videoFailed) {
        bgVid.currentTime = startSec;
      }
    },
    [videoFailed]
  );

  const expandHeroVideoFullscreen = useCallback(() => {
    const box = heroVideoBoxRef.current;
    if (!box) return;
    if (!document.fullscreenElement) {
      box.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  // Scroll listener: at scrollY === 0 the cafe motion video is NOT a page background (bgScrollBlend = 0);
  // once scrolled down (scrollY > 36), it smoothly becomes the full-screen motion video background.
  useEffect(() => {
    let rafId = 0;
    const syncScroll = () => {
      rafId = 0;
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      const blend = Math.max(0, Math.min(1, (y - 36) / 240));
      setBgScrollBlend(blend);

      const bgVid = fixedBgVideoRef.current;
      if (bgVid && !videoFailed) {
        if (blend > 0.02) {
          if (bgVid.paused) bgVid.play().catch(() => {});
        } else if (!bgVid.paused) {
          bgVid.pause();
        }
      }
    };

    const onScroll = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(syncScroll);
      }
    };

    syncScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
    };
  }, [videoFailed]);

  // Hero Entrance Animation + guaranteed video autoplay start when Café Doors split open
  useEffect(() => {
    const contentEl = heroContentRef.current;
    const startHeroPlayback = () => {
      const vid = heroFrameVideoRef.current;
      if (vid && !videoFailed) {
        vid.muted = true;
        vid.play()
          .then(() => setIsCafeVideoPlaying(true))
          .catch(() => {});
      }
    };

    startHeroPlayback();

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const runEntrance = () => {
      startHeroPlayback();
      if (!contentEl || prefersReduced) return;
      const items = contentEl.querySelectorAll('[data-hero-reveal]');
      gsap.fromTo(
        items,
        { opacity: 0, y: 22 },
        {
          opacity: 1,
          y: 0,
          duration: 0.78,
          stagger: 0.08,
          ease: 'power3.out',
          clearProps: 'transform',
        }
      );
    };

    window.addEventListener('willow:intro-doors-opening', runEntrance);
    return () => {
      window.removeEventListener('willow:intro-doors-opening', runEntrance);
    };
  }, [videoFailed, activeVideoUrl]);

  // Pause hero showcase frame video when scrolled completely off-screen, resume when visible
  useEffect(() => {
    const sectionEl = heroSectionRef.current;
    if (!sectionEl) return;

    const visObserver = new IntersectionObserver(
      (entries) => {
        const vid = heroFrameVideoRef.current;
        if (!vid || videoFailed) return;
        if (entries[0]?.isIntersecting) {
          vid.play()
            .then(() => setIsCafeVideoPlaying(true))
            .catch(() => {});
        } else {
          vid.pause();
        }
      },
      { threshold: 0.05 }
    );
    visObserver.observe(sectionEl);

    return () => {
      visObserver.disconnect();
    };
  }, [videoFailed]);

  // Sticky Storytelling Scroll Observer
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    pillarTriggersRef.current.forEach((el, index) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActivePillarIdx(index);
            }
          });
        },
        { rootMargin: '-35% 0px -45% 0px', threshold: 0.1 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  // Animated Stat Counters on Scroll
  useEffect(() => {
    const el = statsRef.current;
    if (!el || countersStarted) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setCountersStarted(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [countersStarted]);

  useEffect(() => {
    if (!countersStarted) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setCounterVals(STATS.map((s) => s.target));
      return;
    }

    const duration = 1400;
    const start = performance.now();
    let raf = 0;

    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCounterVals(STATS.map((s) => Math.round(s.target * eased)));
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [countersStarted]);

  // Inner-Image Parallax on Courtyard Gallery (keeps card frames strictly aligned, zero overlap with Gift Card section)
  useEffect(() => {
    const el = gallerySectionRef.current;
    if (!el) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.willow-parallax-img').forEach((imgWrap, i) => {
        const yDir = i % 2 === 0 ? -6 : 6;
        gsap.fromTo(
          imgWrap,
          { yPercent: -yDir, scale: 1.1 },
          {
            yPercent: yDir,
            scale: 1.1,
            ease: 'none',
            scrollTrigger: {
              trigger: el,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          }
        );
      });
    }, el);

    return () => ctx.revert();
  }, []);

  // Cinematic scroll-triggered fade-in animations for section titles, headers, and cards
  useEffect(() => {
    const rootEl = homeContentRef.current;
    if (!rootEl) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      // 1. Cinematic Section Headers (Eyebrows + Section Titles + Controls)
      gsap.utils.toArray<HTMLElement>('[data-scroll-header]').forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 26 },
          {
            opacity: 1,
            y: 0,
            duration: 0.85,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 88%',
              once: true,
            },
            clearProps: 'transform,opacity',
          }
        );
      });

      // 2. Batched Staggered Cards (Daily specials, chapter pillars, stat metrics, photo gallery)
      ScrollTrigger.batch('[data-scroll-card]', {
        interval: 0.08,
        start: 'top 90%',
        once: true,
        onEnter: (batch) => {
          gsap.fromTo(
            batch,
            { opacity: 0, y: 32 },
            {
              opacity: 1,
              y: 0,
              duration: 0.78,
              stagger: 0.08,
              ease: 'power3.out',
              clearProps: 'transform,opacity',
            }
          );
        },
      });

      // 3. Featured Showcase Cards & Banners (Guest reviews slider, Mood picker card, Gift card banner)
      gsap.utils.toArray<HTMLElement>('[data-scroll-feature-card]').forEach((card) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.88,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 86%',
              once: true,
            },
            clearProps: 'transform,opacity',
          }
        );
      });
    }, rootEl);

    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 200);

    return () => {
      clearTimeout(refreshTimer);
      ctx.revert();
    };
  }, []);

  const scrollSpecials = (dir: -1 | 1) => {
    if (!specialsRef.current) return;
    specialsRef.current.scrollBy({ left: dir * 340, behavior: 'smooth' });
  };

  const moodConfig = MOOD_SUGGESTIONS[selectedMood];
  const moodDrink = MENU_ITEMS.find((m) => m.id === moodConfig.drinkId)!;
  const moodDish = MENU_ITEMS.find((m) => m.id === moodConfig.dishId)!;

  return (
    <div className="relative">
      {/* SCROLL-ACTIVATED FIXED CAFÉ MOTION VIDEO BACKGROUND:
          - Hidden on initial load (bgScrollBlend === 0 -> not a page background)
          - Smoothly becomes the full-screen motion video background once scrolled down */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden transition-opacity duration-300"
        style={{
          opacity: bgScrollBlend,
          visibility: bgScrollBlend > 0.005 ? 'visible' : 'hidden',
        }}
      >
        {!videoFailed ? (
          <video
            ref={fixedBgVideoRef}
            src={activeVideoUrl}
            poster={HERO_VIDEO_CONFIG.posterSrc}
            loop
            muted
            playsInline
            preload="auto"
            onError={handleVideoLoadError}
            className="w-full h-full object-cover scale-105"
          />
        ) : (
          <img
            src={HERO_VIDEO_CONFIG.posterSrc}
            alt=""
            className="w-full h-full object-cover scale-105"
          />
        )}
        {/* Theme-aware veil over the scrolled background video so Light & Dark sections keep crisp contrast */}
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: 'var(--willow-bg)',
            opacity: 0.78,
          }}
        />
      </div>

      <div ref={homeContentRef} className="relative z-10 space-y-16 sm:space-y-24 pb-16">
        {/* Slim Dismissible Seasonal Specials Strip */}
        {!bannerDismissed && (
          <div className="bg-[#1F2E26] text-[#F4EDE0] px-4 py-2 text-xs">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <p className="truncate">{BRAND_CONFIG.seasonalBanner}</p>
              <button
                type="button"
                onClick={() => setBannerDismissed(true)}
                aria-label="Dismiss seasonal note"
                className="text-[#F4EDE0]/75 hover:text-[#F4EDE0] shrink-0 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* 1. CLEAN HERO ON INITIAL LOAD:
            - Solid theme surface (NOT a background wallpaper on load)
            - Right showcase frame displays the looping Café Motion Video at 100% full opacity (zero dark scrim/opacity dimming)
            - Scrolling down smoothly turns the motion video into the page background */}
        <section
          ref={heroSectionRef}
          className="relative w-full !mt-0 py-8 sm:py-12 lg:py-14"
        >
          <div
            ref={heroContentRef}
            className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center"
          >
            {/* Left Editorial Column on Clean Theme Surface */}
            <div className="lg:col-span-6 space-y-5">
              <div
                data-hero-reveal
                className="flex flex-wrap items-center gap-2 text-xs text-[var(--willow-text-secondary)] tabular-nums"
              >
                <span className="font-semibold text-[var(--willow-amber-text)]">
                  {openStatus.statusLabel}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {openStatus.todayName} {openStatus.todayHours}
                </span>
                <span aria-hidden="true">·</span>
                <span>{BRAND_CONFIG.tagline}</span>
              </div>

              <h1
                data-hero-reveal
                className="font-serif text-[clamp(2.1rem,4.2vw,3.6rem)] leading-[1.08] font-normal tracking-tight text-[var(--willow-text)]"
              >
                Good Food.{' '}
                <span className="italic text-[var(--willow-amber-text)]">Better Days.</span>
              </h1>

              <p
                data-hero-reveal
                className="text-sm sm:text-base text-[var(--willow-text-secondary)] leading-relaxed max-w-lg"
              >
                A slow neighbourhood café tucked beneath 1920s brick arches—where people linger over single-origin pour-overs, 48-hour sourdough, dog-eared books, and afternoon vinyl records.
              </p>

              <div
                data-hero-reveal
                className="flex flex-wrap items-center gap-3 pt-1"
              >
                <Link
                  to="/menu"
                  className="px-5 py-2.5 rounded-lg bg-[#C9893B] hover:bg-[#DDA052] text-[#14100C] font-semibold text-xs sm:text-sm transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <span>Explore Menu</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  to="/reservations"
                  className="px-5 py-2.5 rounded-lg willow-card border border-[var(--willow-border-strong)] hover:border-[var(--willow-amber)] text-[var(--willow-text)] font-medium text-xs sm:text-sm transition-colors whitespace-nowrap"
                >
                  Reserve a Table
                </Link>

                <Link
                  to="/space"
                  className="px-2.5 py-2.5 text-xs sm:text-sm text-[var(--willow-text)] hover:text-[var(--willow-amber-text)] underline underline-offset-4 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Compass className="w-4 h-4 text-[#C9893B]" />
                  <span>Step Inside 360°</span>
                </Link>
              </div>

              <div
                data-hero-reveal
                className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm"
              >
                <span className="font-hand text-xl sm:text-2xl text-[var(--willow-sage)]">
                  “Good Food. Better Music.”
                </span>
                <span className="text-xs text-[var(--willow-text-muted)]">
                  Indiranagar Inner Courtyard · Free Lending Library
                </span>
              </div>
            </div>

            {/* Right Clean Living Café Video Showcase — 100% Opacity on Load + Interactive Chapter Reel */}
            <div data-hero-reveal className="lg:col-span-6 space-y-3">
              <div
                ref={heroVideoBoxRef}
                className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-[var(--willow-border-strong)] shadow-xl bg-[#14100C] transition-transform duration-500"
                style={{
                  transform: `scale(${1 - bgScrollBlend * 0.035})`,
                  opacity: 1,
                }}
              >
                {!videoFailed ? (
                  <video
                    ref={heroFrameVideoRef}
                    src={activeVideoUrl}
                    poster={HERO_VIDEO_CONFIG.posterSrc}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    onLoadedMetadata={(e) => {
                      if (e.currentTarget.duration && Number.isFinite(e.currentTarget.duration)) {
                        setVideoDurationSec(e.currentTarget.duration);
                      }
                      e.currentTarget.play().catch(() => {});
                    }}
                    onTimeUpdate={(e) => setVideoTimeSec(e.currentTarget.currentTime)}
                    onPlay={() => setIsCafeVideoPlaying(true)}
                    onPause={() => setIsCafeVideoPlaying(false)}
                    onError={handleVideoLoadError}
                    onClick={toggleHeroCafeVideo}
                    className="w-full h-full object-cover opacity-100 cursor-pointer"
                  />
                ) : (
                  <img
                    src={HERO_VIDEO_CONFIG.posterSrc}
                    alt="Golden-hour sunlight inside The Willow Café brick arches and terrace"
                    className="w-full h-full object-cover opacity-100"
                  />
                )}
              </div>

              {/* Clean External Café Video Reel Bar (keeps video frame 100% unobstructed) */}
              {!videoFailed && (
                <div className="p-2.5 rounded-xl willow-card border space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={toggleHeroCafeVideo}
                        aria-label={isCafeVideoPlaying ? 'Pause café video' : 'Play café video'}
                        className="w-7 h-7 rounded-lg bg-[#C9893B] hover:bg-[#DDA052] text-[#14100C] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                      >
                        {isCafeVideoPlaying ? (
                          <Pause className="w-3.5 h-3.5" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <span className="text-xs font-medium text-[var(--willow-text)] truncate">
                        The Willow Café Film ·{' '}
                        <span className="text-[var(--willow-text-muted)] font-normal">
                          {
                            (
                              CAFE_VIDEO_CHAPTERS.slice()
                                .reverse()
                                .find((ch) => videoTimeSec >= ch.startSec) ||
                              CAFE_VIDEO_CHAPTERS[0]
                            ).caption
                          }
                        </span>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={expandHeroVideoFullscreen}
                      aria-label="Expand café video fullscreen"
                      title="Expand fullscreen"
                      className="w-7 h-7 rounded-lg willow-subtle border flex items-center justify-center hover:border-[var(--willow-amber)] shrink-0 transition-colors cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Progress Track */}
                  <div className="h-1 w-full rounded-full bg-[var(--willow-border)] overflow-hidden">
                    <div
                      className="h-full bg-[#C9893B] transition-[width] duration-150 ease-linear"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, (videoTimeSec / Math.max(1, videoDurationSec)) * 100)
                        )}%`,
                      }}
                    />
                  </div>

                  {/* 4 Café Film Chapters */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {CAFE_VIDEO_CHAPTERS.map((ch, idx) => {
                      const nextStart =
                        CAFE_VIDEO_CHAPTERS[idx + 1]?.startSec ?? videoDurationSec + 1;
                      const isCurrent = videoTimeSec >= ch.startSec && videoTimeSec < nextStart;
                      return (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => seekCafeVideoChapter(ch.startSec)}
                          className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors truncate cursor-pointer ${
                            isCurrent
                              ? 'bg-[var(--willow-btn-primary-bg)] text-[var(--willow-btn-primary-fg)] font-semibold'
                              : 'willow-subtle hover:border-[var(--willow-amber)] text-[var(--willow-text-secondary)]'
                          }`}
                        >
                          <span className="font-mono opacity-75 mr-1">{ch.num}</span>
                          {ch.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

      {/* 2. SCROLL-REACTIVE MARQUEE BAND */}
      <VelocityMarquee text="COFFEE · FOOD · BOOKS · MUSIC · SOURDOUGH · VINYL · " />

      {/* 3. TODAY AT WILLOW ("PLAISIRS DU JOUR" HORIZONTAL DAILY SPECIALS STRIP) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div data-scroll-header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <p className="font-hand text-xl text-[var(--willow-amber-text)]">
              Plaisirs du jour · Today at Willow
            </p>
            <ScrollRevealHeading className="font-serif text-2xl sm:text-4xl font-normal text-[var(--willow-text)]">
              Chalkboard Daily Specials
            </ScrollRevealHeading>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Currency Toggle */}
            <div className="inline-flex items-center p-1 rounded-lg willow-subtle border">
              {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setCurrency(code)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors whitespace-nowrap cursor-pointer ${
                    currency === code
                      ? 'bg-[var(--willow-btn-primary-bg)] text-[var(--willow-btn-primary-fg)] font-semibold'
                      : 'text-[var(--willow-text-secondary)] hover:text-[var(--willow-text)]'
                  }`}
                >
                  {CURRENCIES[code].symbol}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scrollSpecials(-1)}
                aria-label="Scroll specials left"
                className="w-8.5 h-8.5 rounded-lg willow-card border flex items-center justify-center hover:border-[var(--willow-amber)] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollSpecials(1)}
                aria-label="Scroll specials right"
                className="w-8.5 h-8.5 rounded-lg willow-card border flex items-center justify-center hover:border-[var(--willow-amber)] transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Scrollable Cards — Every Special Has Its Own Distinct Image */}
        <div
          ref={specialsRef}
          className="flex gap-5 overflow-x-auto pb-3 no-scrollbar snap-x snap-mandatory"
        >
          {dailySpecials.map((item, idx) => (
            <article
              key={item.id}
              data-scroll-card
              className="snap-start shrink-0 w-[265px] sm:w-[295px] rounded-xl willow-card border overflow-hidden flex flex-col justify-between transition-transform duration-200 hover:-translate-y-1"
            >
              <div>
                <div className="aspect-[4/3] overflow-hidden">
                  <ResilientImage
                    src={item.image}
                    dropPhotoPath={item.dropPhotoPath}
                    fallbackLabel={`Add photo: ${item.shortLabel || item.name}`}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <div className="p-4 sm:p-4.5 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-[var(--willow-text-muted)] tabular-nums">
                    <span>0{idx + 1}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.dietary.join(', ')}</span>
                  </div>

                  <h3 className="font-serif text-xl font-medium text-[var(--willow-text)]">
                    {item.name}
                  </h3>
                  <p className="text-xs text-[var(--willow-text-secondary)] leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="px-4 pb-4 pt-2.5 border-t border-[var(--willow-border)] flex items-center justify-between">
                <span className="font-mono text-sm sm:text-base font-semibold tabular-nums text-[var(--willow-amber-text)]">
                  {formatPrice(item.priceInr)}
                </span>
                <button
                  type="button"
                  onClick={() => addToCart(item)}
                  className="px-3 py-1.5 rounded-lg bg-[#2A1D14] dark:bg-[#C9893B] hover:bg-[#4A3323] dark:hover:bg-[#DDA052] text-[#F4EDE0] dark:text-[#14100C] text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to Tray</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 4. STICKY SCROLL STORYTELLING (01 Coffee / 02 Food / 03 Books / 04 Music) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div data-scroll-header className="mb-8 sm:mb-10 max-w-2xl space-y-1.5">
          <p className="text-xs font-medium text-[var(--willow-amber-text)]">
            Four Rituals Under One Roof
          </p>
          <ScrollRevealHeading className="font-serif text-2xl sm:text-4xl font-normal text-[var(--willow-text)]">
            Crafted for Unhurried Hours
          </ScrollRevealHeading>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Sticky Visual Frame on Desktop */}
          <div data-scroll-card className="hidden lg:block lg:col-span-6 sticky top-24">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-[var(--willow-border)]">
              <ResilientImage
                key={PILLARS[activePillarIdx].image}
                src={PILLARS[activePillarIdx].image}
                alt={PILLARS[activePillarIdx].title}
                className="w-full h-full object-cover transition-opacity duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent flex items-end justify-between p-6 text-[#F4EDE0]">
                <div>
                  <p className="font-mono text-xs text-[#C9893B] tabular-nums">
                    Chapter {PILLARS[activePillarIdx].num} / 04
                  </p>
                  <p className="font-serif text-2xl mt-0.5">{PILLARS[activePillarIdx].title}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Scrolling Numbered Chapters */}
          <div className="lg:col-span-6 space-y-8 lg:space-y-14">
            {PILLARS.map((pillar, idx) => (
              <div
                key={pillar.num}
                data-scroll-card
                ref={(el) => {
                  pillarTriggersRef.current[idx] = el;
                }}
                className={`p-5 sm:p-6.5 rounded-2xl border transition-colors ${
                  activePillarIdx === idx
                    ? 'willow-card border-[#C9893B]'
                    : 'bg-[var(--willow-surface)]/65 border-[var(--willow-border)]'
                }`}
              >
                <div className="lg:hidden mb-4 aspect-[16/10] rounded-xl overflow-hidden">
                  <ResilientImage
                    src={pillar.image}
                    alt={pillar.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <p className="font-mono text-xs sm:text-sm text-[var(--willow-amber-text)] tabular-nums">
                  {pillar.num}.
                </p>
                <h3 className="font-serif text-2xl sm:text-3xl mt-1.5 text-[var(--willow-text)]">
                  {pillar.title}
                </h3>
                <p className="text-xs font-medium text-[var(--willow-sage)] mt-1">
                  {pillar.subtitle}
                </p>
                <p className="text-xs sm:text-sm text-[var(--willow-text-secondary)] leading-relaxed mt-3">
                  {pillar.copy}
                </p>

                {/* Interactive Click-to-Open Books directly inside Chapter 03 on the Home Page */}
                {pillar.num === '03' && (
                  <div className="mt-4 pt-3.5 border-t border-[var(--willow-border)] space-y-2">
                    <p className="text-xs font-medium text-[var(--willow-amber-text)] flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Click any volume on Shelf B to open & read right here:</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {BOOKSHELF_PICKS.map((book) => (
                        <button
                          key={book.id}
                          type="button"
                          onClick={() => setReadingBook(book)}
                          className="px-2.5 py-1 rounded-lg border border-[var(--willow-border-strong)] hover:border-[#C9893B] willow-subtle text-xs font-medium text-[var(--willow-text)] hover:text-[var(--willow-amber-text)] flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <span
                            className="w-2 h-3 rounded-[2px] shrink-0 border border-black/20"
                            style={{ backgroundColor: book.spineColor }}
                          />
                          <span>{book.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-5">
                  <Link
                    to={pillar.ctaTo}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--willow-text)] hover:text-[var(--willow-amber)] transition-colors"
                  >
                    <span>{pillar.ctaLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. ANIMATED STAT COUNTERS + ADJACENT GUEST TESTIMONIALS */}
      <section
        ref={statsRef}
        className="willow-subtle py-12 sm:py-16 border-y border-[var(--willow-border)]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {STATS.map((stat, idx) => (
              <div key={stat.label} data-scroll-card className="space-y-1">
                <p className="font-serif text-3xl sm:text-4xl md:text-5xl text-[var(--willow-text)] dark:text-[#C9893B] tabular-nums">
                  {counterVals[idx].toLocaleString()}
                  {stat.suffix}
                </p>
                <p className="text-xs sm:text-sm font-medium text-[var(--willow-text)]">{stat.label}</p>
                <p className="text-xs text-[var(--willow-text-muted)]">{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Attributable Testimonials & Google Reviews Slider */}
          <div className="pt-10 border-t border-[var(--willow-border)] grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
            <div data-scroll-header className="lg:col-span-4 space-y-2">
              <p className="text-xs font-medium text-[var(--willow-amber-text)]">
                Neighbourhood Voices · 4.9 / 5.0 on Google
              </p>
              <h3 className="font-serif text-2xl sm:text-3xl text-[var(--willow-text)]">
                Morning Regulars & Night Readers
              </h3>
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setReviewIdx((i) => (i - 1 + GUEST_REVIEWS.length) % GUEST_REVIEWS.length)
                  }
                  aria-label="Previous guest review"
                  className="w-8.5 h-8.5 rounded-lg willow-card border flex items-center justify-center hover:border-[var(--willow-amber)] cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setReviewIdx((i) => (i + 1) % GUEST_REVIEWS.length)}
                  aria-label="Next guest review"
                  className="w-8.5 h-8.5 rounded-lg willow-card border flex items-center justify-center hover:border-[var(--willow-amber)] cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className="ml-2 text-xs font-mono tabular-nums text-[var(--willow-text-muted)]">
                  0{reviewIdx + 1} / 0{GUEST_REVIEWS.length}
                </span>
              </div>
            </div>

            <div data-scroll-feature-card className="lg:col-span-8 p-5 sm:p-6.5 rounded-2xl willow-card border space-y-3.5">
              <p className="font-serif italic text-lg sm:text-xl leading-relaxed text-[var(--willow-text)]">
                “{GUEST_REVIEWS[reviewIdx].quote}”
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--willow-text-secondary)]">
                <strong className="font-semibold text-[var(--willow-text)]">
                  {GUEST_REVIEWS[reviewIdx].author}
                </strong>
                <span aria-hidden="true">·</span>
                <span>{GUEST_REVIEWS[reviewIdx].role}</span>
                <span aria-hidden="true">·</span>
                <span className="text-[var(--willow-amber-text)] font-medium">
                  {GUEST_REVIEWS[reviewIdx].detail}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. "WHAT SHOULD I HAVE TODAY?" MOOD PICKER (Zero text collision across all screen sizes) */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div data-scroll-feature-card className="p-5 sm:p-7 rounded-2xl willow-card border space-y-6">
          <div data-scroll-header className="flex flex-col md:flex-row md:items-end justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-[var(--willow-amber-text)]">
                Build Your Perfect Order
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl text-[var(--willow-text)]">
                What Should I Have Today?
              </h2>
            </div>
            <p className="text-xs text-[var(--willow-text-muted)]">
              Choose a mood and we’ll pair a drink, dish, and shelf read
            </p>
          </div>

          {/* Segmented Mood Controls — Responsive Grid with Clean Wrapping (Never Overlaps) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 p-1.5 rounded-xl willow-subtle border">
            {(Object.keys(MOOD_SUGGESTIONS) as MoodKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedMood(key)}
                className={`py-2 px-3 rounded-lg text-xs font-medium leading-snug text-center transition-colors cursor-pointer ${
                  selectedMood === key
                    ? 'bg-[var(--willow-btn-primary-bg)] text-[var(--willow-btn-primary-fg)] font-semibold shadow-xs'
                    : 'text-[var(--willow-text-secondary)] hover:text-[var(--willow-text)]'
                }`}
              >
                {MOOD_SUGGESTIONS[key].label}
              </button>
            ))}
          </div>

          {/* Suggested Pairing Output */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-7 items-center pt-1">
            <div className="md:col-span-5 aspect-[4/3] rounded-xl overflow-hidden">
              <ResilientImage
                src={moodDish.image}
                dropPhotoPath={moodDish.dropPhotoPath}
                fallbackLabel={`Add photo: ${moodDish.shortLabel || moodDish.name}`}
                alt={moodDish.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="md:col-span-7 space-y-3.5 min-w-0">
              <h3 className="font-serif text-xl sm:text-2xl leading-snug text-[var(--willow-text)]">
                {moodConfig.headline}
              </h3>
              <p className="text-xs sm:text-sm text-[var(--willow-text-secondary)] leading-relaxed">
                {moodConfig.note}
              </p>
              <div className="space-y-1.5 text-xs text-[var(--willow-text-secondary)] tabular-nums">
                <p>
                  <strong className="text-[var(--willow-text)]">Cup:</strong>{' '}
                  {moodDrink.name} ({formatPrice(moodDrink.priceInr)})
                </p>
                <p>
                  <strong className="text-[var(--willow-text)]">Plate:</strong>{' '}
                  {moodDish.name} ({formatPrice(moodDish.priceInr)})
                </p>
                <p className="flex flex-wrap items-center gap-2">
                  <strong className="text-[var(--willow-text)]">Shelf Companion:</strong>{' '}
                  <button
                    type="button"
                    onClick={() => openBookById(moodConfig.bookId)}
                    className="inline-flex items-center gap-1.5 text-[var(--willow-amber-text)] hover:underline underline-offset-4 font-semibold cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{moodConfig.bookTitle} (Click to Read)</span>
                  </button>
                </p>
              </div>
              <div className="pt-1.5 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    addToCart(moodDrink);
                    addToCart(moodDish);
                  }}
                  className="px-4 py-2 rounded-lg bg-[#C9893B] hover:bg-[#DDA052] text-[#14100C] text-xs font-semibold transition-colors cursor-pointer"
                >
                  Add Pairing ({formatPrice(moodDrink.priceInr + moodDish.priceInr)})
                </button>
                <button
                  type="button"
                  onClick={() => openBookById(moodConfig.bookId)}
                  className="px-3.5 py-2 rounded-lg border border-[var(--willow-border-strong)] hover:border-[var(--willow-amber)] text-xs font-medium text-[var(--willow-text)] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#C9893B]" />
                  <span>Open Paired Book</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsChalkboardOpen(true)}
                  className="px-3.5 py-2 rounded-lg border border-[var(--willow-border-strong)] hover:border-[var(--willow-amber)] text-xs text-[var(--willow-text)] transition-colors cursor-pointer"
                >
                  Sign the Chalkboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. MOODBOARD PARALLAX GALLERY & GIFT CARD / TAKEAWAY BANNER (Strictly Non-Overlapping) */}
      <section ref={gallerySectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div data-scroll-header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-[var(--willow-amber-text)]">
              Tag us {BRAND_CONFIG.instagram}
            </p>
            <ScrollRevealHeading className="font-serif text-2xl sm:text-4xl font-normal text-[var(--willow-text)]">
              Moments Around the Courtyard
            </ScrollRevealHeading>
          </div>
          <Link
            to="/gallery"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--willow-text)] hover:text-[var(--willow-amber)] transition-colors"
          >
            <span>Open Free-Drag Infinite Canvas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {GALLERY_FRAMES.slice(0, 4).map((frame) => (
            <Link
              key={frame.id}
              to="/gallery"
              data-scroll-card
              className="group block rounded-xl overflow-hidden willow-card border"
            >
              <div className="aspect-[4/5] overflow-hidden">
                <div className="willow-parallax-img w-full h-full will-change-transform">
                  <ResilientImage
                    src={frame.image}
                    alt={frame.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
              </div>
              <div className="p-3.5 space-y-1 bg-[var(--willow-surface)] relative z-10">
                <p className="text-xs text-[var(--willow-text-muted)]">{frame.category}</p>
                <h4 className="font-serif text-base text-[var(--willow-text)] group-hover:text-[var(--willow-amber)] transition-colors leading-snug">
                  {frame.title}
                </h4>
              </div>
            </Link>
          ))}
        </div>

        {/* Gift Card & Takeaway Banner — Clean Responsive Grid with Zero Text Collision */}
        <div data-scroll-feature-card className="relative z-10 p-5 sm:p-7 rounded-2xl bg-[#1F2E26] text-[#F4EDE0] border border-[#9EB091]/20 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          <div className="lg:col-span-8 space-y-2 min-w-0">
            <div className="flex items-center gap-2 text-xs text-[#9EB091]">
              <Gift className="w-4 h-4 text-[#C9893B] shrink-0" />
              <span>Willow Gift Cards & Online Takeaway</span>
            </div>
            <h3 className="font-serif text-xl sm:text-2xl leading-snug text-[#F4EDE0]">
              Gift Someone an Unhurried Afternoon of Coffee & Books
            </h3>
            <p className="text-xs sm:text-sm text-[#F4EDE0]/80 leading-relaxed max-w-2xl">
              Instant digital gift cards or freshly packed sourdough brunch boxes ready at our arched window in 20 minutes.
            </p>
          </div>

          <div className="lg:col-span-4 flex flex-wrap lg:justify-end items-center gap-3">
            <button
              type="button"
              onClick={() =>
                addToCart({
                  id: 'gift-card-2500',
                  name: `Willow Café Gift Card (${formatPrice(2500)})`,
                  priceInr: 2500,
                  image: CAFE_ASSETS.heroCourtyard,
                  category: 'Gift Card',
                })
              }
              className="px-5 py-3 rounded-lg bg-[#C9893B] hover:bg-[#DDA052] text-[#14100C] text-xs font-semibold transition-colors cursor-pointer"
            >
              Add {formatPrice(2500)} Gift Card
            </button>
            <Link
              to="/menu"
              className="px-5 py-3 rounded-lg border border-[#F4EDE0]/30 hover:border-[#F4EDE0] text-[#F4EDE0] text-xs font-medium transition-colors"
            >
              Order Takeaway
            </Link>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
};
