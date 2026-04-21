type DoshaState = -1 | 0 | 1;

type DoshaVector = {
  vata: DoshaState;
  pitta: DoshaState;
  kapha: DoshaState;
};

export interface FoodPair {
  good: boolean;
  a: string;
  b: string;
  why: string;
}

interface PairTemplate {
  a: string;
  b: string;
  why: string;
  effect: DoshaVector;
}

const GOOD_PAIR_TEMPLATES: PairTemplate[] = [
  { a: 'Rice', b: 'Ghee', why: 'Grounding and lubricating; calms dryness and supports steady digestion.', effect: { vata: -1, pitta: 0, kapha: 0 } },
  { a: 'Mung dal', b: 'Ginger', why: 'Light protein plus warming spice improves digestive fire without heaviness.', effect: { vata: -1, pitta: 0, kapha: -1 } },
  { a: 'Turmeric', b: 'Black pepper', why: 'Classic bioavailability pair that improves absorption and metabolism.', effect: { vata: 0, pitta: 0, kapha: -1 } },
  { a: 'Coconut', b: 'Lime', why: 'Cooling and hydrating combination that soothes excess internal heat.', effect: { vata: 0, pitta: -1, kapha: 0 } },
  { a: 'Coriander', b: 'Fennel', why: 'Gentle cooling spices reduce sharpness and post-meal heat.', effect: { vata: 0, pitta: -1, kapha: 0 } },
  { a: 'Barley', b: 'Trikatu', why: 'Drying grain with heating spices helps clear sluggishness.', effect: { vata: 1, pitta: 0, kapha: -1 } },
  { a: 'Apple', b: 'Cinnamon', why: 'Warm spice offsets fruit coolness and supports balanced blood sugar.', effect: { vata: -1, pitta: 0, kapha: -1 } },
  { a: 'Pumpkin', b: 'Cumin', why: 'Soft sweet vegetable with digestive spice is easy to process.', effect: { vata: -1, pitta: 0, kapha: 0 } },
  { a: 'Leafy greens', b: 'Lemon', why: 'Improves mineral uptake while keeping meals fresh and light.', effect: { vata: 0, pitta: 0, kapha: -1 } },
  { a: 'Oats', b: 'Cardamom', why: 'Nourishing base with aromatic spice keeps heaviness in check.', effect: { vata: -1, pitta: 0, kapha: -1 } },
  { a: 'Sweet potato', b: 'Ghee', why: 'Comforting and moistening for depleted or dry constitutions.', effect: { vata: -1, pitta: 0, kapha: 0 } },
  { a: 'Amla', b: 'Rose water', why: 'Cooling antioxidant pair settles acidity and pitta flare.', effect: { vata: 0, pitta: -1, kapha: 0 } },
  { a: 'Millet', b: 'Sesame oil', why: 'Dry grain becomes more digestible and less rough with healthy fat.', effect: { vata: -1, pitta: 0, kapha: 0 } },
  { a: 'Lentils', b: 'Asafoetida', why: 'Helps reduce gas formation and supports smoother digestion.', effect: { vata: -1, pitta: 0, kapha: -1 } },
];

const AVOID_PAIR_TEMPLATES: PairTemplate[] = [
  { a: 'Milk', b: 'Fish', why: 'Opposing metabolic qualities can create heaviness and gut stress.', effect: { vata: 0, pitta: 1, kapha: 1 } },
  { a: 'Fruit', b: 'Milk', why: 'Different digestion speeds can produce bloating and fermentation.', effect: { vata: 1, pitta: 0, kapha: 1 } },
  { a: 'Yogurt', b: 'Night meal', why: 'Night-time sour dairy can increase mucus and sluggishness.', effect: { vata: 0, pitta: 0, kapha: 1 } },
  { a: 'Curd', b: 'Fish', why: 'Heavy and heating together; may aggravate skin and digestion.', effect: { vata: 0, pitta: 1, kapha: 1 } },
  { a: 'Honey (heated)', b: 'Hot cooking', why: 'Overheating honey is considered incompatible in Ayurveda.', effect: { vata: 1, pitta: 1, kapha: 0 } },
  { a: 'Cheese', b: 'Fried food', why: 'Dense-fat combination burdens digestion and raises ama risk.', effect: { vata: 0, pitta: 1, kapha: 1 } },
  { a: 'Banana', b: 'Milkshake', why: 'Can become heavy and mucus-forming for many constitutions.', effect: { vata: 0, pitta: 0, kapha: 1 } },
  { a: 'Very spicy curry', b: 'Fermented pickle', why: 'Double heating pattern can trigger acid and irritability.', effect: { vata: 0, pitta: 1, kapha: 0 } },
  { a: 'Cold smoothie', b: 'Heavy dinner', why: 'Cold plus heavy can weaken agni and slow metabolism.', effect: { vata: 1, pitta: 0, kapha: 1 } },
  { a: 'Red meat', b: 'Cream sauce', why: 'Very heavy pairing can overwhelm digestive capacity.', effect: { vata: 0, pitta: 1, kapha: 1 } },
  { a: 'Citrus fruit', b: 'Yogurt', why: 'Acidic-sour combination may disturb digestion in sensitive users.', effect: { vata: 1, pitta: 1, kapha: 0 } },
  { a: 'Deep-fried snack', b: 'Sugary dessert', why: 'High-fat-high-sugar spike pattern worsens lethargy.', effect: { vata: 0, pitta: 0, kapha: 1 } },
  { a: 'Raw salad', b: 'Iced drink', why: 'Too much cold-rough input may disturb vata and agni.', effect: { vata: 1, pitta: 0, kapha: 0 } },
  { a: 'Coffee', b: 'Empty stomach', why: 'Can increase dryness, heat, and post-meal instability.', effect: { vata: 1, pitta: 1, kapha: 0 } },
];

