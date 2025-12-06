import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../../api/client";

const ADMIN_URL = "/api/tabCategory/admin/tab-categories";
const PUBLIC_URL = "/tab-categories";

export const getAdminTabs = createAsyncThunk(
  "tabCategories/getAdminTabs",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get(ADMIN_URL);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const getPublicTabs = createAsyncThunk(
  "tabCategories/getPublicTabs",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get(PUBLIC_URL);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const createTabCategory = createAsyncThunk(
  "tabCategories/create",
  async (payload, { rejectWithValue }) => {
    try {
      const isFormData = typeof FormData !== "undefined" && payload instanceof FormData;
      let response;
      if (isFormData) {
        response = await apiClient.post(ADMIN_URL, payload, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        const body = {
          name: payload?.name,
          slug: payload?.slug,
          icon: payload?.icon,
          isActive: payload?.isActive !== undefined ? !!payload.isActive : true,
          categories: Array.isArray(payload?.categories) ? payload.categories : [],
          sortOrder: Number(payload?.sortOrder) || 0,
        };
        console.log(body);
        response = await apiClient.post(ADMIN_URL, body);
      }
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const updateTabCategory = createAsyncThunk(
  "tabCategories/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
      let response;
      if (isFormData) {
        response = await apiClient.put(`${ADMIN_URL}/${id}`, data, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        const body = {
          ...(data?.name !== undefined ? { name: data.name } : {}),
          ...(data?.slug !== undefined ? { slug: data.slug } : {}),
          ...(data?.icon !== undefined ? { icon: data.icon } : {}),
          ...(data?.isActive !== undefined ? { isActive: !!data.isActive } : {}),
          ...(data?.categories !== undefined ? { categories: data.categories } : {}),
          ...(data?.sortOrder !== undefined ? { sortOrder: Number(data.sortOrder) || 0 } : {}),
        };
        response = await apiClient.put(`${ADMIN_URL}/${id}`, body);
      }
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const deleteTabCategory = createAsyncThunk(
  "tabCategories/delete",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.delete(`${ADMIN_URL}/${id}`);
      return { id, data };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const initialState = {
  items: [],
  status: "idle",
  error: null,
  modalOpen: false,
  current: null,
  form: {
    name: "",
    slug: "",
    icon: "",
    isActive: true,
    categories: [],
    sortOrder: 0,
  },
};

const slice = createSlice({
  name: "tabCategories",
  initialState,
  reducers: {
    openCreateModal(state) {
      state.modalOpen = true;
      state.current = null;
      state.form = { name: "", slug: "", icon: "", isActive: true, categories: [], sortOrder: 0 };
    },
    openEditModal(state, action) {
      state.modalOpen = true;
      state.current = action.payload;
      state.form = {
        name: action.payload?.name || "",
        slug: action.payload?.slug || "",
        icon: action.payload?.icon || "",
        isActive: action.payload?.isActive !== false,
        categories: Array.isArray(action.payload?.categories) ? action.payload.categories.map((c) => c._id || c.id || c) : [],
        sortOrder: Number(action.payload?.sortOrder) || 0,
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
      state.form = { name: "", slug: "", icon: "", isActive: true, categories: [], sortOrder: 0 };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAdminTabs.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(getAdminTabs.fulfilled, (state, action) => {
        state.status = "succeeded";
        const payload = action.payload || {};
        const items = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];
        state.items = items;
      })
      .addCase(getAdminTabs.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(createTabCategory.fulfilled, (state, action) => {
        const created = action.payload?.data || action.payload;
        if (created) state.items.push(created);
        state.modalOpen = false;
      })
      .addCase(updateTabCategory.fulfilled, (state, action) => {
        const updated = action.payload?.data || action.payload;
        const idx = state.items.findIndex((t) => (t.id || t._id) === (updated?.id || updated?._id));
        if (idx >= 0) state.items[idx] = updated;
        state.modalOpen = false;
        state.current = null;
      })
      .addCase(deleteTabCategory.fulfilled, (state, action) => {
        const id = action.payload?.id;
        state.items = state.items.filter((t) => (t.id || t._id) !== id);
      });
  },
});

export const { openCreateModal, openEditModal, closeModal, setFormField, resetForm } = slice.actions;
export default slice.reducer;
