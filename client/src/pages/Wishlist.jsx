import React from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { ProductCard } from '../components/ProductCard';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';

export const Wishlist = () => {
  const { wishlist, totalWishlist } = useWishlist();

  return (
    <div style={{ minHeight: '80vh', padding: '50px 0 90px', backgroundColor: '#fcfbf9' }}>
      <div className="container">
        
        {/* Header Section */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: '36px',
          borderBottom: '1px solid #e5e5e5',
          paddingBottom: '20px'
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              fontWeight: '700',
              color: '#ba1a1a',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '6px'
            }}>
              <Heart size={14} fill="#ba1a1a" color="#ba1a1a" /> WISHLIST &amp; FAVORIT
            </div>
            <h1 style={{
              fontSize: '2.4rem',
              fontWeight: '900',
              color: '#080808',
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
              margin: 0
            }}>
              PRODUK DISUKAI ({totalWishlist})
            </h1>
          </div>

          <Link
            to="/shop"
            className="btn btn-outline btn-sm"
            style={{ fontWeight: '700' }}
          >
            JELAJAHI KATALOG <ArrowRight size={14} />
          </Link>
        </div>

        {/* Content */}
        {totalWishlist === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e5e5e5',
            maxWidth: '560px',
            margin: '40px auto'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: '#888888'
            }}>
              <Heart size={30} />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '900', textTransform: 'uppercase', marginBottom: '8px' }}>
              BELUM ADA PRODUK FAVORIT
            </h3>
            <p style={{ color: '#666666', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '24px' }}>
              Ketuk ikon hati pada produk yang Anda sukai untuk menyimpannya di sini dan membeli nanti kapan saja.
            </p>
            <Link to="/shop" className="btn btn-primary btn-md">
              <ShoppingBag size={16} /> MULAI JELAJAHI SEPATU
            </Link>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '24px'
          }}>
            {wishlist.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
export default Wishlist;
