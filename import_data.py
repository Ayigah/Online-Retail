import psycopg2
import csv
from dateutil import parser  # ✅ Import dateutil parser

conn = psycopg2.connect(
    dbname="online_retail_db",
    user="postgres",
    password="",
    host="localhost"
)
cur = conn.cursor()

def safe_str(val):
    return str(val) if val and str(val).strip() != '' else None

with open('Online Retail.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        # Insert product
        cur.execute("""
            INSERT INTO products (stock_code, description)
            VALUES (%s, %s)
            ON CONFLICT (stock_code) DO NOTHING
        """, (safe_str(row['StockCode']), safe_str(row['Description'])))

        # Insert customer (if exists)
        if row['CustomerID']:
            cur.execute("""
                INSERT INTO customers (customer_id, country)
                VALUES (%s, %s)
                ON CONFLICT (customer_id) DO NOTHING
            """, (safe_str(row['CustomerID']), safe_str(row['Country'])))

        # ✅ Use dateutil.parser to handle different date formats
        invoice_date = parser.parse(row['InvoiceDate']) if row['InvoiceDate'] else None

        # Insert invoice
        cur.execute("""
            INSERT INTO invoices (invoice_id, customer_id, invoice_date, country, is_cancelled)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (invoice_id) DO NOTHING
        """, (
            safe_str(row['InvoiceNo']),
            safe_str(row['CustomerID']),
            invoice_date,
            safe_str(row['Country']),
            str(row['InvoiceNo']).startswith('C')
        ))

        # Insert invoice item
        cur.execute("""
            INSERT INTO invoice_items (invoice_id, stock_code, quantity, unit_price)
            VALUES (%s, %s, %s, %s)
        """, (
            safe_str(row['InvoiceNo']),
            safe_str(row['StockCode']),
            int(row['Quantity']) if row['Quantity'] else 0,
            float(row['UnitPrice']) if row['UnitPrice'] else 0
        ))

conn.commit()
cur.close()
conn.close()
print("Data import complete!")
