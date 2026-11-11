import React, { useState, useEffect, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { formatIDR, formatDate, getOrderStatusInfo } from '../../lib/utils';
import {
  ShoppingBag,
  Search,
  Download,
  Printer,
  RotateCw,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  Copy,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Edit3,
  Calendar,
  AlertCircle,
  FileText,
  CreditCard,
  MapPin,
  MessageSquare,
  Package,
  Layers,
  Sparkles,
  ArrowRight,
  Check,
  X,
  Send,
  Barcode
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ===================================================================
   MANAJEMEN PESANAN — ORDER ORCHESTRATION ENGINE (STITCH SPEC)
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

// Helper: parse courier and tracking_number from admin_notes field
// Format stored in admin_notes: "[KURIR: JNE YES | RESI: JKT99281920] Other notes..."
const parseCourierInfo = (adminNotes) => {
  if (!adminNotes) return { courier: 'JNE (Reguler / YES)', tracking_number: '' };
  const match = adminNotes.match(/\[KURIR:\s*([^|\]]+)(?:\|\s*RESI:\s*([^\]]+))?\]/);
  if (match) {
    return {
      courier: match[1]?.trim() || 'JNE (Reguler / YES)',
      tracking_number: match[2]?.trim() || ''
    };
  }
  return { courier: 'JNE (Reguler / YES)', tracking_number: '' };
};

