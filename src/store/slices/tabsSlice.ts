import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getTabTitle } from '@/lib/tabMeta';

export interface Tab {
  id: string;
  path: string;
  title: string;
}

interface TabsState {
  tabs: Tab[];
  activeTabId: string | null;
}

const STORAGE_KEY = 'vodex_dashboard_tabs';

function stableId(path: string): string {
  return 'tab_' + path.replace(/^\//, '').replace(/\//g, '_');
}

function loadFromStorage(): TabsState {
  if (typeof window === 'undefined') return { tabs: [], activeTabId: null };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.tabs)) return parsed;
    }
  } catch { /* ignore parse errors */ }
  return { tabs: [], activeTabId: null };
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;

function persist(tabs: Tab[], activeTabId: string | null) {
  if (typeof window === 'undefined') return;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ tabs, activeTabId }));
    } catch { /* ignore storage errors */ }
  }, 300);
}

const initialState: TabsState = { tabs: [], activeTabId: null };

const tabsSlice = createSlice({
  name: 'tabs',
  initialState,
  reducers: {
    initTabs(state, action: PayloadAction<string | undefined>) {
      const saved = loadFromStorage();
      state.tabs = saved.tabs;
      const pathname = action.payload;

      if (pathname && pathname.startsWith('/dashboard')) {
        const match = saved.tabs.find((t) => t.path === pathname);
        if (match) {
          state.activeTabId = match.id;
        } else {
          // Direct URL navigation to a page not yet in tabs — auto-open it
          const id = stableId(pathname);
          const newTab: Tab = { id, path: pathname, title: getTabTitle(pathname) };
          state.tabs.push(newTab);
          state.activeTabId = id;
          persist(state.tabs as Tab[], state.activeTabId);
        }
      } else {
        state.activeTabId = saved.activeTabId;
      }
    },

    openTab(state, action: PayloadAction<{ path: string; title: string }>) {
      const { path, title } = action.payload;
      const existing = state.tabs.find((t) => t.path === path);
      if (existing) {
        state.activeTabId = existing.id;
      } else {
        const id = stableId(path);
        state.tabs.push({ id, path, title });
        state.activeTabId = id;
      }
      persist(state.tabs as Tab[], state.activeTabId);
    },

    closeTab(state, action: PayloadAction<string>) {
      const id = action.payload;
      const idx = state.tabs.findIndex((t) => t.id === id);
      if (idx === -1) return;
      const wasActive = state.activeTabId === id;
      state.tabs.splice(idx, 1);
      if (wasActive) {
        if (state.tabs.length > 0) {
          const newIdx = Math.max(0, Math.min(idx, state.tabs.length - 1));
          state.activeTabId = state.tabs[newIdx].id;
        } else {
          state.activeTabId = null;
        }
      }
      persist(state.tabs as Tab[], state.activeTabId);
    },

    setActiveTab(state, action: PayloadAction<string>) {
      state.activeTabId = action.payload;
      persist(state.tabs as Tab[], state.activeTabId);
    },

    // Remove tabs the user no longer has access to. Called after auth is resolved.
    filterTabsByAllowedPaths(state, action: PayloadAction<string[]>) {
      const allowed = new Set(action.payload);
      const removed = new Set(state.tabs.filter((t) => !allowed.has(t.path)).map((t) => t.id));
      if (removed.size === 0) return;
      state.tabs = state.tabs.filter((t) => !removed.has(t.id));
      if (state.activeTabId && removed.has(state.activeTabId)) {
        state.activeTabId = state.tabs.length > 0 ? state.tabs[state.tabs.length - 1].id : null;
      }
      persist(state.tabs as Tab[], state.activeTabId);
    },
  },
});

export const { initTabs, openTab, closeTab, setActiveTab, filterTabsByAllowedPaths } = tabsSlice.actions;
export default tabsSlice.reducer;
