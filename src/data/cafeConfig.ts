import heroCourtyardImg from '../assets/images/willow_hero_courtyard_1793783066961.jpg';
import nightAmbianceImg from '../assets/images/willow_night_ambiance_1793783068740.jpg';
import matchaCheesecakeMoodImg from '../assets/images/dish_matcha_cheesecake_1793783069717.jpg';
import trufflePastaImg from '../assets/images/dish_truffle_pasta_1793783070186.jpg';
import avocadoColdbrewMoodImg from '../assets/images/dish_avocado_coldbrew_1793783072819.jpg';
import neapolitanPizzaImg from '../assets/images/dish_neapolitan_pizza_1793783072878.jpg';
import readingVinylImg from '../assets/images/space_reading_vinyl_1793783075792.jpg';
import roasteryBeansImg from '../assets/images/story_roastery_beans_1793783077879.jpg';

// Dedicated single-item culinary photographs (zero reuse across products)
import singleMatchaLatteImg from '../assets/images/dish_single_matcha_latte_1793785494373.jpg';
import singleBlueberryCheesecakeImg from '../assets/images/dish_single_blueberry_cheesecake_1793785496030.jpg';
import singleColdBrewImg from '../assets/images/dish_single_cold_brew_1793785497014.jpg';
import singleAvocadoToastImg from '../assets/images/dish_single_avocado_toast_1793785499034.jpg';
import singleHoneyCortadoImg from '../assets/images/dish_single_honey_cortado_1793785499898.jpg';
import singleCardamomKnotImg from '../assets/images/dish_single_cardamom_knot_1793785502334.jpg';

// Equirectangular 360° preview panoramas
import pano360InteriorImg from '../assets/images/pano_360_willow_interior_1793785503169.jpg';
import pano360TerraceImg from '../assets/images/pano_360_willow_terrace_1793785504174.jpg';

export const CAFE_ASSETS = {
  heroCourtyard: heroCourtyardImg,
  nightAmbiance: nightAmbianceImg,
  matchaCheesecake: matchaCheesecakeMoodImg,
  trufflePasta: trufflePastaImg,
  avocadoColdbrew: avocadoColdbrewMoodImg,
  neapolitanPizza: neapolitanPizzaImg,
  readingVinyl: readingVinylImg,
  roasteryBeans: roasteryBeansImg,
  singleMatchaLatte: singleMatchaLatteImg,
  singleBlueberryCheesecake: singleBlueberryCheesecakeImg,
  singleColdBrew: singleColdBrewImg,
  singleAvocadoToast: singleAvocadoToastImg,
  singleHoneyCortado: singleHoneyCortadoImg,
  singleCardamomKnot: singleCardamomKnotImg,
  pano360Interior: pano360InteriorImg,
  pano360Terrace: pano360TerraceImg,
};

/**
 * Hero Background Motion Video Config
 * Drop your looping café video at: /public/assets/video/hero.mp4
 */
export const HERO_VIDEO_CONFIG = {
  videoSrc: '/assets/video/willow-cafe-film.mp4',
  fallbackVideoSrc: '/assets/video/hero.mp4',
  posterSrc: heroCourtyardImg,
};

export interface CafeVideoChapter {
  id: string;
  num: string;
  label: string;
  startSec: number;
  caption: string;
}

export const CAFE_VIDEO_CHAPTERS: CafeVideoChapter[] = [
  {
    id: 'courtyard',
    num: '01',
    label: 'Courtyard',
    startSec: 0,
    caption: 'Morning brick arches, steaming latte & courtyard greenery',
  },
  {
    id: 'roastery',
    num: '02',
    label: 'Roastery',
    startSec: 4,
    caption: '5kg cast-iron micro-lot roaster & morning sunbeams',
  },
  {
    id: 'library',
    num: '03',
    label: 'Reading Nook',
    startSec: 8,
    caption: 'Salvaged walnut bookshelves & 33⅓ RPM turntable',
  },
  {
    id: 'evening',
    num: '04',
    label: 'Candlelit Dusk',
    startSec: 12,
    caption: 'Brick vaults by candlelight & warm tube hi-fi',
  },
];

/**
 * Single Unified Dish Media Config: dishId -> { glb, image, depthMap, dropPhotoPath, hasSteam }
 * - Drop real 3D GLB files in:   /public/assets/models/<dish-id>.glb
 * - Drop dish photos in:         /public/assets/dishes/<dish-id>.jpg
 * - Drop optional depth maps in: /public/assets/depth/<dish-id>-depth.png
 */
export interface DishMediaEntry {
  glb: string;
  image: string;
  depthMap: string;
  dropPhotoPath: string;
  hasSteam: boolean;
  referenceSheet?: string;
}

export const DISH_MEDIA_CONFIG: Record<string, DishMediaEntry> = {
  'matcha-latte': {
    glb: '/assets/models/matcha-latte.glb',
    image: singleMatchaLatteImg,
    depthMap: '/assets/depth/matcha-latte-depth.png',
    dropPhotoPath: '/assets/dishes/matcha-latte-3q.png',
    hasSteam: true,
    referenceSheet: '/assets/dishes/matcha-latte-quad.png',
  },
  'blueberry-cheesecake': {
    glb: '/assets/models/blueberry-cheesecake.glb',
    image: singleBlueberryCheesecakeImg,
    depthMap: '/assets/depth/blueberry-cheesecake-depth.png',
    dropPhotoPath: '/assets/dishes/blueberry-cheesecake-3q.png',
    hasSteam: false,
    referenceSheet: '/assets/dishes/blueberry-cheesecake-quad.png',
  },
  'truffle-pasta': {
    glb: '/assets/models/truffle-pasta.glb',
    image: trufflePastaImg,
    depthMap: '/assets/depth/truffle-pasta-depth.png',
    dropPhotoPath: '/assets/dishes/truffle-pasta-3q.png',
    hasSteam: true,
    referenceSheet: '/assets/dishes/truffle-pasta-quad.png',
  },
  'cold-brew': {
    glb: '/assets/models/cold-brew.glb',
    image: singleColdBrewImg,
    depthMap: '/assets/depth/cold-brew-depth.png',
    dropPhotoPath: '/assets/dishes/cold-brew-3q.png',
    hasSteam: false,
    referenceSheet: '/assets/dishes/cold-brew-quad.png',
  },
  'avocado-toast': {
    glb: '/assets/models/avocado-toast.glb',
    image: '/assets/aistudio/Rustic_Avocado_Toast_with_Runny_Egg_edf32a26.png',
    depthMap: '/assets/depth/avocado-toast-depth.png',
    dropPhotoPath: '/assets/dishes/avocado-toast.jpg',
    hasSteam: true,
    referenceSheet: '/assets/aistudio/Quad-View_Avocado_Toast_with_Poached_Egg_a4af8684.png',
  },
  'willow-cortado': {
    glb: '/assets/models/willow-cortado.glb',
    image: singleHoneyCortadoImg,
    depthMap: '/assets/depth/willow-cortado-depth.png',
    dropPhotoPath: '/assets/dishes/willow-cortado-3q.png',
    hasSteam: true,
    referenceSheet: '/assets/dishes/willow-cortado-quad.png',
  },
  'margherita-pizza': {
    glb: '/assets/models/margherita-pizza.glb',
    image: neapolitanPizzaImg,
    depthMap: '/assets/depth/margherita-pizza-depth.png',
    dropPhotoPath: '/assets/dishes/margherita-pizza-3q.png',
    hasSteam: true,
    referenceSheet: '/assets/dishes/margherita-pizza-quad.png',
  },
  'cardamom-knot': {
    glb: '/assets/models/cardamom-knot.glb',
    image: singleCardamomKnotImg,
    depthMap: '/assets/depth/cardamom-knot-depth.png',
    dropPhotoPath: '/assets/dishes/cardamom-knot-3q.png',
    hasSteam: true,
    referenceSheet: '/assets/dishes/cardamom-knot-quad.png',
  },
  'pourover-geisha': {
    glb: '/assets/models/pourover-geisha.glb',
    image: '/assets/dishes/pourover-geisha-3q.png',
    depthMap: '/assets/depth/pourover-geisha-depth.png',
    dropPhotoPath: '/assets/dishes/pourover-geisha-3q.png',
    hasSteam: true,
    referenceSheet: '/assets/dishes/pourover-geisha-quad.png',
  },
  'hibiscus-spritz': {
    glb: '/assets/models/hibiscus-spritz.glb',
    image: '/assets/dishes/hibiscus-spritz-3q.png',
    depthMap: '/assets/depth/hibiscus-spritz-depth.png',
    dropPhotoPath: '/assets/dishes/hibiscus-spritz-3q.png',
    hasSteam: false,
    referenceSheet: '/assets/dishes/hibiscus-spritz-quad.png',
  },
  'acai-bowl': {
    glb: '/assets/models/acai-bowl.glb',
    image: '/assets/dishes/acai-bowl-3q.png',
    depthMap: '/assets/depth/acai-bowl-depth.png',
    dropPhotoPath: '/assets/dishes/acai-bowl-3q.png',
    hasSteam: false,
    referenceSheet: '/assets/dishes/acai-bowl-quad.png',
  },
  'tuscan-panini': {
    glb: '/assets/models/tuscan-panini.glb',
    image: '/assets/dishes/tuscan-panini-3q.png',
    depthMap: '/assets/depth/tuscan-panini-depth.png',
    dropPhotoPath: '/assets/dishes/tuscan-panini-3q.png',
    hasSteam: true,
    referenceSheet: '/assets/dishes/tuscan-panini-quad.png',
  },
  'burrata-fig-pizza': {
    glb: '/assets/models/burrata-fig-pizza.glb',
    image: '/assets/dishes/burrata-fig-pizza-3q.png',
    depthMap: '/assets/depth/burrata-fig-pizza-depth.png',
    dropPhotoPath: '/assets/dishes/burrata-fig-pizza-3q.png',
    hasSteam: true,
    referenceSheet: '/assets/dishes/burrata-fig-pizza-quad.png',
  },
  'skillet-brownie': {
    glb: '/assets/models/skillet-brownie.glb',
    image: '/assets/dishes/skillet-brownie-3q.png',
    depthMap: '/assets/depth/skillet-brownie-depth.png',
    dropPhotoPath: '/assets/dishes/skillet-brownie-3q.png',
    hasSteam: true,
    referenceSheet: '/assets/dishes/skillet-brownie-quad.png',
  },
  'almond-croissant': {
    glb: '/assets/models/almond-croissant.glb',
    image: '/assets/dishes/almond-croissant-3q.png',
    depthMap: '/assets/depth/almond-croissant-depth.png',
    dropPhotoPath: '/assets/dishes/almond-croissant-3q.png',
    hasSteam: true,
    referenceSheet: '/assets/dishes/almond-croissant-quad.png',
  },
};

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';

