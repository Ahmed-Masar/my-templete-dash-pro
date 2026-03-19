import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { reviewsAPI } from '@/lib/api';

export interface Review {
    _id: string;
    user: {
        _id: string;
        name: string;
    };
    product: string;
    rating: number;
    comment: string;
    images: string[];
    isApproved: boolean;
    isBought: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface RatingStats {
    avgRating: number;
    ratingsCount: {
        '1': number;
        '2': number;
        '3': number;
        '4': number;
        '5': number;
    };
}

interface ReviewsState {
    reviews: Review[];
    loading: boolean;
    error: string | null;
    total: number;
    ratingStats: RatingStats | null;
    _removedReview: Review | null;
}

const initialState: ReviewsState = {
    reviews: [],
    loading: false,
    error: null,
    total: 0,
    ratingStats: null,
    _removedReview: null,
};

export const fetchReviews = createAsyncThunk(
    'reviews/fetchReviews',
    async (params: any = {}, { rejectWithValue }) => {
        try {
            const response = await reviewsAPI.getAll(params);
            if (response.status === 'success') return response;
            return rejectWithValue('Failed to fetch reviews');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch reviews');
        }
    }
);

export const approveReview = createAsyncThunk(
    'reviews/approveReview',
    async (id: string, { rejectWithValue }) => {
        try {
            const response = await reviewsAPI.approve(id);
            if (response.status === 'success') return { id };
            return rejectWithValue('Failed to approve review');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to approve review');
        }
    }
);

export const deleteReview = createAsyncThunk(
    'reviews/deleteReview',
    async (id: string, { rejectWithValue }) => {
        try {
            await reviewsAPI.delete(id);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to delete review');
        }
    }
);

const reviewsSlice = createSlice({
    name: 'reviews',
    initialState,
    reducers: {
        clearError: (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchReviews.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchReviews.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.reviews = action.payload.data?.reviews || [];
                state.total = action.payload.total || 0;
                state.ratingStats = action.payload.ratingStats || null;
            })
            .addCase(fetchReviews.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Optimistic approve
            .addCase(approveReview.pending, (state, action) => {
                const index = state.reviews.findIndex(r => r._id === action.meta.arg);
                if (index !== -1) state.reviews[index].isApproved = true;
            })
            .addCase(approveReview.fulfilled, (_state, _action) => {
                // already updated in pending
            })
            .addCase(approveReview.rejected, (state, action) => {
                const index = state.reviews.findIndex(r => r._id === action.meta.arg);
                if (index !== -1) state.reviews[index].isApproved = false;
            })
            // Optimistic delete
            .addCase(deleteReview.pending, (state, action) => {
                const review = state.reviews.find(r => r._id === action.meta.arg);
                if (review) {
                    state._removedReview = review;
                    state.reviews = state.reviews.filter(r => r._id !== action.meta.arg);
                    state.total -= 1;
                }
            })
            .addCase(deleteReview.fulfilled, (state) => {
                state._removedReview = null;
            })
            .addCase(deleteReview.rejected, (state) => {
                if (state._removedReview) {
                    state.reviews.unshift(state._removedReview);
                    state.total += 1;
                    state._removedReview = null;
                }
            });
    },
});

export const { clearError } = reviewsSlice.actions;
export default reviewsSlice.reducer;
