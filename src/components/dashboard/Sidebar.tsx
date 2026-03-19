"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import Image from 'next/image';
import logo from '@/assets/Sahel Jeddah Logo 2.png';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { openTab } from '@/store/slices/tabsSlice';
import { getTabTitle } from '@/lib/tabMeta';
import { hasPermission } from '@/lib/permissions';
import {
  ArrowRight2 as ChevronRight,
  ArrowLeft2 as ChevronLeft,
  HambergerMenu as Menu,
  Element3 as LayoutDashboard,
  Home2 as Home,
  Speaker as Megaphone,
  Mobile as Smartphone,
  SecuritySafe as Shield,
  Global as Globe,
  ShoppingBag,
  Setting5 as Wrench,
  Shop as Store,
  Buildings2 as Building2,
  Briefcase,
  Gift,
  ShoppingCart,
  People as Users,
  User,
  Messages1 as MessageSquare,
  Tag as Tags,
  Grid2 as Grid,
  Award,
  Notification as Bell,
  Translate as Languages,
  UserOctagon as UserCog,
} from 'iconsax-react';


type SubItem = { label: string; path: string; icon: React.ElementType; permission?: string | null };

type MenuItemMain = {
  type: 'main';
  label: string;
  icon: React.ElementType;
  path: string;
  permission?: string | null;
};

type MenuItemExpandable = {
  type: 'expandable';
  id: string;
  label: string;
  icon: React.ElementType;
  items: SubItem[];
};

type MenuItem = MenuItemMain | MenuItemExpandable;


const MENU_ITEMS: MenuItem[] = [
  { type: 'main', label: 'Overview', icon: LayoutDashboard, path: '/dashboard', permission: 'stats' },
  { type: 'main', label: 'Home Screen', icon: Home, path: '/dashboard/home', permission: 'home' },
  {
    type: 'expandable',
    id: 'ads',
    label: 'Advertisements',
    icon: Megaphone,
    items: [
      { label: 'App Ads', path: '/dashboard/ads', icon: Smartphone, permission: 'ads' },
      { label: 'Website Ads', path: '/dashboard/website-ads', icon: Globe, permission: 'ads' },
    ],
  },
  {
    type: 'expandable',
    id: 'catalog',
    label: 'Catalog',
    icon: ShoppingBag,
    items: [
      { label: 'Products', path: '/dashboard/products', icon: Wrench, permission: 'products' },
      { label: 'Categories', path: '/dashboard/categories', icon: Grid, permission: 'categories' },
      { label: 'Tags', path: '/dashboard/tags', icon: Tags, permission: 'tags' },
    ],
  },
  {
    type: 'expandable',
    id: 'partners',
    label: 'Partners',
    icon: Store,
    items: [
      { label: 'Stores', path: '/dashboard/stores', icon: Building2, permission: 'stores' },
      { label: 'Sponsors', path: '/dashboard/sponsors', icon: Award, permission: 'sponsors' },
    ],
  },
  { type: 'main', label: 'Points Store', icon: Gift, path: '/dashboard/points-store', permission: 'points-store' },
  { type: 'main', label: 'Localization', icon: Languages, path: '/dashboard/translations', permission: null },
  { type: 'main', label: 'Permissions', icon: Shield, path: '/dashboard/permissions', permission: 'users' },
  { type: 'main', label: 'Orders & Carts', icon: ShoppingCart, path: '/dashboard/carts', permission: 'carts' },
  { type: 'main', label: 'Notifications', icon: Bell, path: '/dashboard/notifications', permission: 'notifications' },
  {
    type: 'expandable',
    id: 'approvals',
    label: 'Approvals',
    icon: Users,
    items: [
      { label: 'Users', path: '/dashboard/users', icon: User, permission: 'users' },
      { label: 'Vendors', path: '/dashboard/vendors', icon: Briefcase, permission: 'vendors' },
      { label: 'Technicians', path: '/dashboard/technicians', icon: UserCog, permission: 'erp' },
      { label: 'Reviews', path: '/dashboard/reviews', icon: MessageSquare, permission: 'reviews' },
    ],
  },
];


function getActiveGroupId(pathname: string, items: MenuItem[]): string | null {
  for (const item of items) {
    if (item.type === 'expandable') {
      if (item.items.some((sub) => sub.path === pathname)) return item.id;
    }
  }
  return null;
}


interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const user = useAppSelector((state) => state.auth.user);

  // Build a filtered menu based on user permissions
  const visibleItems = useMemo<MenuItem[]>(() => MENU_ITEMS.reduce<MenuItem[]>((acc, item) => {
    if (item.type === 'main') {
      if (hasPermission(user, item.permission ?? null)) acc.push(item);
    } else {
      const visibleSubItems = item.items.filter((sub) => hasPermission(user, sub.permission ?? null));
      if (visibleSubItems.length > 0) acc.push({ ...item, items: visibleSubItems });
    }
    return acc;
  }, []), [user]);

  // Single set tracks which group IDs are open
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const activeId = getActiveGroupId(pathname, MENU_ITEMS);
    return activeId ? new Set([activeId]) : new Set();
  });

  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const [tooltipBlocked, setTooltipBlocked] = useState(false);
  const [overviewEntrance, setOverviewEntrance] = useState(false);

  useEffect(() => {
    const key = 'sj-overview-entrance';
    if (!sessionStorage.getItem(key)) {
      setOverviewEntrance(true);
      sessionStorage.setItem(key, '1');
    }
  }, []);

  // Auto-expand the group of the active route when pathname or visibleItems changes.
  // Also auto-expand single-item groups (no point collapsing them).
  useEffect(() => {
    const activeId = getActiveGroupId(pathname, visibleItems);
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (activeId) next.add(activeId);
      // Auto-expand groups that have only one visible sub-item
      for (const item of visibleItems) {
        if (item.type === 'expandable' && item.items.length === 1) next.add(item.id);
      }
      return next;
    });
  }, [pathname, visibleItems.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Collapse all groups when sidebar collapses
  useEffect(() => {
    if (collapsed) setExpandedGroups(new Set());
  }, [collapsed]);

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const isActive = (path: string) => pathname === path;

  const isGroupActive = (item: MenuItemExpandable) =>
    item.items.some((sub) => isActive(sub.path));

  const navigate = (path: string) => {
    setTooltipBlocked(true);
    setTimeout(() => setTooltipBlocked(false), 500);
    dispatch(openTab({ path, title: getTabTitle(path) }));
    router.push(path);
    setOpenPopover(null);
  };

  return (
    <div
      className={cn(
        'h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col z-20',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* ── Logo / Toggle ── */}
      <div className="h-12 flex items-center px-4 border-b border-sidebar-border/50 bg-sidebar/50 backdrop-blur-sm shrink-0">
        <div className={cn('flex items-center w-full', collapsed ? 'justify-center' : 'justify-between')}>
          {!collapsed && (
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="relative w-10 h-10 flex items-center justify-center">
                <Image src={logo} alt="Sahel Jeddah Logo" fill className="object-contain" style={{ objectFit: 'contain' }} />
              </div>
              <h2 className="font-bold text-lg text-sidebar-foreground tracking-tight truncate">
                Sahel Jeddah
              </h2>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={cn(
              'h-8 w-8 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors',
              collapsed && 'mx-auto',
            )}
          >
            {collapsed ? <Menu color="currentColor" size="16" /> : <ChevronLeft color="currentColor" size="16" />}
          </Button>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-luxury">
        {visibleItems.map((section) => {
          const SectionIcon = section.icon;
          return (
            <div key={section.type === 'main' ? section.path : section.id} className="pb-1">

              {/* ── Main item ── */}
              {section.type === 'main' ? (
                collapsed ? (
                  <Tooltip delayDuration={200} open={tooltipBlocked ? false : undefined}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        onClick={() => navigate(section.path)}
                        className={cn(
                          'w-full justify-center px-2 mb-1 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                          isActive(section.path) && 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm',
                        )}
                      >
                        {SectionIcon ? (
                          <SectionIcon
                            variant={isActive(section.path) ? "Bold" : "Linear"}
                            color="currentColor"
                            size="20"
                            className={isActive(section.path) ? 'text-primary' : 'text-sidebar-foreground/70'}
                          />
                        ) : (
                          <span className="text-[10px] text-red-500">?</span>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={10} className="font-medium">
                      {section.label}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={() => navigate(section.path)}
                    className={cn(
                      'w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground mb-1',
                      isActive(section.path) && 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm',
                      overviewEntrance && section.path === '/dashboard' && 'sidebar-overview-entrance',
                    )}
                  >
                    <SectionIcon
                      variant={isActive(section.path) ? "Bold" : "Linear"}
                      color="currentColor"
                      size="20"
                      className={cn('mr-3', isActive(section.path) ? 'text-primary' : 'text-sidebar-foreground/70')}
                    />
                    <span className="flex-1 text-left truncate">{section.label}</span>
                  </Button>
                )

              /* ── Expandable — collapsed: Popover + Tooltip ── */
              ) : collapsed ? (
                <Popover
                  open={openPopover === section.id}
                  onOpenChange={(open) => setOpenPopover(open ? section.id : null)}
                >
                  <Tooltip
                    delayDuration={200}
                    open={tooltipBlocked || openPopover === section.id ? false : undefined}
                  >
                    <TooltipTrigger asChild>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          className={cn(
                            'w-full justify-center px-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                            isGroupActive(section) && 'bg-sidebar-accent/60 text-sidebar-accent-foreground',
                          )}
                        >
                          <SectionIcon
                            variant={isGroupActive(section) ? "Bold" : "Linear"}
                            color="currentColor"
                            size="20"
                            className={isGroupActive(section) ? 'text-primary' : 'text-sidebar-foreground/70'}
                          />
                        </Button>
                      </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={10} className="font-medium">
                      {section.label}
                    </TooltipContent>
                  </Tooltip>

                  <PopoverContent side="right" align="start" className="w-48 p-1.5">
                    <p className="text-xs font-semibold text-muted-foreground px-2 py-1.5 mb-0.5">
                      {section.label}
                    </p>
                    <div className="space-y-px">
                      {section.items.map((item) => {
                        const ItemIcon = item.icon;
                        return (
                          <Button
                            key={item.path}
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(item.path)}
                            className={cn(
                              'w-full justify-start text-sm h-9',
                              isActive(item.path) && 'bg-sidebar-accent/50 text-sidebar-accent-foreground font-medium',
                            )}
                          >
                            <ItemIcon
                              variant={isActive(item.path) ? "Bold" : "Linear"}
                              color="currentColor"
                              size="18"
                              className="mr-2 opacity-70"
                            />
                            <span className="truncate">{item.label}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>

              /* ── Expandable — expanded sidebar ── */
              ) : (
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    className={cn(
                      'w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      isGroupActive(section) && !expandedGroups.has(section.id) &&
                        'bg-sidebar-accent/40 text-sidebar-accent-foreground',
                    )}
                    onClick={() => toggleGroup(section.id)}
                  >
                    <SectionIcon
                      variant={isGroupActive(section) ? "Bold" : "Linear"}
                      color="currentColor"
                      size="20"
                      className={cn(
                        'mr-3',
                        isGroupActive(section) ? 'text-primary' : 'text-sidebar-foreground/70',
                      )}
                    />
                    <span className="flex-1 text-left truncate">{section.label}</span>
                    <ChevronRight
                      color="currentColor"
                      size="16"
                      className={cn(
                        'opacity-50 transition-transform duration-300',
                        expandedGroups.has(section.id) && 'rotate-90',
                      )}
                    />
                  </Button>

                  <div className={cn(
                    'grid transition-all duration-300 ease-in-out',
                    expandedGroups.has(section.id) ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                  )}>
                    <div className="overflow-hidden">
                      <div className="ml-4 pl-3 border-l-2 border-sidebar-border space-y-1 mt-1">
                        {section.items.map((item) => {
                          const SubItemIcon = item.icon;
                          return (
                            <Button
                              key={item.path}
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(item.path)}
                              className={cn(
                                'w-full justify-start text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-9 relative',
                                isActive(item.path) &&
                                  'bg-sidebar-accent/50 text-sidebar-accent-foreground font-medium',
                              )}
                            >
                              {isActive(item.path) && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-full -ml-3" />
                              )}
                              <SubItemIcon
                                variant={isActive(item.path) ? "Bold" : "Linear"}
                                color="currentColor"
                                size="18"
                                className={cn(
                                  'mr-2',
                                  isActive(item.path) ? 'text-primary opacity-100' : 'opacity-70',
                                )}
                              />
                              <span className="truncate">{item.label}</span>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>


    </div>
  );
}
