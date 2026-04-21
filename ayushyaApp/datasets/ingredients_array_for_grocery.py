"""
extract_ingredients.py
──────────────────────
Reads meal_prediction_dataset_cleaned.csv, cleans every entry in the
`ingredients_tokens` column, and produces a deduplicated list of pure
ingredient names suitable for use as grocery-list checkboxes.

Cleaning pipeline:
 1.  Parse Python-list literal in each cell.
 2.  Drop Devanagari / Hindi-script entries.
 3.  Strip trailing descriptors after 2+ spaces ("onion   finely chopped" → "onion")
 4.  Strip leading fraction / decimal quantity prefixes.
 5.  Strip leading "s " teaspoon-artefact.
 6.  Strip leading unit-count words (inch, cloves, sprig, pinch…) — up to 4 passes.
 7.  Strip leading weight abbreviations ("g chicken", "gm potato" → clean name).
 8.  Remove parenthetical alternate names ("cumin seeds (jeera)" → "cumin seeds").
 9.  Strip stray symbols from both ends.
10.  Lower-case, collapse whitespace.
11.  Drop noise tokens (numbers, short strings, instruction words, noise phrases).
12.  Normalisation pass — canonical spelling map collapses variants
     (chili→chilli, amchoor→amchur, plurals→singular, soy→soya, etc.)
13.  Deduplicate and sort alphabetically.
"""

import re, ast
import pandas as pd
from pathlib import Path

# ── Config ────────────────────────────────────────────────────────────────────

INPUT_CSV  = "ayushyaApp\datasets\meal_prediction_dataset_cleaned.csv"
OUTPUT_TXT = "ayushyaApp\datasets\grocerylist.txt"

# Exact tokens to drop after cleaning
EXCLUDE_EXACT = {
    "water", "salt", "oil", "sugar", "pepper",
    "as needed", "to taste", "as required", "as per taste",
    "as per use", "optional", "for garnish", "for cooking",
    "according to taste", "ada", "aa", "yield", "arabic",
    "coal", "coals", "green",
    "all purpose pie crust",
}

# Drop tokens that START with these phrases
EXCLUDE_STARTSWITH = (
    "a pinch", "as per", "as required", "according",
    "aerated water", "for ", "to taste", "or ",
    "g small", "gm ", "g ", "s extra",
)

# ── Canonical spelling map ────────────────────────────────────────────────────

CANONICAL = {
    # chili/chilli spelling
    "chili": "chilli",
    "red chili": "red chilli",
    "red chili powder": "red chilli powder",
    "green chili": "green chilli",
    "dry red chili": "dry red chilli",
    "dried red chili": "dried red chilli",
    "fresh red chili": "fresh red chilli",
    "kashmiri red chili powder": "kashmiri red chilli powder",
    "kashmiri red chili": "kashmiri red chilli",
    # chillies → chilli
    "red chillies": "red chilli",
    "green chillies": "green chilli",
    "dry red chillies": "dry red chilli",
    "dried red chillies": "dried red chilli",
    "fresh red chillies": "fresh red chilli",
    "kashmiri dry red chillies": "kashmiri dry red chilli",
    "chilies": "chilli",
    "red chilies": "red chilli",
    "green chilies": "green chilli",
    "dry red chilies": "dry red chilli",
    # amchur / amchoor
    "amchoor": "amchur",
    "amchoor powder": "amchur powder",
    # soy / soya
    "soy sauce": "soya sauce",
    "soy chunks": "soya chunks",
    "soy milk": "soya milk",
    # asafoetida
    "asafetida": "asafoetida",
    # lemongrass
    "lemon grass": "lemongrass",
    "stock lemon grass": "lemongrass",
    "stock lemongrass": "lemongrass",
    # peppercorn
    "black pepper corn": "black peppercorn",
    "black pepper corns": "black peppercorn",
    "black peppercorns": "black peppercorn",
    # sun-dried tomato
    "sun dried tomatoes": "sundried tomatoes",
    "sun dried tomato": "sundried tomatoes",
    # flaxseed
    "flax seed powder": "flaxseed powder",
    "flax seeds": "flaxseed",
    "flax seed": "flaxseed",
    # kabuli chana
    "kabuli channa": "kabuli chana",
    # star anise
    "star anis": "star anise",
    # garlic
    "bud garlic": "garlic",
    "buds garlic": "garlic",
    # misc leaks
    "s extra virgin olive oil": "extra virgin olive oil",
    "s coriander powder": "coriander powder",
    "s maharashtrian goda masala": "maharashtrian goda masala",
    "lemon juiced": "lemon juice",
    "ragi dosa battter": "ragi dosa batter",
    "dal curry leaves": "curry leaves",
    "dali curry leaves": "curry leaves",
    # plurals → singular
    "almonds": "almond",
    "apples": "apple",
    "avocados": "avocado",
    "bananas": "banana",
    "beetroots": "beetroot",
    "black peppers": "black pepper",
    "breads": "bread",
    "brinjals": "brinjal",
    "button mushrooms": "button mushroom",
    "carrots": "carrot",
    "cashews": "cashew",
    "chicken breasts": "chicken breast",
    "chicken thighs": "chicken thigh",
    "chickpea lentils": "chickpea lentil",
    "crabs": "crab",
    "cucumbers": "cucumber",
    "drumsticks": "drumstick",
    "egg whites": "egg white",
    "eggs": "egg",
    "eggplants": "eggplant",
    "english cucumbers": "english cucumber",
    "green bell peppers": "green bell pepper",
    "green onions": "green onion",
    "kachris": "kachri",
    "lemons": "lemon",
    "mangoes": "mango",
    "onions": "onion",
    "oranges": "orange",
    "papads": "papad",
    "papdi puris": "papdi puri",
    "raw bananas": "raw banana",
    "red onions": "red onion",
    "stone flowers": "stone flower",
    "tawa parathas": "tawa paratha",
}