export const CURRENCIES: Record<CurrencyCode, { symbol: string; rate: number; label: string }> = {
  INR: { symbol: '₹', rate: 1, label: '₹ INR' },
  USD: { symbol: '$', rate: 0.018, label: '$ USD' },
  EUR: { symbol: '€', rate: 0.016, label: '€ EUR' },
  GBP: { symbol: '£', rate: 0.014, label: '£ GBP' },
};

export const BRAND_CONFIG = {
  name: 'The Willow Café',
  tagline: 'Coffee · Food · Books',
  sloganPrimary: 'Good Food. Better Days.',
  sloganSecondary: 'Good Food. Better Music.',
  address: '88 Willow Green Arcade, Inner Brick Courtyard, Indiranagar, Bengaluru 560038',
  shortAddress: '88 Willow Green Arcade, Inner Courtyard',
  phone: '+91 98765 43210',
  whatsappNumber: '919876543210',
  email: 'hello@thewillowcafe.in',
  instagram: '@thewillowcafe',
  spotify: 'The Willow Vinyl Room',
  wifi: 'willow_courtyard / slowdays',
  coordinates: { lat: 12.9784, lng: 77.6408 },
  seasonalBanner: 'Autumn Harvest at Willow: Spiced Fig Sourdough Tartine & Kyoto First-Flush Hojicha poured daily until 6 PM.',
};

export interface DaySchedule {
  dayIndex: number; // 0 = Sunday ... 6 = Saturday
  dayName: string;
  openHour: number;
  closeHour: number; // 23 = 11 PM, 24 = Midnight
  displayHours: string;
  note: string;
}

export const WEEKLY_HOURS: DaySchedule[] = [
  { dayIndex: 1, dayName: 'Monday', openHour: 8, closeHour: 23, displayHours: '08:00 AM – 11:00 PM', note: 'Quiet Reading Mornings' },
  { dayIndex: 2, dayName: 'Tuesday', openHour: 8, closeHour: 23, displayHours: '08:00 AM – 11:00 PM', note: '7 PM Analog Vinyl Side-A' },
  { dayIndex: 3, dayName: 'Wednesday', openHour: 8, closeHour: 23, displayHours: '08:00 AM – 11:00 PM', note: 'Roastery Cupping at 4 PM' },
  { dayIndex: 4, dayName: 'Thursday', openHour: 8, closeHour: 23, displayHours: '08:00 AM – 11:00 PM', note: 'Acoustic Courtyard Dusk' },
  { dayIndex: 5, dayName: 'Friday', openHour: 8, closeHour: 24, displayHours: '08:00 AM – Midnight', note: 'Late Jazz & Wood-Fired Pizza' },
  { dayIndex: 6, dayName: 'Saturday', openHour: 8, closeHour: 24, displayHours: '08:00 AM – Midnight', note: 'Sourdough Brunch & Vinyl' },
  { dayIndex: 0, dayName: 'Sunday', openHour: 8, closeHour: 23, displayHours: '08:00 AM – 11:00 PM', note: '5 PM Willow Book Circle' },
];

export type MenuCategory =
  | 'Coffee'
  | 'Matcha & Cold Drinks'
  | 'Breakfast'
  | 'Mains & Pasta'
  | 'Pizza'
  | 'Desserts'
  | 'Bakery';

export type DietaryTag = 'Veg' | 'Vegan' | 'Gluten-Free';

export type DishModelKind =
  | 'matcha'
  | 'cheesecake'
  | 'pasta'
  | 'coldbrew'
  | 'avocado'
  | 'pizza'
  | 'latte'
  | 'bakery';

export interface MenuItem {
  id: string;
  name: string;
  shortLabel?: string;
  category: MenuCategory;
  priceInr: number;
  dietary: DietaryTag[];
  isDailySpecial?: boolean;
  calories: string;
  prepTime: string;
  description: string;
  ingredients: string[];
  pairedWithId: string;
  pairedWithLabel: string;
  image: string;
  glb: string;
  depthMap: string;
  dropPhotoPath: string;
  hasSteam: boolean;
  referenceSheet?: string;
  modelKind: DishModelKind;
  accentHex: string;
}

export const MENU_CATEGORIES: MenuCategory[] = [
  'Coffee',
  'Matcha & Cold Drinks',
  'Breakfast',
  'Mains & Pasta',
  'Pizza',
  'Desserts',
  'Bakery',
];

