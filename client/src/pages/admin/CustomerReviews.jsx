import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Star, 
  MessageSquare, 
  CheckCircle2, 
  Trash2, 
  Plus, 
  Search, 
  Filter, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  Sparkles, 
  AlertCircle,
  ThumbsUp,
  Image as ImageIcon,
  X,
  ArrowRight,
  ShieldCheck,
  Check,
  RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getAllReviews, setReviewFeatured, deleteReview, submitReview } from '../../lib/reviewsApi';

// Theme tokens matching Toko Barokah Admin CRM System
const C = {
  bg:            '#F8FAFC',
  card:          '#FFFFFF',
  border:        '#E2E8F0',
  borderDark:    '#CBD5E1',
  surface:       '#F1F5F9',
  emerald:       '#059669',
  emeraldLight:  '#ECFDF5',
  emeraldBorder: '#A7F3D0',
  emeraldText:   '#047857',
  blue:          '#2563EB',
  blueLight:     '#EFF6FF',
  blueBorder:    '#BFDBFE',
  blueText:      '#1D4ED8',
  amberText:     '#B45309',
  amberBg:       '#FEF3C7',
  amberBorder:   '#FDE68A',
  redText:       '#DC2626',
  redBg:         '#FEF2F2',
  redBorder:     '#FECACA',
  textHead:      '#020617',
  textMain:      '#0F172A',
  textSub:       '#334155',
  textMuted:     '#64748B',
  shadowSm:      '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
  shadowMd:      '0 4px 12px -2px rgba(15, 23, 42, 0.05), 0 2px 4px -2px rgba(15, 23, 42, 0.03)',
  shadowLg:      '0 10px 25px -3px rgba(15, 23, 42, 0.08), 0 4px 10px -2px rgba(15, 23, 42, 0.03)'
};

const DEFAULT_SAMPLE_REVIEWS = [
  {
    id: 'rev-1',
    name: 'Muhammad Rizky Pratama',
    city: 'Jakarta Selatan',
    product_name: 'Barokah Air Legacy Pro',
    product_slug: 'barokah-air-legacy-pro',
    category: 'sneakers',
    rating: 5,
    date: '2 hari yang lalu',
    comment: 'Gila sih ini kualitasnya! Material sol beneran empuk mirip bantal, dipakai seharian jalan kaki di mall dan ngantor nggak bikin pegel sama sekali. Jahitan rapi presisi, packaging double box tebal dan aman. Rekomendasi banget!',
    helpful: 38,
    size: 'EU 42',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80',
    featured_on_home: true
  },
  {
    id: 'rev-2',
    name: 'Bagas Arya Wicaksono',
    city: 'Bandung',
    product_name: 'Highland Leather Boots',
    product_slug: 'highland-leather-boots',
    category: 'boots',
    rating: 5,
    date: '4 hari yang lalu',
    comment: 'Kulit sapinya asli berasa solid dan premium abis, warna tan-nya maskulin banget. Dipakai riding motor touring langsung tahan banting dan grip solnya kuat nggak licin. Pelayanan CS Toko Barokah juga responsif waktu konsultasi size.',
    helpful: 29,
    size: 'EU 43',
    image: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=400&q=80',
    featured_on_home: true
  },
  {
    id: 'rev-3',
    name: 'Hendro Kusumo',
    city: 'Surabaya',
    product_name: 'Royal Oxford Formal Classic',
    product_slug: 'royal-oxford-formal-classic',
    category: 'formal',
    rating: 5,
    date: '1 minggu yang lalu',
    comment: 'Buat acara pernikahan dan meeting direksi bener-bener stand out! Finishing kilapnya mewah, sol Goodyear welted kokoh. Dapat garansi tukar ukuran juga bikin tenang pas checkout online. Beneran setiap langkah ada barokah!',
    helpful: 41,
    size: 'EU 41',
    image: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=400&q=80',
    featured_on_home: true
  }
];

