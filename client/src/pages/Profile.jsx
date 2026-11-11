import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { formatIDR, formatDate, getOrderStatusInfo } from '../lib/utils';
import { getProducts } from '../lib/productsApi';
import { ReviewModal } from '../components/ReviewModal';
import { 
  User, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Save, 
  Package, 
  MapPin, 
  Hash, 
  Star, 
  CheckCircle, 
  ExternalLink,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Trophy,
  Gift,
  Copy,
  Check
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { checkAndGenerateLoyaltyVoucher, countUserPurchasedShoes } from '../lib/vouchersApi';
import { LoyaltyRewardModal } from '../components/LoyaltyRewardModal';

export const Profile = () => {
  const { user, profile, isAdmin, updateProfileData } = useAuth();

  // Tab state: 'orders' | 'settings'
  const [activeTab, setActiveTab] = useState('orders');

  // Profile Form State
  const [fullName, setFullName] = useState(profile?.full_name || profile?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number || profile?.phone || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [postalCode, setPostalCode] = useState(profile?.postal_code || profile?.postalCode || '');
  const [isSaving, setIsSaving] = useState(false);

  // Orders & Reviews State
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [reviewedItems, setReviewedItems] = useState({});

  // Review Modal State
  const [selectedReviewItem, setSelectedReviewItem] = useState(null);
  const [selectedReviewOrder, setSelectedReviewOrder] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Loyalty Milestone Voucher State (10 Shoes Milestone -> 30% Unique Voucher)
  const [loyaltyVoucher, setLoyaltyVoucher] = useState(null);
  const [totalPurchasedShoes, setTotalPurchasedShoes] = useState(0);
  const [isLoyaltyModalOpen, setIsLoyaltyModalOpen] = useState(false);
  const [copiedVoucher, setCopiedVoucher] = useState(false);

  // Sync profile fields
  useEffect(() => {
    if (profile) {
      if (profile.full_name || profile.name) setFullName(profile.full_name || profile.name);
      if (profile.phone_number || profile.phone) setPhoneNumber(profile.phone_number || profile.phone);
      if (profile.address) setAddress(profile.address);
      if (profile.postal_code || profile.postalCode) setPostalCode(profile.postal_code || profile.postalCode);
    }
  }, [profile]);

  // Load catalog products & reviews map
  useEffect(() => {
    getProducts().then(prods => {
      if (prods && prods.length > 0) setCatalogProducts(prods);
    });

    const loadReviewedMap = () => {
      try {
        const map = JSON.parse(localStorage.getItem('barokah_reviewed_items') || '{}');
        setReviewedItems(map);
      } catch (e) {}
    };

    loadReviewedMap();
    window.addEventListener('barokah:review_added', loadReviewedMap);
    return () => window.removeEventListener('barokah:review_added', loadReviewedMap);
  }, []);

  // Fetch orders for current user
  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoadingOrders(false);
      return;
    }

    const fetchUserOrders = async () => {
      setLoadingOrders(true);
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
          console.warn('Fetch user orders error:', err);
        }
      }

      setOrders(combined);
      setLoadingOrders(false);

      // Check loyalty milestone (10 shoes milestone)
      const count = countUserPurchasedShoes(combined);
      setTotalPurchasedShoes(count);

      if (user) {
        checkAndGenerateLoyaltyVoucher(user, combined).then(res => {
          if (res?.voucher) {
            setLoyaltyVoucher(res.voucher);
            // If newly generated or first time viewing this active voucher, show pop-up celebration modal
            const seenKey = `barokah_loyalty_seen_${res.voucher.voucher_code}`;
            if (!sessionStorage.getItem(seenKey) && !res.voucher.is_used) {
              setIsLoyaltyModalOpen(true);
              sessionStorage.setItem(seenKey, 'true');
            }
          }
        });
      }
    };

    fetchUserOrders();
  }, [user]);

  // Image resolver
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

  const handleOpenReviewModal = (order, item) => {
    const enriched = {
      ...item,
      product_image: resolveProductImage(item)
    };
    setSelectedReviewOrder(order);
    setSelectedReviewItem(enriched);
    setIsReviewModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const updatePayload = {
      name: fullName,
      full_name: fullName,
      phone: phoneNumber,
      phone_number: phoneNumber,
      address,
      postal_code: postalCode,
      postalCode: postalCode
    };

    if (updateProfileData) {
      await updateProfileData(updatePayload);
    }

    if (isSupabaseConfigured && user) {
      try {
        await supabase
          .from('profiles')
          .update({
            name: fullName,
            phone: phoneNumber,
            address: address,
            postal_code: postalCode,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        toast.success('Data profil & alamat berhasil disimpan!');
      } catch (err) {
        console.warn('Profile DB update error:', err);
        toast.success('Data profil berhasil disimpan!');
      }
    } else {
      toast.success('Profil berhasil disimpan (Mode Demo)!');
    }

    setIsSaving(false);
  };

  return (
    <div style={{ padding: '40px 0 80px', backgroundColor: '#f9f9f9', minHeight: '85vh' }}>
      <div className="container" style={{ maxWidth: '860px' }}>
        
        {/* Profile Header Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '28px',
          border: '1px solid #e5e5e5',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '8px',
              backgroundColor: '#080808',
              color: '#b7d600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: '900',
              fontFamily: 'var(--font-heading)'
            }}>
              {fullName ? fullName[0].toUpperCase() : 'U'}
            </div>
            <div>
              <h1 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#080808', textTransform: 'uppercase', margin: 0 }}>
                {fullName || 'PENGGUNA BAROKAH'}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: '#666666' }}>
                  {user?.email || 'email@example.com'}
                </span>
                <span style={{
                  fontSize: '0.65rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: '800',
                  padding: '2px 8px',
                  borderRadius: '3px',
                  backgroundColor: isAdmin ? '#b7d600' : '#080808',
                  color: isAdmin ? '#080808' : '#ffffff'
                }}>
                  {isAdmin ? 'ADMINISTRATOR' : 'CUSTOMER'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/orders" className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Package size={15} /> Semua Pesanan
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          borderBottom: '2px solid #e5e5e5',
          paddingBottom: '2px'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'none',
              fontSize: '0.88rem',
              fontWeight: '800',
              fontFamily: 'var(--font-heading)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              cursor: 'pointer',
              color: activeTab === 'orders' ? '#080808' : '#777777',
              borderBottom: activeTab === 'orders' ? '3px solid #080808' : '3px solid transparent',
              marginBottom: '-4px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <ShoppingBag size={16} /> Pesanan &amp; Ulasan Saya ({orders.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'none',
              fontSize: '0.88rem',
              fontWeight: '800',
              fontFamily: 'var(--font-heading)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              cursor: 'pointer',
              color: activeTab === 'settings' ? '#080808' : '#777777',
              borderBottom: activeTab === 'settings' ? '3px solid #080808' : '3px solid transparent',
              marginBottom: '-4px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <User size={16} /> Data Diri &amp; Alamat
          </button>
        </div>

        {/* ═══════════════════════════════════════════════
            TAB 1: ORDERS & REVIEWS
            ═══════════════════════════════════════════════ */}
        {activeTab === 'orders' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* LOYALTY MILESTONE CARD (10 SEPATU -> 30% VOUCHER KHUSUS) */}
            <div style={{
              background: totalPurchasedShoes >= 10 
                ? 'linear-gradient(135deg, #0f172a 0%, #080808 60%, #1e293b 100%)' 
                : '#ffffff',
              color: totalPurchasedShoes >= 10 ? '#ffffff' : '#080808',
              borderRadius: '10px',
              padding: '24px 26px',
              border: totalPurchasedShoes >= 10 ? '2px solid #b7d600' : '1px solid #e5e5e5',
              boxShadow: totalPurchasedShoes >= 10 ? '0 10px 30px rgba(183, 214, 0, 0.15)' : '0 2px 8px rgba(0,0,0,0.03)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Decorative background glow for VIP */}
              {totalPurchasedShoes >= 10 && (
                <div style={{
                  position: 'absolute',
                  top: '-40px',
                  right: '-40px',
                  width: '180px',
                  height: '180px',
                  background: 'radial-gradient(circle, rgba(183, 214, 0, 0.22) 0%, rgba(0,0,0,0) 70%)',
                  pointerEvents: 'none'
                }} />
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ flex: '1 1 320px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      backgroundColor: totalPurchasedShoes >= 10 ? '#b7d600' : '#f0f0f0',
                      color: totalPurchasedShoes >= 10 ? '#080808' : '#555555'
                    }}>
                      {totalPurchasedShoes >= 10 ? <Trophy size={13} /> : <Gift size={13} />}
                      {totalPurchasedShoes >= 10 ? 'VIP LOYALTY REWARD UNLOCKED' : 'PROGRAM LOYALITAS PELANGGAN'}
                    </span>
                    <span style={{
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                      color: totalPurchasedShoes >= 10 ? '#94a3b8' : '#777777',
                      fontWeight: '700'
                    }}>
                      {totalPurchasedShoes} / 10 SEPATU TERBELI
                    </span>
                  </div>

                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '900',
                    margin: '0 0 6px 0',
                    textTransform: 'uppercase',
                    letterSpacing: '-0.01em',
                    color: totalPurchasedShoes >= 10 ? '#ffffff' : '#080808'
                  }}>
                    {totalPurchasedShoes >= 10 
                      ? 'Selamat! Voucher Diskon 30% Milik Anda Siap Digunakan'
                      : 'Beli 10 Sepatu, Dapatkan Voucher Khusus 30%'}
                  </h3>

                  <p style={{
                    fontSize: '0.86rem',
                    color: totalPurchasedShoes >= 10 ? '#cbd5e1' : '#666666',
                    margin: 0,
                    lineHeight: '1.5'
                  }}>
                    {totalPurchasedShoes >= 10 
                      ? 'Anda telah mencapai pembelian 10 sepatu. Voucher otomatis dibuat khusus akun Anda, berlaku untuk produk apa pun dan hanya 1x pakai.'
                      : `Kumpulkan total 10 pasang sepatu dari belanja Anda. Kurang ${Math.max(0, 10 - totalPurchasedShoes)} pasang sepatu lagi untuk membuka voucher potongan 30% otomatis!`}
                  </p>
                </div>

                {/* Progress bar or Voucher Box */}
                {totalPurchasedShoes < 10 ? (
                  <div style={{ flex: '1 1 240px', minWidth: '220px', alignSelf: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: '700', marginBottom: '6px', color: '#555555' }}>
                      <span>PROGRES LOYALITAS</span>
                      <span>{Math.round((totalPurchasedShoes / 10) * 100)}%</span>
                    </div>
                    <div style={{ width: '100%', height: '10px', backgroundColor: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min(100, (totalPurchasedShoes / 10) * 100)}%`,
                        height: '100%',
                        backgroundColor: '#080808',
                        borderRadius: '5px',
                        transition: 'width 0.4s ease'
                      }} />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#888888', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
                      💡 Sisa {Math.max(0, 10 - totalPurchasedShoes)} pasang lagi menuju reward 30%
                    </div>
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    alignItems: 'flex-start',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    padding: '14px 18px',
                    borderRadius: '8px',
                    border: '1px dashed #b7d600',
                    minWidth: '260px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#b7d600', fontWeight: '800' }}>
                        POTONGAN 30% KHUSUS
                      </span>
                      <span style={{
                        fontSize: '0.68rem',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: '800',
                        padding: '2px 8px',
                        borderRadius: '3px',
                        backgroundColor: loyaltyVoucher?.is_used ? '#475569' : '#15803d',
                        color: '#ffffff'
                      }}>
                        {loyaltyVoucher?.is_used ? 'SUDAH DIPAKAI' : 'BELUM DIPAKAI (1X)'}
                      </span>
                    </div>

                    {/* Voucher Code Box */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                      <div style={{
                        flex: 1,
                        backgroundColor: '#000000',
                        color: '#b7d600',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: '900',
                        fontSize: '1rem',
                        letterSpacing: '0.08em',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        border: '1px solid rgba(183, 214, 0, 0.4)',
                        textAlign: 'center'
                      }}>
                        {loyaltyVoucher?.voucher_code || 'BRK30-LOAD'}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (loyaltyVoucher?.voucher_code) {
                            navigator.clipboard.writeText(loyaltyVoucher.voucher_code);
                            setCopiedVoucher(true);
                            toast.success('Kode voucher 30% berhasil disalin!');
                            setTimeout(() => setCopiedVoucher(false), 2500);
                          }
                        }}
                        style={{
                          backgroundColor: copiedVoucher ? '#b7d600' : '#ffffff',
                          color: '#080808',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '9px 12px',
                          fontWeight: '800',
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-mono)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s'
                        }}
                      >
                        {copiedVoucher ? <Check size={14} /> : <Copy size={14} />}
                        {copiedVoucher ? 'TERSALIN' : 'SALIN'}
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '2px' }}>
                      <button
                        type="button"
                        onClick={() => setIsLoyaltyModalOpen(true)}
                        style={{
                          flex: 1,
                          backgroundColor: 'transparent',
                          color: '#b7d600',
                          border: '1px solid #b7d600',
                          borderRadius: '4px',
                          padding: '6px 10px',
                          fontSize: '0.72rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: '800',
                          cursor: 'pointer',
                          textTransform: 'uppercase'
                        }}
                      >
                        Lihat Tiket Reward
                      </button>
                      {!loyaltyVoucher?.is_used && (
                        <Link
                          to="/shop"
                          style={{
                            flex: 1,
                            backgroundColor: '#b7d600',
                            color: '#080808',
                            borderRadius: '4px',
                            padding: '6px 10px',
                            fontSize: '0.72rem',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: '800',
                            textAlign: 'center',
                            textDecoration: 'none',
                            textTransform: 'uppercase'
                          }}
                        >
                          Belanja Sekarang
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {loadingOrders ? (
              <div style={{ padding: '60px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e5e5', fontFamily: 'var(--font-mono)' }}>
                MEMUAT RIWAYAT PRODUK...
              </div>
            ) : orders.length === 0 ? (
              <div style={{ padding: '50px 30px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e5e5' }}>
                <Package size={36} color="#888" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: '900', textTransform: 'uppercase' }}>Belum Ada Pembelian Sepatu</h3>
                <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '20px' }}>
                  Jelajahi koleksi sepatu premium Toko Barokah Shoes sekarang.
                </p>
                <Link to="/shop" className="btn btn-primary">
                  Mulai Belanja <ArrowRight size={15} />
                </Link>
              </div>
            ) : (
              orders.map((ord, ordIdx) => {
                const statusInfo = getOrderStatusInfo(ord.status || ord.order_status);
                const isCompleted = (ord.status || ord.order_status) === 'selesai';
                const itemsList = ord.items && ord.items.length > 0 ? ord.items : [];

                return (
                  <div
                    key={ordIdx}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      padding: '24px',
                      border: '1px solid #e5e5e5',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                    }}
                  >
                    {/* Header bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', paddingBottom: '14px', borderBottom: '1px solid #f0f0f0', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '900', fontSize: '0.95rem', color: '#080808' }}>
                          PESANAN #{ord.order_number}
                        </span>
                        <span style={{ color: '#888', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                          • {formatDate(ord.created_at)}
                        </span>
                      </div>
                      <div style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: '800',
                        backgroundColor: isCompleted ? '#b7d600' : '#080808',
                        color: isCompleted ? '#080808' : '#ffffff',
                        textTransform: 'uppercase'
                      }}>
                        {statusInfo.label}
                      </div>
                    </div>

                    {/* Products list with pictures & reviews */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {itemsList.map((item, itemIdx) => {
                        const imgUrl = resolveProductImage(item);
                        const reviewKey = `${ord.order_number}_${item.product_name}_${item.size || 'default'}`;
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
                              padding: '14px',
                              backgroundColor: '#fafafa',
                              borderRadius: '6px',
                              border: '1px solid #eeeeee'
                            }}
                          >
                            {/* Product Image & Info */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '220px' }}>
                              <img
                                src={imgUrl}
                                alt={item.product_name}
                                style={{
                                  width: '64px',
                                  height: '64px',
                                  objectFit: 'cover',
                                  borderRadius: '6px',
                                  border: '1px solid #e0e0e0',
                                  backgroundColor: '#ffffff',
                                  flexShrink: 0
                                }}
                              />
                              <div>
                                <div style={{ fontWeight: '800', fontSize: '0.92rem', color: '#080808' }}>
                                  {item.product_name}
                                </div>
                                <div style={{ fontSize: '0.76rem', color: '#666', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                                  SIZE EU {item.size} • {item.quantity} PASANG
                                </div>
                                <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#080808', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                                  {formatIDR(item.subtotal || item.price * item.quantity)}
                                </div>
                              </div>
                            </div>

                            {/* Review Section */}
                            <div>
                              {isCompleted ? (
                                reviewData ? (
                                  <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-end',
                                    gap: '4px'
                                  }}>
                                    <div style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      backgroundColor: '#ecfdf5',
                                      color: '#047857',
                                      border: '1px solid #a7f3d0',
                                      padding: '4px 10px',
                                      borderRadius: '4px',
                                      fontSize: '0.74rem',
                                      fontFamily: 'var(--font-mono)',
                                      fontWeight: '700'
                                    }}>
                                      <CheckCircle size={13} color="#047857" />
                                      <span>SUDAH DIULAS ({reviewData.rating}★)</span>
                                    </div>
                                    {reviewData.comment && (
                                      <div style={{ fontSize: '0.75rem', color: '#666', fontStyle: 'italic', maxWidth: '240px', textAlign: 'right' }}>
                                        "{reviewData.comment.slice(0, 50)}..."
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenReviewModal(ord, item)}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      backgroundColor: '#080808',
                                      color: '#b7d600',
                                      border: 'none',
                                      padding: '8px 16px',
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
                                  Ulasan aktif saat paket tiba
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Footer link to detail */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid #f0f0f0', marginTop: '14px', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ fontSize: '0.8rem', color: '#666', fontFamily: 'var(--font-mono)' }}>
                        TOTAL: <strong style={{ color: '#080808' }}>{formatIDR(ord.total_amount ?? ord.total ?? 0)}</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {((ord.status === 'dikirim' || ord.order_status === 'dikirim')) && (
                          <Link
                            to={`/order/${ord.order_number}`}
                            state={{ order: ord }}
                            className="btn btn-sm"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              backgroundColor: '#080808',
                              color: '#b7d600',
                              border: '1px solid #080808',
                              fontWeight: '800',
                              fontSize: '0.75rem',
                              fontFamily: 'var(--font-heading)',
                              textTransform: 'uppercase'
                            }}
                          >
                            <CheckCircle size={13} /> Konfirmasi Terima
                          </Link>
                        )}
                        <Link
                          to={`/order/${ord.order_number}`}
                          state={{ order: ord }}
                          className="btn btn-outline btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', fontWeight: '700' }}
                        >
                          {isCompleted ? 'Detail Pesanan' : 'Lacak Pesanan'} <ArrowRight size={13} />
                        </Link>
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            TAB 2: SETTINGS (Data Diri & Alamat)
            ═══════════════════════════════════════════════ */}
        {activeTab === 'settings' && (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '32px',
            border: '1px solid #e5e5e5',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '900', textTransform: 'uppercase', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #eee' }}>
              PENGATURAN DATA DIRI &amp; ALAMAT PENGIRIMAN
            </h3>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">NAMA LENGKAP</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '38px' }}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                  <User size={16} color="#080808" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              <div>
                <label className="form-label">NOMOR WHATSAPP / HP</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    className="form-input"
                    style={{ paddingLeft: '38px', fontFamily: 'var(--font-mono)' }}
                    placeholder="081234567890"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                  <Phone size={16} color="#080808" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              <div>
                <label className="form-label">ALAMAT PENGIRIMAN LENGKAP</label>
                <div style={{ position: 'relative' }}>
                  <textarea
                    className="form-input"
                    rows={3}
                    style={{ paddingLeft: '38px', paddingTop: '10px', resize: 'vertical' }}
                    placeholder="Jl. Nama Jalan No. XX, RT/RW, Kota"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                  <MapPin size={16} color="#080808" style={{ position: 'absolute', left: '14px', top: '14px' }} />
                </div>
              </div>

              <div>
                <label className="form-label">KODE POS</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '38px', fontFamily: 'var(--font-mono)' }}
                    placeholder="12345"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    required
                  />
                  <Hash size={16} color="#080808" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              <div>
                <label className="form-label">EMAIL TERDAFTAR</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    className="form-input"
                    style={{ paddingLeft: '38px', fontFamily: 'var(--font-mono)', backgroundColor: '#f4f4f4', cursor: 'not-allowed' }}
                    value={user?.email || ''}
                    disabled
                  />
                  <Mail size={16} color="#080808" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="btn btn-primary"
                style={{ alignSelf: 'flex-start', marginTop: '10px' }}
              >
                <Save size={16} />
                {isSaving ? 'MENYIMPAN...' : 'SIMPAN PERUBAHAN'}
              </button>
            </form>
          </div>
        )}

      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        order={selectedReviewOrder}
        item={selectedReviewItem}
        onSuccess={(rev, key) => {
          setReviewedItems(prev => ({
            ...prev,
            [key]: { rating: rev.rating, comment: rev.comment }
          }));
        }}
      />

      {/* Loyalty Reward Pop-up Modal (10 Shoes Milestone -> 30% Unique Voucher) */}
      <LoyaltyRewardModal
        isOpen={isLoyaltyModalOpen}
        onClose={() => setIsLoyaltyModalOpen(false)}
        voucher={loyaltyVoucher}
        totalShoes={totalPurchasedShoes}
      />
    </div>
  );
};
