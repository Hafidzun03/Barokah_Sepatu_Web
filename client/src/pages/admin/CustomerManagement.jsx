import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase, isSupabaseConfigured, getAdminClient } from '../../lib/supabase';
import { formatIDR, formatDate } from '../../lib/utils';
import {
  Users,
  Search,
  Download,
  TrendingUp,
  RotateCw,
  Eye,
  Receipt,
  X,
  MapPin,
  Calendar,
  Shield,
  Loader2,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  UserCheck,
  MessageCircle,
  Mail,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ===================================================================
   DIREKTORI PELANGGAN & PENGGUNA — REAL SUPABASE DATABASE
   Clean CRM without broadcast and without VIP tiers.
   Aesthetic: Executive Streetwear light palette with high-contrast atelier styling.
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

/**
 * Format raw Supabase profile + joined orders + addresses into CRM Customer Model
 */
const formatCustomerRecord = (p) => {
  const orders = Array.isArray(p.orders) ? p.orders : [];
  
  // Calculate completed orders & real LTV
  const completedOrders = orders.filter(
    o => o.payment_status === 'lunas' || o.order_status === 'selesai' || o.order_status === 'dikirim' || o.order_status === 'diproses'
  );
  const ltvAmount = completedOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  // Extract shoe sizes across all ordered items
  const allSizes = orders.flatMap(o => (o.order_items || []).map(i => i.size)).filter(Boolean);
  let favSize = 'EU 42';
  if (allSizes.length > 0) {
    const freq = {};
    allSizes.forEach(s => { freq[s] = (freq[s] || 0) + 1; });
    favSize = Object.keys(freq).reduce((a, b) => freq[a] > freq[b] ? a : b);
  }

  // Determine primary address
  let primaryAddress = 'Belum ada alamat tersimpan';
  if (Array.isArray(p.addresses) && p.addresses.length > 0) {
    const addr = p.addresses[0];
    const parts = [
      addr.address_line1 || addr.address || addr.detail_alamat,
      addr.city || addr.kota,
      addr.province || addr.provinsi,
      addr.postal_code || addr.kode_pos
    ].filter(Boolean);
    if (parts.length > 0) primaryAddress = parts.join(', ');
  } else if (orders.length > 0 && orders[0].shipping_address) {
    const parts = [
      orders[0].shipping_address,
      orders[0].shipping_city,
      orders[0].shipping_province,
      orders[0].shipping_postal_code
    ].filter(Boolean);
    if (parts.length > 0) primaryAddress = parts.join(', ');
  }

  // Primary phone
  const phone = p.phone || p.phone_number || (orders.length > 0 ? orders[0].recipient_phone : null) || '-';

  // Role
  const isAdmin = p.role === 'admin';
  const roleLabel = isAdmin ? 'ADMIN' : 'PELANGGAN';

  // Preferences from actual ordered products
  const itemNames = orders.flatMap(o => (o.order_items || []).map(i => i.product_name)).filter(Boolean);
  const preferences = itemNames.length > 0 
    ? Array.from(new Set(itemNames)).slice(0, 4)
    : ['Streetwear Performance', 'Sneakers', 'Footwear'];

  // Formatted orders history
  const recentOrders = orders.map(o => {
    const items = o.order_items || [];
    let productTitle = 'Pesanan Sepatu Barokah';
    if (items.length > 0) {
      productTitle = items[0].product_name + (items.length > 1 ? ` (+${items.length - 1} item lain)` : '');
    }
    return {
      id: o.id,
      order_number: o.order_number || o.id.slice(0, 8).toUpperCase(),
      product: productTitle,
      total: Number(o.total) || 0,
      date: formatDate(o.created_at),
      created_at: o.created_at,
      status: o.order_status || o.payment_status || 'Diproses'
    };
  });

  return {
    id: `usr_${p.id.slice(0, 8)}`,
    uuid: p.id,
    name: p.name || p.full_name || p.email?.split('@')[0] || 'Pengguna Terdaftar',
    email: p.email || '-',
    phone: phone,
    joined_date: formatDate(p.created_at),
    created_at: p.created_at,
    role: p.role || 'customer',
    role_label: roleLabel,
    status: p.is_active !== false ? 'aktif' : 'nonaktif',
    ltv_amount: ltvAmount,
    completed_orders_count: completedOrders.length,
    total_orders_count: orders.length,
    fav_size: favSize.startsWith('EU') ? favSize : `EU ${favSize}`,
    avatar_url: p.avatar_url || '',
    whatsapp_status: phone && phone !== '-' ? 'Terhubung' : 'Belum Terhubung',
    shipping_address: primaryAddress,
    preferences: preferences,
    recent_orders: recentOrders,
    raw_orders: orders
  };
};

export const CustomerManagement = ({ onNavigateBack }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSegment, setActiveSegment] = useState('all'); // 'all' | 'buyers' | 'new'
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isOrderHistoryModalOpen, setIsOrderHistoryModalOpen] = useState(false);
  const [togglingStatusId, setTogglingStatusId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Fetch real profiles from Supabase with joined addresses and orders
  const fetchProfiles = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const client = (await getAdminClient()) || supabase;
      const { data, error } = await client
        .from('profiles')
        .select('*, addresses(*), orders(*, order_items(*))')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching Supabase profiles:', error);
        toast.error('Gagal mengambil data pelanggan: ' + error.message);
      } else if (data) {
        const formatted = data.map(formatCustomerRecord);
        setCustomers(formatted);
        if (formatted.length > 0) {
          setSelectedCustomer(prev => {
            if (!prev) return formatted[0];
            return formatted.find(c => c.uuid === prev.uuid) || formatted[0];
          });
        }
        if (isManual) {
          toast.success(`Berhasil menyinkronkan ${formatted.length} akun terdaftar dari Supabase!`);
        }
      }
    } catch (err) {
      console.error('Fetch profiles exception:', err);
      toast.error('Terjadi kesalahan koneksi Supabase');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // Dynamic Metrics derived directly from real database records
  const metrics = useMemo(() => {
    const total = customers.length;
    const now = new Date();
    const thisMonth = customers.filter(c => {
      if (!c.created_at) return false;
      const d = new Date(c.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const activeCount = customers.filter(c => c.status === 'aktif').length;
    const activePct = total > 0 ? Math.round((activeCount / total) * 100) : 100;

    const buyersCount = customers.filter(c => c.completed_orders_count > 0).length;
    const newCount = total - buyersCount;

    const repeatCustomers = customers.filter(c => c.completed_orders_count > 1);
    const repeatRate = total > 0 ? ((repeatCustomers.length / total) * 100).toFixed(1) : '0';
    const totalCompletedOrders = customers.reduce((sum, c) => sum + c.completed_orders_count, 0);
    const avgPairs = total > 0 ? (totalCompletedOrders / total).toFixed(1) : '0';

    const dynamicTarget = Math.max(10, Math.ceil(total / 10) * 10);
    const targetPct = dynamicTarget > 0 ? Math.min(100, Math.round((total / dynamicTarget) * 100)) : 100;

    return {
      total,
      thisMonth,
      activeCount,
      activePct,
      buyersCount,
      newCount,
      repeatRate,
      avgPairs,
      dynamicTarget,
      targetPct
    };
  }, [customers]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      // Segment filter
      if (activeSegment === 'buyers' && c.completed_orders_count === 0) return false;
      if (activeSegment === 'new' && c.completed_orders_count > 0) return false;

      // Status filter
      if (statusFilter && c.status !== statusFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (c.name || '').toLowerCase();
        const email = (c.email || '').toLowerCase();
        const phone = (c.phone || '').toLowerCase();
        const uid = (c.id || '').toLowerCase();
        if (!name.includes(q) && !email.includes(q) && !phone.includes(q) && !uid.includes(q)) return false;
      }

      return true;
    });
  }, [customers, activeSegment, statusFilter, searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeSegment, statusFilter, searchQuery]);

  // Paginated customers
  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

  // Toggle account active status in Supabase
  const handleToggleStatus = async (customer, e) => {
    if (e) e.stopPropagation();
    const newStatus = customer.status === 'aktif' ? 'nonaktif' : 'aktif';
    const newIsActive = newStatus === 'aktif';
    setTogglingStatusId(customer.uuid);

    try {
      const client = (await getAdminClient()) || supabase;
      const { error } = await client
        .from('profiles')
        .update({ is_active: newIsActive })
        .eq('id', customer.uuid);

      if (error) throw error;

      setCustomers(prev => prev.map(c => (c.uuid === customer.uuid ? { ...c, status: newStatus } : c)));
      if (selectedCustomer?.uuid === customer.uuid) {
        setSelectedCustomer(prev => ({ ...prev, status: newStatus }));
      }
      toast.success(`Status akun ${customer.name} berhasil diubah ke ${newStatus.toUpperCase()}`);
    } catch (err) {
      console.error('Toggle status error:', err);
      toast.error('Gagal memperbarui status akun: ' + (err.message || 'Error'));
    } finally {
      setTogglingStatusId(null);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredCustomers.length === 0) {
      toast.error('Tidak ada data pelanggan untuk diekspor');
      return;
    }
    const headers = ['ID', 'Nama', 'Email', 'Telepon', 'Peran', 'Status', 'LTV (IDR)', 'Jumlah Order', 'Size Favorit', 'Bergabung'];
    const rows = filteredCustomers.map(c => [
      c.id,
      `"${c.name}"`,
      c.email,
      `'${c.phone}`,
      c.role_label,
      c.status.toUpperCase(),
      c.ltv_amount,
      c.completed_orders_count,
      c.fav_size,
      c.joined_date
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Barokah_Pelanggan_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${filteredCustomers.length} data pelanggan berhasil diekspor ke CSV!`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', minWidth: 0 }}>

      {/* ============================================================== */}
      {/* 1. TOP BAR / BREADCRUMB & ACTIONS                               */}
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
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Admin
            </span>
            <span style={{ fontSize: '0.68rem', color: C.borderDark }}>/</span>
            <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Pengguna
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
              Pelanggan
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
              Direktori Pelanggan
            </h1>
            <span style={{
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              color: C.emeraldText,
              fontWeight: 700,
              backgroundColor: C.emeraldLight,
              padding: '3px 8px',
              borderRadius: '4px',
              border: `1px solid ${C.emeraldBorder}`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <CheckCircle2 size={12} /> SUPABASE: {customers.length} Akun Terdaftar
            </span>
          </div>

          <p style={{ fontSize: '0.84rem', color: C.textMuted, margin: 0, maxWidth: '640px' }}>
            Manajemen profil pelanggan real dari database Supabase, data kontak, metrik transaksi akumulatif, dan riwayat pesanan aktif.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => fetchProfiles(true)}
            disabled={refreshing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
              backgroundColor: C.card,
              color: C.textMain,
              border: `1px solid ${C.borderDark}`,
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: C.shadowSm
            }}
            title="Sinkronisasi Ulang Database"
          >
            <RotateCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Menyinkron...' : 'Sinkronisasi'}
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              backgroundColor: C.card,
              color: C.textMain,
              border: `1px solid ${C.borderDark}`,
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: C.shadowSm
            }}
          >
            <Download size={16} /> Ekspor CSV
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. PRIMARY METRIC HIGHLIGHTS (DYNAMIC DATABASE CALCULATIONS)    */}
      {/* ============================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px'
      }}>
        {/* Stat 1: Total Registered */}
        <div style={{
          backgroundColor: C.card,
          padding: '24px',
          borderRadius: '16px',
          border: `1px solid ${C.border}`,
          boxShadow: C.shadowSm,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: C.textMuted, fontWeight: 700 }}>
              Total Terdaftar
            </span>
            <span style={{
              fontSize: '0.68rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              backgroundColor: C.emeraldLight,
              color: C.emeraldText,
              padding: '3px 8px',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <TrendingUp size={13} /> +{metrics.thisMonth} bln ini
            </span>
          </div>

          <div style={{ margin: '16px 0', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '2.4rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: C.textHead, lineHeight: 1 }}>
              {loading ? '...' : metrics.total}
            </span>
            <span style={{ fontSize: '0.8rem', color: C.textMuted, fontFamily: 'var(--font-mono)' }}>
              Akun Real
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ width: '100%', height: '6px', backgroundColor: C.surfaceHigh, borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{ width: `${metrics.targetPct}%`, height: '100%', backgroundColor: '#0F172A', borderRadius: '9999px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: C.textMuted }}>
              <span>Target Tahap Ini: {metrics.dynamicTarget}</span>
              <span>{metrics.targetPct}% Capai</span>
            </div>
          </div>
        </div>

        {/* Stat 2: Akun Aktif */}
        <div style={{
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: C.shadowMd,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          border: `1px solid #1E293B`,
          position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: C.neonLime, display: 'inline-block' }} />
              <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: C.neonLime, fontWeight: 800 }}>
                Status Pengguna
              </span>
            </div>
            <UserCheck size={18} style={{ color: C.neonLime }} />
          </div>

          <div style={{ margin: '16px 0', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '2.4rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: C.neonLime, lineHeight: 1 }}>
              {loading ? '...' : metrics.activeCount}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-mono)' }}>
              Akun Aktif
            </span>
          </div>

          <p style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.45 }}>
            {metrics.activePct}% dari akun terdaftar berstatus aktif dan dapat melakukan transaksi pemesanan sepatu.
          </p>
        </div>

        {/* Stat 3: Repeat Purchase Rate */}
        <div style={{
          backgroundColor: C.card,
          padding: '24px',
          borderRadius: '16px',
          border: `1px solid ${C.border}`,
          boxShadow: C.shadowSm,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: C.textMuted, fontWeight: 700 }}>
              Repeat Purchase Rate
            </span>
            <RotateCw size={16} style={{ color: C.textMuted }} />
          </div>

          <div style={{ margin: '16px 0', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '2.4rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: C.textHead, lineHeight: 1 }}>
              {loading ? '...' : `${metrics.repeatRate}%`}
            </span>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: C.emeraldText }}>
              Database Live
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '18px' }}>
              <div style={{ flex: 1, height: '40%', backgroundColor: C.surfaceHigh, borderRadius: '2px' }} />
              <div style={{ flex: 1, height: '60%', backgroundColor: C.surfaceHigh, borderRadius: '2px' }} />
              <div style={{ flex: 1, height: '50%', backgroundColor: C.surfaceHigh, borderRadius: '2px' }} />
              <div style={{ flex: 1, height: '80%', backgroundColor: C.surfaceHigh, borderRadius: '2px' }} />
              <div style={{ flex: 1, height: '100%', backgroundColor: C.neonLime, borderRadius: '2px' }} />
            </div>
            <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: C.textMuted }}>
              Rerata {metrics.avgPairs} transaksi per pelanggan loyal
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. FILTER & CONTROLS TOOLBAR                                   */}
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
        {/* Search Query Input */}
        <div style={{ position: 'relative', flex: 1, minWidth: '260px', maxWidth: '440px' }}>
          <Search size={16} style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: C.textMuted
          }} />
          <input
            type="text"
            placeholder="Cari nama pelanggan, email, nomor WhatsApp..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              height: '40px',
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

        {/* Segment & Status Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: C.surfaceLow,
            padding: '4px',
            borderRadius: '8px',
            gap: '4px'
          }}>
            {[
              { key: 'all', label: `Semua (${metrics.total})` },
              { key: 'buyers', label: `Pernah Belanja (${metrics.buyersCount})` },
              { key: 'new', label: `Belum Belanja (${metrics.newCount})` }
            ].map(seg => (
              <button
                key={seg.key}
                type="button"
                onClick={() => setActiveSegment(seg.key)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: activeSegment === seg.key ? 800 : 600,
                  backgroundColor: activeSegment === seg.key ? '#0F172A' : 'transparent',
                  color: activeSegment === seg.key ? C.neonLime : C.textSub,
                  cursor: 'pointer'
                }}
              >
                {seg.label}
              </button>
            ))}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              height: '40px',
              padding: '0 12px',
              backgroundColor: C.surfaceLow,
              border: `1px solid ${C.border}`,
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              color: C.textMain,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="">Status Akun: Semua</option>
            <option value="aktif">Status: Aktif</option>
            <option value="nonaktif">Status: Non-aktif</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setActiveSegment('all');
              setStatusFilter('');
              setSearchQuery('');
              toast.success('Filter direktori direset');
            }}
            title="Reset Filter"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: C.surfaceLow,
              border: `1px solid ${C.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: C.textMain
            }}
          >
            <RotateCw size={16} />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. CUSTOMER DIRECTORY MATRIX TABLE (REAL DATABASE RECORDS)     */}
      {/* ============================================================== */}
      <div style={{
        backgroundColor: C.card,
        borderRadius: '16px',
        border: `1px solid ${C.border}`,
        boxShadow: C.shadowSm,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
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
                <th style={{ padding: '14px 18px' }}>Pelanggan</th>
                <th style={{ padding: '14px 18px' }}>Kontak & Supabase UID</th>
                <th style={{ padding: '14px 18px' }}>Bergabung</th>
                <th style={{ padding: '14px 18px' }}>Peran / Role</th>
                <th style={{ padding: '14px 18px' }}>Status Akun</th>
                <th style={{ padding: '14px 18px' }}>Total Belanja (LTV)</th>
                <th style={{ padding: '14px 18px' }}>Size Fav</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: '48px 18px', textAlign: 'center', color: C.textMuted }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <Loader2 size={28} className="animate-spin" style={{ color: '#0F172A' }} />
                      <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
                        Memuat data pelanggan dari Supabase database...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : paginatedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '48px 18px', textAlign: 'center', color: C.textMuted }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Users size={32} style={{ color: C.borderDark }} />
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: C.textHead }}>
                        Tidak ada akun pelanggan yang cocok
                      </span>
                      <span style={{ fontSize: '0.78rem', color: C.textMuted }}>
                        Coba sesuaikan kata kunci pencarian atau filter status Anda.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map(customer => {
                  const isSelected = selectedCustomer && selectedCustomer.uuid === customer.uuid;
                  const isToggling = togglingStatusId === customer.uuid;
                  return (
                    <tr
                      key={customer.uuid}
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setIsDrawerOpen(true);
                      }}
                      style={{
                        borderBottom: `1px solid ${C.border}`,
                        backgroundColor: isSelected ? 'rgba(208, 241, 47, 0.08)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s'
                      }}
                    >
                      {/* Pelanggan */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            backgroundColor: '#0F172A',
                            color: C.neonLime,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.8rem',
                            fontFamily: 'var(--font-mono)',
                            flexShrink: 0
                          }}>
                            {customer.avatar_url ? (
                              <img src={customer.avatar_url} alt={customer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              customer.name.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 800, color: C.textHead }}>
                              {customer.name}
                            </span>
                            <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: C.textMuted }}>
                              ID: {customer.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Kontak */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ color: C.textHead, fontWeight: 500 }}>{customer.email}</span>
                          <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: C.textMuted }}>
                            {customer.phone}
                          </span>
                        </div>
                      </td>

                      {/* Bergabung */}
                      <td style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: C.textMuted }}>
                        {customer.joined_date}
                      </td>

                      {/* Peran / Role */}
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.68rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 800,
                          backgroundColor: customer.role === 'admin' ? '#0F172A' : C.surfaceHigh,
                          color: customer.role === 'admin' ? C.neonLime : C.textMain
                        }}>
                          {customer.role_label}
                        </span>
                      </td>

                      {/* Status Akun */}
                      <td style={{ padding: '14px 18px' }}>
                        <button
                          type="button"
                          onClick={(e) => handleToggleStatus(customer, e)}
                          disabled={isToggling}
                          title="Klik untuk ubah status akun"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 9px',
                            borderRadius: '9999px',
                            fontSize: '0.65rem',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 800,
                            border: `1px solid ${customer.status === 'aktif' ? C.emeraldBorder : C.redBorder}`,
                            backgroundColor: customer.status === 'aktif' ? C.emeraldLight : C.redBg,
                            color: customer.status === 'aktif' ? C.emeraldText : C.redText,
                            cursor: 'pointer'
                          }}
                        >
                          {isToggling ? (
                            <Loader2 size={11} className="animate-spin" />
                          ) : customer.status === 'aktif' ? (
                            <CheckCircle2 size={11} />
                          ) : (
                            <XCircle size={11} />
                          )}
                          {customer.status.toUpperCase()}
                        </button>
                      </td>

                      {/* LTV */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: C.textHead }}>
                            {formatIDR(customer.ltv_amount)}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: C.textMuted }}>
                            {customer.completed_orders_count} Transaksi
                          </span>
                        </div>
                      </td>

                      {/* Size Fav */}
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          padding: '3px 8px',
                          backgroundColor: C.surfaceLow,
                          borderRadius: '4px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 800,
                          fontSize: '0.72rem',
                          color: C.textMain
                        }}>
                          {customer.fav_size}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setIsDrawerOpen(true);
                            }}
                            title="Lihat Profil Detail"
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '6px',
                              backgroundColor: C.surfaceLow,
                              border: `1px solid ${C.border}`,
                              color: C.textMain,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setIsOrderHistoryModalOpen(true);
                            }}
                            title="Riwayat Transaksi"
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '6px',
                              backgroundColor: C.surfaceLow,
                              border: `1px solid ${C.border}`,
                              color: C.textMain,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <Receipt size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div style={{
          padding: '14px 18px',
          backgroundColor: C.surfaceLow,
          borderTop: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-mono)',
          color: C.textMuted
        }}>
          <span>
            Menampilkan {paginatedCustomers.length} dari {filteredCustomers.length} data pengguna (Total {customers.length} Akun Supabase)
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: `1px solid ${C.border}`,
                backgroundColor: C.card,
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage <= 1 ? 0.5 : 1
              }}
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(page => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  border: page === currentPage ? 'none' : `1px solid ${C.border}`,
                  backgroundColor: page === currentPage ? '#0F172A' : C.card,
                  color: page === currentPage ? C.neonLime : C.textMain,
                  fontWeight: page === currentPage ? 900 : 500,
                  cursor: 'pointer'
                }}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: `1px solid ${C.border}`,
                backgroundColor: C.card,
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage >= totalPages ? 0.5 : 1
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 5. DETAIL PELANGGAN DRAWER (SLIDE-OVER PANEL)                   */}
      {/* ============================================================== */}
      {isDrawerOpen && selectedCustomer && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          {/* Backdrop */}
          <div
            onClick={() => setIsDrawerOpen(false)}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.5)',
              backdropFilter: 'blur(4px)'
            }}
          />

          {/* Drawer Surface */}
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '620px',
            height: '100%',
            backgroundColor: C.card,
            boxShadow: C.shadowXl,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 110,
            overflowY: 'auto'
          }}>
            {/* Header */}
            <div style={{
              padding: '18px 24px',
              backgroundColor: C.card,
              borderBottom: `1px solid ${C.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 800,
                  backgroundColor: C.emeraldLight,
                  color: C.emeraldText,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  textTransform: 'uppercase'
                }}>
                  DETAIL PELANGGAN
                </span>
                <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: C.textMuted }}>
                  Supabase Auth Real
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: C.surfaceLow,
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: C.textMain
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
              
              {/* Profile Identity Card */}
              <div style={{
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                borderRadius: '16px',
                padding: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                border: `1px solid #1E293B`,
                boxShadow: C.shadowMd
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    backgroundColor: '#1E293B',
                    border: `2px solid ${C.neonLime}`,
                    flexShrink: 0
                  }}>
                    {selectedCustomer.avatar_url ? (
                      <img src={selectedCustomer.avatar_url} alt={selectedCustomer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.neonLime, fontWeight: 900, fontSize: '1.2rem', fontFamily: 'var(--font-mono)' }}>
                        {selectedCustomer.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: '0 0 2px', color: '#FFFFFF' }}>
                      {selectedCustomer.name}
                    </h3>
                    <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: C.neonLime }}>
                      {selectedCustomer.role_label}
                    </span>
                    <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
                      UUID: {selectedCustomer.uuid}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.6)' }}>
                    Total Pembelanjaan (LTV)
                  </span>
                  <span style={{ fontSize: '1.35rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: C.neonLime }}>
                    {formatIDR(selectedCustomer.ltv_amount)}
                  </span>
                  <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.8)' }}>
                    {selectedCustomer.completed_orders_count} Transaksi Selesai
                  </span>
                </div>
              </div>

              {/* 4 Metric Badges */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
                <div style={{ padding: '12px', backgroundColor: C.surfaceLow, borderRadius: '10px', border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: C.textMuted, textTransform: 'uppercase', display: 'block' }}>
                    Ukuran Sepatu
                  </span>
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: C.textHead, marginTop: '2px', display: 'block' }}>
                    {selectedCustomer.fav_size}
                  </span>
                </div>
                <div style={{ padding: '12px', backgroundColor: C.surfaceLow, borderRadius: '10px', border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: C.textMuted, textTransform: 'uppercase', display: 'block' }}>
                    Total Pesanan
                  </span>
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: C.textHead, marginTop: '2px', display: 'block' }}>
                    {selectedCustomer.total_orders_count} Pesanan Masuk
                  </span>
                </div>
                <div style={{ padding: '12px', backgroundColor: C.surfaceLow, borderRadius: '10px', border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: C.textMuted, textTransform: 'uppercase', display: 'block' }}>
                    WhatsApp Kontak
                  </span>
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: C.textHead, marginTop: '2px', display: 'block' }}>
                    {selectedCustomer.whatsapp_status}
                  </span>
                </div>
                <div style={{ padding: '12px', backgroundColor: C.surfaceLow, borderRadius: '10px', border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: C.textMuted, textTransform: 'uppercase', display: 'block' }}>
                    Bergabung
                  </span>
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: C.textHead, marginTop: '2px', display: 'block' }}>
                    {selectedCustomer.joined_date}
                  </span>
                </div>
              </div>

              {/* Preferences */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: C.textSub, textTransform: 'uppercase' }}>
                  Preferensi Produk Terbeli
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedCustomer.preferences?.map((pref, i) => (
                    <span
                      key={i}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#0F172A',
                        color: C.neonLime,
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700
                      }}
                    >
                      {pref}
                    </span>
                  ))}
                </div>
              </div>

              {/* Address */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: C.textSub, textTransform: 'uppercase' }}>
                  Alamat Pengiriman Utama
                </span>
                <div style={{ padding: '14px', backgroundColor: C.surfaceLow, borderRadius: '10px', border: `1px solid ${C.border}`, display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <MapPin size={18} style={{ color: C.textMuted, flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: C.textHead }}>
                      {selectedCustomer.shipping_address}
                    </span>
                    <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: C.textMuted, marginTop: '2px' }}>
                      Penerima: {selectedCustomer.name} ({selectedCustomer.phone})
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Orders inside Drawer */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: C.textSub, textTransform: 'uppercase' }}>
                    Riwayat Transaksi Terakhir ({selectedCustomer.recent_orders?.length || 0})
                  </span>
                  {selectedCustomer.recent_orders?.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsOrderHistoryModalOpen(true)}
                      style={{ background: 'none', border: 'none', color: C.blue, fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Lihat Semua →
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {!selectedCustomer.recent_orders || selectedCustomer.recent_orders.length === 0 ? (
                    <div style={{ padding: '16px', backgroundColor: C.surfaceLow, borderRadius: '8px', textAlign: 'center', color: C.textMuted, fontSize: '0.78rem' }}>
                      Belum ada pesanan yang tercatat untuk akun ini.
                    </div>
                  ) : (
                    selectedCustomer.recent_orders.slice(0, 4).map((ord, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '12px 14px',
                          backgroundColor: C.surfaceLow,
                          borderRadius: '8px',
                          border: `1px solid ${C.border}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.8rem', color: C.textHead }}>
                            #{ord.order_number} • {ord.product}
                          </span>
                          <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: C.textMuted }}>
                            {ord.date}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', fontSize: '0.84rem', color: C.textHead }}>
                            {formatIDR(ord.total)}
                          </span>
                          <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: C.emeraldText }}>
                            {ord.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Action Button: Toggle Active/Nonactive */}
              <div style={{ display: 'flex', gap: '10px', paddingTop: '10px', borderTop: `1px solid ${C.border}` }}>
                {selectedCustomer.phone && selectedCustomer.phone !== '-' && (
                  <a
                    href={`https://wa.me/${selectedCustomer.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      flex: 1,
                      height: '42px',
                      backgroundColor: C.surfaceLow,
                      color: C.textMain,
                      border: `1px solid ${C.border}`,
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      textDecoration: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <MessageCircle size={15} style={{ color: C.emerald }} /> WhatsApp
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => handleToggleStatus(selectedCustomer)}
                  style={{
                    flex: 1,
                    height: '42px',
                    backgroundColor: selectedCustomer.status === 'aktif' ? C.redBg : C.emeraldLight,
                    color: selectedCustomer.status === 'aktif' ? C.redText : C.emeraldText,
                    border: `1px solid ${selectedCustomer.status === 'aktif' ? C.redBorder : C.emeraldBorder}`,
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  {selectedCustomer.status === 'aktif' ? (
                    <>
                      <XCircle size={15} /> Non-aktifkan Akun
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} /> Aktifkan Akun
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: RIWAYAT PESANAN LENGKAP PELANGGAN                       */}
      {/* ============================================================== */}
      {isOrderHistoryModalOpen && selectedCustomer && (
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
            maxWidth: '560px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: C.shadowXl,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '18px 20px',
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: `2px solid ${C.neonLime}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag size={18} style={{ color: C.neonLime }} />
                <h3 style={{ fontSize: '0.94rem', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>
                  Riwayat Transaksi: {selectedCustomer.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOrderHistoryModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '360px', overflowY: 'auto' }}>
                {!selectedCustomer.recent_orders || selectedCustomer.recent_orders.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: C.textMuted, fontSize: '0.84rem' }}>
                    Pelanggan ini belum memiliki riwayat transaksi di toko.
                  </div>
                ) : (
                  selectedCustomer.recent_orders.map((ord, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '14px',
                        backgroundColor: C.surfaceLow,
                        borderRadius: '8px',
                        border: `1px solid ${C.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.84rem', color: C.textHead }}>
                          #{ord.order_number}
                        </span>
                        <span style={{ fontSize: '0.74rem', color: C.textSub }}>
                          {ord.product}
                        </span>
                        <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: C.textMuted }}>
                          {ord.date}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ fontWeight: 900, fontFamily: 'var(--font-mono)', fontSize: '0.92rem', color: C.textHead }}>
                          {formatIDR(ord.total)}
                        </span>
                        <span style={{
                          fontSize: '0.68rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 800,
                          color: ord.status.toLowerCase() === 'selesai' || ord.status.toLowerCase() === 'lunas' ? C.emeraldText : C.amberText
                        }}>
                          {ord.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsOrderHistoryModalOpen(false)}
                style={{
                  height: '40px',
                  backgroundColor: C.surfaceLow,
                  border: `1px solid ${C.border}`,
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                TUTUP
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerManagement;
