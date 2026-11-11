import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, Package, Heart, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';

/**
 * MobileBottomNav — Sticky bottom navigation bar, visible only on mobile (≤768px).
 * Provides quick access to key sections: Home, Shop, Cart, Wishlist, Account.
 */
export const MobileBottomNav = () => {
  const location = useLocation();
  const { totalItems, toggleDrawer } = useCart();
  const { totalWishlist } = useWishlist();
  const { user } = useAuth();

  // Hide on admin pages
  if (location.pathname.startsWith('/admin')) return null;

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const iconStyle = (active) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '3px',
    color: active ? '#080808' : '#999999',
    textDecoration: 'none',
    fontSize: '0.6rem',
    fontFamily: 'var(--font-mono)',
    fontWeight: '700',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    minWidth: '48px',
    padding: '4px 0',
    position: 'relative',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    transition: 'color 0.15s ease',
  });

  const activeDot = {
    position: 'absolute',
    bottom: '-4px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    backgroundColor: '#b7d600',
  };

  return (
    <nav className="mobile-bottom-nav" role="navigation" aria-label="Mobile navigation">
      {/* Home */}
      <Link to="/" style={iconStyle(isActive('/'))}>
        <Home size={22} strokeWidth={isActive('/') ? 2.2 : 1.7} />
        <span>Beranda</span>
        {isActive('/') && <span style={activeDot} />}
      </Link>

      {/* Shop */}
      <Link to="/shop" style={iconStyle(isActive('/shop'))}>
        <ShoppingBag size={22} strokeWidth={isActive('/shop') ? 2.2 : 1.7} />
        <span>Katalog</span>
        {isActive('/shop') && <span style={activeDot} />}
      </Link>

      {/* Cart (opens drawer) */}
      <button onClick={toggleDrawer} style={{ ...iconStyle(false), position: 'relative' }}>
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <ShoppingBag size={22} strokeWidth={1.7} color={totalItems > 0 ? '#080808' : '#999999'} />
          {totalItems > 0 && (
            <span style={{
              position: 'absolute',
              top: '-6px',
              right: '-8px',
              backgroundColor: '#b7d600',
              color: '#080808',
              fontSize: '0.6rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: '900',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #ffffff',
            }}>
              {totalItems > 9 ? '9+' : totalItems}
            </span>
          )}
        </div>
        <span style={{ color: totalItems > 0 ? '#080808' : '#999999' }}>Keranjang</span>
      </button>

      {/* Wishlist */}
      <Link to="/wishlist" style={{ ...iconStyle(isActive('/wishlist')), position: 'relative' }}>
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <Heart size={22} strokeWidth={isActive('/wishlist') ? 2.2 : 1.7} />
          {totalWishlist > 0 && (
            <span style={{
              position: 'absolute',
              top: '-6px',
              right: '-8px',
              backgroundColor: '#080808',
              color: '#ffffff',
              fontSize: '0.6rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: '900',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #ffffff',
            }}>
              {totalWishlist > 9 ? '9+' : totalWishlist}
            </span>
          )}
        </div>
        <span>Favorit</span>
        {isActive('/wishlist') && <span style={activeDot} />}
      </Link>

      {/* Account */}
      <Link to={user ? '/profile' : '/login'} style={iconStyle(isActive('/profile') || isActive('/login'))}>
        <User size={22} strokeWidth={isActive('/profile') || isActive('/login') ? 2.2 : 1.7} />
        <span>{user ? 'Akun' : 'Masuk'}</span>
        {(isActive('/profile') || isActive('/login')) && <span style={activeDot} />}
      </Link>
    </nav>
  );
};
