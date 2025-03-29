require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
app.use(express.json());

// Test route
app.get('/ping', (req, res) => {
  res.send('pong');
});

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'online_retail_db',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// Database connection verification
(async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
})();

// Enhanced Swagger configuration with updated tags
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Online Retail Management API',
      version: '1.0.0',
      description: 'Comprehensive API for managing retail products and transactions',
      contact: {
        name: "API Support",
        email: "support@retailapi.com",
        url: "https://retailapi.com/support"
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT"
      }
    },
    servers: [
      { url: "http://localhost:3000", description: "Development" },
      { url: "https://api.retailapi.com/v1", description: "Production" }
    ],
    tags: [
      {
        name: 'MAIN APIs',
        description: 'Core product management endpoints'
      },
      {
        name: 'Other APIs',
        description: 'Additional supporting endpoints'
      }
    ],
    components: {
      schemas: {
        Product: {
          type: "object",
          properties: {
            stock_code: { 
              type: "string", 
              example: "85123A",
              description: "Unique product identifier"
            },
            description: { 
              type: "string", 
              example: "WHITE HANGING HEART T-LIGHT HOLDER",
              description: "Detailed product description"
            },
            popularity_score: { 
              type: "integer", 
              example: 100,
              description: "Product popularity rating (0-100)"
            }
          }
        },
        Customer: {
          type: "object",
          properties: {
            customer_id: { type: "string", example: "C12345" },
            country: { type: "string", example: "United Kingdom" }
          }
        },
        Invoice: {
          type: "object",
          properties: {
            invoice_id: { type: "string", example: "INV123" },
            customer_id: { type: "string", example: "C12345" },
            invoice_date: { type: "string", format: "date-time", example: "2023-01-01T12:00:00Z" },
            country: { type: "string", example: "Germany" },
            is_cancelled: { type: "boolean", example: false }
          }
        },
        InvoiceItem: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            invoice_id: { type: "string", example: "INV123" },
            stock_code: { type: "string", example: "85123A" },
            quantity: { type: "integer", example: 5 },
            unit_price: { type: "number", format: "float", example: 12.50 }
          }
        },
        MonthlySales: {
          type: "object",
          properties: {
            month: { type: "integer", example: 1 },
            total_sales: { type: "number", format: "float", example: 12500.50 }
          }
        },
        Error: {
          type: "object",
          properties: {
            error: { type: "string", example: "Not Found" },
            details: { type: "string", example: "Resource not found" }
          }
        }
      }
    }
  },
  apis: ['./app.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ================ MAIN API ENDPOINTS ================

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     description: Add a new product to the inventory
 *     tags: [MAIN APIs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
app.post('/api/products', async (req, res) => {
  try {
    const { stock_code, description } = req.body;
    
    if (!stock_code || !description) {
      return res.status(400).json({ 
        error: 'Bad Request',
        details: 'stock_code and description are required'
      });
    }

    const { rows } = await pool.query(
      'INSERT INTO products (stock_code, description) VALUES ($1, $2) RETURNING *',
      [stock_code, description]
    );
    
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      res.status(409).json({ 
        error: 'Conflict',
        details: 'Product with this stock_code already exists'
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to create product',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     description: Retrieve a list of all products
 *     tags: [MAIN APIs]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *         description: Maximum number of products to return
 *     responses:
 *       200:
 *         description: A list of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Product' }
 */
app.get('/api/products', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const { rows } = await pool.query('SELECT * FROM products LIMIT $1', [limit]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ 
      error: 'Failed to fetch products',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/products/{stock_code}:
 *   get:
 *     summary: Get a specific product by ID
 *     description: Retrieve detailed information about a product
 *     tags: [MAIN APIs]
 *     parameters:
 *       - in: path
 *         name: stock_code
 *         required: true
 *         schema: { type: string }
 *         description: The product's unique stock code
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Product' }
 *       404:
 *         description: Product not found
 */
app.get('/api/products/:stock_code', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM products WHERE stock_code = $1',
      [req.params.stock_code]
    );
    if (rows.length === 0) {
      return res.status(404).json({ 
        error: 'Product not found',
        details: `No product found with stock_code: ${req.params.stock_code}`
      });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ 
      error: 'Failed to fetch product',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/products/{stock_code}:
 *   put:
 *     summary: Update an existing product
 *     description: Modify product details
 *     tags: [MAIN APIs]
 *     parameters:
 *       - in: path
 *         name: stock_code
 *         required: true
 *         schema: { type: string }
 *         description: The product's unique stock code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Product not found
 */
app.put('/api/products/:stock_code', async (req, res) => {
  try {
    const { stock_code } = req.params;
    const { description, popularity_score } = req.body;

    // First verify the product exists
    const productCheck = await pool.query(
      'SELECT * FROM products WHERE stock_code = $1',
      [stock_code]
    );

    if (productCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Product not found',
        details: `No product found with stock_code: ${stock_code}`
      });
    }

    const currentProduct = productCheck.rows[0];

    // Validate at least one field is provided to update
    if (!description && popularity_score === undefined) {
      return res.status(400).json({
        error: 'Bad Request',
        details: 'At least one field (description or popularity_score) must be provided for update'
      });
    }

    // Update the product
    const { rows } = await pool.query(
      `UPDATE products 
       SET description = $1, 
           popularity_score = $2
       WHERE stock_code = $3
       RETURNING *`,
      [
        description || currentProduct.description,
        popularity_score !== undefined ? popularity_score : currentProduct.popularity_score,
        stock_code
      ]
    );

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({
      error: 'Failed to update product',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/products/{stock_code}:
 *   delete:
 *     summary: Delete a product
 *     description: Remove a product from the inventory
 *     tags: [MAIN APIs]
 *     parameters:
 *       - in: path
 *         name: stock_code
 *         required: true
 *         schema: { type: string }
 *         description: The product's unique stock code
 *     responses:
 *       204:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 */
app.delete('/api/products/:stock_code', async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM products WHERE stock_code = $1',
      [req.params.stock_code]
    );
    
    if (rowCount === 0) {
      return res.status(404).json({ 
        error: 'Product not found',
        details: `No product found with stock_code: ${req.params.stock_code}`
      });
    }
    
    res.status(204).end();
  } catch (err) {
    if (err.code === '23503') {
      res.status(409).json({ 
        error: 'Conflict',
        details: 'Cannot delete product referenced by invoice_items'
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to delete product',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }
});

// ================ OTHER API ENDPOINTS ================

/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: Get all customers
 *     description: Retrieve a list of customers
 *     tags: [Other APIs]
 *     parameters:
 *       - in: query
 *         name: country
 *         schema: { type: string }
 *         description: Filter by country
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *         description: Maximum number of customers to return
 *     responses:
 *       200:
 *         description: A list of customers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Customer' }
 */
app.get('/api/customers', async (req, res) => {
  try {
    const country = req.query.country;
    const limit = parseInt(req.query.limit) || 50;
    
    let query = 'SELECT * FROM customers';
    const params = [];
    
    if (country) {
      query += ' WHERE country = $1';
      params.push(country);
    }
    
    query += ' LIMIT $' + (params.length + 1);
    params.push(limit);
    
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ 
      error: 'Failed to fetch customers',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/customers/{customer_id}:
 *   get:
 *     summary: Get customer by ID
 *     description: Retrieve customer details
 *     tags: [Other APIs]
 *     parameters:
 *       - in: path
 *         name: customer_id
 *         required: true
 *         schema: { type: string }
 *         description: The customer's unique ID
 *     responses:
 *       200:
 *         description: Customer details
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Customer' }
 *       404:
 *         description: Customer not found
 */
app.get('/api/customers/:customer_id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM customers WHERE customer_id = $1',
      [req.params.customer_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ 
        error: 'Customer not found',
        details: `No customer found with ID: ${req.params.customer_id}`
      });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ 
      error: 'Failed to fetch customer',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/invoices:
 *   get:
 *     summary: Get all invoices
 *     description: Retrieve a list of invoices
 *     tags: [Other APIs]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *         description: Maximum number of invoices to return
 *     responses:
 *       200:
 *         description: A list of invoices
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Invoice' }
 */
app.get('/api/invoices', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const { rows } = await pool.query('SELECT * FROM invoices LIMIT $1', [limit]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ 
      error: 'Failed to fetch invoices',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/invoices/{invoice_id}:
 *   get:
 *     summary: Get invoice by ID
 *     description: Retrieve invoice details
 *     tags: [Other APIs]
 *     parameters:
 *       - in: path
 *         name: invoice_id
 *         required: true
 *         schema: { type: string }
 *         description: The invoice's unique ID
 *     responses:
 *       200:
 *         description: Invoice details
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Invoice' }
 *       404:
 *         description: Invoice not found
 */
app.get('/api/invoices/:invoice_id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM invoices WHERE invoice_id = $1',
      [req.params.invoice_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ 
        error: 'Invoice not found',
        details: `No invoice found with ID: ${req.params.invoice_id}`
      });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ 
      error: 'Failed to fetch invoice',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/invoice-items:
 *   get:
 *     summary: Get all invoice items
 *     description: Retrieve a list of invoice line items
 *     tags: [Other APIs]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *         description: Maximum number of items to return
 *     responses:
 *       200:
 *         description: A list of invoice items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/InvoiceItem' }
 */
app.get('/api/invoice-items', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const { rows } = await pool.query('SELECT * FROM invoice_items LIMIT $1', [limit]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ 
      error: 'Failed to fetch invoice items',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/invoice-items/{id}:
 *   get:
 *     summary: Get invoice item by ID
 *     description: Retrieve invoice line item details
 *     tags: [Other APIs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: The invoice item's unique ID
 *     responses:
 *       200:
 *         description: Invoice item details
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/InvoiceItem' }
 *       404:
 *         description: Invoice item not found
 */
app.get('/api/invoice-items/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM invoice_items WHERE id = $1',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ 
        error: 'Invoice item not found',
        details: `No invoice item found with ID: ${req.params.id}`
      });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ 
      error: 'Failed to fetch invoice item',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/sales/monthly:
 *   get:
 *     summary: Get monthly sales report
 *     description: Retrieve aggregated sales data by month
 *     tags: [Other APIs]
 *     responses:
 *       200:
 *         description: Monthly sales data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/MonthlySales' }
 */
app.get('/api/sales/monthly', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        EXTRACT(MONTH FROM invoice_date) AS month,
        SUM(quantity * unit_price) AS total_sales
      FROM invoices i
      JOIN invoice_items ii ON i.invoice_id = ii.invoice_id
      WHERE NOT i.is_cancelled
      GROUP BY month
      ORDER BY month
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ 
      error: 'Failed to generate sales report',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: System health check
 *     description: Verify API and database connectivity
 *     tags: [Other APIs]
 *     responses:
 *       200:
 *         description: System status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string }
 *                 database: { type: string }
 */
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ 
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Redirect root to API documentation
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
  Online Retail API 
  =================
  Environment: ${process.env.NODE_ENV || 'development'}
  API URL: http://localhost:${PORT}
  Documentation: http://localhost:${PORT}/api-docs
  Health Check: http://localhost:${PORT}/health
  `);
});