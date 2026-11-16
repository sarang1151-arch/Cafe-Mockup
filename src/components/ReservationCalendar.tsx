import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  BookOpen,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  Trees,
  Utensils,
} from 'lucide-react';
import { SEATING_TABLES, SeatingTable, WEEKLY_HOURS } from '../data/cafeConfig';

export type ZoneFilter = 'All' | SeatingTable['zone'];

export interface TimeSlotOption {
  value: string;
  label: string;
  mood: string;
  vibeNote: string;
}

export const RESERVATION_TIME_SLOTS: TimeSlotOption[] = [
  {
    value: '08:30',
    label: '08:30 AM',
    mood: 'Morning Light',
    vibeNote: 'Fresh viennoiserie & east-facing sun',
  },
  {
    value: '11:00',
    label: '11:00 AM',
    mood: 'Sourdough Brunch',
    vibeNote: 'Tartines, cold brew & courtyard breeze',
  },
  {
    value: '14:30',
    label: '02:30 PM',
    mood: 'Quiet Reading',
    vibeNote: 'Hushed shelves & V60 pour-overs',
  },
  {
    value: '17:30',
    label: '05:30 PM',
    mood: 'Golden Hour',
    vibeNote: 'Amber dusk & warm matcha service',
  },
  {
    value: '20:00',
    label: '08:00 PM',
    mood: 'Vinyl & Supper',
    vibeNote: 'Candlelight, 33⅓ RPM jazz & pizza',
  },
];

interface LocationOption {
  zone: ZoneFilter;
  shortLabel: string;
  subtitle: string;
  icon: React.ReactNode;
}

const LOCATION_OPTIONS: LocationOption[] = [
  {
    zone: 'All',
    shortLabel: 'All Corners',
    subtitle: '9 tables across the café',
    icon: <Sparkles className="w-3.5 h-3.5" />,
  },
  {
    zone: 'Sunlit Terrace',
    shortLabel: 'Courtyard',
    subtitle: 'Willow canopy & pergola',
    icon: <Trees className="w-3.5 h-3.5" />,
  },
  {
    zone: 'Quiet Reading Nook',
    shortLabel: 'Reading Nook',
    subtitle: 'Walnut shelves & lamps',
    icon: <BookOpen className="w-3.5 h-3.5" />,
  },
  {
    zone: 'Indoor Arch Hall',
    shortLabel: 'Arch Hall',
    subtitle: 'Vinyl stage & espresso bar',
    icon: <Utensils className="w-3.5 h-3.5" />,
  },
];

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function parseIsoLocal(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}

