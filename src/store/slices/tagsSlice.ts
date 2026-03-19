import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { tagsAPI } from '@/lib/api';

export interface Tag {
    _id: string;
    title: string;
    color: string;
}

interface TagsState {
    tags: Tag[];
    loading: boolean;
    error: string | null;
    total: number;
}

const initialState: TagsState = {
    tags: [],
    loading: false,
    error: null,
    total: 0,
};

export const fetchTags = createAsyncThunk(
    'tags/fetchTags',
    async (params: any = {}, { rejectWithValue }) => {
        try {
            const response = await tagsAPI.getAll(params);
            if (response.status === 'success') return response;
            return rejectWithValue('Failed to fetch tags');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch tags');
        }
    }
);

export const createTag = createAsyncThunk(
    'tags/createTag',
    async (data: any, { rejectWithValue }) => {
        try {
            const response = await tagsAPI.create(data);
            if (response.status === 'success') return response.data.tag;
            return rejectWithValue('Failed to create tag');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to create tag');
        }
    }
);

export const updateTag = createAsyncThunk(
    'tags/updateTag',
    async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
        try {
            const response = await tagsAPI.update(id, data);
            if (response.status === 'success') return response.data.tag;
            return rejectWithValue('Failed to update tag');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to update tag');
        }
    }
);

export const deleteTag = createAsyncThunk(
    'tags/deleteTag',
    async (id: string, { rejectWithValue }) => {
        try {
            await tagsAPI.delete(id);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to delete tag');
        }
    }
);

const tagsSlice = createSlice({
    name: 'tags',
    initialState,
    reducers: {
        clearError: (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchTags.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchTags.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                const fetchedTags = action.payload.data.tags || [];
                state.tags = fetchedTags.map((tag: any) => ({
                    ...tag,
                    title: tag.title || tag.name || 'Untitled'
                }));
                state.total = action.payload.total || 0;
            })
            .addCase(fetchTags.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
            .addCase(createTag.fulfilled, (state, action) => { state.tags.unshift(action.payload); state.total += 1; })
            .addCase(updateTag.fulfilled, (state, action) => {
                const index = state.tags.findIndex(t => t._id === action.payload._id);
                if (index !== -1) state.tags[index] = action.payload;
            })
            .addCase(deleteTag.fulfilled, (state, action) => {
                state.tags = state.tags.filter(t => t._id !== action.payload);
                state.total -= 1;
            });
    },
});

export const { clearError } = tagsSlice.actions;
export default tagsSlice.reducer;
