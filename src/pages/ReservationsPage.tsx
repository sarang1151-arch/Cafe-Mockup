import React, { useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, MessageCircle, Mail, Users } from 'lucide-react';
import { BRAND_CONFIG, SEATING_TABLES, SeatingTable } from '../data/cafeConfig';
import { ScrollRevealHeading } from '../components/ScrollRevealHeading';
import {
  RESERVATION_TIME_SLOTS,
  ReservationCalendar,
  ZoneFilter,
} from '../components/ReservationCalendar';

interface BookingConfirmation {
  refCode: string;
  table: SeatingTable;
  date: string;
  time: string;
  guests: number;
  name: string;
  email: string;
  phone: string;
  occasion: string;
  notes: string;
}

function getLocalTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const ReservationsPage: React.FC = () => {
  const [zoneFilter, setZoneFilter] = useState<ZoneFilter>('All');
  const [selectedTableId, setSelectedTableId] = useState<string>('G1');

  const todayIso = useMemo(() => getLocalTodayIso(), []);
  const [date, setDate] = useState(todayIso);
  const [time, setTime] = useState('17:30');
  const [guests, setGuests] = useState(2);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [occasion, setOccasion] = useState('Slow Coffee & Reading');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);

  const selectedTable =
    SEATING_TABLES.find((t) => t.id === selectedTableId) || SEATING_TABLES[0];

  const handleSelectTable = (tableId: string) => {
    setSelectedTableId(tableId);
    const table = SEATING_TABLES.find((t) => t.id === tableId);
    if (table) {
      if (guests > table.seats) setGuests(table.seats);
      if (zoneFilter !== 'All' && table.zone !== zoneFilter) {
        setZoneFilter(table.zone);
      }
    }
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (name.trim().length < 2) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Please enter a valid email address for your confirmation pass.');
      return;
    }
    if (phone.replace(/\D/g, '').length < 8) {
      setErrorMsg('Please enter a valid phone or WhatsApp number.');
      return;
    }

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReduced) {
      confetti({
        particleCount: 65,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#C9893B', '#F4EDE0', '#6E7F63', '#4A3323'],
      });
    }

    setConfirmation({
      refCode: `WLW-${Math.floor(100000 + Math.random() * 900000)}`,
      table: selectedTable,
      date,
      time,
      guests,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      occasion,
      notes: notes.trim(),
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-14">
      {/* Header */}
      <div className="max-w-3xl space-y-2">
        <p className="font-hand text-xl text-[var(--willow-amber-text)]">Pick Your Exact Corner</p>
        <ScrollRevealHeading
          as="h1"
          className="font-serif text-3xl sm:text-5xl font-normal text-[var(--willow-text)]"
        >
          Courtyard & Nook Reservations
        </ScrollRevealHeading>
        <p className="text-xs sm:text-sm text-[var(--willow-text-secondary)] leading-relaxed max-w-xl">
          Tap any table on our architectural floorplan—whether beneath the sunlit willow canopy, beside the vinyl turntable, or tucked into our hushed walnut book nook.
        </p>
      </div>

      {/* INTERACTIVE AVAILABILITY CALENDAR & LOCATION TIME-SLOT SELECTOR */}
      <ReservationCalendar
        selectedDate={date}
        onSelectDate={setDate}
        selectedTime={time}
        onSelectTime={setTime}
        selectedZone={zoneFilter}
        onSelectZone={setZoneFilter}
        selectedTable={selectedTable}
        onSelectTableId={handleSelectTable}
        minDateIso={todayIso}
      />

      {/* SIGNATURE INTERACTION: INTERACTIVE ARCHITECTURAL SEATING MAP + FORM */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left: Interactive SVG Floorplan */}
        <div className="lg:col-span-7 p-5 sm:p-6.5 rounded-2xl willow-card border space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif text-xl sm:text-2xl text-[var(--willow-text)]">Interactive Floorplan</h2>

            {/* Zone Filter Tabs */}
            <div className="inline-flex items-center p-1 rounded-lg willow-subtle border gap-1 overflow-x-auto max-w-full">
              {(['All', 'Indoor Arch Hall', 'Sunlit Terrace', 'Quiet Reading Nook'] as const).map(
                (z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => setZoneFilter(z)}
                    className={`px-2.5 py-1 rounded-md text-xs transition-colors whitespace-nowrap cursor-pointer ${
                      zoneFilter === z
                        ? 'bg-[var(--willow-btn-primary-bg)] text-[var(--willow-btn-primary-fg)] font-semibold'
                        : 'text-[var(--willow-text-secondary)]'
                    }`}
                  >
                    {z === 'All' ? 'All Zones' : z.replace('Indoor ', '').replace('Quiet ', '')}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Architectural SVG Floorplan */}
          <div className="relative w-full aspect-[16/11] rounded-xl willow-subtle border overflow-hidden p-3">
            <svg viewBox="0 0 100 100" className="w-full h-full select-none">
              <rect
                x="4"
                y="6"
                width="52"
                height="64"
                rx="3"
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.22"
                strokeWidth="0.4"
              />
              <text x="7" y="12" fontSize="3.1" fill="currentColor" opacity="0.72">
                Indoor Brick Arch Hall
              </text>

              <rect
                x="4"
                y="72"
                width="52"
                height="24"
                rx="3"
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.22"
                strokeWidth="0.4"
              />
              <text x="7" y="77.5" fontSize="3.1" fill="currentColor" opacity="0.72">
                Walnut Reading Nook
              </text>

              <rect
                x="59"
                y="6"
                width="37"
                height="90"
                rx="3"
                fill="rgba(110, 127, 99, 0.12)"
                stroke="#6E7F63"
                strokeOpacity="0.45"
                strokeDasharray="1.5 1.5"
                strokeWidth="0.45"
              />
              <text x="62" y="12" fontSize="3.1" fill="var(--willow-sage)">
                Sunlit Ivy Pergola Terrace
              </text>

              <text x="36" y="19" fontSize="2.6" fill="var(--willow-amber-text)">
                Turntable Stage
              </text>
              <text x="36" y="49" fontSize="2.6" fill="var(--willow-amber-text)">
                Espresso & Pastry Bar
              </text>
              <circle cx="88" cy="18" r="5.5" fill="rgba(110, 127, 99, 0.25)" />
              <text x="82" y="26.5" fontSize="2.4" fill="var(--willow-sage)">
                Willow Tree
              </text>

              {SEATING_TABLES.map((t) => {
                const isSelected = t.id === selectedTable.id;
                const dimmed = zoneFilter !== 'All' && t.zone !== zoneFilter;

                return (
                  <g
                    key={t.id}
                    onClick={() => handleSelectTable(t.id)}
                    className="cursor-pointer transition-opacity"
                    style={{ opacity: dimmed ? 0.28 : 1 }}
                  >
                    {t.shape === 'round' ? (
                      <circle
                        cx={t.x}
                        cy={t.y}
                        r={isSelected ? 6.6 : 5.8}
                        fill={isSelected ? '#C9893B' : '#2A1D14'}
                        stroke={isSelected ? '#FAF6F0' : '#C9893B'}
                        strokeWidth={isSelected ? '0.9' : '0.45'}
                      />
                    ) : (
                      <rect
                        x={t.x - 7.5}
                        y={t.y - 4.8}
                        width="15"
                        height="9.6"
                        rx={t.shape === 'booth' ? 3.2 : 1.6}
                        fill={isSelected ? '#C9893B' : '#2A1D14'}
                        stroke={isSelected ? '#FAF6F0' : '#C9893B'}
                        strokeWidth={isSelected ? '0.9' : '0.45'}
                      />
                    )}
                    <text
                      x={t.x}
                      y={t.y - 0.3}
                      textAnchor="middle"
                      fontSize="2.9"
                      fontWeight="bold"
                      fill={isSelected ? '#14100C' : '#F4EDE0'}
                    >
                      {t.id}
                    </text>
                    <text
                      x={t.x}
                      y={t.y + 3.0}
                      textAnchor="middle"
                      fontSize="2.2"
                      fill={isSelected ? '#14100C' : '#E8DEC8'}
                    >
                      {t.seats}p
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Selected Table Architectural Callout */}
          <div className="p-3.5 rounded-xl willow-subtle border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs text-[var(--willow-amber-text)] font-mono tabular-nums">
                Selected Table {selectedTable.id} · Up to {selectedTable.seats} guests
              </p>
              <h3 className="font-serif text-xl text-[var(--willow-text)]">
                {selectedTable.label} ({selectedTable.zone})
              </h3>
              <p className="text-xs text-[var(--willow-text-secondary)] mt-0.5">
                {selectedTable.feature}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[var(--willow-text-secondary)] shrink-0 tabular-nums">
              <Users className="w-4 h-4 text-[#C9893B]" />
              <span>Max {selectedTable.seats} seats</span>
            </div>
          </div>
        </div>

        {/* Right: Validated Reservation Form */}
        <div className="lg:col-span-5 p-5 sm:p-6.5 rounded-2xl willow-card border">
          {confirmation ? (
            <div className="space-y-5 py-3 text-center">
              <CheckCircle2 className="w-10 h-10 mx-auto text-[#6E7F63]" strokeWidth={1.5} />
              <div>
                <p className="text-xs font-mono text-[var(--willow-amber-text)] tabular-nums">
                  Booking Pass · #{confirmation.refCode}
                </p>
                <h2 className="font-serif text-2xl mt-1 text-[var(--willow-text)]">
                  Your Table Is Saved
                </h2>
                <p className="text-xs text-[var(--willow-text-secondary)] mt-1">
                  We’ll have fresh water and today’s chalkboard specials waiting.
                </p>
              </div>

              <div className="p-4 rounded-xl willow-subtle border text-left text-xs space-y-2 tabular-nums">
                <p>
                  <strong>Guest:</strong> {confirmation.name} ({confirmation.guests} guests)
                </p>
                <p>
                  <strong>Table:</strong> {confirmation.table.id} — {confirmation.table.label} ({confirmation.table.zone})
                </p>
                <p>
                  <strong>Date & Time:</strong> {confirmation.date} at {confirmation.time}
                </p>
                <p>
                  <strong>Occasion:</strong> {confirmation.occasion}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <a
                  href={`https://wa.me/${BRAND_CONFIG.whatsappNumber}?text=${encodeURIComponent(
                    `Hello The Willow Café! Confirming reservation ${confirmation.refCode} for ${confirmation.name} (${confirmation.guests} guests) on ${confirmation.date} at ${confirmation.time}, Table ${confirmation.table.id} (${confirmation.table.label}).`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-4 rounded-lg bg-[#1F2E26] text-[#F4EDE0] text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#9EB091]" />
                  <span>Send via WhatsApp</span>
                </a>

                <a
                  href={`mailto:${BRAND_CONFIG.email}?subject=${encodeURIComponent(
                    `Table Reservation ${confirmation.refCode} — The Willow Café`
                  )}&body=${encodeURIComponent(
                    `Reservation Reference: ${confirmation.refCode}\nName: ${confirmation.name}\nTable: ${confirmation.table.id} (${confirmation.table.label})\nDate: ${confirmation.date} at ${confirmation.time}\nGuests: ${confirmation.guests}`
                  )}`}
                  className="py-2.5 px-4 rounded-lg border border-[var(--willow-border-strong)] text-xs font-medium flex items-center justify-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-[#C9893B]" />
                  <span>Email Ticket</span>
                </a>
              </div>

              <button
                type="button"
                onClick={() => setConfirmation(null)}
                className="text-xs text-[var(--willow-amber-text)] hover:underline cursor-pointer"
              >
                Book another table
              </button>
            </div>
          ) : (
            <form onSubmit={handleConfirm} noValidate className="space-y-4">
              <h2 className="font-serif text-2xl pb-2 border-b border-[var(--willow-border)] text-[var(--willow-text)]">
                Complete Your Booking
              </h2>

              {errorMsg && (
                <p
                  role="alert"
                  className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs"
                >
                  {errorMsg}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs">
                <label className="space-y-1 block">
                  <span className="font-medium text-[var(--willow-text)]">Date</span>
                  <input
                    type="date"
                    min={todayIso}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-lg bg-[var(--willow-input)] text-[var(--willow-text)] border border-[var(--willow-border-strong)] focus:outline-none focus:border-[var(--willow-amber)] tabular-nums"
                  />
                </label>

                <label className="space-y-1 block">
                  <span className="font-medium text-[var(--willow-text)]">Time</span>
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-[var(--willow-input)] text-[var(--willow-text)] border border-[var(--willow-border-strong)] focus:outline-none focus:border-[var(--willow-amber)] tabular-nums"
                  >
                    {RESERVATION_TIME_SLOTS.map((slot) => (
                      <option key={slot.value} value={slot.value}>
                        {slot.label} ({slot.mood})
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <label className="space-y-1 block">
                  <span className="font-medium text-[var(--willow-text)]">Guests</span>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-lg bg-[var(--willow-input)] text-[var(--willow-text)] border border-[var(--willow-border-strong)] focus:outline-none focus:border-[var(--willow-amber)] tabular-nums"
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? 'Guest' : 'Guests'}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 block">
                  <span className="font-medium text-[var(--willow-text)]">Occasion</span>
                  <select
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-[var(--willow-input)] text-[var(--willow-text)] border border-[var(--willow-border-strong)] focus:outline-none focus:border-[var(--willow-amber)]"
                  >
                    <option>Slow Coffee & Reading</option>
                    <option>Brunch / Supper Date</option>
                    <option>Work & Sketchbook Session</option>
                    <option>Birthday / Celebration</option>
                    <option>Book Club Gathering</option>
                  </select>
                </label>
              </div>

              <label className="space-y-1 block text-xs">
                <span className="font-medium text-[var(--willow-text)]">Full Name</span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Arundhati Roy"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--willow-input)] text-[var(--willow-text)] border border-[var(--willow-border-strong)] focus:outline-none focus:border-[var(--willow-amber)]"
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label className="space-y-1 block">
                  <span className="font-medium text-[var(--willow-text)]">Email</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="reader@domain.com"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--willow-input)] text-[var(--willow-text)] border border-[var(--willow-border-strong)] focus:outline-none focus:border-[var(--willow-amber)]"
                  />
                </label>

                <label className="space-y-1 block">
                  <span className="font-medium text-[var(--willow-text)]">Phone / WhatsApp</span>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--willow-input)] text-[var(--willow-text)] border border-[var(--willow-border-strong)] focus:outline-none focus:border-[var(--willow-amber)] tabular-nums"
                  />
                </label>
              </div>

              <label className="space-y-1 block text-xs">
                <span className="font-medium text-[var(--willow-text)]">Special Notes (optional)</span>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Oat milk preference, birthday candle on Basque cheesecake, or wheelchair access..."
                  className="w-full px-3.5 py-2 rounded-lg bg-[var(--willow-input)] text-[var(--willow-text)] border border-[var(--willow-border-strong)] focus:outline-none focus:border-[var(--willow-amber)]"
                />
              </label>

              <button
                type="submit"
                className="w-full py-3.5 px-5 rounded-lg bg-[#C9893B] hover:bg-[#DDA052] text-[#14100C] font-semibold text-sm transition-colors cursor-pointer"
              >
                Reserve Table {selectedTable.id} ({selectedTable.label})
              </button>
            </form>
          )}
        </div>
      </section>

      {/* PRIVATE EVENTS, BIRTHDAYS & BOOK CLUBS */}
      <section className="p-8 sm:p-10 rounded-2xl willow-subtle border space-y-8">
        <div className="max-w-2xl space-y-1.5">
          <p className="text-xs font-medium text-[var(--willow-amber-text)]">
            Intimate Gatherings · 8 to 28 Guests
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl text-[var(--willow-text)]">
            Private Celebrations, Birthdays & Book Clubs
          </h2>
          <p className="text-xs sm:text-sm text-[var(--willow-text-secondary)]">
            Reserve our Ivy Pergola Long Table or the entire Vinyl Room after 7 PM with custom sourdough sharing menus, bespoke Basque cakes, and your own vinyl stack.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              title: 'Candlelit Birthday Suppers',
              guests: '8 – 18 guests',
              detail:
                'Long walnut table beneath fairy-lit willow branches, wood-fired Neapolitan pies, truffle tagliatelle platters, and a whole wild blueberry Basque cake.',
              tablePreset: 'G2',
              occasionPreset: 'Birthday / Celebration',
            },
            {
              title: 'Neighbourhood Book Circles',
              guests: '6 – 14 readers',
              detail:
                'Dedicated quiet corner with V60 single-origin carafes, warm cardamom knots, and 15% off our partner indie bookshop selections.',
              tablePreset: 'N2',
              occasionPreset: 'Book Club Gathering',
            },
            {
              title: 'Vinyl Listening & Creative Offsites',
              guests: '10 – 28 guests',
              detail:
                'Morning espresso flights, avocado sourdough tartines, projector-free walnut tables, and curated analog jazz breaks.',
              tablePreset: 'T3',
              occasionPreset: 'Work & Sketchbook Session',
            },
          ].map((pkg) => (
            <div
              key={pkg.title}
              className="p-5 rounded-xl willow-card border flex flex-col justify-between space-y-3.5"
            >
              <div className="space-y-1.5">
                <p className="text-xs font-mono text-[var(--willow-amber-text)] tabular-nums">
                  {pkg.guests}
                </p>
                <h3 className="font-serif text-xl text-[var(--willow-text)]">{pkg.title}</h3>
                <p className="text-xs text-[var(--willow-text-secondary)] leading-relaxed">
                  {pkg.detail}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const target = SEATING_TABLES.find((t) => t.id === pkg.tablePreset);
                  if (target) setZoneFilter(target.zone);
                  setSelectedTableId(pkg.tablePreset);
                  setOccasion(pkg.occasionPreset);
                  setGuests(6);
                  window.scrollTo({ top: 180, behavior: 'smooth' });
                }}
                className="self-start text-xs font-semibold text-[var(--willow-text)] hover:text-[var(--willow-amber)] underline underline-offset-4 cursor-pointer"
              >
                Select for Inquiry
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
