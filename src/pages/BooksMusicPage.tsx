import React, { useRef, useState } from 'react';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react';
import { CheckCircle2, BookOpen } from 'lucide-react';
import {
  BOOKSHELF_PICKS,
  BookPick,
  MENU_ITEMS,
  UPCOMING_EVENTS,
  CafeEvent,
} from '../data/cafeConfig';
import { BOOK_READING_EDITIONS } from '../data/bookContents';
import { useCafe } from '../context/CafeContext';
import { ScrollRevealHeading } from '../components/ScrollRevealHeading';
import { VinylPlayer } from '../components/VinylPlayer';

const SPINE_HEIGHTS: Record<string, string> = {
  'atomic-habits': 'h-[248px]',
  'in-praise-of-shadows': 'h-[222px]',
  'creative-act': 'h-[264px]',
  'kafka-shore': 'h-[248px]',
  'salt-fat-acid-heat': 'h-[274px]',
  'braiding-sweetgrass': 'h-[236px]',
  'kitchen-confidential': 'h-[242px]',
};

interface TiltBookCoverCardProps {
  book: BookPick;
  chapterCount: number;
  isSelected: boolean;
  onOpen: () => void;
  onPreview: () => void;
}

const TiltBookCoverCard: React.FC<TiltBookCoverCardProps> = ({
  book,
  chapterCount,
  isSelected,
  onOpen,
  onPreview,
}) => {
  const cardRef = useRef<HTMLButtonElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 260, damping: 22, mass: 0.65 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Subtle card tilt for physical heft
  const cardRotateX = useTransform(smoothY, [-0.5, 0.5], [4.5, -4.5]);
  const cardRotateY = useTransform(smoothX, [-0.5, 0.5], [-5.5, 5.5]);

  // Pronounced 3D tilt on the clothbound cover itself
  const coverRotateX = useTransform(smoothY, [-0.5, 0.5], [16, -16]);
  const coverRotateY = useTransform(smoothX, [-0.5, 0.5], [-20, 20]);
  const shadowX = useTransform(smoothX, [-0.5, 0.5], [8, -8]);
  const shadowY = useTransform(smoothY, [-0.5, 0.5], [10, -2]);

  // Dynamic specular sheen sweeping across the linen cover
  const sheenX = useTransform(smoothX, [-0.5, 0.5], [15, 85]);
  const sheenY = useTransform(smoothY, [-0.5, 0.5], [15, 85]);
  const sheenGradient = useMotionTemplate`radial-gradient(circle at ${sheenX}% ${sheenY}%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 42%, transparent 72%)`;
  const dynamicShadow = useMotionTemplate`${shadowX}px ${shadowY}px 18px -4px rgba(18, 12, 8, 0.42)`;

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (prefersReducedMotion || e.pointerType === 'touch') return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const nx = (e.clientX - rect.left) / Math.max(1, rect.width) - 0.5;
    const ny = (e.clientY - rect.top) / Math.max(1, rect.height) - 0.5;
    mouseX.set(Math.max(-0.5, Math.min(0.5, nx)));
    mouseY.set(Math.max(-0.5, Math.min(0.5, ny)));
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div style={{ perspective: 950 }} className="h-full">
      <motion.button
        ref={cardRef}
        type="button"
        onClick={onOpen}
        onPointerEnter={() => {
          setIsHovered(true);
          onPreview();
        }}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onFocus={onPreview}
        style={
          prefersReducedMotion
            ? undefined
            : {
                rotateX: cardRotateX,
                rotateY: cardRotateY,
                transformStyle: 'preserve-3d',
              }
        }
        whileHover={prefersReducedMotion ? undefined : { y: -4 }}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className={`group w-full h-full text-left p-4 rounded-xl willow-card border transition-colors duration-200 flex items-start gap-4 cursor-pointer ${
          isSelected
            ? 'border-[#C9893B] ring-1 ring-[#C9893B]/35'
            : 'hover:border-[#C9893B]'
        }`}
      >
        {/* Tactile 3D Clothbound Book Cover */}
        <div style={{ perspective: 700 }} className="shrink-0 relative">
          <motion.div
            style={
              prefersReducedMotion
                ? {
                    backgroundColor: book.spineColor,
                    color: book.textColor,
                  }
                : {
                    backgroundColor: book.spineColor,
                    color: book.textColor,
                    rotateX: coverRotateX,
                    rotateY: coverRotateY,
                    boxShadow: dynamicShadow,
                    transformStyle: 'preserve-3d',
                  }
            }
            animate={
              prefersReducedMotion
                ? undefined
                : {
                    z: isHovered ? 16 : 0,
                    scale: isHovered ? 1.07 : 1,
                  }
            }
            transition={{ type: 'spring', stiffness: 280, damping: 20 }}
            className="w-16 h-24 rounded-r-md rounded-l-xs p-2 flex flex-col justify-between border border-black/25 relative overflow-visible"
          >
            {/* Simulated Cream Page Block along right fore-edge */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1 bottom-1 -right-[3px] w-[3px] rounded-r-[2px] bg-[#EFE6D5] border-y border-r border-black/20 opacity-90"
              style={{ transform: 'translateZ(-2px)' }}
            />

            {/* Cover Surface + Embossed Crease + Dynamic Light Sheen */}
            <div className="absolute inset-0 rounded-r-md rounded-l-xs overflow-hidden pointer-events-none">
              <span className="absolute inset-y-0 left-1.5 w-[1.5px] bg-black/25" />
              <span className="absolute inset-y-0 left-[7px] w-[1px] bg-white/15" />
              {!prefersReducedMotion && (
                <motion.div
                  aria-hidden="true"
                  className="absolute inset-0 transition-opacity duration-200"
                  style={{
                    background: sheenGradient,
                    opacity: isHovered ? 1 : 0,
                  }}
                />
              )}
            </div>

            <span className="relative z-10 text-[8px] font-mono uppercase tracking-wider opacity-80 pl-1.5">
              Willow
            </span>
            <span className="relative z-10 font-serif text-[11px] leading-tight font-medium line-clamp-3 pl-1.5">
              {book.title}
            </span>
            <span className="relative z-10 w-5 h-[1px] bg-current opacity-50 ml-1.5" />
          </motion.div>
        </div>

        <div
          className="min-w-0 flex-1 flex flex-col justify-between h-24"
          style={prefersReducedMotion ? undefined : { transform: 'translateZ(6px)' }}
        >
          <div>
            <p className="text-[11px] text-[var(--willow-text-muted)] truncate">
              {book.genre} · {chapterCount} ch.
            </p>
            <h4 className="font-serif text-lg leading-snug text-[var(--willow-text)] group-hover:text-[var(--willow-amber-text)] transition-colors line-clamp-1 mt-0.5">
              {book.title}
            </h4>
            <p className="text-xs text-[var(--willow-text-secondary)] truncate">
              {book.author}
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--willow-amber-text)]">
            <BookOpen className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            <span>Open Book</span>
          </span>
        </div>
      </motion.button>
    </div>
  );
};

