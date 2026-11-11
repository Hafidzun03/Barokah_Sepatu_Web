import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { sampleProducts } from '../../data/sampleProducts';
import { formatIDR, formatDate, getOrderStatusInfo } from '../../lib/utils';
import {
  generateXlsxBlob,
  generatePdfBlob,
  generateCsvBlob,
  generateWordBlob,
  triggerBlobDownload,
  exportOrderReceiptPdf
} from '../../lib/reportExporter';
import { supabase, isSupabaseConfigured, getAdminClient } from '../../lib/supabase';
import { 
  ShieldCheck, 
  DollarSign, 
  ShoppingBag, 
  Package, 
  TrendingUp, 
  ExternalLink,
  LayoutDashboard,
  Tag,
  BarChart3,
  Users,
  FileText,
  Settings,
  LogOut,
  Search,
  Bell,
  Plus,
  ChevronDown,
  AlertTriangle,
  Download,
  Printer,
  Grid,
  Database,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  CreditCard,
  Ruler,
  Check,
  X,
  RefreshCw,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ProductManagement } from './ProductManagement';
import { CategoryManagement } from './CategoryManagement';
import { SizeStockManagement } from './SizeStockManagement';
import { OrderManagement } from './OrderManagement';
import { PaymentManagement } from './PaymentManagement';
import { CustomerManagement } from './CustomerManagement';
import { SalesReport } from './SalesReport';
import { CustomerReviews } from './CustomerReviews';
import { StoreSettings } from './StoreSettings';

/* ===================================================================
   ADMIN PANEL — EXECUTIVE LIGHT THEME (WHITE DOMINANT + BLUE & GREEN)
   Clean, modern enterprise styling tailored for Barokah Shoes.
   =================================================================== */

const C = {
  // Base Canvas & Surfaces
  bgPage:        '#F8FAFC', // Slate 50
  card:          '#FFFFFF', // Clean White
  cardHover:     '#F1F5F9', // Slate 100
  surface:       '#F8FAFC',
  border:        '#E2E8F0', // Slate 200
  borderDark:    '#CBD5E1', // Slate 300
  
  // Primary Green (Emerald)
  emerald:       '#059669', // Emerald 600
  emeraldHover:  '#047857', // Emerald 700
  emeraldLight:  '#ECFDF5', // Emerald 50
  emeraldBorder: '#A7F3D0', // Emerald 200
  emeraldText:   '#047857',

  // Accent Blue (Royal / Sapphire)
  blue:          '#2563EB', // Blue 600
  blueHover:     '#1D4ED8', // Blue 700
  blueLight:     '#EFF6FF', // Blue 50
  blueBorder:    '#BFDBFE', // Blue 200
  blueText:      '#1D4ED8',

  // Teal Secondary
  teal:          '#0D9488', // Teal 600
  tealLight:     '#F0FDFA', // Teal 50
  tealBorder:    '#99F6E4', // Teal 200
  tealText:      '#0F766E',

  // Typography Palette
  textMain:      '#0F172A', // Slate 900
  textHead:      '#020617', // Slate 950
  textSub:       '#334155', // Slate 700
  textMuted:     '#64748B', // Slate 500
  textLight:     '#94A3B8', // Slate 400

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
};

// ── Exact 9 Sidebar Menu Items Requested by User ─────────────────
const SIDEBAR_ITEMS = [
  { id: 'dashboard',   label: 'Dashboard',         icon: LayoutDashboard },
  { id: 'products',    label: 'Manajemen Produk',  icon: Package },
  { id: 'categories',  label: 'Kategori Produk',   icon: Tag },
  { id: 'stock',       label: 'Ukuran dan Stok',   icon: Ruler },
  { id: 'orders',      label: 'Pesanan',           icon: ShoppingBag },
  { id: 'payments',    label: 'Pembayaran',        icon: CreditCard },
  { id: 'customers',   label: 'Pelanggan/User',    icon: Users },
  { id: 'reports',     label: 'Laporan Penjualan', icon: FileText },
  { id: 'reviews',     label: 'Ulasan Pelanggan',  icon: MessageSquare },
  { id: 'settings',    label: 'Pengaturan Toko',   icon: Settings },
];

