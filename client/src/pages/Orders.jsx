import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatIDR, formatDate, getOrderStatusInfo } from '../lib/utils';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getProducts } from '../lib/productsApi';
import { ReviewModal } from '../components/ReviewModal';
import { Package, ArrowRight, Star, CheckCircle, ExternalLink, Sparkles } from 'lucide-react';

export const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [reviewedItems, setReviewedItems] = useState({});

  // Review Modal State
  const [selectedReviewItem, setSelectedReviewItem] = useState(null);
  const [selectedReviewOrder, setSelectedReviewOrder] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Load catalog products for image fallback
  useEffect(() => {
    getProducts().then(prods => {
      if (prods && prods.length > 0) setCatalogProducts(prods);
    });

    const loadReviewedItems = () => {
      try {
        const map = JSON.parse(localStorage.getItem('barokah_reviewed_items') || '{}');
        setReviewedItems(map);
      } catch (e) {}
    };

    loadReviewedItems();
    window.addEventListener('barokah:review_added', loadReviewedItems);
    return () => window.removeEventListener('barokah:review_added', loadReviewedItems);
  }, []);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      let combined = [];
      const local = JSON.parse(localStorage.getItem('barokah_orders') || '[]');
      combined = [...local];

      if (isSupabaseConfigured && user) {
        try {
          const { data, error } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (!error && data) {
            const mappedDb = data.map(d => ({
              ...d,
              status: d.order_status,
              order_status: d.order_status,
              total_amount: d.total,
              payment_status: d.payment_status,
              items: (d.order_items && d.order_items.length > 0)
                ? d.order_items.map(i => ({
                    product_id: i.product_id,
                    product_name: i.product_name,
                    product_image: i.product_image_url || null,
                    size: i.size,
                    price: i.unit_price,
                    quantity: i.quantity,
                    subtotal: i.line_total
                  }))
                : (d.items || [])
            }));
            const dbIds = new Set(data.map(d => d.order_number));
            const filteredLocal = combined.filter(c => !dbIds.has(c.order_number));
            combined = [...mappedDb, ...filteredLocal];
          }
        } catch (err) {
          console.error('Fetch orders error:', err);
        }
      }

      setOrders(combined);
      setLoading(false);
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 6000);
    return () => clearInterval(interval);
  }, [user]);

  // Listen for global logout event to wipe state instantly
  useEffect(() => {
    const handleLogout = () => {
      setOrders([]);
      setLoading(false);
    };
    window.addEventListener('barokah:logout', handleLogout);
    return () => window.removeEventListener('barokah:logout', handleLogout);
  }, []);

  // Helper to resolve product image
  const resolveProductImage = (item) => {
    if (item.product_image && !item.product_image.includes('placehold.co')) {
      return item.product_image;
    }
    if (item.product_image_url && !item.product_image_url.includes('placehold.co')) {
      return item.product_image_url;
    }
    const match = catalogProducts.find(p => 
      p.name?.toLowerCase().trim() === item.product_name?.toLowerCase().trim() ||
      p.id === item.product_id
    );
    if (match?.images?.[0]) return match.images[0];
    return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80';
  };

  // Helper to resolve product slug
  const resolveProductSlug = (item) => {
    if (item.slug) return item.slug;
    const match = catalogProducts.find(p => 
      p.name?.toLowerCase().trim() === item.product_name?.toLowerCase().trim() ||
      p.id === item.product_id
    );
    if (match?.slug) return match.slug;
    return item.product_name ? item.product_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : '';
  };

  const handleOpenReview = (order, item) => {
    const enrichedItem = {
      ...item,
      product_image: resolveProductImage(item),
      slug: resolveProductSlug(item)
    };
    setSelectedReviewOrder(order);
    setSelectedReviewItem(enrichedItem);
    setIsReviewModalOpen(true);
  };

  return (
    <div style={{ padding: '40px 0 80px' }}>
      <div className="container" style={{ maxWidth: '960px' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#666666', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            PURCHASE LOG &amp; REVIEWS
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '900', marginTop: '4px', textTransform: 'uppercase' }}>
            PESANAN SAYA
          </h1>
          <p style={{ color: '#666666', fontSize: '0.88rem', marginTop: '4px' }}>
            Daftar riwayat produk sepatu yang pernah Anda pesan beserta foto produk dan ulasan pembeli.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'var(--font-mono)' }}>
            MEMUAT DATA PESANAN...
          </div>
        ) : !user ? (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '50px 30px',
            textAlign: 'center',
            border: '1px solid #e5e5e5'
          }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '8px', backgroundColor: '#f4f4f4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#080808' }}>
              <Package size={28} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '900', marginBottom: '8px', textTransform: 'uppercase' }}>
              ANDA BELUM MASUK AKUN
            </h3>
            <p style={{ color: '#666666', marginBottom: '24px', fontSize: '0.9rem' }}>
              Silakan masuk ke akun Anda untuk melihat riwayat pesanan dan status pengiriman Anda.
            </p>
            <Link to="/login?redirect=/orders" className="btn btn-primary">
              MASUK KE AKUN SAYA <ArrowRight size={16} />
            </Link>
          </div>
        ) : orders.length === 0 ? (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '50px 30px',
            textAlign: 'center',
            border: '1px solid #e5e5e5'
          }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '8px', backgroundColor: '#f4f4f4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#080808' }}>
              <Package size={28} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '900', marginBottom: '8px', textTransform: 'uppercase' }}>BELUM ADA PESANAN</h3>
            <p style={{ color: '#666666', marginBottom: '24px', fontSize: '0.9rem' }}>
              Anda belum melakukan pemesanan siluet sepatu di Toko Barokah Shoes.
            </p>
            <Link to="/shop" className="btn btn-primary">
              JELAJAHI KATALOG <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {orders.map((order, idx) => {
              const statusInfo = getOrderStatusInfo(order.status || order.order_status);
              const isCompleted = (order.status || order.order_status) === 'selesai';
              const itemsList = order.items && order.items.length > 0 ? order.items : [];

              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    padding: '24px',
                    border: '1px solid #e5e5e5',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}
                >
                  {/* Order Top Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', paddingBottom: '14px', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: '#080808', color: '#b7d600', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Package size={18} />
                      </div>
                      <div>
                        <span style={{ fontSize: '1.05rem', fontWeight: '900', color: '#080808', textTransform: 'uppercase' }}>
                          PESANAN #{order.order_number}
                        </span>
                        <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#666666' }}>
                          TANGGAL: {formatDate(order.created_at)}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      padding: '5px 12px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: '800',
                      backgroundColor: isCompleted ? '#b7d600' : '#080808',
                      color: isCompleted ? '#080808' : '#ffffff',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}>
                      {statusInfo.label}
                    </div>
                  </div>

                  {/* Purchased Products List with Images */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {itemsList.map((item, itemIdx) => {
                      const imgUrl = resolveProductImage(item);
                      const slug = resolveProductSlug(item);
                      const reviewKey = `${order.order_number}_${item.product_name}_${item.size || 'default'}`;
                      const reviewData = reviewedItems[reviewKey];

                      return (
                        <div
                          key={itemIdx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '14px',
                            padding: '12px',
                            backgroundColor: '#fafafa',
                            borderRadius: '6px',
                            border: '1px solid #f0f0f0'
                          }}
                        >
                          {/* Image & Product Info */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '220px' }}>
                            <img
                              src={imgUrl}
                              alt={item.product_name}
                              style={{
                                width: '64px',
                                height: '64px',
                                objectFit: 'cover',
                                borderRadius: '6px',
                                border: '1px solid #e2e8f0',
                                backgroundColor: '#ffffff',
                                flexShrink: 0
                              }}
                            />
                            <div>
                              <Link
                                to={slug ? `/product/${slug}` : '#'}
                                style={{
                                  fontWeight: '800',
                                  fontSize: '0.92rem',
                                  color: '#080808',
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                {item.product_name}
                                {slug && <ExternalLink size={12} color="#888" />}
                              </Link>
                              <div style={{ fontSize: '0.76rem', color: '#666666', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                                SIZE EU {item.size} • {item.quantity} PASANG
                              </div>
                              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#080808', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                                {formatIDR(item.subtotal || item.price * item.quantity)}
                              </div>
                            </div>
                          </div>

                          {/* Review Action */}
                          <div>
                            {isCompleted ? (
                              reviewData ? (
                                <div style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  backgroundColor: '#ecfdf5',
                                  color: '#047857',
                                  border: '1px solid #a7f3d0',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontFamily: 'var(--font-mono)',
                                  fontWeight: '700'
                                }}>
                                  <CheckCircle size={14} color="#047857" />
                                  <span>SUDAH DIULAS ({reviewData.rating}★)</span>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenReview(order, item)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    backgroundColor: '#080808',
                                    color: '#b7d600',
                                    border: '1px solid #080808',
                                    padding: '7px 14px',
                                    borderRadius: '6px',
                                    fontSize: '0.78rem',
                                    fontWeight: '800',
                                    fontFamily: 'var(--font-heading)',
                                    textTransform: 'uppercase',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                  onMouseEnter={e => {
                                    e.currentTarget.style.backgroundColor = '#b7d600';
                                    e.currentTarget.style.color = '#080808';
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.style.backgroundColor = '#080808';
                                    e.currentTarget.style.color = '#b7d600';
                                  }}
                                >
                                  <Star size={14} fill="#b7d600" /> TULIS ULASAN
                                </button>
                              )
                            ) : (
                              <span style={{ fontSize: '0.72rem', color: '#888888', fontFamily: 'var(--font-mono)' }}>
                                Ulasan dibuka setelah paket tiba
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Order Footer & Tracking Link */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid #f0f0f0', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#666666' }}>
                        TOTAL TRANSAKSI:
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#080808', fontFamily: 'var(--font-mono)' }}>
                        {formatIDR(order.total_amount ?? order.total ?? 0)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {((order.status || order.order_status) === 'dikirim') && (
                        <Link
                          to={`/order/${order.order_number}`}
                          state={{ order }}
                          className="btn btn-sm"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            backgroundColor: '#080808',
                            color: '#b7d600',
                            border: '1px solid #080808',
                            fontWeight: '800',
                            fontFamily: 'var(--font-heading)',
                            textTransform: 'uppercase'
                          }}
                        >
                          <CheckCircle size={14} /> BARANG DITERIMA
                        </Link>
                      )}

                      <Link
                        to={`/order/${order.order_number}`}
                        state={{ order }}
                        className="btn btn-outline btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        {isCompleted ? 'DETAIL PESANAN' : 'DETAIL & PELACAKAN'} <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Review Modal Dialog */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        order={selectedReviewOrder}
        item={selectedReviewItem}
        onSuccess={(review, key) => {
          setReviewedItems(prev => ({
            ...prev,
            [key]: { rating: review.rating, date: 'Hari ini', comment: review.comment }
          }));
        }}
      />
    </div>
  );
};
