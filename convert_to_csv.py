import pandas as pd

# Define file paths
input_file = "Online Retail.xlsx"
output_file = "Online Retail.csv"

# Convert Excel to CSV
df = pd.read_excel(input_file)
df.to_csv(output_file, index=False)

print(f"Conversion complete: {output_file}")
