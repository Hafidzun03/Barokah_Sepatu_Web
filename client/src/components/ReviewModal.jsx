import React, { useState, useEffect, useRef } from 'react';
import { Star, X, Upload, Camera, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getProducts } from '../lib/productsApi';
import { submitReview } from '../lib/reviewsApi';

// ─────────────────────────────────────────────────────────────────────────────
// ReviewPhotoGrid — Shopee-style photo preview (1 / 2 / 3 / 4 photos)
// ─────────────────────────────────────────────────────────────────────────────
const ReviewPhotoGrid = ({ previews, onRemove }) => {
  const count = previews.length;

  const RemoveBtn = ({ index }) => (
    <button
      type="button"
      onClick={() => onRemove(index)}
      style={{
        position: 'absolute',
        top: '4px',
        right: '4px',
        backgroundColor: 'rgba(0,0,0,0.6)',
        color: '#fff',
        border: 'none',
        borderRadius: '50%',
        width: '20px',
        height: '20px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2
      }}
    >
      <X size={11} />
    </button>
  );

  const imgStyle = (h = '100%') => ({
    width: '100%',
    height: h,
    objectFit: 'cover',
    display: 'block',
    borderRadius: '6px'
  });

  // 1 photo — full width
  if (count === 1) {
    return (
      <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', width: '100%', maxWidth: '280px' }}>
        <img src={previews[0]} alt="foto ulasan 1" style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block', borderRadius: '8px' }} />
        <RemoveBtn index={0} />
      </div>
    );
  }

  // 2 photos — side by side equal columns
  if (count === 2) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', borderRadius: '8px', overflow: 'hidden', maxWidth: '320px' }}>
        {previews.map((src, i) => (
          <div key={i} style={{ position: 'relative' }}>
            <img src={src} alt={`foto ulasan ${i + 1}`} style={{ ...imgStyle(), height: '150px' }} />
            <RemoveBtn index={i} />
          </div>
        ))}
      </div>
    );
  }

  // 3 photos — 1 big left + 2 stacked right
  if (count === 3) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', borderRadius: '8px', overflow: 'hidden', maxWidth: '320px' }}>
        {/* Left: big photo */}
        <div style={{ position: 'relative' }}>
          <img src={previews[0]} alt="foto ulasan 1" style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block', borderRadius: '6px 0 0 6px' }} />
          <RemoveBtn index={0} />
        </div>
        {/* Right: 2 stacked small photos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[1, 2].map((i) => (
            <div key={i} style={{ position: 'relative', flex: 1 }}>
              <img src={previews[i]} alt={`foto ulasan ${i + 1}`} style={{ width: '100%', height: '96px', objectFit: 'cover', display: 'block', borderRadius: i === 1 ? '0 6px 0 0' : '0 0 6px 0' }} />
              <RemoveBtn index={i} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4 photos — 2×2 grid
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', borderRadius: '8px', overflow: 'hidden', maxWidth: '320px' }}>
      {previews.map((src, i) => (
        <div key={i} style={{ position: 'relative' }}>
          <img src={src} alt={`foto ulasan ${i + 1}`} style={{ width: '100%', height: '130px', objectFit: 'cover', display: 'block', borderRadius: [0,1,2,3].map(j => j === 0 ? '6px 0 0 0' : j === 1 ? '0 6px 0 0' : j === 2 ? '0 0 0 6px' : '0 0 6px 0')[i] }} />
          <RemoveBtn index={i} />
        </div>
      ))}
    </div>
  );
};

export const ReviewModal = ({ isOpen, onClose, order, item, onSuccess }) => {
  const { user, profile } = useAuth();

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [reviewPhotos, setReviewPhotos] = useState([]); // max 4 photos
  const [photoPreviews, setPhotoPreviews] = useState([]); // base64 previews
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef();
  const MAX_PHOTOS = 4;

  // Rating descriptions
  const ratingLabels = {
    1: 'Sangat Mengecewakan 😞',
    2: 'Kurang Puas 🙁',
    3: 'Cukup Standar 😐',
    4: 'Sangat Bagus & Nyaman 😊',
    5: 'Luar Biasa Sempurna! 🔥👟'
  };

  // Quick tag suggestions for easy review writing
  const quickTags = [
    'Bahan Kulit Premium',
    'Sol Sangat Empuk',
    'Ukuran Pas Sesuai Kaki',
    'Jahitan Rapih & Kuat',
    'Pengiriman Sangat Cepat',
    'Desain Keren Banget'
  ];

  useEffect(() => {
    if (isOpen) {
      setRating(5);
      setHoverRating(0);
      setComment('');
      setReviewPhotos([]);
      setPhotoPreviews([]);
      const defaultName = profile?.full_name || profile?.name || user?.user_metadata?.full_name || user?.user_metadata?.name || (user?.email ? user.email.split('@')[0] : 'Pembeli Barokah');
      setReviewerName(defaultName);
    }
  }, [isOpen, profile, user]);

  if (!isOpen || !item) return null;

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = MAX_PHOTOS - reviewPhotos.length;
    if (remaining <= 0) {
      toast.error(`Maksimal ${MAX_PHOTOS} foto yang bisa diunggah!`);
      return;
    }

    const validFiles = [];
    for (const file of files.slice(0, remaining)) {
      if (!file.type.startsWith('image/')) {
        toast.error(`File "${file.name}" bukan gambar (JPG/PNG/WEBP)!`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Foto "${file.name}" terlalu besar (maks 10 MB)!`);
        continue;
      }
      validFiles.push(file);
    }

    if (!validFiles.length) return;

    // Read all valid files as base64
    const promises = validFiles.map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target.result);
          reader.readAsDataURL(file);
        })
    );

    Promise.all(promises).then((newPreviews) => {
      setReviewPhotos((prev) => [...prev, ...validFiles]);
      setPhotoPreviews((prev) => [...prev, ...newPreviews]);
    });

    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = (index) => {
    setReviewPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddTag = (tag) => {
    if (comment.includes(tag)) return;
    setComment(prev => prev ? `${prev}. ${tag}` : tag);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!comment.trim()) {
      toast.error('Silakan tulis ulasan tentang sepatu ini!');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Determine product slug
      let slug = item.slug;
      if (!slug) {
        try {
          const allProds = await getProducts();
          const match = allProds.find(p => 
            p.name?.toLowerCase().trim() === item.product_name?.toLowerCase().trim() ||
            p.id === item.product_id
          );
          if (match?.slug) slug = match.slug;
        } catch (e) {}
      }

      if (!slug) {
        slug = item.product_name
          ? item.product_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
          : 'produk-barokah';
      }

      const finalName = reviewerName.trim() || 'Pembeli Terverifikasi';

      // 2. Submit review to real Supabase database and sync local cache
      const savedReview = await submitReview({
        orderId: order?.id || null,
        orderNumber: order?.order_number || null,
        userId: user?.id || null,
        userName: finalName,
        userCity: profile?.city || 'Indonesia',
        productId: item.product_id || null,
        productName: item.product_name,
        productSlug: slug,
        productImage: item.product_image || item.product_image_url || null,
        size: item.size || null,
        rating,
        comment: comment.trim(),
        photoUrl: photoPreviews[0] || null, // backward compat: first photo
        photos: photoPreviews, // all photos (array, max 4)
        featuredOnHome: false // Curated by admin first before landing on Home
      });

      // 3. Mark this item in order as reviewed locally for instant badge UI
      const reviewKey = `${order?.order_number || 'ord'}_${item.product_name}_${item.size || 'default'}`;
      try {
        const reviewedMap = JSON.parse(localStorage.getItem('barokah_reviewed_items') || '{}');
        reviewedMap[reviewKey] = {
          rating,
          comment: comment.trim(),
          date: new Date().toLocaleDateString('id-ID'),
          reviewId: savedReview.id
        };
        localStorage.setItem('barokah_reviewed_items', JSON.stringify(reviewedMap));
      } catch (err) {}

      toast.success('🎉 Terima kasih! Ulasan Anda telah tersimpan dan terkirim ke Admin.');

      if (onSuccess) {
        onSuccess(savedReview, reviewKey);
      }

      onClose();
    } catch (err) {
      console.error('Error submitting review:', err);
      toast.error('Gagal mengirim ulasan: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeStar = hoverRating || rating;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '540px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
          position: 'relative'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e5e5',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              CUSTOMER SATISFACTION
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '900', textTransform: 'uppercase', margin: 0, color: '#080808' }}>
              Beri Ulasan Produk
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f4f4f4',
              border: 'none',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#444'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          
          {/* Purchased Item Snapshot */}
          <div style={{
            display: 'flex',
            gap: '14px',
            alignItems: 'center',
            padding: '12px 14px',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            border: '1px solid #eeeeee',
            marginBottom: '20px'
          }}>
            <img
              src={item.product_image || item.product_image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80'}
              alt={item.product_name}
              style={{
                width: '60px',
                height: '60px',
                objectFit: 'cover',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                border: '1px solid #e0e0e0',
                flexShrink: 0
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: '800', fontSize: '0.92rem', color: '#080808', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {item.product_name}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#666', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                {item.size ? `UKURAN: EU ${item.size}` : ''} {order?.order_number ? `• PESANAN #${order.order_number}` : ''}
              </div>
            </div>
          </div>

          {/* Star Rating Section */}
          <div style={{ marginBottom: '22px', textAlign: 'center' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', color: '#444', marginBottom: '8px' }}>
              Bagaimana Kualitas &amp; Kenyamanan Sepatu Ini? *
            </label>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    transition: 'transform 0.15s ease'
                  }}
                  onMouseDown={e => e.currentTarget.style.transform = 'scale(0.85)'}
                  onMouseUp={e => e.currentTarget.style.transform = 'scale(1.15)'}
                >
                  <Star
                    size={36}
                    fill={star <= activeStar ? '#f59e0b' : 'none'}
                    color={star <= activeStar ? '#f59e0b' : '#d1d5db'}
                    strokeWidth={star <= activeStar ? 1 : 1.5}
                  />
                </button>
              ))}
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: '800', color: activeStar >= 4 ? '#059669' : activeStar === 3 ? '#d97706' : '#dc2626' }}>
              {ratingLabels[activeStar]}
            </div>
          </div>

          {/* Quick Tags Suggestions */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: '#666', marginBottom: '6px' }}>
              PILIH CIRI KHAS (OPSIONAL):
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {quickTags.map((tag, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddTag(tag)}
                  style={{
                    fontSize: '0.75rem',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    backgroundColor: comment.includes(tag) ? '#080808' : '#f4f4f4',
                    color: comment.includes(tag) ? '#ffffff' : '#333333',
                    border: '1px solid ' + (comment.includes(tag) ? '#080808' : '#e0e0e0'),
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {comment.includes(tag) ? '✓ ' : '+ '} {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Comment Textarea */}
          <div style={{ marginBottom: '18px' }}>
            <label className="form-label" style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: '800' }}>
              TULIS ULASAN LENGKAP *
            </label>
            <textarea
              className="form-textarea"
              rows={4}
              required
              placeholder="Ceritakan pengalaman Anda: Apakah ukurannya pas? Nyaman dipakai jalan jauh? Bagaimana kualitas bahan kulit & solnya?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{
                width: '100%',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '0.88rem',
                lineHeight: '1.5',
                border: '1px solid #d4d4d4'
              }}
            />
          </div>

          {/* Reviewer Name */}
          <div style={{ marginBottom: '18px' }}>
            <label className="form-label" style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: '800' }}>
              NAMA PENGULAS (TAMPIL DI HALAMAN PRODUK)
            </label>
            <input
              type="text"
              className="form-input"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              required
              style={{ borderRadius: '8px' }}
            />
          </div>

          {/* Optional Photo Attachment — up to 4 photos, Shopee-style grid */}
          <div style={{ marginBottom: '24px' }}>
            <label className="form-label" style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Camera size={14} /> FOTO ULASAN (OPSIONAL, MAKS {MAX_PHOTOS} FOTO)
            </label>

            {/* Photo preview grid */}
            {photoPreviews.length > 0 && (
              <ReviewPhotoGrid
                previews={photoPreviews}
                onRemove={removePhoto}
              />
            )}

            {/* Upload button — shown while still under limit */}
            {photoPreviews.length < MAX_PHOTOS && (
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  border: '1.5px dashed #d1d5db',
                  backgroundColor: '#f9f9f9',
                  cursor: 'pointer',
                  marginTop: photoPreviews.length > 0 ? '10px' : '0'
                }}
              >
                <Upload size={15} color="#666" />
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#444' }}>
                  {photoPreviews.length === 0
                    ? 'Unggah Foto Unboxing / Pemakaian'
                    : `Tambah Foto (${photoPreviews.length}/${MAX_PHOTOS})`}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handlePhotoSelect}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '12px 20px',
                borderRadius: '8px',
                border: '1px solid #d4d4d4',
                backgroundColor: '#ffffff',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: 'pointer',
                color: '#444'
              }}
            >
              BATAL
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: '800',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isSubmitting ? 'MENGIRIM...' : 'KIRIM ULASAN SEKARANG'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
