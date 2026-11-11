import React from 'react';
import { Gift, X, ArrowRight, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const VoucherUsedModal = ({ isOpen, onClose, voucherCode = 'BAROKAH10', usedInfo = null }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleGoToLoyalty = () => {
    onClose();
    navigate('/profile');
  };

  const handleGoToShop = () => {
    onClose();
    navigate('/shop');
  };

  const formattedDate = usedInfo?.used_at
    ? new Date(usedInfo.used_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(8, 8, 8, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          maxWidth: '500px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.4), 0 0 35px rgba(220, 38, 38, 0.15)',
          position: 'relative',
          border: '1px solid #e5e5e5'
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#FFFFFF',
            zIndex: 10,
            transition: 'background-color 0.15s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
        >
          <X size={18} />
        </button>

        {/* Top Header Banner */}
        <div style={{
          backgroundColor: '#080808',
          padding: '32px 28px 24px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '2px solid #dc2626'
        }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 14px',
            borderRadius: '20px',
            backgroundColor: 'rgba(220, 38, 38, 0.2)',
            border: '1px solid #dc2626',
            color: '#f87171',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            fontWeight: '800',
            letterSpacing: '0.08em',
            marginBottom: '14px',
            textTransform: 'uppercase'
          }}>
            <AlertCircle size={14} color="#f87171" />
            VOUCHER SUDAH DIGUNAKAN
          </div>

          <h3 style={{
            color: '#FFFFFF',
            fontSize: '1.45rem',
            fontWeight: '900',
            margin: '0 0 10px',
            lineHeight: '1.2',
            textTransform: 'uppercase',
            letterSpacing: '0.02em'
          }}>
            KODE {voucherCode} TIDAK BISA DIPAKAI LAGI
          </h3>

          <p style={{
            color: '#a1a1aa',
            fontSize: '0.85rem',
            margin: 0,
            lineHeight: '1.5'
          }}>
            Kode promo ini hanya berlaku <strong>1 kali pakai</strong> per akun pelanggan dan telah tercatat digunakan
            {usedInfo?.order_number ? ` pada pesanan #${usedInfo.order_number}` : ''}
            {formattedDate ? ` (${formattedDate})` : ''}.
          </p>
        </div>

        {/* Body Content */}
        <div style={{ padding: '24px 28px 28px' }}>
          {/* Opportunity Card: Get Another Code */}
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '18px 20px',
            marginBottom: '22px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{
                backgroundColor: '#080808',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Gift size={15} color="#b7d600" />
              </div>
              <span style={{
                fontWeight: '900',
                fontSize: '0.92rem',
                fontFamily: 'var(--font-heading)',
                color: '#080808',
                textTransform: 'uppercase',
                letterSpacing: '0.02em'
              }}>
                Coba Dapatkan Kode Voucher Lain!
              </span>
            </div>

            <p style={{
              fontSize: '0.82rem',
              color: '#475569',
              lineHeight: '1.55',
              margin: '0 0 12px'
            }}>
              Kumpulkan total pembelian hingga <strong>10 pasang sepatu</strong> di Toko Barokah Shoes untuk otomatis membuka <strong style={{ color: '#080808' }}>Voucher Loyalitas Diskon 30%</strong> tanpa batas potongan dan berlaku untuk siluet apa pun!
            </p>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              color: '#166534',
              backgroundColor: '#f0fdf4',
              padding: '6px 10px',
              borderRadius: '4px',
              border: '1px solid #bbf7d0'
            }}>
              <CheckCircle2 size={13} color="#16a34a" />
              <span>Kode 30% dibuat otomatis khusus akun Anda setelah mencapai 10 pasang sepatu.</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              type="button"
              onClick={handleGoToLoyalty}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontWeight: '800',
                fontSize: '0.85rem'
              }}
            >
              <Sparkles size={16} color="#b7d600" />
              CEK PROGRES BELANJA 10 SEPATU (VOUCHER 30%)
              <ArrowRight size={16} />
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={handleGoToShop}
                className="btn btn-outline"
                style={{
                  padding: '11px',
                  fontSize: '0.8rem',
                  fontWeight: '700'
                }}
              >
                JELAJAHI KATALOG
              </button>

              <button
                type="button"
                onClick={onClose}
                className="btn btn-dark"
                style={{
                  padding: '11px',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  backgroundColor: '#f4f4f4',
                  color: '#080808',
                  border: '1px solid #e5e5e5'
                }}
              >
                TUTUP
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
