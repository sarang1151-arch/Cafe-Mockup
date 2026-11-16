import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealHeadingProps {
  as?: 'h1' | 'h2' | 'h3';
  children: string;
  className?: string;
}

export const ScrollRevealHeading: React.FC<ScrollRevealHeadingProps> = ({
  as: Tag = 'h2',
  children,
  className = '',
}) => {
  const containerRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const words = el.querySelectorAll('.willow-word-inner');
    if (!words.length) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        words,
        { yPercent: 95, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.68,
          stagger: 0.035,
          ease: 'power3.out',
          clearProps: 'transform',
          scrollTrigger: {
            trigger: el,
            start: 'top 90%',
            once: true,
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [children]);

  const words = children.split(' ');

  return (
    <Tag ref={containerRef} className={`leading-[1.12] ${className}`}>
      {words.map((word, idx) => (
        <span
          key={`${word}-${idx}`}
          className="inline-block overflow-hidden py-[0.09em] -my-[0.09em] align-baseline mr-[0.26em] last:mr-0"
        >
          <span className="willow-word-inner inline-block">{word}</span>
        </span>
      ))}
    </Tag>
  );
};
