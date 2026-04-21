import pandas as pd
import os
import sys

# Force UTF-8 encoding for output
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

# Get the directory where this script is located
script_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(script_dir, 'meal_prediction_dataset_cleaned.csv')

# Load the CSV
df = pd.read_csv(csv_path)

# Analyze each column (skip name_clean and ingredients_tokens)
columns_to_analyze = df.drop(['name_clean', 'ingredients_tokens','url'], axis=1).columns

print("=" * 80)
print("LABEL COUNT ANALYSIS FOR EACH COLUMN")
print("=" * 80)

for column in columns_to_analyze:
    print(f"\n{'-' * 80}")
    print(f"Column: {column}")
    print(f"Total rows: {len(df)}")
    print(f"Unique labels: {df[column].nunique()}")
    print(f"{'-' * 80}")
    
    # Get value counts
    value_counts = df[column].value_counts()
    
    print(f"\n{'Label':<50} {'Count':>10} {'Percentage':>10}")
    print(f"{'-' * 50} {'-' * 10} {'-' * 10}")
    
    for label, count in value_counts.items():
        percentage = (count / len(df)) * 100
        # Truncate long labels and replace problematic characters
        label_str = str(label)[:47] + '...' if len(str(label)) > 50 else str(label)
        # Replace problematic Unicode chars
        label_str = label_str.encode('utf-8', errors='replace').decode('utf-8')
        print(f"{label_str:<50} {count:>10} {percentage:>9.1f}%")

# Summary
print(f"\n\n{'=' * 80}")
print("SUMMARY")
print(f"{'=' * 80}")
print(f"{'Column Name':<30} {'Unique Labels':<20}")
print(f"{'-' * 30} {'-' * 20}")

for column in columns_to_analyze:
    unique_count = df[column].nunique()
    print(f"{column:<30} {unique_count:<20}")

total_labels = sum(df[column].nunique() for column in columns_to_analyze)
print(f"\n✅ Total unique labels across all columns: {total_labels}")
