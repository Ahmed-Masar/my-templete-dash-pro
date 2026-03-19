import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { cartsAPI } from '@/lib/api';

export type CartStatus = 'draft' | 'generated' | 'completed' | 'cancelled';

export interface CartItem {
    product: string;
    variantid?: string;
    specs?: string;
    quantity: number;
    itemPrice: number;
    totalItemPrice: number;
    title?: string;
}

export interface Cart {
    _id: string;
    user: string | { _id: string; name?: string; phone?: string };
    vendorId?: string;
    items: CartItem[];
    totalPoints?: number;
    totalPrice: number;
    totalVendorPoints?: number;
    status: CartStatus;
    pdfUrl?: string;
    pdfKey?: string;
    updatedAt: string;
    createdAt?: string;
}

interface CartsState {
    carts: Cart[];
    loading: boolean;
    error: string | null;
    total: number;
}

const initialState: CartsState = {
    carts: [],
    loading: false,
    error: null,
    total: 0,
};

export const fetchCarts = createAsyncThunk(
    'carts/fetchCarts',
    async (params: any = {}, { rejectWithValue }) => {
        try {
            const response = await cartsAPI.getAll(params);
            if (response.status === 'success') return response;
            return rejectWithValue('Failed to fetch carts');
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch carts');
        }
    }
);

export const updateCartStatus = createAsyncThunk(
    'carts/updateStatus',
    async ({ id, status }: { id: string; status: CartStatus }, { rejectWithValue }) => {
        try {
            const response = await cartsAPI.updateStatus(id, status);
            if (response.status === 'success') return { id, status };
            return rejectWithValue('Failed to update cart status');
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update cart status');
        }
    }
);

const cartsSlice = createSlice({
    name: 'carts',
    initialState,
    reducers: {
        clearError: (state) => { state.error = null; },
        optimisticUpdateStatus: (state, action: PayloadAction<{ id: string; status: CartStatus }>) => {
            const index = state.carts.findIndex(c => c._id === action.payload.id);
            if (index !== -1) state.carts[index].status = action.payload.status;
        },
        revertCartStatus: (state, action: PayloadAction<{ id: string; status: CartStatus }>) => {
            const index = state.carts.findIndex(c => c._id === action.payload.id);
            if (index !== -1) state.carts[index].status = action.payload.status;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCarts.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchCarts.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.carts = action.payload.data.carts || [];
                state.total = action.payload.total || 0;
            })
            .addCase(fetchCarts.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
            .addCase(updateCartStatus.fulfilled, (state, action) => {
                const index = state.carts.findIndex(c => c._id === action.payload.id);
                if (index !== -1) state.carts[index].status = action.payload.status;
            });
    },
});

export const { clearError, optimisticUpdateStatus, revertCartStatus } = cartsSlice.actions;
export default cartsSlice.reducer;
