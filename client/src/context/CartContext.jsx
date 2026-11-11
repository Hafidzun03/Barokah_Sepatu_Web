import React, { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('barokah_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('barokah_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Clear cart upon user logout
  useEffect(() => {
    const handleLogout = () => {
      setCartItems([]);
      localStorage.removeItem('barokah_cart');
    };
    window.addEventListener('barokah:logout', handleLogout);
    return () => window.removeEventListener('barokah:logout', handleLogout);
  }, []);

  // Add item to cart
  const addToCart = (product, variant, quantity = 1) => {
    if (!variant) {
      toast.error('Silakan pilih ukuran sepatu terlebih dahulu!', { id: 'cart-feedback' });
      return false;
    }

    if (variant.stock < quantity) {
      toast.error(`Stok ukuran ${variant.size} tidak mencukupi (sisa ${variant.stock})`, { id: 'cart-feedback' });
      return false;
    }

    const existingIndex = cartItems.findIndex(
      item => item.product.id === product.id && item.variant.id === variant.id
    );

    if (existingIndex > -1) {
      const existingItem = cartItems[existingIndex];
      const newQty = existingItem.quantity + quantity;
      if (newQty > variant.stock) {
        toast.error(`Maksimal stok tercapai untuk ukuran ${variant.size}`, { id: 'cart-feedback' });
        return false;
      }
      setCartItems(prev =>
        prev.map((item, idx) =>
          idx === existingIndex ? { ...item, quantity: newQty } : item
        )
      );
      toast.success(`Jumlah ${product.name} (Size ${variant.size}) diperbarui!`, { id: 'cart-feedback' });
    } else {
      const unitPrice = product.discount_price || product.price;
      setCartItems(prev => [
        ...prev,
        {
          id: `${product.id}-${variant.id}`,
          product,
          variant,
          quantity,
          price: unitPrice
        }
      ]);
      toast.success(`${product.name} (Size ${variant.size}) ditambahkan ke keranjang!`, { id: 'cart-feedback' });
    }

    setIsDrawerOpen(true);
    return true;
  };

  // Update item quantity
  const updateQuantity = (itemId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(itemId);
      return;
    }

    const item = cartItems.find(i => i.id === itemId);
    if (item && newQty > item.variant.stock) {
      toast.error(`Stok maksimal tersedia: ${item.variant.stock}`, { id: 'cart-feedback' });
      return;
    }

    setCartItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, quantity: newQty } : item
      )
    );
  };

  // Remove item
  const removeFromCart = (itemId) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
    toast.success('Item dihapus dari keranjang', { id: 'cart-feedback' });
  };

  // Clear all items
  const clearCart = () => {
    setCartItems([]);
  };

  // Calculations
  const cartTotal = cartItems.reduce(
    (total, item) => total + (item.price * item.quantity),
    0
  );

  const totalItems = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      cartTotal,
      totalItems,
      isDrawerOpen,
      setIsDrawerOpen,
      toggleDrawer: () => setIsDrawerOpen(prev => !prev)
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
