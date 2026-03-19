import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { categoriesAPI } from '@/lib/api';

export interface Category {
    _id: string;
    title: string;
    slug?: string;
    image?: string;
    isHomeCategory?: boolean;
    order?: number;
    categoryType: 'main' | 'sub';
    subCategories?: any[];
    createdAt?: string;
    updatedAt?: string;
}

interface CategoriesState {
    categories: Category[];
    allMainCategories: Category[];
    loading: boolean;
    error: string | null;
    total: number;
}

const initialState: CategoriesState = {
    categories: [],
    allMainCategories: [],
    loading: false,
    error: null,
    total: 0,
};

export const fetchCategories = createAsyncThunk(
    'categories/fetchCategories',
    async (params: any = {}, { rejectWithValue }) => {
        try {
            const response = await categoriesAPI.getAll(params);
            if (response.status === 'success') return response;
            return rejectWithValue('Failed to fetch categories');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch categories');
        }
    }
);

export const fetchAllMainCategories = createAsyncThunk(
    'categories/fetchAllMainCategories',
    async (_, { rejectWithValue }) => {
        try {
            const response = await categoriesAPI.getAll({ categoryType: 'main', limit: 1000 });
            if (response.status === 'success') return (response.data as any).categories as Category[];
            return rejectWithValue('Failed to fetch main categories');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch main categories');
        }
    }
);

export const createCategory = createAsyncThunk(
    'categories/createCategory',
    async (data: any, { rejectWithValue }) => {
        try {
            const response = await categoriesAPI.create(data);
            if (response.status === 'success') return response.data.category;
            return rejectWithValue('Failed to create category');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to create category');
        }
    }
);

export const updateCategory = createAsyncThunk(
    'categories/updateCategory',
    async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
        try {
            const response = await categoriesAPI.update(id, data);
            if (response.status === 'success') return response.data.category;
            return rejectWithValue('Failed to update category');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to update category');
        }
    }
);

export const deleteCategory = createAsyncThunk(
    'categories/deleteCategory',
    async (id: string, { rejectWithValue }) => {
        try {
            await categoriesAPI.delete(id);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to delete category');
        }
    }
);

export const assignHomeCategories = createAsyncThunk(
    'categories/assignHomeCategories',
    async (items: { id: string; order: number; isHomeCategory: boolean }[], { rejectWithValue }) => {
        try {
            const response = await categoriesAPI.assignHome(items);
            if (response.status === 'success') return items;
            return rejectWithValue('Failed to assign home categories');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to assign home categories');
        }
    }
);

const categoriesSlice = createSlice({
    name: 'categories',
    initialState,
    reducers: {
        clearError: (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCategories.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchCategories.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.categories = action.payload.data.categories || [];
                state.total = action.payload.total || 0;
            })
            .addCase(fetchCategories.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
            .addCase(fetchAllMainCategories.fulfilled, (state, action: PayloadAction<Category[]>) => {
                state.allMainCategories = action.payload || [];
            })
            .addCase(createCategory.fulfilled, (state, action) => { state.categories.unshift(action.payload); state.total += 1; })
            .addCase(updateCategory.fulfilled, (state, action) => {
                const index = state.categories.findIndex(c => c._id === action.payload._id);
                if (index !== -1) state.categories[index] = action.payload;
            })
            .addCase(deleteCategory.fulfilled, (state, action) => {
                state.categories = state.categories.filter(c => c._id !== action.payload);
                state.total -= 1;
            })
            .addCase(assignHomeCategories.fulfilled, (state, action) => {
                const assignedMap = new Map(action.payload.map(i => [i.id, i.order]));
                const update = (list: Category[]) => list.map(cat => ({
                    ...cat,
                    isHomeCategory: assignedMap.has(cat._id),
                    order: assignedMap.has(cat._id) ? assignedMap.get(cat._id) : cat.order,
                }));
                state.categories = update(state.categories);
                state.allMainCategories = update(state.allMainCategories);
            });
    },
});

export const { clearError } = categoriesSlice.actions;
export default categoriesSlice.reducer;

