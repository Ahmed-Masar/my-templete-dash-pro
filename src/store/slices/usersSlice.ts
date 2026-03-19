import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { usersAPI } from '@/lib/api';

export interface User {
    _id: string;
    name: string;
    phone: number;
    city: string;
    role: string;
    pages?: string[];
    points: number;
    vendorPoints: number;
    lat: number;
    lng: number;
    location: {
        type: 'Point';
        coordinates: [number, number];
    };
    isApproved: boolean;
    createdAt?: string;
    updatedAt?: string;
}

interface UsersState {
    users: User[];
    loading: boolean;
    error: string | null;
    total: number;
    _removedUser: User | null;
}

const initialState: UsersState = {
    users: [],
    loading: false,
    error: null,
    total: 0,
    _removedUser: null,
};

export const fetchUsers = createAsyncThunk(
    'users/fetchUsers',
    async (params: any = {}, { rejectWithValue }) => {
        try {
            const response = await usersAPI.getAll(params);
            if (response.status === 'success') return response;
            return rejectWithValue('Failed to fetch users');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch users');
        }
    }
);

export const createUser = createAsyncThunk(
    'users/createUser',
    async (data: any, { rejectWithValue }) => {
        try {
            const response = await usersAPI.create(data);
            if (response.status === 'success') return response.data.user || response.data;
            return rejectWithValue('Failed to create user');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to create user');
        }
    }
);

export const updateUser = createAsyncThunk(
    'users/updateUser',
    async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
        try {
            const response = await usersAPI.update(id, data);
            if (response.status === 'success') return response.data.user || response.data;
            return rejectWithValue('Failed to update user');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to update user');
        }
    }
);

export const deleteUser = createAsyncThunk(
    'users/deleteUser',
    async (id: string, { rejectWithValue }) => {
        try {
            await usersAPI.delete(id);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to delete user');
        }
    }
);

const usersSlice = createSlice({
    name: 'users',
    initialState,
    reducers: {
        clearError: (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUsers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUsers.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.users = action.payload.data.users || [];
                state.total = action.payload.total || 0;
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(createUser.fulfilled, (state, action: PayloadAction<any>) => {
                state.users.unshift(action.payload);
                state.total += 1;
            })
            .addCase(updateUser.fulfilled, (state, action: PayloadAction<any>) => {
                const index = state.users.findIndex(u => u._id === action.payload._id);
                if (index !== -1) {
                    state.users[index] = action.payload;
                }
            })
            .addCase(deleteUser.pending, (state, action) => {
                const id = action.meta.arg;
                const user = state.users.find(u => u._id === id);
                if (user) {
                    state._removedUser = user;
                    state.users = state.users.filter(u => u._id !== id);
                    state.total -= 1;
                }
            })
            .addCase(deleteUser.fulfilled, (state) => {
                state._removedUser = null;
            })
            .addCase(deleteUser.rejected, (state) => {
                if (state._removedUser) {
                    state.users.unshift(state._removedUser);
                    state.total += 1;
                    state._removedUser = null;
                }
            });
    },
});

export const { clearError } = usersSlice.actions;
export default usersSlice.reducer;
