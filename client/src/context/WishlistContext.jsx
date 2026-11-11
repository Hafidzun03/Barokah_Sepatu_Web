import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('barokah_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // When user is not logged in or logs out, immediately clear wishlist state & storage
  useEffect(() => {
    if (!user) {
      setWishlist([]);
      localStorage.removeItem('barokah_wishlist');
    }
  }, [user]);

  // Listen for global logout event
  useEffect(() => {
    const handleLogout = () => {
      setWishlist([]);
      localStorage.removeItem('barokah_wishlist');
    };
    window.addEventListener('barokah:logout', handleLogout);
    return () => window.removeEventListener('barokah:logout', handleLogout);
  }, []);

  // Save to localStorage only when user is active
  useEffect(() => {
    if (user) {
      localStorage.setItem('barokah_wishlist', JSON.stringify(wishlist));
    } else {
      localStorage.removeItem('barokah_wishlist');
    }
  }, [wishlist, user]);

  // Sync with Supabase wishlists table if user is authenticated
  useEffect(() => {
    if (!isSupabaseConfigured || !user) return;

    const fetchSupabaseWishlist = async () => {
      try {
        const { data, error } = await supabase
          .from('wishlists')
          .select('product_id, products(*)')
          .eq('user_id', user.id);

        if (!error && data && data.length > 0) {
          const dbProducts = data
            .map(item => item.products)
            .filter(Boolean);

          setWishlist(prev => {
            const combined = [...prev];
            dbProducts.forEach(dbp => {
              if (!combined.some(p => p.id === dbp.id)) {
                combined.push(dbp);
              }
            });
            return combined;
          });
        }
      } catch (err) {
        console.warn('Wishlist sync notice:', err);
      }
    };

    fetchSupabaseWishlist();
  }, [user]);

  const isInWishlist = (productId) => {
    if (!productId) return false;
    return wishlist.some(item => String(item.id) === String(productId));
  };

  const toggleWishlist = async (product) => {
    if (!product || !product.id) return;

    const exists = isInWishlist(product.id);

    if (exists) {
      setWishlist(prev => prev.filter(item => String(item.id) !== String(product.id)));
      toast('Dihapus dari wishlist', {
        icon: '💔',
        duration: 2000,
        style: {
          background: '#1a1a1a',
          color: '#ffffff',
          borderRadius: '8px'
        }
      });

      if (isSupabaseConfigured && user) {
        try {
          await supabase
            .from('wishlists')
            .delete()
            .eq('user_id', user.id)
            .eq('product_id', product.id);
        } catch {
          // ignore
        }
      }
    } else {
      setWishlist(prev => [product, ...prev]);
      toast('Ditambahkan ke favorit!', {
        icon: '❤️',
        duration: 2500,
        style: {
          background: '#080808',
          color: '#ffffff',
          border: '1px solid #b7d600',
          borderRadius: '8px'
        }
      });

      if (isSupabaseConfigured && user) {
        try {
          await supabase
            .from('wishlists')
            .upsert({
              user_id: user.id,
              product_id: product.id
            });
        } catch {
          // ignore
        }
      }
    }
  };

  const removeFromWishlist = (productId) => {
    setWishlist(prev => prev.filter(item => String(item.id) !== String(productId)));
    toast('Dihapus dari favorit', { icon: '🗑️' });
  };

  return (
    <WishlistContext.Provider value={{
      wishlist,
      totalWishlist: wishlist.length,
      isInWishlist,
      toggleWishlist,
      removeFromWishlist
    }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
