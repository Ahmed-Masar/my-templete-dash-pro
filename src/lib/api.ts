import { apiHelpers } from './axios';


export interface ApiResponse<T = any> {
  status: 'success' | 'fail' | 'error';
  message?: string;
  results?: number;
  data: T;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  fields?: string;
  [key: string]: any;
}


export interface LoginCredentials {
  phone: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user?: any;
}

export const authAPI = {
  login: (credentials: LoginCredentials) =>
    apiHelpers.post<ApiResponse<LoginResponse>>('/dashboard/login', credentials),

};

export const usersAPI = {
  getAll: (params?: PaginationParams) => apiHelpers.get<ApiResponse<any[]>>('/dashboard/users', { params }),
  create: (data: any) => apiHelpers.post<ApiResponse<any>>('/dashboard/users', data),
  getById: (id: string) => apiHelpers.get<ApiResponse<any>>(`/dashboard/users/${id}`),
  update: (id: string, data: any) => apiHelpers.patch<ApiResponse<any>>(`/dashboard/users/${id}`, data),
  delete: (id: string) => apiHelpers.delete<ApiResponse<any>>(`/dashboard/users/${id}`),
};

export const adsAPI = {
  getAll: (params?: PaginationParams) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    return apiHelpers.get<ApiResponse<any[]>>(`/dashboard/ads?${queryParams.toString()}`);
  },
  create: (data: any) => apiHelpers.post<ApiResponse<any>>('/dashboard/ads', data),
  getById: (id: string) => apiHelpers.get<ApiResponse<any>>(`/dashboard/ads/${id}`),
  update: (id: string, data: any) => apiHelpers.patch<ApiResponse<any>>(`/dashboard/ads/${id}`, data),
  delete: (id: string) => apiHelpers.delete<ApiResponse<any>>(`/dashboard/ads/${id}`),
};


export const categoriesAPI = {
  getAll: (params?: PaginationParams) => apiHelpers.get<ApiResponse<any[]>>('/dashboard/categories', { params }),
  create: (data: any) => apiHelpers.post<ApiResponse<any>>('/dashboard/categories', data),
  update: (id: string, data: any) => apiHelpers.patch<ApiResponse<any>>(`/dashboard/categories/${id}`, data),
  delete: (id: string) => apiHelpers.delete<ApiResponse<any>>(`/dashboard/categories/${id}`),
  assignHome: (items: { id: string; order: number; isHomeCategory: boolean }[]) =>
    apiHelpers.post<ApiResponse<any>>('/categories/assign-home', items),
};

export const tagsAPI = {
  getAll: (params?: PaginationParams) => apiHelpers.get<ApiResponse<any[]>>('/dashboard/tags', { params }),
  create: (data: any) => apiHelpers.post<ApiResponse<any>>('/dashboard/tags', data),
  update: (id: string, data: any) => apiHelpers.patch<ApiResponse<any>>(`/dashboard/tags/${id}`, data),
  delete: (id: string) => apiHelpers.delete<ApiResponse<any>>(`/dashboard/tags/${id}`),
};

export const storesAPI = {
  getAll: (params?: PaginationParams) => apiHelpers.get<ApiResponse<any[]>>('/dashboard/stores', { params }),
  create: (data: any) => apiHelpers.post<ApiResponse<any>>('/dashboard/stores', data),
  update: (id: string, data: any) => apiHelpers.patch<ApiResponse<any>>(`/dashboard/stores/${id}`, data),
  delete: (id: string) => apiHelpers.delete<ApiResponse<any>>(`/dashboard/stores/${id}`),
  assignHome: (items: { id: string; order: number; isHomeStore: boolean }[]) =>
    apiHelpers.post<ApiResponse<any>>('/stores/assign-home', items),
};

export const sponsorsAPI = {
  getAll: (params?: PaginationParams) => apiHelpers.get<ApiResponse<any[]>>('/dashboard/sponsors', { params }),
  create: (data: any) => apiHelpers.post<ApiResponse<any>>('/dashboard/sponsors', data),
  update: (id: string, data: any) => apiHelpers.patch<ApiResponse<any>>(`/dashboard/sponsors/${id}`, data),
  delete: (id: string) => apiHelpers.delete<ApiResponse<any>>(`/dashboard/sponsors/${id}`),
};

export const productsAPI = {
  getAll: (params?: PaginationParams) => {
    return apiHelpers.get<ApiResponse<any[]>>('/dashboard/products', { params });
  },
  create: (data: any) => apiHelpers.post<ApiResponse<any>>('/dashboard/products', data),
  update: (id: string, data: any) => apiHelpers.patch<ApiResponse<any>>(`/dashboard/products/${id}`, data),
  delete: (id: string) => apiHelpers.delete<ApiResponse<any>>(`/dashboard/products/${id}`),
  assignType: (productType: string, items: { id: string; order: number; isHomeProduct: boolean }[]) =>
    apiHelpers.post<ApiResponse<any>>(`/products/${productType}/assign-type`, items),
};

export const pointsStoreAPI = {
  getAll: (params?: PaginationParams) => apiHelpers.get<ApiResponse<any[]>>('/dashboard/points-store', { params }),
  create: (data: any) => apiHelpers.post<ApiResponse<any>>('/dashboard/points-store', data),
  getById: (id: string) => apiHelpers.get<ApiResponse<any>>(`/dashboard/points-store/${id}`),
  update: (id: string, data: any) => apiHelpers.patch<ApiResponse<any>>(`/dashboard/points-store/${id}`, data),
  delete: (id: string) => apiHelpers.delete<ApiResponse<any>>(`/dashboard/points-store/${id}`),

  getPurchases: (params?: PaginationParams) => apiHelpers.get<ApiResponse<any[]>>('/dashboard/points-store/purchases/all', { params }),
  markAsUsed: (id: string) => apiHelpers.patch<ApiResponse<any>>(`/dashboard/points-store/purchases/${id}/use`),
};

