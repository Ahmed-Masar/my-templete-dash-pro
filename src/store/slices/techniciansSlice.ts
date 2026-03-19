import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { techniciansAPI } from '@/lib/api';

export interface Technician {
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
    vendor: { _id: string; name: string } | null;
    createdAt: string;
    updatedAt: string;
}

interface TechniciansState {
    technicians: Technician[];
    loading: boolean;
    error: string | null;
    total: number;
    results: number;
}

const initialState: TechniciansState = {
    technicians: [],
    loading: false,
    error: null,
    total: 0,
    results: 0,
};

export const fetchTechnicians = createAsyncThunk(
    'technicians/fetchTechnicians',
    async (params: any = {}, { rejectWithValue }) => {
        try {
            const response = await techniciansAPI.getAll(params);
            if (response.status === 'success') return response;
            return rejectWithValue('Failed to fetch technicians');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch technicians');
        }
    }
);

export const approveTechnician = createAsyncThunk(
    'technicians/approveTechnician',
    async (id: string, { rejectWithValue }) => {
        try {
            const response = await techniciansAPI.approve(id);
            if (response.status === 'success') return { id };
            return rejectWithValue('Failed to approve technician');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to approve technician');
        }
    }
);

export const rejectTechnician = createAsyncThunk(
    'technicians/rejectTechnician',
    async (id: string, { rejectWithValue }) => {
        try {
            const response = await techniciansAPI.reject(id);
            if (response.status === 'success') return { id };
            return rejectWithValue('Failed to reject technician');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to reject technician');
        }
    }
);

const techniciansSlice = createSlice({
    name: 'technicians',
    initialState,
    reducers: {
        clearError: (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchTechnicians.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTechnicians.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.technicians = action.payload.data?.users || action.payload.data?.technicians || [];
                state.total = action.payload.total || 0;
                state.results = action.payload.results || 0;
            })
            .addCase(fetchTechnicians.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Optimistic approve
            .addCase(approveTechnician.pending, (state, action) => {
                const index = state.technicians.findIndex(t => t._id === action.meta.arg);
                if (index !== -1) state.technicians[index].isApproved = true;
            })
            .addCase(approveTechnician.fulfilled, (_state, _action) => {
                // already updated in pending
            })
            .addCase(approveTechnician.rejected, (state, action) => {
                const index = state.technicians.findIndex(t => t._id === action.meta.arg);
                if (index !== -1) state.technicians[index].isApproved = false;
            })
            // Optimistic reject
            .addCase(rejectTechnician.pending, (state, action) => {
                const index = state.technicians.findIndex(t => t._id === action.meta.arg);
                if (index !== -1) state.technicians[index].isApproved = false;
            })
            .addCase(rejectTechnician.fulfilled, (_state, _action) => {
                // already updated in pending
            })
            .addCase(rejectTechnician.rejected, (state, action) => {
                const index = state.technicians.findIndex(t => t._id === action.meta.arg);
                if (index !== -1) state.technicians[index].isApproved = true;
            });
    },
});

export const { clearError } = techniciansSlice.actions;
export default techniciansSlice.reducer;
