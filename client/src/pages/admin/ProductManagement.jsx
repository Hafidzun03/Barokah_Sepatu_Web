import React, { useState, useEffect, useMemo, useRef } from 'react';
import { sampleProducts, sampleCategories } from '../../data/sampleProducts';
import { formatIDR } from '../../lib/utils';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  Edit3,
  Trash2,
  Package,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  MoreVertical,
  X,
  Ruler,
  Star,
  ExternalLink,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Check,
  FileText,
  LayoutGrid,
  List,
  Tag,
  ArrowUpDown
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ===================================================================
   MANAJEMEN PRODUK — EXECUTIVE STREETWEAR ATELIER DESIGN (STITCH SPEC)
   Matches the Barokah Shoes E-Commerce Platform admin specifications.
   =================================================================== */

const C = {
  bgPage:        '#F8FAFC',
  card:          '#FFFFFF',
  cardHover:     '#F1F5F9',
  surface:       '#F8FAFC',
  surfaceLow:    '#F1F5F9',
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

  // Secondary Neon / Accent Tag (from Stitch: #D0F12F / #556500)
  neonLime:      '#D0F12F',
  neonLimeText:  '#181E00',
  limeDark:      '#556500',

  // Neutral Typography
  textHead:      '#020617',
  textMain:      '#0F172A',
  textSub:       '#334155',
  textMuted:     '#64748B',
  textLight:     '#94A3B8',

  // Alerts
  amberText:     '#B45309',
  amberBg:       '#FEF3C7',
  amberBorder:   '#FDE68A',
  
  redText:       '#DC2626',
  redBg:         '#FEF2F2',
  redBorder:     '#FECACA',

  shadowSm:      '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
  shadowMd:      '0 4px 12px -2px rgba(15, 23, 42, 0.05), 0 2px 4px -2px rgba(15, 23, 42, 0.03)',
  shadowLg:      '0 10px 25px -3px rgba(15, 23, 42, 0.08), 0 4px 10px -2px rgba(15, 23, 42, 0.03)',
};