function mediaFor(id: string): DishMediaEntry {
  return (
    DISH_MEDIA_CONFIG[id] || {
      glb: `/assets/models/${id}.glb`,
      image: '',
      depthMap: `/assets/depth/${id}-depth.png`,
      dropPhotoPath: `/assets/dishes/${id}.jpg`,
      hasSteam: false,
    }
  );
}

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'matcha-latte',
    name: 'Ceremonial Uji Matcha Latte',
    shortLabel: 'Matcha Latte',
    category: 'Matcha & Cold Drinks',
    priceInr: 280,
    dietary: ['Veg', 'Vegan', 'Gluten-Free'],
    isDailySpecial: true,
    calories: '140 kcal',
    prepTime: '4 min',
    description:
      'First-harvest stone-ground Kyoto Uji matcha hand-whisked with bamboo chasen over velvety steamed oat milk and wildflower blossom notes.',
    ingredients: ['Kyoto Uji Matcha', 'Barista Oat Milk', 'Raw Acacia Honey (optional)', 'Microfoam Rosette'],
    pairedWithId: 'blueberry-cheesecake',
    pairedWithLabel: 'Blueberry Cheesecake',
    ...mediaFor('matcha-latte'),
    modelKind: 'matcha',
    accentHex: '#6E8B57',
  },
  {
    id: 'blueberry-cheesecake',
    name: 'Wild Blueberry Basque Cheesecake',
    shortLabel: 'Blueberry Cheesecake',
    category: 'Desserts',
    priceInr: 320,
    dietary: ['Veg'],
    isDailySpecial: true,
    calories: '380 kcal',
    prepTime: 'Served chilled',
    description:
      'Creamy caramelized New York-meets-Basque cheesecake over toasted digestive butter crumb, crowned with simmering Nilgiri wild blueberries and garden mint.',
    ingredients: ['Cultured Cream Cheese', 'Wild Nilgiri Blueberries', 'Brown Butter Crumb', 'Madagascan Vanilla'],
    pairedWithId: 'cold-brew',
    pairedWithLabel: '18h Single-Origin Cold Brew',
    ...mediaFor('blueberry-cheesecake'),
    modelKind: 'cheesecake',
    accentHex: '#593B6B',
  },
  {
    id: 'truffle-pasta',
    name: 'Wild Mushroom & Truffle Tagliatelle',
    shortLabel: 'Truffle Pasta',
    category: 'Mains & Pasta',
    priceInr: 360,
    dietary: ['Veg'],
    isDailySpecial: true,
    calories: '510 kcal',
    prepTime: '14 min',
    description:
      'Hand-rolled golden egg tagliatelle ribbons tossed in Normandy cultured butter, roasted shiitake & chanterelles, 24-month Parmigiano, and white Alba truffle oil with charred country sourdough.',
    ingredients: ['Hand-Rolled Tagliatelle', 'Foraged Mushrooms', 'White Truffle Oil', '24m Parmigiano'],
    pairedWithId: 'hibiscus-spritz',
    pairedWithLabel: 'Pomegranate Hibiscus Spritz',
    ...mediaFor('truffle-pasta'),
    modelKind: 'pasta',
    accentHex: '#C9893B',
  },
  {
    id: 'cold-brew',
    name: '18h Single-Origin Cold Brew',
    shortLabel: 'Cold Brew',
    category: 'Coffee',
    priceInr: 220,
    dietary: ['Veg', 'Vegan', 'Gluten-Free'],
    isDailySpecial: true,
    calories: '8 kcal',
    prepTime: '2 min',
    description:
      'Ethiopian Yirgacheffe natural-process beans steeped cold in filtered spring water for 18 hours. Silky body with bergamot, sun-dried peach, and dark cacao nib finish over a hand-carved crystal ice sphere.',
    ingredients: ['Yirgacheffe Lot #14', '18-Hour Cold Immersion', 'Hand-Carved Crystal Ice', 'Orange Peel Twist'],
    pairedWithId: 'avocado-toast',
    pairedWithLabel: 'Avocado & Poached Egg Tartine',
    ...mediaFor('cold-brew'),
    modelKind: 'coldbrew',
    accentHex: '#7B4620',
  },
  {
    id: 'avocado-toast',
    name: 'Avocado & Poached Egg Tartine',
    shortLabel: 'Avocado Toast',
    category: 'Breakfast',
    priceInr: 290,
    dietary: ['Veg'],
    isDailySpecial: true,
    calories: '340 kcal',
    prepTime: '9 min',
    description:
      'Crushed ripe Hass avocado with sea salt & lemon zest, pasture-raised 6-minute poached egg, whipped feta, toasted za’atar, and micro-herbs on thick 48-hour country sourdough.',
    ingredients: ['48h Country Sourdough', 'Hass Avocado', 'Pasture-Raised Egg', 'Roasted Za’atar & Microgreens'],
    pairedWithId: 'willow-cortado',
    pairedWithLabel: 'Willow Signature Cortado',
    ...mediaFor('avocado-toast'),
    modelKind: 'avocado',
    accentHex: '#7A9652',
  },
  {
    id: 'willow-cortado',
    name: 'Willow Signature Honey Cortado',
    shortLabel: 'Honey Cortado',
    category: 'Coffee',
    priceInr: 210,
    dietary: ['Veg', 'Gluten-Free'],
    calories: '95 kcal',
    prepTime: '3 min',
    description:
      'Equal parts double ristretto from Chikmagalur shade-grown Arabica and textured silky milk with a whisper of raw forest honey and orange blossom.',
    ingredients: ['Chikmagalur Selection 795', 'Textured Whole or Oat Milk', 'Coorg Wildflower Honey'],
    pairedWithId: 'cardamom-knot',
    pairedWithLabel: 'Brown Butter Cardamom Knot',
    ...mediaFor('willow-cortado'),
    modelKind: 'latte',
    accentHex: '#9C6234',
  },
  {
    id: 'pourover-geisha',
    name: 'V60 Hand-Poured Huila Reserve',
    shortLabel: 'V60 Huila Pour-Over',
    category: 'Coffee',
    priceInr: 270,
    dietary: ['Veg', 'Vegan', 'Gluten-Free'],
    calories: '5 kcal',
    prepTime: '5 min',
    description:
      'Brewed tableside in ceramic Hario V60 at 93°C. Delicate jasmine aroma, ruby grapefruit clarity, and panela cane sweetness as it cools.',
    ingredients: ['Colombian Huila Anaerobic', '93°C Mineral-Balanced Water', 'Glass Sharing Carafe'],
    pairedWithId: 'almond-croissant',
    pairedWithLabel: 'Twice-Baked Frangipane Croissant',
    ...mediaFor('pourover-geisha'),
    modelKind: 'latte',
    accentHex: '#8E4B28',
  },
  {
    id: 'hibiscus-spritz',
    name: 'Pomegranate, Hibiscus & Mint Spritz',
    shortLabel: 'Hibiscus Spritz',
    category: 'Matcha & Cold Drinks',
    priceInr: 240,
    dietary: ['Veg', 'Vegan', 'Gluten-Free'],
    calories: '85 kcal',
    prepTime: '3 min',
    description:
      'Steeped ruby hibiscus petals, cold-pressed pomegranate juice, crushed courtyard mint, key lime, and botanical tonic over pebble ice.',
    ingredients: ['Dried Ruby Hibiscus', 'Cold-Pressed Pomegranate', 'Garden Mint', 'Botanical Tonic'],
    pairedWithId: 'margherita-pizza',
    pairedWithLabel: 'Neapolitan Margherita D.O.P',
    ...mediaFor('hibiscus-spritz'),
    modelKind: 'coldbrew',
    accentHex: '#9E2B3B',
  },
  {
    id: 'acai-bowl',
    name: 'Amazonian Acai & Toasted Pecan Bowl',
    shortLabel: 'Acai & Pecan Bowl',
    category: 'Breakfast',
    priceInr: 340,
    dietary: ['Veg', 'Vegan', 'Gluten-Free'],
    calories: '295 kcal',
    prepTime: '7 min',
    description:
      'Velvety organic acai & blackberry base layered with maple-toasted pecan granola, chia-coconut pudding, caramelized banana coins, and cacao nibs.',
    ingredients: ['Organic Acai Berry', 'Maple Pecan Granola', 'Coconut Chia', 'Fresh Berries'],
    pairedWithId: 'matcha-latte',
    pairedWithLabel: 'Ceremonial Uji Matcha Latte',
    ...mediaFor('acai-bowl'),
    modelKind: 'cheesecake',
    accentHex: '#6C3461',
  },
  {
    id: 'tuscan-panini',
    name: 'Tuscan Focaccia & Smoked Provolone Press',
    shortLabel: 'Tuscan Focaccia Press',
    category: 'Mains & Pasta',
    priceInr: 310,
    dietary: ['Veg'],
    calories: '460 kcal',
    prepTime: '11 min',
    description:
      'Char-grilled courgette ribbons, sun-blushed heirloom tomatoes, melted smoked provolone, and pistachio-basil pesto pressed crisp inside sea-salt rosemary focaccia.',
    ingredients: ['Rosemary Sea-Salt Focaccia', 'Smoked Provolone', 'Pistachio Basil Pesto', 'Heirloom Tomatoes'],
    pairedWithId: 'cold-brew',
    pairedWithLabel: '18h Single-Origin Cold Brew',
    ...mediaFor('tuscan-panini'),
    modelKind: 'avocado',
    accentHex: '#B67B38',
  },
  {
    id: 'margherita-pizza',
    name: 'Wood-Fired Neapolitan Margherita D.O.P',
    shortLabel: 'Neapolitan Margherita Pizza',
    category: 'Pizza',
    priceInr: 420,
    dietary: ['Veg'],
    calories: '620 kcal',
    prepTime: '12 min',
    description:
      'Leopard-spotted 48-hour sourdough crust baked at 450°C with crushed San Marzano plum tomatoes, creamy Fior di Latte mozzarella, sweet basil, and Ligurian extra-virgin olive oil.',
    ingredients: ['48h Sourdough Dough', 'San Marzano D.O.P', 'Fresh Fior di Latte', 'Sweet Courtyard Basil'],
    pairedWithId: 'hibiscus-spritz',
    pairedWithLabel: 'Pomegranate Hibiscus Spritz',
    ...mediaFor('margherita-pizza'),
    modelKind: 'pizza',
    accentHex: '#C2462D',
  },
  {
    id: 'burrata-fig-pizza',
    name: 'Black Fig, Hot Honey & Burrata Bianca',
    shortLabel: 'Fig & Burrata Pizza',
    category: 'Pizza',
    priceInr: 480,
    dietary: ['Veg'],
    calories: '670 kcal',
    prepTime: '13 min',
    description:
      'White sourdough pie blistered with garlic confit olive oil, torn Pugliese burrata, roasted black mission figs, wild rocket, toasted walnuts, and chili-infused wildflower honey.',
    ingredients: ['Fresh Burrata', 'Roasted Black Figs', 'Chili Wildflower Honey', 'Toasted Walnuts & Rocket'],
    pairedWithId: 'pourover-geisha',
    pairedWithLabel: 'V60 Hand-Poured Huila Reserve',
    ...mediaFor('burrata-fig-pizza'),
    modelKind: 'pizza',
    accentHex: '#9A5B32',
  },
  {
    id: 'skillet-brownie',
    name: 'Valrhona 70% Warm Skillet Brownie',
    shortLabel: 'Warm Skillet Brownie',
    category: 'Desserts',
    priceInr: 290,
    dietary: ['Veg', 'Gluten-Free'],
    calories: '430 kcal',
    prepTime: '8 min',
    description:
      'Warm molten-centered dark chocolate almond-flour brownie studded with roasted Piedmont hazelnuts, Maldon sea salt flakes, and a scoop of vanilla bean gelato.',
    ingredients: ['Valrhona Guanaja 70%', 'Almond Flour (GF)', 'Roasted Hazelnuts', 'Vanilla Bean Gelato'],
    pairedWithId: 'willow-cortado',
    pairedWithLabel: 'Willow Signature Honey Cortado',
    ...mediaFor('skillet-brownie'),
    modelKind: 'bakery',
    accentHex: '#4A2C1D',
  },
  {
    id: 'cardamom-knot',
    name: 'Brown Butter & Green Cardamom Knot',
    shortLabel: 'Cardamom Knot',
    category: 'Bakery',
    priceInr: 190,
    dietary: ['Veg'],
    calories: '290 kcal',
    prepTime: 'Baked at 8 AM & 3 PM',
    description:
      'Scandinavian-style braided brioche laminated with nutty browned butter, freshly mortared Malabar green cardamom pods, and pearl sugar glaze.',
    ingredients: ['Brioche Dough', 'Malabar Green Cardamom', 'Cultured Brown Butter', 'Pearl Sugar'],
    pairedWithId: 'willow-cortado',
    pairedWithLabel: 'Willow Signature Honey Cortado',
    ...mediaFor('cardamom-knot'),
    modelKind: 'bakery',
    accentHex: '#C9893B',
  },
  {
    id: 'almond-croissant',
    name: 'Twice-Baked Roasted Almond Croissant',
    shortLabel: 'Almond Croissant',
    category: 'Bakery',
    priceInr: 230,
    dietary: ['Veg'],
    calories: '360 kcal',
    prepTime: 'Baked fresh',
    description:
      '27-layer French butter viennoiserie soaked lightly in orange-blossom espresso syrup, filled and crowned with dark-roasted almond frangipane and flaked almonds.',
    ingredients: ['Isigny-Style Butter Pastry', 'Roasted Almond Frangipane', 'Orange Blossom Syrup'],
    pairedWithId: 'pourover-geisha',
    pairedWithLabel: 'V60 Hand-Poured Huila Reserve',
    ...mediaFor('almond-croissant'),
    modelKind: 'bakery',
    accentHex: '#B97A3D',
  },
];

