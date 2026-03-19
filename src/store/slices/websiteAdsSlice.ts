import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { websiteAdsAPI } from '@/lib/api';

export interface WebsiteAd {
    _id: string;
    title: string;
    image?: string;
    productUrl?: string;
    active: boolean;
    order: number;
    createdAt: string;
    updatedAt: string;
}

interface WebsiteAdsState {
    ads: WebsiteAd[];
    loading: boolean;
    error: string | null;
    total: number;
}

const initialState: WebsiteAdsState = {
    ads: [],
    loading: false,
    error: null,
    total: 0,
};

export const fetchWebsiteAds = createAsyncThunk(
    'websiteAds/fetchAll',
    async (params: any = {}, { rejectWithValue }) => {
        try {
            const response = await websiteAdsAPI.getAll(params);
            if (response.status === 'success') return response;
            return rejectWithValue('Failed to fetch website ads');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch website ads');
        }
    }
);

export const createWebsiteAd = createAsyncThunk(
    'websiteAds/create',
    async (data: any, { rejectWithValue }) => {
        try {
            const response = await websiteAdsAPI.create(data);
            if (response.status === 'success') return response.data.websiteAd || response.data;
            return rejectWithValue('Failed to create website ad');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to create website ad');
        }
    }
);

export const updateWebsiteAd = createAsyncThunk(
    'websiteAds/update',
    async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
        try {
            const response = await websiteAdsAPI.update(id, data);
            if (response.status === 'success') return response.data.websiteAd || response.data;
            return rejectWithValue('Failed to update website ad');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to update website ad');
        }
    }
);

export const deleteWebsiteAd = createAsyncThunk(
    'websiteAds/delete',
    async (id: string, { rejectWithValue }) => {
        try {
            await websiteAdsAPI.delete(id);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to delete website ad');
        }
    }
);

const websiteAdsSlice = createSlice({
    name: 'websiteAds',
    initialState,
    reducers: {
        clearError: (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchWebsiteAds.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchWebsiteAds.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.ads = action.payload.data?.websiteAds || action.payload.data || [];
                state.total = action.payload.total || 0;
            })
            .addCase(fetchWebsiteAds.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(createWebsiteAd.fulfilled, (state, action) => {
                state.ads.push(action.payload);
                state.total += 1;
            })
            .addCase(updateWebsiteAd.fulfilled, (state, action) => {
                const index = state.ads.findIndex(a => a._id === action.payload._id);
                if (index !== -1) state.ads[index] = action.payload;
            })
            .addCase(deleteWebsiteAd.fulfilled, (state, action) => {
                state.ads = state.ads.filter(a => a._id !== action.payload);
                state.total -= 1;
            });
    },
});

export const { clearError } = websiteAdsSlice.actions;
export default websiteAdsSlice.reducer;
