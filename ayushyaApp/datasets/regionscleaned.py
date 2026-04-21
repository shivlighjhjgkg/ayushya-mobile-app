import pandas as pd
import re

df = pd.read_csv("ayushyaApp\datasets\meal_prediction_dataset_cleaned.csv")
df_cleaned = df.copy()

changed_rows = []

# safer keyword mapping (NO short ambiguous words like "up")
region_keywords = {
    "North": ["punjab", "punjabi", "kashmir", "kashmiri", "delhi", "haryana", "himachal"],
    "South": ["tamil", "kerala", "karnataka", "andhra", "telangana", "udupi"],
    "West": ["gujarat", "gujarati", "rajasthan", "rajasthani", "maharashtra", "marathi", "goa"],
    "East": ["bengal", "bengali", "odisha", "oriya", "assam", "assamese"]
}

bad_regions = ["Mixed", "Global", "Unknown"]

for idx, row in df.iterrows():
    name = str(row["name_clean"]).lower()

    # split into words properly
    words = re.findall(r"\b[a-z]+\b", name)

    current_region = str(row["region"])

    if current_region in bad_regions:
        new_region = None

        for region, keywords in region_keywords.items():
            for keyword in keywords:
                if keyword in words:   # ✅ exact word match
                    new_region = region
                    break
            if new_region:
                break

        if new_region:
            changed_rows.append({
                "name": row["name_clean"],
                "old_region": current_region,
                "new_region": new_region
            })

            df_cleaned.at[idx, "region"] = new_region

# save outputs
df_cleaned.to_csv("cleaned_dataset.csv", index=False)
pd.DataFrame(changed_rows).to_csv("changed_rows.csv", index=False)

print(f"Total rows changed: {len(changed_rows)}")