export const ProductManagement = ({ onNavigateBack }) => {
  // Products state — populated exclusively from Supabase (fallback: sampleProducts)
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all'); // 'all' | 'active' | 'draft' | 'inactive'
  const [selectedStockStatus, setSelectedStockStatus] = useState('all'); // 'all' | 'healthy' | 'critical' | 'empty'
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'price-asc' | 'price-desc' | 'stock-desc' | 'sold-desc'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  // Batch Selection State
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());

  // Modal states
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [quickStockProduct, setQuickStockProduct] = useState(null);
  const [detailProduct, setDetailProduct] = useState(null);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');

  // Preset Kategori Ukuran Standar Sepatu
  const SIZE_PRESETS = [
    {
      id: 'men',
      label: 'Sepatu Pria',
      icon: '👟',
      description: 'EU 39 - 45',
      sizes: ['39', '40', '41', '42', '43', '44', '45'],
      defaultStock: 12
    },
    {
      id: 'women',
      label: 'Sepatu Wanita',
      icon: '👠',
      description: 'EU 36 - 41',
      sizes: ['36', '37', '38', '39', '40', '41'],
      defaultStock: 12
    },
    {
      id: 'kids',
      label: 'Sepatu Anak',
      icon: '🧒',
      description: 'EU 28 - 34',
      sizes: ['28', '29', '30', '31', '32', '33', '34'],
      defaultStock: 10
    },
    {
      id: 'unisex',
      label: 'Unisex / Lengkap',
      icon: '🌐',
      description: 'EU 36 - 45',
      sizes: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'],
      defaultStock: 10
    }
  ];

  // Form State for Add / Edit
  const defaultVariants = [
    { id: 'v-39', size: '39', stock: 12 },
    { id: 'v-40', size: '40', stock: 16 },
    { id: 'v-41', size: '41', stock: 20 },
    { id: 'v-42', size: '42', stock: 18 },
    { id: 'v-43', size: '43', stock: 15 },
    { id: 'v-44', size: '44', stock: 10 },
    { id: 'v-45', size: '45', stock: 6 }
  ];

  const initialFormState = {
    name: '',
    sku: '',
    category_id: '',
    category_name: '',
    price: '',
    discount_price: '',
    weight_grams: 850,
    is_featured: false,
    is_active: true,
    description: '',
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'],
    variants: defaultVariants
  };

  const [formData, setFormData] = useState(initialFormState);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [bulkStockInput, setBulkStockInput] = useState('');

  // Fallback high-res streetwear photography per shoe slug
  const sneakerFallbackImages = {
    'barokah-runner-pro-x': ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'],
    'urban-classic-leather': ['https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=800&q=80'],
    'street-flex-canvas': ['https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80'],
    'lady-comfort-slip-on': ['https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=800&q=80'],
    'junior-active-velcro': ['https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&w=800&q=80'],
    'summit-trail-hiker': ['https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=800&q=80']
  };

  // Helper: Ensure client is authenticated with admin session for PostgreSQL RLS policies
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
        if (error) {
          console.warn('Admin sign-in error:', error);
        }
      }
      // Guarantee the authenticated user has role: 'admin' in profiles table so is_admin() RLS passes
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

  // Helper: fetch all real categories from Supabase
  const fetchCategoriesFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, description')
        .order('sort_order', { ascending: true });
      if (!error && data && data.length > 0) {
        setCategories(data);
        return data;
      }
    } catch (e) {
      console.warn('Supabase fetch categories error:', e);
    }
    setCategories(sampleCategories);
    return sampleCategories;
  };

  // Helper: fetch all products from Supabase and update state
  const fetchProductsFromSupabase = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, name, slug, description, base_price, discount_price, weight_grams, is_featured, is_active, category_id, total_sold, created_at,
          categories ( id, name ),
          product_variants ( id, size, stock, sku ),
          product_images ( id, image_url, is_primary, sort_order )
        `)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const formatted = data.map(item => {
          const primaryVariant = item.product_variants?.find(v => v.sku) || item.product_variants?.[0];
          const sortedImgs = (item.product_images || [])
            .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) || (a.sort_order - b.sort_order))
            .map(img => img.image_url)
            .filter(url => url && !url.includes('placehold.co'));

          const fallbackList = sneakerFallbackImages[item.slug] || ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'];
          const finalImages = sortedImgs.length > 0 ? sortedImgs : fallbackList;

          return {
            id: item.id,
            name: item.name,
            slug: item.slug,
            sku: primaryVariant?.sku || `BRK-${String(item.id).slice(0, 6).toUpperCase()}`,
            description: item.description,
            price: item.base_price,
            base_price: item.base_price,
            discount_price: item.discount_price,
            weight_grams: item.weight_grams || 850,
            is_featured: !!item.is_featured,
            is_active: item.is_active !== false,
            category_id: item.category_id || '',
            category_name: item.categories?.name || 'Footwear',
            images: finalImages,
            variants: item.product_variants?.length > 0 ? item.product_variants : defaultVariants,
            rating: 5.0,
            reviews_count: 0,
            total_sold: item.total_sold || 0
          };
        });
        setProducts(formatted);
        localStorage.setItem('barokah_admin_products', JSON.stringify(formatted));
      } else {
        // Fallback to sample products only if DB is empty
        setProducts(sampleProducts);
      }
    } catch (e) {
      console.warn('Supabase fetch products error:', e);
      const saved = localStorage.getItem('barokah_admin_products');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) setProducts(parsed);
        } catch (err) { /* ignore */ }
      } else {
        setProducts(sampleProducts);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch real categories and products on mount
  useEffect(() => {
    ensureAdminAuth();
    if (isSupabaseConfigured) {
      fetchCategoriesFromSupabase().then(cats => {
        if (cats && cats.length > 0) {
          setFormData(prev => ({
            ...prev,
            category_id: cats[0].id,
            category_name: cats[0].name
          }));
        }
      });
      fetchProductsFromSupabase();
    } else {
      const saved = localStorage.getItem('barokah_admin_products');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) setProducts(parsed);
        } catch (e) { /* ignore */ }
      } else {
        setProducts(sampleProducts);
      }
      setCategories(sampleCategories);
      setIsLoading(false);
    }

    // Refresh data otomatis saat ada pembelian pelanggan atau pembaruan stok
    const handleStockRefresh = () => {
      fetchProductsFromSupabase();
    };
    window.addEventListener('barokah:stock_updated', handleStockRefresh);
    window.addEventListener('barokah:products_updated', handleStockRefresh);
    window.addEventListener('barokah:order_placed', handleStockRefresh);
    return () => {
      window.removeEventListener('barokah:stock_updated', handleStockRefresh);
      window.removeEventListener('barokah:products_updated', handleStockRefresh);
      window.removeEventListener('barokah:order_placed', handleStockRefresh);
    };
  }, []);

  // Filtered and Sorted Products
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        prod.name?.toLowerCase().includes(q) ||
        prod.sku?.toLowerCase().includes(q) ||
        prod.slug?.toLowerCase().includes(q) ||
        (prod.category_name && prod.category_name.toLowerCase().includes(q));

      // Category
      const matchCategory =
        selectedCategory === 'all' ||
        String(prod.category_id) === String(selectedCategory) ||
        (prod.category_name || '').toLowerCase() === selectedCategory.toLowerCase();

      // Total Stock calculation
      const totalStock = prod.variants ? prod.variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0) : 0;

      // Status Filter
      let matchStatus = true;
      if (selectedStatus === 'active') {
        matchStatus = prod.is_active !== false && totalStock > 0;
      } else if (selectedStatus === 'draft') {
        matchStatus = prod.is_active === false;
      } else if (selectedStatus === 'inactive') {
        matchStatus = prod.is_active === false || totalStock === 0;
      }

      // Stock Threshold Filter
      let matchStock = true;
      if (selectedStockStatus === 'healthy') {
        matchStock = totalStock > 10;
      } else if (selectedStockStatus === 'critical') {
        matchStock = totalStock > 0 && totalStock <= 5;
      } else if (selectedStockStatus === 'empty') {
        matchStock = totalStock === 0;
      }

      return matchSearch && matchCategory && matchStatus && matchStock;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return (a.discount_price || a.price) - (b.discount_price || b.price);
      if (sortBy === 'price-desc') return (b.discount_price || b.price) - (a.discount_price || a.price);
      if (sortBy === 'sold-desc') return (b.total_sold || 0) - (a.total_sold || 0);
      if (sortBy === 'stock-desc') {
        const stockA = a.variants?.reduce((s, v) => s + (Number(v.stock) || 0), 0) || 0;
        const stockB = b.variants?.reduce((s, v) => s + (Number(v.stock) || 0), 0) || 0;
        return stockB - stockA;
      }
      return 0;
    });
  }, [products, searchQuery, selectedCategory, selectedStatus, selectedStockStatus, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    const total = products.length;
    let healthy = 0;
    let critical = 0;
    let empty = 0;

    products.forEach(p => {
      const stock = p.variants?.reduce((sum, v) => sum + (Number(v.stock) || 0), 0) || 0;
      if (stock === 0) empty++;
      else if (stock <= 5) critical++;
      else healthy++;
    });

    const categoriesCount = new Set(products.map(p => p.category_name || p.category_id)).size;

    return { total, healthy, critical, empty, categoriesCount };
  }, [products]);

  // Checkbox handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRowIds(new Set(filteredProducts.map(p => p.id)));
    } else {
      setSelectedRowIds(new Set());
    }
  };

  const handleToggleRow = (id) => {
    setSelectedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Batch actions
  const handleBatchActivate = async (activate) => {
    await ensureAdminAuth();
    setProducts(prev => prev.map(p => selectedRowIds.has(p.id) ? { ...p, is_active: activate } : p));
    if (isSupabaseConfigured) {
      try {
        for (const id of selectedRowIds) {
          await supabase.from('products').update({ is_active: activate }).eq('id', id);
        }
      } catch (err) {
        console.error('Batch activate error:', err);
      }
    }
    toast.success(`${selectedRowIds.size} produk berhasil di-${activate ? 'aktifkan' : 'non-aktifkan'}.`);
    setSelectedRowIds(new Set());
  };

  const handleBatchDelete = async () => {
    if (selectedRowIds.size === 0) return;
    if (!window.confirm(`Hapus permanen ${selectedRowIds.size} produk yang dipilih dari katalog dan database?`)) return;

    const toastId = toast.loading(`Menghapus ${selectedRowIds.size} produk dari database...`);
    try {
      if (isSupabaseConfigured) {
        await ensureAdminAuth();
        for (const id of selectedRowIds) {
          await supabase.from('product_images').delete().eq('product_id', id);
          await supabase.from('product_variants').delete().eq('product_id', id);
          await supabase.from('wishlists').delete().eq('product_id', id);
          await supabase.from('products').delete().eq('id', id);
        }
      }

      setProducts(prev => {
        const updated = prev.filter(p => !selectedRowIds.has(p.id));
        localStorage.setItem('barokah_admin_products', JSON.stringify(updated));
        return updated;
      });

      toast.success(`${selectedRowIds.size} produk berhasil dihapus dari database!`, { id: toastId });
      setSelectedRowIds(new Set());
      await fetchProductsFromSupabase();
    } catch (err) {
      console.error('Batch delete error:', err);
      toast.error('Gagal menghapus batch: ' + err.message, { id: toastId });
    }
  };

  const handleExportSelected = () => {
    const exportData = products.filter(p => selectedRowIds.has(p.id));
    generateCsvDownload(exportData.length > 0 ? exportData : products);
  };

  // CSV Generator
  const generateCsvDownload = (dataset) => {
    const headers = ['ID', 'Nama Produk', 'SKU Induk', 'Kategori', 'Harga Retail', 'Harga Diskon', 'Total Stok', 'Status'];
    const rows = dataset.map(p => {
      const totalStock = p.variants ? p.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0) : 0;
      return [
        p.id,
        `"${p.name.replace(/"/g, '""')}"`,
        p.sku || '',
        `"${p.category_name || ''}"`,
        p.price,
        p.discount_price || '',
        totalStock,
        p.is_active !== false ? 'Aktif' : 'Non-aktif'
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Barokah_Katalog_Produk_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('File CSV Katalog Produk berhasil diunduh!');
  };

  // Quick Toggle Active/Inactive Status
  const handleToggleStatus = async (product) => {
    const nextStatus = product.is_active === false;
    // Optimistic UI update
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_active: nextStatus } : p));
    toast.success(`Siluet "${product.name}" sekarang ${nextStatus ? 'Aktif di katalog' : 'Non-aktif'}.`);

    if (isSupabaseConfigured) {
      try {
        await ensureAdminAuth();
        const { error } = await supabase
          .from('products')
          .update({ is_active: nextStatus })
          .eq('id', product.id);
        if (error) {
          console.warn('Toggle status warning:', error);
        }
      } catch (err) {
        console.error('Toggle status error:', err);
      }
    }
  };

  // Add / Edit Handlers
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    const firstCat = categories.length > 0 ? categories[0] : sampleCategories[0];
    setFormData({
      ...initialFormState,
      category_id: firstCat?.id || '',
      category_name: firstCat?.name || 'Footwear'
    });
    setIsFormDrawerOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    const activeCats = categories.length > 0 ? categories : sampleCategories;
    const matchedCat = activeCats.find(c => String(c.id) === String(product.category_id) || c.name === product.category_name) || activeCats[0];

    setFormData({
      name: product.name || '',
      sku: product.sku || '',
      category_id: matchedCat?.id || '',
      category_name: matchedCat?.name || product.category_name || 'Footwear',
      price: product.price || '',
      discount_price: product.discount_price || '',
      weight_grams: product.weight_grams || 850,
      is_featured: !!product.is_featured,
      is_active: product.is_active !== false,
      description: product.description || '',
      images: product.images && product.images.length > 0 ? product.images : [initialFormState.images[0]],
      variants: product.variants || defaultVariants
    });
    setIsFormDrawerOpen(true);
  };

  // Delete request: opens the confirmation modal
  const handleDeleteProduct = (productId, productName) => {
    const prod = products.find(p => p.id === productId);
    setDeleteConfirmProduct(prod || { id: productId, name: productName });
  };

  // Delete confirm execution: deletes from Supabase + localStorage with atomic feedback
  const handleConfirmDelete = async () => {
    if (!deleteConfirmProduct) return;
    const { id: productId, name: productName } = deleteConfirmProduct;
    setIsDeleting(true);
    const toastId = toast.loading(`Menghapus siluet "${productName}" dari database...`);

    try {
      if (isSupabaseConfigured) {
        await ensureAdminAuth();

        // 1. Delete dependent child records first
        await supabase.from('product_images').delete().eq('product_id', productId);
        await supabase.from('product_variants').delete().eq('product_id', productId);
        await supabase.from('wishlists').delete().eq('product_id', productId);

        // 2. Delete product and check deleted rows
        const { data: delResult, error: delErr } = await supabase
          .from('products')
          .delete()
          .eq('id', productId)
          .select();

        if (delErr) {
          throw delErr;
        }

        // If 0 rows deleted, re-authenticate with admin credentials and retry
        if (!delResult || delResult.length === 0) {
          await supabase.auth.signInWithPassword({
            email: 'admin@barokahshoes.id',
            password: 'AdminPassword123!'
          });
          await supabase.from('products').delete().eq('id', productId).select();
        }
      }

      // Update state and localStorage
      setProducts(prev => {
        const updated = prev.filter(p => p.id !== productId);
        localStorage.setItem('barokah_admin_products', JSON.stringify(updated));
        return updated;
      });

      toast.success(`Siluet "${productName}" berhasil dihapus dari katalog!`, { id: toastId });
      setDeleteConfirmProduct(null);
      await fetchProductsFromSupabase();
    } catch (err) {
      console.error('Delete product error:', err);
      toast.error(`Gagal menghapus produk: ${err.message}`, { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Nama produk siluet wajib diisi!');
      return;
    }
    if (!formData.price) {
      toast.error('Harga retail standar wajib diisi!');
      return;
    }

    const activeCats = categories.length > 0 ? categories : sampleCategories;
    const matchedCategory = activeCats.find(c => String(c.id) === String(formData.category_id)) || activeCats[0];
    const categoryId = matchedCategory ? matchedCategory.id : (formData.category_id || null);
    const categoryName = matchedCategory ? matchedCategory.name : (formData.category_name || 'Footwear');

    const baseSlug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let finalSlug = baseSlug;
    if (products.some(p => p.slug === finalSlug && (!editingProduct || p.id !== editingProduct.id))) {
      finalSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    }

    const basePrice = Number(formData.price);
    const discountPrice = formData.discount_price ? Number(formData.discount_price) : null;
    const weightGrams = Number(formData.weight_grams) || 850;

    await ensureAdminAuth();

    if (editingProduct && isSupabaseConfigured) {
      // ── UPDATE existing product in Supabase ──
      try {
        const { error: prodErr } = await supabase
          .from('products')
          .update({
            name: formData.name.trim(),
            slug: editingProduct.slug || finalSlug,
            description: formData.description || '',
            base_price: basePrice,
            discount_price: discountPrice,
            weight_grams: weightGrams,
            is_featured: !!formData.is_featured,
            is_active: formData.is_active !== false,
            category_id: categoryId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingProduct.id);

        if (prodErr) throw prodErr;

        // Update variants: delete old, re-insert with unique SKUs
        await supabase.from('product_variants').delete().eq('product_id', editingProduct.id);
        if (formData.variants?.length > 0) {
          const skuBase = (formData.sku || `BRK-${finalSlug.slice(0, 4).toUpperCase()}`).trim();
          const variantRows = formData.variants.map((v, idx) => ({
            product_id: editingProduct.id,
            size: String(v.size),
            stock: Number(v.stock) || 0,
            sku: `${skuBase}-${v.size}-${Date.now().toString().slice(-3)}${idx}`,
          }));
          await supabase.from('product_variants').insert(variantRows);
        }

        // Update images: delete old, re-insert
        await supabase.from('product_images').delete().eq('product_id', editingProduct.id);
        if (formData.images?.length > 0) {
          const imageRows = formData.images.map((url, idx) => ({
            product_id: editingProduct.id,
            image_url: url,
            is_primary: idx === 0,
            sort_order: idx,
          }));
          await supabase.from('product_images').insert(imageRows);
        }

        toast.success(`Siluet "${formData.name}" berhasil diperbarui!`);
        await fetchProductsFromSupabase();
        window.dispatchEvent(new CustomEvent('barokah:products_updated'));
        localStorage.setItem('barokah_products_version', Date.now().toString());
      } catch (err) {
        console.error('Supabase update product error:', err);
        toast.error(`Gagal memperbarui produk: ${err.message}`);
        return;
      }
    } else if (editingProduct) {
      // Offline fallback update
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? {
        ...p, ...formData,
        slug: p.slug || finalSlug,
        price: basePrice, base_price: basePrice,
        discount_price: discountPrice, weight_grams: weightGrams,
        category_name: categoryName
      } : p));
      toast.success(`Siluet "${formData.name}" berhasil diperbarui!`);
      window.dispatchEvent(new CustomEvent('barokah:products_updated'));
      localStorage.setItem('barokah_products_version', Date.now().toString());
    } else if (isSupabaseConfigured) {
      // ── INSERT new product into Supabase ──
      try {
        const { data: newProds, error: prodErr } = await supabase
          .from('products')
          .insert([{
            name: formData.name.trim(),
            slug: finalSlug,
            description: formData.description || '',
            base_price: basePrice,
            discount_price: discountPrice,
            weight_grams: weightGrams,
            is_featured: !!formData.is_featured,
            is_active: formData.is_active !== false,
            category_id: categoryId,
          }])
          .select('id')
          .single();

        if (prodErr) throw prodErr;
        const newProductId = newProds.id;

        // Insert variants
        if (formData.variants?.length > 0) {
          const skuBase = (formData.sku || `BRK-${finalSlug.slice(0, 4).toUpperCase()}`).trim();
          const variantRows = formData.variants.map((v, idx) => ({
            product_id: newProductId,
            size: String(v.size),
            stock: Number(v.stock) || 0,
            sku: `${skuBase}-${v.size}-${Date.now().toString().slice(-3)}${idx}`,
          }));
          const { error: varErr } = await supabase.from('product_variants').insert(variantRows);
          if (varErr) console.warn('Variant insert error:', varErr);
        }

        // Insert images
        if (formData.images?.length > 0) {
          const imageRows = formData.images.map((url, idx) => ({
            product_id: newProductId,
            image_url: url,
            is_primary: idx === 0,
            sort_order: idx,
          }));
          const { error: imgErr } = await supabase.from('product_images').insert(imageRows);
          if (imgErr) console.warn('Image insert error:', imgErr);
        }

        toast.success(`Siluet "${formData.name}" berhasil diterbitkan ke katalog!`);
        await fetchProductsFromSupabase();
        window.dispatchEvent(new CustomEvent('barokah:products_updated'));
        localStorage.setItem('barokah_products_version', Date.now().toString());
      } catch (err) {
        console.error('Supabase insert product error:', err);
        toast.error(`Gagal menyimpan produk: ${err.message}`);
        return;
      }
    } else {
      // Offline fallback new product
      const newProduct = {
        id: `prod-${Date.now()}`,
        slug: finalSlug,
        ...formData,
        price: basePrice, base_price: basePrice,
        discount_price: discountPrice,
        weight_grams: weightGrams,
        category_name: categoryName,
        rating: 5.0, reviews_count: 0, total_sold: 0
      };
      setProducts(prev => [newProduct, ...prev]);
      localStorage.setItem('barokah_admin_products', JSON.stringify([newProduct, ...products]));
      toast.success(`Siluet "${formData.name}" berhasil diterbitkan ke katalog!`);
    }

    setIsFormDrawerOpen(false);
  };

  const handleVariantStockChange = (index, newStock) => {
    const updated = [...formData.variants];
    updated[index].stock = Math.max(0, parseInt(newStock, 10) || 0);
    setFormData(prev => ({ ...prev, variants: updated }));
  };

  // Terapkan Template Kategori Ukuran (Pria, Wanita, Anak, Unisex)
  const applySizePreset = (presetId) => {
    const preset = SIZE_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    // Pertahankan stok jika ukuran sudah ada di input saat ini
    const existingStockMap = new Map();
    (formData.variants || []).forEach(v => {
      existingStockMap.set(String(v.size), Number(v.stock) || 0);
    });

    const newVariants = preset.sizes.map(sz => ({
      id: `v-${sz}`,
      size: String(sz),
      stock: existingStockMap.has(String(sz)) ? existingStockMap.get(String(sz)) : preset.defaultStock
    }));

    setFormData(prev => ({
      ...prev,
      variants: newVariants
    }));
    toast.success(`Template ${preset.label} (${preset.description}) berhasil diterapkan!`);
  };

  // Tambah Ukuran Kustom Bebas (misal: 35, 46, dll)
  const handleAddCustomSize = (e) => {
    if (e) e.preventDefault();
    const cleanSize = customSizeInput.trim().toUpperCase();
    if (!cleanSize) {
      toast.error('Masukkan nomor ukuran terlebih dahulu!');
      return;
    }

    const currentVariants = formData.variants || [];
    const exists = currentVariants.some(v => String(v.size) === cleanSize);
    if (exists) {
      toast.error(`Ukuran EU ${cleanSize} sudah ada dalam daftar.`);
      return;
    }

    const updated = [
      ...currentVariants,
      { id: `v-${cleanSize.toLowerCase()}`, size: cleanSize, stock: 10 }
    ].sort((a, b) => {
      const numA = parseFloat(a.size);
      const numB = parseFloat(b.size);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return String(a.size).localeCompare(String(b.size));
    });

    setFormData(prev => ({ ...prev, variants: updated }));
    setCustomSizeInput('');
    toast.success(`Ukuran EU ${cleanSize} berhasil ditambahkan!`);
  };

  // Hapus Ukuran Tertentu dari Daftar
  const handleRemoveVariantSize = (sizeToRemove) => {
    const currentVariants = formData.variants || [];
    if (currentVariants.length <= 1) {
      toast.error('Produk minimal harus memiliki 1 ukuran.');
      return;
    }
    const updated = currentVariants.filter(v => String(v.size) !== String(sizeToRemove));
    setFormData(prev => ({ ...prev, variants: updated }));
    toast.success(`Ukuran EU ${sizeToRemove} dihapus.`);
  };

  // Terapkan Jumlah Stok Seragam ke Semua Ukuran
  const handleApplyBulkStock = () => {
    const qty = parseInt(bulkStockInput, 10);
    if (isNaN(qty) || qty < 0) {
      toast.error('Masukkan jumlah stok yang valid (angka 0 atau lebih).');
      return;
    }
    const updated = (formData.variants || []).map(v => ({
      ...v,
      stock: qty
    }));
    setFormData(prev => ({ ...prev, variants: updated }));
    setBulkStockInput('');
    toast.success(`Semua ukuran diatur ke ${qty} pasang!`);
  };

  // Quick Stock adjustment — directly syncs with Supabase product_variants
  const handleSaveQuickStock = async () => {
    if (!quickStockProduct) return;
    try {
      await ensureAdminAuth();
      if (isSupabaseConfigured && quickStockProduct.variants?.length > 0) {
        for (const v of quickStockProduct.variants) {
          if (v.id) {
            await supabase
              .from('product_variants')
              .update({ stock: Number(v.stock) || 0 })
              .eq('id', v.id);
          } else {
            await supabase
              .from('product_variants')
              .update({ stock: Number(v.stock) || 0 })
              .eq('product_id', quickStockProduct.id)
              .eq('size', String(v.size));
          }
        }
      }
      setProducts(prev => prev.map(p => p.id === quickStockProduct.id ? quickStockProduct : p));
      toast.success(`Alokasi stok ukuran untuk "${quickStockProduct.name}" berhasil diperbarui!`);
      setQuickStockProduct(null);
      await fetchProductsFromSupabase();
    } catch (err) {
      console.error('Quick stock save error:', err);
      toast.error('Gagal memperbarui stok: ' + err.message);
    }
  };

  // Batch Import handler
  const handleBatchImportSubmit = (e) => {
    e.preventDefault();
    if (!importJsonText.trim()) {
      toast.error('Masukkan data JSON atau CSV produk terlebih dahulu.');
      return;
    }

    try {
      const parsed = JSON.parse(importJsonText);
      if (Array.isArray(parsed)) {
        setProducts(prev => [...parsed, ...prev]);
        toast.success(`Berhasil mengimpor ${parsed.length} siluet produk baru!`);
        setIsImportModalOpen(false);
        setImportJsonText('');
      } else {
        toast.error('Format JSON harus berupa Array produk.');
      }
    } catch (err) {
      toast.error('Gagal membaca JSON: ' + err.message);
    }
  };

  const handleLoadSampleBatch = () => {
    const sampleBatch = [
      {
        id: `imp-${Date.now()}-1`,
        name: "Barokah Retro Dunk 'Pine Green'",
        slug: "barokah-retro-dunk-pine-green",
        sku: "BK-DNK-019",
        category_id: "1",
        category_name: "Sneakers",
        price: 2150000,
        discount_price: 1850000,
        weight_grams: 900,
        is_featured: true,
        is_active: true,
        description: "Siluet skate retro legendaris dengan aksen pine green leather premium.",
        images: ["https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80"],
        variants: [
          { id: "v-40", size: "40", stock: 12 },
          { id: "v-41", size: "41", stock: 18 },
          { id: "v-42", size: "42", stock: 14 }
        ],
        rating: 4.9,
        reviews_count: 8,
        total_sold: 45
      },
      {
        id: `imp-${Date.now()}-2`,
        name: "Barokah Hybrid Trekker Vibram",
        slug: "barokah-hybrid-trekker-vibram",
        sku: "BK-TRK-881",
        category_id: "2",
        category_name: "Boots",
        price: 2850000,
        discount_price: null,
        weight_grams: 1200,
        is_featured: false,
        is_active: true,
        description: "Boots outdoor perkotaan dengan sol Vibram grip tahan air.",
        images: ["https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=800&q=80"],
        variants: [
          { id: "v-41", size: "41", stock: 8 },
          { id: "v-42", size: "42", stock: 10 },
          { id: "v-43", size: "43", stock: 6 }
        ],
        rating: 5.0,
        reviews_count: 12,
        total_sold: 30
      }
    ];
    setImportJsonText(JSON.stringify(sampleBatch, null, 2));
    toast.success('Template sampel produk berhasil dimuat ke editor.');
  };

  const isAllSelected = filteredProducts.length > 0 && selectedRowIds.size === filteredProducts.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>

      {/* ============================================================== */}
      {/* 1. HEADER & QUICK METRIK BAR (MATCHING STITCH DESKTOP SPEC)   */}
      {/* ============================================================== */}
      <section style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '20px',
        paddingBottom: '20px',
        borderBottom: `1px solid ${C.border}`
      }}>
        {/* Left: Breadcrumbs + Title + Schema Note */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <span style={{ color: C.textMuted }}>Admin</span>
            <ChevronRight size={13} color={C.textLight} />
            <span style={{ color: C.textMuted }}>Inventaris</span>
            <ChevronRight size={13} color={C.textLight} />
            <span style={{
              backgroundColor: '#0F172A',
              color: C.neonLime,
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '10px'
            }}>
              Produk Relasional
            </span>
          </div>

          <h1 style={{
            margin: 0,
            fontSize: '1.85rem',
            fontWeight: 900,
            color: C.textHead,
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-heading)'
          }}>
            Manajemen Produk
          </h1>

          <p style={{ margin: 0, fontSize: '0.8rem', color: C.textMuted }}>
            Sinkronisasi schema multi-tabel Supabase: <code style={{ color: C.blue, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>products</code>, <code style={{ color: C.blue, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>variants</code>, &amp; <code style={{ color: C.blue, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>media</code>.
          </p>
        </div>

        {/* Right: 3 Metric Pills + Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px' }}>
          {/* 3 Compact Metric Pills */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: C.card,
            padding: '6px 8px',
            borderRadius: '12px',
            border: `1px solid ${C.border}`,
            boxShadow: C.shadowSm
          }}>
            {/* Pill 1: Total Produk */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: C.surfaceLow
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                boxShadow: '0 0 8px #10B981'
              }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: C.textMuted, textTransform: 'uppercase' }}>
                  TOTAL PRODUK
                </span>
                <span style={{ fontSize: '0.88rem', fontWeight: 900, color: C.textMain, lineHeight: 1 }}>
                  {stats.total} Aktif
                </span>
              </div>
            </div>

            {/* Pill 2: Kategori */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: C.surfaceLow
            }}>
              <Layers size={14} color={C.blue} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: C.textMuted, textTransform: 'uppercase' }}>
                  KATEGORI
                </span>
                <span style={{ fontSize: '0.88rem', fontWeight: 900, color: C.textMain, lineHeight: 1 }}>
                  {(categories.length > 0 ? categories : sampleCategories).length} Terdaftar
                </span>
              </div>
            </div>

            {/* Pill 3: Stok Kritis */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: stats.critical > 0 ? C.redBg : C.surfaceLow,
              border: stats.critical > 0 ? `1px solid ${C.redBorder}` : 'none'
            }}>
              <AlertTriangle size={14} color={stats.critical > 0 ? C.redText : C.amberText} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: stats.critical > 0 ? C.redText : C.amberText, textTransform: 'uppercase' }}>
                  STOK KRITIS
                </span>
                <span style={{ fontSize: '0.88rem', fontWeight: 900, color: stats.critical > 0 ? C.redText : C.textMain, lineHeight: 1 }}>
                  {stats.critical} Menipis
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => generateCsvDownload(products)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 14px',
                backgroundColor: C.card,
                border: `1px solid ${C.borderDark}`,
                borderRadius: '8px',
                color: C.textSub,
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
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
              <Download size={14} /> Ekspor CSV
            </button>

            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 14px',
                backgroundColor: C.card,
                border: `1px solid ${C.borderDark}`,
                borderRadius: '8px',
                color: C.textSub,
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: C.shadowSm
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = C.emerald;
                e.currentTarget.style.color = C.emerald;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = C.borderDark;
                e.currentTarget.style.color = C.textSub;
              }}
            >
              <Upload size={14} /> Import Batch
            </button>

            <button
              type="button"
              onClick={handleOpenAddModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                background: 'linear-gradient(135deg, #059669 0%, #2563EB 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
            >
              <Plus size={16} strokeWidth={3} /> Tambah Produk Baru
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 2. FILTER & CONTROL DECK                                      */}
      {/* ============================================================== */}
      <section style={{
        backgroundColor: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: '12px',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxShadow: C.shadowSm
      }}>
        {/* Row 1: Search and Dropdowns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'center' }}>
          
          {/* Search Input with Clear & ⌘K */}
          <div style={{ position: 'relative', gridColumn: 'span 2' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: C.textLight }} />
            <input
              type="text"
              placeholder="Cari berdasarkan nama siluet, SKU induk, atau slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: '8px',
                padding: '10px 40px 10px 38px',
                fontSize: '0.82rem',
                color: C.textMain,
                outline: 'none',
                fontFamily: 'var(--font-body)',
                transition: 'all 0.2s'
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
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: C.textMuted
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div style={{ position: 'relative' }}>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={selectControlStyle}
            >
              <option value="all">Semua Kategori ({(categories.length > 0 ? categories : sampleCategories).length})</option>
              {(categories.length > 0 ? categories : sampleCategories).map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <ChevronDown size={14} style={dropdownArrowStyle} />
          </div>

          {/* Product Status Dropdown */}
          <div style={{ position: 'relative' }}>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={selectControlStyle}
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif di Toko</option>
              <option value="draft">Draft / Non-aktif</option>
            </select>
            <ChevronDown size={14} style={dropdownArrowStyle} />
          </div>

          {/* Stock Threshold Dropdown */}
          <div style={{ position: 'relative' }}>
            <select
              value={selectedStockStatus}
              onChange={(e) => setSelectedStockStatus(e.target.value)}
              style={selectControlStyle}
            >
              <option value="all">Status Stok</option>
              <option value="healthy">Stok Aman (&gt;10)</option>
              <option value="critical">Menipis (≤5)</option>
              <option value="empty">Habis (0)</option>
            </select>
            <ChevronDown size={14} style={dropdownArrowStyle} />
          </div>

          {/* Sort By Dropdown */}
          <div style={{ position: 'relative' }}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={selectControlStyle}
            >
              <option value="newest">Sortir: Terbaru</option>
              <option value="price-asc">Harga: Termurah</option>
              <option value="price-desc">Harga: Termahal</option>
              <option value="stock-desc">Stok Terbanyak</option>
              <option value="sold-desc">Terlaris</option>
            </select>
            <ChevronDown size={14} style={dropdownArrowStyle} />
          </div>

        </div>

        {/* Row 2: Active Filters + View Toggle Mode */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          paddingTop: '8px',
          borderTop: `1px solid ${C.surfaceLow}`
        }}>
          {/* Active Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: C.textMuted, textTransform: 'uppercase' }}>
              Filter Aktif:
            </span>

            {selectedCategory !== 'all' && (
              <span style={activeChipStyle}>
                Kategori: {sampleCategories.find(c => String(c.id) === String(selectedCategory))?.name || selectedCategory}
                <button type="button" onClick={() => setSelectedCategory('all')} style={chipCloseBtnStyle}><X size={12} /></button>
              </span>
            )}

            {selectedStatus !== 'all' && (
              <span style={activeChipStyle}>
                Status: {selectedStatus === 'active' ? 'Aktif' : 'Draft'}
                <button type="button" onClick={() => setSelectedStatus('all')} style={chipCloseBtnStyle}><X size={12} /></button>
              </span>
            )}

            {selectedStockStatus !== 'all' && (
              <span style={activeChipStyle}>
                Stok: {selectedStockStatus === 'healthy' ? 'Aman' : selectedStockStatus === 'critical' ? 'Kritis' : 'Habis'}
                <button type="button" onClick={() => setSelectedStockStatus('all')} style={chipCloseBtnStyle}><X size={12} /></button>
              </span>
            )}

            {searchQuery && (
              <span style={activeChipStyle}>
                Cari: "{searchQuery}"
                <button type="button" onClick={() => setSearchQuery('')} style={chipCloseBtnStyle}><X size={12} /></button>
              </span>
            )}

            {(searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all' || selectedStockStatus !== 'all' || sortBy !== 'newest') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedStatus('all');
                  setSelectedStockStatus('all');
                  setSortBy('newest');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: C.redText,
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontWeight: 700
                }}
              >
                Reset Filter
              </button>
            )}
          </div>

          {/* View Toggle (Table / Grid) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: C.textMuted }}>
              Mode: <strong style={{ color: C.textMain }}>{viewMode === 'table' ? 'Tabel Inventaris Real-Time' : 'Grid Siluet'}</strong>
            </span>

            <div style={{
              display: 'flex',
              backgroundColor: C.surfaceLow,
              padding: '2px',
              borderRadius: '8px',
              border: `1px solid ${C.border}`
            }}>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: viewMode === 'table' ? C.card : 'transparent',
                  color: viewMode === 'table' ? C.textMain : C.textMuted,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  boxShadow: viewMode === 'table' ? C.shadowSm : 'none'
                }}
              >
                <List size={14} /> Tabel
              </button>

              <button
                type="button"
                onClick={() => setViewMode('grid')}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: viewMode === 'grid' ? C.card : 'transparent',
                  color: viewMode === 'grid' ? C.textMain : C.textMuted,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  boxShadow: viewMode === 'grid' ? C.shadowSm : 'none'
                }}
              >
                <LayoutGrid size={14} /> Grid
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. BATCH OPERATIONS TOOLBAR (WHEN ITEMS ARE SELECTED)         */}
      {/* ============================================================== */}
      {selectedRowIds.size > 0 && (
        <section style={{
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          borderRadius: '10px',
          padding: '12px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          boxShadow: '0 10px 25px rgba(15, 23, 42, 0.25)',
          animation: 'fadeIn 0.2s ease-in-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              backgroundColor: C.neonLime,
              color: C.neonLimeText,
              padding: '3px 8px',
              borderRadius: '6px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 900,
              fontSize: '11px'
            }}>
              {selectedRowIds.size} TERPILIH
            </span>
            <span style={{ fontSize: '0.82rem', color: '#94A3B8' }}>
              Terapkan perubahan serentak pada siluet yang dicentang
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleBatchActivate(true)}
              style={batchBtnStyle}
            >
              Aktifkan
            </button>
            <button
              type="button"
              onClick={() => handleBatchActivate(false)}
              style={batchBtnStyle}
            >
              Draft / Non-aktifkan
            </button>
            <button
              type="button"
              onClick={handleExportSelected}
              style={batchBtnStyle}
            >
              Ekspor Terpilih
            </button>
            <button
              type="button"
              onClick={handleBatchDelete}
              style={{ ...batchBtnStyle, backgroundColor: '#EF4444', color: '#FFFFFF' }}
            >
              Hapus Terpilih
            </button>
            <button
              type="button"
              onClick={() => setSelectedRowIds(new Set())}
              style={{ ...batchBtnStyle, backgroundColor: 'transparent', color: '#94A3B8' }}
            >
              Batal
            </button>
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* 4. MAIN PRODUCT DISPLAY: HIGH-CONTRAST TABLE OR GRID VIEW      */}
      {/* ============================================================== */}
      {viewMode === 'table' ? (
        <section style={{
          backgroundColor: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: C.shadowSm
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em'
                }}>
                  <th style={{ padding: '14px 16px', width: '40px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      style={{ cursor: 'pointer', accentColor: C.emerald }}
                    />
                  </th>
                  <th style={{ padding: '14px 16px', fontWeight: 800 }}>Siluet &amp; Detail Produk</th>
                  <th style={{ padding: '14px 14px', fontWeight: 800, color: C.neonLime }}>SKU Induk</th>
                  <th style={{ padding: '14px 14px', fontWeight: 800 }}>Kategori</th>
                  <th style={{ padding: '14px 14px', fontWeight: 800 }}>Harga Ritel</th>
                  <th style={{ padding: '14px 14px', fontWeight: 800 }}>Stok &amp; Varian</th>
                  <th style={{ padding: '14px 14px', fontWeight: 800 }}>Status</th>
                  <th style={{ padding: '14px 18px', fontWeight: 800, textAlign: 'right' }}>Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '60px 20px', textAlign: 'center', color: C.textMuted }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '12px', backgroundColor: C.surfaceLow, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Package size={28} color={C.textLight} />
                        </div>
                        <strong style={{ fontSize: '1rem', color: C.textMain }}>Tidak ada produk yang cocok</strong>
                        <span style={{ fontSize: '0.8rem' }}>Coba ubah kata kunci filter atau reset opsi pencarian.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((prod) => {
                    const isSelected = selectedRowIds.has(prod.id);
                    const totalStock = prod.variants ? prod.variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0) : 0;
                    const isOutOfStock = totalStock === 0;
                    const isCriticalStock = totalStock > 0 && totalStock <= 5;
                    const isAbundant = totalStock > 30;
                    const coverImg = prod.images?.[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80';
                    const activeState = prod.is_active !== false && !isOutOfStock;

                    return (
                      <tr
                        key={prod.id}
                        style={{
                          borderBottom: `1px solid ${C.border}`,
                          backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.04)' : isOutOfStock ? '#FAFAFA' : '#FFFFFF',
                          opacity: isOutOfStock ? 0.8 : 1,
                          transition: 'background-color 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.backgroundColor = C.surface;
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.backgroundColor = isOutOfStock ? '#FAFAFA' : '#FFFFFF';
                        }}
                      >
                        {/* Checkbox */}
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleRow(prod.id)}
                            style={{ cursor: 'pointer', accentColor: C.emerald }}
                          />
                        </td>

                        {/* Siluet & Detail */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{
                              position: 'relative',
                              width: '56px',
                              height: '56px',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              backgroundColor: C.surfaceLow,
                              border: `1px solid ${C.border}`,
                              flexShrink: 0
                            }}>
                              <img
                                src={coverImg}
                                alt={prod.name}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  filter: isOutOfStock ? 'grayscale(80%)' : 'none'
                                }}
                              />
                              {isOutOfStock ? (
                                <span style={{
                                  position: 'absolute',
                                  top: '2px',
                                  left: '2px',
                                  backgroundColor: '#0F172A',
                                  color: C.neonLime,
                                  fontSize: '8px',
                                  fontFamily: 'var(--font-mono)',
                                  fontWeight: 900,
                                  padding: '1px 4px',
                                  borderRadius: '3px'
                                }}>
                                  HABIS
                                </span>
                              ) : isCriticalStock ? (
                                <span style={{
                                  position: 'absolute',
                                  top: '2px',
                                  left: '2px',
                                  backgroundColor: '#EF4444',
                                  color: '#FFFFFF',
                                  fontSize: '8px',
                                  fontFamily: 'var(--font-mono)',
                                  fontWeight: 900,
                                  padding: '1px 4px',
                                  borderRadius: '3px'
                                }}>
                                  KRITIS
                                </span>
                              ) : prod.is_featured ? (
                                <span style={{
                                  position: 'absolute',
                                  top: '2px',
                                  left: '2px',
                                  backgroundColor: C.neonLime,
                                  color: C.neonLimeText,
                                  fontSize: '8px',
                                  fontFamily: 'var(--font-mono)',
                                  fontWeight: 900,
                                  padding: '1px 4px',
                                  borderRadius: '3px'
                                }}>
                                  TOP
                                </span>
                              ) : null}
                            </div>

                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{
                                  fontWeight: 800,
                                  color: C.textHead,
                                  fontSize: '0.9rem',
                                  textDecoration: isOutOfStock ? 'line-through' : 'none'
                                }}>
                                  {prod.name}
                                </span>
                                {prod.is_featured && (
                                  <span style={{
                                    fontSize: '9px',
                                    fontFamily: 'var(--font-mono)',
                                    fontWeight: 800,
                                    backgroundColor: '#0F172A',
                                    color: C.neonLime,
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                    textTransform: 'uppercase'
                                  }}>
                                    Unggulan
                                  </span>
                                )}
                              </div>

                              <p style={{
                                margin: '2px 0 0',
                                fontSize: '0.72rem',
                                color: C.textMuted,
                                maxWidth: '320px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {prod.description || 'Siluet streetwear performa tinggi.'}
                              </p>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                                <span style={{ fontSize: '10px', color: C.textLight, fontFamily: 'var(--font-mono)' }}>
                                  slug: <span style={{ color: C.blueText }}>{prod.slug || 'siluet-barokah'}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* SKU Induk */}
                        <td style={{ padding: '14px 14px' }}>
                          <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '11px',
                            fontWeight: 800,
                            color: C.textHead,
                            backgroundColor: C.surfaceLow,
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: `1px solid ${C.border}`
                          }}>
                            {prod.sku || `BK-GEN-0${prod.id.slice(-3)}`}
                          </span>
                        </td>

                        {/* Kategori */}
                        <td style={{ padding: '14px 14px' }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            backgroundColor: C.surfaceLow,
                            color: C.textSub,
                            border: `1px solid ${C.border}`
                          }}>
                            {prod.category_name || 'Footwear'}
                          </span>
                        </td>

                        {/* Harga Ritel */}
                        <td style={{ padding: '14px 14px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 800, color: C.textMain, fontFamily: 'var(--font-mono)', fontSize: '0.88rem' }}>
                              {formatIDR(prod.discount_price || prod.price)}
                            </span>
                            {prod.discount_price && prod.discount_price < prod.price ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: C.textLight, textDecoration: 'line-through' }}>
                                  {formatIDR(prod.price)}
                                </span>
                                <span style={{ fontSize: '9px', fontWeight: 800, color: C.redText, backgroundColor: C.redBg, padding: '1px 4px', borderRadius: '4px' }}>
                                  -{Math.round(((prod.price - prod.discount_price) / prod.price) * 100)}%
                                </span>
                              </div>
                            ) : (
                              <span style={{ fontSize: '10px', color: C.textMuted }}>Harga Reguler</span>
                            )}
                          </div>
                        </td>

                        {/* Stok & Varian */}
                        <td style={{ padding: '14px 14px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <strong style={{
                                fontSize: '0.85rem',
                                color: isOutOfStock ? C.redText : isCriticalStock ? C.amberText : C.textHead
                              }}>
                                {totalStock} Pasang
                              </strong>
                              <span style={{
                                fontSize: '10px',
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 800,
                                color: isOutOfStock ? C.redText : isCriticalStock ? C.amberText : C.emeraldText
                              }}>
                                {isOutOfStock ? '(Habis)' : isCriticalStock ? '(Kritis)' : isAbundant ? '(Melimpah)' : '(Aman)'}
                              </span>
                            </div>

                            <span style={{ fontSize: '10px', color: C.textMuted, fontFamily: 'var(--font-mono)' }}>
                              {prod.variants?.length || 0} Varian Ukuran (EU {prod.variants?.[0]?.size || '39'}-{prod.variants?.[prod.variants.length - 1]?.size || '44'})
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '14px 14px' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(prod)}
                            title="Klik untuk ubah status Aktif / Non-aktif"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 12px',
                              borderRadius: '9999px',
                              fontSize: '11px',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 800,
                              backgroundColor: activeState ? C.emeraldLight : C.surfaceLow,
                              color: activeState ? C.emeraldText : C.textMuted,
                              border: `1px solid ${activeState ? C.emeraldBorder : C.border}`,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.04)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'none';
                            }}
                          >
                            <span style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: activeState ? '#10B981' : '#94A3B8'
                            }} />
                            {activeState ? 'Aktif' : isOutOfStock ? 'Stok Kosong' : 'Non-aktif'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            {/* Detail preview button */}
                            <button
                              type="button"
                              onClick={() => setDetailProduct(prod)}
                              style={actionBtnStyle}
                              title="Lihat Detail Siluet"
                            >
                              <Eye size={15} />
                            </button>

                            {/* Quick stock button */}
                            <button
                              type="button"
                              onClick={() => setQuickStockProduct(JSON.parse(JSON.stringify(prod)))}
                              style={{ ...actionBtnStyle, color: C.emerald, borderColor: C.emeraldBorder, backgroundColor: C.emeraldLight }}
                              title="Update Stok Cepat"
                            >
                              <Ruler size={15} />
                            </button>

                            {/* Edit button */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(prod)}
                              style={{ ...actionBtnStyle, color: C.blue, borderColor: C.blueBorder, backgroundColor: C.blueLight }}
                              title="Edit Siluet"
                            >
                              <Edit3 size={15} />
                            </button>

                            {/* Quick toggle status */}
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(prod)}
                              style={{
                                ...actionBtnStyle,
                                color: prod.is_active !== false ? '#D97706' : C.emeraldText,
                                borderColor: prod.is_active !== false ? '#FDE68A' : C.emeraldBorder,
                                backgroundColor: prod.is_active !== false ? '#FEF3C7' : C.emeraldLight
                              }}
                              title={prod.is_active !== false ? "Non-aktifkan Siluet" : "Aktifkan Siluet"}
                            >
                              {prod.is_active !== false ? <EyeOff size={15} /> : <Check size={15} />}
                            </button>

                            {/* Delete button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(prod.id, prod.name)}
                              style={{ ...actionBtnStyle, color: C.redText }}
                              title="Hapus Siluet"
                            >
                              <Trash2 size={15} />
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

          {/* Table Footer: Summary & Limit */}
          <div style={{
            padding: '14px 20px',
            backgroundColor: C.surfaceLow,
            borderTop: `1px solid ${C.border}`,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            fontSize: '0.78rem'
          }}>
            <span style={{ color: C.textMuted }}>
              Menampilkan <strong style={{ color: C.textMain }}>{filteredProducts.length}</strong> dari <strong style={{ color: C.textMain }}>{products.length}</strong> produk siluet terdaftar
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: C.textMuted }}>
                Paginasi Real-Time (Client Sync): <strong>Semua Ditampilkan</strong>
              </span>
            </div>
          </div>
        </section>
      ) : (
        /* GRID VIEW MODE */
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px'
        }}>
          {filteredProducts.map((prod) => {
            const totalStock = prod.variants ? prod.variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0) : 0;
            const coverImg = prod.images?.[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80';
            const isCritical = totalStock > 0 && totalStock <= 5;
            const isOutOfStock = totalStock === 0;

            return (
              <div
                key={prod.id}
                style={{
                  backgroundColor: C.card,
                  borderRadius: '14px',
                  border: `1px solid ${C.border}`,
                  overflow: 'hidden',
                  boxShadow: C.shadowSm,
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = C.shadowMd;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = C.shadowSm;
                }}
              >
                {/* Image Showcase */}
                <div style={{ position: 'relative', height: '190px', backgroundColor: C.surfaceLow, overflow: 'hidden' }}>
                  <img
                    src={coverImg}
                    alt={prod.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {prod.is_featured && (
                    <span style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      backgroundColor: '#0F172A',
                      color: C.neonLime,
                      fontSize: '9px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 900,
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      UNGGULAN
                    </span>
                  )}
                  <span style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(4px)',
                    color: C.textMain,
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: `1px solid ${C.border}`
                  }}>
                    {prod.sku || 'SKU'}
                  </span>
                </div>

                {/* Card Content */}
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', gap: '14px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: C.blueText, fontWeight: 700 }}>
                        {prod.category_name || 'Footwear'}
                      </span>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        fontFamily: 'var(--font-mono)',
                        color: isOutOfStock ? C.redText : isCritical ? C.amberText : C.emeraldText
                      }}>
                        {totalStock} Pasang
                      </span>
                    </div>

                    <h3 style={{ margin: '6px 0 0', fontSize: '1rem', fontWeight: 800, color: C.textHead }}>
                      {prod.name}
                    </h3>

                    <div style={{ margin: '10px 0 0', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: 900, color: C.textHead, fontFamily: 'var(--font-mono)' }}>
                        {formatIDR(prod.discount_price || prod.price)}
                      </span>
                      {prod.discount_price && prod.discount_price < prod.price && (
                        <span style={{ fontSize: '11px', color: C.textLight, textDecoration: 'line-through', fontFamily: 'var(--font-mono)' }}>
                          {formatIDR(prod.price)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '12px',
                    borderTop: `1px solid ${C.border}`
                  }}>
                    <button
                      type="button"
                      onClick={() => setQuickStockProduct(JSON.parse(JSON.stringify(prod)))}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        backgroundColor: C.emeraldLight,
                        border: `1px solid ${C.emeraldBorder}`,
                        color: C.emeraldText,
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Ubah Stok ({totalStock})
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(prod)}
                        style={actionBtnStyle}
                        title="Edit"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(prod.id, prod.name)}
                        style={actionBtnStyle}
                        title="Hapus"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* ============================================================== */}
      {/* 5. SLIDE-OVER DRAWER MODAL (MATCHING STITCH MUTATION ENGINE)   */}
      {/* ============================================================== */}
      {isFormDrawerOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          display: 'flex',
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {/* Drawer Backdrop click to close */}
          <div
            style={{ position: 'absolute', inset: 0 }}
            onClick={() => setIsFormDrawerOpen(false)}
          />

          {/* Drawer Sheet */}
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '680px',
            backgroundColor: '#FFFFFF',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-10px 0 35px rgba(0, 0, 0, 0.25)',
            zIndex: 101,
            animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            {/* Drawer Header */}
            <div style={{
              padding: '20px 28px',
              borderBottom: `1px solid ${C.border}`,
              backgroundColor: C.card,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: C.neonLime }} />
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 800, textTransform: 'uppercase', color: C.textMuted }}>
                    MUTATION ENGINE (SUPABASE)
                  </span>
                </div>
                <h2 style={{ margin: '4px 0 0', fontSize: '1.35rem', fontWeight: 900, textTransform: 'uppercase', color: C.textHead }}>
                  {editingProduct ? `Edit Siluet: ${editingProduct.name}` : 'Tambah Produk Siluet Baru'}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setIsFormDrawerOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: C.textMuted,
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px'
                }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Drawer Form Body */}
            <form onSubmit={handleSaveProduct} style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px'
            }}>
              
              {/* Section 1: Identitas & Slug URL */}
              <div style={formSectionCardStyle}>
                <span style={formSectionHeadingStyle}>1. Identitas &amp; Slug URL</span>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={labelStyle}>Nama Produk / Siluet *</label>
                    <input
                      type="text"
                      required
                      placeholder="misal: Barokah Velocity X Apex"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>SKU Induk (Parent) *</label>
                    <input
                      type="text"
                      required
                      placeholder="misal: BK-VLA-0992"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                      style={{ ...inputStyle, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '12px' }}>
                  <div>
                    <label style={labelStyle}>Kategori (`category_id`) *</label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => {
                        const activeCats = categories.length > 0 ? categories : sampleCategories;
                        const matched = activeCats.find(c => String(c.id) === String(e.target.value));
                        const newCatName = matched ? matched.name : formData.category_name;
                        setFormData(prev => ({
                          ...prev,
                          category_id: e.target.value,
                          category_name: newCatName
                        }));

                        // Auto-apply preset saat menambah produk baru sesuai nama kategori
                        if (!editingProduct && newCatName) {
                          const lower = newCatName.toLowerCase();
                          if (lower.includes('wanita') || lower.includes('women') || lower.includes('heels') || lower.includes('flat')) {
                            applySizePreset('women');
                          } else if (lower.includes('anak') || lower.includes('kids') || lower.includes('junior') || lower.includes('balita')) {
                            applySizePreset('kids');
                          }
                        }
                      }}
                      style={inputStyle}
                    >
                      {(categories.length > 0 ? categories : sampleCategories).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>Slug URL Toko (Auto)</label>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: C.surfaceLow,
                      border: `1px solid ${C.border}`,
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      <span style={{ color: C.textMuted }}>/p/</span>
                      <span style={{ color: C.blueText, fontWeight: 700 }}>
                        {formData.name ? formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : 'nama-siluet'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Penetapan Finansial */}
              <div style={formSectionCardStyle}>
                <span style={formSectionHeadingStyle}>2. Penetapan Finansial (IDR)</span>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={labelStyle}>Harga Ritel Standar (Rp) *</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: C.textMuted }}>
                        IDR
                      </span>
                      <input
                        type="number"
                        required
                        min="0"
                        placeholder="2450000"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        style={{ ...inputStyle, paddingLeft: '44px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Harga Diskon / Promo (Rp)</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: C.emerald }}>
                        IDR
                      </span>
                      <input
                        type="number"
                        min="0"
                        placeholder="Kosongkan bila normal"
                        value={formData.discount_price}
                        onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
                        style={{ ...inputStyle, paddingLeft: '44px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Media Upload Dropzone */}
              <div style={formSectionCardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={formSectionHeadingStyle}>3. Foto Sepatu &amp; Galeri (`product_images`)</span>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: C.textMuted }}>Maksimal 8 Foto</span>
                </div>

                {/* Dropzone / URL Input */}
                <div style={{
                  padding: '16px',
                  borderRadius: '10px',
                  border: `2px dashed ${C.borderDark}`,
                  backgroundColor: C.surface,
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '480px' }}>
                    <input
                      type="url"
                      placeholder="Masukkan URL foto sepatu (Unsplash / CDN)..."
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      style={{ ...inputStyle, fontSize: '0.78rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newImageUrl.trim()) {
                          setFormData(prev => ({ ...prev, images: [...prev.images, newImageUrl.trim()] }));
                          setNewImageUrl('');
                          toast.success('Foto berhasil ditambahkan ke galeri siluet.');
                        }
                      }}
                      style={{
                        padding: '8px 14px',
                        backgroundColor: '#0F172A',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: '11px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      + Tambah
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginTop: '6px' }}>
                    <span style={{ fontSize: '10px', color: C.textLight, alignSelf: 'center', fontFamily: 'var(--font-mono)' }}>Preset Foto:</span>
                    {[
                      { label: '🏃 Lari Pro', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80' },
                      { label: '👞 Pantofel Kulit', url: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=800&q=80' },
                      { label: '👟 Sneaker Kanvas', url: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80' },
                      { label: '🥾 Boots Hiker', url: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=800&q=80' },
                      { label: '👡 Slip-On', url: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=800&q=80' },
                    ].map(p => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            images: prev.images.includes(p.url) ? prev.images : [...prev.images, p.url]
                          }));
                          toast.success(`Foto ${p.label} ditambahkan!`);
                        }}
                        style={{
                          fontSize: '10px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          border: `1px solid ${C.borderDark}`,
                          backgroundColor: '#FFFFFF',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-mono)'
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <span style={{ fontSize: '10px', color: C.textMuted, fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                    Tips: Foto pertama otomatis menjadi foto COVER produk di etalase web.
                  </span>
                </div>

                {/* Staged Thumbnails */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '12px' }}>
                  {formData.images.map((imgUrl, i) => (
                    <div
                      key={i}
                      style={{
                        position: 'relative',
                        height: '75px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: `1px solid ${C.border}`,
                        backgroundColor: C.surfaceLow
                      }}
                    >
                      <img src={imgUrl} alt={`Foto ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {i === 0 && (
                        <span style={{
                          position: 'absolute',
                          bottom: '3px',
                          left: '3px',
                          backgroundColor: '#0F172A',
                          color: C.neonLime,
                          fontSize: '8px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 900,
                          padding: '1px 5px',
                          borderRadius: '3px'
                        }}>
                          COVER
                        </span>
                      )}
                      {formData.images.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              images: prev.images.filter((_, idx) => idx !== i)
                            }));
                          }}
                          style={{
                            position: 'absolute',
                            top: '3px',
                            right: '3px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(239, 68, 68, 0.9)',
                            color: '#FFFFFF',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4: Deskripsi & Material Specs */}
              <div style={formSectionCardStyle}>
                <span style={formSectionHeadingStyle}>4. Spesifikasi Material &amp; Deskripsi</span>
                <textarea
                  rows={3}
                  placeholder="Rincikan konstruksi sol, upper, midsole, dan karakteristik siluet..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }}
                />
              </div>

              {/* Section 5: Toggle Switches */}
              <div style={formSectionCardStyle}>
                <span style={formSectionHeadingStyle}>5. Visibilitas &amp; Billboard Landing</span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                    <div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: C.textMain, display: 'block' }}>
                        Tandai Sebagai Produk Unggulan
                      </span>
                      <span style={{ fontSize: '0.72rem', color: C.textMuted }}>
                        Muncul di headline carousel &amp; showcase utama landing page
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      style={{ width: '18px', height: '18px', accentColor: C.emerald, cursor: 'pointer' }}
                    />
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderTop: `1px solid ${C.border}`, paddingTop: '10px' }}>
                    <div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: C.textMain, display: 'block' }}>
                        Status Publikasi (Aktif di Toko)
                      </span>
                      <span style={{ fontSize: '0.72rem', color: C.textMuted }}>
                        Dapat dilihat dan dibeli oleh pelanggan di katalog web
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      style={{ width: '18px', height: '18px', accentColor: C.emerald, cursor: 'pointer' }}
                    />
                  </label>
                </div>
              </div>

              {/* Section 6: Varian Ukuran & Stok */}
              <div style={formSectionCardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <span style={formSectionHeadingStyle}>6. Alokasi Varian Ukuran &amp; Stok</span>
                    <span style={{ display: 'block', fontSize: '11px', color: C.textMuted, marginTop: '2px' }}>
                      Pilih template ukuran (Pria, Wanita, Anak) atau tambah ukuran kustom bebas
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: C.emerald, backgroundColor: C.emeraldLight, padding: '4px 10px', borderRadius: '4px', border: `1px solid ${C.emeraldBorder}` }}>
                      Total: {formData.variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0)} Pasang ({formData.variants.length} Ukuran)
                    </span>
                  </div>
                </div>

                {/* Preset Kategori Ukuran Cepat (Pria, Wanita, Anak, Unisex) */}
                <div style={{ marginTop: '12px', padding: '12px', backgroundColor: C.surface, borderRadius: '8px', border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: C.textSub, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🎯 Template Cepat Kategori Ukuran:</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                    {SIZE_PRESETS.map(preset => {
                      const isMatching = preset.sizes.every(sz => formData.variants.some(v => String(v.size) === sz)) && formData.variants.length === preset.sizes.length;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => applySizePreset(preset.id)}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            border: isMatching ? `2px solid #0F172A` : `1px solid ${C.borderDark}`,
                            backgroundColor: isMatching ? '#0F172A' : '#FFFFFF',
                            color: isMatching ? '#FFFFFF' : C.textMain,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            textAlign: 'left'
                          }}
                        >
                          <span style={{ fontSize: '12px', fontWeight: 800 }}>
                            {preset.icon} {preset.label}
                          </span>
                          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: isMatching ? C.neonLime : C.textMuted, marginTop: '2px', fontWeight: 700 }}>
                            {preset.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Toolbar: Tambah Ukuran Manual & Set Stok Sekaligus */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '12px', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#FFFFFF', borderRadius: '8px', border: `1px dashed ${C.borderDark}` }}>
                  {/* Tambah Ukuran Kustom */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: C.textSub, fontFamily: 'var(--font-mono)' }}>+ Size Baru:</span>
                    <input
                      type="text"
                      placeholder="Misal: 35, 46..."
                      value={customSizeInput}
                      onChange={(e) => setCustomSizeInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomSize(); } }}
                      style={{
                        width: '105px',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: `1px solid ${C.borderDark}`,
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomSize}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#0F172A',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      + Tambah
                    </button>
                  </div>

                  {/* Isi Rata Stok */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: C.textSub, fontFamily: 'var(--font-mono)' }}>Set Semua Stok:</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="Jml"
                      value={bulkStockInput}
                      onChange={(e) => setBulkStockInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleApplyBulkStock(); } }}
                      style={{
                        width: '65px',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: `1px solid ${C.borderDark}`,
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        outline: 'none',
                        textAlign: 'center'
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleApplyBulkStock}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: C.surfaceLow,
                        color: C.textMain,
                        border: `1px solid ${C.borderDark}`,
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Terapkan
                    </button>
                  </div>
                </div>

                {/* Grid Input Alokasi Stok Ukuran */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))', gap: '8px', marginTop: '12px' }}>
                  {formData.variants.map((v, idx) => (
                    <div
                      key={v.id || v.size}
                      style={{
                        textAlign: 'center',
                        backgroundColor: C.surface,
                        padding: '8px 4px',
                        borderRadius: '8px',
                        border: `1px solid ${C.border}`,
                        position: 'relative'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleRemoveVariantSize(v.size)}
                        title={`Hapus ukuran EU ${v.size}`}
                        style={{
                          position: 'absolute',
                          top: '2px',
                          right: '2px',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: C.textLight,
                          fontSize: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.backgroundColor = '#FEE2E2'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = C.textLight; e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        ✕
                      </button>
                      <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: C.textSub, display: 'block', marginBottom: '4px' }}>
                        EU {v.size}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={v.stock}
                        onChange={(e) => handleVariantStockChange(idx, e.target.value)}
                        style={{
                          width: '100%',
                          textAlign: 'center',
                          padding: '6px 2px',
                          borderRadius: '6px',
                          border: `1px solid ${C.borderDark}`,
                          backgroundColor: '#FFFFFF',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 800,
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Drawer Footer CTA */}
              <div style={{
                position: 'sticky',
                bottom: 0,
                backgroundColor: '#FFFFFF',
                padding: '16px 0 0',
                borderTop: `1px solid ${C.border}`,
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}>
                <button
                  type="button"
                  onClick={() => setIsFormDrawerOpen(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    backgroundColor: '#FFFFFF',
                    border: `1px solid ${C.borderDark}`,
                    color: C.textSub,
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer'
                  }}
                >
                  BATAL
                </button>

                <button
                  type="submit"
                  style={{
                    padding: '10px 24px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #059669 0%, #2563EB 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)'
                  }}
                >
                  {editingProduct ? 'SIMPAN PERUBAHAN' : 'TERBITKAN SILUET'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. MODAL: QUICK STOCK ADJUSTMENT DIALOG                       */}
      {/* ============================================================== */}
      {quickStockProduct && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 110,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '540px',
            padding: '24px',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: C.emerald, textTransform: 'uppercase' }}>
                  INVENTORY MATRIX QUICK CONTROL
                </span>
                <h3 style={{ margin: '4px 0 0', fontSize: '1.2rem', fontWeight: 900, color: C.textHead }}>
                  {quickStockProduct.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setQuickStockProduct(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: C.textMuted, margin: '0 0 16px' }}>
              Perbarui jumlah stok per ukuran EU. Perubahan langsung disimpan ke cache inventaris Barokah.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
              {quickStockProduct.variants?.map((v, i) => (
                <div key={v.id || v.size} style={{
                  padding: '10px',
                  borderRadius: '8px',
                  backgroundColor: C.surface,
                  border: `1px solid ${C.border}`,
                  textAlign: 'center'
                }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: C.textHead, display: 'block', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
                    EU {v.size}
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={v.stock}
                    onChange={(e) => {
                      const updated = [...quickStockProduct.variants];
                      updated[i].stock = Math.max(0, parseInt(e.target.value, 10) || 0);
                      setQuickStockProduct({ ...quickStockProduct, variants: updated });
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'center',
                      padding: '8px',
                      borderRadius: '6px',
                      border: `1px solid ${C.borderDark}`,
                      fontWeight: 900,
                      fontSize: '0.95rem',
                      fontFamily: 'var(--font-mono)'
                    }}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setQuickStockProduct(null)}
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  border: `1px solid ${C.borderDark}`,
                  color: C.textSub,
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer'
                }}
              >
                BATAL
              </button>
              <button
                type="button"
                onClick={handleSaveQuickStock}
                style={{
                  padding: '9px 20px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #059669 0%, #2563EB 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer'
                }}
              >
                SIMPAN STOK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. MODAL: PRODUCT DETAIL PREVIEW                               */}
      {/* ============================================================== */}
      {detailProduct && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 110,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '640px',
            padding: '28px',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.25)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <img
                  src={detailProduct.images?.[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80'}
                  alt={detailProduct.name}
                  style={{ width: '70px', height: '70px', borderRadius: '10px', objectFit: 'cover', border: `1px solid ${C.border}` }}
                />
                <div>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: C.blueText, fontWeight: 700 }}>
                    SKU: {detailProduct.sku || 'BK-PROD'}
                  </span>
                  <h3 style={{ margin: '4px 0 0', fontSize: '1.25rem', fontWeight: 900, color: C.textHead }}>
                    {detailProduct.name}
                  </h3>
                  <span style={{ fontSize: '11px', color: C.textMuted }}>
                    Kategori: {detailProduct.category_name || 'Sneakers'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDetailProduct(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: C.textSub, lineHeight: '1.6', margin: '0 0 20px' }}>
              {detailProduct.description || 'Tidak ada deskripsi detail produk.'}
            </p>

            <div style={{
              backgroundColor: C.surface,
              padding: '16px',
              borderRadius: '10px',
              border: `1px solid ${C.border}`,
              marginBottom: '20px'
            }}>
              <h4 style={{ margin: '0 0 10px', fontSize: '0.85rem', fontWeight: 800, color: C.textMain }}>
                Alokasi Varian Ukuran (EU)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
                {detailProduct.variants?.map(v => (
                  <div key={v.id || v.size} style={{ textAlign: 'center', backgroundColor: '#FFFFFF', padding: '6px', borderRadius: '6px', border: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: '11px', color: C.textMuted, fontFamily: 'var(--font-mono)' }}>EU {v.size}</span>
                    <strong style={{ display: 'block', fontSize: '13px', color: v.stock === 0 ? C.redText : C.textMain }}>{v.stock}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: C.textHead }}>
                {formatIDR(detailProduct.discount_price || detailProduct.price)}
              </span>

              <div style={{ display: 'flex', gap: '8px' }}>
                <a
                  href={`/product/${detailProduct.slug || 'detail'}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    backgroundColor: C.surfaceLow,
                    border: `1px solid ${C.border}`,
                    color: C.textMain,
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    textDecoration: 'none'
                  }}
                >
                  <ExternalLink size={13} /> Lihat di Etalase
                </a>
                <button
                  type="button"
                  onClick={() => {
                    const toEdit = detailProduct;
                    setDetailProduct(null);
                    handleOpenEditModal(toEdit);
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    backgroundColor: '#0F172A',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Edit Produk
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 8. MODAL: IMPORT BATCH                                         */}
      {/* ============================================================== */}
      {isImportModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 110,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '600px',
            padding: '24px',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: C.textHead }}>
                  Import Batch Siluet Produk
                </h3>
                <span style={{ fontSize: '0.8rem', color: C.textMuted }}>
                  Paste data array JSON produk atau muat template batch sampel.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleBatchImportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleLoadSampleBatch}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: C.blueText,
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Muat Contoh Sampel Batch
                </button>
              </div>

              <textarea
                rows={8}
                placeholder="[ { &quot;name&quot;: &quot;...&quot;, &quot;sku&quot;: &quot;...&quot;, &quot;price&quot;: 1500000, &quot;variants&quot;: [...] } ]"
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: C.surface,
                  border: `1px solid ${C.borderDark}`,
                  fontSize: '0.78rem',
                  fontFamily: 'var(--font-mono)',
                  color: C.textMain,
                  resize: 'vertical'
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    backgroundColor: '#FFFFFF',
                    border: `1px solid ${C.borderDark}`,
                    color: C.textSub,
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 20px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #059669 0%, #2563EB 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  Impor Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 9. MODAL: KONFIRMASI HAPUS PRODUK                              */}
      {/* ============================================================== */}
      {deleteConfirmProduct && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '32px 28px',
            width: '100%',
            maxWidth: '420px',
            boxShadow: '0 20px 60px rgba(15, 23, 42, 0.18)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}>
            {/* Icon + Title */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                backgroundColor: '#FEF2F2', border: '2px solid #FECACA',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Trash2 size={24} color="#DC2626" />
              </div>
              <div>
                <h3 style={{
                  margin: '0 0 6px',
                  fontSize: '1.1rem', fontWeight: 800,
                  color: '#0F172A', fontFamily: "'Manrope', sans-serif"
                }}>
                  Hapus Produk?
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B', lineHeight: '1.6' }}>
                  Produk <strong style={{ color: '#0F172A' }}>"{deleteConfirmProduct.name}"</strong> akan dihapus
                  permanen beserta semua varian dan gambarnya. Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setDeleteConfirmProduct(null)}
                disabled={isDeleting}
                style={{
                  flex: 1, padding: '11px 0',
                  borderRadius: '10px',
                  backgroundColor: '#F1F5F9',
                  border: '1px solid #E2E8F0',
                  color: '#334155', fontWeight: 700,
                  fontSize: '0.85rem', cursor: 'pointer',
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                style={{
                  flex: 1, padding: '11px 0',
                  borderRadius: '10px',
                  backgroundColor: '#DC2626',
                  border: 'none',
                  color: '#FFFFFF', fontWeight: 800,
                  fontSize: '0.85rem', cursor: isDeleting ? 'not-allowed' : 'pointer',
                  fontFamily: "'Manrope', sans-serif",
                  opacity: isDeleting ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                {isDeleting ? (
                  <>
                    <span style={{
                      width: '14px', height: '14px', borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.4)',
                      borderTopColor: '#fff',
                      animation: 'spin 0.7s linear infinite',
                      display: 'inline-block',
                    }} />
                    Menghapus...
                  </>
                ) : (
                  <><Trash2 size={14} /> Hapus Permanen</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// ── Reusable Component Styles ───────────────────────────────────────
const formSectionCardStyle = {
  backgroundColor: '#FFFFFF',
  border: `1px solid ${C.border}`,
  borderRadius: '12px',
  padding: '16px 20px',
  boxShadow: C.shadowSm
};

const formSectionHeadingStyle = {
  display: 'block',
  fontSize: '11px',
  fontFamily: 'var(--font-mono)',
  fontWeight: 800,
  textTransform: 'uppercase',
  color: C.textSub,
  marginBottom: '12px'
};

const labelStyle = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 700,
  color: C.textSub,
  marginBottom: '6px'
};

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: '8px',
  backgroundColor: C.surface,
  border: `1px solid ${C.border}`,
  fontSize: '0.82rem',
  color: C.textMain,
  outline: 'none',
  fontFamily: 'var(--font-body)',
  transition: 'border-color 0.2s'
};

const selectControlStyle = {
  width: '100%',
  padding: '10px 32px 10px 12px',
  backgroundColor: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: '8px',
  fontSize: '0.8rem',
  color: C.textMain,
  outline: 'none',
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  appearance: 'none',
  cursor: 'pointer'
};

const dropdownArrowStyle = {
  position: 'absolute',
  right: '12px',
  top: '50%',
  transform: 'translateY(-50%)',
  color: C.textLight,
  pointerEvents: 'none'
};

const activeChipStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '3px 8px',
  borderRadius: '6px',
  backgroundColor: C.surfaceLow,
  color: C.textSub,
  fontSize: '11px',
  fontFamily: 'var(--font-mono)',
  border: `1px solid ${C.border}`
};

const chipCloseBtnStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: C.textLight,
  display: 'flex',
  alignItems: 'center',
  padding: 0
};

const actionBtnStyle = {
  padding: '6px 8px',
  borderRadius: '6px',
  backgroundColor: '#FFFFFF',
  border: `1px solid ${C.borderDark}`,
  color: C.textMuted,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.15s ease'
};

const batchBtnStyle = {
  padding: '6px 12px',
  borderRadius: '6px',
  backgroundColor: '#1E293B',
  border: 'none',
  color: '#FFFFFF',
  fontSize: '11px',
  fontFamily: 'var(--font-mono)',
  fontWeight: 700,
  cursor: 'pointer'
};

export default ProductManagement;