function toState(value: number, average: number): DoshaState {
  if (value >= average + 10) {
    return 1;
  }

  if (value <= average - 10) {
    return -1;
  }

  return 0;
}

export function encodeDoshaState(dosha?: { vata: number; pitta: number; kapha: number }): DoshaVector {
  if (!dosha) {
    return { vata: 0, pitta: 0, kapha: 0 };
  }

  const values = [dosha.vata, dosha.pitta, dosha.kapha];
  const avg = values.reduce((sum, n) => sum + n, 0) / 3;

  return {
    vata: toState(dosha.vata, avg),
    pitta: toState(dosha.pitta, avg),
    kapha: toState(dosha.kapha, avg),
  };
}

function comboKey(vector: DoshaVector): string {
  return `v${vector.vata}_p${vector.pitta}_k${vector.kapha}`;
}

function desiredEffect(state: DoshaState): DoshaState {
  if (state === 1) {
    return -1;
  }

  if (state === -1) {
    return 1;
  }

  return 0;
}

function scoreGoodPair(pair: PairTemplate, state: DoshaVector): number {
  const vGoal = desiredEffect(state.vata);
  const pGoal = desiredEffect(state.pitta);
  const kGoal = desiredEffect(state.kapha);

  const vFit = 2 - Math.abs(vGoal - pair.effect.vata);
  const pFit = 2 - Math.abs(pGoal - pair.effect.pitta);
  const kFit = 2 - Math.abs(kGoal - pair.effect.kapha);

  return vFit + pFit + kFit;
}

function scoreAvoidPair(pair: PairTemplate, state: DoshaVector): number {
  const vWorsen = state.vata !== 0 && pair.effect.vata === state.vata ? 2 : 0;
  const pWorsen = state.pitta !== 0 && pair.effect.pitta === state.pitta ? 2 : 0;
  const kWorsen = state.kapha !== 0 && pair.effect.kapha === state.kapha ? 2 : 0;

  return vWorsen + pWorsen + kWorsen;
}

function takeTopUnique(items: PairTemplate[], scoreFn: (item: PairTemplate) => number, count: number): PairTemplate[] {
  const seen = new Set<string>();
  return [...items]
    .map((item) => ({ item, score: scoreFn(item) }))
    .sort((a, b) => b.score - a.score)
    .filter(({ item }) => {
      const key = `${item.a}__${item.b}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .slice(0, count)
    .map(({ item }) => item);
}

function toFoodPair(pair: PairTemplate, good: boolean): FoodPair {
  return {
    good,
    a: pair.a,
    b: pair.b,
    why: pair.why,
  };
}

function generatePairsForState(state: DoshaVector): FoodPair[] {
  const goodTop = takeTopUnique(GOOD_PAIR_TEMPLATES, (pair) => scoreGoodPair(pair, state), 8).map((pair) => toFoodPair(pair, true));

  const avoidScored = takeTopUnique(AVOID_PAIR_TEMPLATES, (pair) => scoreAvoidPair(pair, state), 8);
  const avoidTop = avoidScored.filter((pair) => scoreAvoidPair(pair, state) > 0).slice(0, 6).map((pair) => toFoodPair(pair, false));

  const fallbackAvoid = avoidTop.length >= 4
    ? avoidTop
    : [
        ...avoidTop,
        ...takeTopUnique(AVOID_PAIR_TEMPLATES, (pair) => scoreGoodPair(pair, { vata: 0, pitta: 0, kapha: 0 }), 6)
          .map((pair) => toFoodPair(pair, false)),
      ].slice(0, 6);

  return [...goodTop, ...fallbackAvoid];
}

function allDoshaStates(): DoshaVector[] {
  const states: DoshaState[] = [-1, 0, 1];
  const result: DoshaVector[] = [];

  for (const vata of states) {
    for (const pitta of states) {
      for (const kapha of states) {
        result.push({ vata, pitta, kapha });
      }
    }
  }

  return result;
}

export const FOOD_PAIR_LOOKUP: Record<string, FoodPair[]> = allDoshaStates().reduce((acc, state) => {
  acc[comboKey(state)] = generatePairsForState(state);
  return acc;
}, {} as Record<string, FoodPair[]>);

export function getFoodPairsForDosha(dosha?: { vata: number; pitta: number; kapha: number }): { key: string; pairs: FoodPair[]; state: DoshaVector } {
  const state = encodeDoshaState(dosha);
  const key = comboKey(state);

  return {
    key,
    state,
    pairs: FOOD_PAIR_LOOKUP[key] || FOOD_PAIR_LOOKUP.v0_p0_k0,
  };
}
