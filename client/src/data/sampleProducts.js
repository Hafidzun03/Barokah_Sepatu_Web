export const sampleCategories = [
  { id: '1', name: 'Sneakers', slug: 'sneakers', description: 'Sepatu kasual harian, street style, dan lifestyle trendi.' },
  { id: '2', name: 'Formal & Kerja', slug: 'formal-kerja', description: 'Sepatu pantofel, oxford, dan derby untuk profesional.' },
  { id: '3', name: 'Boots & Outdoor', slug: 'boots-outdoor', description: 'Sepatu boots tangguh untuk petualangan dan gaya maskulin.' },
  { id: '4', name: 'Sandal & Kasual', slug: 'sandal-kasual', description: 'Sandal santai kulit dan slip-on nyaman setiap hari.' },
  { id: '5', name: 'Sepatu Olahraga', slug: 'olahraga', description: 'Sepatu lari, training, dan aktivitas atletik performa tinggi.' },
  { id: '6', name: 'Sepatu Anak', slug: 'sepatu-anak', description: 'Koleksi sepatu anak nyaman, ceria, dan aman melangkah.' }
];

export const sampleProducts = [
  {
    id: 'prod-1',
    name: 'Barokah Air Legacy Pro',
    slug: 'barokah-air-legacy-pro',
    sku: 'BS-AIR-001',
    category_id: '1',
    category_name: 'Sneakers',
    description: 'Sneaker lifestyle premium dengan peredam kejut bantalan udara dan kulit sintetis berpori mikro yang nyaman dipakai sepanjang hari. Didesain untuk kenyamanan maksimal dan penampilan stylish.',
    price: 650000,
    discount_price: 549000,
    weight_grams: 850,
    is_featured: true,
    rating: 4.9,
    reviews_count: 84,
    total_sold: 215,
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80'
    ],
    variants: [
      { id: 'v1-39', size: '39', stock: 12 },
      { id: 'v1-40', size: '40', stock: 18 },
      { id: 'v1-41', size: '41', stock: 25 },
      { id: 'v1-42', size: '42', stock: 15 },
      { id: 'v1-43', size: '43', stock: 8 },
      { id: 'v1-44', size: '44', stock: 4 }
    ]
  },
  {
    id: 'prod-2',
    name: 'Royal Oxford Formal Classic',
    slug: 'royal-oxford-formal-classic',
    sku: 'BS-OXF-002',
    category_id: '2',
    category_name: 'Formal & Kerja',
    description: 'Sepatu pantofel kulit sapi asli dengan jahitan tangan Goodyear welted. Tampilan mengkilap elegan cocok untuk acara formal, kantor, dan pertemuan bisnis.',
    price: 890000,
    discount_price: 780000,
    weight_grams: 950,
    is_featured: true,
    rating: 4.8,
    reviews_count: 42,
    total_sold: 120,
    images: [
      'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=800&q=80'
    ],
    variants: [
      { id: 'v2-39', size: '39', stock: 6 },
      { id: 'v2-40', size: '40', stock: 10 },
      { id: 'v2-41', size: '41', stock: 14 },
      { id: 'v2-42', size: '42', stock: 12 },
      { id: 'v2-43', size: '43', stock: 5 }
    ]
  },
  {
    id: 'prod-3',
    name: 'Timber Nomad Tactical Boots',
    slug: 'timber-nomad-tactical-boots',
    sku: 'BS-BOT-003',
    category_id: '3',
    category_name: 'Boots & Outdoor',
    description: 'Boots outdoor tahan air (waterproof) dengan sol vibram anti selip. Proteksi optimal untuk medan terjal, pendakian, touring motor, dan gaya urban rugged.',
    price: 1100000,
    discount_price: 950000,
    weight_grams: 1300,
    is_featured: true,
    rating: 5.0,
    reviews_count: 56,
    total_sold: 98,
    images: [
      'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=800&q=80'
    ],
    variants: [
      { id: 'v3-40', size: '40', stock: 8 },
      { id: 'v3-41', size: '41', stock: 15 },
      { id: 'v3-42', size: '42', stock: 11 },
      { id: 'v3-43', size: '43', stock: 7 },
      { id: 'v3-44', size: '44', stock: 3 }
    ]
  },
  {
    id: 'prod-4',
    name: 'SpeedStride Ultra Running',
    slug: 'speedstride-ultra-running',
    sku: 'BS-RUN-004',
    category_id: '5',
    category_name: 'Sepatu Olahraga',
    description: 'Sepatu lari super ringan dengan teknologi pelat nilon responsif dan upper engineered mesh bernapas. Menghadirkan pantulan energi maksimal di setiap langkah.',
    price: 750000,
    discount_price: null,
    weight_grams: 620,
    is_featured: false,
    rating: 4.7,
    reviews_count: 38,
    total_sold: 140,
    images: [
      'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?auto=format&fit=crop&w=800&q=80'
    ],
    variants: [
      { id: 'v4-39', size: '39', stock: 9 },
      { id: 'v4-40', size: '40', stock: 14 },
      { id: 'v4-41', size: '41', stock: 20 },
      { id: 'v4-42', size: '42', stock: 18 },
      { id: 'v4-43', size: '43', stock: 6 }
    ]
  },
  {
    id: 'prod-5',
    name: 'ComfortGlide Leather Slides',
    slug: 'comfortglide-leather-slides',
    sku: 'BS-SAN-005',
    category_id: '4',
    category_name: 'Sandal & Kasual',
    description: 'Sandal selop kulit sintetis premium dengan bantalan anatomis arch support. Ringan, elegan, dan sangat empuk untuk penggunaan santai sehari-hari.',
    price: 299000,
    discount_price: 249000,
    weight_grams: 480,
    is_featured: false,
    rating: 4.6,
    reviews_count: 67,
    total_sold: 310,
    images: [
      'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=800&q=80'
    ],
    variants: [
      { id: 'v5-39', size: '39', stock: 15 },
      { id: 'v5-40', size: '40', stock: 25 },
      { id: 'v5-41', size: '41', stock: 30 },
      { id: 'v5-42', size: '42', stock: 20 },
      { id: 'v5-43', size: '43', stock: 10 }
    ]
  },
  {
    id: 'prod-6',
    name: 'Little Champion Kids Sneaker',
    slug: 'little-champion-kids-sneaker',
    sku: 'BS-KID-006',
    category_id: '6',
    category_name: 'Sepatu Anak',
    description: 'Sneaker anak dengan velcro strap praktis tanpa tali ribet. Sol karet antislip yang aman untuk bermain, lari, dan aktivitas sekolah anak.',
    price: 320000,
    discount_price: 279000,
    weight_grams: 410,
    is_featured: false,
    rating: 4.9,
    reviews_count: 29,
    total_sold: 88,
    images: [
      'https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?auto=format&fit=crop&w=800&q=80'
    ],
    variants: [
      { id: 'v6-30', size: '30', stock: 10 },
      { id: 'v6-31', size: '31', stock: 12 },
      { id: 'v6-32', size: '32', stock: 15 },
      { id: 'v6-33', size: '33', stock: 11 },
      { id: 'v6-34', size: '34', stock: 8 },
      { id: 'v6-35', size: '35', stock: 7 }
    ]
  }
];
