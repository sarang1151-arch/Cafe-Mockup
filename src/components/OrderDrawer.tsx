import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, Plus, Minus, Trash2, Gift, ShoppingBag } from 'lucide-react';
import { useCafe } from '../context/CafeContext';
import { CAFE_ASSETS } from '../data/cafeConfig';
import { ResilientImage } from './ResilientImage';
import { ReceiptSnapshot, ThermalReceipt } from './ThermalReceipt';

export const OrderDrawer: React.FC = () => {
  const {
    cart,
    updateCartQty,
    removeFromCart,
    clearCart,
    cartSubtotalInr,
    formatPrice,
    isOrderDrawerOpen,
    setIsOrderDrawerOpen,
    addToCart,
  } = useCafe();

  const [orderMode, setOrderMode] = useState<'pickup' | 'table'>('pickup');
  const [guestName, setGuestName] = useState('');
  const [tableOrTime, setTableOrTime] = useState('In 20 mins');
  const [confirmedReceipt, setConfirmedReceipt] = useState<ReceiptSnapshot | null>(null);

  useEffect(() => {
    if (cart.length > 0 && confirmedReceipt) {
      setConfirmedReceipt(null);
    }
  }, [cart.length, confirmedReceipt]);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const now = new Date();
    const issuedAt = now.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const refCode = `WLW-${Math.floor(1000 + Math.random() * 9000)}`;
    setConfirmedReceipt({
      refCode,
      issuedAt,
      guestName: guestName.trim(),
      orderMode,
      tableOrTime: tableOrTime.trim() || (orderMode === 'pickup' ? 'In 20 mins' : 'Terrace Table'),
      items: cart.map((item) => ({ ...item })),
      subtotalInr: cartSubtotalInr,
    });
    clearCart();
  };

  const handleAddGiftCard = (amountInr: number) => {
    addToCart({
      id: `gift-card-${amountInr}`,
      name: `Willow Café Gift Card (${formatPrice(amountInr)})`,
      priceInr: amountInr,
      image: CAFE_ASSETS.heroCourtyard,
      category: 'Gift Card',
      note: 'Redeemable for coffee, food, books & vinyl nights',
    });
  };

  return (
    <AnimatePresence>
      {isOrderDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-label="Your Café Order Tray"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setIsOrderDrawerOpen(false);
              setConfirmedReceipt(null);
            }}
            className="fixed inset-0 bg-black/55 backdrop-blur-xs"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-md h-full bg-[var(--willow-surface)] text-[var(--willow-text)] border-l border-[var(--willow-border)] flex flex-col justify-between overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-[var(--willow-border)] flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-[var(--willow-text)]">
                  Your Café Tray
                </h2>
                <p className="text-xs text-[var(--willow-text-muted)]">
                  Takeaway pick-up or courtyard table service
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOrderDrawerOpen(false);
                  setConfirmedReceipt(null);
                }}
                aria-label="Close tray"
                className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[var(--willow-subtle)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {confirmedReceipt ? (
                <ThermalReceipt
                  receipt={confirmedReceipt}
                  formatPrice={formatPrice}
                  onClose={() => {
                    setConfirmedReceipt(null);
                    setIsOrderDrawerOpen(false);
                  }}
                />
              ) : cart.length === 0 ? (
                <div className="py-10 text-center space-y-4">
                  <ShoppingBag
                    className="w-10 h-10 mx-auto text-[var(--willow-text-muted)]"
                    strokeWidth={1.4}
                  />
                  <h3 className="font-serif text-2xl text-[var(--willow-text)]">
                    Your tray is currently empty
                  </h3>
                  <p className="text-xs text-[var(--willow-text-secondary)] max-w-xs mx-auto">
                    Add freshly whisked Uji matcha, truffle tagliatelle, or sourdough pastries from our menu.
                  </p>

                  {/* Quick Gift Card Section */}
                  <div className="mt-8 pt-6 border-t border-[var(--willow-border)] text-left space-y-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-[var(--willow-amber-text)]">
                      <Gift className="w-4 h-4" />
                      <span>Send a Willow Gift Card</span>
                    </div>
                    <p className="text-xs text-[var(--willow-text-secondary)]">
                      Treat a friend to slow mornings, books, and wood-fired supper.
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {[1000, 2500, 5000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => handleAddGiftCard(amt)}
                          className="py-2 px-3 rounded-lg border border-[var(--willow-border-strong)] hover:border-[var(--willow-amber)] text-xs font-mono tabular-nums transition-colors cursor-pointer"
                        >
                          +{formatPrice(amt)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Mode Switcher */}
                  <div className="grid grid-cols-2 p-1 rounded-lg willow-subtle border gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setOrderMode('pickup');
                        setTableOrTime('Pick up in 20 mins');
                      }}
                      className={`py-2 px-3 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                        orderMode === 'pickup'
                          ? 'bg-[var(--willow-surface)] text-[var(--willow-text)] font-semibold shadow-xs'
                          : 'text-[var(--willow-text-secondary)]'
                      }`}
                    >
                      Takeaway Pick-up
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOrderMode('table');
                        setTableOrTime('Terrace Table G1');
                      }}
                      className={`py-2 px-3 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                        orderMode === 'table'
                          ? 'bg-[var(--willow-surface)] text-[var(--willow-text)] font-semibold shadow-xs'
                          : 'text-[var(--willow-text-secondary)]'
                      }`}
                    >
                      Serve at Table
                    </button>
                  </div>

                  {/* Items List */}
                  <div className="divide-y divide-[var(--willow-border)]">
                    {cart.map((item) => (
                      <div key={item.id} className="py-3.5 flex items-center gap-3.5">
                        <ResilientImage
                          src={item.image}
                          alt={item.name}
                          compactPlaceholder
                          className="w-16 h-16 rounded-lg object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[var(--willow-text-muted)]">
                            {item.category}
                          </p>
                          <h4 className="font-serif text-lg leading-snug truncate text-[var(--willow-text)]">
                            {item.name}
                          </h4>
                          <p className="text-xs font-mono tabular-nums text-[var(--willow-amber-text)] mt-0.5">
                            {formatPrice(item.priceInr * item.qty)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => updateCartQty(item.id, -1)}
                            aria-label={`Decrease quantity of ${item.name}`}
                            className="w-7 h-7 rounded-md border border-[var(--willow-border-strong)] flex items-center justify-center hover:border-[var(--willow-amber)] cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center text-xs font-mono tabular-nums">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQty(item.id, 1)}
                            aria-label={`Increase quantity of ${item.name}`}
                            className="w-7 h-7 rounded-md border border-[var(--willow-border-strong)] flex items-center justify-center hover:border-[var(--willow-amber)] cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            aria-label={`Remove ${item.name}`}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--willow-text-muted)] hover:text-red-500 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quick Gift Card Add-on */}
                  <div className="pt-3 border-t border-[var(--willow-border)] flex items-center justify-between gap-2 text-xs">
                    <span className="text-[var(--willow-text-secondary)]">
                      Add a Gift Card?
                    </span>
                    <div className="flex gap-1.5">
                      {[1000, 2500].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => handleAddGiftCard(amt)}
                          className="px-2.5 py-1 rounded-md border border-[var(--willow-border-strong)] hover:border-[var(--willow-amber)] font-mono tabular-nums cursor-pointer"
                        >
                          +{formatPrice(amt)}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Checkout Form Footer */}
            {cart.length > 0 && !confirmedReceipt && (
              <form
                onSubmit={handleCheckout}
                className="px-6 py-5 border-t border-[var(--willow-border)] bg-[var(--willow-subtle)] space-y-3"
              >
                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Your name"
                    className="px-3 py-2 rounded-lg text-xs bg-[var(--willow-input)] text-[var(--willow-text)] border border-[var(--willow-border-strong)] focus:outline-none focus:border-[var(--willow-amber)]"
                  />
                  <input
                    type="text"
                    required
                    value={tableOrTime}
                    onChange={(e) => setTableOrTime(e.target.value)}
                    placeholder={orderMode === 'pickup' ? 'Pick-up time' : 'Table code'}
                    className="px-3 py-2 rounded-lg text-xs bg-[var(--willow-input)] text-[var(--willow-text)] border border-[var(--willow-border-strong)] focus:outline-none focus:border-[var(--willow-amber)]"
                  />
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-xs text-[var(--willow-text-secondary)]">
                    Total (incl. taxes)
                  </span>
                  <span className="font-serif text-2xl font-semibold tabular-nums text-[var(--willow-text)]">
                    {formatPrice(cartSubtotalInr)}
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-lg bg-[#C9893B] hover:bg-[#DDA052] text-[#14100C] font-semibold text-sm transition-colors cursor-pointer"
                >
                  Place {orderMode === 'pickup' ? 'Takeaway' : 'Table'} Order
                </button>
              </form>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};
