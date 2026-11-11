import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { sampleProducts } from '../data/sampleProducts';
import { getProducts } from '../lib/productsApi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { formatIDR, getOrderStatusInfo } from '../lib/utils';
import { ProductCard } from '../components/ProductCard';
import { 
  Star, 
  ShoppingBag, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Plus, 
  Minus, 
  Zap, 
  Check,
  Heart,
  Ruler,
  Lock,
  BadgeCheck,
  PackageCheck,
  AlertCircle,
  Camera,
  Upload,
  X,
  Image as ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useWishlist } from '../context/WishlistContext';
import { SizeGuideModal } from '../components/SizeGuideModal';
import { getProductReviews, submitReview } from '../lib/reviewsApi';

export const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [allProducts, setAllProducts] = useState(sampleProducts);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);

  useEffect(() => {
    getProducts().then(data => {
      if (data && data.length > 0) {
        setAllProducts(data);
      }
      setIsLoadingProduct(false);
    }).catch(() => setIsLoadingProduct(false));

    const handleStockRefresh = () => {
      getProducts().then(data => setAllProducts(data || []));
    };
    window.addEventListener('barokah:stock_updated', handleStockRefresh);
    window.addEventListener('barokah:products_updated', handleStockRefresh);
    return () => {
      window.removeEventListener('barokah:stock_updated', handleStockRefresh);
      window.removeEventListener('barokah:products_updated', handleStockRefresh);
    };
  }, []);

  // Slug alias dictionary for backward compatibility with sample slugs and display cards
  const SLUG_ALIASES = {
    'barokah-air-legacy-pro': 'barokah-runner-pro-x',
    'timber-nomad-tactical-boots': 'summit-trail-hiker',
    'royal-oxford-formal-classic': 'urban-classic-leather',
    'speedstride-ultra-running': 'barokah-runner-pro-x',
    'comfort-walk-slip-on': 'lady-comfort-slip-on'
  };

  const targetSlug = (slug && SLUG_ALIASES[slug.toLowerCase()]) || slug;
  
  // Find product in DB list, or fall back to sampleProducts
  const product = allProducts.find(p => 
    (p.slug && (p.slug.toLowerCase() === targetSlug?.toLowerCase() || p.slug.toLowerCase() === slug?.toLowerCase())) || 
    String(p.id) === String(slug) || 
    String(p.id) === String(targetSlug)
  ) || sampleProducts.find(p => 
    (p.slug && (p.slug.toLowerCase() === targetSlug?.toLowerCase() || p.slug.toLowerCase() === slug?.toLowerCase())) || 
    String(p.id) === String(slug)
  );

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(
    product && product.variants && product.variants.length > 0 ? product.variants[0] : null
  );
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('desc');
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  // Scroll to top and reset selection on slug change
  useEffect(() => {
    window.scrollTo(0, 0);
    setActiveImageIndex(0);
    setQuantity(1);
  }, [slug]);

  // Keep selected variant in sync when product or its variants update
  useEffect(() => {
    if (product && product.variants && product.variants.length > 0) {
      setSelectedVariant(prev => {
        if (!prev) return product.variants[0];
        const match = product.variants.find(v => v.id === prev.id || v.size === prev.size);
        return match || product.variants[0];
      });
    } else {
      setSelectedVariant(null);
    }
  }, [product?.id]);

  const { user, profile } = useAuth();

  // Review eligibility: 'checking' | 'eligible' | 'in_delivery' | 'not_purchased' | 'not_logged_in'
  const [eligibilityStatus, setEligibilityStatus] = useState('checking');
  const [matchingOrder, setMatchingOrder] = useState(null);

  const [reviews, setReviews] = useState(() => {
    try {
      const saved = localStorage.getItem(`barokah_reviews_${slug}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 1,
        name: 'Rian Pratama',
        rating: 5,
        date: '10 Feb 2026',
        comment: 'Material sol sangat stabil dan bantalan empuk. Finishing jahitan presisi standar kolektor.',
        isVerified: true
      },
      {
        id: 2,
        name: 'Dimas Kurniawan',
        rating: 5,
        date: '28 Jan 2026',
        comment: 'Kualitas kulitnya luar biasa bagus. Kotak double box tiba mulus tanpa penyok.',
        isVerified: true
      }
    ];
  });

  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [reviewPhotoPreview, setReviewPhotoPreview] = useState('');
  const [zoomReviewImage, setZoomReviewImage] = useState(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Load reviews from DB or cache
  useEffect(() => {
    if (slug) {
      getProductReviews(slug).then(data => {
        if (data && data.length > 0) {
          setReviews(data);
        }
      });
    }
  }, [slug]);

  // Sync reviews when updated globally
  useEffect(() => {
    const handleReviewAdded = () => {
      if (slug) {
        getProductReviews(slug).then(data => {
          if (data && data.length > 0) {
            setReviews(data);
          }
        });
      }
    };
    window.addEventListener('barokah:review_added', handleReviewAdded);
    return () => window.removeEventListener('barokah:review_added', handleReviewAdded);
  }, [slug]);

  // Sync reviewer name with user profile
  useEffect(() => {
    if (profile?.full_name) {
      setNewReviewName(profile.full_name);
    } else if (profile?.name) {
      setNewReviewName(profile.name);
    } else if (user?.email) {
      setNewReviewName(user.email.split('@')[0]);
    }
  }, [profile, user]);

  // Check purchase eligibility for reviews:
  // User can ONLY review if they have purchased this product AND order is 'selesai' (arrived at destination)
  useEffect(() => {
    const checkReviewEligibility = async () => {
      if (!user) {
        setEligibilityStatus('not_logged_in');
        setMatchingOrder(null);
        return;
      }

      setEligibilityStatus('checking');

      try {
        let userOrders = [];

        // 1. Fetch orders from Supabase for this authenticated user
        if (isSupabaseConfigured && user.id && !user.id.startsWith('demo-') && !user.id.startsWith('mock-')) {
          const { data, error } = await supabase
            .from('orders')
            .select('id, order_number, order_status, created_at, order_items(*)')
            .eq('user_id', user.id);

          if (!error && data) {
            userOrders = data;
          }
        }

        // 2. Fetch local orders as fallback or supplement
        const localOrders = JSON.parse(localStorage.getItem('barokah_orders') || '[]');
        const matchedLocal = localOrders.filter(o => 
          o.user_id === user.id || 
          (user.email && o.customer_email === user.email)
        );

        const allOrders = [...userOrders, ...matchedLocal];

        // Find orders containing this product (by name or variant/product ID)
        const prodName = (product?.name || '').toLowerCase().trim();
        const prodId = product?.id ? String(product.id) : null;
        const variantIds = new Set((product?.variants || []).map(v => String(v.id)));

        const matchingOrders = allOrders.filter(ord => {
          const items = ord.order_items || ord.items || [];
          return items.some(it => {
            const itName = (it.product_name || it.name || '').toLowerCase().trim();
            const itVariantId = it.product_variant_id ? String(it.product_variant_id) : null;
            const itProdId = it.product_id ? String(it.product_id) : null;

            const nameMatches = prodName && itName && (itName === prodName || itName.includes(prodName) || prodName.includes(itName));
            const idMatches = (prodId && itProdId && prodId === itProdId) || (itVariantId && variantIds.has(itVariantId));

            return nameMatches || idMatches;
          });
        });

        if (matchingOrders.length === 0) {
          setEligibilityStatus('not_purchased');
          setMatchingOrder(null);
          return;
        }

        // Check if ANY matching order is completed ('selesai')
        const completedOrder = matchingOrders.find(ord => {
          const st = (ord.order_status || ord.status || '').toLowerCase();
          return st === 'selesai' || st === 'completed';
        });

        if (completedOrder) {
          setEligibilityStatus('eligible');
          setMatchingOrder(completedOrder);
        } else {
          // User ordered, but parcel is still being processed or in transit
          setEligibilityStatus('in_delivery');
          setMatchingOrder(matchingOrders[0]);
        }
      } catch (err) {
        console.warn('Error checking review eligibility:', err);
        setEligibilityStatus('not_purchased');
      }
    };

    if (product) {
      checkReviewEligibility();
    }
  }, [user, product?.id, product?.name]);

  const discountPercent = product?.discount_price 
    ? Math.round((((product.price || 0) - product.discount_price) / (product.price || 1)) * 100) 
    : 0;

  const currentPrice = product ? (product.discount_price || product.price || 0) : 0;

  const handleAddToCart = () => {
    if (!selectedVariant) {
      toast.error('Silakan pilih ukuran sepatu!');
      return;
    }
    addToCart(product, selectedVariant, quantity);
  };

  const handleBuyNow = () => {
    if (!selectedVariant) {
      toast.error('Silakan pilih ukuran sepatu!');
      return;
    }
    const added = addToCart(product, selectedVariant, quantity);
    if (added) {
      navigate('/checkout');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();

    if (eligibilityStatus !== 'eligible') {
      toast.error('Ulasan hanya dapat dikirim oleh pembeli yang pesanan sepatunya sudah tiba dan berstatus selesai!');
      return;
    }

    if (!newReviewComment.trim()) {
      toast.error('Harap tuliskan ulasan pengalaman Anda!');
      return;
    }

    setIsSubmittingReview(true);
    const reviewerName = newReviewName.trim() || profile?.full_name || profile?.name || user?.email?.split('@')[0] || 'Pembeli Terverifikasi';

    try {
      const savedReview = await submitReview({
        orderId: matchingOrder?.id || null,
        orderNumber: matchingOrder?.order_number || null,
        userId: user?.id || null,
        userName: reviewerName,
        userCity: profile?.city || 'Indonesia',
        productId: product?.id || null,
        productName: product?.name || 'Sepatu Barokah',
        productSlug: slug,
        productImage: product?.images?.[0] || null,
        size: selectedVariant?.size || null,
        rating: newReviewRating,
        comment: newReviewComment.trim(),
        photoUrl: reviewPhotoPreview || null,
        featuredOnHome: false
      });

      const updated = [savedReview, ...reviews];
      setReviews(updated);

      setNewReviewComment('');
      setReviewPhotoPreview('');
      toast.success('Ulasan terverifikasi berhasil disimpan dan terkirim ke Admin! Terima kasih atas feedback Anda.');
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengirim ulasan');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoadingProduct) {
    return (
      <div style={{ padding: '100px 0', textAlign: 'center', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="container">
          <div style={{ display: 'inline-block', width: '38px', height: '38px', border: '3px solid #e5e5e5', borderTopColor: '#080808', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ marginTop: '16px', color: '#666666', fontSize: '0.85rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>MEMUAT DATA PRODUK...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ padding: '100px 0', textAlign: 'center', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="container">
          <div style={{
            maxWidth: '520px',
            margin: '0 auto',
            backgroundColor: '#ffffff',
            padding: '48px 36px',
            borderRadius: '6px',
            border: '1px solid #e5e5e5',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
          }}>
            <AlertCircle size={48} color="#ba1a1a" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '1.6rem', fontWeight: '900', marginBottom: '10px', textTransform: 'uppercase' }}>
              Produk Tidak Ditemukan
            </h2>
            <p style={{ color: '#666666', fontSize: '0.92rem', marginBottom: '24px', lineHeight: '1.6' }}>
              Produk yang Anda cari tidak tersedia di katalog toko atau tautan sudah kadaluarsa.
            </p>
            <Link to="/shop" className="btn btn-primary" style={{ padding: '12px 28px', fontWeight: '800' }}>
              KEMBALI KE KATALOG PRODUK
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const relatedProducts = (allProducts.length > 0 ? allProducts : sampleProducts)
    .filter(p => p.id !== product.id && p.category_id === product.category_id)
    .slice(0, 3);

  return (
    <div style={{ padding: '30px 0 80px' }}>
      <div className="container">
        
        {/* Monospaced Breadcrumb */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#666666', marginBottom: '24px', textTransform: 'uppercase' }}>
          <Link to="/">BERANDA</Link>
          <span>/</span>
          <Link to="/shop">KATALOG</Link>
          <span>/</span>
          <Link to={`/shop?category=${product.category_id}`}>{product.category_name}</Link>
          <span>/</span>
          <span style={{ color: '#080808', fontWeight: '700' }}>{product.name}</span>
        </nav>

        {/* Product Showcase Card */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '48px',
          backgroundColor: '#ffffff',
          borderRadius: '4px',
          padding: '36px',
          border: '1px solid #e5e5e5',
          marginBottom: '48px'
        }}>
          
          {/* Left: Product Image Stage */}
          <div>
            <div style={{
              width: '100%',
              borderRadius: '4px',
              overflow: 'hidden',
              backgroundColor: '#f4f4f4',
              marginBottom: '14px',
              border: '1px solid #e5e5e5',
              position: 'relative'
            }}>
              <img 
                src={product.images?.[activeImageIndex] || product.images?.[0]} 
                alt={product.name} 
                style={{ width: '100%', height: '460px', objectFit: 'cover' }}
              />

              {/* Wishlist Heart Button */}
              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                aria-label={isInWishlist(product.id) ? "Hapus dari favorit" : "Tambah ke favorit"}
                title={isInWishlist(product.id) ? "Hapus dari favorit" : "Tambah ke favorit"}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid rgba(0,0,0,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 10,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  transition: 'transform 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <Heart
                  size={20}
                  color={isInWishlist(product.id) ? '#e11d48' : '#080808'}
                  fill={isInWishlist(product.id) ? '#e11d48' : 'none'}
                />
              </button>

              {discountPercent > 0 && (
                <span className="badge badge-citron" style={{ position: 'absolute', top: '16px', left: '16px', fontSize: '0.75rem' }}>
                  -{discountPercent}% OFF
                </span>
              )}
            </div>

            {/* Thumbnail switcher */}
            {product.images && product.images.length > 1 && (
              <div style={{ display: 'flex', gap: '10px' }}>
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: '2px',
                      overflow: 'hidden',
                      border: activeImageIndex === idx ? '2px solid #080808' : '1px solid #e5e5e5',
                      opacity: activeImageIndex === idx ? 1 : 0.6,
                      backgroundColor: '#f4f4f4',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Technical Details & Purchase */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {product.category_name} • SKU: {product.sku}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#080808' }}>
                <Star size={14} fill="#080808" color="#080808" />
                <span>{product.rating || '4.9'}</span>
                <span style={{ color: '#888888' }}>({reviews.length} REVIEWS)</span>
              </div>
            </div>

            <h1 style={{ fontSize: '2.2rem', fontWeight: '900', color: '#080808', marginBottom: '16px', lineHeight: '1.2', textTransform: 'uppercase' }}>
              {product.name}
            </h1>

            {/* Stitch High-Contrast Price Box */}
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '14px',
              padding: '16px 20px',
              backgroundColor: '#f4f4f4',
              borderRadius: '2px',
              marginBottom: '24px',
              border: '1px solid #e5e5e5'
            }}>
              <span style={{ fontSize: '2rem', fontWeight: '900', color: '#080808', fontFamily: 'var(--font-mono)' }}>
                {formatIDR(currentPrice)}
              </span>
              {product.discount_price && (
                <span style={{ fontSize: '1.1rem', color: '#888888', textDecoration: 'line-through', fontFamily: 'var(--font-mono)' }}>
                  {formatIDR(product.price)}
                </span>
              )}
              {discountPercent > 0 && (
                <span className="badge badge-citron" style={{ marginLeft: 'auto' }}>
                  SAVE {formatIDR(product.price - product.discount_price)}
                </span>
              )}
            </div>

            {/* Sizing Chips (Stitch 44px x 44px Modular Boxes) */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>
                  PILIH UKURAN (EU SIZE):
                </label>
                <button
                  type="button"
                  onClick={() => setIsSizeGuideOpen(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                    color: '#080808',
                    fontWeight: '800',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Buka Panduan Ukuran Sepatu"
                >
                  <Ruler size={13} /> SIZE GUIDE
                </button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {product.variants?.map(v => {
                  const isSelected = selectedVariant?.id === v.id;
                  const isOutOfStock = v.stock <= 0;

                  return (
                    <button
                      key={v.id}
                      disabled={isOutOfStock}
                      onClick={() => setSelectedVariant(v)}
                      style={{
                        minWidth: '48px',
                        height: '48px',
                        padding: '0 12px',
                        borderRadius: '2px',
                        border: isSelected ? '2px solid #080808' : '1px solid #e5e5e5',
                        backgroundColor: isSelected ? '#080808' : isOutOfStock ? '#f1f1f1' : '#ffffff',
                        color: isSelected ? '#ffffff' : isOutOfStock ? '#aaaaaa' : '#080808',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: '700',
                        fontSize: '0.9rem',
                        cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <span>{v.size}</span>
                      {isSelected && (
                        <span style={{ fontSize: '0.6rem', color: '#b7d600' }}>
                          STOK {v.stock}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Selector */}
            <div style={{ marginBottom: '28px' }}>
              <label className="form-label">JUMLAH:</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #080808', borderRadius: '2px', overflow: 'hidden' }}>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{ padding: '10px 14px', backgroundColor: '#ffffff', color: '#080808' }}
                  >
                    <Minus size={14} />
                  </button>
                  <span style={{ padding: '0 16px', fontSize: '0.95rem', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    style={{ padding: '10px 14px', backgroundColor: '#ffffff', color: '#080808' }}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: '#666666' }}>
                  {selectedVariant ? `TERSEDIA: ${selectedVariant.stock} PASANG` : 'PILIH UKURAN'}
                </span>
              </div>
            </div>

            {/* Stitch Button CTAs */}
            <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', marginBottom: '24px' }}>
              <button
                onClick={handleAddToCart}
                className="btn btn-outline btn-lg"
                style={{ flex: 1 }}
              >
                <ShoppingBag size={18} /> + KERANJANG
              </button>

              <button
                onClick={handleBuyNow}
                className="btn btn-accent btn-lg"
                style={{ flex: 1 }}
              >
                BELI SEKARANG
              </button>

              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                aria-label={isInWishlist(product.id) ? "Hapus dari favorit" : "Tambah ke favorit"}
                title={isInWishlist(product.id) ? "Hapus dari favorit" : "Tambah ke favorit"}
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '4px',
                  border: '1px solid #080808',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s ease'
                }}
              >
                <Heart
                  size={20}
                  color={isInWishlist(product.id) ? '#e11d48' : '#080808'}
                  fill={isInWishlist(product.id) ? '#e11d48' : 'none'}
                />
              </button>
            </div>

            {/* Guarantee marks */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              paddingTop: '20px',
              borderTop: '1px solid #e5e5e5',
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              color: '#666666'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} color="#080808" /> 100% ORIGINAL
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Truck size={16} color="#080808" /> FAST SHIPPING
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RotateCcw size={16} color="#080808" /> 7 DAYS RETURN
              </div>
            </div>

          </div>
        </div>

        {/* Tabbed Specs & Editorial Lookbook */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '4px',
          padding: '36px',
          border: '1px solid #e5e5e5',
          marginBottom: '60px'
        }}>
          {/* Tab Navigation */}
          <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid #e5e5e5', paddingBottom: '12px', marginBottom: '24px' }}>
            <button
              onClick={() => setActiveTab('desc')}
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '0.9rem',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: activeTab === 'desc' ? '#080808' : '#888888',
                borderBottom: activeTab === 'desc' ? '2px solid #080808' : 'none',
                paddingBottom: '11px',
                marginBottom: '-13px'
              }}
            >
              DESKRIPSI PRODUK
            </button>
            <button
              onClick={() => setActiveTab('specs')}
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '0.9rem',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: activeTab === 'specs' ? '#080808' : '#888888',
                borderBottom: activeTab === 'specs' ? '2px solid #080808' : 'none',
                paddingBottom: '11px',
                marginBottom: '-13px'
              }}
            >
              SPESIFIKASI & MATERIAL
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '0.9rem',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: activeTab === 'reviews' ? '#080808' : '#888888',
                borderBottom: activeTab === 'reviews' ? '2px solid #080808' : 'none',
                paddingBottom: '11px',
                marginBottom: '-13px'
              }}
            >
              ULASAN ({reviews.length})
            </button>
          </div>

          {activeTab === 'desc' && (
            <div style={{ lineHeight: '1.7', color: '#333333' }}>
              <p style={{ marginBottom: '16px', fontSize: '1rem' }}>
                {product.description}
              </p>
              <p style={{ fontSize: '0.9rem', color: '#666666' }}>
                Didesain khusus untuk para kolektor dan penikmat gaya hidup streetwear kontemporer. Menggunakan material pilihan dengan konstruksi sol berdaya cengkeram tinggi serta bantalan ortopedi yang mendukung mobilitas seharian penuh.
              </p>
            </div>
          )}

          {activeTab === 'specs' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '16px', borderRadius: '2px', backgroundColor: '#f4f4f4', border: '1px solid #e5e5e5' }}>
                <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#666666', textTransform: 'uppercase' }}>UPPER CONSTRUCTION</div>
                <div style={{ fontWeight: '700', fontSize: '0.9rem', marginTop: '2px' }}>Microfiber Leather & Breathable Mesh</div>
              </div>
              <div style={{ padding: '16px', borderRadius: '2px', backgroundColor: '#f4f4f4', border: '1px solid #e5e5e5' }}>
                <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#666666', textTransform: 'uppercase' }}>OUTSOLE TREAD</div>
                <div style={{ fontWeight: '700', fontSize: '0.9rem', marginTop: '2px' }}>Thermo-Rubber Anti Slip Grip</div>
              </div>
              <div style={{ padding: '16px', borderRadius: '2px', backgroundColor: '#f4f4f4', border: '1px solid #e5e5e5' }}>
                <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#666666', textTransform: 'uppercase' }}>INSOLE FOOTBED</div>
                <div style={{ fontWeight: '700', fontSize: '0.9rem', marginTop: '2px' }}>Memory Cushioning Foam 6mm</div>
              </div>
              <div style={{ padding: '16px', borderRadius: '2px', backgroundColor: '#f4f4f4', border: '1px solid #e5e5e5' }}>
                <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#666666', textTransform: 'uppercase' }}>NET WEIGHT</div>
                <div style={{ fontWeight: '700', fontSize: '0.9rem', marginTop: '2px' }}>{product.weight_grams} Grams (Include Box)</div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              {/* Existing Reviews List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '36px' }}>
                {reviews.map(rev => (
                  <div key={rev.id} style={{ padding: '20px', borderRadius: '4px', backgroundColor: '#ffffff', border: '1px solid #e5e5e5' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: '800', fontSize: '0.92rem', color: '#080808' }}>{rev.name}</span>
                          {(rev.isVerified || rev.orderNumber) && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              backgroundColor: '#ecfdf5',
                              color: '#047857',
                              border: '1px solid #a7f3d0',
                              padding: '2px 8px',
                              borderRadius: '2px',
                              fontSize: '0.68rem',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: '700'
                            }}>
                              <BadgeCheck size={12} color="#047857" /> PEMBELI TERVERIFIKASI
                            </span>
                          )}
                        </div>
                        {rev.orderNumber && (
                          <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#666666', marginTop: '2px' }}>
                            Ref Order #{rev.orderNumber}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#888888' }}>{rev.date}</div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '3px', marginBottom: '10px' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={14} 
                          fill={i < rev.rating ? "#080808" : "none"} 
                          color={i < rev.rating ? "#080808" : "#d4d4d4"} 
                        />
                      ))}
                    </div>
                    
                    <p style={{ fontSize: '0.88rem', color: '#333333', lineHeight: '1.6', margin: 0 }}>{rev.comment}</p>

                    {/* Review Photos — Shopee-style grid (web version) */}
                    {(() => {
                      const allPhotos = Array.isArray(rev.photos) && rev.photos.length > 0
                        ? rev.photos
                        : (rev.photo || rev.image ? [rev.photo || rev.image] : []);

                      if (allPhotos.length === 0) return null;

                      const count = allPhotos.length;
                      const baseImgStyle = { objectFit: 'cover', display: 'block', cursor: 'pointer', borderRadius: '6px', border: '1.5px solid #e5e5e5' };

                      return (
                        <div style={{ marginTop: '12px' }}>
                          <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#888', marginBottom: '8px' }}>
                            FOTO DARI PEMBELI ({count} foto):
                          </div>

                          {/* 1 photo */}
                          {count === 1 && (
                            <img src={allPhotos[0]} alt="Foto ulasan 1"
                              style={{ ...baseImgStyle, width: '160px', height: '160px' }}
                              onClick={() => setZoomReviewImage(allPhotos[0])}
                              title="Klik untuk memperbesar" />
                          )}

                          {/* 2 photos — side by side */}
                          {count === 2 && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', maxWidth: '280px' }}>
                              {allPhotos.map((src, i) => (
                                <img key={i} src={src} alt={`Foto ulasan ${i + 1}`}
                                  style={{ ...baseImgStyle, width: '100%', height: '130px' }}
                                  onClick={() => setZoomReviewImage(src)}
                                  title="Klik untuk memperbesar" />
                              ))}
                            </div>
                          )}

                          {/* 3 photos — 1 big left + 2 stacked right */}
                          {count === 3 && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', maxWidth: '280px' }}>
                              <img src={allPhotos[0]} alt="Foto ulasan 1"
                                style={{ ...baseImgStyle, width: '100%', height: '200px' }}
                                onClick={() => setZoomReviewImage(allPhotos[0])} title="Klik untuk memperbesar" />
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {[1, 2].map((i) => (
                                  <img key={i} src={allPhotos[i]} alt={`Foto ulasan ${i + 1}`}
                                    style={{ ...baseImgStyle, width: '100%', height: '96px' }}
                                    onClick={() => setZoomReviewImage(allPhotos[i])} title="Klik untuk memperbesar" />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 4 photos — 2×2 grid */}
                          {count >= 4 && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', maxWidth: '280px' }}>
                              {allPhotos.slice(0, 4).map((src, i) => (
                                <img key={i} src={src} alt={`Foto ulasan ${i + 1}`}
                                  style={{ ...baseImgStyle, width: '100%', height: '130px' }}
                                  onClick={() => setZoomReviewImage(src)} title="Klik untuk memperbesar" />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                  </div>
                ))}
              </div>

              {/* Gated Review Submission Section */}
              {eligibilityStatus === 'checking' && (
                <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#64748b' }}>
                  ⏳ Memeriksa riwayat pesanan dan status pengiriman produk Anda...
                </div>
              )}

              {/* STATE 1: User Not Logged In */}
              {eligibilityStatus === 'not_logged_in' && (
                <div style={{
                  padding: '28px',
                  borderRadius: '4px',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #080808',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '2px', backgroundColor: '#080808', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Lock size={18} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: '900', textTransform: 'uppercase', margin: 0 }}>
                        ULASAN EKSKLUSIF PEMBELI TERVERIFIKASI
                      </h4>
                      <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#666666' }}>
                        VERIFIED TRANSACTION REQUIRED • BAROKAH AUTHENTICITY
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: '#444444', lineHeight: '1.6', margin: 0 }}>
                    Untuk menjaga keaslian dan integritas ulasan siluet sepatu di Toko Barokah Shoes, <strong>hanya pelanggan yang telah membeli produk ini dan barang telah sampai di rumah</strong> yang dapat menulis ulasan.
                  </p>

                  <div style={{ paddingTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => navigate('/checkout')}
                      className="btn btn-dark btn-sm"
                      style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase', padding: '10px 20px' }}
                    >
                      MASUK KE AKUN ANDA UNTUK CEK STATUS
                    </button>
                  </div>
                </div>
              )}

              {/* STATE 2: User Logged In But Never Purchased This Product */}
              {eligibilityStatus === 'not_purchased' && (
                <div style={{
                  padding: '28px',
                  borderRadius: '4px',
                  backgroundColor: '#fbf9f8',
                  border: '1px solid #e5e5e5',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '2px', backgroundColor: '#f3f0eb', color: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: '900', textTransform: 'uppercase', margin: 0 }}>
                        ANDA BELUM MEMILIKI TRANSAKSI UNTUK SILUET INI
                      </h4>
                      <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#666666' }}>
                        BELUM ADA PESANAN TERSELESAIKAN UNTUK {product.name.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: '#555555', lineHeight: '1.6', margin: 0 }}>
                    Fitur ulasan hanya terbuka untuk pembeli terverifikasi yang sepatunya telah tiba dan status transaksi diselesaikan. Pesan siluet ini sekarang untuk mencoba kenyamanannya dan bagikan ulasan Anda.
                  </p>

                  <div style={{ paddingTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        window.scrollTo({ top: 380, behavior: 'smooth' });
                      }}
                      className="btn btn-primary btn-sm"
                      style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase', padding: '10px 20px' }}
                    >
                      PESAN SEPATU INI SEKARANG
                    </button>
                  </div>
                </div>
              )}

              {/* STATE 3: User Has Purchased But Order Is Still Being Processed / Shipped (Barang Belum Sampai) */}
              {eligibilityStatus === 'in_delivery' && (
                <div style={{
                  padding: '28px',
                  borderRadius: '4px',
                  backgroundColor: '#fffbeb',
                  border: '1.5px solid #fde68a',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '2px', backgroundColor: '#b45309', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Truck size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: '900', textTransform: 'uppercase', margin: 0, color: '#92400e' }}>
                        PESANAN ANDA SEDANG DALAM PROSES / PENGIRIMAN
                      </h4>
                      <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#b45309', fontWeight: '700' }}>
                        NO. PESANAN #{matchingOrder?.order_number} • STATUS: {getOrderStatusInfo(matchingOrder?.order_status || matchingOrder?.status).label.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: '#78350f', lineHeight: '1.6', margin: 0 }}>
                    Sepatu Anda sedang diproses oleh kurir / toko Barokah. <strong>Formulir ulasan akan otomatis aktif setelah barang telah sampai di rumah Anda</strong> dan status pesanan diperbarui menjadi <strong>SELESAI</strong>.
                  </p>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', paddingTop: '4px' }}>
                    <Link
                      to={`/order/${matchingOrder?.order_number}`}
                      className="btn btn-dark btn-sm"
                      style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase', fontSize: '0.75rem', padding: '8px 16px' }}
                    >
                      LACAK STATUS PESANAN #{matchingOrder?.order_number}
                    </Link>
                  </div>
                </div>
              )}

              {/* STATE 4: User Has Purchased AND Order Is 'SELESAI' (Barang Sudah Sampai di Rumah) */}
              {eligibilityStatus === 'eligible' && (
                <div style={{ padding: '28px', borderRadius: '4px', backgroundColor: '#ffffff', border: '2px solid #059669', boxShadow: '0 4px 14px rgba(5, 150, 105, 0.08)' }}>
                  
                  {/* Verified Buyer Header Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', marginBottom: '20px', borderBottom: '1px solid #e5e5e5' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '2px', backgroundColor: '#059669', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <PackageCheck size={20} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: '900', textTransform: 'uppercase', margin: 0, color: '#047857' }}>
                          TULIS ULASAN TERVERIFIKASI
                        </h4>
                        <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#059669', fontWeight: '700' }}>
                          ✓ BARANG TELAH SAMPAI • PESANAN #{matchingOrder?.order_number} SELESAI
                        </div>
                      </div>
                    </div>
                    <span style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', fontWeight: '800', padding: '3px 8px', borderRadius: '2px' }}>
                      VERIFIED BUYER
                    </span>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: '#555555', marginBottom: '20px' }}>
                    Terima kasih telah berbelanja di Barokah Shoes! Karena pesanan Anda telah tiba di tujuan, silakan bagikan penilaian jujur mengenai kenyamanan, ukuran, dan kualitas material sepatu ini.
                  </p>

                  <form onSubmit={handleReviewSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <label className="form-label">NAMA REVIEWER</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={newReviewName}
                          onChange={(e) => setNewReviewName(e.target.value)}
                          placeholder="Nama Anda"
                          required
                        />
                      </div>

                      <div>
                        <label className="form-label">RATING KUALITAS SEPATU</label>
                        <select 
                          className="form-select"
                          value={newReviewRating}
                          onChange={(e) => setNewReviewRating(Number(e.target.value))}
                        >
                          <option value={5}>⭐⭐⭐⭐⭐ (5 / 5) - SANGAT PUAS</option>
                          <option value={4}>⭐⭐⭐⭐ (4 / 5) - PUAS &amp; NYAMAN</option>
                          <option value={3}>⭐⭐⭐ (3 / 5) - CUKUP</option>
                          <option value={2}>⭐⭐ (2 / 5) - KURANG PAS</option>
                          <option value={1}>⭐ (1 / 5) - KECEWA</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label className="form-label">ULASAN &amp; PENGALAMAN PEMAKAIAN *</label>
                      <textarea 
                        className="form-textarea" 
                        rows={4} 
                        value={newReviewComment}
                        onChange={(e) => setNewReviewComment(e.target.value)}
                        placeholder="Ceritakan bagaimana kenyamanan sol, kecocokan ukuran (true to size), dan ketahanan material kulit/kanvas saat dipakai sehari-hari..."
                        required
                      />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Camera size={14} /> FOTO SEPATU (OPSIONAL)
                      </label>
                      {reviewPhotoPreview ? (
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <img
                            src={reviewPhotoPreview}
                            alt="Preview ulasan"
                            style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '6px', border: '2px solid #080808' }}
                          />
                          <button
                            type="button"
                            onClick={() => setReviewPhotoPreview('')}
                            style={{
                              position: 'absolute', top: '-6px', right: '-6px',
                              backgroundColor: '#ef4444', color: '#fff', border: 'none',
                              borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '4px', border: '1px dashed #bbb', backgroundColor: '#fafafa', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700' }}>
                          <Upload size={14} /> Unggah Foto Pemakaian
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => setReviewPhotoPreview(ev.target.result);
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#666666' }}>
                        🔒 Ulasan Anda akan ditandai dengan badge resmi <strong>"Pembeli Terverifikasi"</strong>
                      </span>
                      <button 
                        type="submit" 
                        disabled={isSubmittingReview}
                        className="btn btn-accent btn-md"
                        style={{ padding: '12px 24px', fontWeight: '800', fontFamily: 'var(--font-heading)', textTransform: 'uppercase' }}
                      >
                        {isSubmittingReview ? 'MENERBITKAN...' : 'KIRIM ULASAN TERVERIFIKASI'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Related Drops */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '900', marginBottom: '24px', textTransform: 'uppercase' }}>
              SILHOUETTES TERKAIT
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '20px'
            }}>
              {relatedProducts.map(rel => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </div>
        )}

        {/* Interactive Size Guide Modal */}
        <SizeGuideModal
          isOpen={isSizeGuideOpen}
          onClose={() => setIsSizeGuideOpen(false)}
          productName={product.name}
          productCategory={product.category_id}
          selectedSize={selectedVariant?.size}
          onSelectSize={(newSize) => {
            const match = product.variants?.find(v => Number(v.size) === Number(newSize));
            if (match) {
              setSelectedVariant(match);
              toast.success(`Ukuran EU ${newSize} dipilih!`);
            }
          }}
        />

        {/* Review Photo Zoom Modal */}
        {zoomReviewImage && (
          <div
            onClick={() => setZoomReviewImage(null)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              backgroundColor: 'rgba(0, 0, 0, 0.88)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'zoom-out',
              padding: '20px'
            }}
          >
            <img
              src={zoomReviewImage}
              alt="Foto Ulasan Pembeli Zoom"
              style={{
                maxWidth: '92vw',
                maxHeight: '92vh',
                borderRadius: '8px',
                objectFit: 'contain',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
              }}
            />
            <button
              onClick={() => setZoomReviewImage(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                backgroundColor: '#ffffff',
                color: '#080808',
                border: 'none',
                borderRadius: '50%',
                width: '38px',
                height: '38px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
