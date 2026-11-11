import React, { useState } from 'react';
import { isSupabaseConfigured } from '../lib/supabase';
import { AlertCircle, X, ExternalLink } from 'lucide-react';

export const SupabaseNotice = () => {
  const [dismissed, setDismissed] = useState(false);

  if (isSupabaseConfigured || dismissed) return null;

  return (
    <div style={{
      backgroundColor: '#fef3c7',
      borderBottom: '1px solid #fde68a',
      color: '#92400e',
      padding: '10px 16px',
      fontSize: '0.875rem'
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} color="#d97706" />
          <span>
            <strong>Mode Demo Aktif:</strong> Supabase URL & Anon Key belum diisi di <code>client/.env</code>. Anda tetap bisa mencoba belanja, checkout, dan login dengan data sample!
          </span>
        </div>
        <button 
          onClick={() => setDismissed(true)} 
          style={{ color: '#92400e', display: 'flex', alignItems: 'center', padding: '4px' }}
          title="Tutup pemberitahuan"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
