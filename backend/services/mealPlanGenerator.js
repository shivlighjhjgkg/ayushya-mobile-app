const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { parse } = require('csv-parse/sync');

const CSV_PATH = path.join(__dirname, '..', '..', 'ayushyaApp', 'datasets', 'meal_prediction_dataset_cleaned.csv');
const GROCERY_SOURCE_PATH = path.join(__dirname, '..', '..', 'ayushyaApp', 'datasets', 'grocerylist.txt');

let cachedMeals = null;
let cachedGroceryUniverse = null;

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseArrayLike(value) {
  if (!value || value === '[]') {
    return [];
  }

  const matches = String(value).match(/'([^']+)'/g) || [];
  return matches
    .map((m) => m.slice(1, -1).trim())
    .filter(Boolean);
}

function parseDoshaImpact(value) {
  const matches = String(value || '').match(/-?\d+/g) || [];
  return {
    vata: Number(matches[0] || 0),
    pitta: Number(matches[1] || 0),
    kapha: Number(matches[2] || 0),
  };
}

function toBoolean(value) {
  return String(value || '').trim().toLowerCase() === 'true';
}

function loadGroceryUniverse() {
  if (cachedGroceryUniverse) {
    return cachedGroceryUniverse;
  }

  const lines = fs
    .readFileSync(GROCERY_SOURCE_PATH, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));

  const uniqueMap = new Map();
  for (const line of lines) {
    const normalized = normalizeText(line);
    if (!normalized || uniqueMap.has(normalized)) {
      continue;
    }
    uniqueMap.set(normalized, line);
  }

  cachedGroceryUniverse = Array.from(uniqueMap.entries()).map(([normalized, raw]) => ({
    raw,
    normalized,
  }));

  return cachedGroceryUniverse;
}

function loadMealsFromDataset() {
  if (cachedMeals) {
    return cachedMeals;
  }

  const csvContent = fs.readFileSync(CSV_PATH, 'utf8');
  const rows = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    trim: true,
  });

  cachedMeals = rows.map((row) => {
    const ingredients = parseArrayLike(row.ingredients_tokens);

    return {
      name: row.name_clean,
      normalizedName: normalizeText(row.name_clean),
      course: String(row.course || '').trim().toLowerCase(),
      region: String(row.region || '').trim(),
      normalizedRegion: normalizeText(row.region),
      dietary: String(row.dietary || '').trim(),
      normalizedDietary: normalizeText(row.dietary),
      allergens: parseArrayLike(row.allergens),
      normalizedAllergens: parseArrayLike(row.allergens).map(normalizeText),
      digestibility: String(row.digestibility || '').trim(),
      normalizedDigestibility: normalizeText(row.digestibility),
      season: String(row.season || '').trim(),
      normalizedSeason: normalizeText(row.season),
      doshaImpact: parseDoshaImpact(row.doshaImpact),
      ingredients,
      normalizedIngredients: ingredients.map(normalizeText),
      url: row.url,
      suitable_18_40: toBoolean(row.suitable_18_40),
      suitable_40_70: toBoolean(row.suitable_40_70),
      suitable_70_plus: toBoolean(row.suitable_70_plus),
    };
  });

  return cachedMeals;
}

async function getBlockedMealsByFeedback(userId) {
  const collection = mongoose.connection.collection('meal_feedback');

  let docs = [];
  try {
    docs = await collection
      .find({
        $or: [{ userId }, { userId: String(userId) }, { user_id: String(userId) }],
      })
      .sort({ createdAt: -1, _id: -1 })
      .toArray();
  } catch (_error) {
    return new Set();
  }

  const mealMap = new Map();

  for (const doc of docs) {
    const rawMeal = doc.mealName || doc.food || doc.name_clean || doc.meal || doc.dish || '';
    const mealName = normalizeText(rawMeal);
    if (!mealName) {
      continue;
    }

    const rawFeeling = doc.feedback || doc.fb || doc.feeling || doc.status || '';
    const feeling = normalizeText(rawFeeling);

    const values = mealMap.get(mealName) || [];
    values.push(feeling);
    mealMap.set(mealName, values);
  }

  const unwellWords = new Set(['bad', 'unwell', 'didnt suit', 'didn t suit', 'poor']);
  const blocked = new Set();

  for (const [mealName, feelings] of mealMap.entries()) {
    const badCount = feelings.filter((feeling) => unwellWords.has(feeling)).length;

    if (badCount >= 3) {
      blocked.add(mealName);
    }
  }

  return blocked;
}

