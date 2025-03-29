-- Connect to your database
\c online_retail_db

-- Create tables matching your schema
CREATE TABLE IF NOT EXISTS products (
    stock_code VARCHAR(20) PRIMARY KEY,
    description TEXT,
    popularity_score INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS customers (
    customer_id VARCHAR(20) PRIMARY KEY,
    country VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS invoices (
    invoice_id VARCHAR(20) PRIMARY KEY,
    customer_id VARCHAR(20) REFERENCES customers(customer_id),
    invoice_date TIMESTAMP,
    country VARCHAR(50),
    is_cancelled BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id VARCHAR(20) REFERENCES invoices(invoice_id),
    stock_code VARCHAR(20) REFERENCES products(stock_code),
    quantity INTEGER,
    unit_price NUMERIC(10,2)
);