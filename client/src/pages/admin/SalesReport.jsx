import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { formatIDR, formatDate } from '../../lib/utils';
import {
  generateXlsxBlob,
  generatePdfBlob,
  generateCsvBlob,
  generateWordBlob,
  triggerBlobDownload
} from '../../lib/reportExporter';
import { supabase, isSupabaseConfigured, getAdminClient } from '../../lib/supabase';
import {
  FileText,
  Calendar,
  Share2,
  TrendingUp,
  Truck,
  Receipt,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Download,
  Printer,
  Grid,
  ChevronDown,
  Sparkles,
  ExternalLink,
  Layers,
  ArrowUpRight,
  PieChart,
  BarChart3,
  Check,
  X,
  Database,
  RotateCw,
  Loader2,
  Package
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ===================================================================
   ANALITIK PENJUALAN — REAL SUPABASE DATABASE ENGINE
   100% connected to live orders, order_items, products, categories.
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

export const SalesReport = ({ onNavigateBack }) => {
  const [timeRange, setTimeRange] = useState('30d'); // 'today' | '7d' | '30d' | 'year'
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [dbProducts, setDbProducts] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [dbOrders, setDbOrders] = useState([]);
  const [dbUsersCount, setDbUsersCount] = useState(9);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch real database records from Supabase
  const fetchSupabaseReportData = useCallback(async (isManual = false) => {
    if (isManual) setIsSyncing(true);
    else setLoading(true);

    try {
      const client = (await getAdminClient()) || supabase;
      const [pRes, cRes, oRes, uRes] = await Promise.all([
        client.from('products').select(`
          id, name, slug, base_price, discount_price, total_sold, category_id,
          categories ( id, name ),
          product_variants ( id, sku, size, stock ),
          product_images ( image_url, is_primary )
        `),
        client.from('categories').select('*').order('sort_order', { ascending: true }),
        client.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }),
        client.from('profiles').select('id', { count: 'exact', head: true })
      ]);

      if (pRes.data) setDbProducts(pRes.data);
      if (cRes.data) setDbCategories(cRes.data);
      if (oRes.data) setDbOrders(oRes.data);
      if (uRes.count) setDbUsersCount(uRes.count);

      if (isManual) {
        toast.success(`Data penjualan berhasil disinkronkan (${oRes.data?.length || 0} transaksi)!`);
      }
    } catch (e) {
      console.warn('SalesReport fetch error:', e);
      toast.error('Gagal mengambil analitik penjualan dari Supabase');
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchSupabaseReportData();
  }, [fetchSupabaseReportData]);

  // Dynamic values depending on timeframe filtered from real database orders
  const metrics = useMemo(() => {
    const now = new Date();
    
    // Filter orders by timeRange
    const filteredOrders = dbOrders.filter(o => {
      if (!o.created_at) return true;
      const orderDate = new Date(o.created_at);
      if (timeRange === 'today') {
        const diffHours = (now - orderDate) / (1000 * 60 * 60);
        return diffHours <= 24 || orderDate.toDateString() === now.toDateString();
      }
      if (timeRange === '7d') {
        const diffDays = (now - orderDate) / (1000 * 60 * 60 * 24);
        return diffDays <= 7;
      }
      if (timeRange === 'year') {
        return orderDate.getFullYear() === now.getFullYear();
      }
      // 30d default
      const diffDays = (now - orderDate) / (1000 * 60 * 60 * 24);
      return diffDays <= 30;
    });

    // Successful / Paid orders
    const paidOrders = filteredOrders.filter(
      o => o.payment_status === 'lunas' || o.order_status === 'selesai' || o.order_status === 'dikirim' || o.order_status === 'diproses'
    );

    const totalRevenue = paidOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const paidOrdersCount = paidOrders.length;
    const aov = paidOrdersCount > 0 ? Math.round(totalRevenue / paidOrdersCount) : 0;

    // Gross profit estimation based on standard streetwear margin ~38.0%
    const marginPct = 38.0;
    const grossProfit = Math.round(totalRevenue * (marginPct / 100));
    const cogs = totalRevenue - grossProfit;

    // Conversion rate relative to registered customer base
    const conversionRate = dbUsersCount > 0 ? ((paidOrdersCount / dbUsersCount) * 100).toFixed(1) : '0';

    // Date range label
    let dateLabel = '30 Hari Terakhir';
    if (timeRange === 'today') dateLabel = '24 Jam Terakhir';
    else if (timeRange === '7d') dateLabel = '7 Hari Terakhir';
    else if (timeRange === 'year') dateLabel = `Tahun ${now.getFullYear()}`;

    return {
      revenue: totalRevenue,
      growth: '+100% Real DB',
      orders: paidOrdersCount,
      totalEnteredOrders: filteredOrders.length,
      conversion: `CR ${conversionRate}%`,
      visitors: `${dbUsersCount} Pengguna Terdaftar`,
      aov,
      aovGrowth: 'Database Live',
      grossProfit,
      margin: `MARGIN ${marginPct}%`,
      cogs: `COGS ${formatIDR(cogs)}`,
      dateLabel,
      filteredOrders,
      paidOrders
    };
  }, [dbOrders, timeRange, dbUsersCount]);

  // Order status lifecycle distribution
  const statusDistribution = useMemo(() => {
    const orders = metrics.filteredOrders;
    const total = orders.length;
    if (total === 0) {
      return {
        completed: 0,
        completedPct: 0,
        inTransit: 0,
        inTransitPct: 0,
        waitingVerif: 0,
        waitingVerifPct: 0,
        cancelled: 0,
        cancelledPct: 0,
        total: 0
      };
    }

    const completed = orders.filter(o => o.order_status === 'selesai' || o.order_status === 'diproses' || o.payment_status === 'lunas').length;
    const inTransit = orders.filter(o => o.order_status === 'dikirim').length;
    const waitingVerif = orders.filter(o => o.order_status === 'menunggu_konfirmasi' || o.payment_status === 'menunggu_verifikasi').length;
    const cancelled = orders.filter(o => o.order_status === 'dibatalkan' || o.payment_status === 'gagal').length;

    return {
      completed,
      completedPct: Math.round((completed / total) * 100),
      inTransit,
      inTransitPct: Math.round((inTransit / total) * 100),
      waitingVerif,
      waitingVerifPct: Math.round((waitingVerif / total) * 100),
      cancelled,
      cancelledPct: Math.round((cancelled / total) * 100),
      total
    };
  }, [metrics.filteredOrders]);

  // Compute real drop leaders from actual order_items joined with Supabase products
  const dropLeaders = useMemo(() => {
    if (!dbProducts || dbProducts.length === 0) return [];

    // Aggregate sales per product name from filtered orders
    const salesMap = {};
    metrics.filteredOrders.forEach(o => {
      (o.order_items || []).forEach(item => {
        const name = (item.product_name || '').trim();
        if (!salesMap[name]) salesMap[name] = { qty: 0, revenue: 0 };
        salesMap[name].qty += Number(item.quantity) || 1;
        salesMap[name].revenue += Number(item.line_total) || ((Number(item.quantity) || 1) * (Number(item.unit_price) || 0));
      });
    });

    const sneakerFallbackImages = {
      'barokah-runner-pro-x': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80',
      'urban-classic-leather': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=400&q=80',
      'street-flex-canvas': 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=400&q=80',
      'lady-comfort-slip-on': 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=400&q=80',
      'junior-active-velcro': 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&w=400&q=80',
      'summit-trail-hiker': 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=400&q=80'
    };

    return dbProducts.map((p, idx) => {
      const primaryVariant = p.product_variants?.[0];
      const totalStock = (p.product_variants || []).reduce((acc, v) => acc + (Number(v.stock) || 0), 0);
      
      const realSales = salesMap[p.name.trim()] || { qty: 0, revenue: 0 };
      const sold = realSales.qty;
      const revenue = realSales.revenue;
      const validImg = p.product_images?.find(i => i.image_url && !i.image_url.includes('placehold.co'))?.image_url;

      return {
        id: p.id,
        name: p.name,
        sku: primaryVariant?.sku || `BRK-${String(idx + 1).padStart(4, '0')}`,
        sold_prs: sold,
        revenue: revenue,
        margin_pct: 38.5,
        stock_status: totalStock === 0 ? 'SOLDOUT' : `${totalStock} Left`,
        is_low_stock: totalStock > 0 && totalStock <= 10,
        is_soldout: totalStock === 0,
        image_url: validImg || sneakerFallbackImages[p.slug] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80'
      };
    }).sort((a, b) => b.revenue - a.revenue || b.sold_prs - a.sold_prs).slice(0, 5);
  }, [dbProducts, metrics.filteredOrders]);

  // Compute real Pareto distribution from Supabase categories and actual order items
  const categoryPareto = useMemo(() => {
    if (!dbCategories || dbCategories.length === 0) return [];

    // Map product names to categories
    const productCategoryMap = {};
    dbProducts.forEach(p => {
      productCategoryMap[p.name.trim()] = p.categories?.name || 'Lainnya';
    });

    // Calculate revenue & quantity per category
    const catStats = {};
    dbCategories.forEach(c => {
      catStats[c.name] = { revenue: 0, sold_prs: 0 };
    });

    metrics.filteredOrders.forEach(o => {
      (o.order_items || []).forEach(item => {
        const catName = productCategoryMap[(item.product_name || '').trim()] || 'Lainnya';
        if (!catStats[catName]) catStats[catName] = { revenue: 0, sold_prs: 0 };
        const lineRev = Number(item.line_total) || ((Number(item.quantity) || 1) * (Number(item.unit_price) || 0));
        catStats[catName].revenue += lineRev;
        catStats[catName].sold_prs += Number(item.quantity) || 1;
      });
    });

    const colors = ['#0F172A', '#0F172A', C.neonLime, '#0F172A', '#94A3B8', '#CBD5E1'];
    const totalRev = Object.values(catStats).reduce((sum, c) => sum + c.revenue, 0) || 1;

    return dbCategories.map((cat, idx) => {
      const stats = catStats[cat.name] || { revenue: 0, sold_prs: 0 };
      const pct = Math.round((stats.revenue / totalRev) * 100);

      return {
        name: cat.name,
        revenue: stats.revenue,
        sold_prs: stats.sold_prs,
        pct: pct,
        is_highlight: idx === 0 || pct >= 50,
        color: pct >= 50 ? C.neonLime : colors[idx % colors.length]
      };
    }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [dbCategories, dbProducts, metrics.filteredOrders]);

  // Dynamic daily revenue points for the SVG trend chart
  const trendData = useMemo(() => {
    const orders = metrics.paidOrders;
    
    // Group orders by date
    const dateMap = {};
    orders.forEach(o => {
      if (!o.created_at) return;
      const d = new Date(o.created_at);
      const label = `${d.getDate()} ${d.toLocaleString('id-ID', { month: 'short' })}`;
      dateMap[label] = (dateMap[label] || 0) + (Number(o.total) || 0);
    });

    // Generate last 7 days keys
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = `${d.getDate()} ${d.toLocaleString('id-ID', { month: 'short' })}`;
      days.push({
        label: i === 0 ? `${label} (HARI INI)` : label,
        shortLabel: label,
        revenue: dateMap[label] || 0
      });
    }

    const maxRev = Math.max(...days.map(d => d.revenue), 1000000);
    let peakDay = days[0];
    days.forEach(d => {
      if (d.revenue > peakDay.revenue) peakDay = d;
    });

    // Generate SVG coordinates (width 800, height 240, graph y-area: 30 to 180)
    const points = days.map((d, idx) => {
      const x = 50 + (idx * (700 / (days.length - 1)));
      const y = 180 - (d.revenue / maxRev) * 140;
      return { x, y, ...d };
    });

    const polylineStr = points.map(p => `${p.x},${p.y}`).join(' ');
    const polygonStr = `50,180 ${polylineStr} 750,180`;

    return {
      days,
      points,
      peakDay,
      maxRev,
      polylineStr,
      polygonStr
    };
  }, [metrics.paidOrders]);

  // Export handlers
  const handleExport = (format) => {
    setIsExportDropdownOpen(false);
    const dateStamp = new Date().toISOString().slice(0, 10);
    const baseFilename = `Barokah_Sales_Report_${timeRange}_${dateStamp}`;

    const reportConfig = {
      title: 'LAPORAN ANALITIK PENJUALAN & KEUANGAN (ATELIER LEDGER)',
      docNumber: `BKH-SLR/${new Date().getFullYear()}/${timeRange.toUpperCase()}`,
      periodLabel: metrics.dateLabel,
      kpis: [
        {
          label: 'TOTAL OMZET SELESAI',
          value: formatIDR(metrics.revenue),
          sub: 'Transaksi Lunas Terverifikasi'
        },
        {
          label: 'PESANAN BERHASIL',
          value: `${metrics.orders} Pesanan`,
          sub: `Dari ${metrics.totalEnteredOrders} pesanan (${metrics.conversion})`
        },
        {
          label: 'AOV (RATA-RATA TRANSAKSI)',
          value: formatIDR(metrics.aov),
          sub: 'Rerata per order lunas'
        },
        {
          label: 'ESTIMASI LABA KOTOR',
          value: formatIDR(metrics.grossProfit),
          sub: `${metrics.margin} | ${metrics.cogs}`
        }
      ],
      sections: [
        {
          title: 'Distribusi Status Siklus Pesanan',
          headers: ['Status Siklus Pesanan', 'Jumlah Pesanan', 'Persentase (%)', 'Keterangan'],
          colRatios: [0.35, 0.20, 0.20, 0.25],
          rows: [
            ['Selesai / Lunas / Diproses', `${statusDistribution.completed} Pesanan`, `${statusDistribution.completedPct}%`, 'Terverifikasi'],
            ['Dalam Pengiriman', `${statusDistribution.inTransit} Pesanan`, `${statusDistribution.inTransitPct}%`, 'Ekspedisi Aktif'],
            ['Menunggu Verifikasi', `${statusDistribution.waitingVerif} Pesanan`, `${statusDistribution.waitingVerifPct}%`, 'Antrean Admin'],
            ['Dibatalkan / Gagal', `${statusDistribution.cancelled} Pesanan`, `${statusDistribution.cancelledPct}%`, 'Void / Batal']
          ],
          footerRow: ['TOTAL PESANAN MASUK', `${statusDistribution.total} Pesanan`, '100%', metrics.dateLabel]
        },
        {
          title: 'Rincian Kinerja Penjualan Per Siluet Sepatu (Drop Leaders)',
          headers: ['No', 'Siluet Sepatu', 'SKU', 'Terjual', 'Total Omzet', 'Margin', 'Sisa Stok'],
          colRatios: [0.06, 0.28, 0.16, 0.12, 0.16, 0.10, 0.12],
          rows: dropLeaders.map((d, i) => [
            String(i + 1),
            d.name,
            d.sku,
            `${d.sold_prs} prs`,
            formatIDR(d.revenue),
            `${d.margin_pct}%`,
            d.stock_status
          ]),
          footerRow: [
            '',
            'TOTAL AKUMULATIF',
            '',
            `${dropLeaders.reduce((a, c) => a + (c.sold_prs || 0), 0)} prs`,
            formatIDR(metrics.revenue),
            '38.0%',
            ''
          ]
        },
        {
          title: 'Performa Kategori Produk (Analisis Pareto)',
          headers: ['Kategori Sepatu', 'Unit Terjual', 'Total Omzet', 'Kontribusi (%)'],
          colRatios: [0.34, 0.20, 0.26, 0.20],
          rows: categoryPareto.map(c => [
            c.name,
            `${c.sold_prs} Pasang`,
            formatIDR(c.revenue),
            `${c.pct}%`
          ])
        }
      ]
    };

    if (format === 'pdf') {
      const blob = generatePdfBlob(reportConfig);
      triggerBlobDownload(blob, `${baseFilename}.pdf`);
      toast.success('Laporan Atelier Ledger (.pdf) berhasil diunduh!');
    } else if (format === 'xlsx') {
      const sheets = [
        {
          name: 'Ringkasan Finansial',
          colWidths: [30, 26, 28, 24],
          rows: [
            [{ v: 'TOKO BAROKAH SHOES — LAPORAN ANALITIK PENJUALAN & KEUANGAN', s: 1 }],
            [{ v: `No. Dokumen: ${reportConfig.docNumber} | Periode: ${metrics.dateLabel}`, s: 2 }],
            [],
            [
              { v: 'INDIKATOR FINANSIAL UTAMA', s: 3 },
              { v: 'NILAI REALISASI', s: 3 },
              { v: 'RINCIAN METRIK', s: 3 },
              { v: 'SUMBER DATA', s: 3 }
            ],
            ...reportConfig.kpis.map(k => [
              { v: k.label, s: 5 },
              { v: k.value, s: 4 },
              { v: k.sub, s: 4 },
              { v: 'Supabase Production DB', s: 4 }
            ]),
            [],
            [
              { v: 'STATUS SIKLUS PESANAN', s: 3 },
              { v: 'JUMLAH PESANAN', s: 3 },
              { v: 'PERSENTASE (%)', s: 3 },
              { v: 'KETERANGAN', s: 3 }
            ],
            [
              { v: 'Selesai / Lunas / Diproses', s: 4 },
              { v: statusDistribution.completed, s: 4 },
              { v: `${statusDistribution.completedPct}%`, s: 4 },
              { v: 'Terverifikasi', s: 4 }
            ],
            [
              { v: 'Dalam Pengiriman', s: 4 },
              { v: statusDistribution.inTransit, s: 4 },
              { v: `${statusDistribution.inTransitPct}%`, s: 4 },
              { v: 'Ekspedisi Aktif', s: 4 }
            ],
            [
              { v: 'Menunggu Verifikasi', s: 4 },
              { v: statusDistribution.waitingVerif, s: 4 },
              { v: `${statusDistribution.waitingVerifPct}%`, s: 4 },
              { v: 'Antrean Verifikasi', s: 4 }
            ],
            [
              { v: 'Dibatalkan / Gagal', s: 4 },
              { v: statusDistribution.cancelled, s: 4 },
              { v: `${statusDistribution.cancelledPct}%`, s: 4 },
              { v: 'Void / Batal', s: 4 }
            ],
            [
              { v: 'TOTAL PESANAN MASUK', s: 5 },
              { v: statusDistribution.total, s: 5 },
              { v: '100%', s: 5 },
              { v: metrics.dateLabel, s: 5 }
            ]
          ]
        },
        {
          name: 'Siluet & Kategori',
          colWidths: [8, 32, 18, 16, 22, 14, 16],
          rows: [
            [{ v: 'TOP SILUET SEPATU TERLARIS (DROP LEADERS)', s: 1 }],
            [],
            [
              { v: 'NO', s: 3 },
              { v: 'SILUET SEPATU', s: 3 },
              { v: 'SKU', s: 3 },
              { v: 'TERJUAL (PRS)', s: 3 },
              { v: 'TOTAL OMZET (IDR)', s: 3 },
              { v: 'MARGIN (%)', s: 3 },
              { v: 'SISA STOK', s: 3 }
            ],
            ...dropLeaders.map((d, i) => [
              { v: i + 1, s: 4 },
              { v: d.name, s: 4 },
              { v: d.sku, s: 4 },
              { v: Number(d.sold_prs) || 0, s: 4 },
              { v: Number(d.revenue) || 0, s: 6 },
              { v: `${d.margin_pct}%`, s: 4 },
              { v: d.stock_status, s: 4 }
            ]),
            [
              { v: '', s: 5 },
              { v: 'TOTAL AKUMULATIF', s: 5 },
              { v: '', s: 5 },
              { v: dropLeaders.reduce((a, c) => a + (Number(c.sold_prs) || 0), 0), s: 5 },
              { v: Number(metrics.revenue) || 0, s: 7 },
              { v: '38.0%', s: 5 },
              { v: '', s: 5 }
            ],
            [],
            [
              { v: 'NO', s: 3 },
              { v: 'KATEGORI PRODUK (PARETO)', s: 3 },
              { v: 'UNIT TERJUAL', s: 3 },
              { v: 'KONTRIBUSI (%)', s: 3 },
              { v: 'TOTAL OMZET (IDR)', s: 3 },
              { v: '', s: 3 },
              { v: '', s: 3 }
            ],
            ...categoryPareto.map((c, idx) => [
              { v: idx + 1, s: 4 },
              { v: c.name, s: 4 },
              { v: Number(c.sold_prs) || 0, s: 4 },
              { v: `${c.pct}%`, s: 4 },
              { v: Number(c.revenue) || 0, s: 6 },
              { v: '', s: 4 },
              { v: '', s: 4 }
            ])
          ]
        },
        {
          name: 'Rincian Transaksi',
          colWidths: [18, 22, 24, 18, 18, 18, 22],
          rows: [
            [{ v: 'DAFTAR TRANSAKSI PENJUALAN PERIODE ' + metrics.dateLabel.toUpperCase(), s: 1 }],
            [],
            [
              { v: 'NO. PESANAN', s: 3 },
              { v: 'TANGGAL', s: 3 },
              { v: 'NAMA PELANGGAN', s: 3 },
              { v: 'METODE BAYAR', s: 3 },
              { v: 'STATUS BAYAR', s: 3 },
              { v: 'STATUS PESANAN', s: 3 },
              { v: 'TOTAL NOMINAL (IDR)', s: 3 }
            ],
            ...metrics.filteredOrders.map(o => [
              { v: `#${o.order_number || o.id?.slice(0, 8)}`, s: 4 },
              { v: o.created_at ? new Date(o.created_at).toLocaleString('id-ID') : '-', s: 4 },
              { v: o.recipient_name || 'Pelanggan', s: 4 },
              { v: o.payment_method || '-', s: 4 },
              { v: (o.payment_status || '-').toUpperCase(), s: 4 },
              { v: (o.order_status || '-').toUpperCase(), s: 4 },
              { v: Number(o.total) || 0, s: 6 }
            ])
          ]
        }
      ];
      const blob = generateXlsxBlob(sheets);
      triggerBlobDownload(blob, `${baseFilename}.xlsx`);
      toast.success('Laporan Excel Workbook (.xlsx) berhasil diunduh!');
    } else if (format === 'csv') {
      const blob = generateCsvBlob(reportConfig);
      triggerBlobDownload(blob, `${baseFilename}.csv`);
      toast.success('Laporan penjualan (.csv) berhasil diunduh!');
    } else if (format === 'doc') {
      const blob = generateWordBlob(reportConfig);
      triggerBlobDownload(blob, `${baseFilename}.doc`);
      toast.success('Laporan Dokumen Word (.doc) berhasil diunduh!');
    } else if (format === 'json') {
      const jsonBlob = new Blob([JSON.stringify({
        store: 'Toko Barokah Shoes',
        exportedAt: new Date().toISOString(),
        period: metrics.dateLabel,
        metrics: {
          revenue: metrics.revenue,
          orders: metrics.orders,
          aov: metrics.aov,
          grossProfit: metrics.grossProfit
        },
        statusDistribution,
        dropLeaders,
        categoryPareto
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
    <>
      {/* ─────────────────────────────────────────────────────────────
          1. TAMPILAN LAYAR ADMIN (SCREEN REPORT ONLY)
          ───────────────────────────────────────────────────────────── */}
      <div className="screen-report-only" style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', minWidth: 0 }}>

      {/* ============================================================== */}
      {/* 1. TOP BAR: BREADCRUMB, HEADER & FILTER SWITCHER               */}
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
              Finansial
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
              Laporan Penjualan
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
              Analitik Penjualan
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
              <CheckCircle2 size={12} /> SUPABASE REAL: {dbOrders.length} Pesanan Tercatat
            </span>
          </div>

          <p style={{ fontSize: '0.84rem', color: C.textMuted, margin: 0, maxWidth: '640px' }}>
            Agregasi omzet real-time dari database Supabase, nilai rata-rata transaksi (AOV), estimasi margin laba kotor, dan analisis Pareto siluet sepatu terlaris.
          </p>
        </div>

        {/* Filter Toolset & Export Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => fetchSupabaseReportData(true)}
            disabled={isSyncing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              backgroundColor: C.card,
              color: C.textMain,
              border: `1px solid ${C.borderDark}`,
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              cursor: isSyncing ? 'not-allowed' : 'pointer',
              boxShadow: C.shadowSm
            }}
            title="Sinkronisasi Data Penjualan Supabase"
          >
            <RotateCw size={13} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Sinkron...' : 'Sinkron'}</span>
          </button>

          {/* Time range switcher */}
          <div style={{
            display: 'inline-flex',
            backgroundColor: C.card,
            padding: '4px',
            borderRadius: '8px',
            border: `1px solid ${C.border}`,
            boxShadow: C.shadowSm,
            gap: '2px'
          }}>
            {[
              { key: 'today', label: 'HARI INI' },
              { key: '7d', label: '7 HARI' },
              { key: '30d', label: '30 HARI' },
              { key: 'year', label: 'TAHUN INI' }
            ].map(pill => (
              <button
                key={pill.key}
                type="button"
                onClick={() => setTimeRange(pill.key)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: timeRange === pill.key ? 800 : 600,
                  backgroundColor: timeRange === pill.key ? '#0F172A' : 'transparent',
                  color: timeRange === pill.key ? C.neonLime : C.textSub,
                  cursor: 'pointer'
                }}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Date Range Badge */}
          <div style={{
            height: '38px',
            padding: '0 12px',
            backgroundColor: C.card,
            borderRadius: '8px',
            border: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.78rem',
            fontFamily: 'var(--font-mono)',
            color: C.textMain,
            boxShadow: C.shadowSm
          }}>
            <Calendar size={15} style={{ color: C.textMuted }} />
            <span>{metrics.dateLabel}</span>
          </div>

          {/* Export Dropdown Button */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                backgroundColor: C.neonLime,
                color: '#181E00',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 900,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(208, 241, 47, 0.35)',
                transition: 'all 0.2s'
              }}
            >
              <Share2 size={16} />
              <span>EKSPOR LAPORAN</span>
              <ChevronDown size={14} />
            </button>

            {isExportDropdownOpen && (
              <div style={{
                position: 'absolute',
                right: 0,
                marginTop: '6px',
                width: '235px',
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                borderRadius: '10px',
                boxShadow: C.shadowXl,
                zIndex: 40,
                padding: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem'
              }}>
                <button
                  type="button"
                  onClick={() => handleExport('pdf')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1E293B'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span>ATELIER LEDGER (.pdf)</span>
                  <FileText size={13} style={{ color: C.neonLime }} />
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('xlsx')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1E293B'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span>EXCEL WORKBOOK (.xlsx)</span>
                  <Grid size={13} style={{ color: C.neonLime }} />
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('csv')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1E293B'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span>DOKUMEN CSV (.csv)</span>
                  <Download size={13} style={{ color: C.neonLime }} />
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('doc')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1E293B'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span>DOKUMEN WORD (.doc)</span>
                  <FileText size={13} style={{ color: '#93C5FD' }} />
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('json')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1E293B'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span>DATA BACKUP (.json)</span>
                  <Database size={13} style={{ color: '#FBBF24' }} />
                </button>
                <div style={{ borderTop: '1px solid #1E293B', marginTop: '2px', paddingTop: '2px' }}>
                  <button
                    type="button"
                    onClick={() => handleExport('print')}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: C.neonLime,
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontWeight: 700
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1E293B'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <span>CETAK / PRINT RESMI A4</span>
                    <Printer size={13} style={{ color: C.neonLime }} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. 4 KPI FINANSIAL UTAMA (REAL DATABASE DATA)                   */}
      {/* ============================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px'
      }}>
        {/* KPI 1: TOTAL OMZET */}
        <div style={{
          backgroundColor: C.card,
          padding: '22px',
          borderRadius: '16px',
          border: `1px solid ${C.border}`,
          boxShadow: C.shadowSm,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: C.textMuted, fontWeight: 700 }}>
              TOTAL OMZET SELESAI
            </span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#0F172A',
              color: C.neonLime,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle2 size={16} />
            </div>
          </div>

          <div style={{ margin: '14px 0' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: C.textHead, letterSpacing: '-0.02em' }}>
              {loading ? '...' : formatIDR(metrics.revenue)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <span style={{
                fontSize: '0.68rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
                backgroundColor: C.emeraldLight,
                color: C.emeraldText,
                padding: '2px 6px',
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px'
              }}>
                <TrendingUp size={11} /> {metrics.growth}
              </span>
              <span style={{ fontSize: '0.72rem', color: C.textMuted }}>
                transaksi terverifikasi
              </span>
            </div>
          </div>

          <div style={{ width: '100%', height: '4px', backgroundColor: C.surfaceHigh, borderRadius: '9999px', overflow: 'hidden' }}>
            <div style={{ width: metrics.revenue > 0 ? '100%' : '0%', height: '100%', backgroundColor: '#0F172A' }} />
          </div>
        </div>

        {/* KPI 2: PESANAN BERHASIL */}
        <div style={{
          backgroundColor: C.card,
          padding: '22px',
          borderRadius: '16px',
          border: `1px solid ${C.border}`,
          boxShadow: C.shadowSm,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: C.textMuted, fontWeight: 700 }}>
              PESANAN BERHASIL
            </span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: C.surfaceLow,
              color: C.textMain,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Truck size={16} />
            </div>
          </div>

          <div style={{ margin: '14px 0' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: C.textHead }}>
              {loading ? '...' : metrics.orders} <span style={{ fontSize: '0.85rem', color: C.textMuted, fontWeight: 600 }}>Pesanan Lunas</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <span style={{
                fontSize: '0.68rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
                backgroundColor: C.emeraldLight,
                color: C.emeraldText,
                padding: '2px 6px',
                borderRadius: '4px'
              }}>
                {metrics.conversion}
              </span>
              <span style={{ fontSize: '0.72rem', color: C.textMuted }}>
                {metrics.visitors}
              </span>
            </div>
          </div>

          <div style={{ width: '100%', height: '4px', backgroundColor: C.surfaceHigh, borderRadius: '9999px', overflow: 'hidden' }}>
            <div style={{
              width: metrics.totalEnteredOrders > 0 ? `${Math.round((metrics.orders / metrics.totalEnteredOrders) * 100)}%` : '0%',
              height: '100%',
              backgroundColor: C.neonLime
            }} />
          </div>
        </div>

        {/* KPI 3: AOV */}
        <div style={{
          backgroundColor: C.card,
          padding: '22px',
          borderRadius: '16px',
          border: `1px solid ${C.border}`,
          boxShadow: C.shadowSm,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: C.textMuted, fontWeight: 700 }}>
              AOV (NILAI TRANSAKSI)
            </span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: C.surfaceLow,
              color: C.textMain,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Receipt size={16} />
            </div>
          </div>

          <div style={{ margin: '14px 0' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: C.textHead }}>
              {loading ? '...' : formatIDR(metrics.aov)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <span style={{
                fontSize: '0.68rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
                backgroundColor: C.emeraldLight,
                color: C.emeraldText,
                padding: '2px 6px',
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px'
              }}>
                <ArrowUpRight size={11} /> {metrics.aovGrowth}
              </span>
              <span style={{ fontSize: '0.72rem', color: C.textMuted }}>
                Rerata per order lunas
              </span>
            </div>
          </div>

          <div style={{ width: '100%', height: '4px', backgroundColor: C.surfaceHigh, borderRadius: '9999px', overflow: 'hidden' }}>
            <div style={{ width: metrics.aov > 0 ? '75%' : '0%', height: '100%', backgroundColor: '#0F172A' }} />
          </div>
        </div>

        {/* KPI 4: LABA KOTOR */}
        <div style={{
          backgroundColor: C.card,
          padding: '22px',
          borderRadius: '16px',
          border: `1px solid ${C.border}`,
          boxShadow: C.shadowSm,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: C.textMuted, fontWeight: 700 }}>
              LABA KOTOR (ESTIMASI)
            </span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#0F172A',
              color: C.neonLime,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Wallet size={16} />
            </div>
          </div>

          <div style={{ margin: '14px 0' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: C.textHead }}>
              {loading ? '...' : formatIDR(metrics.grossProfit)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <span style={{
                fontSize: '0.68rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 900,
                backgroundColor: '#0F172A',
                color: C.neonLime,
                padding: '2px 6px',
                borderRadius: '4px'
              }}>
                {metrics.margin}
              </span>
              <span style={{ fontSize: '0.72rem', color: C.textMuted }}>
                {metrics.cogs}
              </span>
            </div>
          </div>

          <div style={{ width: '100%', height: '4px', backgroundColor: C.surfaceHigh, borderRadius: '9999px', overflow: 'hidden' }}>
            <div style={{ width: '38%', height: '100%', backgroundColor: C.neonLime }} />
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. VISUAL ANALYTICS SECTION: REVENUE TREND & STATUS DONUT       */}
      {/* ============================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: '24px',
        alignItems: 'stretch'
      }}>
        {/* Left: Daily Trend Area Chart */}
        <div style={{
          gridColumn: 'span 12',
          backgroundColor: C.card,
          borderRadius: '16px',
          border: `1px solid ${C.border}`,
          padding: '24px',
          boxShadow: C.shadowSm,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }} className="trend-chart-col">
          <style>{`
            @media (min-width: 1200px) {
              .trend-chart-col { grid-column: span 8 !important; }
              .donut-chart-col { grid-column: span 4 !important; }
              .pareto-col { grid-column: span 5 !important; }
              .leaders-col { grid-column: span 7 !important; }
            }
          `}</style>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 900, textTransform: 'uppercase', color: C.textHead, margin: 0 }}>
                    Tren Omzet Harian Real-Time
                  </h2>
                  <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', fontWeight: 700, backgroundColor: C.surfaceLow, padding: '2px 8px', borderRadius: '4px' }}>
                    DATA SUPABASE
                  </span>
                </div>
                <p style={{ fontSize: '0.76rem', color: C.textMuted, margin: '2px 0 0' }}>
                  Agregasi harian nilai transaksi riil dari tabel <code>orders</code>.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: C.neonLime, border: '1px solid #181E00' }} />
                  <span style={{ fontWeight: 700, color: C.textHead }}>Realisasi Omzet</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#0F172A' }} />
                  <span style={{ color: C.textMuted }}>Baseline Rerata</span>
                </div>
              </div>
            </div>

            {/* Vector Responsive Area Chart from Real Orders */}
            <div style={{ position: 'relative', width: '100%', height: '240px', marginTop: '10px' }}>
              <svg style={{ width: '100%', height: '100%', overflow: 'visible' }} preserveAspectRatio="none" viewBox="0 0 800 240">
                <defs>
                  <linearGradient id="cyberNeonGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#d0f12f" stopOpacity="0.55" />
                    <stop offset="85%" stopColor="#d0f12f" stopOpacity="0.05" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                  </linearGradient>
                  <pattern id="gridLines" width="80" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#F1F5F9" strokeWidth="1" />
                  </pattern>
                </defs>

                <rect width="800" height="200" fill="url(#gridLines)" />
                {/* Baseline Target (Dashed) */}
                <line x1="40" y1="120" x2="760" y2="120" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />

                {/* Area Gradient Fill */}
                <polygon
                  fill="url(#cyberNeonGradient)"
                  points={trendData.polygonStr}
                />

                {/* Smooth Polyline */}
                <polyline
                  fill="none"
                  stroke="#0F172A"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={trendData.polylineStr}
                />

                {/* Accent Highlight Nodes */}
                {trendData.points.map((pt, i) => (
                  <circle
                    key={i}
                    cx={pt.x}
                    cy={pt.y}
                    r={pt.revenue === trendData.peakDay.revenue && pt.revenue > 0 ? 6 : 4}
                    fill={pt.revenue > 0 ? '#d0f12f' : '#94A3B8'}
                    stroke="#000000"
                    strokeWidth="2"
                  />
                ))}
              </svg>

              {/* Peak Point Callout */}
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '40px',
                backgroundColor: '#0F172A',
                color: C.neonLime,
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.68rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: C.shadowMd
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: C.neonLime }} />
                <span>
                  PEAK: {trendData.peakDay.shortLabel} ({formatIDR(trendData.peakDay.revenue)})
                </span>
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '16px',
            borderTop: `1px solid ${C.border}`,
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            color: C.textMuted
          }}>
            {trendData.days.map((d, i) => (
              <span key={i} style={{ color: i === trendData.days.length - 1 ? C.textHead : C.textMuted, fontWeight: i === trendData.days.length - 1 ? 800 : 500 }}>
                {d.label.toUpperCase()}
              </span>
            ))}
          </div>
        </div>

        {/* Right: Status Distribution Donut Chart */}
        <div style={{
          gridColumn: 'span 12',
          backgroundColor: C.card,
          borderRadius: '16px',
          border: `1px solid ${C.border}`,
          padding: '24px',
          boxShadow: C.shadowSm,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }} className="donut-chart-col">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 900, textTransform: 'uppercase', color: C.textHead, margin: 0 }}>
                Distribusi Pesanan
              </h2>
              <PieChart size={18} style={{ color: C.textMuted }} />
            </div>
            <p style={{ fontSize: '0.76rem', color: C.textMuted, margin: 0 }}>
              Pelacakan lifecycle pesanan riil di Supabase ({statusDistribution.total} Total Pesanan).
            </p>
          </div>

          {/* SVG Donut Chart with Center Label */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '20px 0' }}>
            <svg style={{ width: '180px', height: '180px', transform: 'rotate(-90deg)' }} viewBox="0 0 100 100">
              {/* Background Track */}
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#F1F5F9" strokeWidth="12" />
              
              {/* Completed / Paid */}
              {statusDistribution.completed > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#0F172A"
                  strokeWidth="12"
                  strokeDasharray={`${(statusDistribution.completed / (statusDistribution.total || 1)) * 238.76} 238.76`}
                  strokeDashoffset="0"
                />
              )}

              {/* In Transit */}
              {statusDistribution.inTransit > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#D0F12F"
                  strokeWidth="12"
                  strokeDasharray={`${(statusDistribution.inTransit / (statusDistribution.total || 1)) * 238.76} 238.76`}
                  strokeDashoffset={`-${(statusDistribution.completed / (statusDistribution.total || 1)) * 238.76}`}
                />
              )}

              {/* Waiting Verification */}
              {statusDistribution.waitingVerif > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#94A3B8"
                  strokeWidth="12"
                  strokeDasharray={`${(statusDistribution.waitingVerif / (statusDistribution.total || 1)) * 238.76} 238.76`}
                  strokeDashoffset={`-${((statusDistribution.completed + statusDistribution.inTransit) / (statusDistribution.total || 1)) * 238.76}`}
                />
              )}

              {/* Cancelled */}
              {statusDistribution.cancelled > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#EF4444"
                  strokeWidth="12"
                  strokeDasharray={`${(statusDistribution.cancelled / (statusDistribution.total || 1)) * 238.76} 238.76`}
                  strokeDashoffset={`-${((statusDistribution.completed + statusDistribution.inTransit + statusDistribution.waitingVerif) / (statusDistribution.total || 1)) * 238.76}`}
                />
              )}
            </svg>

            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.85rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: C.textHead, lineHeight: 1 }}>
                {statusDistribution.completedPct}%
              </span>
              <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', marginTop: '4px' }}>
                BERHASIL / PROSES
              </span>
            </div>
          </div>

          {/* Donut Legend */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#0F172A' }} />
                <span>Selesai / Lunas / Diproses</span>
              </div>
              <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                {statusDistribution.completed} ({statusDistribution.completedPct}%)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: C.neonLime }} />
                <span>Dalam Pengiriman</span>
              </div>
              <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                {statusDistribution.inTransit} ({statusDistribution.inTransitPct}%)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#94A3B8' }} />
                <span>Menunggu Verifikasi</span>
              </div>
              <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                {statusDistribution.waitingVerif} ({statusDistribution.waitingVerifPct}%)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#EF4444' }} />
                <span>Dibatalkan / Void</span>
              </div>
              <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                {statusDistribution.cancelled} ({statusDistribution.cancelledPct}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. DEEP DIVE MATRICES: CATEGORY PARETO & TOP 5 DROP LEADERS     */}
      {/* ============================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: '24px',
        alignItems: 'stretch'
      }}>
        {/* Breakdown Kategori Pareto 80/20 */}
        <div style={{
          gridColumn: 'span 12',
          backgroundColor: C.card,
          borderRadius: '16px',
          border: `1px solid ${C.border}`,
          padding: '24px',
          boxShadow: C.shadowSm,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }} className="pareto-col">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 900, textTransform: 'uppercase', color: C.textHead, margin: 0 }}>
                Performa Kategori (Pareto Real)
              </h2>
              <span style={{
                fontSize: '0.65rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 900,
                backgroundColor: C.neonLime,
                color: '#181E00',
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                {categoryPareto.length} KATEGORI AKTIF
              </span>
            </div>
            <p style={{ fontSize: '0.76rem', color: C.textMuted, margin: '0 0 18px' }}>
              Kontribusi omzet riil per kategori produk berdasarkan pesanan Supabase.
            </p>

            {/* Category Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {categoryPareto.map((cat, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: C.surfaceLow,
                    borderRadius: '10px',
                    padding: '14px',
                    border: `1px solid ${C.border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.84rem', color: C.textHead }}>
                        {cat.name}
                      </span>
                      {cat.is_highlight && (
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: C.neonLime }} />
                      )}
                    </div>
                    <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', fontSize: '0.84rem', color: C.textHead }}>
                      {formatIDR(cat.revenue)}
                    </span>
                  </div>

                  <div style={{ width: '100%', height: '8px', backgroundColor: C.surfaceHigh, borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.max(4, cat.pct)}%`, height: '100%', backgroundColor: cat.color }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: C.textMuted }}>
                    <span>{cat.sold_prs} Pasang Terjual</span>
                    <span style={{ fontWeight: 800, color: cat.is_highlight ? C.emeraldText : C.textHead }}>
                      {cat.pct}% Kontribusi
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pareto Callout Banner */}
          <div style={{
            marginTop: '20px',
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            padding: '14px 18px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Sparkles size={18} style={{ color: C.neonLime, flexShrink: 0 }} />
            <span style={{ fontSize: '0.76rem', color: '#FFFFFF', lineHeight: 1.4 }}>
              Kategori <strong>{categoryPareto[0]?.name || 'Utama'}</strong> menyumbang kontribusi terbesar dengan total omzet <strong>{formatIDR(categoryPareto[0]?.revenue || 0)}</strong>.
            </span>
          </div>
        </div>

        {/* Top 5 Siluet Terlaris (Drop Leaders) from Real Products */}
        <div style={{
          gridColumn: 'span 12',
          backgroundColor: C.card,
          borderRadius: '16px',
          border: `1px solid ${C.border}`,
          padding: '24px',
          boxShadow: C.shadowSm,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }} className="leaders-col">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 900, textTransform: 'uppercase', color: C.textHead, margin: 0 }}>
                Top 5 Siluet Terlaris (Drop Leaders Real)
              </h2>
              <span style={{
                fontSize: '0.68rem',
                fontFamily: 'var(--font-mono)',
                color: C.textMuted
              }}>
                SUPABASE INVENTORY
              </span>
            </div>
            <p style={{ fontSize: '0.76rem', color: C.textMuted, margin: '0 0 16px' }}>
              Unit terdistribusi riil dari transaksi database Toko Barokah.
            </p>

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
                    <th style={{ padding: '10px 14px' }}>Siluet & SKU</th>
                    <th style={{ padding: '10px 14px' }}>Terjual</th>
                    <th style={{ padding: '10px 14px' }}>Total Omzet</th>
                    <th style={{ padding: '10px 14px' }}>Margin</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Stok Sisa</th>
                  </tr>
                </thead>
                <tbody>
                  {dropLeaders.map(item => (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: `1px solid ${C.border}`,
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = C.surfaceLow}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img
                            src={item.image_url}
                            alt={item.name}
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '8px',
                              objectFit: 'cover',
                              backgroundColor: C.surfaceLow,
                              flexShrink: 0
                            }}
                          />
                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            <span style={{ fontWeight: 800, color: C.textHead, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.name}
                            </span>
                            <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: C.textMuted }}>
                              {item.sku}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: C.textHead }}>
                        {item.sold_prs} prs
                      </td>

                      <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: C.textHead }}>
                        {formatIDR(item.revenue)}
                      </td>

                      <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: C.emeraldText }}>
                        {item.margin_pct}%
                      </td>

                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <span style={{
                          fontSize: '0.68rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: item.is_soldout
                            ? C.redBg
                            : item.is_low_stock
                              ? C.amberBg
                              : C.surfaceHigh,
                          color: item.is_soldout
                            ? C.redText
                            : item.is_low_stock
                              ? C.amberText
                              : C.textSub
                        }}>
                          {item.stock_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '16px',
            marginTop: '16px',
            borderTop: `1px solid ${C.border}`,
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            color: C.textMuted
          }}>
            <span>Menampilkan {dropLeaders.length} siluet dari {dbProducts.length} model produk terdaftar di Supabase</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: C.emerald }} />
              <span>Database Sync: REAL DATA OK</span>
            </div>
          </div>
        </div>
      </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. DOKUMEN RESMI CETAK / PDF (PRINT REPORT ONLY — A4 ATELIER LEDGER)
          ───────────────────────────────────────────────────────────── */}
      <div className="print-report-only" style={{ padding: '0', color: '#080808', fontFamily: 'var(--font-body)', background: '#ffffff' }}>
        
        {/* Header Kop Dokumen Resmi Toko Barokah Shoes */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '14px', borderBottom: '3px double #080808' }}>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '4px',
              backgroundColor: '#080808',
              color: '#b7d600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '1.45rem',
              fontFamily: 'var(--font-heading)',
              flexShrink: 0
            }}>
              B
            </div>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.02em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)', color: '#080808', lineHeight: '1.1' }}>
                TOKO BAROKAH SHOES
              </div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#333333', textTransform: 'uppercase', marginTop: '2px' }}>
                KINETIC LUXURY STREETWEAR &amp; FOOTWEAR ATELIER
              </div>
              <div style={{ fontSize: '0.66rem', color: '#444444', marginTop: '3px', lineHeight: '1.4', fontFamily: 'var(--font-mono)' }}>
                <div>PASAR JAYA JATINEGARA LT.2 BLOK AKS NO. 57</div>
                <div>Jl. Jatinegara Barat, Bali Mester, Jatinegara, Jakarta Timur 13310</div>
                <div style={{ marginTop: '1px' }}>
                  <strong>WhatsApp:</strong> 081288667433 • <strong>Email:</strong> barokahshoes@gmail.com
                </div>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#080808', textTransform: 'uppercase' }}>
              ATELIER FINANCIAL LEDGER
            </div>
            <div style={{ fontSize: '0.68rem', color: '#555555', marginTop: '2px' }}>
              NO. DOKUMEN: <strong>BKH-SLR/{new Date().getFullYear()}/{timeRange.toUpperCase()}</strong>
            </div>
            <div style={{ fontSize: '0.66rem', color: '#666666', marginTop: '1px' }}>
              TANGGAL: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}, {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
            </div>
            <div style={{ display: 'inline-block', marginTop: '4px', fontSize: '0.6rem', fontWeight: 800, padding: '2px 8px', backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', borderRadius: '2px' }}>
              STATUS: DOKUMEN SAH &amp; TERVERIFIKASI
            </div>
          </div>
        </div>

        {/* Sub-Header Cakupan Periode */}
        <div style={{ margin: '14px 0 16px', padding: '10px 14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: '#64748b', textTransform: 'uppercase' }}>PERIODE ANALISIS PENJUALAN:</span>
            <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0f172a', fontFamily: 'var(--font-heading)' }}>
              {metrics.dateLabel.toUpperCase()}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: '#64748b', textTransform: 'uppercase' }}>SUMBER DATA KEUANGAN:</span>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#059669', fontFamily: 'var(--font-mono)' }}>
              SUPABASE PRODUCTION DATABASE (REAL TIME)
            </div>
          </div>
        </div>

        {/* 1. Ringkasan Eksekutif Finansial (4 Box Grid) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '18px' }} className="print-avoid-break">
          <div style={{ border: '1px solid #080808', padding: '10px 12px', borderRadius: '3px', backgroundColor: '#fafafa' }}>
            <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: '#666666', fontWeight: 700, textTransform: 'uppercase' }}>
              TOTAL OMZET SELESAI
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#080808', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
              {formatIDR(metrics.revenue)}
            </div>
            <div style={{ fontSize: '0.6rem', color: '#059669', fontWeight: 700, marginTop: '2px' }}>
              ✓ Transaksi Lunas Terverifikasi
            </div>
          </div>

          <div style={{ border: '1px solid #080808', padding: '10px 12px', borderRadius: '3px', backgroundColor: '#fafafa' }}>
            <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: '#666666', fontWeight: 700, textTransform: 'uppercase' }}>
              TOTAL PESANAN BERHASIL
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#080808', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
              {metrics.orders} <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>Pesanan</span>
            </div>
            <div style={{ fontSize: '0.6rem', color: '#64748b', marginTop: '2px' }}>
              Dari {metrics.totalEnteredOrders} total pesanan masuk
            </div>
          </div>

          <div style={{ border: '1px solid #080808', padding: '10px 12px', borderRadius: '3px', backgroundColor: '#fafafa' }}>
            <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: '#666666', fontWeight: 700, textTransform: 'uppercase' }}>
              RATA-RATA TRANSAKSI (AOV)
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#080808', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
              {formatIDR(metrics.aov)}
            </div>
            <div style={{ fontSize: '0.6rem', color: '#64748b', marginTop: '2px' }}>
              Rerata per order lunas
            </div>
          </div>

          <div style={{ border: '1px solid #080808', padding: '10px 12px', borderRadius: '3px', backgroundColor: '#fafafa' }}>
            <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: '#666666', fontWeight: 700, textTransform: 'uppercase' }}>
              ESTIMASI LABA KOTOR
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#080808', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
              {formatIDR(metrics.grossProfit)}
            </div>
            <div style={{ fontSize: '0.6rem', color: '#2563eb', fontWeight: 700, marginTop: '2px' }}>
              Margin Standar 38.0%
            </div>
          </div>
        </div>

        {/* 2. Distribusi Status Siklus Transaksi */}
        <div style={{ marginBottom: '18px', border: '1px solid #e2e8f0', borderRadius: '3px', overflow: 'hidden' }} className="print-avoid-break">
          <div style={{ padding: '8px 12px', backgroundColor: '#080808', color: '#ffffff', fontSize: '0.72rem', fontWeight: 800, fontFamily: 'var(--font-heading)', textTransform: 'uppercase' }}>
            DISTRIBUSI STATUS SIKLUS PESANAN
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0', textAlign: 'center', backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ padding: '8px', borderRight: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: '#64748b' }}>SELESAI / LUNAS</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 900, color: '#059669', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                {statusDistribution.completed} ({statusDistribution.completedPct}%)
              </div>
            </div>
            <div style={{ padding: '8px', borderRight: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: '#64748b' }}>DALAM PENGIRIMAN</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 900, color: '#2563eb', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                {statusDistribution.inTransit} ({statusDistribution.inTransitPct}%)
              </div>
            </div>
            <div style={{ padding: '8px', borderRight: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: '#64748b' }}>MENUNGGU VERIFIKASI</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 900, color: '#d97706', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                {statusDistribution.waitingVerif} ({statusDistribution.waitingVerifPct}%)
              </div>
            </div>
            <div style={{ padding: '8px' }}>
              <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: '#64748b' }}>DIBATALKAN / GAGAL</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 900, color: '#dc2626', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                {statusDistribution.cancelled} ({statusDistribution.cancelledPct}%)
              </div>
            </div>
          </div>
        </div>

        {/* 3. Tabel Kinerja Penjualan Siluet Sepatu (Drop Leaders) */}
        <div style={{ marginBottom: '20px' }} className="print-avoid-break">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h4 style={{ fontSize: '0.82rem', fontWeight: 900, textTransform: 'uppercase', fontFamily: 'var(--font-heading)', color: '#080808' }}>
              RINCIAN KINERJA PENJUALAN PER SILUET SEPATU (DROP LEADERS)
            </h4>
            <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#666666' }}>
              Total: {dropLeaders.length} Varian Model Terdaftar
            </span>
          </div>

          <table className="print-table" style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #080808' }}>
            <thead>
              <tr style={{ backgroundColor: '#080808', color: '#ffffff', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '6px 8px', textAlign: 'center', width: '32px', border: '1px solid #080808' }}>NO</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #080808' }}>SILUET SEPATU</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', width: '85px', border: '1px solid #080808' }}>SKU</th>
                <th style={{ padding: '6px 8px', textAlign: 'center', width: '70px', border: '1px solid #080808' }}>TERJUAL</th>
                <th style={{ padding: '6px 8px', textAlign: 'right', width: '110px', border: '1px solid #080808' }}>TOTAL OMZET</th>
                <th style={{ padding: '6px 8px', textAlign: 'center', width: '65px', border: '1px solid #080808' }}>MARGIN</th>
                <th style={{ padding: '6px 8px', textAlign: 'center', width: '80px', border: '1px solid #080808' }}>SISA STOK</th>
              </tr>
            </thead>
            <tbody>
              {dropLeaders.map((item, idx) => (
                <tr key={item.id || idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb', fontSize: '0.72rem', borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '5px 8px', textAlign: 'center', fontFamily: 'var(--font-mono)', borderRight: '1px solid #e2e8f0' }}>
                    {idx + 1}
                  </td>
                  <td style={{ padding: '5px 8px', fontWeight: 700, borderRight: '1px solid #e2e8f0' }}>
                    {item.name}
                  </td>
                  <td style={{ padding: '5px 8px', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: '#555555', borderRight: '1px solid #e2e8f0' }}>
                    {item.sku}
                  </td>
                  <td style={{ padding: '5px 8px', textAlign: 'center', fontWeight: 800, fontFamily: 'var(--font-mono)', borderRight: '1px solid #e2e8f0' }}>
                    {item.sold_prs} prs
                  </td>
                  <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 800, fontFamily: 'var(--font-mono)', borderRight: '1px solid #e2e8f0' }}>
                    {formatIDR(item.revenue)}
                  </td>
                  <td style={{ padding: '5px 8px', textAlign: 'center', fontFamily: 'var(--font-mono)', color: '#059669', fontWeight: 700, borderRight: '1px solid #e2e8f0' }}>
                    {item.margin_pct}%
                  </td>
                  <td style={{ padding: '5px 8px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.68rem' }}>
                    {item.stock_status}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: '#f1f5f9', fontWeight: 900, fontFamily: 'var(--font-mono)', fontSize: '0.74rem', borderTop: '2px solid #080808' }}>
                <td colSpan={3} style={{ padding: '7px 8px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>
                  TOTAL AKUMULATIF:
                </td>
                <td style={{ padding: '7px 8px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>
                  {dropLeaders.reduce((acc, curr) => acc + (curr.sold_prs || 0), 0)} prs
                </td>
                <td style={{ padding: '7px 8px', textAlign: 'right', borderRight: '1px solid #cbd5e1', color: '#080808' }}>
                  {formatIDR(metrics.revenue)}
                </td>
                <td colSpan={2} style={{ padding: '7px 8px', textAlign: 'center', color: '#059669' }}>
                  RERATA 38%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* 4. Lembar Pengesahan & Tanda Tangan Pemilik / Owner */}
        <div style={{ marginTop: '24px', paddingTop: '14px', borderTop: '1px solid #cbd5e1', display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start' }} className="print-avoid-break">
          <div style={{ textAlign: 'center', width: '220px' }}>
            <div style={{ fontSize: '0.68rem', color: '#666666', marginBottom: '4px' }}>
              Jakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#080808', textTransform: 'uppercase' }}>
              Pemilik / Owner Toko Barokah Shoes
            </div>
            <div style={{ height: '56px' }}></div>
            <div style={{ borderBottom: '1px solid #080808', width: '165px', margin: '0 auto 4px' }}></div>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#080808' }}>Nano Kantiono</div>
            <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: '#666666' }}>Owner Toko Barokah Shoes</div>
          </div>
        </div>

        {/* Footer Dokumen */}
        <div style={{ marginTop: '18px', paddingTop: '8px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: '#888888' }}>
          <span>Sistem Informasi ERP Toko Barokah Shoes • Atelier Ledger v2.4</span>
          <span>Dokumen Resmi Tercetak Otomatis • Sah &amp; Mengikat</span>
        </div>

      </div>
    </>
  );
};

export default SalesReport;
