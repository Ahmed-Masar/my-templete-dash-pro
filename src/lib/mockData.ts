export const MOCK_USER = {
  _id: 'mock-user-1',
  email: 'admin@vodex.com',
  name: 'مدير النظام',
  role: 'admin',
  pages: ['all'],
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const MOCK_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Im1vY2stdXNlci0xIiwiaWF0IjoxNzEwNjMyNDAwLCJleHAiOjE4MTA2MzI0MDB9.mock_signature';

export const MOCK_STATS = {
  totals: {
    products: 1250,
    stores: 45,
    categories: 12,
    tags: 85,
    reviews: 450,
    users: {
      total: 1500,
      user: 1200,
      vendor: 250,
      technician: 40,
      admin: 5,
      sales: 5,
    },
    carts: {
      total: 850,
      draft: 120,
      generated: 45,
      completed: 650,
      cancelled: 35,
    },
  },
  financial: {
    totalRevenue: 25000000,
    totalOrders: 650,
    avgOrderValue: 38500,
    totalPointsIssued: 15000,
    totalVendorPointsIssued: 5000,
    profit: {
      totalRevenue: 25000000,
      totalJumlaaCost: 18000000,
      grossProfit: 7000000,
    },
    pointsInWallets: {
      totalUserPoints: 12000,
      totalVendorPoints: 4000,
    },
  },
  topProducts: [
    { name: 'منتج ممتاز 1', store: 'متجر الورد', price: 25000, jumlaaPrice: 18000, avgRating: 4.8, soldCount: 150 },
    { name: 'منتج رائع 2', store: 'متجر الأمل', price: 15000, jumlaaPrice: 10000, avgRating: 4.5, soldCount: 120 },
  ],
  topStoresByProducts: [
    { name: 'متجر الورد', productCount: 450 },
    { name: 'متجر الأمل', productCount: 320 },
  ],
  topStoresByOrders: [
    { name: 'متجر الورد', revenue: 5000000 },
    { name: 'متجر الأمل', revenue: 3500000 },
  ],
};

export const MOCK_COMPANIES = [
  {
    _id: 'mock-company-1',
    name: 'TechCorp Solutions',
    logo: undefined,
    customFields: { industry: 'Technology' },
    createdBy: { _id: '1', name: 'Admin', email: 'admin@vodex.com' },
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  },
];

export const MOCK_CLIENTS = [
  {
    _id: 'mock-client-1',
    name: 'John Smith',
    email: 'john@techcorp.com',
    phone: '+1 (555) 123-4567',
    avatar: undefined,
    companyId: { _id: 'mock-company-1', name: 'TechCorp Solutions' },
    customFields: {},
    createdBy: { _id: '1', name: 'Admin', email: 'admin@vodex.com' },
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  },
];

export const MOCK_PROJECTS = [
  {
    _id: 'mock-project-1',
    name: 'E-commerce Platform',
    status: 'active',
    images: [],
    clientId: {
      _id: 'mock-client-1',
      name: 'John Smith',
      companyId: { _id: 'mock-company-1', name: 'TechCorp Solutions' },
    },
    customFields: {},
    createdBy: { _id: '1', name: 'Admin', email: 'admin@vodex.com' },
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  },
];

export const MOCK_FIELDS = {
  company: [],
  client: [],
  project: [],
};

export const MOCK_ADS = [
  { _id: '1', title: 'إعلان 1', image: 'https://via.placeholder.com/800x400', isActive: true, createdAt: new Date().toISOString() },
];

export const MOCK_CATEGORIES = [
  { _id: '1', name: 'إلكترونيات', image: 'https://via.placeholder.com/100', slug: 'electronics' },
];

export const MOCK_PRODUCTS = [
  { _id: '1', name: 'منتج 1', price: 100, category: '1', stock: 50, image: 'https://via.placeholder.com/200' },
];

export const MOCK_USERS = [
  { _id: '1', name: 'أحمد محمد', phone: '0501234567', role: 'user', isActive: true },
];

export const MOCK_STORES = [
  { _id: '1', name: 'متجر الورد', logo: 'https://via.placeholder.com/100', rating: 4.5 },
];

export const MOCK_NOTIFICATIONS = [
  { _id: '1', title: 'تنبيه جديد', body: 'لديك طلب جديد قيد الانتظار', createdAt: new Date().toISOString() },
];

export const MOCK_REVIEWS = [
  { _id: '1', user: 'أحمد', rating: 5, comment: 'ممتاز جداً', status: 'approved' },
];

export const MOCK_CARTS = [
  { _id: '1', user: { name: 'زائر 1' }, items: [], total: 500, status: 'pending' },
];

export const MOCK_WEBSITE_ADS = [
  { _id: '1', title: 'بانر رئيسي', position: 'top', image: 'https://via.placeholder.com/1200x200' },
];

export const MOCK_SPONSORS = [
  { _id: '1', name: 'الراعي 1', logo: 'https://via.placeholder.com/150' },
];

export const MOCK_TAGS = [
  { _id: '1', name: 'جديد' },
];

export const MOCK_POINTS_STORE = [
  { _id: '1', name: 'قسيمة شراء', points: 1000, value: 50 },
];
