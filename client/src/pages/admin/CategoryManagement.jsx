import React, { useState, useEffect, useMemo, useRef } from 'react';
import { sampleCategories, sampleProducts } from '../../data/sampleProducts';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  Tag,
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Layers,
  Upload,
  Download,
  Search,
  Check,
  X,
  Sparkles,
  SlidersHorizontal,
  FolderPlus,
  RefreshCw,
  Database,
  LayoutGrid,
  List,
  Eye,
  Bolt,
  Image as ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ===================================================================
   KATEGORI PRODUK — EXECUTIVE STREETWEAR ATELIER (STITCH SPEC)
   Matches the Barokah Shoes E-Commerce Platform category management design.
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
  redText:       '#DC2626',
  redBg:         '#FEF2F2',
  redBorder:     '#FECACA',

  shadowSm:      '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
  shadowMd:      '0 4px 12px -2px rgba(15, 23, 42, 0.05), 0 2px 4px -2px rgba(15, 23, 42, 0.03)',
  shadowLg:      '0 10px 25px -3px rgba(15, 23, 42, 0.08), 0 4px 10px -2px rgba(15, 23, 42, 0.03)',
};

// Initial Streetwear Categories aligned with Stitch design
const INITIAL_CATEGORIES = [
  {
    id: '80a3-run',
    name: 'Running & Performance',
    slug: 'running-performance',
    description: 'Siluet sepatu lari berteknologi pelat karbon dan bantalan supercritical foam responsif untuk maraton maupun daily road runs berkecepatan tinggi.',
    image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    display_order: 1,
    tier: 'Tier 1',
    is_active: true,
    created_at: '2024-01-12'
  },
  {
    id: '41c9-cas',
    name: 'Casual & Streetwear',
    slug: 'casual-streetwear',
    description: 'Gaya harian kontemporer terinspirasi kultur skate, hip-hop, dan street fashion global dengan konstruksi sol kokoh dan siluet chunky.',
    image_url: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80',
    display_order: 2,
    tier: 'Tier 1',
    is_active: true,
    created_at: '2024-01-15'
  },
  {
    id: '99a1-ret',
    name: 'High Top & Retro',
    slug: 'high-top-retro',
    description: 'Penghormatan pada era keemasan hardwood court 80-an dan 90-an. Bantalan pergelangan kaki tebal dan material premium tumble leather.',
    image_url: 'https://images.unsplash.com/photo-1512374382149-233c42b6a83b?auto=format&fit=crop&w=800&q=80',
    display_order: 3,
    tier: 'Tier 2',
    is_active: true,
    created_at: '2024-02-01'
  },
  {
    id: '55d2-low',
    name: 'Low Cut Classics',
    slug: 'low-cut-classics',
    description: 'Elegansi esensial bersiluet ramping tak lekang oleh waktu. Sempurna untuk rotasi pakaian kasual formal hingga santai sepanjang tahun.',
    image_url: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80',
    display_order: 4,
    tier: 'Tier 2',
    is_active: true,
    created_at: '2024-02-10'
  },
  {
    id: '22e7-sli',
    name: 'Slides & Sandal',
    slug: 'slides-sandals',
    description: 'Konstruksi foam molded ultra-ringan ergonomis untuk pemulihan post-run dan kenyamanan maksimal bersantai dengan estetika futuristik.',
    image_url: 'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=800&q=80',
    display_order: 5,
    tier: 'Tier 3',
    is_active: true,
    created_at: '2024-02-18'
  },
  {
    id: '01ff-lim',
    name: 'Limited Drop Edition',
    slug: 'limited-drop-edition',
    description: 'Koleksi terkurasi rilisan terbatas dan kolaborasi eksklusif. Alokasi stok termonitor ketat dengan autentikasi NFC tamper-proof.',
    image_url: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80',
    display_order: 6,
    tier: 'HYPED',
    is_active: true,
    created_at: '2024-03-05'
  }
];

