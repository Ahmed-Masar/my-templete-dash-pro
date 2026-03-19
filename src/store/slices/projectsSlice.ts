import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { MOCK_PROJECTS, MOCK_CLIENTS } from '@/lib/mockData';

export interface Project {
  _id: string;
  name: string;
  status: string;
  images: string[];
  clientId: {
    _id: string;
    name: string;
    companyId: {
      _id: string;
      name: string;
    };
  };
  customFields: Record<string, any>;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProjectsState {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalProjects: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const initialState: ProjectsState = {
  projects: [],
  currentProject: null,
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 0,
    totalProjects: 0,
    limit: 10,
    hasNext: false,
    hasPrev: false,
  },
};

export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (params: { page?: number; limit?: number; search?: string; clientId?: string; status?: string } = {}) => {
    return {
      data: {
        projects: MOCK_PROJECTS,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: MOCK_PROJECTS.length,
          totalProjects: MOCK_PROJECTS.length,
          limit: 10,
          hasNext: false,
          hasPrev: false,
        },
      },
    } as any;
  }
);

export const fetchProjectById = createAsyncThunk(
  'projects/fetchProjectById',
  async (id: string) => {
    const project = MOCK_PROJECTS.find(p => p._id === id);
    return { data: { project: project || MOCK_PROJECTS[0] } } as any;
  }
);

export const createProject = createAsyncThunk(
  'projects/createProject',
  async (projectData: {
    name: string;
    clientId: string;
    status: string;
    images?: File[];
    customFields?: Record<string, any>
  }) => {
    const client = MOCK_CLIENTS.find(c => c._id === projectData.clientId) || MOCK_CLIENTS[0];
    const newProject = {
      _id: `mock-project-${Date.now()}`,
      name: projectData.name,
      status: projectData.status,
      images: [],
      clientId: { _id: client._id, name: client.name, companyId: client.companyId },
      customFields: projectData.customFields || {},
      createdBy: { _id: '1', name: 'Admin', email: 'admin@vodex.com' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return { data: { project: newProject } } as any;
  }
);

export const updateProject = createAsyncThunk(
  'projects/updateProject',
  async ({ id, data }: {
    id: string;
    data: {
      name?: string;
      clientId?: string;
      status?: string;
      images?: File[];
      customFields?: Record<string, any>
    }
  }) => {
    const project = MOCK_PROJECTS.find(p => p._id === id) || MOCK_PROJECTS[0];
    const updated = { ...project, ...data };
    return { data: { project: updated } } as any;
  }
);

export const deleteProject = createAsyncThunk(
  'projects/deleteProject',
  async (id: string) => {
    return id;
  }
);

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentProject: (state, action: PayloadAction<Project | null>) => {
      state.currentProject = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload.data.projects;
        state.pagination = action.payload.data.pagination;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch projects';
      })

      .addCase(fetchProjectById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProject = action.payload.data.project;
      })
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch project';
      })

      .addCase(createProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.loading = false;
        state.projects.unshift(action.payload.data.project);
      })
      .addCase(createProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create project';
      })

      .addCase(updateProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.projects.findIndex(project => project._id === action.payload.data.project._id);
        if (index !== -1) {
          state.projects[index] = action.payload.data.project;
        }
        if (state.currentProject?._id === action.payload.data.project._id) {
          state.currentProject = action.payload.data.project;
        }
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update project';
      })

      .addCase(deleteProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = state.projects.filter(project => project._id !== action.payload);
        if (state.currentProject?._id === action.payload) {
          state.currentProject = null;
        }
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete project';
      });
  },
});

export const { clearError, setCurrentProject } = projectsSlice.actions;
export default projectsSlice.reducer;
