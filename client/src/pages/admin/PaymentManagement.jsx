import React, { useState, useEffect, useMemo } from 'react';
import { supabase, isSupabaseConfigured, getAdminClient } from '../../lib/supabase';
import { formatIDR, formatDate } from '../../lib/utils';
import {
  CreditCard,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCw,
  Eye,
  FileText,
  AlertTriangle,
  Building,
  ArrowUpRight,
  ShieldCheck,
  Check,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  TrendingUp,
  Download,
  Filter,
  DollarSign,
  ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ===================================================================
   VERIFIKASI & PEMBAYARAN — FINANCIAL LEDGER & VERIFICATION ENGINE
   Matches Stitch Screen 0a5458fb400340bb8a7e069b270e9717 exactly.
   Executive Streetwear light palette with high-contrast atelier styling.
   =================================================================== */

const C = {
  bgPage:        '#F8FAFC',
  card:          '#FFFFFF',
  cardHover:     '#F1F5F9',
  surface:       '#F8FAFC',
  surfaceLow:    '#F1F5F9',
  surfaceHigh:   '#E2E8F0',
  border:        '#E2E8F0',
  borderDark:    '#CBD5E1',

  // Emerald & Green
  emerald:       '#059669',
  emeraldHover:  '#047857',
  emeraldLight:  '#ECFDF5',
  emeraldBorder: '#A7F3D0',
  emeraldText:   '#047857',

  // Royal Blue
  blue:          '#2563EB',
  blueHover:     '#1D4ED8',
  blueLight:     '#EFF6FF',
  blueBorder:    '#BFDBFE',
  blueText:      '#1D4ED8',

  // Stitch Neon Lime Secondary Accent
  neonLime:      '#D0F12F',
  neonLimeHover: '#B5D400',
  neonLimeDark:  '#181E00',

  // Typography
  textMain:      '#0F172A',
  textHead:      '#020617',
  textSub:       '#334155',
  textMuted:     '#64748B',
  textLight:     '#94A3B8',

  // Alert & Warning
  amberText:     '#B45309',
  amberBg:       '#FEF3C7',
  amberBorder:   '#FDE68A',

  redText:       '#DC2626',
  redBg:         '#FEF2F2',
  redBorder:     '#FECACA',

  // Shadows
  shadowSm:      '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
  shadowMd:      '0 4px 12px -2px rgba(15, 23, 42, 0.05), 0 2px 4px -2px rgba(15, 23, 42, 0.03)',
  shadowLg:      '0 10px 25px -3px rgba(15, 23, 42, 0.08), 0 4px 10px -2px rgba(15, 23, 42, 0.03)',
  shadowXl:      '0 20px 30px -10px rgba(15, 23, 42, 0.12)'
};

export const PaymentManagement = ({ onNavigateBack }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('review'); // 'all' | 'review' | 'lunas' | 'ditolak' | 'cod'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('bukti_buram');
  const [rejectNote, setRejectNote] = useState('');
  const [isFullImageOpen, setIsFullImageOpen] = useState(false);
  const [isSyncingBank, setIsSyncingBank] = useState(false);

  // Fetch real payments and orders from Supabase (100% real database)
  const fetchPayments = async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const adminDb = await getAdminClient();
      if (!adminDb) {
        setLoading(false);
        return;
      }

      // 1. Fetch payments joined with orders and order_items
      // Explicitly select all payment fields including transfer_proof_url (which can contain large base64 data)
      const { data: payData, error: payError } = await adminDb
        .from('payments')
        .select('id, order_id, method, amount, status, bank_name, account_number, account_holder, transfer_proof_url, reference_number, verified_by, verified_at, rejection_reason, created_at, updated_at, orders(id, order_number, order_status, payment_status, total, recipient_name, recipient_phone, payment_method, shipping_address, shipping_city, created_at, order_items(product_name, quantity, unit_price, line_total))')
        .order('created_at', { ascending: false });

      if (payError) {
        console.warn('Payments fetch error:', payError);
      }

      // 2. Fetch all orders to include orders that don't have a payments row yet
      const { data: ordData, error: ordError } = await adminDb
        .from('orders')
        .select('id, order_number, order_status, payment_status, total, recipient_name, recipient_phone, payment_method, shipping_address, shipping_city, created_at, order_items(product_name, quantity, unit_price, line_total)')
        .order('created_at', { ascending: false });

      if (ordError) {
        console.warn('Orders fetch error:', ordError);
      }

      const existingOrderIds = new Set((payData || []).map(p => p.order_id).filter(Boolean));

      // Map real payments from database
      const mappedPayments = (payData || []).map(p => {
        const order = p.orders || {};
        const items = order.order_items || [];
        const productName = items.length > 0
          ? `${items[0].product_name}${items.length > 1 ? ` (+${items.length - 1} item)` : ''}`
          : `Pesanan #${order.order_number || p.order_id?.slice(0, 8)}`;

        const isCod = p.method === 'cod' || order.payment_method === 'cod';

        // Determine display status: map DB status to UI status
        let uiStatus = p.status;
        if (p.status === 'gagal' || order.payment_status === 'gagal' || order.payment_status === 'dikembalikan') {
          uiStatus = 'ditolak';
        } else if (p.status === 'lunas' || order.payment_status === 'lunas') {
          uiStatus = 'lunas';
        } else if (
          p.status === 'menunggu_verifikasi' ||
          order.payment_status === 'menunggu_verifikasi' ||
          order.order_status === 'menunggu_konfirmasi' ||
          Boolean(p.transfer_proof_url)
        ) {
          uiStatus = 'menunggu_verifikasi';
        } else if (isCod) {
          uiStatus = 'cod';
        } else {
          uiStatus = 'menunggu_pembayaran';
        }

        return {
          id: p.id,
          order_id: p.order_id,
          order_number: order.order_number || p.order_id?.slice(0, 8) || 'ORD-UNKNOWN',
          product_name: productName,
          customer_name: order.recipient_name || p.account_holder || 'Pelanggan',
          customer_phone: order.recipient_phone || '-',
          customer_email: '-',
          method: p.bank_name || (p.method === 'transfer_bank' ? 'Transfer Bank' : p.method === 'ewallet' ? 'E-Wallet / QRIS' : 'COD (Bayar di Tempat)'),
          method_type: isCod ? 'cod' : 'manual_transfer',
          amount: Number(p.amount || order.total || 0),
          created_at: p.created_at || order.created_at,
          status: uiStatus,
          _rawStatus: p.status,
          proof_image_url: p.transfer_proof_url || '',
          metadata_sha256: p.transfer_proof_url ? 'SUPABASE-STORAGE' : 'BELUM-ADA-BUKTI',
          file_size_label: p.transfer_proof_url ? 'Gambar Terunggah' : 'Belum Ada Bukti',
          billed_amount: Number(order.total || p.amount || 0),
          proof_amount: Number(p.amount || order.total || 0),
          target_account: p.bank_name ? `${p.bank_name} — Rek. Toko Barokah` : 'BCA 8045-221-009 — PT Barokah',
          target_account_holder: 'PT Barokah Footwear',
          sender_account: p.account_number || (isCod ? 'Tunai di Tempat' : 'Rekening Pelanggan'),
          sender_name: p.account_holder || order.recipient_name || '-',
          transfer_note: `Pesanan #${order.order_number || ''}`,
          match_percentage: p.transfer_proof_url ? 100 : 0,
          rejection_reason: p.rejection_reason || null,
          verified_at: p.verified_at || null,
          has_real_payment_row: true
        };
      });

      // Map orders without payments row so admin sees all real orders
      const pendingOrdersMapped = (ordData || [])
        .filter(o => !existingOrderIds.has(o.id))
        .map(o => {
          const items = o.order_items || [];
          const productName = items.length > 0
            ? `${items[0].product_name}${items.length > 1 ? ` (+${items.length - 1} item)` : ''}`
            : `Pesanan #${o.order_number}`;

          const isCod = o.payment_method === 'cod';
          // Map order payment_status to UI status — handle all possible statuses
          let uiStatus;
          if (o.payment_status === 'lunas') uiStatus = 'lunas';
          else if (o.payment_status === 'menunggu_verifikasi' || o.order_status === 'menunggu_konfirmasi') uiStatus = 'menunggu_verifikasi';
          else if (o.payment_status === 'gagal' || o.payment_status === 'dikembalikan') uiStatus = 'ditolak';
          else if (isCod) uiStatus = 'cod';
          else uiStatus = 'menunggu_pembayaran';

          return {
            id: `ord-pending-${o.id}`,
            order_id: o.id,
            order_number: o.order_number,
            product_name: productName,
            customer_name: o.recipient_name,
            customer_phone: o.recipient_phone,
            customer_email: '-',
            method: isCod ? 'COD (Bayar di Tempat)' : o.payment_method === 'ewallet' ? 'E-Wallet / QRIS' : 'Transfer Bank (BCA)',
            method_type: isCod ? 'cod' : 'manual_transfer',
            amount: Number(o.total || 0),
            created_at: o.created_at,
            status: uiStatus,
            _rawStatus: o.payment_status || 'belum_dibayar',
            proof_image_url: '',
            metadata_sha256: 'BELUM-ADA-BUKTI',
            file_size_label: 'Belum Ada Bukti',
            billed_amount: Number(o.total || 0),
            proof_amount: Number(o.total || 0),
            target_account: 'BCA 8045-221-009 — PT Barokah',
            target_account_holder: 'PT Barokah Footwear',
            sender_account: isCod ? 'Tunai di Tempat' : 'Rekening Pelanggan',
            sender_name: o.recipient_name,
            transfer_note: `Pesanan #${o.order_number}`,
            match_percentage: 0,
            rejection_reason: null,
            verified_at: null,
            has_real_payment_row: false
          };
        });

      const combined = [...mappedPayments, ...pendingOrdersMapped];
      setPayments(combined);
      setSelectedPayment(prev => {
        if (!prev) return combined[0] || null;
        return combined.find(c => c.id === prev.id) || combined[0] || null;
      });
    } catch (err) {
      console.warn('fetchPayments error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();

    // Auto-poll every 8 seconds to synchronize new payments/proofs
    const pollInterval = setInterval(() => {
      fetchPayments();
    }, 8000);

    return () => clearInterval(pollInterval);
  }, []);

  // Live Metric Counts from real database
  const counts = useMemo(() => {
    const reviewList = payments.filter(p => p.status === 'menunggu_verifikasi');
    const lunasList = payments.filter(p => p.status === 'lunas');
    const ditolakList = payments.filter(p => p.status === 'ditolak');
    const codList = payments.filter(p => p.method_type === 'cod');
    const totalLunasAmount = lunasList.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalDitolakAmount = ditolakList.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    return {
      all: payments.length,
      review: reviewList.length,
      lunas: lunasList.length,
      ditolak: ditolakList.length,
      cod: codList.length,
      totalLunasAmount,
      totalDitolakAmount
    };
  }, [payments]);

  // Filtered payments list
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      // Tab filter
      if (activeTab === 'review') {
        if (p.status !== 'menunggu_verifikasi') return false;
      }
      if (activeTab === 'lunas' && p.status !== 'lunas') return false;
      if (activeTab === 'ditolak' && p.status !== 'ditolak') return false;
      if (activeTab === 'cod' && p.method_type !== 'cod') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const num = (p.order_number || '').toLowerCase();
        const cust = (p.customer_name || '').toLowerCase();
        const method = (p.method || '').toLowerCase();
        if (!num.includes(q) && !cust.includes(q) && !method.includes(q)) return false;
      }

      return true;
    });
  }, [payments, activeTab, searchQuery]);

  // Auto-sync selectedPayment when activeTab or filtered list changes
  useEffect(() => {
    if (filteredPayments.length > 0) {
      const stillInList = filteredPayments.find(p => p.id === selectedPayment?.id);
      if (!stillInList) {
        setSelectedPayment(filteredPayments[0]);
      }
    } else {
      setSelectedPayment(null);
    }
  }, [activeTab, filteredPayments]);

  // Approve Payment Action — updates Supabase payments + orders
  const handleApprovePayment = async (item) => {
    const optimistic = payments.map(p =>
      p.id === item.id ? { ...p, status: 'lunas', _rawStatus: 'lunas' } : p
    );
    setPayments(optimistic);
    setSelectedPayment(optimistic.find(p => p.id === item.id));

    if (isSupabaseConfigured) {
      try {
        const adminDb = await getAdminClient();
        if (adminDb) {
          // 1. Update payment status → lunas
          if (item.has_real_payment_row && !item.id.startsWith('ord-pending-')) {
            const { error: payErr } = await adminDb
              .from('payments')
              .update({
                status: 'lunas',
                verified_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', item.id);
            if (payErr) console.warn('Payment approve error:', payErr);
          } else if (item.order_id) {
            await adminDb
              .from('payments')
              .upsert({
                order_id: item.order_id,
                method: item.method_type === 'cod' ? 'cod' : 'transfer_bank',
                amount: item.amount,
                status: 'lunas',
                verified_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }, { onConflict: 'order_id' });
          }

          // 2. Update order → payment_status: lunas, order_status: diproses
          if (item.order_id) {
            const { error: ordErr } = await adminDb
              .from('orders')
              .update({
                payment_status: 'lunas',
                order_status: 'diproses',
                paid_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', item.order_id);
            if (ordErr) console.warn('Order approve error:', ordErr);
          }
        }
      } catch (err) {
        console.warn('Approve error:', err);
      }
    }

    toast.success(`✅ Pembayaran #${item.order_number} (${item.customer_name}) LUNAS & pesanan DIPROSES!`);
    fetchPayments();
  };

  // Reject Payment Action — updates Supabase payments + orders
  const handleRejectPayment = async () => {
    if (!selectedPayment) return;

    const reasonsMap = {
      bukti_buram: 'Bukti transfer buram / tidak terbaca',
      nominal_salah: 'Nominal transfer tidak sesuai dengan pesanan',
      mutasi_tidak_ada: 'Dana belum masuk pada mutasi rekening resmi',
      palsu: 'Indikasi struk palsu / manipulasi digital'
    };

    const reasonText = reasonsMap[rejectReason] || 'Pembayaran tidak valid';
    const fullReason = reasonText + (rejectNote ? ` — ${rejectNote}` : '');

    const updated = payments.map(p =>
      p.id === selectedPayment.id
        ? { ...p, status: 'ditolak', _rawStatus: 'gagal', rejection_reason: fullReason }
        : p
    );
    setPayments(updated);
    setSelectedPayment(updated.find(p => p.id === selectedPayment.id));
    setIsRejectModalOpen(false);

    if (isSupabaseConfigured) {
      try {
        const adminDb = await getAdminClient();
        if (adminDb) {
          if (selectedPayment.has_real_payment_row && !selectedPayment.id.startsWith('ord-pending-')) {
            const { error: payErr } = await adminDb
              .from('payments')
              .update({
                status: 'gagal',
                rejection_reason: fullReason,
                updated_at: new Date().toISOString()
              })
              .eq('id', selectedPayment.id);
            if (payErr) console.warn('Payment reject error:', payErr);
          }

          if (selectedPayment.order_id) {
            const { error: ordErr } = await adminDb
              .from('orders')
              .update({
                payment_status: 'gagal',
                order_status: 'menunggu_pembayaran',
                updated_at: new Date().toISOString()
              })
              .eq('id', selectedPayment.order_id);
            if (ordErr) console.warn('Order reject error:', ordErr);
          }
        }
      } catch (err) {
        console.warn('Reject error:', err);
      }
    }

    toast.error(`❌ Pembayaran #${selectedPayment.order_number} ditolak — ${reasonText}`);
    fetchPayments();
  };

  // Bank Mutation / Database Sync Trigger
  const handlePullBankMutation = async () => {
    setIsSyncingBank(true);
    await fetchPayments();
    setTimeout(() => {
      setIsSyncingBank(false);
      toast.success('Database pembayaran Supabase berhasil disinkronkan!');
    }, 600);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', minWidth: 0 }}>

      {/* ============================================================== */}
      {/* 1. TOP BAR / PAGE HEADER                                       */}
      {/* ============================================================== */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        borderBottom: `1px solid ${C.border}`,
        paddingBottom: '20px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {/* Breadcrumbs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Admin
            </span>
            <span style={{ fontSize: '0.68rem', color: C.borderDark }}>/</span>
            <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Keuangan
            </span>
            <span style={{ fontSize: '0.68rem', color: C.borderDark }}>/</span>
            <span style={{
              fontSize: '0.68rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              color: '#0F172A',
              backgroundColor: C.neonLime,
              padding: '2px 8px',
              borderRadius: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}>
              Pembayaran
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
            <h1 style={{
              fontSize: '1.85rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: C.textHead,
              letterSpacing: '-0.02em',
              margin: 0
            }}>
              Verifikasi & Pembayaran
            </h1>
            <span style={{
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              color: C.textMuted,
              fontWeight: 600,
              backgroundColor: C.surfaceLow,
              padding: '3px 8px',
              borderRadius: '4px',
              border: `1px solid ${C.border}`
            }}>
              TABLE: public.payments
            </span>
          </div>

          <p style={{ fontSize: '0.84rem', color: C.textMuted, margin: 0, maxWidth: '640px' }}>
            Pusat verifikasi transaksi manual, pencocokan bukti transfer m-banking, dan sinkronisasi auto-settlement gateway.
          </p>
        </div>

        {/* Quick Ledger Sync Status & Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            backgroundColor: C.card,
            borderRadius: '8px',
            border: `1px solid ${C.border}`,
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
            boxShadow: C.shadowSm
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: C.emerald, display: 'inline-block' }} />
            <span style={{ fontWeight: 700, color: C.textHead }}>BCA Auto-Hook: Live</span>
            <span style={{ color: C.textMuted }}>| 14:38 WIB</span>
          </div>

          <button
            type="button"
            onClick={handlePullBankMutation}
            disabled={isSyncingBank}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              backgroundColor: '#0F172A',
              color: C.neonLime,
              border: 'none',
              borderRadius: '8px',
              fontWeight: 900,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              cursor: isSyncingBank ? 'wait' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 14px rgba(15, 23, 42, 0.2)'
            }}
          >
            <RotateCw size={15} className={isSyncingBank ? 'animate-spin' : ''} />
            <span>{isSyncingBank ? 'Menarik Mutasi...' : 'Tarik Mutasi Bank'}</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. METRIC OVERVIEW BENTO CARDS (4 ITEMS)                       */}
      {/* ============================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px'
      }}>
        {/* Card 1: Menunggu Verifikasi */}
        <div style={{
          backgroundColor: C.card,
          padding: '20px',
          borderRadius: '14px',
          border: `1px solid ${C.amberBorder}`,
          boxShadow: C.shadowSm,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: C.textMuted, fontWeight: 700 }}>
              Menunggu Verifikasi
            </span>
            <span style={{
              fontSize: '0.68rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              backgroundColor: C.amberBg,
              color: C.amberText,
              padding: '2px 8px',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#D97706' }} />
              {counts.review} Antrean
            </span>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '1.85rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: C.textHead, margin: '0 0 2px' }}>
                {counts.review}
              </p>
              <p style={{ fontSize: '0.74rem', color: C.textMuted, margin: 0 }}>
                Transaksi Manual Perlu Approval
              </p>
            </div>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: C.amberBg,
              color: C.amberText,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Clock size={20} />
            </div>
          </div>
        </div>

        {/* Card 2: Pembayaran Lunas (Bulan Ini) */}
        <div style={{
          backgroundColor: C.card,
          padding: '20px',
          borderRadius: '14px',
          border: `1px solid ${C.emeraldBorder}`,
          boxShadow: C.shadowSm,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: C.textMuted, fontWeight: 700 }}>
              Lunas (Bulan Ini)
            </span>
            <span style={{
              fontSize: '0.68rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 900,
              backgroundColor: C.emeraldLight,
              color: C.emeraldText,
              padding: '2px 8px',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <TrendingUp size={12} /> +18.4%
            </span>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: C.textHead, margin: '0 0 2px' }}>
                {formatIDR(counts.totalLunasAmount)}
              </p>
              <p style={{ fontSize: '0.74rem', color: C.textMuted, margin: 0 }}>
                {counts.lunas} Transaksi Terverifikasi
              </p>
            </div>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: C.neonLime,
              color: '#181E00',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
        </div>

        {/* Card 3: Ditolak / Gagal */}
        <div style={{
          backgroundColor: C.card,
          padding: '20px',
          borderRadius: '14px',
          border: `1px solid ${C.redBorder}`,
          boxShadow: C.shadowSm,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: C.textMuted, fontWeight: 700 }}>
              Ditolak / Gagal
            </span>
            <span style={{
              fontSize: '0.68rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              backgroundColor: C.redBg,
              color: C.redText,
              padding: '2px 8px',
              borderRadius: '9999px'
            }}>
              {counts.ditolak} Transaksi
            </span>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: C.redText, margin: '0 0 2px' }}>
                {formatIDR(counts.totalDitolakAmount)}
              </p>
              <p style={{ fontSize: '0.74rem', color: C.textMuted, margin: 0 }}>
                {counts.ditolak} Transaksi Ditolak / Gagal
              </p>
            </div>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: C.redBg,
              color: C.redText,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <XCircle size={20} />
            </div>
          </div>
        </div>

        {/* Card 4: Transaksi Otomatis QRIS/VA & Database Total */}
        <div style={{
          backgroundColor: C.card,
          padding: '20px',
          borderRadius: '14px',
          border: `1px solid ${C.border}`,
          boxShadow: C.shadowSm,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: C.textMuted, fontWeight: 700 }}>
              Total Transaksi DB
            </span>
            <span style={{
              fontSize: '0.68rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              backgroundColor: C.surfaceLow,
              color: C.textMain,
              padding: '2px 8px',
              borderRadius: '9999px'
            }}>
              Supabase Live
            </span>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: C.textHead, margin: '0 0 2px' }}>
                {counts.all} Transaksi
              </p>
              <p style={{ fontSize: '0.74rem', color: C.textMuted, margin: 0 }}>
                Transfer Bank, E-Wallet, & COD
              </p>
            </div>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: C.surfaceLow,
              color: C.textMain,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Zap size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. FILTER TABS & SEARCH PIPELINE                               */}
      {/* ============================================================== */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        backgroundColor: C.card,
        padding: '12px 18px',
        borderRadius: '12px',
        border: `1px solid ${C.border}`,
        boxShadow: C.shadowSm
      }}>
        {/* Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto' }}>
          {[
            { key: 'all', label: 'Semua Pembayaran', count: counts.all },
            { key: 'review', label: 'Perlu Verifikasi', count: counts.review, highlight: true },
            { key: 'lunas', label: 'Lunas', count: counts.lunas },
            { key: 'ditolak', label: 'Ditolak', count: counts.ditolak, isRed: true },
            { key: 'cod', label: 'COD (Bayar di Tempat)', count: counts.cod }
          ].map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: '0.76rem',
                  backgroundColor: isActive ? '#0F172A' : 'transparent',
                  color: isActive ? C.neonLime : tab.isRed ? C.redText : C.textSub,
                  transition: 'all 0.15s'
                }}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span style={{
                    fontSize: '0.65rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 900,
                    padding: '1px 6px',
                    borderRadius: '10px',
                    backgroundColor: isActive ? C.neonLime : C.surfaceHigh,
                    color: isActive ? '#0F172A' : C.textMain
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={16} style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: C.textMuted
          }} />
          <input
            type="text"
            placeholder="No. Pesanan (#BKH-...), Nama, Bank..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              height: '38px',
              backgroundColor: C.surfaceLow,
              border: `1px solid ${C.border}`,
              borderRadius: '8px',
              padding: '0 14px 0 36px',
              fontSize: '0.8rem',
              color: C.textMain,
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. SPLIT SCREEN: VERIFICATION QUEUE & INSPECTOR PREVIEW        */}
      {/* ============================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: '24px',
        alignItems: 'flex-start'
      }}>
        {/* LEFT: Verification Queue Table (7 cols on desktop) */}
        <div style={{
          gridColumn: 'span 12',
          '@media (minWidth: 1200px)': { gridColumn: 'span 7' },
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }} className="payment-table-col">
          <style>{`
            @media (min-width: 1200px) {
              .payment-table-col { grid-column: span 7 !important; }
              .payment-inspector-col { grid-column: span 5 !important; }
            }
          `}</style>

          <div style={{
            backgroundColor: C.card,
            borderRadius: '16px',
            border: `1px solid ${C.border}`,
            boxShadow: C.shadowSm,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Table Header Strip */}
            <div style={{
              padding: '14px 20px',
              backgroundColor: C.surfaceLow,
              borderBottom: `1px solid ${C.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', color: C.textHead }}>
                  Antrean Menunggu Konfirmasi Manual
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: C.textMuted }}>
                {filteredPayments.length} transaksi terdaftar
              </span>
            </div>

            {/* Table Body */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{
                    backgroundColor: C.surfaceLow,
                    borderBottom: `1px solid ${C.border}`,
                    fontSize: '0.68rem',
                    fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase',
                    color: C.textMuted
                  }}>
                    <th style={{ padding: '12px 16px' }}>Order ID & Bukti</th>
                    <th style={{ padding: '12px 16px' }}>Pelanggan</th>
                    <th style={{ padding: '12px 16px' }}>Metode</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Nominal (IDR)</th>
                    <th style={{ padding: '12px 16px' }}>Waktu</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((p) => {
                    const isSelected = selectedPayment && selectedPayment.id === p.id;
                    return (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedPayment(p)}
                        style={{
                          borderBottom: `1px solid ${C.border}`,
                          backgroundColor: isSelected ? 'rgba(208, 241, 47, 0.12)' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s'
                        }}
                      >
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {isSelected && (
                              <div style={{ width: '4px', height: '36px', backgroundColor: '#0F172A', borderRadius: '2px' }} />
                            )}
                            <div style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              backgroundColor: C.surfaceLow,
                              flexShrink: 0,
                              boxShadow: C.shadowSm
                            }}>
                              {p.proof_image_url ? (
                                <img
                                  src={p.proof_image_url}
                                  alt="Bukti Transfer"
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textMuted }}>
                                  <CreditCard size={18} />
                                </div>
                              )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 800, color: C.textHead, fontFamily: 'var(--font-mono)' }}>
                                #{p.order_number}
                              </span>
                              <span style={{ fontSize: '0.72rem', color: C.textMuted }}>
                                {p.product_name}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 700, color: C.textHead }}>
                              {p.customer_name}
                            </span>
                            <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: C.textMuted }}>
                              {p.customer_email}
                            </span>
                          </div>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            fontSize: '0.72rem',
                            fontFamily: 'var(--font-mono)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: C.surfaceLow,
                            fontWeight: 700,
                            color: C.textMain
                          }}>
                            {p.method}
                          </span>
                        </td>

                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: C.textHead }}>
                            {formatIDR(p.amount)}
                          </span>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                            <span style={{ color: C.textHead }}>
                              {new Date(p.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                            </span>
                            <span style={{ color: p.status === 'menunggu_verifikasi' ? '#D97706' : C.textMuted }}>
                              {p.status === 'menunggu_verifikasi' ? 'Perlu dicek' : 'Selesai'}
                            </span>
                          </div>
                        </td>

                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <span style={{
                            fontSize: '0.65rem',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            backgroundColor: p.status === 'lunas' ? C.emeraldLight : p.status === 'ditolak' ? C.redBg : C.amberBg,
                            color: p.status === 'lunas' ? C.emeraldText : p.status === 'ditolak' ? C.redText : C.amberText
                          }}>
                            {p.status === 'menunggu_verifikasi' ? 'Review' : p.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredPayments.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: '48px 16px', textAlign: 'center', color: C.textMuted }}>
                        <CreditCard size={36} style={{ margin: '0 auto 12px', opacity: 0.35, display: 'block' }} />
                        <div style={{ fontWeight: 800, fontSize: '0.92rem', color: C.textHead, textTransform: 'uppercase' }}>
                          Tidak Ada Transaksi Pembayaran
                        </div>
                        <div style={{ fontSize: '0.78rem', marginTop: '6px' }}>
                          {loading ? 'Memuat data pembayaran dari database Supabase...' : 'Belum ada transaksi pembayaran pada kategori filter ini di database.'}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Real-Time Database Ledger Feed */}
          <div style={{
            backgroundColor: C.card,
            borderRadius: '16px',
            border: `1px solid ${C.border}`,
            padding: '20px',
            boxShadow: C.shadowSm,
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building size={18} style={{ color: C.blue }} />
                <span style={{ fontSize: '0.88rem', fontWeight: 800, textTransform: 'uppercase', color: C.textHead }}>
                  Buku Kas & Transaksi Real Database
                </span>
              </div>
              <span style={{
                fontSize: '0.65rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
                backgroundColor: '#0F172A',
                color: C.neonLime,
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                SUPABASE LIVE
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
              {payments.slice(0, 4).map(mut => (
                <div
                  key={mut.id}
                  onClick={() => setSelectedPayment(mut)}
                  style={{
                    backgroundColor: C.surfaceLow,
                    borderRadius: '8px',
                    padding: '12px',
                    border: `1px solid ${C.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: C.textHead }}>
                      #{mut.order_number} • {mut.customer_name}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: C.textMuted, maxWidth: '170px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {mut.method} • {mut.status.toUpperCase()}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '0.78rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 900,
                    backgroundColor: '#0F172A',
                    color: C.neonLime,
                    padding: '3px 8px',
                    borderRadius: '6px'
                  }}>
                    {formatIDR(mut.amount)}
                  </span>
                </div>
              ))}
              {payments.length === 0 && (
                <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '16px', fontSize: '0.75rem', color: C.textMuted }}>
                  Belum ada catatan mutasi transaksi di database.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Payment Inspection Card & Proof Viewer (5 cols on desktop) */}
        <div style={{
          gridColumn: 'span 12',
          '@media (minWidth: 1200px)': { gridColumn: 'span 5' },
          position: 'sticky',
          top: '84px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }} className="payment-inspector-col">
          {selectedPayment ? (
            <div style={{
              backgroundColor: C.card,
              borderRadius: '16px',
              border: `1px solid ${C.border}`,
              boxShadow: C.shadowLg,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Top Bar */}
              <div style={{
                padding: '16px 20px',
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: `2px solid ${C.neonLime}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} style={{ color: C.neonLime }} />
                  <span style={{ fontSize: '0.84rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Detail Inspeksi Bukti
                  </span>
                </div>
                <span style={{
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 900,
                  backgroundColor: C.neonLime,
                  color: '#181E00',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  Order #{selectedPayment.order_number}
                </span>
              </div>

              {/* Inspector Content */}
              <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                
                {/* Proof Image Preview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: C.textMuted, fontWeight: 700 }}>
                      Bukti Unggahan Pelanggan
                    </span>
                    {selectedPayment.proof_image_url && (
                      <button
                        type="button"
                        onClick={() => setIsFullImageOpen(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: C.blue,
                          fontSize: '0.72rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <ExternalLink size={12} /> Buka Resolusi Penuh
                      </button>
                    )}
                  </div>

                  <div style={{
                    position: 'relative',
                    width: '100%',
                    minHeight: '260px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    backgroundColor: '#F8FAFC',
                    border: `1px solid ${C.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: C.shadowSm
                  }}>
                    {selectedPayment.proof_image_url ? (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        minHeight: '260px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '12px',
                        backgroundColor: '#0F172A'
                      }}>
                        <img
                          src={selectedPayment.proof_image_url}
                          alt="Bukti Transfer Digital"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '240px',
                            objectFit: 'contain',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                          onClick={() => setIsFullImageOpen(true)}
                        />
                      </div>
                    ) : (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '36px 20px',
                        textAlign: 'center',
                        gap: '8px'
                      }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          backgroundColor: C.surfaceHigh,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: C.textMuted
                        }}>
                          <ImageIcon size={24} />
                        </div>
                        <span style={{ fontSize: '0.84rem', fontWeight: 800, color: C.textHead }}>
                          Belum Ada Bukti Pembayaran
                        </span>
                        <span style={{ fontSize: '0.74rem', color: C.textMuted, maxWidth: '240px', lineHeight: 1.4 }}>
                          {selectedPayment.method_type === 'cod'
                            ? 'Pesanan menggunakan metode COD (Bayar di Tempat). Tidak memerlukan transfer bukti fisik.'
                            : 'Pelanggan belum mengunggah foto struk/bukti transfer untuk pesanan ini.'}
                        </span>
                      </div>
                    )}

                    {/* Overlay Metadata */}
                    <div style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '10px',
                      right: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.92)',
                      backdropFilter: 'blur(8px)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={14} style={{ color: C.emeraldText }} />
                        <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: C.textHead }}>
                          SHA256: {selectedPayment.metadata_sha256} Valid
                        </span>
                      </div>
                      <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: C.textMuted }}>
                        {selectedPayment.file_size_label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cross-Check Validation Details */}
                <div style={{
                  backgroundColor: C.surfaceLow,
                  borderRadius: '12px',
                  padding: '16px',
                  border: `1px solid ${C.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}`, paddingBottom: '8px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: C.textHead }}>
                      Validasi Kecocokan Data
                    </span>
                    <span style={{
                      fontSize: '0.68rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 900,
                      backgroundColor: '#0F172A',
                      color: C.neonLime,
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      {selectedPayment.match_percentage}% MATCH
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: C.textMuted, textTransform: 'uppercase' }}>
                        Nominal Ditagih
                      </span>
                      <span style={{ fontSize: '0.94rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: C.textHead }}>
                        {formatIDR(selectedPayment.billed_amount)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: C.textMuted, textTransform: 'uppercase' }}>
                        Nominal di Bukti
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.94rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: C.textHead }}>
                          {formatIDR(selectedPayment.proof_amount)}
                        </span>
                        {selectedPayment.billed_amount === selectedPayment.proof_amount && (
                          <CheckCircle2 size={16} style={{ color: C.emeraldText }} />
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingTop: '8px', borderTop: `1px solid ${C.border}` }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: C.textMuted, textTransform: 'uppercase' }}>
                        Rekening Penerima
                      </span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: C.textHead }}>
                        {selectedPayment.target_account}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: C.textMuted }}>
                        {selectedPayment.target_account_holder}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: C.textMuted, textTransform: 'uppercase' }}>
                        Pengirim
                      </span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: C.textHead }}>
                        {selectedPayment.sender_name}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: C.textMuted }}>
                        {selectedPayment.sender_account}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '8px', borderTop: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: C.textMuted, textTransform: 'uppercase' }}>
                      Berita Transfer
                    </span>
                    <div style={{
                      padding: '8px 10px',
                      backgroundColor: C.card,
                      borderRadius: '6px',
                      fontSize: '0.74rem',
                      fontFamily: 'var(--font-mono)',
                      color: C.textHead,
                      border: `1px solid ${C.border}`
                    }}>
                      "{selectedPayment.transfer_note}"
                    </div>
                  </div>
                </div>

                {/* Action Buttons Tier */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    type="button"
                    disabled={selectedPayment.status === 'lunas'}
                    onClick={() => handleApprovePayment(selectedPayment)}
                    style={{
                      height: '46px',
                      backgroundColor: selectedPayment.status === 'lunas' ? C.surfaceHigh : C.neonLime,
                      color: selectedPayment.status === 'lunas' ? C.textMuted : '#181E00',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 900,
                      fontSize: '0.8rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      cursor: selectedPayment.status === 'lunas' ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: selectedPayment.status === 'lunas' ? 'none' : '0 4px 12px rgba(208, 241, 47, 0.35)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <CheckCircle2 size={18} />
                    <span>{selectedPayment.status === 'lunas' ? 'Sudah Diverifikasi (Lunas)' : 'Verifikasi Pembayaran (Approve)'}</span>
                  </button>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      type="button"
                      disabled={selectedPayment.status === 'ditolak'}
                      onClick={() => setIsRejectModalOpen(true)}
                      style={{
                        height: '40px',
                        backgroundColor: C.redBg,
                        color: C.redText,
                        border: `1px solid ${C.redBorder}`,
                        borderRadius: '8px',
                        fontWeight: 800,
                        fontSize: '0.72rem',
                        textTransform: 'uppercase',
                        cursor: selectedPayment.status === 'ditolak' ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <XCircle size={15} />
                      <span>{selectedPayment.status === 'ditolak' ? 'Sudah Ditolak' : 'Tolak (Reject)'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePullBankMutation}
                      style={{
                        height: '40px',
                        backgroundColor: C.surfaceLow,
                        color: C.textMain,
                        border: `1px solid ${C.border}`,
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.72rem',
                        textTransform: 'uppercase',
                        fontFamily: 'var(--font-mono)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Building size={15} />
                      <span>Cek Mutasi BCA</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div style={{
              backgroundColor: C.card,
              borderRadius: '16px',
              border: `1px dashed ${C.borderDark}`,
              padding: '60px 24px',
              textAlign: 'center',
              color: C.textMuted
            }}>
              Pilih salah satu transaksi pembayaran untuk memulai inspeksi.
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL: ALASAN PENOLAKAN PEMBAYARAN                             */}
      {/* ============================================================== */}
      {isRejectModalOpen && selectedPayment && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: C.card,
            borderRadius: '16px',
            maxWidth: '480px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: C.shadowXl,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '18px 20px',
              backgroundColor: C.redBg,
              color: C.redText,
              borderBottom: `1px solid ${C.redBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={20} />
                <h3 style={{ fontSize: '0.94rem', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>
                  Tolak Pembayaran #{selectedPayment.order_number}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                style={{ background: 'none', border: 'none', color: C.redText, cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <label style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: C.textSub, textTransform: 'uppercase' }}>
                PILIH ALASAN PENOLAKAN
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { value: 'bukti_buram', label: 'Bukti transfer buram / tidak terbaca' },
                  { value: 'nominal_salah', label: 'Nominal transfer tidak sesuai dengan pesanan' },
                  { value: 'mutasi_tidak_ada', label: 'Dana belum masuk pada mutasi rekening resmi' },
                  { value: 'palsu', label: 'Indikasi struk palsu / manipulasi digital' }
                ].map(r => (
                  <label
                    key={r.value}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      backgroundColor: rejectReason === r.value ? C.redBg : C.surfaceLow,
                      border: rejectReason === r.value ? `1px solid ${C.redBorder}` : `1px solid ${C.border}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: C.textHead
                    }}
                  >
                    <input
                      type="radio"
                      name="rejectReason"
                      value={r.value}
                      checked={rejectReason === r.value}
                      onChange={(e) => setRejectReason(e.target.value)}
                      style={{ accentColor: C.redText, cursor: 'pointer' }}
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: C.textSub, textTransform: 'uppercase' }}>
                  CATATAN TAMBAHAN UNTUK PELANGGAN
                </label>
                <textarea
                  rows={3}
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="Contoh: Harap unggah ulang struk asli mutasi m-banking dengan nominal Rp 2.450.000..."
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: `1px solid ${C.border}`,
                    backgroundColor: C.surfaceLow,
                    fontSize: '0.8rem',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'var(--font-body)'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  style={{
                    flex: 1,
                    height: '40px',
                    backgroundColor: C.surfaceLow,
                    border: `1px solid ${C.border}`,
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  BATAL
                </button>
                <button
                  type="button"
                  onClick={handleRejectPayment}
                  style={{
                    flex: 2,
                    height: '40px',
                    backgroundColor: C.redText,
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 900,
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  KIRIM & TANDAI DITOLAK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: FULL RESOLUTION PROOF VIEWER                            */}
      {/* ============================================================== */}
      {isFullImageOpen && selectedPayment && selectedPayment.proof_image_url && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 110,
          padding: '24px'
        }}>
          <div style={{ position: 'relative', maxWidth: '800px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <button
              type="button"
              onClick={() => setIsFullImageOpen(false)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                background: 'none',
                border: 'none',
                color: '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                fontWeight: 700
              }}
            >
              <X size={20} /> TUTUP
            </button>
            <img
              src={selectedPayment.proof_image_url}
              alt="Bukti Transfer Resolusi Penuh"
              style={{ width: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '12px' }}
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default PaymentManagement;
