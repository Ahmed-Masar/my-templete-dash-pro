import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { sponsorsAPI } from '@/lib/api';

export interface Sponsor {
    _id: string;
    name: string;
    image?: string;
    link?: string;
    tier?: string;
    contact?: string;
    status?: string;
    since?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface SponsorsState {
    sponsors: Sponsor[];
    loading: boolean;
    error: string | null;
    total: number;
}

const initialState: SponsorsState = {
    sponsors: [],
    loading: false,
    error: null,
    total: 0,
};

export const fetchSponsors = createAsyncThunk(
    'sponsors/fetchSponsors',
    async (params: any = {}, { rejectWithValue }) => {
        try {
            const response = await sponsorsAPI.getAll(params);
            if (response.status === 'success') return response;
            return rejectWithValue('Failed to fetch sponsors');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch sponsors');
        }
    }
);

export const createSponsor = createAsyncThunk(
    'sponsors/createSponsor',
    async (data: any, { rejectWithValue }) => {
        try {
            const response = await sponsorsAPI.create(data);
            if (response.status === 'success') return response.data.sponsor;
            return rejectWithValue('Failed to create sponsor');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to create sponsor');
        }
    }
);

export const updateSponsor = createAsyncThunk(
    'sponsors/updateSponsor',
    async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
        try {
            const response = await sponsorsAPI.update(id, data);
            if (response.status === 'success') return response.data.sponsor;
            return rejectWithValue('Failed to update sponsor');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to update sponsor');
        }
    }
);

export const deleteSponsor = createAsyncThunk(
    'sponsors/deleteSponsor',
    async (id: string, { rejectWithValue }) => {
        try {
            await sponsorsAPI.delete(id);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to delete sponsor');
        }
    }
);

const sponsorsSlice = createSlice({
    name: 'sponsors',
    initialState,
    reducers: {
        clearError: (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSponsors.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchSponsors.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.sponsors = action.payload.data.sponsors || [];
                state.total = action.payload.total || 0;
            })
            .addCase(fetchSponsors.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
            .addCase(createSponsor.fulfilled, (state, action) => { state.sponsors.unshift(action.payload); state.total += 1; })
            .addCase(updateSponsor.fulfilled, (state, action) => {
                const index = state.sponsors.findIndex(s => s._id === action.payload._id);
                if (index !== -1) state.sponsors[index] = action.payload;
            })
            .addCase(deleteSponsor.fulfilled, (state, action) => {
                state.sponsors = state.sponsors.filter(s => s._id !== action.payload);
                state.total -= 1;
            });
    },
});

export const { clearError } = sponsorsSlice.actions;
export default sponsorsSlice.reducer;
