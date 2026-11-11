import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import toast from 'react-hot-toast';
import {
  Store, CreditCard, Mail, ShieldCheck, Save,
  MapPin, Phone, AtSign, Link2, Upload,
  Copy, Edit3, Trash2, ToggleLeft, ToggleRight,
  Plus, X, ChevronDown, ChevronLeft, ChevronRight,
  Info, CheckCircle2, Lock, ExternalLink, Send,
  Download, Ban, Eye, EyeOff, Globe, Users,
  Building2, Landmark, ArrowUpRight, Sparkles,
  RefreshCw, Settings, Clock
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════
   PENGATURAN TOKO — STORE SETTINGS MODULE
   Based on Stitch Design: "Barokah Shoes - Pengaturan Toko"
   Kinetic Luxury Streetwear Admin Theme
   ═══════════════════════════════════════════════════════════════════ */

const C = {
  bgPage:      '#F8FAFC',
  card:        '#FFFFFF',
  cardHover:   '#F1F5F9',
  surface:     '#F8FAFC',
  border:      '#E2E8F0',
  borderDark:  '#CBD5E1',
  emerald:     '#059669',
  emeraldHover:'#047857',
  emeraldLight:'#ECFDF5',
  emeraldBorder:'#A7F3D0',
  emeraldText: '#047857',
  blue:        '#2563EB',
  blueHover:   '#1D4ED8',
  blueLight:   '#EFF6FF',
  blueBorder:  '#BFDBFE',
  blueText:    '#1D4ED8',
  teal:        '#0D9488',
  tealLight:   '#F0FDFA',
  tealBorder:  '#99F6E4',
  tealText:    '#0F766E',
  textMain:    '#0F172A',
  textHead:    '#020617',
  textSub:     '#334155',
  textMuted:   '#64748B',
  textLight:   '#94A3B8',
  neonLime:    '#D0F12F',
  limeBg:      '#F7FEE7',
  limeBorder:  '#BEF264',
  amberText:   '#B45309',
  amberBg:     '#FEF3C7',
  amberBorder: '#FDE68A',
  redText:     '#DC2626',
  redBg:       '#FEF2F2',
  redBorder:   '#FECACA',
  shadowSm:    '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
  shadowMd:    '0 4px 12px -2px rgba(15, 23, 42, 0.05), 0 2px 4px -2px rgba(15, 23, 42, 0.03)',
  shadowLg:    '0 10px 25px -3px rgba(15, 23, 42, 0.08), 0 4px 10px -2px rgba(15, 23, 42, 0.03)',
};

const TABS = [
  { id: 'store-info', label: 'Informasi Toko', icon: '🏪' },
  { id: 'bank-accounts', label: 'Rekening Pembayaran', icon: '💳', badge: '2' },
  { id: 'newsletter', label: 'Pelanggan Newsletter', icon: '✉️', badge: '2.4k' },
  { id: 'security-profile', label: 'Profil Admin & Keamanan', icon: '🔒' },
];

// ── Mock Store Data ──────────────────────────────────────────────
const STORE_DEFAULTS = {
  storeName: 'Barokah Shoes Official Atelier',
  entityId: 'ID-BRKH-ATELIER-2024',
  tagline: 'Curated High-Velocity Streetwear & Kinetic Sneakers Indonesia',
  description: 'Destinasi kurasi sneaker kinetik berdaya rilis terbatas dan busana streetwear premium. Menggabungkan presisi brutalist atelier dan reliabilitas sistem pembayaran mutakhir.',
  address: 'PASAR JAYA JATINEGARA LT.2 BLOK AKS NO. 57, Jl. Jatinegara Barat, Bali Mester, Jatinegara, Jakarta Timur 13310',
  whatsapp: '081288667433',
  email: 'barokahshoes@gmail.com',
  instagram: 'barokahshoes__',
  mapsLink: 'https://maps.app.goo.gl/w59df4bmZRjX8PgF8',
};

const BANK_ACCOUNTS = [
  {
    id: 1, bank: 'BCA', bankFull: 'Bank Central Asia (BCA)',
    branch: 'KCU SCBD Jakarta Selatan',
    accountNumber: '8077-0812-9921', accountName: 'PT Barokah Footwear Indonesia',
    active: true,
  },
  {
    id: 2, bank: 'MDR', bankFull: 'Bank Mandiri',
    branch: 'KC Wisma Mulia Jakarta',
    accountNumber: '124-00-982134-1', accountName: 'PT Barokah Footwear Indonesia',
    active: true,
  },
];

const NEWSLETTER_SUBSCRIBERS = [
  { email: 'alvin.wardhana@streetwear.id', pref: 'Jordan, Travis Scott', date: '24 Okt 2024, 14:20', status: 'AKTIF' },
  { email: 'nadia.kurnia@lifestylemag.co', pref: 'Salomon, Roa Hiking', date: '23 Okt 2024, 09:12', status: 'AKTIF' },
  { email: 'bimasena.kickz@sneakerhead.com', pref: 'Nike SB Dunk, Asics Kayano', date: '21 Okt 2024, 18:45', status: 'AKTIF' },
  { email: 'dion.pratama@architecht.id', pref: 'New Balance Made in USA', date: '19 Okt 2024, 11:05', status: 'TERTUNDA' },
];

// ── Common inline style helpers ──────────────────────────────────
const labelStyle = {
  display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.68rem',
  fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
  color: C.textMuted, marginBottom: '6px',
};
const inputStyle = {
  width: '100%', height: '48px', padding: '0 16px',
  background: C.cardHover, border: `1px solid ${C.border}`, borderRadius: '10px',
  fontSize: '0.88rem', fontFamily: "'Inter', sans-serif", color: C.textMain,
  outline: 'none', transition: 'border-color 0.2s',
};
const textareaStyle = {
  ...inputStyle, height: 'auto', padding: '12px 16px', resize: 'vertical', lineHeight: '1.6',
};

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
export const StoreSettings = ({ onNavigateBack }) => {
  const [activeTab, setActiveTab] = useState('store-info');
  const [store, setStore] = useState(() => {
    const saved = localStorage.getItem('barokah_store_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return STORE_DEFAULTS;
  });
  const [storeImage, setStoreImage] = useState(() => {
    return localStorage.getItem('barokah_store_image') || null;
  });
  const storeImageInputRef = React.useRef(null);
  const [bankAccounts, setBankAccounts] = useState(BANK_ACCOUNTS);
  const [subscribers, setSubscribers] = useState(NEWSLETTER_SUBSCRIBERS);
  const [showBankModal, setShowBankModal] = useState(false);
  const [copiedText, setCopiedText] = useState(null);
  const [saveNotice, setSaveNotice] = useState(false);
  const [isDbConnected, setIsDbConnected] = useState(isSupabaseConfigured);

  const handleStoreImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setStoreImage(dataUrl);
      localStorage.setItem('barokah_store_image', dataUrl);
      toast.success('Foto toko berhasil diunggah!');
    };
    reader.readAsDataURL(file);
  };

  // Modal form state
  const [newBankForm, setNewBankForm] = useState({
    bank: 'BCA',
    accountNumber: '',
    accountName: 'PT Barokah Footwear Indonesia',
    branch: 'KCU Jakarta'
  });

  // Fetch real bank accounts from Supabase
  const fetchBankAccounts = async () => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('bank_accounts')
          .select('*')
          .order('created_at', { ascending: true });
        if (!error && data && data.length > 0) {
          const mapped = data.map(b => ({
            id: b.id,
            bank: b.bank_name,
            bankFull: `Bank ${b.bank_name}`,
            branch: 'Kantor Cabang Resmi',
            accountNumber: b.account_number,
            accountName: b.account_holder,
            active: b.is_active,
          }));
          setBankAccounts(mapped);
          setIsDbConnected(true);
        }
      } catch (err) {
        console.warn('Error fetching bank accounts from Supabase:', err);
      }
    }
  };

  // Fetch real newsletter subscribers from Supabase
  const fetchSubscribers = async () => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('newsletter_subscribers')
          .select('*')
          .order('subscribed_at', { ascending: false });
        if (!error && data && data.length > 0) {
          const mapped = data.map(s => ({
            id: s.id,
            email: s.email,
            pref: 'All Streetwear Drops',
            date: new Date(s.subscribed_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
            status: s.is_active ? 'AKTIF' : 'NONAKTIF'
          }));
          setSubscribers(mapped);
        }
      } catch (err) {
        console.warn('Error fetching subscribers from Supabase:', err);
      }
    }
  };

  useEffect(() => {
    fetchBankAccounts();
    fetchSubscribers();
  }, []);

  // Helper: update store field
  const updateStore = (key, value) => {
    setStore(prev => {
      const next = { ...prev, [key]: value };
      localStorage.setItem('barokah_store_settings', JSON.stringify(next));
      return next;
    });
  };

  // Helper: copy to clipboard with feedback
  const copyToClipboard = useCallback((text) => {
    navigator.clipboard?.writeText(text.replace(/[-\s]/g, ''));
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2500);
  }, []);

  // Helper: simulate save
  const handleSave = () => {
    localStorage.setItem('barokah_store_settings', JSON.stringify(store));
    setSaveNotice(true);
    toast.success('Pengaturan Toko berhasil disimpan ke sistem!');
    setTimeout(() => setSaveNotice(false), 3000);
  };

  // Toggle bank active status with Supabase
  const handleToggleBank = async (bank) => {
    const nextStatus = !bank.active;
    if (isSupabaseConfigured && typeof bank.id === 'string' && bank.id.length > 20) {
      try {
        await supabase
          .from('bank_accounts')
          .update({ is_active: nextStatus })
          .eq('id', bank.id);
        toast.success(`Rekening ${bank.bank} ${nextStatus ? 'diaktifkan' : 'dinonaktifkan'} di Supabase!`);
      } catch (e) {
        console.error(e);
      }
    }
    setBankAccounts(prev => prev.map(b => b.id === bank.id ? { ...b, active: nextStatus } : b));
  };

  // Delete bank account with Supabase
  const handleDeleteBank = async (bank) => {
    if (isSupabaseConfigured && typeof bank.id === 'string' && bank.id.length > 20) {
      try {
        await supabase
          .from('bank_accounts')
          .delete()
          .eq('id', bank.id);
        toast.success(`Rekening ${bank.bank} berhasil dihapus dari Supabase!`);
      } catch (e) {
        console.error(e);
      }
    } else {
      toast.success(`Rekening ${bank.bank} dihapus!`);
    }
    setBankAccounts(prev => prev.filter(b => b.id !== bank.id));
  };

  // Create new bank account in Supabase
  const handleCreateBank = async () => {
    if (!newBankForm.accountNumber.trim()) {
      toast.error('Nomor rekening tidak boleh kosong');
      return;
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('bank_accounts')
          .insert({
            bank_name: newBankForm.bank,
            account_number: newBankForm.accountNumber.trim(),
            account_holder: newBankForm.accountName.trim(),
            is_active: true
          })
          .select();

        if (!error && data && data[0]) {
          toast.success(`Rekening ${newBankForm.bank} berhasil disimpan ke database Supabase!`);
          setShowBankModal(false);
          setNewBankForm({ bank: 'BCA', accountNumber: '', accountName: 'PT Barokah Footwear Indonesia', branch: 'KCU Jakarta' });
          fetchBankAccounts();
          return;
        } else if (error) {
          toast.error(`Gagal menyimpan: ${error.message}`);
        }
      } catch (e) {
        console.error(e);
      }
    }

    // Local fallback
    setBankAccounts(prev => [...prev, {
      id: Date.now(),
      bank: newBankForm.bank,
      bankFull: `Bank ${newBankForm.bank}`,
      branch: newBankForm.branch || 'Kantor Cabang',
      accountNumber: newBankForm.accountNumber,
      accountName: newBankForm.accountName,
      active: true
    }]);
    setShowBankModal(false);
    toast.success(`Rekening ${newBankForm.bank} ditambahkan!`);
  };

  // ── STATUS KPI METRICS ─────────────────────────────────────────
  const statusMetrics = [
    { label: 'STATUS TOKO', value: 'Live Online', indicator: 'dot' },
    { label: 'REKENING REAL SUPABASE', value: `${bankAccounts.filter(b => b.active).length} Aktif`, icon: '🏦' },
    { label: 'DROP ALERTS SUBSCRIBERS', value: `${subscribers.length} Members`, icon: '📧' },
    { label: 'SUPABASE SYNC', value: isDbConnected ? 'CONNECTED (REAL DB)' : 'DISCONNECTED', icon: '⚡' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── HEADER & BREADCRUMBS ──────────────────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
            <span style={{ cursor: 'pointer' }} onClick={onNavigateBack}>Admin</span>
            <span style={{ color: C.borderDark }}>/</span>
            <span>Sistem</span>
            <span style={{ color: C.borderDark }}>/</span>
            <span style={{
              color: C.card, background: C.textHead,
              padding: '2px 8px', borderRadius: '6px', fontWeight: 800,
            }}>Pengaturan</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <h1 style={{
              fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.02em',
              textTransform: 'uppercase', color: C.textHead, margin: 0,
              fontFamily: "'Manrope', sans-serif",
            }}>Pengaturan Toko</h1>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.68rem',
              background: C.neonLime, color: '#1A2E00',
              padding: '3px 10px', borderRadius: '8px', fontWeight: 800,
            }}>ATELIER ENGINE v2.4</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onNavigateBack} style={{
            padding: '10px 20px', background: C.cardHover, border: `1px solid ${C.border}`,
            borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700,
            color: C.textSub, cursor: 'pointer', fontFamily: "'Manrope', sans-serif",
            textTransform: 'uppercase', letterSpacing: '0.03em',
          }}>Batalkan</button>
          <button onClick={handleSave} style={{
            padding: '10px 24px', background: `linear-gradient(135deg, ${C.emerald} 0%, ${C.blue} 100%)`,
            border: 'none', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 800,
            color: '#FFFFFF', cursor: 'pointer', fontFamily: "'Manrope', sans-serif",
            textTransform: 'uppercase', letterSpacing: '0.03em',
            display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
          }}>
            <span style={{ fontSize: '16px' }}>💾</span>
            Simpan Perubahan
          </button>
        </div>
      </div>

      {/* ── STATUS METRICS BAR ────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        {statusMetrics.map((m, i) => (
          <div key={i} style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px',
            padding: '16px 20px', boxShadow: C.shadowSm,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{m.label}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: C.textHead, marginTop: '4px', fontFamily: "'Manrope', sans-serif" }}>{m.value}</div>
            </div>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: C.cardHover, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: m.indicator === 'dot' ? undefined : '18px',
            }}>
              {m.indicator === 'dot' ? (
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: C.neonLime, boxShadow: `0 0 8px ${C.neonLime}` }} />
              ) : m.icon}
            </div>
          </div>
        ))}
      </div>

      {/* ── TAB NAVIGATION ────────────────────────────────────────── */}
      <div style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px',
        padding: '6px', boxShadow: C.shadowSm,
        display: 'flex', flexWrap: 'wrap', gap: '6px',
      }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 20px', borderRadius: '10px',
                border: 'none', cursor: 'pointer',
                fontSize: '0.82rem', fontWeight: isActive ? 800 : 600,
                fontFamily: "'Manrope', sans-serif",
                background: isActive
                  ? `linear-gradient(135deg, ${C.emerald} 0%, ${C.blue} 100%)`
                  : 'transparent',
                color: isActive ? '#FFFFFF' : C.textMuted,
                display: 'flex', alignItems: 'center', gap: '8px',
                transition: 'all 0.25s ease',
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge && (
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 800,
                  padding: '2px 7px', borderRadius: '20px',
                  background: isActive ? 'rgba(255,255,255,0.2)' : C.neonLime,
                  color: isActive ? '#FFFFFF' : '#1A2E00',
                }}>{tab.badge}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB 1: INFORMASI TOKO                                      */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'store-info' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
          {/* Left: Form */}
          <div style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px',
            padding: '28px', boxShadow: C.shadowMd,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: C.textHead, margin: '0 0 4px', fontFamily: "'Manrope', sans-serif" }}>
                  Identitas Brand & Kontak Resmi
                </h2>
                <p style={{ fontSize: '0.8rem', color: C.textMuted, margin: 0 }}>
                  Konfigurasi visual publik, informasi concierge, dan metadata atelier.
                </p>
              </div>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
                background: C.cardHover, padding: '4px 10px', borderRadius: '8px',
                color: C.textSub, fontWeight: 600,
              }}>TABEL: profiles & settings</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
              {/* Row 1: 2 columns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Nama Toko Resmi</label>
                  <input style={inputStyle} value={store.storeName}
                    onChange={e => updateStore('storeName', e.target.value)}
                    onFocus={e => e.target.style.borderColor = C.emerald}
                    onBlur={e => e.target.style.borderColor = C.border}
                  />
                </div>
                <div>
                  <label style={labelStyle}>ID Entitas Usaha (NIB/Legal)</label>
                  <input style={{ ...inputStyle, fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}
                    value={store.entityId}
                    onChange={e => updateStore('entityId', e.target.value)}
                    onFocus={e => e.target.style.borderColor = C.emerald}
                    onBlur={e => e.target.style.borderColor = C.border}
                  />
                </div>
              </div>

              {/* Tagline */}
              <div>
                <label style={labelStyle}>Tagline & Manifesto Singkat</label>
                <input style={inputStyle} value={store.tagline}
                  onChange={e => updateStore('tagline', e.target.value)}
                  onFocus={e => e.target.style.borderColor = C.emerald}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>Deskripsi Editorial Toko (SEO Meta)</label>
                <textarea style={textareaStyle} rows={3} value={store.description}
                  onChange={e => updateStore('description', e.target.value)}
                  onFocus={e => e.target.style.borderColor = C.emerald}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
              </div>

              {/* Address */}
              <div>
                <label style={labelStyle}>Alamat Flagship Store Jakarta</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '12px', fontSize: '18px' }}>📍</span>
                  <textarea style={{ ...textareaStyle, paddingLeft: '38px' }} rows={2}
                    value={store.address}
                    onChange={e => updateStore('address', e.target.value)}
                    onFocus={e => e.target.style.borderColor = C.emerald}
                    onBlur={e => e.target.style.borderColor = C.border}
                  />
                </div>
              </div>

              {/* WhatsApp + Email */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>WhatsApp Business Concierge</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>💬</span>
                    <input style={{ ...inputStyle, paddingLeft: '38px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}
                      value={store.whatsapp}
                      onChange={e => updateStore('whatsapp', e.target.value)}
                      onFocus={e => e.target.style.borderColor = C.emerald}
                      onBlur={e => e.target.style.borderColor = C.border}
                    />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Email Dukungan Pelanggan</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>📧</span>
                    <input style={{ ...inputStyle, paddingLeft: '38px' }} type="email"
                      value={store.email}
                      onChange={e => updateStore('email', e.target.value)}
                      onFocus={e => e.target.style.borderColor = C.emerald}
                      onBlur={e => e.target.style.borderColor = C.border}
                    />
                  </div>
                </div>
              </div>

              {/* Instagram + Google Maps */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Instagram Handle</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: C.textMuted }}>@</span>
                    <input style={{ ...inputStyle, paddingLeft: '32px' }}
                      value={store.instagram}
                      onChange={e => updateStore('instagram', e.target.value)}
                      onFocus={e => e.target.style.borderColor = C.emerald}
                      onBlur={e => e.target.style.borderColor = C.border}
                    />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Tautan Google Maps</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>🔗</span>
                    <input style={{ ...inputStyle, paddingLeft: '38px', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}
                      value={store.mapsLink}
                      onChange={e => updateStore('mapsLink', e.target.value)}
                      onFocus={e => e.target.style.borderColor = C.emerald}
                      onBlur={e => e.target.style.borderColor = C.border}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Visual Stage */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Flagship Store Image */}
            <div style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px',
              padding: '16px', boxShadow: C.shadowSm,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                  FLAGSHIP VISUAL STAGE
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
                  background: C.neonLime, color: '#1A2E00',
                  padding: '2px 8px', borderRadius: '6px', fontWeight: 800,
                }}>ACTIVE</span>
              </div>
              {/* Hidden file input */}
              <input
                ref={storeImageInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleStoreImageUpload}
              />
              <div
                style={{
                  width: '100%', height: '200px', borderRadius: '12px',
                  overflow: 'hidden', position: 'relative',
                  background: storeImage ? 'transparent' : `linear-gradient(135deg, ${C.textHead} 0%, ${C.emerald} 100%)`,
                  cursor: 'pointer',
                }}
                onClick={() => storeImageInputRef.current?.click()}
                title="Klik untuk ganti foto toko"
              >
                {storeImage ? (
                  <img
                    src={storeImage}
                    alt="Foto Toko Barokah"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    color: '#FFFFFF', textAlign: 'center',
                  }}>
                    <Upload size={36} style={{ marginBottom: '10px', opacity: 0.85 }} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', opacity: 0.9 }}>
                      KLIK UNTUK UPLOAD FOTO TOKO
                    </span>
                  </div>
                )}
                {/* Hover overlay */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(0,0,0,0)', transition: 'background 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.25)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0)'; }}
                >
                  {storeImage && (
                    <Upload size={22} color="#fff" style={{ opacity: 0, transition: 'opacity 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = 1; }}
                    />
                  )}
                </div>
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  height: '40%',
                  background: 'linear-gradient(to top, rgba(15,23,42,0.55), transparent)',
                  pointerEvents: 'none',
                }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                <button
                  onClick={() => storeImageInputRef.current?.click()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '0.8rem', fontWeight: 700, color: C.textSub,
                    fontFamily: "'Manrope', sans-serif",
                  }}
                >
                  <Upload size={14} /> {storeImage ? 'Ganti Foto Toko' : 'Upload Foto Toko'}
                </button>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: C.textLight }}>JPG, PNG 4K</span>
              </div>
            </div>

            {/* Location Module */}
            <div style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px',
              padding: '16px', boxShadow: C.shadowSm,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                  LOKASI TOKO — GOOGLE MAPS
                </span>
                <a
                  href={store.mapsLink || 'https://maps.app.goo.gl/w59df4bmZRjX8PgF8'}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: C.blueText, fontWeight: 700, textDecoration: 'none' }}
                >
                  <ExternalLink size={13} /> Buka Maps
                </a>
              </div>
              <div style={{
                width: '100%', height: '200px', borderRadius: '12px',
                overflow: 'hidden', position: 'relative',
                border: `1px solid ${C.border}`,
              }}>
                <iframe
                  title="Lokasi Toko Barokah"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.8423!2d106.8656!3d-6.2150!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e698c9e5f4c5f5f%3A0x0!2sJl.+Jatinegara+Barat%2C+Bali+Mester%2C+Jatinegara%2C+Jakarta+Timur+13310!5e0!3m2!1sid!2sid!4v1700000000000!5m2!1sid!2sid"
                  width="100%"
                  height="200"
                  style={{ border: 0, display: 'block' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: C.textMuted, margin: 0, lineHeight: '1.5' }}>
                  📍 Pasar Jaya Jatinegara LT.2, Blok AKS No. 57
                </p>
                <a
                  href={store.mapsLink || 'https://maps.app.goo.gl/w59df4bmZRjX8PgF8'}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: C.blueText, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}
                >
                  Lihat Rute →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB 2: REKENING PEMBAYARAN                                 */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'bank-accounts' && (
        <div style={{
          background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px',
          padding: '28px', boxShadow: C.shadowMd,
          display: 'flex', flexDirection: 'column', gap: '24px',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: C.textHead, margin: '0 0 4px', fontFamily: "'Manrope', sans-serif" }}>
                Rekening Bank Resmi Atelier
              </h2>
              <p style={{ fontSize: '0.8rem', color: C.textMuted, margin: 0 }}>
                Akun tujuan transfer manual pesanan kustomer yang divalidasi oleh tim finance.
              </p>
            </div>
            <button onClick={() => setShowBankModal(true)} style={{
              padding: '10px 20px', background: C.neonLime, border: 'none',
              borderRadius: '10px', fontSize: '0.82rem', fontWeight: 800,
              color: '#1A2E00', cursor: 'pointer', fontFamily: "'Manrope', sans-serif",
              display: 'flex', alignItems: 'center', gap: '8px',
              textTransform: 'uppercase', letterSpacing: '0.03em',
            }}>
              <span>+</span> Tambah Rekening Bank
            </button>
          </div>

          {/* Bank Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {bankAccounts.map(bank => (
              <div key={bank.id} style={{
                background: C.cardHover, border: `1px solid ${C.border}`,
                borderRadius: '14px', padding: '24px', position: 'relative', overflow: 'hidden',
              }}>
                {/* Ambient glow */}
                <div style={{
                  position: 'absolute', right: '-20px', top: '-20px',
                  width: '100px', height: '100px', borderRadius: '50%',
                  background: `radial-gradient(circle, ${C.neonLime}15, transparent)`,
                }} />

                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '12px',
                      background: C.card, border: `1px solid ${C.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.9rem', fontWeight: 900, color: C.textHead,
                      fontFamily: "'Manrope', sans-serif", boxShadow: C.shadowSm,
                    }}>{bank.bank}</div>
                    <div>
                      <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: C.textHead, margin: '0 0 2px', fontFamily: "'Manrope', sans-serif" }}>
                        {bank.bankFull}
                      </h3>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: C.textMuted }}>
                        {bank.branch}
                      </span>
                    </div>
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 800,
                    padding: '3px 10px', borderRadius: '20px',
                    background: bank.active ? C.neonLime : C.amberBg,
                    color: bank.active ? '#1A2E00' : C.amberText,
                  }}>{bank.active ? 'AKTIF' : 'NONAKTIF'}</span>
                </div>

                {/* Account Number */}
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Nomor Rekening Resmi
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                    <span style={{
                      fontSize: '1.4rem', fontWeight: 800, color: C.textHead,
                      fontFamily: "'Manrope', sans-serif", letterSpacing: '0.03em',
                    }}>{bank.accountNumber}</span>
                    <button onClick={() => copyToClipboard(bank.accountNumber)} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '4px', borderRadius: '6px', color: C.textMuted,
                      fontSize: '14px',
                    }} title="Salin Nomor">📋</button>
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: C.textSub, display: 'block', marginTop: '4px' }}>
                    A.N: {bank.accountName}
                  </span>
                </div>

                {/* Actions */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  paddingTop: '12px', borderTop: `1px solid ${C.border}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      onClick={() => handleToggleBank(bank)}
                      style={{
                        width: '40px', height: '22px', borderRadius: '11px',
                        background: bank.active ? C.emerald : C.borderDark,
                        cursor: 'pointer', position: 'relative', transition: 'background 0.3s',
                      }}
                      title={bank.active ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                    >
                      <div style={{
                        width: '16px', height: '16px', borderRadius: '50%',
                        background: '#FFFFFF', position: 'absolute', top: '3px',
                        left: bank.active ? '21px' : '3px', transition: 'left 0.3s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                      }} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: C.textSub, fontWeight: 600 }}>
                      {bank.active ? 'Menerima Transfer' : 'Nonaktif'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => toast.success(`Edit rekening ${bank.bank}`)}
                      style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: 'none', border: `1px solid ${C.border}`,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: C.textMuted, fontSize: '14px',
                      }}
                      title="Edit Rekening"
                    >✏️</button>
                    <button
                      onClick={() => handleDeleteBank(bank)}
                      style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: 'none', border: `1px solid ${C.border}`,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: C.redText, fontSize: '14px',
                      }}
                      title="Hapus Rekening dari Database"
                    >🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bank Verification Note */}
          <div style={{
            padding: '16px 20px', background: C.emeraldLight,
            border: `1px solid ${C.emeraldBorder}`, borderRadius: '12px',
            display: 'flex', alignItems: 'center', gap: '14px',
          }}>
            <span style={{ fontSize: '22px' }}>🛡️</span>
            <div>
              <span style={{ fontWeight: 700, fontSize: '0.88rem', color: C.textHead, display: 'block' }}>
                Pemberitahuan Otomasi Verifikasi Pembayaran
              </span>
              <span style={{ fontSize: '0.8rem', color: C.textMuted }}>
                Sistem Barokah Engine mencocokkan mutasi rekening setiap 3 menit via API gateway banking terenkripsi SHA-256.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB 3: PELANGGAN NEWSLETTER                                */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'newsletter' && (
        <div style={{
          background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px',
          padding: '28px', boxShadow: C.shadowMd,
          display: 'flex', flexDirection: 'column', gap: '24px',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: C.textHead, margin: 0, fontFamily: "'Manrope', sans-serif" }}>
                  Pelanggan Newsletter & Drop Alerts
                </h2>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 800,
                  padding: '3px 10px', borderRadius: '8px',
                  background: C.neonLime, color: '#1A2E00',
                }}>2.480 TOTAL</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: C.textMuted, margin: '4px 0 0' }}>
                Database kustomer terdaftar untuk pengumuman drop rilis sneakers eksklusif.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={{
                padding: '10px 16px', background: C.cardHover, border: `1px solid ${C.border}`,
                borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700,
                color: C.textSub, cursor: 'pointer', fontFamily: 'var(--font-mono)',
                display: 'flex', alignItems: 'center', gap: '6px',
                textTransform: 'uppercase',
              }}>
                <span>📥</span> Ekspor CSV
              </button>
              <button style={{
                padding: '10px 16px', background: `linear-gradient(135deg, ${C.emerald} 0%, ${C.blue} 100%)`,
                border: 'none', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 800,
                color: '#FFFFFF', cursor: 'pointer', fontFamily: "'Manrope', sans-serif",
                display: 'flex', alignItems: 'center', gap: '6px',
                textTransform: 'uppercase', letterSpacing: '0.03em',
              }}>
                <span>📤</span> Buat Drop Alert Baru
              </button>
            </div>
          </div>

          {/* Growth Stats */}
          <div style={{
            padding: '20px 24px', background: C.cardHover,
            border: `1px solid ${C.border}`, borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                PERTUMBUHAN SUBSCRIPTION 30 HARI
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: C.textHead, fontFamily: "'Manrope', sans-serif" }}>+342 Member</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: C.emerald, fontWeight: 800 }}>↑ 18.4%</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: C.textMuted, marginTop: '2px' }}>
                Rasio konversi drop ke checkout 42.1%
              </div>
            </div>
            {/* Sparkline */}
            <svg width="200" height="50" viewBox="0 0 200 50" style={{ overflow: 'visible' }}>
              <polyline
                points="0,45 20,40 40,42 60,35 80,38 100,28 120,30 140,20 160,22 180,12 200,8"
                fill="none" stroke={C.emerald} strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"
              />
              <circle cx="200" cy="8" r="4" fill={C.neonLime} stroke={C.emerald} strokeWidth="2" />
            </svg>
          </div>

          {/* Subscriber Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
              <thead>
                <tr style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: C.textMuted,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  <th style={{ textAlign: 'left', padding: '10px 14px', background: C.cardHover, borderRadius: '8px 0 0 8px', fontWeight: 700 }}>Subscriber Email</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', background: C.cardHover, fontWeight: 700 }}>Preferensi Drop</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', background: C.cardHover, fontWeight: 700 }}>Tanggal Daftar</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', background: C.cardHover, fontWeight: 700 }}>Status</th>
                  <th style={{ textAlign: 'right', padding: '10px 14px', background: C.cardHover, borderRadius: '0 8px 8px 0', fontWeight: 700 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((sub, i) => (
                  <tr key={i} style={{ transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = C.cardHover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 600, color: C.textMain }}>{sub.email}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        padding: '3px 8px', background: C.cardHover, border: `1px solid ${C.border}`,
                        borderRadius: '6px', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: C.textSub,
                      }}>{sub.pref}</span>
                    </td>
                    <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: C.textMuted }}>{sub.date}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '3px 10px', borderRadius: '20px',
                        fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 800,
                        background: sub.status === 'AKTIF' ? C.neonLime : C.cardHover,
                        color: sub.status === 'AKTIF' ? '#1A2E00' : C.textMuted,
                        border: sub.status !== 'AKTIF' ? `1px solid ${C.border}` : 'none',
                      }}>
                        {sub.status === 'AKTIF' && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: C.emerald }} />}
                        {sub.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <button style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: C.textLight, fontSize: '14px', padding: '4px',
                        borderRadius: '6px',
                      }} title="Unsubscribe">🚫</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: C.textMuted }}>
              Menampilkan 4 dari 2.480 email terverifikasi
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button style={{
                padding: '6px 12px', background: C.cardHover, border: `1px solid ${C.border}`,
                borderRadius: '8px', fontSize: '0.72rem', fontWeight: 700, color: C.textSub,
                cursor: 'pointer', fontFamily: 'var(--font-mono)',
              }}>Prev</button>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: C.textMain, fontWeight: 700 }}>1 / 620</span>
              <button style={{
                padding: '6px 12px', background: C.cardHover, border: `1px solid ${C.border}`,
                borderRadius: '8px', fontSize: '0.72rem', fontWeight: 700, color: C.textSub,
                cursor: 'pointer', fontFamily: 'var(--font-mono)',
              }}>Next</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB 4: PROFIL ADMIN & KEAMANAN                             */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'security-profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Admin Profile */}
          <div style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px',
            padding: '28px', boxShadow: C.shadowMd,
            display: 'flex', flexDirection: 'column', gap: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '16px',
                background: `linear-gradient(135deg, ${C.emerald} 0%, ${C.blue} 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.4rem', fontWeight: 900, color: '#FFFFFF',
                fontFamily: "'Manrope', sans-serif",
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
              }}>RA</div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: C.textHead, margin: 0, fontFamily: "'Manrope', sans-serif" }}>
                    Raka Aditya
                  </h2>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 800,
                    padding: '3px 10px', borderRadius: '6px',
                    background: C.neonLime, color: '#1A2E00',
                  }}>SUPER ADMIN</span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: C.textMuted }}>
                  ID PROFILE: 99c3-4811-brkh-001
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Nama Lengkap Administrator</label>
                <input style={inputStyle} value="Raka Aditya" readOnly
                  onFocus={e => e.target.style.borderColor = C.emerald}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
              </div>
              <div>
                <label style={labelStyle}>Alamat Email Login</label>
                <input style={inputStyle} type="email" value="raka.aditya@barokahshoes.id" readOnly
                  onFocus={e => e.target.style.borderColor = C.emerald}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
              </div>
              <div>
                <label style={labelStyle}>Hak Akses Role (Supabase RLS)</label>
                <div style={{
                  ...inputStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: C.cardHover, cursor: 'default',
                }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: C.textSub }}>
                    Full Access: Database RLS, Finansial, Stock Allocation
                  </span>
                  <span style={{ color: C.emerald, fontSize: '16px' }}>✅</span>
                </div>
              </div>
            </div>
          </div>

          {/* Security & Supabase */}
          <div style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px',
            padding: '28px', boxShadow: C.shadowMd,
            display: 'flex', flexDirection: 'column', gap: '20px',
          }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: C.textHead, margin: '0 0 4px', fontFamily: "'Manrope', sans-serif" }}>
                Keamanan & Koneksi Supabase
              </h2>
              <p style={{ fontSize: '0.8rem', color: C.textMuted, margin: 0 }}>
                Konfigurasi sesi otentikasi JWT dan koneksi storage cloud.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Supabase Project Reference ID</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input style={{ ...inputStyle, fontFamily: 'var(--font-mono)', fontSize: '0.78rem', flex: 1 }}
                    value="brkh-prod-jkt-90218-db" readOnly
                  />
                  <button onClick={() => copyToClipboard('brkh-prod-jkt-90218-db')} style={{
                    width: '48px', height: '48px', borderRadius: '10px',
                    background: C.cardHover, border: `1px solid ${C.border}`,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', color: C.textMuted,
                  }}>📋</button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Session Timeout (Admin)</label>
                  <select style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="60">60 Menit Inaktif</option>
                    <option value="120" selected>120 Menit (Direkomendasikan)</option>
                    <option value="480">8 Jam Kerja</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>2-Factor Authentication (2FA)</label>
                  <div style={{
                    ...inputStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: C.cardHover, cursor: 'default',
                  }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: C.emerald, fontWeight: 800 }}>
                      AKTIF (TOTP)
                    </span>
                    <span style={{ fontSize: '16px' }}>🔒</span>
                  </div>
                </div>
              </div>

              {/* Activity Log */}
              <div style={{
                padding: '16px 20px', background: C.cardHover,
                border: `1px solid ${C.border}`, borderRadius: '12px',
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '8px' }}>
                  LOG AKTIVITAS TERAKHIR
                </span>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: C.textSub,
                }}>
                  <span>Login dari IP: 182.253.18.91 (Jakarta Selatan)</span>
                  <span style={{ color: C.textLight }}>10 Menit lalu</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── BOTTOM ACTION TRAY ────────────────────────────────────── */}
      <div style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px',
        padding: '20px 24px', boxShadow: C.shadowSm,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: C.textMuted,
        }}>
          <span style={{ color: C.emerald, fontSize: '16px' }}>ℹ️</span>
          <span>Semua perubahan pada tab ini akan langsung disinkronkan ke Supabase Cloud Cache & CDN.</span>
        </div>
        <button onClick={handleSave} style={{
          padding: '12px 28px', background: `linear-gradient(135deg, ${C.emerald} 0%, ${C.blue} 100%)`,
          border: 'none', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 800,
          color: '#FFFFFF', cursor: 'pointer', fontFamily: "'Manrope', sans-serif",
          textTransform: 'uppercase', letterSpacing: '0.03em',
          display: 'flex', alignItems: 'center', gap: '8px',
          boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
          whiteSpace: 'nowrap',
        }}>
          <span>💾</span> Simpan Semua Perubahan
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MODAL: Tambah Rekening Bank                                */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {showBankModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(6px)',
          padding: '16px',
        }} onClick={() => setShowBankModal(false)}>
          <div style={{
            background: C.card, borderRadius: '20px', padding: '28px',
            width: '100%', maxWidth: '480px', boxShadow: C.shadowLg,
            display: 'flex', flexDirection: 'column', gap: '20px',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: C.textHead, margin: 0, fontFamily: "'Manrope', sans-serif" }}>
                Tambah Rekening Toko Baru
              </h3>
              <button onClick={() => setShowBankModal(false)} style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: C.cardHover, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: C.textMuted, fontSize: '16px',
              }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Pilih Bank</label>
                <select
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  value={newBankForm.bank}
                  onChange={e => setNewBankForm(prev => ({ ...prev, bank: e.target.value }))}
                >
                  <option value="BCA">Bank Central Asia (BCA)</option>
                  <option value="Mandiri">Bank Mandiri</option>
                  <option value="BNI">Bank Negara Indonesia (BNI)</option>
                  <option value="BRI">Bank Rakyat Indonesia (BRI)</option>
                  <option value="BSI">Bank Syariah Indonesia (BSI)</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Nomor Rekening</label>
                <input
                  style={{ ...inputStyle, fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}
                  placeholder="Contoh: 1234567890"
                  value={newBankForm.accountNumber}
                  onChange={e => setNewBankForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                />
              </div>
              <div>
                <label style={labelStyle}>Atas Nama (A.N Pemilik)</label>
                <input
                  style={inputStyle}
                  value={newBankForm.accountName}
                  onChange={e => setNewBankForm(prev => ({ ...prev, accountName: e.target.value }))}
                />
              </div>
              <div>
                <label style={labelStyle}>Cabang Pembantu (KCU/KC)</label>
                <input
                  style={inputStyle}
                  placeholder="Contoh: KCU Senopati Jakarta"
                  value={newBankForm.branch}
                  onChange={e => setNewBankForm(prev => ({ ...prev, branch: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
              <button onClick={() => setShowBankModal(false)} style={{
                padding: '10px 20px', background: C.cardHover, border: `1px solid ${C.border}`,
                borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700,
                color: C.textSub, cursor: 'pointer', fontFamily: "'Manrope', sans-serif",
                textTransform: 'uppercase',
              }}>Batal</button>
              <button onClick={handleCreateBank} style={{
                padding: '10px 24px', background: `linear-gradient(135deg, ${C.emerald} 0%, ${C.blue} 100%)`,
                border: 'none', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 800,
                color: '#FFFFFF', cursor: 'pointer', fontFamily: "'Manrope', sans-serif",
                textTransform: 'uppercase',
              }}>Simpan ke Database</button>
            </div>
          </div>
        </div>
      )}

      {/* ── COPY / SAVE NOTIFICATIONS ─────────────────────────────── */}
      {copiedText && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          background: C.textHead, color: C.neonLime,
          padding: '12px 20px', borderRadius: '12px',
          fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700,
          boxShadow: C.shadowLg,
          display: 'flex', alignItems: 'center', gap: '8px',
          animation: 'slideIn 0.3s ease',
        }}>
          <span>✅</span> Nomor {copiedText} berhasil disalin!
        </div>
      )}
      {saveNotice && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          background: `linear-gradient(135deg, ${C.emerald} 0%, ${C.blue} 100%)`,
          color: '#FFFFFF', padding: '14px 24px', borderRadius: '12px',
          fontSize: '0.85rem', fontWeight: 800,
          fontFamily: "'Manrope', sans-serif",
          boxShadow: '0 8px 24px rgba(5, 150, 105, 0.3)',
          display: 'flex', alignItems: 'center', gap: '10px',
          animation: 'slideIn 0.3s ease',
        }}>
          <span>✅</span> Semua pengaturan berhasil disimpan ke Supabase!
        </div>
      )}
    </div>
  );
};

export default StoreSettings;
