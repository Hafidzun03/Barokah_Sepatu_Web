import { supabase, isSupabaseConfigured } from './supabase';
import { sampleProducts, sampleCategories } from '../data/sampleProducts';

// Fetch all active products
export const getProducts = async () => {
  if (!isSupabaseConfigured) {
    return sampleProducts;
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        description,
        base_price,
        discount_price,
        weight_grams,
        is_featured,
        is_active,
        total_sold,
        category_id,
        created_at,
        categories ( id, name, slug ),
        product_variants ( id, size, stock, sku ),
        product_images ( id, image_url, is_primary, sort_order )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase products fetch error, using sample data:', error);
      return sampleProducts;
    }
    // If no active products yet in DB, return empty array (don't mask with sample data)
    if (!data || data.length === 0) return [];

    // Curated high-resolution sneaker images for sample products if image_url is placeholder
    const sneakerFallbackImages = {
      'barokah-runner-pro-x': ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'],
      'urban-classic-leather': ['https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80'],
      'street-flex-canvas': ['https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80'],
      'lady-comfort-slip-on': ['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80'],
      'junior-active-velcro': ['https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&w=800&q=80'],
      'summit-trail-hiker': ['https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80']
    };

    // Map DB format to uniform frontend shape
    return data.map(item => {
      const primaryVariant = item.product_variants?.[0];
      const fallbackList = sneakerFallbackImages[item.slug] || ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'];

      // Sort images by sort_order or is_primary
      const sortedImages = (item.product_images || [])
        .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) || (a.sort_order - b.sort_order))
        .map(img => img.image_url)
        .filter(url => url && !url.includes('placehold.co'));

      const defaultImage = sortedImages.length > 0 ? sortedImages : fallbackList;

      return {
        id: item.id,
        name: item.name,
        slug: item.slug || (item.name ? item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : item.id),
        sku: primaryVariant?.sku || `BRK-${String(item.id).slice(0, 4).toUpperCase()}`,
        description: item.description,
        price: item.base_price,
        base_price: item.base_price,
        discount_price: item.discount_price,
        brand: 'Barokah',
        weight_grams: item.weight_grams || 850,
        is_featured: !!item.is_featured,
        is_active: item.is_active !== false,
        category_id: item.category_id,
        category_name: item.categories?.name || 'Footwear',
        rating: 4.9,
        reviews_count: 24,
        total_sold: item.total_sold || 0,
        images: defaultImage,
        variants: (item.product_variants || []).map(v => ({
          id: v.id,
          size: v.size,
          stock: v.stock,
          sku: v.sku,
        }))
      };
    });
  } catch (err) {
    console.error('Error fetching Supabase products:', err);
    return sampleProducts;
  }
};

// Fetch categories
export const getCategories = async () => {
  if (!isSupabaseConfigured) {
    return sampleCategories;
  }

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return sampleCategories;
    }
    return data;
  } catch {
    return sampleCategories;
  }
};
