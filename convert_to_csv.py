import os
import pandas as pd

# Verify file exists
if not os.path.exists('Online_Retail.xlsx'):
    print("Error: Excel file not found!")
    print("Please ensure 'Online Retail.xlsx' exists in this directory")
    exit(1)

try:
    # Read with explicit engine
    df = pd.read_excel(
        'Online_Retail.xlsx',
        engine='openpyxl',  # Explicitly specify engine
        dtype=str,
        na_values=['', 'NA', 'N/A', 'NaN']
    )
    
    # Save CSV
    df.to_csv('Online_Retail.csv', index=False, encoding='utf-8')
    print("Conversion successful!")
    print(f"Total rows: {len(df)}")
    print(f"Unique products: {df['StockCode'].nunique()}")

except Exception as e:
    print(f"Error during conversion: {str(e)}")