function toIsoDate(year: number, monthZeroBased: number, day: number): string {
  const mm = String(monthZeroBased + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

type SlotAvailabilityStatus = 'available' | 'limited' | 'booked';

interface ComputedSlotAvailability {
  status: SlotAvailabilityStatus;
  tablesOpen: number;
  totalTables: number;
}

function computeSlotAvailability(
  dateIso: string,
  zone: ZoneFilter,
  slotValue: string
): ComputedSlotAvailability {
  const matchingTables =
    zone === 'All' ? SEATING_TABLES : SEATING_TABLES.filter((t) => t.zone === zone);
  const totalTables = matchingTables.length;

  let openCount = 0;
  for (const table of matchingTables) {
    const seed = hashSeed(`${dateIso}::${table.id}::${slotValue}`);
    // ~74% open per table/slot so full-booked happens occasionally per specific zone
    if (seed % 11 !== 0 && seed % 13 !== 0) {
      openCount += 1;
    }
  }

  // Ensure evening courtyard & morning reading nook stay inviting
  if (openCount === 0 && totalTables > 2 && hashSeed(`${dateIso}:${slotValue}`) % 3 === 0) {
    openCount = 1;
  }

  if (openCount === 0) {
    return { status: 'booked', tablesOpen: 0, totalTables };
  }
  if (openCount === 1 || (totalTables > 3 && openCount <= 2)) {
    return { status: 'limited', tablesOpen: openCount, totalTables };
  }
  return { status: 'available', tablesOpen: openCount, totalTables };
}

interface ReservationCalendarProps {
  selectedDate: string;
  onSelectDate: (iso: string) => void;
  selectedTime: string;
  onSelectTime: (time: string) => void;
  selectedZone: ZoneFilter;
  onSelectZone: (zone: ZoneFilter) => void;
  selectedTable: SeatingTable;
  onSelectTableId: (id: string) => void;
  minDateIso: string;
}

export const ReservationCalendar: React.FC<ReservationCalendarProps> = ({
  selectedDate,
  onSelectDate,
  selectedTime,
  onSelectTime,
  selectedZone,
  onSelectZone,
  selectedTable,
  onSelectTableId,
  minDateIso,
}) => {
  const shouldReduceMotion = useReducedMotion();

  const initialDate = useMemo(() => parseIsoLocal(selectedDate || minDateIso), [selectedDate, minDateIso]);
  const minDateObj = useMemo(() => parseIsoLocal(minDateIso), [minDateIso]);

  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());
  const [monthDirection, setMonthDirection] = useState<1 | -1>(1);

  // Sync calendar month view when selectedDate is changed externally (e.g. date input)
  useEffect(() => {
    const parsed = parseIsoLocal(selectedDate);
    if (!Number.isNaN(parsed.getTime())) {
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
    }
  }, [selectedDate]);

  const canGoPrevMonth =
    viewYear > minDateObj.getFullYear() ||
    (viewYear === minDateObj.getFullYear() && viewMonth > minDateObj.getMonth());

  const canGoNextMonth =
    (viewYear - minDateObj.getFullYear()) * 12 + (viewMonth - minDateObj.getMonth()) < 5;

  const handleMonthStep = (delta: -1 | 1) => {
    if (delta === -1 && !canGoPrevMonth) return;
    if (delta === 1 && !canGoNextMonth) return;
    setMonthDirection(delta);
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const monthTitle = useMemo(() => {
    return new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }, [viewYear, viewMonth]);

  const calendarCells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    // Convert JS Sun=0..Sat=6 -> Mon=0..Sun=6
    const leadingBlanks = (firstDay.getDay() + 6) % 7;

    const cells: Array<{
      key: string;
      dayNumber: number | null;
      iso: string | null;
      isPast: boolean;
      isToday: boolean;
      isWeekend: boolean;
    }> = [];

    for (let i = 0; i < leadingBlanks; i += 1) {
      cells.push({
        key: `blank-${viewYear}-${viewMonth}-${i}`,
        dayNumber: null,
        iso: null,
        isPast: true,
        isToday: false,
        isWeekend: false,
      });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const iso = toIsoDate(viewYear, viewMonth, day);
      const dayOfWeek = new Date(viewYear, viewMonth, day).getDay();
      cells.push({
        key: iso,
        dayNumber: day,
        iso,
        isPast: iso < minDateIso,
        isToday: iso === minDateIso,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6,
      });
    }

    return cells;
  }, [viewYear, viewMonth, minDateIso]);

  const selectedDayInfo = useMemo(() => {
    const d = parseIsoLocal(selectedDate);
    const schedule = WEEKLY_HOURS.find((w) => w.dayIndex === d.getDay());
    const formatted = d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    return { formatted, schedule };
  }, [selectedDate]);

  const zoneTables = useMemo(() => {
    if (selectedZone === 'All') return SEATING_TABLES;
    return SEATING_TABLES.filter((t) => t.zone === selectedZone);
  }, [selectedZone]);

  const activeLocationMeta = useMemo(
    () => LOCATION_OPTIONS.find((loc) => loc.zone === selectedZone) || LOCATION_OPTIONS[0],
    [selectedZone]
  );

  const handleSelectZone = (zone: ZoneFilter) => {
    onSelectZone(zone);
    if (zone !== 'All' && selectedTable.zone !== zone) {
      const firstInZone = SEATING_TABLES.find((t) => t.zone === zone);
      if (firstInZone) {
        onSelectTableId(firstInZone.id);
      }
    }
    const currentAvail = computeSlotAvailability(selectedDate, zone, selectedTime);
    if (currentAvail.status === 'booked') {
      const firstOpen = RESERVATION_TIME_SLOTS.find(
        (slot) => computeSlotAvailability(selectedDate, zone, slot.value).status !== 'booked'
      );
      if (firstOpen) {
        onSelectTime(firstOpen.value);
      }
    }
  };

  const handleSelectDate = (iso: string) => {
    onSelectDate(iso);
    const currentAvail = computeSlotAvailability(iso, selectedZone, selectedTime);
    if (currentAvail.status === 'booked') {
      const firstOpen = RESERVATION_TIME_SLOTS.find(
        (slot) => computeSlotAvailability(iso, selectedZone, slot.value).status !== 'booked'
      );
      if (firstOpen) {
        onSelectTime(firstOpen.value);
      }
    }
  };

  return (
    <section
      aria-label="Interactive Reservation Date, Table Location and Time Slot Calendar"
      className="p-5 sm:p-6.5 rounded-2xl willow-card border space-y-6"
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b border-[var(--willow-border)]">
        <div className="space-y-1">
          <p className="text-xs font-mono text-[var(--willow-amber-text)] tracking-wide uppercase">
            Live Table Availability Calendar
          </p>
          <h2 className="font-serif text-xl sm:text-2xl text-[var(--willow-text)]">
            Choose a Date, Corner &amp; Time Slot
          </h2>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg willow-subtle border text-xs tabular-nums self-start sm:self-auto">
          <CalendarDays className="w-3.5 h-3.5 text-[#C9893B] shrink-0" />
          <span className="font-medium text-[var(--willow-text)]">
            {selectedDayInfo.formatted} · {selectedTime}
          </span>
          <span className="text-[var(--willow-text-muted)]">·</span>
          <span className="text-[var(--willow-amber-text)] font-medium">
            {selectedZone === 'All' ? selectedTable.label : activeLocationMeta.shortLabel}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: Animated Monthly Calendar Grid */}
        <div className="lg:col-span-5 p-4 sm:p-5 rounded-xl willow-subtle border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg text-[var(--willow-text)]">{monthTitle}</h3>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleMonthStep(-1)}
                disabled={!canGoPrevMonth}
                aria-label="Previous month"
                className="w-8 h-8 rounded-lg border border-[var(--willow-border-strong)] flex items-center justify-center text-[var(--willow-text)] hover:border-[var(--willow-amber)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleMonthStep(1)}
                disabled={!canGoNextMonth}
                aria-label="Next month"
                className="w-8 h-8 rounded-lg border border-[var(--willow-border-strong)] flex items-center justify-center text-[var(--willow-text)] hover:border-[var(--willow-amber)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAY_LABELS.map((wd) => (
              <span
                key={wd}
                className="text-[11px] font-mono text-[var(--willow-text-muted)] py-1"
              >
                {wd}
              </span>
            ))}
          </div>

          {/* Animated Month Matrix */}
          <div className="overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${viewYear}-${viewMonth}`}
                initial={
                  shouldReduceMotion
                    ? { opacity: 1 }
                    : { opacity: 0, x: monthDirection * 18 }
                }
                animate={{ opacity: 1, x: 0 }}
                exit={
                  shouldReduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, x: monthDirection * -18 }
                }
                transition={{ duration: shouldReduceMotion ? 0 : 0.22, ease: 'easeOut' }}
                className="grid grid-cols-7 gap-1"
              >
                {calendarCells.map((cell) => {
                  if (!cell.iso || cell.dayNumber === null) {
                    return <div key={cell.key} className="h-9 sm:h-10" />;
                  }

                  const isSelected = cell.iso === selectedDate;

                  return (
                    <motion.button
                      key={cell.key}
                      type="button"
                      disabled={cell.isPast}
                      onClick={() => cell.iso && handleSelectDate(cell.iso)}
                      whileHover={cell.isPast || shouldReduceMotion ? undefined : { scale: 1.06 }}
                      whileTap={cell.isPast || shouldReduceMotion ? undefined : { scale: 0.94 }}
                      aria-pressed={isSelected}
                      aria-label={`${cell.iso}${cell.isToday ? ' (Today)' : ''}`}
                      className={`relative h-9 sm:h-10 rounded-lg text-xs font-medium tabular-nums flex flex-col items-center justify-center transition-colors ${
                        cell.isPast
                          ? 'text-[var(--willow-text-muted)] opacity-35 cursor-not-allowed'
                          : isSelected
                          ? 'text-[#14100C] font-semibold cursor-pointer'
                          : 'text-[var(--willow-text)] hover:bg-[var(--willow-border)]/45 cursor-pointer'
                      }`}
                    >
                      {isSelected && (
                        <motion.span
                          layoutId="willow-calendar-selected-day"
                          transition={
                            shouldReduceMotion
                              ? { duration: 0 }
                              : { type: 'spring', stiffness: 420, damping: 32 }
                          }
                          className="absolute inset-0 rounded-lg bg-[#C9893B] shadow-sm"
                        />
                      )}
                      <span className="relative z-10 leading-none">{cell.dayNumber}</span>
                      {!cell.isPast && (cell.isToday || cell.isWeekend) && (
                        <span
                          className={`relative z-10 w-1 h-1 rounded-full mt-0.5 ${
                            isSelected
                              ? 'bg-[#14100C]/75'
                              : cell.isToday
                              ? 'bg-[#C9893B]'
                              : 'bg-[#6E7F63]'
                          }`}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Calendar Footer Note */}
          <div className="pt-3 border-t border-[var(--willow-border)] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--willow-text-secondary)]">
            <span>
              {selectedDayInfo.schedule
                ? `${selectedDayInfo.schedule.dayName}: ${selectedDayInfo.schedule.note}`
                : 'Open daily 08:00 AM – 11:00 PM'}
            </span>
            <span className="inline-flex items-center gap-2.5 text-[10px] font-mono text-[var(--willow-text-muted)]">
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C9893B]" /> Today
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6E7F63]" /> Vinyl / Brunch
              </span>
            </span>
          </div>
        </div>

        {/* RIGHT: Table Location Selector + Framer Motion Selectable Time Slots */}
        <div className="lg:col-span-7 space-y-5">
          {/* Location Filter Cards */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--willow-text)]">
                1. Filter by Table Location
              </span>
              <span className="text-[11px] font-mono text-[var(--willow-text-muted)]">
                Synced with floorplan below
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {LOCATION_OPTIONS.map((loc) => {
                const isActive = selectedZone === loc.zone;
                return (
                  <button
                    key={loc.zone}
                    type="button"
                    onClick={() => handleSelectZone(loc.zone)}
                    aria-pressed={isActive}
                    className={`relative p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                      isActive
                        ? 'border-[#C9893B] text-[var(--willow-text)]'
                        : 'border-[var(--willow-border-strong)] willow-subtle text-[var(--willow-text-secondary)] hover:border-[var(--willow-amber)]/60'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="willow-location-select-bg"
                        transition={
                          shouldReduceMotion
                            ? { duration: 0 }
                            : { type: 'spring', stiffness: 380, damping: 30 }
                        }
                        className="absolute inset-0 rounded-xl bg-[#C9893B]/14 border border-[#C9893B]/70 pointer-events-none"
                      />
                    )}
                    <div className="relative z-10 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        <span className={isActive ? 'text-[#C9893B]' : 'text-[var(--willow-text-muted)]'}>
                          {loc.icon}
                        </span>
                        <span className="truncate">{loc.shortLabel}</span>
                      </div>
                      <p className="text-[10px] text-[var(--willow-text-muted)] truncate">
                        {loc.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Specific Table Switcher inside Active Location */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[var(--willow-text)]">
                2. Specific Corner Seat ({activeLocationMeta.shortLabel})
              </span>
              <span className="text-[11px] text-[var(--willow-amber-text)] font-mono tabular-nums">
                Active: {selectedTable.id} · {selectedTable.seats} seats
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {zoneTables.map((t) => {
                const isTableSelected = t.id === selectedTable.id;
                return (
                  <motion.button
                    key={t.id}
                    type="button"
                    onClick={() => onSelectTableId(t.id)}
                    whileHover={shouldReduceMotion ? undefined : { y: -1 }}
                    whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                    aria-pressed={isTableSelected}
                    className={`relative px-2.5 py-1.5 rounded-lg border text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                      isTableSelected
                        ? 'border-[#C9893B] bg-[#C9893B] text-[#14100C] font-semibold'
                        : 'border-[var(--willow-border-strong)] willow-subtle text-[var(--willow-text-secondary)] hover:text-[var(--willow-text)]'
                    }`}
                  >
                    <span className="font-mono tabular-nums">{t.id}</span>
                    <span>{t.label}</span>
                    <span className="text-[10px] opacity-75 tabular-nums">({t.seats}p)</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Available Time Slots with Framer Motion 'Select' State */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--willow-text)] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#C9893B]" />
                <span>3. Select Available Time Slot</span>
              </span>
              <span className="text-[11px] text-[var(--willow-text-muted)]">
                Showing {activeLocationMeta.shortLabel} on {selectedDayInfo.formatted}
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={`${selectedDate}-${selectedZone}`}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5"
              >
                {RESERVATION_TIME_SLOTS.map((slot, index) => {
                  const availability = computeSlotAvailability(
                    selectedDate,
                    selectedZone,
                    slot.value
                  );
                  const isBooked = availability.status === 'booked';
                  const isSelected = selectedTime === slot.value;

                  return (
                    <motion.button
                      key={slot.value}
                      type="button"
                      disabled={isBooked}
                      onClick={() => {
                        if (!isBooked) onSelectTime(slot.value);
                      }}
                      initial={
                        shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }
                      }
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: shouldReduceMotion ? 0 : 0.22,
                        delay: shouldReduceMotion ? 0 : index * 0.035,
                      }}
                      whileHover={
                        isBooked || shouldReduceMotion
                          ? undefined
                          : { y: -2, transition: { duration: 0.16 } }
                      }
                      whileTap={
                        isBooked || shouldReduceMotion ? undefined : { scale: 0.98 }
                      }
                      data-state={isSelected ? 'selected' : availability.status}
                      aria-pressed={isSelected}
                      className={`relative p-3 rounded-xl border text-left transition-colors ${
                        isBooked
                          ? 'border-[var(--willow-border)] willow-subtle opacity-45 cursor-not-allowed'
                          : isSelected
                          ? 'border-[#C9893B] bg-[#C9893B]/15 cursor-pointer shadow-sm'
                          : 'border-[var(--willow-border-strong)] willow-subtle hover:border-[#C9893B]/70 cursor-pointer'
                      }`}
                    >
                      {isSelected && (
                        <motion.span
                          layoutId="willow-slot-selected-ring"
                          transition={
                            shouldReduceMotion
                              ? { duration: 0 }
                              : { type: 'spring', stiffness: 420, damping: 32 }
                          }
                          className="absolute inset-0 rounded-xl ring-2 ring-[#C9893B] pointer-events-none"
                        />
                      )}

                      <div className="relative z-10 flex items-start justify-between gap-2">
                        <div>
                          <p
                            className={`text-sm font-mono font-semibold tabular-nums ${
                              isBooked
                                ? 'line-through text-[var(--willow-text-muted)]'
                                : 'text-[var(--willow-text)]'
                            }`}
                          >
                            {slot.label}
                          </p>
                          <p className="text-xs font-medium text-[var(--willow-amber-text)] mt-0.5">
                            {slot.mood}
                          </p>
                        </div>

                        <AnimatePresence mode="wait" initial={false}>
                          {isSelected ? (
                            <motion.span
                              key="selected-badge"
                              initial={
                                shouldReduceMotion
                                  ? { opacity: 1 }
                                  : { opacity: 0, scale: 0.75 }
                              }
                              animate={{ opacity: 1, scale: 1 }}
                              exit={
                                shouldReduceMotion
                                  ? { opacity: 0 }
                                  : { opacity: 0, scale: 0.75 }
                              }
                              transition={{
                                type: 'spring',
                                stiffness: 460,
                                damping: 24,
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#C9893B] text-[#14100C] text-[10px] font-semibold shrink-0"
                            >
                              <Check className="w-3 h-3" strokeWidth={2.5} />
                              <span>Selected</span>
                            </motion.span>
                          ) : (
                            <motion.span
                              key="status-badge"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className={`text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded border shrink-0 ${
                                availability.status === 'booked'
                                  ? 'border-[var(--willow-border)] text-[var(--willow-text-muted)]'
                                  : availability.status === 'limited'
                                  ? 'border-[#C9893B]/50 text-[var(--willow-amber-text)]'
                                  : 'border-[#6E7F63]/45 text-[var(--willow-sage)]'
                              }`}
                            >
                              {availability.status === 'booked'
                                ? 'Full'
                                : availability.status === 'limited'
                                ? `${availability.tablesOpen} left`
                                : `${availability.tablesOpen} open`}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>

                      <p className="relative z-10 text-[11px] text-[var(--willow-text-secondary)] mt-1.5 leading-snug">
                        {slot.vibeNote}
                      </p>
                    </motion.button>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};
