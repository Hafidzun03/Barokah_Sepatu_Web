import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ShoppingBag, Lock, ArrowRight, UserPlus, LogIn } from 'lucide-react';

/**
 * AuthPromptModal
 * Muncul ketika user belum login tapi menekan tombol Checkout.
 * Props:
 *   - isOpen: boolean
 *   - onClose: () => void
 *   - redirectAfter: string  (path tujuan setelah login/register, default '/checkout')
 */
export const AuthPromptModal = ({ isOpen, onClose, redirectAfter = '/checkout' }) => {
  const navigate = useNavigate();

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const goTo = (path) => {
    onClose();
    navigate(`${path}?redirect=${encodeURIComponent(redirectAfter)}`);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        backgroundColor: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: '#0f0f0f',
          border: '1px solid #2a2a2a',
          borderRadius: '20px',
          padding: '40px 36px',
          maxWidth: '420px', width: '100%',
          position: 'relative',
          boxShadow: '0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(183,214,0,0.08)',
          animation: 'slideUp 0.25s ease',
        }}
      >
        {/* Close button */}
        <button onClick={onClose} style={{
          position: 'absolute', top: '16px', right: '16px',
          background: '#1a1a1a', border: '1px solid #333', borderRadius: '6px',
          color: '#888', cursor: 'pointer', padding: '6px', display: 'flex',
          alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
        }}
          onMouseEnter={e => { e.currentTarget.style.background = '#222'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.color = '#888'; }}
        >
          <X size={16} />
        </button>

        {/* Icon */}
        <div style={{
          width: '64px', height: '64px', borderRadius: '16px',
          backgroundColor: '#141414', border: '1px solid #2a2a2a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '20px', position: 'relative'
        }}>
          <ShoppingBag size={28} color="#b7d600" />
          <div style={{
            position: 'absolute', bottom: '-4px', right: '-4px',
            width: '22px', height: '22px', borderRadius: '50%',
            backgroundColor: '#b7d600', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Lock size={11} color="#080808" strokeWidth={3} />
          </div>
        </div>

        {/* Text */}
        <h2 style={{
          fontSize: '1.5rem', fontWeight: '900', color: '#ffffff',
          fontFamily: 'var(--font-heading)', marginBottom: '10px', letterSpacing: '-0.02em'
        }}>
          Daftar Dulu, Yuk!
        </h2>
        <p style={{ color: '#888888', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '28px' }}>
          Kamu perlu punya akun untuk melanjutkan checkout. Daftar gratis dan nikmati kemudahan belanja, lacak pesanan, &amp; promo eksklusif!
        </p>

        {/* Benefits */}
        <div style={{
          backgroundColor: '#111111', borderRadius: '10px', padding: '14px 16px',
          border: '1px solid #1f1f1f', marginBottom: '24px',
          display: 'flex', flexDirection: 'column', gap: '8px'
        }}>
          {[
            '✓  Checkout lebih cepat',
            '✓  Lacak status pesanan real-time',
            '✓  Akses promo &amp; drop eksklusif',
          ].map((b, i) => (
            <span key={i} style={{ fontSize: '0.8rem', color: '#aaaaaa' }} dangerouslySetInnerHTML={{ __html: b }} />
          ))}
        </div>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={() => goTo('/register')}
            style={{
              width: '100%', backgroundColor: '#b7d600', color: '#080808',
              border: 'none', borderRadius: '10px', padding: '15px',
              fontSize: '0.9rem', fontWeight: '800', fontFamily: 'var(--font-heading)',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(183,214,0,0.25)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <UserPlus size={17} /> Daftar Akun Gratis <ArrowRight size={16} />
          </button>

          <button
            onClick={() => goTo('/login')}
            style={{
              width: '100%', backgroundColor: 'transparent', color: '#ffffff',
              border: '1px solid #2a2a2a', borderRadius: '10px', padding: '14px',
              fontSize: '0.9rem', fontWeight: '700', fontFamily: 'var(--font-heading)',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.backgroundColor = '#1a1a1a'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <LogIn size={17} /> Sudah Punya Akun? Masuk
          </button>
        </div>

        {/* Skip */}
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#555555', fontSize: '0.8rem',
            cursor: 'pointer', transition: 'color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = '#888'}
            onMouseLeave={e => e.currentTarget.style.color = '#555'}
          >
            Lanjut belanja dulu
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};
