import React, { useState, useEffect } from 'react';
import { X, Ruler, Footprints, ShieldCheck, Check, Info, Sparkles, ArrowRight } from 'lucide-react';

const sizeChartData = [
  // Sepatu Anak-Anak (Kids)
  { eu: 28, cm: '17.5', usMen: '11C', usWomen: '11C', uk: '10.5C', fitNote: 'Sepatu Anak (Kids)' },
  { eu: 29, cm: '18.0', usMen: '11.5C', usWomen: '11.5C', uk: '11C', fitNote: 'Sepatu Anak (Kids)' },
  { eu: 30, cm: '18.5', usMen: '12C', usWomen: '12C', uk: '11.5C', fitNote: 'Sepatu Anak (Kids)' },
  { eu: 31, cm: '19.0', usMen: '12.5C', usWomen: '12.5C', uk: '12C', fitNote: 'Sepatu Anak (Kids)' },
  { eu: 32, cm: '20.0', usMen: '1Y', usWomen: '1Y', uk: '13.5C', fitNote: 'Sepatu Anak (Kids)' },
  { eu: 33, cm: '20.5', usMen: '1.5Y', usWomen: '1.5Y', uk: '1', fitNote: 'Sepatu Anak (Kids)' },
  { eu: 34, cm: '21.5', usMen: '2.5Y', usWomen: '2.5Y', uk: '2', fitNote: 'Sepatu Anak (Kids)' },
  { eu: 35, cm: '22.0', usMen: '3.5', usWomen: '5.0', uk: '3.0', fitNote: 'Anak / Remaja' },
  // Sepatu Wanita & Unisex
  { eu: 36, cm: '22.5', usMen: '4.0', usWomen: '5.5', uk: '3.5', fitNote: 'Wanita / True to Size' },
  { eu: 37, cm: '23.5', usMen: '5.0', usWomen: '6.5', uk: '4.5', fitNote: 'Wanita / True to Size' },
  { eu: 38, cm: '24.0', usMen: '5.5', usWomen: '7.0', uk: '5.0', fitNote: 'True to Size' },
  { eu: 39, cm: '24.5', usMen: '6.5', usWomen: '8.0', uk: '6.0', fitNote: 'True to Size' },
  { eu: 40, cm: '25.0', usMen: '7.0', usWomen: '8.5', uk: '6.5', fitNote: 'True to Size' },
  { eu: 41, cm: '26.0', usMen: '8.0', usWomen: '9.5', uk: '7.5', fitNote: 'Best Fit / Standar' },
  { eu: 42, cm: '26.5', usMen: '8.5', usWomen: '10.0', uk: '8.0', fitNote: 'Best Fit / Standar' },
  { eu: 43, cm: '27.5', usMen: '9.5', usWomen: '11.0', uk: '9.0', fitNote: 'Best Fit / Standar' },
  { eu: 44, cm: '28.0', usMen: '10.0', usWomen: '11.5', uk: '9.5', fitNote: 'True to Size' },
  { eu: 45, cm: '29.0', usMen: '11.0', usWomen: '12.5', uk: '10.5', fitNote: 'True to Size' },
  { eu: 46, cm: '29.5', usMen: '12.0', usWomen: '13.5', uk: '11.5', fitNote: 'True to Size' }
];