export const CustomerReviews = ({ onNavigateBack }) => {
  const [reviews, setReviews] = useState([]);
  const [featuredReviews, setFeaturedReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRating, setFilterRating] = useState('all');
  const [zoomImage, setZoomImage] = useState(null);
  const debounceRef = useRef(null); // debounce timer for rapid sync events

  // Manual Add Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newReviewForm, setNewReviewForm] = useState({
    name: '',
    city: 'Jakarta',
    product_name: 'Barokah Air Legacy Pro',
    rating: 5,
    comment: '',
    photo: ''
  });

  // ── loadAllReviews defined BEFORE useEffect so it's available ──
  const loadAllReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      let data = await getAllReviews();

      // If storage is totally empty on first install, use defaults
      if (!data || data.length === 0) {
        data = DEFAULT_SAMPLE_REVIEWS;
        localStorage.setItem('barokah_customer_reviews', JSON.stringify(data));
      }

      setReviews(data);

      // Featured reviews are ONLY those with featured_on_home === true (max 3)
      const featured = data.filter(r => r.featured_on_home).slice(0, 3);
      setFeaturedReviews(featured);
      localStorage.setItem('barokah_home_featured_reviews', JSON.stringify(featured));
    } catch (err) {
      console.error('Error loading reviews:', err);
      toast.error('Gagal memuat ulasan pelanggan');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced version — collapses rapid consecutive calls into one (400 ms)
  const debouncedLoad = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadAllReviews(), 400);
  }, [loadAllReviews]);

  // Load reviews on mount + cross-tab / cross-window sync
  useEffect(() => {
    loadAllReviews();

    // 1. Same-tab event (fired by submitReview in reviewsApi)
    const handleReviewAdded = () => debouncedLoad();
    window.addEventListener('barokah:review_added', handleReviewAdded);

    // 2. Cross-tab localStorage storage event (different browser tab)
    const handleStorage = (e) => {
      if (
        e.key === 'barokah_customer_reviews' ||
        e.key === 'barokah_home_featured_reviews' ||
        e.key === 'barokah_featured_sync_event'
      ) {
        debouncedLoad();
      }
    };
    window.addEventListener('storage', handleStorage);

    // 3. BroadcastChannel — same origin, different tab
    let bc = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('barokah_reviews_sync');
        bc.onmessage = () => debouncedLoad();
      }
    } catch {}

    // 4. Auto-refresh when admin tab regains focus
    const handleFocus = () => debouncedLoad();
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('barokah:review_added', handleReviewAdded);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
      if (bc) bc.close();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [loadAllReviews, debouncedLoad]);

  // Toggle review featured on Homepage (MAX 3)
  const toggleFeatureOnHome = async (review) => {
    const isCurrentlyFeatured = featuredReviews.some(f => String(f.id) === String(review.id));

    if (isCurrentlyFeatured) {
      // Remove from featured
      await setReviewFeatured(review.id, false);
      const updatedFeatured = featuredReviews.filter(f => String(f.id) !== String(review.id));
      setFeaturedReviews(updatedFeatured);
      setReviews(prev => prev.map(r => String(r.id) === String(review.id) ? { ...r, featured_on_home: false } : r));
      toast.success(`Ulasan ${review.name} dilepas dari halaman beranda.`);
    } else {
      // Check maximum 3 limit
      if (featuredReviews.length >= 3) {
        toast.error('Maksimal 3 ulasan di beranda tercapai! Lepas salah satu ulasan terlebih dahulu sebelum menambahkan yang baru.', {
          duration: 4500,
          icon: '⚠️'
        });
        return;
      }

      // Add to featured
      await setReviewFeatured(review.id, true);
      const updatedItem = { ...review, featured_on_home: true };
      const updatedFeatured = [...featuredReviews, updatedItem];
      setFeaturedReviews(updatedFeatured);
      setReviews(prev => prev.map(r => String(r.id) === String(review.id) ? { ...r, featured_on_home: true } : r));
      toast.success(`🎉 Berhasil! Ulasan ${review.name} kini tampil di halaman beranda (Slot #${updatedFeatured.length}).`);
    }
  };

  // Delete review
  const handleDeleteReview = async (id, name) => {
    if (!window.confirm(`Hapus ulasan dari "${name}"? Tindakan ini tidak dapat dibatalkan.`)) return;

    await deleteReview(id);
    setReviews(prev => prev.filter(r => String(r.id) !== String(id)));
    setFeaturedReviews(prev => prev.filter(f => String(f.id) !== String(id)));
    toast.success('Ulasan berhasil dihapus.');
  };

  // Handle manual review submission by admin
  const handleAddManualReview = async (e) => {
    e.preventDefault();
    if (!newReviewForm.name.trim() || !newReviewForm.comment.trim()) {
      toast.error('Harap lengkapi nama dan isi ulasan!');
      return;
    }

    const isSlotAvailable = featuredReviews.length < 3;
    const created = await submitReview({
      userName: newReviewForm.name.trim(),
      userCity: newReviewForm.city.trim() || 'Indonesia',
      productName: newReviewForm.product_name,
      productSlug: newReviewForm.product_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      rating: Number(newReviewForm.rating),
      comment: newReviewForm.comment.trim(),
      photoUrl: newReviewForm.photo || null,
      featuredOnHome: isSlotAvailable
    });

    if (isSlotAvailable && created?.id) {
      await setReviewFeatured(created.id, true);
    }

    await loadAllReviews();

    setIsAddModalOpen(false);
    setNewReviewForm({
      name: '',
      city: 'Jakarta',
      product_name: 'Barokah Air Legacy Pro',
      rating: 5,
      comment: '',
      photo: ''
    });

    toast.success('Ulasan editorial baru berhasil ditambahkan!');
  };

  // Filter reviews
  const filteredReviews = reviews.filter(rev => {
    // Search query
    const matchSearch = searchQuery === '' || 
      rev.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rev.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rev.comment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rev.city?.toLowerCase().includes(searchQuery.toLowerCase());

    // Filter type
    let matchFilter = true;
    if (filterRating === 'featured') {
      matchFilter = rev.featured_on_home;
    } else if (filterRating === 'not_featured') {
      matchFilter = !rev.featured_on_home;
    } else if (filterRating === '5') {
      matchFilter = Number(rev.rating) === 5;
    } else if (filterRating === '4') {
      matchFilter = Number(rev.rating) === 4;
    } else if (filterRating === 'has_photo') {
      matchFilter = (Array.isArray(rev.photos) && rev.photos.length > 0) || Boolean(rev.photo || rev.image);
    }

    return matchSearch && matchFilter;
  });

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / reviews.length).toFixed(1)
    : '5.0';

  const fiveStarCount = reviews.filter(r => Number(r.rating) === 5).length;

  return (
    <div>
      {/* ── Top Header Bar ─────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '28px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            color: C.emeraldText,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '4px'
          }}>
            KONTEN &amp; REPUTASI TOKO
          </div>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 900,
            color: C.textHead,
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '-0.02em'
          }}>
            Ulasan Pelanggan &amp; Kurasi Beranda
          </h1>
          <p style={{
            color: C.textMuted,
            fontSize: '0.86rem',
            margin: '4px 0 0',
            maxWidth: '680px'
          }}>
            Atur dan kurasi ulasan mana saja yang paling bagus untuk ditampilkan di halaman beranda website (maksimal 3 ulasan terpilih).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={loadAllReviews}
            disabled={isLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#FFFFFF',
              color: C.textHead,
              border: `1px solid ${C.borderDark}`,
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '0.84rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              cursor: isLoading ? 'wait' : 'pointer',
              boxShadow: C.shadowSm,
              transition: 'all 0.15s ease'
            }}
            title="Muat ulang ulasan dari database"
          >
            <RotateCcw size={15} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
            {isLoading ? 'MEMUAT...' : 'REFRESH'}
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: C.textHead,
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 20px',
              fontSize: '0.84rem',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Plus size={16} /> TAMBAH ULASAN EDITORIAL
          </button>
        </div>
      </div>

      {/* ── KPI Summary Cards ────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        {/* Card 1: Slot Beranda Terisi */}
        <div style={{
          backgroundColor: C.card,
          border: `1.5px solid ${featuredReviews.length === 3 ? C.emeraldBorder : C.blueBorder}`,
          borderRadius: '12px',
          padding: '20px',
          boxShadow: C.shadowSm,
          position: 'relative'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: C.textMuted, textTransform: 'uppercase' }}>
              SLOT BERANDA TERISI
            </span>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              padding: '2px 8px',
              borderRadius: '999px',
              backgroundColor: featuredReviews.length === 3 ? C.emeraldLight : C.blueLight,
              color: featuredReviews.length === 3 ? C.emeraldText : C.blueText
            }}>
              {featuredReviews.length === 3 ? 'PENUH (3/3)' : `${featuredReviews.length} / 3 TERISI`}
            </span>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 900, color: C.textHead, fontFamily: 'var(--font-mono)' }}>
            {featuredReviews.length} <span style={{ fontSize: '1rem', color: C.textMuted, fontWeight: 600 }}>/ 3 Slot</span>
          </div>
          <div style={{
            height: '6px',
            backgroundColor: '#E2E8F0',
            borderRadius: '999px',
            overflow: 'hidden',
            marginTop: '12px'
          }}>
            <div style={{
              height: '100%',
              width: `${(featuredReviews.length / 3) * 100}%`,
              backgroundColor: featuredReviews.length === 3 ? C.emerald : C.blue,
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Card 2: Total Ulasan Masuk */}
        <div style={{
          backgroundColor: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: '12px',
          padding: '20px',
          boxShadow: C.shadowSm
        }}>
          <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: C.textMuted, textTransform: 'uppercase', marginBottom: '8px' }}>
            TOTAL SEMUA ULASAN
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 900, color: C.textHead, fontFamily: 'var(--font-mono)' }}>
            {reviews.length} <span style={{ fontSize: '0.85rem', color: C.textMuted, fontWeight: 600 }}>Ulasan</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: C.textMuted, marginTop: '8px' }}>
            Dari seluruh produk &amp; website
          </div>
        </div>

        {/* Card 3: Rata-rata Kepuasan */}
        <div style={{
          backgroundColor: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: '12px',
          padding: '20px',
          boxShadow: C.shadowSm
        }}>
          <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: C.textMuted, textTransform: 'uppercase', marginBottom: '8px' }}>
            RATA-RATA RATING
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#F59E0B', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {averageRating} <Star size={24} fill="#F59E0B" color="#F59E0B" />
          </div>
          <div style={{ fontSize: '0.75rem', color: C.textMuted, marginTop: '8px' }}>
            {fiveStarCount} ulasan bintang 5 sempurna
          </div>
        </div>
      </div>

      {/* ── 3 Slot Beranda Showcase (Live Preview) ───────────────────── */}
      <div style={{
        backgroundColor: C.card,
        border: `1.5px solid ${C.border}`,
        borderRadius: '14px',
        padding: '24px',
        marginBottom: '28px',
        boxShadow: C.shadowMd
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 900, color: C.textHead, textTransform: 'uppercase', margin: 0 }}>
              🎯 Live Preview: 3 Ulasan Terpilih di Beranda Website
            </h2>
            <p style={{ color: C.textMuted, fontSize: '0.8rem', margin: '4px 0 0' }}>
              Ketiga ulasan di bawah ini adalah yang saat ini aktif tampil di section Testimonial halaman utama.
            </p>
          </div>
          <span style={{
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 800,
            padding: '4px 10px',
            borderRadius: '6px',
            backgroundColor: '#080808',
            color: '#b7d600'
          }}>
            MAKSIMAL 3 ULASAN AKTIF
          </span>
        </div>

        {/* 3 Slots Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px'
        }}>
          {[0, 1, 2].map((slotIndex) => {
            const item = featuredReviews[slotIndex];

            if (item) {
              return (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: '#FAFAF9',
                    border: '1.5px solid #111111',
                    borderRadius: '10px',
                    padding: '20px',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '16px',
                    backgroundColor: '#111111',
                    color: '#b7d600',
                    fontSize: '0.65rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 900,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    letterSpacing: '0.06em'
                  }}>
                    SLOT #{slotIndex + 1}
                  </div>

                  <div>
                    {/* Stars & unpin */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={13} fill={i < item.rating ? '#F59E0B' : 'none'} color={i < item.rating ? '#F59E0B' : '#CBD5E1'} />
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleFeatureOnHome(item)}
                        title="Lepas dari Beranda"
                        style={{
                          background: C.redBg,
                          border: `1px solid ${C.redBorder}`,
                          color: C.redText,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <X size={12} /> Lepas
                      </button>
                    </div>

                    {/* Comment snippet */}
                    <p style={{
                      fontSize: '0.84rem',
                      lineHeight: '1.5',
                      color: C.textMain,
                      margin: '0 0 14px',
                      fontStyle: 'italic',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      "{item.comment}"
                    </p>
                  </div>

                  {/* Customer info */}
                  <div style={{
                    borderTop: '1px solid #E5E5E5',
                    paddingTop: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    {item.photo || item.image ? (
                      <img
                        src={item.photo || item.image}
                        alt=""
                        style={{ width: '38px', height: '38px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #ddd' }}
                      />
                    ) : (
                      <div style={{ width: '38px', height: '38px', borderRadius: '6px', backgroundColor: '#080808', color: '#b7d600', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                        {item.name ? item.name[0] : 'U'}
                      </div>
                    )}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.82rem', color: C.textHead, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: C.textMuted, fontFamily: 'var(--font-mono)' }}>
                        {item.product_name}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // Empty slot placeholder
            return (
              <div
                key={`empty-${slotIndex}`}
                style={{
                  border: '2px dashed #CBD5E1',
                  borderRadius: '10px',
                  padding: '28px 20px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#F8FAFC',
                  color: C.textMuted,
                  minHeight: '180px'
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#EDF2F7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px',
                  fontWeight: 900,
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-mono)'
                }}>
                  #{slotIndex + 1}
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: C.textSub, marginBottom: '4px' }}>
                  Slot Beranda Kosong
                </div>
                <div style={{ fontSize: '0.74rem', maxWidth: '200px', lineHeight: '1.4' }}>
                  Pilih ulasan dari tabel di bawah dan klik <strong>"Tampilkan di Beranda"</strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Search & Filter Controls ─────────────────────────────────── */}
      <div style={{
        backgroundColor: C.card,
        borderRadius: '12px',
        border: `1px solid ${C.border}`,
        padding: '16px 20px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: C.shadowSm
      }}>
        {/* Search */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
          <Search size={16} color={C.textMuted} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Cari nama pengulas, produk, atau kata kunci..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              borderRadius: '6px',
              border: `1px solid ${C.borderDark}`,
              fontSize: '0.82rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Filter Badges */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `Semua (${reviews.length})` },
            { id: 'featured', label: `★ Tampil di Beranda (${featuredReviews.length})` },
            { id: 'not_featured', label: 'Belum Tampil' },
            { id: '5', label: '⭐ 5 Bintang' },
            { id: 'has_photo', label: '📷 Ada Foto' }
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterRating(f.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 700,
                border: filterRating === f.id ? '1.5px solid #080808' : `1px solid ${C.border}`,
                backgroundColor: filterRating === f.id ? '#080808' : '#FFFFFF',
                color: filterRating === f.id ? '#FFFFFF' : C.textSub,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── All Reviews Table ────────────────────────────────────────── */}
      <div style={{
        backgroundColor: C.card,
        borderRadius: '14px',
        border: `1px solid ${C.border}`,
        overflow: 'hidden',
        boxShadow: C.shadowMd
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: `1.5px solid ${C.border}` }}>
                <th style={{ padding: '14px 18px', fontWeight: 800, color: C.textMuted, fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>PENGULAS</th>
                <th style={{ padding: '14px 18px', fontWeight: 800, color: C.textMuted, fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>PRODUK</th>
                <th style={{ padding: '14px 18px', fontWeight: 800, color: C.textMuted, fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>RATING</th>
                <th style={{ padding: '14px 18px', fontWeight: 800, color: C.textMuted, fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>KOMENTAR &amp; FOTO</th>
                <th style={{ padding: '14px 18px', fontWeight: 800, color: C.textMuted, fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>STATUS BERANDA</th>
                <th style={{ padding: '14px 18px', fontWeight: 800, color: C.textMuted, fontSize: '0.72rem', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: C.textMuted }}>
                    Tidak ada ulasan yang sesuai dengan pencarian atau filter.
                  </td>
                </tr>
              ) : (
                filteredReviews.map((rev) => {
                  const isFeatured = featuredReviews.some(f => String(f.id) === String(rev.id));
                  const slotNum = featuredReviews.findIndex(f => String(f.id) === String(rev.id)) + 1;

                  return (
                    <tr
                      key={rev.id}
                      style={{
                        borderBottom: `1px solid ${C.border}`,
                        backgroundColor: isFeatured ? '#F0FDF4' : 'transparent',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      {/* Reviewer */}
                      <td style={{ padding: '16px 18px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 800, color: C.textHead }}>
                          {rev.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: C.textMuted, fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                          {rev.city || 'Indonesia'} • {rev.date}
                        </div>
                      </td>

                      {/* Product */}
                      <td style={{ padding: '16px 18px', verticalAlign: 'top', minWidth: '160px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {rev.image && (
                            <img src={rev.image} alt="" style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover', border: '1px solid #ddd' }} />
                          )}
                          <div>
                            <div style={{ fontWeight: 700, color: C.textSub, fontSize: '0.8rem' }}>
                              {rev.product_name}
                            </div>
                            {rev.size && (
                              <div style={{ fontSize: '0.68rem', color: C.textMuted, fontFamily: 'var(--font-mono)' }}>
                                SIZE {rev.size}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Rating */}
                      <td style={{ padding: '16px 18px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={14} fill={i < rev.rating ? '#F59E0B' : 'none'} color={i < rev.rating ? '#F59E0B' : '#CBD5E1'} />
                          ))}
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, marginLeft: '4px', color: '#B45309', fontFamily: 'var(--font-mono)' }}>
                            {rev.rating}.0
                          </span>
                        </div>
                      </td>

                      {/* Comment & Photo */}
                      <td style={{ padding: '16px 18px', verticalAlign: 'top', maxWidth: '340px' }}>
                        <div style={{ color: C.textMain, lineHeight: '1.5', fontSize: '0.82rem', marginBottom: '8px' }}>
                          "{rev.comment}"
                        </div>

                        {/* Review photos preview — supports multi-photo */}
                        {(() => {
                          const allPhotos = Array.isArray(rev.photos) && rev.photos.length > 0
                            ? rev.photos
                            : (rev.photo ? [rev.photo] : rev.image ? [rev.image] : []);
                          if (allPhotos.length === 0) return null;
                          return (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                              {allPhotos.slice(0, 4).map((src, i) => (
                                <img
                                  key={i}
                                  src={src}
                                  alt={`Foto ${i + 1}`}
                                  onClick={() => setZoomImage(src)}
                                  style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '4px',
                                    objectFit: 'cover',
                                    border: '1.5px solid #d1d5db',
                                    cursor: 'pointer'
                                  }}
                                  title={`Klik untuk memperbesar foto ${i + 1}`}
                                />
                              ))}
                              {allPhotos.length > 1 && (
                                <span style={{ fontSize: '0.68rem', color: C.textMuted, fontFamily: 'var(--font-mono)' }}>
                                  {allPhotos.length} foto
                                </span>
                              )}
                            </div>
                          );
                        })()}

                      </td>

                      {/* Status Beranda */}
                      <td style={{ padding: '16px 18px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                        {isFeatured ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            backgroundColor: C.emeraldLight,
                            color: C.emeraldText,
                            border: `1px solid ${C.emeraldBorder}`,
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontSize: '0.72rem',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 800
                          }}>
                            <CheckCircle2 size={12} color={C.emeraldText} /> TAMPIL (SLOT #{slotNum})
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            backgroundColor: C.surface,
                            color: C.textMuted,
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontSize: '0.72rem',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 600
                          }}>
                            Tidak Tampil
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '16px 18px', verticalAlign: 'top', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          {isFeatured ? (
                            <button
                              type="button"
                              onClick={() => toggleFeatureOnHome(rev)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                backgroundColor: C.surface,
                                border: `1px solid ${C.borderDark}`,
                                color: C.textSub,
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <EyeOff size={13} /> Sembunyikan
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => toggleFeatureOnHome(rev)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                backgroundColor: '#080808',
                                border: 'none',
                                color: '#b7d600',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <Sparkles size={13} /> Tampilkan di Beranda
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteReview(rev.id, rev.name)}
                            title="Hapus Ulasan"
                            style={{
                              padding: '6px',
                              borderRadius: '6px',
                              backgroundColor: C.redBg,
                              border: `1px solid ${C.redBorder}`,
                              color: C.redText,
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={14} />
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
      </div>

      {/* ── Modal: Tambah Ulasan Editorial Manual ─────────────────────── */}
      {isAddModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={e => { if (e.target === e.currentTarget) setIsAddModalOpen(false); }}
        >
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #E5E5E5',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.15rem', textTransform: 'uppercase' }}>
                  Tambah Ulasan Editorial
                </h3>
                <span style={{ fontSize: '0.75rem', color: C.textMuted, fontFamily: 'var(--font-mono)' }}>
                  Tambahkan ulasan pelanggan terpilih untuk memperkuat reputasi toko
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddManualReview} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.74rem' }}>NAMA PELANGGAN *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={newReviewForm.name}
                    onChange={e => setNewReviewForm({ ...newReviewForm, name: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.74rem' }}>KOTA ASAL</label>
                  <input
                    type="text"
                    placeholder="Contoh: Surabaya"
                    value={newReviewForm.city}
                    onChange={e => setNewReviewForm({ ...newReviewForm, city: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.74rem' }}>PRODUK YANG DIBELI</label>
                  <input
                    type="text"
                    placeholder="Nama Sepatu..."
                    value={newReviewForm.product_name}
                    onChange={e => setNewReviewForm({ ...newReviewForm, product_name: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.74rem' }}>RATING BINTANG</label>
                  <select
                    value={newReviewForm.rating}
                    onChange={e => setNewReviewForm({ ...newReviewForm, rating: Number(e.target.value) })}
                    className="form-select"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5)</option>
                    <option value={4}>⭐⭐⭐⭐ (4)</option>
                    <option value={3}>⭐⭐⭐ (3)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.74rem' }}>ISI ULASAN / TESTIMONIAL *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tuliskan pengalaman pemakaian sepatu, kualitas sol, keaslian kulit, atau kecepatan pengiriman..."
                  value={newReviewForm.comment}
                  onChange={e => setNewReviewForm({ ...newReviewForm, comment: e.target.value })}
                  className="form-textarea"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.8rem'
                  }}
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#080808',
                    color: '#b7d600',
                    cursor: 'pointer',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  SIMPAN ULASAN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Zoom Foto Ulasan ─────────────────────────────────── */}
      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out',
            padding: '20px'
          }}
        >
          <img
            src={zoomImage}
            alt="Foto Ulasan Pembeli"
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '8px', objectFit: 'contain' }}
          />
        </div>
      )}
    </div>
  );
};

export default CustomerReviews;
