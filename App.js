import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [loading, setLoading] = useState(true);

  // Checkout form state
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    address: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [orderSuccess, setOrderSuccess] = useState(false);

  // API Base URL
  const API_URL = 'http://localhost:5000/api';

  // Fetch products and categories
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Filter products when category or search changes
  useEffect(() => {
    filterProducts();
  }, [selectedCategory, searchTerm, products]);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/products`);
      const data = await response.json();
      setProducts(data);
      setFilteredProducts(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/categories`);
      const data = await response.json();
      setCategories(['all', ...data]);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }
    
    setCart(cart.map(item =>
      item.id === productId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.customerName.trim()) {
      errors.customerName = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.address.trim()) {
      errors.address = 'Address is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const orderData = {
        customerName: formData.customerName,
        email: formData.email,
        address: formData.address,
        items: cart,
        total: getCartTotal()
      };

      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();
      
      if (data.success) {
        setOrderSuccess(true);
        setCart([]);
        setTimeout(() => {
          setShowCheckout(false);
          setOrderSuccess(false);
          setFormData({ customerName: '', email: '', address: '' });
        }, 3000);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Error placing order. Please try again.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <div className="App">
      {/* Header */}
      <header className="header">
        <div className="container">
          <h1>🛒 Mini E-Commerce Store</h1>
          <button className="cart-button" onClick={() => setShowCart(!showCart)}>
            Cart ({cart.length}) - ${getCartTotal().toFixed(2)}
          </button>
        </div>
      </header>

      {/* Search and Filter */}
      <div className="filters container">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        
        <div className="category-filters">
          {categories.map(category => (
            <button
              key={category}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="container">
        {loading ? (
          <p className="loading">Loading products...</p>
        ) : (
          <div className="products-grid">
            {filteredProducts.map(product => (
              <div key={product.id} className="product-card">
                <img src={product.image} alt={product.name} />
                <h3>{product.name}</h3>
                <p className="description">{product.description}</p>
                <p className="category">{product.category}</p>
                <div className="product-footer">
                  <span className="price">${product.price}</span>
                  <button onClick={() => addToCart(product)} className="add-btn">
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {!loading && filteredProducts.length === 0 && (
          <p className="no-products">No products found.</p>
        )}
      </div>

      {/* Shopping Cart Modal */}
      {showCart && (
        <div className="modal-overlay" onClick={() => setShowCart(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Shopping Cart</h2>
              <button onClick={() => setShowCart(false)} className="close-btn">×</button>
            </div>
            
            {cart.length === 0 ? (
              <p className="empty-cart">Your cart is empty</p>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map(item => (
                    <div key={item.id} className="cart-item">
                      <img src={item.image} alt={item.name} />
                      <div className="cart-item-details">
                        <h4>{item.name}</h4>
                        <p>${item.price}</p>
                      </div>
                      <div className="quantity-controls">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="remove-btn">
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="cart-footer">
                  <h3>Total: ${getCartTotal().toFixed(2)}</h3>
                  <button 
                    onClick={() => {
                      setShowCart(false);
                      setShowCheckout(true);
                    }}
                    className="checkout-btn"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="modal-overlay" onClick={() => setShowCheckout(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Checkout</h2>
              <button onClick={() => setShowCheckout(false)} className="close-btn">×</button>
            </div>
            
            {orderSuccess ? (
              <div className="success-message">
                <h3>✓ Order Placed Successfully!</h3>
                <p>Thank you for your purchase.</p>
              </div>
            ) : (
              <form onSubmit={handleCheckout} className="checkout-form">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    className={formErrors.customerName ? 'error' : ''}
                  />
                  {formErrors.customerName && <span className="error-text">{formErrors.customerName}</span>}
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={formErrors.email ? 'error' : ''}
                  />
                  {formErrors.email && <span className="error-text">{formErrors.email}</span>}
                </div>

                <div className="form-group">
                  <label>Shipping Address *</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="3"
                    className={formErrors.address ? 'error' : ''}
                  />
                  {formErrors.address && <span className="error-text">{formErrors.address}</span>}
                </div>

                <div className="order-summary">
                  <h3>Order Summary</h3>
                  {cart.map(item => (
                    <div key={item.id} className="summary-item">
                      <span>{item.name} x {item.quantity}</span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="summary-total">
                    <strong>Total:</strong>
                    <strong>${getCartTotal().toFixed(2)}</strong>
                  </div>
                </div>

                <button type="submit" className="place-order-btn">
                  Place Order
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;