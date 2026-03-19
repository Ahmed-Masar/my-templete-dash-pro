import {
  LayoutDashboard,
  Home,
  Smartphone,
  Globe,
  Wrench,
  Grid,
  Tags,
  Building2,
  Award,
  Gift,
  ShoppingCart,
  Bell,
  User,
  Briefcase,
  MessageSquare,
  Languages,
  UserCog,
  Shield,
  type LucideIcon,
} from 'lucide-react';

interface TabMeta {
  title: string;
  icon: LucideIcon;
}

export const PATH_META: Record<string, TabMeta> = {
  '/dashboard': { title: 'Overview', icon: LayoutDashboard },
  '/dashboard/home': { title: 'Home Screen', icon: Home },
  '/dashboard/ads': { title: 'App Ads', icon: Smartphone },
  '/dashboard/website-ads': { title: 'Website Ads', icon: Globe },
  '/dashboard/products': { title: 'Products', icon: Wrench },
  '/dashboard/categories': { title: 'Categories', icon: Grid },
  '/dashboard/tags': { title: 'Tags', icon: Tags },
  '/dashboard/stores': { title: 'Stores', icon: Building2 },
  '/dashboard/sponsors': { title: 'Sponsors', icon: Award },
  '/dashboard/points-store': { title: 'Points Store', icon: Gift },
  '/dashboard/carts': { title: 'Orders & Carts', icon: ShoppingCart },
  '/dashboard/notifications': { title: 'Notifications', icon: Bell },
  '/dashboard/users': { title: 'Users', icon: User },
  '/dashboard/vendors': { title: 'Vendors', icon: Briefcase },
  '/dashboard/technicians': { title: 'Technicians', icon: UserCog },
  '/dashboard/reviews': { title: 'Reviews', icon: MessageSquare },
  '/dashboard/translations':  { title: 'Localization',  icon: Languages },
  '/dashboard/permissions':   { title: 'Permissions',   icon: Shield },
};

export function getTabIcon(path: string): LucideIcon {
  return PATH_META[path]?.icon ?? LayoutDashboard;
}

export function getTabTitle(path: string): string {
  return PATH_META[path]?.title ?? path;
}
