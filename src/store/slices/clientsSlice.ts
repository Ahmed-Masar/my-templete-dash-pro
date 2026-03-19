import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { usersAPI } from '@/lib/api';

export interface Client {
  _id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  companyId?: { _id: string; name: string; [key: string]: any };
  [key: string]: any;
}

export interface ClientsState {
  clients: Client[];
  currentClient: Client | null;
  loading: boolean;
  error: string | null;
  total: number;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalClients: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const initialState: ClientsState = {
  clients: [],
  currentClient: null,
  loading: false,
  error: null,
  total: 0,
  pagination: {
    currentPage: 1,
    totalPages: 0,
    totalClients: 0,
    limit: 10,
    hasNext: false,
    hasPrev: false,
  },
};

export const fetchClients = createAsyncThunk(
  'clients/fetchClients',
  async (params: any = {}, { rejectWithValue }) => {
    try {
      const response = await usersAPI.getAll({ ...params, role: 'user' });
      if (response.status === 'success') return response;
      return rejectWithValue('Failed to fetch clients');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch clients');
    }
  }
);

export const fetchClientById = createAsyncThunk(
  'clients/fetchClientById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await usersAPI.getById(id);
      if (response.status === 'success') return response.data;
      return rejectWithValue('Failed to fetch client');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch client');
    }
  }
);

export const createClient = createAsyncThunk(
  'clients/createClient',
  async (clientData: any, { rejectWithValue }) => {
    try {
      const response = await usersAPI.create({ ...clientData, role: 'user' });
      if (response.status === 'success') return response.data;
      return rejectWithValue('Failed to create client');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create client');
    }
  }
);

export const updateClient = createAsyncThunk(
  'clients/updateClient',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await usersAPI.update(id, data);
      if (response.status === 'success') return response.data;
      return rejectWithValue('Failed to update client');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update client');
    }
  }
);

export const deleteClient = createAsyncThunk(
  'clients/deleteClient',
  async (id: string, { rejectWithValue }) => {
    try {
      await usersAPI.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete client');
    }
  }
);

const clientsSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentClient: (state, action: PayloadAction<Client | null>) => {
      state.currentClient = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClients.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;

        const users = action.payload.data.users || action.payload.data || [];
        state.clients = users;
        state.total = action.payload.total || 0;

        const p = action.payload.data?.pagination;
        if (p) {
          state.pagination = {
            currentPage: p.currentPage ?? 1,
            totalPages: p.totalPages ?? 0,
            totalClients: p.totalClients ?? p.totalItems ?? state.total,
            limit: p.limit ?? 10,
            hasNext: p.hasNext ?? false,
            hasPrev: p.hasPrev ?? false,
          };
        } else {
          state.pagination.totalClients = state.total;
        }
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchClientById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClientById.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.currentClient = action.payload.user || action.payload;
      })
      .addCase(fetchClientById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(createClient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createClient.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const newUser = action.payload.user || action.payload;
        state.clients.unshift(newUser);
        state.total += 1;
      })
      .addCase(createClient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(updateClient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateClient.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const updatedUser = action.payload.user || action.payload;
        const index = state.clients.findIndex(c => c._id === updatedUser._id);
        if (index !== -1) {
          state.clients[index] = updatedUser;
        }
        if (state.currentClient?._id === updatedUser._id) {
          state.currentClient = updatedUser;
        }
      })
      .addCase(updateClient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(deleteClient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteClient.fulfilled, (state, action) => {
        state.loading = false;
        state.clients = state.clients.filter(client => client._id !== action.payload);
        if (state.currentClient?._id === action.payload) {
          state.currentClient = null;
        }
        state.total -= 1;
      })
      .addCase(deleteClient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setCurrentClient } = clientsSlice.actions;
export default clientsSlice.reducer;
