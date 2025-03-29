// populate-db-fixed.js
const { Client } = require('pg');
const fs = require('fs');
const csv = require('csv-parser');

// PostgreSQL connection configuration
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'online_retail_db',
  password: 'your_password', // Replace with your actual password
  port: 5432,
  // Increase connection timeout
  connectionTimeoutMillis: 10000,
  // Allow multiple queries per connection
  allowExitOnIdle: false
});

// Array to batch insert rows
const batchSize = 1000;
let currentBatch = [];
let processedRows = 0;

async function processBatch(batch) {
  try {
    await client.query('BEGIN');
    
    for (const row of batch) {
      // Insert customer (if not exists)
      if (row.CustomerID) {
        await client.query(`
          INSERT INTO customers (customer_id, country)
          VALUES ($1, $2)
          ON CONFLICT (customer_id) DO NOTHING`,
          [row.CustomerID, row.Country]);
      }

      // Insert product (if not exists)
      if (row.StockCode && row.Description) {
        await client.query(`
          INSERT INTO products (stock_code, description)
          VALUES ($1, $2)
          ON CONFLICT (stock_code) DO NOTHING`,
          [row.StockCode, row.Description]);
      }

      // Insert invoice (handle cancellations)
      if (row.InvoiceNo) {
        const isCancelled = row.InvoiceNo.startsWith('C');
        await client.query(`
          INSERT INTO invoices (invoice_id, customer_id, invoice_date, country, is_cancelled)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (invoice_id) DO NOTHING`,
          [row.InvoiceNo, row.CustomerID, row.InvoiceDate, row.Country, isCancelled]);
      }

      // Insert invoice item
      if (row.InvoiceNo && row.StockCode) {
        await client.query(`
          INSERT INTO invoice_items (invoice_id, stock_code, quantity, unit_price)
          VALUES ($1, $2, $3, $4)`,
          [row.InvoiceNo, row.StockCode, row.Quantity, row.UnitPrice]);
      }
    }
    
    await client.query('COMMIT');
    processedRows += batch.length;
    console.log(`Processed ${processedRows} rows...`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error processing batch:', err);
  }
}

async function populateDatabase() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Create a read stream from the CSV file
    const stream = fs.createReadStream('OnlineRetail.csv')
      .pipe(csv())
      .on('data', (row) => {
        currentBatch.push(row);
        if (currentBatch.length >= batchSize) {
          stream.pause(); // Pause the stream while we process the batch
          processBatch([...currentBatch]).then(() => {
            currentBatch = [];
            stream.resume(); // Resume the stream after batch is processed
          });
        }
      })
      .on('end', async () => {
        // Process any remaining rows in the final batch
        if (currentBatch.length > 0) {
          await processBatch(currentBatch);
        }
        console.log('✅ Data loading completed successfully!');
        await client.end();
      })
      .on('error', (err) => {
        console.error('Error reading CSV:', err);
      });

  } catch (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  }
}

populateDatabase();