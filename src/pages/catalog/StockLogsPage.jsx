import React, {useEffect, useMemo, useState} from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import TableDataLayer from "../../components/TableDataLayer";
import {ToastContainer, toast} from "react-toastify";
import Swal from "sweetalert2";
import stockApi from "../../api/stockApi";
import variantsApi from "../../api/variantsApi";
import ProductApi from "../../api/productApi";
import Select from "react-select";


const StockLogsPage = () => {
    // table state
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    // modal state
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        productId: "",
        variantId: "",
        type: "in",
        quantity: "",
        source: "manual",
        note: "",
    });

    // products and variants dropdowns
    const [products, setProducts] = useState([]);
    const [productOptions, setProductOptions] = useState([]);
    const [productSearch, setProductSearch] = useState("");
    const filteredProductOptions = useMemo(() => {
        const q = productSearch.trim().toLowerCase();
        if (!q) return productOptions;
        return productOptions.filter((opt) => String(opt.label).toLowerCase().includes(q));
    }, [productOptions, productSearch]);

    const [variantOptions, setVariantOptions] = useState([]);
    const [loadingVariants, setLoadingVariants] = useState(false);

    // Helper: resolve product name by id
    const getProductNameById = (id) => {
        if (!id) return "";
        const opt = productOptions.find((o) => String(o.value) === String(id));
        // Do not fallback to raw ID in UI
        return opt?.label || "-";
    };

    // Helper: simple MongoId check
    const isMongoId = (v) => typeof v === "string" && /^[a-fA-F0-9]{24}$/.test(v);

    const resetForm = () => setForm({
        productId: "",
        variantId: "",
        type: "in",
        quantity: "",
        source: "manual",
        note: "",
    });

    const loadLogs = async (p = page) => {
        try {
            setLoading(true);
            const data = await stockApi.listStockLogs({page: p, limit});
            const items = Array.isArray(data) ? data : data?.items || data?.data || data?.results || [];
            setLogs(items);
            const tp = data?.totalPages || (data?.total ? Math.ceil(data.total / limit) : 1);
            setTotalPages(tp || 1);
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to load stock logs");
        } finally {
            setLoading(false);
        }
    };

    const loadProducts = async () => {
        try {
            const {data} = await ProductApi.getProducts({page: 1, limit: 100});
            const items = Array.isArray(data) ? data : data?.items || data?.data || data?.results || [];
            setProducts(items);
            setProductOptions((items || []).map((p) => ({
                value: p.id || p._id,
                label: p.title || p.name || p.slug || String(p.id || p._id),
                thumb:
                    p.thumbnailUrl ||
                    p.thumbnail ||
                    p.thumb ||
                    p.thumbnailPath ||
                    p.image ||
                    (Array.isArray(p.images) && p.images[0]) ||
                    "",
            })));
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to load products");
        }
    };

    const loadVariantsForProduct = async (productId) => {
        if (!productId) {
            setVariantOptions([]);
            return;
        }
        try {
            setLoadingVariants(true);
            const data = await variantsApi.listVariants({page: 1, limit: 200, productId});
            const items = Array.isArray(data) ? data : data?.items || data?.data || data?.results || [];
            const options = (items || []).map((v) => ({
                value: v.id || v._id || v.variantId || v.sku || String(v.id || v._id || v.variantId || v.sku),
                label: v.title || v.name || v.sku || String(v.id || v._id),
            }));
            setVariantOptions(options);
        } catch (err) {
            setVariantOptions([]);
            toast.error(err?.response?.data?.message || "Failed to load variants");
        } finally {
            setLoadingVariants(false);
        }
    };

    useEffect(() => {
        loadLogs(1);
        loadProducts();
    }, []);

    const payload = useMemo(() => ({
        productId: form.productId,
        variantId: form.variantId || undefined,
        type: form.type,
        quantity: Number(form.quantity || 0),
        source: form.source || "manual",
        note: form.note || undefined,
    }), [form]);

    const validateStockPayload = (p) => {
        if (!p.productId || !isMongoId(p.productId)) return "Select a valid product";
        if (p.variantId !== undefined && p.variantId !== "" && !isMongoId(p.variantId)) return "Select a valid variant";
        if (!["in", "out"].includes(p.type)) return "Type must be 'in' or 'out'";
        if (!Number.isInteger(p.quantity) || p.quantity < 1) return "Quantity must be an integer ≥ 1";
        if (!["manual", "order", "return"].includes(p.source)) return "Source must be manual, order, or return";
        if (p.note !== undefined && typeof p.note !== "string") return "Note must be a string";
        return null;
    };

    const submitStockLog = async (e) => {
        e.preventDefault();
        try {
            const errMsg = validateStockPayload(payload);
            if (errMsg) {
                toast.error(errMsg);
                return;
            }

            await stockApi.createStockLog(payload);
            toast.success("Stock entry created");
            setShowModal(false);
            resetForm();
            loadLogs(page);
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to create stock entry");
        }
    };

    const headers = [
        "#",
        "Product Name",
        "Variant",
        "Type",
        "Quantity",
        "Source",
        "Date",
    ];

    const rows = (logs || []).map((log, index) => {
        // Product name: prefer resolved names, never show raw IDs
        const productName = (
            log.productName ||
            log.product?.title ||
            getProductNameById(log.productId) ||
            "-"
        );

        // Variant: show SKU or name if available, otherwise '-'
        const variantLabel = (
            log.variant?.sku ||
            log.variant?.name ||
            "-"
        );

        // Type badge: In Stock / Out Stock with bootstrap badges
        let typeBadge = "<span class='badge bg-light text-dark'>-</span>";
        if (log.type === "in") {
            typeBadge = "<span class='badge bg-success'>In Stock</span>";
        } else if (log.type === "out") {
            typeBadge = "<span class='badge bg-danger'>Out Stock</span>";
        } else if (typeof log.type === "string" && log.type.trim()) {
            typeBadge = `<span class='badge bg-light text-dark'>${log.type}</span>`;
        }

        // Quantity: ensure clean numeric display, fallback to '-'
        const qty = Number.isFinite(Number(log.quantity)) ? Number(log.quantity) : "-";

        // Source badge (optional subtle styles)
        const sourceKey = (log.source || "").toString().trim().toLowerCase();
        const sourceClass = ({
            manual: "badge bg-secondary",
            order: "badge bg-primary",
            return: "badge bg-warning text-dark",
        }[sourceKey]) || "badge bg-light text-dark";
        const sourceText = sourceKey ? sourceKey.charAt(0).toUpperCase() + sourceKey.slice(1) : "-";
        const sourceBadge = `<span class='${sourceClass}'>${sourceText}</span>`;

        // Date formatting with null checks
        const dateVal = log.date || log.createdAt;
        const dateText = dateVal ? new Date(dateVal).toLocaleString() : "-";

        return {
            "#": (page - 1) * limit + index + 1,
            productname: productName || "-",
            variant: variantLabel,
            type: typeBadge,
            quantity: qty,
            source: sourceBadge,
            date: dateText,
            // keep raw for actions
            raw: log,
        };
    });

    const onViewRow = (row) => {
        Swal.fire({title: "Stock Log", html: `<pre style='text-align:left'>${JSON.stringify(row.raw, null, 2)}</pre>`});
    };

    const onEditRow = () => {
        toast.info("Stock logs are not editable");
    };

    const onDeleteRow = () => {
        toast.info("Deleting stock logs is not supported");
    };

    return (
        <MasterLayout>
            <div className="container-fluid">
                <Breadcrumb title="Catalog / Stock Logs"/>

                <div className="card mb-24">
                    <div className="card-header d-flex align-items-center justify-content-between">
                        <h6 className="mb-0">Stock Logs</h6>
                        <button className="btn btn-primary-600" onClick={() => {
                            resetForm();
                            setVariantOptions([]);
                            setShowModal(true);
                        }}>
                            Add Stock Entry
                        </button>
                    </div>
                    <div className="card-body">
                        {loading ? (
                            <div>Loading...</div>
                        ) : (
                            <TableDataLayer
                                headers={headers}
                                data={rows}
                                onView={onViewRow}
                                onEdit={onEditRow}
                                onDelete={onDeleteRow}
                            />
                        )}
                    </div>
                </div>

                {showModal && (
                    <>
                        <div
                            className="modal-backdrop fade show"

                        ></div>

                        <div
                            className="modal fade show d-block"
                            tabIndex="-1"
                            role="dialog"
                            style={{
                                zIndex: 1050,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: "rgba(0,0,0,0.5)",
                            }}
                        >
                            <div
                                className="modal-dialog modal-dialog-centered"
                                style={{
                                    maxWidth: "900px",
                                    width: "90%",
                                }}
                            >

                                <div className="modal-content">
                                    <div className="modal-header">
                                        <h6 className="modal-title">Add Stock Entry</h6>
                                        <button type="button" className="btn-close"
                                                onClick={() => setShowModal(false)}></button>
                                    </div>
                                    <form onSubmit={submitStockLog}>
                                        <div className="modal-body">
                                            <div className="row g-3">
                                                <div className="col-md-12">
                                                    <label className="form-label">Product</label>
                                                    <Select
                                                        classNamePrefix="select"
                                                        placeholder="Search and select a product"
                                                        isClearable
                                                        isSearchable
                                                        isLoading={false}
                                                        options={productOptions}
                                                        value={(productOptions || []).find((o) => String(o.value) === String(form.productId)) || null}
                                                        menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                                        menuPosition="fixed"
                                                        styles={{menuPortal: (base) => ({...base, zIndex: 2000})}}
                                                        onChange={(opt) => {
                                                            const pid = opt?.value || "";
                                                            setForm({...form, productId: pid, variantId: ""});
                                                            setVariantOptions([]);
                                                            if (pid) loadVariantsForProduct(pid);
                                                        }}
                                                        onMenuOpen={() => {
                                                            if ((products || []).length === 0) {
                                                                (async () => {
                                                                    try {
                                                                        const resp = await ProductApi.getProducts({
                                                                            page: 1,
                                                                            limit: 200
                                                                        });
                                                                        const arr = resp?.data?.items || resp?.data || resp || [];
                                                                        const mapped = (arr || []).map((p) => ({
                                                                            value: p.id || p._id,
                                                                            label: p.title || p.name || p.slug || String(p.id || p._id),
                                                                            thumb:
                                                                                p.thumbnailUrl ||
                                                                                p.thumbnail ||
                                                                                p.thumb ||
                                                                                p.thumbnailPath ||
                                                                                p.image ||
                                                                                (Array.isArray(p.images) && p.images[0]) ||
                                                                                "",
                                                                        }));
                                                                        setProducts(arr);
                                                                        setProductOptions(mapped);
                                                                    } catch (e) {
                                                                        console.error(e);
                                                                        toast.error("Failed to load products");
                                                                    }
                                                                })();
                                                            }
                                                        }}
                                                        onInputChange={(input) => setProductSearch(input)}
                                                        formatOptionLabel={(opt) => {
                                                            const imgBase = "http://localhost:8000";
                                                            const thumbUrl = opt.thumb
                                                                ? (String(opt.thumb).startsWith("http") ? opt.thumb : `${imgBase}${opt.thumb}`)
                                                                : "";
                                                            return (
                                                                <div className="d-flex align-items-center gap-8">
                                                                    {thumbUrl ? (
                                                                        <img src={thumbUrl} alt="thumb" style={{
                                                                            width: 24,
                                                                            height: 24,
                                                                            objectFit: "cover",
                                                                            borderRadius: 4
                                                                        }}/>
                                                                    ) : (
                                                                        <span className="badge bg-neutral-200"
                                                                              style={{width: 24, height: 24}}/>
                                                                    )}
                                                                    <span>{opt.label}</span>
                                                                </div>
                                                            );
                                                        }}
                                                    />
                                                </div>

                                                <div className="col-md-12">
                                                    <label className="form-label">Variant</label>
                                                    <select
                                                        className="form-select"
                                                        value={form.variantId}
                                                        onChange={(e) => setForm({...form, variantId: e.target.value})}
                                                        disabled={!form.productId || loadingVariants || variantOptions.length === 0}
                                                        required={variantOptions.length > 0}
                                                    >
                                                        <option value="">
                                                            {!form.productId
                                                                ? "Select product first"
                                                                : loadingVariants
                                                                    ? "Loading variants..."
                                                                    : variantOptions.length === 0
                                                                        ? "No variants"
                                                                        : "Select variant"}
                                                        </option>
                                                        {variantOptions.map((opt) => (
                                                            <option key={opt.value}
                                                                    value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="col-md-4">
                                                    <label className="form-label">Type</label>
                                                    <select className="form-select" value={form.type}
                                                            onChange={(e) => setForm({...form, type: e.target.value})}>
                                                        <option value="in">in</option>
                                                        <option value="out">out</option>
                                                    </select>
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label">Quantity</label>
                                                    <input type="number" min="1" step="1" className="form-control"
                                                           value={form.quantity} onChange={(e) => setForm({
                                                        ...form,
                                                        quantity: e.target.value
                                                    })} required/>
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label">Source</label>
                                                    <select className="form-select" value={form.source}
                                                            onChange={(e) => setForm({
                                                                ...form,
                                                                source: e.target.value
                                                            })}>
                                                        <option value="manual">manual</option>
                                                        <option value="order">order</option>
                                                        <option value="return">return</option>
                                                    </select>
                                                </div>

                                                <div className="col-md-12">
                                                    <label className="form-label">Note</label>
                                                    <textarea className="form-control" rows={3} value={form.note}
                                                              onChange={(e) => setForm({
                                                                  ...form,
                                                                  note: e.target.value
                                                              })}/>
                                                </div>

                                            </div>
                                        </div>
                                        <div className="modal-footer">
                                            <button type="button" className="btn btn-neutral-400"
                                                    onClick={() => setShowModal(false)}>Cancel
                                            </button>
                                            <button type="submit" className="btn btn-primary-600">Save</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                <ToastContainer position="top-right" autoClose={2000}/>
            </div>
        </MasterLayout>
    );
};

export default StockLogsPage;