export const SizeGuideModal = ({ 
  isOpen, 
  onClose, 
  productName = 'Koleksi Sepatu Barokah',
  productCategory = 'sneakers',
  selectedSize = null,
  onSelectSize = null 
}) => {
  const [activeTab, setActiveTab] = useState('chart'); // 'chart' | 'measure' | 'tips'

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#0d0d0d',
          color: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #222222',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(183, 214, 0, 0.15)',
          overflow: 'hidden',
          animation: 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '24px 28px 18px',
          borderBottom: '1px solid #1f1f1f',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          backgroundColor: '#111111'
        }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{
                backgroundColor: '#b7d600',
                color: '#080808',
                padding: '3px 8px',
                borderRadius: '2px',
                fontSize: '0.68rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: '900',
                letterSpacing: '0.06em'
              }}>
                BAROKAH PRECISION FIT
              </span>
              <span style={{ fontSize: '0.75rem', color: '#888888', fontFamily: 'var(--font-mono)' }}>
                OFFICIAL SIZE ARCHITECTURE
              </span>
            </div>

            <h2 style={{
              fontSize: '1.4rem',
              fontWeight: '900',
              fontFamily: 'var(--font-heading)',
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
              margin: 0,
              color: '#ffffff'
            }}>
              PANDUAN UKURAN SEPATU
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#999999' }}>
              Rekomendasi konversi ukuran standar EU, US, UK &amp; panjang kaki untuk {productName}.
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Tutup Panduan Ukuran"
            style={{
              background: '#1a1a1a',
              border: '1px solid #333333',
              borderRadius: '4px',
              color: '#ffffff',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#b7d600';
              e.currentTarget.style.color = '#080808';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#1a1a1a';
              e.currentTarget.style.color = '#ffffff';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #1f1f1f',
          backgroundColor: '#090909',
          padding: '0 28px',
          gap: '20px'
        }}>
          {[
            { id: 'chart', label: 'TABEL UKURAN (EU/CM/US)', icon: <Ruler size={14} /> },
            { id: 'measure', label: 'CARA MENGUKUR KAKI', icon: <Footprints size={14} /> },
            { id: 'tips', label: 'TIPS FITTING & GARANSI', icon: <ShieldCheck size={14} /> }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: isActive ? '2px solid #b7d600' : '2px solid transparent',
                  padding: '14px 4px',
                  color: isActive ? '#b7d600' : '#888888',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div style={{
          padding: '24px 28px',
          overflowY: 'auto',
          flex: 1
        }}>

          {/* TAB 1: Tabel Ukuran */}
          {activeTab === 'chart' && (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'rgba(183, 214, 0, 0.08)',
                border: '1px solid rgba(183, 214, 0, 0.25)',
                padding: '10px 14px',
                borderRadius: '4px',
                marginBottom: '18px',
                fontSize: '0.78rem',
                color: '#d4e84b'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={15} color="#b7d600" />
                  <span>
                    Gunakan <strong>Panjang Kaki (CM)</strong> sebagai acuan paling akurat saat memilih ukuran.
                  </span>
                </div>
                {onSelectSize && (
                  <span style={{ fontSize: '0.72rem', color: '#aaaaaa', fontFamily: 'var(--font-mono)' }}>
                    Klik baris untuk memilih size
                  </span>
                )}
              </div>

              <div style={{ overflowX: 'auto', border: '1px solid #1f1f1f', borderRadius: '4px' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  fontSize: '0.82rem',
                  fontFamily: 'var(--font-mono)'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#161616', color: '#aaaaaa', borderBottom: '1px solid #222222' }}>
                      <th style={{ padding: '12px 14px', fontWeight: '800' }}>EU SIZE</th>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#b7d600' }}>PANJANG KAKI</th>
                      <th style={{ padding: '12px 14px', fontWeight: '800' }}>US PRIA</th>
                      <th style={{ padding: '12px 14px', fontWeight: '800' }}>US WANITA</th>
                      <th style={{ padding: '12px 14px', fontWeight: '800' }}>UK</th>
                      <th style={{ padding: '12px 14px', fontWeight: '800', textAlign: 'right' }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sizeChartData.map((row) => {
                      const isCurrent = Number(selectedSize) === Number(row.eu);

                      return (
                        <tr
                          key={row.eu}
                          onClick={() => {
                            if (onSelectSize) {
                              onSelectSize(row.eu);
                              onClose();
                            }
                          }}
                          style={{
                            borderBottom: '1px solid #1a1a1a',
                            backgroundColor: isCurrent ? 'rgba(183, 214, 0, 0.12)' : 'transparent',
                            cursor: onSelectSize ? 'pointer' : 'default',
                            transition: 'background-color 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (!isCurrent) e.currentTarget.style.backgroundColor = '#141414';
                          }}
                          onMouseLeave={(e) => {
                            if (!isCurrent) e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <td style={{ padding: '12px 14px', fontWeight: '900', color: isCurrent ? '#b7d600' : '#ffffff' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>EU {row.eu}</span>
                              {isCurrent && (
                                <span style={{
                                  backgroundColor: '#b7d600',
                                  color: '#080808',
                                  fontSize: '0.62rem',
                                  fontWeight: '900',
                                  padding: '1px 5px',
                                  borderRadius: '2px'
                                }}>
                                  PILIHAN ANDA
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px', color: '#b7d600', fontWeight: '800' }}>
                            {row.cm} cm
                          </td>
                          <td style={{ padding: '12px 14px', color: '#cccccc' }}>
                            US {row.usMen}
                          </td>
                          <td style={{ padding: '12px 14px', color: '#cccccc' }}>
                            US {row.usWomen}
                          </td>
                          <td style={{ padding: '12px 14px', color: '#cccccc' }}>
                            UK {row.uk}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            {onSelectSize ? (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                color: isCurrent ? '#b7d600' : '#888888',
                                fontSize: '0.72rem',
                                textDecoration: isCurrent ? 'none' : 'underline'
                              }}>
                                {isCurrent ? <Check size={13} /> : 'Pilih'}
                              </span>
                            ) : (
                              <span style={{ color: '#888888', fontSize: '0.72rem' }}>
                                {row.fitNote}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Cara Mengukur Kaki */}
          {activeTab === 'measure' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                backgroundColor: '#111111',
                padding: '16px 20px',
                borderRadius: '6px',
                border: '1px solid #222222'
              }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#b7d600', margin: '0 0 8px', fontFamily: 'var(--font-heading)' }}>
                  CARA MUDAH MENGUKUR PANJANG KAKI SENDIRI DI RUMAH
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#aaaaaa', margin: 0, lineHeight: '1.6' }}>
                  Lakukan pengukuran di sore hari karena ukuran telapak kaki mencapai ukuran maksimal setelah beraktivitas seharian.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                <div style={{
                  backgroundColor: '#141414',
                  border: '1px solid #222222',
                  borderRadius: '6px',
                  padding: '18px 16px'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '4px',
                    backgroundColor: '#b7d600',
                    color: '#080808',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '900',
                    fontFamily: 'var(--font-mono)',
                    marginBottom: '12px'
                  }}>
                    1
                  </div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '800', margin: '0 0 6px', color: '#ffffff' }}>
                    Siapkan Kertas &amp; Dinding
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: '#888888', margin: 0, lineHeight: '1.5' }}>
                    Letakkan selembar kertas putih di lantai rata dengan tepi menempel rapat ke dinding. Pijak kertas dengan tumit menyentuh dinding.
                  </p>
                </div>

                <div style={{
                  backgroundColor: '#141414',
                  border: '1px solid #222222',
                  borderRadius: '6px',
                  padding: '18px 16px'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '4px',
                    backgroundColor: '#b7d600',
                    color: '#080808',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '900',
                    fontFamily: 'var(--font-mono)',
                    marginBottom: '12px'
                  }}>
                    2
                  </div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '800', margin: '0 0 6px', color: '#ffffff' }}>
                    Tandai Ujung Jari Terpanjang
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: '#888888', margin: 0, lineHeight: '1.5' }}>
                    Pegang pensil/pulpen secara tegak lurus, lalu tandai titik ujung jari kaki yang paling panjang (biasanya jempol atau jari telunjuk).
                  </p>
                </div>

                <div style={{
                  backgroundColor: '#141414',
                  border: '1px solid #222222',
                  borderRadius: '6px',
                  padding: '18px 16px'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '4px',
                    backgroundColor: '#b7d600',
                    color: '#080808',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '900',
                    fontFamily: 'var(--font-mono)',
                    marginBottom: '12px'
                  }}>
                    3
                  </div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '800', margin: '0 0 6px', color: '#ffffff' }}>
                    Ukur Jarak &amp; Beri Toleransi
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: '#888888', margin: 0, lineHeight: '1.5' }}>
                    Ukur jarak dari tepi kertas (tumit) ke tanda pensil dalam cm. Tambahkan <strong>0.5 cm - 1 cm</strong> untuk toleransi kaos kaki.
                  </p>
                </div>
              </div>

              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px dashed #333333',
                padding: '14px 18px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <Info size={20} color="#b7d600" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '0.78rem', color: '#aaaaaa', lineHeight: '1.5' }}>
                  <strong>Contoh Perhitungan:</strong> Jika panjang kaki Anda diukur 25.8 cm, maka tambahkan 0.7 cm menjadi 26.5 cm. Pada tabel ukuran Barokah Shoes, pilih ukuran <strong>EU 42</strong>.
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Tips Fitting & Garansi */}
          {activeTab === 'tips' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                backgroundColor: '#111111',
                padding: '18px 20px',
                borderRadius: '6px',
                border: '1px solid #222222',
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start'
              }}>
                <div style={{
                  backgroundColor: '#b7d600',
                  color: '#080808',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '900', margin: '0 0 4px', color: '#ffffff' }}>
                    GARANSI PENUKARAN UKURAN 7 HARI KERJA
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: '#aaaaaa', margin: 0, lineHeight: '1.6' }}>
                    Salah pilih ukuran? Jangan khawatir! Toko Barokah memberikan fasilitas penukaran ukuran (size exchange) hingga 7 hari kerja sejak barang diterima dengan syarat sepatu belum dipakai di luar ruangan (kondisi baru &amp; box lengkap).
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div style={{ backgroundColor: '#141414', padding: '16px', borderRadius: '6px', border: '1px solid #222222' }}>
                  <div style={{ fontWeight: '800', fontSize: '0.85rem', color: '#b7d600', marginBottom: '6px' }}>
                    👟 Sneakers &amp; Streetwear
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#888888', margin: 0, lineHeight: '1.5' }}>
                    Siluet sneakers Barokah didesain <strong>True To Size</strong>. Jika Anda memiliki punggung kaki lebar (wide feet), disarankan naik 1 size (+1) untuk kenyamanan optimal.
                  </p>
                </div>

                <div style={{ backgroundColor: '#141414', padding: '16px', borderRadius: '6px', border: '1px solid #222222' }}>
                  <div style={{ fontWeight: '800', fontSize: '0.85rem', color: '#b7d600', marginBottom: '6px' }}>
                    👞 Sepatu Kulit &amp; Formal Oxford
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#888888', margin: 0, lineHeight: '1.5' }}>
                    Sepatu kulit asli didesain dengan <strong>Snug Fit</strong>. Bahan kulit alami akan meregang secara fleksibel mengikuti bentuk kaki Anda setelah beberapa kali pemakaian.
                  </p>
                </div>

                <div style={{ backgroundColor: '#141414', padding: '16px', borderRadius: '6px', border: '1px solid #222222' }}>
                  <div style={{ fontWeight: '800', fontSize: '0.85rem', color: '#b7d600', marginBottom: '6px' }}>
                    🥾 Tactical Boots &amp; Outdoor
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#888888', margin: 0, lineHeight: '1.5' }}>
                    Disarankan memilih ukuran standar atau naik 1 size jika Anda berencana sering mengenakan kaos kaki wool / hiking tebal.
                  </p>
                </div>

                <div style={{ backgroundColor: '#141414', padding: '16px', borderRadius: '6px', border: '1px solid #222222' }}>
                  <div style={{ fontWeight: '800', fontSize: '0.85rem', color: '#b7d600', marginBottom: '6px' }}>
                    💬 Butuh Bantuan Konsultasi?
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#888888', margin: 0, lineHeight: '1.5' }}>
                    Tim Customer Care Barokah siap membantu mencocokkan ukuran kaki Anda melalui WhatsApp Official: <strong>081288667433</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 28px',
          borderTop: '1px solid #1f1f1f',
          backgroundColor: '#111111',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#777777', fontFamily: 'var(--font-mono)' }}>
            BAROKAH FOOTWEAR SIZING v2.6
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-accent btn-sm"
            style={{
              padding: '10px 22px',
              fontWeight: '800',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem'
            }}
          >
            MENGERTI &amp; KEMBALI <ArrowRight size={14} />
          </button>
        </div>

      </div>
    </div>
  );
};
