import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Sun, Moon, ShoppingBag, Menu, X, Disc3, Clock } from 'lucide-react';
import { useCafe } from '../context/CafeContext';
import {
  BRAND_CONFIG,
  CURRENCIES,
  CurrencyCode,
  VINYL_MUSIC_STYLES,
  VINYL_PLAYLIST,
  VinylMusicStyle,
} from '../data/cafeConfig';

const PRIMARY_NAV_LINKS = [
  { to: '/menu', label: 'Menu' },
  { to: '/space', label: 'The Space' },
  { to: '/books-music', label: 'Books & Music' },
  { to: '/story', label: 'Story' },
  { to: '/contact', label: 'Visit' },
];

const OVERLAY_ROUTES = [
  { to: '/', num: '01', label: 'Home Sanctuary', note: 'Courtyard overview & daily specials' },
  { to: '/menu', num: '02', label: 'Menu & 3D Showcase', note: 'Coffee, matcha, pasta, sourdough & bakery' },
  { to: '/space', num: '03', label: 'Step Inside The Willow', note: '360° immersive tour & day-to-night light' },
  { to: '/books-music', num: '04', label: 'Bookshelf & Turntable', note: '240+ books, working LP player & live dusk events' },
  { to: '/reservations', num: '05', label: 'Pick Your Table', note: 'Interactive seating map & private gatherings' },
  { to: '/story', num: '06', label: 'Our Journey & Beans', note: 'Horizontal timeline, farmers & team' },
  { to: '/gallery', num: '07', label: 'Infinite Photo Canvas', note: 'Free-drag moodboard & courtyard moments' },
  { to: '/contact', num: '08', label: 'Visit & Hours', note: 'Courtyard map, live status & directions' },
];

