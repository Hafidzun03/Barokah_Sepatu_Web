import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { sampleCategories, sampleProducts } from '../data/sampleProducts';
import { getProducts, getCategories } from '../lib/productsApi';
import { ProductCard } from '../components/ProductCard';
import { 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Star, 
  Flame, 
  Award, 
  Zap,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ThumbsUp,
  MessageSquareQuote,
  MessageSquare,
  Plus,
  X,
  Check,
  Lock,
  Gift,
  Copy
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getFeaturedHomeReviews, getFeaturedHomeReviewsSync, submitReview } from '../lib/reviewsApi';
import { checkPromoUsage } from '../lib/vouchersApi';
import { VoucherUsedModal } from '../components/VoucherUsedModal';

// Curated Customer Reviews & Testimonials for Toko Barokah Shoes
const sampleCustomerReviews = [
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
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80'
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
    image: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=400&q=80'
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
    helpful: 24,
    size: 'EU 41',
    image: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'rev-4',
    name: 'Fajar Ramadhan',
    city: 'Yogyakarta',
    product_name: 'Barokah Velocity Runner X',
    product_slug: 'barokah-velocity-runner-x',
    category: 'runner',
    rating: 5,
    date: '1 minggu yang lalu',
    comment: 'Ringan banget gokil! Drop solnya pas buat lari 5K pagi hari. Breathability kain mesh-nya adem, kaki gak gampang berkeringat. Pengiriman ke Yogya cuma 1 hari sampai dan kurirnya sangat amanah.',
    helpful: 19,
    size: 'EU 42',
    image: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'rev-5',
    name: 'Ahmad Fauzan',
    city: 'Semarang',
    product_name: 'Urban Streetwear Slip-on',
    product_slug: 'urban-streetwear-slip-on',
    category: 'sneakers',
    rating: 5,
    date: '2 minggu yang lalu',
    comment: 'Sangat praktis tinggal slup buat nongkrong santai atau ke masjid. Insole memory foam-nya empuk pol, desain simpel tapi looks clean & aesthetic. Bakal repeat order warna lain secepatnya!',
    helpful: 17,
    size: 'EU 40',
    image: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'rev-6',
    name: 'Dedi Tri Irawan',
    city: 'Malang',
    product_name: 'Barokah Air Legacy Pro',
    product_slug: 'barokah-air-legacy-pro',
    category: 'sneakers',
    rating: 5,
    date: '3 minggu yang lalu',
    comment: 'Awalnya ragu beli sepatu online, tapi pas unboxing langsung takjub sama kerapian detailnya. Silhouette-nya timeless streetwear banget, match sama celana kargo maupun denim. Mantap Toko Barokah!',
    helpful: 42,
    size: 'EU 43',
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=400&q=80'
  }
];

