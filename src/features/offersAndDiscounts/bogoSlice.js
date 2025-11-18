import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { toast } from "react-hot-toast";
import {
  listBogoOffers,
  createBogoOffer,
  updateBogoOffer,
  deleteBogoOffer,
} from "../../api/bogoApi";

const initialState = {
  items: [],
  page: 1,
  limit: 20,
  total: 0,
  statusFilter: "all", // all | active | inactive
  activeOnly: false,
  loading: false,
  error: null,
};

export const getAllBogoOffers = createAsyncThunk(
  "bogo/getAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const data = await listBogoOffers(params);

      return data;
    } catch (err) {
      const msg = err?.response?.data?.message || err.message;
      return rejectWithValue(msg);
    }
  }
);

export const createBogo = createAsyncThunk(
  "bogo/create",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await createBogoOffer(payload);
      toast.success("BOGO offer created");
      return data;
    } catch (err) {
      const msg = err?.response?.data?.message || err.message;
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const updateBogo = createAsyncThunk(
  "bogo/update",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const data = await updateBogoOffer(id, payload);
      toast.success("BOGO offer updated");
      return data;
    } catch (err) {
      const msg = err?.response?.data?.message || err.message;
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const deleteBogo = createAsyncThunk(
  "bogo/delete",
  async (id, { rejectWithValue }) => {
    try {
      const data = await deleteBogoOffer(id);
      toast.success("BOGO offer deleted");
      return { id, data };
    } catch (err) {
      const msg = err?.response?.data?.message || err.message;
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

const bogoSlice = createSlice({
  name: "bogo",
  initialState,
  reducers: {
    setStatusFilter: (state, action) => {
      state.statusFilter = action.payload;
    },
    setActiveOnly: (state, action) => {
      state.activeOnly = action.payload;
    },
    setPage: (state, action) => {
      state.page = action.payload;
    },
    setLimit: (state, action) => {
      state.limit = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllBogoOffers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllBogoOffers.fulfilled, (state, action) => {
        state.loading = false;
        const { items = [], page = 1, limit = 20, total = items.length } = action.payload || {};
        state.items = items;
        state.page = page;
        state.limit = limit;
        state.total = total;
      })
      .addCase(getAllBogoOffers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch BOGO offers";
      })
      .addCase(createBogo.fulfilled, (state, action) => {
        const newItem = action.payload?.item || action.payload;
        if (newItem) state.items.unshift(newItem);
      })
      .addCase(updateBogo.fulfilled, (state, action) => {
        const updated = action.payload?.item || action.payload;
        if (!updated?._id) return;
        state.items = state.items.map((it) => (it._id === updated._id ? updated : it));
      })
      .addCase(deleteBogo.fulfilled, (state, action) => {
        const { id } = action.payload || {};
        if (!id) return;
        state.items = state.items.filter((it) => it._id !== id);
      });
  },
});

export const { setStatusFilter, setActiveOnly, setPage, setLimit } = bogoSlice.actions;

export default bogoSlice.reducer;

