import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Coffee,
  PenLine,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
} from 'lucide-react';
import {
  CURRENCIES,
  CurrencyCode,
  DietaryTag,
  MENU_CATEGORIES,
  MENU_ITEMS,
  MenuCategory,
  MenuItem,
} from '../data/cafeConfig';
import { useCafe } from '../context/CafeContext';
import { FoodViewer } from '../components/FoodViewer';
import { ResilientImage } from '../components/ResilientImage';
import { ScrollRevealHeading } from '../components/ScrollRevealHeading';

interface CoffeeJournalEntry {
  dishId: string;
  rating: number; // 0..5
  notes: string;
  aromaTags: string[];
  updatedAt: string;
}

const COFFEE_JOURNAL_STORAGE_KEY = 'willow-coffee-tasting-journal-v1';

const CUPPING_NOTE_TAGS = [
  'Floral Jasmine',
  'Dark Cacao',
  'Wild Honey',
  'Bright Citrus',
  'Toasted Nut',
  'Silky Body',
  'Caramel Finish',
  'Berry Crisp',
] as const;

const RATING_LABELS: Record<number, string> = {
  1: 'Subtle · Light Cup',
  2: 'Pleasant · Easy Sip',
  3: 'Balanced · Daily Pour',
  4: 'Memorable · Roaster Pick',
  5: 'Exceptional · House Reserve',
};

function loadSavedJournal(): Record<string, CoffeeJournalEntry> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(COFFEE_JOURNAL_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, CoffeeJournalEntry>;
    }
  } catch {
    // Ignore storage read errors in restricted environments
  }
  return {};
}