export const Home = () => {
  const { user, profile } = useAuth();
  const [products, setProducts] = useState(sampleProducts);
  const [categories, setCategories] = useState(sampleCategories);
  const [copiedVoucher, setCopiedVoucher] = useState(false);
  const [isBarokahUsed, setIsBarokahUsed] = useState(false);
  const [barokahUsageData, setBarokahUsageData] = useState(null);
  const [showUsedModal, setShowUsedModal] = useState(false);

  // Check if BAROKAH10 voucher has already been used by the current user
  useEffect(() => {
    let isMounted = true;
    const checkUsage = async () => {
      if (user) {
        const usage = await checkPromoUsage('BAROKAH10', user);
        if (isMounted) {
          if (usage) {
            setIsBarokahUsed(true);
            setBarokahUsageData(usage);
          } else {
            setIsBarokahUsed(false);
            setBarokahUsageData(null);
          }
        }
      } else {
        if (isMounted) {
          setIsBarokahUsed(false);
          setBarokahUsageData(null);
        }
      }
    };
    checkUsage();

    const handlePromoUsed = (e) => {
      if (e.detail?.promoCode === 'BAROKAH10') {
        setIsBarokahUsed(true);
        setBarokahUsageData(e.detail);
      }
    };

    window.addEventListener('barokah:promo_used', handlePromoUsed);
    window.addEventListener('barokah:voucher_redeemed', handlePromoUsed);
    return () => {
      isMounted = false;
      window.removeEventListener('barokah:promo_used', handlePromoUsed);
      window.removeEventListener('barokah:voucher_redeemed', handlePromoUsed);
    };
  }, [user]);

  // Curated Featured Reviews for Homepage (Max 3, strictly controlled by Admin)
  const [reviewsList, setReviewsList] = useState(getFeaturedHomeReviewsSync);
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);

  const loadFeaturedReviews = async () => {
    try {
      const featured = await getFeaturedHomeReviews();
      setReviewsList(featured || []);
    } catch (err) {
      console.warn('Load featured reviews error:', err);
    }
  };

  useEffect(() => {
    loadFeaturedReviews();

    // 1. Cross-tab BroadcastChannel for 0ms instant sync across browser tabs
    let bc = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('barokah_reviews_sync');
        bc.onmessage = (event) => {
          if (event.data?.updatedFeatured) {
            setReviewsList(event.data.updatedFeatured.slice(0, 3));
          } else {
            loadFeaturedReviews();
          }
        };
      }
    } catch {}

    // 2. Intra-window custom event (same tab)
    const handleFeaturedUpdate = (e) => {
      if (e.detail?.updatedFeatured) {
        setReviewsList(e.detail.updatedFeatured.slice(0, 3));
      } else {
        loadFeaturedReviews();
      }
    };
    window.addEventListener('barokah:featured_reviews_updated', handleFeaturedUpdate);

    // 3. Storage event across tabs
    const handleStorageChange = (e) => {
      if (e.key === 'barokah_home_featured_reviews' || e.key === 'barokah_featured_sync_event') {
        try {
          const fresh = JSON.parse(localStorage.getItem('barokah_home_featured_reviews') || '[]');
          setReviewsList(fresh.slice(0, 3));
        } catch {
          loadFeaturedReviews();
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 4. Tab focus & visibility change (when user switches back to this tab)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadFeaturedReviews();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', loadFeaturedReviews);

    // 5. Supabase Realtime WebSocket subscription
    let realtimeChannel = null;
    if (isSupabaseConfigured) {
      try {
        realtimeChannel = supabase
          .channel('home_realtime_reviews')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'reviews' },
            () => {
              loadFeaturedReviews();
            }
          )
          .subscribe();
      } catch (err) {
        console.warn('Realtime channel error:', err);
      }
    }

    return () => {
      if (bc) bc.close();
      window.removeEventListener('barokah:featured_reviews_updated', handleFeaturedUpdate);
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', loadFeaturedReviews);
      if (realtimeChannel) realtimeChannel.unsubscribe();
    };
  }, []);

  const [reviewFilter, setReviewFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [likedReviews, setLikedReviews] = useState({});
  const [formSuccess, setFormSuccess] = useState(false);

  const [newReview, setNewReview] = useState({
    name: '',
    city: '',
    product_name: 'Barokah Air Legacy Pro',
    category: 'sneakers',
    size: 'EU 42',
    rating: 5,
    comment: ''
  });

  const handleLikeReview = (id) => {
    setLikedReviews(prev => {
      const alreadyLiked = !prev[id];
      const updated = { ...prev, [id]: !alreadyLiked };
      setReviewsList(current => current.map(item => {
        if (item.id === id) {
          return { ...item, helpful: item.helpful + (alreadyLiked ? -1 : 1) };
        }
        return item;
      }));
      return updated;
    });
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!newReview.name || !newReview.comment) return;

    const matchedProduct = products.find(p => p.name === newReview.product_name) || products[0];

    try {
      await submitReview({
        userName: newReview.name,
        userCity: newReview.city || 'Indonesia',
        productName: newReview.product_name,
        productSlug: matchedProduct?.slug || 'barokah-air-legacy-pro',
        productId: matchedProduct?.id || null,
        productImage: matchedProduct?.images?.[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80',
        size: newReview.size || 'EU 42',
        rating: Number(newReview.rating),
        comment: newReview.comment,
        featuredOnHome: false // Waiting for admin approval!
      });

      setFormSuccess(true);
      toast.success('Terima kasih! Ulasan Anda telah tersimpan dan akan ditinjau Admin untuk beranda.');
      setTimeout(() => {
        setFormSuccess(false);
        setIsModalOpen(false);
        setNewReview({
          name: '',
          city: '',
          product_name: 'Barokah Air Legacy Pro',
          category: 'sneakers',
          size: 'EU 42',
          rating: 5,
          comment: ''
        });
      }, 1200);
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengirim ulasan');
    }
  };

  // Editorial 3-Card Display (Max 3 featured by Admin)
  const [reviewPageIndex, setReviewPageIndex] = useState(0);
  const reviewsPerPage = 3;
  const totalReviewPages = Math.ceil(reviewsList.length / reviewsPerPage);
  const displayedReviews = reviewsList.slice(0, 3);

  // 3-Slide Interactive Hero Showcase Data (TEPAT 3 PRODUK)
  const heroSlides = useMemo(() => {
    // 1. Cari 3 produk utama yang ikonik di katalog:
    // - Barokah Runner Pro X (Sepatu Lari Merah)
    // - Summit Trail Hiker (Boots Outdoor)
    // - Urban Classic Leather (Pantofel Kulit Formal)
    const p1 = (products || []).find(p => p.slug === 'barokah-runner-pro-x' || p.slug === 'barokah-air-legacy-pro');
    const p2 = (products || []).find(p => p.slug === 'summit-trail-hiker' || p.slug === 'timber-nomad-tactical-boots');
    const p3 = (products || []).find(p => p.slug === 'urban-classic-leather' || p.slug === 'royal-oxford-formal-classic');

    const selectedThree = [p1, p2, p3].filter(Boolean);

    // Jika salah satu belum ada, lengkapi dari produk lainnya hingga tepat 3 produk
    if (selectedThree.length < 3) {
      const others = (products || []).filter(p => !selectedThree.some(s => s.id === p.id));
      for (const item of others) {
        if (selectedThree.length >= 3) break;
        selectedThree.push(item);
      }
    }

    const defaultBadges = [
      { badge: 'FEATURED DROP', badgeClass: 'badge-citron' },
      { badge: 'NEW ARRIVAL', badgeClass: 'badge-citron' },
      { badge: 'BEST SELLER', badgeClass: 'badge-citron' }
    ];

    // Batasi ketat HANYA 3 PRODUK
    return selectedThree.slice(0, 3).map((prod, idx) => {
      const badgeInfo = defaultBadges[idx] || { badge: 'FEATURED DROP', badgeClass: 'badge-citron' };
      const displayPrice = prod.discount_price || prod.price || prod.base_price || 0;
      const formattedPrice = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(displayPrice);

      return {
        id: prod.id || `slide-${idx}`,
        badge: badgeInfo.badge,
        badgeClass: badgeInfo.badgeClass,
        title: (prod.name || 'SEPATU BAROKAH').toUpperCase(),
        price: formattedPrice,
        image: prod.images?.[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=80',
        alt: prod.name || 'Produk Unggulan Barokah',
        link: `/product/${prod.slug || prod.id}`
      };
    });
  }, [products]);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Keep currentSlide within bounds if heroSlides length updates
  useEffect(() => {
    if (currentSlide >= heroSlides.length) {
      setCurrentSlide(0);
    }
  }, [heroSlides.length, currentSlide]);

  // Automatic slide rotation every 4 seconds
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroSlides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isPaused, heroSlides.length]);

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % heroSlides.length);
  };

  useEffect(() => {
    const loadHomeData = () => {
      getProducts().then(prods => { if (prods && prods.length > 0) setProducts(prods); });
      getCategories().then(cats => { if (cats && cats.length > 0) setCategories(cats); });
    };
    loadHomeData();

    window.addEventListener('barokah:products_updated', loadHomeData);
    window.addEventListener('focus', loadHomeData);
    return () => {
      window.removeEventListener('barokah:products_updated', loadHomeData);
      window.removeEventListener('focus', loadHomeData);
    };
  }, []);

  const featuredProducts = products.filter(p => p.is_featured);
  const allProducts = products;

  return (
    <div>
      {/* Stitch Editorial High-Velocity Hero Section */}
      <section style={{
        backgroundColor: '#080808',
        color: '#ffffff',
        padding: '32px 0 60px',
        position: 'relative',
        overflow: 'hidden',
        borderBottom: '1px solid #1f1f1f'
      }}>
        {/* Subtle grid texture overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'radial-gradient(rgba(183, 214, 0, 0.08) 1px, transparent 0)',
          backgroundSize: '32px 32px',
          pointerEvents: 'none'
        }} />

        <div className="container" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          alignItems: 'center',
          gap: '50px',
          position: 'relative',
          zIndex: 2
        }}>
          <div>
            {/* Release Eyebrow */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '2px',
              backgroundColor: '#1a1a1a',
              border: '1px solid #333333',
              color: '#b7d600',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: '700',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '24px'
            }}>
              <Zap size={14} color="#b7d600" /> DROP EDITION 2026 • AUTONOMOUS CRAFT
            </div>

            {/* Display Hero Title (Manrope 800) */}
            <h1 style={{
              color: '#ffffff',
              fontSize: 'clamp(2.4rem, 5.5vw, 4rem)',
              fontWeight: '900',
              lineHeight: '1.08',
              marginBottom: '20px',
              letterSpacing: '-0.03em',
              textTransform: 'uppercase'
            }}>
              SETIAP LANGKAH ADA <span style={{ color: '#b7d600' }}>BAROKAH</span>
            </h1>

            <p style={{
              color: '#a3a3a3',
              fontSize: '1.05rem',
              lineHeight: '1.6',
              marginBottom: '32px',
              maxWidth: '520px'
            }}>
              Destinasi terdepan sneakers langka, oxford kulit murni, dan sepatu taktikal premium dengan presisi estetika modern dan material teruji.
            </p>

            {/* CTA Group */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
              <Link to="/shop" className="btn btn-accent btn-lg">
                JELAJAHI DROP <ArrowRight size={18} />
              </Link>
              <Link to="/shop?category=1" className="btn btn-outline btn-lg" style={{ color: '#ffffff', borderColor: '#404040' }}>
                KATALOG SNEAKERS
              </Link>
            </div>

            {/* Editorial Technical Readouts (JetBrains Mono) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '20px',
              marginTop: '48px',
              paddingTop: '28px',
              borderTop: '1px solid #222222',
              fontFamily: 'var(--font-mono)'
            }}>
              <div>
                <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#ffffff' }}>5.000+</div>
                <div style={{ fontSize: '0.72rem', color: '#777777', textTransform: 'uppercase', letterSpacing: '0.05em' }}>VERIFIED PAIRS</div>
              </div>
              <div>
                <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#b7d600' }}>100%</div>
                <div style={{ fontSize: '0.72rem', color: '#777777', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AUTHENTICITY</div>
              </div>
              <div>
                <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#ffffff' }}>4.9 ★</div>
                <div style={{ fontSize: '0.72rem', color: '#777777', textTransform: 'uppercase', letterSpacing: '0.05em' }}>COLLECTOR RATING</div>
              </div>
            </div>
          </div>

          {/* Hero Heroic Product Showcase (Interactive Automatic Carousel) */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <div 
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '460px',
                borderRadius: '4px',
                overflow: 'hidden',
                backgroundColor: '#f4f4f4',
                border: '1px solid #333333',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)'
              }}
            >
              {/* Carousel Track with Smooth Horizontal Slide */}
              <div style={{
                display: 'flex',
                width: '100%',
                transform: `translateX(-${currentSlide * 100}%)`,
                transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
              }}>
                {heroSlides.map((slide) => (
                  <div 
                    key={slide.id} 
                    style={{
                      flex: '0 0 100%',
                      width: '100%',
                      position: 'relative'
                    }}
                  >
                    <Link to={slide.link} style={{ display: 'block', textDecoration: 'none' }}>
                      <img 
                        src={slide.image} 
                        alt={slide.alt}
                        style={{ width: '100%', height: '440px', objectFit: 'cover', display: 'block' }}
                      />
                    </Link>
                    
                    {/* Gradient Overlay with Slide Information */}
                    <div style={{
                      position: 'absolute',
                      bottom: '0',
                      left: '0',
                      right: '0',
                      padding: '24px 24px 34px 24px',
                      background: 'linear-gradient(to top, rgba(8,8,8,0.96) 0%, rgba(8,8,8,0.65) 65%, rgba(8,8,8,0) 100%)'
                    }}>
                      <span className={`badge ${slide.badgeClass}`} style={{ marginBottom: '8px' }}>
                        {slide.badge}
                      </span>
                      <Link to={slide.link} style={{ textDecoration: 'none' }}>
                        <h3 style={{ color: '#ffffff', fontSize: '1.35rem', fontWeight: '800', marginBottom: '4px', textTransform: 'uppercase' }}>
                          {slide.title}
                        </h3>
                      </Link>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                        <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#b7d600', fontFamily: 'var(--font-mono)' }}>
                          {slide.price}
                        </div>
                        <Link 
                          to={slide.link} 
                          className="btn btn-primary btn-sm" 
                          style={{ backgroundColor: '#ffffff', color: '#080808', fontWeight: '800' }}
                        >
                          DETAIL
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation Arrows: Previous & Next */}
              <button
                type="button"
                onClick={prevSlide}
                aria-label="Slide sebelumnya"
                style={{
                  position: 'absolute',
                  top: '40%',
                  left: '12px',
                  transform: 'translateY(-50%)',
                  width: '36px',
                  height: '36px',
                  borderRadius: '2px',
                  backgroundColor: 'rgba(8, 8, 8, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 10,
                  backdropFilter: 'blur(4px)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#b7d600';
                  e.currentTarget.style.color = '#b7d600';
                  e.currentTarget.style.backgroundColor = '#080808';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.backgroundColor = 'rgba(8, 8, 8, 0.75)';
                }}
              >
                <ChevronLeft size={20} />
              </button>

              <button
                type="button"
                onClick={nextSlide}
                aria-label="Slide berikutnya"
                style={{
                  position: 'absolute',
                  top: '40%',
                  right: '12px',
                  transform: 'translateY(-50%)',
                  width: '36px',
                  height: '36px',
                  borderRadius: '2px',
                  backgroundColor: 'rgba(8, 8, 8, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 10,
                  backdropFilter: 'blur(4px)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#b7d600';
                  e.currentTarget.style.color = '#b7d600';
                  e.currentTarget.style.backgroundColor = '#080808';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.backgroundColor = 'rgba(8, 8, 8, 0.75)';
                }}
              >
                <ChevronRight size={20} />
              </button>

              {/* Indicator Dots */}
              <div style={{
                position: 'absolute',
                bottom: '10px',
                left: '0',
                right: '0',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                zIndex: 10
              }}>
                {heroSlides.map((slide, idx) => {
                  const isActive = currentSlide === idx;
                  return (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() => setCurrentSlide(idx)}
                      aria-label={`Pilih slide ${idx + 1}`}
                      style={{
                        width: isActive ? '24px' : '8px',
                        height: '4px',
                        borderRadius: '2px',
                        backgroundColor: isActive ? '#b7d600' : 'rgba(255, 255, 255, 0.4)',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        padding: 0
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid (Stitch Architectural Layout) */}
      <section style={{ padding: '70px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                CURATED CATEGORIES
              </span>
              <h2 style={{ fontSize: '2rem', fontWeight: '900', marginTop: '4px', textTransform: 'uppercase' }}>
                KOLEKSI KATEGORI
              </h2>
            </div>
            <Link to="/shop" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '0.85rem', color: '#080808', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              SEMUA PRODUK <ArrowRight size={16} />
            </Link>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px'
          }}>
            {sampleCategories.map((cat, idx) => {
              const bgImages = [
                'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=70',
                'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=500&q=70',
                'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=500&q=70',
                'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=500&q=70',
                'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=500&q=70',
                'https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&w=500&q=70',
              ];

              return (
                <Link
                  key={cat.id}
                  to={`/shop?category=${cat.id}`}
                  style={{
                    position: 'relative',
                    height: '160px',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: '16px',
                    border: '1px solid #e5e5e5',
                    transition: 'transform 0.2s ease, border-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.borderColor = '#080808';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = '#e5e5e5';
                  }}
                >
                  <img 
                    src={bgImages[idx % bgImages.length]} 
                    alt={cat.name}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(to top, rgba(8,8,8,0.85) 0%, rgba(8,8,8,0.2) 100%)'
                  }} />
                  <div style={{ position: 'relative', zIndex: 2 }}>
                    <h4 style={{ color: '#ffffff', fontSize: '1rem', fontWeight: '800', textTransform: 'uppercase' }}>{cat.name}</h4>
                    <span style={{ color: '#b7d600', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>EXPLORE &rarr;</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Drops Section */}
      <section style={{ padding: '60px 0', backgroundColor: '#ffffff', borderTop: '1px solid #e5e5e5', borderBottom: '1px solid #e5e5e5' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#080808', fontWeight: '800', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                <Flame size={16} color="#ba1a1a" /> LIMITED & EXCLUSIVE DROPS
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: '900', marginTop: '4px', textTransform: 'uppercase' }}>
                PRODUK UNGGULAN
              </h2>
            </div>
            <Link to="/shop" className="btn btn-outline btn-sm">
              SEMUA KATALOG
            </Link>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '20px'
          }}>
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Stitch Editorial Lookbook Sand Banner (`#F3F0EB`) */}
      <section style={{ padding: '70px 0' }}>
        <div className="container">
          <div style={{
            borderRadius: '4px',
            backgroundColor: '#f3f0eb',
            border: '1px solid #e5e5e5',
            padding: '50px 40px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            alignItems: 'center',
            gap: '30px'
          }}>
            <div>
              {user ? (
                isBarokahUsed ? (
                  <>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                      <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#dc2626', color: '#ffffff', fontWeight: '800' }}>
                        <CheckCircle2 size={13} color="#ffffff" /> KODE SUDAH DIGUNAKAN (1X)
                      </span>
                    </div>
                    <h2 style={{ color: '#080808', fontSize: '2.1rem', fontWeight: '900', margin: '0 0 12px', lineHeight: '1.15', textTransform: 'uppercase' }}>
                      VOUCHER BAROKAH10 TELAH DIGUNAKAN
                    </h2>
                    <p style={{ color: '#666666', fontSize: '0.92rem', maxWidth: '480px', marginBottom: '18px', lineHeight: '1.6' }}>
                      Kode promo selamat datang 10% telah tercatat digunakan pada pesanan Anda dan hanya berlaku 1 kali pakai.
                    </p>

                    {/* Recommendation box for unlocking the next code */}
                    <div style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '14px 18px',
                      marginBottom: '22px',
                      maxWidth: '500px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <Gift size={16} color="#080808" />
                        <span style={{ fontWeight: '900', fontSize: '0.85rem', fontFamily: 'var(--font-heading)', color: '#080808', textTransform: 'uppercase' }}>
                          COBA DAPATKAN KODE VOUCHER LAIN: DISKON 30%!
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#475569', margin: '0 0 10px', lineHeight: '1.5' }}>
                        Kumpulkan total <strong>10 pasang sepatu</strong> dari belanja Anda untuk mendapatkan voucher potongan <strong>30%</strong> otomatis khusus akun Anda.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowUsedModal(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc2626',
                          textDecoration: 'underline',
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: '800',
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        Mengapa kode BAROKAH10 tidak bisa dipakai lagi? Klik untuk info
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                      <Link to="/profile" className="btn btn-primary btn-lg">
                        CEK PROGRES VOUCHER 30% <ArrowRight size={18} />
                      </Link>
                      <Link to="/shop" className="btn btn-dark btn-lg">
                        JELAJAHI KATALOG
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                      <span className="badge badge-dark" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#080808', color: '#b7d600' }}>
                        <Gift size={13} color="#b7d600" /> VOUCHER MEMBER AKTIF
                      </span>
                    </div>
                    <h2 style={{ color: '#080808', fontSize: '2.2rem', fontWeight: '900', margin: '0 0 12px', lineHeight: '1.15', textTransform: 'uppercase' }}>
                      EKSTRA POTONGAN 10% UNTUK DROP PERTAMA ANDA
                    </h2>
                    <p style={{ color: '#666666', fontSize: '0.95rem', maxWidth: '480px', marginBottom: '20px', lineHeight: '1.6' }}>
                      Selamat! Akun Anda telah terdaftar. Gunakan kode voucher resmi di bawah ini pada saat checkout untuk menikmati potongan harga 10%.
                    </p>
                    
                    {/* Copyable Voucher Box */}
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 18px',
                      backgroundColor: '#ffffff',
                      borderRadius: '4px',
                      border: '2px dashed #080808',
                      marginBottom: '24px'
                    }}>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#666666', fontWeight: '700' }}>KODE:</span>
                      <span style={{ fontSize: '1.2rem', fontWeight: '900', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', color: '#080808' }}>
                        BAROKAH10
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText('BAROKAH10');
                          setCopiedVoucher(true);
                          toast.success('Kode voucher BAROKAH10 berhasil disalin!');
                          setTimeout(() => setCopiedVoucher(false), 2500);
                        }}
                        className="btn btn-sm btn-dark"
                        style={{ padding: '6px 14px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '3px' }}
                      >
                        {copiedVoucher ? <Check size={14} color="#b7d600" /> : <Copy size={14} />}
                        {copiedVoucher ? 'TERSALIN' : 'SALIN KODE'}
                      </button>
                    </div>

                    <div>
                      <Link to="/shop" className="btn btn-primary btn-lg">
                        GUNAKAN VOUCHER & BELANJA <ArrowRight size={18} />
                      </Link>
                    </div>
                  </>
                )
              ) : (
                <>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                    <span className="badge badge-dark" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#080808', color: '#b7d600' }}>
                      <Sparkles size={13} color="#b7d600" /> EKSKLUSIF MEMBER BARU
                    </span>
                  </div>
                  <h2 style={{ color: '#080808', fontSize: '2.2rem', fontWeight: '900', margin: '0 0 12px', lineHeight: '1.15', textTransform: 'uppercase' }}>
                    AYO BERGABUNG & KLAIM VOUCHER ANDA!
                  </h2>
                  <p style={{ color: '#666666', fontSize: '0.95rem', maxWidth: '480px', marginBottom: '18px', lineHeight: '1.6' }}>
                    Daftarkan akun Barokah Shoes Anda sekarang untuk membuka kode voucher potongan <strong>10%</strong> pada pesanan drop pertama Anda.
                  </p>

                  {/* Locked Voucher Teaser */}
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 16px',
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    borderRadius: '4px',
                    border: '1px dashed #bbbbbb',
                    marginBottom: '24px'
                  }}>
                    <Lock size={15} color="#555555" />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#555555', letterSpacing: '0.04em' }}>
                      KODE VOUCHER: <strong style={{ letterSpacing: '0.2em', color: '#080808' }}>••••••••••</strong> (Daftar akun untuk membuka)
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
                    <Link to="/register" className="btn btn-primary btn-lg">
                      AYO BERGABUNG SEKARANG <ArrowRight size={18} />
                    </Link>
                    <span style={{ fontSize: '0.85rem', color: '#666666' }}>
                      Sudah punya akun?{' '}
                      <Link to="/login" style={{ color: '#080808', fontWeight: '700', textDecoration: 'underline' }}>
                        Masuk di sini
                      </Link>
                    </span>
                  </div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '4px',
                padding: '28px',
                border: '1px solid #e5e5e5',
                maxWidth: '360px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <Award size={26} color="#080808" />
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '1rem', textTransform: 'uppercase' }}>OFFICIAL GUARANTEE</div>
                    <div style={{ fontSize: '0.72rem', color: '#666666', fontFamily: 'var(--font-mono)' }}>ORIGINAL FACTORY GRADE</div>
                  </div>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#666666', lineHeight: '1.6' }}>
                  Setiap pasang sepatu dipastikan bebas dari cacat pabrik dengan garansi penukaran ukuran jika sepatu tidak pas di kaki Anda.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* All Products Catalog */}
      <section style={{ padding: '0 0 80px' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                ALL SILHOUETTES
              </span>
              <h2 style={{ fontSize: '2rem', fontWeight: '900', marginTop: '4px', textTransform: 'uppercase' }}>
                SEMUA KOLEKSI SEPATU
              </h2>
            </div>
            <Link to="/shop" className="btn btn-outline btn-sm">
              LIHAT SEMUA ({allProducts.length})
            </Link>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '20px'
          }}>
            {allProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Redesigned Editorial Customer Reviews Section */}
      <section id="ulasan-pelanggan" style={{
        backgroundColor: '#f8f7f4',
        color: '#080808',
        padding: '100px 0 95px',
        borderTop: '1px solid #e8e6e1',
        borderBottom: '1px solid #e0ded8',
        position: 'relative'
      }}>
        <div className="container">
          {/* 1. Header Section */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: '24px',
            marginBottom: '40px'
          }}>
            <div style={{ maxWidth: '640px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                backgroundColor: '#080808',
                color: '#b7d600',
                padding: '4px 10px',
                borderRadius: '2px',
                fontWeight: '800',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: '14px'
              }}>
                REAL STORIES. REAL STEPS.
              </div>
              <h2 style={{
                fontSize: 'clamp(2rem, 3.8vw, 2.9rem)',
                fontWeight: '900',
                color: '#080808',
                letterSpacing: '-0.025em',
                lineHeight: '1.15',
                margin: '0 0 14px'
              }}>
                Dipakai Mereka, Dibuktikan Nyaman.
              </h2>
              <p style={{
                color: '#666666',
                fontSize: '1rem',
                lineHeight: '1.65',
                margin: 0
              }}>
                Koleksi ulasan jujur dari komunitas sneakerhead dan pelanggan setia Barokah Shoes di seluruh Indonesia. Dari ketahanan material kulit hingga kenyamanan insole setiap hari.
              </p>
            </div>

            {/* Pagination Controls on Header */}
            {totalReviewPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setReviewPageIndex(prev => (prev - 1 + totalReviewPages) % totalReviewPages)}
                  aria-label="Previous Reviews"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '4px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #dcdad5',
                    color: '#080808',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#080808'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#dcdad5'; }}
                >
                  <ChevronLeft size={18} />
                </button>
                <div style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: '#666666', padding: '0 8px' }}>
                  {reviewPageIndex + 1} / {totalReviewPages}
                </div>
                <button
                  onClick={() => setReviewPageIndex(prev => (prev + 1) % totalReviewPages)}
                  aria-label="Next Reviews"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '4px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #dcdad5',
                    color: '#080808',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#080808'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#dcdad5'; }}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>

          {/* 2. Rating Summary — Minimalist Balanced Horizontal Layout */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
            padding: '24px 28px',
            backgroundColor: '#ffffff',
            border: '1px solid #e5e5e5',
            borderRadius: '6px',
            marginBottom: '40px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
          }}>
            {/* Left: Big Score & Stars & Total */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{
                fontSize: '2.8rem',
                fontWeight: '900',
                color: '#080808',
                lineHeight: 1,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '-0.02em'
              }}>
                4.9<span style={{ fontSize: '1.2rem', color: '#888888', fontWeight: '600' }}>/5.0</span>
              </div>
              <div>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} fill="#b7d600" color="#222222" />
                  ))}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#666666', fontFamily: 'var(--font-mono)', fontWeight: '600' }}>
                  1.280+ Ulasan Terverifikasi
                </div>
              </div>
            </div>

            {/* Center: Thin Progress Bars Rating Distribution */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              minWidth: '220px',
              flex: '1',
              maxWidth: '380px'
            }}>
              {/* 5 Stars */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.72rem', color: '#666666', fontFamily: 'var(--font-mono)' }}>
                <span style={{ width: '24px' }}>5★</span>
                <div style={{ flex: 1, height: '5px', backgroundColor: '#ebeae6', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '96%', height: '100%', backgroundColor: '#b7d600', borderRadius: '3px' }} />
                </div>
                <span style={{ width: '32px', textAlign: 'right', color: '#080808', fontWeight: '700' }}>96%</span>
              </div>
              {/* 4 Stars */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.72rem', color: '#666666', fontFamily: 'var(--font-mono)' }}>
                <span style={{ width: '24px' }}>4★</span>
                <div style={{ flex: 1, height: '5px', backgroundColor: '#ebeae6', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '4%', height: '100%', backgroundColor: '#b7d600', borderRadius: '3px' }} />
                </div>
                <span style={{ width: '32px', textAlign: 'right', color: '#080808', fontWeight: '700' }}>4%</span>
              </div>
            </div>

            {/* Right: CTA Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                backgroundColor: '#b7d600',
                color: '#080808',
                fontWeight: '800',
                fontSize: '0.82rem',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                border: '1px solid #a1bd00',
                padding: '13px 26px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'transform 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease',
                boxShadow: '0 2px 10px rgba(183, 214, 0, 0.25)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#c8ea00';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#b7d600';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Plus size={16} strokeWidth={3} />
              Tulis Ulasan
            </button>
          </div>

          {/* 3. 3-Column Editorial Reviews Grid (Spacious & Breathable) */}
          {displayedReviews.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '24px',
              marginBottom: '32px'
            }}>
              {displayedReviews.map((item, idx) => {
                const isCenterFeatured = idx === 1;

                return (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: '#ffffff',
                      border: isCenterFeatured ? '1px solid #111111' : '1px solid #e5e5e5',
                      borderRadius: '6px',
                      padding: '36px 30px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                      transition: 'border-color 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease',
                      boxShadow: isCenterFeatured
                        ? '0 8px 24px rgba(8, 8, 8, 0.08)'
                        : '0 4px 16px rgba(8, 8, 8, 0.04)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#080808';
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 12px 28px rgba(8, 8, 8, 0.09)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = isCenterFeatured ? '#111111' : '#e5e5e5';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = isCenterFeatured
                        ? '0 8px 24px rgba(8, 8, 8, 0.08)'
                        : '0 4px 16px rgba(8, 8, 8, 0.04)';
                    }}
                  >
                    {/* Top accent bar for center featured card */}
                    {isCenterFeatured && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: '30px',
                        right: '30px',
                        height: '3px',
                        backgroundColor: '#b7d600',
                        borderRadius: '0 0 2px 2px'
                      }} />
                    )}

                    <div>
                      {/* Top Row: Stars & Verified Buyer */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '22px'
                      }}>
                        <div style={{ display: 'flex', gap: '3px' }}>
                          {[...Array(item.rating)].map((_, i) => (
                            <Star key={i} size={15} fill="#b7d600" color="#222222" />
                          ))}
                        </div>

                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '0.68rem',
                          fontFamily: 'var(--font-mono)',
                          backgroundColor: '#f1f5d8',
                          color: '#465600',
                          border: '1px solid #d7e69f',
                          padding: '3px 8px',
                          borderRadius: '3px',
                          fontWeight: '800',
                          letterSpacing: '0.04em'
                        }}>
                          <CheckCircle2 size={13} color="#465600" />
                          VERIFIED BUYER
                        </div>
                      </div>

                      {/* Review Photos — Shopee-style grid (web version) */}
                      {(() => {
                        // Collect all photos: prefer photos array, fallback to single photo/image
                        const allPhotos = Array.isArray(item.photos) && item.photos.length > 0
                          ? item.photos
                          : (item.photo || item.image ? [item.photo || item.image] : []);

                        if (allPhotos.length === 0) return null;

                        const count = allPhotos.length;

                        const wrapStyle = {
                          margin: '0 -30px 24px',
                          overflow: 'hidden',
                          borderTop: '1px solid #f0eee9',
                          borderBottom: '1px solid #f0eee9',
                        };

                        // 1 photo — full width
                        if (count === 1) {
                          return (
                            <div style={wrapStyle}>
                              <img
                                src={allPhotos[0]}
                                alt={`Foto ulasan ${item.product_name}`}
                                style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }}
                              />
                            </div>
                          );
                        }

                        // 2 photos — side by side equal columns
                        if (count === 2) {
                          return (
                            <div style={{ ...wrapStyle, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
                              {allPhotos.map((src, i) => (
                                <img key={i} src={src} alt={`Foto ulasan ${i + 1}`}
                                  style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }} />
                              ))}
                            </div>
                          );
                        }

                        // 3 photos — 1 big left + 2 stacked right
                        if (count === 3) {
                          return (
                            <div style={{ ...wrapStyle, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
                              <img src={allPhotos[0]} alt="Foto ulasan 1"
                                style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }} />
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <img src={allPhotos[1]} alt="Foto ulasan 2"
                                  style={{ width: '100%', height: '109px', objectFit: 'cover', display: 'block' }} />
                                <img src={allPhotos[2]} alt="Foto ulasan 3"
                                  style={{ width: '100%', height: '109px', objectFit: 'cover', display: 'block' }} />
                              </div>
                            </div>
                          );
                        }

                        // 4 photos — 2×2 grid
                        return (
                          <div style={{ ...wrapStyle, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
                            {allPhotos.slice(0, 4).map((src, i) => (
                              <img key={i} src={src} alt={`Foto ulasan ${i + 1}`}
                                style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }} />
                            ))}
                          </div>
                        );
                      })()}


                      {/* Customer Comment — Hero Element of the Card */}
                      <blockquote style={{
                        margin: '0 0 28px',
                        fontSize: '1.02rem',
                        lineHeight: '1.7',
                        color: '#1a1a1a',
                        fontWeight: '500',
                        letterSpacing: '-0.01em',
                        fontStyle: 'normal'
                      }}>
                        "{item.comment}"
                      </blockquote>
                    </div>

                    {/* Supporting Information Footer */}
                    <div style={{
                      borderTop: '1px solid #f0eee9',
                      paddingTop: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '14px'
                    }}>
                      {/* Left: Reviewer Name & Product Details */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: '#f1f5d8',
                          border: '1px solid #d7e69f',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          fontWeight: '800',
                          fontSize: '0.85rem',
                          color: '#465600'
                        }}>
                          {item.name ? item.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{
                            fontWeight: '800',
                            fontSize: '0.9rem',
                            color: '#080808',
                            letterSpacing: '-0.01em',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {item.name}
                          </div>
                          <div style={{
                            fontSize: '0.74rem',
                            color: '#666666',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            <Link
                              to={`/product/${item.product_slug}`}
                              style={{ color: '#666666', textDecoration: 'none', fontWeight: '500' }}
                              onMouseEnter={e => { e.currentTarget.style.color = '#080808'; }}
                              onMouseLeave={e => { e.currentTarget.style.color = '#666666'; }}
                            >
                              {item.product_name}
                            </Link>
                            {item.size ? ` • ${item.size}` : ''}
                          </div>
                        </div>
                      </div>

                      {/* Right: Date */}
                      <div style={{
                        fontSize: '0.72rem',
                        color: '#888888',
                        fontFamily: 'var(--font-mono)',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}>
                        {item.date}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '60px 24px',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px dashed #d5d3ce',
              marginBottom: '32px'
            }}>
              <MessageSquare size={38} color="#888888" style={{ margin: '0 auto 12px' }} />
              <h4 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: '800', color: '#080808' }}>
                Belum Ada Ulasan yang Disematkan di Beranda
              </h4>
              <p style={{ margin: 0, fontSize: '0.86rem', color: '#666666', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto', lineHeight: '1.6' }}>
                Admin dapat memilih hingga 3 ulasan pelanggan terbaik untuk ditampilkan pada bagian ini melalui menu <strong>Ulasan Pelanggan</strong> di Dashboard Admin.
              </p>
            </div>
          )}

          {/* Pagination Dots (if multi-page) */}
          {totalReviewPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              marginTop: '16px'
            }}>
              {[...Array(totalReviewPages)].map((_, pageIdx) => (
                <button
                  key={pageIdx}
                  onClick={() => setReviewPageIndex(pageIdx)}
                  aria-label={`Go to review page ${pageIdx + 1}`}
                  style={{
                    width: reviewPageIndex === pageIdx ? '28px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    backgroundColor: reviewPageIndex === pageIdx ? '#080808' : '#d5d3ce',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'all 0.25s ease'
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Modal Tulis Ulasan — Clean Light Architecture */}
        {isModalOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              maxWidth: '520px',
              width: '100%',
              padding: '36px',
              position: 'relative',
              boxShadow: '0 24px 60px rgba(0,0,0,0.18)'
            }}>
              <button
                onClick={() => setIsModalOpen(false)}
                aria-label="Tutup modal"
                style={{
                  position: 'absolute',
                  top: '22px',
                  right: '22px',
                  background: 'none',
                  border: 'none',
                  color: '#666666',
                  cursor: 'pointer'
                }}
              >
                <X size={20} />
              </button>

              <div style={{ marginBottom: '24px' }}>
                <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', backgroundColor: '#080808', color: '#b7d600', padding: '3px 8px', borderRadius: '2px', fontWeight: '700', letterSpacing: '0.1em' }}>
                  KIRIM ULASAN ANDA
                </span>
                <h3 style={{ fontSize: '1.45rem', fontWeight: '900', color: '#080808', margin: '10px 0 6px', letterSpacing: '-0.02em' }}>
                  Ulasan Sepatu Barokah
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#666666', margin: 0, lineHeight: '1.5' }}>
                  Bagikan impresi kenyamanan dan ketahanan sepatu Anda kepada pembeli lain.
                </p>
              </div>

              {formSuccess ? (
                <div style={{
                  padding: '28px',
                  backgroundColor: '#f1f5d8',
                  border: '1px solid #b7d600',
                  borderRadius: '4px',
                  textAlign: 'center',
                  color: '#080808'
                }}>
                  <Check size={32} color="#465600" style={{ margin: '0 auto 10px' }} />
                  <h4 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: '800' }}>Terima Kasih Banyak!</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#555555' }}>
                    Ulasan Anda telah berhasil dipublikasikan dan ditampilkan di halaman beranda.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '700', color: '#222222', marginBottom: '6px' }}>
                        NAMA LENGKAP *
                      </label>
                      <input
                        type="text"
                        required
                        value={newReview.name}
                        onChange={e => setNewReview({ ...newReview, name: e.target.value })}
                        placeholder="Contoh: Budi Santoso"
                        style={{
                          width: '100%',
                          padding: '11px 12px',
                          backgroundColor: '#fbf9f8',
                          border: '1px solid #d5d5d5',
                          borderRadius: '4px',
                          color: '#080808',
                          fontSize: '0.85rem',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '700', color: '#222222', marginBottom: '6px' }}>
                        KOTA / DOMISILI
                      </label>
                      <input
                        type="text"
                        value={newReview.city}
                        onChange={e => setNewReview({ ...newReview, city: e.target.value })}
                        placeholder="Contoh: Jakarta"
                        style={{
                          width: '100%',
                          padding: '11px 12px',
                          backgroundColor: '#fbf9f8',
                          border: '1px solid #d5d5d5',
                          borderRadius: '4px',
                          color: '#080808',
                          fontSize: '0.85rem',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '700', color: '#222222', marginBottom: '6px' }}>
                        PILIH SEPATU *
                      </label>
                      <select
                        value={newReview.product_name}
                        onChange={e => {
                          const val = e.target.value;
                          let cat = 'sneakers';
                          if (val.includes('Boots')) cat = 'boots';
                          if (val.includes('Oxford')) cat = 'formal';
                          if (val.includes('Runner')) cat = 'runner';
                          setNewReview({ ...newReview, product_name: val, category: cat });
                        }}
                        style={{
                          width: '100%',
                          padding: '11px 12px',
                          backgroundColor: '#fbf9f8',
                          border: '1px solid #d5d5d5',
                          borderRadius: '4px',
                          color: '#080808',
                          fontSize: '0.85rem',
                          outline: 'none'
                        }}
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '700', color: '#222222', marginBottom: '6px' }}>
                        UKURAN
                      </label>
                      <select
                        value={newReview.size}
                        onChange={e => setNewReview({ ...newReview, size: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '11px 12px',
                          backgroundColor: '#fbf9f8',
                          border: '1px solid #d5d5d5',
                          borderRadius: '4px',
                          color: '#080808',
                          fontSize: '0.85rem',
                          outline: 'none'
                        }}
                      >
                        {['EU 39', 'EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44'].map(sz => (
                          <option key={sz} value={sz}>{sz}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Rating Selector */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '700', color: '#222222', marginBottom: '6px' }}>
                      RATING BINTANG
                    </label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {[1, 2, 3, 4, 5].map(starVal => (
                        <button
                          key={starVal}
                          type="button"
                          onClick={() => setNewReview({ ...newReview, rating: starVal })}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px'
                          }}
                        >
                          <Star
                            size={22}
                            fill={starVal <= newReview.rating ? '#b7d600' : 'none'}
                            color={starVal <= newReview.rating ? '#222222' : '#cccccc'}
                          />
                        </button>
                      ))}
                      <span style={{ fontSize: '0.82rem', color: '#080808', fontWeight: '800', marginLeft: '6px' }}>
                        {newReview.rating} dari 5 Bintang
                      </span>
                    </div>
                  </div>

                  {/* Comment */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '700', color: '#222222', marginBottom: '6px' }}>
                      KOMENTAR ULASAN *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={newReview.comment}
                      onChange={e => setNewReview({ ...newReview, comment: e.target.value })}
                      placeholder="Ceritakan kenyamanan, keempukan insole, ukuran, atau kualitas bahan sepatu..."
                      style={{
                        width: '100%',
                        padding: '11px 12px',
                        backgroundColor: '#fbf9f8',
                        border: '1px solid #d5d5d5',
                        borderRadius: '4px',
                        color: '#080808',
                        fontSize: '0.85rem',
                        resize: 'vertical',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #cccccc',
                        color: '#444444',
                        padding: '10px 18px',
                        borderRadius: '4px',
                        fontSize: '0.82rem',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      style={{
                        backgroundColor: '#b7d600',
                        border: '1px solid #a1bd00',
                        color: '#080808',
                        padding: '10px 22px',
                        borderRadius: '4px',
                        fontSize: '0.82rem',
                        fontWeight: '800',
                        letterSpacing: '0.04em',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(183, 214, 0, 0.2)'
                      }}
                    >
                      Kirim Ulasan
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Pop-up Modal when BAROKAH10 is already used */}
      <VoucherUsedModal
        isOpen={showUsedModal}
        onClose={() => setShowUsedModal(false)}
        voucherCode="BAROKAH10"
        usedInfo={barokahUsageData}
      />
    </div>
  );
};