/**
 * 360° Immersive Viewer Configuration ("Step Inside The Willow")
 * - Drop 4K equirectangular video at: /public/assets/video/tour-360.mp4
 * - Drop mobile 360° video at:        /public/assets/video/tour-360-mobile.mp4
 * - Drop 360° scene stills at:        /public/assets/360/<scene-id>.jpg
 */
export const TOUR_360_VIDEO_CONFIG = {
  desktop4kSrc: '/assets/video/tour-360.mp4',
  mobileSrc: '/assets/video/tour-360-mobile.mp4',
};

export interface PanoHotspot {
  id: string;
  yaw: number;   // Horizontal degrees (-180..180)
  pitch: number; // Vertical degrees (-45..45)
  badge: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaTo: string;
}

export interface Cafe360Scene {
  id: 'exterior' | 'main-hall' | 'reading-nook' | 'vinyl-corner' | 'terrace' | 'dessert-counter';
  num: string;
  shortName: string;
  name: string;
  subtitle: string;
  story: string;
  acousticDetail: string;
  lightingDetail: string;
  seatingCount: string;
  /** Primary user drop path for real 360° equirectangular photograph */
  panoSrc: string;
  /** Built-in equirectangular panorama used until user drops /public/assets/360/<id>.jpg */
  fallbackPanoSrc: string;
  thumbnail: string;
  initialYaw: number;
  initialPitch: number;
  tintHex: string;
  hotspots: PanoHotspot[];
}

