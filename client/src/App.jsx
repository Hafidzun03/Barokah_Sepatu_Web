import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

import { ScrollToTop } from './components/ScrollToTop';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { SupabaseNotice } from './components/SupabaseNotice';
import { SizeGuideModal } from './components/SizeGuideModal';
import { MobileBottomNav } from './components/MobileBottomNav';

import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Wishlist } from './pages/Wishlist';
import { Checkout } from './pages/Checkout';
import { Orders } from './pages/Orders';
import { OrderDetail } from './pages/OrderDetail';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Profile } from './pages/Profile';
import { AdminDashboard } from './pages/admin/AdminDashboard';

const AppContent = ({ isGlobalSizeGuideOpen, setIsGlobalSizeGuideOpen }) => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: isAdmin ? '#F8FAFC' : undefined }}>
      <SizeGuideModal 
        isOpen={isGlobalSizeGuideOpen} 
        onClose={() => setIsGlobalSizeGuideOpen(false)} 
      />
      <Toaster 
        position="top-right" 
        containerClassName="no-print"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#0f172a',
            color: '#fff',
            borderRadius: '12px',
            fontWeight: '600',
            fontSize: '0.9rem'
          }
        }} 
      />
      
      {!isAdmin && <SupabaseNotice />}
      {!isAdmin && <Navbar />}
      {!isAdmin && <CartDrawer />}

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/order/:orderId" element={<OrderDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<AdminDashboard initialNav="products" />} />
          <Route path="/admin/categories" element={<AdminDashboard initialNav="categories" />} />
          <Route path="/admin/stock" element={<AdminDashboard initialNav="stock" />} />
          <Route path="/admin/ukuran-stok" element={<AdminDashboard initialNav="stock" />} />
          <Route path="/admin/orders" element={<AdminDashboard initialNav="orders" />} />
          <Route path="/admin/pesanan" element={<AdminDashboard initialNav="orders" />} />
          <Route path="/admin/payments" element={<AdminDashboard initialNav="payments" />} />
          <Route path="/admin/pembayaran" element={<AdminDashboard initialNav="payments" />} />
          <Route path="/admin/customers" element={<AdminDashboard initialNav="customers" />} />
          <Route path="/admin/pelanggan" element={<AdminDashboard initialNav="customers" />} />
          <Route path="/admin/reports" element={<AdminDashboard initialNav="reports" />} />
          <Route path="/admin/laporan" element={<AdminDashboard initialNav="reports" />} />
          <Route path="/admin/reviews" element={<AdminDashboard initialNav="reviews" />} />
          <Route path="/admin/ulasan" element={<AdminDashboard initialNav="reviews" />} />
          <Route path="/admin/settings" element={<AdminDashboard initialNav="settings" />} />
          <Route path="/admin/pengaturan" element={<AdminDashboard initialNav="settings" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!isAdmin && <Footer />}
      {!isAdmin && <MobileBottomNav />}
    </div>
  );
};

export const App = () => {
  const [isGlobalSizeGuideOpen, setIsGlobalSizeGuideOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsGlobalSizeGuideOpen(true);
    window.addEventListener('open-size-guide', handleOpen);
    return () => window.removeEventListener('open-size-guide', handleOpen);
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <Router>
            <ScrollToTop />
            <AppContent 
              isGlobalSizeGuideOpen={isGlobalSizeGuideOpen} 
              setIsGlobalSizeGuideOpen={setIsGlobalSizeGuideOpen} 
            />
          </Router>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