// Helper: map Supabase order row to UI order object
const mapSupabaseOrder = (dbOrd) => {
  const { courier, tracking_number } = parseCourierInfo(dbOrd.admin_notes);
  return {
    id: dbOrd.id,
    order_number: dbOrd.order_number,
    created_at: dbOrd.created_at,
    status: dbOrd.order_status,
    is_hot_drop: dbOrd.order_status === 'diproses' || dbOrd.order_status === 'menunggu_konfirmasi',
    recipient_name: dbOrd.recipient_name,
    recipient_phone: dbOrd.recipient_phone,
    recipient_email: dbOrd.profiles?.email || '',
    is_vip: false,
    shipping_address: dbOrd.shipping_address,
    shipping_city: dbOrd.shipping_city,
    shipping_province: dbOrd.shipping_province,
    shipping_postal_code: dbOrd.shipping_postal_code,
    customer_notes: dbOrd.customer_notes || '',
    admin_notes: dbOrd.admin_notes || '',
    courier,
    tracking_number,
    is_label_printed: !!tracking_number,
    payment_method_label: dbOrd.payment_method === 'transfer_bank' ? 'Transfer Bank'
      : dbOrd.payment_method === 'ewallet' ? 'E-Wallet / QRIS'
      : dbOrd.payment_method === 'cod' ? 'COD (Bayar di Tempat)'
      : 'Transfer Bank',
    payment_account_number: '',
    payment_status: dbOrd.payment_status,
    subtotal: dbOrd.subtotal,
    shipping_cost: dbOrd.shipping_cost,
    shipping_discount: dbOrd.discount_amount,
    voucher_code: '',
    total_amount: dbOrd.total,
    items: (dbOrd.order_items || []).map(it => ({
      id: it.id,
      name: it.product_name,
      colorway: it.color || 'Default',
      sku: it.sku || '-',
      size: it.size,
      quantity: it.quantity,
      price: it.unit_price,
      stock_remaining: null,
      image_url: it.product_image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80'
    })),
    logs: [
      {
        time: new Date(dbOrd.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
        date: new Date(dbOrd.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        title: `Pesanan Dibuat (#${dbOrd.order_number})`,
        actor: dbOrd.profiles?.name || 'Customer',
        is_current: true
      }
    ]
  };
};

// PLACEHOLDER (no longer used - kept for backward compat with filter logic)
const INITIAL_SEED_ORDERS = [
  {
    id: 'ord-seed-01',
    order_number: 'BKH-9842',
    supabase_id: '9b20e-8f',
    created_at: new Date(Date.now() - 35 * 60000).toISOString(),
    status: 'diproses',
    sub_status: 'PICKING',
    is_hot_drop: true,
    recipient_name: 'Dimas Bagus Ramadhan',
    recipient_phone: '+62 812-9921-3990',
    recipient_email: 'dimas.bagus@atelier.id',
    is_vip: true,
    shipping_address: 'Jl. Senopati No. 42, RT 04 / RW 02, Kebayoran Baru',
    shipping_city: 'Jakarta Selatan',
    shipping_province: 'DKI Jakarta',
    shipping_postal_code: '12190',
    customer_notes: 'Titip di pos security jika rumah kosong',
    admin_notes: 'Prioritas batch sore. Box double bubble wrap.',
    courier: 'JNE YES',
    tracking_number: 'JKT99281920',
    is_label_printed: false,
    payment_method_label: 'BCA Virtual Account',
    payment_account_number: '8077 0812 9921 3990',
    payment_status: 'lunas',
    subtotal: 2450000,
    shipping_cost: 28000,
    shipping_discount: 28000,
    voucher_code: 'FREEONGKIR-VIP',
    total_amount: 2450000,
    items: [
      {
        id: 'item-1',
        name: 'Barokah Velocity X',
        colorway: 'Onyx Citron / Electric Yellow',
        sku: 'SKU-VX-0941',
        size: '42',
        quantity: 1,
        price: 2450000,
        stock_remaining: 3,
        image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80'
      }
    ],
    logs: [
      {
        time: '14:25 WIB',
        date: 'Hari Ini',
        title: 'Packing in Progress (Atelier Warehouse)',
        actor: 'Staff: Bayu P.',
        is_current: true
      },
      {
        time: '14:21 WIB',
        date: 'Hari Ini',
        title: 'Payment Verified & Hook Synced',
        actor: 'Midtrans Auto-settlement',
        is_current: false
      },
      {
        time: '14:20 WIB',
        date: 'Hari Ini',
        title: 'Order Created (#BKH-9842)',
        actor: 'Client IP: 182.253.19.42',
        is_current: false
      }
    ]
  },
  {
    id: 'ord-seed-02',
    order_number: 'BKH-9841',
    supabase_id: '8a11d-7c',
    created_at: new Date(Date.now() - 65 * 60000).toISOString(),
    status: 'diproses',
    sub_status: 'SIAP PACKING',
    is_hot_drop: false,
    recipient_name: 'Arya Sena Pratama',
    recipient_phone: '+62 878-1120-4091',
    recipient_email: 'arya.sena@gmail.com',
    is_vip: false,
    shipping_address: 'Jl. Dago Asri No. 18, Kel. Dago, Kec. Coblong',
    shipping_city: 'Kota Bandung',
    shipping_province: 'Jawa Barat',
    shipping_postal_code: '40135',
    customer_notes: '',
    admin_notes: 'Barang sudah dicek QC tanpa cacat.',
    courier: 'SiCepat BEST',
    tracking_number: 'SCP9021882190',
    is_label_printed: false,
    payment_method_label: 'QRIS Gopay',
    payment_account_number: 'ID202510240981',
    payment_status: 'lunas',
    subtotal: 1890000,
    shipping_cost: 22000,
    shipping_discount: 22000,
    voucher_code: 'OCTOBERFEST',
    total_amount: 1890000,
    items: [
      {
        id: 'item-2',
        name: 'Barokah Atelier Retro 90',
        colorway: 'Raw Bone White / Chalk Gray',
        sku: 'SKU-AR-1102',
        size: '44',
        quantity: 1,
        price: 1890000,
        stock_remaining: 7,
        image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=400&q=80'
      }
    ],
    logs: [
      {
        time: '13:55 WIB',
        date: 'Hari Ini',
        title: 'QC Verified & Siap Packing',
        actor: 'Staff: Rudi K.',
        is_current: true
      },
      {
        time: '13:51 WIB',
        date: 'Hari Ini',
        title: 'QRIS Settled Instantly',
        actor: 'Gopay QRIS Gateway',
        is_current: false
      },
      {
        time: '13:50 WIB',
        date: 'Hari Ini',
        title: 'Order Created (#BKH-9841)',
        actor: 'Mobile Browser iOS',
        is_current: false
      }
    ]
  },
  {
    id: 'ord-seed-03',
    order_number: 'BKH-9839',
    supabase_id: '7c99b-4e',
    created_at: new Date(Date.now() - 150 * 60000).toISOString(),
    status: 'diproses',
    sub_status: 'SIAP KIRIM',
    is_hot_drop: false,
    recipient_name: 'Nadya Clarissa',
    recipient_phone: '+62 813-8820-9118',
    recipient_email: 'nadya.clarissa@yahoo.com',
    is_vip: false,
    shipping_address: 'Kertajaya Indah Timur Blok VII No. 12, Gubeng',
    shipping_city: 'Kota Surabaya',
    shipping_province: 'Jawa Timur',
    shipping_postal_code: '60282',
    customer_notes: 'Packing kardus rapat ya kak, buat kado.',
    admin_notes: 'Bonus totebag Barokah Shoes sudah dimasukkan.',
    courier: 'JNE REG',
    tracking_number: 'SUB7712903',
    is_label_printed: true,
    payment_method_label: 'Mandiri Virtual Account',
    payment_account_number: '8890 8138 8209 118',
    payment_status: 'lunas',
    subtotal: 1500000,
    shipping_cost: 32000,
    shipping_discount: 32000,
    voucher_code: 'BAROKAHCARE',
    total_amount: 1500000,
    items: [
      {
        id: 'item-3',
        name: 'Barokah Hydro Slide V2',
        colorway: 'Tonal Onyx Black / Ribbed Sole',
        sku: 'SKU-HS-0021',
        size: '41',
        quantity: 2,
        price: 750000,
        stock_remaining: 14,
        image_url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=400&q=80'
      }
    ],
    logs: [
      {
        time: '12:45 WIB',
        date: 'Hari Ini',
        title: 'Label Resi Dicetak & Siap Pickup Kurir',
        actor: 'Staff: Hendar S.',
        is_current: true
      },
      {
        time: '12:20 WIB',
        date: 'Hari Ini',
        title: 'Payment Cleared',
        actor: 'Bank Mandiri Automated H2H',
        is_current: false
      },
      {
        time: '12:15 WIB',
        date: 'Hari Ini',
        title: 'Order Created (#BKH-9839)',
        actor: 'Web Checkout',
        is_current: false
      }
    ]
  },
  {
    id: 'ord-seed-04',
    order_number: 'BKH-9835',
    supabase_id: '5f44e-1a',
    created_at: new Date(Date.now() - 360 * 60000).toISOString(),
    status: 'menunggu_konfirmasi',
    sub_status: 'VERIFIKASI BUKTI',
    is_hot_drop: true,
    recipient_name: 'Farhan Pratama',
    recipient_phone: '+62 857-1182-4410',
    recipient_email: 'farhan.pratama@outlook.com',
    is_vip: false,
    shipping_address: 'Jl. Kaliurang KM 9.3 No. 45, Ngaglik, Sleman',
    shipping_city: 'Sleman / Yogyakarta',
    shipping_province: 'DI Yogyakarta',
    shipping_postal_code: '55581',
    customer_notes: 'Sudah transfer lewat BCA m-banking kak.',
    admin_notes: 'Menunggu pengecekan mutasi manual dari finance.',
    courier: 'JNE (Reguler / YES)',
    tracking_number: '',
    is_label_printed: false,
    payment_method_label: 'BCA Manual Transfer',
    payment_account_number: 'BCA 801-0982-110 a.n PT Barokah Sepatu',
    payment_status: 'menunggu_verifikasi',
    subtotal: 1850000,
    shipping_cost: 26000,
    shipping_discount: 0,
    voucher_code: '',
    total_amount: 1876000,
    items: [
      {
        id: 'item-4',
        name: 'Royal Oxford Formal Classic',
        colorway: 'Glossy Black / Welted Calfskin',
        sku: 'BS-OXF-002',
        size: '43',
        quantity: 1,
        price: 1850000,
        stock_remaining: 5,
        image_url: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=400&q=80'
      }
    ],
    logs: [
      {
        time: '08:30 WIB',
        date: 'Hari Ini',
        title: 'Bukti Bayar Diunggah (tf_bca_2410.jpg)',
        actor: 'Farhan Pratama',
        is_current: true
      },
      {
        time: '08:24 WIB',
        date: 'Hari Ini',
        title: 'Order Created (#BKH-9835)',
        actor: 'Web Checkout',
        is_current: false
      }
    ]
  },
  {
    id: 'ord-seed-05',
    order_number: 'BKH-9830',
    supabase_id: '4d32c-9b',
    created_at: new Date(Date.now() - 600 * 60000).toISOString(),
    status: 'menunggu_pembayaran',
    sub_status: 'COUNTDOWN 24 JAM',
    is_hot_drop: false,
    recipient_name: 'Indra Gunawan',
    recipient_phone: '+62 821-4402-9988',
    recipient_email: 'indra.g@gmail.com',
    is_vip: false,
    shipping_address: 'Apartemen Sudirman Tower A Lt 15 No 08',
    shipping_city: 'Jakarta Pusat',
    shipping_province: 'DKI Jakarta',
    shipping_postal_code: '10220',
    customer_notes: '',
    admin_notes: '',
    courier: 'GoSend Instant',
    tracking_number: '',
    is_label_printed: false,
    payment_method_label: 'BCA Virtual Account',
    payment_account_number: '8077 0821 4402 9988',
    payment_status: 'belum_dibayar',
    subtotal: 650000,
    shipping_cost: 35000,
    shipping_discount: 0,
    voucher_code: '',
    total_amount: 685000,
    items: [
      {
        id: 'item-5',
        name: 'Barokah Air Legacy Pro',
        colorway: 'Red Alert / White Sport',
        sku: 'BS-AIR-001',
        size: '40',
        quantity: 1,
        price: 650000,
        stock_remaining: 12,
        image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80'
      }
    ],
    logs: [
      {
        time: '04:10 WIB',
        date: 'Hari Ini',
        title: 'Menunggu Transfer Virtual Account',
        actor: 'Payment Gateway VA',
        is_current: true
      },
      {
        time: '04:09 WIB',
        date: 'Hari Ini',
        title: 'Order Created (#BKH-9830)',
        actor: 'Web Checkout',
        is_current: false
      }
    ]
  },
  {
    id: 'ord-seed-06',
    order_number: 'BKH-9824',
    supabase_id: '3b21a-6e',
    created_at: new Date(Date.now() - 1440 * 60000).toISOString(),
    status: 'dikirim',
    sub_status: 'ON DELIVERY',
    is_hot_drop: false,
    recipient_name: 'Budi Santoso',
    recipient_phone: '+62 811-2345-6789',
    recipient_email: 'budi.santoso@gmail.com',
    is_vip: false,
    shipping_address: 'Jl. Pemuda No. 78, Rawamangun',
    shipping_city: 'Jakarta Timur',
    shipping_province: 'DKI Jakarta',
    shipping_postal_code: '13220',
    customer_notes: '',
    admin_notes: 'Dikirim dengan kurir JNE Trucking / Reguler.',
    courier: 'JNE (Reguler / YES)',
    tracking_number: 'JNE0192837461',
    is_label_printed: true,
    payment_method_label: 'BCA Virtual Account',
    payment_account_number: '8077 0811 2345 6789',
    payment_status: 'lunas',
    subtotal: 1299000,
    shipping_cost: 18000,
    shipping_discount: 0,
    voucher_code: '',
    total_amount: 1317000,
    items: [
      {
        id: 'item-6',
        name: 'Timber Nomad Tactical',
        colorway: 'Desert Tan Leather',
        sku: 'TNT-BRN-43',
        size: '43',
        quantity: 1,
        price: 1299000,
        stock_remaining: 4,
        image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=400&q=80'
      }
    ],
    logs: [
      {
        time: '18:00 WIB',
        date: 'Kemarin',
        title: 'Paket Dalam Perjalanan ke Hub Jakarta Timur',
        actor: 'JNE Logistics API',
        is_current: true
      },
      {
        time: '14:20 WIB',
        date: 'Kemarin',
        title: 'Paket Di-pickup Kurir JNE',
        actor: 'Kurir JNE: Ahmad',
        is_current: false
      }
    ]
  },
  {
    id: 'ord-seed-07',
    order_number: 'BKH-9818',
    supabase_id: '2c10f-5a',
    created_at: new Date(Date.now() - 2880 * 60000).toISOString(),
    status: 'selesai',
    sub_status: 'TERKIRIM & DITERIMA',
    is_hot_drop: false,
    recipient_name: 'Siti Rahmawati',
    recipient_phone: '+62 819-0987-1234',
    recipient_email: 'siti.rahma@gmail.com',
    is_vip: false,
    shipping_address: 'Komp. Graha Indah Blok C3 No. 5',
    shipping_city: 'Semarang',
    shipping_province: 'Jawa Tengah',
    shipping_postal_code: '50148',
    customer_notes: '',
    admin_notes: 'Pelanggan puas, rating 5 bintang.',
    courier: 'SiCepat GOKIL/BEST',
    tracking_number: 'SCP7788192031',
    is_label_printed: true,
    payment_method_label: 'QRIS Gopay',
    payment_account_number: 'ID202510220912',
    payment_status: 'lunas',
    subtotal: 650000,
    shipping_cost: 20000,
    shipping_discount: 20000,
    voucher_code: 'FREEONGKIR',
    total_amount: 650000,
    items: [
      {
        id: 'item-7',
        name: 'Barokah Air Legacy Pro',
        colorway: 'Red Alert / White Sport',
        sku: 'BS-AIR-001',
        size: '39',
        quantity: 1,
        price: 650000,
        stock_remaining: 11,
        image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80'
      }
    ],
    logs: [
      {
        time: '11:15 WIB',
        date: '2 Hari Lalu',
        title: 'Pesanan Diterima oleh Siti Rahmawati',
        actor: 'Kurir SiCepat',
        is_current: true
      }
    ]
  },
  {
    id: 'ord-seed-08',
    order_number: 'BKH-9805',
    supabase_id: '1b09e-4c',
    created_at: new Date(Date.now() - 4320 * 60000).toISOString(),
    status: 'dibatalkan',
    sub_status: 'EXPIRED PAYMENT',
    is_hot_drop: false,
    recipient_name: 'Ahmad Faisal',
    recipient_phone: '+62 856-4321-7890',
    recipient_email: 'ahmad.faisal@gmail.com',
    is_vip: false,
    shipping_address: 'Jl. Merdeka No. 12',
    shipping_city: 'Medan',
    shipping_province: 'Sumatera Utara',
    shipping_postal_code: '20111',
    customer_notes: '',
    admin_notes: 'Batas waktu pembayaran 24 jam terlewati. Stok otomatis dikembalikan.',
    courier: 'JNE (Reguler / YES)',
    tracking_number: '',
    is_label_printed: false,
    payment_method_label: 'BCA Virtual Account',
    payment_account_number: '8077 0856 4321 7890',
    payment_status: 'gagal',
    subtotal: 890000,
    shipping_cost: 45000,
    shipping_discount: 0,
    voucher_code: '',
    total_amount: 935000,
    items: [
      {
        id: 'item-8',
        name: 'Royal Oxford Formal Classic',
        colorway: 'Brown Vintage',
        sku: 'BS-OXF-002-BRN',
        size: '42',
        quantity: 1,
        price: 890000,
        stock_remaining: 8,
        image_url: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=400&q=80'
      }
    ],
    logs: [
      {
        time: '10:00 WIB',
        date: '3 Hari Lalu',
        title: 'Batas Waktu Bayar Expired (Dibatalkan Otomatis)',
        actor: 'System Automation',
        is_current: true
      }
    ]
  }
];

export const OrderManagement = ({ onNavigateBack }) => {
  // Master orders state
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active filter tab: 'all' | 'menunggu_pembayaran' | 'menunggu_konfirmasi' | 'diproses' | 'dikirim' | 'selesai' | 'dibatalkan'
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [courierFilter, setCourierFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');

  // Selected orders for mass operations
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);

  // Active selected order for the Right Inspection Station Drawer
  const [inspectedOrder, setInspectedOrder] = useState(null);

  // Modals state
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isMassPrintModalOpen, setIsMassPrintModalOpen] = useState(false);

  // Form states for modals
  const [shippingForm, setShippingForm] = useState({ courier: 'JNE YES', trackingNumber: '' });
  const [newStatusSelect, setNewStatusSelect] = useState('diproses');
  const [internalNotesText, setInternalNotesText] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Helper: Ensure admin is authenticated (RLS requires admin role)
  const ensureAdminAuth = async () => {
    if (!isSupabaseConfigured) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentEmail = session?.user?.email || '';
      const isAdmin = currentEmail === 'admin@barokahshoes.id' || currentEmail === 'jun123@gmail.com';
      if (!session || !isAdmin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: 'admin@barokahshoes.id',
          password: 'AdminPassword123!'
        });
        if (error) console.warn('Admin sign-in error:', error);
      }
      const { data: curSession } = await supabase.auth.getSession();
      if (curSession?.session?.user?.id) {
        await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', curSession.session.user.id);
      }
    } catch (err) {
      console.warn('ensureAdminAuth warning:', err);
    }
  };

  // Load orders from Supabase (real data)
  const loadOrders = async () => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        setOrders([]);
        setLoading(false);
        return;
      }

      await ensureAdminAuth();

      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*), profiles(name, email, phone)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase orders fetch error:', error);
        toast.error('Gagal memuat data pesanan dari database');
        setOrders([]);
        return;
      }

      const mapped = (data || []).map(mapSupabaseOrder);
      setOrders(mapped);
      if (mapped.length > 0) {
        setInspectedOrder(mapped[0]);
      }
    } catch (err) {
      console.error('Error loading orders:', err);
      toast.error('Gagal memuat daftar pesanan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Calculate live counts for each tab
  const counts = useMemo(() => {
    return {
      all: orders.length,
      menunggu_pembayaran: orders.filter(o => o.status === 'menunggu_pembayaran').length,
      menunggu_konfirmasi: orders.filter(o => o.status === 'menunggu_konfirmasi').length,
      diproses: orders.filter(o => o.status === 'diproses').length,
      dikirim: orders.filter(o => o.status === 'dikirim').length,
      selesai: orders.filter(o => o.status === 'selesai').length,
      dibatalkan: orders.filter(o => o.status === 'dibatalkan').length,
    };
  }, [orders]);

  // Filtered orders stream
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Tab filter
      if (activeTab !== 'all' && order.status !== activeTab) {
        return false;
      }

      // Courier filter
      if (courierFilter !== 'all') {
        const orderCourier = (order.courier || '').toLowerCase();
        if (courierFilter === 'jne' && !orderCourier.includes('jne')) return false;
        if (courierFilter === 'sicepat' && !orderCourier.includes('sicepat')) return false;
        if (courierFilter === 'gosend' && !orderCourier.includes('gosend')) return false;
        if (courierFilter === 'bebas-ongkir' && !order.voucher_code?.includes('FREE') && !orderCourier.includes('promo')) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const num = (order.order_number || '').toLowerCase();
        const cust = (order.recipient_name || '').toLowerCase();
        const resi = (order.tracking_number || '').toLowerCase();
        const itemNames = order.items.map(i => i.name.toLowerCase()).join(' ');
        if (!num.includes(q) && !cust.includes(q) && !resi.includes(q) && !itemNames.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [orders, activeTab, courierFilter, searchQuery]);

  // Pagination slice
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrders, currentPage]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;

  // Toggle selection for single item
  const handleToggleSelect = (orderId) => {
    setSelectedOrderIds(prev => 
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  // Toggle select all on current page
  const handleToggleSelectAll = () => {
    const pageIds = paginatedOrders.map(o => o.id);
    const allSelected = pageIds.every(id => selectedOrderIds.includes(id));
    if (allSelected) {
      setSelectedOrderIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedOrderIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  // Batch action: Tandai Siap Kirim
  const handleBatchMarkReady = () => {
    if (selectedOrderIds.length === 0) {
      toast.error('Pilih minimal 1 pesanan untuk diproses massal');
      return;
    }
    setOrders(prev => prev.map(o => {
      if (selectedOrderIds.includes(o.id)) {
        return {
          ...o,
          sub_status: 'SIAP KIRIM',
          logs: [
            {
              time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
              date: 'Hari Ini',
              title: 'Batch Action: Tandai Siap Kirim (Atelier Dispatch)',
              actor: 'Super Admin: Raka Aditya',
              is_current: true
            },
            ...o.logs.map(l => ({ ...l, is_current: false }))
          ]
        };
      }
      return o;
    }));
    toast.success(`${selectedOrderIds.length} pesanan berhasil ditandai SIAP KIRIM!`);
  };

  // Batch action: Resi Otomatis
  const handleBatchAutoResi = () => {
    if (selectedOrderIds.length === 0) {
      toast.error('Pilih minimal 1 pesanan untuk generate resi massal');
      return;
    }
    const updated = orders.map(o => {
      if (selectedOrderIds.includes(o.id) && !o.tracking_number) {
        const generated = 'BKH' + Math.floor(10000000 + Math.random() * 90000000);
        return {
          ...o,
          tracking_number: generated,
          status: 'dikirim',
          sub_status: 'ON DELIVERY',
          logs: [
            {
              time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
              date: 'Hari Ini',
              title: `Resi Otomatis Digenerate: ${generated}`,
              actor: 'Automated Logistics API',
              is_current: true
            },
            ...o.logs.map(l => ({ ...l, is_current: false }))
          ]
        };
      }
      return o;
    });
    setOrders(updated);
    toast.success(`Berhasil generate resi otomatis untuk ${selectedOrderIds.length} pesanan!`);
  };

  // Export orders to CSV
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      toast.error('Tidak ada data pesanan untuk diekspor');
      return;
    }
    const headers = ['No Pesanan', 'Tanggal', 'Status', 'Pelanggan', 'No Telepon', 'Kota', 'Kurir', 'No Resi', 'Metode Bayar', 'Total'];
    const rows = filteredOrders.map(o => [
      `#${o.order_number}`,
      formatDate(o.created_at),
      o.status.toUpperCase(),
      `"${o.recipient_name}"`,
      `'${o.recipient_phone}`,
      `"${o.shipping_city}"`,
      `"${o.courier}"`,
      o.tracking_number || '-',
      `"${o.payment_method_label}"`,
      o.total_amount
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Barokah_Pesanan_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Data ${filteredOrders.length} pesanan berhasil diekspor ke CSV!`);
  };

  // Copy customer delivery address
  const handleCopyAddress = (order) => {
    const fullText = `${order.recipient_name} (${order.recipient_phone})\n${order.shipping_address}, ${order.shipping_city}, ${order.shipping_province} ${order.shipping_postal_code}\nCatatan: ${order.customer_notes || '-'}`;
    navigator.clipboard.writeText(fullText);
    toast.success('Alamat penerima berhasil disalin ke clipboard!');
  };

  // Dispatch / Input Resi for Single Order - persists to Supabase
  const handleSaveShippingResi = async () => {
    if (!shippingForm.trackingNumber.trim()) {
      toast.error('Masukkan nomor resi pengiriman terlebih dahulu');
      return;
    }
    if (!inspectedOrder) return;

    try {
      await ensureAdminAuth();

      // Build new admin_notes with courier/resi info
      const otherNotes = (inspectedOrder.admin_notes || '').replace(/\[KURIR:[^\]]*\]/g, '').trim();
      const newAdminNotes = `[KURIR: ${shippingForm.courier} | RESI: ${shippingForm.trackingNumber.trim()}]${otherNotes ? ' ' + otherNotes : ''}`;

      const { error } = await supabase
        .from('orders')
        .update({
          order_status: 'dikirim',
          admin_notes: newAdminNotes,
          shipped_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', inspectedOrder.id);

      if (error) {
        toast.error('Gagal menyimpan resi ke database: ' + error.message);
        return;
      }

      // Update local state
      const updatedOrder = {
        ...inspectedOrder,
        courier: shippingForm.courier,
        tracking_number: shippingForm.trackingNumber.trim(),
        admin_notes: newAdminNotes,
        status: 'dikirim',
        is_label_printed: true,
        logs: [
          {
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
            date: 'Hari Ini',
            title: `No. Resi Diinput (${shippingForm.courier}): ${shippingForm.trackingNumber.trim()}`,
            actor: 'Admin Barokah Shoes',
            is_current: true
          },
          ...inspectedOrder.logs.map(l => ({ ...l, is_current: false }))
        ]
      };
      setOrders(prev => prev.map(o => o.id === inspectedOrder.id ? updatedOrder : o));
      setInspectedOrder(updatedOrder);
      setIsShippingModalOpen(false);
      toast.success(`Resi untuk #${inspectedOrder.order_number} berhasil disimpan dan status diubah ke DIKIRIM!`);
    } catch (err) {
      console.error('handleSaveShippingResi error:', err);
      toast.error('Terjadi kesalahan saat menyimpan resi');
    }
  };

  // Mark Completed - persists to Supabase
  const handleMarkCompleted = async (order) => {
    try {
      await ensureAdminAuth();
      const { error } = await supabase
        .from('orders')
        .update({
          order_status: 'selesai',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (error) {
        toast.error('Gagal menyelesaikan pesanan: ' + error.message);
        return;
      }

      const updatedOrder = {
        ...order,
        status: 'selesai',
        logs: [
          {
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
            date: 'Hari Ini',
            title: 'Pesanan Diselesaikan oleh Admin',
            actor: 'Admin Barokah Shoes',
            is_current: true
          },
          ...order.logs.map(l => ({ ...l, is_current: false }))
        ]
      };
      setOrders(prev => prev.map(o => o.id === order.id ? updatedOrder : o));
      setInspectedOrder(updatedOrder);
      toast.success(`Pesanan #${order.order_number} telah diselesaikan.`);
    } catch (err) {
      console.error('handleMarkCompleted error:', err);
      toast.error('Terjadi kesalahan saat menyelesaikan pesanan');
    }
  };

  // Cancel Order - persists to Supabase
  const handleCancelOrder = async (order) => {
    if (!window.confirm(`Yakin ingin membatalkan pesanan #${order.order_number}? Aksi ini tidak bisa dibatalkan.`)) {
      return;
    }

    try {
      await ensureAdminAuth();
      const { error } = await supabase
        .from('orders')
        .update({
          order_status: 'dibatalkan',
          payment_status: order.payment_status === 'lunas' ? 'dikembalikan' : 'gagal',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (error) {
        toast.error('Gagal membatalkan pesanan: ' + error.message);
        return;
      }

      const updatedOrder = {
        ...order,
        status: 'dibatalkan',
        payment_status: order.payment_status === 'lunas' ? 'dikembalikan' : 'gagal',
        logs: [
          {
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
            date: 'Hari Ini',
            title: 'Pesanan Dibatalkan oleh Admin',
            actor: 'Admin Barokah Shoes',
            is_current: true
          },
          ...order.logs.map(l => ({ ...l, is_current: false }))
        ]
      };
      setOrders(prev => prev.map(o => o.id === order.id ? updatedOrder : o));
      setInspectedOrder(updatedOrder);
      toast.error(`Pesanan #${order.order_number} telah dibatalkan.`);
    } catch (err) {
      console.error('handleCancelOrder error:', err);
      toast.error('Terjadi kesalahan saat membatalkan pesanan');
    }
  };

  // Save Internal Admin Notes - persists to Supabase
  const handleSaveInternalNotes = async () => {
    if (!inspectedOrder) return;
    try {
      await ensureAdminAuth();
      // Preserve courier/resi info if exists, but update other notes
      const courierMatch = (inspectedOrder.admin_notes || '').match(/\[KURIR:[^\]]*\]/);
      const courierPart = courierMatch ? courierMatch[0] : '';
      const newNotes = courierPart
        ? `${courierPart} ${internalNotesText}`.trim()
        : internalNotesText;

      const { error } = await supabase
        .from('orders')
        .update({
          admin_notes: newNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', inspectedOrder.id);

      if (error) {
        toast.error('Gagal menyimpan catatan: ' + error.message);
        return;
      }

      const updatedOrder = { ...inspectedOrder, admin_notes: newNotes };
      setOrders(prev => prev.map(o => o.id === inspectedOrder.id ? updatedOrder : o));
      setInspectedOrder(updatedOrder);
      setIsNotesModalOpen(false);
      toast.success('Catatan internal pesanan berhasil diperbarui!');
    } catch (err) {
      console.error('handleSaveInternalNotes error:', err);
      toast.error('Terjadi kesalahan saat menyimpan catatan');
    }
  };

  // Update Status Manually - persists to Supabase
  const handleUpdateStatusManual = async () => {
    if (!inspectedOrder) return;
    try {
      await ensureAdminAuth();

      const now = new Date().toISOString();
      const updates = { order_status: newStatusSelect, updated_at: now };
      if (newStatusSelect === 'dikirim') updates.shipped_at = now;
      if (newStatusSelect === 'selesai') updates.completed_at = now;
      if (newStatusSelect === 'dibatalkan') updates.cancelled_at = now;
      if (newStatusSelect === 'diproses' || newStatusSelect === 'menunggu_konfirmasi') {
        updates.payment_status = inspectedOrder.payment_status;
      }

      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', inspectedOrder.id);

      if (error) {
        toast.error('Gagal memperbarui status: ' + error.message);
        return;
      }

      const updatedOrder = {
        ...inspectedOrder,
        status: newStatusSelect,
        logs: [
          {
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
            date: 'Hari Ini',
            title: `Status Diubah Manual: ${getOrderStatusInfo(newStatusSelect).label}`,
            actor: 'Admin Barokah Shoes',
            is_current: true
          },
          ...inspectedOrder.logs.map(l => ({ ...l, is_current: false }))
        ]
      };
      setOrders(prev => prev.map(o => o.id === inspectedOrder.id ? updatedOrder : o));
      setInspectedOrder(updatedOrder);
      setIsStatusModalOpen(false);
      toast.success(`Status #${inspectedOrder.order_number} diperbarui ke ${getOrderStatusInfo(newStatusSelect).label}`);
    } catch (err) {
      console.error('handleUpdateStatusManual error:', err);
      toast.error('Terjadi kesalahan saat memperbarui status');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', minWidth: 0 }}>
      
      {/* ============================================================== */}
      {/* 1. TOP BAR / BREADCRUMB & HEADER TITLE                         */}
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
          {/* Breadcrumb pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Admin
            </span>
            <span style={{ fontSize: '0.68rem', color: C.borderDark }}>/</span>
            <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Penjualan
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
              Pesanan
            </span>
          </div>

          {/* Title with Kinetic Engine Code */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
            <h1 style={{
              fontSize: '1.85rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: C.textHead,
              letterSpacing: '-0.02em',
              margin: 0
            }}>
              Manajemen Pesanan
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
              ORDER_ORCHESTRATION_ENGINE // V.4.2
            </span>
          </div>

          <p style={{ fontSize: '0.84rem', color: C.textMuted, margin: 0, maxWidth: '640px' }}>
            Kelola status checkout, verifikasi bukti bayar, cetak label AWB, dan sinkronisasi log logistik real-time.
          </p>
        </div>

        {/* Quick Mass Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
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
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = C.surfaceLow;
              e.currentTarget.style.borderColor = C.emerald;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = C.card;
              e.currentTarget.style.borderColor = C.borderDark;
            }}
          >
            <Download size={16} /> Ekspor Data Pesanan
          </button>

          <button
            type="button"
            onClick={() => {
              if (selectedOrderIds.length === 0) {
                toast.error('Pilih pesanan yang akan dicetak labelnya terlebih dahulu');
                return;
              }
              setIsMassPrintModalOpen(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: '#0F172A',
              color: C.neonLime,
              border: 'none',
              borderRadius: '8px',
              fontWeight: 900,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 14px rgba(15, 23, 42, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1E293B';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#0F172A';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <Printer size={16} /> Cetak Label Pengiriman Massal
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. STATUS METRIC TABS (HORIZONTAL SCROLLABLE HIGH-DENSITY)      */}
      {/* ============================================================== */}
      <div style={{
        backgroundColor: C.card,
        padding: '6px',
        borderRadius: '12px',
        border: `1px solid ${C.border}`,
        boxShadow: C.shadowSm,
        overflowX: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        {[
          { key: 'all', label: 'Semua Pesanan', count: counts.all },
          { key: 'menunggu_pembayaran', label: 'Menunggu Pembayaran', count: counts.menunggu_pembayaran },
          { key: 'menunggu_konfirmasi', label: 'Menunggu Konfirmasi', count: counts.menunggu_konfirmasi },
          { key: 'diproses', label: 'Diproses', count: counts.diproses, highlight: true },
          { key: 'dikirim', label: 'Dikirim', count: counts.dikirim },
          { key: 'selesai', label: 'Selesai', count: counts.selesai },
          { key: 'dibatalkan', label: 'Dibatalkan', count: counts.dibatalkan, isRed: true },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key);
                setCurrentPage(1);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontWeight: isActive ? 800 : 600,
                fontSize: '0.78rem',
                letterSpacing: '0.02em',
                backgroundColor: isActive 
                  ? '#0F172A' 
                  : 'transparent',
                color: isActive 
                  ? C.neonLime 
                  : tab.isRed 
                    ? C.redText 
                    : C.textSub,
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = C.surfaceLow;
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span>{tab.label}</span>
              <span style={{
                fontSize: '0.68rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 900,
                padding: '1.5px 7px',
                borderRadius: '12px',
                backgroundColor: isActive
                  ? C.neonLime
                  : tab.isRed
                    ? C.redBg
                    : C.surfaceHigh,
                color: isActive
                  ? '#0F172A'
                  : tab.isRed
                    ? C.redText
                    : C.textMain
              }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* 3. SEARCH, FILTER & QUICK STATS RIBBON                         */}
      {/* ============================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '14px',
        alignItems: 'center'
      }}>
        {/* Search Bar with Kinetic Tag */}
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: C.textMuted
          }} />
          <input
            type="text"
            placeholder="Cari No. Pesanan (#BKH-...), Nama Pelanggan, atau No. Resi..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              width: '100%',
              height: '44px',
              backgroundColor: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: '8px',
              padding: '0 80px 0 42px',
              fontSize: '0.82rem',
              color: C.textMain,
              outline: 'none',
              boxShadow: C.shadowSm,
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = C.emerald}
            onBlur={(e) => e.target.style.borderColor = C.border}
          />
          <div style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              backgroundColor: C.surfaceLow,
              border: `1px solid ${C.borderDark}`,
              color: C.textMuted,
              padding: '2px 6px',
              borderRadius: '4px'
            }}>
              ENTER
            </span>
          </div>
        </div>

        {/* Filter controls row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {/* Kurir Filter */}
          <div style={{ position: 'relative', minWidth: '160px' }}>
            <select
              value={courierFilter}
              onChange={(e) => setCourierFilter(e.target.value)}
              style={{
                width: '100%',
                height: '44px',
                padding: '0 32px 0 12px',
                backgroundColor: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: '8px',
                fontSize: '0.8rem',
                color: C.textMain,
                fontWeight: 600,
                appearance: 'none',
                outline: 'none',
                cursor: 'pointer',
                boxShadow: C.shadowSm
              }}
            >
              <option value="all">Semua Kurir</option>
              <option value="jne">JNE (Reguler / YES)</option>
              <option value="sicepat">SiCepat GOKIL/BEST</option>
              <option value="gosend">GoSend Instant</option>
              <option value="bebas-ongkir">Bebas Ongkir Promo</option>
            </select>
            <ChevronLeft size={16} style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%) rotate(-90deg)',
              pointerEvents: 'none',
              color: C.textMuted
            }} />
          </div>

          {/* Date Range Picker Tag */}
          <div style={{
            height: '44px',
            padding: '0 14px',
            backgroundColor: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.8rem',
            color: C.textMain,
            cursor: 'pointer',
            boxShadow: C.shadowSm
          }}>
            <Calendar size={16} style={{ color: C.textMuted }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', fontWeight: 600 }}>
              {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} (Hari Ini)
            </span>
          </div>

          {/* Refresh Data */}
          <button
            type="button"
            onClick={() => {
              loadOrders();
              toast.success('Daftar pesanan disinkronkan kembali.');
            }}
            title="Muat Ulang Data"
            style={{
              width: '44px',
              height: '44px',
              backgroundColor: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: C.textMain,
              cursor: 'pointer',
              boxShadow: C.shadowSm,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = C.surfaceLow}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = C.card}
          >
            <RotateCw size={17} />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. OPERATIONAL GRID: ORDERS STREAM (LEFT) & DRAWER (RIGHT)      */}
      {/* ============================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: '24px',
        alignItems: 'flex-start'
      }}>
        
        {/* ============================================================ */}
        {/* LEFT COLUMN: MAIN ORDERS STREAM (7 Cols on desktop)          */}
        {/* ============================================================ */}
        <div style={{
          gridColumn: 'span 12',
          '@media (minWidth: 1200px)': { gridColumn: 'span 7' },
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }} className="orders-stream-col">
          <style>{`
            @media (min-width: 1200px) {
              .orders-stream-col { grid-column: span 7 !important; }
              .inspection-drawer-col { grid-column: span 5 !important; }
            }
          `}</style>

          {/* Batch Operations Strip */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            backgroundColor: C.surfaceLow,
            borderRadius: '10px',
            border: `1px solid ${C.border}`,
            boxShadow: C.shadowSm,
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                checked={paginatedOrders.length > 0 && paginatedOrders.every(o => selectedOrderIds.includes(o.id))}
                onChange={handleToggleSelectAll}
                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#0F172A' }}
              />
              <span style={{
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: C.textMain,
                textTransform: 'uppercase'
              }}>
                {selectedOrderIds.length} Pesanan Terpilih
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={handleBatchMarkReady}
                style={{
                  padding: '6px 12px',
                  backgroundColor: C.card,
                  border: `1px solid ${C.borderDark}`,
                  color: C.textMain,
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = C.surfaceHigh}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = C.card}
              >
                Tandai Siap Kirim
              </button>
              <button
                type="button"
                onClick={handleBatchAutoResi}
                style={{
                  padding: '6px 14px',
                  backgroundColor: '#0F172A',
                  color: C.neonLime,
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.2)'
                }}
              >
                Batch Resi Otomatis
              </button>
            </div>
          </div>

          {/* Order Cards List */}
          {loading ? (
            <div style={{
              backgroundColor: C.card,
              borderRadius: '12px',
              padding: '60px 20px',
              textAlign: 'center',
              color: C.textMuted,
              border: `1px solid ${C.border}`,
              fontFamily: 'var(--font-mono)'
            }}>
              MEMUAT DATA ORCHESTRATION ENGINE...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div style={{
              backgroundColor: C.card,
              borderRadius: '12px',
              padding: '60px 20px',
              textAlign: 'center',
              border: `1px solid ${C.border}`,
              boxShadow: C.shadowSm
            }}>
              <ShoppingBag size={42} style={{ color: C.borderDark, margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', color: C.textHead, margin: '0 0 6px' }}>
                Tidak Ada Pesanan Ditemukan
              </h3>
              <p style={{ color: C.textMuted, fontSize: '0.84rem', margin: '0 0 16px' }}>
                Coba ubah filter status atau kata kunci pencarian Anda.
              </p>
              <button
                type="button"
                onClick={() => { setActiveTab('all'); setSearchQuery(''); setCourierFilter('all'); }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  borderRadius: '6px',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                Reset Semua Filter
              </button>
            </div>
          ) : (
            paginatedOrders.map((order) => {
              const isSelected = selectedOrderIds.includes(order.id);
              const isInspected = inspectedOrder && inspectedOrder.id === order.id;
              const statusInfo = getOrderStatusInfo(order.status);
              const primaryItem = order.items && order.items[0] ? order.items[0] : null;

              return (
                <div
                  key={order.id}
                  style={{
                    backgroundColor: C.card,
                    borderRadius: '14px',
                    padding: '18px 20px',
                    border: isInspected ? `2px solid #0F172A` : `1px solid ${C.border}`,
                    boxShadow: isInspected ? C.shadowLg : C.shadowSm,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  {/* Visual Streetwear Accent Marker (Neon Lime Left Border) */}
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '6px',
                    backgroundColor: order.status === 'selesai' ? C.emerald : order.status === 'dibatalkan' ? '#EF4444' : C.neonLime
                  }} />

                  {/* Upper Row: IDs & Badges */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(order.id)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#0F172A' }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          fontSize: '1.05rem',
                          fontWeight: 900,
                          letterSpacing: '-0.01em',
                          color: C.textHead
                        }}>
                          #{order.order_number}
                        </span>
                        {order.is_hot_drop && (
                          <span style={{
                            fontSize: '0.62rem',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 900,
                            backgroundColor: '#0F172A',
                            color: C.neonLime,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            textTransform: 'uppercase'
                          }}>
                            HOT DROP
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: C.textMuted }}>
                        • {formatDate(order.created_at)}
                      </span>
                    </div>

                    {/* Status Pill */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '0.68rem',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 800,
                        backgroundColor: order.status === 'diproses' ? C.neonLime : statusInfo.bg,
                        color: order.status === 'diproses' ? '#181E00' : statusInfo.textColor,
                        padding: '4px 10px',
                        borderRadius: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}>
                        {statusInfo.label.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Middle Block: Sneaker Thumbnail, Customer & Financials Snapshot */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '14px',
                    padding: '8px 0',
                    borderTop: `1px solid ${C.surfaceHigh}`,
                    borderBottom: `1px solid ${C.surfaceHigh}`,
                    alignItems: 'center'
                  }}>
                    {/* Sneaker Snapshot */}
                    {primaryItem && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={primaryItem.image_url}
                          alt={primaryItem.name}
                          style={{
                            width: '56px',
                            height: '56px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            backgroundColor: C.surfaceLow,
                            flexShrink: 0,
                            boxShadow: C.shadowSm
                          }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                          <span style={{ fontSize: '0.84rem', fontWeight: 800, color: C.textHead, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {primaryItem.name}
                          </span>
                          <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: C.textMuted }}>
                            EU {primaryItem.size} • Qty: {primaryItem.quantity}
                          </span>
                          <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: C.emeraldText, fontWeight: 700 }}>
                            {primaryItem.sku}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Customer & Logistics Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <span style={{ fontSize: '0.84rem', fontWeight: 700, color: C.textHead }}>
                        {order.recipient_name}
                      </span>
                      <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: C.textMuted }}>
                        {order.recipient_phone}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: C.textSub, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {order.shipping_city}
                      </span>
                    </div>

                    {/* Financials & Dispatch Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: C.textHead }}>
                        {formatIDR(order.total_amount)}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: C.textMuted }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: order.payment_status === 'lunas' ? C.emerald : '#F59E0B' }} />
                        <span>{order.payment_method_label} ({order.payment_status === 'lunas' ? 'Lunas' : 'Pending'})</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: C.textMuted, marginTop: '2px' }}>
                        <Truck size={12} />
                        <span>{order.courier} {order.tracking_number ? `(${order.tracking_number})` : '(Menunggu Resi)'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Footer Row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    {/* Buyer Note Pill */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {order.customer_notes ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.72rem',
                          color: C.textSub,
                          backgroundColor: C.surfaceLow,
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontStyle: 'italic',
                          maxWidth: '260px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          <MessageSquare size={12} /> "{order.customer_notes}"
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.7rem', color: C.textLight, fontFamily: 'var(--font-mono)' }}>
                          Label Cetak: <strong style={{ color: order.is_label_printed ? C.emeraldText : C.textMain }}>{order.is_label_printed ? 'Sudah' : 'Belum'}</strong>
                        </span>
                      )}
                    </div>

                    {/* Actions: Cetak, Status, Periksa */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setInspectedOrder(order);
                          setIsPrintModalOpen(true);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 12px',
                          backgroundColor: C.surfaceLow,
                          border: `1px solid ${C.border}`,
                          color: C.textMain,
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          cursor: 'pointer'
                        }}
                      >
                        <Printer size={13} /> Cetak
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setInspectedOrder(order);
                          setNewStatusSelect(order.status);
                          setIsStatusModalOpen(true);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 12px',
                          backgroundColor: C.surfaceHigh,
                          border: 'none',
                          color: C.textMain,
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          cursor: 'pointer'
                        }}
                      >
                        <RotateCw size={13} /> Status
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setInspectedOrder(order);
                          toast.success(`Inspeksi #${order.order_number} dimuat di panel kanan.`);
                        }}
                        style={{
                          padding: '6px 16px',
                          backgroundColor: isInspected ? '#0F172A' : C.surfaceHigh,
                          color: isInspected ? C.neonLime : C.textMain,
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        Periksa
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Pagination & Stream Controls */}
          {filteredOrders.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              backgroundColor: C.card,
              borderRadius: '12px',
              border: `1px solid ${C.border}`,
              boxShadow: C.shadowSm,
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <span style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)', color: C.textMuted }}>
                Menampilkan <strong style={{ color: C.textHead }}>{(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredOrders.length)}</strong> dari <strong style={{ color: C.textHead }}>{filteredOrders.length}</strong> pesanan {activeTab !== 'all' ? activeTab : ''}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    border: `1px solid ${C.border}`,
                    backgroundColor: currentPage === 1 ? C.surfaceLow : C.card,
                    color: currentPage === 1 ? C.textLight : C.textMain,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentPage(idx + 1)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: currentPage === idx + 1 ? '#0F172A' : C.surfaceLow,
                      color: currentPage === idx + 1 ? C.neonLime : C.textMain,
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer'
                    }}
                  >
                    {idx + 1}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    border: `1px solid ${C.border}`,
                    backgroundColor: currentPage === totalPages ? C.surfaceLow : C.card,
                    color: currentPage === totalPages ? C.textLight : C.textMain,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: SIDE DRAWER PREVIEW / INSPECTION STATION        */}
        {/* ============================================================ */}
        <div style={{
          gridColumn: 'span 12',
          '@media (minWidth: 1200px)': { gridColumn: 'span 5' },
          position: 'sticky',
          top: '84px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }} className="inspection-drawer-col">
          {inspectedOrder ? (
            <div style={{
              backgroundColor: C.card,
              borderRadius: '16px',
              border: `1px solid ${C.border}`,
              boxShadow: C.shadowLg,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Header Drawer */}
              <div style={{
                padding: '20px 24px',
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                borderBottom: `2px solid ${C.neonLime}`
              }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '0.68rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 800,
                      color: C.neonLime,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase'
                    }}>
                      INSPEKSI PESANAN AKTIF
                    </span>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: C.neonLime, display: 'inline-block' }} />
                    <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.6)' }}>
                      LIVE HOOK
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '6px' }}>
                    <span style={{ fontSize: '1.45rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                      #{inspectedOrder.order_number}
                    </span>
                    <span style={{
                      fontSize: '0.68rem',
                      fontFamily: 'var(--font-mono)',
                      color: C.neonLime,
                      backgroundColor: 'rgba(208, 241, 47, 0.15)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: 700
                    }}>
                      SUPABASE ID: {inspectedOrder.supabase_id || inspectedOrder.id.slice(0, 8)}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setIsPrintModalOpen(true)}
                    title="Cetak AWB / Label"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      color: '#FFFFFF',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <Printer size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectedOrder(null)}
                    title="Tutup Inspeksi"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      color: '#FFFFFF',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={17} />
                  </button>
                </div>
              </div>

              {/* Drawer Body with 5 Sections */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
                
                {/* SECTION 1: PELANGGAN & ALAMAT PENGIRIMAN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{
                      fontSize: '0.68rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 800,
                      color: C.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em'
                    }}>
                      PELANGGAN & ALAMAT PENGIRIMAN
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyAddress(inspectedOrder)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'none',
                        border: 'none',
                        color: C.emeraldText,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        cursor: 'pointer'
                      }}
                    >
                      <Copy size={12} /> SALIN ALAMAT
                    </button>
                  </div>

                  <div style={{
                    backgroundColor: C.surfaceLow,
                    borderRadius: '10px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    border: `1px solid ${C.border}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div>
                        <h4 style={{ fontSize: '0.94rem', fontWeight: 800, color: C.textHead, margin: '0 0 2px' }}>
                          {inspectedOrder.recipient_name}
                        </h4>
                        <p style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: C.textMuted, margin: 0 }}>
                          {inspectedOrder.recipient_phone} • {inspectedOrder.recipient_email || 'atelier.customer@barokah.id'}
                        </p>
                      </div>
                      {inspectedOrder.is_vip ? (
                        <span style={{
                          fontSize: '0.62rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 900,
                          backgroundColor: C.neonLime,
                          color: '#181E00',
                          padding: '2px 8px',
                          borderRadius: '4px'
                        }}>
                          VIP COLLECTOR
                        </span>
                      ) : (
                        <span style={{
                          fontSize: '0.62rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          backgroundColor: C.surfaceHigh,
                          color: C.textSub,
                          padding: '2px 8px',
                          borderRadius: '4px'
                        }}>
                          CUSTOMER
                        </span>
                      )}
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      paddingTop: '10px',
                      borderTop: `1px solid ${C.border}`
                    }}>
                      <MapPin size={16} style={{ color: C.textMuted, flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <p style={{ fontSize: '0.8rem', color: C.textMain, margin: 0, lineHeight: '1.45' }}>
                          {inspectedOrder.shipping_address}, {inspectedOrder.shipping_city}, {inspectedOrder.shipping_province} {inspectedOrder.shipping_postal_code}
                        </p>
                        {inspectedOrder.customer_notes && (
                          <p style={{
                            fontSize: '0.72rem',
                            color: C.textSub,
                            fontStyle: 'italic',
                            margin: '6px 0 0',
                            backgroundColor: C.card,
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: `1px solid ${C.border}`
                          }}>
                            Catatan Pembeli: <span style={{ color: C.textHead, fontStyle: 'normal' }}>"{inspectedOrder.customer_notes}"</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: ITEM PESANAN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '10px', borderTop: `1px solid ${C.surfaceHigh}` }}>
                  <span style={{
                    fontSize: '0.68rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    color: C.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em'
                  }}>
                    ITEM PESANAN ({inspectedOrder.items?.length || 0} PRODUK)
                  </span>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {inspectedOrder.items?.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          padding: '12px',
                          backgroundColor: C.surfaceLow,
                          borderRadius: '10px',
                          border: `1px solid ${C.border}`
                        }}
                      >
                        <img
                          src={item.image_url}
                          alt={item.name}
                          style={{
                            width: '64px',
                            height: '64px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            backgroundColor: C.card,
                            boxShadow: C.shadowSm,
                            flexShrink: 0
                          }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                            <div>
                              <h5 style={{ fontSize: '0.88rem', fontWeight: 800, color: C.textHead, margin: '0 0 2px' }}>
                                {item.name}
                              </h5>
                              <span style={{ fontSize: '0.72rem', color: C.textMuted, fontFamily: 'var(--font-mono)' }}>
                                {item.colorway || 'Streetwear Atelier Edition'}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.84rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: C.textHead }}>
                              {formatIDR(item.price)}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                            <span style={{
                              fontSize: '0.68rem',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 800,
                              backgroundColor: '#0F172A',
                              color: '#FFFFFF',
                              padding: '2px 8px',
                              borderRadius: '4px'
                            }}>
                              SIZE EU {item.size}
                            </span>
                            <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: C.textMuted }}>
                              Qty: {item.quantity} Pasang
                            </span>
                            <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: C.emeraldText, fontWeight: 700 }}>
                              Stok Sisa: {item.stock_remaining || 3}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SECTION 3: RINCIAN BIAYA & METODE */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '10px', borderTop: `1px solid ${C.surfaceHigh}` }}>
                  <span style={{
                    fontSize: '0.68rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    color: C.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em'
                  }}>
                    RINCIAN BIAYA & METODE
                  </span>

                  <div style={{
                    backgroundColor: C.surfaceLow,
                    borderRadius: '10px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    border: `1px solid ${C.border}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: C.textSub }}>
                      <span>Subtotal Produk</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{formatIDR(inspectedOrder.subtotal)}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: C.textSub }}>
                      <span>Ongkos Kirim ({inspectedOrder.courier})</span>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        textDecoration: inspectedOrder.shipping_discount > 0 ? 'line-through' : 'none',
                        color: inspectedOrder.shipping_discount > 0 ? C.textMuted : C.textSub
                      }}>
                        {formatIDR(inspectedOrder.shipping_cost)}
                      </span>
                    </div>

                    {inspectedOrder.shipping_discount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: C.emeraldText, fontWeight: 600 }}>
                        <span>Voucher Subsidi Ongkir ({inspectedOrder.voucher_code || 'PROMO'})</span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>-{formatIDR(inspectedOrder.shipping_discount)}</span>
                      </div>
                    )}

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      paddingTop: '10px',
                      marginTop: '4px',
                      borderTop: `1px solid ${C.border}`
                    }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 800, color: C.textHead }}>Total Akhir</span>
                      <span style={{ fontSize: '1.25rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: C.textHead }}>
                        {formatIDR(inspectedOrder.total_amount)}
                      </span>
                    </div>

                    {/* Payment Method Badge */}
                    <div style={{
                      marginTop: '8px',
                      padding: '10px 12px',
                      backgroundColor: C.card,
                      borderRadius: '8px',
                      border: `1px solid ${C.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          backgroundColor: '#0F172A',
                          color: C.neonLime,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <CreditCard size={17} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: C.textHead }}>
                            {inspectedOrder.payment_method_label}
                          </span>
                          <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: C.textMuted }}>
                            {inspectedOrder.payment_account_number || 'TRX-ONLINE-2025'}
                          </span>
                        </div>
                      </div>

                      <span style={{
                        fontSize: '0.68rem',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 900,
                        backgroundColor: inspectedOrder.payment_status === 'lunas' ? C.neonLime : C.amberBg,
                        color: inspectedOrder.payment_status === 'lunas' ? '#181E00' : C.amberText,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        textTransform: 'uppercase'
                      }}>
                        {inspectedOrder.payment_status === 'lunas' ? 'TERVERIFIKASI' : 'PENDING'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* SECTION 4: RIWAYAT STATUS (SUPABASE AUDIT LOG) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '10px', borderTop: `1px solid ${C.surfaceHigh}` }}>
                  <span style={{
                    fontSize: '0.68rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    color: C.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em'
                  }}>
                    RIWAYAT STATUS (SUPABASE AUDIT LOG)
                  </span>

                  <div style={{
                    position: 'relative',
                    paddingLeft: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}>
                    {/* Vertical timeline line */}
                    <div style={{
                      position: 'absolute',
                      left: '6px',
                      top: '6px',
                      bottom: '6px',
                      width: '2px',
                      backgroundColor: C.surfaceHigh
                    }} />

                    {inspectedOrder.logs?.map((log, idx) => (
                      <div key={idx} style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                        {/* Timeline Node Dot */}
                        <div style={{
                          position: 'absolute',
                          left: '-20px',
                          top: '2px',
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          backgroundColor: log.is_current ? C.neonLime : '#0F172A',
                          border: `3px solid ${C.card}`,
                          boxShadow: C.shadowSm
                        }} />

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: C.textHead }}>
                            {log.title}
                          </span>
                          {log.is_current && (
                            <span style={{
                              fontSize: '0.6rem',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 900,
                              backgroundColor: C.neonLime,
                              color: '#181E00',
                              padding: '1px 6px',
                              borderRadius: '4px'
                            }}>
                              SEKARANG
                            </span>
                          )}
                        </div>

                        <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: C.textMuted, marginTop: '2px' }}>
                          {log.date}, {log.time} • {log.actor}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SECTION 5: REAL-TIME DISPATCH ACTIONS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '10px', borderTop: `1px solid ${C.surfaceHigh}` }}>
                  <span style={{
                    fontSize: '0.68rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    color: C.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em'
                  }}>
                    TINDAKAN OPERASIONAL PESANAN
                  </span>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShippingForm({
                          courier: inspectedOrder.courier || 'JNE YES',
                          trackingNumber: inspectedOrder.tracking_number || ''
                        });
                        setIsShippingModalOpen(true);
                      }}
                      style={{
                        height: '42px',
                        backgroundColor: '#0F172A',
                        color: C.neonLime,
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 900,
                        fontSize: '0.74rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.2)'
                      }}
                    >
                      <Truck size={15} /> Input Resi / Kirim
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMarkCompleted(inspectedOrder)}
                      style={{
                        height: '42px',
                        backgroundColor: C.card,
                        color: C.textMain,
                        border: `1px solid ${C.borderDark}`,
                        borderRadius: '8px',
                        fontWeight: 800,
                        fontSize: '0.74rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <CheckCircle2 size={15} style={{ color: C.emeraldText }} /> Selesaikan
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setInternalNotesText(inspectedOrder.admin_notes || '');
                        setIsNotesModalOpen(true);
                      }}
                      style={{
                        height: '38px',
                        backgroundColor: C.surfaceLow,
                        color: C.textMain,
                        border: `1px solid ${C.border}`,
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.72rem',
                        textTransform: 'uppercase',
                        fontFamily: 'var(--font-mono)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <Edit3 size={13} /> Edit Catatan
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCancelOrder(inspectedOrder)}
                      style={{
                        height: '38px',
                        backgroundColor: C.redBg,
                        color: C.redText,
                        border: `1px solid ${C.redBorder}`,
                        borderRadius: '8px',
                        fontWeight: 800,
                        fontSize: '0.72rem',
                        textTransform: 'uppercase',
                        fontFamily: 'var(--font-mono)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <XCircle size={13} /> Batalkan Pesanan
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
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Layers size={40} style={{ color: C.borderDark, marginBottom: '12px' }} />
              <h4 style={{ fontSize: '0.94rem', fontWeight: 800, textTransform: 'uppercase', color: C.textHead, margin: '0 0 6px' }}>
                Pilih Pesanan untuk Inspeksi
              </h4>
              <p style={{ fontSize: '0.78rem', color: C.textMuted, margin: 0, maxWidth: '280px' }}>
                Klik tombol "Periksa" pada salah satu pesanan di daftar sebelah kiri untuk memuat rincian inspeksi lengkap.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* ============================================================== */}
      {/* MODAL 1: INPUT RESI & DISPATCH PENGIRIMAN                       */}
      {/* ============================================================== */}
      {isShippingModalOpen && inspectedOrder && (
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
              padding: '20px',
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: `2px solid ${C.neonLime}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={20} style={{ color: C.neonLime }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>
                  Input Resi Pengiriman #{inspectedOrder.order_number}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsShippingModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: C.textSub, display: 'block', marginBottom: '6px' }}>
                  PILIH JASA EKSPEDISI / KURIR
                </label>
                <select
                  value={shippingForm.courier}
                  onChange={(e) => setShippingForm({ ...shippingForm, courier: e.target.value })}
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 12px',
                    backgroundColor: C.surfaceLow,
                    border: `1px solid ${C.border}`,
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    color: C.textHead,
                    outline: 'none',
                    fontWeight: 600
                  }}
                >
                  <option value="JNE YES">JNE YES (Yakin Esok Sampai)</option>
                  <option value="JNE REG">JNE Reguler</option>
                  <option value="SiCepat BEST">SiCepat BEST</option>
                  <option value="SiCepat GOKIL">SiCepat GOKIL Cargo</option>
                  <option value="GoSend Instant">GoSend Instant</option>
                  <option value="J&T Express">J&T Express VIP</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: C.textSub, display: 'block', marginBottom: '6px' }}>
                  NOMOR RESI PENGIRIMAN (AWB TRACKING CODE)
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Contoh: JKT99281920 / SCP991823"
                    value={shippingForm.trackingNumber}
                    onChange={(e) => setShippingForm({ ...shippingForm, trackingNumber: e.target.value })}
                    style={{
                      flex: 1,
                      height: '42px',
                      padding: '0 14px',
                      backgroundColor: C.card,
                      border: `1px solid ${C.border}`,
                      borderRadius: '8px',
                      fontSize: '0.88rem',
                      fontFamily: 'var(--font-mono)',
                      color: C.textHead,
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const prefix = shippingForm.courier.startsWith('JNE') ? 'JKT' : 'SCP';
                      setShippingForm({
                        ...shippingForm,
                        trackingNumber: prefix + Math.floor(10000000 + Math.random() * 90000000)
                      });
                      toast.success('Resi simulasi digenerate!');
                    }}
                    style={{
                      padding: '0 14px',
                      backgroundColor: C.surfaceHigh,
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.72rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    GENERATE
                  </button>
                </div>
              </div>

              <div style={{
                backgroundColor: C.emeraldLight,
                border: `1px solid ${C.emeraldBorder}`,
                padding: '12px',
                borderRadius: '8px',
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start'
              }}>
                <CheckCircle2 size={16} style={{ color: C.emeraldText, flexShrink: 0, marginTop: '2px' }} />
                <p style={{ fontSize: '0.74rem', color: C.emeraldText, margin: 0, lineHeight: '1.4' }}>
                  Menyimpan nomor resi akan secara otomatis memperbarui status pesanan menjadi <strong>DIKIRIM</strong> dan memicu notifikasi pelacakan ke pelanggan.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsShippingModalOpen(false)}
                  style={{
                    flex: 1,
                    height: '42px',
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
                  onClick={handleSaveShippingResi}
                  style={{
                    flex: 2,
                    height: '42px',
                    backgroundColor: '#0F172A',
                    color: C.neonLime,
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 900,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)'
                  }}
                >
                  SIMPAN RESI & KIRIM
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: UBAH STATUS PESANAN MANUAL                            */}
      {/* ============================================================== */}
      {isStatusModalOpen && inspectedOrder && (
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
            maxWidth: '440px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: C.shadowXl,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '20px',
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: `2px solid ${C.neonLime}`
            }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>
                Ubah Status #{inspectedOrder.order_number}
              </h3>
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '0.8rem', color: C.textMuted, margin: 0 }}>
                Pilih status baru untuk tahapan siklus pesanan ini:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { value: 'menunggu_pembayaran', label: 'Menunggu Pembayaran' },
                  { value: 'menunggu_konfirmasi', label: 'Menunggu Konfirmasi' },
                  { value: 'diproses', label: 'Diproses' },
                  { value: 'dikirim', label: 'Dikirim' },
                  { value: 'selesai', label: 'Selesai' },
                  { value: 'dibatalkan', label: 'Dibatalkan' }
                ].map(opt => (
                  <label
                    key={opt.value}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: newStatusSelect === opt.value ? `2px solid #0F172A` : `1px solid ${C.border}`,
                      backgroundColor: newStatusSelect === opt.value ? C.surfaceLow : C.card,
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="radio"
                      name="orderStatusRadio"
                      value={opt.value}
                      checked={newStatusSelect === opt.value}
                      onChange={(e) => setNewStatusSelect(e.target.value)}
                      style={{ accentColor: '#0F172A', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.84rem', fontWeight: 700, color: C.textHead }}>
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
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
                  onClick={handleUpdateStatusManual}
                  style={{
                    flex: 2,
                    height: '40px',
                    backgroundColor: '#0F172A',
                    color: C.neonLime,
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 900,
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  PERBARUI STATUS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: CETAK LABEL PENGIRIMAN / AWB (INDIVIDUAL)              */}
      {/* ============================================================== */}
      {isPrintModalOpen && inspectedOrder && (
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
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '520px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: C.shadowXl,
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Action Bar */}
            <div style={{
              padding: '16px 20px',
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: C.neonLime }}>
                PRINTER PACKING SLIP // AWB # {inspectedOrder.order_number}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                    // mark printed
                    setOrders(prev => prev.map(o => o.id === inspectedOrder.id ? { ...o, is_label_printed: true } : o));
                    toast.success('Perintah cetak dikirim ke printer!');
                  }}
                  style={{
                    padding: '6px 14px',
                    backgroundColor: C.neonLime,
                    color: '#181E00',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 900,
                    fontSize: '0.72rem',
                    cursor: 'pointer'
                  }}
                >
                  CETAK SEKARANG
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable AWB Voucher Layout */}
            <div style={{ padding: '28px', color: '#000000', display: 'flex', flexDirection: 'column', gap: '16px', border: '2px dashed #CBD5E1', margin: '16px', borderRadius: '12px' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000000', paddingBottom: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '0.04em', margin: 0, textTransform: 'uppercase' }}>
                    BAROKAH SHOES
                  </h2>
                  <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>
                    ATELIER LOGISTICS // JKT-01
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>
                    {inspectedOrder.courier}
                  </span>
                  <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>
                    RESI: {inspectedOrder.tracking_number || 'AUTO-ASSIGN-PICKUP'}
                  </div>
                </div>
              </div>

              {/* Sender & Receiver */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '0.75rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
                <div>
                  <span style={{ fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>PENGIRIM:</span>
                  <div><strong>Toko Barokah Shoes</strong></div>
                  <div>PASAR JAYA JATINEGARA LT.2 BLOK AKS NO. 57</div>
                  <div>Jl. Jatinegara Barat, Bali Mester, Jatinegara, Jakarta Timur 13310</div>
                  <div>WhatsApp: 081288667433 • Email: barokahshoes@gmail.com</div>
                </div>
                <div>
                  <span style={{ fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>PENERIMA:</span>
                  <div style={{ fontWeight: 700 }}>{inspectedOrder.recipient_name}</div>
                  <div>{inspectedOrder.recipient_phone}</div>
                  <div>{inspectedOrder.shipping_address}, {inspectedOrder.shipping_city}</div>
                </div>
              </div>

              {/* Item Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem' }}>
                <span style={{ fontWeight: 800, textTransform: 'uppercase' }}>ISI PAKET:</span>
                {inspectedOrder.items?.map((it, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)' }}>
                    <span>{it.name} (EU {it.size}) x {it.quantity}</span>
                    <span>{it.sku}</span>
                  </div>
                ))}
              </div>

              {/* Barcode Mockup */}
              <div style={{
                textAlign: 'center',
                paddingTop: '16px',
                borderTop: '2px solid #000000',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px'
              }}>
                <div style={{
                  height: '42px',
                  width: '80%',
                  background: 'repeating-linear-gradient(90deg, #000 0, #000 3px, transparent 3px, transparent 6px, #000 6px, #000 10px, transparent 10px, transparent 13px)'
                }} />
                <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                  *{inspectedOrder.order_number}*
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: EDIT CATATAN INTERNAL                                 */}
      {/* ============================================================== */}
      {isNotesModalOpen && inspectedOrder && (
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
            maxWidth: '460px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: C.shadowXl,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '20px',
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: `2px solid ${C.neonLime}`
            }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>
                Catatan Internal #{inspectedOrder.order_number}
              </h3>
              <button
                type="button"
                onClick={() => setIsNotesModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '0.78rem', color: C.textMuted, margin: 0 }}>
                Catatan ini hanya terlihat oleh staf gudang & admin toko, tidak dapat dilihat oleh pelanggan.
              </p>

              <textarea
                rows={4}
                value={internalNotesText}
                onChange={(e) => setInternalNotesText(e.target.value)}
                placeholder="Tulis instruksi khusus (misal: QC ekstra, packaging kayu, dsb)..."
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: C.surfaceLow,
                  border: `1px solid ${C.border}`,
                  borderRadius: '8px',
                  fontSize: '0.84rem',
                  fontFamily: 'var(--font-body)',
                  color: C.textHead,
                  outline: 'none',
                  resize: 'vertical'
                }}
              />

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsNotesModalOpen(false)}
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
                  onClick={handleSaveInternalNotes}
                  style={{
                    flex: 2,
                    height: '40px',
                    backgroundColor: '#0F172A',
                    color: C.neonLime,
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 900,
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  SIMPAN CATATAN
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 5: CETAK LABEL PENGIRIMAN MASSAL                         */}
      {/* ============================================================== */}
      {isMassPrintModalOpen && (
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
            maxWidth: '520px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: C.shadowXl,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '20px',
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: `2px solid ${C.neonLime}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Printer size={20} style={{ color: C.neonLime }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>
                  Cetak {selectedOrderIds.length} Label Pengiriman Massal
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMassPrintModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '0.84rem', color: C.textMain, margin: 0 }}>
                Siap mencetak lembar AWB pengiriman sekaligus untuk <strong>{selectedOrderIds.length} pesanan terpilih</strong>:
              </p>

              <div style={{
                maxHeight: '180px',
                overflowY: 'auto',
                backgroundColor: C.surfaceLow,
                borderRadius: '8px',
                padding: '10px 14px',
                border: `1px solid ${C.border}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                {orders.filter(o => selectedOrderIds.includes(o.id)).map(ord => (
                  <div key={ord.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', fontFamily: 'var(--font-mono)' }}>
                    <span style={{ fontWeight: 800 }}>#{ord.order_number} — {ord.recipient_name}</span>
                    <span style={{ color: C.textMuted }}>{ord.courier}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsMassPrintModalOpen(false)}
                  style={{
                    flex: 1,
                    height: '42px',
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
                  onClick={() => {
                    window.print();
                    setOrders(prev => prev.map(o => selectedOrderIds.includes(o.id) ? { ...o, is_label_printed: true } : o));
                    setIsMassPrintModalOpen(false);
                    toast.success(`${selectedOrderIds.length} Label massal berhasil dikirim ke printer!`);
                  }}
                  style={{
                    flex: 2,
                    height: '42px',
                    backgroundColor: '#0F172A',
                    color: C.neonLime,
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 900,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)'
                  }}
                >
                  PRINT SEMUA LABEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default OrderManagement;
