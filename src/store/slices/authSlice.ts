import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authAPI } from '@/lib/api';

const USE_MOCK_DATA = true;

export interface User {
  _id?: string;
  phone?: string;
  name?: string;
  role?: string;
  pages?: string[];
  [key: string]: any;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isLoading: false,
  isInitialized: false,
  error: null,
};

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: { phone: string; password: string }, { rejectWithValue }) => {
    try {
      if (USE_MOCK_DATA) {
        const mockUser = {
          _id: 'mock-user-1',
          email: 'admin@vodex.com',
          name: 'مدير النظام',
          role: 'admin',
          pages: ['all'],
          isActive: true,
        };
        localStorage.setItem('accessToken', 'mock-token');
        localStorage.setItem('user', JSON.stringify(mockUser));
        return { user: mockUser, accessToken: 'mock-token' };
      }

      const response = await authAPI.login(credentials);

      if (response && response.status === 'success') {
        const token = (response as any).token || response.data?.token;
        const user = response.data?.user || (response as any).user;
        localStorage.setItem('accessToken', token);
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        }
        return { user: user || { name: 'Admin', phone: credentials.phone }, accessToken: token };
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Login failed');
    }
  }
);

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      if (USE_MOCK_DATA) {
        const mockUser = {
          _id: 'mock-user-1',
          email: 'admin@vodex.com',
          name: 'مدير النظام',
          role: 'admin',
          pages: ['all'],
          isActive: true,
        };
        return { user: mockUser, accessToken: 'mock-token' };
      }

      const token = localStorage.getItem('accessToken');
      const savedUser = localStorage.getItem('user');

      if (token) {
        try {
          const parts = token.split('.');
          if (parts.length !== 3) throw new Error('malformed');
          const payload = JSON.parse(atob(parts[1]));
          const currentTime = Date.now() / 1000;
          if (payload.exp && payload.exp < currentTime) throw new Error('expired');
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          return null;
        }

        const user = savedUser ? JSON.parse(savedUser) : null;
        return { user: user || { name: 'User' }, accessToken: token };
      }

      return null;
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      return null;
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.error = null;
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
    },
    clearError: (state) => {
      state.error = null;
    },
    clearRememberedCredentials: () => {
      localStorage.removeItem('rememberedPhone');
      localStorage.removeItem('rememberMe');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<{ user: User; accessToken: string }>) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action: PayloadAction<{ user: User; accessToken: string } | null>) => {
        state.isLoading = false;
        state.isInitialized = true;
        if (action.payload) {
          state.user = action.payload.user;
          state.accessToken = action.payload.accessToken;
        } else {
          state.user = null;
          state.accessToken = null;
        }
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.error = action.payload as string;
      });
  },
});

export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    return true;
  }
};

export const getStoredToken = (): string | null => {
  const token = localStorage.getItem('accessToken');
  if (token && !isTokenExpired(token)) {
    return token;
  }
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
  return null;
};
export const hasRememberedCredentials = (): boolean => {
  const rememberedPhone = localStorage.getItem('rememberedPhone');
  const rememberMe = localStorage.getItem('rememberMe') === 'true';

  return rememberMe && !!rememberedPhone;
};

export const { logout, clearError, clearRememberedCredentials } = authSlice.actions;
export default authSlice.reducer;
