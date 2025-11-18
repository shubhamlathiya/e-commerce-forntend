import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../api/client";

// Thunks
export const getAllFaqs = createAsyncThunk(
    "productFaqs/getAll",
    async ({ page = 1, limit = 10, productId } = {}, { rejectWithValue }) => {
        try {
            const params = { page, limit };
            if (productId) params.productId = productId;
            const { data } = await apiClient.get("/api/catalog/product-faqs", { params });
            return data;
        } catch (err) {
            const msg = err?.response?.data || err.message;
            return rejectWithValue(msg);
        }
    }
);

export const getFaqById = createAsyncThunk(
    "productFaqs/getById",
    async (id, { rejectWithValue }) => {
        try {
            const { data } = await apiClient.get(`/api/catalog/product-faqs/${id}`);
            return data;
        } catch (err) {
            const msg = err?.response?.data || err.message;
            return rejectWithValue(msg);
        }
    }
);

export const createFaq = createAsyncThunk(
    "productFaqs/create",
    async (payload, { rejectWithValue }) => {
        try {
            const { data } = await apiClient.post("/api/catalog/product-faqs", payload);
            return data;
        } catch (err) {
            const msg = err?.response?.data || err.message;
            return rejectWithValue(msg);
        }
    }
);

export const updateFaq = createAsyncThunk(
    "productFaqs/update",
    async ({ id, data: payload }, { rejectWithValue }) => {
        try {
            const { data } = await apiClient.patch(`/api/catalog/product-faqs/${id}`, payload);
            return data;
        } catch (err) {
            const msg = err?.response?.data || err.message;
            return rejectWithValue(msg);
        }
    }
);

export const deleteFaq = createAsyncThunk(
    "productFaqs/delete",
    async (id, { rejectWithValue }) => {
        try {
            const { data } = await apiClient.delete(`/api/catalog/product-faqs/${id}`);
            return { id, ...data };
        } catch (err) {
            const msg = err?.response?.data || err.message;
            return rejectWithValue(msg);
        }
    }
);

const initialState = {
    items: [],
    form: {
        productId: "",
        question: "",
        answer: "",
    },
    modalOpen: false,
    current: null,
    page: 1,
    limit: 10,
    total: 0,
    status: "idle",
    error: null,
};

const productFaqSlice = createSlice({
    name: "productFaqs",
    initialState,
    reducers: {
        openCreateModal(state) {
            state.modalOpen = true;
            state.current = null;
        },
        openEditModal(state, action) {
            state.modalOpen = true;
            state.current = action.payload || null;
            const cur = action.payload || {};
            state.form.productId = cur.productId || "";
            state.form.question = cur.question || "";
            state.form.answer = cur.answer || "";
        },
        closeModal(state) {
            state.modalOpen = false;
        },
        setFormField(state, action) {
            const { field, value } = action.payload || {};
            if (field in state.form) {
                state.form[field] = value;
            }
        },
        resetForm(state) {
            state.form = { productId: "", question: "", answer: "" };
        },
        setPage(state, action) {
            state.page = Number(action.payload) || 1;
        },
        setLimit(state, action) {
            state.limit = Number(action.payload) || 10;
        },
    },
    extraReducers: (builder) => {
        builder
            // getAllFaqs
            .addCase(getAllFaqs.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(getAllFaqs.fulfilled, (state, action) => {
                state.status = "succeeded";
                const payload = action.payload || {};
                state.items = payload.items || payload.data || payload.results || [];
                state.total = payload.total || payload.count || state.items.length;
                // if backend returns page/limit, sync
                state.page = payload.page || state.page;
                state.limit = payload.limit || state.limit;
            })
            .addCase(getAllFaqs.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload || action.error?.message || "Failed to load FAQs";
            })
            // createFaq
            .addCase(createFaq.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(createFaq.fulfilled, (state, action) => {
                state.status = "succeeded";
                const created = action.payload?.item || action.payload?.data || action.payload;
                if (created) {
                    state.items = [created, ...state.items];
                    state.total = (state.total || 0) + 1;
                }
            })
            .addCase(createFaq.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload || action.error?.message || "Failed to create FAQ";
            })
            // updateFaq
            .addCase(updateFaq.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(updateFaq.fulfilled, (state, action) => {
                state.status = "succeeded";
                const updated = action.payload?.item || action.payload?.data || action.payload;
                if (updated?.id || updated?._id) {
                    const id = updated.id || updated._id;
                    state.items = state.items.map((it) => (it._id === id || it.id === id ? { ...it, ...updated } : it));
                }
            })
            .addCase(updateFaq.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload || action.error?.message || "Failed to update FAQ";
            })
            // deleteFaq
            .addCase(deleteFaq.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(deleteFaq.fulfilled, (state, action) => {
                state.status = "succeeded";
                const id = action.payload?.id;
                if (id) {
                    state.items = state.items.filter((it) => (it._id || it.id) !== id);
                    state.total = Math.max(0, (state.total || 0) - 1);
                }
            })
            .addCase(deleteFaq.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload || action.error?.message || "Failed to delete FAQ";
            });
    },
});

export const {
    openCreateModal,
    openEditModal,
    closeModal,
    setFormField,
    resetForm,
    setPage,
    setLimit,
} = productFaqSlice.actions;

export default productFaqSlice.reducer;
