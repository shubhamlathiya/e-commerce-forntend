import React, { useEffect, useMemo, useState } from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import TableDataLayer from "../../components/TableDataLayer";
import { ToastContainer, toast } from "react-toastify";
import Swal from "sweetalert2";
import variantsApi from "../../api/variantsApi";
import {getProducts} from "../../features/catalog/productsSlice";


const ProductVariantsPage = () => {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    id: undefined,
    productId: "",
    sku: "",
    attributes: [{ name: "", value: "" }],
    price: "",
    compareAtPrice: "",
    stock: "",
    barcode: "",
    status: true,
  });

  // Products for searchable dropdown
  const [products, setProducts] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const filteredProductOptions = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return productOptions;
    return productOptions.filter((opt) => String(opt.label).toLowerCase().includes(q));
  }, [productOptions, productSearch]);

  // Helper: resolve product name from id
  const getProductNameById = (id) => {
    if (!id) return "";
    const opt = productOptions.find((o) => String(o.value) === String(id));
    return opt?.label || String(id);
  };

  // Helper: simple MongoId format check
  const isMongoId = (v) => typeof v === "string" && /^[a-fA-F0-9]{24}$/.test(v);

  const resetForm = () => setForm({
    id: undefined,
    productId: "",
    sku: "",
    attributes: [{ name: "", value: "" }],
    price: "",
    compareAtPrice: "",
    stock: "",
    barcode: "",
    status: true,
  });

  const loadVariants = async () => {
    try {
      setLoading(true);
      const data = await variantsApi.listVariants({ page: 1, limit: 50 });
      const items = Array.isArray(data) ? data : data?.items || data?.data || data?.results || [];
      setVariants(items);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load variants");
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await getProducts({ page: 1, limit: 100 });
      const items = Array.isArray(data) ? data : data?.items || data?.data || data?.results || [];
      setProducts(items);
      setProductOptions((items || []).map((p) => ({
        value: p.id || p._id,
        label: p.title || p.name || p.slug || String(p.id || p._id),
      })));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load products");
    }
  };

  useEffect(() => {
    loadVariants();
    loadProducts();
  }, []);

  const onAddAttributeRow = () => {
    setForm((prev) => ({ ...prev, attributes: [...(prev.attributes || []), { name: "", value: "" }] }));
  };

  const onRemoveAttributeRow = (idx) => {
    setForm((prev) => ({ ...prev, attributes: (prev.attributes || []).filter((_, i) => i !== idx) }));
  };

  const onChangeAttribute = (idx, key, value) => {
    setForm((prev) => ({
      ...prev,
      attributes: (prev.attributes || []).map((attr, i) => (i === idx ? { ...attr, [key]: value } : attr)),
    }));
  };

  const createPayload = useMemo(() => ({
    productId: form.productId,
    sku: form.sku,
    attributes: (form.attributes || []).filter(a => a.name && a.value),
    price: Number(form.price || 0),
    compareAtPrice: form.compareAtPrice !== "" ? Number(form.compareAtPrice) : undefined,
    stock: form.stock !== "" ? Number(form.stock) : undefined,
    barcode: form.barcode || undefined,
    status: !!form.status,
  }), [form]);

  const updatePayload = useMemo(() => ({
    sku: form.sku,
    attributes: (form.attributes || []).filter(a => a.name && a.value),
    price: Number(form.price || 0),
    compareAtPrice: form.compareAtPrice !== "" ? Number(form.compareAtPrice) : undefined,
    stock: form.stock !== "" ? Number(form.stock) : undefined,
    barcode: form.barcode || undefined,
    status: !!form.status,
  }), [form]);

  const validateVariantPayload = (payload, isUpdate = false) => {
    if (!isUpdate) {
      if (!payload.productId || !isMongoId(payload.productId)) return "Select a valid product";
    }
    if (!payload.sku || String(payload.sku).trim() === "") return "SKU is required";
    if (isNaN(payload.price) || payload.price <= 0) return "Price must be greater than 0";
    if (payload.compareAtPrice !== undefined) {
      if (isNaN(payload.compareAtPrice) || payload.compareAtPrice <= 0) return "Compare At Price must be greater than 0";
    }
    if (payload.stock !== undefined) {
      if (!Number.isInteger(payload.stock) || payload.stock < 0) return "Stock must be an integer ≥ 0";
    }
    if (payload.barcode !== undefined && typeof payload.barcode !== "string") return "Barcode must be a string";
    if (payload.status !== undefined && typeof payload.status !== "boolean") return "Status must be boolean";
    if (payload.attributes !== undefined && !Array.isArray(payload.attributes)) return "Attributes must be an array";
    return null;
  };

  const submitVariant = async (e) => {
    e.preventDefault();
    try {
      if (form.id) {
        const errMsg = validateVariantPayload(updatePayload, true);
        if (errMsg) { toast.error(errMsg); return; }

        await variantsApi.updateVariant(form.id, updatePayload);
        toast.success("Variant updated");
      } else {
        const errMsg = validateVariantPayload(createPayload, false);
        if (errMsg) { toast.error(errMsg); return; }

        await variantsApi.createVariant(createPayload);
        toast.success("Variant created");
      }
      setShowModal(false);
      resetForm();
      loadVariants();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save variant");
    }
  };

  const confirmAndDelete = async (row) => {
    const res = await Swal.fire({
      title: "Delete variant?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      customClass: {
        title: "text-sm",
        popup: "p-2",
        confirmButton: "btn-sm",
        cancelButton: "btn-sm",
      },
    });
    if (!res.isConfirmed) return;
    try {
      await variantsApi.deleteVariant(row.id);
      toast.success("Variant deleted");
      loadVariants();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete variant");
    }
  };

  const headers = [
    "SKU",
    "Product Name",
    "Attributes",
    "Price",
    "Compare At Price",
    "Stock",
    "Barcode",
    "Status",
  ];

  const rows = (variants || []).map((v) => ({
    sku: v.sku,
    productname: getProductNameById(v.productId),
    attributes: Array.isArray(v.attributes) ? v.attributes.map(a => `${a.name}: ${a.value}`).join(", ") : "",
    price: v.price,
    compareatprice: v.compareAtPrice,
    stock: v.stock,
    barcode: v.barcode,
    status: v.status ? "Active" : "Inactive",
    // raw
    id: v.id || v._id,
    productId: v.productId,
    rawAttributes: v.attributes,
  }));

  const onEditRow = (row) => {
    setForm({
      id: row.id,
      productId: row.productId,
      sku: row.sku,
      attributes: Array.isArray(row.rawAttributes) && row.rawAttributes.length > 0 ? row.rawAttributes : [{ name: "", value: "" }],
      price: row.price,
      compareAtPrice: row.compareatprice ?? "",
      stock: row.stock ?? "",
      barcode: row.barcode || "",
      status: row.status === "Active",
    });
    setShowModal(true);
  };

  return (
    <MasterLayout>
      <div className="container-fluid">
        <Breadcrumb title="Product Variants Management" />

        <div className="card mb-24">
          <div className="card-header d-flex align-items-center justify-content-between">
            <h6 className="mb-0">Variants</h6>
            <button className="btn btn-primary-600" onClick={() => { resetForm(); setShowModal(true); }}>
              Add Variant
            </button>
          </div>
          <div className="card-body">
            {loading ? (
              <div>Loading...</div>
            ) : (
              <TableDataLayer
                headers={headers}
                data={rows}
                onView={(row) => Swal.fire({ title: "Variant", html: `<pre style='text-align:left'>${JSON.stringify(row, null, 2)}</pre>` })}
                onEdit={onEditRow}
                onDelete={confirmAndDelete}
              />
            )}
          </div>
        </div>

        {showModal && (
          <div className="modal d-block" tabIndex={-1}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h6 className="modal-title">{form.id ? "Edit" : "Add"} Variant</h6>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <form onSubmit={submitVariant}>
                  <div className="modal-body">
                    <div className="row g-3">
                      <div className="col-md-12">
                        <label className="form-label">Product</label>
                        <div className="d-flex gap-8">
                          <input
                            className="form-control"
                            placeholder="Search product…"
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            style={{ maxWidth: 280 }}
                          />
                          <select
                            className="form-select"
                            value={form.productId}
                            onChange={(e) => setForm({ ...form, productId: e.target.value })}
                            required={!form.id}
                            disabled={!!form.id}
                          >
                            <option value="">Select product</option>
                            {filteredProductOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                        {form.id && (
                          <small className="text-neutral-500">Product cannot be changed during variant update.</small>
                        )}
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">SKU</label>
                        <input className="form-control" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Barcode</label>
                        <input className="form-control" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Price</label>
                        <input type="number" step="0.01" min="0.01" className="form-control" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Compare At Price</label>
                        <input type="number" step="0.01" min="0.01" className="form-control" value={form.compareAtPrice} onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Stock</label>
                        <input type="number" min="0" step="1" className="form-control" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                      </div>

                      <div className="col-md-12">
                        <label className="form-label">Status</label>
                        <div className="form-check">
                          <input className="form-check-input" type="checkbox" id="variantStatus" checked={form.status} onChange={(e) => setForm({ ...form, status: e.target.checked })} />
                          <label className="form-check-label" htmlFor="variantStatus">Active</label>
                        </div>
                      </div>

                      <div className="col-md-12">
                        <label className="form-label">Attributes</label>
                        {(form.attributes || []).map((attr, idx) => (
                          <div className="d-flex gap-8 mb-8" key={idx}>
                            <input
                              className="form-control"
                              placeholder="Name (e.g., Color)"
                              value={attr.name}
                              onChange={(e) => onChangeAttribute(idx, "name", e.target.value)}
                              style={{ maxWidth: 240 }}
                            />
                            <input
                              className="form-control"
                              placeholder="Value (e.g., Black)"
                              value={attr.value}
                              onChange={(e) => onChangeAttribute(idx, "value", e.target.value)}
                              style={{ maxWidth: 240 }}
                            />
                            <button type="button" className="btn btn-neutral-400" onClick={() => onRemoveAttributeRow(idx)}>Remove</button>
                          </div>
                        ))}
                        <button type="button" className="btn btn-primary-600" onClick={onAddAttributeRow}>Add Attribute</button>
                      </div>

                      <div className="col-md-12">
                        <label className="form-label">JSON Preview</label>
                        <pre className="bg-neutral-50 p-12 radius-8" style={{ maxHeight: 240, overflow: "auto" }}>{JSON.stringify(form.id ? updatePayload : createPayload, null, 2)}</pre>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-neutral-400" onClick={() => setShowModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary-600">Save</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <ToastContainer position="top-right" autoClose={2000} />
      </div>
    </MasterLayout>
  );
};

export default ProductVariantsPage;
