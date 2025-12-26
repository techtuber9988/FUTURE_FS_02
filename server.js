const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// API Routes

// Get all products with optional filtering and search
app.get('/api/products', (req, res) => {
  const { category, search } = req.query;
  let query = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (category && category !== 'all') {
    query += ' AND category = ?';
    params.push(category);
  }

  if (search) {
    query += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get single product
app.get('/api/products/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(row);
  });
});

// Get all categories
app.get('/api/categories', (req, res) => {
  db.all('SELECT DISTINCT category FROM products', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows.map(row => row.category));
  });
});

// Create order
app.post('/api/orders', (req, res) => {
  const { customerName, email, address, items, total } = req.body;

  // Validate input
  if (!customerName || !email || !address || !items || items.length === 0) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  // Insert order
  const orderQuery = 'INSERT INTO orders (customer_name, email, address, total) VALUES (?, ?, ?, ?)';
  
  db.run(orderQuery, [customerName, email, address, total], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    const orderId = this.lastID;

    // Insert order items
    const itemStmt = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)');
    
    items.forEach(item => {
      itemStmt.run([orderId, item.id, item.quantity, item.price], (err) => {
        if (err) console.error('Error inserting order item:', err);
      });
    });

    itemStmt.finalize(() => {
      res.json({ 
        success: true, 
        orderId: orderId,
        message: 'Order placed successfully!' 
      });
    });
  });
});

// Get order by ID
app.get('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM orders WHERE id = ?', [id], (err, order) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Get order items
    db.all('SELECT * FROM order_items WHERE order_id = ?', [id], (err, items) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ ...order, items });
    });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});