import React, { useState } from 'react';
import { CheckCircle2, ExternalLink, Mail, MessageCircle, Navigation, Phone } from 'lucide-react';
import { BRAND_CONFIG, WEEKLY_HOURS } from '../data/cafeConfig';
import { useCafe } from '../context/CafeContext';
import { ScrollRevealHeading } from '../components/ScrollRevealHeading';

export const ContactPage: React.FC = () => {
  const { openStatus } = useCafe();
  const todayJsDay = new Date().getDay();

  const [selectedLandmark, setSelectedLandmark] = useState<'willow' | 'metro' | 'park'>('willow');
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [topic, setTopic] = useState('General Inquiry & Table Note');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    BRAND_CONFIG.address
  )}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim() || !senderEmail.trim() || !message.trim()) return;
    setSubmitted(true);
    setSenderName('');
    setSenderEmail('');
    setMessage('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-14">
      {/* Header */}
      <div className="max-w-3xl space-y-2">
        <p className="font-hand text-xl text-[var(--willow-amber-text)]">Find the Brick Arches</p>
        <ScrollRevealHeading
          as="h1"
          className="font-serif text-3xl sm:text-5xl font-normal text-[var(--willow-text)]"
        >
          Visit & Sanctuary Hours
        </ScrollRevealHeading>
        <p className="text-xs sm:text-sm text-[var(--willow-text-secondary)] leading-relaxed max-w-xl">
          Step through the wrought-iron gate at 88 Willow Green Arcade. Bicycle racks, stroller-friendly courtyard ramps, and shaded dog water bowls await by the olive trees.
        </p>
      </div>

      {/* 1. CUSTOM-STYLED COURTYARD MAP + LIVE HOURS TABLE */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
        <div className="lg:col-span-7 p-5 sm:p-6.5 rounded-2xl bg-[#1B1511] text-[#F4EDE0] border border-[#F4EDE0]/12 flex flex-col justify-between space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-[#C9893B]">100 Feet Road · Inner Brick Arcade</p>
              <h2 className="font-serif text-xl">{BRAND_CONFIG.shortAddress}</h2>
            </div>

            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-lg bg-[#C9893B] hover:bg-[#DDA052] text-[#14100C] text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Get Directions</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden bg-[#231B15] border border-[#F4EDE0]/12">
            <svg viewBox="0 0 100 62" className="w-full h-full select-none">
              <rect x="6" y="6" width="28" height="24" rx="2" fill="rgba(110, 127, 99, 0.22)" />
              <text x="10" y="19" fontSize="2.5" fill="#9EB091">
                Defence Colony Park
              </text>

              <path
                d="M 0 36 L 100 36 M 42 0 L 42 62 M 74 0 L 74 62"
                stroke="#3A2D23"
                strokeWidth="5"
              />
              <path
                d="M 0 36 L 100 36 M 42 0 L 42 62 M 74 0 L 74 62"
                stroke="#C9893B"
                strokeOpacity="0.22"
                strokeDasharray="1.5 1.5"
                strokeWidth="0.35"
              />
              <text x="45" y="34.5" fontSize="2.2" fill="#E8DEC8" opacity="0.65">
                12th Main Leafy Avenue
              </text>

              <g onClick={() => setSelectedLandmark('metro')} className="cursor-pointer">
                <circle cx="84" cy="48" r="2.6" fill="#9EB091" />
                <text x="84" y="54" textAnchor="middle" fontSize="2.3" fill="#E8DEC8">
                  Indiranagar Metro (6 min walk)
                </text>
              </g>

              <g onClick={() => setSelectedLandmark('park')} className="cursor-pointer">
                <circle cx="20" cy="14" r="2.4" fill="#9EB091" />
              </g>

              <g onClick={() => setSelectedLandmark('willow')} className="cursor-pointer">
                <rect
                  x="48"
                  y="12"
                  width="20"
                  height="17"
                  rx="2.5"
                  fill="rgba(201, 137, 59, 0.16)"
                  stroke="#C9893B"
                  strokeWidth="0.6"
                />
                <circle cx="58" cy="20" r="4.2" fill="#C9893B" />
                <text
                  x="58"
                  y="21.2"
                  textAnchor="middle"
                  fontSize="3.4"
                  fontWeight="bold"
                  fill="#14100C"
                >
                  W
                </text>
                <text
                  x="58"
                  y="10"
                  textAnchor="middle"
                  fontSize="2.8"
                  fontWeight="bold"
                  fill="#F4EDE0"
                >
                  The Willow Café
                </text>
              </g>
            </svg>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#F4EDE0]/80">
            <span>
              {selectedLandmark === 'willow' &&
                '88 Willow Green Arcade — Enter via the ivy brick archway beside the indie florist.'}
              {selectedLandmark === 'metro' &&
                'Indiranagar Metro Station — 450m pleasant tree-lined walk along 12th Main.'}
              {selectedLandmark === 'park' &&
                'Defence Colony Park — Grab a takeaway honey cortado & cardamom knot for a park bench read.'}
            </span>
            <span className="font-mono text-[#C9893B] tabular-nums">
              12.9784° N, 77.6408° E
            </span>
          </div>
        </div>

        {/* Live Status & Weekly Hours Table */}
        <div className="lg:col-span-5 p-6 sm:p-8 rounded-2xl willow-card border flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-baseline justify-between gap-2 pb-3 border-b border-[var(--willow-border)]">
              <h2 className="font-serif text-2xl text-[var(--willow-text)]">Opening Hours</h2>
              <span className="text-xs font-semibold text-[var(--willow-amber-text)]">
                {openStatus.statusLabel}
              </span>
            </div>

            <table className="w-full text-xs tabular-nums">
              <tbody className="divide-y divide-[var(--willow-border)]">
                {WEEKLY_HOURS.map((row) => {
                  const isToday = row.dayIndex === todayJsDay;
                  return (
                    <tr
                      key={row.dayName}
                      className={
                        isToday
                          ? 'bg-[#C9893B]/18 text-[var(--willow-text)] font-semibold'
                          : 'text-[var(--willow-text-secondary)]'
                      }
                    >
                      <td className="py-2.5 px-2 rounded-l-md">
                        {row.dayName} {isToday && '(Today)'}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono rounded-r-md">
                        {row.displayHours}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pt-4 border-t border-[var(--willow-border)] space-y-2.5 text-xs">
            <a
              href={`tel:${BRAND_CONFIG.phone.replace(/\s+/g, '')}`}
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[var(--willow-subtle)] transition-colors"
            >
              <span className="flex items-center gap-2 text-[var(--willow-text)]">
                <Phone className="w-3.5 h-3.5 text-[#C9893B]" />
                <span>Host Desk Telephone</span>
              </span>
              <span className="font-mono tabular-nums text-[var(--willow-text-secondary)]">
                {BRAND_CONFIG.phone}
              </span>
            </a>

            <a
              href={`https://wa.me/${BRAND_CONFIG.whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[var(--willow-subtle)] transition-colors"
            >
              <span className="flex items-center gap-2 text-[var(--willow-text)]">
                <MessageCircle className="w-3.5 h-3.5 text-[var(--willow-sage)]" />
                <span>WhatsApp Concierge</span>
              </span>
              <span className="text-[var(--willow-text-secondary)]">Instant reply</span>
            </a>

            <a
              href={`mailto:${BRAND_CONFIG.email}`}
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[var(--willow-subtle)] transition-colors"
            >
              <span className="flex items-center gap-2 text-[var(--willow-text)]">
                <Mail className="w-3.5 h-3.5 text-[#C9893B]" />
                <span>Courtyard Letters</span>
              </span>
              <span className="font-mono text-[var(--willow-text-secondary)]">
                {BRAND_CONFIG.email}
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* 2. WRITE TO THE COURTYARD MESSAGE FORM */}
      <section className="max-w-3xl p-5 sm:p-7 rounded-2xl willow-card border space-y-5">
        <div className="space-y-1">
          <p className="text-xs font-medium text-[var(--willow-amber-text)]">
            Questions, Book Donations & Vinyl Requests
          </p>
          <h2 className="font-serif text-2xl text-[var(--willow-text)]">Send Us a Note</h2>
        </div>

        {submitted ? (
          <div className="p-6 rounded-xl bg-[#6E7F63]/15 flex items-center gap-4">
            <CheckCircle2 className="w-8 h-8 text-[#6E7F63] shrink-0" />
            <div className="space-y-1">
              <h3 className="font-serif text-xl text-[var(--willow-text)]">
                Thank you for writing to The Willow
              </h3>
              <p className="text-xs text-[var(--willow-text-secondary)]">
                Our courtyard host will reply within a few hours—usually right after the morning espresso rush.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="text-xs text-[var(--willow-amber-text)] underline pt-1 cursor-pointer"
              >
                Send another message
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="space-y-1 block">
                <span className="font-medium text-[var(--willow-text)]">Your Name</span>
                <input
                  type="text"
                  required
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Vikram Seth"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--willow-input)] text-[var(--willow-text)] border border-[var(--willow-border-strong)] focus:outline-none focus:border-[var(--willow-amber)]"
                />
              </label>

              <label className="space-y-1 block">
                <span className="font-medium text-[var(--willow-text)]">Email Address</span>
                <input
                  type="email"
                  required
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="vikram@letters.org"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--willow-input)] text-[var(--willow-text)] border border-[var(--willow-border-strong)] focus:outline-none focus:border-[var(--willow-amber)]"
                />
              </label>
            </div>

            <label className="space-y-1 block">
              <span className="font-medium text-[var(--willow-text)]">Topic</span>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--willow-input)] text-[var(--willow-text)] border border-[var(--willow-border-strong)] focus:outline-none focus:border-[var(--willow-amber)]"
              >
                <option>General Inquiry & Table Note</option>
                <option>Private Gathering / Book Club Hosting</option>
                <option>Wholesale Single-Origin Coffee Beans</option>
                <option>Perform Acoustic Set at Dusk</option>
              </select>
            </label>

            <label className="space-y-1 block">
              <span className="font-medium text-[var(--willow-text)]">Message</span>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what you’re planning or suggest a record for Tuesday’s crate..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--willow-input)] text-[var(--willow-text)] border border-[var(--willow-border-strong)] focus:outline-none focus:border-[var(--willow-amber)]"
              />
            </label>

            <button
              type="submit"
              className="px-6 py-3 rounded-lg bg-[var(--willow-btn-primary-bg)] text-[var(--willow-btn-primary-fg)] font-semibold text-xs hover:opacity-90 transition-opacity cursor-pointer"
            >
              Send Message
            </button>
          </form>
        )}
      </section>
    </div>
  );
};