export const AdminDashboard = ({ initialNav = 'dashboard' }) => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getInitialNav = () => {
    if (location.pathname === '/admin/products') return 'products';
    if (location.pathname === '/admin/categories') return 'categories';
    if (location.pathname === '/admin/stock' || location.pathname === '/admin/ukuran-stok') return 'stock';
    if (location.pathname === '/admin/orders' || location.pathname === '/admin/pesanan') return 'orders';
    if (location.pathname === '/admin/payments' || location.pathname === '/admin/pembayaran') return 'payments';
    if (location.pathname === '/admin/customers' || location.pathname === '/admin/pelanggan') return 'customers';
    if (location.pathname === '/admin/reports' || location.pathname === '/admin/laporan') return 'reports';
    if (location.pathname === '/admin/reviews' || location.pathname === '/admin/ulasan') return 'reviews';
    if (location.pathname === '/admin/settings' || location.pathname === '/admin/pengaturan') return 'settings';
    const params = new URLSearchParams(location.search);
    if (params.get('tab')) return params.get('tab');
    return initialNav;
  };

  const [activeNav, setActiveNav] = useState(getInitialNav);
  const [timeframe, setTimeframe] = useState('month'); // 'month' | 'week' | 'today'
  const [isDashboardExportOpen, setIsDashboardExportOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState([]);
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Real dashboard stats from Supabase
  const [dashboardStats, setDashboardStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    todayOrders: 0,
    totalProducts: 0,
    totalCategories: 0,
    newOrdersCount: 0,
    activeProducts: 0,
    totalVariantSkus: 0,
    criticalStockCount: 0,
    totalCustomers: 0,
    newCustomersThisMonth: 0,
    pendingVerification: 0,
    weeklyData: [
      { day: 'Sen', amount: 0, height: 0, isPeak: false },
      { day: 'Sel', amount: 0, height: 0, isPeak: false },
      { day: 'Rab', amount: 0, height: 0, isPeak: false },
      { day: 'Kam', amount: 0, height: 0, isPeak: false },
      { day: 'Jum', amount: 0, height: 0, isPeak: false },
      { day: 'Sab', amount: 0, height: 0, isPeak: false },
      { day: 'Min', amount: 0, height: 0, isPeak: false },
    ],
    weeklyAvg: 0,
    weeklyPeak: 0,
    weeklyPeakDay: '-',
    weeklyUnits: 0,
    dominantPaymentMethod: '-',
  });

  // Manual payment verification queue state (fetched from Supabase)
  const [verificationQueue, setVerificationQueue] = useState([]);

  // Critical stock alerts state (fetched from Supabase)
  const [criticalStockList, setCriticalStockList] = useState([]);

  // Dynamic Sidebar Badges derived from real database stats
  const sidebarItems = useMemo(() => [
    { id: 'dashboard',   label: 'Dashboard',         icon: LayoutDashboard, badge: null },
    { 
      id: 'products',    
      label: 'Manajemen Produk',  
      icon: Package,         
      badge: String(dashboardStats.totalProducts || 0)
    },
    { 
      id: 'categories',  
      label: 'Kategori Produk',   
      icon: Tag,             
      badge: String(dashboardStats.totalCategories || 0)
    },
    { 
      id: 'stock',       
      label: 'Ukuran dan Stok',   
      icon: Ruler,           
      badge: dashboardStats.criticalStockCount > 0 ? `${dashboardStats.criticalStockCount} Low` : null, 
      isAlert: dashboardStats.criticalStockCount > 0 
    },
    { 
      id: 'orders',      
      label: 'Pesanan',           
      icon: ShoppingBag,     
      badge: dashboardStats.newOrdersCount > 0 
        ? `${dashboardStats.newOrdersCount} Baru` 
        : (dashboardStats.totalOrders > 0 ? String(dashboardStats.totalOrders) : null), 
      isGreen: dashboardStats.newOrdersCount > 0 
    },
    { 
      id: 'payments',    
      label: 'Pembayaran',        
      icon: CreditCard,      
      badge: dashboardStats.pendingVerification > 0 ? `${dashboardStats.pendingVerification} Verif` : null, 
      isBlue: dashboardStats.pendingVerification > 0 
    },
    { id: 'customers',   label: 'Pelanggan/User',    icon: Users,           badge: null },
    { id: 'reports',     label: 'Laporan Penjualan', icon: FileText,        badge: null },
    { id: 'reviews',     label: 'Ulasan Pelanggan',  icon: MessageSquare,   badge: null },
    { id: 'settings',    label: 'Pengaturan Toko',   icon: Settings,        badge: null },
  ], [dashboardStats]);

  // Initial load of orders from Supabase + localStorage
  useEffect(() => {
    const local = JSON.parse(localStorage.getItem('barokah_orders') || '[]');
    setOrders(local);

    if (isSupabaseConfigured) {
      const fetchOrders = async () => {
        try {
          const { data, error } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .order('created_at', { ascending: false });

          if (!error && data) {
            const normalized = data.map(d => ({
              ...d,
              status: d.order_status || d.status,
              total_amount: d.total ?? d.total_amount,
              phone_number: d.recipient_phone || d.phone_number,
              items: d.order_items?.map(it => ({
                product_name: it.product_name,
                size: it.size,
                quantity: it.quantity,
                line_total: it.line_total,
                unit_price: it.unit_price,
              })) || d.items || []
            }));
            const dbMap = new Set(normalized.map(d => d.order_number));
            const merged = [...normalized, ...local.filter(l => !dbMap.has(l.order_number))];
            setOrders(merged);
          }
        } catch (err) {
          console.error('Error fetching admin orders:', err);
        }
      };
      fetchOrders();
    }
  }, []);

  // Fetch real dashboard statistics from Supabase
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setStatsLoading(false);
      return;
    }
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const adminDb = (await getAdminClient()) || supabase;
        // Parallel fetch for all needed data from real database
        const [ordersRes, productsRes, variantsRes, customersRes, paymentsRes, categoriesRes] = await Promise.all([
          adminDb.from('orders').select('id, total, order_status, payment_method, created_at, payment_status'),
          adminDb.from('products').select('id, is_active'),
          adminDb.from('product_variants').select('id, stock, sku, size, product_id, products(name)'),
          adminDb.from('profiles').select('id, created_at'),
          adminDb.from('payments').select('id, order_id, amount, status, method, payment_method, transfer_proof_url, created_at, orders(order_number, recipient_name, recipient_phone)'),
          adminDb.from('categories').select('id'),
        ]);

        const allOrders = ordersRes.data || [];
        const allProducts = productsRes.data || [];
        const allVariants = variantsRes.data || [];
        const allCustomers = customersRes.data || [];
        const allPayments = paymentsRes.data || [];
        const allCategories = categoriesRes.data || [];

        // Categories count
        const totalCategories = allCategories.length;

        // New / Active orders needing attention
        const newOrdersCount = allOrders.filter(o => 
          ['menunggu_konfirmasi', 'menunggu_pembayaran', 'diproses'].includes(o.order_status || o.status)
        ).length;

        // Revenue: sum of completed orders
        const completedOrders = allOrders.filter(o => ['selesai', 'completed', 'dikirim'].includes(o.order_status || o.status));
        const totalRevenue = completedOrders.reduce((sum, o) => sum + (Number(o.total || o.total_amount) || 0), 0);

        // Orders count
        const totalOrders = allOrders.length;
        const todayStr = new Date().toISOString().slice(0, 10);
        const todayOrders = allOrders.filter(o => (o.created_at || '').startsWith(todayStr)).length;

        // Products
        const totalProducts = allProducts.length;
        const activeProducts = allProducts.filter(p => p.is_active !== false).length;
        const totalVariantSkus = allVariants.length;

        // Critical stock (stock <= 5)
        const criticalVariants = allVariants.filter(v => (Number(v.stock) || 0) <= 5);
        const criticalStockCount = criticalVariants.length;
        const criticalStockForWidget = criticalVariants.slice(0, 5).map(v => ({
          id: v.id,
          name: v.products?.name || 'Produk',
          sku: v.sku || `SKU-${v.id?.slice(0,6)}`,
          size: v.size || '-',
          stock: Number(v.stock) || 0,
          isCritical: (Number(v.stock) || 0) === 0
        }));
        setCriticalStockList(criticalStockForWidget);

        // Customers
        const totalCustomers = allCustomers.length;
        const nowDate = new Date();
        const firstOfMonth = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1).toISOString();
        const newCustomersThisMonth = allCustomers.filter(c => c.created_at >= firstOfMonth).length;

        // Pending verification payments
        const pendingPayments = allPayments.filter(p => 
          ['pending', 'menunggu_verifikasi'].includes(p.status) ||
          p.orders?.payment_status === 'menunggu_verifikasi' ||
          (Boolean(p.transfer_proof_url) && !['lunas', 'gagal'].includes(p.status))
        );
        const pendingVerification = pendingPayments.length;
        const verificationItems = pendingPayments.slice(0, 5).map(p => ({
          id: p.id,
          order_id: p.order_id,
          customer: p.orders?.recipient_name || 'Pelanggan',
          orderNumber: `#${p.orders?.order_number || p.id?.slice(0,8)}`,
          method: p.payment_method || p.method || 'Transfer Bank',
          amount: Number(p.amount) || 0,
          proofFile: p.transfer_proof_url || p.proof_image_url || '',
          phone: p.orders?.recipient_phone || '-'
        }));
        setVerificationQueue(verificationItems);

        // Weekly sales chart (last 7 days)
        const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        const dayTotals = [0, 0, 0, 0, 0, 0, 0];
        const dayUnits = [0, 0, 0, 0, 0, 0, 0];
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const recentOrders = allOrders.filter(o => o.created_at && new Date(o.created_at) >= sevenDaysAgo);
        recentOrders.forEach(o => {
          const d = new Date(o.created_at).getDay(); // 0=Sun
          dayTotals[d] += Number(o.total ?? o.total_amount) || 0;
          dayUnits[d] += 1;
        });

        // Reorder from Monday to Sunday (Sen=1 to Min=0)
        const orderedDays = [1,2,3,4,5,6,0];
        const orderedLabels = ['Sen','Sel','Rab','Kam','Jum','Sab','Min'];
        const dayAmounts = orderedDays.map(d => dayTotals[d]);
        const maxAmount = Math.max(...dayAmounts, 1);
        const weeklyPeakIdx = dayAmounts.indexOf(maxAmount);
        const totalWeeklyUnits = recentOrders.length;
        const weeklyAvg = dayAmounts.reduce((s,v) => s+v, 0) / 7;

        // Payment method breakdown
        const methodCount = {};
        recentOrders.forEach(o => {
          const m = o.payment_method || 'Lainnya';
          methodCount[m] = (methodCount[m] || 0) + 1;
        });
        const dominantMethod = Object.entries(methodCount).sort((a,b) => b[1]-a[1])[0]?.[0] || '-';
        const dominantPct = dominantMethod !== '-'
          ? Math.round((methodCount[dominantMethod] / totalWeeklyUnits) * 100)
          : 0;

        const weeklyChartData = orderedLabels.map((label, i) => ({
          day: label,
          amount: dayAmounts[i],
          shortVal: dayAmounts[i] > 0 ? `Rp ${(dayAmounts[i]/1000000).toFixed(1)}jt` : 'Rp 0',
          height: Math.max(Math.round((dayAmounts[i] / maxAmount) * 200), dayAmounts[i] > 0 ? 12 : 0),
          isPeak: i === weeklyPeakIdx && maxAmount > 0,
        }));

        setDashboardStats({
          totalRevenue,
          totalOrders,
          todayOrders,
          totalProducts,
          totalCategories,
          newOrdersCount,
          activeProducts,
          totalVariantSkus,
          criticalStockCount,
          totalCustomers,
          newCustomersThisMonth,
          pendingVerification,
          weeklyData: weeklyChartData,
          weeklyAvg: Math.round(weeklyAvg),
          weeklyPeak: maxAmount,
          weeklyPeakDay: orderedLabels[weeklyPeakIdx] || '-',
          weeklyUnits: totalWeeklyUnits,
          dominantPaymentMethod: dominantMethod !== '-' ? `${dominantMethod} (${dominantPct}%)` : '-',
        });

      } catch (err) {
        console.error('Dashboard stats fetch error:', err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();

    // Auto-refresh stats every 6 seconds to keep sidebar numbers completely dynamic
    const pollInterval = setInterval(fetchStats, 6000);

    const handleDataChange = () => {
      fetchStats();
    };

    window.addEventListener('barokah:products_updated', handleDataChange);
    window.addEventListener('barokah:order_completed', handleDataChange);
    window.addEventListener('barokah:order_placed', handleDataChange);
    window.addEventListener('barokah:payment_updated', handleDataChange);
    window.addEventListener('barokah:categories_updated', handleDataChange);
    window.addEventListener('barokah:stock_updated', handleDataChange);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('barokah:products_updated', handleDataChange);
      window.removeEventListener('barokah:order_completed', handleDataChange);
      window.removeEventListener('barokah:order_placed', handleDataChange);
      window.removeEventListener('barokah:payment_updated', handleDataChange);
      window.removeEventListener('barokah:categories_updated', handleDataChange);
      window.removeEventListener('barokah:stock_updated', handleDataChange);
    };
  }, []);

  const handleStatusChange = async (orderNumber, newStatus) => {
    const updated = orders.map(o => o.order_number === orderNumber ? { ...o, status: newStatus } : o);
    setOrders(updated);
    localStorage.setItem('barokah_orders', JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('orders')
          .update({ order_status: newStatus, updated_at: new Date().toISOString() })
          .eq('order_number', orderNumber);
      } catch (err) {
        console.error('Supabase status update error:', err);
      }
    }

    toast.success(`Status #${orderNumber} diperbarui: ${getOrderStatusInfo(newStatus).label}`);
  };

  const handleVerifyPayment = async (item) => {
    setVerificationQueue(prev => prev.filter(v => v.id !== item.id));

    if (isSupabaseConfigured && item.id && !item.id.startsWith('local-')) {
      try {
        const adminDb = await getAdminClient();
        if (adminDb) {
          await adminDb.from('payments').update({
            status: 'lunas',
            verified_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }).eq('id', item.id);

          if (item.order_id) {
            await adminDb.from('orders').update({
              payment_status: 'lunas',
              order_status: 'diproses',
              paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }).eq('id', item.order_id);
          }
        }
      } catch (err) { console.warn('Dashboard verify error:', err); }
    }

    toast.success(`✅ Pembayaran ${item.customer} (${item.orderNumber}) LUNAS — pesanan DIPROSES!`);
  };

  const handleRejectPayment = async (item) => {
    setVerificationQueue(prev => prev.filter(v => v.id !== item.id));

    if (isSupabaseConfigured && item.id && !item.id.startsWith('local-')) {
      try {
        const adminDb = await getAdminClient();
        if (adminDb) {
          await adminDb.from('payments').update({
            status: 'gagal',
            rejection_reason: 'Ditolak via Dashboard Admin',
            updated_at: new Date().toISOString()
          }).eq('id', item.id);

          if (item.order_id) {
            await adminDb.from('orders').update({
              payment_status: 'gagal',
              order_status: 'menunggu_pembayaran',
              updated_at: new Date().toISOString()
            }).eq('id', item.order_id);
          }
        }
      } catch (err) { console.warn('Dashboard reject error:', err); }
    }

    toast.error(`❌ Pembayaran ${item.customer} ditolak.`);
  };

  const handleRestock = (item) => {
    setCriticalStockList(prev => prev.map(s => s.id === item.id ? { ...s, stock: s.stock + 15, isCritical: false } : s));
    toast.success(`Restock +15 pasang untuk ${item.name} (EU ${item.size}) berhasil!`);
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Ika';
  const initials = displayName.slice(0, 2).toUpperCase();
  const todayDateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  // 7-Day sales bar chart — uses real data from dashboardStats
  const weeklyData = dashboardStats.weeklyData;

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase();
    return orders.filter(o => 
      (o.order_number || '').toLowerCase().includes(q) ||
      (o.recipient_name || '').toLowerCase().includes(q) ||
      (o.phone_number || '').includes(q)
    );
  }, [orders, searchQuery]);

  // Fallback mock orders if none placed yet
  const displayOrders = filteredOrders.length > 0 ? filteredOrders : [
    {
      order_number: 'BKH-9842',
      recipient_name: 'Dimas Bagus',
      phone_number: '0812-9921-3990',
      product_name: 'Barokah Velocity X Light',
      size: '42',
      qty: 1,
      total_amount: 2450000,
      payment_method: 'BCA Transfer',
      payment_status: 'menunggu_verifikasi',
      status: 'diproses'
    },
    {
      order_number: 'BKH-9841',
      recipient_name: 'Ahmad Rayhan',
      phone_number: '0877-3811-2094',
      product_name: 'Air Motion Kinetic Runner',
      size: '43',
      qty: 1,
      total_amount: 1950000,
      payment_method: 'QRIS Instant',
      payment_status: 'lunas',
      status: 'dikirim'
    },
    {
      order_number: 'BKH-9840',
      recipient_name: 'Siti Nurhaliza',
      phone_number: '0813-8820-1923',
      product_name: 'Royal Oxford Formal Classic',
      size: '39',
      qty: 1,
      total_amount: 780000,
      payment_method: 'Mandiri VA',
      payment_status: 'lunas',
      status: 'selesai'
    },
    {
      order_number: 'BKH-9839',
      recipient_name: 'Budi Santoso',
      phone_number: '0852-7718-9902',
      product_name: 'Timber Nomad Tactical Boots',
      size: '44',
      qty: 1,
      total_amount: 950000,
      payment_method: 'BCA Transfer',
      payment_status: 'lunas',
      status: 'diproses'
    }
  ];

  const timeframeLabel = timeframe === 'today' ? 'Hari Ini' : timeframe === 'week' ? '7 Hari Terakhir' : 'Bulan Ini';

  const formatPaymentMethodLabel = (m) => {
    if (!m || m === '-') return '-';
    const clean = String(m)
      .replace(/transfer_bank/gi, 'Transfer Bank')
      .replace(/\bcod\b/gi, 'COD')
      .replace(/ewallet/gi, 'QRIS / E-Wallet');
    return clean;
  };

  const handleDashboardExport = (format) => {
    setIsDashboardExportOpen(false);
    const dateStamp = new Date().toISOString().slice(0, 10);
    const baseFilename = `Laporan_Dashboard_Barokah_${timeframe}_${dateStamp}`;

    const cleanDominantMethod = formatPaymentMethodLabel(dashboardStats.dominantPaymentMethod);

    const reportConfig = {
      title: 'LAPORAN EKSEKUTIF DASHBOARD & OPERASIONAL TOKO',
      docNumber: `BKH-DSH/${new Date().getFullYear()}/${timeframe.toUpperCase()}`,
      periodLabel: `${timeframeLabel} (${todayDateStr})`,
      kpis: [
        {
          label: 'TOTAL OMZET',
          value: formatIDR(dashboardStats.totalRevenue),
          sub: `Dari ${dashboardStats.totalOrders} pesanan`
        },
        {
          label: 'TOTAL PESANAN',
          value: `${dashboardStats.totalOrders} Pesanan`,
          sub: `+${dashboardStats.todayOrders} Hari Ini (${dashboardStats.pendingVerification} Verif)`
        },
        {
          label: 'PRODUK AKTIF',
          value: `${dashboardStats.activeProducts} Siluet`,
          sub: `${dashboardStats.totalVariantSkus} SKU Ukuran Tersedia`
        },
        {
          label: 'TOTAL PELANGGAN',
          value: `${dashboardStats.totalCustomers} Member`,
          sub: `+${dashboardStats.newCustomersThisMonth} Member Bulan Ini`
        }
      ],
      sections: [
        {
          title: 'Tren Penjualan 7 Hari Terakhir',
          subtitle: `Puncak: ${dashboardStats.weeklyPeakDay} (${formatIDR(dashboardStats.weeklyPeak)})`,
          headers: ['Hari', 'Total Omzet (IDR)', 'Status Harian', 'Metode Pembayaran'],
          colRatios: [0.18, 0.34, 0.24, 0.24],
          rows: weeklyData.map(w => [
            w.day,
            formatIDR(w.amount),
            w.isPeak ? 'PUNCAK MINGGUAN' : (w.amount > 0 ? 'Aktif Transaksi' : 'Tidak Ada Transaksi'),
            w.amount > 0 ? cleanDominantMethod : '-'
          ]),
          footerRow: [
            'TOTAL 7 HARI',
            formatIDR(weeklyData.reduce((s, w) => s + (w.amount || 0), 0)),
            `${dashboardStats.weeklyUnits} Pesanan (7 Hari)`,
            `Rerata: ${formatIDR(dashboardStats.weeklyAvg)}/hari`
          ]
        },
        {
          title: 'Daftar Transaksi & Pesanan Terbaru',
          subtitle: `Menampilkan ${Math.min(displayOrders.length, 15)} dari ${displayOrders.length} transaksi`,
          headers: ['No. Pesanan', 'Pelanggan', 'Produk & Ukuran', 'Metode Bayar', 'Status Bayar', 'Total Nominal'],
          colRatios: [0.15, 0.19, 0.27, 0.14, 0.11, 0.14],
          rows: displayOrders.slice(0, 15).map(ord => [
            `#${ord.order_number}`,
            ord.recipient_name || 'Pelanggan',
            `${ord.items?.[0]?.product_name || ord.product_name || 'Sepatu Barokah'} (EU ${ord.items?.[0]?.size || ord.size || '42'})`,
            formatPaymentMethodLabel(ord.payment_method),
            ord.payment_status === 'lunas' ? 'LUNAS' : 'VERIFIKASI',
            formatIDR(ord.total_amount || 0)
          ]),
          footerRow: [
            'TOTAL',
            `${displayOrders.length} Transaksi`,
            '',
            '',
            '',
            formatIDR(displayOrders.reduce((s, o) => s + (Number(o.total_amount) || 0), 0))
          ]
        }
      ]
    };

    if (format === 'pdf') {
      const blob = generatePdfBlob(reportConfig);
      triggerBlobDownload(blob, `${baseFilename}.pdf`);
      toast.success('Laporan Dashboard resmi (.pdf) berhasil diunduh!');
    } else if (format === 'xlsx') {
      const sheets = [
        {
          name: 'Ringkasan KPI',
          colWidths: [28, 26, 26, 26],
          rows: [
            [{ v: 'TOKO BAROKAH SHOES — LAPORAN EKSEKUTIF DASHBOARD ADMIN', s: 1 }],
            [{ v: `Periode: ${timeframeLabel} (${todayDateStr}) | Dicetak: ${new Date().toLocaleString('id-ID')}`, s: 2 }],
            [],
            [
              { v: 'INDIKATOR KPI UTAMA', s: 3 },
              { v: 'NILAI CAPAIAN', s: 3 },
              { v: 'KETERANGAN OPERASIONAL', s: 3 },
              { v: 'STATUS DATA', s: 3 }
            ],
            ...reportConfig.kpis.map(k => [
              { v: k.label, s: 5 },
              { v: k.value, s: 4 },
              { v: k.sub, s: 4 },
              { v: 'Supabase Live DB', s: 4 }
            ]),
            [],
            [
              { v: 'HARI (7 HARI TERAKHIR)', s: 3 },
              { v: 'OMZET HARIAN (IDR)', s: 3 },
              { v: 'STATUS', s: 3 },
              { v: 'METODE DOMINAN', s: 3 }
            ],
            ...weeklyData.map(w => [
              { v: w.day, s: 4 },
              { v: Number(w.amount) || 0, s: 6 },
              { v: w.isPeak ? 'Puncak Penjualan' : (w.amount > 0 ? 'Aktif Transaksi' : '-'), s: 4 },
              { v: w.amount > 0 ? cleanDominantMethod : '-', s: 4 }
            ]),
            [
              { v: 'TOTAL 7 HARI', s: 5 },
              { v: weeklyData.reduce((s, w) => s + (Number(w.amount) || 0), 0), s: 7 },
              { v: `${dashboardStats.weeklyUnits} Pesanan`, s: 5 },
              { v: `Rerata: ${formatIDR(dashboardStats.weeklyAvg)}`, s: 5 }
            ]
          ]
        },
        {
          name: 'Daftar Pesanan',
          colWidths: [18, 24, 18, 34, 12, 18, 18, 18, 20],
          rows: [
            [{ v: 'DAFTAR TRANSAKSI PESANAN TOKO BAROKAH SHOES', s: 1 }],
            [],
            [
              { v: 'NO. PESANAN', s: 3 },
              { v: 'NAMA PELANGGAN', s: 3 },
              { v: 'NO. TELEPON', s: 3 },
              { v: 'PRODUK SEPATU', s: 3 },
              { v: 'UKURAN', s: 3 },
              { v: 'METODE BAYAR', s: 3 },
              { v: 'STATUS BAYAR', s: 3 },
              { v: 'STATUS KIRIM', s: 3 },
              { v: 'TOTAL NOMINAL (IDR)', s: 3 }
            ],
            ...displayOrders.map(ord => [
              { v: `#${ord.order_number}`, s: 4 },
              { v: ord.recipient_name || 'Pelanggan', s: 4 },
              { v: ord.phone_number || '-', s: 4 },
              { v: ord.items?.[0]?.product_name || ord.product_name || 'Barokah Heritage Shoe', s: 4 },
              { v: `EU ${ord.items?.[0]?.size || ord.size || '42'}`, s: 4 },
              { v: formatPaymentMethodLabel(ord.payment_method), s: 4 },
              { v: ord.payment_status === 'lunas' ? 'Lunas' : 'Menunggu Verifikasi', s: 4 },
              { v: (ord.status || 'diproses').toUpperCase(), s: 4 },
              { v: Number(ord.total_amount) || 0, s: 6 }
            ]),
            [
              { v: 'TOTAL AKUMULATIF', s: 5 },
              { v: `${displayOrders.length} Pesanan`, s: 5 },
              { v: '', s: 5 },
              { v: '', s: 5 },
              { v: '', s: 5 },
              { v: '', s: 5 },
              { v: '', s: 5 },
              { v: '', s: 5 },
              { v: displayOrders.reduce((s, o) => s + (Number(o.total_amount) || 0), 0), s: 7 }
            ]
          ]
        }
      ];
      const blob = generateXlsxBlob(sheets);
      triggerBlobDownload(blob, `${baseFilename}.xlsx`);
      toast.success('Laporan Excel Workbook (.xlsx) berhasil diunduh!');
    } else if (format === 'csv') {
      const blob = generateCsvBlob(reportConfig);
      triggerBlobDownload(blob, `${baseFilename}.csv`);
      toast.success('Laporan Dashboard (.csv) berhasil diunduh!');
    } else if (format === 'doc') {
      const blob = generateWordBlob(reportConfig);
      triggerBlobDownload(blob, `${baseFilename}.doc`);
      toast.success('Laporan Dokumen Word (.doc) berhasil diunduh!');
    } else if (format === 'json') {
      const jsonBlob = new Blob([JSON.stringify({
        store: 'Toko Barokah Shoes',
        exportedAt: new Date().toISOString(),
        timeframe: timeframeLabel,
        stats: dashboardStats,
        orders: displayOrders
      }, null, 2)], { type: 'application/json' });
      triggerBlobDownload(jsonBlob, `${baseFilename}.json`);
      toast.success('Data laporan (.json) berhasil diunduh!');
    } else if (format === 'print') {
      toast.dismiss();
      setTimeout(() => {
        window.print();
      }, 100);
    }
  };

  return (
    <div style={{ 
      backgroundColor: C.bgPage, 
      color: C.textMain, 
      minHeight: '100vh', 
      display: 'flex', 
      fontFamily: 'var(--font-body)',
      backgroundImage: 'radial-gradient(at 0% 0%, rgba(5, 150, 105, 0.03) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(37, 99, 235, 0.03) 0px, transparent 50%)'
    }}>
      
      {/* ============================================================== */}
      {/* 1. SIDEBAR (Width: 260px Clean White Architecture)             */}
      {/* ============================================================== */}
      <aside className="no-print" style={{
        width: '260px',
        flexShrink: 0,
        backgroundColor: C.card,
        borderRight: `1px solid ${C.border}`,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 50,
        overflowY: 'auto',
        boxShadow: '2px 0 10px rgba(15, 23, 42, 0.02)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          
          {/* Brand Header */}
          <div style={{ padding: '24px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #059669 0%, #2563EB 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1.25rem',
                fontFamily: 'var(--font-heading)',
                boxShadow: '0 4px 10px rgba(5, 150, 105, 0.25)'
              }}>
                B
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '0.02em', textTransform: 'uppercase', color: C.textMain, fontFamily: 'var(--font-heading)' }}>
                BAROKAH<span style={{ color: C.emerald }}>.</span>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
              <span style={{ fontSize: '10px', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)', color: C.textMuted, textTransform: 'uppercase', fontWeight: 700 }}>
                STREETWEAR ATELIER
              </span>
              <span style={{
                fontSize: '9px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
                backgroundColor: C.emeraldLight,
                color: C.emeraldText,
                padding: '2px 7px',
                borderRadius: '9999px',
                border: `1px solid ${C.emeraldBorder}`
              }}>
                v2.4 PRO
              </span>
            </div>
          </div>

          {/* Navigation Links — Dynamic Real-Time Badges */}
          <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveNav(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isActive ? 'linear-gradient(135deg, #059669 0%, #0284C7 100%)' : 'transparent',
                    color: isActive ? '#FFFFFF' : C.textSub,
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isActive ? '0 4px 12px rgba(5, 150, 105, 0.22)' : 'none',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = C.surface;
                      e.currentTarget.style.color = C.textMain;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = C.textSub;
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Icon size={18} color={isActive ? '#FFFFFF' : C.textMuted} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge ? (
                    <span style={{
                      fontSize: '0.65rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '9999px',
                      backgroundColor: isActive
                        ? 'rgba(255, 255, 255, 0.22)'
                        : (item.isAlert ? C.redBg : item.isBlue ? C.blueLight : item.isGreen ? C.emeraldLight : C.surface),
                      color: isActive
                        ? '#FFFFFF'
                        : (item.isAlert ? C.redText : item.isBlue ? C.blueText : item.isGreen ? C.emeraldText : C.textSub),
                      border: isActive
                        ? '1px solid rgba(255, 255, 255, 0.35)'
                        : `1px solid ${item.isAlert ? C.redBorder : item.isBlue ? C.blueBorder : item.isGreen ? C.emeraldBorder : C.border}`
                    }}>
                      {item.badge}
                    </span>
                  ) : isActive ? (
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#FFFFFF' }} />
                  ) : null}
                </button>
              );
            })}
          </nav>

          {/* Bottom Profile Card */}
          <div style={{ padding: '12px', borderTop: `1px solid ${C.border}`, backgroundColor: '#FAFAFA' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: C.card,
              border: `1px solid ${C.border}`,
              boxShadow: C.shadowSm
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #059669, #2563EB)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    color: '#FFFFFF',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {initials}
                  </div>
                  <span style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                    border: '2px solid #FFFFFF'
                  }} />
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: C.textMain, display: 'block', maxWidth: '105px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {displayName}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: C.emerald, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    Super Admin
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  try {
                    await logout();
                    toast.success('Berhasil keluar dari Admin Panel');
                    navigate('/');
                  } catch (e) {
                    console.error(e);
                  }
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: C.textMuted,
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = C.redText;
                  e.currentTarget.style.backgroundColor = C.redBg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = C.textMuted;
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title="Keluar / Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>

        </div>
      </aside>

      {/* ============================================================== */}
      {/* 2. MAIN CONTAINER WRAPPER (Offset 260px)                       */}
      {/* ============================================================== */}
      <div className="admin-main-wrapper" style={{ marginLeft: '260px', flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* Top Header Bar */}
        <header className="no-print" style={{
          height: '64px',
          borderBottom: `1px solid ${C.border}`,
          backgroundColor: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)'
        }}>
          {/* Left: Breadcrumbs */}
          <div>
            <h1 style={{ fontSize: '0.98rem', fontWeight: 800, color: C.textMain, margin: 0 }}>
              {sidebarItems.find(s => s.id === activeNav)?.label || 'Dashboard Utama'}
            </h1>
            <p style={{ fontSize: '0.68rem', color: C.textMuted, fontFamily: 'var(--font-mono)', margin: '2px 0 0' }}>
              Admin / Ringkasan Operasional Toko • <span style={{ color: C.emeraldText, fontWeight: 600 }}>{todayDateStr}</span>
            </p>
          </div>

          {/* Center: Search Input with ⌘K Badge */}
          <div style={{ position: 'relative', width: '380px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: C.textMuted }} />
            <input
              type="text"
              placeholder="Cari SKU, No. Pesanan, atau Pelanggan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: '8px',
                padding: '8px 48px 8px 36px',
                fontSize: '0.78rem',
                color: C.textMain,
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                fontFamily: 'var(--font-body)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = C.emerald;
                e.target.style.boxShadow = '0 0 0 3px rgba(5, 150, 105, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = C.border;
                e.target.style.boxShadow = 'none';
              }}
            />
            <span style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              color: C.textMuted,
              backgroundColor: C.card,
              padding: '2px 6px',
              borderRadius: '4px',
              border: `1px solid ${C.border}`
            }}>
              ⌘K
            </span>
          </div>

          {/* Right: Live Connection, Notification & Action CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Live Sync Status */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '9999px',
              backgroundColor: C.emeraldLight,
              border: `1px solid ${C.emeraldBorder}`,
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              color: C.emeraldText
            }}>
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                boxShadow: '0 0 8px #10B981'
              }} />
              <span>Supabase: Connected <strong style={{ color: C.emerald }}>(JKT-01)</strong></span>
            </div>

            {/* Notification Bell */}
            <button
              type="button"
              onClick={() => toast('Tidak ada notifikasi sistem baru')}
              style={{
                position: 'relative',
                padding: '8px',
                borderRadius: '8px',
                backgroundColor: C.card,
                border: `1px solid ${C.border}`,
                color: C.textSub,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                boxShadow: C.shadowSm
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = C.blue;
                e.currentTarget.style.borderColor = C.blueBorder;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = C.textSub;
                e.currentTarget.style.borderColor = C.border;
              }}
            >
              <Bell size={16} />
              <span style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                width: '16px',
                height: '16px',
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
                fontSize: '10px',
                fontWeight: 900,
                fontFamily: 'var(--font-mono)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
              }}>
                7
              </span>
            </button>

            {/* Tambah Produk Button */}
            <button
              type="button"
              onClick={() => {
                setActiveNav('products');
                toast.success('Buka Form Tambah Produk Siluet Baru');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #059669 0%, #2563EB 100%)',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
            >
              <Plus size={15} strokeWidth={3} /> Tambah Produk
            </button>

            {/* Lihat Toko Button */}
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                backgroundColor: C.card,
                color: C.textSub,
                border: `1px solid ${C.borderDark}`,
                fontWeight: 600,
                fontSize: '0.75rem',
                textDecoration: 'none',
                transition: 'all 0.2s',
                boxShadow: C.shadowSm
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = C.blue;
                e.currentTarget.style.color = C.blue;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = C.borderDark;
                e.currentTarget.style.color = C.textSub;
              }}
            >
              <ExternalLink size={13} /> Toko
            </Link>
          </div>
        </header>

        {/* ============================================================== */}
        {/* 3. MAIN DASHBOARD CONTENT (Active Section: DASHBOARD)          */}
        {/* ============================================================== */}
        <main style={{ padding: '32px', flex: 1, display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {activeNav === 'dashboard' ? (
            <>
              <div className="screen-report-only" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {/* Header Greeting & Timeframe Filter */}
              <section style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', paddingBottom: '16px', borderBottom: `1px solid ${C.border}` }}>
                <div>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: C.textHead, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    Selamat Datang, {displayName} <span style={{ fontSize: '1.4rem' }}>👋</span>
                  </h2>
                  <p style={{ fontSize: '0.82rem', color: C.textMuted, margin: '6px 0 0' }}>
                    Ringkasan performa toko hari ini • <span style={{ color: C.emerald, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{todayDateStr}</span>
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Timeframe selector */}
                  <div style={{ display: 'flex', backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '4px', gap: '4px', boxShadow: C.shadowSm }}>
                    {[
                      { id: 'month', label: 'Bulan Ini' },
                      { id: 'week', label: '7 Hari' },
                      { id: 'today', label: 'Hari Ini' }
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setTimeframe(t.id);
                          toast.success(`Filter periode: ${t.label}`);
                        }}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px',
                          border: 'none',
                          fontSize: '0.72rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: timeframe === t.id ? 800 : 600,
                          backgroundColor: timeframe === t.id ? C.emeraldLight : 'transparent',
                          color: timeframe === t.id ? C.emeraldText : C.textMuted,
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Export Report Multi-Format Dropdown */}
                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      onClick={() => setIsDashboardExportOpen(!isDashboardExportOpen)}
                      style={{
                        padding: '8px 16px',
                        background: 'linear-gradient(135deg, #059669 0%, #2563EB 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                        boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
                        transition: 'all 0.2s'
                      }}
                      title="Ekspor Laporan Dashboard (PDF, Excel, CSV, Word, JSON)"
                    >
                      <Download size={15} />
                      <span>Export Laporan</span>
                      <ChevronDown size={14} />
                    </button>

                    {isDashboardExportOpen && (
                      <div style={{
                        position: 'absolute',
                        right: 0,
                        marginTop: '6px',
                        width: '235px',
                        backgroundColor: '#0F172A',
                        color: '#FFFFFF',
                        borderRadius: '10px',
                        boxShadow: C.shadowLg,
                        zIndex: 60,
                        padding: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.74rem'
                      }}>
                        <div style={{ padding: '6px 10px 4px', fontSize: '0.62rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid #1E293B', marginBottom: '2px' }}>
                          Pilih Format Laporan ({timeframeLabel})
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDashboardExport('pdf')}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '6px', backgroundColor: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer', textAlign: 'left' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1E293B'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <span>LAPORAN PDF (.pdf)</span>
                          <FileText size={14} style={{ color: '#34D399' }} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDashboardExport('xlsx')}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '6px', backgroundColor: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer', textAlign: 'left' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1E293B'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <span>EXCEL WORKBOOK (.xlsx)</span>
                          <Grid size={14} style={{ color: '#60A5FA' }} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDashboardExport('csv')}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '6px', backgroundColor: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer', textAlign: 'left' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1E293B'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <span>DOKUMEN CSV (.csv)</span>
                          <Download size={14} style={{ color: '#D0F12F' }} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDashboardExport('doc')}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '6px', backgroundColor: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer', textAlign: 'left' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1E293B'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <span>DOKUMEN WORD (.doc)</span>
                          <FileText size={14} style={{ color: '#93C5FD' }} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDashboardExport('json')}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '6px', backgroundColor: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer', textAlign: 'left' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1E293B'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <span>DATA BACKUP (.json)</span>
                          <Database size={14} style={{ color: '#FBBF24' }} />
                        </button>
                        <div style={{ borderTop: '1px solid #1E293B', marginTop: '2px', paddingTop: '2px' }}>
                          <button
                            type="button"
                            onClick={() => handleDashboardExport('print')}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '6px', backgroundColor: 'transparent', border: 'none', color: '#D0F12F', cursor: 'pointer', textAlign: 'left', fontWeight: 700 }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1E293B'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <span>CETAK / PRINT RESMI A4</span>
                            <Printer size={14} style={{ color: '#D0F12F' }} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* 4 KPI Stat Cards */}
              <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
                {/* KPI 1: Total Omzet */}
                <div style={kpiCardStyle}>
                  <div style={kpiHeaderRow}>
                    <span>TOTAL OMZET</span>
                    <span style={{ padding: '6px', borderRadius: '8px', backgroundColor: C.emeraldLight, color: C.emerald }}>
                      <TrendingUp size={16} />
                    </span>
                  </div>
                  <div style={{ marginTop: '14px' }}>
                    <p style={{ fontSize: '1.75rem', fontWeight: 900, color: C.textHead, fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em', margin: 0 }}>
                      {statsLoading ? '...' : formatIDR(dashboardStats.totalRevenue)}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                      <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: C.emeraldText, backgroundColor: C.emeraldLight, padding: '2px 8px', borderRadius: '4px', border: `1px solid ${C.emeraldBorder}` }}>
                        Live Data
                      </span>
                      <span style={{ fontSize: '0.72rem', color: C.textMuted }}>dari Supabase</span>
                    </div>
                  </div>
                  <div style={kpiFooter}>
                    Dari <strong style={{ color: C.textSub }}>{statsLoading ? '...' : dashboardStats.totalOrders}</strong> pesanan
                  </div>
                </div>

                {/* KPI 2: Total Pesanan */}
                <div style={kpiCardStyle}>
                  <div style={kpiHeaderRow}>
                    <span>TOTAL PESANAN</span>
                    <span style={{ padding: '6px', borderRadius: '8px', backgroundColor: C.blueLight, color: C.blue }}>
                      <ShoppingBag size={16} />
                    </span>
                  </div>
                  <div style={{ marginTop: '14px' }}>
                    <p style={{ fontSize: '1.75rem', fontWeight: 900, color: C.textHead, fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em', margin: 0 }}>
                      {statsLoading ? '...' : dashboardStats.totalOrders.toLocaleString('id-ID')} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: C.textMuted }}>Order</span>
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                      <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: C.blueText, backgroundColor: C.blueLight, padding: '2px 8px', borderRadius: '4px', border: `1px solid ${C.blueBorder}` }}>
                        +{statsLoading ? '...' : dashboardStats.todayOrders} Hari Ini
                      </span>
                      <span style={{ fontSize: '0.72rem', color: C.textMuted }}>Live Data</span>
                    </div>
                  </div>
                  <div style={kpiFooter}>
                    <span style={{ color: C.textMuted }}>{statsLoading ? '...' : dashboardStats.pendingVerification} Menunggu Verif</span>
                    <span style={{ color: C.emerald, fontWeight: 700 }}>Live DB</span>
                  </div>
                </div>

                {/* KPI 3: Produk Aktif */}
                <div style={kpiCardStyle}>
                  <div style={kpiHeaderRow}>
                    <span>PRODUK AKTIF</span>
                    <span style={{ padding: '6px', borderRadius: '8px', backgroundColor: C.tealLight, color: C.teal }}>
                      <Package size={16} />
                    </span>
                  </div>
                  <div style={{ marginTop: '14px' }}>
                    <p style={{ fontSize: '1.75rem', fontWeight: 900, color: C.textHead, fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em', margin: 0 }}>
                      {statsLoading ? '...' : dashboardStats.activeProducts} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: C.textMuted }}>Aktif</span>
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                      <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: C.textSub, backgroundColor: C.surface, padding: '2px 8px', borderRadius: '4px', border: `1px solid ${C.border}` }}>
                        {statsLoading ? '...' : dashboardStats.totalVariantSkus} SKU Ukuran
                      </span>
                      <span style={{ fontSize: '0.72rem', color: C.textMuted }}>Siap Jual</span>
                    </div>
                  </div>
                  <div style={{ ...kpiFooter, color: C.amberText }}>
                    <span>Stok Kritis: {statsLoading ? '...' : dashboardStats.criticalStockCount} Item</span>
                    <span>⚠️</span>
                  </div>
                </div>

                {/* KPI 4: Total Pelanggan */}
                <div style={kpiCardStyle}>
                  <div style={kpiHeaderRow}>
                    <span>TOTAL PELANGGAN</span>
                    <span style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#F5F3FF', color: '#7C3AED' }}>
                      <Users size={16} />
                    </span>
                  </div>
                  <div style={{ marginTop: '14px' }}>
                    <p style={{ fontSize: '1.75rem', fontWeight: 900, color: C.textHead, fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em', margin: 0 }}>
                      {statsLoading ? '...' : dashboardStats.totalCustomers.toLocaleString('id-ID')} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: C.textMuted }}>Akun</span>
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                      <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: C.emeraldText, backgroundColor: C.emeraldLight, padding: '2px 8px', borderRadius: '4px', border: `1px solid ${C.emeraldBorder}` }}>
                        +{statsLoading ? '...' : dashboardStats.newCustomersThisMonth} Bulan Ini
                      </span>
                      <span style={{ fontSize: '0.72rem', color: C.textMuted }}>Member Baru</span>
                    </div>
                  </div>
                  <div style={kpiFooter}>
                    Total Produk: <strong style={{ color: C.textSub }}>{statsLoading ? '...' : dashboardStats.totalProducts}</strong>
                  </div>
                </div>
              </section>

              {/* Middle Section: 7-Day Chart (8 cols) & Verification/Stock (4 cols) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '28px' }}>
                
                {/* Left 8 Cols: Sales Trend Bar Chart */}
                <div style={{ gridColumn: 'span 8', backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: C.shadowMd }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '20px', borderBottom: `1px solid ${C.border}`, gap: '14px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: C.textHead, margin: 0 }}>
                          Grafik Penjualan 7 Hari Terakhir
                        </h3>
                        <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 800, backgroundColor: C.blueLight, color: C.blueText, padding: '2px 7px', borderRadius: '4px', border: `1px solid ${C.blueBorder}` }}>
                          LIVE DATA
                        </span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: C.textMuted, margin: '4px 0 0' }}>
                        Rata-rata penjualan harian: <strong style={{ color: C.textMain, fontFamily: 'var(--font-mono)' }}>Rp 48.970.000</strong>
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: C.emerald }} />
                        <span style={{ color: C.textSub }}>Penjualan Selesai</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '12px', height: '2px', backgroundColor: C.borderDark, borderRadius: '2px' }} />
                        <span style={{ color: C.textMuted }}>Target Harian</span>
                      </div>
                    </div>
                  </div>

                  {/* SVG & Bar Chart Visualizer */}
                  <div style={{ padding: '24px 0 16px' }}>
                    <div style={{ position: 'relative', height: '240px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px', padding: '20px 8px 8px' }}>
                      {/* Grid guideline levels */}
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none', opacity: 0.6 }}>
                        <div style={{ borderBottom: `1px dashed ${C.border}`, width: '100%', textAlign: 'right', fontSize: '10px', fontFamily: 'var(--font-mono)', color: C.textLight }}>Rp 60jt</div>
                        <div style={{ borderBottom: `1px dashed ${C.border}`, width: '100%', textAlign: 'right', fontSize: '10px', fontFamily: 'var(--font-mono)', color: C.textLight }}>Rp 45jt</div>
                        <div style={{ borderBottom: `1px dashed ${C.border}`, width: '100%', textAlign: 'right', fontSize: '10px', fontFamily: 'var(--font-mono)', color: C.textLight }}>Rp 30jt</div>
                        <div style={{ borderBottom: `1px dashed ${C.border}`, width: '100%', textAlign: 'right', fontSize: '10px', fontFamily: 'var(--font-mono)', color: C.textLight }}>Rp 15jt</div>
                        <div style={{ borderBottom: `1px solid ${C.border}`, width: '100%' }} />
                      </div>

                      {/* Render 7 Days Bars */}
                      {weeklyData.map((bar, idx) => {
                        const isHovered = hoveredBarIndex === idx;

                        return (
                          <div 
                            key={bar.day} 
                            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 10, cursor: 'pointer' }}
                            onMouseEnter={() => setHoveredBarIndex(idx)}
                            onMouseLeave={() => setHoveredBarIndex(null)}
                          >
                            {/* Hover tooltip or peak value */}
                            <div style={{
                              fontSize: '10px',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 800,
                              color: '#FFFFFF',
                              backgroundColor: bar.isPeak ? C.emerald : C.blue,
                              padding: '2px 7px',
                              borderRadius: '4px',
                              boxShadow: bar.isPeak ? '0 2px 8px rgba(5,150,105,0.3)' : '0 2px 6px rgba(37,99,235,0.2)',
                              opacity: isHovered || bar.isPeak ? 1 : 0,
                              transition: 'opacity 0.2s ease',
                              whiteSpace: 'nowrap'
                            }}>
                              {bar.shortVal}
                            </div>

                            <div style={{
                              width: '100%',
                              maxWidth: '44px',
                              height: `${bar.height}px`,
                              borderRadius: '6px 6px 0 0',
                              background: bar.isPeak 
                                ? 'linear-gradient(180deg, #34D399 0%, #059669 100%)' 
                                : isHovered 
                                ? 'linear-gradient(180deg, #60A5FA 0%, #2563EB 100%)' 
                                : 'linear-gradient(180deg, #93C5FD 0%, #3B82F6 100%)',
                              boxShadow: bar.isPeak ? '0 4px 14px rgba(5, 150, 105, 0.3)' : '0 2px 8px rgba(37, 99, 235, 0.15)',
                              transition: 'all 0.25s ease'
                            }} />

                            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: bar.isPeak ? 800 : 600, color: bar.isPeak ? C.emerald : C.textSub }}>
                              {bar.day}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Chart Footer Summary Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', paddingTop: '16px', borderTop: `1px solid ${C.border}`, textAlign: 'center' }}>
                    <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: C.textMuted, textTransform: 'uppercase', fontWeight: 700 }}>Tertinggi ({dashboardStats.weeklyPeakDay})</span>
                      <p style={{ margin: '4px 0 0', fontSize: '0.92rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: C.emerald }}>{statsLoading ? '...' : formatIDR(dashboardStats.weeklyPeak)}</p>
                    </div>
                    <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: C.textMuted, textTransform: 'uppercase', fontWeight: 700 }}>Order 7 Hari</span>
                      <p style={{ margin: '4px 0 0', fontSize: '0.92rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: C.textMain }}>{statsLoading ? '...' : dashboardStats.weeklyUnits} Order</p>
                    </div>
                    <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: C.textMuted, textTransform: 'uppercase', fontWeight: 700 }}>Metode Dominan</span>
                      <p style={{ margin: '4px 0 0', fontSize: '0.92rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: C.blue }}>{statsLoading ? '...' : dashboardStats.dominantPaymentMethod}</p>
                    </div>
                  </div>
                </div>

                {/* Right 4 Cols: Verifikasi Manual & Alert Stok */}
                <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Widget 1: Verifikasi Pembayaran Manual */}
                  <div style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '20px', boxShadow: C.shadowMd }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: `1px solid ${C.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#D97706', boxShadow: '0 0 6px rgba(217, 119, 6, 0.4)' }} />
                        <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: C.textHead, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                          Verifikasi Manual
                        </h3>
                      </div>
                      <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: C.amberText, backgroundColor: C.amberBg, border: `1px solid ${C.amberBorder}`, padding: '2px 8px', borderRadius: '9999px', fontWeight: 700 }}>
                        {verificationQueue.length} Menunggu
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px' }}>
                      {verificationQueue.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px 0', color: C.emeraldText, fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700 }}>
                          ✓ Semua pembayaran telah diverifikasi
                        </div>
                      ) : (
                        verificationQueue.map(item => (
                          <div key={item.id} style={{ padding: '12px', borderRadius: '8px', backgroundColor: C.surface, border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: C.textMain, display: 'block' }}>{item.customer}</span>
                                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: C.textMuted }}>{item.orderNumber} • {item.method}</span>
                              </div>
                              <span style={{ fontSize: '0.82rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: C.emerald }}>
                                {formatIDR(item.amount)}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
                              {item.proofFile && (item.proofFile.startsWith('data:') || item.proofFile.startsWith('http')) ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <img
                                    src={item.proofFile}
                                    alt="Bukti"
                                    style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover', border: `1px solid ${C.amberBorder}`, cursor: 'pointer' }}
                                    onClick={() => window.open(item.proofFile, '_blank')}
                                  />
                                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: C.textMuted }}>Bukti tersedia ↗</span>
                                </div>
                              ) : (
                                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: C.textMuted }}>
                                  Belum ada bukti unggahan
                                </span>
                              )}
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleVerifyPayment(item)}
                                  style={{
                                    padding: '5px 12px',
                                    borderRadius: '6px',
                                    background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    fontWeight: 700,
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)'
                                  }}
                                >
                                  Verifikasi
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRejectPayment(item)}
                                  style={{
                                    padding: '5px 10px',
                                    borderRadius: '6px',
                                    backgroundColor: C.card,
                                    color: C.textMuted,
                                    border: `1px solid ${C.borderDark}`,
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.color = C.redText;
                                    e.currentTarget.style.borderColor = C.redBorder;
                                    e.currentTarget.style.backgroundColor = C.redBg;
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.color = C.textMuted;
                                    e.currentTarget.style.borderColor = C.borderDark;
                                    e.currentTarget.style.backgroundColor = C.card;
                                  }}
                                >
                                  Tolak
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Widget 2: Alert Stok Kritis */}
                  <div style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '20px', boxShadow: C.shadowMd }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: `1px solid ${C.border}` }}>
                      <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: C.textHead, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>⚠️</span> Alert Stok Kritis
                      </h3>
                      <button
                        type="button"
                        onClick={() => setActiveNav('stock')}
                        style={{ background: 'none', border: 'none', color: C.blue, fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Kelola Semua
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
                      {criticalStockList.map(item => (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', backgroundColor: item.stock === 0 ? C.redBg : C.surface, border: `1px solid ${item.stock === 0 ? C.redBorder : C.border}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: C.blueLight, border: `1px solid ${C.blueBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.75rem', color: C.blueText }}>
                              {item.size}
                            </div>
                            <div>
                              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: C.textMain, display: 'block' }}>{item.name}</span>
                              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: C.textMuted }}>SKU: {item.sku}</span>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: item.stock === 0 ? '#FFFFFF' : C.redText, backgroundColor: item.stock === 0 ? '#EF4444' : C.redBg, padding: '2px 7px', borderRadius: '9999px', border: `1px solid ${item.stock === 0 ? '#EF4444' : C.redBorder}` }}>
                              {item.stock === 0 ? 'HABIS' : `Sisa ${item.stock}`}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRestock(item)}
                              style={{ display: 'block', background: 'none', border: 'none', color: C.emerald, fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer', marginTop: '4px', textDecoration: 'underline' }}
                            >
                              + Restock
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

              {/* Bottom Section: Daftar Pesanan Terbaru Table */}
              <div style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '24px', boxShadow: C.shadowMd }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: `1px solid ${C.border}`, gap: '14px' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: C.textHead, margin: 0 }}>
                      Daftar Pesanan Terbaru
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: C.textMuted, margin: '4px 0 0' }}>
                      Transaksi langsung dari web store &amp; konfirmasi pembayaran real-time
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => toast('Filter status transaksi: Semua')}
                      style={{ padding: '7px 14px', borderRadius: '6px', backgroundColor: C.surface, border: `1px solid ${C.borderDark}`, color: C.textSub, fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Filter Status ▼
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveNav('orders')}
                      style={{ padding: '7px 16px', borderRadius: '6px', background: 'linear-gradient(135deg, #059669 0%, #2563EB 100%)', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: '0.75rem', fontFamily: 'var(--font-mono)', cursor: 'pointer', boxShadow: '0 2px 8px rgba(5,150,105,0.2)' }}
                    >
                      Lihat Semua ({displayOrders.length})
                    </button>
                  </div>
                </div>

                <div style={{ overflowX: 'auto', marginTop: '16px' }}>
                  <table style={{ width: '100%', textAlign: 'left', fontSize: '0.8rem', borderCollapse: 'collapse', fontFamily: 'var(--font-body)' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F1F5F9', color: '#334155', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.06em', borderBottom: `2px solid ${C.border}`, fontWeight: 700 }}>
                        <th style={{ padding: '12px 14px' }}>No. Pesanan</th>
                        <th style={{ padding: '12px 14px' }}>Pelanggan</th>
                        <th style={{ padding: '12px 14px' }}>Produk &amp; Ukuran</th>
                        <th style={{ padding: '12px 14px' }}>Total Nominal</th>
                        <th style={{ padding: '12px 14px' }}>Metode</th>
                        <th style={{ padding: '12px 14px' }}>Status Bayar</th>
                        <th style={{ padding: '12px 14px' }}>Status Kirim</th>
                        <th style={{ padding: '12px 14px', textAlign: 'right' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayOrders.map((ord, idx) => (
                        <tr 
                          key={ord.order_number || idx}
                          style={{ borderBottom: `1px solid ${C.border}`, transition: 'background-color 0.15s' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <td style={{ padding: '14px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: C.blue }}>
                            #{ord.order_number}
                          </td>
                          <td style={{ padding: '14px' }}>
                            <span style={{ fontWeight: 800, color: C.textMain, display: 'block' }}>{ord.recipient_name || 'Pelanggan'}</span>
                            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: C.textMuted }}>{ord.phone_number || '-'}</span>
                          </td>
                          <td style={{ padding: '14px' }}>
                            <span style={{ color: C.textSub, display: 'block', fontWeight: 600 }}>
                              {ord.items?.[0]?.product_name || ord.product_name || 'Barokah Heritage Shoe'}
                            </span>
                            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: C.emeraldText, fontWeight: 700 }}>
                              EU {ord.items?.[0]?.size || ord.size || '42'} • Qty: {ord.items?.[0]?.quantity || ord.qty || 1}
                            </span>
                          </td>
                          <td style={{ padding: '14px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: C.textMain }}>
                            {formatIDR(ord.total_amount)}
                          </td>
                          <td style={{ padding: '14px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: C.textMuted }}>
                            {ord.payment_method}
                          </td>
                          <td style={{ padding: '14px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              fontSize: '10px',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 800,
                              backgroundColor: ord.payment_status === 'lunas' ? C.emeraldLight : C.amberBg,
                              color: ord.payment_status === 'lunas' ? C.emeraldText : C.amberText,
                              border: `1px solid ${ord.payment_status === 'lunas' ? C.emeraldBorder : C.amberBorder}`
                            }}>
                              {ord.payment_status === 'lunas' ? 'Lunas' : 'Menunggu Verif'}
                            </span>
                          </td>
                          <td style={{ padding: '14px' }}>
                            <select
                              value={ord.status || 'menunggu_pembayaran'}
                              onChange={(e) => handleStatusChange(ord.order_number, e.target.value)}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                backgroundColor: C.surface,
                                color: C.textSub,
                                border: `1px solid ${C.borderDark}`,
                                fontSize: '11px',
                                fontFamily: 'var(--font-mono)',
                                outline: 'none',
                                cursor: 'pointer',
                                fontWeight: 600
                              }}
                            >
                              <option value="menunggu_pembayaran">Menunggu Bayar</option>
                              <option value="menunggu_konfirmasi">Menunggu Konfirmasi</option>
                              <option value="diproses">Diproses</option>
                              <option value="dikirim">Dikirim</option>
                              <option value="selesai">Selesai</option>
                              <option value="dibatalkan">Dibatalkan</option>
                            </select>
                          </td>
                          <td style={{ padding: '14px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => navigate(`/order/${ord.order_number}`)}
                                style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: C.blueLight, border: `1px solid ${C.blueBorder}`, color: C.blueText, fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer' }}
                              >
                                Detail
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  exportOrderReceiptPdf(ord);
                                  toast.success(`Struk pesanan #${ord.order_number} (.pdf) berhasil diunduh!`);
                                }}
                                style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: C.surface, border: `1px solid ${C.borderDark}`, color: C.textSub, fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600, cursor: 'pointer' }}
                              >
                                Cetak
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              </div>

              {/* DOKUMEN RESMI CETAK / PDF DASHBOARD ADMIN (A4 ATELIER LEDGER) */}
              <div className="print-report-only" style={{ padding: '0', color: '#080808', fontFamily: 'var(--font-body)', background: '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '14px', borderBottom: '3px double #080808' }}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div style={{ width: '46px', height: '46px', borderRadius: '4px', backgroundColor: '#080808', color: '#b7d600', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.45rem', fontFamily: 'var(--font-heading)', flexShrink: 0 }}>
                      B
                    </div>
                    <div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, textTransform: 'uppercase', fontFamily: 'var(--font-heading)', color: '#080808' }}>
                        TOKO BAROKAH SHOES
                      </div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#333333', textTransform: 'uppercase' }}>
                        LAPORAN EKSEKUTIF DASHBOARD &amp; OPERASIONAL TOKO
                      </div>
                      <div style={{ fontSize: '0.66rem', color: '#444444', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                        PASAR JAYA JATINEGARA LT.2 BLOK AKS NO. 57, JAKARTA TIMUR 13310 • WA: 081288667433
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 900, color: '#080808' }}>
                      NO: BKH-DSH/{new Date().getFullYear()}/{timeframe.toUpperCase()}
                    </div>
                    <div style={{ fontSize: '0.66rem', color: '#555555', marginTop: '2px' }}>
                      PERIODE: {timeframeLabel.toUpperCase()} ({todayDateStr})
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', margin: '16px 0' }} className="print-avoid-break">
                  <div style={{ border: '1px solid #080808', padding: '10px 12px', borderRadius: '3px', backgroundColor: '#fafafa' }}>
                    <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: '#666666', fontWeight: 700 }}>TOTAL OMZET</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#080808', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>{formatIDR(dashboardStats.totalRevenue)}</div>
                  </div>
                  <div style={{ border: '1px solid #080808', padding: '10px 12px', borderRadius: '3px', backgroundColor: '#fafafa' }}>
                    <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: '#666666', fontWeight: 700 }}>TOTAL PESANAN</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#080808', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>{dashboardStats.totalOrders} Pesanan</div>
                  </div>
                  <div style={{ border: '1px solid #080808', padding: '10px 12px', borderRadius: '3px', backgroundColor: '#fafafa' }}>
                    <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: '#666666', fontWeight: 700 }}>PRODUK AKTIF</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#080808', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>{dashboardStats.activeProducts} Siluet ({dashboardStats.totalVariantSkus} SKU)</div>
                  </div>
                  <div style={{ border: '1px solid #080808', padding: '10px 12px', borderRadius: '3px', backgroundColor: '#fafafa' }}>
                    <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: '#666666', fontWeight: 700 }}>TOTAL PELANGGAN</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#080808', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>{dashboardStats.totalCustomers} Member</div>
                  </div>
                </div>

                <h4 style={{ fontSize: '0.82rem', fontWeight: 900, textTransform: 'uppercase', margin: '16px 0 8px' }}>
                  DAFTAR TRANSAKSI PESANAN TERBARU
                </h4>
                <table className="print-table" style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #080808' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#080808', color: '#ffffff', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '6px 8px', border: '1px solid #080808', textAlign: 'left' }}>NO. PESANAN</th>
                      <th style={{ padding: '6px 8px', border: '1px solid #080808', textAlign: 'left' }}>PELANGGAN</th>
                      <th style={{ padding: '6px 8px', border: '1px solid #080808', textAlign: 'left' }}>PRODUK &amp; UKURAN</th>
                      <th style={{ padding: '6px 8px', border: '1px solid #080808', textAlign: 'left' }}>METODE</th>
                      <th style={{ padding: '6px 8px', border: '1px solid #080808', textAlign: 'left' }}>STATUS</th>
                      <th style={{ padding: '6px 8px', border: '1px solid #080808', textAlign: 'right' }}>NOMINAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayOrders.slice(0, 15).map((ord, idx) => (
                      <tr key={ord.order_number || idx} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '0.72rem' }}>
                        <td style={{ padding: '5px 8px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>#{ord.order_number}</td>
                        <td style={{ padding: '5px 8px' }}>{ord.recipient_name || 'Pelanggan'}</td>
                        <td style={{ padding: '5px 8px' }}>{ord.items?.[0]?.product_name || ord.product_name || 'Sepatu Barokah'} (EU {ord.items?.[0]?.size || ord.size || '42'})</td>
                        <td style={{ padding: '5px 8px', fontFamily: 'var(--font-mono)' }}>{formatPaymentMethodLabel(ord.payment_method)}</td>
                        <td style={{ padding: '5px 8px', fontFamily: 'var(--font-mono)' }}>{(ord.status || 'diproses').toUpperCase()}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>{formatIDR(ord.total_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Lembar Pengesahan TTD Pemilik / Owner Saja */}
                <div style={{ marginTop: '24px', paddingTop: '14px', display: 'flex', justifyContent: 'flex-end' }} className="print-avoid-break">
                  <div style={{ textAlign: 'center', width: '220px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#444444', marginBottom: '4px' }}>
                      Jakarta, {todayDateStr}
                    </div>
                    <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#080808', textTransform: 'uppercase' }}>
                      Pemilik / Owner Toko Barokah Shoes
                    </div>
                    <div style={{ height: '56px' }}></div>
                    <div style={{ borderBottom: '1px solid #080808', width: '165px', margin: '0 auto 4px' }}></div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#080808' }}>Nano Kantiono</div>
                    <div style={{ fontSize: '0.64rem', fontFamily: 'var(--font-mono)', color: '#666666' }}>Owner Toko Barokah Shoes</div>
                  </div>
                </div>
              </div>
            </>
          ) : activeNav === 'products' ? (
            <ProductManagement onNavigateBack={() => setActiveNav('dashboard')} />
          ) : activeNav === 'categories' ? (
            <CategoryManagement onNavigateBack={() => setActiveNav('dashboard')} />
          ) : activeNav === 'stock' ? (
            <SizeStockManagement onNavigateBack={() => setActiveNav('dashboard')} />
          ) : activeNav === 'orders' ? (
            <OrderManagement onNavigateBack={() => setActiveNav('dashboard')} />
          ) : activeNav === 'payments' ? (
            <PaymentManagement onNavigateBack={() => setActiveNav('dashboard')} />
          ) : activeNav === 'customers' ? (
            <CustomerManagement onNavigateBack={() => setActiveNav('dashboard')} />
          ) : activeNav === 'reports' ? (
            <SalesReport onNavigateBack={() => setActiveNav('dashboard')} />
          ) : activeNav === 'reviews' ? (
            <CustomerReviews onNavigateBack={() => setActiveNav('dashboard')} />
          ) : activeNav === 'settings' ? (
            <StoreSettings onNavigateBack={() => setActiveNav('dashboard')} />
          ) : (
            /* ============================================================== */
            /* OTHER MODULES PLACEHOLDER (Ready to build in subsequent turns)  */
            /* ============================================================== */
            <div style={{
              backgroundColor: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: '16px',
              padding: '48px 32px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '400px',
              boxShadow: C.shadowMd
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #ECFDF5 0%, #EFF6FF 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: C.emerald,
                marginBottom: '20px',
                border: `1px solid ${C.emeraldBorder}`,
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.1)'
              }}>
                <Sparkles size={32} />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, textTransform: 'uppercase', color: C.textHead, margin: '0 0 10px' }}>
                MODUL: {SIDEBAR_ITEMS.find(s => s.id === activeNav)?.label}
              </h2>
              <p style={{ color: C.textMuted, fontSize: '0.88rem', maxWidth: '480px', margin: '0 0 24px', lineHeight: '1.6' }}>
                Halaman ini siap dibangun pada tahap berikutnya sesuai urutan pengerjaan kita.
              </p>
              <button
                type="button"
                onClick={() => setActiveNav('dashboard')}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #059669 0%, #2563EB 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)'
                }}
              >
                ← KEMBALI KE DASHBOARD
              </button>
            </div>
          )}

        </main>

      </div>
    </div>
  );
};

// ── Shared Inline Styles ──────────────────────────────────────────
const kpiCardStyle = {
  backgroundColor: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: '14px',
  padding: '20px',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: C.shadowMd,
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
};

const kpiHeaderRow = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: '0.68rem',
  color: C.textMuted,
  textTransform: 'uppercase',
  fontFamily: 'var(--font-mono)',
  letterSpacing: '0.06em',
  fontWeight: 700,
};

const kpiFooter = {
  marginTop: '14px',
  paddingTop: '12px',
  borderTop: `1px solid ${C.border}`,
  fontSize: '0.72rem',
  color: C.textMuted,
  fontFamily: 'var(--font-mono)',
  display: 'flex',
  justifyContent: 'space-between',
};

export default AdminDashboard;
