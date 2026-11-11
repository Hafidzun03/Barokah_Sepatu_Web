import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatIDR } from '../lib/utils';
import { Star, ShoppingBag, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

export const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const navigate = useNavigate();
  const isFav = isInWishlist(product.id);
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants && product.variants.length > 0 ? product.variants[0] : null
  );

  const discountPercent = product.discount_price 
    ? Math.round(((product.price - product.discount_price) / product.price) * 100) 
    : 0;

  const currentPrice = product.discount_price || product.price;

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedVariant) {
      navigate(`/product/${product.slug}`);
      return;
    }
    addToCart(product, selectedVariant, 1);
  };

  const mainImage = (product.images && product.images.length > 0)
    ? product.images[0]
    : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="product-card">
      {/* Product Image Stage */}
      <div style={{ position: 'relative' }}>
        <Link to={`/product/${product.slug}`} className="product-card-img-stage" style={{ display: 'block' }}>
          <img 
            src={mainImage} 
            alt={product.name} 
            className="product-card-img" 
            loading="lazy" 
          />
        </Link>

        {/* Wishlist Heart Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
          }}
          aria-label={isFav ? "Hapus dari favorit" : "Tambah ke favorit"}
          title={isFav ? "Hapus dari favorit" : "Tambah ke favorit"}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.94)',
            border: '1px solid rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.12)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Heart
            size={17}
            color={isFav ? '#e11d48' : '#111111'}
            fill={isFav ? '#e11d48' : 'none'}
          />
        </button>

        {/* Stitch Architectural Badges */}
        <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', flexDirection: 'column', gap: '4px', pointerEvents: 'none' }}>
          {discountPercent > 0 && (
            <span className="badge badge-citron">
              -{discountPercent}% OFF
            </span>
          )}
          {product.is_featured && (
            <span className="badge badge-dark">
              LIMITED DROP
            </span>
          )}
        </div>

        {/* Rating Floating Tag */}
        <div style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '2px 6px',
          borderRadius: '2px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          fontWeight: '700',
          border: '1px solid #e5e5e5'
        }}>
          <Star size={12} fill="#080808" color="#080808" />
          <span>{product.rating || '4.9'}</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="product-card-body">
        
        {/* Category & SKU Metadata */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: '600', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {product.category_name}
          </span>
          <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: '#888888' }}>
            {product.sku}
          </span>
        </div>

        {/* Silhouette Title */}
        <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '10px', lineHeight: '1.3' }}>
          <Link to={`/product/${product.slug}`} style={{ color: '#080808' }}>
            {product.name}
          </Link>
        </h3>

        {/* Modular Size Selector Tiles (Stitch Specification) */}
        {product.variants && product.variants.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#666666', marginBottom: '6px' }}>
              SIZE EU: <strong>{selectedVariant?.size || 'SELECT'}</strong>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {product.variants.slice(0, 5).map(v => (
                <button
                  key={v.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedVariant(v);
                  }}
                  style={{
                    padding: '4px 8px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    borderRadius: '2px',
                    border: selectedVariant?.id === v.id ? '1px solid #080808' : '1px solid #e5e5e5',
                    backgroundColor: selectedVariant?.id === v.id ? '#080808' : '#ffffff',
                    color: selectedVariant?.id === v.id ? '#ffffff' : '#080808',
                    fontWeight: '700',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {v.size}
                </button>
              ))}
              {product.variants.length > 5 && (
                <Link 
                  to={`/product/${product.slug}`} 
                  style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#666666', alignSelf: 'center', marginLeft: '4px' }}
                >
                  +{product.variants.length - 5}
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Pricing & CTA */}
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #e5e5e5' }}>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#080808', fontFamily: 'var(--font-mono)' }}>
              {formatIDR(currentPrice)}
            </div>
            {product.discount_price && (
              <div style={{ fontSize: '0.75rem', color: '#888888', textDecoration: 'line-through', fontFamily: 'var(--font-mono)' }}>
                {formatIDR(product.price)}
              </div>
            )}
          </div>

          <button
            onClick={handleQuickAdd}
            className="btn btn-primary btn-sm"
            style={{ padding: '8px 14px' }}
            title="Tambah ke Keranjang"
          >
            <ShoppingBag size={14} />
            <span>BELI</span>
          </button>
        </div>

      </div>
    </div>
  );
};
