import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { storesAPI } from '@/lib/api';


export interface Store {
    _id: string;
    title: string;
    slug?: string;
    image?: string;
    description?: string;
    location?: {
        type: string;
        coordinates: number[];
    };
    status?: string;
    isActive?: boolean;
    isHomeStore?: boolean;
    order?: number;
    facebook?: string;
    instgram?: string;
    messagener?: string;
    tiktok?: string;
    youtube?: string;
    map?: string;
    whatsapp?: string;
    x?: string;
    telegram?: string;
    productsCount?: number;
    createdAt: string;
    updatedAt?: string;
}

interface StoresState {
    stores: Store[];
    loading: boolean;
    error: string | null;
    total: number;
}

const initialState: StoresState = {
    stores: [],
    loading: false,
    error: null,
    total: 0,
};

export const fetchStores = createAsyncThunk(
    'stores/fetchStores',
    async (params: any = {}, { rejectWithValue }) => {
        try {
            const response = await storesAPI.getAll(params);
            if (response.status === 'success') return response;
            return rejectWithValue('Failed to fetch stores');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch stores');
        }
    }
);

export const createStore = createAsyncThunk(
    'stores/createStore',
    async (data: any, { rejectWithValue }) => {
        try {
            const response = await storesAPI.create(data);
            if (response.status === 'success') return response.data.store;
            return rejectWithValue('Failed to create store');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to create store');
        }
    }
);

export const updateStore = createAsyncThunk(
    'stores/updateStore',
    async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
        try {
            const response = await storesAPI.update(id, data);
            if (response.status === 'success') return response.data.store;
            return rejectWithValue('Failed to update store');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to update store');
        }
    }
);

export const deleteStore = createAsyncThunk(
    'stores/deleteStore',
    async (id: string, { rejectWithValue }) => {
        try {
            await storesAPI.delete(id);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to delete store');
        }
    }
);

export const assignHomeStores = createAsyncThunk(
    'stores/assignHomeStores',
    async (items: { id: string; order: number; isHomeStore: boolean }[], { rejectWithValue }) => {
        try {
            const response = await storesAPI.assignHome(items);
            if (response.status === 'success') return items;
            return rejectWithValue('Failed to assign home stores');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to assign home stores');
        }
    }
);

const storesSlice = createSlice({
    name: 'stores',
    initialState,
    reducers: {
        clearError: (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchStores.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchStores.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                const fetchedStores = action.payload.data.stores || [];
                state.stores = fetchedStores.map((store: any) => ({
                    ...store,
                    status: store.status ? store.status : (store.isActive ? 'active' : 'inactive')
                }));
                state.total = action.payload.total || 0;
            })
            .addCase(fetchStores.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
            .addCase(createStore.fulfilled, (state, action) => { state.stores.unshift(action.payload); state.total += 1; })
            .addCase(updateStore.fulfilled, (state, action) => {
                const index = state.stores.findIndex(s => s._id === action.payload._id);
                if (index !== -1) state.stores[index] = action.payload;
            })
            .addCase(deleteStore.fulfilled, (state, action) => {
                state.stores = state.stores.filter(s => s._id !== action.payload);
                state.total -= 1;
            })
            .addCase(assignHomeStores.fulfilled, (state, action) => {
                const assignedMap = new Map(action.payload.map(i => [i.id, i.order]));
                state.stores = state.stores.map(store => ({
                    ...store,
                    isHomeStore: assignedMap.has(store._id),
                    order: assignedMap.has(store._id) ? assignedMap.get(store._id) : store.order,
                }));
            });
    },
});

export const { clearError } = storesSlice.actions;
export default storesSlice.reducer;

