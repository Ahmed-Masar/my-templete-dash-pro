import { User } from '@/store/slices/authSlice';

// Maps each dashboard path to its required permission key.
// null means no permission required (accessible to all authenticated users).
export const PATH_PERMISSION_MAP: Record<string, string | null> = {
  '/dashboard':             'stats',
  '/dashboard/home':        'home',
  '/dashboard/ads':         'ads',
  '/dashboard/website-ads': 'ads',
  '/dashboard/products':    'products',
  '/dashboard/categories':  'categories',
  '/dashboard/tags':        'tags',
  '/dashboard/stores':      'stores',
  '/dashboard/sponsors':    'sponsors',
  '/dashboard/points-store':'points-store',
  '/dashboard/translations': null,
  '/dashboard/permissions':  'users',
  '/dashboard/carts':       'carts',
  '/dashboard/notifications':'notifications',
  '/dashboard/users':       'users',
  '/dashboard/vendors':     'vendors',
  '/dashboard/technicians': 'erp',
  '/dashboard/reviews':     'reviews',
};

// Ordered list used to find the first accessible page for a user.
export const ORDERED_DASHBOARD_PATHS = [
  '/dashboard',
  '/dashboard/home',
  '/dashboard/ads',
  '/dashboard/products',
  '/dashboard/categories',
  '/dashboard/tags',
  '/dashboard/stores',
  '/dashboard/sponsors',
  '/dashboard/points-store',
  '/dashboard/translations',
  '/dashboard/carts',
  '/dashboard/notifications',
  '/dashboard/users',
  '/dashboard/vendors',
  '/dashboard/technicians',
  '/dashboard/reviews',
];

export function hasPermission(user: User | null, key: string | null): boolean {
  if (!user) return false;
  if (key === null) return true;
  const pages: string[] = user.pages ?? [];
  return pages.includes('all') || pages.includes(key);
}

export function canAccessPath(user: User | null, path: string): boolean {
  const key = PATH_PERMISSION_MAP[path];
  if (key === undefined) return true; // unknown path → allow
  return hasPermission(user, key);
}

export function getFirstAllowedPath(user: User | null): string | null {
  for (const path of ORDERED_DASHBOARD_PATHS) {
    if (canAccessPath(user, path)) return path;
  }
  return null;
}
