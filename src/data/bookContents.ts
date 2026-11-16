export interface BookPageChapter {
  chapterNum: string;
  chapterTitle: string;
  pageRange: string;
  epigraph?: string;
  paragraphs: string[];
  baristaMarginNote?: string;
}

export interface BookReadingEdition {
  bookId: string;
  subtitle: string;
  editionNote: string;
  readingTime: string;
  shelfLocation: string;
  chapters: BookPageChapter[];
}

export const BOOK_READING_EDITIONS: Record<string, BookReadingEdition> = {
  'atomic-habits': {
    bookId: 'atomic-habits',
    subtitle: 'Tiny Changes, Remarkable Results — Courtyard Morning Edition',
    editionNote: 'Shelf B · Copy #04 (Dog-eared at Chapter 1 & Chapter 11 by morning regulars)',
    readingTime: '12 min café excerpt · 5 chapters',
    shelfLocation: 'Row 1 · Salvaged Walnut Shelf B',
    chapters: [
      {
        chapterNum: 'Chapter I',
        chapterTitle: 'The Surprising Power of Tiny Rituals',
        pageRange: 'pp. 15–22',
        epigraph: 'Success is the product of daily habits—not once-in-a-lifetime transformations.',
        paragraphs: [
          'It is so easy to overestimate the importance of one defining moment and underestimate the value of making small improvements on a daily basis. Too often, we convince ourselves that massive success requires massive action.',
          'Meanwhile, improving by 1 percent isn’t particularly notable—sometimes it isn’t even noticeable—but it can be far more meaningful, especially in the long run. A slight shift in your trajectory, repeated each morning before the city wakes, compounds like interest.',
          'Think of a quiet 8:30 AM table by an arched window: opening a notebook for twenty uninterrupted minutes beside a warm cortado looks ordinary on Tuesday. Over three hundred Tuesdays, it becomes a body of work.',
        ],
        baristaMarginNote: 'Pencilled in margin: "Pair this chapter with a double ristretto cortado before opening email." — Aarav, Head Barista',
      },
      {
        chapterNum: 'Chapter II',
        chapterTitle: 'How Habits Shape Your Identity',
        pageRange: 'pp. 31–40',
        epigraph: 'Every action you take is a vote for the type of person you wish to become.',
        paragraphs: [
          'True behavior change is identity change. You might start a habit because of motivation, but the only reason you’ll stick with one is that it becomes part of who you are.',
          'When you make your bed each morning, you embody the identity of someone who values order. When you write one paragraph each morning at the café table, you embody the identity of a writer—long before a book is finished.',
          'No single instance will transform your beliefs, but as the votes build up, so does the evidence of your new story. Small habits matter not only for the results they produce, but for the quiet trust they build within yourself.',
        ],
        baristaMarginNote: 'Underlined twice in warm ink on our lending copy.',
      },
      {
        chapterNum: 'Chapter III',
        chapterTitle: 'Designing an Environment That Invites Focus',
        pageRange: 'pp. 81–92',
        epigraph: 'Environment is the invisible hand that shapes human behavior.',
        paragraphs: [
          'People often choose products and routines not because of what they are, but because of where they are. If your guitar stands beside the armchair rather than inside a closet, your fingers find the strings without willpower.',
          'Dedicate specific spaces to specific intentions: one chair for reading, one corner table for deep thinking, one courtyard bench for conversation without screens. Soon the room itself cues the state of mind before you even sit down.',
          'Be the architect of your surroundings rather than merely a passenger inside them. Make good rituals obvious, frictionless, and tactile.',
        ],
        baristaMarginNote: 'Guest note: "Table N1 under the brass lamp is my dedicated writing anchor."',
      },
      {
        chapterNum: 'Chapter IV',
        chapterTitle: 'The Two-Minute Rule & Mastering the Start',
        pageRange: 'pp. 161–169',
        epigraph: 'A habit must be established before it can be improved.',
        paragraphs: [
          'Even when you know you should start small, it is easy to start too big. When you dream about making a change, excitement inevitably takes over and you try to do too much too soon.',
          'The Two-Minute Rule states: when you start a new ritual, it should take less than two minutes to begin. "Read before dusk" becomes "read one page." "Journal every morning" becomes "write one honest sentence while the coffee blooms."',
          'Once you have shown up and crossed the threshold, momentum carries the rest. Standardize the beginning before you optimize the finish.',
        ],
      },
      {
        chapterNum: 'Chapter V',
        chapterTitle: 'Falling in Love with Boredom & Craft',
        pageRange: 'pp. 229–238',
        epigraph: 'Professionals stick to the schedule; amateurs let life get in the way.',
        paragraphs: [
          'Anyone can work hard when they feel inspired. The difference between good craft and enduring mastery is the ability to show up with care on an unremarkable rainy Wednesday.',
          'Like a baker feeding a forty-eight-hour sourdough starter at dawn or a roaster listening for first crack in a cast-iron drum, repetition ceases to be monotony when you pay closer attention to subtle nuances.',
          'You do not rise to the level of your goals; you fall to the level of your systems. Build a rhythm gentle enough to sustain for years, and let time do the heavy lifting.',
        ],
        baristaMarginNote: 'Willow Stamp: Return to Shelf B when your cup is empty, or borrow for the week.',
      },
    ],
  },

  'in-praise-of-shadows': {
    bookId: 'in-praise-of-shadows',
    subtitle: 'Essays on Light, Timber, Lacquerware & Quiet Rooms',
    editionNote: 'Shelf B · Copy #01 (Our architectural touchstone when restoring the 1924 brick courtyard)',
    readingTime: '10 min café meditation · 5 sections',
    shelfLocation: 'Row 1 · Salvaged Walnut Shelf B',
    chapters: [
      {
        chapterNum: 'Section I',
        chapterTitle: 'Beneath the Deep Eaves',
        pageRange: 'pp. 1–14',
        epigraph: 'Were it not for shadows, there would be no beauty.',
        paragraphs: [
          'In making for ourselves a place to live, we first spread a parasol to throw a shadow on the earth, and in the pale light of the shadow we put together a house.',
          'Where Western rooms often flood every corner with uniform brightness, traditional timber eaves invite daylight in sideways—softened by garden leaves, weathered stone, and warm plaster.',
          'Notice how golden afternoon light enters an arched brick window: it does not erase the dimness of the walnut shelves behind it, it makes that dimness velvet and restful to the eye.',
        ],
        baristaMarginNote: 'This exact passage inspired our 2700K shaded brass lamps at dusk.',
      },
      {
        chapterNum: 'Section II',
        chapterTitle: 'Candlelight & Dark Lacquerware',
        pageRange: 'pp. 15–28',
        epigraph: 'Only in dim half-light does lacquerware reveal its true depth.',
        paragraphs: [
          'Seen under harsh fluorescent tubes, dark ceramic glazes and gold-flecked lacquer bowls can look theatrical or flat. Replace that glare with a single flickering flame or warm filament, and the surface transforms into a still nocturnal pond.',
          'As steam rises from warm broth or freshly whisked Uji matcha, the fragrance precedes sight. You feel the weight and warmth of stoneware in both palms before your eyes decipher every detail.',
          'Beauty is not stored inside the object alone; it lives in the interplay of shadow, steam, silence, and patience.',
        ],
      },
      {
        chapterNum: 'Section III',
        chapterTitle: 'The Patina of Touched Things',
        pageRange: 'pp. 29–44',
        epigraph: 'We love things that bear the marks of grime, soot, and weather.',
        paragraphs: [
          'We do not dislike everything that shines, but we prefer a pensive lustre to a shallow brilliance. Brass that has darkened where a hundred hands have turned a latch, walnut tables smoothed at the edges by elbows and notebooks—these carry human time.',
          'Sterile perfection keeps a guest at arm’s length. Natural grain, kiln speckles on clay plates, and linen softened by washings allow the shoulders to drop the moment one sits down.',
          'To honour age is simply to admit that rooms grow wiser when they are lived in gently.',
        ],
        baristaMarginNote: 'Look at the kiln speckles on your matcha bowl—each firing leaves a one-of-a-kind constellation.',
      },
      {
        chapterNum: 'Section IV',
        chapterTitle: 'Paper, Parchment & Diffused Glow',
        pageRange: 'pp. 45–59',
        epigraph: 'Unbleached paper drinks the sun rather than bouncing it back.',
        paragraphs: [
          'Consider the difference between glossy white stock and warm cream parchment. Bright glare startles the pupil; fibrous cream paper absorbs rays softly, wrapping words in calm.',
          'Even sound behaves differently in rooms lined with paper, books, and timber. Hard glass echoes; shelves of two hundred clothbound volumes drink clatter and leave behind only the turn of pages and rain on the skylight.',
        ],
      },
      {
        chapterNum: 'Section V',
        chapterTitle: 'Keeping One Sanctuary Unhurried',
        pageRange: 'pp. 60–73',
        epigraph: 'Let us dim the lamps in at least one room and see what returns.',
        paragraphs: [
          'The modern street will continue to grow brighter, louder, and faster. One cannot turn back the clock of cities, nor need one wish to.',
          'Yet perhaps there remains room for sanctuaries where we turn down the voltage—where tea cools slowly, vinyl crackles softly at thirty-three revolutions, and dusk is allowed to arrive without apology.',
          'Step out of the glare for an hour; you may find your thoughts waiting faithfully in the half-light.',
        ],
        baristaMarginNote: 'Best read after 6:30 PM as our courtyard lanterns come on.',
      },
    ],
  },

  'creative-act': {
    bookId: 'creative-act',
    subtitle: 'A Way of Being — Vignettes on Listening & Making',
    editionNote: 'Shelf B · Copy #02 (Kept beside the 1976 turntable for Tuesday listening nights)',
    readingTime: '11 min café excerpt · 5 vignettes',
    shelfLocation: 'Row 1 · Salvaged Walnut Shelf B',
    chapters: [
      {
        chapterNum: '78 · Vignette I',
        chapterTitle: 'Everyone Is an Antenna',
        pageRange: 'pp. 9–18',
        epigraph: 'Look for what you notice but no one else sees.',
        paragraphs: [
          'Creativity is not a rare talent reserved for painters or studio musicians. Every time you arrange flowers on a table, choose which record fits a rainy afternoon, or phrase a kind letter, you are participating in the creative act.',
          'To live as an artist is a practice of heightened awareness: noticing how light shifts across brick arches between nine and ten in the morning, or how a minor seventh chord changes the temperature of a room.',
          'Keep your receiver clear of static, and ideas arrive like birds landing on an open sill.',
        ],
        baristaMarginNote: 'Drop the needle on Track 01 ("Sunbeams on Walnut") while reading this spread.',
      },
      {
        chapterNum: '78 · Vignette II',
        chapterTitle: 'Deep Listening Without Interruption',
        pageRange: 'pp. 54–65',
        epigraph: 'Most people listen with the intent to reply rather than to absorb.',
        paragraphs: [
          'When musicians play together in an analog room without headphones, they survive by listening more loudly to one another than to themselves. If the upright bass leans back, the brushed snare breathes with it.',
          'Try listening to an entire side of vinyl—twenty uninterrupted minutes—without reaching for a screen or preparing an opinion. Let the pauses between notes carry as much weight as the melody.',
          'Attention is the rarest generosity we can offer a song, a book, or a friend across the table.',
        ],
      },
      {
        chapterNum: '78 · Vignette III',
        chapterTitle: 'The Seed Phase & Play',
        pageRange: 'pp. 122–134',
        epigraph: 'Do not judge the sapling by the height of an oak.',
        paragraphs: [
          'In the beginning of any project, critique is frost. Collect fragments freely: half-lines scribbled on café napkins, overheard rhythms, curious flavor pairings, rough sketches.',
          'Give every small hunch room to breathe before asking what it is "for." Some of the most enduring songs began as warm-up accidents while tape happened to be rolling.',
          'Protect playfulness fiercely; refinement comes much later at the workbench.',
        ],
        baristaMarginNote: 'Ask any barista for extra kraft coasters if an idea strikes mid-cup!',
      },
      {
        chapterNum: '78 · Vignette IV',
        chapterTitle: 'Subtraction & Leaving Space',
        pageRange: 'pp. 214–226',
        epigraph: 'Perfection is achieved when nothing left obscures the heart of the work.',
        paragraphs: [
          'When a mix feels crowded, the instinct is often to turn something up. Almost always, the answer is to mute two tracks so the remaining voice can stand in three dimensions.',
          'The same holds true for a plate of food or an afternoon schedule. Three honest ingredients—ripe fig, fresh burrata, warm sourdough—sing clearer than twelve competing garnishes.',
          'Leave air around what matters most.',
        ],
      },
      {
        chapterNum: '78 · Vignette V',
        chapterTitle: 'Sharing & Letting Go',
        pageRange: 'pp. 356–368',
        epigraph: 'A work is a diary of who you were in the season you made it.',
        paragraphs: [
          'Holding onto a piece forever out of fear of imperfection robs you of the next chapter waiting behind it. Finish the work with all the care you possess today, set it on the counter, and begin again.',
          'Art is circulation—like river water or books passed from reader to reader on a neighbourhood shelf.',
        ],
      },
    ],
  },

  'kafka-shore': {
    bookId: 'kafka-shore',
    subtitle: 'Rain, Quiet Libraries & Analog Records in Takamatsu',
    editionNote: 'Shelf B · Copy #07 (Well-loved paperback with pressed willow leaf bookmark)',
    readingTime: '14 min novel excerpt · 5 scenes',
    shelfLocation: 'Row 2 · Salvaged Walnut Shelf B',
    chapters: [
      {
        chapterNum: 'Scene I',
        chapterTitle: 'The Komura Memorial Library',
        pageRange: 'pp. 37–48',
        epigraph: 'Everyone has a quiet library inside them where time forgets to hurry.',
        paragraphs: [
          'The library occupied a converted residence tucked behind stone walls and tall trees that filtered the seaside wind into a low rustle. Inside, high ceilings and French doors opened onto a manicured courtyard.',
          'Oshima set a fresh thermos of black coffee on the walnut desk and gestured toward the reading room. "Nobody bothers anyone here," he said softly. "Choose whichever chair catches the light you like best."',
          'Outside the tall arched glass, fine silver rain began to stipple the flagstones, making the silence indoors feel doubly warm.',
        ],
        baristaMarginNote: 'Reading this on a rainy afternoon with an 18h Yirgacheffe cold brew is pure magic.',
      },
      {
        chapterNum: 'Scene II',
        chapterTitle: 'Mr. Nakata & Afternoon Shadows',
        pageRange: 'pp. 74–86',
        epigraph: 'Cats know the exact rectangle of floor where the sun will warm the boards.',
        paragraphs: [
          'Nakata never hurried. He walked along the residential lanes with his canvas bag slung neatly across his shoulder, greeting older tabbies perched atop brick walls.',
          '"Good afternoon," Nakata said politely, crouching to eye level. "Today has a very pleasant breeze, though my knees suspect rain before supper."',
          'The tortoiseshell cat blinked once—unhurried, gold-eyed—and stretched a front paw into the warm amber patch of late sun.',
        ],
      },
      {
        chapterNum: 'Scene III',
        chapterTitle: 'Schubert, Duke Ellington & 33⅓ RPM',
        pageRange: 'pp. 148–160',
        epigraph: 'Good records remember the room in which they were pressed.',
        paragraphs: [
          'After closing the wooden shutters at six, Oshima lifted a heavy vinyl LP from its sleeve, brushed away invisible dust with velvet care, and lowered the tonearm.',
          'Piano notes stepped unhurriedly out of the speakers—not loud, yet crystalline enough that you could hear the wooden damper lift off the strings.',
          'For forty minutes neither of us spoke. Coffee cooled slowly in thick ceramic mugs while twilight deepened from indigo to ink.',
        ],
        baristaMarginNote: 'Tuesday 7 PM Analog Side-A is dedicated to chapters just like this one.',
      },
      {
        chapterNum: 'Scene IV',
        chapterTitle: 'Cabin in the Cedar Woods',
        pageRange: 'pp. 232–245',
        epigraph: 'Simple bread, boiling kettle, and the sound of wind through tall branches.',
        paragraphs: [
          'At dawn I pump cold well water into the kettle, slice thick crusty bread, and heat olive oil in an iron skillet. Without clocks or newspapers, the day measures itself by birdcalls and shifting shafts of sun across pine floorboards.',
          'I pull an old volume of essays from the shelf beside the stove and read thirty pages slowly, returning twice to sentences that catch the morning stillness.',
        ],
      },
      {
        chapterNum: 'Scene V',
        chapterTitle: 'Returning Through the Archway',
        pageRange: 'pp. 448–462',
        epigraph: 'When you come out of the storm, you carry a quieter compass.',
        paragraphs: [
          'Every journey through labyrinthine corridors eventually leads back to ordinary daylight—a train platform, a warm cup held in both hands, the familiar creak of a wooden chair.',
          'Nothing on the street looks outwardly changed, yet the weight of small daily kindnesses feels unmistakable.',
        ],
      },
    ],
  },

  'salt-fat-acid-heat': {
    bookId: 'salt-fat-acid-heat',
    subtitle: 'Mastering the Four Elements of Honest Cooking',
    editionNote: 'Shelf B · Copy #09 (Kitchen Table Edition with olive-oil-kissed recipe notes)',
    readingTime: '11 min culinary excerpt · 5 lessons',
    shelfLocation: 'Row 2 · Salvaged Walnut Shelf B',
    chapters: [
      {
        chapterNum: 'Element I',
        chapterTitle: 'Salt — Awakening Flavor From Within',
        pageRange: 'pp. 19–36',
        epigraph: 'Let your senses guide you at the stove rather than rigid timers.',
        paragraphs: [
          'Salt does more than make food taste salty: it amplifies aroma, softens bitterness, and unlocks sweetness hidden inside ripe tomatoes or roasted dark chocolate.',
          'Timing matters as much as quantity. Salting mushrooms early draws moisture; finishing warm sourdough avocado tartine or molten Valrhona brownie with crisp flaky sea salt delivers tiny sparks of contrast right on the palate.',
          'Taste at every stage—cooking is a conversation, not a fixed formula.',
        ],
        baristaMarginNote: 'Chef Matteo uses Maldon flakes on both our Avocado Tartine and 70% Skillet Brownie!',
      },
      {
        chapterNum: 'Element II',
        chapterTitle: 'Fat — Texture, Aroma & Golden Crust',
        pageRange: 'pp. 73–94',
        epigraph: 'Fat carries fragrance the way vinyl grooves carry warmth.',
        paragraphs: [
          'Consider the distinct personalities of great fats: peppery emerald Ligurian olive oil drizzled raw over torn burrata, nutty browned Normandy butter coating hand-rolled egg tagliatelle, or twenty-seven paper-thin layers of pastry butter puffing into crisp honeycomb.',
          'Used thoughtfully, fat creates both the shatter of a blistered focaccia crust and the velvety lingering finish of steamed microfoam.',
        ],
      },
      {
        chapterNum: 'Element III',
        chapterTitle: 'Acid — Brightness & Balance',
        pageRange: 'pp. 139–158',
        epigraph: 'Where salt enhances, acid balances and lifts.',
        paragraphs: [
          'Whenever a rich dish feels nearly complete yet slightly heavy, it rarely needs more spice—it needs a whisper of brightness. Fresh lemon zest over crushed Hass avocado, ruby hibiscus and key lime against sweet pomegranate, or tangy forty-eight-hour wild sourdough fermentation.',
          'Even in specialty coffee, gentle malic and citric acidity is what makes a Colombian Huila pour-over taste alive like ripe stone fruit as it cools.',
        ],
      },
      {
        chapterNum: 'Element IV',
        chapterTitle: 'Heat — Patience & Fierce Flame',
        pageRange: 'pp. 195–218',
        epigraph: 'Listen to the sizzle before you look at the clock.',
        paragraphs: [
          'Every masterpiece of the oven relies on pairing gentle interior warmth with bold exterior caramelization: a Basque cheesecake deeply bronzed on top yet silken at its core, or Neapolitan dough blistering into leopard spots in ninety seconds at 450°C.',
          'Trust colour, fragrance, and touch—your senses were built for the hearth.',
        ],
      },
      {
        chapterNum: 'Table Note',
        chapterTitle: 'Gathering Around Uncomplicated Plates',
        pageRange: 'pp. 240–252',
        epigraph: 'The finest garnish is unhurried company.',
        paragraphs: [
          'When you source seasonal figs, cold-pressed oils, heritage grains, and pasture-raised eggs with care, the kitchen’s job is simply not to get in their way.',
          'Tear the warm bread, pass the olive oil, and linger until the candles burn low.',
        ],
      },
    ],
  },

  'braiding-sweetgrass': {
    bookId: 'braiding-sweetgrass',
    subtitle: 'Botanical Wisdom, Gratitude & Living Canopies',
    editionNote: 'Shelf B · Copy #11 (Favourite sunlit terrace companion beneath our weeping willow)',
    readingTime: '12 min botanical essays · 5 chapters',
    shelfLocation: 'Row 2 · Salvaged Walnut Shelf B',
    chapters: [
      {
        chapterNum: 'Essay I',
        chapterTitle: 'Skywoman & The Gift of Gardens',
        pageRange: 'pp. 3–18',
        epigraph: 'Paying attention is a form of reciprocity with the living world.',
        paragraphs: [
          'Breathe in the scent of sweetgrass braided smoothly in three strands: memory, science, and care. Plants were our earliest teachers in generosity, turning sunlight and rain into berry, grain, shade, and oxygen.',
          'Sitting beneath trailing pothos and a forty-year-old weeping willow, it becomes impossible to view greenery as mere decoration—we are guests beneath an older canopy.',
        ],
        baristaMarginNote: 'Take this copy out to Table G1 under our courtyard willow tree.',
      },
      {
        chapterNum: 'Essay II',
        chapterTitle: 'Wild Strawberries & Gift Economies',
        pageRange: 'pp. 22–38',
        epigraph: 'Gifts establish a bond that mere transactions never touch.',
        paragraphs: [
          'A wild berry found along a meadow path tastes sweeter than one sealed in plastic not because of chemistry alone, but because it arrives as an unexpected gift.',
          'Notice how community lending shelves, shared carafes of filter coffee, and passed bowls of warm bread transform strangers in a courtyard into neighbours.',
        ],
      },
      {
        chapterNum: 'Essay III',
        chapterTitle: 'Learning the Grammar of Animacy',
        pageRange: 'pp. 48–59',
        epigraph: 'To name a tree or bird with care is the beginning of kinship.',
        paragraphs: [
          'When we learn the names and seasons of the plants around us—silver-oak shade trees over Chikmagalur coffee cherries, Malabar green cardamom pods, courtyard rosemary—the world ceases to be a blur of background green and becomes a neighbourhood of familiar faces.',
        ],
      },
      {
        chapterNum: 'Essay IV',
        chapterTitle: 'The Honourable Harvest',
        pageRange: 'pp. 175–196',
        epigraph: 'Take only what is given, use it respectfully, and replenish the soil.',
        paragraphs: [
          'Every cup of shade-grown coffee or stone-ground Uji tea connects a quiet café table to misty hillsides, monsoon rains, and careful hands that pruned the bushes without stripping the forest.',
          'Gratitude before a meal is not formality; it is remembering the whole living chain.',
        ],
      },
      {
        chapterNum: 'Essay V',
        chapterTitle: 'Listening to Rain on Leaves',
        pageRange: 'pp. 293–310',
        epigraph: 'Even a small urban courtyard can hold an entire ecosystem of calm.',
        paragraphs: [
          'Set down hurry for half an hour. Watch dappled afternoon sun move an inch across reclaimed walnut, sip slowly, and let the living world remind you that growth never rushes yet everything arrives in season.',
        ],
      },
    ],
  },

  'kitchen-confidential': {
    bookId: 'kitchen-confidential',
    subtitle: 'Notes From Dawn Prep, Hot Ovens & Honest Ingredients',
    editionNote: 'Shelf B · Copy #14 (Heavily annotated in pencil by our head baker!)',
    readingTime: '11 min memoir excerpt · 5 dispatches',
    shelfLocation: 'Row 3 · Salvaged Walnut Shelf B',
    chapters: [
      {
        chapterNum: 'Dispatch I',
        chapterTitle: 'Good Food Is Most Often Simple Food',
        pageRange: 'pp. 11–24',
        epigraph: 'Good food is very often, even most often, simple food.',
        paragraphs: [
          'Forget foams and twenty-word menu riddles. Give me crusty warm bread pulled from a stone deck at seven in the morning, sweet cultured butter, ripe figs, a properly pulled espresso, and roasted garlic perfuming good olive oil.',
          'When a kitchen respects three great ingredients and executes them with fierce care every single morning, you taste honesty in the very first bite.',
        ],
        baristaMarginNote: 'Baker’s pencil note: "100% why our sourdough only has flour, water, salt & 48 hours."',
      },
      {
        chapterNum: 'Dispatch II',
        chapterTitle: '5:30 AM Before the Doors Unlock',
        pageRange: 'pp. 58–72',
        epigraph: 'There is no peace quite like a bakery before sunrise.',
        paragraphs: [
          'At 5:30 AM the street outside the brick arcade is blue and empty. Inside, deck ovens hum to temperature, cardamom pods crack under a brass mortar, and laminated croissant dough comes off the marble slab cold and taut.',
          'By the time the first regular knocks at eight, the whole courtyard smells of browned butter, caramelized sugar, and freshly dialled espresso.',
        ],
      },
      {
        chapterNum: 'Dispatch III',
        chapterTitle: 'Mise en Place as a Philosophy of Calm',
        pageRange: 'pp. 114–129',
        epigraph: 'Order on the wooden board creates calm in the mind.',
        paragraphs: [
          'Folded linen towels, razor-sharp knives wiped clean after every cut, labelled jars of toasted za’atar and pickled shallots within an arm’s reach—mise en place isn’t rigidity, it is freedom to cook with grace when the courtyard fills at noon.',
        ],
      },
      {
        chapterNum: 'Dispatch IV',
        chapterTitle: 'Why Regulars Make a Place Alive',
        pageRange: 'pp. 198–212',
        epigraph: 'Hospitality is remembering how someone takes their morning cup.',
        paragraphs: [
          'A neighbourhood café earns its soul when the person behind the bar starts steaming oat milk the moment they spot your bicycle outside the brick arch.',
          'Food feeds the body; being welcomed without pretence feeds the week.',
        ],
      },
      {
        chapterNum: 'Dispatch V',
        chapterTitle: 'After the Last Dish Is Dried',
        pageRange: 'pp. 288–304',
        epigraph: 'Pull up a stool, pour something cold, and let the turntable spin.',
        paragraphs: [
          'When the espresso group-heads are backflushed gleaming clean and the chairs rest beside warm walnut tables, someone drops an old jazz record on the platter. Tomorrow we feed the starter and do it all over again.',
        ],
        baristaMarginNote: 'Loved this book? Leave your own note on our Interactive Chalkboard!',
      },
    ],
  },
};
