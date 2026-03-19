import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
}

const initialState: ThemeState = {
  theme: 'light',
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);

      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(action.payload);
    },
    toggleTheme: (state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      state.theme = newTheme;
      localStorage.setItem('theme', newTheme);

      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(newTheme);
    },
    initializeTheme: (state) => {
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme) {
        state.theme = savedTheme;
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        state.theme = 'dark';
      }

      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(state.theme);
    },
  },
});

export const { setTheme, toggleTheme, initializeTheme } = themeSlice.actions;
export default themeSlice.reducer;
