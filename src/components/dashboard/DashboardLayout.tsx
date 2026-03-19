"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { initTabs } from '@/store/slices/tabsSlice';
import { toggleThemeWithTransition } from '@/lib/theme-transition';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sidebar } from './Sidebar';
import { TabBar } from './TabBar';
import { DashboardFooter } from './DashboardFooter';
import { MobileBlockScreen } from './MobileBlockScreen';
import { User, LogOut, Moon, Sun, Maximize2, Minimize2, CircleDollarSign } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { fetchHome, saveIsPrice } from '@/store/slices/homeSlice';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [fullWidth, setFullWidth] = useState(false);
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const { user } = useAppSelector((state) => state.auth);
  const { theme } = useAppSelector((state) => state.theme);
  const { config: homeConfig, saving: homeSaving } = useAppSelector((state) => state.home);

  useEffect(() => {
    dispatch(initTabs(pathname));
    if (!homeConfig) dispatch(fetchHome());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => dispatch(logout());

  const handleToggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    toggleThemeWithTransition(e, dispatch);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setSidebarCollapsed((p) => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background">
      <MobileBlockScreen />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <div className="flex-1 flex flex-col overflow-hidden">

          <header className="h-12 bg-surface border-b border-border flex items-center px-3 gap-2 shrink-0">

            <div className="flex-1 min-w-0 overflow-hidden h-full">
              <TabBar />
            </div>

            <div className="h-5 w-px bg-border/70 shrink-0" />

            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setFullWidth((p) => !p)}
                className="hidden 2xl:inline-flex h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground active:scale-90 transition-all duration-200"
              >
                {fullWidth ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={homeSaving || !homeConfig}
                    onClick={() => dispatch(saveIsPrice())}
                    className="h-8 w-8 rounded-lg active:scale-90 transition-all duration-200 text-muted-foreground hover:text-foreground"
                  >
                    <div className="relative h-4 w-4">
                      <CircleDollarSign className="h-4 w-4" />
                      {!homeConfig?.isPrice && (
                        <svg className="absolute inset-0 h-4 w-4" viewBox="0 0 16 16">
                          <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      )}
                    </div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{homeConfig?.isPrice ? 'Hide prices' : 'Show prices'}</TooltipContent>
              </Tooltip>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleTheme}
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground active:scale-90 transition-all duration-200"
              >
                {theme === 'dark'
                  ? <Sun className="h-4 w-4 animate-theme-icon" />
                  : <Moon className="h-4 w-4 animate-theme-icon" />}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 rounded-full p-0 text-muted-foreground hover:text-foreground"
                  >
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center gap-2 p-2">
                    <div className="flex flex-col space-y-0.5 leading-none">
                      <p className="text-sm font-medium">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className={cn(
            "flex-1 overflow-auto p-6 scrollbar-thin",
            fullWidth && "[&_.container]:max-w-none"
          )}>
            {children}
          </main>

        </div>
      </div>

      <DashboardFooter />
    </div>
  );
}
