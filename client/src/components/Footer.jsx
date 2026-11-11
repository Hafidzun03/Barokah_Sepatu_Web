import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, RotateCcw, Award } from 'lucide-react';

const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const TikTokIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
  </svg>
);

const socialLinks = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/barokahshoes__?stkn=Ym9yMHBqdHViamgx',
    icon: <InstagramIcon />,
    hoverColor: '#E1306C',
  },
  {
    label: 'Facebook',
    href: 'https://facebook.com/barokahshoes',
    icon: <FacebookIcon />,
    hoverColor: '#1877F2',
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@barokahshoes_',
    icon: <TikTokIcon />,
    hoverColor: '#EE1D52',
  },
  {
    label: 'WhatsApp',
    href: 'https://wa.me/6281288667433',
    icon: <WhatsAppIcon />,
    hoverColor: '#25D366',
  },
];

export const Footer = () => {
  const [hoveredSocial, setHoveredSocial] = React.useState(null);

  return (
    <footer style={{
      backgroundColor: '#080808',
      color: '#a3a3a3',
      paddingTop: '60px',
      paddingBottom: '30px',
      marginTop: '80px',
      borderTop: '1px solid #1f1f1f'
    }}>

      {/* Editorial Value Highlights */}
      <div className="container" style={{ borderBottom: '1px solid #1f1f1f', paddingBottom: '40px', marginBottom: '40px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '4px', backgroundColor: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b7d600', flexShrink: 0 }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 style={{ color: '#ffffff', fontSize: '0.9rem', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>100% AUTHENTIC</h4>
              <p style={{ fontSize: '0.78rem', color: '#888888' }}>Garansi keaslian setiap pasang sepatu original berstandar pabrikan.</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '4px', backgroundColor: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b7d600', flexShrink: 0 }}>
              <Truck size={20} />
            </div>
            <div>
              <h4 style={{ color: '#ffffff', fontSize: '0.9rem', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>EXPRESS LOGISTICS</h4>
              <p style={{ fontSize: '0.78rem', color: '#888888' }}>Pengiriman kilat terlindungi double box ke seluruh wilayah Indonesia.</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '4px', backgroundColor: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b7d600', flexShrink: 0 }}>
              <RotateCcw size={20} />
            </div>
            <div>
              <h4 style={{ color: '#ffffff', fontSize: '0.9rem', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>SIZE EXCHANGE</h4>
              <p style={{ fontSize: '0.78rem', color: '#888888' }}>Jaminan penukaran ukuran sepatu mudah hingga 7 hari kerja.</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '4px', backgroundColor: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b7d600', flexShrink: 0 }}>
              <Award size={20} />
            </div>
            <div>
              <h4 style={{ color: '#ffffff', fontSize: '0.9rem', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>DIRECT CONCIERGE</h4>
              <p style={{ fontSize: '0.78rem', color: '#888888' }}>Respon cepat melalui WhatsApp resmi layanan pelanggan kami.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer — 3 columns with expanded Google Map */}
      <div className="container footer-main-grid">

        {/* Col 1 — Brand + Social */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '4px',
              backgroundColor: '#b7d600', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#080808', fontWeight: '900',
              fontFamily: 'var(--font-heading)'
            }}>B</div>
            <span style={{ fontSize: '1.2rem', fontWeight: '900', color: '#ffffff', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
              BAROKAH<span style={{ color: '#b7d600' }}>SHOES</span>
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', lineHeight: '1.6', marginBottom: '16px', color: '#888888' }}>
            Platform destinasi sepatu streetwear dan gaya hidup mewah dengan desain presisi dan material berkualitas tinggi.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', marginBottom: '20px' }}>
            <div>PASAR JAYA JATINEGARA LT.2 BLOK AKS NO. 57</div>
            <div>JATINEGARA, JAKARTA TIMUR 13310</div>
            <div>WHATSAPP: 081288667433</div>
            <div>EMAIL: barokahshoes@gmail.com</div>
          </div>

          {/* Social Icons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {socialLinks.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                onMouseEnter={() => setHoveredSocial(s.label)}
                onMouseLeave={() => setHoveredSocial(null)}
                style={{
                  width: '38px', height: '38px', borderRadius: '8px',
                  backgroundColor: hoveredSocial === s.label ? s.hoverColor : '#1a1a1a',
                  border: `1px solid ${hoveredSocial === s.label ? s.hoverColor : '#333'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: hoveredSocial === s.label ? '#ffffff' : '#888888',
                  transition: 'all 0.25s ease',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  transform: hoveredSocial === s.label ? 'translateY(-3px)' : 'translateY(0)',
                }}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Col 2 — Google Maps (Wider / Expanded) */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ color: '#ffffff', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-heading)', margin: 0 }}>
              LOKASI TOKO KAMI
            </h4>
            <span style={{ fontSize: '0.68rem', color: '#b7d600', fontFamily: 'var(--font-mono)', fontWeight: '800' }}>
              OFFICIAL STORE &amp; WORKSHOP
            </span>
          </div>

          <div style={{
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid #2a2a2a',
            marginBottom: '12px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            width: '100%',
            height: '230px'
          }}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3983.174913446065!2d106.8601074!3d-6.2175142!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f3e12d6a794d%3A0x7dc30391380b3a28!2sToko%20Barokah%20Shoes!5e0!3m2!1sid!2sid!4v1697000000000!5m2!1sid!2sid"
              width="100%"
              height="100%"
              style={{ border: 0, display: 'block' }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Lokasi Toko Barokah Shoes"
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <p style={{ fontSize: '0.78rem', color: '#aaaaaa', fontFamily: 'var(--font-mono)', margin: 0, lineHeight: '1.6', flex: '1', minWidth: '220px' }}>
              <strong style={{ color: '#ffffff' }}>PASAR JAYA JATINEGARA LT.2 BLOK AKS NO. 57</strong><br />
              Jl. Jatinegara Barat, Bali Mester, Jatinegara, Jakarta Timur 13310
            </p>
            <a
              href="https://maps.app.goo.gl/w59df4bmZRjX8PgF8"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                backgroundColor: '#b7d600', color: '#080808',
                padding: '9px 18px', borderRadius: '4px',
                fontSize: '0.75rem', fontWeight: '900',
                fontFamily: 'var(--font-heading)',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                textDecoration: 'none', transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              📍 Buka di Google Maps
            </a>
          </div>
        </div>

        {/* Col 3 — Customer Desk + Payment */}
        <div>
          <h4 style={{ color: '#ffffff', fontSize: '0.85rem', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-heading)' }}>
            CUSTOMER DESK
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', marginBottom: '28px' }}>
            <li><Link to="/orders">LACAK PESANAN</Link></li>
            <li><Link to="/cart">KERANJANG BELANJA</Link></li>
            <li>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('open-size-guide'))}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: 'inherit',
                  font: 'inherit',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                SIZE GUIDE (EU/US)
              </button>
            </li>
            <li><a href="#return-policy">KEBIJAKAN RETUR</a></li>
            <li><a href="#faq">FAQ &amp; KETENTUAN</a></li>
          </ul>

          <h4 style={{ color: '#ffffff', fontSize: '0.85rem', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-heading)' }}>
            PAYMENT GATEWAY
          </h4>
          <p style={{ fontSize: '0.78rem', color: '#888888', marginBottom: '12px' }}>
            Pembayaran transfer perbankan aman, instant QRIS, dan COD.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: '700' }}>
            <span style={{ backgroundColor: '#1a1a1a', color: '#ffffff', padding: '4px 8px', borderRadius: '2px', border: '1px solid #333' }}>BCA</span>
            <span style={{ backgroundColor: '#1a1a1a', color: '#ffffff', padding: '4px 8px', borderRadius: '2px', border: '1px solid #333' }}>MANDIRI</span>
            <span style={{ backgroundColor: '#1a1a1a', color: '#ffffff', padding: '4px 8px', borderRadius: '2px', border: '1px solid #333' }}>BRI</span>
            <span style={{ backgroundColor: '#b7d600', color: '#080808', padding: '4px 8px', borderRadius: '2px' }}>QRIS INSTANT</span>
            <span style={{ backgroundColor: '#1a1a1a', color: '#ffffff', padding: '4px 8px', borderRadius: '2px', border: '1px solid #333' }}>COD</span>
          </div>
        </div>

      </div>

      {/* Copyright */}
      <div className="container" style={{
        paddingTop: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        fontSize: '0.72rem',
        fontFamily: 'var(--font-mono)',
        color: '#666666'
      }}>
        <div>© {new Date().getFullYear()} BAROKAH SHOES. KINETIC LUXURY STREETWEAR. ALL RIGHTS RESERVED.</div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>PRIVACY POLICY</span>
          <span>TERMS OF SERVICE</span>
        </div>
      </div>
    </footer>
  );
};
