import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../api/client";

// Optional list loader to populate table (assumes GET /api/catalog/seo returns list)
export const getAllProductSeo = createAsyncThunk(
    "productSeo/getAll",
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await apiClient.get("/api/catalog/seo");
            return data;
        } catch (err) {
            return rejectWithValue(err?.response?.data || err.message);
        }
    }
);

export const getProductSeo = createAsyncThunk(
    "productSeo/getOne",
    async (productId, { rejectWithValue }) => {
        try {
            const { data } = await apiClient.get(`/api/catalog/seo/${productId}`);
            return { productId, data };
        } catch (err) {
            return rejectWithValue(err?.response?.data || err.message);
        }
    }
);

export const upsertProductSeo = createAsyncThunk(
    "productSeo/upsert",
    async ({ productId, data: payload }, { rejectWithValue }) => {
        try {
            const { data } = await apiClient.put(`/api/catalog/seo/${productId}`, payload);
            return { productId, data };
        } catch (err) {
            return rejectWithValue(err?.response?.data || err.message);
        }
    }
);

export const deleteProductSeo = createAsyncThunk(
    "productSeo/delete",
    async (productId, { rejectWithValue }) => {
        try {
            const { data } = await apiClient.delete(`/api/catalog/seo/${productId}`);
            return { productId, data };
        } catch (err) {
            return rejectWithValue(err?.response?.data || err.message);
        }
    }
);

const initialState = {
    items: [], // list view of SEO records
    seo: {
        metaTitle: "",
        metaDescription: "",
        keywords: [],
        slug: "",
        canonicalUrl: "",
    },
    modalOpen: false,
    currentProductId: null,
    status: "idle",
    error: null,
};

const productSeoSlice = createSlice({
    name: "productSeo",
    initialState,
    reducers: {
        setSeoField(state, action) {
            const { field, value } = action.payload || {};
            if (field in state.seo) state.seo[field] = value;
        },
        resetSeoForm(state) {
            state.seo = {
                metaTitle: "",
                metaDescription: "",
                keywords: [],
                slug: "",
                canonicalUrl: "",
            };
        },
        openSeoModal(state, action) {
            const productId = action.payload;
            state.modalOpen = true;
            state.currentProductId = productId || null;
        },
        closeSeoModal(state) {
            state.modalOpen = false;
            state.currentProductId = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // list
            .addCase(getAllProductSeo.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(getAllProductSeo.fulfilled, (state, action) => {
                state.status = "succeeded";
                const payload = action.payload || {};
                state.items = payload.items || payload.data || payload.results || payload || [];
            })
            .addCase(getAllProductSeo.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload || action.error?.message || "Failed to load Product SEO list";
            })
            // get one
            .addCase(getProductSeo.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(getProductSeo.fulfilled, (state, action) => {
                state.status = "succeeded";
                const data = action.payload?.data || {};
                state.seo.metaTitle = data.metaTitle || "";
                state.seo.metaDescription = data.metaDescription || "";
                state.seo.keywords = Array.isArray(data.keywords)
                    ? data.keywords
                    : typeof data.keywords === "string"
                        ? data.keywords.split(",").map((k) => k.trim()).filter(Boolean)
                        : [];
                state.seo.slug = data.slug || "";
                state.seo.canonicalUrl = data.canonicalUrl || "";
            })
            .addCase(getProductSeo.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload || action.error?.message || "Failed to load SEO";
            })
            // upsert
            .addCase(upsertProductSeo.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(upsertProductSeo.fulfilled, (state, action) => {
                state.status = "succeeded";
                const { productId, data } = action.payload || {};
                // update list
                const normalized = {
                    productId,
                    metaTitle: data?.metaTitle || state.seo.metaTitle,
                    metaDescription: data?.metaDescription || state.seo.metaDescription,
                    keywords: data?.keywords || state.seo.keywords,
                    slug: data?.slug ?? state.seo.slug,
                    canonicalUrl: data?.canonicalUrl ?? state.seo.canonicalUrl,
                };
                const idx = state.items.findIndex((it) => (it.productId || it.id) === productId);
                if (idx >= 0) state.items[idx] = { ...state.items[idx], ...normalized };
                else state.items.unshift(normalized);
            })
            .addCase(upsertProductSeo.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload || action.error?.message || "Failed to save SEO";
            })
            // delete
            .addCase(deleteProductSeo.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(deleteProductSeo.fulfilled, (state, action) => {
                state.status = "succeeded";
                const id = action.payload?.productId;
                state.items = state.items.filter((it) => (it.productId || it.id) !== id);
            })
            .addCase(deleteProductSeo.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload || action.error?.message || "Failed to delete SEO";
            });
    },
});

export const { setSeoField, resetSeoForm, openSeoModal, closeSeoModal } = productSeoSlice.actions;
export default productSeoSlice.reducer;

