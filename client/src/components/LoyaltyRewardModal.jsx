import React, { useState } from 'react';
import { Gift, Copy, Check, Sparkles, X, ArrowRight, ShieldCheck, Trophy, Flame } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const LoyaltyRewardModal = ({ isOpen, onClose, voucher, totalShoes = 10 }) => {
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  if (!isOpen || !voucher) return null;

  const handleCopy = () => {
    if (!voucher?.voucher_code) return;
    navigator.clipboard.writeText(voucher.voucher_code);
    setCopied(true);
    toast.success(`🎉 Kode voucher ${voucher.voucher_code} berhasil disalin! Potongan 30% siap digunakan.`);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleUseNow = () => {
    handleCopy();
    onClose();
    navigate('/shop');
  };

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
        animation: 'fadeIn 0.25s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          maxWidth: '520px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35), 0 0 40px rgba(183, 214, 0, 0.25)',
          position: 'relative',
          border: '2px solid #b7d600'
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
            backgroundColor: 'rgba(0, 0, 0, 0.06)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#080808',
            zIndex: 10,
            transition: 'background-color 0.15s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.15)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.06)'}
        >
          <X size={18} />
        </button>

        {/* Top Celebration Banner */}
        <div style={{
          backgroundColor: '#080808',
          padding: '36px 30px 28px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle background glow */}
          <div style={{
            position: 'absolute',
            top: '-50px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '240px',
            height: '140px',
            background: 'radial-gradient(circle, rgba(183,214,0,0.35) 0%, rgba(8,8,8,0) 70%)',
            pointerEvents: 'none'
          }} />

          {/* Trophy Badge */}
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#161616',
            border: '2px solid #b7d600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 0 24px rgba(183, 214, 0, 0.45)'
          }}>
            <Trophy size={32} color="#b7d600" />
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 800,
            color: '#b7d600',
            backgroundColor: 'rgba(183, 214, 0, 0.12)',
            border: '1px solid rgba(183, 214, 0, 0.3)',
            padding: '4px 12px',
            borderRadius: '999px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '10px'
          }}>
            <Sparkles size={13} /> MILESTONE 10 SEPATU TERCAPAI
          </div>

          <h2 style={{
            fontSize: '1.45rem',
            fontWeight: 900,
            color: '#FFFFFF',
            margin: '0 0 8px',
            letterSpacing: '-0.02em',
            lineHeight: 1.2
          }}>
            SELAMAT! ANDA MENDAPATKAN VOUCHER SPESIAL 30%
          </h2>

          <p style={{
            color: '#A1A1AA',
            fontSize: '0.86rem',
            margin: 0,
            lineHeight: 1.5,
            maxWidth: '420px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Sebagai apresiasi atas pembelian <strong style={{ color: '#FFFFFF' }}>{totalShoes} pasang sepatu</strong> di Toko Barokah, Anda berhak menerima voucher belanja eksklusif ini!
          </p>
        </div>

        {/* Voucher Ticket Body */}
        <div style={{ padding: '28px 24px 32px' }}>
          
          {/* Visual Voucher Card */}
          <div style={{
            background: 'linear-gradient(135deg, #111111 0%, #1c1c1c 100%)',
            border: '1.5px dashed #b7d600',
            borderRadius: '12px',
            padding: '24px 20px',
            position: 'relative',
            marginBottom: '22px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
          }}>
            {/* Cutout circles for ticket effect */}
            <div style={{
              position: 'absolute',
              left: '-12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF'
            }} />
            <div style={{
              position: 'absolute',
              right: '-12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF'
            }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#b7d600', fontFamily: 'var(--font-mono)', fontWeight: 800, letterSpacing: '0.06em' }}>
                  EKSKLUSIF AKUN ANDA
                </span>
                <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>
                  DISKON 30%
                </div>
              </div>

              <div style={{
                textAlign: 'right',
                backgroundColor: '#b7d600',
                color: '#080808',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 900,
                letterSpacing: '0.04em'
              }}>
                SEMUA PRODUK
              </div>
            </div>

            {/* Unique Code Copy Box */}
            <div style={{
              backgroundColor: '#000000',
              border: '1px solid #333333',
              borderRadius: '8px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div>
                <div style={{ fontSize: '0.66rem', color: '#888888', fontFamily: 'var(--font-mono)', marginBottom: '2px' }}>
                  KODE VOUCHER GENERATE UNIK
                </div>
                <div style={{
                  fontSize: '1.3rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 900,
                  color: '#b7d600',
                  letterSpacing: '0.12em'
                }}>
                  {voucher.voucher_code}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                style={{
                  backgroundColor: copied ? '#b7d600' : '#222222',
                  color: copied ? '#080808' : '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '9px 14px',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'TERSALIN' : 'SALIN'}
              </button>
            </div>

            {/* Single use warning tag */}
            <div style={{
              marginTop: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '0.72rem',
              color: '#F59E0B',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700
            }}>
              <ShieldCheck size={14} />
              VOUCHER BERSIFAT SEKALI PAKAI (SINGLE USE)
            </div>
          </div>

          {/* Terms bullets */}
          <ul style={{
            fontSize: '0.78rem',
            color: '#555555',
            paddingLeft: '18px',
            margin: '0 0 24px',
            lineHeight: '1.6'
          }}>
            <li>Potongan <strong>30%</strong> otomatis memotong subtotal pesanan apa pun.</li>
            <li>Kode voucher bersifat <strong>unik dan berbeda</strong> untuk tiap pelanggan.</li>
            <li>Hanya dapat digunakan <strong>1 kali</strong> saat checkout pesanan.</li>
          </ul>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={handleUseNow}
              style={{
                flex: 1,
                backgroundColor: '#080808',
                color: '#b7d600',
                border: '1px solid #080808',
                borderRadius: '8px',
                padding: '14px 20px',
                fontSize: '0.86rem',
                fontWeight: 900,
                fontFamily: 'var(--font-mono)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#b7d600';
                e.currentTarget.style.color = '#080808';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = '#080808';
                e.currentTarget.style.color = '#b7d600';
              }}
            >
              GUNAKAN SEKARANG <ArrowRight size={16} />
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: '#F4F4F5',
                color: '#52525B',
                border: 'none',
                borderRadius: '8px',
                padding: '14px 20px',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Tutup
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
