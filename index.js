const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json'); // Swagger JSON file
const path = require('path'); // Required for serving static files

const app = express();
const port = 3000;

// PostgreSQL connection setup
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'online_retail',
  password: '1234', // Make sure this password matches your PostgreSQL password
  port: 5432,
});

app.use(bodyParser.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));  // Assuming index.html is in the "public" folder

// Root route to show Swagger UI or redirect to the front-end
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));  // Sends the index.html file
});

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Get all products with pagination
app.get('/products', async (req, res) => {
  const { page = 1, limit = 10 } = req.query; // Default to page 1 and limit 10
  const offset = (page - 1) * limit; // Calculate the offset based on page

  try {
    const result = await pool.query(
      'SELECT * FROM online_retail ORDER BY invoiceno LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    res.json({
      page,
      limit,
      total: result.rowCount,
      products: result.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching products');
  }
});

// Get a specific product by ID
app.get('/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM online_retail WHERE invoiceno = $1', [id]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).send('Product not found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching product');
  }
});

// Add a new product
app.post('/products', async (req, res) => {
  const { invoiceno, stockcode, description, quantity, invoicedate, unitprice, customerid, country } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO online_retail (invoiceno, stockcode, description, quantity, invoicedate, unitprice, customerid, country) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [invoiceno, stockcode, description, quantity, invoicedate, unitprice, customerid, country]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error adding product');
  }
});

// Update an existing product
app.put('/products/:id', async (req, res) => {
  const { id } = req.params;
  const { stockcode, description, quantity, invoicedate, unitprice, customerid, country } = req.body;
  try {
    const result = await pool.query(
      'UPDATE online_retail SET stockcode = $1, description = $2, quantity = $3, invoicedate = $4, unitprice = $5, customerid = $6, country = $7 WHERE invoiceno = $8 RETURNING *',
      [stockcode, description, quantity, invoicedate, unitprice, customerid, country, id]
    );
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).send('Product not found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating product');
  }
});

// Delete a product
app.delete('/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM online_retail WHERE invoiceno = $1 RETURNING *', [id]);
    if (result.rows.length > 0) {
      res.json({ message: 'Product deleted', deleted: result.rows[0] });
    } else {
      res.status(404).send('Product not found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting product');
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