export const MenuPage: React.FC = () => {
  const { formatPrice, currency, setCurrency, addToCart } = useCafe();

  const coffeeItems = useMemo(
    () => MENU_ITEMS.filter((item) => item.category === 'Coffee'),
    []
  );

  const [selectedCategory, setSelectedCategory] = useState<'All' | MenuCategory>('All');
  const [selectedDietary, setSelectedDietary] = useState<'All' | DietaryTag>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDishId, setSelectedDishId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const requested = new URLSearchParams(window.location.search).get('dish');
      if (requested && MENU_ITEMS.some((m) => m.id === requested)) {
        return requested;
      }
    }
    return MENU_ITEMS.find((m) => m.id === 'avocado-toast')?.id || MENU_ITEMS[0].id;
  });

  // Digital Coffee Tasting Journal persisted in localStorage
  const [journalEntries, setJournalEntries] = useState<Record<string, CoffeeJournalEntry>>(() =>
    loadSavedJournal()
  );
  const [journalCoffeeId, setJournalCoffeeId] = useState<string>(
    () => coffeeItems[0]?.id || 'cold-brew'
  );
  const [draftRating, setDraftRating] = useState<number>(
    () => journalEntries[coffeeItems[0]?.id || 'cold-brew']?.rating || 0
  );
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [draftNotes, setDraftNotes] = useState<string>(
    () => journalEntries[coffeeItems[0]?.id || 'cold-brew']?.notes || ''
  );
  const [draftTags, setDraftTags] = useState<string[]>(
    () => journalEntries[coffeeItems[0]?.id || 'cold-brew']?.aromaTags || []
  );
  const [justSaved, setJustSaved] = useState(false);

  const journalSectionRef = useRef<HTMLElement | null>(null);
  const notesTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(COFFEE_JOURNAL_STORAGE_KEY, JSON.stringify(journalEntries));
    } catch {
      // Ignore storage quota / privacy mode errors
    }
  }, [journalEntries]);

  const loadCoffeeIntoEditor = (coffeeId: string, scrollToEditor = false) => {
    setJournalCoffeeId(coffeeId);
    const existing = journalEntries[coffeeId];
    setDraftRating(existing?.rating || 0);
    setDraftNotes(existing?.notes || '');
    setDraftTags(existing?.aromaTags || []);
    setJustSaved(false);

    if (scrollToEditor && journalSectionRef.current) {
      journalSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.setTimeout(() => {
        notesTextareaRef.current?.focus();
      }, 420);
    }
  };

  const activeJournalCoffee = useMemo(
    () => coffeeItems.find((c) => c.id === journalCoffeeId) || coffeeItems[0],
    [coffeeItems, journalCoffeeId]
  );

  const handleToggleTag = (tag: string) => {
    setDraftTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag].slice(0, 4)
    );
    setJustSaved(false);
  };

  const handleSaveJournalEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJournalCoffee) return;
    if (draftRating === 0 && !draftNotes.trim() && draftTags.length === 0) return;

    const entry: CoffeeJournalEntry = {
      dishId: activeJournalCoffee.id,
      rating: draftRating,
      notes: draftNotes.trim(),
      aromaTags: draftTags,
      updatedAt: new Date().toISOString(),
    };

    setJournalEntries((prev) => ({
      ...prev,
      [activeJournalCoffee.id]: entry,
    }));
    setJustSaved(true);
  };

  const handleDeleteJournalEntry = (dishId: string) => {
    setJournalEntries((prev) => {
      const next = { ...prev };
      delete next[dishId];
      return next;
    });
    if (dishId === journalCoffeeId) {
      setDraftRating(0);
      setDraftNotes('');
      setDraftTags([]);
      setJustSaved(false);
    }
  };

  const savedEntriesList = useMemo(() => {
    return Object.values(journalEntries).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [journalEntries]);

  const filteredItems = useMemo(() => {
    return MENU_ITEMS.filter((item) => {
      const catOk = selectedCategory === 'All' || item.category === selectedCategory;
      const dietOk = selectedDietary === 'All' || item.dietary.includes(selectedDietary);
      const q = searchQuery.trim().toLowerCase();
      const searchOk =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.ingredients.some((ing) => ing.toLowerCase().includes(q));
      return catOk && dietOk && searchOk;
    });
  }, [selectedCategory, selectedDietary, searchQuery]);

  const activeDish: MenuItem = useMemo(() => {
    const inFiltered = filteredItems.find((m) => m.id === selectedDishId);
    if (inFiltered) return inFiltered;
    return filteredItems[0] || MENU_ITEMS[0];
  }, [filteredItems, selectedDishId]);

  const activeIndexInFiltered = Math.max(
    0,
    filteredItems.findIndex((m) => m.id === activeDish.id)
  );

  const stepWheel = (dir: -1 | 1) => {
    if (filteredItems.length === 0) return;
    const nextIdx = (activeIndexInFiltered + dir + filteredItems.length) % filteredItems.length;
    setSelectedDishId(filteredItems[nextIdx].id);
  };

  const pairedItem = MENU_ITEMS.find((m) => m.id === activeDish.pairedWithId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12">
      {/* Page Header & Currency Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div className="space-y-1.5 max-w-2xl">
          <p className="font-hand text-xl text-[var(--willow-amber-text)]">
            All-Day Kitchen & Espresso Bar
          </p>
          <ScrollRevealHeading
            as="h1"
            className="font-serif text-3xl sm:text-5xl font-normal text-[var(--willow-text)]"
          >
            Interactive Tasting Menu
          </ScrollRevealHeading>
          <p className="text-xs sm:text-sm text-[var(--willow-text-secondary)] max-w-xl">
            Spin the tasting wheel to inspect each dish in interactive 3D, check stone-ground & sourdough ingredients, and discover barista pairings.
          </p>
        </div>

        {/* Currency Switcher */}
        <div className="flex items-center gap-2 self-start lg:self-auto">
          <span className="text-xs text-[var(--willow-text-muted)]">Currency:</span>
          <div className="inline-flex items-center p-1 rounded-lg willow-subtle border gap-1">
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
                {CURRENCIES[code].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category & Dietary Filter Controls */}
      <div className="space-y-4 pb-6 border-b border-[var(--willow-border)]">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {(['All', ...MENU_CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                selectedCategory === cat
                  ? 'bg-[var(--willow-btn-primary-bg)] text-[var(--willow-btn-primary-fg)] border-transparent font-semibold'
                  : 'willow-card text-[var(--willow-text-secondary)] hover:border-[var(--willow-amber)] hover:text-[var(--willow-text)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Dietary Filters + Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="inline-flex items-center p-1 rounded-lg willow-subtle border gap-1 self-start">
            {(['All', 'Veg', 'Vegan', 'Gluten-Free'] as const).map((diet) => (
              <button
                key={diet}
                type="button"
                onClick={() => setSelectedDietary(diet)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  selectedDietary === diet
                    ? 'bg-[var(--willow-surface)] text-[var(--willow-text)] font-semibold shadow-xs'
                    : 'text-[var(--willow-text-secondary)] hover:text-[var(--willow-text)]'
                }`}
              >
                {diet === 'All' ? 'All Diets' : diet}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--willow-text-muted)]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes or ingredients..."
              className="w-full pl-9 pr-3.5 py-2 rounded-lg text-xs bg-[var(--willow-input)] text-[var(--willow-text)] placeholder-[var(--willow-text-muted)] border border-[var(--willow-border-strong)] focus:outline-none focus:border-[var(--willow-amber)]"
            />
          </div>
        </div>
      </div>

      {/* SIGNATURE INTERACTION: CIRCULAR TASTING WHEEL + 3D DISH VIEWER + DETAILS */}
      {filteredItems.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <p className="font-serif text-2xl text-[var(--willow-text)]">
            No plates match that exact filter combination.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('All');
              setSelectedDietary('All');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-lg bg-[#C9893B] text-[#14100C] text-xs font-semibold cursor-pointer"
          >
            Reset Menu Filters
          </button>
        </div>
      ) : (
        <section className="space-y-8">
          {/* Interactive Dish Wheel Carousel Strip */}
          <div className="p-4 sm:p-5 rounded-2xl willow-card border space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="text-xs text-[var(--willow-text-muted)] tabular-nums">
                Tasting Wheel · Dish {activeIndexInFiltered + 1} of {filteredItems.length}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => stepWheel(-1)}
                  aria-label="Previous dish on wheel"
                  className="w-8 h-8 rounded-lg willow-subtle border flex items-center justify-center hover:border-[var(--willow-amber)] cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => stepWheel(1)}
                  aria-label="Next dish on wheel"
                  className="w-8 h-8 rounded-lg willow-subtle border flex items-center justify-center hover:border-[var(--willow-amber)] cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2">
              {filteredItems.map((item) => {
                const isSelected = item.id === activeDish.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedDishId(item.id)}
                    className={`group shrink-0 flex items-center gap-3 p-2 pr-4 rounded-full border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--willow-btn-primary-bg)] text-[var(--willow-btn-primary-fg)] border-transparent scale-[1.02]'
                        : 'willow-subtle hover:border-[var(--willow-amber)]'
                    }`}
                  >
                    <ResilientImage
                      src={item.image}
                      dropPhotoPath={item.dropPhotoPath}
                      compactPlaceholder
                      fallbackLabel={`Add photo: ${item.shortLabel || item.name}`}
                      alt={item.name}
                      className={`w-11 h-11 rounded-full object-cover transition-transform duration-500 ${
                        isSelected ? 'rotate-12 ring-2 ring-[#C9893B]' : 'group-hover:rotate-6'
                      }`}
                    />
                    <div className="text-left">
                      <p className="text-xs font-semibold whitespace-nowrap">{item.name}</p>
                      <p
                        className={`text-[11px] font-mono tabular-nums ${
                          isSelected
                            ? 'opacity-90'
                            : 'text-[var(--willow-text-muted)]'
                        }`}
                      >
                        {formatPrice(item.priceInr)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2-Column Contiguous 3D Showcase + Purchase/Details Module */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            <div className="lg:col-span-7">
              <FoodViewer dish={activeDish} />
            </div>

            <div className="lg:col-span-5 p-5 sm:p-6.5 rounded-2xl willow-card border flex flex-col justify-between space-y-5">
              <div className="space-y-3.5">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--willow-text-muted)] tabular-nums">
                  <span>{activeDish.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeDish.dietary.join(', ')}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeDish.calories}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeDish.prepTime}</span>
                </div>

                <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[var(--willow-text)]">
                  {activeDish.name}
                </h2>

                <p className="font-serif text-2xl text-[var(--willow-amber-text)] tabular-nums">
                  {formatPrice(activeDish.priceInr)}
                </p>

                <p className="text-xs sm:text-sm text-[var(--willow-text-secondary)] leading-relaxed">
                  {activeDish.description}
                </p>

                <div className="pt-1.5 space-y-1">
                  <p className="text-xs font-semibold text-[var(--willow-text)]">
                    Key Ingredients
                  </p>
                  <p className="text-xs text-[var(--willow-text-muted)]">
                    {activeDish.ingredients.join(' · ')}
                  </p>
                </div>

                {/* Best Paired With Interactive Jump */}
                {pairedItem && (
                  <div className="p-3.5 rounded-xl willow-subtle border flex items-center justify-between gap-3">
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-[11px] text-[var(--willow-amber-text)] font-medium flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Best paired with</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory('All');
                          setSelectedDietary('All');
                          setSelectedDishId(pairedItem.id);
                        }}
                        className="font-serif text-base text-[var(--willow-text)] hover:text-[var(--willow-amber)] transition-colors truncate block text-left cursor-pointer"
                      >
                        {pairedItem.name} ({formatPrice(pairedItem.priceInr)})
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => addToCart(pairedItem)}
                      className="px-2.5 py-1 rounded-lg border border-[var(--willow-border-strong)] hover:border-[var(--willow-amber)] text-xs text-[var(--willow-text)] whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      + Pair
                    </button>
                  </div>
                )}
                {/* Quick Coffee Tasting Journal Link when inspecting a Coffee */}
                {activeDish.category === 'Coffee' && (
                  <div className="p-3.5 rounded-xl willow-subtle border flex items-center justify-between gap-3">
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-[11px] text-[var(--willow-amber-text)] font-medium flex items-center gap-1.5">
                        <Coffee className="w-3 h-3" />
                        <span>Personal Coffee Journal</span>
                      </p>
                      {journalEntries[activeDish.id] ? (
                        <div className="flex items-center gap-2 text-xs text-[var(--willow-text)]">
                          {journalEntries[activeDish.id].rating > 0 && (
                            <span className="inline-flex items-center gap-0.5 font-mono font-semibold text-[#C9893B]">
                              <Star className="w-3 h-3 fill-[#C9893B] text-[#C9893B]" />
                              {journalEntries[activeDish.id].rating}/5
                            </span>
                          )}
                          <span className="truncate text-[var(--willow-text-secondary)]">
                            {journalEntries[activeDish.id].notes ||
                              journalEntries[activeDish.id].aromaTags.join(', ') ||
                              'Saved in journal'}
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs text-[var(--willow-text-secondary)] truncate">
                          Record your roast rating & tasting notes
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => loadCoffeeIntoEditor(activeDish.id, true)}
                      className="px-2.5 py-1 rounded-lg border border-[var(--willow-border-strong)] hover:border-[var(--willow-amber)] text-xs font-medium text-[var(--willow-text)] whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <PenLine className="w-3 h-3 text-[#C9893B]" />
                      <span>{journalEntries[activeDish.id] ? 'Edit Note' : 'Log Note'}</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => addToCart(activeDish)}
                className="w-full py-2.5 px-4 rounded-lg bg-[#C9893B] hover:bg-[#DDA052] text-[#14100C] font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add {activeDish.shortLabel || activeDish.name} to Order</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* FULL MENU DIRECTORY GRID — Every Dish Has Its Own Photo or Clean "Add photo: <Dish>" Placeholder */}
      <section className="space-y-6 pt-6 border-t border-[var(--willow-border)]">
        <div className="flex items-baseline justify-between">
          <h3 className="font-serif text-xl sm:text-2xl text-[var(--willow-text)]">
            Complete Kitchen & Bar Offerings
          </h3>
          <span className="text-xs text-[var(--willow-text-muted)] tabular-nums">
            {filteredItems.length} items shown
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filteredItems.map((item) => {
            const isHero = item.id === activeDish.id;
            const isCoffee = item.category === 'Coffee';
            const savedEntry = isCoffee ? journalEntries[item.id] : undefined;
            return (
              <article
                key={item.id}
                onClick={() => {
                  setSelectedDishId(item.id);
                  if (isCoffee) {
                    loadCoffeeIntoEditor(item.id, false);
                  }
                  window.scrollTo({ top: 180, behavior: 'smooth' });
                }}
                className={`group cursor-pointer rounded-xl willow-card border transition-all duration-200 hover:-translate-y-0.5 overflow-hidden flex flex-col justify-between ${
                  isHero
                    ? 'border-[#C9893B] ring-1 ring-[#C9893B]/40'
                    : 'hover:border-[#C9893B]/60'
                }`}
              >
                <div>
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <ResilientImage
                      src={item.image}
                      dropPhotoPath={item.dropPhotoPath}
                      fallbackLabel={`Add photo: ${item.shortLabel || item.name}`}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {savedEntry && savedEntry.rating > 0 && (
                      <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-[#14100C]/85 text-[#F4EDE0] text-[11px] font-mono tabular-nums flex items-center gap-1 border border-[#C9893B]/40">
                        <Star className="w-3 h-3 fill-[#C9893B] text-[#C9893B]" />
                        <span>{savedEntry.rating}/5</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 sm:p-4.5 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--willow-text-muted)] tabular-nums">
                      <span>{item.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.dietary.join(', ')}</span>
                      {item.isDailySpecial && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-[var(--willow-amber-text)] font-medium">
                            Today’s Special
                          </span>
                        </>
                      )}
                    </div>
                    <h4 className="font-serif text-lg sm:text-xl font-medium text-[var(--willow-text)] group-hover:text-[var(--willow-amber)] transition-colors">
                      {item.name}
                    </h4>
                    <p className="text-xs text-[var(--willow-text-secondary)] leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="px-4 pb-4 pt-2.5 border-t border-[var(--willow-border)] flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-semibold tabular-nums text-[var(--willow-text)]">
                    {formatPrice(item.priceInr)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isCoffee && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDishId(item.id);
                          loadCoffeeIntoEditor(item.id, true);
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-[var(--willow-border-strong)] hover:border-[#C9893B] text-[var(--willow-text)] hover:text-[var(--willow-amber-text)] text-xs font-medium transition-colors flex items-center gap-1 whitespace-nowrap cursor-pointer"
                      >
                        <PenLine className="w-3 h-3 text-[#C9893B]" />
                        <span>{savedEntry ? 'Journal' : 'Rate'}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(item);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[var(--willow-subtle)] hover:bg-[#C9893B] text-[var(--willow-text)] hover:text-[#14100C] text-xs font-medium transition-colors whitespace-nowrap cursor-pointer"
                    >
                      + Add to Order
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* DIGITAL COFFEE TASTING JOURNAL (Persisted in localStorage) */}
      <section
        id="coffee-tasting-journal"
        ref={journalSectionRef}
        className="pt-8 border-t border-[var(--willow-border)] space-y-6 scroll-mt-20"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="space-y-1 max-w-2xl">
            <p className="font-hand text-xl text-[var(--willow-amber-text)]">
              Personal Cupping Notebook · Saved on This Device
            </p>
            <ScrollRevealHeading className="font-serif text-2xl sm:text-4xl font-normal text-[var(--willow-text)]">
              Coffee Tasting Journal
            </ScrollRevealHeading>
            <p className="text-xs sm:text-sm text-[var(--willow-text-secondary)]">
              Click any coffee in the menu above—or select a roast below—to record your personal star rating, aroma notes, and tasting impressions.
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-[var(--willow-text-muted)] shrink-0">
            {savedEntriesList.length} / {coffeeItems.length} roasts logged
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Left: Interactive Coffee Selector & Rating/Notes Form */}
          <form
            onSubmit={handleSaveJournalEntry}
            className="lg:col-span-6 p-5 sm:p-6.5 rounded-2xl willow-card border space-y-5"
          >
            {/* Coffee Item Picker Chips */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[var(--willow-text)] block">
                1. Choose Coffee to Log
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {coffeeItems.map((coffee) => {
                  const isActive = coffee.id === activeJournalCoffee?.id;
                  const entry = journalEntries[coffee.id];
                  return (
                    <button
                      key={`pick-${coffee.id}`}
                      type="button"
                      onClick={() => loadCoffeeIntoEditor(coffee.id, false)}
                      className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer flex items-center gap-2.5 ${
                        isActive
                          ? 'bg-[var(--willow-btn-primary-bg)] text-[var(--willow-btn-primary-fg)] border-transparent'
                          : 'willow-subtle hover:border-[#C9893B]'
                      }`}
                    >
                      <ResilientImage
                        src={coffee.image}
                        alt={coffee.name}
                        compactPlaceholder
                        className="w-9 h-9 rounded-lg object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">
                          {coffee.shortLabel || coffee.name}
                        </p>
                        <p
                          className={`text-[11px] font-mono tabular-nums ${
                            isActive ? 'opacity-85' : 'text-[var(--willow-text-muted)]'
                          }`}
                        >
                          {entry?.rating ? `★ ${entry.rating}/5` : entry ? 'Note saved' : 'Unrated'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Personal Star Rating */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[var(--willow-text)]">
                  2. Personal Rating
                </span>
                <span className="text-xs text-[var(--willow-amber-text)] font-medium">
                  {(hoverRating || draftRating) > 0
                    ? RATING_LABELS[hoverRating || draftRating]
                    : 'Tap a star to rate'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((starVal) => {
                  const activeStar = (hoverRating || draftRating) >= starVal;
                  return (
                    <button
                      key={starVal}
                      type="button"
                      onMouseEnter={() => setHoverRating(starVal)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => {
                        setDraftRating((prev) => (prev === starVal ? 0 : starVal));
                        setJustSaved(false);
                      }}
                      aria-label={`Rate ${starVal} out of 5 stars`}
                      className="p-1.5 rounded-lg willow-subtle border hover:border-[#C9893B] transition-colors cursor-pointer"
                    >
                      <Star
                        className={`w-5 h-5 transition-colors ${
                          activeStar
                            ? 'fill-[#C9893B] text-[#C9893B]'
                            : 'text-[var(--willow-text-muted)]'
                        }`}
                      />
                    </button>
                  );
                })}
                {draftRating > 0 && (
                  <span className="ml-2 font-mono text-xs tabular-nums text-[var(--willow-text-secondary)]">
                    {draftRating} / 5
                  </span>
                )}
              </div>
            </div>

            {/* Quick Cupping Aroma Tags */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[var(--willow-text)] block">
                Flavor Impressions (up to 4)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {CUPPING_NOTE_TAGS.map((tag) => {
                  const picked = draftTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleToggleTag(tag)}
                      className={`px-2.5 py-1 rounded-lg text-xs border transition-colors cursor-pointer ${
                        picked
                          ? 'bg-[#C9893B] text-[#14100C] border-transparent font-semibold'
                          : 'willow-subtle text-[var(--willow-text-secondary)] hover:border-[#C9893B]'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Freeform Tasting Notes */}
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-[var(--willow-text)] block">
                3. Tasting Notes
              </span>
              <textarea
                ref={notesTextareaRef}
                rows={3}
                value={draftNotes}
                onChange={(e) => {
                  setDraftNotes(e.target.value);
                  setJustSaved(false);
                }}
                placeholder="e.g. Bright tangerine acidity as it cools, silky honey mouthfeel, lovely paired with cardamom knot..."
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-[var(--willow-input)] text-[var(--willow-text)] placeholder-[var(--willow-text-muted)] border border-[var(--willow-border-strong)] focus:outline-none focus:border-[#C9893B] leading-relaxed"
              />
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={draftRating === 0 && !draftNotes.trim() && draftTags.length === 0}
                  className="px-4 py-2.5 rounded-lg bg-[#C9893B] hover:bg-[#DDA052] disabled:opacity-45 text-[#14100C] text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  {justSaved ? <Check className="w-3.5 h-3.5" /> : <PenLine className="w-3.5 h-3.5" />}
                  <span>
                    {justSaved
                      ? 'Saved to Journal'
                      : journalEntries[activeJournalCoffee?.id || '']
                      ? 'Update Journal Entry'
                      : 'Save to Journal'}
                  </span>
                </button>

                {journalEntries[activeJournalCoffee?.id || ''] && (
                  <button
                    type="button"
                    onClick={() => handleDeleteJournalEntry(activeJournalCoffee.id)}
                    className="px-3 py-2.5 rounded-lg border border-[var(--willow-border-strong)] hover:border-red-500/50 text-xs text-[var(--willow-text-secondary)] hover:text-red-500 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              {justSaved && (
                <span className="text-xs text-[var(--willow-sage)] font-medium">
                  Stored locally in your browser
                </span>
              )}
            </div>
          </form>

          {/* Right: Saved Tasting Journal Notebook Feed */}
          <div className="lg:col-span-6 p-5 sm:p-6.5 rounded-2xl willow-subtle border space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--willow-border)] pb-3">
              <div className="flex items-center gap-2">
                <Coffee className="w-4 h-4 text-[#C9893B]" />
                <h3 className="font-serif text-xl text-[var(--willow-text)]">
                  Your Courtyard Notebook
                </h3>
              </div>
              <span className="text-xs font-mono text-[var(--willow-text-muted)] tabular-nums">
                {savedEntriesList.length} {savedEntriesList.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>

            {savedEntriesList.length === 0 ? (
              <div className="py-10 text-center space-y-2.5">
                <p className="font-serif text-lg text-[var(--willow-text)]">
                  Your tasting ledger is open.
                </p>
                <p className="text-xs text-[var(--willow-text-secondary)] max-w-sm mx-auto leading-relaxed">
                  Click “Rate” on any coffee item in the menu above or pick a roast on the left to save your personal star rating and cupping notes.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedEntriesList.map((entry) => {
                  const dish = MENU_ITEMS.find((m) => m.id === entry.dishId);
                  if (!dish) return null;
                  const isEditingThis = dish.id === activeJournalCoffee?.id;
                  const formattedDate = new Date(entry.updatedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  });

                  return (
                    <article
                      key={`journal-${entry.dishId}`}
                      className={`p-4 rounded-xl willow-card border transition-colors space-y-2.5 ${
                        isEditingThis ? 'border-[#C9893B]' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <ResilientImage
                            src={dish.image}
                            alt={dish.name}
                            compactPlaceholder
                            className="w-11 h-11 rounded-lg object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="font-serif text-base sm:text-lg text-[var(--willow-text)] truncate">
                              {dish.name}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-[var(--willow-text-muted)] tabular-nums">
                              {entry.rating > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-[#C9893B] font-mono font-semibold">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-3 h-3 ${
                                        i < entry.rating
                                          ? 'fill-[#C9893B] text-[#C9893B]'
                                          : 'text-[var(--willow-border-strong)]'
                                      }`}
                                    />
                                  ))}
                                </span>
                              )}
                              <span>Logged {formattedDate}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => loadCoffeeIntoEditor(dish.id, false)}
                            className="px-2.5 py-1 rounded-md willow-subtle border hover:border-[#C9893B] text-[11px] font-medium text-[var(--willow-text)] cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteJournalEntry(dish.id)}
                            aria-label={`Delete tasting note for ${dish.name}`}
                            className="p-1.5 rounded-md text-[var(--willow-text-muted)] hover:text-red-500 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {entry.aromaTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {entry.aromaTags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-md willow-subtle border text-[11px] text-[var(--willow-text-secondary)]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {entry.notes && (
                        <p className="text-xs text-[var(--willow-text-secondary)] leading-relaxed italic font-serif sm:text-sm">
                          “{entry.notes}”
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
