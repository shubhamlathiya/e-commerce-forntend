import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { toast } from "react-hot-toast";
import {
  listComboOffers,
  createComboOffer,
  updateComboOffer,
  deleteComboOffer,
} from "../../api/comboApi";

const initialState = {
  items: [],
  page: 1,
  limit: 20,
  total: 0,
  statusFilter: "all", // all | active | inactive
  loading: false,
  error: null,
};

export const getAllComboOffers = createAsyncThunk(
  "combo/getAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const data = await listComboOffers(params);

      return data;
    } catch (err) {
      const msg = err?.response?.data?.message || err.message;
      return rejectWithValue(msg);
    }
  }
);

export const createCombo = createAsyncThunk(
  "combo/create",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await createComboOffer(payload);
      toast.success("Combo offer created");
      return data;
    } catch (err) {
      const msg = err?.response?.data?.message || err.message;
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const updateCombo = createAsyncThunk(
  "combo/update",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const data = await updateComboOffer(id, payload);
      toast.success("Combo offer updated");
      return data;
    } catch (err) {
      const msg = err?.response?.data?.message || err.message;
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const deleteCombo = createAsyncThunk(
  "combo/delete",
  async (id, { rejectWithValue }) => {
    try {
      const data = await deleteComboOffer(id);
      toast.success("Combo offer deleted");
      return { id, data };
    } catch (err) {
      const msg = err?.response?.data?.message || err.message;
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

const comboSlice = createSlice({
  name: "combo",
  initialState,
  reducers: {
    setStatusFilter: (state, action) => {
      state.statusFilter = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllComboOffers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllComboOffers.fulfilled, (state, action) => {
        state.loading = false;
        const { items = [], page = 1, limit = 20, total = items.length } = action.payload || {};
        state.items = items;
        state.page = page;
        state.limit = limit;
        state.total = total;
      })
      .addCase(getAllComboOffers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch Combo offers";
      })
      .addCase(createCombo.fulfilled, (state, action) => {
        const newItem = action.payload?.item || action.payload;
        if (newItem) state.items.unshift(newItem);
      })
      .addCase(updateCombo.fulfilled, (state, action) => {
        const updated = action.payload?.item || action.payload;
        if (!updated?._id) return;
        state.items = state.items.map((it) => (it._id === updated._id ? updated : it));
      })
      .addCase(deleteCombo.fulfilled, (state, action) => {
        const { id } = action.payload || {};
        if (!id) return;
        state.items = state.items.filter((it) => it._id !== id);
      });
  },
});

export const { setStatusFilter } = comboSlice.actions;

export default comboSlice.reducer;

