import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import tabsReducer from './slices/tabsSlice';
import themeReducer from './slices/themeSlice';
import companiesReducer from './slices/companiesSlice';
import clientsReducer from './slices/clientsSlice';
import projectsReducer from './slices/projectsSlice';
import fieldsReducer from './slices/fieldsSlice';
import adsReducer from './slices/adsSlice';
import categoriesReducer from './slices/categoriesSlice';
import tagsReducer from './slices/tagsSlice';
import storesReducer from './slices/storesSlice';
import sponsorsReducer from './slices/sponsorsSlice';
import pointsStoreReducer from './slices/pointsStoreSlice';
import reviewsReducer from './slices/reviewsSlice';
import vendorsReducer from './slices/vendorsSlice';
import techniciansReducer from './slices/techniciansSlice';
import cartsReducer from './slices/cartsSlice';
import productsReducer from './slices/productsSlice';
import usersReducer from './slices/usersSlice';
import homeReducer from './slices/homeSlice';
import websiteAdsReducer from './slices/websiteAdsSlice';
import notificationsReducer from './slices/notificationsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    companies: companiesReducer,
    clients: clientsReducer,
    projects: projectsReducer,
    fields: fieldsReducer,
    ads: adsReducer,
    categories: categoriesReducer,
    tags: tagsReducer,
    stores: storesReducer,
    sponsors: sponsorsReducer,
    products: productsReducer,
    pointsStore: pointsStoreReducer,
    reviews: reviewsReducer,
    vendors: vendorsReducer,
    technicians: techniciansReducer,
    carts: cartsReducer,
    users: usersReducer,
    home: homeReducer,
    websiteAds: websiteAdsReducer,
    notifications: notificationsReducer,
    tabs: tabsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
