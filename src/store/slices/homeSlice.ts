import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { homeAPI } from '@/lib/api';


export const BANNER_SECTIONS = [
    'fullWidthSliderBannerWithLogo',
    'fullWidthBanner',
    'bannerContainedRoundedGrid',
    'verticalBannerCards',
    'bannerContainedRoundedStatic2Cta',
    'bannerVisualStaticRounded',
    'bannerVisualStaticRoundedCta',
    'bannerVisualSliderRounded',
    'bannerVisualStatic',
    'bannerVisualSlider',
    'announcementBar',
] as const;

export const PRODUCT_SECTIONS = [
    'productsGrid',
    'productCardInteractive3xl',
    'productCardStandard2xl',
    'categoryDiscoveryGrid',
    'productCardGridVerticalXl',
    'productPromotionCard',
    'productCardInteractiveM',
    'productCardInteractiveS',
    'logos',
    // 'collectionsCategories',
] as const;

export const ALL_SECTIONS = [
    ...BANNER_SECTIONS,
    ...PRODUCT_SECTIONS,
] as const;

export type BannerSectionKey = typeof BANNER_SECTIONS[number];
export type ProductSectionKey = typeof PRODUCT_SECTIONS[number];
export type SectionKey = typeof ALL_SECTIONS[number];


export interface HomeSection {
    active: boolean;
    order: number;
}

export type HomeSections = Record<SectionKey, HomeSection>;

export interface HomeSettings {
    privecyPolicy?: string;
    termsOfService?: string;
    aboutUs?: string;
    contactUs?: string[];
    expirePointsDate?: string | null;
}

