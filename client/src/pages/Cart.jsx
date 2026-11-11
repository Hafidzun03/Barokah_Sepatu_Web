import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, CheckCircle2, Gift } from 'lucide-react';
import { AuthPromptModal } from '../components/AuthPromptModal';
import toast from 'react-hot-toast';
import { validateVoucher, getUserActiveLoyaltyVoucher, checkPromoUsage } from '../lib/vouchersApi';
import { VoucherUsedModal } from '../components/VoucherUsedModal';

export const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, clearCart, cartTotal, totalItems } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [userLoyaltyVoucher, setUserLoyaltyVoucher] = useState(null);
  const [barokahUsed, setBarokahUsed] = useState(false);
  const [showUsedModal, setShowUsedModal] = useState(false);
  const [usedModalInfo, setUsedModalInfo] = useState(null);

  // Check if user has active 30% loyalty voucher and check BAROKAH10 usage
  React.useEffect(() => {
    let isMounted = true;
    if (user) {
      getUserActiveLoyaltyVoucher(user).then(v => {
        if (v && isMounted) setUserLoyaltyVoucher(v);
      });
      checkPromoUsage('BAROKAH10', user).then(usage => {
        if (usage && isMounted) {
          setBarokahUsed(true);
          setUsedModalInfo(usage);
        }
      });
    } else {
      setUserLoyaltyVoucher(null);
      setBarokahUsed(false);
      setUsedModalInfo(null);
    }

    const handlePromoUsed = (e) => {
      if (e.detail?.promoCode === 'BAROKAH10' && isMounted) {
        setBarokahUsed(true);
        setUsedModalInfo(e.detail);
      }
    };

    window.addEventListener('barokah:promo_used', handlePromoUsed);
    window.addEventListener('barokah:voucher_redeemed', handlePromoUsed);
    return () => {
      isMounted = false;
      window.removeEventListener('barokah:promo_used', handlePromoUsed);
      window.removeEventListener('barokah:voucher_redeemed', handlePromoUsed);
    };
  }, [user]);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    const cleanCode = (couponCode || '').trim().toUpperCase();
    if (!cleanCode) {
      toast.error('Silakan masukkan kode voucher');
      return;
    }

    const res = await validateVoucher(cleanCode, user);
    if (!res.valid) {
      if (res.isAlreadyUsed || cleanCode === 'BAROKAH10') {
        setBarokahUsed(true);
        setUsedModalInfo(res.existingUsage);
        setShowUsedModal(true);
      }
      toast.error(res.error || 'Kode voucher tidak valid');
      return;
    }

    setAppliedCoupon({
      code: res.code,
      discountPercent: res.discountPercent,
      description: res.description,
      isLoyalty: res.isLoyalty
    });
    toast.success(`Voucher ${res.code} berhasil diterapkan! Potongan ${res.discountPercent}%`);
  };

  const discountAmount = appliedCoupon ? (cartTotal * appliedCoupon.discountPercent) / 100 : 0;
  const grandTotal = cartTotal - discountAmount;

  if (cartItems.length === 0) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <div className="container">
          <div style={{
            maxWidth: '480px',
            margin: '0 auto',
            padding: '48px 32px',
            backgroundColor: '#ffffff',
            borderRadius: '4px',
            border: '1px solid #e5e5e5'
          }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '4px', backgroundColor: '#f4f4f4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#080808' }}>
              <ShoppingBag size={32} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '8px', textTransform: 'uppercase' }}>BAG ANDA KOSONG</h2>
            <p style={{ color: '#666666', marginBottom: '24px', fontSize: '0.9rem' }}>
              Anda belum menambahkan sepatu pilihan ke dalam keranjang.
            </p>
            <Link to="/shop" className="btn btn-primary btn-lg">
              JELAJAHI KATALOG <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 0 80px' }}>
      <div className="container">
        
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#666666', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            SHOPPING BAG
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '900', marginTop: '4px', textTransform: 'uppercase' }}>
            BAG ({totalItems} PAIRS)
          </h1>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '32px',
          alignItems: 'start'
        }}>
          
          {/* Items Card */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '4px',
            padding: '28px',
            border: '1px solid #e5e5e5'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e5e5e5' }}>
              <span style={{ fontWeight: '700', fontFamily: 'var(--font-mono)', color: '#666666', fontSize: '0.75rem', textTransform: 'uppercase' }}>ITEM SILHOUETTES</span>
              <button 
                onClick={clearCart}
                style={{ color: '#ba1a1a', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Trash2 size={12} /> HAPUS SEMUA
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {cartItems.map(item => (
                <div 
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    paddingBottom: '20px',
                    borderBottom: '1px solid #f4f4f4'
                  }}
                >
                  <img 
                    src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff'} 
                    alt={item.product.name}
                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '2px', backgroundColor: '#f4f4f4' }}
                  />

                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '4px' }}>
                      <Link to={`/product/${item.product.slug}`} style={{ color: '#080808' }}>
                        {item.product.name}
                      </Link>
                    </h3>
                    <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#666666', marginBottom: '10px' }}>
                      SIZE EU: <strong style={{ color: '#080808' }}>{item.variant.size}</strong> • {formatIDR(item.price)} / pasang
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #080808', borderRadius: '2px', overflow: 'hidden' }}>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          style={{ padding: '4px 8px', backgroundColor: '#ffffff', color: '#080808' }}
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ padding: '0 10px', fontSize: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          style={{ padding: '4px 8px', backgroundColor: '#ffffff', color: '#080808' }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        style={{ color: '#ba1a1a', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Trash2 size={12} /> HAPUS
                      </button>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#080808', fontFamily: 'var(--font-mono)' }}>
                      {formatIDR(item.price * item.quantity)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '20px' }}>
              <Link to="/shop" style={{ color: '#080808', fontWeight: '700', fontSize: '0.85rem', fontFamily: 'var(--font-heading)', textTransform: 'uppercase' }}>
                &larr; TAMBAH SEPATU LAIN
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '4px',
            padding: '28px',
            border: '1px solid #e5e5e5'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '900', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e5e5e5', textTransform: 'uppercase' }}>
              RINGKASAN PESANAN
            </h3>

            {/* Voucher */}
            <form onSubmit={handleApplyCoupon} style={{ marginBottom: '24px' }}>
              <label className="form-label">KODE VOUCHER</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  placeholder={barokahUsed ? "KODE VOUCHER" : "KODE: BAROKAH10"} 
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="form-input"
                  style={{ textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}
                />
                <button type="submit" className="btn btn-primary btn-sm" style={{ whiteSpace: 'nowrap' }}>
                  GUNAKAN
                </button>
              </div>

              {/* Notice if BAROKAH10 has been used */}
              {barokahUsed && !appliedCoupon && (
                <div style={{
                  marginTop: '8px',
                  padding: '6px 10px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '3px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '6px'
                }}>
                  <span style={{ fontSize: '0.72rem', color: '#dc2626', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                    Kode BAROKAH10 sudah digunakan.
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowUsedModal(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#080808',
                      fontSize: '0.7rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: '800',
                      textDecoration: 'underline',
                      cursor: 'pointer'
                    }}
                  >
                    Dapatkan Kode Lain
                  </button>
                </div>
              )}
              {appliedCoupon && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#15803d', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', marginTop: '6px', fontWeight: '700' }}>
                  <CheckCircle2 size={14} /> VOUCHER {appliedCoupon.code} AKTIF (-{appliedCoupon.discountPercent}%)
                </div>
              )}
              {userLoyaltyVoucher && !appliedCoupon && (
                <div style={{
                  marginTop: '10px',
                  padding: '8px 10px',
                  backgroundColor: '#080808',
                  color: '#ffffff',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid #b7d600'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Gift size={14} color="#b7d600" />
                    <span style={{ fontSize: '0.7rem', color: '#b7d600', fontFamily: 'var(--font-mono)', fontWeight: '800' }}>
                      30% REWARD: {userLoyaltyVoucher.voucher_code}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCouponCode(userLoyaltyVoucher.voucher_code);
                      setAppliedCoupon({
                        code: userLoyaltyVoucher.voucher_code,
                        discountPercent: userLoyaltyVoucher.discount_percent || 30,
                        description: userLoyaltyVoucher.description || 'Voucher Loyalitas 10 Sepatu (Diskon 30%)',
                        isLoyalty: true
                      });
                      toast.success(`Voucher Loyalitas ${userLoyaltyVoucher.voucher_code} (-30%) diterapkan!`);
                    }}
                    style={{
                      backgroundColor: '#b7d600',
                      color: '#080808',
                      border: 'none',
                      borderRadius: '2px',
                      padding: '3px 8px',
                      fontSize: '0.68rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    PAKAI
                  </button>
                </div>
              )}
            </form>

            {/* Calculations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', fontFamily: 'var(--font-mono)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666666' }}>
                <span>SUBTOTAL ({totalItems} PAIRS)</span>
                <span style={{ color: '#080808', fontWeight: '700' }}>{formatIDR(cartTotal)}</span>
              </div>

              {appliedCoupon && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#15803d', fontWeight: '700' }}>
                  <span>VOUCHER DISCOUNT</span>
                  <span>- {formatIDR(discountAmount)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666666' }}>
                <span>SHIPPING LOGISTICS</span>
                <span style={{ color: '#080808' }}>DIHITUNG DI CHECKOUT</span>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '16px',
                borderTop: '1px solid #e5e5e5',
                fontSize: '1.25rem',
                fontWeight: '900',
                color: '#080808'
              }}>
                <span>TOTAL</span>
                <span style={{ color: '#080808' }}>{formatIDR(grandTotal)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                if (!user) {
                  setShowAuthModal(true);
                } else {
                  navigate('/checkout', { state: { appliedCoupon, discountAmount } });
                }
              }}
              className="btn btn-accent btn-lg"
              style={{ width: '100%', padding: '16px' }}
            >
              LANJUT KE CHECKOUT <ArrowRight size={18} />
            </button>

            <AuthPromptModal
              isOpen={showAuthModal}
              onClose={() => setShowAuthModal(false)}
              redirectAfter="/checkout"
            />

            <VoucherUsedModal
              isOpen={showUsedModal}
              onClose={() => setShowUsedModal(false)}
              voucherCode="BAROKAH10"
              usedInfo={usedModalInfo}
            />
          </div>

        </div>
      </div>
    </div>
  );
};
