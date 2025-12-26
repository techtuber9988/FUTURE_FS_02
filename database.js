const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database connection
const db = new sqlite3.Database(path.join(__dirname, 'ecommerce.db'), (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initDatabase();
  }
});

// Initialize database tables and sample data
function initDatabase() {
  // Create products table
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      category TEXT,
      image TEXT,
      stock INTEGER DEFAULT 0
    )
  `, (err) => {
    if (err) {
      console.error('Error creating products table:', err);
    } else {
      // Insert sample products
      insertSampleProducts();
    }
  });

  // Create orders table
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      email TEXT NOT NULL,
      address TEXT NOT NULL,
      total REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create order_items table
  db.run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      product_id INTEGER,
      quantity INTEGER,
      price REAL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);
}

function insertSampleProducts() {
  const sampleProducts = [
    ['Laptop Pro', 'High-performance laptop with 16GB RAM', 999.99, 'Electronics', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400', 15],
    ['Wireless Mouse', 'Ergonomic wireless mouse with USB receiver', 29.99, 'Electronics', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400', 50],
    ['Coffee Maker', 'Programmable coffee maker with timer', 79.99, 'Home', 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400', 30],
    ['Running Shoes', 'Comfortable running shoes for all terrains', 89.99, 'Sports', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', 25],
    ['Backpack', 'Durable backpack with laptop compartment', 49.99, 'Accessories', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', 40],
    ['Headphones', 'Noise-canceling wireless headphones', 149.99, 'Electronics', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', 20]
  ];

  const checkQuery = 'SELECT COUNT(*) as count FROM products';
  db.get(checkQuery, [], (err, row) => {
    if (err) {
      console.error('Error checking products:', err);
      return;
    }
    
    if (row.count === 0) {
      const stmt = db.prepare('INSERT INTO products (name, description, price, category, image, stock) VALUES (?, ?, ?, ?, ?, ?)');
      
      sampleProducts.forEach(product => {
        stmt.run(product, (err) => {
          if (err) console.error('Error inserting product:', err);
        });
      });
      
      stmt.finalize(() => {
        console.log('Sample products inserted successfully');
      });
    }
  });
}

module.exports = db;