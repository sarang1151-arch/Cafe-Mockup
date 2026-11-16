import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Sparkles,
  X,
} from 'lucide-react';
import { BOOKSHELF_PICKS, BookPick, MENU_ITEMS } from '../data/cafeConfig';
import { BOOK_READING_EDITIONS, BookReadingEdition } from '../data/bookContents';
import { useCafe } from '../context/CafeContext';

interface BookReaderModalProps {
  book?: BookPick | null;
  onClose?: () => void;
  onSelectBook?: (book: BookPick) => void;
  allBooks?: BookPick[];
}

type PaperTheme = 'parchment' | 'cream' | 'night';
type FontScale = 'sm' | 'md' | 'lg';

const BOOKMARK_STORAGE_KEY = 'willow_book_bookmarks_v1';

const PAPER_STYLES: Record<
  PaperTheme,
  {
    outerBg: string;
    pageBg: string;
    leftPageBg: string;
    textMain: string;
    textMuted: string;
    border: string;
    accent: string;
    label: string;
  }
> = {
  parchment: {
    outerBg: '#241810',
    pageBg: '#F4EDE0',
    leftPageBg: '#ECE2CF',
    textMain: '#2A1D14',
    textMuted: '#65503F',
    border: 'rgba(42, 29, 20, 0.16)',
    accent: '#9E6324',
    label: 'Parchment',
  },
  cream: {
    outerBg: '#2A1E15',
    pageBg: '#FCF9F3',
    leftPageBg: '#F5EFE4',
    textMain: '#211710',
    textMuted: '#5C4A3B',
    border: 'rgba(33, 23, 16, 0.14)',
    accent: '#9E6324',
    label: 'Soft Cream',
  },
  night: {
    outerBg: '#0E0B08',
    pageBg: '#1A1410',
    leftPageBg: '#14100C',
    textMain: '#F4EDE0',
    textMuted: '#B7A793',
    border: 'rgba(244, 237, 224, 0.14)',
    accent: '#C9893B',
    label: 'Evening Ink',
  },
};

const FONT_SIZE_CLASSES: Record<FontScale, string> = {
  sm: 'text-sm sm:text-[15px] leading-[1.8]',
  md: 'text-[15px] sm:text-[17px] leading-[1.85]',
  lg: 'text-base sm:text-[19px] leading-[1.9]',
};

function buildFallbackEdition(book: BookPick): BookReadingEdition {
  return {
    bookId: book.id,
    subtitle: `${book.genre} · Willow Courtyard Lending Edition`,
    editionNote: 'Shelf B · Courtyard Lending Copy',
    readingTime: '8 min café excerpt · 2 chapters',
    shelfLocation: 'Salvaged Walnut Shelf B',
    chapters: [
      {
        chapterNum: 'Chapter I',
        chapterTitle: book.title,
        pageRange: 'pp. 1–14',
        epigraph: book.quote,
        paragraphs: [
          book.ourPickNote,
          `In the quiet warmth of our 1924 brick courtyard, "${book.title}" by ${book.author} remains one of our most reached-for afternoon companions alongside ${book.pairedDrink}.`,
        ],
        baristaMarginNote: `Recommended pairing: ${book.pairedDrink}.`,
      },
      {
        chapterNum: 'Chapter II',
        chapterTitle: 'Marginalia From Regulars',
        pageRange: `pp. 15–${book.pages}`,
        paragraphs: [
          'Every volume on Shelf B carries pencilled notes from morning writers, architects, and evening listeners who lingered until the courtyard lamps came on.',
          'Feel free to bookmark your page here—your reading spot is saved automatically on this device.',
        ],
      },
    ],
  };
}