export const CAFE_360_SCENES: Cafe360Scene[] = [
  {
    id: 'exterior',
    num: '01',
    shortName: 'Exterior',
    name: 'The Arched Brick Exterior',
    subtitle: 'Restored 1924 kiln-fired brick arches & courtyard olive trees',
    story:
      'Walking beneath the ivy-draped stone arch quiets street noise almost immediately. Our hand-lettered chalkboard sits beside reclaimed teak benches where regulars pause with morning espressos.',
    acousticDetail: 'Distant courtyard fountain & burr grinder hum',
    lightingDetail: 'East-facing morning shafts across terracotta tile',
    seatingCount: '8 patio bistro seats',
    panoSrc: '/assets/360/exterior.jpg',
    fallbackPanoSrc: '/assets/360/exterior.jpg',
    thumbnail: heroCourtyardImg,
    initialYaw: 0,
    initialPitch: 2,
    tintHex: '#FFF8F0',
    hotspots: [
      {
        id: 'hs-ext-chalkboard',
        yaw: -14,
        pitch: -6,
        badge: 'Today’s Specials',
        title: 'Courtyard Chalkboard Menu',
        description: 'Ceremonial Uji Matcha Latte, Wild Blueberry Basque Cheesecake, and 48-hour sourdough tartines chalked fresh at 8 AM.',
        ctaLabel: 'Browse Daily Specials',
        ctaTo: '/menu',
      },
      {
        id: 'hs-ext-arch',
        yaw: 36,
        pitch: 8,
        badge: '1924 Heritage',
        title: 'Restored Letterpress Archway',
        description: 'Original kiln-fired brick masonry preserved from the 1924 print-yard that inspired our Story & lending library.',
        ctaLabel: 'Read Our Story',
        ctaTo: '/story',
      },
    ],
  },
  {
    id: 'main-hall',
    num: '02',
    shortName: 'Main Hall',
    name: 'The Arched Main Hall',
    subtitle: 'Sunlit walnut tables, brass pendants & espresso hearth',
    story:
      'Under vaulted brick arches and warm 2700K pendants, long salvaged-walnut tables bring together morning writers, sketchbook artists, and friends sharing hand-rolled truffle tagliatelle.',
    acousticDetail: 'Gentle espresso steam wand, clinking stoneware & low jazz',
    lightingDetail: 'Arched casement sunbeams meeting warm Edison brass glow',
    seatingCount: '18 arch-hall dining seats',
    panoSrc: '/assets/360/main-hall.jpg',
    fallbackPanoSrc: '/assets/360/main-hall.jpg',
    thumbnail: pano360InteriorImg,
    initialYaw: 0,
    initialPitch: 0,
    tintHex: '#FFF8EE',
    hotspots: [
      {
        id: 'hs-hall-bar',
        yaw: 12,
        pitch: -4,
        badge: 'Roastery Bar',
        title: 'Dual-Boiler Espresso & V60 Station',
        description: 'Pulling shade-grown Chikmagalur Selection 795 cortados and 93°C Colombian Huila pour-overs to order.',
        ctaLabel: 'Explore Coffee Menu',
        ctaTo: '/menu',
      },
      {
        id: 'hs-hall-window',
        yaw: -52,
        pitch: 3,
        badge: 'Window Two-Tops',
        title: 'Arched Window Tables T1 & T2',
        description: 'Our most requested morning seats bathed in golden east light with discreet brass power outlets underneath.',
        ctaLabel: 'Reserve Window Seat',
        ctaTo: '/reservations',
      },
    ],
  },
  {
    id: 'reading-nook',
    num: '03',
    shortName: 'Reading Nook',
    name: 'The Walnut Reading Nook',
    subtitle: 'Floor-to-ceiling salvaged walnut shelves & emerald velvet armchairs',
    story:
      'Over 240 dog-eared novels, essays, and cookbooks line our salvaged walnut shelves. Shaded brass reading lamps cast warm pools over deep forest armchairs built for unhurried chapters.',
    acousticDetail: 'Turning pages, soft rain on arched glass, hushed conversation',
    lightingDetail: '2700K shaded brass reading lamps & filtered window glow',
    seatingCount: '12 quiet reading & study seats',
    panoSrc: '/assets/360/reading-nook.jpg',
    fallbackPanoSrc: '/assets/360/reading-nook.jpg',
    thumbnail: readingVinylImg,
    initialYaw: -90,
    initialPitch: 2,
    tintHex: '#FFF9F0',
    hotspots: [
      {
        id: 'hs-nook-books',
        yaw: -108,
        pitch: 6,
        badge: 'Books on Shelf',
        title: 'Shelf B — Staff Picks & Lending Library',
        description: 'Featuring Tanizaki’s In Praise of Shadows, Murakami’s Kafka on the Shore, Rick Rubin’s The Creative Act, and 240+ borrowable titles.',
        ctaLabel: 'Pull a Book From the Shelf',
        ctaTo: '/books-music',
      },
      {
        id: 'hs-nook-booth',
        yaw: -68,
        pitch: -8,
        badge: 'Quiet Corner',
        title: 'Emerald Study Booth N2',
        description: 'Acoustic velvet alcove tucked beside the philosophy and culinary shelves—ideal for two hours with a V60 carafe.',
        ctaLabel: 'Book Nook Seat',
        ctaTo: '/reservations',
      },
    ],
  },
  {
    id: 'vinyl-corner',
    num: '04',
    shortName: 'Vinyl Corner',
    name: 'The Analog Vinyl Corner',
    subtitle: 'Vintage wooden turntable, tube warmth & curated LP crates',
    story:
      'Every afternoon our baristas drop the needle on 1970s Japanese jazz, Bill Evans trios, or warm acoustic folk. Guests are welcome to flip through the "Today’s Rotation" crate and request Side B.',
    acousticDetail: '33⅓ RPM warm analog horns, upright bass & subtle needle crackle',
    lightingDetail: 'Warm vacuum-tube glow & amber Edison filaments',
    seatingCount: '10 lounge & banquette seats',
    panoSrc: '/assets/360/vinyl-corner.jpg',
    fallbackPanoSrc: '/assets/360/vinyl-corner.jpg',
    thumbnail: nightAmbianceImg,
    initialYaw: 112,
    initialPitch: -2,
    tintHex: '#FFF5E8',
    hotspots: [
      {
        id: 'hs-vinyl-turntable',
        yaw: 120,
        pitch: -5,
        badge: 'Vinyl Collection',
        title: '1976 Direct-Drive Turntable & LP Crate',
        description: '48+ analog pressings from Tokyo jazz trios to acoustic chamber folk. Spin the interactive turntable live on our Books & Music page.',
        ctaLabel: 'Drop the Needle',
        ctaTo: '/books-music',
      },
      {
        id: 'hs-vinyl-banquette',
        yaw: 82,
        pitch: -7,
        badge: 'Evening Supper',
        title: 'Forest Velvet Banquette T3',
        description: 'Front-row warmth for Tuesday full-album listening nights and Thursday candlelit cello duos.',
        ctaLabel: 'Reserve Vinyl Banquette',
        ctaTo: '/reservations',
      },
    ],
  },
  {
    id: 'terrace',
    num: '05',
    shortName: 'Terrace',
    name: 'The Sunlit Willow Terrace',
    subtitle: 'Glass conservatory pergola beneath hanging ivy & weeping willow',
    story:
      'Dappled golden-hour light filters through trailing pothos, ferns, and our namesake forty-year-old weeping willow tree. Long reclaimed-walnut tables invite Sunday sourdough feasts.',
    acousticDetail: 'Breeze through willow leaves & clinking iced glasses',
    lightingDetail: 'Open skylight diffused by lush botanical canopy',
    seatingCount: '22 garden & communal seats',
    panoSrc: '/assets/360/terrace.jpg',
    fallbackPanoSrc: '/assets/360/terrace.jpg',
    thumbnail: pano360TerraceImg,
    initialYaw: 24,
    initialPitch: 3,
    tintHex: '#F9F8EF',
    hotspots: [
      {
        id: 'hs-terrace-willow',
        yaw: 18,
        pitch: 14,
        badge: 'Namesake Canopy',
        title: 'The 40-Year-Old Weeping Willow',
        description: 'Growing in the courtyard long before we restored the print-yard—strung with warm fairy lights after dusk.',
        ctaLabel: 'Book Willow Tree Table G1',
        ctaTo: '/reservations',
      },
      {
        id: 'hs-terrace-brunch',
        yaw: -22,
        pitch: -8,
        badge: 'Brunch Ritual',
        title: 'Avocado Tartine & 18h Cold Brew',
        description: 'Served outdoors from 8 AM on handmade stoneware alongside freshly squeezed botanical spritzes.',
        ctaLabel: 'Order From Terrace Menu',
        ctaTo: '/menu',
      },
    ],
  },
  {
    id: 'dessert-counter',
    num: '06',
    shortName: 'Dessert Counter',
    name: 'The Travertine Dessert Counter',
    subtitle: 'Pastry slab, wild blueberry Basque cakes & warm cardamom aroma',
    story:
      'At the heart of the café, our bakers glaze warm brown-butter cardamom knots and slice caramelized Basque cheesecakes beside glass cloches and micro-lot coffee tins.',
    acousticDetail: 'Crisp pastry knife on walnut & morning espresso extraction',
    lightingDetail: 'Focused gallery spotlights over travertine & ceramic glazes',
    seatingCount: '6 barista bar stools',
    panoSrc: '/assets/360/dessert-counter.jpg',
    fallbackPanoSrc: '/assets/360/dessert-counter.jpg',
    thumbnail: roasteryBeansImg,
    initialYaw: 46,
    initialPitch: -2,
    tintHex: '#FFF7EC',
    hotspots: [
      {
        id: 'hs-dessert-cheesecake',
        yaw: 42,
        pitch: -8,
        badge: 'Today’s Bake',
        title: 'Wild Blueberry Basque Cheesecake & Cardamom Knots',
        description: 'Baked in small batches at 8 AM and 3 PM. Inspect every pastry in interactive 3D on our tasting menu.',
        ctaLabel: 'Inspect Pastries in 3D',
        ctaTo: '/menu',
      },
      {
        id: 'hs-dessert-beans',
        yaw: 74,
        pitch: 2,
        badge: 'Take Home',
        title: '250g Whole-Bean Estate Tins',
        description: 'Freshly roasted Ratnagiri Chikmagalur and Worka Yirgacheffe harvests ground to your brew method.',
        ctaLabel: 'Explore Bean Origins',
        ctaTo: '/story',
      },
    ],
  },
];