export const CategoryManagement = ({ onNavigateBack }) => {
  // Categories State (from Supabase + localStorage cache)
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('barokah_admin_categories');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { /* ignore */ }
    }
    return [];
  });

  // Real products state from Supabase to compute exact linked silhouettes per category
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('barokah_admin_products');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { /* ignore */ }
    }
    return [];
  });

  // Loading and action state
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmCat, setDeleteConfirmCat] = useState(null);

  // UI view mode: 'grid' | 'compact'
  const [viewMode, setViewMode] = useState('grid');
  const [tableSearchQuery, setTableSearchQuery] = useState('');

  // Form State
  const initialForm = {
    name: '',
    slug: '',
    description: '',
    image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    display_order: categories.length + 1,
    tier: 'Tier 1',
    is_active: true
  };

  const [formData, setFormData] = useState(initialForm);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const formRef = useRef(null);

  // Helper: Authenticate with official admin account for PostgreSQL RLS policies
  const ensureAdminAuth = async () => {
    if (!isSupabaseConfigured) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || session.user?.email !== 'admin@barokahshoes.id') {
        const { error } = await supabase.auth.signInWithPassword({
          email: 'admin@barokahshoes.id',
          password: 'AdminPassword123!'
        });
        if (error) {
          console.warn('Admin sign-in error:', error);
        }
      }
    } catch (err) {
      console.warn('ensureAdminAuth warning:', err);
    }
  };

  // Helper: Fetch real categories & products from Supabase
  const fetchCategoriesAndProducts = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        // Fetch categories ordered by sort_order
        const { data: catData, error: catError } = await supabase
          .from('categories')
          .select('*')
          .order('sort_order', { ascending: true });

        if (!catError && catData && catData.length > 0) {
          const mapped = catData.map((c, i) => ({
            ...c,
            display_order: c.sort_order ?? (i + 1),
            tier: i < 2 ? 'Tier 1' : i < 4 ? 'Tier 2' : 'Tier 3',
            image_url: c.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'
          }));
          setCategories(mapped);
          localStorage.setItem('barokah_admin_categories', JSON.stringify(mapped));
        }

        // Fetch products to count real linked silhouettes
        const { data: prodData, error: prodError } = await supabase
          .from('products')
          .select('id, name, category_id');

        if (!prodError && prodData) {
          setProducts(prodData);
        }
      }
    } catch (e) {
      console.warn('Supabase fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchCategoriesAndProducts();
  }, []);

  // Compute product count for a given category (using Supabase UUID category_id)
  const getProductCount = (category) => {
    if (!category || !category.id) return 0;
    return products.filter(p => {
      if (p.category_id && String(p.category_id) === String(category.id)) return true;
      if (p.category_name && p.category_name.toLowerCase() === (category.name || '').toLowerCase()) return true;
      return false;
    }).length;
  };

  // Total products in all categories
  const totalAssociatedSilhouettes = useMemo(() => {
    return categories.reduce((acc, cat) => acc + getProductCount(cat), 0) || products.length;
  }, [categories, products]);

  // Handle Name Input -> Auto-generate Slug
  const handleNameChange = (val) => {
    const slug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setFormData(prev => ({
      ...prev,
      name: val,
      slug: slug
    }));
  };

  // Edit category trigger
  const handleStartEdit = (cat) => {
    setEditingCategoryId(cat.id);
    setFormData({
      name: cat.name || '',
      slug: cat.slug || '',
      description: cat.description || '',
      image_url: cat.image_url || initialForm.image_url,
      display_order: cat.sort_order || cat.display_order || 1,
      tier: cat.tier || 'Tier 1',
      is_active: cat.is_active !== false
    });
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingCategoryId(null);
    setFormData({
      ...initialForm,
      display_order: categories.length + 1
    });
  };

  // Submit Save or Update to Supabase Database
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Nama kategori wajib diisi!');
      return;
    }

    const computedSlug = formData.slug.trim() || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (!computedSlug) {
      toast.error('Slug URL tidak valid!');
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading(editingCategoryId ? 'Memperbarui kategori di database...' : 'Menyimpan kategori ke database...');

    try {
      await ensureAdminAuth();

      if (editingCategoryId) {
        // --- 1. UPDATE EXISTING CATEGORY IN SUPABASE ---
        const payload = {
          name: formData.name.trim(),
          slug: computedSlug,
          description: formData.description?.trim() || null,
          image_url: formData.image_url?.trim() || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
          sort_order: Number(formData.display_order) || 1,
          is_active: formData.is_active !== false,
          updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('categories')
          .update(payload)
          .eq('id', editingCategoryId)
          .select();

        if (error) {
          throw error;
        }

        const updatedRow = data && data[0] ? data[0] : { id: editingCategoryId, ...payload };
        setCategories(prev => {
          const next = prev.map(c => c.id === editingCategoryId ? { ...c, ...updatedRow, display_order: updatedRow.sort_order } : c);
          localStorage.setItem('barokah_admin_categories', JSON.stringify(next));
          return next;
        });

        toast.success(`Kategori "${formData.name}" berhasil diperbarui!`, { id: toastId });
        handleCancelEdit();
        await fetchCategoriesAndProducts();
      } else {
        // --- 2. CREATE NEW CATEGORY IN SUPABASE ---
        // Check duplicate slug locally
        if (categories.some(c => c.slug === computedSlug)) {
          toast.error(`Slug "${computedSlug}" sudah digunakan! Silakan ganti slug atau nama.`, { id: toastId });
          setIsSaving(false);
          return;
        }

        const payload = {
          name: formData.name.trim(),
          slug: computedSlug,
          description: formData.description?.trim() || null,
          image_url: formData.image_url?.trim() || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
          sort_order: Number(formData.display_order) || (categories.length + 1),
          is_active: formData.is_active !== false
        };

        const { data, error } = await supabase
          .from('categories')
          .insert(payload)
          .select();

        if (error) {
          if (error.code === '23505') {
            throw new Error(`Nama atau Slug "${computedSlug}" sudah ada di database. Silakan gunakan nama lain.`);
          }
          throw error;
        }

        if (data && data[0]) {
          const newCat = {
            ...data[0],
            display_order: data[0].sort_order || (categories.length + 1),
            tier: 'Tier 3'
          };
          setCategories(prev => {
            const next = [...prev, newCat];
            localStorage.setItem('barokah_admin_categories', JSON.stringify(next));
            return next;
          });
          toast.success(`Kategori baru "${data[0].name}" berhasil disimpan ke database!`, { id: toastId });
          handleCancelEdit();
          await fetchCategoriesAndProducts();
        }
      }
    } catch (err) {
      console.error('Save category error:', err);
      toast.error(err.message || 'Gagal menyimpan kategori ke database', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  // Open Delete Confirmation Modal
  const handleDeleteCategory = (cat) => {
    setDeleteConfirmCat(cat);
  };

  // Confirm and Execute Delete from Supabase Database
  const handleConfirmDeleteCategory = async () => {
    if (!deleteConfirmCat) return;

    const linkedCount = getProductCount(deleteConfirmCat);
    if (linkedCount > 0) {
      toast.error(`Tidak dapat menghapus! Kategori ini masih memiliki ${linkedCount} siluet terkait. Pindahkan produk terlebih dahulu.`);
      return;
    }

    setIsDeleting(true);
    const toastId = toast.loading(`Menghapus kategori "${deleteConfirmCat.name}" dari database...`);

    try {
      await ensureAdminAuth();

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', deleteConfirmCat.id);

      if (error) {
        throw error;
      }

      setCategories(prev => {
        const next = prev.filter(c => c.id !== deleteConfirmCat.id);
        localStorage.setItem('barokah_admin_categories', JSON.stringify(next));
        return next;
      });

      toast.success(`Kategori "${deleteConfirmCat.name}" berhasil dihapus dari database!`, { id: toastId });
      if (editingCategoryId === deleteConfirmCat.id) {
        handleCancelEdit();
      }
      setDeleteConfirmCat(null);
      await fetchCategoriesAndProducts();
    } catch (err) {
      console.error('Delete category error:', err);
      toast.error(`Gagal menghapus kategori: ${err.message}`, { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  // Reorder Category (Move Up / Down) with Supabase sort_order Sync
  const handleMoveOrder = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const updated = [...categories];
    const itemA = updated[index];
    const itemB = updated[targetIndex];
    updated[index] = itemB;
    updated[targetIndex] = itemA;

    // Normalize display_order
    const normalized = updated.map((c, i) => ({ ...c, display_order: i + 1, sort_order: i + 1 }));
    setCategories(normalized);
    localStorage.setItem('barokah_admin_categories', JSON.stringify(normalized));

    if (isSupabaseConfigured) {
      try {
        await ensureAdminAuth();
        await Promise.all([
          supabase.from('categories').update({ sort_order: targetIndex + 1 }).eq('id', itemA.id),
          supabase.from('categories').update({ sort_order: index + 1 }).eq('id', itemB.id)
        ]);
        toast.success('Urutan hierarki kategori diperbarui.');
      } catch (err) {
        console.warn('Reorder category error:', err);
      }
    }
  };

  // Toggle Active/Draft Status directly in Supabase
  const handleToggleActive = async (cat) => {
    const nextStatus = cat.is_active === false;
    setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, is_active: nextStatus } : c));
    toast.success(`Kategori "${cat.name}" sekarang ${nextStatus ? 'Aktif' : 'Draft'}.`);

    if (isSupabaseConfigured) {
      try {
        await ensureAdminAuth();
        await supabase.from('categories').update({ is_active: nextStatus }).eq('id', cat.id);
      } catch (err) {
        console.warn('Toggle category active error:', err);
      }
    }
  };

  // Export CSV of categories
  const handleExportCsv = () => {
    const headers = ['ID', 'Nama Kategori', 'Slug URL', 'Urutan', 'Siluet Terkait', 'Status', 'Dibuat Pada'];
    const rows = categories.map(c => [
      c.id,
      `"${(c.name || '').replace(/"/g, '""')}"`,
      c.slug,
      c.display_order || c.sort_order || 1,
      getProductCount(c),
      c.is_active !== false ? 'Aktif' : 'Draft',
      c.created_at || new Date().toISOString().slice(0, 10)
    ].join(','));

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Barokah_Kategori_Produk_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('File CSV Kategori berhasil diunduh!');
  };

  // Filtered categories for bottom master table
  const filteredTableCategories = useMemo(() => {
    if (!tableSearchQuery.trim()) return categories;
    const q = tableSearchQuery.toLowerCase();
    return categories.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q)
    );
  }, [categories, tableSearchQuery]);

  const activeCategoriesCount = categories.filter(c => c.is_active !== false).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>

      {/* ============================================================== */}
      {/* 1. KINETIC EDITORIAL HEADER BAR (MATCHING STITCH SPEC)         */}
      {/* ============================================================== */}
      <section style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: '20px',
        backgroundColor: C.card,
        padding: '24px 28px',
        borderRadius: '16px',
        border: `1px solid ${C.border}`,
        boxShadow: C.shadowSm
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <span style={{ color: C.textMuted }}>Admin</span>
            <span style={{ color: C.textLight }}>/</span>
            <span style={{ color: C.textMuted }}>Katalog</span>
            <span style={{ color: C.textLight }}>/</span>
            <span style={{ color: C.emeraldText, fontWeight: 800 }}>Kategori</span>
          </div>

          {/* Title + Badges */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', flexWrap: 'wrap', marginTop: '4px' }}>
            <h1 style={{
              margin: 0,
              fontSize: '1.85rem',
              fontWeight: 900,
              color: C.textHead,
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-heading)'
            }}>
              Kategori Produk
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
                backgroundColor: C.neonLime,
                color: C.neonLimeText,
                padding: '3px 8px',
                borderRadius: '6px',
                textTransform: 'uppercase'
              }}>
                {activeCategoriesCount} Aktif
              </span>

              <span style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
                backgroundColor: C.surfaceLow,
                color: C.textMain,
                padding: '3px 8px',
                borderRadius: '6px',
                textTransform: 'uppercase',
                border: `1px solid ${C.border}`
              }}>
                {totalAssociatedSilhouettes} Siluet Terkait
              </span>

              <span style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: C.textMuted,
                backgroundColor: C.surface,
                padding: '3px 8px',
                borderRadius: '6px',
                border: `1px solid ${C.border}`
              }}>
                Table: categories (JKT-01)
              </span>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={fetchCategoriesAndProducts}
            disabled={isLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
              backgroundColor: C.surfaceLow,
              color: C.textSub,
              border: `1px solid ${C.borderDark}`,
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              cursor: isLoading ? 'wait' : 'pointer'
            }}
            title="Sinkron Ulang Data dari Supabase"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>{isLoading ? 'Memuat...' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleCancelEdit();
              if (formRef.current) formRef.current.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: C.neonLime,
              color: C.neonLimeText,
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 900,
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(208, 241, 47, 0.35)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
          >
            <Plus size={16} strokeWidth={3} />
            <span>+ Tambah Kategori Baru</span>
          </button>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 2. INTERACTIVE TWO-COLUMN ENGINE GRID                         */}
      {/* ============================================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px', alignItems: 'start' }}>
        
        {/* Main Left Area: Visual Category Matrix (8 Columns) */}
        <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Section Tagline & Mode Selector */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '14px 20px',
            backgroundColor: C.card,
            borderRadius: '12px',
            border: `1px solid ${C.border}`,
            boxShadow: C.shadowSm
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: C.neonLime }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: C.textHead, textTransform: 'uppercase' }}>
                Katalog Hierarki Aktif
              </span>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: C.textMuted }}>
                (Order By display_order ASC)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: C.surfaceLow, padding: '3px', borderRadius: '8px' }}>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: viewMode === 'grid' ? '#0F172A' : 'transparent',
                  color: viewMode === 'grid' ? '#FFFFFF' : C.textMuted,
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <LayoutGrid size={13} /> Grid View
              </button>

              <button
                type="button"
                onClick={() => setViewMode('compact')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: viewMode === 'compact' ? '#0F172A' : 'transparent',
                  color: viewMode === 'compact' ? '#FFFFFF' : C.textMuted,
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <List size={13} /> Compact View
              </button>
            </div>
          </div>

          {/* Category Cards (Grid / Compact) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(320px, 1fr))' : '1fr',
            gap: '18px'
          }}>
            {categories.map((cat, index) => {
              const productCount = getProductCount(cat);
              const isFirst = index === 0;
              const isLast = index === categories.length - 1;
              const isEditing = editingCategoryId === cat.id;

              return (
                <article
                  key={cat.id}
                  style={{
                    backgroundColor: C.card,
                    borderRadius: '14px',
                    overflow: 'hidden',
                    border: `1px solid ${isEditing ? C.emerald : C.border}`,
                    boxShadow: isEditing ? '0 0 0 2px rgba(5, 150, 105, 0.25)' : C.shadowSm,
                    display: 'flex',
                    flexDirection: viewMode === 'compact' ? 'row' : 'column',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = C.shadowMd;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = isEditing ? '0 0 0 2px rgba(5, 150, 105, 0.25)' : C.shadowSm;
                  }}
                >
                  {/* Category Image Cover */}
                  <div style={{
                    position: 'relative',
                    width: viewMode === 'compact' ? '180px' : '100%',
                    height: viewMode === 'compact' ? 'auto' : '180px',
                    backgroundColor: C.surfaceLow,
                    overflow: 'hidden',
                    flexShrink: 0
                  }}>
                    <img
                      src={cat.image_url}
                      alt={cat.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    
                    {/* Gradient Overlay */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.2) 60%, transparent 100%)'
                    }} />

                    {/* Floating Badges */}
                    <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        padding: '2px 7px',
                        backgroundColor: '#0F172A',
                        color: C.neonLime,
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        fontWeight: 900,
                        borderRadius: '4px'
                      }}>
                        #{cat.display_order || (index + 1)}
                      </span>

                      <span style={{
                        padding: '2px 8px',
                        backgroundColor: cat.is_active !== false ? C.neonLime : '#64748B',
                        color: cat.is_active !== false ? C.neonLimeText : '#FFFFFF',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        fontWeight: 900,
                        borderRadius: '4px',
                        textTransform: 'uppercase'
                      }}>
                        {cat.is_active !== false ? 'Aktif' : 'Draft'}
                      </span>
                    </div>

                    <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                      <span style={{
                        padding: '3px 8px',
                        backgroundColor: 'rgba(15, 23, 42, 0.75)',
                        backdropFilter: 'blur(4px)',
                        color: cat.tier === 'HYPED' ? C.neonLime : '#FFFFFF',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        fontWeight: 800,
                        borderRadius: '4px',
                        border: `1px solid rgba(255, 255, 255, 0.15)`
                      }}>
                        {cat.tier || 'Tier 1'}
                      </span>
                    </div>

                    {/* Bottom Floating Stats */}
                    <div style={{ position: 'absolute', bottom: '10px', left: '10px', right: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div>
                        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: C.neonLime, fontWeight: 700, display: 'block' }}>
                          {productCount} Siluet Terkait
                        </span>
                        <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'rgba(255, 255, 255, 0.75)' }}>
                          /category/{cat.slug}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Content & Operations */}
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, gap: '14px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, textTransform: 'uppercase', color: C.textHead }}>
                        {cat.name}
                      </h3>
                      <p style={{
                        margin: '6px 0 0',
                        fontSize: '0.78rem',
                        color: C.textMuted,
                        lineHeight: '1.5',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {cat.description || 'Koleksi kurasi siluet Barokah Shoes.'}
                      </p>
                    </div>

                    {/* Bottom Action Bar */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: C.surfaceLow,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${C.border}`
                    }}>
                      <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: C.textMuted }}>
                        ID: <strong style={{ color: C.textSub }}>{cat.id}</strong>
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {/* Order Move Up */}
                        <button
                          type="button"
                          disabled={isFirst}
                          onClick={() => handleMoveOrder(index, -1)}
                          style={{
                            padding: '4px 6px',
                            background: 'none',
                            border: 'none',
                            cursor: isFirst ? 'not-allowed' : 'pointer',
                            color: isFirst ? C.textLight : C.textSub,
                            borderRadius: '4px'
                          }}
                          title="Pindah Naik"
                        >
                          <ArrowUp size={14} />
                        </button>

                        {/* Order Move Down */}
                        <button
                          type="button"
                          disabled={isLast}
                          onClick={() => handleMoveOrder(index, 1)}
                          style={{
                            padding: '4px 6px',
                            background: 'none',
                            border: 'none',
                            cursor: isLast ? 'not-allowed' : 'pointer',
                            color: isLast ? C.textLight : C.textSub,
                            borderRadius: '4px'
                          }}
                          title="Pindah Turun"
                        >
                          <ArrowDown size={14} />
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleStartEdit(cat)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: isEditing ? C.emerald : '#FFFFFF',
                            border: `1px solid ${isEditing ? C.emerald : C.borderDark}`,
                            color: isEditing ? '#FFFFFF' : C.blueText,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '10px',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700
                          }}
                          title="Edit Kategori"
                        >
                          <Edit3 size={12} /> Edit
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat)}
                          style={{
                            padding: '4px 6px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: C.redText,
                            borderRadius: '4px'
                          }}
                          title="Hapus Kategori"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

        </div>

        {/* Right Side Panel: Sticky Category Management Form (4 Columns) */}
        <aside style={{ gridColumn: 'span 4', position: 'sticky', top: '80px' }} ref={formRef}>
          <div style={{
            backgroundColor: C.card,
            padding: '24px',
            borderRadius: '16px',
            border: `1px solid ${C.border}`,
            boxShadow: C.shadowSm,
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}>
            {/* Form Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: C.emeraldText, textTransform: 'uppercase' }}>
                  MODUL ATELIER ENGINE
                </span>
                <h2 style={{ margin: '2px 0 0', fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase', color: C.textHead }}>
                  {editingCategoryId ? 'Edit Kategori' : 'Kelola Kategori'}
                </h2>
              </div>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: C.surfaceLow, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textMain }}>
                <SlidersHorizontal size={16} />
              </div>
            </div>

            {/* Category Form */}
            <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Category Name */}
              <div>
                <label style={labelStyle}>
                  <span>Nama Kategori</span>
                  <span style={{ color: C.redText, fontSize: '10px' }}>*Wajib</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="cth: High Top & Retro"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* Slug (Auto-generated) */}
              <div>
                <label style={labelStyle}>
                  <span>URL Slug (Supabase Key)</span>
                  <span style={{ color: C.textMuted, fontSize: '10px' }}>Auto-generated</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-mono)', color: C.textMuted, fontWeight: 700 }}>
                    /
                  </span>
                  <input
                    type="text"
                    readOnly
                    value={formData.slug}
                    style={{ ...inputStyle, paddingLeft: '24px', backgroundColor: C.surfaceLow, color: C.textSub, fontFamily: 'var(--font-mono)' }}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>
                  <span>Deskripsi Kurasi</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Jelaskan karakteristik material, estetika siluet, dan peruntukan kategori koleksi ini..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              {/* Image URL & Preview */}
              <div>
                <label style={labelStyle}>
                  <span>Foto Sampul (image_url)</span>
                  <span style={{ color: C.textMuted, fontSize: '10px' }}>Aspect 16:9</span>
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    style={{ ...inputStyle, flex: 1, fontSize: '0.78rem' }}
                  />
                  {formData.image_url && (
                    <img
                      src={formData.image_url}
                      alt="Thumbnail"
                      style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', border: `1px solid ${C.border}` }}
                    />
                  )}
                </div>

                {/* Preset Fast Picker */}
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Running', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80' },
                    { label: 'Street', url: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80' },
                    { label: 'Retro', url: 'https://images.unsplash.com/photo-1512374382149-233c42b6a83b?auto=format&fit=crop&w=800&q=80' },
                    { label: 'Classic', url: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80' },
                  ].map((preset, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => setFormData({ ...formData, image_url: preset.url })}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: C.surfaceLow,
                        border: `1px solid ${C.border}`,
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        color: C.textSub,
                        cursor: 'pointer'
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Display Order & Active Toggle Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>
                    <span>Urutan Tampilan</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                    style={{ ...inputStyle, fontFamily: 'var(--font-mono)', fontWeight: 800 }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>
                    <span>Status Visibilitas</span>
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    backgroundColor: C.surface,
                    borderRadius: '8px',
                    border: `1px solid ${C.border}`,
                    height: '42px'
                  }}>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: formData.is_active ? C.emeraldText : C.textMuted }}>
                      {formData.is_active ? 'AKTIF' : 'NON-AKTIF'}
                    </span>
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: C.emerald }}
                    />
                  </div>
                </div>
              </div>

              {/* Metadata Pill Box */}
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: C.surfaceLow,
                border: `1px solid ${C.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: C.textMuted
              }}>
                <Database size={18} color={C.blue} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: C.textHead, textTransform: 'uppercase' }}>
                    Sinkronisasi Realtime
                  </span>
                  <span style={{ fontSize: '10px', color: C.textMuted, lineHeight: '1.3' }}>
                    Trigger update otomatis meregenerasi rute katalog storefront.
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    flex: 1,
                    padding: '11px 16px',
                    backgroundColor: isSaving ? C.surfaceHigh : C.neonLime,
                    color: isSaving ? C.textMuted : C.neonLimeText,
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 900,
                    fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    boxShadow: isSaving ? 'none' : '0 4px 12px rgba(208, 241, 47, 0.35)',
                    transition: 'all 0.15s'
                  }}
                >
                  {isSaving ? 'MENYIMPAN...' : editingCategoryId ? 'PERBARUI KATEGORI' : 'SIMPAN KATEGORI'}
                </button>

                {editingCategoryId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    style={{
                      padding: '11px 16px',
                      backgroundColor: C.surfaceLow,
                      border: `1px solid ${C.borderDark}`,
                      color: C.textSub,
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Batal
                  </button>
                )}
              </div>

            </form>
          </div>
        </aside>

      </div>

      {/* ============================================================== */}
      {/* 3. BOTTOM MATRIX: DETAILED DATA OVERVIEW TABLE                */}
      {/* ============================================================== */}
      <section style={{
        backgroundColor: C.card,
        borderRadius: '16px',
        border: `1px solid ${C.border}`,
        overflow: 'hidden',
        boxShadow: C.shadowSm,
        marginTop: '12px'
      }}>
        {/* Table Header Controls */}
        <div style={{
          padding: '20px 28px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          borderBottom: `1px solid ${C.border}`
        }}>
          <div>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: C.emeraldText, textTransform: 'uppercase' }}>
              Matriks Data Relasional
            </span>
            <h3 style={{ margin: '2px 0 0', fontSize: '1.2rem', fontWeight: 900, textTransform: 'uppercase', color: C.textHead }}>
              Daftar Indeks Tabel categories
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Filter Search */}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: C.textLight }} />
              <input
                type="text"
                placeholder="Filter slug / nama..."
                value={tableSearchQuery}
                onChange={(e) => setTableSearchQuery(e.target.value)}
                style={{
                  height: '36px',
                  padding: '0 12px 0 32px',
                  backgroundColor: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontFamily: 'var(--font-mono)',
                  color: C.textMain,
                  outline: 'none',
                  width: '200px'
                }}
              />
            </div>

            {/* Export CSV */}
            <button
              type="button"
              onClick={handleExportCsv}
              style={{
                height: '36px',
                padding: '0 14px',
                backgroundColor: C.surfaceLow,
                border: `1px solid ${C.borderDark}`,
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: C.textMain,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>

        {/* Master Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{
                backgroundColor: C.surfaceLow,
                color: C.textMuted,
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em'
              }}>
                <th style={{ padding: '12px 20px', fontWeight: 800 }}>Urutan</th>
                <th style={{ padding: '12px 16px', fontWeight: 800 }}>Pratinjau</th>
                <th style={{ padding: '12px 20px', fontWeight: 800 }}>Nama Kategori &amp; Deskripsi</th>
                <th style={{ padding: '12px 16px', fontWeight: 800 }}>Slug URL</th>
                <th style={{ padding: '12px 16px', fontWeight: 800, textAlign: 'center' }}>Siluet Terkait</th>
                <th style={{ padding: '12px 16px', fontWeight: 800 }}>Dibuat Pada</th>
                <th style={{ padding: '12px 16px', fontWeight: 800, textAlign: 'center' }}>Visibilitas</th>
                <th style={{ padding: '12px 24px', fontWeight: 800, textAlign: 'right' }}>Opsi</th>
              </tr>
            </thead>
            <tbody>
              {filteredTableCategories.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: C.textMuted }}>
                    Tidak ada kategori yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredTableCategories.map((cat, i) => {
                  const pCount = getProductCount(cat);

                  return (
                    <tr
                      key={cat.id}
                      style={{
                        borderBottom: `1px solid ${C.border}`,
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = C.surface}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Urutan */}
                      <td style={{ padding: '14px 20px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: C.emeraldText }}>
                        0{cat.display_order || (i + 1)}
                      </td>

                      {/* Pratinjau */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${C.border}`, backgroundColor: C.surfaceLow }}>
                          <img src={cat.image_url} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      </td>

                      {/* Nama & Deskripsi */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <strong style={{ fontSize: '0.88rem', color: C.textHead, textTransform: 'uppercase' }}>
                            {cat.name}
                          </strong>
                          <span style={{ fontSize: '0.74rem', color: C.textMuted, maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {cat.description || '-'}
                          </span>
                        </div>
                      </td>

                      {/* Slug URL */}
                      <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: C.blueText }}>
                        /category/{cat.slug}
                      </td>

                      {/* Siluet Terkait */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          backgroundColor: C.surfaceLow,
                          color: C.textMain,
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 800,
                          border: `1px solid ${C.border}`
                        }}>
                          {pCount} Siluet
                        </span>
                      </td>

                      {/* Dibuat Pada */}
                      <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: C.textMuted }}>
                        {cat.created_at || '2024-01-12'}
                      </td>

                      {/* Visibilitas */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          fontSize: '10px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 800,
                          backgroundColor: cat.is_active !== false ? C.emeraldLight : C.surfaceLow,
                          color: cat.is_active !== false ? C.emeraldText : C.textMuted,
                          border: `1px solid ${cat.is_active !== false ? C.emeraldBorder : C.border}`
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: cat.is_active !== false ? '#10B981' : '#94A3B8' }} />
                          {cat.is_active !== false ? 'Aktif' : 'Draft'}
                        </span>
                      </td>

                      {/* Opsi */}
                      <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(cat)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              backgroundColor: '#FFFFFF',
                              border: `1px solid ${C.borderDark}`,
                              color: C.textSub,
                              cursor: 'pointer'
                            }}
                            title="Quick Edit"
                          >
                            <Edit3 size={13} />
                          </button>

                          <a
                            href={`/shop?category=${cat.id}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              backgroundColor: '#FFFFFF',
                              border: `1px solid ${C.borderDark}`,
                              color: C.textSub,
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}
                            title="Lihat di Toko"
                          >
                            <ExternalLink size={13} />
                          </a>

                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              backgroundColor: '#FFFFFF',
                              border: `1px solid ${C.borderDark}`,
                              color: C.redText,
                              cursor: 'pointer'
                            }}
                            title="Hapus"
                          >
                            <Trash2 size={13} />
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
      </section>

      {/* ============================================================== */}
      {/* 4. MODAL KONFIRMASI HAPUS KATEGORI                             */}
      {/* ============================================================== */}
      {deleteConfirmCat && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '480px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: `1px solid ${C.borderDark}`,
            animation: 'fadeIn 0.15s ease'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              backgroundColor: getProductCount(deleteConfirmCat) > 0 ? '#FEF3C7' : '#FEF2F2',
              borderBottom: `1px solid ${getProductCount(deleteConfirmCat) > 0 ? '#FDE68A' : '#FECACA'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: getProductCount(deleteConfirmCat) > 0 ? '#D97706' : '#DC2626',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Trash2 size={16} />
                </div>
                <div>
                  <h3 style={{
                    margin: 0,
                    fontSize: '0.95rem',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    color: getProductCount(deleteConfirmCat) > 0 ? '#92400E' : '#991B1B',
                    fontFamily: 'var(--font-heading)'
                  }}>
                    {getProductCount(deleteConfirmCat) > 0 ? 'Kategori Tidak Dapat Dihapus' : 'Konfirmasi Hapus Kategori'}
                  </h3>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: getProductCount(deleteConfirmCat) > 0 ? '#B45309' : '#B91C1C' }}>
                    Tabel Database: categories
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDeleteConfirmCat(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: C.textMuted,
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Category Card Preview */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '12px 14px',
                backgroundColor: C.surfaceLow,
                borderRadius: '10px',
                border: `1px solid ${C.border}`
              }}>
                <img
                  src={deleteConfirmCat.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'}
                  alt={deleteConfirmCat.name}
                  style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover', border: `1px solid ${C.border}` }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: C.textMuted }}>
                    /category/{deleteConfirmCat.slug}
                  </span>
                  <strong style={{ fontSize: '1.05rem', color: C.textHead, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {deleteConfirmCat.name}
                  </strong>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: C.blueText, fontWeight: 700 }}>
                    {getProductCount(deleteConfirmCat)} Siluet Terkait
                  </span>
                </div>
              </div>

              {/* Warning explanation based on relationship */}
              {getProductCount(deleteConfirmCat) > 0 ? (
                <div style={{
                  padding: '14px',
                  backgroundColor: '#FFFBEB',
                  borderRadius: '10px',
                  border: '1px solid #FCD34D',
                  fontSize: '0.8rem',
                  lineHeight: '1.5',
                  color: '#92400E'
                }}>
                  <strong>Perhatian:</strong> Kategori ini saat ini masih memiliki <strong>{getProductCount(deleteConfirmCat)} produk terkait</strong>.
                  Di database Supabase, tabel <code>products</code> mewajibkan <code>category_id</code> (foreign key).
                  Untuk menjaga integritas katalog, Anda harus memindahkan atau menghapus produk terkait terlebih dahulu sebelum kategori ini dapat dihapus.
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '0.84rem', color: C.textSub, lineHeight: '1.5' }}>
                  Kategori ini memiliki <strong>0 produk terkait</strong>. Apakah Anda yakin ingin menghapusnya secara permanen dari database Supabase? Tindakan ini tidak dapat dibatalkan.
                </p>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmCat(null)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    backgroundColor: C.surfaceLow,
                    border: `1px solid ${C.borderDark}`,
                    color: C.textSub,
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer'
                  }}
                >
                  {getProductCount(deleteConfirmCat) > 0 ? 'Tutup' : 'Batal'}
                </button>

                {getProductCount(deleteConfirmCat) === 0 && (
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleConfirmDeleteCategory}
                    style={{
                      padding: '9px 18px',
                      borderRadius: '8px',
                      backgroundColor: C.redText,
                      border: 'none',
                      color: '#FFFFFF',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      cursor: isDeleting ? 'wait' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 8px rgba(220, 38, 38, 0.35)'
                    }}
                  >
                    <Trash2 size={14} />
                    <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Permanen'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// ── Reusable Component Styles ───────────────────────────────────────
const labelStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '0.75rem',
  fontWeight: 700,
  color: C.textSub,
  textTransform: 'uppercase',
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

export default CategoryManagement;
