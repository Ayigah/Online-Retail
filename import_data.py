import psycopg2
import csv
from datetime import datetime

def connect_db():
    return psycopg2.connect(
        dbname="online_retail_db",
        user="postgres",
        password="",
        host="localhost"
    )

def main():
    conn = connect_db()
    cur = conn.cursor()
    
    print("Starting data import...")
    
    with open('Online_Retail.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader, 1):
            # Insert product
            cur.execute("""
                INSERT INTO products (stock_code, description)
                VALUES (%s, %s)
                ON CONFLICT (stock_code) DO NOTHING
            """, (row['StockCode'], row['Description']))
            
            # Insert customer
            if row['CustomerID']:
                cur.execute("""
                    INSERT INTO customers (customer_id, country)
                    VALUES (%s, %s)
                    ON CONFLICT (customer_id) DO NOTHING
                """, (row['CustomerID'], row['Country']))
            
            # Insert invoice
            try:
                date_str = row['InvoiceDate']
                if '/' in date_str:  # MM/DD/YYYY format
                    invoice_date = datetime.strptime(date_str, '%m/%d/%Y %H:%M')
                else:  # YYYY-MM-DD format
                    invoice_date = datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
            except:
                invoice_date = None
            
            cur.execute("""
                INSERT INTO invoices (invoice_id, customer_id, invoice_date, country, is_cancelled)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (invoice_id) DO NOTHING
            """, (
                row['InvoiceNo'],
                row['CustomerID'],
                invoice_date,
                row['Country'],
                str(row['InvoiceNo']).startswith('C')
            ))
            
            # Insert invoice item
            try:
                cur.execute("""
                    INSERT INTO invoice_items (invoice_id, stock_code, quantity, unit_price)
                    VALUES (%s, %s, %s, %s)
                """, (
                    row['InvoiceNo'],
                    row['StockCode'],
                    int(float(row['Quantity'])),
                    float(row['UnitPrice'])
                ))
            except ValueError:
                continue
            
            if i % 1000 == 0:
                conn.commit()
                print(f"Processed {i} rows...")
    
    conn.commit()
    print("Data import completed successfully!")
    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
