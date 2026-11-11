import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatIDR } from '../lib/utils';
import { supabase, isSupabaseConfigured, getAdminClient } from '../lib/supabase';
import { COURIER_OPTIONS, getCourierConfig } from '../lib/shippingUtils';
import { 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  MapPin, 
  ArrowRight,
  Lock,
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
  Tag,
  Gift,
  X,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { validateVoucher, redeemVoucher, getUserActiveLoyaltyVoucher, checkPromoUsage, recordPromoUsage } from '../lib/vouchersApi';
import { VoucherUsedModal } from '../components/VoucherUsedModal';

/**
 * Otomatis mengurangi stok varian produk di database Supabase dan localStorage saat pesanan berhasil dibuat
 */
const deductStockForCartItems = async (items, client) => {
  if (!items || items.length === 0) return;

  // 1. Pengurangan stok di database Supabase
  if (isSupabaseConfigured) {
    try {
      const db = (await getAdminClient()) || client || supabase;
      if (db) {
        for (const item of items) {
          const qtyBought = Number(item.quantity) || 1;
          const variantId = item.variant?.id;
          const productId = item.product?.id;
          const size = item.variant?.size;

          let variantUpdated = false;

          // Percobaan A: Update berdasarkan variantId jika berupa ID valid database
          if (variantId && typeof variantId === 'string' && !variantId.startsWith('v-')) {
            const { data: vData } = await db
              .from('product_variants')
              .select('id, stock')
              .eq('id', variantId)
              .maybeSingle();

            if (vData) {
              const currentStock = Number(vData.stock) || 0;
              const newStock = Math.max(0, currentStock - qtyBought);
              await db
                .from('product_variants')
                .update({ stock: newStock })
                .eq('id', vData.id);
              variantUpdated = true;
            }
          }

          // Percobaan B: Fallback cari berdasarkan product_id dan size
          if (!variantUpdated && productId && size) {
            const { data: vData2 } = await db
              .from('product_variants')
              .select('id, stock')
              .eq('product_id', productId)
              .eq('size', String(size))
              .maybeSingle();

            if (vData2) {
              const currentStock = Number(vData2.stock) || 0;
              const newStock = Math.max(0, currentStock - qtyBought);
              await db
                .from('product_variants')
                .update({ stock: newStock })
                .eq('id', vData2.id);
              variantUpdated = true;
            }
          }

          // Update akumulasi total_sold di tabel products
          if (productId) {
            try {
              const { data: pData } = await db
                .from('products')
                .select('id, total_sold')
                .eq('id', productId)
                .maybeSingle();

              if (pData) {
                const newSold = (Number(pData.total_sold) || 0) + qtyBought;
                await db
                  .from('products')
                  .update({ total_sold: newSold })
                  .eq('id', pData.id);
              }
            } catch (pErr) {
              console.warn('Update total_sold error:', pErr);
            }
          }
        }
      }
    } catch (dbErr) {
      console.warn('Supabase stock deduction error:', dbErr);
    }
  }

  // 2. Sinkronkan cache di localStorage (barokah_admin_products & barokah_admin_variants)
  try {
    const rawProds = localStorage.getItem('barokah_admin_products');
    if (rawProds) {
      const parsedProds = JSON.parse(rawProds);
      if (Array.isArray(parsedProds) && parsedProds.length > 0) {
        const updatedProds = parsedProds.map(prod => {
          const matchingItems = items.filter(ci => String(ci.product?.id) === String(prod.id));
          if (matchingItems.length === 0) return prod;

          const updatedVariants = (prod.variants || []).map(v => {
            const bought = matchingItems.find(
              ci => String(ci.variant?.size) === String(v.size) || String(ci.variant?.id) === String(v.id)
            );
            if (!bought) return v;
            return {
              ...v,
              stock: Math.max(0, (Number(v.stock) || 0) - (Number(bought.quantity) || 1))
            };
          });

          const totalBought = matchingItems.reduce((acc, ci) => acc + (Number(ci.quantity) || 1), 0);
          return {
            ...prod,
            variants: updatedVariants,
            total_sold: (Number(prod.total_sold) || 0) + totalBought
          };
        });
        localStorage.setItem('barokah_admin_products', JSON.stringify(updatedProds));
      }
    }

    const rawVars = localStorage.getItem('barokah_admin_variants');
    if (rawVars) {
      const parsedVars = JSON.parse(rawVars);
      if (Array.isArray(parsedVars) && parsedVars.length > 0) {
        const updatedVars = parsedVars.map(v => {
          const bought = items.find(
            ci => (String(ci.product?.id) === String(v.productId) || String(ci.product?.id) === String(v.products?.id)) &&
                  String(ci.variant?.size) === String(v.size)
          );
          if (!bought) return v;
          const newStk = Math.max(0, (Number(v.stock) || 0) - (Number(bought.quantity) || 1));
          return {
            ...v,
            stock: newStk,
            status: newStk === 0 ? 'out' : newStk <= 5 ? 'low' : 'ready'
          };
        });
        localStorage.setItem('barokah_admin_variants', JSON.stringify(updatedVars));
      }
    }
  } catch (localErr) {
    console.warn('LocalStorage stock deduction error:', localErr);
  }

  // 3. Siarkan event broadcast pembaruan stok ke seluruh tab dan halaman admin
  window.dispatchEvent(new CustomEvent('barokah:stock_updated'));
  window.dispatchEvent(new CustomEvent('barokah:products_updated'));
  window.dispatchEvent(new CustomEvent('barokah:order_placed'));
  localStorage.setItem('barokah_products_version', Date.now().toString());
};

export const Checkout = () => {
  const { cartItems, cartTotal, clearCart, totalItems } = useCart();
  const { user, profile, signIn, signUp, updateProfileData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Coupon & Voucher State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [userLoyaltyVoucher, setUserLoyaltyVoucher] = useState(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [barokahUsed, setBarokahUsed] = useState(false);
  const [showUsedModal, setShowUsedModal] = useState(false);
  const [usedModalInfo, setUsedModalInfo] = useState(null);

  // On mount: re-validate any coupon coming from Cart via location.state
  // and check if BAROKAH10 has been used by this user
  useEffect(() => {
    let isMounted = true;
    const initVouchers = async () => {
      if (!user) return;

      // Check if BAROKAH10 already used by this user
      const usage = await checkPromoUsage('BAROKAH10', user);
      if (usage && isMounted) {
        setBarokahUsed(true);
        setUsedModalInfo(usage);
      }

      // Re-validate coupon from Cart (location.state) to prevent bypass
      const incomingCoupon = location.state?.appliedCoupon;
      const incomingDiscount = location.state?.discountAmount;

      if (incomingCoupon?.code || incomingDiscount) {
        const codeToValidate = incomingCoupon?.code || 'BAROKAH10';
        try {
          const res = await validateVoucher(codeToValidate, user);
          if (res.valid && isMounted) {
            setCouponCode(res.code);
            setAppliedCoupon({
              code: res.code,
              discountPercent: res.discountPercent,
              description: res.description,
              isLoyalty: res.isLoyalty,
              voucherId: res.voucherId
            });
          } else if (isMounted) {
            // Coupon no longer valid (already used), show error & modal
            if (res.isAlreadyUsed) {
              setBarokahUsed(true);
              setUsedModalInfo(res.existingUsage);
              setShowUsedModal(true);
            }
            toast.error(res.error || 'Voucher sudah tidak berlaku.');
          }
        } catch (err) {
          console.warn('Re-validate incoming coupon error:', err);
        }
      }
    };
    initVouchers();

    const handlePromoUsed = (e) => {
      if (e.detail?.promoCode === 'BAROKAH10' && isMounted) {
        setBarokahUsed(true);
        setUsedModalInfo(e.detail);
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

  // Fetch any active loyalty voucher belonging to the user
  useEffect(() => {
    if (user) {
      getUserActiveLoyaltyVoucher(user).then(v => {
        if (v) setUserLoyaltyVoucher(v);
      });
    } else {
      setUserLoyaltyVoucher(null);
    }
  }, [user]);

  const handleApplyCoupon = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanCode = (couponCode || '').trim().toUpperCase();
    if (!cleanCode) {
      toast.error('Silakan masukkan kode voucher');
      return;
    }

    setIsValidatingCoupon(true);
    try {
      const res = await validateVoucher(cleanCode, user);
      if (!res.valid) {
        if (res.isAlreadyUsed || cleanCode === 'BAROKAH10') {
          setBarokahUsed(true);
          setUsedModalInfo(res.existingUsage);
          setShowUsedModal(true);
        }
        toast.error(res.error || 'Kode voucher tidak valid');
        return;
      }

      setAppliedCoupon({
        code: res.code,
        discountPercent: res.discountPercent,
        description: res.description,
        isLoyalty: res.isLoyalty,
        voucherId: res.voucherId
      });
      toast.success(`Voucher ${res.code} berhasil diterapkan! Potongan ${res.discountPercent}%`);
    } catch (err) {
      console.warn('Validate voucher error:', err);
      toast.error('Gagal memvalidasi voucher');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.success('Voucher berhasil dihapus');
  };

  const discountAmount = appliedCoupon ? Math.round((cartTotal * appliedCoupon.discountPercent) / 100) : 0;

  // Shipping Form State
  const [recipientName, setRecipientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('Jakarta Selatan');
  const [province, setProvince] = useState('DKI Jakarta');
  const [postalCode, setPostalCode] = useState('12560');
  const [customerNotes, setCustomerNotes] = useState('');

  // Shipping & Payment Options
  const [courier, setCourier] = useState('JNE Reguler');
  const [shippingFee, setShippingFee] = useState(22000);
  const [paymentMethod, setPaymentMethod] = useState('BCA');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inline Auth Gate State (for unauthenticated users)
  const [authTab, setAuthTab] = useState('register'); // 'register' | 'login'
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Sync all recipient data from user registration / profile
  useEffect(() => {
    if (!user) return;

    // 1. Try reading profile data, user_metadata, or local storage profile backup
    let localBackup = {};
    try {
      localBackup = JSON.parse(localStorage.getItem(`barokah_profile_${user.id}`) || '{}');
    } catch (e) {}

    const meta = user.user_metadata || {};

    const nameToSet = profile?.full_name || profile?.name || meta.full_name || meta.name || localBackup.full_name || localBackup.name || (user.email ? user.email.split('@')[0] : '');
    const phoneToSet = profile?.phone || profile?.phone_number || meta.phone || meta.phone_number || localBackup.phone || localBackup.phone_number || '';
    const addressToSet = profile?.address || profile?.address_line || meta.address || localBackup.address || '';
    const postalToSet = profile?.postal_code || profile?.postalCode || meta.postal_code || meta.postalCode || localBackup.postal_code || localBackup.postalCode || '';
    const cityToSet = profile?.city || meta.city || localBackup.city || '';
    const provinceToSet = profile?.province || meta.province || localBackup.province || '';

    if (nameToSet) setRecipientName(nameToSet);
    if (phoneToSet) setPhoneNumber(phoneToSet);
    if (addressToSet) setAddressLine(addressToSet);
    if (postalToSet) setPostalCode(postalToSet);
    if (cityToSet) setCity(cityToSet);
    if (provinceToSet) setProvince(provinceToSet);

    // 2. Fallback: If phone or address is still empty, look up the user's latest order
    if ((!phoneToSet || !addressToSet) && isSupabaseConfigured && user.id) {
      const fetchLastOrderAddress = async () => {
        try {
          const { data: lastOrder } = await supabase
            .from('orders')
            .select('recipient_name, recipient_phone, shipping_address, shipping_city, shipping_province, shipping_postal_code')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (lastOrder) {
            if (!nameToSet && lastOrder.recipient_name) setRecipientName(lastOrder.recipient_name);
            if (!phoneToSet && lastOrder.recipient_phone) setPhoneNumber(lastOrder.recipient_phone);
            if (!addressToSet && lastOrder.shipping_address) setAddressLine(lastOrder.shipping_address);
            if (!cityToSet && lastOrder.shipping_city) setCity(lastOrder.shipping_city);
            if (!provinceToSet && lastOrder.shipping_province) setProvince(lastOrder.shipping_province);
            if (!postalToSet && lastOrder.shipping_postal_code) setPostalCode(lastOrder.shipping_postal_code);
          }
        } catch (err) {
          console.warn('Last order fallback notice:', err);
        }
      };
      fetchLastOrderAddress();
    }
  }, [profile, user]);

  const couriersList = COURIER_OPTIONS;

  const handleCourierChange = (c) => {
    setCourier(c.name);
    setShippingFee(c.fee);
  };

  const grandTotal = Math.max(0, cartTotal - discountAmount) + shippingFee;

  // Inline Registration
  const handleInlineRegister = async (e) => {
    e.preventDefault();

    if (regPassword !== regConfirm) {
      toast.error('Konfirmasi password tidak cocok!');
      return;
    }

    if (regPassword.length < 6) {
      toast.error('Password minimal 6 karakter!');
      return;
    }

    setIsAuthLoading(true);
    const { data, error } = await signUp(regEmail, regPassword, regName);
    setIsAuthLoading(false);

    if (!error) {
      setRecipientName(regName);
      toast.success('Akun Anda aktif! Silakan lanjutkan mengisi alamat pengiriman.');
    }
  };

  // Inline Login
  const handleInlineLogin = async (e) => {
    e.preventDefault();
    setIsAuthLoading(true);
    const { data, error } = await signIn(loginEmail, loginPassword);
    setIsAuthLoading(false);

    if (!error) {
      toast.success('Login berhasil! Silakan lanjutkan pesanan Anda.');
    }
  };

  // Submit Final Order
  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    if (!recipientName.trim() || !phoneNumber.trim() || !addressLine.trim()) {
      toast.error('Harap lengkapi nama penerima, nomor telepon, dan alamat pengiriman!');
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Keranjang kosong!');
      navigate('/shop');
      return;
    }

    setIsSubmitting(true);
    const orderNumber = 'BS-' + Date.now().toString().slice(-6);

    const orderPayload = {
      order_number: orderNumber,
      user_id: user?.id || null,
      customer_email: (user?.email || '').toLowerCase(),
      recipient_name: recipientName,
      phone_number: phoneNumber,
      shipping_address: `${addressLine}, ${city}, ${province} ${postalCode}`,
      shipping_courier: courier,
      shipping_fee: shippingFee,
      payment_method: paymentMethod,
      customer_notes: customerNotes,
      subtotal: cartTotal,
      discount_amount: discountAmount,
      total_amount: grandTotal,
      coupon_code: appliedCoupon?.code || null,
      applied_coupon: appliedCoupon?.code || null,
      status: 'menunggu_pembayaran',
      payment_status: 'belum_dibayar',
      created_at: new Date().toISOString(),
      items: cartItems.map(item => ({
        product_id: item.product.id,
        product_name: item.product.name,
        product_image: item.product.images?.[0],
        variant_id: item.variant.id,
        size: item.variant.size,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity
      }))
    };

    // Helper: Mark BAROKAH10 as used (called after order success)
    const markBarokah10Used = async () => {
      if (appliedCoupon?.code?.toUpperCase() === 'BAROKAH10' && user) {
        try {
          // Record via redeemVoucher (which calls recordPromoUsage internally)
          await redeemVoucher('BAROKAH10', orderNumber, user);
        } catch (e) { console.warn('redeemVoucher BAROKAH10 error:', e); }

        try {
          // ALSO call recordPromoUsage directly as belt-and-suspenders
          await recordPromoUsage('BAROKAH10', orderNumber, user);
        } catch (e) { console.warn('recordPromoUsage BAROKAH10 error:', e); }

        // Immediately update UI state so voucher section shows "sudah digunakan"
        setBarokahUsed(true);
        setUsedModalInfo({ order_number: orderNumber, used_at: new Date().toISOString() });
      }
    };

    try {
      // Map UI payment method to Supabase ENUM (transfer_bank | ewallet | cod)
      const paymentMethodEnum = paymentMethod === 'COD' ? 'cod'
        : paymentMethod === 'QRIS' ? 'ewallet'
        : 'transfer_bank';

      const shippingAddress = `${addressLine}, ${city}, ${province} ${postalCode}`;
      let activeDb = null;

      if (isSupabaseConfigured) {
        let orderData = null;
        activeDb = supabase;

        const isRealUser = Boolean(user && user.id && !user.id.startsWith('demo-') && !user.id.startsWith('mock-'));

        const selectedConfig = getCourierConfig(courier, shippingFee);
        const initialAdminNotes = `[KURIR: ${courier} | ESTIMASI: ${selectedConfig.etaText}]${customerNotes ? ' Catatan: ' + customerNotes : ''}`;

        // 1. If customer is authenticated, try creating order with customer's session (satisfies auth.uid() = user_id)
        if (isRealUser) {
          const res = await supabase
            .from('orders')
            .insert({
              order_number: orderNumber,
              user_id: user.id,
              recipient_name: recipientName,
              recipient_phone: phoneNumber,
              shipping_address: shippingAddress,
              shipping_city: city,
              shipping_province: province,
              shipping_postal_code: postalCode,
              shipping_cost: shippingFee,
              payment_method: paymentMethodEnum,
              customer_notes: customerNotes || null,
              admin_notes: initialAdminNotes,
              subtotal: cartTotal,
              discount_amount: discountAmount,
              total: grandTotal,
              order_status: 'menunggu_pembayaran',
              payment_status: 'belum_dibayar'
            })
            .select()
            .single();

          if (!res.error && res.data) {
            orderData = res.data;
            activeDb = supabase;
          } else {
            console.warn('Customer client insert failed, attempting fallback to adminDb:', res.error);
          }
        }

        // 2. If guest checkout or customer insert failed, use admin client with admin's UID (always succeeds)
        if (!orderData) {
          try {
            const adminDb = await getAdminClient();
            if (adminDb) {
              const { data: adminUserRes } = await adminDb.auth.getUser();
              const adminUid = adminUserRes?.user?.id || '5147c13b-f95c-4671-9ce1-9f16d4896fa0';

              const res = await adminDb
                .from('orders')
                .insert({
                  order_number: orderNumber,
                  user_id: adminUid,
                  recipient_name: recipientName,
                  recipient_phone: phoneNumber,
                  shipping_address: shippingAddress,
                  shipping_city: city,
                  shipping_province: province,
                  shipping_postal_code: postalCode,
                  shipping_cost: shippingFee,
                  payment_method: paymentMethodEnum,
                  customer_notes: customerNotes || null,
                  admin_notes: initialAdminNotes,
                  subtotal: cartTotal,
                  discount_amount: discountAmount,
                  total: grandTotal,
                  order_status: 'menunggu_pembayaran',
                  payment_status: 'belum_dibayar'
                })
                .select()
                .single();

              if (!res.error && res.data) {
                orderData = res.data;
                activeDb = adminDb;
              } else {
                console.error('adminDb order insert error:', res.error);
              }
            }
          } catch (adminErr) {
            console.error('getAdminClient error during checkout:', adminErr);
          }
        }

        if (orderData && orderData.id) {
          // CRITICAL: Ensure orderPayload has the real Supabase UUID
          orderPayload.id = orderData.id;

          // Insert order items
          const itemsToInsert = cartItems.map(item => ({
            order_id: orderData.id,
            product_variant_id: item.variant?.id || null,
            product_name: item.product.name,
            product_image_url: item.product.images?.[0] || null,
            size: item.variant?.size || '-',
            color: item.variant?.color || null,
            sku: item.variant?.sku || null,
            unit_price: item.price,
            quantity: item.quantity,
            line_total: item.price * item.quantity
          }));

          const { error: itemsError } = await activeDb.from('order_items').insert(itemsToInsert);
          if (itemsError) {
            console.error('Supabase order_items insert error:', itemsError);
          }

          // Insert initial payment record into payments table
          const { error: payInsertError } = await activeDb.from('payments').insert({
            order_id: orderData.id,
            method: paymentMethodEnum,
            amount: grandTotal,
            status: 'belum_dibayar',
            bank_name: paymentMethodEnum === 'transfer_bank' ? 'BCA' : paymentMethodEnum === 'ewallet' ? 'QRIS / E-Wallet' : 'COD'
          });
          if (payInsertError) {
            console.error('Supabase initial payments insert error:', payInsertError);
          }
        }
      }

      // Auto update profile so future checkouts are always pre-filled
      if (user && updateProfileData) {
        try {
          updateProfileData({
            name: recipientName,
            full_name: recipientName,
            phone: phoneNumber,
            phone_number: phoneNumber,
            address: addressLine,
            postal_code: postalCode,
            postalCode: postalCode,
            city,
            province
          });
        } catch (e) {}
      }

      // Mark BAROKAH10 as used (direct + via redeemVoucher) 
      await markBarokah10Used();

      // Redeem other vouchers (loyalty 30% etc)
      if (appliedCoupon?.code && appliedCoupon.code.toUpperCase() !== 'BAROKAH10') {
        try {
          await redeemVoucher(appliedCoupon.code, orderNumber, user);
        } catch (vErr) {
          console.warn('Redeem voucher error:', vErr);
        }
      }

      const existingOrders = JSON.parse(localStorage.getItem('barokah_orders') || '[]');
      localStorage.setItem('barokah_orders', JSON.stringify([orderPayload, ...existingOrders]));

      // ── Kurangi Stok Varian Otomatis di Database & Local Cache ──
      await deductStockForCartItems(cartItems, activeDb);

      clearCart();
      toast.success(`Pesanan #${orderNumber} berhasil dibuat!`);
      navigate(`/order/${orderNumber}`, { state: { order: orderPayload } });
    } catch (err) {
      console.error('Error creating order:', err);

      // Mark BAROKAH10 as used even on error path (order is still created locally)
      await markBarokah10Used();

      // Redeem other vouchers (fallback path)
      if (appliedCoupon?.code && appliedCoupon.code.toUpperCase() !== 'BAROKAH10') {
        try {
          await redeemVoucher(appliedCoupon.code, orderNumber, user);
        } catch (vErr) {}
      }

      const existingOrders = JSON.parse(localStorage.getItem('barokah_orders') || '[]');
      localStorage.setItem('barokah_orders', JSON.stringify([orderPayload, ...existingOrders]));

      // Fallback pengurangan stok di database & local cache
      await deductStockForCartItems(cartItems, null);

      clearCart();
      toast.success(`Pesanan #${orderNumber} berhasil dibuat!`);
      navigate(`/order/${orderNumber}`, { state: { order: orderPayload } });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <div className="container">
          <h2>Keranjang belanja Anda kosong</h2>
          <p style={{ margin: '16px 0 24px' }}>Silakan pilih sepatu terlebih dahulu sebelum checkout.</p>
          <Link to="/shop" className="btn btn-primary">Lihat Katalog</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 0 80px' }}>
      <div className="container">
        
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#666666', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            TRANSACTION GATEWAY • STEP 1 & 2
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '900', marginTop: '4px', textTransform: 'uppercase' }}>
            CHECKOUT & PENGIRIMAN
          </h1>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '32px',
          alignItems: 'start'
        }}>
          
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* STEP 1: AUTHENTICATION GATE (Mandatory Registration for Checkout) */}
            {!user ? (
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '4px',
                padding: '28px',
                border: '1.5px solid #080808'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <Lock size={20} color="#080808" />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '900', textTransform: 'uppercase' }}>
                    1. DAFTAR AKUN TERLEBIH DAHULU (WAJIB UNTUK CHECKOUT)
                  </h3>
                </div>

                <div style={{
                  backgroundColor: '#f3f0eb',
                  padding: '12px 16px',
                  borderRadius: '2px',
                  marginBottom: '20px',
                  fontSize: '0.82rem',
                  lineHeight: '1.5',
                  color: '#444444'
                }}>
                  <strong>Kenapa wajib daftar akun?</strong> Agar riwayat pesanan, nomor resi pengiriman, serta garansi tukar ukuran sepatu Anda tersimpan rapi di sistem. <em>Sepatu yang sudah Anda pilih di keranjang tersimpan 100% dan tidak akan hilang!</em>
                </div>

                {/* Tabs: Register / Login */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #e5e5e5', paddingBottom: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setAuthTab('register')}
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontWeight: '800',
                      fontSize: '0.85rem',
                      textTransform: 'uppercase',
                      padding: '8px 16px',
                      borderRadius: '2px',
                      backgroundColor: authTab === 'register' ? '#080808' : '#f4f4f4',
                      color: authTab === 'register' ? '#b7d600' : '#666666',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    DAFTAR AKUN BARU
                  </button>

                  <button
                    type="button"
                    onClick={() => setAuthTab('login')}
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontWeight: '800',
                      fontSize: '0.85rem',
                      textTransform: 'uppercase',
                      padding: '8px 16px',
                      borderRadius: '2px',
                      backgroundColor: authTab === 'login' ? '#080808' : '#f4f4f4',
                      color: authTab === 'login' ? '#b7d600' : '#666666',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    SUDAH PUNYA AKUN? MASUK
                  </button>
                </div>

                {/* Register Form */}
                {authTab === 'register' && (
                  <form onSubmit={handleInlineRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label className="form-label">NAMA LENGKAP PENERIMA *</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          className="form-input"
                          style={{ paddingLeft: '38px', fontSize: '0.85rem' }}
                          placeholder="Contoh: Budi Santoso"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          required
                        />
                        <User size={16} color="#080808" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                      </div>
                    </div>

                    <div>
                      <label className="form-label">EMAIL AKTIF *</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="email"
                          className="form-input"
                          style={{ paddingLeft: '38px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                          placeholder="nama@email.com"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          required
                        />
                        <Mail size={16} color="#080808" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label className="form-label">PASSWORD *</label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="password"
                            className="form-input"
                            style={{ paddingLeft: '38px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                            placeholder="Min. 6 karakter"
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            required
                          />
                          <Lock size={16} color="#080808" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                        </div>
                      </div>

                      <div>
                        <label className="form-label">ULANGI PASSWORD *</label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="password"
                            className="form-input"
                            style={{ paddingLeft: '38px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                            placeholder="Ketik ulang"
                            value={regConfirm}
                            onChange={(e) => setRegConfirm(e.target.value)}
                            required
                          />
                          <Lock size={16} color="#080808" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isAuthLoading}
                      className="btn btn-accent btn-lg"
                      style={{ width: '100%', marginTop: '6px' }}
                    >
                      {isAuthLoading ? 'MEMBUAT AKUN...' : 'DAFTAR & LANJUTKAN CHECKOUT'}
                      {!isAuthLoading && <ArrowRight size={16} />}
                    </button>
                  </form>
                )}

                {/* Login Form */}
                {authTab === 'login' && (
                  <form onSubmit={handleInlineLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label className="form-label">ALAMAT EMAIL *</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="email"
                          className="form-input"
                          style={{ paddingLeft: '38px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                          placeholder="nama@email.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          required
                        />
                        <Mail size={16} color="#080808" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                      </div>
                    </div>

                    <div>
                      <label className="form-label">PASSWORD *</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="password"
                          className="form-input"
                          style={{ paddingLeft: '38px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                        />
                        <Lock size={16} color="#080808" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isAuthLoading}
                      className="btn btn-primary btn-lg"
                      style={{ width: '100%', marginTop: '6px' }}
                    >
                      {isAuthLoading ? 'MEMVERIFIKASI...' : 'MASUK & LANJUTKAN CHECKOUT'}
                      {!isAuthLoading && <ArrowRight size={16} />}
                    </button>

                    {/* Quick Demo Credentials Preset */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setLoginEmail('customer@barokahshoes.id');
                          setLoginPassword('Customer123!');
                          signIn('customer@barokahshoes.id', 'Customer123!');
                        }}
                        style={{
                          flex: 1,
                          padding: '6px',
                          borderRadius: '2px',
                          backgroundColor: '#f4f4f4',
                          border: '1px solid #e5e5e5',
                          fontSize: '0.72rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: '700'
                        }}
                      >
                        ⚡ DEMO: CUSTOMER
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLoginEmail('admin@barokahshoes.id');
                          setLoginPassword('AdminPassword123!');
                          signIn('admin@barokahshoes.id', 'AdminPassword123!');
                        }}
                        style={{
                          flex: 1,
                          padding: '6px',
                          borderRadius: '2px',
                          backgroundColor: '#f4f4f4',
                          border: '1px solid #e5e5e5',
                          fontSize: '0.72rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: '700'
                        }}
                      >
                        ⚡ DEMO: ADMIN
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              /* User Is Authenticated Card */
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '4px',
                padding: '20px 24px',
                border: '1px solid #e5e5e5',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '2px', backgroundColor: '#080808', color: '#b7d600', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '0.9rem', color: '#080808' }}>
                      AKUN TERHUBUNG: {profile?.full_name || user.email}
                    </div>
                    <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#666666' }}>
                      {user.email} • PESANAN AKAN TERSIMPAN KE RIWAYAT ANDA
                    </div>
                  </div>
                </div>
                <span className="badge badge-citron">VERIFIED</span>
              </div>
            )}

            {/* STEP 2: SHIPPING ADDRESS & PAYMENT (Active once user is logged in) */}
            {user && (
              <form onSubmit={handleSubmitOrder} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Shipping Address */}
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '4px',
                  padding: '28px',
                  border: '1px solid #e5e5e5'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <MapPin size={20} color="#080808" />
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '900', textTransform: 'uppercase', margin: 0 }}>
                        2. ALAMAT PENGIRIMAN
                      </h3>
                    </div>
                    {(recipientName || phoneNumber || addressLine) && (
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: '800',
                        fontFamily: 'var(--font-mono)',
                        color: '#15803d',
                        backgroundColor: '#dcfce7',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        <Check size={13} strokeWidth={3} /> OTOMATIS TERISI DARI AKUN
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label className="form-label">NAMA PENERIMA *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label">WHATSAPP / HP *</label>
                      <input
                        type="tel"
                        className="form-input"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">ALAMAT LENGKAP (JALAN, NO. RUMAH, RT/RW) *</label>
                    <textarea
                      className="form-textarea"
                      rows={2}
                      value={addressLine}
                      onChange={(e) => setAddressLine(e.target.value)}
                      placeholder="Contoh: Jl. Kemang Raya No. 12B, RT 04/RW 02"
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    <div>
                      <label className="form-label">KOTA</label>
                      <input
                        type="text"
                        className="form-input"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label">PROVINSI</label>
                      <input
                        type="text"
                        className="form-input"
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label">KODE POS</label>
                      <input
                        type="text"
                        className="form-input"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Courier Selection */}
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '4px',
                  padding: '28px',
                  border: '1px solid #e5e5e5'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <Truck size={20} color="#080808" />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '900', textTransform: 'uppercase' }}>
                      3. EKSPEDISI LOGISTIK
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {couriersList.map(c => {
                      const isSelected = courier === c.name;
                      return (
                        <div
                          key={c.id}
                          onClick={() => handleCourierChange(c)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '14px 18px',
                            borderRadius: '4px',
                            border: isSelected ? '2px solid #080808' : '1px solid #e5e5e5',
                            backgroundColor: isSelected ? '#fbfbfa' : '#ffffff',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: '800', fontFamily: 'var(--font-heading)', color: '#080808', textTransform: 'uppercase', fontSize: '0.9rem' }}>
                                {c.name}
                              </span>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '3px',
                                backgroundColor: c.tagColor || '#080808',
                                color: c.tagText || '#ffffff',
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                fontFamily: 'var(--font-mono)'
                              }}>
                                {c.tag || 'REGULER'}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#444444', marginTop: '3px' }}>
                              ESTIMASI SAMPAI: <strong>{c.etaText || c.eta}</strong>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#888888', marginTop: '2px' }}>
                              {c.description}
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: '900', fontFamily: 'var(--font-mono)', color: '#080808', fontSize: '1rem' }}>
                              {formatIDR(c.fee)}
                            </div>
                            <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: '#666666' }}>
                              {c.durationHours ? `${c.durationHours} Jam` : ''}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Payment Method */}
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '4px',
                  padding: '28px',
                  border: '1px solid #e5e5e5'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <CreditCard size={20} color="#080808" />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '900', textTransform: 'uppercase' }}>
                      4. METODE PEMBAYARAN
                    </h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginBottom: '16px' }}>
                    {[
                      { id: 'BCA', label: 'BCA TRANSFER' },
                      { id: 'MANDIRI', label: 'MANDIRI' },
                      { id: 'BRI', label: 'BRI TRANSFER' },
                      { id: 'QRIS', label: 'QRIS INSTANT' },
                      { id: 'COD', label: 'COD (BAYAR TEMPAT)' }
                    ].map(m => (
                      <div
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id)}
                        style={{
                          padding: '12px',
                          textAlign: 'center',
                          borderRadius: '2px',
                          border: paymentMethod === m.id ? '2px solid #080808' : '1px solid #e5e5e5',
                          backgroundColor: paymentMethod === m.id ? '#080808' : '#ffffff',
                          color: paymentMethod === m.id ? '#ffffff' : '#080808',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: '700',
                          fontSize: '0.78rem',
                          cursor: 'pointer'
                        }}
                      >
                        {m.label}
                      </div>
                    ))}
                  </div>

                  <div style={{ padding: '14px', borderRadius: '2px', backgroundColor: '#f4f4f4', border: '1px solid #e5e5e5', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                    {paymentMethod === 'BCA' && 'REK BCA: 873-092-1122 A/N PT TOKO BAROKAH SHOES'}
                    {paymentMethod === 'MANDIRI' && 'REK MANDIRI: 124-00-9876543-1 A/N PT TOKO BAROKAH SHOES'}
                    {paymentMethod === 'BRI' && 'REK BRI: 0123-01-002345-50-8 A/N PT TOKO BAROKAH SHOES'}
                    {paymentMethod === 'QRIS' && 'KODE QRIS GENERATOR AKAN DITAMPILKAN DI HALAMAN ORDER'}
                    {paymentMethod === 'COD' && 'SIAPKAN DANA TUNAI PAS SAAT PAKET SEPATU TIBA DARI KURIR'}
                  </div>
                </div>

                {/* Final Order Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-accent btn-lg"
                  style={{ width: '100%', padding: '16px' }}
                >
                  {isSubmitting ? 'MEMPROSES PESANAN...' : 'BUAT PESANAN SEKARANG'}
                  {!isSubmitting && <ArrowRight size={18} />}
                </button>
              </form>
            )}

          </div>

          {/* Right Column: Order Summary (ALWAYS VISIBLE & PRESERVED) */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '4px',
            padding: '28px',
            border: '1px solid #e5e5e5',
            position: 'sticky',
            top: '90px'
          }}>
            {/* Safety Notice Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#f3f0eb',
              padding: '10px 14px',
              borderRadius: '2px',
              marginBottom: '18px',
              fontSize: '0.78rem',
              fontFamily: 'var(--font-mono)',
              color: '#080808',
              fontWeight: '700'
            }}>
              <CheckCircle2 size={16} color="#080808" />
              <span>ITEM TERSIMPAN: {totalItems} PASANG SEPATU</span>
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: '900', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid #e5e5e5', textTransform: 'uppercase' }}>
              RINCIAN ITEM SILHOUETTES
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              {cartItems.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <img 
                    src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff'} 
                    alt={item.product.name}
                    style={{ width: '54px', height: '54px', borderRadius: '2px', objectFit: 'cover', backgroundColor: '#f4f4f4' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '800', fontSize: '0.85rem' }}>{item.product.name}</div>
                    <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#666666' }}>EU {item.variant.size} × {item.quantity} PAIRS</div>
                  </div>
                  <div style={{ fontWeight: '800', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
                    {formatIDR(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            {/* Voucher / Promo Code Box */}
            <div style={{
              padding: '18px 0',
              borderTop: '1px solid #e5e5e5',
              borderBottom: '1px solid #e5e5e5',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Tag size={16} color="#080808" />
                <span style={{ fontSize: '0.85rem', fontWeight: '800', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                  KODE VOUCHER / PROMO
                </span>
              </div>

              {appliedCoupon ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  padding: '10px 14px',
                  borderRadius: '3px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Check size={14} />
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', fontSize: '0.88rem', color: '#166534' }}>
                        {appliedCoupon.code}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#15803d' }}>
                        Diskon {appliedCoupon.discountPercent}% aktif (-{formatIDR(discountAmount)})
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      color: '#dc2626',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: '700'
                    }}
                    title="Hapus Voucher"
                  >
                    <X size={14} /> HAPUS
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="CONTOH: BAROKAH10"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyCoupon();
                        }
                      }}
                      style={{
                        flex: 1,
                        textTransform: 'uppercase',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.82rem',
                        padding: '10px 12px'
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="btn btn-dark"
                      style={{
                        padding: '10px 16px',
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-mono)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      GUNAKAN
                    </button>
                  </div>
                  {/* Quick Loyalty 30% Voucher recommendation if unlocked */}
                  {userLoyaltyVoucher && !userLoyaltyVoucher.is_used && (
                    <div style={{
                      marginTop: '12px',
                      padding: '12px 14px',
                      borderRadius: '6px',
                      backgroundColor: '#080808',
                      color: '#ffffff',
                      border: '1px solid #b7d600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Gift size={18} color="#b7d600" />
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '900', fontFamily: 'var(--font-heading)', color: '#b7d600', textTransform: 'uppercase' }}>
                            VOUCHER 30% LOYALITAS TERSEDIA!
                          </div>
                          <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#cbd5e1' }}>
                            {userLoyaltyVoucher.voucher_code} (1x pakai)
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCouponCode(userLoyaltyVoucher.voucher_code);
                          setAppliedCoupon({
                            code: userLoyaltyVoucher.voucher_code,
                            discountPercent: userLoyaltyVoucher.discount_percent || 30,
                            description: userLoyaltyVoucher.description || 'Voucher Loyalitas 10 Sepatu (Diskon 30%)',
                            isLoyalty: true
                          });
                          toast.success(`Voucher Loyalitas ${userLoyaltyVoucher.voucher_code} (-30%) berhasil diterapkan!`);
                        }}
                        style={{
                          backgroundColor: '#b7d600',
                          color: '#080808',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '6px 12px',
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: '900',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        PAKAI 30%
                      </button>
                    </div>
                  )}

                  {/* BAROKAH10 promo: show used status or claim button */}
                  {barokahUsed ? (
                    <div style={{
                      marginTop: '10px',
                      padding: '10px 12px',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <X size={14} color="#dc2626" />
                        <span style={{ fontSize: '0.72rem', color: '#dc2626', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                          Kode BAROKAH10 sudah digunakan.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowUsedModal(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#080808',
                          textDecoration: 'underline',
                          fontSize: '0.72rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: '800',
                          cursor: 'pointer',
                          padding: 0,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Dapatkan Kode Lain
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#666666' }}>
                        Punya voucher member baru?
                      </span>
                      <button
                        type="button"
                        disabled={isValidatingCoupon}
                        onClick={async () => {
                          if (!user || (!user.email && !user.id)) {
                            toast.error('Silakan login terlebih dahulu untuk menggunakan kode promo BAROKAH10.');
                            return;
                          }
                          setIsValidatingCoupon(true);
                          try {
                            const res = await validateVoucher('BAROKAH10', user);
                            if (!res.valid) {
                              if (res.isAlreadyUsed) {
                                setBarokahUsed(true);
                                setUsedModalInfo(res.existingUsage);
                                setShowUsedModal(true);
                              }
                              toast.error(res.error || 'Kode promo tidak valid');
                              return;
                            }
                            setCouponCode('BAROKAH10');
                            setAppliedCoupon({ code: 'BAROKAH10', discountPercent: 10, description: res.description });
                            toast.success('Voucher BAROKAH10 berhasil diterapkan! Potongan 10%');
                          } catch (err) {
                            toast.error('Gagal memvalidasi voucher');
                          } finally {
                            setIsValidatingCoupon(false);
                          }
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#080808',
                          textDecoration: 'underline',
                          fontSize: '0.72rem',
                          cursor: isValidatingCoupon ? 'wait' : 'pointer',
                          fontWeight: '700',
                          fontFamily: 'var(--font-mono)',
                          opacity: isValidatingCoupon ? 0.5 : 1
                        }}
                      >
                        {isValidatingCoupon ? 'Memeriksa...' : 'Klaim BAROKAH10'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666666' }}>
                <span>SUBTOTAL PRODUK</span>
                <span style={{ color: '#080808', fontWeight: '700' }}>{formatIDR(cartTotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  color: '#15803d',
                  fontWeight: '800',
                  backgroundColor: '#f0fdf4',
                  padding: '8px 10px',
                  borderRadius: '2px',
                  border: '1px solid #bbf7d0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Tag size={13} color="#15803d" />
                    <span>POTONGAN VOUCHER (10%)</span>
                  </div>
                  <span>- {formatIDR(discountAmount)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666666' }}>
                <span>SHIPPING LOGISTICS</span>
                <span style={{ color: '#080808', fontWeight: '700' }}>{formatIDR(shippingFee)}</span>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '14px',
                borderTop: '1px solid #e5e5e5',
                fontSize: '1.25rem',
                fontWeight: '900',
                color: '#080808'
              }}>
                <span>TOTAL PEMBAYARAN</span>
                <span>{formatIDR(grandTotal)}</span>
              </div>
            </div>

            {!user && (
              <div style={{
                marginTop: '20px',
                padding: '12px',
                borderRadius: '2px',
                backgroundColor: '#f4f4f4',
                fontSize: '0.75rem',
                color: '#666666',
                lineHeight: '1.4'
              }}>
                ℹ️ <em>Silakan selesaikan form pendaftaran di sebelah kiri. Setelah akun Anda aktif, tombol konfirmasi pesanan akan segera terbuka.</em>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Pop-up Modal when BAROKAH10 is already used */}
      <VoucherUsedModal
        isOpen={showUsedModal}
        onClose={() => setShowUsedModal(false)}
        voucherCode="BAROKAH10"
        usedInfo={usedModalInfo}
      />
    </div>
  );
};
