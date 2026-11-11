// ============================================================
// TOKO BAROKAH: EXPEDITION COURIERS & AUTOMATED DELIVERY SYSTEM
// Higher courier fee = faster arrival speed.
// Automatic transition to 'selesai' upon delivery deadline arrival.
// ============================================================

import { supabase, getAdminClient } from './supabase';

export const COURIER_OPTIONS = [
  {
    id: 'instant',
    name: 'Grab/Gojek Instant Express',
    fee: 35000,
    etaText: '2 Jam (Super Cepat)',
    durationHours: 2,
    durationMinutes: 120, // 2 Jam
    tag: 'SUPER CEPAT',
    tagColor: '#b7d600',
    tagText: '#080808',
    description: 'Pengiriman instan langsung sampai dalam 1 - 2 jam.'
  },
  {
    id: 'sicepat',
    name: 'SiCepat BEST (Next Day)',
    fee: 28000,
    etaText: '12 Jam (Kilat Sameday)',
    durationHours: 12,
    durationMinutes: 720, // 12 Jam
    tag: 'KILAT',
    tagColor: '#3b82f6',
    tagText: '#ffffff',
    description: 'Pengiriman prioritas kilat tiba dalam 12 jam.'
  },
  {
    id: 'jnt',
    name: 'J&T Express Super',
    fee: 24000,
    etaText: '24 Jam (1 Hari)',
    durationHours: 24,
    durationMinutes: 1440, // 24 Jam
    tag: 'EXPRESS',
    tagColor: '#f97316',
    tagText: '#ffffff',
    description: 'Pengiriman express terpercaya tiba dalam 24 jam.'
  },
  {
    id: 'jne',
    name: 'JNE Reguler Standard',
    fee: 22000,
    etaText: '48 Jam (2 Hari)',
    durationHours: 48,
    durationMinutes: 2880, // 48 Jam
    tag: 'REGULER',
    tagColor: '#6b7280',
    tagText: '#ffffff',
    description: 'Pengiriman reguler standar tiba dalam 48 jam.'
  }
];

// Helper: Match courier configuration by name or shipping cost
export const getCourierConfig = (courierName = '', shippingCost = 0) => {
  const norm = (courierName || '').toLowerCase();

  if (norm.includes('instant') || norm.includes('grab') || norm.includes('gojek') || Number(shippingCost) >= 35000) {
    return COURIER_OPTIONS[0]; // Instant (2 Jam)
  }
  if (norm.includes('sicepat') || norm.includes('best') || norm.includes('yes') || norm.includes('next day') || Number(shippingCost) >= 28000) {
    return COURIER_OPTIONS[1]; // SiCepat BEST (12 Jam)
  }
  if (norm.includes('j&t') || norm.includes('jnt') || Number(shippingCost) >= 24000) {
    return COURIER_OPTIONS[2]; // J&T Express (24 Jam)
  }
  return COURIER_OPTIONS[3]; // JNE Reguler (48 Jam)
};

// Calculate delivery deadline timestamp
export const calculateDeliveryDeadline = (shippedAt, courierName, shippingCost) => {
  if (!shippedAt) return null;
  const config = getCourierConfig(courierName, shippingCost);
  const startTime = new Date(shippedAt).getTime();
  if (isNaN(startTime)) return null;

  const deadlineTime = startTime + (config.durationMinutes * 60 * 1000);
  return new Date(deadlineTime);
};

// Calculate countdown details: remaining hours, minutes, seconds, percentage, and expiration flag
export const getDeliveryCountdown = (shippedAt, courierName, shippingCost) => {
  const deadline = calculateDeliveryDeadline(shippedAt, courierName, shippingCost);
  const config = getCourierConfig(courierName, shippingCost);

  if (!deadline || !shippedAt) {
    return {
      isExpired: false,
      hours: config.durationHours,
      minutes: 0,
      seconds: 0,
      totalSecondsLeft: config.durationMinutes * 60,
      formattedCountdown: `${String(config.durationHours).padStart(2, '0')}:00:00`,
      percentElapsed: 0,
      deadlineText: `${config.etaText}`,
      courierConfig: config
    };
  }

  const now = Date.now();
  const startTime = new Date(shippedAt).getTime();
  const totalDurationMs = Math.max(1000, deadline.getTime() - startTime);
  const msLeft = deadline.getTime() - now;

  if (msLeft <= 0) {
    return {
      isExpired: true,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalSecondsLeft: 0,
      formattedCountdown: '00:00:00',
      percentElapsed: 100,
      deadlineText: deadline.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' +
        deadline.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      courierConfig: config
    };
  }

  const totalSecondsLeft = Math.floor(msLeft / 1000);
  const hours = Math.floor(totalSecondsLeft / 3600);
  const minutes = Math.floor((totalSecondsLeft % 3600) / 60);
  const seconds = totalSecondsLeft % 60;

  const pad = (n) => String(n).padStart(2, '0');
  const formattedCountdown = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  const elapsedMs = Math.max(0, now - startTime);
  const percentElapsed = Math.min(100, Math.max(0, Math.round((elapsedMs / totalDurationMs) * 100)));

  return {
    isExpired: false,
    hours,
    minutes,
    seconds,
    totalSecondsLeft,
    formattedCountdown,
    percentElapsed,
    deadlineText: deadline.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ', ' +
      deadline.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
    courierConfig: config
  };
};

// Auto-complete order when delivery deadline has expired or when user confirms
export const autoCompleteOrder = async (orderId, explicitDate = null) => {
  if (!orderId) return false;
  try {
    const adminDb = (await getAdminClient()) || supabase;
    const completedAt = explicitDate ? new Date(explicitDate).toISOString() : new Date().toISOString();

    const { error } = await adminDb
      .from('orders')
      .update({
        order_status: 'selesai',
        completed_at: completedAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) {
      console.warn('autoCompleteOrder error on orders table:', error);
      return false;
    }

    // Synchronize localStorage
    try {
      const savedOrders = JSON.parse(localStorage.getItem('barokah_orders') || '[]');
      const updated = savedOrders.map(o => {
        if (o.id === orderId || o.order_number === orderId) {
          return { ...o, status: 'selesai', order_status: 'selesai', completed_at: completedAt };
        }
        return o;
      });
      localStorage.setItem('barokah_orders', JSON.stringify(updated));
    } catch (e) {}

    // Dispatch global event for live reactivity
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('barokah:order_completed', { detail: { orderId } }));
    }
    return true;
  } catch (err) {
    console.error('autoCompleteOrder exception:', err);
    return false;
  }
};
