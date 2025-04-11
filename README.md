🛒 Online Retail API
This is a Node.js + Express backend API for managing an online retail dataset using PostgreSQL as the database. It provides CRUD operations for product data and includes Swagger UI for API documentation. A simple static frontend is also served from the public folder.

🚀 Features
RESTful API for product management

PostgreSQL database integration

Swagger UI for API documentation

Static frontend served via Express

Pagination support for product listing





📁 Project Structure
pgsql
Copy code
├── public/                 # Static frontend (index.html)
├── swagger.json           # Swagger API documentation
├── index.js               # Main server file
├── package.json           
🔧 Technologies Used
Node.js with Express




PostgreSQL (via pg library)

Swagger UI

Body-parser

HTML/CSS (basic static frontend)
🛠️ Getting Started
1. Clone the repository

   git clone https://github.com/your-username/online-retail-api.git
cd online-retail-api
2. Install dependencies

   npm install

3. Configure PostgreSQL
Make sure PostgreSQL is running and create a database called online_retail. Update the connection settings in index.js:

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'online_retail',
  password: '1234', // ← Change to your PostgreSQL password
  port: 5432,
});

4. Create the table

CREATE TABLE online_retail (
  invoiceno TEXT PRIMARY KEY,
  stockcode TEXT,
  description TEXT,
  quantity INTEGER,
  invoicedate TIMESTAMP,
  unitprice NUMERIC,
  customerid TEXT,
  country TEXT
);
5. Run the server
node index.js
📬 API Endpoints
Method	Endpoint	Description
GET	/products	Get all products (with pagination)
GET	/products/:id	Get product by invoice number
POST	/products	Add a new product
PUT	/products/:id	Update a product by ID
DELETE	/products/:id	Delete a product by ID
Swagger documentation is available at:
👉 http://localhost:3000/api-docs

🌐 Frontend
The app serves a static index.html file from the public/ folder. This is a basic form or interface (customize as needed) that interacts with your backend.

🧪 Sample cURL Request
curl -X POST http://localhost:3000/products \
-H "Content-Type: application/json" \
-d '{
  "invoiceno": "A123",
  "stockcode": "B456",
  "description": "Sample Product",
  "quantity": 10,
  "invoicedate": "2025-04-10T10:00:00",
  "unitprice": 9.99,
  "customerid": "C789",
  "country": "USA"
}'
📝 License
This project is licensed under the MIT License.
