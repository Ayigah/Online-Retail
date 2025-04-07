// Function to fetch products and render them in a table
async function fetchProducts(page = 1) {
    const limit = 10; // You can change the limit for pagination
    const response = await fetch(`/products?page=${page}&limit=${limit}`);
    const data = await response.json();
  
    const productsTable = document.getElementById('productsTable');
    const pagination = document.getElementById('pagination');
  
    // Clear previous rows
    productsTable.innerHTML = '';
  
    // Add new rows
    data.products.forEach(product => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${product.invoiceno}</td>
        <td>${product.stockcode}</td>
        <td>${product.description}</td>
        <td>${product.quantity}</td>
        <td>${product.invoicedate}</td>
        <td>${product.unitprice}</td>
        <td>${product.customerid}</td>
        <td>${product.country}</td>
      `;
      productsTable.appendChild(row);
    });
  
    // Pagination controls
    pagination.innerHTML = '';
    const totalPages = Math.ceil(data.total / limit);
    for (let i = 1; i <= totalPages; i++) {
      const pageButton = document.createElement('button');
      pageButton.textContent = i;
      pageButton.onclick = () => fetchProducts(i);
      pagination.appendChild(pageButton);
    }
  }
  
  // Initial load
  fetchProducts();
  
  // Event listener for the Add Product button (optional)
  document.getElementById('addProductBtn').addEventListener('click', async () => {
    const product = {
      invoiceno: 'NEW123',
      stockcode: 'SC123',
      description: 'New Product',
      quantity: 100,
      invoicedate: new Date().toISOString(),
      unitprice: 19.99,
      customerid: 101,
      country: 'USA',
    };
  
    const response = await fetch('/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(product),
    });
  
    if (response.ok) {
      alert('Product added successfully');
      fetchProducts();
    } else {
      alert('Error adding product');
    }
  });
  