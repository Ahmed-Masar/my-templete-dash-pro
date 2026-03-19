import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { adsAPI } from '@/lib/api';

export interface Ad {
    _id: string;
    titleText: string;
    color?: string;
    descriptionText?: string;
    descriptionVisibility?: boolean;
    ctaBtnText?: string;
    ctaVisibility?: boolean;
    CtaText?: string;
    mainBackgroundImage?: string;
    clickAction: 'clickable' | 'none';
    linkType: 'internal' | 'external';
    mainImage?: string;
    link?: string;
    logo?: string;
    logoDescription?: string;
    logoVisibility?: boolean;
    imageBackgroundTop01?: string;
    imageBackgroundTop02?: string;
    imageBackgroundTop03?: string;
    imageBackgroundBottom01?: string;
    imageBackgroundBottom02?: string;
    imageBackgroundBottom03?: string;
    link1?: string;
    link1Type?: 'internal' | 'external';
    link2?: string;
    link2Type?: 'internal' | 'external';
    link3?: string;
    link3Type?: 'internal' | 'external';
    adType: string;
    order: number;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

interface AdsState {
    ads: Ad[];
    currentAd: Ad | null;
    loading: boolean;
    error: string | null;
    total: number;
}

const initialState: AdsState = {
    ads: [],
    currentAd: null,
    loading: false,
    error: null,
    total: 0,
};

export const fetchAds = createAsyncThunk(
    'ads/fetchAds',
    async (params: any = {}, { rejectWithValue }) => {
        try {
            const response = await adsAPI.getAll(params);
            if (response.status === 'success') {
                return response;
            }
            return rejectWithValue('Failed to fetch ads');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch ads');
        }
    }
);

export const createAd = createAsyncThunk(
    'ads/createAd',
    async (adData: any, { rejectWithValue }) => {
        try {
            const response = await adsAPI.create(adData);
            if (response.status === 'success') {
                return response.data.ads || response.data.ad;
            }
            return rejectWithValue('Failed to create ad');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to create ad');
        }
    }
);

export const updateAd = createAsyncThunk(
    'ads/updateAd',
    async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
        try {
            const response = await adsAPI.update(id, data);
            if (response.status === 'success') {
                return response.data.ads || response.data.ad;
            }
            return rejectWithValue('Failed to update ad');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to update ad');
        }
    }
);

export const deleteAd = createAsyncThunk(
    'ads/deleteAd',
    async (id: string, { rejectWithValue }) => {
        try {
            await adsAPI.delete(id);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to delete ad');
        }
    }
);

const adsSlice = createSlice({
    name: 'ads',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        setCurrentAd: (state, action: PayloadAction<Ad | null>) => {
            state.currentAd = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAds.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAds.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.ads = action.payload.data.ads || [];
                state.total = action.payload.total || 0;
            })
            .addCase(fetchAds.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(createAd.fulfilled, (state, action) => {
                state.ads.unshift(action.payload);
                state.total += 1;
            })
            .addCase(updateAd.fulfilled, (state, action) => {
                const index = state.ads.findIndex(a => a._id === action.payload._id);
                if (index !== -1) {
                    state.ads[index] = action.payload;
                }
            })
            .addCase(deleteAd.fulfilled, (state, action) => {
                state.ads = state.ads.filter(a => a._id !== action.payload);
                state.total -= 1;
            });
    },
});

export const { clearError, setCurrentAd } = adsSlice.actions;
export default adsSlice.reducer;
