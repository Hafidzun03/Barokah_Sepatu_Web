import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { sampleCategories, sampleProducts } from '../data/sampleProducts';
import { getProducts, getCategories } from '../lib/productsApi';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ProductCard } from '../components/ProductCard';
import { Search, RotateCcw, SlidersHorizontal, RefreshCw } from 'lucide-react';

export const Shop = () => {
  const [products, setProducts] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('barokah_cached_products') || '[]');
      if (cached && cached.length > 0) return cached;
    } catch (e) {}
    return isSupabaseConfigured ? [] : sampleProducts;
  });
  const [categories, setCategories] = useState(sampleCategories);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  const initialQuery = searchParams.get('q') || '';

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [sortBy, setSortBy] = useState('featured');

  // Synchronize category and search query directly from URL query params
  useEffect(() => {
    const cat = searchParams.get('category') || '';
    const q = searchParams.get('q') || '';
    setSelectedCategory(cat);
    setSearchQuery(q);
  }, [searchParams]);

  // Master fetch function
  const fetchProductsAndCategories = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsRefreshing(true);
    try {
      const [prods, cats] = await Promise.all([getProducts(), getCategories()]);
      if (prods && prods.length > 0) {
        setProducts(prods);
        try {
          localStorage.setItem('barokah_cached_products', JSON.stringify(prods));
        } catch (e) {}
      }
      if (cats && cats.length > 0) {
        setCategories(cats);
      }
    } catch (err) {
      console.warn('Error fetching shop data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load, real-time listener, and cross-tab/focus sync
  useEffect(() => {
    fetchProductsAndCategories(true);

    // 1. Cross-tab and in-app event listeners
    const handleProductsUpdated = () => {
      fetchProductsAndCategories(true);
    };

    const handleStorageChange = (e) => {
      if (e.key === 'barokah_products_version') {
        fetchProductsAndCategories(true);
      }
    };

    const handleWindowFocus = () => {
      fetchProductsAndCategories(true);
    };

    window.addEventListener('barokah:products_updated', handleProductsUpdated);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleWindowFocus);

    // 2. Supabase Realtime channel for instant reactive updates when admin adds/modifies products
    let channel = null;
    if (isSupabaseConfigured) {
      try {
        channel = supabase.channel('shop-products-live')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
            fetchProductsAndCategories(true);
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
            fetchProductsAndCategories(true);
          })
          .subscribe();
      } catch (err) {
        console.warn('Shop realtime subscription error:', err);
      }
    }

    return () => {
      window.removeEventListener('barokah:products_updated', handleProductsUpdated);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleWindowFocus);
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchProductsAndCategories]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (selectedCategory && selectedCategory !== '' && selectedCategory !== 'all') {
        const catMatch = 
          p.category_id === selectedCategory || 
          (p.categories && p.categories.id === selectedCategory) ||
          (p.category_name && p.category_name.toLowerCase() === selectedCategory.toLowerCase());
        if (!catMatch) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (p.name || '').toLowerCase().includes(q);
        const matchDesc = (p.description || '').toLowerCase().includes(q);
        const matchCat = (p.category_name || '').toLowerCase().includes(q);
        const matchSku = (p.sku || '').toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchCat && !matchSku) return false;
      }
      return true;
    }).sort((a, b) => {
      const priceA = a.discount_price || a.price || a.base_price || 0;
      const priceB = b.discount_price || b.price || b.base_price || 0;

      if (sortBy === 'price-low') return priceA - priceB;
      if (sortBy === 'price-high') return priceB - priceA;
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
    });
  }, [products, selectedCategory, searchQuery, sortBy]);

  const resetFilters = () => {
    setSelectedCategory('');
    setSearchQuery('');
    setSortBy('featured');
    setSearchParams({});
  };

  return (
    <div style={{ padding: '40px 0 80px' }}>
      <div className="container">
        
        {/* Page Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#666666', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            ARCHITECTURAL CATALOG • SILHOUETTES
          </div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: '900', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
            KATALOG SEPATU LENGKAP
          </h1>
          <p style={{ color: '#666666', fontSize: '0.95rem' }}>
            Koleksi lengkap streetwear, running shoes, dan formal footwear dengan standar craft terbaik.
          </p>
        </div>

        {/* Filters and Search Container */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '4px',
          padding: '20px',
          border: '1px solid #e5e5e5',
          marginBottom: '32px'
        }}>
          {/* Top row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="CARI NAMA SEPATU ATAU SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '38px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
              />
              <Search size={16} color="#080808" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <SlidersHorizontal size={16} color="#080808" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="form-select"
                style={{ fontFamily: 'var(--font-heading)', fontWeight: '600', fontSize: '0.85rem' }}
              >
                <option value="featured">URUTKAN: REKOMENDASI DROP</option>
                <option value="price-low">HARGA: TERENDAH KE TERTINGGI</option>
                <option value="price-high">HARGA: TERTINGGI KE TERENDAH</option>
                <option value="rating">RATING TERTINGGI</option>
              </select>
            </div>
          </div>

          {/* Category Chips (Stitch Style) */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', paddingTop: '16px', borderTop: '1px solid #e5e5e5' }}>
            <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#666666', marginRight: '6px' }}>KATEGORI:</span>
            
            <button
              onClick={() => {
                setSelectedCategory('');
                setSearchParams(searchQuery ? { q: searchQuery } : {});
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '2px',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-heading)',
                fontWeight: '700',
                textTransform: 'uppercase',
                border: selectedCategory === '' ? '1px solid #080808' : '1px solid #e5e5e5',
                backgroundColor: selectedCategory === '' ? '#080808' : '#ffffff',
                color: selectedCategory === '' ? '#ffffff' : '#080808'
              }}
            >
              SEMUA
            </button>

            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSearchParams({ category: cat.id, ...(searchQuery ? { q: searchQuery } : {}) });
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '2px',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  border: selectedCategory === cat.id ? '1px solid #080808' : '1px solid #e5e5e5',
                  backgroundColor: selectedCategory === cat.id ? '#080808' : '#ffffff',
                  color: selectedCategory === cat.id ? '#ffffff' : '#080808'
                }}
              >
                {cat.name}
              </button>
            ))}

            {(selectedCategory || searchQuery) && (
              <button
                onClick={resetFilters}
                style={{
                  marginLeft: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#ba1a1a',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: '700'
                }}
              >
                <RotateCcw size={12} /> RESET FILTER
              </button>
            )}
          </div>
        </div>

        {/* Results Counter in Mono */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: '#666666' }}>
            MENAMPILKAN <strong>{filteredProducts.length}</strong> SILHOUETTES
            {searchQuery && <span> UNTUK "{searchQuery.toUpperCase()}"</span>}
          </div>

          <button
            onClick={() => fetchProductsAndCategories(false)}
            disabled={isRefreshing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              backgroundColor: '#ffffff',
              border: '1px solid #e5e5e5',
              borderRadius: '2px',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: '700',
              color: '#333333',
              cursor: isRefreshing ? 'not-allowed' : 'pointer'
            }}
            title="Segarkan data katalog dari database"
          >
            <RefreshCw size={12} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
            {isRefreshing ? 'MEMPERBARUI...' : 'SEGARKAN'}
          </button>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '20px'
          }}>
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            backgroundColor: '#ffffff',
            borderRadius: '4px',
            border: '1px solid #e5e5e5'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '8px', textTransform: 'uppercase' }}>
              TIDAK ADA PRODUK DITEMUKAN
            </h3>
            <p style={{ color: '#666666', marginBottom: '20px', fontSize: '0.9rem' }}>
              Coba sesuaikan kata kunci atau bersihkan pilihan kategori.
            </p>
            <button onClick={resetFilters} className="btn btn-primary btn-sm">
              TAMPILKAN SEMUA SILHOUETTES
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