export const BooksMusicPage: React.FC = () => {
  const { addToCart, formatPrice, setReadingBook } = useCafe();

  const [selectedBook, setSelectedBook] = useState<BookPick>(BOOKSHELF_PICKS[0]);
  const [rsvpEvent, setRsvpEvent] = useState<CafeEvent | null>(null);
  const [rsvpGuestName, setRsvpGuestName] = useState('');
  const [rsvpDoneId, setRsvpDoneId] = useState<string | null>(null);

  const pairedMenuDrink = MENU_ITEMS.find(
    (m) => m.name.toLowerCase() === selectedBook.pairedDrink.toLowerCase()
  );

  const submitEventRsvp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpEvent || !rsvpGuestName.trim()) return;
    setRsvpDoneId(rsvpEvent.id);
    setRsvpEvent(null);
    setRsvpGuestName('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-16">
      {/* Page Header */}
      <div className="max-w-3xl space-y-2">
        <p className="font-hand text-xl text-[var(--willow-amber-text)]">
          Good Food. Better Music. · Lending Library
        </p>
        <ScrollRevealHeading
          as="h1"
          className="font-serif text-3xl sm:text-5xl font-normal text-[var(--willow-text)]"
        >
          The Walnut Shelf & The Turntable
        </ScrollRevealHeading>
        <p className="text-xs sm:text-sm text-[var(--willow-text-secondary)] leading-relaxed max-w-xl">
          Pull a book from our shelf to read our barista’s handwritten note, or drop the needle on our analog café turntable to hear what’s spinning in the courtyard today.
        </p>
      </div>

      {/* 1. SIGNATURE INTERACTION A: PULL-OUT WALNUT BOOKSHELF + CLOTHBOUND EDITIONS */}
      <section className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          {/* Interactive Illustrated / 3D-Perspective Bookshelf */}
          <div className="lg:col-span-7 p-5 sm:p-6.5 rounded-2xl bg-[#382518] text-[#F4EDE0] border border-[#2A1D14]/30 flex flex-col justify-between shadow-xl overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#E8DEC8]/85 mb-3">
              <span>Shelf B · Courtyard Reading Nook</span>
              <span className="text-[#C9893B] font-medium">
                Click or tap any book spine to open & read
              </span>
            </div>

            {/* Books Standing on Walnut Plank — Stationary button hitboxes so hover NEVER shifts click target */}
            <div className="relative pt-2 pb-1 px-2 sm:px-6 flex items-end justify-center gap-2 sm:gap-3.5 overflow-x-auto no-scrollbar min-h-[300px]">
              {BOOKSHELF_PICKS.map((book) => {
                const isPulled = selectedBook.id === book.id;
                const spineH = SPINE_HEIGHTS[book.id] || 'h-[248px]';
                return (
                  <button
                    key={book.id}
                    type="button"
                    onClick={() => {
                      setSelectedBook(book);
                      setReadingBook(book);
                    }}
                    onMouseEnter={() => setSelectedBook(book)}
                    onFocus={() => setSelectedBook(book)}
                    aria-label={`Open and read ${book.title} by ${book.author}`}
                    className="group relative pt-8 flex items-end shrink-0 cursor-pointer focus:outline-none"
                  >
                    <span
                      className={`pointer-events-none w-12 sm:w-14 ${spineH} rounded-t-md rounded-b-xs border border-white/20 flex flex-col items-center justify-between py-4 px-1 transition-transform duration-200 ease-out shadow-lg ${
                        isPulled
                          ? '-translate-y-5 scale-[1.03] ring-2 ring-[#C9893B] z-10'
                          : 'group-hover:-translate-y-3'
                      }`}
                      style={{
                        backgroundColor: book.spineColor,
                        color: book.textColor,
                      }}
                    >
                      <span className="w-6 h-[1.5px] bg-current opacity-45" />
                      <span
                        className="font-serif text-xs sm:text-sm font-medium tracking-wide whitespace-nowrap"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      >
                        {book.title}
                      </span>
                      <span className="text-[9px] font-mono opacity-80 tabular-nums underline underline-offset-2">
                        Open
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Solid Walnut Shelf Ledge */}
            <div className="h-4.5 w-full rounded-md bg-gradient-to-b from-[#5E3E27] to-[#2B1B10] border-t border-white/15 shadow-md" />
          </div>

          {/* Selected Book "Our Pick" Handwritten Note Card */}
          <div className="lg:col-span-5 p-5 sm:p-6.5 rounded-2xl willow-card border flex flex-col justify-between space-y-5">
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 text-xs text-[var(--willow-text-muted)] tabular-nums">
                <BookOpen className="w-3.5 h-3.5 text-[#C9893B]" />
                <span>{selectedBook.genre}</span>
                <span aria-hidden="true">·</span>
                <span>{selectedBook.pages} pages</span>
                <span aria-hidden="true">·</span>
                <span>
                  {BOOK_READING_EDITIONS[selectedBook.id]?.chapters.length || 5} chapters inside
                </span>
              </div>

              <button
                type="button"
                onClick={() => setReadingBook(selectedBook)}
                className="text-left group cursor-pointer block w-full"
              >
                <h2 className="font-serif text-2xl sm:text-3xl text-[var(--willow-text)] group-hover:text-[var(--willow-amber-text)] transition-colors">
                  {selectedBook.title}
                </h2>
                <p className="text-xs sm:text-sm font-medium text-[var(--willow-sage)] mt-0.5">
                  by {selectedBook.author}
                </p>
              </button>

              <blockquote
                onClick={() => setReadingBook(selectedBook)}
                className="p-3.5 rounded-xl willow-subtle border font-serif italic text-base sm:text-lg text-[var(--willow-text)] cursor-pointer hover:border-[var(--willow-amber)] transition-colors"
              >
                “{selectedBook.quote}”
              </blockquote>

              <div className="space-y-1">
                <p className="font-hand text-xl text-[var(--willow-amber-text)]">
                  Our Pick — Staff Bookmark Note
                </p>
                <p className="text-xs sm:text-sm text-[var(--willow-text-secondary)] leading-relaxed">
                  {selectedBook.ourPickNote}
                </p>
              </div>
            </div>

            <div className="pt-3.5 border-t border-[var(--willow-border)] space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs">
                  <span className="text-[var(--willow-text-muted)] block">
                    Recommended Cup Pairing
                  </span>
                  <strong className="font-serif text-sm sm:text-base text-[var(--willow-text)]">
                    {selectedBook.pairedDrink}
                  </strong>
                </div>

                {pairedMenuDrink && (
                  <button
                    type="button"
                    onClick={() => addToCart(pairedMenuDrink)}
                    className="px-3 py-1.5 rounded-lg border border-[var(--willow-border-strong)] hover:border-[var(--willow-amber)] text-[var(--willow-text)] text-xs font-medium transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Order Cup ({formatPrice(pairedMenuDrink.priceInr)})
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setReadingBook(selectedBook)}
                className="w-full py-2.5 px-4 rounded-xl bg-[#C9893B] hover:bg-[#DDA052] text-[#14100C] text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Open & Read “{selectedBook.title}”</span>
              </button>
            </div>
          </div>
        </div>

        {/* Face-Out Clothbound Reading Editions Grid — Effortless 1-Tap Opening on Desktop & Mobile */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-serif text-xl sm:text-2xl text-[var(--willow-text)]">
              Open Any Clothbound Volume on Shelf B
            </h3>
            <p className="text-xs text-[var(--willow-text-muted)]">
              Tap any book cover below to open its full multi-chapter café edition
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {BOOKSHELF_PICKS.map((book) => {
              const ed = BOOK_READING_EDITIONS[book.id];
              return (
                <TiltBookCoverCard
                  key={`cover-${book.id}`}
                  book={book}
                  chapterCount={ed?.chapters.length || 5}
                  isSelected={selectedBook.id === book.id}
                  onPreview={() => setSelectedBook(book)}
                  onOpen={() => {
                    setSelectedBook(book);
                    setReadingBook(book);
                  }}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* 2. SIGNATURE INTERACTION B: WORKING ANALOG VINYL PLAYER & DYNAMIC MUSIC STYLES */}
      <VinylPlayer />

      {/* 3. LIVE MUSIC & LITERARY EVENTS CALENDAR */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-[var(--willow-amber-text)]">
              Courtyard Evenings & Workshops
            </p>
            <ScrollRevealHeading className="font-serif text-3xl sm:text-5xl font-normal text-[var(--willow-text)]">
              Live Music & Book Gatherings
            </ScrollRevealHeading>
          </div>
          <p className="text-xs text-[var(--willow-text-muted)]">
            Intimate seating · Complimentary entry with table reservation
          </p>
        </div>

        <div className="divide-y divide-[var(--willow-border)] border-t border-b border-[var(--willow-border)]">
          {UPCOMING_EVENTS.map((ev) => {
            const booked = rsvpDoneId === ev.id;
            return (
              <div
                key={ev.id}
                className="py-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-6 flex-1 items-baseline">
                  <div className="md:col-span-3 font-mono text-xs tabular-nums text-[var(--willow-amber-text)] font-medium">
                    {ev.date} · {ev.time}
                  </div>
                  <div className="md:col-span-6">
                    <h3 className="font-serif text-2xl text-[var(--willow-text)]">{ev.title}</h3>
                    <p className="text-xs text-[var(--willow-text-secondary)] mt-0.5">
                      {ev.artist} · {ev.genre}
                    </p>
                  </div>
                  <div className="md:col-span-3 text-xs text-[var(--willow-text-muted)] tabular-nums">
                    {ev.seatsLeft} courtyard spots left
                  </div>
                </div>

                {booked ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--willow-sage)] shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Spot Reserved</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setRsvpEvent(ev)}
                    className="self-start md:self-center px-4 py-2.5 rounded-lg willow-card border hover:border-[var(--willow-amber)] hover:text-[var(--willow-amber-text)] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Reserve a Spot
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Inline Event RSVP Modal */}
        {rsvpEvent && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            role="dialog"
            aria-modal="true"
          >
            <form
              onSubmit={submitEventRsvp}
              className="w-full max-w-md p-6 rounded-2xl willow-card border space-y-4"
            >
              <p className="text-xs font-mono text-[var(--willow-amber-text)]">
                {rsvpEvent.date} · {rsvpEvent.time}
              </p>
              <h3 className="font-serif text-2xl text-[var(--willow-text)]">{rsvpEvent.title}</h3>
              <p className="text-xs text-[var(--willow-text-secondary)]">
                Enter your name and we will hold two courtyard cushions and a welcome hibiscus spritz.
              </p>
              <input
                type="text"
                required
                value={rsvpGuestName}
                onChange={(e) => setRsvpGuestName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-[var(--willow-input)] text-[var(--willow-text)] border border-[var(--willow-border-strong)] focus:outline-none focus:border-[var(--willow-amber)]"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRsvpEvent(null)}
                  className="px-4 py-2 rounded-lg text-xs border border-[var(--willow-border-strong)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#C9893B] text-[#14100C] text-xs font-semibold cursor-pointer"
                >
                  Confirm Spot
                </button>
              </div>
            </form>
          </div>
        )}
      </section>

    </div>
  );
};