function isAgeSuitable(meal, age) {
  if (!age || Number.isNaN(age)) {
    return true;
  }

  if (age >= 18 && age < 40) {
    return meal.suitable_18_40;
  }

  if (age >= 40 && age < 70) {
    return meal.suitable_40_70;
  }

  if (age >= 70) {
    return meal.suitable_70_plus;
  }

  return true;
}

function isDietaryCompatible(meal, userDietary) {
  const pref = normalizeText(userDietary);

  if (!pref) {
    return true;
  }

  if (pref === 'vegetarian') {
    return meal.normalizedDietary === 'vegetarian';
  }

  if (pref === 'non vegetarian' || pref === 'nonveg' || pref === 'non veg') {
    return meal.normalizedDietary === 'non veg' || meal.normalizedDietary === 'non veg' || meal.normalizedDietary === 'vegetarian';
  }

  return true;
}

function isSeasonCompatible(meal, userSeason) {
  const season = normalizeText(userSeason);

  if (!season) {
    return true;
  }

  return meal.normalizedSeason === 'all' || meal.normalizedSeason === season;
}

function partitionByRegion(meals, userDesha) {
  const desha = normalizeText(userDesha);

  if (!desha) {
    return {
      primary: meals,
      fallbackMixed: [],
      fallbackOther: [],
    };
  }

  const primary = meals.filter((meal) => meal.normalizedRegion === desha);
  const fallbackMixed = meals.filter((meal) => meal.normalizedRegion === 'mixed');
  const fallbackOther = meals.filter(
    (meal) => meal.normalizedRegion !== desha && meal.normalizedRegion !== 'mixed'
  );

  return {
    primary,
    fallbackMixed,
    fallbackOther,
  };
}

function hasAllergenConflict(meal, userAllergens) {
  const normalizedUserAllergens = (userAllergens || []).map(normalizeText);
  if (normalizedUserAllergens.length === 0) {
    return false;
  }

  return meal.normalizedAllergens.some((a) => normalizedUserAllergens.includes(a));
}

function ingredientMatchInfo(meal, groceryItems) {
  const normalizedGroceries = (groceryItems || [])
    .map((item) => ({ raw: String(item), normalized: normalizeText(item) }))
    .filter((item) => item.normalized);

  if (normalizedGroceries.length === 0) {
    return {
      hasMatch: false,
      matchedIngredients: [],
      unmatchedIngredients: meal.ingredients,
    };
  }

  const matchedIngredients = [];
  const unmatchedIngredients = [];

  for (let i = 0; i < meal.ingredients.length; i += 1) {
    const rawIngredient = meal.ingredients[i];
    const normalizedIngredient = meal.normalizedIngredients[i] || normalizeText(rawIngredient);

    const matched = normalizedGroceries.some((g) => {
      if (!g.normalized || !normalizedIngredient) {
        return false;
      }
      return normalizedIngredient.includes(g.normalized) || g.normalized.includes(normalizedIngredient);
    });

    if (matched) {
      matchedIngredients.push(rawIngredient);
    } else {
      unmatchedIngredients.push(rawIngredient);
    }
  }

  return {
    hasMatch: matchedIngredients.length > 0,
    matchedIngredients,
    unmatchedIngredients,
  };
}

