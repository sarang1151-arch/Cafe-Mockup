import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { flushSync } from 'react-dom';
import {
  BOOKSHELF_PICKS,
  BookPick,
  CURRENCIES,
  CurrencyCode,
  MenuItem,
  REFRESH_BOOK_QUOTES,
  VINYL_PLAYLIST,
  VinylMusicStyle,
  WEEKLY_HOURS,
} from '../data/cafeConfig';
import { vinylAudio } from '../utils/audioEngine';

export interface CartItem {
  id: string;
  name: string;
  priceInr: number;
  qty: number;
  image: string;
  category: string;
  note?: string;
}

interface OpenStatus {
  isOpen: boolean;
  statusLabel: string;
  todayHours: string;
  todayName: string;
  todayNote: string;
}

interface CircularRevealRipple {
  id: number;
  x: number;
  y: number;
  radius: number;
  targetColor: string;
}

export type ThemeMode = 'auto' | 'light' | 'dark';

interface CafeContextValue {
  theme: 'light' | 'dark';
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode, originEvent?: React.MouseEvent) => void;
  isAutoTheme: boolean;
  localTimePeriod: 'day' | 'evening';
  toggleTheme: (originEvent?: React.MouseEvent) => void;
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  formatPrice: (priceInr: number) => string;
  cart: CartItem[];
  addToCart: (item: MenuItem | { id: string; name: string; priceInr: number; image: string; category: string; note?: string }) => void;
  updateCartQty: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotalInr: number;
  isOrderDrawerOpen: boolean;
  setIsOrderDrawerOpen: (open: boolean) => void;
  // Vinyl Turntable Global State
  isPlayingVinyl: boolean;
  activeTrackIndex: number;
  musicStyle: VinylMusicStyle;
  rpm: 33 | 45;
  crackleLevel: number;
  volume: number;
  toggleVinyl: () => void;
  startVinyl: () => void;
  selectTrack: (index: number, autoPlay?: boolean) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setMusicStyle: (style: VinylMusicStyle) => void;
  setRpm: (rpm: 33 | 45) => void;
  setCrackleLevel: (level: number) => void;
  setVolume: (vol: number) => void;
  // Interactive Lending Library Reader Modal (Global so books open from any page)
  readingBook: BookPick | null;
  setReadingBook: (book: BookPick | null) => void;
  openBookById: (bookId: string) => void;
  // Easter Eggs & Modals
  steamTrailEnabled: boolean;
  setSteamTrailEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  isChalkboardOpen: boolean;
  setIsChalkboardOpen: (open: boolean) => void;
  sessionQuote: { text: string; source: string };
  openStatus: OpenStatus;
}

const CafeContext = createContext<CafeContextValue | null>(null);

function computeOpenStatus(now: Date): OpenStatus {
  const dayIdx = now.getDay();
  const schedule = WEEKLY_HOURS.find((d) => d.dayIndex === dayIdx) || WEEKLY_HOURS[0];
  const currentDecimalHour = now.getHours() + now.getMinutes() / 60;
  const isOpen = currentDecimalHour >= schedule.openHour && currentDecimalHour < schedule.closeHour;

  return {
    isOpen,
    statusLabel: isOpen ? 'Open now' : 'Closed now · Opens 8:00 AM',
    todayHours: schedule.displayHours,
    todayName: schedule.dayName,
    todayNote: schedule.note,
  };
}

/**
 * Detects whether the user's local time is daytime or evening/night.
 * Day: 06:00 to 17:59 (6:00 AM to 5:59 PM) -> 'light'
 * Evening / Night: 18:00 to 05:59 (6:00 PM to 5:59 AM) -> 'dark'
 */
export function getThemeForLocalTime(now: Date = new Date()): 'light' | 'dark' {
  const hours = now.getHours();
  return hours >= 6 && hours < 18 ? 'light' : 'dark';
}

export function getLocalTimePeriod(now: Date = new Date()): 'day' | 'evening' {
  const hours = now.getHours();
  return hours >= 6 && hours < 18 ? 'day' : 'evening';
}

