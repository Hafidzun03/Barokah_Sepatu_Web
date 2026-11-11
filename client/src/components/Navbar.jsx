import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { 
  ShoppingBag, 
  Search, 
  User, 
  Menu, 
  X, 
  ShieldCheck, 
  Package, 
  LogOut, 
  ChevronDown,
  ArrowRight,
  Heart
} from 'lucide-react';
import { sampleCategories } from '../data/sampleProducts';
import { getCategories } from '../lib/productsApi';
import { useWishlist } from '../context/WishlistContext';

export const Navbar = () => {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { totalItems, toggleDrawer } = useCart();
  const { totalWishlist } = useWishlist();
  const [categories, setCategories] = useState(sampleCategories);
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    getCategories().then(cats => {
      if (cats && cats.length > 0) setCategories(cats);
    });
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchTerm.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="navbar-sticky">
      {/* Main Navigation Bar */}
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', gap: '24px' }}>
        
        {/* Brand Logo (Stitch Kinetic Luxury Aesthetic) */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '4px',
            backgroundColor: '#080808',
            color: '#b7d600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '900',
            fontFamily: 'var(--font-heading)',
            fontSize: '1.2rem',
            letterSpacing: '-1px'
          }}>
            B
          </div>
          <div>
            <div style={{
              fontSize: '1.35rem',
              fontWeight: '900',
              letterSpacing: '-0.04em',
              color: '#080808',
              fontFamily: 'var(--font-heading)',
              lineHeight: '1'
            }}>
              BAROKAH<span style={{ color: '#080808' }}>SHOES</span>
            </div>
            <div className="navbar-logo-tagline" style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              letterSpacing: '0.12em',
              color: '#666666',
              textTransform: 'uppercase',
              marginTop: '3px'
            }}>
              LUXURY STREETWEAR & FOOTWEAR
            </div>
          </div>
        </Link>

        {/* Search Bar (Architectural Style) */}
        <form 
          onSubmit={handleSearchSubmit}
          style={{
            flex: '1',
            maxWidth: '440px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center'
          }}
          className="desktop-search"
        >
          <input
            type="text"
            placeholder="CARI SILHOUETTE, MODEL, ATAU SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '11px 40px 11px 16px',
              borderRadius: '4px',
              border: '1px solid #e5e5e5',
              fontSize: '0.8rem',
              fontFamily: 'var(--font-mono)',
              outline: 'none',
              backgroundColor: '#fbf9f8',
              transition: 'border-color 0.2s ease',
              letterSpacing: '0.02em'
            }}
          />
          <button 
            type="submit" 
            style={{
              position: 'absolute',
              right: '12px',
              color: '#080808',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Search size={16} />
          </button>
        </form>

        {/* Navigation Links */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          fontFamily: 'var(--font-heading)',
          fontWeight: '700',
          fontSize: '0.85rem',
          letterSpacing: '0.04em',
          textTransform: 'uppercase'
        }} className="desktop-nav">
          <Link to="/" style={{ color: '#080808' }}>Beranda</Link>
          <Link to="/shop" style={{ color: '#080808' }}>Katalog</Link>

          {/* Category Dropdown */}
          <div style={{ position: 'relative' }} onMouseLeave={() => setCategoryDropdownOpen(false)}>
            <button 
              onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              onMouseEnter={() => setCategoryDropdownOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#080808', fontWeight: '700', textTransform: 'uppercase' }}
            >
              Kategori <ChevronDown size={14} />
            </button>
            {categoryDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '0',
                width: '240px',
                backgroundColor: '#ffffff',
                borderRadius: '4px',
                boxShadow: 'var(--shadow-md)',
                border: '1px solid #e5e5e5',
                padding: '6px 0',
                zIndex: 60
              }}>
                {categories.map(cat => (
                  <Link
                    key={cat.id}
                    to={`/shop?category=${cat.id}`}
                    onClick={() => setCategoryDropdownOpen(false)}
                    style={{
                      display: 'block',
                      padding: '10px 16px',
                      fontSize: '0.82rem',
                      fontFamily: 'var(--font-heading)',
                      fontWeight: '600',
                      color: '#080808',
                      textTransform: 'none'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#f4f4f4'}
                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Right Actions: Wishlist, Cart & Profile (Matching User Image) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          
          {/* 1. Wishlist / Favorit Icon (Heart with Black Badge) */}
          <Link
            to="/wishlist"
            style={{
              position: 'relative',
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              color: '#080808',
              textDecoration: 'none',
              transition: 'transform 0.15s ease'
            }}
            title="Produk Favorit (Wishlist)"
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Heart size={24} color="#080808" strokeWidth={1.9} />
            {totalWishlist > 0 && (
              <span style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                backgroundColor: '#080808',
                color: '#ffffff',
                fontSize: '0.68rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: '900',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #ffffff',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
              }}>
                {totalWishlist}
              </span>
            )}
          </Link>

          {/* 2. Cart Icon (Bag with Neon Green Badge) */}
          <button
            onClick={toggleDrawer}
            style={{
              position: 'relative',
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#080808',
              transition: 'transform 0.15s ease'
            }}
            title="Keranjang Belanja"
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <ShoppingBag size={24} color="#080808" strokeWidth={1.9} />
            {totalItems > 0 && (
              <span style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                backgroundColor: '#b7d600',
                color: '#080808',
                fontSize: '0.68rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: '900',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #ffffff',
                boxShadow: '0 2px 5px rgba(0,0,0,0.15)'
              }}>
                {totalItems}
              </span>
            )}
          </button>

          {/* 3. User Account Menu (Solid Rounded Black Square from Screenshot) */}
          <div style={{ position: 'relative' }} onMouseLeave={() => setUserDropdownOpen(false)}>
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: '#080808',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
              title={user ? (profile?.full_name || 'Profil Pengguna') : 'Masuk / Daftar Akun'}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <User size={20} color="#ffffff" strokeWidth={2.2} />
            </button>

            {/* Dropdown Menu */}
            {userDropdownOpen && (
              <div style={{
                position: 'absolute',
                right: '0',
                top: '115%',
                width: '240px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                boxShadow: '0 12px 36px rgba(0,0,0,0.18)',
                border: '1px solid #e5e5e5',
                padding: '8px 0',
                zIndex: 60
              }}>
                {user ? (
                  <>
                    <div style={{ padding: '10px 16px', borderBottom: '1px solid #f0f0f0' }}>
                      <div style={{ fontWeight: '800', fontSize: '0.9rem', color: '#080808' }}>
                        {profile?.full_name || 'Pelanggan Setia'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#666666', fontFamily: 'var(--font-mono)' }}>
                        {user.email}
                      </div>
                      <div style={{ 
                        marginTop: '6px',
                        display: 'inline-block', 
                        fontSize: '0.65rem', 
                        padding: '2px 8px', 
                        borderRadius: '2px',
                        backgroundColor: isAdmin ? '#b7d600' : '#080808',
                        color: isAdmin ? '#080808' : '#ffffff',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: '800'
                      }}>
                        {isAdmin ? 'ADMINISTRATOR' : 'CUSTOMER'}
                      </div>
                    </div>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 16px',
                          fontSize: '0.84rem',
                          fontWeight: '700',
                          color: '#080808'
                        }}
                      >
                        <ShieldCheck size={16} /> Admin Dashboard
                      </Link>
                    )}

                    <Link
                      to="/orders"
                      onClick={() => setUserDropdownOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 16px',
                        fontSize: '0.84rem',
                        color: '#080808',
                        fontWeight: '600'
                      }}
                    >
                      <Package size={16} /> Pesanan Saya
                    </Link>

                    <Link
                      to="/wishlist"
                      onClick={() => setUserDropdownOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 16px',
                        fontSize: '0.84rem',
                        color: '#080808',
                        fontWeight: '600'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Heart size={16} color="#e11d48" /> Favorit Saya
                      </span>
                      {totalWishlist > 0 && (
                        <span style={{
                          backgroundColor: '#080808',
                          color: '#fff',
                          fontSize: '0.68rem',
                          fontWeight: '800',
                          padding: '2px 6px',
                          borderRadius: '10px'
                        }}>
                          {totalWishlist}
                        </span>
                      )}
                    </Link>

                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 16px',
                        fontSize: '0.84rem',
                        color: '#080808',
                        fontWeight: '600'
                      }}
                    >
                      <User size={16} /> Pengaturan Profil
                    </Link>

                    <button
                      onClick={async () => {
                        setUserDropdownOpen(false);
                        await signOut();
                        navigate('/');
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 16px',
                        fontSize: '0.84rem',
                        fontWeight: '600',
                        color: '#ba1a1a',
                        borderTop: '1px solid #f0f0f0',
                        backgroundColor: 'transparent',
                        cursor: 'pointer'
                      }}
                    >
                      <LogOut size={16} /> Keluar
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
                      <div style={{ fontWeight: '800', fontSize: '0.9rem', color: '#080808' }}>
                        AKUN PENGGUNA
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#666', marginTop: '2px' }}>
                        Masuk untuk lacak pesanan &amp; simpan produk favorit.
                      </div>
                    </div>

                    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <Link
                        to="/login"
                        onClick={() => setUserDropdownOpen(false)}
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%', textAlign: 'center', justifyContent: 'center' }}
                      >
                        MASUK SEKARANG
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setUserDropdownOpen(false)}
                        className="btn btn-outline btn-sm"
                        style={{ width: '100%', textAlign: 'center', justifyContent: 'center' }}
                      >
                        DAFTAR AKUN BARU
                      </Link>
                    </div>

                    <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '6px' }}>
                      <Link
                        to="/wishlist"
                        onClick={() => setUserDropdownOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 16px',
                          fontSize: '0.84rem',
                          color: '#080808'
                        }}
                      >
                        <Heart size={16} color="#e11d48" /> Produk Favorit ({totalWishlist})
                      </Link>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button — shown via CSS on mobile only */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-toggle"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div style={{ backgroundColor: '#ffffff', padding: '16px 20px', borderTop: '1px solid #e5e5e5' }}>
          <form onSubmit={handleSearchSubmit} style={{ marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="CARI SEPATU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
            />
          </form>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontWeight: '700', textTransform: 'uppercase' }}>
            <Link to="/" onClick={() => setMobileMenuOpen(false)}>Beranda</Link>
            <Link to="/shop" onClick={() => setMobileMenuOpen(false)}>Katalog Semua Sepatu</Link>
            <Link to="/orders" onClick={() => setMobileMenuOpen(false)}>Pesanan Saya</Link>
            {isAdmin && <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>Admin Panel</Link>}
            {user ? (
              <button
                onClick={async () => {
                  setMobileMenuOpen(false);
                  await signOut();
                  navigate('/');
                }}
                style={{
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: '#ba1a1a',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <LogOut size={16} /> Keluar Akun
              </button>
            ) : (
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} style={{ color: '#080808' }}>Masuk / Daftar</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
