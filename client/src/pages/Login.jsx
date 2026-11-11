import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const from = searchParams.get('redirect') || location.state?.from?.pathname || location.state?.from || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const { data, error, role } = await signIn(email, password);
    setIsLoading(false);
    if (!error) {
      if (role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    }
  };

  return (
    <div style={{ padding: '60px 0 100px' }}>
      <div className="container" style={{ maxWidth: '440px' }}>
        
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '4px',
          padding: '40px 32px',
          border: '1px solid #e5e5e5'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '4px',
              backgroundColor: '#080808',
              color: '#b7d600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '900',
              fontFamily: 'var(--font-heading)',
              fontSize: '1.3rem',
              margin: '0 auto 16px'
            }}>
              B
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: '900', color: '#080808', marginBottom: '6px', textTransform: 'uppercase' }}>
              MASUK KE AKUN
            </h1>
            <p style={{ color: '#666666', fontSize: '0.85rem' }}>
              Akses akun belanja streetwear & koleksi eksklusif Anda
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">ALAMAT EMAIL</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '38px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Mail size={16} color="#080808" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingLeft: '38px', paddingRight: '42px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Lock size={16} color="#080808" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#666666',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#080808')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#666666')}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '8px' }}
            >
              {isLoading ? 'MEMPROSES...' : 'MASUK SEKARANG'}
              {!isLoading && <ArrowRight size={16} />}
            </button>
          </form>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.82rem', color: '#666666' }}>
            Belum punya akun?{' '}
            <Link 
              to={from !== '/' ? `/register?redirect=${encodeURIComponent(from)}` : '/register'} 
              style={{ color: '#080808', fontWeight: '700', textDecoration: 'underline' }}
            >
              Daftar di sini
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
};
