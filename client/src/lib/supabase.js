import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = 
  supabaseUrl.startsWith('https://') && 
  supabaseAnonKey.length > 20 &&
  !supabaseUrl.includes('YOUR_SUPABASE');

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: { persistSession: false }
    });

if (!isSupabaseConfigured) {
  console.warn(
    '⚠️ Supabase belum terkonfigurasi dengan URL & Anon Key yang valid di client/.env.\n' +
    'Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY dari dashboard Supabase Anda.'
  );
}

// Dedicated memory-only admin client for administrative database operations (never alters customer localStorage session)
let _adminClient = null;
export const getAdminClient = async () => {
  if (!isSupabaseConfigured) return null;
  try {
    if (!_adminClient) {
      _adminClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      });
    }
    const { data: { session } } = await _adminClient.auth.getSession();
    if (!session) {
      await _adminClient.auth.signInWithPassword({
        email: 'admin@barokahshoes.id',
        password: 'AdminPassword123!'
      });
    }
    return _adminClient;
  } catch (err) {
    console.warn('getAdminClient warning:', err);
    return null;
  }
};
