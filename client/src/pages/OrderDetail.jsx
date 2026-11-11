import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { formatIDR, formatDate, getOrderStatusInfo } from '../lib/utils';
import { supabase, isSupabaseConfigured, getAdminClient } from '../lib/supabase';
import { getDeliveryCountdown, autoCompleteOrder, getCourierConfig } from '../lib/shippingUtils';
import { 
  CheckCircle2, 
  Clock, 
  Truck, 
  Package,
  Upload, 
  Copy,
  X,
  ImageIcon,
  AlertTriangle,
  RefreshCw,
  Eye,
  Star
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ReviewModal } from '../components/ReviewModal';

/* ──────────────────────────────────────────────────────────
   Compress image via canvas → Base64 JPEG (max 1200px, q=0.85)
   Fills white background to ensure PNG transparency never turns black
   ────────────────────────────────────────────────────────── */
const compressImageToBase64 = (file) => new Promise((resolve, reject) => {
  const MAX_PX = 1200;
  const QUALITY = 0.85;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > MAX_PX || height > MAX_PX) {
        const ratio = Math.min(MAX_PX / width, MAX_PX / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      // Crucial: fill white background so transparent PNGs / screenshots do not turn black
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', QUALITY));
    };
    img.onerror = () => {
      // Fallback: return raw FileReader data URL
      resolve(ev.target.result);
    };
    img.src = ev.target.result;
  };
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

export const OrderDetail = () => {
  const { orderId } = useParams();
  const location = useLocation();

  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!order);
  const [isUploading, setIsUploading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [nowTick, setNowTick] = useState(Date.now());
  const [isAutoCompleting, setIsAutoCompleting] = useState(false);

  // Payment proof state
  const [proofFile, setProofFile] = useState(null);     // File object
  const [proofPreview, setProofPreview] = useState(''); // Base64 preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const [existingProof, setExistingProof] = useState(null); // Existing payment record from Supabase
  const fileInputRef = useRef();

  // Review Modal State
  const [selectedReviewItem, setSelectedReviewItem] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewedItems, setReviewedItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('barokah_reviewed_items') || '{}');
    } catch {
      return {};
    }
  });

  // Confirm Received Modal State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isConfirmingReceived, setIsConfirmingReceived] = useState(false);

  // Customer verifies receipt of goods
  const handleConfirmReceived = async () => {
    if (!order) return;
    setIsConfirmingReceived(true);
    try {
      const nowIso = new Date().toISOString();
      const targetNumber = order.order_number;
      const targetId = order.id || orderId;

      // 1. Update orders table in Supabase
      if (isSupabaseConfigured) {
        const adminDb = (await getAdminClient()) || supabase;
        let res = await adminDb
          .from('orders')
          .update({
            order_status: 'selesai',
            completed_at: nowIso,
            updated_at: nowIso
          })
          .eq('order_number', targetNumber);

        if (res.error) {
          await adminDb
            .from('orders')
            .update({
              order_status: 'selesai',
              completed_at: nowIso,
              updated_at: nowIso
            })
            .eq('id', targetId);
        }
      }

      // 2. Update local state
      setOrder(prev => ({
        ...prev,
        status: 'selesai',
        order_status: 'selesai',
        completed_at: nowIso
      }));

      // 3. Update localStorage
      try {
        const savedOrders = JSON.parse(localStorage.getItem('barokah_orders') || '[]');
        const updated = savedOrders.map(o => {
          if (o.order_number === targetNumber || o.id === targetId) {
            return {
              ...o,
              status: 'selesai',
              order_status: 'selesai',
              completed_at: nowIso
            };
          }
          return o;
        });
        localStorage.setItem('barokah_orders', JSON.stringify(updated));
      } catch (e) {
        console.warn('Sync localstorage error on confirm:', e);
      }

      // 4. Dispatch global event for live reactivity across components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('barokah:order_completed', {
          detail: { orderNumber: targetNumber, orderId: targetId }
        }));
      }

      setIsConfirmModalOpen(false);
      toast.success('🎉 Terima kasih! Barang berhasil diverifikasi telah diterima.');
    } catch (err) {
      console.error('Error confirming receipt:', err);
      toast.error('Gagal mengonfirmasi: ' + (err.message || 'Coba lagi'));
    } finally {
      setIsConfirmingReceived(false);
    }
  };

  // Core fetcher to synchronize order & payment status from Supabase
  const fetchOrderAndPayment = async (silent = false) => {
    if (!silent && !order) setLoading(true);
    if (isSupabaseConfigured) {
      try {
        const db = (await getAdminClient()) || supabase;
        // Query by order_number (e.g. BS-500056) or UUID id
        let query = db.from('orders').select('*, order_items(*)');
        if (orderId) {
          query = query.eq('order_number', orderId);
        } else if (order?.id && !order.id.startsWith('local-')) {
          query = query.eq('id', order.id);
        }
        const { data: ordData, error: ordErr } = await query.maybeSingle();

        if (ordData) {
          const mapped = {
            ...ordData,
            status: ordData.order_status,
            order_status: ordData.order_status,
            payment_status: ordData.payment_status,
            total_amount: ordData.total,
            phone_number: ordData.recipient_phone,
            shipping_fee: ordData.shipping_cost,
            shipping_courier: ordData.admin_notes?.match(/\[KURIR:\s*([^|]+)/)?.[1]?.trim() || ordData.payment_method || '-',
            items: (ordData.order_items || []).map(i => ({
              product_id: i.product_id,
              product_name: i.product_name,
              product_image: i.product_image_url || i.product_image || null,
              size: i.size,
              price: i.unit_price,
              quantity: i.quantity,
              subtotal: i.line_total
            }))
          };
          setOrder(mapped);

          // Synchronize localStorage so customer order list is always in sync
          try {
            const saved = JSON.parse(localStorage.getItem('barokah_orders') || '[]');
            const idx = saved.findIndex(o => o.order_number === ordData.order_number || o.id === ordData.id);
            if (idx >= 0) {
              saved[idx] = { ...saved[idx], ...mapped };
              localStorage.setItem('barokah_orders', JSON.stringify(saved));
            }
          } catch (e) {
            console.warn('Sync localstorage error:', e);
          }

          // Fetch payment record
          const { data: payData } = await db
            .from('payments')
            .select('*')
            .eq('order_id', ordData.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (payData && payData.length > 0) {
            setExistingProof(payData[0]);
          }
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Fetch order error:', err);
      }
    }

    // Fallback: check localStorage
    const savedOrders = JSON.parse(localStorage.getItem('barokah_orders') || '[]');
    const found = savedOrders.find(o => o.order_number === orderId);
    if (found) {
      setOrder(found);
    }
    setLoading(false);
  };

  // Manual refresh trigger
  const handleManualRefresh = async () => {
    setIsSyncing(true);
    await fetchOrderAndPayment(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast.success('Status pesanan berhasil diperbarui!');
    }, 400);
  };

  // Initial fetch, auto-polling (every 4s), and Supabase Realtime subscription
  useEffect(() => {
    fetchOrderAndPayment();

    // Auto-poll every 4 seconds to sync status live when admin updates
    const pollInterval = setInterval(() => {
      fetchOrderAndPayment(true);
    }, 4000);

    // Supabase Realtime channel for instant reactive updates
    let channel = null;
    if (isSupabaseConfigured) {
      try {
        channel = supabase.channel(`order-live-${orderId}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
            fetchOrderAndPayment(true);
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
            fetchOrderAndPayment(true);
          })
          .subscribe();
      } catch (err) {
        console.warn('Supabase realtime subscription error:', err);
      }
    }

    return () => {
      clearInterval(pollInterval);
      if (channel) supabase.removeChannel(channel);
    };
  }, [orderId]);

  // Refresh order data from Supabase (to sync status after upload)
  const refreshOrderFromDB = async (orderId_uuid) => {
    if (!isSupabaseConfigured || !orderId_uuid) return;
    try {
      const db = (await getAdminClient()) || supabase;
      const { data } = await db
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId_uuid)
        .single();
      if (data) {
        setOrder(prev => ({
          ...prev,
          ...data,
          status: data.order_status,
          payment_status: data.payment_status,
          total_amount: data.total,
          phone_number: data.recipient_phone,
          shipping_fee: data.shipping_cost,
          items: prev?.items || (data.order_items || []).map(i => ({
            product_name: i.product_name,
            size: i.size,
            price: i.unit_price,
            quantity: i.quantity,
            subtotal: i.line_total
          }))
        }));
      }
    } catch (_) {}
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} disalin ke clipboard!`);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Hanya file gambar (JPG/PNG) yang diperbolehkan.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 15 MB.');
      return;
    }
    try {
      const compressed = await compressImageToBase64(file);
      setProofFile(file);
      setProofPreview(compressed);
    } catch {
      toast.error('Gagal memproses gambar. Coba file lain.');
    }
  };

  const handleSubmitPaymentProof = async (e) => {
    e.preventDefault();
    if (!proofPreview) {
      toast.error('Pilih gambar bukti pembayaran terlebih dahulu!');
      return;
    }
    setIsUploading(true);

    try {
      if (isSupabaseConfigured) {
        const adminDb = (await getAdminClient()) || supabase;

        // 1. Resolve the real database UUID for the order
        let orderUuid = order?.id;
        let orderTotal = order?.total_amount ?? order?.total ?? 0;
        let orderPayMethod = order?.payment_method || 'transfer_bank';

        if (!orderUuid || orderUuid.startsWith('local-')) {
          const { data: dbOrd } = await adminDb
            .from('orders')
            .select('id, total, payment_method')
            .eq('order_number', orderId)
            .maybeSingle();

          if (dbOrd?.id) {
            orderUuid = dbOrd.id;
            orderTotal = dbOrd.total;
            orderPayMethod = dbOrd.payment_method;
          }
        }

        if (orderUuid) {
          const methodEnum = orderPayMethod === 'cod' ? 'cod' : orderPayMethod === 'ewallet' ? 'ewallet' : 'transfer_bank';

          // 2. Check if payment row already exists
          let dbForPayment = (await getAdminClient()) || supabase;

          const { data: existingPayments } = await dbForPayment
            .from('payments')
            .select('id')
            .eq('order_id', orderUuid)
            .limit(1);

          let payRecord = null;
          if (existingPayments && existingPayments.length > 0) {
            let res = await dbForPayment
              .from('payments')
              .update({
                transfer_proof_url: proofPreview,
                status: 'menunggu_verifikasi',
                updated_at: new Date().toISOString()
              })
              .eq('id', existingPayments[0].id)
              .select();

            if (!res.data || res.data.length === 0 || res.error) {
              const retry = await supabase
                .from('payments')
                .update({
                  transfer_proof_url: proofPreview,
                  status: 'menunggu_verifikasi',
                  updated_at: new Date().toISOString()
                })
                .eq('id', existingPayments[0].id)
                .select();
              if (retry.data && retry.data.length > 0) {
                res = retry;
                dbForPayment = supabase;
              }
            }

            payRecord = res.data?.[0] || null;
          } else {
            let res = await dbForPayment
              .from('payments')
              .insert({
                order_id: orderUuid,
                method: methodEnum,
                amount: orderTotal,
                status: 'menunggu_verifikasi',
                transfer_proof_url: proofPreview,
                bank_name: methodEnum === 'transfer_bank' ? 'BCA' : methodEnum === 'ewallet' ? 'QRIS / E-Wallet' : 'COD'
              })
              .select();

            if (!res.data || res.data.length === 0 || res.error) {
              const retry = await supabase
                .from('payments')
                .insert({
                  order_id: orderUuid,
                  method: methodEnum,
                  amount: orderTotal,
                  status: 'menunggu_verifikasi',
                  transfer_proof_url: proofPreview,
                  bank_name: methodEnum === 'transfer_bank' ? 'BCA' : methodEnum === 'ewallet' ? 'QRIS / E-Wallet' : 'COD'
                })
                .select();
              if (retry.data && retry.data.length > 0) {
                res = retry;
                dbForPayment = supabase;
              }
            }

            payRecord = res.data?.[0] || null;
          }

          if (payRecord) {
            setExistingProof(payRecord);
          }

          // 3. Update orders table status in Supabase
          const ordRes = await dbForPayment
            .from('orders')
            .update({
              payment_status: 'menunggu_verifikasi',
              order_status: 'menunggu_konfirmasi',
              updated_at: new Date().toISOString()
            })
            .eq('id', orderUuid);

          if (ordRes.error) {
            await supabase
              .from('orders')
              .update({
                payment_status: 'menunggu_verifikasi',
                order_status: 'menunggu_konfirmasi',
                updated_at: new Date().toISOString()
              })
              .eq('id', orderUuid);
          }

          // 4. Update local state
          setOrder(prev => ({
            ...prev,
            id: orderUuid,
            status: 'menunggu_konfirmasi',
            order_status: 'menunggu_konfirmasi',
            payment_status: 'menunggu_verifikasi'
          }));
        }
      }

      // Always sync localStorage
      const updatedOrder = {
        ...order,
        status: 'menunggu_konfirmasi',
        order_status: 'menunggu_konfirmasi',
        payment_status: 'menunggu_verifikasi',
      };
      setOrder(prev => ({ ...prev, ...updatedOrder }));
      setExistingProof(prev => ({ ...(prev || {}), status: 'menunggu_verifikasi', transfer_proof_url: proofPreview }));
      const savedOrders = JSON.parse(localStorage.getItem('barokah_orders') || '[]');
      const updatedList = savedOrders.map(o => o.order_number === orderId ? { ...o, ...updatedOrder } : o);
      localStorage.setItem('barokah_orders', JSON.stringify(updatedList));

      setProofFile(null);
      setProofPreview('');
      toast.success('✅ Bukti pembayaran berhasil dikirim! Admin akan segera memverifikasi.');
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Gagal mengirim bukti pembayaran: ' + (err.message || 'Coba lagi'));
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '80px 0', textAlign: 'center' }}>Memuat pesanan...</div>;
  }

  if (!order) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <div className="container">
          <h2>Pesanan #{orderId} Tidak Ditemukan</h2>
          <Link to="/" className="btn btn-primary" style={{ marginTop: '16px' }}>Kembali ke Beranda</Link>
        </div>
      </div>
    );
  }

  const rawOrderStatus = (order.order_status || order.status || 'menunggu_pembayaran').toLowerCase();
  const rawPaymentStatus = (order.payment_status || existingProof?.status || 'belum_dibayar').toLowerCase();

  const isLunas = rawPaymentStatus === 'lunas' || ['diproses', 'dikirim', 'selesai'].includes(rawOrderStatus);
  const isRejected = rawPaymentStatus === 'gagal' || rawOrderStatus === 'dibatalkan';
  const isPendingVerification = !isLunas && !isRejected && (
    rawOrderStatus === 'menunggu_konfirmasi' ||
    rawPaymentStatus === 'menunggu_verifikasi' ||
    Boolean(existingProof?.transfer_proof_url)
  );
  const isPendingPayment = !isLunas && !isRejected && !isPendingVerification;

  const orderStatus = rawOrderStatus;
  const paymentStatus = rawPaymentStatus;

  const steps = [
    { key: 'menunggu_pembayaran', label: 'MENUNGGU PEMBAYARAN' },
    { key: 'menunggu_konfirmasi', label: 'VERIFIKASI' },
    { key: 'diproses', label: 'DIPROSES TOKO' },
    { key: 'dikirim', label: 'DALAM PENGIRIMAN' },
    { key: 'selesai', label: 'SELESAI' }
  ];

  const currentStepIndex = steps.findIndex(s => s.key === orderStatus);

  return (
    <div style={{ padding: '40px 0 80px' }}>
      {/* ──── Full Image Preview Modal ──── */}
      {previewOpen && (
        <div
          onClick={() => setPreviewOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.88)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out'
          }}
        >
          <img
            src={existingProof?.transfer_proof_url || proofPreview}
            alt="Bukti Pembayaran"
            style={{ maxWidth: '92vw', maxHeight: '92vh', borderRadius: '8px', objectFit: 'contain' }}
          />
          <button
            onClick={() => setPreviewOpen(false)}
            style={{
              position: 'absolute', top: '20px', right: '20px',
              background: '#fff', border: 'none', borderRadius: '50%',
              width: '36px', height: '36px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="container" style={{ maxWidth: '960px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#666666', textTransform: 'uppercase' }}>
              TRANSACTION RECORD
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#080808', textTransform: 'uppercase' }}>
              PESANAN #{order.order_number}
            </h1>
            <div style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: '#666666' }}>
              WAKTU: {formatDate(order.created_at)}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleManualRefresh}
              disabled={isSyncing}
              title="Perbarui Status Pesanan"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '2px',
                border: '1px solid #e5e5e5',
                backgroundColor: '#ffffff',
                color: '#444444',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: '700',
                cursor: isSyncing ? 'not-allowed' : 'pointer'
              }}
            >
              <RefreshCw size={13} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
              {isSyncing ? 'MENYINKRONKAN...' : 'SINKRONKAN'}
            </button>
            <div style={{
              padding: '6px 12px',
              borderRadius: '2px',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: '800',
              backgroundColor: isLunas ? '#b7d600' : '#080808',
              color: isLunas ? '#080808' : '#ffffff'
            }}>
              {orderStatus.toUpperCase().replace(/_/g, ' ')}
            </div>
          </div>
        </div>

        {/* Progress Tracker */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '4px',
          padding: '28px',
          border: '1px solid #e5e5e5',
          marginBottom: '28px'
        }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: '900', marginBottom: '24px', textTransform: 'uppercase' }}>
            STATUS PELACAKAN PENGIRIMAN
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${steps.length}, 1fr)`,
            gap: '8px'
          }}>
            {steps.map((step, idx) => {
              const isPassed = currentStepIndex >= idx;
              const isSelesaiStep = step.key === 'selesai';
              const canConfirmOnSelesai = orderStatus === 'dikirim' && isSelesaiStep;

              return (
                <div
                  key={step.key}
                  onClick={canConfirmOnSelesai ? () => setIsConfirmModalOpen(true) : undefined}
                  style={{
                    textAlign: 'center',
                    cursor: canConfirmOnSelesai ? 'pointer' : 'default',
                    position: 'relative'
                  }}
                  title={canConfirmOnSelesai ? 'Klik di sini untuk verifikasi barang sudah diterima' : undefined}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '2px',
                    backgroundColor: isPassed ? '#080808' : canConfirmOnSelesai ? '#b7d600' : '#f4f4f4',
                    color: isPassed ? '#b7d600' : canConfirmOnSelesai ? '#080808' : '#888888',
                    border: canConfirmOnSelesai ? '2px solid #080808' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 8px',
                    fontWeight: '800',
                    fontSize: '0.78rem',
                    fontFamily: 'var(--font-mono)',
                    boxShadow: canConfirmOnSelesai ? '0 0 12px rgba(183,214,0,0.6)' : 'none',
                    transition: 'all 0.2s ease'
                  }}>
                    {isPassed ? <CheckCircle2 size={18} /> : (idx + 1)}
                  </div>
                  <div style={{
                    fontSize: '0.7rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: isPassed || canConfirmOnSelesai ? '700' : '500',
                    color: isPassed ? '#080808' : canConfirmOnSelesai ? '#080808' : '#888888',
                    lineHeight: '1.2'
                  }}>
                    {step.label}
                  </div>
                  {canConfirmOnSelesai && (
                    <span style={{
                      display: 'inline-block',
                      marginTop: '4px',
                      backgroundColor: '#080808',
                      color: '#b7d600',
                      fontSize: '0.62rem',
                      padding: '2px 6px',
                      borderRadius: '2px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: '800',
                      letterSpacing: '0.02em'
                    }}>
                      KLIK TERIMA
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════
            PAYMENT SECTION — state-driven
            ═══════════════════════════════════════════════════ */}

        {/* STATE 1: Rejected — Show rejection reason + re-upload form */}
        {isRejected && (
          <div style={{
            backgroundColor: '#fff5f5',
            borderRadius: '4px',
            padding: '28px',
            border: '2px solid #fca5a5',
            marginBottom: '28px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', color: '#dc2626' }}>
              <AlertTriangle size={20} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '900', textTransform: 'uppercase' }}>PEMBAYARAN DITOLAK</h3>
            </div>
            {existingProof?.rejection_reason && (
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fca5a5',
                borderRadius: '4px',
                marginBottom: '16px',
                fontSize: '0.88rem',
                color: '#991b1b',
                fontFamily: 'var(--font-mono)'
              }}>
                <strong>Alasan Penolakan:</strong> {existingProof.rejection_reason}
              </div>
            )}
            <p style={{ color: '#666666', fontSize: '0.85rem', marginBottom: '18px' }}>
              Silakan unggah ulang bukti pembayaran yang benar agar admin dapat memverifikasi kembali.
            </p>
            {/* Re-upload form */}
            <PaymentProofUploader
              proofFile={proofFile}
              proofPreview={proofPreview}
              isUploading={isUploading}
              fileInputRef={fileInputRef}
              onFileSelect={handleFileSelect}
              onRemove={() => { setProofFile(null); setProofPreview(''); fileInputRef.current.value = ''; }}
              onSubmit={handleSubmitPaymentProof}
            />
          </div>
        )}

        {/* STATE 2: Awaiting Verification */}
        {isPendingVerification && !isRejected && (
          <div style={{
            backgroundColor: '#fffbeb',
            borderRadius: '4px',
            padding: '28px',
            border: '1px solid #fde68a',
            marginBottom: '28px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', color: '#92400e' }}>
              <Clock size={20} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '900', textTransform: 'uppercase' }}>MENUNGGU VERIFIKASI ADMIN</h3>
            </div>
            <p style={{ color: '#78350f', fontSize: '0.88rem', marginBottom: '16px' }}>
              Bukti pembayaran Anda telah diterima. Admin akan memverifikasi dalam 1×24 jam.
            </p>
            {(existingProof?.transfer_proof_url) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  onClick={() => setPreviewOpen(true)}
                  style={{
                    width: '72px', height: '72px',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    border: '2px solid #fde68a',
                    cursor: 'zoom-in',
                    position: 'relative'
                  }}
                >
                  <img
                    src={existingProof.transfer_proof_url}
                    alt="Bukti"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute', inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Eye size={18} color="#fff" />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#92400e' }}>Bukti telah diunggah</div>
                  <div style={{ fontSize: '0.75rem', color: '#a16207', fontFamily: 'var(--font-mono)' }}>Klik thumbnail untuk memperbesar</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STATE 3A: Selesai — Barang Telah Diterima */}
        {orderStatus === 'selesai' && (
          <div style={{
            backgroundColor: '#f0fdf4',
            borderRadius: '4px',
            padding: '28px',
            border: '1px solid #86efac',
            marginBottom: '28px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', color: '#166534' }}>
              <CheckCircle2 size={22} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '900', textTransform: 'uppercase' }}>PESANAN SELESAI — BARANG SUDAH DITERIMA</h3>
            </div>
            <p style={{ color: '#15803d', fontSize: '0.88rem', lineHeight: '1.5' }}>
              Penerimaan barang telah terverifikasi dan transaksi pesanan ini telah selesai. Terima kasih telah berbelanja sepatu streetwear eksklusif di Toko Barokah Shoes!
            </p>
            <div style={{ marginTop: '12px', fontSize: '0.82rem', color: '#166534', fontWeight: '700' }}>
              ⭐ Silakan beri ulasan bintang &amp; testimoni untuk produk yang Anda beli pada daftar item di bawah.
            </div>
          </div>
        )}

        {/* STATE 3B: Dalam Pengiriman — Menampilkan tombol verifikasi barang diterima */}
        {orderStatus === 'dikirim' && (
          <div style={{
            backgroundColor: '#f5f3ff',
            borderRadius: '4px',
            padding: '28px',
            border: '1px solid #c4b5fd',
            marginBottom: '28px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', color: '#6d28d9' }}>
              <Truck size={22} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '900', textTransform: 'uppercase' }}>PESANAN SEDANG DALAM PENGIRIMAN</h3>
            </div>
            <p style={{ color: '#5b21b6', fontSize: '0.88rem', lineHeight: '1.5', marginBottom: '20px' }}>
              Paket sepatu Anda sedang dalam perjalanan oleh kurir <strong>{order.shipping_courier || 'Ekspedisi'}</strong> menuju alamat tujuan. Pastikan penerima berada di tempat untuk menerima paket.
            </p>

            {/* Kotak Aksi Verifikasi Penerimaan Barang */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #ddd6fe',
              borderRadius: '4px',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px',
              boxShadow: '0 2px 6px rgba(109, 40, 217, 0.05)'
            }}>
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#080808', marginBottom: '3px' }}>
                  Sudah menerima paket Anda?
                </div>
                <div style={{ fontSize: '0.78rem', color: '#666666' }}>
                  Klik tombol verifikasi di samping apabila produk telah sampai di tangan Anda dan sesuai pesanan.
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(true)}
                style={{
                  backgroundColor: '#080808',
                  color: '#b7d600',
                  border: 'none',
                  padding: '11px 20px',
                  borderRadius: '3px',
                  fontSize: '0.82rem',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                  transition: 'all 0.15s ease'
                }}
              >
                <CheckCircle2 size={16} /> VERIFIKASI BARANG SUDAH DITERIMA
              </button>
            </div>
          </div>
        )}

        {/* STATE 3C: Diproses Toko */}
        {orderStatus === 'diproses' && (
          <div style={{
            backgroundColor: '#eff6ff',
            borderRadius: '4px',
            padding: '28px',
            border: '1px solid #bfdbfe',
            marginBottom: '28px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', color: '#1d4ed8' }}>
              <Package size={22} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '900', textTransform: 'uppercase' }}>PEMBAYARAN LUNAS — PESANAN SEDANG DIPROSES</h3>
            </div>
            <p style={{ color: '#1e40af', fontSize: '0.88rem', lineHeight: '1.5' }}>
              Pembayaran Anda telah berhasil diverifikasi lunas. Saat ini tim gudang Toko Barokah sedang menyiapkan, mengemas (packing), dan melakukan quality check pada sepatu Anda sebelum diserahkan ke pihak ekspedisi kurir.
            </p>
          </div>
        )}

        {/* STATE 3D: Lunas Fallback (bila status lainnya) */}
        {isLunas && !['diproses', 'dikirim', 'selesai'].includes(orderStatus) && (
          <div style={{
            backgroundColor: '#f0fdf4',
            borderRadius: '4px',
            padding: '28px',
            border: '1px solid #86efac',
            marginBottom: '28px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', color: '#166534' }}>
              <CheckCircle2 size={20} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '900', textTransform: 'uppercase' }}>PEMBAYARAN TERVERIFIKASI — LUNAS</h3>
            </div>
            <p style={{ color: '#15803d', fontSize: '0.88rem' }}>
              Pembayaran Anda telah dikonfirmasi oleh admin. Pesanan sedang diproses.
            </p>
          </div>
        )}

        {/* STATE 4: Belum Bayar — Show payment instructions + upload form */}
        {isPendingPayment && !isRejected && (
          <div style={{
            backgroundColor: '#f3f0eb',
            borderRadius: '4px',
            padding: '28px',
            border: '1px solid #e5e5e5',
            marginBottom: '28px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', color: '#080808' }}>
              <Clock size={20} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '900', textTransform: 'uppercase' }}>INSTRUKSI PEMBAYARAN</h3>
            </div>

            <p style={{ color: '#444444', fontSize: '0.85rem', marginBottom: '16px' }}>
              Silakan lakukan transfer sesuai nominal total berikut ke rekening resmi Toko Barokah Shoes:
            </p>

            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '2px',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: '1px solid #e5e5e5',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#666666' }}>TOTAL TRANSFER:</div>
                <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#080808', fontFamily: 'var(--font-mono)' }}>
                  {formatIDR(order.total_amount ?? order.total ?? 0)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#666666' }}>
                  METODE: <strong>{(order.payment_method || '').toUpperCase()}</strong>
                </div>
                <div style={{ fontSize: '1rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#080808' }}>
                  {(order.payment_method === 'transfer_bank' || order.payment_method === 'BCA') && 'BCA: 873-092-1122 (PT Barokah Footwear)'}
                  {order.payment_method === 'MANDIRI' && 'Mandiri: 124-00-9876543-1'}
                  {order.payment_method === 'BRI' && 'BRI: 0123-01-002345-50-8'}
                  {order.payment_method === 'ewallet' && 'QRIS / E-Wallet — Scan QRIS Barokah'}
                  {order.payment_method === 'cod' && 'Bayar Tunai ke Kurir (COD)'}
                </div>
              </div>

              {order.payment_method !== 'cod' && (
                <button
                  onClick={() => copyToClipboard((order.total_amount ?? order.total ?? 0).toString(), 'Nominal pembayaran')}
                  className="btn btn-outline btn-sm"
                >
                  <Copy size={12} /> SALIN
                </button>
              )}
            </div>

            {order.payment_method !== 'cod' && (
              <PaymentProofUploader
                proofFile={proofFile}
                proofPreview={proofPreview}
                isUploading={isUploading}
                fileInputRef={fileInputRef}
                onFileSelect={handleFileSelect}
                onRemove={() => { setProofFile(null); setProofPreview(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                onSubmit={handleSubmitPaymentProof}
              />
            )}
          </div>
        )}

        {/* Details Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '4px',
          padding: '28px',
          border: '1px solid #e5e5e5'
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '900', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid #e5e5e5', textTransform: 'uppercase' }}>
            RINCIAN ITEM SILHOUETTES
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            {order.items?.map((item, idx) => {
              const reviewKey = `${order.order_number}_${item.product_name}_${item.size || 'default'}`;
              const reviewData = reviewedItems[reviewKey];
              const isFinished = order.order_status === 'selesai' || order.status === 'selesai';
              const imgUrl = item.product_image || item.product_image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80';

              return (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', padding: '12px', backgroundColor: '#fafafa', borderRadius: '6px', border: '1px solid #f0f0f0' }}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <img
                      src={imgUrl}
                      alt={item.product_name}
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '6px',
                        objectFit: 'cover',
                        border: '1px solid #e2e8f0',
                        backgroundColor: '#ffffff',
                        flexShrink: 0
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '0.92rem', color: '#080808' }}>{item.product_name}</div>
                      <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#666666' }}>SIZE EU {item.size} • {item.quantity} PAIRS</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ fontWeight: '800', fontSize: '0.95rem', fontFamily: 'var(--font-mono)' }}>
                      {formatIDR(item.subtotal || item.price * item.quantity)}
                    </div>

                    {isFinished && (
                      reviewData ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          backgroundColor: '#ecfdf5',
                          color: '#047857',
                          border: '1px solid #a7f3d0',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: '700'
                        }}>
                          ✓ Diulas ({reviewData.rating}★)
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedReviewItem({
                              ...item,
                              product_image: imgUrl
                            });
                            setIsReviewModalOpen(true);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            backgroundColor: '#080808',
                            color: '#b7d600',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '800',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-heading)',
                            textTransform: 'uppercase'
                          }}
                        >
                          <Star size={13} fill="#b7d600" /> Ulas Sepatu
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ paddingTop: '20px', borderTop: '1px solid #e5e5e5', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '0.85rem' }}>
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '900', textTransform: 'uppercase', marginBottom: '6px' }}>DESTINASI:</h4>
              <p style={{ color: '#444444', lineHeight: '1.5' }}>
                <strong>{order.recipient_name}</strong> ({order.recipient_phone || order.phone_number})<br />
                {order.shipping_address}
              </p>
              <div style={{ marginTop: '8px', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: '#080808', fontWeight: '700' }}>
                EKSPEDISI: {order.shipping_courier || order.shipping_method || '-'}
              </div>
            </div>

            <div style={{ fontFamily: 'var(--font-mono)' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '900', textTransform: 'uppercase', marginBottom: '6px', fontFamily: 'var(--font-heading)' }}>BIAYA:</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#666666' }}>
                <span>SUBTOTAL:</span>
                <span>{formatIDR(order.subtotal || 0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#666666' }}>
                <span>SHIPPING:</span>
                <span>{formatIDR(order.shipping_fee || order.shipping_cost || 0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e5e5', fontWeight: '900', fontSize: '1.1rem', color: '#080808' }}>
                <span>TOTAL:</span>
                <span>{formatIDR(order.total_amount ?? order.total ?? 0)}</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <Link to="/orders" className="btn btn-outline btn-sm">
              &larr; LIHAT SEMUA RIWAYAT
            </Link>
          </div>
        </div>

        {/* Review Modal */}
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          order={order}
          item={selectedReviewItem}
          onSuccess={(rev, key) => {
            setReviewedItems(prev => ({
              ...prev,
              [key]: { rating: rev.rating, comment: rev.comment }
            }));
          }}
        />

        {/* ──── Confirm Received Modal ──── */}
        {isConfirmModalOpen && (
          <div
            onClick={() => !isConfirmingReceived && setIsConfirmModalOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                maxWidth: '460px',
                width: '100%',
                padding: '32px 28px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                textAlign: 'center',
                position: 'relative'
              }}
            >
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#080808',
                color: '#b7d600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 8px 24px rgba(183, 214, 0, 0.25)'
              }}>
                <CheckCircle2 size={32} />
              </div>

              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '900',
                color: '#080808',
                marginBottom: '10px',
                textTransform: 'uppercase'
              }}>
                KONFIRMASI BARANG DITERIMA
              </h3>

              <p style={{
                fontSize: '0.88rem',
                color: '#555555',
                lineHeight: '1.5',
                marginBottom: '16px'
              }}>
                Apakah sepatu dari Pesanan <strong>#{order.order_number}</strong> sudah Anda terima dengan baik dan sesuai?
              </p>

              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '12px 14px',
                fontSize: '0.78rem',
                color: '#64748b',
                textAlign: 'left',
                marginBottom: '24px',
                lineHeight: '1.4'
              }}>
                ℹ️ Setelah dikonfirmasi, status pesanan akan resmi berubah menjadi <strong>SELESAI</strong> dan Anda dapat memberikan ulasan bintang pada produk sepatu yang dibeli.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                  type="button"
                  disabled={isConfirmingReceived}
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="btn btn-outline"
                  style={{ padding: '10px', fontSize: '0.82rem', fontWeight: '800' }}
                >
                  BELUM DITERIMA
                </button>

                <button
                  type="button"
                  disabled={isConfirmingReceived}
                  onClick={handleConfirmReceived}
                  style={{
                    backgroundColor: '#080808',
                    color: '#b7d600',
                    border: '1px solid #080808',
                    borderRadius: '2px',
                    padding: '10px',
                    fontSize: '0.82rem',
                    fontWeight: '900',
                    fontFamily: 'var(--font-heading)',
                    cursor: isConfirmingReceived ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  {isConfirmingReceived ? (
                    <>
                      <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                      MEMPROSES...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      YA, SUDAH TERIMA
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────
   Sub-component: Payment Proof Uploader
   ────────────────────────────────────────────────────────── */
const PaymentProofUploader = ({ proofFile, proofPreview, isUploading, fileInputRef, onFileSelect, onRemove, onSubmit }) => {
  return (
    <form onSubmit={onSubmit}>
      <div style={{
        border: '2px dashed #d0d0d0',
        borderRadius: '8px',
        padding: '20px',
        backgroundColor: '#fafafa',
        marginBottom: '14px',
        transition: 'border-color 0.2s'
      }}>
        {proofPreview ? (
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <img
                src={proofPreview}
                alt="Preview"
                style={{ width: '96px', height: '96px', objectFit: 'cover', borderRadius: '6px', border: '2px solid #e5e5e5' }}
              />
              <button
                type="button"
                onClick={onRemove}
                style={{
                  position: 'absolute', top: '-8px', right: '-8px',
                  width: '22px', height: '22px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px'
                }}
              >
                <X size={12} />
              </button>
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#080808' }}>
                {proofFile?.name || 'Bukti Pembayaran'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#666666', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                {proofFile ? `${(proofFile.size / 1024).toFixed(0)} KB (original)` : ''}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: '600' }}>
                ✓ Gambar siap dikirim (terkompresi otomatis)
              </div>
            </div>
          </div>
        ) : (
          <label
            htmlFor="proof-file-input"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              padding: '12px 0'
            }}
          >
            <div style={{
              width: '48px', height: '48px',
              borderRadius: '8px',
              backgroundColor: '#f0f0f0',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <ImageIcon size={24} color="#888888" />
            </div>
            <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#080808' }}>
              Klik untuk pilih gambar bukti transfer
            </span>
            <span style={{ fontSize: '0.75rem', color: '#888888', fontFamily: 'var(--font-mono)' }}>
              JPG / PNG / WEBP • Maks. 15 MB
            </span>
          </label>
        )}
        <input
          id="proof-file-input"
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={onFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      <button
        type="submit"
        disabled={isUploading || !proofPreview}
        className="btn btn-primary"
        style={{
          width: '100%',
          opacity: (isUploading || !proofPreview) ? 0.6 : 1,
          cursor: (isUploading || !proofPreview) ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
        }}
      >
        {isUploading ? (
          <>
            <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
            MENGUNGGAH BUKTI...
          </>
        ) : (
          <>
            <Upload size={16} />
            KIRIM BUKTI PEMBAYARAN
          </>
        )}
      </button>
    </form>
  );
};
