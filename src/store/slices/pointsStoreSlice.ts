import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { pointsStoreAPI } from '@/lib/api';

export interface PointsItem {
    _id: string;
    title: string;
    pointsCost: number;
    stock: number;
    status: string;
    image?: string;
    description?: string;
    isActive?: boolean;
    isVendor?: boolean;
    vendorId?: string | any;
    createdAt: string;
    updatedAt?: string;
}

export interface Purchase {
    _id: string;
    user: {
        _id: string;
        name: string;
        phone: string;
    };
    item: PointsItem;
    used: boolean;
    pointsCost: number;
    vendor?: string;
    createdAt: string;
    updatedAt?: string;
}

interface PointsStoreState {
    items: PointsItem[];
    purchases: Purchase[];
    loading: boolean;
    error: string | null;
    total: number;
    totalPurchases: number;
}

const initialState: PointsStoreState = {
    items: [],
    purchases: [],
    loading: false,
    error: null,
    total: 0,
    totalPurchases: 0,
};

export const fetchPointsItems = createAsyncThunk(
    'pointsStore/fetchItems',
    async (params: any = {}, { rejectWithValue }) => {
        try {
            const response = await pointsStoreAPI.getAll(params);
            if (response.status === 'success') return response;
            return rejectWithValue('Failed to fetch points store items');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch points store items');
        }
    }
);

export const createPointsItem = createAsyncThunk(
    'pointsStore/createItem',
    async (data: any, { rejectWithValue }) => {
        try {
            const response = await pointsStoreAPI.create(data);
            if (response.status === 'success') return response.data.item;
            return rejectWithValue('Failed to create item');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to create item');
        }
    }
);

export const updatePointsItem = createAsyncThunk(
    'pointsStore/updateItem',
    async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
        try {
            const response = await pointsStoreAPI.update(id, data);
            if (response.status === 'success') return response.data.item;
            return rejectWithValue('Failed to update item');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to update item');
        }
    }
);

export const deletePointsItem = createAsyncThunk(
    'pointsStore/deleteItem',
    async (id: string, { rejectWithValue }) => {
        try {
            await pointsStoreAPI.delete(id);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to delete item');
        }
    }
);

export const fetchPurchases = createAsyncThunk(
    'pointsStore/fetchPurchases',
    async (params: any = {}, { rejectWithValue }) => {
        try {
            const response = await pointsStoreAPI.getPurchases(params);
            if (response.status === 'success') return response;
            return rejectWithValue('Failed to fetch purchases');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch purchases');
        }
    }
);

export const markPurchaseAsUsed = createAsyncThunk(
    'pointsStore/markAsUsed',
    async (id: string, { rejectWithValue }) => {
        try {
            const response = await pointsStoreAPI.markAsUsed(id);
            if (response.status === 'success') return { id, data: response.data };
            return rejectWithValue('Failed to mark purchase as used');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to mark purchase as used');
        }
    }
);

const pointsStoreSlice = createSlice({
    name: 'pointsStore',
    initialState,
    reducers: {
        clearError: (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchPointsItems.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchPointsItems.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                const fetchedItems = action.payload.data.pointsStores || action.payload.data.items || [];
                state.items = fetchedItems.map((item: any) => ({
                    ...item,
                    title: item.title || item.name || 'Untitled',
                    status: item.status ? item.status : (item.isActive ? 'active' : 'inactive'),
                    stock: item.stock || 0,
                    image: item.image || ''
                }));
                state.total = action.payload.total || 0;
            })
            .addCase(fetchPointsItems.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
            .addCase(createPointsItem.fulfilled, (state, action) => {
                const newItem = action.payload || {};
                state.items.unshift({ ...newItem, title: newItem.title || newItem.name || 'Untitled' });
                state.total += 1;
            })
            .addCase(updatePointsItem.fulfilled, (state, action) => {
                const updatedItem = action.payload || {};
                const index = state.items.findIndex(i => i._id === updatedItem._id);
                if (index !== -1) state.items[index] = { ...state.items[index], ...updatedItem };
            })
            .addCase(deletePointsItem.fulfilled, (state, action) => {
                state.items = state.items.filter(i => i._id !== action.payload);
                state.total -= 1;
            })
            .addCase(fetchPurchases.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchPurchases.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.purchases = action.payload.data.purchases || action.payload.data || [];
                state.totalPurchases = action.payload.total || 0;
            })
            .addCase(fetchPurchases.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
            .addCase(markPurchaseAsUsed.fulfilled, (state, action) => {
                const index = state.purchases.findIndex(p => p._id === action.payload.id);
                if (index !== -1) {
                    state.purchases[index].used = true;
                }
            });
    },
});

export const { clearError } = pointsStoreSlice.actions;
export default pointsStoreSlice.reducer;
