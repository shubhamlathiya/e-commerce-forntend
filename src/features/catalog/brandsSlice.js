import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../../api/client";

const API_URL = "/api/catalog/brands";

// Thunks
export const getAllBrands = createAsyncThunk(
  "brands/getAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10, search, status } = params || {};
      const { data } = await apiClient.get(API_URL, {
        params: { page, limit, search, status },
      });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const createBrand = createAsyncThunk(
  "brands/create",
  async (payload, { rejectWithValue }) => {
    try {
      const body = {
        name: payload?.name,
        slug: payload?.slug,
        logo: payload?.logo,
        description: payload?.description,
        website: payload?.website,
        status:
          typeof payload?.status === "string"
            ? payload.status === "active"
            : !!payload?.status,
        isFeatured:
          typeof payload?.isFeatured === "string"
            ? payload.isFeatured === "true"
            : !!payload?.isFeatured,
      };
      const { data } = await apiClient.post(API_URL, body , {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const getBrandById = createAsyncThunk(
  "brands/getById",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get(`${API_URL}/${id}`);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const updateBrand = createAsyncThunk(
  "brands/update",
  async ({ id, data: body }, { rejectWithValue }) => {
    try {
      const patchBody = {
        ...(body?.name !== undefined ? { name: body.name } : {}),
        ...(body?.slug !== undefined ? { slug: body.slug } : {}),
        ...(body?.logo !== undefined ? { logo: body.logo } : {}),
        ...(body?.description !== undefined ? { description: body.description } : {}),
        ...(body?.website !== undefined ? { website: body.website } : {}),
        ...(body?.status !== undefined
          ? {
              status:
                typeof body.status === "string"
                  ? body.status === "active"
                  : !!body.status,
            }
          : {}),
        ...(body?.isFeatured !== undefined
          ? {
              isFeatured:
                typeof body.isFeatured === "string"
                  ? body.isFeatured === "true"
                  : !!body.isFeatured,
            }
          : {}),
      };
      const { data } = await apiClient.patch(`${API_URL}/${id}`, patchBody);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const deleteBrand = createAsyncThunk(
  "brands/delete",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`${API_URL}/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const initialState = {
  items: [],
  current: null,
  form: {
    name: "",
    slug: "",
    logo: "",
    description: "",
    website: "",
    status: "active",
    isFeatured: false,
  },
  modalOpen: false,
  status: "idle",
  error: null,
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
};

const brandsSlice = createSlice({
  name: "brands",
  initialState,
  reducers: {
    openCreateModal(state) {
      state.modalOpen = true;
      state.current = null;
      state.form = {
        name: "",
        slug: "",
        logo: "",
        description: "",
        website: "",
        status: "active",
        isFeatured: false,
      };
    },
    openEditModal(state, action) {
      state.modalOpen = true;
      state.current = action.payload;
      state.form = {
        name: action.payload?.name || "",
        slug: action.payload?.slug || "",
        logo: action.payload?.logo || "",
        description: action.payload?.description || "",
        website: action.payload?.website || "",
        status: action.payload?.status || "inactive",
        isFeatured: !!action.payload?.isFeatured,
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
      state.form = {
        name: "",
        slug: "",
        logo: "",
        description: "",
        website: "",
        status: "active",
        isFeatured: false,
      };
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
      // getAllBrands
      .addCase(getAllBrands.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(getAllBrands.fulfilled, (state, action) => {
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
        const totalPages =
          payload?.totalPages ?? payload?.meta?.totalPages ?? Math.max(1, Math.ceil(total / (limit || 1)));
        state.page = page;
        state.limit = limit;
        state.total = total;
        state.totalPages = totalPages;
      })
      .addCase(getAllBrands.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      // createBrand
      .addCase(createBrand.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(createBrand.fulfilled, (state, action) => {
        state.status = "succeeded";
        const created = action.payload?.data || action.payload;
        if (created) state.items.push(created);
        state.modalOpen = false;
      })
      .addCase(createBrand.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      // getBrandById
      .addCase(getBrandById.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(getBrandById.fulfilled, (state, action) => {
        state.status = "succeeded";
        const brand = action.payload?.data || action.payload;
        state.current = brand;
      })
      .addCase(getBrandById.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      // updateBrand
      .addCase(updateBrand.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(updateBrand.fulfilled, (state, action) => {
        state.status = "succeeded";
        const updated = action.payload?.data || action.payload;
        const idx = state.items.findIndex((t) => (t.id || t._id) === (updated?.id || updated?._id));
        if (idx >= 0) state.items[idx] = updated;
        state.modalOpen = false;
        state.current = null;
      })
      .addCase(updateBrand.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      // deleteBrand
      .addCase(deleteBrand.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(deleteBrand.fulfilled, (state, action) => {
        state.status = "succeeded";
        const id = action.payload;
        state.items = state.items.filter((t) => (t.id || t._id) !== id);
      })
      .addCase(deleteBrand.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      });
  },
});

export const { openCreateModal, openEditModal, closeModal, setFormField, resetForm, setPage, setLimit } =
  brandsSlice.actions;
export default brandsSlice.reducer;

