import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user session
  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Check local storage for mock session
      const savedMockUser = localStorage.getItem('barokah_mock_user');
      if (savedMockUser) {
        const parsed = JSON.parse(savedMockUser);
        setUser(parsed);
        setProfile(parsed.profile);
      }
      setLoading(false);
      return;
    }

    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        }
      } catch (err) {
        console.error('Session check error:', err);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id, session.user);
      } else {
        setUser(null);
        setProfile(null);
        localStorage.removeItem('barokah_mock_user');
        localStorage.removeItem('barokah_wishlist');
        localStorage.removeItem('barokah_orders');
        localStorage.removeItem('barokah_cart');
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Fetch user profile from Supabase profiles table
  const fetchProfile = async (userId, currentUser = null) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const userEmail = data?.email || currentUser?.email || '';
      const isAdminEmail = userEmail.toLowerCase().includes('admin') || userEmail.toLowerCase() === 'jun123@gmail.com';

      // Load cached local backup if any
      let localBackup = {};
      try {
        localBackup = JSON.parse(localStorage.getItem(`barokah_profile_${userId}`) || '{}');
      } catch (e) {}

      const meta = currentUser?.user_metadata || {};

      const resolvedName = data?.name || data?.full_name || meta.full_name || meta.name || localBackup.name || (isAdminEmail ? 'Administrator' : 'Pelanggan');
      const resolvedPhone = data?.phone || data?.phone_number || meta.phone || meta.phone_number || localBackup.phone || '';
      const resolvedAddress = data?.address || meta.address || localBackup.address || '';
      const resolvedPostalCode = data?.postal_code || data?.postalCode || meta.postal_code || meta.postalCode || localBackup.postal_code || '';
      const resolvedCity = data?.city || meta.city || localBackup.city || '';
      const resolvedProvince = data?.province || meta.province || localBackup.province || '';

      const updatedProfile = {
        ...(data || {}),
        id: userId,
        email: userEmail,
        role: isAdminEmail ? 'admin' : (data?.role || 'customer'),
        name: resolvedName,
        full_name: resolvedName,
        phone: resolvedPhone,
        phone_number: resolvedPhone,
        address: resolvedAddress,
        postal_code: resolvedPostalCode,
        postalCode: resolvedPostalCode,
        city: resolvedCity,
        province: resolvedProvince
      };

      if (data && isAdminEmail && data.role !== 'admin') {
        await supabase.from('profiles').update({ role: 'admin' }).eq('id', userId);
        updatedProfile.role = 'admin';
      }

      setProfile(updatedProfile);
      localStorage.setItem(`barokah_profile_${userId}`, JSON.stringify(updatedProfile));
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  // Sign In
  const signIn = async (email, password) => {
    if (!isSupabaseConfigured) {
      // Mock sign in for testing
      const isMockAdmin = email.toLowerCase().includes('admin');
      const mockUserData = {
        id: 'mock-user-' + Date.now(),
        email,
        profile: {
          id: 'mock-user-' + Date.now(),
          full_name: isMockAdmin ? 'Administrator Barokah' : 'Pelanggan Setia',
          role: isMockAdmin ? 'admin' : 'customer',
          phone_number: '081234567890',
          phone: '081234567890'
        }
      };
      setUser(mockUserData);
      setProfile(mockUserData.profile);
      localStorage.setItem('barokah_mock_user', JSON.stringify(mockUserData));
      toast.success(isMockAdmin ? 'Login Admin Mode Berhasil (Mock)' : 'Login Berhasil (Mock)');
      return { data: { user: mockUserData }, error: null, role: mockUserData.profile.role };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // Fetch profile to get role before returning
      let role = 'customer';
      if (data?.user?.id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();
        if (profileData?.role) {
          role = profileData.role;
        }
      }
      toast.success('Selamat datang kembali!');
      return { data, error: null, role };
    } catch (err) {
      toast.error(err.message || 'Gagal masuk. Periksa email dan password.');
      return { data: null, error: err };
    }
  };

  // Sign Up
  const signUp = async (email, password, fullName, extraData = {}) => {
    const phone = extraData.phone || extraData.phoneNumber || '';
    const address = extraData.address || '';
    const postal_code = extraData.postal_code || extraData.postalCode || '';
    const city = extraData.city || '';
    const province = extraData.province || '';

    if (!isSupabaseConfigured) {
      const mockUserData = {
        id: 'mock-user-' + Date.now(),
        email,
        profile: {
          id: 'mock-user-' + Date.now(),
          full_name: fullName,
          name: fullName,
          role: 'customer',
          phone_number: phone,
          phone: phone,
          address: address,
          postal_code: postal_code,
          postalCode: postal_code,
          city: city,
          province: province
        }
      };
      setUser(mockUserData);
      setProfile(mockUserData.profile);
      localStorage.setItem('barokah_mock_user', JSON.stringify(mockUserData));
      localStorage.setItem(`barokah_profile_${mockUserData.id}`, JSON.stringify(mockUserData.profile));
      toast.success('Pendaftaran berhasil! Akun Anda aktif.');
      return { data: { user: mockUserData }, error: null };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            name: fullName,
            phone: phone,
            phone_number: phone,
            address: address,
            postal_code: postal_code,
            city: city,
            province: province
          }
        }
      });
      if (error) throw error;

      const newUser = data?.session?.user || data?.user;
      if (newUser?.id) {
        const localProfile = {
          id: newUser.id,
          email,
          name: fullName,
          full_name: fullName,
          phone: phone,
          phone_number: phone,
          address: address,
          postal_code: postal_code,
          postalCode: postal_code,
          city: city,
          province: province,
          role: 'customer'
        };
        localStorage.setItem(`barokah_profile_${newUser.id}`, JSON.stringify(localProfile));
        setProfile(localProfile);

        // Direct update to profiles table
        try {
          await supabase.from('profiles').upsert({
            id: newUser.id,
            name: fullName,
            email: email,
            phone: phone,
            phone_number: phone,
            address: address,
            postal_code: postal_code,
            city: city,
            province: province,
            role: 'customer'
          }, { onConflict: 'id' });
        } catch (dbErr) {
          console.warn('Direct profile upsert notice:', dbErr);
        }
      }

      if (data?.session) {
        setUser(data.session.user);
        await fetchProfile(data.session.user.id, data.session.user);
        toast.success('Pendaftaran berhasil! Akun Anda aktif.');
      } else {
        // Try immediate sign in in case project auto-confirms email
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (!signInErr && signInData?.session) {
          setUser(signInData.session.user);
          await fetchProfile(signInData.session.user.id, signInData.session.user);
          toast.success('Pendaftaran berhasil! Akun Anda aktif.');
        } else {
          toast.success('Pendaftaran berhasil! Silakan cek email jika butuh konfirmasi.');
        }
      }
      return { data, error: null };
    } catch (err) {
      const isSignupDisabled = err.message?.toLowerCase().includes('signups not allowed');
      const isDbError = err.message?.toLowerCase().includes('database error saving new user');

      if (isSignupDisabled) {
        toast.error('Pendaftaran dinonaktifkan di Supabase. Aktifkan "Allow new users to sign up" di Dashboard.', { duration: 6000 });
      } else if (isDbError) {
        toast.error('Supabase Database Error: Trigger auth.users profiles bermasalah. Lihat panduan SQL perbaikan di bawah.', { duration: 7000 });
      } else {
        toast.error(err.message || 'Gagal mendaftar akun.');
      }
      return { data: null, error: err, isSignupDisabled, isDbError };
    }
  };

  // Update profile helper
  const updateProfileData = async (updates) => {
    if (!user) return;
    const newProfile = {
      ...profile,
      ...updates
    };
    setProfile(newProfile);
    localStorage.setItem(`barokah_profile_${user.id}`, JSON.stringify(newProfile));

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id);
      } catch (err) {
        console.warn('Update profile error:', err);
      }
    }
  };

  // Sign in as Demo / Guest user (helpful when Supabase signup is toggled off)
  const signInAsDemo = (name = 'Pelanggan Barokah', customEmail = 'user@barokahshoes.id') => {
    const demoUser = {
      id: 'demo-user-' + Date.now(),
      email: customEmail,
      profile: {
        id: 'demo-user-' + Date.now(),
        full_name: name,
        name: name,
        role: 'customer',
        phone_number: '081234567890',
        phone: '081234567890'
      }
    };
    setUser(demoUser);
    setProfile(demoUser.profile);
    localStorage.setItem('barokah_mock_user', JSON.stringify(demoUser));
    toast.success('Masuk sebagai Akun Uji Coba: ' + name);
    return demoUser;
  };

  // Sign Out
  const signOut = async () => {
    // Clear all user related items from storage
    localStorage.removeItem('barokah_mock_user');
    localStorage.removeItem('barokah_orders');
    localStorage.removeItem('barokah_wishlist');
    localStorage.removeItem('barokah_cart');

    setUser(null);
    setProfile(null);

    // Notify other components/contexts to clear their local states immediately
    window.dispatchEvent(new Event('barokah:logout'));

    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Sign out error:', err);
      }
    }

    toast.success('Berhasil keluar akun');

    // Langsung kembali ke halaman utama / landing page
    if (window.location.pathname !== '/') {
      window.location.href = '/';
    }
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      role: profile?.role || 'customer',
      isAdmin,
      loading,
      signIn,
      signUp,
      signOut,
      logout: signOut,
      signInAsDemo,
      fetchProfile,
      updateProfileData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