export const vendorsAPI = {
  getAll: (params?: PaginationParams) =>
    apiHelpers.get<ApiResponse<any[]>>('/dashboard/users', {
      params: { ...params, role: 'vendor' },
    }),
  approve: (id: string) =>
    apiHelpers.patch<ApiResponse<any>>(`/dashboard/vendors/${id}/approve`),
  reject: (id: string) =>
    apiHelpers.patch<ApiResponse<any>>(`/dashboard/vendors/${id}/reject`),
};

export const techniciansAPI = {
  getAll: (params?: PaginationParams) =>
    apiHelpers.get<ApiResponse<any[]>>('/dashboard/users', {
      params: { ...params, role: 'technician' },
    }),
  approve: (id: string) =>
    apiHelpers.patch<ApiResponse<any>>(`/dashboard/technicians/${id}/approve`),
  reject: (id: string) =>
    apiHelpers.patch<ApiResponse<any>>(`/dashboard/technicians/${id}/reject`),
};

export const reviewsAPI = {
  getAll: (params?: PaginationParams) => apiHelpers.get<ApiResponse<any[]>>('/dashboard/reviews', { params }),
  approve: (id: string) => apiHelpers.patch<ApiResponse<any>>(`/dashboard/reviews/${id}/approve`),
  delete: (id: string) => apiHelpers.delete<ApiResponse<any>>(`/dashboard/reviews/${id}`),
};

export const cartsAPI = {
  getAll: (params?: PaginationParams) => apiHelpers.get<ApiResponse<any>>('/dashboard/carts', { params }),
  getById: (id: string) => apiHelpers.get<ApiResponse<any>>(`/dashboard/carts/${id}`),
  updateStatus: (id: string, status: 'draft' | 'generated' | 'completed' | 'cancelled') =>
    apiHelpers.patch<ApiResponse<any>>(`/dashboard/carts/${id}/status`, { status }),
};

export const notificationsAPI = {
  getAll: (params?: PaginationParams) => apiHelpers.get<ApiResponse<any[]>>('/notifications', { params }),
  sendToAll: (data: { title: any; body: any; data?: object }) =>
    apiHelpers.post<ApiResponse<any>>('/notifications/send/all', data),
  sendToUser: (userId: string, data: { title: any; body: any; data?: object }) =>
    apiHelpers.post<ApiResponse<any>>(`/notifications/send/user/${userId}`, data),
  sendToVendors: (data: { title: any; body: any; data?: object }) =>
    apiHelpers.post<ApiResponse<any>>('/notifications/send/segment/vendor', data),
  sendToTechnicians: (data: { title: any; body: any; data?: object }) =>
    apiHelpers.post<ApiResponse<any>>('/notifications/send/segment/technician', data),
  sendToNormalUsers: (data: { title: any; body: any; data?: object }) =>
    apiHelpers.post<ApiResponse<any>>('/notifications/send/segment/user', data),
};

export const websiteAdsAPI = {
  getAll: (params?: PaginationParams) => apiHelpers.get<ApiResponse<any[]>>('/website-ads', { params }),
  create: (data: any) => apiHelpers.post<ApiResponse<any>>('/website-ads', data),
  getById: (id: string) => apiHelpers.get<ApiResponse<any>>(`/website-ads/${id}`),
  update: (id: string, data: any) => apiHelpers.patch<ApiResponse<any>>(`/website-ads/${id}`, data),
  delete: (id: string) => apiHelpers.delete<ApiResponse<any>>(`/website-ads/${id}`),
};

export const homeAPI = {
  getAll: () => apiHelpers.get<ApiResponse<any>>('/dashboard/home'),
  create: (data: any) => apiHelpers.post<ApiResponse<any>>('/dashboard/home', data),
  update: (id: string, data: any) => apiHelpers.patch<ApiResponse<any>>(`/dashboard/home/${id}`, data),
};

export const uploadsAPI = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return apiHelpers.upload<ApiResponse<{ url: string }>>('/uploads/image', formData);
  },
  uploadProductPdf: (file: File) => {
    const formData = new FormData();
    formData.append('pdf', file);
    return apiHelpers.upload<ApiResponse<{ url: string }>>('/uploads/product-pdf', formData);
  },
  uploadImages: (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    return apiHelpers.upload<ApiResponse<{ images: { url: string; name: string }[] }>>('/uploads/images', formData);
  },
  deleteImage: (name: string) =>
    apiHelpers.delete<ApiResponse<null>>(`/uploads/image/${name}`),
  deleteImages: (names: string[]) =>
    apiHelpers.delete<ApiResponse<null>>('/uploads/images', { data: { names } }),
};

export const dashboardAPI = {
  getStats: () => apiHelpers.get<ApiResponse<any>>('/dashboard/stats'),
};

export const api = {
  auth: authAPI,
  users: usersAPI,
  ads: adsAPI,
  categories: categoriesAPI,
  tags: tagsAPI,
  stores: storesAPI,
  sponsors: sponsorsAPI,
  products: productsAPI,
  pointsStore: pointsStoreAPI,
  vendors: vendorsAPI,
  technicians: techniciansAPI,
  reviews: reviewsAPI,
  carts: cartsAPI,
  home: homeAPI,
  notifications: notificationsAPI,
  websiteAds: websiteAdsAPI,
  uploads: uploadsAPI,
  dashboard: dashboardAPI,
};