export const NavbarAndOverlay: React.FC = () => {
  const location = useLocation();
  const {
    theme,
    themeMode,
    setThemeMode,
    isAutoTheme,
    localTimePeriod,
    toggleTheme,
    cartCount,
    setIsOrderDrawerOpen,
    isPlayingVinyl,
    toggleVinyl,
    activeTrackIndex,
    musicStyle,
    setMusicStyle,
    currency,
    setCurrency,
    openStatus,
  } = useCafe();

  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <>
      <header
        style={{ backgroundColor: 'var(--willow-nav)' }}
        className="sticky top-0 z-30 h-14 sm:h-15 backdrop-blur-md border-b border-[var(--willow-border)] text-[var(--willow-text)] transition-colors"
      >
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 sm:gap-6">
          {/* Zone 1: Brand Wordmark */}
          <Link
            to="/"
            className="font-serif text-lg sm:text-xl font-medium tracking-tight text-[var(--willow-text)] hover:text-[var(--willow-amber)] transition-colors whitespace-nowrap shrink-0"
          >
            {BRAND_CONFIG.name}
          </Link>

          {/* Zone 2: Primary Nav Links */}
          <nav
            aria-label="Primary"
            className="hidden lg:flex items-center gap-6 text-[13px] font-medium text-[var(--willow-text-secondary)]"
          >
            {PRIMARY_NAV_LINKS.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative py-1 transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'text-[var(--willow-text)] font-semibold'
                      : 'hover:text-[var(--willow-amber)]'
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute inset-x-0 -bottom-0.5 h-[1.5px] bg-[#C9893B]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Zone 3: Theme Toggle, Order Tray, Index Overlay, Reserve Action */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={(e) => toggleTheme(e)}
              aria-label={
                isAutoTheme
                  ? `Theme: Auto (${localTimePeriod === 'day' ? 'Day Light' : 'Evening Dark'}). Click to override.`
                  : theme === 'light'
                  ? 'Switch to Evening Candlelight'
                  : 'Switch to Auto Local Time'
              }
              title={
                isAutoTheme
                  ? `Auto Local Time Active · Currently ${localTimePeriod === 'day' ? 'Day Light (06:00–18:00)' : 'Evening Dark (18:00–06:00)'} · Click to cycle`
                  : `Manual Mode: ${theme === 'light' ? 'Day Light' : 'Evening Dark'} · Click to cycle (returns to Auto)`
              }
              className="relative w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-[var(--willow-text-secondary)] hover:text-[var(--willow-amber)] hover:bg-[var(--willow-subtle)] transition-colors cursor-pointer"
            >
              {theme === 'light' ? <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              {isAutoTheme && (
                <span
                  className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-[#C9893B]"
                  title="Auto time detection active"
                />
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsOrderDrawerOpen(true)}
              aria-label={`Open order tray (${cartCount} items)`}
              className="relative px-2 h-8.5 sm:h-9 rounded-lg flex items-center justify-center text-[var(--willow-text-secondary)] hover:text-[var(--willow-amber)] hover:bg-[var(--willow-subtle)] transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {cartCount > 0 && (
                <span className="ml-1 text-[11px] font-mono tabular-nums font-semibold text-[var(--willow-amber-text)]">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-expanded={menuOpen}
              aria-label="Open full-screen café index menu"
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--willow-text)] hover:bg-[var(--willow-subtle)] transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Menu className="w-3.5 h-3.5" />
              <span>Index</span>
            </button>

            <Link
              to="/reservations"
              className="hidden sm:inline-flex items-center px-3.5 py-1.5 rounded-lg bg-[var(--willow-btn-primary-bg)] text-[var(--willow-btn-primary-fg)] hover:opacity-90 text-xs font-semibold transition-opacity whitespace-nowrap shrink-0"
            >
              Reserve
            </Link>
          </div>
        </div>
      </header>

      {/* Full-Screen Animated Menu Overlay (High-contrast in BOTH Light & Dark themes) */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="full-overlay-menu"
            initial={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
            animate={{ opacity: 1, clipPath: 'inset(0 0 0% 0)' }}
            exit={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 bg-[var(--willow-bg)] text-[var(--willow-text)] overflow-y-auto flex flex-col justify-between"
            role="dialog"
            aria-modal="true"
            aria-label="Site Navigation Overlay"
          >
            {/* Overlay Top Header */}
            <div className="max-w-7xl w-full mx-auto px-6 sm:px-8 h-16 flex items-center justify-between border-b border-[var(--willow-border)]">
              <span className="font-serif text-xl sm:text-2xl text-[var(--willow-text)]">
                {BRAND_CONFIG.name}
              </span>
              <div className="flex items-center gap-3">
                {/* Segmented Theme Mode Control: Auto (Day/Evening) | Day | Evening */}
                <div className="inline-flex items-center p-0.5 rounded-lg border border-[var(--willow-border-strong)] willow-subtle">
                  <button
                    type="button"
                    onClick={(e) => setThemeMode('auto', e)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                      isAutoTheme
                        ? 'bg-[var(--willow-btn-primary-bg)] text-[var(--willow-btn-primary-fg)] font-semibold shadow-xs'
                        : 'text-[var(--willow-text-secondary)] hover:text-[var(--willow-text)]'
                    }`}
                    title="Automatically sync with user's local time (Light 06:00-18:00, Dark 18:00-06:00)"
                  >
                    <Clock className="w-3 h-3 text-[#C9893B]" />
                    <span>Auto ({localTimePeriod === 'day' ? 'Day' : 'Evening'})</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => setThemeMode('light', e)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                      !isAutoTheme && theme === 'light'
                        ? 'bg-[var(--willow-btn-primary-bg)] text-[var(--willow-btn-primary-fg)] font-semibold shadow-xs'
                        : 'text-[var(--willow-text-secondary)] hover:text-[var(--willow-text)]'
                    }`}
                  >
                    <Sun className="w-3 h-3" />
                    <span>Day</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => setThemeMode('dark', e)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                      !isAutoTheme && theme === 'dark'
                        ? 'bg-[var(--willow-btn-primary-bg)] text-[var(--willow-btn-primary-fg)] font-semibold shadow-xs'
                        : 'text-[var(--willow-text-secondary)] hover:text-[var(--willow-text)]'
                    }`}
                  >
                    <Moon className="w-3 h-3" />
                    <span>Evening</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close navigation menu"
                  className="px-3.5 py-1.5 rounded-lg bg-[var(--willow-subtle)] hover:bg-[#C9893B] hover:text-[#14100C] text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Close</span>
                </button>
              </div>
            </div>

            {/* Center Editorial Links + Sanctuary Details */}
            <div className="max-w-7xl w-full mx-auto px-6 sm:px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center my-auto">
              <div className="lg:col-span-8 divide-y divide-[var(--willow-border)]">
                {OVERLAY_ROUTES.map((route, idx) => {
                  const isActive = location.pathname === route.to;
                  return (
                    <motion.div
                      key={route.to}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.06 + idx * 0.035, duration: 0.42 }}
                    >
                      <Link
                        to={route.to}
                        onClick={() => setMenuOpen(false)}
                        className="group py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 transition-colors"
                      >
                        <div className="flex items-baseline gap-4">
                          <span className="font-mono text-xs text-[var(--willow-amber-text)] tabular-nums">
                            {route.num}
                          </span>
                          <span
                            className={`font-serif text-3xl sm:text-4xl md:text-5xl transition-transform duration-200 group-hover:translate-x-2 ${
                              isActive
                                ? 'italic text-[var(--willow-amber-text)]'
                                : 'text-[var(--willow-text)] group-hover:text-[var(--willow-amber)]'
                            }`}
                          >
                            {route.label}
                          </span>
                        </div>
                        <span className="text-xs text-[var(--willow-text-muted)] pl-8 sm:pl-0">
                          {route.note}
                        </span>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {/* Right Column: Live Hours, Vinyl Control & Currency */}
              <div className="lg:col-span-4 space-y-8 lg:pl-8 lg:border-l border-[var(--willow-border)]">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-[var(--willow-amber-text)]">
                    Courtyard Status
                  </p>
                  <p className="font-serif text-2xl text-[var(--willow-text)]">
                    {openStatus.statusLabel}
                  </p>
                  <p className="text-xs text-[var(--willow-text-secondary)] tabular-nums">
                    {openStatus.todayName} · {openStatus.todayHours}
                  </p>
                  <p className="text-xs text-[var(--willow-text-muted)] pt-1">
                    {BRAND_CONFIG.address}
                  </p>
                </div>

                {/* Turntable Quick Control */}
                <div className="pt-6 border-t border-[var(--willow-border)] space-y-3">
                  <p className="text-xs font-medium text-[var(--willow-amber-text)]">
                    Analog Listening Room
                  </p>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-serif text-lg text-[var(--willow-text)] truncate">
                        {VINYL_PLAYLIST[activeTrackIndex].title}
                      </p>
                      <p className="text-xs text-[var(--willow-text-muted)] truncate">
                        {VINYL_PLAYLIST[activeTrackIndex].artist} · 33⅓ RPM
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={toggleVinyl}
                      className="px-4 py-2 rounded-lg bg-[#C9893B] text-[#14100C] text-xs font-semibold hover:bg-[#DDA052] transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0"
                    >
                      <Disc3 className={`w-4 h-4 ${isPlayingVinyl ? 'animate-spin' : ''}`} />
                      <span>{isPlayingVinyl ? 'Pause LP' : 'Play LP'}</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] text-[var(--willow-text-muted)]">Music Style</span>
                    <select
                      aria-label="Select background music style"
                      value={musicStyle}
                      onChange={(e) => setMusicStyle(e.target.value as VinylMusicStyle)}
                      className="px-2.5 py-1 rounded-md willow-subtle border border-[var(--willow-border-strong)] text-xs text-[var(--willow-text)] focus:outline-none focus:border-[#C9893B] cursor-pointer"
                    >
                      {VINYL_MUSIC_STYLES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Currency Switcher */}
                <div className="pt-6 border-t border-[var(--willow-border)] space-y-2">
                  <p className="text-xs text-[var(--willow-text-muted)]">Menu Currency</p>
                  <div className="inline-flex items-center p-1 rounded-lg willow-subtle border gap-1">
                    {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setCurrency(code)}
                        className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors whitespace-nowrap cursor-pointer ${
                          currency === code
                            ? 'bg-[#C9893B] text-[#14100C] font-semibold'
                            : 'text-[var(--willow-text-secondary)] hover:text-[var(--willow-text)]'
                        }`}
                      >
                        {CURRENCIES[code].label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Overlay Bottom Bar */}
            <div className="max-w-7xl w-full mx-auto px-6 sm:px-8 py-5 border-t border-[var(--willow-border)] flex flex-wrap items-center justify-between gap-4 text-xs text-[var(--willow-text-muted)]">
              <span>“Good Food. Better Days.” · “Good Food. Better Music.”</span>
              <span>
                {BRAND_CONFIG.instagram} · {BRAND_CONFIG.phone}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
