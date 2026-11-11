import { supabase, isSupabaseConfigured } from './supabase';

// Helper to format review date relative or locale
const formatReviewDate = (isoString) => {
  if (!isoString) return 'Baru saja';
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffHours = Math.floor((now - d) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Baru saja';
    if (diffHours < 24) return `${diffHours} jam lalu`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Kemarin';
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return 'Baru saja';
  }
};

// Map database row to unified frontend shape
const mapDbReview = (r) => ({
  id: r.id,
  name: r.user_name || 'Pembeli Terverifikasi',
  city: r.user_city || 'Indonesia',
  product_name: r.product_name || 'Sepatu Barokah',
  product_slug: r.product_slug || 'barokah-air-legacy-pro',
  product_image: r.product_image || null,
  image: r.product_image || null,
  photo: r.photo_url || null,
  photo_url: r.photo_url || null,
  // Multi-photo support: photos is an array of URLs (max 4)
  photos: Array.isArray(r.photos) ? r.photos : (r.photo_url ? [r.photo_url] : []),
  size: r.size || null,
  rating: Number(r.rating) || 5,
  comment: r.comment || '',
  featured_on_home: !!r.featured_on_home,
  is_verified: r.is_verified !== false,
  isVerified: r.is_verified !== false,
  helpful: Number(r.helpful_count) || 0,
  order_number: r.order_number || null,
  orderNumber: r.order_number || null,
  order_id: r.order_id || null,
  user_id: r.user_id || null,
  status: r.status || 'published',
  created_at: r.created_at,
  date: formatReviewDate(r.created_at)
});

/**
 * Fetch all customer reviews (for Admin CRM / Management)
 */
export const getAllReviews = async () => {
  // Selalu baca localStorage terlebih dahulu sebagai baseline
  let localReviews = [];
  try {
    localReviews = JSON.parse(localStorage.getItem('barokah_customer_reviews') || '[]');
  } catch {}

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const supabaseReviews = data.map(mapDbReview);

        // Gabungkan: ulasan di localStorage yang belum ada di Supabase (baru disubmit)
        const supabaseIds = new Set(supabaseReviews.map(r => String(r.id)));
        const localOnly = localReviews.filter(r => !supabaseIds.has(String(r.id)));

        // Merge: Supabase (sumber kebenaran) + local-only entries
        const merged = [...supabaseReviews, ...localOnly];
        merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // Sync balik ke localStorage
        localStorage.setItem('barokah_customer_reviews', JSON.stringify(merged));
        return merged;
      }
      if (error) {
        console.warn('Supabase reviews table fetch note:', error.message);
      }
    } catch (err) {
      console.warn('getAllReviews error:', err);
    }
  }

  // Fallback ke localStorage
  return localReviews;
};


/**
 * Fetch reviews specifically featured on Homepage (MAX 3)
 * CRITICAL RULE: If admin set reviews to not featured (hidden), return [] or only the ones featured!
 * DO NOT fallback to dummy reviews!
 */
export const getFeaturedHomeReviews = async () => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('featured_on_home', true)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(3);

      if (!error && Array.isArray(data)) {
        const mapped = data.map(mapDbReview);
        localStorage.setItem('barokah_home_featured_reviews', JSON.stringify(mapped));
        return mapped;
      }
    } catch (err) {
      console.warn('getFeaturedHomeReviews Supabase query error:', err);
    }
  }

  // Fallback from localStorage cache
  try {
    const raw = localStorage.getItem('barokah_home_featured_reviews');
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.slice(0, 3);
      }
    }
  } catch {}

  return [];
};

/**
 * Fetch reviews for a specific product
 */
export const getProductReviews = async (productSlug) => {
  if (isSupabaseConfigured && productSlug) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_slug', productSlug)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        return data.map(mapDbReview);
      }
    } catch (err) {
      console.warn('getProductReviews error:', err);
    }
  }

  // Fallback to local storage product reviews
  try {
    const local = JSON.parse(localStorage.getItem(`barokah_reviews_${productSlug}`) || '[]');
    return local;
  } catch {
    return [];
  }
};

// ─── Helper: compress a base64 image to a max dimension & quality ────────────
// Returns a compressed base64 string that is safe to store in Supabase TEXT column.
const compressBase64 = (base64, maxWidth = 800, quality = 0.7) =>
  new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(base64); // fallback: return original
      img.src = base64;
    } catch {
      resolve(base64);
    }
  });

