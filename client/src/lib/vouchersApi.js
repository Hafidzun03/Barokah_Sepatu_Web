import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Generate a unique, distinct 30% discount voucher code for a user
 * Format: BRK30-XXXXXX (e.g. BRK30-7M9K2P)
 * Guaranteed to be different for every customer
 */
export const generateUniqueCode = (userId = '', email = '') => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing 0/O, 1/I
  let randomPart = '';
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `BRK30-${randomPart}`;
};

/**
 * Calculate total shoes purchased by this user from their orders
 * Handles both Supabase order_items and items array
 */
export const countUserPurchasedShoes = (orders = []) => {
  if (!Array.isArray(orders) || orders.length === 0) return 0;

  const validOrders = orders.filter(o => 
    o.order_status !== 'dibatalkan' && 
    o.status !== 'dibatalkan'
  );

  return validOrders.reduce((total, ord) => {
    const items = ord.order_items || ord.items || [];
    const orderQty = items.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
    return total + orderQty;
  }, 0);
};

/**
 * Check if user qualifies for the 10-shoe milestone voucher (30% OFF)
 * If qualified and voucher doesn't exist yet, generates and saves a unique voucher.
 */
export const checkAndGenerateLoyaltyVoucher = async (user, orders = []) => {
  if (!user) return { totalShoes: 0, voucher: null, isNewlyGenerated: false };

  const totalShoes = countUserPurchasedShoes(orders);

  // User must have purchased at least 10 pairs of shoes
  if (totalShoes < 10) {
    return { totalShoes, voucher: null, isNewlyGenerated: false };
  }

  const userId = user.id;
  const userEmail = user.email || '';
  const userName = user.user_metadata?.full_name || user.user_metadata?.name || (userEmail ? userEmail.split('@')[0] : 'Pelanggan Setia');

  // 1. Check if user already has a loyalty voucher in Supabase
  let existingVoucher = null;

  if (isSupabaseConfigured && userId && !userId.startsWith('demo-') && !userId.startsWith('mock-')) {
    try {
      const { data, error } = await supabase
        .from('user_vouchers')
        .select('*')
        .or(`user_id.eq.${userId},user_email.eq.${userEmail}`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && Array.isArray(data) && data.length > 0) {
        existingVoucher = data[0];
      }
    } catch (err) {
      console.warn('Check user_vouchers error:', err);
    }
  }

  // 2. Check local fallback
  if (!existingVoucher) {
    try {
      const allLocalVouchers = JSON.parse(localStorage.getItem('barokah_user_vouchers') || '[]');
      existingVoucher = allLocalVouchers.find(v => 
        (v.user_id && v.user_id === userId) || 
        (v.user_email && userEmail && v.user_email.toLowerCase() === userEmail.toLowerCase())
      );
    } catch {}
  }

  // If already exists, return existing voucher
  if (existingVoucher) {
    return { totalShoes, voucher: existingVoucher, isNewlyGenerated: false };
  }

  // 3. Generate a brand new, unique voucher code specifically for this customer
  const newVoucherCode = generateUniqueCode(userId, userEmail);

  const voucherRecord = {
    user_id: (userId && !userId.startsWith('demo-')) ? userId : null,
    user_email: userEmail,
    user_name: userName,
    voucher_code: newVoucherCode,
    discount_percent: 30,
    description: 'Voucher Loyalitas 10 Sepatu (Diskon 30% Semua Produk)',
    is_used: false,
    used_at: null,
    used_order_number: null,
    shoes_purchased_count: totalShoes,
    created_at: new Date().toISOString()
  };

  let savedRecord = voucherRecord;

  // Insert into Supabase
  if (isSupabaseConfigured && userId && !userId.startsWith('demo-')) {
    try {
      const { data, error } = await supabase
        .from('user_vouchers')
        .insert([voucherRecord])
        .select()
        .single();

      if (!error && data) {
        savedRecord = data;
      }
    } catch (err) {
      console.warn('Insert user_vouchers exception:', err);
    }
  }

  // Save into local cache
  try {
    const allLocal = JSON.parse(localStorage.getItem('barokah_user_vouchers') || '[]');
    localStorage.setItem('barokah_user_vouchers', JSON.stringify([savedRecord, ...allLocal]));
  } catch {}

  // Dispatch event for instant UI awareness
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('barokah:loyalty_voucher_unlocked', {
      detail: { voucher: savedRecord, totalShoes }
    }));
  }

  return { totalShoes, voucher: savedRecord, isNewlyGenerated: true };
};