# ── Regex helpers ─────────────────────────────────────────────────────────────

RE_FRACTION_PREFIX = re.compile(r"^[\d/\s]+\s+")
RE_S_PREFIX        = re.compile(r"^s\s+", re.IGNORECASE)
RE_DEVANAGARI      = re.compile(r"[\u0900-\u097F]")
RE_TRAILING_DESC   = re.compile(r"\s{2,}.*$")
RE_PAREN           = re.compile(r"\s*\(.*?\)")
RE_JUNK            = re.compile(r"[\"'\\`*_\[\]\{\}~^]")
RE_WEIGHT_PREFIX   = re.compile(r"^(?:gm?|kg|ml|mg|oz|lb)\s+", re.IGNORECASE)

UNIT_WORDS = (
    "inch","inches","clove","cloves","sprig","sprigs","pinch","pinches",
    "handful","handfuls","bunch","bunches","stalk","stalks","pod","pods",
    "drop","drops","slice","slices","piece","pieces","cube","cubes",
    "knob","head","packet","packets","cup","cups",
    "tbsp","tablespoon","tablespoons","tsp","teaspoon","teaspoons",
    "ml","litre","litres","liter","liters","gram","grams","kg","kilogram",
    "oz","ounce","ounces","lb","pound","pounds","big","small","medium","large","whole",
)
RE_UNIT_PREFIX = re.compile(
    r"^(?:" + "|".join(re.escape(w) for w in UNIT_WORDS) + r"s?)\s+",
    re.IGNORECASE,
)

INSTRUCTION_WORDS = {
    "finely","chopped","sliced","grated","boiled","cooked","fried",
    "roasted","soaked","dried","frozen","crushed","minced","diced","peeled",
}

# ── Core cleaning function ────────────────────────────────────────────────────

def clean_token(raw: str):
    token = raw.strip()

    if RE_DEVANAGARI.search(token):
        return None

    token = RE_TRAILING_DESC.sub("", token).strip()
    token = RE_FRACTION_PREFIX.sub("", token).strip()
    token = RE_S_PREFIX.sub("", token).strip()

    for _ in range(4):
        m = RE_UNIT_PREFIX.match(token)
        if m:
            token = token[m.end():].strip()
        else:
            break

    token = RE_FRACTION_PREFIX.sub("", token).strip()
    token = RE_WEIGHT_PREFIX.sub("", token).strip()
    token = RE_PAREN.sub("", token).strip()
    token = RE_JUNK.sub("", token).strip()
    token = re.sub(r"^[+\-=/#%*,.\s]+", "", token).strip()
    token = token.strip("/ ,.-+=#")
    token = re.sub(r"\s+", " ", token).strip().lower()

    if not token or len(token) < 3:
        return None
    if re.match(r"^[\d/.\s]+$", token):
        return None
    if token[0].isdigit():
        return None
    if token in EXCLUDE_EXACT:
        return None
    if any(token.startswith(p) for p in EXCLUDE_STARTSWITH):
        return None
    if all(w in INSTRUCTION_WORDS for w in token.split()):
        return None

    return token


def normalise(token: str) -> str:
    return CANONICAL.get(token, token)


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print(f"Reading {INPUT_CSV} ...")
    df = pd.read_csv(INPUT_CSV)

    raw_count = 0
    seen: dict = {}

    for cell in df["ingredients_tokens"].dropna():
        try:
            items = ast.literal_eval(cell)
        except (ValueError, SyntaxError):
            items = [i.strip().strip("'\"") for i in cell.strip("[]").split(",")]

        for raw in items:
            raw_count += 1
            clean = clean_token(str(raw))
            if clean is None:
                continue
            canonical = normalise(clean)
            if canonical not in seen:
                seen[canonical] = None

    ingredients = sorted(seen.keys())

    print(f"\n  Processed  {raw_count:,}  raw tokens")
    print(f"  Unique clean ingredients: {len(ingredients):,}")

    Path(OUTPUT_TXT).parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_TXT, "w", encoding="utf-8") as f:
        f.write("# Grocery Ingredients - Checkbox Vector\n")
        f.write(f"# Total unique ingredients: {len(ingredients)}\n")
        f.write("# One ingredient per line - use directly as checkbox labels in your UI\n\n")
        for ing in ingredients:
            f.write(ing + "\n")

    print(f"  Saved to:  {OUTPUT_TXT}")

    print("\nSample - first 50:")
    for i in ingredients[:50]:
        print(f"  [ ]  {i}")
    print("  ...")
    print("\nSample - last 15:")
    for i in ingredients[-15:]:
        print(f"  [ ]  {i}")


if __name__ == "__main__":
    main()