export const BookReaderModal: React.FC<BookReaderModalProps> = ({
  book: propBook,
  onClose: propOnClose,
  onSelectBook: propOnSelectBook,
  allBooks = BOOKSHELF_PICKS,
}) => {
  const { readingBook, setReadingBook, addToCart, formatPrice } = useCafe();

  const activeBook = propBook !== undefined ? propBook : readingBook;
  const handleClose = useCallback(() => {
    if (propOnClose) propOnClose();
    else setReadingBook(null);
  }, [propOnClose, setReadingBook]);

  const handleSelectBook = useCallback(
    (next: BookPick) => {
      if (propOnSelectBook) propOnSelectBook(next);
      else setReadingBook(next);
    },
    [propOnSelectBook, setReadingBook]
  );

  const [chapterIdx, setChapterIdx] = useState(0);
  const [paperTheme, setPaperTheme] = useState<PaperTheme>('parchment');
  const [fontScale, setFontScale] = useState<FontScale>('md');
  const [bookmarks, setBookmarks] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem(BOOKMARK_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [turnDirection, setTurnDirection] = useState<'next' | 'prev'>('next');

  const touchStartXRef = useRef<number | null>(null);
  const rightPageScrollRef = useRef<HTMLDivElement | null>(null);

  const edition = useMemo(() => {
    if (!activeBook) return null;
    return BOOK_READING_EDITIONS[activeBook.id] || buildFallbackEdition(activeBook);
  }, [activeBook]);

  const chapters = edition?.chapters || [];
  const totalChapters = chapters.length;
  const currentChapter = chapters[chapterIdx] || chapters[0];

  // Restore saved bookmark chapter when opening a book
  useEffect(() => {
    if (!activeBook || !edition) return;
    const saved = bookmarks[activeBook.id];
    if (typeof saved === 'number' && saved >= 0 && saved < edition.chapters.length) {
      setChapterIdx(saved);
    } else {
      setChapterIdx(0);
    }
  }, [activeBook?.id]);

  // Reset scroll top on chapter turn
  useEffect(() => {
    rightPageScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [chapterIdx, activeBook?.id]);

  const goPrev = useCallback(() => {
    setTurnDirection('prev');
    setChapterIdx((i) => Math.max(0, i - 1));
  }, []);

  const goNext = useCallback(() => {
    setTurnDirection('next');
    setChapterIdx((i) => Math.min(Math.max(0, totalChapters - 1), i + 1));
  }, [totalChapters]);

  // Keyboard navigation (ArrowLeft, ArrowRight, Escape) + lock body scroll
  useEffect(() => {
    if (!activeBook) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [activeBook, goNext, goPrev, handleClose]);

  if (!activeBook || !edition || !currentChapter || typeof document === 'undefined') {
    return null;
  }

  const palette = PAPER_STYLES[paperTheme];
  const isBookmarkedHere = bookmarks[activeBook.id] === chapterIdx;
  const pairedDrinkItem = MENU_ITEMS.find(
    (m) => m.name.toLowerCase() === activeBook.pairedDrink.toLowerCase()
  );

  const toggleBookmark = () => {
    setBookmarks((prev) => {
      const next = { ...prev };
      if (next[activeBook.id] === chapterIdx) {
        delete next[activeBook.id];
      } else {
        next[activeBook.id] = chapterIdx;
      }
      try {
        localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  const modalContent = (
    <div
      data-lenis-prevent="true"
      onWheel={(e) => e.stopPropagation()}
      className="fixed inset-0 z-[115] flex items-center justify-center p-2.5 sm:p-5 bg-black/82 backdrop-blur-[2px] animate-[willowBookCoverOpen_240ms_cubic-bezier(0.16,1,0.3,1)]"
      role="dialog"
      aria-modal="true"
      aria-label={`Reading ${activeBook.title} by ${activeBook.author}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      {/* Leather & Walnut Open-Book Reading Desk Frame */}
      <div
        data-lenis-prevent="true"
        className="relative w-full max-w-6xl max-h-[92vh] rounded-2xl overflow-hidden shadow-2xl border border-[#C9893B]/40 flex flex-col"
        style={{ backgroundColor: palette.outerBg }}
      >
        {/* Top Reader Toolbar */}
        <div className="px-4 sm:px-6 py-3 bg-[#14100C] text-[#F4EDE0] border-b border-[#F4EDE0]/12 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="w-3.5 h-5 rounded-xs shrink-0 border border-white/25"
              style={{ backgroundColor: activeBook.spineColor }}
            />
            <div className="min-w-0">
              <p className="font-serif text-base sm:text-lg leading-tight truncate text-[#F4EDE0]">
                {activeBook.title}
                <span className="text-xs font-sans text-[#F4EDE0]/65 ml-2">
                  by {activeBook.author}
                </span>
              </p>
              <p className="text-[11px] text-[#C9893B] truncate">{edition.editionNote}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Paper Theme Selector */}
            <div className="inline-flex items-center p-0.5 rounded-lg bg-[#221A14] border border-[#F4EDE0]/15 text-[11px]">
              {(['parchment', 'cream', 'night'] as PaperTheme[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaperTheme(mode)}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    paperTheme === mode
                      ? 'bg-[#C9893B] text-[#14100C] font-semibold'
                      : 'text-[#F4EDE0]/75 hover:text-[#F4EDE0]'
                  }`}
                >
                  {PAPER_STYLES[mode].label}
                </button>
              ))}
            </div>

            {/* Font Scale */}
            <div className="hidden sm:inline-flex items-center p-0.5 rounded-lg bg-[#221A14] border border-[#F4EDE0]/15 text-[11px] font-serif">
              {(['sm', 'md', 'lg'] as FontScale[]).map((sz, idx) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setFontScale(sz)}
                  aria-label={`Set reader text size ${sz}`}
                  className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                    fontScale === sz
                      ? 'bg-[#F4EDE0] text-[#14100C] font-semibold'
                      : 'text-[#F4EDE0]/75 hover:text-[#F4EDE0]'
                  }`}
                >
                  {idx === 0 ? 'A-' : idx === 1 ? 'A' : 'A+'}
                </button>
              ))}
            </div>

            {/* Bookmark Current Spread */}
            <button
              type="button"
              onClick={toggleBookmark}
              className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                isBookmarkedHere
                  ? 'bg-[#C9893B] text-[#14100C] border-[#C9893B] font-semibold'
                  : 'bg-[#221A14] text-[#F4EDE0]/85 border-[#F4EDE0]/15 hover:border-[#C9893B]'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" fill={isBookmarkedHere ? 'currentColor' : 'none'} />
              <span className="hidden md:inline">
                {isBookmarkedHere ? 'Bookmarked' : 'Bookmark'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleClose}
              aria-label="Close book reader"
              className="px-2.5 h-8 rounded-lg bg-[#221A14] hover:bg-[#C9893B] text-[#F4EDE0] hover:text-[#14100C] border border-[#F4EDE0]/15 flex items-center gap-1 text-xs font-medium transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Close Book</span>
            </button>
          </div>
        </div>

        {/* Open Two-Page Book Spread */}
        <div
          ref={rightPageScrollRef}
          data-lenis-prevent="true"
          onTouchStart={(e) => {
            touchStartXRef.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            if (touchStartXRef.current == null) return;
            const dx =
              (e.changedTouches[0]?.clientX ?? touchStartXRef.current) - touchStartXRef.current;
            touchStartXRef.current = null;
            if (dx < -50) goNext();
            else if (dx > 50) goPrev();
          }}
          className="flex-1 min-h-0 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 relative"
          style={{
            backgroundColor: palette.pageBg,
            color: palette.textMain,
          }}
        >
          {/* Left Page: Ex-Libris Bookplate, Chapter Index & Shelf Switcher */}
          <aside
            className="lg:col-span-4 p-5 sm:p-8 flex flex-col justify-between gap-6 border-b lg:border-b-0 lg:border-r relative"
            style={{
              backgroundColor: palette.leftPageBg,
              borderColor: palette.border,
            }}
          >
            <div className="space-y-5">
              {/* Ex-Libris Bookplate */}
              <div
                className="p-4 rounded-xl border space-y-2"
                style={{ borderColor: palette.border }}
              >
                <div
                  className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider"
                  style={{ color: palette.accent }}
                >
                  <span>Ex Libris · Willow Café</span>
                  <span>{activeBook.pages} pp.</span>
                </div>
                <h2 className="font-serif text-2xl leading-snug">{activeBook.title}</h2>
                <p className="text-xs" style={{ color: palette.textMuted }}>
                  {edition.subtitle}
                </p>
                <p className="text-[11px] font-mono pt-1" style={{ color: palette.textMuted }}>
                  {edition.readingTime}
                </p>
              </div>

              {/* Interactive Chapter Table of Contents */}
              <div className="space-y-1.5">
                <p
                  className="text-[11px] font-mono uppercase tracking-wider px-1"
                  style={{ color: palette.textMuted }}
                >
                  Chapters in Café Edition
                </p>
                <div className="space-y-1">
                  {chapters.map((ch, idx) => {
                    const active = idx === chapterIdx;
                    const savedMark = bookmarks[activeBook.id] === idx;
                    return (
                      <button
                        key={ch.chapterNum}
                        type="button"
                        onClick={() => {
                          setTurnDirection(idx >= chapterIdx ? 'next' : 'prev');
                          setChapterIdx(idx);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                          active ? 'font-semibold' : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{
                          backgroundColor: active
                            ? paperTheme === 'night'
                              ? 'rgba(201, 137, 59, 0.2)'
                              : 'rgba(42, 29, 20, 0.08)'
                            : 'transparent',
                          color: active ? palette.accent : palette.textMain,
                        }}
                      >
                        <span className="truncate">
                          <span className="font-mono text-[10px] mr-2 opacity-75">0{idx + 1}</span>
                          {ch.chapterTitle}
                        </span>
                        <span className="flex items-center gap-1 shrink-0 font-mono text-[10px] opacity-70">
                          {savedMark && <Bookmark className="w-3 h-3" fill="currentColor" />}
                          <span>{ch.pageRange}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Switch to Another Shelf Book Without Leaving Reader */}
            {allBooks.length > 1 && (
              <div className="pt-4 border-t space-y-2" style={{ borderColor: palette.border }}>
                <p
                  className="text-[11px] font-mono uppercase tracking-wider"
                  style={{ color: palette.textMuted }}
                >
                  Switch Volume on Shelf B
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {allBooks.map((b) => {
                    const isCurr = b.id === activeBook.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => handleSelectBook(b)}
                        className={`px-2.5 py-1 rounded-md text-[11px] border transition-colors cursor-pointer ${
                          isCurr ? 'font-semibold' : 'opacity-75 hover:opacity-100'
                        }`}
                        style={{
                          borderColor: isCurr ? palette.accent : palette.border,
                          color: isCurr ? palette.accent : palette.textMain,
                        }}
                      >
                        {b.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>

          {/* Right Page: Open Book Chapter Spread with Spine Crease Shadow */}
          <article
            key={`${activeBook.id}-${chapterIdx}-${turnDirection}`}
            className="lg:col-span-8 p-6 sm:p-10 lg:p-12 flex flex-col justify-between gap-8 relative animate-[willowPageTurn_260ms_ease-out]"
            style={{
              boxShadow:
                paperTheme === 'night'
                  ? 'inset 18px 0 28px -18px rgba(0, 0, 0, 0.7)'
                  : 'inset 18px 0 28px -18px rgba(42, 29, 20, 0.18)',
            }}
          >
            <div className="max-w-2xl mx-auto w-full space-y-6">
              {/* Running Header */}
              <div
                className="flex items-center justify-between text-xs font-mono pb-3 border-b"
                style={{ color: palette.textMuted, borderColor: palette.border }}
              >
                <span>{currentChapter.chapterNum}</span>
                <span>{currentChapter.pageRange}</span>
              </div>

              {/* Chapter Title & Optional Epigraph */}
              <header className="space-y-3 pt-1">
                <h3 className="font-serif text-3xl sm:text-4xl leading-tight">
                  {currentChapter.chapterTitle}
                </h3>
                {currentChapter.epigraph && (
                  <blockquote
                    className="pl-4 border-l-2 font-serif italic text-base sm:text-lg"
                    style={{ borderColor: palette.accent, color: palette.textMuted }}
                  >
                    “{currentChapter.epigraph}”
                  </blockquote>
                )}
              </header>

              {/* Chapter Prose with Drop-Cap First Paragraph */}
              <div className={`space-y-5 font-serif ${FONT_SIZE_CLASSES[fontScale]}`}>
                {currentChapter.paragraphs.map((para, pIdx) => (
                  <p
                    key={pIdx}
                    className={
                      pIdx === 0
                        ? 'first-letter:float-left first-letter:font-serif first-letter:text-5xl first-letter:leading-[0.88] first-letter:pr-3 first-letter:pt-1 first-letter:font-medium'
                        : ''
                    }
                  >
                    {para}
                  </p>
                ))}
              </div>

              {/* Handwritten Barista Pencil Margin Note */}
              {currentChapter.baristaMarginNote && (
                <div
                  className="mt-6 p-4 rounded-xl border flex items-start gap-3"
                  style={{
                    borderColor: palette.border,
                    backgroundColor:
                      paperTheme === 'night'
                        ? 'rgba(201, 137, 59, 0.08)'
                        : 'rgba(201, 137, 59, 0.1)',
                  }}
                >
                  <Sparkles className="w-4 h-4 shrink-0 mt-1" style={{ color: palette.accent }} />
                  <p
                    className="font-hand text-xl sm:text-2xl leading-snug"
                    style={{ color: palette.accent }}
                  >
                    {currentChapter.baristaMarginNote}
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Page Turn & Cup Pairing Bar */}
            <div
              className="max-w-2xl mx-auto w-full pt-6 border-t flex flex-wrap items-center justify-between gap-4"
              style={{ borderColor: palette.border }}
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={chapterIdx === 0}
                  className="px-3.5 py-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 disabled:opacity-35 transition-opacity cursor-pointer disabled:cursor-not-allowed"
                  style={{ borderColor: palette.border }}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous Page</span>
                </button>

                <span
                  className="px-2 text-xs font-mono tabular-nums"
                  style={{ color: palette.textMuted }}
                >
                  {chapterIdx + 1} / {totalChapters}
                </span>

                <button
                  type="button"
                  onClick={goNext}
                  disabled={chapterIdx >= totalChapters - 1}
                  className="px-3.5 py-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 disabled:opacity-35 transition-opacity cursor-pointer disabled:cursor-not-allowed"
                  style={{ borderColor: palette.border }}
                >
                  <span>Next Page</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {pairedDrinkItem && (
                <button
                  type="button"
                  onClick={() => addToCart(pairedDrinkItem)}
                  className="px-3.5 py-2 rounded-lg bg-[#C9893B] hover:bg-[#DDA052] text-[#14100C] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Coffee className="w-3.5 h-3.5" />
                  <span>
                    Pair with {pairedDrinkItem.shortLabel || pairedDrinkItem.name} (
                    {formatPrice(pairedDrinkItem.priceInr)})
                  </span>
                </button>
              )}
            </div>
          </article>
        </div>

        <style>{`
          @keyframes willowBookCoverOpen {
            from { opacity: 0; transform: scale(0.96); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes willowPageTurn {
            from { opacity: 0.35; transform: translateX(8px); }
            to { opacity: 1; transform: translateX(0); }
          }
        `}</style>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