export interface BookPick {
  id: string;
  title: string;
  author: string;
  genre: string;
  spineColor: string;
  textColor: string;
  heightClass: string;
  quote: string;
  ourPickNote: string;
  pairedDrink: string;
  pages: number;
}

export const BOOKSHELF_PICKS: BookPick[] = [
  {
    id: 'atomic-habits',
    title: 'Atomic Habits',
    author: 'James Clear',
    genre: 'Craft & Ritual',
    spineColor: '#2A1D14',
    textColor: '#F4EDE0',
    heightClass: 'h-64',
    quote: 'You do not rise to the level of your goals. You fall to the level of your systems.',
    ourPickNote:
      'The most-borrowed morning volume on Shelf B. Regulars love reading a single chapter alongside an 8:30 AM cortado before opening their notebooks.',
    pairedDrink: 'Willow Signature Honey Cortado',
    pages: 320,
  },
  {
    id: 'in-praise-of-shadows',
    title: 'In Praise of Shadows',
    author: 'Jun’ichirō Tanizaki',
    genre: 'Aesthetics & Architecture',
    spineColor: '#1F2E26',
    textColor: '#E8DEC8',
    heightClass: 'h-56',
    quote: 'Were it not for shadows, there would be no beauty.',
    ourPickNote:
      'A slender 70-page meditation on warm lacquerware, dim amber light, and quiet rooms—the philosophical blueprint behind our evening lighting.',
    pairedDrink: 'Ceremonial Uji Matcha Latte',
    pages: 73,
  },
  {
    id: 'creative-act',
    title: 'The Creative Act',
    author: 'Rick Rubin',
    genre: 'Music & Listening',
    spineColor: '#EAE0CE',
    textColor: '#2A1D14',
    heightClass: 'h-68',
    quote: 'Look for what you notice but no one else sees.',
    ourPickNote:
      'Open to any page during our Tuesday vinyl sessions. Each short vignette pairs effortlessly with slow-poured Ethiopian filter coffee.',
    pairedDrink: 'V60 Hand-Poured Huila Reserve',
    pages: 432,
  },
  {
    id: 'kafka-shore',
    title: 'Kafka on the Shore',
    author: 'Haruki Murakami',
    genre: 'Literary Fiction',
    spineColor: '#6B3424',
    textColor: '#FAF6F0',
    heightClass: 'h-64',
    quote: 'Everyone has a quiet library inside them where time forgets to hurry.',
    ourPickNote:
      'Cats, jazz records, quiet libraries, and rain—Murakami feels like he wrote half of this novel sitting in our emerald corner armchair.',
    pairedDrink: '18h Single-Origin Cold Brew',
    pages: 467,
  },
  {
    id: 'salt-fat-acid-heat',
    title: 'Salt, Fat, Acid, Heat',
    author: 'Samin Nosrat',
    genre: 'Culinary Craft',
    spineColor: '#C9893B',
    textColor: '#14100C',
    heightClass: 'h-72',
    quote: 'Let your senses guide you at the stove rather than rigid timers.',
    ourPickNote:
      'Wendy MacNaughton’s watercolor illustrations make this a joy to leaf through while waiting for our wood-fired Margherita D.O.P.',
    pairedDrink: 'Pomegranate, Hibiscus & Mint Spritz',
    pages: 480,
  },
  {
    id: 'braiding-sweetgrass',
    title: 'Braiding Sweetgrass',
    author: 'Robin Wall Kimmerer',
    genre: 'Botany & Earth',
    spineColor: '#52644A',
    textColor: '#FAF6F0',
    heightClass: 'h-60',
    quote: 'Paying attention is a form of reciprocity with the living world.',
    ourPickNote:
      'Read this out on the sunlit pergola terrace surrounded by ferns and willow branches. Grounding, generous, and deeply restorative.',
    pairedDrink: 'Ceremonial Uji Matcha Latte',
    pages: 390,
  },
  {
    id: 'kitchen-confidential',
    title: 'Kitchen Confidential',
    author: 'Anthony Bourdain',
    genre: 'Memoir',
    spineColor: '#3D2B1F',
    textColor: '#E5A558',
    heightClass: 'h-62',
    quote: 'Good food is very often, even most often, simple food.',
    ourPickNote:
      'Annotated in pencil by our head baker! Raw, hilarious, and devoted to honest ingredients over culinary pretension.',
    pairedDrink: '18h Single-Origin Cold Brew',
    pages: 312,
  },
];

export type VinylMusicStyle =
  | 'warm-jazz'
  | 'lofi-tape'
  | 'bossa-courtyard'
  | 'felt-piano'
  | 'rainy-ambient';

export interface VinylMusicStyleConfig {
  id: VinylMusicStyle;
  label: string;
  shortLabel: string;
  description: string;
  timbreNote: string;
  accentHex: string;
}

export const VINYL_MUSIC_STYLES: VinylMusicStyleConfig[] = [
  {
    id: 'warm-jazz',
    label: 'Warm Rhodes Jazz',
    shortLabel: 'Rhodes Jazz',
    description: 'Velvet electric piano chords, upright bass root pulse, and light jazz brush swing.',
    timbreNote: '70s Tube Trio · Rolled Seventh Voicings',
    accentHex: '#C9893B',
  },
  {
    id: 'lofi-tape',
    label: 'Lo-Fi Study Tape',
    shortLabel: 'Lo-Fi Tape',
    description: 'Softly detuned cassette flutter, muted boom-bap dust kick, and warm low-pass rolloff.',
    timbreNote: 'Cassette Wow · Muted Pocket Groove',
    accentHex: '#B67B38',
  },
  {
    id: 'bossa-courtyard',
    label: 'Courtyard Bossa',
    shortLabel: 'Bossa Nova',
    description: 'Syncopated acoustic nylon-plucked arpeggios and sunlit Rio bass movement.',
    timbreNote: 'Clave Syncopation · Acoustic Plucked Timber',
    accentHex: '#6E7F63',
  },
  {
    id: 'felt-piano',
    label: 'Candlelit Felt Piano',
    shortLabel: 'Felt Piano',
    description: 'Intimate damped upright piano hammers with hushed room air and unhurried decay.',
    timbreNote: 'Intimate Hammer Dampening · Solo Study',
    accentHex: '#A67F5B',
  },
  {
    id: 'rainy-ambient',
    label: 'Rainy Window Pad',
    shortLabel: 'Rainy Ambient',
    description: 'Slow-blooming analog tape clouds layered beneath soft monsoon courtyard rain.',
    timbreNote: 'Monsoon Texture · Slow Harmonic Wash',
    accentHex: '#52644A',
  },
];

export interface VinylTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  year: string;
  duration: string;
  durationSec: number;
  keySignature: string;
  recommendedStyle: VinylMusicStyle;
  labelColor: string;
  chords: number[][]; // Frequencies in Hz for Web Audio synthesizer
  tempoMs: number;
}

