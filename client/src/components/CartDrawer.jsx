import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatIDR } from '../lib/utils';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';

export const CartDrawer = () => {
  const { cartItems, isDrawerOpen, setIsDrawerOpen, updateQuantity, removeFromCart, cartTotal, totalItems } = useCart();
  const navigate = useNavigate();

  if (!isDrawerOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 100,
      display: 'flex',
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(8, 8, 8, 0.7)',
      backdropFilter: 'blur(8px)'
    }}>
      <div 
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} 
        onClick={() => setIsDrawerOpen(false)} 
      />

      <div
        className="cart-drawer-panel"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '420px',
          height: '100%',
          backgroundColor: '#ffffff',
          borderLeft: '1px solid #e5e5e5',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 101
        }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e5e5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#080808',
          color: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingBag size={20} color="#b7d600" />
            <h3 style={{ fontSize: '1rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              BAG ({totalItems})
            </h3>
          </div>
          <button 
            onClick={() => setIsDrawerOpen(false)}
            style={{
              color: '#ffffff',
              padding: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#666666' }}>
              <div style={{ width: '60px', height: '60px', margin: '0 auto 16px', borderRadius: '2px', backgroundColor: '#f4f4f4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingBag size={28} color="#888888" />
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '8px', textTransform: 'uppercase', color: '#080808' }}>
                BAG KOSONG
              </h4>
              <p style={{ fontSize: '0.82rem', marginBottom: '20px' }}>Belum ada koleksi yang Anda pilih.</p>
              <button 
                onClick={() => {
                  setIsDrawerOpen(false);
                  navigate('/shop');
                }} 
                className="btn btn-primary btn-sm"
              >
                JELAJAHI KATALOG
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cartItems.map((item) => (
                <div 
                  key={item.id} 
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '2px',
                    border: '1px solid #e5e5e5',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <img 
                    src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff'} 
                    alt={item.product.name}
                    style={{ width: '68px', height: '68px', objectFit: 'cover', borderRadius: '2px', backgroundColor: '#f4f4f4' }}
                  />

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h4 style={{ fontSize: '0.88rem', fontWeight: '800', lineHeight: '1.2', color: '#080808' }}>
                        {item.product.name}
                      </h4>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        style={{ color: '#888888', padding: '2px' }}
                        title="Hapus"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#666666', margin: '4px 0 8px' }}>
                      SIZE EU: <strong>{item.variant.size}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: '800', color: '#080808', fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>
                        {formatIDR(item.price)}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #080808', borderRadius: '2px', overflow: 'hidden' }}>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          style={{ padding: '3px 8px', backgroundColor: '#ffffff', color: '#080808' }}
                        >
                          <Minus size={10} />
                        </button>
                        <span style={{ padding: '0 8px', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          style={{ padding: '3px 8px', backgroundColor: '#ffffff', color: '#080808' }}
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div style={{ padding: '20px 24px', borderTop: '1px solid #e5e5e5', backgroundColor: '#f4f4f4' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: '#666666', textTransform: 'uppercase' }}>ESTIMATED TOTAL:</span>
              <span style={{ fontSize: '1.25rem', fontWeight: '900', color: '#080808', fontFamily: 'var(--font-mono)' }}>
                {formatIDR(cartTotal)}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  navigate('/checkout');
                }}
                className="btn btn-accent"
                style={{ width: '100%', padding: '14px' }}
              >
                CHECKOUT SEKARANG <ArrowRight size={16} />
              </button>

              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  navigate('/cart');
                }}
                className="btn btn-outline"
                style={{ width: '100%', padding: '10px', fontSize: '0.78rem' }}
              >
                LIHAT DETAIL BAG
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
