import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { productsAPI } from '@/lib/api';

export interface ProductVariant {
    color: string;
    images: string[];
    specs: string[];
}

export interface Product {
    _id: string;
    name: string;
    generalDescription?: string;
    techSpecs?: string;
    specialSpecs?: string;
    price: number;
    jumlaaPrice?: number;
    originalPrice?: number;
    discount?: number;
    points?: number;
    vendorPoints?: number;
    productType?: string;
    isHomeProduct?: boolean;
    store?: string | any;
    categories?: string[] | any[];
    tags?: string[] | any[];
    pdf?: string;
    variants?: ProductVariant[];
    image?: string;
    order?: number;
    createdAt: string;
    updatedAt: string;
}

interface ProductsState {
    products: Product[];
    currentProduct: Product | null;
    loading: boolean;
    error: string | null;
    total: number;
}

const initialState: ProductsState = {
    products: [],
    currentProduct: null,
    loading: false,
    error: null,
    total: 0,
};

// Thunks
export const fetchProducts = createAsyncThunk(
    'products/fetchProducts',
    async (params: any = {}, { rejectWithValue }) => {
        try {
            const response = await productsAPI.getAll(params);
            if (response.status === 'success') {
                return response;
            }
            return rejectWithValue('Failed to fetch products');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch products');
        }
    }
);

export const createProduct = createAsyncThunk(
    'products/createProduct',
    async (productData: any, { rejectWithValue }) => {
        try {
            const response = await productsAPI.create(productData);
            if (response.status === 'success') {
                return response.data.product;
            }
            return rejectWithValue('Failed to create product');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to create product');
        }
    }
);

export const updateProduct = createAsyncThunk(
    'products/updateProduct',
    async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
        try {
            const response = await productsAPI.update(id, data);
            if (response.status === 'success') {
                return response.data.product;
            }
            return rejectWithValue('Failed to update product');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to update product');
        }
    }
);

export const deleteProduct = createAsyncThunk(
    'products/deleteProduct',
    async (id: string, { rejectWithValue }) => {
        try {
            await productsAPI.delete(id);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to delete product');
        }
    }
);

export const assignProductType = createAsyncThunk(
    'products/assignProductType',
    async ({ productType, items }: { productType: string; items: { id: string; order: number; isHomeProduct: boolean }[] }, { rejectWithValue }) => {
        try {
            const response = await productsAPI.assignType(productType, items);
            if (response.status === 'success') return { productType, items };
            return rejectWithValue('Failed to assign product type');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to assign product type');
        }
    }
);

const productsSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        setCurrentProduct: (state, action: PayloadAction<Product | null>) => {
            state.currentProduct = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchProducts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProducts.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.products = action.payload.data.products || [];
                state.total = action.payload.total || 0;
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(createProduct.fulfilled, (state, action) => {
                state.products.unshift(action.payload);
                state.total += 1;
            })
            .addCase(updateProduct.fulfilled, (state, action) => {
                const index = state.products.findIndex(p => p._id === action.payload._id);
                if (index !== -1) {
                    state.products[index] = action.payload;
                }
            })
            .addCase(deleteProduct.fulfilled, (state, action) => {
                state.products = state.products.filter(p => p._id !== action.payload);
                state.total -= 1;
            })
            .addCase(assignProductType.fulfilled, (state, action) => {
                const { productType, items } = action.payload;
                const idOrderMap = new Map(items.map(i => [i.id, i.order]));
                state.products = state.products.map(p => {
                    if (idOrderMap.has(p._id)) {
                        return { ...p, productType, order: idOrderMap.get(p._id), isHomeProduct: true };
                    }
                    if (p.productType === productType) {
                        return { ...p, productType: undefined, order: undefined, isHomeProduct: false };
                    }
                    return p;
                });
            });
    },
});

export const { clearError, setCurrentProduct } = productsSlice.actions;
export default productsSlice.reducer;
