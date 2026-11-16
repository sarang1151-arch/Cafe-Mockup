import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, Eraser } from 'lucide-react';
import { useCafe } from '../context/CafeContext';

const CHALK_SWATCHES = [
  { name: 'Warm Chalk', hex: '#F4EDE0' },
  { name: 'Amber Gold', hex: '#E5A558' },
  { name: 'Courtyard Sage', hex: '#A3B496' },
  { name: 'Rose Clay', hex: '#D98A76' },
];

export const ChalkboardModal: React.FC = () => {
  const { isChalkboardOpen, setIsChalkboardOpen } = useCafe();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [chalkColor, setChalkColor] = useState(CHALK_SWATCHES[0].hex);
  const [notes, setNotes] = useState<string[]>([
    '“Good Food. Better Days.” — Table G1',
    'Finished reading Tanizaki here on a rainy Tuesday.',
    'Try the cardamom knot warm with a honey cortado!',
    'Side B on the turntable is pure magic.',
  ]);
  const [noteInput, setNoteInput] = useState('');

  useEffect(() => {
    if (!isChalkboardOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * Math.min(window.devicePixelRatio, 2);
    canvas.height = rect.height * Math.min(window.devicePixelRatio, 2);
    ctx.scale(Math.min(window.devicePixelRatio, 2), Math.min(window.devicePixelRatio, 2));

    // Seed welcoming handwritten chalk greeting
    ctx.font = '28px Caveat, cursive';
    ctx.fillStyle = 'rgba(244, 237, 224, 0.72)';
    ctx.fillText('Draw a coffee cup or leave your mark...', 22, 42);
  }, [isChalkboardOpen]);

  useEffect(() => {
    if (!isChalkboardOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let drawing = false;
    let lastX = 0;
    let lastY = 0;

    const getPos = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const onDown = (e: PointerEvent) => {
      drawing = true;
      const p = getPos(e);
      lastX = p.x;
      lastY = p.y;
    };

    const onMove = (e: PointerEvent) => {
      if (!drawing) return;
      const p = getPos(e);
      ctx.strokeStyle = chalkColor;
      ctx.lineWidth = 3.2;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();

      // Subtle dusty chalk texture dots
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = chalkColor;
        ctx.globalAlpha = 0.35;
        ctx.fillRect(
          p.x + (Math.random() - 0.5) * 5,
          p.y + (Math.random() - 0.5) * 5,
          1.4,
          1.4
        );
      }

      lastX = p.x;
      lastY = p.y;
    };

    const onUp = () => {
      drawing = false;
    };

    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    return () => {
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [isChalkboardOpen, chalkColor]);

  const clearChalkboard = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const addNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim()) return;
    setNotes((prev) => [noteInput.trim(), ...prev.slice(0, 7)]);
    setNoteInput('');
  };

  return (
    <AnimatePresence>
      {isChalkboardOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label="The Hidden Courtyard Chalkboard"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-4xl rounded-2xl bg-[#1D2420] text-[#F4EDE0] border-4 border-[#4A3323] shadow-2xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-[#F4EDE0]/10 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-hand text-3xl text-[#F4EDE0]">
                  The Courtyard Chalkboard
                </h2>
                <p className="text-xs text-[#F4EDE0]/65">
                  Sketch with chalk on the slate or pin a handwritten note for the next reader
                </p>
              </div>
              <div className="flex items-center gap-2">
                {CHALK_SWATCHES.map((s) => (
                  <button
                    key={s.hex}
                    type="button"
                    onClick={() => setChalkColor(s.hex)}
                    title={s.name}
                    aria-label={`Select ${s.name}`}
                    className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                      chalkColor === s.hex ? 'scale-125 border-white' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: s.hex }}
                  />
                ))}
                <button
                  type="button"
                  onClick={clearChalkboard}
                  className="ml-2 px-3 py-1.5 rounded-lg bg-[#F4EDE0]/10 hover:bg-[#F4EDE0]/20 text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Wipe Slate</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsChalkboardOpen(false)}
                  aria-label="Close chalkboard"
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F4EDE0]/15 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-7 p-4 sm:p-6">
                <canvas
                  ref={canvasRef}
                  className="w-full h-64 sm:h-72 rounded-xl bg-[#151B17] border border-[#F4EDE0]/10 touch-none cursor-crosshair"
                />
              </div>

              <div className="lg:col-span-5 p-4 sm:p-6 border-t lg:border-t-0 lg:border-l border-[#F4EDE0]/10 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {notes.map((n, i) => (
                    <div
                      key={`${n}-${i}`}
                      className="p-3 rounded-lg bg-[#F4EDE0]/5 border border-[#F4EDE0]/10 font-hand text-xl text-[#F4EDE0]/95"
                    >
                      {n}
                    </div>
                  ))}
                </div>

                <form onSubmit={addNote} className="flex gap-2">
                  <input
                    type="text"
                    maxLength={70}
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="Write a chalk note..."
                    className="flex-1 px-3 py-2 rounded-lg bg-[#151B17] border border-[#F4EDE0]/20 text-sm text-[#F4EDE0] placeholder-[#F4EDE0]/40 focus:outline-none focus:border-[#C9893B]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#C9893B] text-[#14100C] text-xs font-semibold hover:bg-[#DDA052] whitespace-nowrap cursor-pointer"
                  >
                    Pin Note
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
