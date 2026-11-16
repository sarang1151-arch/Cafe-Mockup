import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { ORIGIN_SOURCES, STORY_TIMELINE, TEAM_MEMBERS } from '../data/cafeConfig';
import { ResilientImage } from '../components/ResilientImage';
import { ScrollRevealHeading } from '../components/ScrollRevealHeading';

gsap.registerPlugin(ScrollTrigger);

export const StoryPage: React.FC = () => {
  const pinWrapRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const mobileTrackRef = useRef<HTMLDivElement | null>(null);
  const [selectedOrigin, setSelectedOrigin] = useState(ORIGIN_SOURCES[0]);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || window.innerWidth < 1024) return;

    const wrap = pinWrapRef.current;
    const track = trackRef.current;
    if (!wrap || !track) return;

    const ctx = gsap.context(() => {
      const getScrollAmount = () => Math.max(0, track.scrollWidth - wrap.clientWidth);

      gsap.to(track, {
        x: () => -getScrollAmount(),
        ease: 'none',
        scrollTrigger: {
          trigger: wrap,
          start: 'top 14%',
          end: () => `+=${getScrollAmount()}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });
    }, wrap);

    return () => ctx.revert();
  }, []);

  const scrollMobileTimeline = (dir: -1 | 1) => {
    mobileTrackRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  return (
    <div className="py-10 sm:py-14 space-y-16 overflow-x-hidden">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl space-y-2">
          <p className="font-hand text-xl text-[var(--willow-amber-text)]">
            Five Years of Good Days
          </p>
          <ScrollRevealHeading
            as="h1"
            className="font-serif text-3xl sm:text-5xl font-normal text-[var(--willow-text)]"
          >
            From Forgotten Print-Yard to Neighbourhood Hearth
          </ScrollRevealHeading>
          <p className="text-xs sm:text-sm text-[var(--willow-text-secondary)] leading-relaxed max-w-xl">
            Built slowly with salvaged estate walnut, direct-trade coffee harvests, and two hundred books lent by our earliest regulars.
          </p>
        </div>
      </div>

      {/* 1. HORIZONTAL SCROLL TIMELINE */}
      <section>
        <div ref={pinWrapRef} className="hidden lg:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="mb-5 flex items-center justify-between text-xs text-[var(--willow-text-muted)]">
            <span>Scroll down to travel across our chapters (2021 – 2025)</span>
            <span className="font-mono text-[var(--willow-amber-text)]">01 — 04</span>
          </div>
          <div ref={trackRef} className="flex gap-6 w-max pr-12">
            {STORY_TIMELINE.map((chapter, idx) => (
              <article
                key={chapter.year}
                className="w-[510px] rounded-2xl willow-card border overflow-hidden grid grid-cols-12"
              >
                <div className="col-span-6 h-full min-h-[320px]">
                  <ResilientImage
                    src={chapter.image}
                    alt={chapter.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="col-span-6 p-5 sm:p-6 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <p className="font-mono text-xs text-[var(--willow-amber-text)] tabular-nums">
                      0{idx + 1} · {chapter.season} {chapter.year}
                    </p>
                    <h2 className="font-serif text-2xl leading-snug text-[var(--willow-text)]">
                      {chapter.title}
                    </h2>
                    <p className="text-xs text-[var(--willow-text-secondary)] leading-relaxed">
                      {chapter.description}
                    </p>
                  </div>
                  <span className="font-serif italic text-3xl text-[var(--willow-text-muted)] opacity-45 tabular-nums">
                    {chapter.year}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Mobile / Tablet Touch Horizontal Swipe Timeline */}
        <div className="lg:hidden px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--willow-amber-text)]">
              Swipe our 5-year journey
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => scrollMobileTimeline(-1)}
                aria-label="Scroll timeline left"
                className="w-8 h-8 rounded-lg willow-card border flex items-center justify-center"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollMobileTimeline(1)}
                aria-label="Scroll timeline right"
                className="w-8 h-8 rounded-lg willow-card border flex items-center justify-center"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div
            ref={mobileTrackRef}
            className="flex gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-3"
          >
            {STORY_TIMELINE.map((chapter, idx) => (
              <article
                key={chapter.year}
                className="snap-start shrink-0 w-[85vw] max-w-sm rounded-2xl willow-card border overflow-hidden"
              >
                <div className="aspect-[16/10]">
                  <ResilientImage
                    src={chapter.image}
                    alt={chapter.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5 space-y-2">
                  <p className="font-mono text-xs text-[var(--willow-amber-text)] tabular-nums">
                    0{idx + 1} · {chapter.season} {chapter.year}
                  </p>
                  <h2 className="font-serif text-2xl text-[var(--willow-text)]">{chapter.title}</h2>
                  <p className="text-xs text-[var(--willow-text-secondary)] leading-relaxed">
                    {chapter.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 2. OUR BEANS, OUR FARMERS, OUR SOIL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="max-w-2xl space-y-1.5">
          <p className="text-xs font-medium text-[var(--willow-amber-text)]">
            Direct Estate & Harvest Relationships
          </p>
          <ScrollRevealHeading className="font-serif text-2xl sm:text-4xl font-normal text-[var(--willow-text)]">
            Our Beans, Our Farmers, Our Soil
          </ScrollRevealHeading>
          <p className="text-xs sm:text-sm text-[var(--willow-text-secondary)]">
            Every espresso pull, matcha bowl, and San Marzano pizza sauce traces back to a single named harvest. Tap any origin pin to explore.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
          <div className="lg:col-span-7 p-4 sm:p-6 rounded-2xl bg-[#1B1511] text-[#F4EDE0] border border-[#F4EDE0]/12 flex flex-col justify-between">
            <svg viewBox="0 0 100 62" className="w-full h-auto select-none">
              <line x1="0" y1="22" x2="100" y2="22" stroke="#F4EDE0" strokeOpacity="0.08" strokeWidth="0.25" />
              <line x1="0" y1="42" x2="100" y2="42" stroke="#C9893B" strokeOpacity="0.22" strokeDasharray="1 1" strokeWidth="0.3" />
              <text x="3" y="40.5" fontSize="2.1" fill="#C9893B" opacity="0.8">
                Tropic of Coffee & Botanical Terroir
              </text>

              <path d="M12,18 Q22,14 28,24 T32,48 Q26,56 23,44 Z" fill="rgba(244,237,224,0.09)" />
              <path d="M44,16 Q56,14 60,26 Q63,44 55,54 Q47,46 46,30 Z" fill="rgba(244,237,224,0.09)" />
              <path d="M62,18 Q80,15 90,28 Q86,44 72,46 Q65,40 62,28 Z" fill="rgba(244,237,224,0.09)" />

              {ORIGIN_SOURCES.map((orig) => {
                const isSel = orig.id === selectedOrigin.id;
                const midX = (orig.coords.x + 69) / 2;
                const midY = Math.min(orig.coords.y, 53) - 11;
                return (
                  <path
                    key={`arc-${orig.id}`}
                    d={`M ${orig.coords.x} ${orig.coords.y} Q ${midX} ${midY} 69 53`}
                    fill="none"
                    stroke={isSel ? '#C9893B' : '#F4EDE0'}
                    strokeOpacity={isSel ? 0.85 : 0.18}
                    strokeWidth={isSel ? '0.65' : '0.3'}
                    strokeDasharray="1.2 0.8"
                  />
                );
              })}

              {ORIGIN_SOURCES.map((orig) => {
                const isSel = orig.id === selectedOrigin.id;
                return (
                  <g
                    key={orig.id}
                    onClick={() => setSelectedOrigin(orig)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={orig.coords.x}
                      cy={orig.coords.y}
                      r={isSel ? 2.6 : 1.7}
                      fill={isSel ? '#C9893B' : '#9EB091'}
                      stroke="#14100C"
                      strokeWidth="0.5"
                    />
                    <text
                      x={orig.coords.x}
                      y={orig.coords.y - 3.2}
                      textAnchor="middle"
                      fontSize="2.4"
                      fill={isSel ? '#C9893B' : '#F4EDE0'}
                    >
                      {orig.name.split(',')[0]}
                    </text>
                  </g>
                );
              })}
            </svg>

            <div className="pt-4 border-t border-[#F4EDE0]/12 flex flex-wrap gap-1.5">
              {ORIGIN_SOURCES.map((orig) => (
                <button
                  key={orig.id}
                  type="button"
                  onClick={() => setSelectedOrigin(orig)}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-colors whitespace-nowrap cursor-pointer ${
                    selectedOrigin.id === orig.id
                      ? 'bg-[#C9893B] text-[#14100C] font-semibold'
                      : 'bg-[#F4EDE0]/10 text-[#F4EDE0]/80 hover:text-[#F4EDE0]'
                  }`}
                >
                  {orig.name.split(',')[1]?.trim() || orig.name}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 p-5 sm:p-6.5 rounded-2xl willow-card border flex flex-col justify-between space-y-5">
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs text-[var(--willow-amber-text)] font-mono">
                <MapPin className="w-3.5 h-3.5" />
                <span>{selectedOrigin.country}</span>
              </div>
              <h3 className="font-serif text-2xl text-[var(--willow-text)]">
                {selectedOrigin.name}
              </h3>
              <p className="text-xs font-semibold text-[var(--willow-sage)]">
                Used in: {selectedOrigin.ingredient}
              </p>
              <p className="text-xs sm:text-sm text-[var(--willow-text-secondary)] leading-relaxed pt-1.5">
                {selectedOrigin.notes}
              </p>
            </div>

            <div className="pt-3.5 border-t border-[var(--willow-border)] text-xs text-[var(--willow-text-muted)]">
              We pay a minimum of 42% above Fairtrade farmgate benchmarks and publish annual harvest lot sheets on our roastery counter.
            </div>
          </div>
        </div>
      </section>

      {/* 3. MEET THE TEAM GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="space-y-1">
          <p className="text-xs font-medium text-[var(--willow-amber-text)]">
            The People Behind the Counter
          </p>
          <ScrollRevealHeading className="font-serif text-2xl sm:text-4xl font-normal text-[var(--willow-text)]">
            Roasters, Bakers & Readers
          </ScrollRevealHeading>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {TEAM_MEMBERS.map((member) => (
            <article
              key={member.name}
              className="group rounded-2xl overflow-hidden willow-card border"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <ResilientImage
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <p className="text-xs text-[#F4EDE0]">
                    Shelf Favourite: <em>{member.favoriteBook}</em>
                  </p>
                </div>
              </div>
              <div className="p-4 sm:p-5 space-y-1.5">
                <p className="text-xs font-medium text-[var(--willow-amber-text)]">{member.role}</p>
                <h3 className="font-serif text-xl text-[var(--willow-text)]">{member.name}</h3>
                <p className="text-xs text-[var(--willow-text-secondary)] leading-relaxed">
                  {member.specialty}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