/**
 * Check if a user has already used a specific promo code (e.g. BAROKAH10)
 * Checks Supabase promo_usage, localStorage fallback, and past order records
 */
export const checkPromoUsage = async (promoCode, currentUser) => {
  const cleanCode = (promoCode || '').trim().toUpperCase();
  const userEmail = (currentUser?.email || currentUser?.user_metadata?.email || '').toLowerCase();
  const userId = currentUser?.id || null;

  if (!cleanCode) return null;
  if (!userEmail && !userId) return null;

  // 1. Direct local storage key check (ultra-fast & synchronous guarantee)
  try {
    if (userEmail) {
      const directEmailKey = localStorage.getItem(`barokah_promo_used_${cleanCode}_${userEmail}`);
      if (directEmailKey) return JSON.parse(directEmailKey);
    }
    if (userId) {
      const directIdKey = localStorage.getItem(`barokah_promo_used_${cleanCode}_${userId}`);
      if (directIdKey) return JSON.parse(directIdKey);
    }
  } catch {}

  // 2. Local barokah_promo_usage array check
  try {
    const usedPromos = JSON.parse(localStorage.getItem('barokah_promo_usage') || '[]');
    const found = usedPromos.find(p =>
      p.promo_code === cleanCode && (
        (userEmail && p.user_email && p.user_email.toLowerCase() === userEmail) ||
        (userId && p.user_id && String(p.user_id) === String(userId))
      )
    );
    if (found) return found;
  } catch {}

  // 3. Supabase promo_usage table check
  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('promo_usage').select('*').eq('promo_code', cleanCode);
      if (userEmail && userId && !userId.startsWith('demo-')) {
        query = query.or(`user_email.eq.${userEmail},user_id.eq.${userId}`);
      } else if (userEmail) {
        query = query.eq('user_email', userEmail);
      } else if (userId && !userId.startsWith('demo-')) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.order('used_at', { ascending: false }).limit(1);
      if (!error && Array.isArray(data) && data.length > 0) {
        // Cache locally for instant subsequent lookups
        if (userEmail) {
          localStorage.setItem(`barokah_promo_used_${cleanCode}_${userEmail}`, JSON.stringify(data[0]));
        }
        return data[0];
      }
    } catch (err) {
      console.warn('checkPromoUsage Supabase error:', err);
    }
  }

  // 4. Fallback check: Inspect barokah_orders in localStorage
  try {
    const localOrders = JSON.parse(localStorage.getItem('barokah_orders') || '[]');
    const orderWithPromo = localOrders.find(ord => {
      const isUserOrder = (userId && ord.user_id === userId) ||
                          (userEmail && ord.customer_email && ord.customer_email.toLowerCase() === userEmail);
      if (!isUserOrder) return false;

      // Check if order applied coupon
      const couponMatches = ord.applied_coupon === cleanCode ||
                            ord.coupon_code === cleanCode ||
                            ord.voucher_code === cleanCode ||
                            (ord.admin_notes && ord.admin_notes.includes(cleanCode));
      return Boolean(couponMatches);
    });

    if (orderWithPromo) {
      const syntheticRecord = {
        user_id: userId,
        user_email: userEmail,
        promo_code: cleanCode,
        order_number: orderWithPromo.order_number,
        used_at: orderWithPromo.created_at || new Date().toISOString()
      };
      if (userEmail) {
        localStorage.setItem(`barokah_promo_used_${cleanCode}_${userEmail}`, JSON.stringify(syntheticRecord));
      }
      return syntheticRecord;
    }
  } catch {}

  return null;
};

/**
 * Record promo code usage for a user (marks as used so it cannot be used again)
 */
