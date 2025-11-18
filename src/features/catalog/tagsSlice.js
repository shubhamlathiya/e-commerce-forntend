import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../../api/client";

// Thunks
export const getAllTags = createAsyncThunk(
    "tags/getAll",
    async (params = {}, { rejectWithValue }) => {
        try {
            const { page = 1, limit = 10, search, status } = params || {};
            const { data } = await apiClient.get("/api/catalog/tags", {
                params: { page, limit, search, status },
            });
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

export const createTag = createAsyncThunk("tags/create", async (payload, { rejectWithValue }) => {
    try {
        const body = {
            name: payload?.name,
            slug: payload?.slug,
            status: typeof payload?.status === "string" ? payload.status === "active" : !!payload?.status,
        };
        const { data } = await apiClient.post("/api/catalog/tags", body);
        return data;
    } catch (err) {
        return rejectWithValue(err.response?.data || err.message);
    }
});

export const getTagById = createAsyncThunk("tags/getById", async (id, { rejectWithValue }) => {
    try {
        const { data } = await apiClient.get(`/api/catalog/tags/${id}`);
        return data;
    } catch (err) {
        return rejectWithValue(err.response?.data || err.message);
    }
});

export const updateTag = createAsyncThunk("tags/update", async ({ id, data: body }, { rejectWithValue }) => {
    try {
        const patchBody = {
            ...(body?.name !== undefined ? { name: body.name } : {}),
            ...(body?.slug !== undefined ? { slug: body.slug } : {}),
            ...(body?.status !== undefined
                ? { status: typeof body.status === "string" ? body.status === "active" : !!body.status }
                : {}),
        };
        const { data } = await apiClient.patch(`/api/catalog/tags/${id}`, patchBody);
        return data;
    } catch (err) {
        return rejectWithValue(err.response?.data || err.message);
    }
});

export const deleteTag = createAsyncThunk("tags/delete", async (id, { rejectWithValue }) => {
    try {
        await apiClient.delete(`/api/catalog/tags/${id}`);
        return id;
    } catch (err) {
        return rejectWithValue(err.response?.data || err.message);
    }
});

const initialState = {
    items: [],
    current: null,
    form: { name: "", slug: "", status: "active" },
    modalOpen: false,
    status: "idle",
    error: null,
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
};

const tagsSlice = createSlice({
    name: "tags",
    initialState,
    reducers: {
        openCreateModal(state) {
            state.modalOpen = true;
            state.current = null;
            state.form = { name: "", slug: "", status: "active" };
        },
        openEditModal(state, action) {
            state.modalOpen = true;
            state.current = action.payload;
            state.form = {
                name: action.payload?.name || "",
                slug: action.payload?.slug || "",
                status: action.payload?.status || "inactive",
            };
        },
        closeModal(state) {
            state.modalOpen = false;
        },
        setFormField(state, action) {
            const { field, value } = action.payload;
            state.form[field] = value;
        },
        resetForm(state) {
            state.form = { name: "", slug: "", status: "active" };
        },
        setPage(state, action) {
            state.page = action.payload || 1;
        },
        setLimit(state, action) {
            state.limit = action.payload || 10;
        },
    },
    extraReducers: (builder) => {
        builder
            // getAllTags
            .addCase(getAllTags.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(getAllTags.fulfilled, (state, action) => {
                state.status = "succeeded";
                const payload = action.payload || {};
                const items = Array.isArray(payload)
                    ? payload
                    : Array.isArray(payload?.data)
                        ? payload.data
                        : Array.isArray(payload?.items)
                            ? payload.items
                            : [];
                state.items = items;
                const page = payload?.page ?? payload?.meta?.page ?? state.page;
                const limit = payload?.limit ?? payload?.meta?.limit ?? state.limit;
                const total = payload?.total ?? payload?.meta?.total ?? items.length;
                const totalPages = payload?.totalPages ?? payload?.meta?.totalPages ?? Math.max(1, Math.ceil(total / (limit || 1)));
                state.page = page;
                state.limit = limit;
                state.total = total;
                state.totalPages = totalPages;
            })
            .addCase(getAllTags.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload || action.error.message;
            })
            // createTag
            .addCase(createTag.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(createTag.fulfilled, (state, action) => {
                state.status = "succeeded";
                const created = action.payload?.data || action.payload;
                if (created) state.items.push(created);
                state.modalOpen = false;
            })
            .addCase(createTag.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload || action.error.message;
            })
            // getTagById
            .addCase(getTagById.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(getTagById.fulfilled, (state, action) => {
                state.status = "succeeded";
                const tag = action.payload?.data || action.payload;
                state.current = tag;
            })
            .addCase(getTagById.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload || action.error.message;
            })
            // updateTag
            .addCase(updateTag.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(updateTag.fulfilled, (state, action) => {
                state.status = "succeeded";
                const updated = action.payload?.data || action.payload;
                const idx = state.items.findIndex((t) => (t.id || t._id) === (updated?.id || updated?._id));
                if (idx >= 0) state.items[idx] = updated;
                state.modalOpen = false;
                state.current = null;
            })
            .addCase(updateTag.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload || action.error.message;
            })
            // deleteTag
            .addCase(deleteTag.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(deleteTag.fulfilled, (state, action) => {
                state.status = "succeeded";
                const id = action.payload;
                state.items = state.items.filter((t) => (t.id || t._id) !== id);
            })
            .addCase(deleteTag.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload || action.error.message;
            });
    },
});

export const { openCreateModal, openEditModal, closeModal, setFormField, resetForm, setPage, setLimit } = tagsSlice.actions;
export default tagsSlice.reducer;