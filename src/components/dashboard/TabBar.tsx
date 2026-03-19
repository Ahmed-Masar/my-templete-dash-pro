"use client";

import { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Add } from 'iconsax-react';
import { cn } from '@/lib/utils';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { closeTab, setActiveTab, openTab, type Tab } from '@/store/slices/tabsSlice';
import { getTabIcon, getTabTitle, PATH_META } from '@/lib/tabMeta';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export function TabBar() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [newTabOpen, setNewTabOpen] = useState(false);
  const { tabs, activeTabId } = useAppSelector((s) => s.tabs);

  // Scroll active tab into view
  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current.querySelector<HTMLElement>('[data-active="true"]');
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [activeTabId]);

  // ── Keyboard shortcuts ──────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;

      // Cmd/Ctrl + X → close active tab
      if (e.key.toLowerCase() === 'x') {
        e.preventDefault();
        if (!activeTabId) return;
        const idx = tabs.findIndex((t) => t.id === activeTabId);
        const remaining = tabs.filter((t) => t.id !== activeTabId);
        if (remaining.length > 0) {
          const next = remaining[Math.max(0, Math.min(idx, remaining.length - 1))];
          router.push(next.path);
        } else {
          router.push('/dashboard');
        }
        dispatch(closeTab(activeTabId));
      }

      // Cmd/Ctrl + K → toggle new-tab picker
      if (e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setNewTabOpen((prev) => !prev);
      }

      // Cmd/Ctrl + 1-9 → switch to tab by index (9 = last tab)
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9 && tabs.length > 0) {
        e.preventDefault();
        const target = num === 9
          ? tabs[tabs.length - 1]
          : tabs[num - 1];
        if (target && target.id !== activeTabId) {
          dispatch(setActiveTab(target.id));
          router.push(target.path);
        }
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tabs, activeTabId, dispatch, router]);

  // ── Handlers ────────────────────────────────────────────────────
  const handleTabClick = (tab: Tab) => {
    if (tab.id === activeTabId) return;
    dispatch(setActiveTab(tab.id));
    router.push(tab.path);
  };

  const handleClose = (e: React.MouseEvent, tab: Tab) => {
    e.stopPropagation();
    const wasActive = tab.id === activeTabId;
    const idx = tabs.findIndex((t) => t.id === tab.id);
    if (wasActive) {
      const remaining = tabs.filter((t) => t.id !== tab.id);
      if (remaining.length > 0) {
        const next = remaining[Math.max(0, Math.min(idx, remaining.length - 1))];
        router.push(next.path);
      } else {
        router.push('/dashboard');
      }
    }
    dispatch(closeTab(tab.id));
  };

  const handleOpenNewTab = (path: string) => {
    dispatch(openTab({ path, title: getTabTitle(path) }));
    router.push(path);
    setNewTabOpen(false);
  };

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="flex items-center h-full gap-1 px-1 overflow-hidden">

      {/* Scrollable tab strip + new tab button together */}
      <div
        ref={scrollRef}
        className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1 min-w-0 h-full"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const Icon = getTabIcon(tab.path);

          return (
            <button
              key={tab.id}
              data-active={isActive}
              onClick={() => handleTabClick(tab)}
              title={tab.title}
              className={cn(
                'group relative flex items-center gap-1.5',
                'h-8 px-3 rounded-lg shrink-0',
                'min-w-[90px] max-w-[160px]',
                'text-xs font-medium cursor-pointer select-none outline-none',
                'transition-all duration-200',
                isActive
                  ? 'bg-foreground text-background'
                  : 'bg-foreground/6 text-foreground/60 border border-border hover:bg-foreground/10 hover:text-foreground hover:border-border-strong',
              )}
            >
              <Icon color="currentColor" size="12" className="shrink-0 opacity-80" />

              <span className="flex-1 text-left truncate leading-none">{tab.title}</span>

              {/* Close button — always visible on active, on-hover for inactive */}
              <span
                onClick={(e) => handleClose(e, tab)}
                className={cn(
                  'flex items-center justify-center h-3.5 w-3.5 rounded shrink-0',
                  'transition-all duration-150',
                  isActive
                    ? 'opacity-80 hover:opacity-100 hover:bg-background/20'
                    : 'opacity-40 hover:opacity-100 hover:bg-foreground/10',
                )}
              >
                <Add color="currentColor" size="10" className="rotate-45" />
              </span>
            </button>
          );
        })}

        {/* ── New Tab button — right after last tab ── */}
        <Popover open={newTabOpen} onOpenChange={setNewTabOpen}>
        <PopoverTrigger asChild>
          <button
            title="New tab (⌘K)"
            className={cn(
              'h-8 w-8 flex items-center justify-center rounded-lg shrink-0',
              'text-muted-foreground hover:bg-foreground/8 hover:text-foreground',
              'transition-all duration-200 outline-none',
              newTabOpen && 'bg-foreground/8 text-foreground',
            )}
          >
            <Add color="currentColor" size="14" />
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={10}
          className="w-52 p-1.5 shadow-lg"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-2 py-1.5 mb-0.5">
            <p className="text-xs font-semibold text-muted-foreground">Open page</p>
            <span className="text-[10px] text-muted-foreground/50 bg-muted px-1.5 py-0.5 rounded font-mono">
              ⌘K
            </span>
          </div>

          {/* Page list */}
          <div className="space-y-px">
            {Object.entries(PATH_META).map(([path, meta]) => {
              const Icon = meta.icon;
              const isAlreadyOpen = tabs.some((t) => t.path === path);

              return (
                <button
                  key={path}
                  onClick={() => handleOpenNewTab(path)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-left',
                    'transition-colors duration-150 outline-none',
                    isAlreadyOpen
                      ? 'text-muted-foreground/50 cursor-default'
                      : 'text-foreground hover:bg-muted cursor-pointer',
                  )}
                >
                  <Icon color="currentColor" size="14" className="shrink-0 opacity-70" />
                  <span className="flex-1 truncate">{meta.title}</span>
                  {isAlreadyOpen && (
                    <span className="text-[10px] text-muted-foreground/40 shrink-0 font-medium">
                      open
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
