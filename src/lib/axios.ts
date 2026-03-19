import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import * as MOCK from './mockData';

// Force mock mode by default as requested by the user
const USE_MOCK = true;

// Helper to provide mock responses
const getMockResponse = (config: InternalAxiosRequestConfig): any => {
  const url = config.url || '';
  const method = config.method?.toLowerCase();

  // Handle Login
  if (url.includes('/login')) {
    return {
      status: 'success',
      token: MOCK.MOCK_ACCESS_TOKEN,
      data: {
        token: MOCK.MOCK_ACCESS_TOKEN,
        user: MOCK.MOCK_USER
      }
    };
  }

  // Handle Dashboard Stats / Home
  if (url.includes('/stats') || url.includes('/dashboard/home') || url.includes('/home')) {
    return { status: 'success', data: MOCK.MOCK_STATS };
  }

  // Handle Common Resources
  if (url.includes('/users')) return { status: 'success', data: { users: MOCK.MOCK_USERS }, total: MOCK.MOCK_USERS.length };
  if (url.includes('/ads')) return { status: 'success', data: { ads: MOCK.MOCK_ADS }, total: MOCK.MOCK_ADS.length };
  if (url.includes('/categories')) return { status: 'success', data: { categories: MOCK.MOCK_CATEGORIES }, total: MOCK.MOCK_CATEGORIES.length };
  if (url.includes('/products')) return { status: 'success', data: { products: MOCK.MOCK_PRODUCTS }, total: MOCK.MOCK_PRODUCTS.length };
  if (url.includes('/stores')) return { status: 'success', data: { stores: MOCK.MOCK_STORES }, total: MOCK.MOCK_STORES.length };
  if (url.includes('/notifications')) return { status: 'success', data: { notifications: MOCK.MOCK_NOTIFICATIONS }, total: MOCK.MOCK_NOTIFICATIONS.length };
  if (url.includes('/reviews')) return { status: 'success', data: { reviews: MOCK.MOCK_REVIEWS }, total: MOCK.MOCK_REVIEWS.length };
  if (url.includes('/carts')) return { status: 'success', data: { carts: MOCK.MOCK_CARTS }, total: MOCK.MOCK_CARTS.length };
  if (url.includes('/website-ads')) return { status: 'success', data: { websiteAds: MOCK.MOCK_WEBSITE_ADS }, total: MOCK.MOCK_WEBSITE_ADS.length };
  if (url.includes('/sponsors')) return { status: 'success', data: { sponsors: MOCK.MOCK_SPONSORS }, total: MOCK.MOCK_SPONSORS.length };
  if (url.includes('/tags')) return { status: 'success', data: { tags: MOCK.MOCK_TAGS }, total: MOCK.MOCK_TAGS.length };
  if (url.includes('/points-store')) return { status: 'success', data: { pointsStore: MOCK.MOCK_POINTS_STORE }, total: MOCK.MOCK_POINTS_STORE.length };
  if (url.includes('/companies')) return { status: 'success', data: { companies: MOCK.MOCK_COMPANIES }, total: MOCK.MOCK_COMPANIES.length, results: MOCK.MOCK_COMPANIES.length };
  if (url.includes('/uploads')) return { status: 'success', data: { url: 'https://via.placeholder.com/300', images: [{ url: 'https://via.placeholder.com/300', name: 'mock.jpg' }] } };

  // Generic success for POST/PATCH/DELETE
  if (['post', 'patch', 'put', 'delete'].includes(method || '')) {
    return { status: 'success', message: 'Operation successful (Mock)', data: {} };
  }

  // Default empty success
  return { status: 'success', data: [] };
};

// ── AXIOS INSTANCE ─────────────────────────────────────────────────────────────
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  // Apply adapter immediately if in mock mode
  adapter: USE_MOCK ? async (config) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: getMockResponse(config as InternalAxiosRequestConfig),
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config,
          request: {}
        });
      }, 150);
    });
  } : undefined,
});

type StoreLike = { getState: () => { auth: { accessToken: string | null } }; dispatch: (action: unknown) => void };

let interceptorsAttached = false;

export function setupAxiosInterceptors(
  store: StoreLike,
  dispatchLogout: () => void
) {
  if (interceptorsAttached) return;
  interceptorsAttached = true;

  api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      if (typeof window === 'undefined') return config;
      const state = store.getState();
      const token = state.auth.accessToken || localStorage.getItem('accessToken');
      if (token && !USE_MOCK) config.headers.Authorization = `Bearer ${token}`;
      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );

  api.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    (error: AxiosError) => {
      if (USE_MOCK) {
        return Promise.resolve({
          data: getMockResponse(error.config as InternalAxiosRequestConfig),
          status: 200,
          statusText: 'OK',
          headers: {},
          config: error.config
        } as AxiosResponse);
      }

      const isLoginRequest = error.config?.url?.includes('/login') || error.config?.url?.includes('/auth');
      if (error.response?.status === 401 && !isLoginRequest) {
        dispatchLogout();
      }
      return Promise.reject(error);
    }
  );
}

export const apiHelpers = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return api.get(url, config).then(response => response.data);
  },

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return api.post(url, data, config).then(response => response.data);
  },

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return api.put(url, data, config).then(response => response.data);
  },

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return api.patch(url, data, config).then(response => response.data);
  },

  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return api.delete(url, config).then(response => response.data);
  },

  upload: <T = any>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<T> => {
    return api.post(url, formData, { ...config, headers: { ...config?.headers, 'Content-Type': 'multipart/form-data' } }).then(response => response.data);
  },
};

export default api;
export type { AxiosRequestConfig, AxiosResponse, AxiosError };