export const VINYL_PLAYLIST: VinylTrack[] = [
  {
    id: 'track-1',
    title: 'Sunbeams on Walnut',
    artist: 'The Willow Quartet',
    album: 'Courtyard Sessions Vol. I',
    year: '1976 Pressing',
    duration: '04:12',
    durationSec: 252,
    keySignature: 'Dmaj9 · 72 BPM',
    recommendedStyle: 'warm-jazz',
    labelColor: '#C9893B',
    tempoMs: 3600,
    chords: [
      [146.83, 220.0, 277.18, 329.63, 440.0], // Dmaj9
      [123.47, 185.0, 220.0, 293.66, 369.99], // Bm9
      [164.81, 196.0, 246.94, 293.66, 392.0], // Em9
      [110.0, 164.81, 196.0, 277.18, 329.63], // A13
    ],
  },
  {
    id: 'track-2',
    title: 'Waltz for Kyoto Rain',
    artist: 'Haruto Sato Trio',
    album: 'Green Tea & Brass',
    year: '1979 Tokyo LP',
    duration: '05:04',
    durationSec: 304,
    keySignature: 'Fmaj7 · 66 BPM',
    recommendedStyle: 'rainy-ambient',
    labelColor: '#52644A',
    tempoMs: 4100,
    chords: [
      [174.61, 220.0, 261.63, 329.63, 392.0], // Fmaj9
      [146.83, 220.0, 261.63, 329.63, 440.0], // Dm9
      [196.0, 233.08, 293.66, 349.23, 440.0], // Gm9
      [130.81, 196.0, 233.08, 293.66, 329.63], // C9sus4
    ],
  },
  {
    id: 'track-3',
    title: 'Velvet Banquette Nocturne',
    artist: 'Clara Vance & Upright',
    album: 'After the Last Pour',
    year: '1968 Mono',
    duration: '03:48',
    durationSec: 228,
    keySignature: 'Ebmaj9 · 62 BPM',
    recommendedStyle: 'felt-piano',
    labelColor: '#7C3E29',
    tempoMs: 4400,
    chords: [
      [155.56, 196.0, 233.08, 293.66, 349.23], // Ebmaj9
      [130.81, 196.0, 233.08, 293.66, 392.0], // Cm9
      [174.61, 207.65, 261.63, 311.13, 392.0], // Fm9
      [116.54, 174.61, 207.65, 261.63, 349.23], // Bb13
    ],
  },
  {
    id: 'track-4',
    title: 'First Grinding at Eight',
    artist: 'Solstice Acoustic',
    album: 'Morning Parchment',
    year: '1982 Pressing',
    duration: '03:56',
    durationSec: 236,
    keySignature: 'Gmaj7 · 80 BPM',
    recommendedStyle: 'bossa-courtyard',
    labelColor: '#3B4F41',
    tempoMs: 3200,
    chords: [
      [196.0, 246.94, 293.66, 369.99, 440.0], // Gmaj9
      [164.81, 246.94, 293.66, 369.99, 493.88], // Em9
      [130.81, 196.0, 246.94, 293.66, 392.0], // Cmaj9
      [146.83, 220.0, 261.63, 329.63, 392.0], // D9sus4
    ],
  },
  {
    id: 'track-5',
    title: 'Cardamom & Cassette Dust',
    artist: 'Indiranagar Late Tape',
    album: 'Bookshop Side B',
    year: '1994 Lo-Fi Dub',
    duration: '03:32',
    durationSec: 212,
    keySignature: 'Am9 · 76 BPM',
    recommendedStyle: 'lofi-tape',
    labelColor: '#5B4332',
    tempoMs: 3350,
    chords: [
      [110.0, 164.81, 196.0, 246.94, 329.63], // Am9
      [146.83, 196.0, 220.0, 261.63, 349.23], // Dm9
      [196.0, 246.94, 293.66, 329.63, 440.0], // G13
      [130.81, 164.81, 196.0, 246.94, 293.66], // Cmaj9
    ],
  },
];

export interface CafeEvent {
  id: string;
  date: string;
  time: string;
  title: string;
  artist: string;
  genre: string;
  seatsLeft: number;
}

export const UPCOMING_EVENTS: CafeEvent[] = [
  {
    id: 'ev-1',
    date: 'Thu, Nov 12',
    time: '07:30 PM',
    title: 'Candlelit Cello & Acoustic Guitar Duo',
    artist: 'Mira Rao & Kabir Sen',
    genre: 'Chamber Folk & Jazz',
    seatsLeft: 8,
  },
  {
    id: 'ev-2',
    date: 'Sun, Nov 15',
    time: '05:00 PM',
    title: 'The Willow Reader Circle: Tanizaki & Murakami',
    artist: 'Hosted by Ananya Nair',
    genre: 'Book Club & Pour-Over Flight',
    seatsLeft: 11,
  },
  {
    id: 'ev-3',
    date: 'Tue, Nov 17',
    time: '08:00 PM',
    title: 'Full-Album Vinyl Listening: Tokyo 1979',
    artist: 'Selector Devraj Menon',
    genre: 'Analog Jazz Fusion LP',
    seatsLeft: 6,
  },
  {
    id: 'ev-4',
    date: 'Sat, Nov 21',
    time: '10:30 AM',
    title: 'Sourdough Starter & Hand-Rolled Pasta Workshop',
    artist: 'Chef Matteo Rossi',
    genre: 'Culinary Table Session',
    seatsLeft: 4,
  },
];

export interface SeatingTable {
  id: string;
  label: string;
  zone: 'Indoor Arch Hall' | 'Sunlit Terrace' | 'Quiet Reading Nook';
  seats: number;
  shape: 'round' | 'rect' | 'booth';
  x: number; // SVG percentage 0-100
  y: number;
  feature: string;
}

export const SEATING_TABLES: SeatingTable[] = [
  { id: 'T1', label: 'Arch Window 01', zone: 'Indoor Arch Hall', seats: 2, shape: 'round', x: 18, y: 26, feature: 'Golden morning window light · Power outlet' },
  { id: 'T2', label: 'Arch Window 02', zone: 'Indoor Arch Hall', seats: 2, shape: 'round', x: 18, y: 54, feature: 'Brick arch view · Intimate 2-top' },
  { id: 'T3', label: 'Vinyl Banquette', zone: 'Indoor Arch Hall', seats: 4, shape: 'booth', x: 42, y: 32, feature: 'Forest velvet banquette · Near turntable' },
  { id: 'T4', label: 'Roastery Table', zone: 'Indoor Arch Hall', seats: 4, shape: 'rect', x: 42, y: 64, feature: 'Views of espresso bar & pastry counter' },
  { id: 'N1', label: 'Walnut Shelf Corner', zone: 'Quiet Reading Nook', seats: 2, shape: 'round', x: 18, y: 82, feature: 'Brass reading lamp · Surrounded by books' },
  { id: 'N2', label: 'Emerald Study Booth', zone: 'Quiet Reading Nook', seats: 3, shape: 'booth', x: 44, y: 85, feature: 'Hushed acoustic zone · Dual outlets' },
  { id: 'G1', label: 'Willow Tree Table', zone: 'Sunlit Terrace', seats: 4, shape: 'round', x: 74, y: 26, feature: 'Beneath weeping willow canopy · Breeze' },
  { id: 'G2', label: 'Ivy Pergola Long', zone: 'Sunlit Terrace', seats: 6, shape: 'rect', x: 76, y: 54, feature: 'Reclaimed walnut communal table · Skylight' },
  { id: 'G3', label: 'Olive Courtyard Two', zone: 'Sunlit Terrace', seats: 2, shape: 'round', x: 74, y: 82, feature: 'Tucked beside terracotta olive pots' },
];

export const STORY_TIMELINE = [
  {
    year: '2021',
    season: 'Autumn',
    title: 'An Overgrown 1924 Brick Print-Yard',
    description:
      'We stumbled upon a forgotten letterpress courtyard with three intact brick arches, cracked skylight glass, and a forty-year-old weeping willow thriving in the rear garden.',
    image: CAFE_ASSETS.heroCourtyard,
  },
  {
    year: '2022',
    season: 'Spring',
    title: 'Salvaged Walnut & Two Hundred Books',
    description:
      'Local joiners milled fallen estate walnut into floor-to-ceiling shelves. Neighbours donated their most cherished novels in exchange for lifetime morning filter coffees.',
    image: CAFE_ASSETS.readingVinyl,
  },
  {
    year: '2023',
    season: 'Winter',
    title: 'The Cast-Iron Roaster & Sourdough Hearth',
    description:
      'We fired up our 5-kilo cast-iron micro-roaster and 48-hour sourdough deck oven, partnering directly with family coffee estates in Chikmagalur and Yirgacheffe.',
    image: CAFE_ASSETS.roasteryBeans,
  },
  {
    year: '2025',
    season: 'Dusk',
    title: 'Analog Turntables & Evening Supper',
    description:
      'What began as morning coffee grew into candlelit hand-rolled truffle pasta, wood-fired Neapolitan pies, and nightly 33⅓ RPM vinyl listening sessions.',
    image: CAFE_ASSETS.nightAmbiance,
  },
];