function applyRootThemeClass(nextTheme: 'light' | 'dark') {
  const root = document.documentElement;
  if (nextTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  try {
    localStorage.setItem('willow_theme', nextTheme);
  } catch {
    // Ignore storage quota issues
  }
}

export const CafeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    try {
      const savedMode = localStorage.getItem('willow_theme_mode') as ThemeMode | null;
      if (savedMode === 'auto' || savedMode === 'light' || savedMode === 'dark') {
        return savedMode;
      }
    } catch {
      // Fallback
    }
    return 'auto'; // Default: automatically adapt to user's local time
  });

  const [localTimePeriod, setLocalTimePeriod] = useState<'day' | 'evening'>(() =>
    getLocalTimePeriod(new Date())
  );

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const savedMode = localStorage.getItem('willow_theme_mode') as ThemeMode | null;
      if (savedMode === 'light' || savedMode === 'dark') {
        return savedMode;
      }
    } catch {
      // Fallback
    }
    return getThemeForLocalTime(new Date());
  });

  const [revealRipple, setRevealRipple] = useState<CircularRevealRipple | null>(null);

  const [currency, setCurrency] = useState<CurrencyCode>(() => {
    try {
      const saved = localStorage.getItem('willow_currency') as CurrencyCode | null;
      return saved && CURRENCIES[saved] ? saved : 'INR';
    } catch {
      return 'INR';
    }
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('willow_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isOrderDrawerOpen, setIsOrderDrawerOpen] = useState(false);

  // Turntable state
  const [isPlayingVinyl, setIsPlayingVinyl] = useState(false);
  const [activeTrackIndex, setActiveTrackIndex] = useState(0);
  const [musicStyle, setMusicStyleState] = useState<VinylMusicStyle>('warm-jazz');
  const [rpm, setRpmState] = useState<33 | 45>(33);
  const [crackleLevel, setCrackleState] = useState(0.06);
  const [volume, setVolumeState] = useState(0.7);

  // Global Book Reader state
  const [readingBook, setReadingBook] = useState<BookPick | null>(null);

  const openBookById = useCallback((bookId: string) => {
    const found =
      BOOKSHELF_PICKS.find((b) => b.id === bookId) ||
      BOOKSHELF_PICKS.find((b) => b.title.toLowerCase().includes(bookId.toLowerCase())) ||
      BOOKSHELF_PICKS[0];
    if (found) {
      setReadingBook(found);
    }
  }, []);

  // Easter eggs
  const [steamTrailEnabled, setSteamTrailEnabled] = useState(true);
  const [isChalkboardOpen, setIsChalkboardOpen] = useState(false);

  // Random book quote on every refresh
  const [sessionQuote] = useState(() => {
    const idx = Math.floor(Math.random() * REFRESH_BOOK_QUOTES.length);
    return REFRESH_BOOK_QUOTES[idx];
  });

  const [openStatus, setOpenStatus] = useState<OpenStatus>(() => computeOpenStatus(new Date()));

  useEffect(() => {
    applyRootThemeClass(theme);
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem('willow_currency', currency);
    } catch {
      // Ignore
    }
  }, [currency]);

  useEffect(() => {
    try {
      localStorage.setItem('willow_cart', JSON.stringify(cart));
    } catch {
      // Ignore
    }
  }, [cart]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setOpenStatus(computeOpenStatus(new Date()));
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const applyThemeWithTransition = useCallback(
    (nextTheme: 'light' | 'dark', originEvent?: React.MouseEvent) => {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const x = originEvent ? originEvent.clientX : window.innerWidth - 64;
      const y = originEvent ? originEvent.clientY : 32;
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      if (prefersReduced) {
        applyRootThemeClass(nextTheme);
        setTheme(nextTheme);
        return;
      }

      const docWithVT = document as Document & {
        startViewTransition?: (cb: () => void) => { ready: Promise<void> };
      };

      if (typeof docWithVT.startViewTransition === 'function') {
        try {
          const transition = docWithVT.startViewTransition(() => {
            flushSync(() => {
              applyRootThemeClass(nextTheme);
              setTheme(nextTheme);
            });
          });

          transition.ready
            .then(() => {
              document.documentElement.animate(
                {
                  clipPath: [
                    `circle(0px at ${x}px ${y}px)`,
                    `circle(${endRadius}px at ${x}px ${y}px)`,
                  ],
                },
                {
                  duration: 620,
                  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                  fill: 'forwards',
                  pseudoElement: '::view-transition-new(root)',
                }
              );
            })
            .catch(() => {
              // Fallback already applied synchronously via flushSync
            });
          return;
        } catch {
          // Fall through to universal circular reveal fallback
        }
      }

      // Universal smooth circular reveal fallback when startViewTransition is unavailable
      const targetColor = nextTheme === 'dark' ? '#14100C' : '#F4EDE0';
      setRevealRipple({
        id: Date.now(),
        x,
        y,
        radius: endRadius,
        targetColor,
      });

      window.setTimeout(() => {
        applyRootThemeClass(nextTheme);
        setTheme(nextTheme);
      }, 240);

      window.setTimeout(() => {
        setRevealRipple(null);
      }, 640);
    },
    []
  );

  const setThemeMode = useCallback(
    (mode: ThemeMode, originEvent?: React.MouseEvent) => {
      setThemeModeState(mode);
      try {
        localStorage.setItem('willow_theme_mode', mode);
      } catch {
        // Ignore storage error
      }
      const targetTheme = mode === 'auto' ? getThemeForLocalTime(new Date()) : mode;
      if (targetTheme !== theme) {
        applyThemeWithTransition(targetTheme, originEvent);
      } else {
        applyRootThemeClass(targetTheme);
      }
    },
    [theme, applyThemeWithTransition]
  );

  const toggleTheme = useCallback(
    (originEvent?: React.MouseEvent) => {
      // Cycle: 'auto' (tracks local time) -> opposite manual theme -> other manual theme -> 'auto'
      if (themeMode === 'auto') {
        const nextManual: 'light' | 'dark' = theme === 'light' ? 'dark' : 'light';
        setThemeMode(nextManual, originEvent);
      } else if (themeMode === 'light') {
        setThemeMode('dark', originEvent);
      } else {
        setThemeMode('auto', originEvent);
      }
    },
    [themeMode, theme, setThemeMode]
  );

  // Local Time Detection & Auto-Switching Heartbeat
  useEffect(() => {
    const syncLocalTimeTheme = () => {
      const now = new Date();
      const period = getLocalTimePeriod(now);
      setLocalTimePeriod(period);

      if (themeMode === 'auto') {
        const expectedTheme = getThemeForLocalTime(now);
        if (expectedTheme !== theme) {
          applyThemeWithTransition(expectedTheme);
        }
      }
    };

    // Immediate check
    syncLocalTimeTheme();

    // Check periodically every 15 seconds to catch 06:00 and 18:00 thresholds
    const intervalId = window.setInterval(syncLocalTimeTheme, 15_000);

    // Recheck immediately when window or tab regains focus/visibility
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        syncLocalTimeTheme();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [themeMode, theme, applyThemeWithTransition]);

  const formatPrice = useCallback(
    (priceInr: number) => {
      const cfg = CURRENCIES[currency];
      if (currency === 'INR') {
        return `${cfg.symbol}${Math.round(priceInr)}`;
      }
      const converted = priceInr * cfg.rate;
      return `${cfg.symbol}${converted.toFixed(2)}`;
    },
    [currency]
  );

  const addToCart = useCallback(
    (
      item:
        | MenuItem
        | { id: string; name: string; priceInr: number; image: string; category: string; note?: string }
    ) => {
      setCart((prev) => {
        const found = prev.find((c) => c.id === item.id);
        if (found) {
          return prev.map((c) => (c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
        }
        return [
          ...prev,
          {
            id: item.id,
            name: item.name,
            priceInr: item.priceInr,
            qty: 1,
            image: item.image,
            category: item.category,
            note: 'note' in item ? item.note : undefined,
          },
        ];
      });
      setIsOrderDrawerOpen(true);
    },
    []
  );

  const updateCartQty = useCallback((id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0)
    );
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.qty, 0), [cart]);
  const cartSubtotalInr = useMemo(
    () => cart.reduce((sum, item) => sum + item.priceInr * item.qty, 0),
    [cart]
  );

  const toggleVinyl = useCallback(() => {
    const next = vinylAudio.toggle(VINYL_PLAYLIST[activeTrackIndex], crackleLevel, musicStyle);
    setIsPlayingVinyl(next);
  }, [activeTrackIndex, crackleLevel, musicStyle]);

  const startVinyl = useCallback(() => {
    if (!isPlayingVinyl) {
      vinylAudio.start(VINYL_PLAYLIST[activeTrackIndex], crackleLevel, musicStyle);
      setIsPlayingVinyl(true);
    }
  }, [isPlayingVinyl, activeTrackIndex, crackleLevel, musicStyle]);

  const selectTrack = useCallback(
    (index: number, autoPlay = true) => {
      const len = VINYL_PLAYLIST.length;
      const clamped = ((index % len) + len) % len;
      setActiveTrackIndex(clamped);
      const track = VINYL_PLAYLIST[clamped];
      if (autoPlay && !isPlayingVinyl) {
        vinylAudio.start(track, crackleLevel, musicStyle);
        setIsPlayingVinyl(true);
      } else {
        vinylAudio.setTrack(track);
      }
    },
    [crackleLevel, isPlayingVinyl, musicStyle]
  );

  const nextTrack = useCallback(() => {
    selectTrack((activeTrackIndex + 1) % VINYL_PLAYLIST.length, true);
  }, [activeTrackIndex, selectTrack]);

  const prevTrack = useCallback(() => {
    selectTrack((activeTrackIndex - 1 + VINYL_PLAYLIST.length) % VINYL_PLAYLIST.length, true);
  }, [activeTrackIndex, selectTrack]);

  const setMusicStyle = useCallback((style: VinylMusicStyle) => {
    setMusicStyleState(style);
    vinylAudio.setStyle(style);
  }, []);

  const setRpm = useCallback((nextRpm: 33 | 45) => {
    setRpmState(nextRpm);
    vinylAudio.setRpm(nextRpm);
  }, []);

  const setCrackleLevel = useCallback((level: number) => {
    setCrackleState(level);
    vinylAudio.setCrackleLevel(level);
  }, []);

  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol);
    vinylAudio.setVolume(vol);
  }, []);

  const value = useMemo<CafeContextValue>(
    () => ({
      theme,
      themeMode,
      setThemeMode,
      isAutoTheme: themeMode === 'auto',
      localTimePeriod,
      toggleTheme,
      currency,
      setCurrency,
      formatPrice,
      cart,
      addToCart,
      updateCartQty,
      removeFromCart,
      clearCart,
      cartCount,
      cartSubtotalInr,
      isOrderDrawerOpen,
      setIsOrderDrawerOpen,
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
      readingBook,
      setReadingBook,
      openBookById,
      steamTrailEnabled,
      setSteamTrailEnabled,
      isChalkboardOpen,
      setIsChalkboardOpen,
      sessionQuote,
      openStatus,
    }),
    [
      theme,
      themeMode,
      setThemeMode,
      localTimePeriod,
      toggleTheme,
      currency,
      formatPrice,
      cart,
      addToCart,
      updateCartQty,
      removeFromCart,
      clearCart,
      cartCount,
      cartSubtotalInr,
      isOrderDrawerOpen,
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
      readingBook,
      openBookById,
      steamTrailEnabled,
      isChalkboardOpen,
      sessionQuote,
      openStatus,
    ]
  );

  return (
    <CafeContext.Provider value={value}>
      {children}
      {revealRipple && (
        <div
          key={revealRipple.id}
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[9999]"
          style={{
            backgroundColor: revealRipple.targetColor,
            animation: 'willowCircleReveal 620ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
            ['--rx' as string]: `${revealRipple.x}px`,
            ['--ry' as string]: `${revealRipple.y}px`,
            ['--rr' as string]: `${revealRipple.radius}px`,
          }}
        />
      )}
      <style>{`
        @keyframes willowCircleReveal {
          0% {
            clip-path: circle(0px at var(--rx) var(--ry));
            opacity: 0.96;
          }
          55% {
            clip-path: circle(var(--rr) at var(--rx) var(--ry));
            opacity: 0.96;
          }
          100% {
            clip-path: circle(var(--rr) at var(--rx) var(--ry));
            opacity: 0;
          }
        }
      `}</style>
    </CafeContext.Provider>
  );
};

export function useCafe() {
  const ctx = useContext(CafeContext);
  if (!ctx) {
    throw new Error('useCafe must be used inside CafeProvider');
  }
  return ctx;
}