function getEncodedDoshaVector(doshaScores) {
  const safeScores = {
    vata: Number(doshaScores?.vata || 0),
    pitta: Number(doshaScores?.pitta || 0),
    kapha: Number(doshaScores?.kapha || 0),
  };

  const values = Object.entries(safeScores);
  const maxValue = Math.max(...values.map(([, value]) => value));
  const minValue = Math.min(...values.map(([, value]) => value));

  if (maxValue === minValue) {
    return { vata: 0, pitta: 0, kapha: 0 };
  }

  const maxKeys = values.filter(([, value]) => value === maxValue).map(([key]) => key);
  const minKeys = values.filter(([, value]) => value === minValue).map(([key]) => key);

  return {
    vata: maxKeys.includes('vata') ? 1 : minKeys.includes('vata') ? -1 : 0,
    pitta: maxKeys.includes('pitta') ? 1 : minKeys.includes('pitta') ? -1 : 0,
    kapha: maxKeys.includes('kapha') ? 1 : minKeys.includes('kapha') ? -1 : 0,
  };
}

function doshaCompatibilityScore(meal, encodedDosha) {
  return -1 * (
    encodedDosha.vata * meal.doshaImpact.vata +
    encodedDosha.pitta * meal.doshaImpact.pitta +
    encodedDosha.kapha * meal.doshaImpact.kapha
  );
}

function scoreMeal(meal, encodedDosha, matchCount, slot) {
  const doshaScore = doshaCompatibilityScore(meal, encodedDosha);

  let digestibilityScore = 0;
  if (slot === 'lunchMain') {
    if (meal.normalizedDigestibility === 'hard') digestibilityScore = 4;
    else if (meal.normalizedDigestibility === 'medium') digestibilityScore = 2;
    else digestibilityScore = 1;
  }

  return doshaScore + matchCount * 3 + digestibilityScore + Math.random();
}

function isDigestibilityAllowed(slot, meal) {
  if (slot === 'breakfast' || slot === 'dinnerMain' || slot === 'dinnerSide') {
    return ['easy', 'medium'].includes(meal.normalizedDigestibility);
  }

  return true;
}

function chooseMeal(candidates, profile, usedMeals, slot) {
  const encodedDosha = getEncodedDoshaVector(profile?.doshaScores);
  const available = candidates.filter((meal) => !usedMeals.has(meal.normalizedName));
  const pool = available.length > 0 ? available : candidates;

  if (pool.length === 0) {
    return null;
  }

  const scored = pool
    .map((meal) => {
      const score = scoreMeal(meal, encodedDosha, meal.matchedIngredients.length, slot);
      return { meal, score };
    })
    .sort((a, b) => b.score - a.score);

  const selected = scored[0].meal;
  usedMeals.add(selected.normalizedName);
  return selected;
}

function chooseMealWithRegionPriority(primaryCandidates, mixedCandidates, otherCandidates, profile, usedMeals, slot) {
  const fromPrimary = chooseMeal(primaryCandidates, profile, usedMeals, slot);

  if (fromPrimary) {
    return fromPrimary;
  }

  const fromMixed = chooseMeal(mixedCandidates, profile, usedMeals, slot);

  if (fromMixed) {
    return fromMixed;
  }

  return chooseMeal(otherCandidates, profile, usedMeals, slot);
}

function toMealChoice(meal) {
  return {
    name: meal.name,
    course: meal.course,
    digestibility: meal.digestibility,
    dietary: meal.dietary,
    region: meal.region,
    season: meal.season,
    doshaImpact: meal.doshaImpact,
    url: meal.url,
    matchedIngredients: meal.matchedIngredients,
    unmatchedIngredients: meal.unmatchedIngredients,
  };
}

function filterMealsForUser(meals, profile, groceryItems, blockedMeals) {
  return meals
    .filter((meal) => !blockedMeals.has(meal.normalizedName))
    .filter((meal) => isAgeSuitable(meal, profile.age))
    .filter((meal) => isDietaryCompatible(meal, profile.dietaryPreference))
    .filter((meal) => isSeasonCompatible(meal, profile.season))
    .filter((meal) => !hasAllergenConflict(meal, profile.allergens || []))
    .map((meal) => {
      const matchInfo = ingredientMatchInfo(meal, groceryItems);
      return {
        ...meal,
        matchedIngredients: matchInfo.matchedIngredients,
        unmatchedIngredients: matchInfo.unmatchedIngredients,
        hasIngredientMatch: matchInfo.hasMatch,
      };
    })
    .filter((meal) => meal.hasIngredientMatch);
}

function byCourse(meals, courseSet) {
  return meals.filter((meal) => courseSet.has(meal.course));
}

