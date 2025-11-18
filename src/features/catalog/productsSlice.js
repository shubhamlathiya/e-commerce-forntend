import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import productApi from '../../api/productApi';

// Async thunks
export const createProduct = createAsyncThunk(
    'products/createProduct',
    async (formData, { rejectWithValue }) => {
        try {
            const response = await productApi.createProduct(formData);
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || error.message || 'Failed to create product'
            );
        }
    }
);

export const getProducts = createAsyncThunk(
    'products/getProducts',
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await productApi.getProducts(params);

            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || error.message || 'Failed to fetch products'
            );
        }
    }
);

export const updateProduct = createAsyncThunk(
    'products/updateProduct',
    async ({ id, formData }, { rejectWithValue }) => {
        try {
            const response = await productApi.updateProduct(id, formData);
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || error.message || 'Failed to update product'
            );
        }
    }
);

export const deleteProduct = createAsyncThunk(
    'products/deleteProduct',
    async (id, { rejectWithValue }) => {
        try {
            await productApi.deleteProduct(id);
            return id;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || error.message || 'Failed to delete product'
            );
        }
    }
);

const productsSlice = createSlice({
    name: 'products',
    initialState: {
        items: [],
        current: null,
        page: 1,
        limit: 10,
        total: 0,
        status: 'idle',
        error: null,
        modalOpen: false,
    },
    reducers: {
        setPage: (state, action) => {
            state.page = action.payload;
        },
        setLimit: (state, action) => {
            state.limit = action.payload;
            state.page = 1;
        },
        openCreateModal: (state) => {
            state.modalOpen = true;
            state.current = null;
        },
        openEditModal: (state, action) => {
            state.modalOpen = true;
            state.current = action.payload;
        },
        closeModal: (state) => {
            state.modalOpen = false;
            state.current = null;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Create Product
            .addCase(createProduct.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(createProduct.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.items.unshift(action.payload.data);
                state.modalOpen = false;
            })
            .addCase(createProduct.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            // Get Products
            .addCase(getProducts.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(getProducts.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.items = action.payload.items || action.payload.data || [];
                state.total = action.payload.total || 0;
            })
            .addCase(getProducts.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            // Update Product
            .addCase(updateProduct.fulfilled, (state, action) => {
                const updatedProduct = action.payload.data;
                const index = state.items.findIndex(item => item._id === updatedProduct._id);
                if (index !== -1) {
                    state.items[index] = updatedProduct;
                }
                state.current = updatedProduct;
            })
            // Delete Product
            .addCase(deleteProduct.fulfilled, (state, action) => {
                state.items = state.items.filter(item => item._id !== action.payload);
            });
    },
});

export const {
    setPage,
    setLimit,
    openCreateModal,
    openEditModal,
    closeModal,
    clearError,
} = productsSlice.actions;

export default productsSlice.reducer;