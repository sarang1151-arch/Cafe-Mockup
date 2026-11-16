import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, PenTool, Sparkles } from 'lucide-react';
import { BRAND_CONFIG } from '../data/cafeConfig';
import { useCafe } from '../context/CafeContext';

export const Footer: React.FC = () => {
  const {
    sessionQuote,
    openStatus,
    setIsChalkboardOpen,
    steamTrailEnabled,
    setSteamTrailEnabled,
  } = useCafe();

  const [email, setEmail] = useState('');
  const [joinedClub, setJoinedClub] = useState(false);

  const handleJoinClub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setJoinedClub(true);
    setEmail('');
  };

  return (
    <footer className="bg-[var(--willow-footer)] text-[var(--willow-text)] border-t border-[var(--willow-border)] pt-12 pb-8 overflow-hidden transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Session Refresh Book Quote Easter Egg */}
        <div className="pb-8 border-b border-[var(--willow-border)] flex flex-col md:flex-row md:items-end justify-between gap-5">
          <div className="max-w-2xl space-y-1.5">
            <p className="text-xs font-medium text-[var(--willow-sage)]">
              From Our Shelf Today (changes every visit)
            </p>
            <blockquote className="font-serif italic text-xl sm:text-2xl text-[var(--willow-text)]">
              “{sessionQuote.text}”
            </blockquote>
            <p className="text-xs text-[var(--willow-text-muted)]">
              — {sessionQuote.source}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsChalkboardOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-[var(--willow-surface)] border border-[var(--willow-border-strong)] hover:border-[var(--willow-amber)] text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
            >
              <PenTool className="w-3.5 h-3.5 text-[#C9893B]" />
              <span>Open Courtyard Chalkboard</span>
            </button>

            <button
              type="button"
              onClick={() => setSteamTrailEnabled((prev) => !prev)}
              className="px-3 py-1.5 rounded-lg bg-[var(--willow-surface)] border border-[var(--willow-border-strong)] hover:border-[var(--willow-amber)] text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C9893B]" />
              <span>Steam Trail: {steamTrailEnabled ? 'On' : 'Off'}</span>
            </button>
          </div>
        </div>

        {/* Main 4-Column Directory */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          <div className="lg:col-span-4 space-y-2.5">
            <h3 className="font-serif text-xl font-semibold text-[var(--willow-text)]">
              {BRAND_CONFIG.name}
            </h3>
            <p className="font-hand text-xl text-[var(--willow-amber-text)]">
              {BRAND_CONFIG.sloganPrimary}
            </p>
            <p className="text-xs sm:text-sm text-[var(--willow-text-secondary)] leading-relaxed max-w-sm">
              A warm, unhurried neighbourhood sanctuary for specialty single-origin coffee, 48-hour sourdough, curated books, and 33⅓ RPM vinyl records.
            </p>
            <div className="pt-1.5 flex items-center gap-3 text-xs text-[var(--willow-text-muted)]">
              <span>{BRAND_CONFIG.instagram}</span>
              <span aria-hidden="true">·</span>
              <a
                href={`https://wa.me/${BRAND_CONFIG.whatsappNumber}?text=Hello%20The%20Willow%20Caf%C3%A9!`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[var(--willow-text)] hover:text-[var(--willow-amber)] font-medium"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[var(--willow-sage)]" />
                <span>WhatsApp Host</span>
              </a>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-2.5 text-xs sm:text-[13px]">
            <h4 className="font-serif text-base font-semibold text-[var(--willow-text)]">Explore</h4>
            <ul className="space-y-1.5 text-[var(--willow-text-secondary)]">
              <li><Link to="/menu" className="hover:text-[var(--willow-amber)] transition-colors">Menu & Specials</Link></li>
              <li><Link to="/space" className="hover:text-[var(--willow-amber)] transition-colors">Step Inside 360°</Link></li>
              <li><Link to="/books-music" className="hover:text-[var(--willow-amber)] transition-colors">Books & Turntable</Link></li>
              <li><Link to="/reservations" className="hover:text-[var(--willow-amber)] transition-colors">Pick Your Table</Link></li>
              <li><Link to="/story" className="hover:text-[var(--willow-amber)] transition-colors">Our Story & Beans</Link></li>
              <li><Link to="/gallery" className="hover:text-[var(--willow-amber)] transition-colors">Infinite Gallery</Link></li>
              <li><Link to="/contact" className="hover:text-[var(--willow-amber)] transition-colors">Visit & Map</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-3 space-y-2.5 text-xs sm:text-[13px]">
            <h4 className="font-serif text-base font-semibold text-[var(--willow-text)]">
              Courtyard & Hours
            </h4>
            <p className="text-[var(--willow-text-secondary)] text-xs leading-relaxed">
              {BRAND_CONFIG.address}
            </p>
            <div className="text-xs space-y-1 tabular-nums text-[var(--willow-text-secondary)]">
              <p>Mon – Thu, Sun: 08:00 AM – 11:00 PM</p>
              <p>Fri – Sat: 08:00 AM – Midnight</p>
              <p className="text-[var(--willow-amber-text)] font-medium pt-0.5">
                {openStatus.statusLabel} ({openStatus.todayName})
              </p>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-2.5">
            <h4 className="font-serif text-base font-semibold text-[var(--willow-text)]">
              Join The Willow Club
            </h4>
            <p className="text-xs text-[var(--willow-text-secondary)] leading-relaxed">
              Receive Sunday book notes, seasonal micro-lot roast drops, and a complimentary V60 pour-over on your next rainy-day visit.
            </p>
            {joinedClub ? (
              <p className="p-3 rounded-lg bg-[#6E7F63]/15 text-xs text-[var(--willow-text)]">
                Welcome to The Willow Club. Show code <span className="font-mono font-semibold">WILLOWPOUR</span> at the bar for your complimentary pour-over.
              </p>
            ) : (
              <form onSubmit={handleJoinClub} className="flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="reader@domain.com"
                  className="flex-1 min-w-0 px-3 py-2 rounded-lg text-xs bg-[var(--willow-input)] text-[var(--willow-text)] border border-[var(--willow-border-strong)] focus:outline-none focus:border-[var(--willow-amber)]"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-lg bg-[var(--willow-btn-primary-bg)] text-[var(--willow-btn-primary-fg)] text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap cursor-pointer"
                >
                  Join Club
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Giant Moving Wordmark Band */}
      <div className="mt-10 pt-5 border-t border-[var(--willow-border)] overflow-hidden select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4 flex flex-wrap items-center justify-between gap-4 text-xs text-[var(--willow-text-muted)]">
          <span>© {new Date().getFullYear()} {BRAND_CONFIG.name}. Coffee · Food · Books.</span>
          <span>Courtyard Wi-Fi: <span className="font-mono">{BRAND_CONFIG.wifi}</span></span>
        </div>

        <div className="overflow-hidden whitespace-nowrap py-1">
          <div className="inline-block animate-[marquee_34s_linear_infinite] font-serif text-4xl sm:text-6xl md:text-7xl tracking-tight text-[var(--willow-text)] opacity-75">
            THE WILLOW CAFÉ · COFFEE · FOOD · BOOKS · GOOD FOOD BETTER DAYS · THE WILLOW CAFÉ · COFFEE · FOOD · BOOKS ·&nbsp;
          </div>
        </div>
      </div>
    </footer>
  );
};