export const ORIGIN_SOURCES = [
  {
    id: 'chikmagalur',
    name: 'Ratnagiri Estate, Chikmagalur',
    country: 'India · 1,450m ASL',
    ingredient: 'House Espresso & Cortado Roast',
    coords: { x: 69, y: 53 },
    notes: 'Shade-grown under silver oak and pepper vines. Tasting notes of roasted almond butter, jaggery, and sweet mandarin.',
  },
  {
    id: 'yirgacheffe',
    name: 'Worka Cooperative, Yirgacheffe',
    country: 'Ethiopia · 2,050m ASL',
    ingredient: '18-Hour Slow Cold Brew & Filter',
    coords: { x: 57, y: 56 },
    notes: 'Sun-dried on raised African beds for 21 days. Crisp bergamot blossom, white peach, and dark cacao finish.',
  },
  {
    id: 'huila',
    name: 'Finca El Mirador, Huila',
    country: 'Colombia · 1,780m ASL',
    ingredient: 'V60 Hand-Poured Reserve',
    coords: { x: 28, y: 58 },
    notes: 'Small-holder Pink Bourbon varietal washed in mountain spring water. Bright ruby grapefruit and panela sweetness.',
  },
  {
    id: 'uji',
    name: 'Marukyu Micro-Lot, Uji Kyoto',
    country: 'Japan · First Harvest',
    ingredient: 'Ceremonial Stone-Ground Matcha',
    coords: { x: 84, y: 38 },
    notes: 'Tencha leaves shaded for three weeks before granite-mill grinding. Sweet umami without bitterness.',
  },
  {
    id: 'campania',
    name: 'Agro Sarnese-Nocerino, Campania',
    country: 'Italy · Volcanic Soil',
    ingredient: 'San Marzano D.O.P Tomatoes',
    coords: { x: 51, y: 36 },
    notes: 'Grown in Vesuvian volcanic soil for our 48-hour sourdough Neapolitan pizzas and roasted tomato basil bisque.',
  },
];

export const TEAM_MEMBERS = [
  {
    name: 'Aarav Kulkarni',
    role: 'Head Roaster & Co-Founder',
    specialty: 'Dialing 93°C V60 extractions & sourcing Chikmagalur micro-lots',
    favoriteBook: 'In Praise of Shadows — Tanizaki',
    image: CAFE_ASSETS.roasteryBeans,
  },
  {
    name: 'Elena Moretti',
    role: 'Artisan Baker & Pasta Chef',
    specialty: '48-hour wild sourdough fermentation & hand-cut egg tagliatelle',
    favoriteBook: 'Salt, Fat, Acid, Heat — Samin Nosrat',
    image: CAFE_ASSETS.trufflePasta,
  },
  {
    name: 'Rohan Deshmukh',
    role: 'Curator of Books & Vinyl',
    specialty: 'Maintaining 240+ shelf volumes & Tuesday Japanese jazz pressings',
    favoriteBook: 'Kafka on the Shore — Murakami',
    image: CAFE_ASSETS.readingVinyl,
  },
];

export const GUEST_REVIEWS = [
  {
    quote:
      'I came in at 9 AM with a notebook intending to stay forty minutes and left at 2 PM after a honey cortado, truffle tagliatelle, and half of Tanizaki’s essays. Nothing in the city feels this unhurried.',
    author: 'Meera Krishnan',
    role: 'Architectural Designer · Bengaluru',
    detail: 'Visited Sunlit Terrace · Google Review (5.0)',
  },
  {
    quote:
      'Their 18-hour Yirgacheffe cold brew over hand-carved ice and the wild blueberry Basque cheesecake rival my favourite cafés in Kyoto and Lisbon. And the vinyl sound system is pure velvet.',
    author: 'Siddharth Verma',
    role: 'Mastering Engineer · Mumbai',
    detail: 'Visited Vinyl Corner · Google Review (5.0)',
  },
  {
    quote:
      'Hosted our twelve-person Sunday book circle under the ivy pergola. Warm focaccia, blistered Margherita pies, and zero rush from the hosts.',
    author: 'Nandini & The Indiranagar Readers',
    role: 'Monthly Literary Circle',
    detail: 'Private Table Reservation · Google Review (5.0)',
  },
];

export const REFRESH_BOOK_QUOTES = [
  { text: 'Were it not for shadows, there would be no beauty.', source: 'Jun’ichirō Tanizaki, In Praise of Shadows' },
  { text: 'Look for what you notice but no one else sees.', source: 'Rick Rubin, The Creative Act' },
  { text: 'Paying attention is a form of reciprocity with the living world.', source: 'Robin Wall Kimmerer, Braiding Sweetgrass' },
  { text: 'You do not rise to the level of your goals. You fall to the level of your systems.', source: 'James Clear, Atomic Habits' },
  { text: 'Good food is very often, even most often, simple food.', source: 'Anthony Bourdain, Kitchen Confidential' },
];

export interface GalleryCard {
  id: string;
  title: string;
  caption: string;
  category: 'Space' | 'Food & Coffee' | 'Books & Vinyl';
  image: string;
  aspect: 'landscape' | 'portrait' | 'square';
}

export const GALLERY_FRAMES: GalleryCard[] = [
  {
    id: 'gal-1',
    title: 'Golden Hour Under the Arches',
    caption: '4:30 PM sunlight pouring across reclaimed walnut tables and stoneware.',
    category: 'Space',
    image: CAFE_ASSETS.heroCourtyard,
    aspect: 'landscape',
  },
  {
    id: 'gal-2',
    title: 'Uji Matcha & Wild Blueberry Basque',
    caption: 'Stone-ground Kyoto first harvest paired with our signature baked cheesecake.',
    category: 'Food & Coffee',
    image: CAFE_ASSETS.matchaCheesecake,
    aspect: 'square',
  },
  {
    id: 'gal-3',
    title: 'Candlelit Vinyl Sessions',
    caption: 'Forest velvet banquettes and warm tube amplification after dusk.',
    category: 'Books & Vinyl',
    image: CAFE_ASSETS.nightAmbiance,
    aspect: 'landscape',
  },
  {
    id: 'gal-4',
    title: 'White Truffle & Mushroom Tagliatelle',
    caption: 'Hand-rolled egg ribbons with Parmigiano Reggiano and charred sourdough.',
    category: 'Food & Coffee',
    image: CAFE_ASSETS.trufflePasta,
    aspect: 'portrait',
  },
  {
    id: 'gal-5',
    title: 'The Emerald Reading Nook',
    caption: 'Two hundred and forty dog-eared volumes waiting beside arched windows.',
    category: 'Books & Vinyl',
    image: CAFE_ASSETS.readingVinyl,
    aspect: 'landscape',
  },
  {
    id: 'gal-6',
    title: 'Morning Tartine & 18h Cold Brew',
    caption: 'Hass avocado, poached egg, za’atar, and crystal-ice Ethiopian immersion.',
    category: 'Food & Coffee',
    image: CAFE_ASSETS.avocadoColdbrew,
    aspect: 'square',
  },
  {
    id: 'gal-7',
    title: '450°C Wood-Fired Margherita D.O.P',
    caption: 'Blistered 48-hour sourdough crust, San Marzano tomatoes, and sweet basil.',
    category: 'Food & Coffee',
    image: CAFE_ASSETS.neapolitanPizza,
    aspect: 'portrait',
  },
  {
    id: 'gal-8',
    title: 'Micro-Lot Cast-Iron Roastery',
    caption: 'Roasting Chikmagalur and Huila harvests in small 5kg batches.',
    category: 'Space',
    image: CAFE_ASSETS.roasteryBeans,
    aspect: 'landscape',
  },
];