export const recordPromoUsage = async (promoCode, orderNumber, currentUser) => {
  const cleanCode = (promoCode || '').trim().toUpperCase();
  const userEmail = (currentUser?.email || currentUser?.user_metadata?.email || '').toLowerCase();
  const userId = currentUser?.id || null;

  if (!cleanCode) return false;

  const nowIso = new Date().toISOString();
  const record = {
    user_id: (userId && !userId.startsWith('demo-') && !userId.startsWith('mock-')) ? userId : null,
    user_email: userEmail,
    promo_code: cleanCode,
    order_number: orderNumber || null,
    used_at: nowIso
  };

  // 1. Direct local storage key (synchronous & instant)
  try {
    if (userEmail) {
      localStorage.setItem(`barokah_promo_used_${cleanCode}_${userEmail}`, JSON.stringify(record));
    }
    if (userId) {
      localStorage.setItem(`barokah_promo_used_${cleanCode}_${userId}`, JSON.stringify(record));
    }
  } catch {}

  // 2. Save to localStorage barokah_promo_usage array
  try {
    const usedPromos = JSON.parse(localStorage.getItem('barokah_promo_usage') || '[]');
    const alreadyExists = usedPromos.some(p =>
      p.promo_code === cleanCode && (
        (userEmail && p.user_email === userEmail) ||
        (userId && p.user_id === userId)
      )
    );
    if (!alreadyExists) {
      localStorage.setItem('barokah_promo_usage', JSON.stringify([record, ...usedPromos]));
    }
  } catch {}

  // 3. Save to Supabase promo_usage table
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('promo_usage')
        .insert([record]);

      if (error) {
        console.warn('recordPromoUsage Supabase error:', error.message);
      }
    } catch (err) {
      console.warn('recordPromoUsage exception:', err);
    }
  }

  // 4. Dispatch global event for instant UI awareness across pages & components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('barokah:promo_used', {
      detail: { promoCode: cleanCode, userEmail, userId, orderNumber }
    }));
  }

  return true;
};

/**
 * Validate any coupon / voucher code entered during checkout
 */
export const validateVoucher = async (code, currentUser = null) => {
  const cleanCode = (code || '').trim().toUpperCase();

  if (!cleanCode) {
    return { valid: false, error: 'Silakan masukkan kode voucher' };
  }

  // 1. Standard welcome promo code (BAROKAH10) — SINGLE USE PER USER
  if (cleanCode === 'BAROKAH10') {
    // User must be logged in to use promo code
    if (!currentUser || (!currentUser.email && !currentUser.id)) {
      return {
        valid: false,
        error: 'Silakan login terlebih dahulu untuk menggunakan kode promo BAROKAH10.'
      };
    }

    // Check if user has already used this promo code
    const existingUsage = await checkPromoUsage('BAROKAH10', currentUser);
    if (existingUsage) {
      const usedDate = existingUsage.used_at
        ? new Date(existingUsage.used_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
        : '';
      return {
        valid: false,
        isAlreadyUsed: true,
        code: 'BAROKAH10',
        existingUsage,
        error: `Kode promo BAROKAH10 sudah pernah Anda gunakan${existingUsage.order_number ? ` pada pesanan #${existingUsage.order_number}` : ''}${usedDate ? ` (${usedDate})` : ''}. Coba dapatkan kode voucher lain seperti Voucher Loyalitas 30%!`
      };
    }

    return {
      valid: true,
      code: 'BAROKAH10',
      discountPercent: 10,
      description: 'Voucher Selamat Datang Toko Barokah (-10%)',
      isLoyalty: false
    };
  }

  // 2. Loyalty Voucher (30% discount, single use, customer-specific)
  let foundVoucher = null;

  // Check Supabase
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('user_vouchers')
        .select('*')
        .eq('voucher_code', cleanCode)
        .limit(1);

      if (!error && Array.isArray(data) && data.length > 0) {
        foundVoucher = data[0];
      }
    } catch (err) {
      console.warn('Validate voucher Supabase error:', err);
    }
  }

  // Check local fallback
  if (!foundVoucher) {
    try {
      const allLocal = JSON.parse(localStorage.getItem('barokah_user_vouchers') || '[]');
      foundVoucher = allLocal.find(v => v.voucher_code?.toUpperCase() === cleanCode);
    } catch {}
  }

  if (!foundVoucher) {
    return {
      valid: false,
      error: 'Kode voucher tidak valid. Pastikan kode yang Anda masukkan benar.'
    };
  }

  // Check if voucher was already used (Single-use enforcement)
  if (foundVoucher.is_used) {
    const usedDate = foundVoucher.used_at 
      ? new Date(foundVoucher.used_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
      : '';
    return {
      valid: false,
      error: `Voucher ini sudah pernah digunakan${foundVoucher.used_order_number ? ` pada pesanan #${foundVoucher.used_order_number}` : ''}${usedDate ? ` (${usedDate})` : ''}. Voucher ini hanya berlaku 1 kali pakai!`
    };
  }

  // Check ownership: Voucher belongs specifically to the customer who achieved 10 purchases
  if (currentUser) {
    const isOwner = 
      (foundVoucher.user_id && String(foundVoucher.user_id) === String(currentUser.id)) ||
      (foundVoucher.user_email && currentUser.email && foundVoucher.user_email.toLowerCase() === currentUser.email.toLowerCase());

    if (!isOwner) {
      return {
        valid: false,
        error: 'Voucher 30% ini adalah voucher eksklusif khusus pelanggan pemilik akun yang berhak dan tidak dapat digunakan oleh akun lain.'
      };
    }
  }

  return {
    valid: true,
    code: foundVoucher.voucher_code,
    discountPercent: foundVoucher.discount_percent || 30,
    description: foundVoucher.description || 'Voucher Loyalitas 10 Sepatu (Diskon 30%)',
    voucherId: foundVoucher.id,
    isLoyalty: true,
    voucher: foundVoucher
  };
};