function filterMealsForProfile(meals, profile, blockedMeals) {
  return meals
    .filter((meal) => !blockedMeals.has(meal.normalizedName))
    .filter((meal) => isAgeSuitable(meal, profile.age))
    .filter((meal) => isDietaryCompatible(meal, profile.dietaryPreference))
    .filter((meal) => isSeasonCompatible(meal, profile.season))
    .filter((meal) => !hasAllergenConflict(meal, profile.allergens || []));
}

function matchIngredientToGroceryItem(rawIngredient) {
  const ingredient = normalizeText(rawIngredient);
  if (!ingredient) {
    return null;
  }

  const universe = loadGroceryUniverse();

  const exact = universe.find((item) => item.normalized === ingredient);
  if (exact) {
    return exact.raw;
  }

  const candidates = universe.filter((item) => {
    if (!item.normalized) {
      return false;
    }

    return ingredient.includes(item.normalized) || item.normalized.includes(ingredient);
  });

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((a, b) => b.normalized.length - a.normalized.length);
  return candidates[0].raw;
}

async function generateRecommendedGroceryItems(profile, userId, limit = 40) {
  const allMeals = loadMealsFromDataset();
  const blockedMeals = await getBlockedMealsByFeedback(userId);
  const filteredMeals = filterMealsForProfile(allMeals, profile, blockedMeals);

  const userDesha = profile.desha || profile.region;
  const byRegion = partitionByRegion(filteredMeals, userDesha);
  const encodedDosha = getEncodedDoshaVector(profile?.doshaScores);

  const scoreMap = new Map();

  const ingestMeals = (meals, regionWeight) => {
    for (const meal of meals) {
      const doshaScore = doshaCompatibilityScore(meal, encodedDosha);
      const doshaWeight = Math.max(0, doshaScore + 2);

      for (const ingredient of meal.ingredients || []) {
        const matched = matchIngredientToGroceryItem(ingredient);
        if (!matched) {
          continue;
        }

        const key = normalizeText(matched);
        if (!key) {
          continue;
        }

        const prev = scoreMap.get(key) || { name: matched, score: 0 };
        prev.score += regionWeight + doshaWeight;
        scoreMap.set(key, prev);
      }
    }
  };

  ingestMeals(byRegion.primary, 2);
  ingestMeals(byRegion.fallbackMixed, 1);

  return Array.from(scoreMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.name);
}

