import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../api/client";

const API_URL = "/api/catalog/attributes";

// --- Async thunks ---
export const getAllAttributes = createAsyncThunk(
    "attributes/getAll",
    async ({ page = 1, limit = 10 }, { rejectWithValue }) => {
        try {
            const { data } = await apiClient.get(API_URL, { params: { page, limit } });
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

export const createAttribute = createAsyncThunk(
    "attributes/create",
    async (payload, { rejectWithValue }) => {
        try {
            const { data } = await apiClient.post(API_URL, payload);
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

export const updateAttribute = createAsyncThunk(
    "attributes/update",
    async ({ id, data: payload }, { rejectWithValue }) => {
        try {
            const { data } = await apiClient.patch(`${API_URL}/${id}`, payload);
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

export const deleteAttribute = createAsyncThunk(
    "attributes/delete",
    async (id, { rejectWithValue }) => {
        try {
            const { data } = await apiClient.delete(`${API_URL}/${id}`);
            return { id, data };
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

// --- Slice ---
const attributesSlice = createSlice({
    name: "attributes",
    initialState: {
        items: [],
        form: { name: "", slug: "", type: "text", values: [], isFilter: false, status: true },
        modalOpen: false,
        current: null,
        page: 1,
        limit: 10,
        total: 0,
        loading: false,
        error: null,
    },
    reducers: {
        openCreateModal: (state) => {
            state.modalOpen = true;
            state.current = null;
            state.form = { name: "", slug: "", type: "text", values: [], isFilter: false, status: true };
        },
        openEditModal: (state, { payload }) => {
            state.modalOpen = true;
            state.current = payload;
            state.form = payload;
        },
        closeModal: (state) => {
            state.modalOpen = false;
            state.current = null;
        },
        setFormField: (state, { payload }) => {
            const { field, value } = payload;
            state.form[field] = value;
        },
        resetForm: (state) => {
            state.form = { name: "", slug: "", type: "text", values: [], isFilter: false, status: true };
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getAllAttributes.pending, (state) => {
                state.loading = true;
            })
            .addCase(getAllAttributes.fulfilled, (state, { payload }) => {
                state.loading = false;
                state.items = payload.items || payload.data || [];
                state.page = payload.page || 1;
                state.limit = payload.limit || 10;
                state.total = payload.total || 0;
            })
            .addCase(getAllAttributes.rejected, (state, { payload }) => {
                state.loading = false;
                state.error = payload;
            });
    },
});

export const {
    openCreateModal,
    openEditModal,
    closeModal,
    setFormField,
    resetForm,
} = attributesSlice.actions;

export default attributesSlice.reducer;