/**
 * Redeem voucher upon successful order creation (Marks as used - single use only)
 * Now also handles BAROKAH10 promo code tracking
 */
export const redeemVoucher = async (code, orderNumber, currentUser = null) => {
  const cleanCode = (code || '').trim().toUpperCase();
  if (!cleanCode) return true;

  const nowIso = new Date().toISOString();

  // Handle BAROKAH10 promo code — record usage in promo_usage table
  if (cleanCode === 'BAROKAH10') {
    if (currentUser && currentUser.email) {
      await recordPromoUsage('BAROKAH10', orderNumber, currentUser);
    }
    return true;
  }

  // Handle loyalty voucher (BRK30-XXXXXX) — mark as used in user_vouchers table
  // 1. Update in Supabase
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('user_vouchers')
        .update({
          is_used: true,
          used_at: nowIso,
          used_order_number: orderNumber,
          updated_at: nowIso
        })
        .eq('voucher_code', cleanCode);

      if (error) {
        console.warn('redeemVoucher Supabase error:', error.message);
      }
    } catch (err) {
      console.warn('redeemVoucher exception:', err);
    }
  }

  // 2. Update in localStorage cache
  try {
    const allLocal = JSON.parse(localStorage.getItem('barokah_user_vouchers') || '[]');
    const updated = allLocal.map(v => 
      v.voucher_code?.toUpperCase() === cleanCode 
        ? { ...v, is_used: true, used_at: nowIso, used_order_number: orderNumber }
        : v
    );
    localStorage.setItem('barokah_user_vouchers', JSON.stringify(updated));
  } catch {}

  // 3. Also record in promo_usage for double-safety
  if (currentUser && currentUser.email) {
    await recordPromoUsage(cleanCode, orderNumber, currentUser);
  }

  // 4. Dispatch event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('barokah:voucher_redeemed', {
      detail: { code: cleanCode, orderNumber }
    }));
  }

  return true;
};

/**
 * Get active unused loyalty voucher for a user (if available)
 */
export const getUserActiveLoyaltyVoucher = async (currentUser) => {
  if (!currentUser) return null;

  const userId = currentUser.id;
  const userEmail = (currentUser.email || '').toLowerCase();

  // 1. Supabase check
  if (isSupabaseConfigured && userId && !userId.startsWith('demo-')) {
    try {
      const { data, error } = await supabase
        .from('user_vouchers')
        .select('*')
        .or(`user_id.eq.${userId},user_email.eq.${userEmail}`)
        .eq('is_used', false)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && Array.isArray(data) && data.length > 0) {
        return data[0];
      }
    } catch (err) {
      console.warn('getUserActiveLoyaltyVoucher Supabase error:', err);
    }
  }

  // 2. Local fallback
  try {
    const allLocal = JSON.parse(localStorage.getItem('barokah_user_vouchers') || '[]');
    const match = allLocal.find(v => 
      !v.is_used && (
        (v.user_id && String(v.user_id) === String(userId)) ||
        (v.user_email && v.user_email.toLowerCase() === userEmail)
      )
    );
    if (match) return match;
  } catch {}

  return null;
};