export interface HomeConfig extends HomeSections, HomeSettings {
    _id: string;
    isPrice?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

interface HomeState {
    config: HomeConfig | null;
    loading: boolean;
    saving: boolean;
    error: string | null;
    isDirty: boolean;
}


const initialState: HomeState = {
    config: null,
    loading: false,
    saving: false,
    error: null,
    isDirty: false,
};


export const fetchHome = createAsyncThunk(
    'home/fetchHome',
    async (_, { rejectWithValue }) => {
        try {
            const response = await homeAPI.getAll();
            if (response.status === 'success') {
                const dataObj = response.data as any;
                const homes: any[] =
                    dataObj?.homes ||
                    dataObj?.['null'] ||
                    dataObj?.home ||
                    (Array.isArray(Object.values(dataObj || {})[0])
                        ? (Object.values(dataObj)[0] as any[])
                        : []);

                const DEFAULT_ACTIVE = new Set([
                    'fullWidthSliderBannerWithLogo',
                    'fullWidthBanner',
                    'announcementBar',
                    'productsGrid',
                    'productCardInteractive3xl',
                ]);

                if (homes.length > 0) {
                    const loaded = homes[0] as HomeConfig;
                    const hasActive = ALL_SECTIONS.some((k) => (loaded as any)[k]?.active);
                    if (!hasActive) {
                        DEFAULT_ACTIVE.forEach((key) => {
                            if ((loaded as any)[key]) {
                                (loaded as any)[key] = { ...(loaded as any)[key], active: true };
                            }
                        });
                    }
                    // Patch any sections that didn't exist yet in the stored config
                    const maxOrder = Math.max(0, ...ALL_SECTIONS.map((k) => (loaded as any)[k]?.order ?? 0));
                    let extraOrder = maxOrder;
                    ALL_SECTIONS.forEach((key) => {
                        if (!(loaded as any)[key]) {
                            extraOrder += 1;
                            (loaded as any)[key] = { active: false, order: extraOrder };
                        }
                    });
                    return loaded;
                }

                const defaultSections = Object.fromEntries(
                    ALL_SECTIONS.map((key, index) => [
                        key,
                        { active: DEFAULT_ACTIVE.has(key), order: index + 1 },
                    ])
                );
                const createRes = await homeAPI.create(defaultSections);
                if (createRes.status === 'success') {
                    return (createRes.data as any).home as HomeConfig;
                }
            }
            return rejectWithValue('Failed to fetch home config');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch home config');
        }
    }
);

export const saveIsPrice = createAsyncThunk(
    'home/saveIsPrice',
    async (_, { getState, rejectWithValue }) => {
        const state = (getState() as { home: HomeState }).home;
        if (!state.config) return rejectWithValue('Home config not loaded');
        const { _id, isPrice } = state.config;
        try {
            const payload = { isPrice: !isPrice };
            console.log('[saveIsPrice] REQ →', { id: _id, body: payload });
            const response = await homeAPI.update(_id, payload);
            console.log('[saveIsPrice] RES ←', response);
            if (response.status === 'success') {
                return (response.data as any).home as HomeConfig;
            }
            return rejectWithValue('Failed to update isPrice');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to update isPrice');
        }
    }
);

export const saveHomeSettings = createAsyncThunk(
    'home/saveHomeSettings',
    async (settings: HomeSettings, { getState, rejectWithValue }) => {
        const state = (getState() as { home: HomeState }).home;
        if (!state.config) return rejectWithValue('Home config not loaded');
        try {
            const response = await homeAPI.update(state.config._id, settings);
            if (response.status === 'success') {
                return (response.data as any).home as HomeConfig;
            }
            return rejectWithValue('Failed to save settings');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to save settings');
        }
    }
);

export const saveHome = createAsyncThunk(
    'home/saveHome',
    async ({ id, data }: { id: string; data: Partial<HomeSections> }, { rejectWithValue }) => {
        try {
            const response = await homeAPI.update(id, data);
            if (response.status === 'success') {
                return (response.data as any).home as HomeConfig;
            }
            return rejectWithValue('Failed to save home config');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to save home config');
        }
    }
);

const homeSlice = createSlice({
    name: 'home',
    initialState,
    reducers: {
        toggleSection: (state, action: PayloadAction<SectionKey>) => {
            if (!state.config) return;
            const key = action.payload;
            state.config[key] = {
                ...state.config[key],
                active: !state.config[key].active,
            };
            state.isDirty = true;
        },
        moveSection: (state, action: PayloadAction<{ key: SectionKey; direction: 'up' | 'down' }>) => {
            if (!state.config) return;
            const { key, direction } = action.payload;
            const currentOrder = state.config[key].order;

            const adjacentKey = ALL_SECTIONS.find((k) => {
                const s = state.config![k];
                return direction === 'up'
                    ? s.order === currentOrder - 1
                    : s.order === currentOrder + 1;
            });

            if (adjacentKey) {
                const adjacentOrder = state.config[adjacentKey].order;
                state.config[key] = { ...state.config[key], order: adjacentOrder };
                state.config[adjacentKey] = { ...state.config[adjacentKey], order: currentOrder };
                state.isDirty = true;
            }
        },
        reorderSection: (state, action: PayloadAction<{ from: SectionKey; to: SectionKey }>) => {
            if (!state.config) return;
            const { from, to } = action.payload;
            const fromOrder = state.config[from].order;
            const toOrder = state.config[to].order;
            if (fromOrder === toOrder) return;

            if (fromOrder > toOrder) {
                ALL_SECTIONS.forEach((k) => {
                    const o = state.config![k].order;
                    if (o >= toOrder && o < fromOrder) {
                        state.config![k] = { ...state.config![k], order: o + 1 };
                    }
                });
            } else {
                ALL_SECTIONS.forEach((k) => {
                    const o = state.config![k].order;
                    if (o > fromOrder && o <= toOrder) {
                        state.config![k] = { ...state.config![k], order: o - 1 };
                    }
                });
            }
            state.config[from] = { ...state.config[from], order: toOrder };
            state.isDirty = true;
        },
        clearError: (state) => {
            state.error = null;
        },
        clearDirty: (state) => {
            state.isDirty = false;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchHome.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchHome.fulfilled, (state, action) => {
                state.loading = false;
                state.config = action.payload;
                state.isDirty = false;
            })
            .addCase(fetchHome.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(saveHomeSettings.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(saveHomeSettings.fulfilled, (state, action) => {
                state.saving = false;
                if (state.config) Object.assign(state.config, action.payload);
            })
            .addCase(saveHomeSettings.rejected, (state, action) => {
                state.saving = false;
                state.error = action.payload as string;
            })
            .addCase(saveIsPrice.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(saveIsPrice.fulfilled, (state, action) => {
                state.saving = false;
                if (state.config) state.config.isPrice = action.payload.isPrice;
            })
            .addCase(saveIsPrice.rejected, (state, action) => {
                state.saving = false;
                state.error = action.payload as string;
            })
            .addCase(saveHome.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(saveHome.fulfilled, (state, action) => {
                state.saving = false;
                state.config = action.payload;
                state.isDirty = false;
            })
            .addCase(saveHome.rejected, (state, action) => {
                state.saving = false;
                state.error = action.payload as string;
            });
    },
});

export const { toggleSection, moveSection, reorderSection, clearError, clearDirty } = homeSlice.actions;
export default homeSlice.reducer;
