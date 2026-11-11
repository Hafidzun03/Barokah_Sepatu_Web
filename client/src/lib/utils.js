// Format currency to IDR (Rupiah)
export const formatIDR = (amount) => {
  if (amount === undefined || amount === null) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Format Date to Indonesian format
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Order Status translation and badge colors
export const getOrderStatusInfo = (status) => {
  switch (status) {
    case 'menunggu_pembayaran':
      return { label: 'Menunggu Pembayaran', color: 'bg-amber-100 text-amber-800 border-amber-200', bg: '#FEF3C7', textColor: '#B45309' };
    case 'menunggu_konfirmasi':
      return { label: 'Menunggu Konfirmasi', color: 'bg-blue-100 text-blue-800 border-blue-200', bg: '#EFF6FF', textColor: '#1D4ED8' };
    case 'diproses':
      return { label: 'Diproses Toko', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', bg: '#EEF2FF', textColor: '#4338CA' };
    case 'dikirim':
      return { label: 'Dalam Pengiriman', color: 'bg-purple-100 text-purple-800 border-purple-200', bg: '#F5F3FF', textColor: '#7C3AED' };
    case 'selesai':
      return { label: 'Selesai', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', bg: '#ECFDF5', textColor: '#047857' };
    case 'dibatalkan':
      return { label: 'Dibatalkan', color: 'bg-rose-100 text-rose-800 border-rose-200', bg: '#FFF1F2', textColor: '#BE123C' };
    default:
      return { label: status || '-', color: 'bg-gray-100 text-gray-800 border-gray-200', bg: '#F8FAFC', textColor: '#64748B' };
  }
};

// Generate slug
export const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};
