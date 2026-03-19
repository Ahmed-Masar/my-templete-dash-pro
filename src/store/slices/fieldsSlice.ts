import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { MOCK_FIELDS } from '@/lib/mockData';

const USE_MOCK_DATA = true;
export interface FieldDefinition {
  _id: string;
  entityType: 'company' | 'client' | 'project';
  fieldKey: string;
  fieldLabel: string;
  fieldType: 'text' | 'number' | 'date' | 'email' | 'select' | 'textarea' | 'boolean' | 'url';
  required: boolean;
  order: number;
  isActive: boolean;
  options?: string[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface FieldsState {
  fields: {
    company: FieldDefinition[];
    client: FieldDefinition[];
    project: FieldDefinition[];
  };
  loading: boolean;
  error: string | null;
}

const initialState: FieldsState = {
  fields: {
    company: [],
    client: [],
    project: [],
  },
  loading: false,
  error: null,
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

export const fetchFields = createAsyncThunk(
  'fields/fetchFields',
  async (entityType: 'company' | 'client' | 'project') => {
    return {
      entityType,
      data: { data: { fields: MOCK_FIELDS[entityType] || [] } },
    } as any;
  }
);

export const createField = createAsyncThunk(
  'fields/createField',
  async ({ entityType, fieldData }: {
    entityType: 'company' | 'client' | 'project';
    fieldData: Omit<FieldDefinition, '_id' | 'entityType' | 'isActive'>
  }) => {
    const newField = {
      ...fieldData,
      _id: `mock-field-${Date.now()}`,
      entityType,
      isActive: true,
    };
    return { entityType, data: { data: { field: newField } } } as any;
  }
);

export const updateField = createAsyncThunk(
  'fields/updateField',
  async ({ id, fieldData }: {
    id: string;
    fieldData: Partial<Omit<FieldDefinition, '_id' | 'entityType'>>
  }) => {
    const updated = { ...fieldData, _id: id };
    return { data: { field: updated } } as any;
  }
);

export const deleteField = createAsyncThunk(
  'fields/deleteField',
  async (id: string) => {
    return id;
  }
);

export const toggleFieldStatus = createAsyncThunk(
  'fields/toggleFieldStatus',
  async (id: string) => {
    const updated = { _id: id, isActive: true };
    return { data: { field: updated } } as any;
  }
);

export const reorderFields = createAsyncThunk(
  'fields/reorderFields',
  async ({ entityType, fields }: {
    entityType: 'company' | 'client' | 'project';
    fields: { id: string; order: number }[]
  }) => {
    return { entityType, data: { data: {} } } as any;
  }
);
const fieldsSlice = createSlice({
  name: 'fields',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFields.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFields.fulfilled, (state, action) => {
        state.loading = false;
        state.fields[action.payload.entityType] = action.payload.data.data.fields;
      })
      .addCase(fetchFields.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch fields';
      })

      .addCase(createField.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createField.fulfilled, (state, action) => {
        state.loading = false;
        state.fields[action.payload.entityType].push(action.payload.data.data.field);
      })
      .addCase(createField.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create field';
      })

      .addCase(updateField.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateField.fulfilled, (state, action) => {
        state.loading = false;
        const updatedField = action.payload.data.field;
      })
      .addCase(updateField.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update field';
      })

      .addCase(deleteField.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteField.fulfilled, (state, action) => {
        state.loading = false;
        // Remove field from all entity types
        Object.keys(state.fields).forEach(entityType => {
          state.fields[entityType] = state.fields[entityType].filter(field => field._id !== action.payload);
        });
      })
      .addCase(deleteField.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete field';
      })

      .addCase(toggleFieldStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleFieldStatus.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(toggleFieldStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to toggle field status';
      })

      .addCase(reorderFields.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(reorderFields.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(reorderFields.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to reorder fields';
      });
  },
});

export const { clearError } = fieldsSlice.actions;
export default fieldsSlice.reducer;
