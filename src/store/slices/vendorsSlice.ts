import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { vendorsAPI } from '@/lib/api';

export interface Vendor {
    _id: string;
    name: string;
    phone: number;
    city: string;
    role: string;
    points: number;
    vendorPoints: number;
    lat: number;
    lng: number;
    location?: {
        type: string;
        coordinates: number[];
    };
    isApproved: boolean;
    cartHistory: string[];
    createdAt: string;
    updatedAt: string;
}

interface VendorsState {
    vendors: Vendor[];
    loading: boolean;
    error: string | null;
    total: number;
    results: number;
}

const initialState: VendorsState = {
    vendors: [],
    loading: false,
    error: null,
    total: 0,
    results: 0,
};

export const fetchVendors = createAsyncThunk(
    'vendors/fetchVendors',
    async (params: any = {}, { rejectWithValue }) => {
        try {
            const response = await vendorsAPI.getAll(params);
            if (response.status === 'success') return response;
            return rejectWithValue('Failed to fetch vendors');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch vendors');
        }
    }
);

export const approveVendor = createAsyncThunk(
    'vendors/approveVendor',
    async (id: string, { rejectWithValue }) => {
        try {
            const response = await vendorsAPI.approve(id);
            if (response.status === 'success') return { id };
            return rejectWithValue('Failed to approve vendor');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to approve vendor');
        }
    }
);

export const rejectVendor = createAsyncThunk(
    'vendors/rejectVendor',
    async (id: string, { rejectWithValue }) => {
        try {
            const response = await vendorsAPI.reject(id);
            if (response.status === 'success') return { id };
            return rejectWithValue('Failed to reject vendor');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to reject vendor');
        }
    }
);

const vendorsSlice = createSlice({
    name: 'vendors',
    initialState,
    reducers: {
        clearError: (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchVendors.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchVendors.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.vendors = action.payload.data?.users || action.payload.data?.vendors || [];
                state.total = action.payload.total || 0;
                state.results = action.payload.results || 0;
            })
            .addCase(fetchVendors.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Optimistic approve
            .addCase(approveVendor.pending, (state, action) => {
                const index = state.vendors.findIndex(v => v._id === action.meta.arg);
                if (index !== -1) state.vendors[index].isApproved = true;
            })
            .addCase(approveVendor.fulfilled, (_state, _action) => {
                // already updated in pending
            })
            .addCase(approveVendor.rejected, (state, action) => {
                const index = state.vendors.findIndex(v => v._id === action.meta.arg);
                if (index !== -1) state.vendors[index].isApproved = false;
            })
            // Optimistic reject
            .addCase(rejectVendor.pending, (state, action) => {
                const index = state.vendors.findIndex(v => v._id === action.meta.arg);
                if (index !== -1) state.vendors[index].isApproved = false;
            })
            .addCase(rejectVendor.fulfilled, (_state, _action) => {
                // already updated in pending
            })
            .addCase(rejectVendor.rejected, (state, action) => {
                const index = state.vendors.findIndex(v => v._id === action.meta.arg);
                if (index !== -1) state.vendors[index].isApproved = true;
            });
    },
});

export const { clearError } = vendorsSlice.actions;
export default vendorsSlice.reducer;
