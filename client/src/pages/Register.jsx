import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, ArrowRight, ArrowLeft, Eye, EyeOff, CheckCircle, MapPin, Phone, Hash } from 'lucide-react';
import toast from 'react-hot-toast';

export const Register = () => {
  // Step tracker: 1 = email & password, 2 = personal info
  const [step, setStep] = useState(1);

  // Step 1 fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Step 2 fields
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [signupBlocked, setSignupBlocked] = useState(false);
  const [dbErrorBlocked, setDbErrorBlocked] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const { signUp, signInAsDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get('redirect') || location.state?.from || '/';

  const handleDemoSignIn = () => {
    signInAsDemo(fullName || 'Pelanggan Barokah', email || 'pembeli@barokahshoes.id');
    navigate(redirectTo, { replace: true });
  };

  const sqlFixCode = `-- Perbaikan Trigger Profiles Supabase
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'customer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlFixCode);
    setCopiedSql(true);
    toast.success('SQL berhasil disalin!');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  // Validate & proceed from Step 1 to Step 2
  const handleNextStep = (e) => {
    e.preventDefault();
    if (!email.trim()) { toast.error('Email wajib diisi!'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error('Format email tidak valid!'); return; }
    if (password.length < 6) { toast.error('Password minimal 6 karakter!'); return; }
    if (password !== confirmPassword) { toast.error('Konfirmasi password tidak cocok!'); return; }
    setStep(2);
  };

  // Go back to Step 1
  const handleBackStep = () => {
    setStep(1);
  };

  // Final submit from Step 2
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) { toast.error('Nama lengkap wajib diisi!'); return; }
    if (!phoneNumber.trim()) { toast.error('No. Telepon / WhatsApp wajib diisi!'); return; }
    if (!address.trim()) { toast.error('Alamat lengkap wajib diisi!'); return; }
    if (!postalCode.trim()) { toast.error('Kode pos wajib diisi!'); return; }

    setIsLoading(true);
    setSignupBlocked(false);
    setDbErrorBlocked(false);

    const { data, error, isSignupDisabled, isDbError } = await signUp(email, password, fullName, {
      phone: phoneNumber,
      address,
      postal_code: postalCode
    });

    setIsLoading(false);

    if (isSignupDisabled) {
      setSignupBlocked(true);
      setStep(1); // Go back to show the error
      return;
    }

    if (isDbError) {
      setDbErrorBlocked(true);
      setStep(1);
      return;
    }

    if (!error) {
      toast.success('🎉 Pendaftaran berhasil! Data diri Anda akan otomatis terisi saat checkout.');
      if (data?.session) {
        navigate(redirectTo, { replace: true });
      } else {
        navigate(redirectTo !== '/' ? `/login?redirect=${encodeURIComponent(redirectTo)}` : '/login', { replace: true });
      }
    }
  };

  const inputStyle = (field) => ({
    width: '100%',
    backgroundColor: focusedField === field ? '#111111' : '#0d0d0d',
    border: `1px solid ${focusedField === field ? '#b7d600' : '#2a2a2a'}`,
    borderRadius: '8px',
    color: '#ffffff',
    padding: '14px 44px 14px 44px',
    fontSize: '0.9rem',
    fontFamily: ['email', 'password', 'confirm', 'phone', 'postal'].includes(field) ? 'var(--font-mono)' : 'var(--font-body)',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
  });

  const strengthLevel = () => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 6) s++;
    if (password.length >= 10) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    return s;
  };
  const strength = strengthLevel();
  const strengthColors = ['#333', '#ef4444', '#f97316', '#eab308', '#b7d600'];
  const strengthLabels = ['', 'Lemah', 'Cukup', 'Kuat', 'Sangat Kuat'];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#080808',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 16px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background accent */}
      <div style={{
        position: 'absolute', top: '-200px', right: '-200px',
        width: '500px', height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(183,214,0,0.06) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '-150px', left: '-150px',
        width: '400px', height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(183,214,0,0.04) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', maxWidth: '460px', position: 'relative', zIndex: 1 }}>
        
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '8px',
              backgroundColor: '#b7d600', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#080808', fontWeight: '900',
              fontFamily: 'var(--font-heading)', fontSize: '1.2rem'
            }}>B</div>
            <span style={{ fontSize: '1.3rem', fontWeight: '900', color: '#ffffff', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
              BAROKAH<span style={{ color: '#b7d600' }}>SHOES</span>
            </span>
          </Link>
        </div>

        {/* Card */}
        <div style={{
          backgroundColor: '#0f0f0f',
          border: '1px solid #1f1f1f',
          borderRadius: '16px',
          padding: '40px 36px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)'
        }}>

          {/* ═══════════════════════════════════════════════
              STEP INDICATOR
              ═══════════════════════════════════════════════ */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '28px' }}>
            {/* Step 1 circle */}
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              backgroundColor: step >= 1 ? '#b7d600' : '#222',
              color: step >= 1 ? '#080808' : '#666',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '900', fontSize: '0.85rem', fontFamily: 'var(--font-mono)',
              transition: 'all 0.3s ease',
              boxShadow: step === 1 ? '0 0 16px rgba(183,214,0,0.3)' : 'none'
            }}>
              {step > 1 ? <CheckCircle size={18} /> : '1'}
            </div>
            {/* Connector */}
            <div style={{
              flex: 1, height: '2px',
              background: step >= 2
                ? 'linear-gradient(90deg, #b7d600, #b7d600)'
                : 'linear-gradient(90deg, #333, #222)',
              transition: 'all 0.4s ease'
            }} />
            {/* Step 2 circle */}
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              backgroundColor: step >= 2 ? '#b7d600' : '#222',
              color: step >= 2 ? '#080808' : '#666',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '900', fontSize: '0.85rem', fontFamily: 'var(--font-mono)',
              transition: 'all 0.3s ease',
              boxShadow: step === 2 ? '0 0 16px rgba(183,214,0,0.3)' : 'none'
            }}>
              2
            </div>
          </div>

          {/* Step labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', marginTop: '-16px' }}>
            <span style={{
              fontSize: '0.68rem', fontFamily: 'var(--font-mono)', fontWeight: step === 1 ? '800' : '600',
              color: step >= 1 ? '#b7d600' : '#555', textTransform: 'uppercase', letterSpacing: '0.06em',
              textAlign: 'left', width: '40%'
            }}>
              Akun &amp; Keamanan
            </span>
            <span style={{
              fontSize: '0.68rem', fontFamily: 'var(--font-mono)', fontWeight: step === 2 ? '800' : '600',
              color: step >= 2 ? '#b7d600' : '#555', textTransform: 'uppercase', letterSpacing: '0.06em',
              textAlign: 'right', width: '40%'
            }}>
              Data Diri
            </span>
          </div>

          {/* Header */}
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{
              fontSize: '1.6rem', fontWeight: '900', color: '#ffffff',
              fontFamily: 'var(--font-heading)', marginBottom: '8px', letterSpacing: '-0.02em'
            }}>
              {step === 1 ? 'Buat Akun Baru' : 'Lengkapi Data Diri'}
            </h1>
            <p style={{ color: '#888888', fontSize: '0.85rem', lineHeight: '1.5' }}>
              {step === 1
                ? 'Masukkan email dan password untuk membuat akun baru.'
                : 'Data ini akan otomatis terisi saat kamu checkout pesanan. Tidak perlu isi ulang lagi! 🎉'}
            </p>
          </div>

          {/* Benefits (only on Step 1) */}
          {step === 1 && (
            <div style={{
              backgroundColor: '#111111', borderRadius: '8px', padding: '14px 16px',
              border: '1px solid #1f1f1f', marginBottom: '24px',
              display: 'flex', flexDirection: 'column', gap: '8px'
            }}>
              {['Checkout kilat — data otomatis terisi', 'Lacak pesanan secara real-time', 'Klaim voucher diskon 10% pesanan pertama'].map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle size={15} color="#b7d600" />
                  <span style={{ fontSize: '0.8rem', color: '#aaaaaa' }}>{b}</span>
                </div>
              ))}
            </div>
          )}

          {/* Auto-fill info hint (only on Step 2) */}
          {step === 2 && (
            <div style={{
              backgroundColor: 'rgba(183,214,0,0.08)', borderRadius: '8px', padding: '12px 14px',
              border: '1px solid rgba(183,214,0,0.2)', marginBottom: '20px',
              display: 'flex', alignItems: 'center', gap: '10px'
            }}>
              <MapPin size={16} color="#b7d600" />
              <span style={{ fontSize: '0.78rem', color: '#b7d600', fontWeight: '600' }}>
                Data di bawah akan tersimpan & otomatis terisi setiap checkout
              </span>
            </div>
          )}

          {/* Supabase Signup Disabled Notice */}
          {signupBlocked && step === 1 && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', color: '#ef4444', marginBottom: '8px', fontSize: '0.88rem' }}>
                ⚠️ FITUR DAFTAR DINONAKTIFKAN DI SUPABASE
              </div>
              <p style={{ fontSize: '0.8rem', color: '#d1d5db', lineHeight: '1.5', marginBottom: '10px' }}>
                Supabase memblokir pendaftaran dengan pesan <em>"Signups not allowed for this instance"</em>. Solusinya:
              </p>
              <ol style={{ fontSize: '0.78rem', color: '#9ca3af', paddingLeft: '18px', margin: '0 0 14px 0', lineHeight: '1.6' }}>
                <li>Buka menu: <strong>Authentication → Providers → Email</strong> di dashboard Supabase</li>
                <li>Aktifkan toggle <strong style={{ color: '#b7d600' }}>"Allow new users to sign up"</strong></li>
                <li>Matikan <strong style={{ color: '#ffffff' }}>"Confirm email"</strong> (agar user langsung aktif tanpa cek inbox)</li>
                <li>Klik tombol <strong>Save</strong></li>
              </ol>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <a
                  href="https://supabase.com/dashboard/project/omfwubwdxkmarwovpeev/auth/providers"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    backgroundColor: '#1f1f1f',
                    border: '1px solid #ef4444',
                    color: '#ffffff',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  Buka Supabase Dashboard ↗
                </a>
                <button
                  type="button"
                  onClick={handleDemoSignIn}
                  style={{
                    backgroundColor: '#b7d600',
                    color: '#080808',
                    padding: '8px 14px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  ⚡ Masuk Sebagai Demo &amp; Lanjut Checkout
                </button>
              </div>
            </div>
          )}

          {/* Database Error Saving New User Notice */}
          {dbErrorBlocked && step === 1 && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              padding: '18px',
              marginBottom: '20px',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', color: '#ef4444', marginBottom: '8px', fontSize: '0.88rem' }}>
                ⚠️ DATABASE ERROR SAVING NEW USER (SUPABASE TRIGGER)
              </div>
              <p style={{ fontSize: '0.8rem', color: '#d1d5db', lineHeight: '1.5', marginBottom: '10px' }}>
                Error ini terjadi karena trigger otomatis profil pada tabel <code>auth.users</code> di Supabase mengalami kendala (tipe data atau permission).
              </p>
              
              <div style={{ fontSize: '0.78rem', color: '#aaaaaa', marginBottom: '8px' }}>
                <strong>Cara Perbaiki (1 Menit):</strong>
              </div>
              <ol style={{ fontSize: '0.76rem', color: '#9ca3af', paddingLeft: '18px', margin: '0 0 12px 0', lineHeight: '1.6' }}>
                <li>Buka menu <strong style={{ color: '#fff' }}>SQL Editor</strong> di Supabase Dashboard</li>
                <li>Klik tombol <strong>"Salin SQL Perbaikan"</strong> di bawah</li>
                <li>Paste ke SQL Editor lalu klik tombol <strong style={{ color: '#b7d600' }}>Run</strong></li>
              </ol>

              {/* Code preview */}
              <div style={{
                backgroundColor: '#050505',
                border: '1px solid #333333',
                borderRadius: '6px',
                padding: '10px 12px',
                marginBottom: '14px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                color: '#b7d600',
                maxHeight: '110px',
                overflowY: 'auto'
              }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{sqlFixCode}</pre>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <button
                  type="button"
                  onClick={copySqlToClipboard}
                  style={{
                    backgroundColor: copiedSql ? '#22c55e' : '#ffffff',
                    color: '#080808',
                    padding: '8px 14px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {copiedSql ? '✓ Tersalin!' : '📋 Salin SQL Perbaikan'}
                </button>

                <a
                  href="https://supabase.com/dashboard/project/omfwubwdxkmarwovpeev/sql/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    backgroundColor: '#1f1f1f',
                    border: '1px solid #ef4444',
                    color: '#ffffff',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  Buka SQL Editor Supabase ↗
                </a>

                <button
                  type="button"
                  onClick={handleDemoSignIn}
                  style={{
                    backgroundColor: '#b7d600',
                    color: '#080808',
                    padding: '8px 14px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  ⚡ Masuk Sebagai Demo &amp; Lanjut Checkout
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════
              STEP 1: Email & Password
              ═══════════════════════════════════════════════ */}
          {step === 1 && (
            <form onSubmit={handleNextStep} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>
                  Alamat Email
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color={focusedField === 'email' ? '#b7d600' : '#555'} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', transition: 'color 0.2s' }} />
                  <input
                    type="email"
                    style={inputStyle('email')}
                    placeholder="nama@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color={focusedField === 'password' ? '#b7d600' : '#555'} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', transition: 'color 0.2s' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    style={{ ...inputStyle('password'), paddingRight: '44px' }}
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 0 }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {/* Strength bar */}
                {password && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', backgroundColor: i <= strength ? strengthColors[strength] : '#222', transition: 'background-color 0.3s' }} />
                      ))}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: strengthColors[strength] }}>{strengthLabels[strength]}</span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>
                  Ulangi Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color={focusedField === 'confirm' ? (confirmPassword && confirmPassword !== password ? '#ef4444' : '#b7d600') : '#555'} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', transition: 'color 0.2s' }} />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    style={{
                      ...inputStyle('confirm'),
                      paddingRight: '44px',
                      border: `1px solid ${confirmPassword && confirmPassword !== password ? '#ef4444' : focusedField === 'confirm' ? '#b7d600' : '#2a2a2a'}`
                    }}
                    placeholder="Ketik ulang password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    onFocus={() => setFocusedField('confirm')}
                    onBlur={() => setFocusedField(null)}
                    required
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 0 }}>
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <span style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: '4px', display: 'block' }}>Password tidak cocok</span>
                )}
              </div>

              {/* Next Step Button */}
              <button
                type="submit"
                style={{
                  width: '100%', marginTop: '8px',
                  backgroundColor: '#b7d600',
                  color: '#080808', border: 'none', borderRadius: '8px',
                  padding: '16px', fontSize: '0.92rem', fontWeight: '800',
                  fontFamily: 'var(--font-heading)', textTransform: 'uppercase',
                  letterSpacing: '0.06em', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(183,214,0,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                LANJUT ISI DATA DIRI <ArrowRight size={16} />
              </button>
            </form>
          )}

          {/* ═══════════════════════════════════════════════
              STEP 2: Personal Info (Name, Phone, Address, Postal Code)
              ═══════════════════════════════════════════════ */}
          {step === 2 && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Full Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>
                  Nama Lengkap
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color={focusedField === 'name' ? '#b7d600' : '#555'} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', transition: 'color 0.2s' }} />
                  <input
                    type="text"
                    style={inputStyle('name')}
                    placeholder="Nama lengkap kamu"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Phone Number / WhatsApp */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>
                  No. Telepon / WhatsApp
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} color={focusedField === 'phone' ? '#b7d600' : '#555'} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', transition: 'color 0.2s' }} />
                  <input
                    type="tel"
                    style={inputStyle('phone')}
                    placeholder="08xxxxxxxxxx"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    onFocus={() => setFocusedField('phone')}
                    onBlur={() => setFocusedField(null)}
                    required
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>
                  Alamat Lengkap
                </label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} color={focusedField === 'address' ? '#b7d600' : '#555'} style={{ position: 'absolute', left: '14px', top: '16px', transition: 'color 0.2s' }} />
                  <textarea
                    style={{
                      ...inputStyle('address'),
                      minHeight: '80px',
                      resize: 'vertical',
                      paddingTop: '14px',
                      lineHeight: '1.5'
                    }}
                    placeholder="Jl. Nama Jalan No. XX, RT/RW, Kel, Kec, Kota"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    onFocus={() => setFocusedField('address')}
                    onBlur={() => setFocusedField(null)}
                    required
                  />
                </div>
              </div>

              {/* Postal Code */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>
                  Kode Pos
                </label>
                <div style={{ position: 'relative' }}>
                  <Hash size={16} color={focusedField === 'postal' ? '#b7d600' : '#555'} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', transition: 'color 0.2s' }} />
                  <input
                    type="text"
                    style={inputStyle('postal')}
                    placeholder="12345"
                    value={postalCode}
                    onChange={e => setPostalCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    onFocus={() => setFocusedField('postal')}
                    onBlur={() => setFocusedField(null)}
                    required
                    maxLength={5}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                {/* Back Button */}
                <button
                  type="button"
                  onClick={handleBackStep}
                  style={{
                    flex: '0 0 auto',
                    backgroundColor: '#1a1a1a',
                    color: '#aaaaaa', border: '1px solid #333', borderRadius: '8px',
                    padding: '16px 20px', fontSize: '0.85rem', fontWeight: '700',
                    fontFamily: 'var(--font-heading)', textTransform: 'uppercase',
                    letterSpacing: '0.04em', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#aaa'; }}
                >
                  <ArrowLeft size={16} /> KEMBALI
                </button>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    backgroundColor: isLoading ? '#8a9f00' : '#b7d600',
                    color: '#080808', border: 'none', borderRadius: '8px',
                    padding: '16px', fontSize: '0.92rem', fontWeight: '800',
                    fontFamily: 'var(--font-heading)', textTransform: 'uppercase',
                    letterSpacing: '0.06em', cursor: isLoading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { if (!isLoading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(183,214,0,0.3)'; } }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {isLoading ? (
                    <>
                      <div style={{ width: '16px', height: '16px', border: '2px solid #080808', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      MENDAFTARKAN...
                    </>
                  ) : (
                    <>DAFTAR SEKARANG <CheckCircle size={16} /></>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.85rem', color: '#666666' }}>
            Sudah punya akun?{' '}
            <Link to="/login" style={{ color: '#b7d600', fontWeight: '700', textDecoration: 'none' }}>
              Masuk di sini
            </Link>
          </div>
        </div>

        {/* Back to home */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link to="/" style={{ fontSize: '0.8rem', color: '#555555', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#888888'}
            onMouseLeave={e => e.currentTarget.style.color = '#555555'}>
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder, textarea::placeholder { color: #444444 !important; }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 30px #0d0d0d inset !important; -webkit-text-fill-color: #ffffff !important; }
      `}
      </style>
    </div>
  );
};