async function generateWeeklyMealPlan(profile, groceryItems, userId) {
  const allMeals = loadMealsFromDataset();
  const blockedMeals = await getBlockedMealsByFeedback(userId);

  const filteredMeals = filterMealsForUser(allMeals, profile, groceryItems, blockedMeals);

  const breakfastPool = byCourse(filteredMeals, new Set(['breakfast']));
  const mainsPool = byCourse(filteredMeals, new Set(['lunch', 'main course', 'one pot dish']));
  const sidePool = byCourse(filteredMeals, new Set(['side dish', 'snack']));
  const appetizerPool = byCourse(filteredMeals, new Set(['appetizer']));
  const dessertPool = byCourse(filteredMeals, new Set(['dessert']));

  const userDesha = profile.desha || profile.region;
  const breakfastByRegion = partitionByRegion(breakfastPool, userDesha);
  const mainsByRegion = partitionByRegion(mainsPool, userDesha);
  const sideByRegion = partitionByRegion(sidePool, userDesha);
  const appetizerByRegion = partitionByRegion(appetizerPool, userDesha);
  const dessertByRegion = partitionByRegion(dessertPool, userDesha);

  const breakfastEffective = [...breakfastByRegion.primary, ...breakfastByRegion.fallbackMixed];
  const mainsEffective = [...mainsByRegion.primary, ...mainsByRegion.fallbackMixed, ...mainsByRegion.fallbackOther];
  const sideEffective = [...sideByRegion.primary, ...sideByRegion.fallbackMixed, ...sideByRegion.fallbackOther];
  const appetizerEffective = [...appetizerByRegion.primary, ...appetizerByRegion.fallbackMixed, ...appetizerByRegion.fallbackOther];
  const dessertEffective = [...dessertByRegion.primary, ...dessertByRegion.fallbackMixed, ...dessertByRegion.fallbackOther];
  const breakfastAll = [...breakfastByRegion.primary, ...breakfastByRegion.fallbackMixed, ...breakfastByRegion.fallbackOther];

  if (
    breakfastEffective.length === 0 ||
    mainsEffective.length === 0 ||
    sideEffective.length === 0 ||
    appetizerEffective.length === 0 ||
    dessertEffective.length === 0
  ) {
    return {
      success: false,
      message: 'No valid meals available for one or more required meal slots after applying filters.',
      blockedMeals: Array.from(blockedMeals),
    };
  }

  const usedMeals = new Set();
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const days = [];

  for (const day of dayNames) {
    const breakfast = chooseMealWithRegionPriority(
      breakfastByRegion.primary.filter((m) => isDigestibilityAllowed('breakfast', m)),
      breakfastByRegion.fallbackMixed.filter((m) => isDigestibilityAllowed('breakfast', m)),
      breakfastByRegion.fallbackOther.filter((m) => isDigestibilityAllowed('breakfast', m)),
      profile,
      usedMeals,
      'breakfast'
    );
    const lunchMain = chooseMealWithRegionPriority(
      mainsByRegion.primary.filter((m) => isDigestibilityAllowed('lunchMain', m)),
      mainsByRegion.fallbackMixed.filter((m) => isDigestibilityAllowed('lunchMain', m)),
      mainsByRegion.fallbackOther.filter((m) => isDigestibilityAllowed('lunchMain', m)),
      profile,
      usedMeals,
      'lunchMain'
    );
    const lunchSide = chooseMealWithRegionPriority(
      sideByRegion.primary,
      sideByRegion.fallbackMixed,
      sideByRegion.fallbackOther,
      profile,
      usedMeals,
      'lunchSide'
    );
    const dinnerMain = chooseMealWithRegionPriority(
      mainsByRegion.primary.filter((m) => isDigestibilityAllowed('dinnerMain', m)),
      mainsByRegion.fallbackMixed.filter((m) => isDigestibilityAllowed('dinnerMain', m)),
      mainsByRegion.fallbackOther.filter((m) => isDigestibilityAllowed('dinnerMain', m)),
      profile,
      usedMeals,
      'dinnerMain'
    );
    const dinnerSide = chooseMealWithRegionPriority(
      sideByRegion.primary.filter((m) => isDigestibilityAllowed('dinnerSide', m)),
      sideByRegion.fallbackMixed.filter((m) => isDigestibilityAllowed('dinnerSide', m)),
      sideByRegion.fallbackOther.filter((m) => isDigestibilityAllowed('dinnerSide', m)),
      profile,
      usedMeals,
      'dinnerSide'
    );
    const appetizer = chooseMealWithRegionPriority(
      appetizerByRegion.primary,
      appetizerByRegion.fallbackMixed,
      appetizerByRegion.fallbackOther,
      profile,
      usedMeals,
      'appetizer'
    );
    const dessert = chooseMealWithRegionPriority(
      dessertByRegion.primary,
      dessertByRegion.fallbackMixed,
      dessertByRegion.fallbackOther,
      profile,
      usedMeals,
      'dessert'
    );

    if (!breakfast || !lunchMain || !lunchSide || !dinnerMain || !dinnerSide || !appetizer || !dessert) {
      return {
        success: false,
        message: 'Could not build full 7-day plan with current constraints. Please save more grocery items.',
        blockedMeals: Array.from(blockedMeals),
      };
    }

    days.push({
      day,
      breakfast: toMealChoice(breakfast),
      lunchMain: toMealChoice(lunchMain),
      lunchSide: toMealChoice(lunchSide),
      dinnerMain: toMealChoice(dinnerMain),
      dinnerSide: toMealChoice(dinnerSide),
      appetizer: toMealChoice(appetizer),
      dessert: toMealChoice(dessert),
    });
  }

  return {
    success: true,
    days,
    blockedMeals: Array.from(blockedMeals),
  };
}

module.exports = {
  generateWeeklyMealPlan,
  generateRecommendedGroceryItems,
};
