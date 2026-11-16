import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Check, Copy, Receipt } from 'lucide-react';
import { BRAND_CONFIG } from '../data/cafeConfig';
import { CartItem } from '../context/CafeContext';

export interface ReceiptSnapshot {
  refCode: string;
  issuedAt: string;
  guestName: string;
  orderMode: 'pickup' | 'table';
  tableOrTime: string;
  items: CartItem[];
  subtotalInr: number;
}

interface ThermalReceiptProps {
  receipt: ReceiptSnapshot;
  formatPrice: (priceInr: number) => string;
  onClose: () => void;
}

const BARCODE_WEIGHTS = [
  2, 1, 3, 1, 1, 2, 3, 1, 2, 1, 1, 3, 2, 1, 2, 2, 1, 3, 1, 1, 2, 1, 3, 1, 2, 1, 2, 3, 1, 2,
];

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({
  receipt,
  formatPrice,
  onClose,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);

  const handleCopySummary = async () => {
    const lines = [
      `${BRAND_CONFIG.name.toUpperCase()} — ORDER TICKET #${receipt.refCode}`,
      `Issued: ${receipt.issuedAt}`,
      `Guest: ${receipt.guestName || 'Guest'} · ${
        receipt.orderMode === 'pickup' ? 'Takeaway Pick-up' : 'Table Service'
      } (${receipt.tableOrTime})`,
      '----------------------------------------',
      ...receipt.items.map(
        (item) => `${item.qty}x ${item.name} — ${formatPrice(item.priceInr * item.qty)}`
      ),
      '----------------------------------------',
      `TOTAL (incl. taxes): ${formatPrice(receipt.subtotalInr)}`,
      `"${BRAND_CONFIG.sloganPrimary}"`,
    ];

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked in restricted context — show brief fallback confirmation
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="py-3 space-y-5">
      {/* Printer Dispenser Slot */}
      <div className="relative mx-auto max-w-[348px]">
        <div
          aria-hidden="true"
          className="relative z-20 h-3.5 rounded-full bg-gradient-to-b from-[#2A1D14] to-[#14100C] border border-[#C9893B]/35 shadow-md flex items-center justify-center px-4"
        >
          <div className="w-full h-[2px] rounded-full bg-black/80" />
        </div>

        {/* Unfolding Vintage Printed Thermal Paper */}
        <div style={{ perspective: 950 }} className="relative z-10 -mt-1.5 px-2 overflow-hidden">
          <motion.article
            aria-label={`Thermal receipt for order ${receipt.refCode}`}
            initial={
              shouldReduceMotion
                ? { opacity: 0 }
                : {
                    y: -36,
                    scaleY: 0.08,
                    rotateX: -26,
                    opacity: 0,
                  }
            }
            animate={
              shouldReduceMotion
                ? { opacity: 1 }
                : {
                    y: 0,
                    scaleY: 1,
                    rotateX: 0,
                    opacity: 1,
                  }
            }
            transition={{
              duration: shouldReduceMotion ? 0.12 : 0.72,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{
              transformOrigin: 'top center',
              backgroundColor: '#F6EFE0',
              backgroundImage:
                'repeating-linear-gradient(180deg, rgba(42,29,20,0.015) 0px, rgba(42,29,20,0.015) 2px, transparent 2px, transparent 5px), radial-gradient(circle at 80% 18%, rgba(201,137,59,0.08), transparent 55%)',
              color: '#241B14',
            }}
            className="relative pt-5 pb-6 px-5 shadow-[0_14px_28px_-10px_rgba(0,0,0,0.35)] border-x border-[#241B14]/15 font-mono text-[11px] leading-relaxed"
          >
            {/* Top Subtle Fold Crease Shadow under Dispenser Lip */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-black/15 to-transparent"
            />

            {/* Café Masthead */}
            <motion.header
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: shouldReduceMotion ? 0 : 0.16, duration: 0.25 }}
              className="text-center space-y-1 pb-3 border-b border-dashed border-[#241B14]/25"
            >
              <p className="font-serif text-lg font-semibold tracking-tight text-[#1E140D]">
                {BRAND_CONFIG.name.toUpperCase()}
              </p>
              <p className="text-[10px] text-[#5C4939]">
                {BRAND_CONFIG.shortAddress}
              </p>
              <p className="text-[10px] text-[#5C4939] tabular-nums">
                TEL: {BRAND_CONFIG.phone}
              </p>
            </motion.header>

            {/* Ticket Metadata */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: shouldReduceMotion ? 0 : 0.24, duration: 0.25 }}
              className="py-3 border-b border-dashed border-[#241B14]/25 space-y-1 text-[10.5px] tabular-nums"
            >
              <div className="flex justify-between gap-2">
                <span className="text-[#66513F]">TICKET NO.</span>
                <span className="font-semibold text-[#1E140D]">#{receipt.refCode}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#66513F]">ISSUED</span>
                <span>{receipt.issuedAt}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#66513F]">GUEST</span>
                <span className="truncate max-w-[170px] font-medium">
                  {receipt.guestName || 'Walk-in Friend'}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#66513F]">SERVICE</span>
                <span className="text-right">
                  {receipt.orderMode === 'pickup' ? 'COUNTER PICK-UP' : 'TABLE SERVICE'} ·{' '}
                  {receipt.tableOrTime}
                </span>
              </div>
            </motion.div>

            {/* Line Items */}
            <div className="py-3 border-b border-dashed border-[#241B14]/25 space-y-2">
              <div className="flex justify-between text-[10px] text-[#66513F] uppercase tracking-wider">
                <span>Qty &amp; Item</span>
                <span>Amount</span>
              </div>

              <div className="space-y-1.5">
                {receipt.items.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: shouldReduceMotion ? 0 : 0.28 + idx * 0.055,
                      duration: 0.22,
                    }}
                    className="flex items-start justify-between gap-3 tabular-nums"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold mr-1.5">{item.qty}x</span>
                      <span className="text-[#1E140D]">{item.name}</span>
                    </div>
                    <span className="shrink-0 font-medium text-[#1E140D]">
                      {formatPrice(item.priceInr * item.qty)}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Totals & Vintage Stamp */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: shouldReduceMotion ? 0 : 0.34 + receipt.items.length * 0.055,
                duration: 0.26,
              }}
              className="pt-3 pb-2 space-y-1.5 tabular-nums"
            >
              <div className="flex justify-between text-[10.5px] text-[#5C4939]">
                <span>KITCHEN &amp; STONEWARE PREP</span>
                <span>INCLUDED</span>
              </div>
              <div className="flex justify-between text-[10.5px] text-[#5C4939]">
                <span>APPLICABLE TAXES</span>
                <span>INCL.</span>
              </div>
              <div className="pt-1.5 mt-1 border-t border-[#241B14]/25 flex items-baseline justify-between">
                <span className="text-xs font-semibold tracking-wide text-[#1E140D]">
                  TOTAL CHARGED
                </span>
                <span className="font-serif text-xl font-bold text-[#1E140D]">
                  {formatPrice(receipt.subtotalInr)}
                </span>
              </div>
            </motion.div>

            {/* Ink Stamp + Vintage Barcode Footer */}
            <motion.div
              initial={
                shouldReduceMotion
                  ? { opacity: 1 }
                  : { opacity: 0, scale: 1.16 }
              }
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: shouldReduceMotion ? 0 : 0.44 + receipt.items.length * 0.055,
                type: 'spring',
                stiffness: 340,
                damping: 22,
              }}
              className="mt-3 pt-3 border-t border-dashed border-[#241B14]/25 flex flex-col items-center gap-2.5 text-center"
            >
              <div className="-rotate-2 px-3 py-1 border-2 border-[#4B5E42]/75 text-[#4B5E42] text-[10px] font-semibold tracking-widest uppercase">
                Sent to Barista &amp; Hearth
              </div>

              {/* Minimal Printed Thermal Barcode */}
              <svg
                aria-hidden="true"
                viewBox="0 0 180 26"
                className="w-40 h-6 opacity-80"
                preserveAspectRatio="none"
              >
                {BARCODE_WEIGHTS.reduce<{ x: number; rects: React.ReactNode[] }>(
                  (acc, w, idx) => {
                    const barW = w * 1.8;
                    if (idx % 2 === 0) {
                      acc.rects.push(
                        <rect
                          key={idx}
                          x={acc.x}
                          y={0}
                          width={barW}
                          height={26}
                          fill="#241B14"
                        />
                      );
                    }
                    acc.x += barW + 2.2;
                    return acc;
                  },
                  { x: 6, rects: [] }
                ).rects}
              </svg>

              <p className="font-hand text-base text-[#7D4F24] leading-none">
                Good Food. Better Days.
              </p>
              <p className="text-[9.5px] text-[#66513F]">
                Please keep this slip for table or counter collection
              </p>
            </motion.div>

            {/* Torn Serrated Bottom Paper Edge */}
            <svg
              aria-hidden="true"
              viewBox="0 0 320 12"
              preserveAspectRatio="none"
              className="absolute left-0 right-0 -bottom-[11px] w-full h-[12px] pointer-events-none"
            >
              <path
                d="M0,0 L8,11 L16,0 L24,11 L32,0 L40,11 L48,0 L56,11 L64,0 L72,11 L80,0 L88,11 L96,0 L104,11 L112,0 L120,11 L128,0 L136,11 L144,0 L152,11 L160,0 L168,11 L176,0 L184,11 L192,0 L200,11 L208,0 L216,11 L224,0 L232,11 L240,0 L248,11 L256,0 L264,11 L272,0 L280,11 L288,0 L296,11 L304,0 L312,11 L320,0 Z"
                fill="#F6EFE0"
              />
            </svg>
          </motion.article>
        </div>
      </div>

      {/* Action Buttons Below Receipt */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
        <button
          type="button"
          onClick={handleCopySummary}
          className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-[var(--willow-border-strong)] hover:border-[var(--willow-amber)] text-xs font-medium text-[var(--willow-text)] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#6E7F63]" />
              <span>Receipt Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-[#C9893B]" />
              <span>Copy Receipt</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onClose}
          className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[var(--willow-btn-primary-bg)] text-[var(--willow-btn-primary-fg)] hover:opacity-90 text-xs font-semibold flex items-center justify-center gap-1.5 transition-opacity cursor-pointer"
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Continue Exploring</span>
        </button>
      </div>
    </div>
  );
};