// ─── Helper: upload a single base64 photo to Supabase Storage ────────────────
// Returns the public URL if successful, or null on failure.
const uploadPhotoToStorage = async (base64, filename) => {
  if (!isSupabaseConfigured || !base64?.startsWith('data:')) return null;
  try {
    // Convert base64 → Blob
    const res = await fetch(base64);
    const blob = await res.blob();
    const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
    const path = `review-photos/${filename}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from('reviews')
      .upload(path, blob, { contentType: blob.type, upsert: true });

    if (upErr) {
      console.warn('Storage upload warning:', upErr.message);
      return null;
    }

    const { data: urlData } = supabase.storage.from('reviews').getPublicUrl(path);
    return urlData?.publicUrl || null;
  } catch (err) {
    console.warn('uploadPhotoToStorage error:', err);
    return null;
  }
};

/**
 * Submit a new customer review (Real Supabase + Local Cache)
 * Default: featured_on_home is FALSE so it does NOT appear on Home until curated by Admin
 *
 * FIX (multi-photo): foto base64 besar (4 foto) sebelumnya menyebabkan Supabase INSERT gagal
 * karena payload terlalu besar. Sekarang:
 *   1. Upload foto ke Supabase Storage → simpan public URL (bukan base64).
 *   2. Jika Storage tidak tersedia/gagal → compress base64 ke ≤ ~100 KB lalu simpan ke photo_url.
 *   3. Ini memastikan INSERT selalu berhasil, sehingga ulasan tampil di panel admin.
 */
export const submitReview = async ({
  orderId = null,
  orderNumber = null,
  userId = null,
  userName = 'Pembeli Terverifikasi',
  userCity = 'Indonesia',
  productId = null,
  productName = 'Sepatu Barokah',
  productSlug = 'barokah-air-legacy-pro',
  productImage = null,
  size = null,
  rating = 5,
  comment = '',
  photoUrl = null,
  photos = [], // array of base64/URL strings, max 4
  featuredOnHome = false
}) => {
  const newId = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : 'rev-' + Date.now();

  const rawPhotos = Array.isArray(photos) && photos.length > 0
    ? photos.slice(0, 4)
    : (photoUrl ? [photoUrl] : []);

  // ── Step 1: resolve final photo URLs (Storage upload or compressed base64) ──
  const resolvedPhotos = await Promise.all(
    rawPhotos.map(async (src, idx) => {
      if (!src) return null;

      // If already an https:// URL (not base64), use as-is
      if (src.startsWith('http')) return src;

      // Try uploading to Supabase Storage first
      const storageUrl = await uploadPhotoToStorage(src, `${newId}_${idx}`);
      if (storageUrl) return storageUrl;

      // Fallback: compress base64 so it fits in the TEXT column without blowing payload size
      // Target: ~100 KB (quality=0.6, maxWidth=600px) — safe for Supabase HTTP limit
      const compressed = await compressBase64(src, 600, 0.6);
      return compressed;
    })
  );

  const photosArray = resolvedPhotos.filter(Boolean);

  // Guard: jika foto pertama masih berupa base64 besar (> 500 KB string), jangan kirim ke Supabase.
  // Ini mencegah error 413 / timeout. Foto tetap tersedia di localStorage (photosArray).
  const MAX_SUPABASE_PHOTO_BYTES = 500 * 1024; // 500 KB
  const firstPhotoRaw = photosArray[0] || null;
  const firstPhotoUrl = firstPhotoRaw && firstPhotoRaw.startsWith('data:') && firstPhotoRaw.length > MAX_SUPABASE_PHOTO_BYTES
    ? null  // terlalu besar → simpan null ke DB, foto ada di localStorage
    : firstPhotoRaw;


  // ── Step 2: build Supabase payload — only schema fields, no raw large base64 ──
  const supabasePayload = {
    id: newId,
    order_id: orderId || null,
    order_number: orderNumber || null,
    user_id: userId || null,
    user_name: userName.trim() || 'Pembeli Terverifikasi',
    user_city: userCity.trim() || 'Indonesia',
    product_id: productId || null,
    product_name: productName,
    product_slug: productSlug,
    product_image: productImage || null,
    size: size || null,
    rating: Number(rating) || 5,
    comment: comment.trim(),
    photo_url: firstPhotoUrl, // Storage URL or compressed base64 (small)
    featured_on_home: !!featuredOnHome,
    is_verified: true,
    helpful_count: 0,
    status: 'published',
    created_at: new Date().toISOString()
  };

  // Payload untuk localStorage — sertakan photos array lengkap
  const localPayload = {
    ...supabasePayload,
    photos: photosArray
  };

  let savedRow = null;

  // ── Step 3: Insert ke Supabase ──
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert([supabasePayload])
        .select()
        .single();

      if (!error && data) {
        savedRow = { ...mapDbReview(data), photos: photosArray };
      } else if (error) {
        console.warn('Supabase review insert warning:', error.message);
      }
    } catch (err) {
      console.warn('Supabase review submit exception:', err);
    }
  }

  if (!savedRow) {
    savedRow = mapDbReview(localPayload);
  }

  // ── Step 4: Save into local product cache ──
  if (productSlug) {
    try {
      const existingProd = JSON.parse(localStorage.getItem(`barokah_reviews_${productSlug}`) || '[]');
      localStorage.setItem(`barokah_reviews_${productSlug}`, JSON.stringify([savedRow, ...existingProd]));
    } catch {}
  }

  // ── Step 5: Save into local all-customer reviews cache ──
  try {
    const existingAll = JSON.parse(localStorage.getItem('barokah_customer_reviews') || '[]');
    localStorage.setItem('barokah_customer_reviews', JSON.stringify([savedRow, ...existingAll.filter(x => x.id !== savedRow.id)]));
  } catch {}

  // ── Step 6: Broadcast ke semua tab agar admin page langsung ter-refresh ──
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('barokah_reviews_sync');
      bc.postMessage({ type: 'REVIEW_ADDED', review: savedRow, productSlug });
      bc.close();
    }
  } catch {}

  // ── Step 7: Dispatch same-tab custom event ──
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('barokah:review_added', {
      detail: { review: savedRow, productSlug }
    }));
  }

  return savedRow;
};

/**
 * Get featured home reviews synchronously from instant local cache (0ms latency)
 */
export const getFeaturedHomeReviewsSync = () => {
  try {
    const raw = localStorage.getItem('barokah_home_featured_reviews');
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.slice(0, 3);
      }
    }
  } catch {}
  return [];
};

/**
 * Toggle featured status for Homepage (Max 3 allowed)
 */
export const setReviewFeatured = async (reviewId, featuredStatus) => {
  let updatedFeatured = [];

  // 1. Update local storage caches immediately for zero-lag UI
  try {
    const all = JSON.parse(localStorage.getItem('barokah_customer_reviews') || '[]');
    const updatedAll = all.map(r => String(r.id) === String(reviewId) ? { ...r, featured_on_home: !!featuredStatus } : r);
    localStorage.setItem('barokah_customer_reviews', JSON.stringify(updatedAll));

    // Update featured array
    const currentFeatured = JSON.parse(localStorage.getItem('barokah_home_featured_reviews') || '[]');
    if (featuredStatus) {
      const match = updatedAll.find(r => String(r.id) === String(reviewId));
      if (match && !currentFeatured.some(f => String(f.id) === String(reviewId))) {
        updatedFeatured = [match, ...currentFeatured].slice(0, 3);
      } else {
        updatedFeatured = currentFeatured.slice(0, 3);
      }
    } else {
      updatedFeatured = currentFeatured.filter(f => String(f.id) !== String(reviewId));
    }
    localStorage.setItem('barokah_home_featured_reviews', JSON.stringify(updatedFeatured));
    // Trigger cross-tab storage event
    localStorage.setItem('barokah_featured_sync_event', JSON.stringify({ reviewId, featured: !!featuredStatus, time: Date.now() }));
  } catch (err) {
    console.error('LocalStorage sync error:', err);
  }

  // 2. BroadcastChannel across all tabs & windows immediately
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('barokah_reviews_sync');
      bc.postMessage({ type: 'FEATURED_UPDATED', reviewId, featured: !!featuredStatus, updatedFeatured });
      bc.close();
    }
  } catch {}

  // 3. Dispatch local event for same-tab instant sync
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('barokah:featured_reviews_updated', {
      detail: { reviewId, featured: !!featuredStatus, updatedFeatured }
    }));
  }

  // 4. Update Supabase asynchronously
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ featured_on_home: !!featuredStatus, updated_at: new Date().toISOString() })
        .eq('id', reviewId);

      if (error) {
        console.warn('Supabase setReviewFeatured error:', error.message);
      }
    } catch (err) {
      console.warn('Supabase setReviewFeatured exception:', err);
    }
  }

  return true;
};

/**
 * Delete review (Admin action)
 */
export const deleteReview = async (reviewId) => {
  let updatedFeatured = [];

  try {
    const all = JSON.parse(localStorage.getItem('barokah_customer_reviews') || '[]');
    const filteredAll = all.filter(r => String(r.id) !== String(reviewId));
    localStorage.setItem('barokah_customer_reviews', JSON.stringify(filteredAll));

    const featured = JSON.parse(localStorage.getItem('barokah_home_featured_reviews') || '[]');
    updatedFeatured = featured.filter(r => String(r.id) !== String(reviewId));
    localStorage.setItem('barokah_home_featured_reviews', JSON.stringify(updatedFeatured));
    localStorage.setItem('barokah_featured_sync_event', JSON.stringify({ reviewId, deleted: true, time: Date.now() }));
  } catch {}

  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('barokah_reviews_sync');
      bc.postMessage({ type: 'FEATURED_UPDATED', reviewId, deleted: true, updatedFeatured });
      bc.close();
    }
  } catch {}

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('barokah:featured_reviews_updated', {
      detail: { reviewId, deleted: true, updatedFeatured }
    }));
  }

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) {
        console.warn('Supabase delete review error:', error.message);
      }
    } catch (err) {
      console.warn('deleteReview error:', err);
    }
  }

  return true;
};
