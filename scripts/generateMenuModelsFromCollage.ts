import * as fs from 'node:fs';
import * as path from 'node:path';
import { cropResizeCrisp, decodePng, encodePngRgb, RawImage } from './modelgen/imagePbrUtils';
import { buildDrinksAndSweetsGlb, DishMultiViews } from './modelgen/dishesDrinksAndSweets';
import { buildSavoryAndBowlsGlb } from './modelgen/dishesSavoryAndBowls';

interface CollageDishDef {
  id: string;
  row: number;
  col: number;
}

const COLLAGE_ITEMS: CollageDishDef[] = [
  { id: 'matcha-latte', row: 0, col: 0 },
  { id: 'blueberry-cheesecake', row: 0, col: 1 },
  { id: 'truffle-pasta', row: 0, col: 2 },

  { id: 'cold-brew', row: 1, col: 0 },
  { id: 'willow-cortado', row: 1, col: 1 },
  { id: 'pourover-geisha', row: 1, col: 2 },

  { id: 'hibiscus-spritz', row: 2, col: 0 },
  { id: 'acai-bowl', row: 2, col: 1 },
  { id: 'tuscan-panini', row: 2, col: 2 },

  { id: 'margherita-pizza', row: 3, col: 0 },
  { id: 'burrata-fig-pizza', row: 3, col: 1 },
  { id: 'skillet-brownie', row: 3, col: 2 },

  { id: 'cardamom-knot', row: 4, col: 0 },
  { id: 'almond-croissant', row: 4, col: 1 },
];

const ROW_BOUNDS: [number, number][] = [
  [0, 203],
  [210, 412],
  [419, 616],
  [622, 818],
  [824, 1023],
];

const COL3_BOUNDS: [number, number][] = [
  [0, 508],
  [513, 1021],
  [1027, 1535],
];

const COL2_BOUNDS: [number, number][] = [
  [0, 765],
  [770, 1535],
];

function extractViewsForCell(collage: RawImage, row: number, col: number): DishMultiViews {
  const [y0, y1] = ROW_BOUNDS[row];
  const [x0, x1] = row < 4 ? COL3_BOUNDS[col] : COL2_BOUNDS[col];
  const cellW = x1 - x0 + 1;
  const cellH = y1 - y0 + 1;

  const quadCard = cropResizeCrisp(collage, x0, y0, cellW, cellH, cellW * 2, cellH * 2, 0.24);

  if (row < 4) {
    const py = y0 + 38;
    const ph = 136;
    return {
      quadCard,
      topView: cropResizeCrisp(collage, x0 + 10, py, 128, ph, 512, 512, 0.34),
      sideView: cropResizeCrisp(collage, x0 + 145, py, 114, ph, 448, 448, 0.3),
      frontView: cropResizeCrisp(collage, x0 + 266, py, 113, ph, 448, 448, 0.3),
      threeQuarterView: cropResizeCrisp(collage, x0 + 386, py, 113, ph, 640, 520, 0.32),
    };
  }

  const py = y0 + 40;
  const ph = 136;
  return {
    quadCard,
    topView: cropResizeCrisp(collage, x0 + 19, py, 178, ph, 512, 512, 0.32),
    sideView: cropResizeCrisp(collage, x0 + 203, py, 176, ph, 480, 448, 0.28),
    frontView: cropResizeCrisp(collage, x0 + 388, py, 172, ph, 480, 448, 0.28),
    threeQuarterView: cropResizeCrisp(collage, x0 + 572, py, 174, ph, 680, 520, 0.3),
  };
}

function buildAnyDishGlb(id: string, views: DishMultiViews): Buffer {
  const res = buildDrinksAndSweetsGlb(id, views) ?? buildSavoryAndBowlsGlb(id, views);
  if (!res) throw new Error(`No 3D builder registered for dish id: ${id}`);
  return res;
}

function main() {
  const rootDir = process.cwd();
  const collagePath = path.join(
    rootDir,
    'public/assets/aistudio/Editorial_Food_Menu_Collage_aec598cc.png'
  );
  const avoQuadPath = path.join(
    rootDir,
    'public/assets/aistudio/Quad-View_Avocado_Toast_with_Poached_Egg_a4af8684.png'
  );
  const modelsDir = path.join(rootDir, 'public/assets/models');
  const dishesDir = path.join(rootDir, 'public/assets/dishes');

  fs.mkdirSync(modelsDir, { recursive: true });
  fs.mkdirSync(dishesDir, { recursive: true });

  console.log('Decoding Editorial Food Menu Collage (1536x1024)...');
  const collage = decodePng(collagePath);

  for (const item of COLLAGE_ITEMS) {
    const views = extractViewsForCell(collage, item.row, item.col);
    fs.writeFileSync(path.join(dishesDir, `${item.id}-quad.png`), encodePngRgb(views.quadCard));
    fs.writeFileSync(path.join(dishesDir, `${item.id}-3q.png`), encodePngRgb(views.threeQuarterView));

    const glbBuf = buildAnyDishGlb(item.id, views);
    fs.writeFileSync(path.join(modelsDir, `${item.id}.glb`), glbBuf);

    console.log(
      `✓ ${item.id.padEnd(22)} -> ${(glbBuf.length / 1024).toFixed(1).padStart(7)} KB Photoreal PBR GLB`
    );
  }

  console.log('Decoding Quad-View Avocado Toast Reference (1536x1024)...');
  const avoQuad = decodePng(avoQuadPath);
  const avoViews: DishMultiViews = {
    quadCard: avoQuad,
    topView: cropResizeCrisp(avoQuad, 0, 0, 764, 509, 768, 512, 0.22),
    frontView: cropResizeCrisp(avoQuad, 771, 0, 765, 509, 768, 512, 0.22),
    sideView: cropResizeCrisp(avoQuad, 0, 515, 764, 509, 768, 512, 0.22),
    threeQuarterView: cropResizeCrisp(avoQuad, 771, 515, 765, 509, 768, 512, 0.22),
  };
  const avoGlb = buildAnyDishGlb('avocado-toast', avoViews);
  fs.writeFileSync(path.join(modelsDir, 'avocado-toast.glb'), avoGlb);
  console.log(
    `✓ ${'avocado-toast'.padEnd(22)} -> ${(avoGlb.length / 1024).toFixed(1).padStart(7)} KB Photoreal PBR GLB`
  );

  console.log('All 15 photorealistic multi-view PBR .glb models generated successfully!');
}

main();
