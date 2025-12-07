import React, {useEffect, useMemo, useState} from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import TableDataLayer from "../../components/TableDataLayer";
import {ToastContainer, toast} from "react-toastify";
import Swal from "sweetalert2";
import pricingApi from "../../api/pricingApi";
import ProductApi from "../../api/productApi";
import productApi from "../../api/productApi";
import Select from "react-select";

const TabButton = ({active, onClick, children}) => (<button
    className={`btn btn-sm ${active ? "btn-primary-600 text-white" : "btn-neutral-400"}`}
    onClick={onClick}
    type="button"
>
    {children}
</button>);

const PricingPage = () => {
    const [activeTab, setActiveTab] = useState("product"); // product | tier | special

    // Product Pricing state
    const [productPricing, setProductPricing] = useState([]);
    const [loadingProduct, setLoadingProduct] = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);
    const [productForm, setProductForm] = useState({
        id: undefined,
        productId: "",
        variantId: "",
        basePrice: "",
        discountType: "percent",
        discountValue: "",
        currency: "USD",
        status: true,
    });

    const [productOptions, setProductOptions] = useState([]);
    const [variantOptions, setVariantOptions] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [loadingVariants, setLoadingVariants] = useState(false);

    // Helper: map productId -> product name/label
    const getProductNameById = (id) => {
        if (!id) return "";
        const opt = productOptions.find((o) => String(o.value) === String(id));
        return opt?.label || String(id);
    };

    // Tier Pricing state
    const [tierPricing, setTierPricing] = useState([]);
    const [loadingTier, setLoadingTier] = useState(false);
    const [showTierModal, setShowTierModal] = useState(false);
    const [tierForm, setTierForm] = useState({
        id: undefined, productId: "", variantId: "", minQty: "", maxQty: "", price: "",
    });

    // Special Pricing state
    const [specialPricing, setSpecialPricing] = useState([]);
    const [loadingSpecial, setLoadingSpecial] = useState(false);
    const [showSpecialModal, setShowSpecialModal] = useState(false);
    const [specialForm, setSpecialForm] = useState({
        id: undefined, productId: "", variantId: "", specialPrice: "", startDate: "", endDate: "", status: true,
    });

    // Fetch lists
    const loadProductPricing = async () => {
        try {
            setLoadingProduct(true);
            const data = await pricingApi.listProductPricing();
            setProductPricing(Array.isArray(data) ? data : data?.items || []);
        } catch (e) {
            toast.error(e?.response?.data?.message || "Failed to load product pricing");
        } finally {
            setLoadingProduct(false);
        }
    };

    const loadTierPricing = async () => {
        try {
            setLoadingTier(true);
            const data = await pricingApi.listTierPricing();
            setTierPricing(Array.isArray(data) ? data : data?.items || []);
        } catch (e) {
            toast.error(e?.response?.data?.message || "Failed to load tier pricing");
        } finally {
            setLoadingTier(false);
        }
    };

    const loadSpecialPricing = async () => {
        try {
            setLoadingSpecial(true);
            const data = await pricingApi.listSpecialPricing();
            setSpecialPricing(Array.isArray(data) ? data : data?.items || []);
        } catch (e) {
            toast.error(e?.response?.data?.message || "Failed to load special pricing");
        } finally {
            setLoadingSpecial(false);
        }
    };

    useEffect(() => {
        const loadAllData = async () => {
            try {


                // Load pricing datasets
                await Promise.all([loadProductPricing(), loadTierPricing(), loadSpecialPricing(),]);

                // Preload products for dropdowns
                setLoadingProducts(true);
                const response = await ProductApi.getProducts();

                const items = Array.isArray(response?.data) ? response.data : response?.data?.items || response?.data?.data || response?.data?.results || [];

                const productList = (items || []).map((p) => ({
                    value: p.id || p._id,
                    label: p.title || p.name || p.slug || String(p.id || p._id),
                    image: p.image || p.thumbnail || null,
                }));

                setProductOptions(productList);
            } catch (err) {
                console.error("Error loading data:", err);
                toast.error(err?.response?.data?.message || "Failed to load products");
            } finally {
                setLoadingProducts(false);
            }
        };

        loadAllData();
    }, []);


    // Load variants for a selected product
    const loadVariantsForProduct = async (productId) => {
        if (!productId) {
            setVariantOptions([]);
            return;
        }
        try {
            setLoadingVariants(true);
            const detail = await productApi.getProduct(productId);
            const variants = detail?.variants || detail?.data?.variants || [];
            const options = (variants || []).map((v) => ({
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

    // Helpers
    const resetProductForm = () => setProductForm({
        id: undefined,
        productId: "",
        variantId: "",
        basePrice: "",
        discountType: "percent",
        discountValue: "",
        currency: "USD",
        status: true,
    });

    const resetTierForm = () => setTierForm({
        id: undefined, productId: "", variantId: "", minQty: "", maxQty: "", price: "",
    });

    const resetSpecialForm = () => setSpecialForm({
        id: undefined, productId: "", variantId: "", specialPrice: "", startDate: "", endDate: "", status: true,
    });

    // JSON previews
    const productJsonPreview = useMemo(() => ({
        productId: productForm.productId,
        variantId: productForm.variantId ? productForm.variantId : undefined,
        basePrice: Number(productForm.basePrice || 0),
        discountType: productForm.discountType,
        discountValue: Number(productForm.discountValue || 0),
        currency: productForm.currency,
        status: !!productForm.status,
    }), [productForm]);

    const tierJsonPreview = useMemo(() => ({
        productId: tierForm.productId,
        variantId: tierForm.variantId ? tierForm.variantId : undefined,
        minQty: Number(tierForm.minQty || 0),
        maxQty: Number(tierForm.maxQty || 0),
        price: Number(tierForm.price || 0),
    }), [tierForm]);

    const specialJsonPreview = useMemo(() => ({
        productId: specialForm.productId,
        variantId: specialForm.variantId ? specialForm.variantId : undefined,
        specialPrice: Number(specialForm.specialPrice || 0),
        startDate: specialForm.startDate || undefined,
        endDate: specialForm.endDate || undefined,
        status: !!specialForm.status,
    }), [specialForm]);

    // Submit handlers
    const submitProductPricing = async (e) => {
        e.preventDefault();
        try {
            await pricingApi.upsertProductPricing(productJsonPreview);
            toast.success("Product pricing saved");
            setShowProductModal(false);
            resetProductForm();
            loadProductPricing();
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to save product pricing");
        }
    };

    const submitTierPricing = async (e) => {
        e.preventDefault();
        try {
            await pricingApi.createTierPricing(tierJsonPreview);
            toast.success("Tier pricing saved");
            setShowTierModal(false);
            resetTierForm();
            loadTierPricing();
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to save tier pricing");
        }
    };

    const submitSpecialPricing = async (e) => {
        e.preventDefault();
        try {
            await pricingApi.createSpecialPricing(specialJsonPreview);
            toast.success("Special pricing saved");
            setShowSpecialModal(false);
            resetSpecialForm();
            loadSpecialPricing();
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to save special pricing");
        }
    };

    // Delete handlers with confirmation
    const confirmAndDeleteProductPricing = async (row) => {
        const res = await Swal.fire({
            title: "Delete product pricing?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Delete",
            customClass: {
                title: "text-md fw-semibold",
                htmlContainer: "text-sm",
                confirmButton: "btn btn-sm btn-danger",
                cancelButton: "btn btn-sm btn-light",
                popup: "p-3 rounded-3",
            },
        });
        if (!res.isConfirmed) return;
        try {
            const identifier = row.id ? {id: row.id} : {productId: row.productId, variantId: row.variantId};
            await pricingApi.deleteProductPricing(identifier);
            toast.success("Deleted product pricing");
            loadProductPricing();
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to delete product pricing");
        }
    };

    const confirmAndDeleteTierPricing = async (row) => {
        const res = await Swal.fire({
            title: "Delete tier pricing?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Delete",
            customClass: {
                title: "text-md fw-semibold",
                htmlContainer: "text-sm",
                confirmButton: "btn btn-sm btn-danger",
                cancelButton: "btn btn-sm btn-light",
                popup: "p-3 rounded-3",
            },
        });
        if (!res.isConfirmed) return;
        try {
            await pricingApi.deleteTierPricing(row.id);
            toast.success("Deleted tier pricing");
            loadTierPricing();
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to delete tier pricing");
        }
    };

    const confirmAndDeleteSpecialPricing = async (row) => {
        const res = await Swal.fire({
            title: "Delete special pricing?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Delete",
            customClass: {
                title: "text-md fw-semibold",
                htmlContainer: "text-sm",
                confirmButton: "btn btn-sm btn-danger",
                cancelButton: "btn btn-sm btn-light",
                popup: "p-3 rounded-3",
            },
        });
        if (!res.isConfirmed) return;
        try {

            await pricingApi.deleteSpecialPricing(row.productId);
            toast.success("Deleted special pricing");
            loadSpecialPricing();
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to delete special pricing");
        }
    };

    // Resolve effective price inline action
    const resolveRowPrice = async (row) => {
        try {
            const data = await pricingApi.resolvePrice({productId: row.productId, variantId: row.variantId});
            Swal.fire({
                title: "Effective Price",
                html: `<pre style="text-align:left">${JSON.stringify(data, null, 2)}</pre>`,
                width: 600,
            });
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to resolve price");
        }
    };

    // Table headers and rows mapping
    const productHeaders = ["#", "Product Name", "Variant", "Base Price", "Discount", "Currency", "Status"];

    const productRows = (productPricing || []).map((p, idx) => {
        const statusBadge = p.status ? `<span class='bg-success-focus text-success-main px-24 py-4 rounded-pill fw-medium text-sm'>Active</span>` : `<span class='bg-warning-focus text-warning-main px-24 py-4 rounded-pill fw-medium text-sm'>Inactive</span>`;

        return {
            "#": idx + 1,
            id: p.id || p._id || `${p.productId}-${p.variantId}`,
            productname: getProductNameById(p.productId),
            variant: p.variantId || "-",
            baseprice: p.basePrice,
            discount: p.discountType ? `${p.discountType}:${p.discountValue}` : "",
            currency: p.currency || "-",
            status: statusBadge, // will render "Active" or "Inactive" with color
            // keep raw for actions
            productId: p.productId,
            variantId: p.variantId,
        };
    });

    const tierHeaders = ["#", "Product Name", "Variant", "Min Qty", "Max Qty", "Price"];
    const tierRows = (tierPricing || []).map((t, idx) => ({
        "#": idx + 1,
        id: t.id || t._id,
        productname: getProductNameById(t.productId),
        variant: t.variantId || "-",
        minqty: t.minQty,
        maxqty: t.maxQty,
        price: t.price,
        productId: t.productId,
        variantId: t.variantId,
    }));

    const specialHeaders = ["#", "Product Name", "Variant", "Special Price", "Start", "End", "Status"];
    const specialRows = (specialPricing || []).map((s, idx) => {
        const statusText = (s.status === 'active' || s.status === true) ? 'Active' : 'Inactive';

        const statusBadge = statusText === 'Active' ? `<span
                class="bg-success-focus text-success-main px-24 py-4 rounded-pill fw-medium text-sm">Active</span>` :
            <span
                class="bg-danger-focus text-danger-main px-24 py-4 rounded-pill fw-medium text-sm">Inactive</span>;

        return {
            "#": idx + 1,
            productname: getProductNameById(s.productId),
            variant: s.variantId || "-",
            specialprice: s.specialPrice,
            start: s.startDate ? new Date(s.startDate).toLocaleString() : "-",
            end: s.endDate ? new Date(s.endDate).toLocaleString() : "-",
            status: statusBadge,
            productId: s._id,
            variantId: s.variantId,
        };
    });

    // Edit handlers to prefill forms
    const onEditProductRow = (row) => {
        setProductForm({
            id: row.id,
            productId: row.productId || row.product,
            variantId: row.variantId || row.variant,
            basePrice: row.baseprice,
            discountType: String(row.discount || "").split(":")[0] || "percent",
            discountValue: String(row.discount || "").split(":")[1] || "",
            currency: row.currency || "USD",
            status: row.status === "Active",
        });
        loadVariantsForProduct(row.productId || row.product);
        setShowProductModal(true);
    };

    const onEditTierRow = (row) => {
        setTierForm({
            id: row.id,
            productId: row.productId || row.product,
            variantId: row.variantId || row.variant,
            minQty: row.minqty,
            maxQty: row.maxqty,
            price: row.price,
        });
        loadVariantsForProduct(row.productId || row.product);
        setShowTierModal(true);
    };

    const onEditSpecialRow = (row) => {
        // Convert displayed local time back to ISO if possible; fall back to empty
        setSpecialForm({
            id: row.id,
            productId: row.productId || row.product,
            variantId: row.variantId || row.variant,
            specialPrice: row.specialprice,
            startDate: "",
            endDate: "",
            status: row.status === "Active",
        });
        loadVariantsForProduct(row.productId || row.product);
        setShowSpecialModal(true);
    };

    // Render
    return (<MasterLayout>
        <div className="container-fluid">
            <Breadcrumb title="Pricing Management"/>

            {/* Tabs */}
            <div className="d-flex align-items-center gap-8 mb-16">
                <TabButton active={activeTab === "product"} onClick={() => setActiveTab("product")}>Product
                    Pricing</TabButton>
                <TabButton active={activeTab === "tier"} onClick={() => setActiveTab("tier")}>Tier
                    Pricing</TabButton>
                <TabButton active={activeTab === "special"} onClick={() => setActiveTab("special")}>Special
                    Pricing</TabButton>
            </div>

            {/* Product Pricing Section */}
            {activeTab === "product" && (<div className="card mb-24">
                <div className="card-header d-flex align-items-center justify-content-between">
                    <h6 className="mb-0">Product Pricing</h6>
                    <div className="d-flex gap-8">
                        <button className="btn btn-primary-600" onClick={() => {
                            resetProductForm();
                            setVariantOptions([]);
                            setShowProductModal(true);
                        }}>Add New
                        </button>
                    </div>
                </div>
                <div className="card-body">
                    {loadingProduct ? (<div>Loading...</div>) : (<TableDataLayer
                        headers={productHeaders}
                        data={productRows}
                        onView={(row) => resolveRowPrice(row)}
                        onEdit={(row) => onEditProductRow(row)}
                        onDelete={(row) => confirmAndDeleteProductPricing(row)}
                    />)}
                </div>
            </div>)}

            {/* Tier Pricing Section */}
            {activeTab === "tier" && (<div className="card mb-24">
                <div className="card-header d-flex align-items-center justify-content-between">
                    <h6 className="mb-0">Tier Pricing</h6>
                    <button className="btn btn-primary-600" onClick={() => {
                        resetTierForm();
                        setVariantOptions([]);
                        setShowTierModal(true);
                    }}>Add New
                    </button>
                </div>
                <div className="card-body">
                    {loadingTier ? (<div>Loading...</div>) : (<TableDataLayer
                        headers={tierHeaders}
                        data={tierRows}
                        onView={(row) => Swal.fire({
                            title: "Tier", html: `<pre style='text-align:left'>${JSON.stringify(row, null, 2)}</pre>`
                        })}
                        onEdit={(row) => onEditTierRow(row)}
                        onDelete={(row) => confirmAndDeleteTierPricing(row)}
                    />)}
                </div>
            </div>)}

            {/* Special Pricing Section */}
            {activeTab === "special" && (<div className="card mb-24">
                <div className="card-header d-flex align-items-center justify-content-between">
                    <h6 className="mb-0">Special Pricing</h6>
                    <button className="btn btn-primary-600" onClick={() => {
                        resetSpecialForm();
                        setVariantOptions([]);
                        setShowSpecialModal(true);
                    }}>Add New
                    </button>
                </div>
                <div className="card-body">
                    {loadingSpecial ? (<div>Loading...</div>) : (<TableDataLayer
                        headers={specialHeaders}
                        data={specialRows}
                        onView={(row) => Swal.fire({
                            title: "Special", html: `<pre style='text-align:left'>${JSON.stringify(row, null, 2)}</pre>`
                        })}
                        onEdit={(row) => onEditSpecialRow(row)}
                        onDelete={(row) => confirmAndDeleteSpecialPricing(row)}
                    />)}
                </div>
            </div>)}

            {/* Product Pricing Modal */}
            {showProductModal && (<>
                <div
                    className="modal-backdrop fade show"

                ></div>
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    role="dialog"
                    style={{
                        zIndex: 1050, display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                >
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h6 className="modal-title">{productForm.id ? "Update" : "Create"} Product
                                    Pricing</h6>
                                <button type="button" className="btn-close"
                                        onClick={() => setShowProductModal(false)}></button>
                            </div>
                            <form onSubmit={submitProductPricing}>
                                <div className="modal-body">
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label">Product</label>
                                            <Select
                                                classNamePrefix="react-select"
                                                placeholder={loadingProducts ? "Loading products..." : "Select product"}
                                                isClearable
                                                isSearchable
                                                options={productOptions}
                                                value={productOptions.find((o) => String(o.value) === String(productForm.productId)) || null}
                                                onChange={(opt) => {
                                                    const pid = opt?.value || "";
                                                    setProductForm({...productForm, productId: pid, variantId: ""});
                                                    if (pid) loadVariantsForProduct(pid);
                                                    else setVariantOptions([]);
                                                }}
                                                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                                menuPosition="fixed"
                                                styles={{menuPortal: (base) => ({...base, zIndex: 2000})}}
                                                formatOptionLabel={(opt) => {
                                                    const imgBase = (process.env.REACT_APP_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

                                                    const thumbUrl = opt.image || opt.thumb ? ((opt.image || opt.thumb).startsWith("http") ? (opt.image || opt.thumb) : `${imgBase}${opt.image || opt.thumb}`) : "";
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
                                        <div className="col-md-6">
                                            <label className="form-label">Variant</label>
                                            <Select
                                                classNamePrefix="react-select"
                                                placeholder={!productForm.productId ? "Select product first" : loadingVariants ? "Loading variants..." : variantOptions.length === 0 ? "No variants" : "Select variant"}
                                                isClearable
                                                isSearchable
                                                options={variantOptions}
                                                value={variantOptions.find((o) => String(o.value) === String(productForm.variantId)) || null}
                                                onChange={(opt) => setProductForm({
                                                    ...productForm,
                                                    variantId: opt?.value || ""
                                                })}
                                                isDisabled={!productForm.productId || loadingVariants || variantOptions.length === 0}
                                                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                                menuPosition="fixed"
                                                styles={{menuPortal: (base) => ({...base, zIndex: 2000})}}
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">Base Price</label>
                                            <input type="number" step="0.01" className="form-control"
                                                   value={productForm.basePrice} onChange={(e) => setProductForm({
                                                ...productForm, basePrice: e.target.value
                                            })} required/>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">Discount Type</label>
                                            <select className="form-select" value={productForm.discountType}
                                                    onChange={(e) => setProductForm({
                                                        ...productForm, discountType: e.target.value
                                                    })}>
                                                <option value="percent">Percent</option>
                                                <option value="flat">Flat</option>
                                            </select>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">Discount Value</label>
                                            <input type="number" step="0.01" className="form-control"
                                                   value={productForm.discountValue}
                                                   onChange={(e) => setProductForm({
                                                       ...productForm, discountValue: e.target.value
                                                   })}/>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Currency</label>
                                            <select className="form-select" value={productForm.currency}
                                                    onChange={(e) => setProductForm({
                                                        ...productForm, currency: e.target.value
                                                    })}>
                                                <option value="USD">USD</option>
                                                <option value="EUR">EUR</option>
                                                <option value="GBP">GBP</option>
                                                <option value="INR">INR</option>
                                            </select>
                                        </div>
                                        <div className="col-md-6 d-flex align-items-center">
                                            <label className="form-check-label"
                                                   htmlFor="productStatus">Active</label>
                                            <div className="form-switch switch-primary">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={productForm.status}
                                                    onChange={(e) => setProductForm({
                                                        ...productForm, status: e.target.checked
                                                    })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/*<div className="mt-12">*/}
                                    {/*    <label className="form-label">JSON Preview</label>*/}
                                    {/*    <pre className="bg-neutral-50 p-12 radius-8" style={{*/}
                                    {/*        maxHeight: 220, overflow: "auto"*/}
                                    {/*    }}>{JSON.stringify(productJsonPreview, null, 2)}</pre>*/}
                                    {/*</div>*/}
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-neutral-400"
                                            onClick={() => setShowProductModal(false)}>Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary-600">Save</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </>)}

            {/* Tier Pricing Modal */}
            {showTierModal && (<>
                <div
                    className="modal-backdrop fade show"

                ></div>
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    role="dialog"
                    style={{
                        zIndex: 1050, display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                >
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h6 className="modal-title">{tierForm.id ? "Update" : "Create"} Tier Pricing</h6>
                                <button type="button" className="btn-close"
                                        onClick={() => setShowTierModal(false)}></button>
                            </div>
                            <form onSubmit={submitTierPricing}>
                                <div className="modal-body">
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label">Product</label>
                                            <Select
                                                classNamePrefix="react-select"
                                                placeholder={loadingProducts ? "Loading products..." : "Select product"}
                                                isClearable
                                                isSearchable
                                                options={productOptions}
                                                value={productOptions.find((o) => String(o.value) === String(tierForm.productId)) || null}
                                                onChange={(opt) => {
                                                    const pid = opt?.value || "";
                                                    setTierForm({...tierForm, productId: pid, variantId: ""});
                                                    if (pid) loadVariantsForProduct(pid);
                                                    else setVariantOptions([]);
                                                }}
                                                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                                menuPosition="fixed"
                                                styles={{menuPortal: (base) => ({...base, zIndex: 2000})}}
                                                formatOptionLabel={(opt) => {
                                                    const imgBase = (process.env.REACT_APP_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

                                                    const thumbUrl = opt.image || opt.thumb ? ((opt.image || opt.thumb).startsWith("http") ? (opt.image || opt.thumb) : `${imgBase}${opt.image || opt.thumb}`) : "";
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
                                        <div className="col-md-6">
                                            <label className="form-label">Variant</label>
                                            <Select
                                                classNamePrefix="react-select"
                                                placeholder={!tierForm.productId ? "Select product first" : loadingVariants ? "Loading variants..." : variantOptions.length === 0 ? "No variants" : "Select variant"}
                                                isClearable
                                                isSearchable
                                                options={variantOptions}
                                                value={variantOptions.find((o) => String(o.value) === String(tierForm.variantId)) || null}
                                                onChange={(opt) => setTierForm({
                                                    ...tierForm,
                                                    variantId: opt?.value || ""
                                                })}
                                                isDisabled={!tierForm.productId || loadingVariants || variantOptions.length === 0}
                                                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                                menuPosition="fixed"
                                                styles={{menuPortal: (base) => ({...base, zIndex: 2000})}}
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">Min Qty</label>
                                            <input type="number" className="form-control" value={tierForm.minQty}
                                                   onChange={(e) => setTierForm({
                                                       ...tierForm, minQty: e.target.value
                                                   })} required/>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">Max Qty</label>
                                            <input type="number" className="form-control" value={tierForm.maxQty}
                                                   onChange={(e) => setTierForm({
                                                       ...tierForm, maxQty: e.target.value
                                                   })} required/>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">Price</label>
                                            <input type="number" step="0.01" className="form-control"
                                                   value={tierForm.price} onChange={(e) => setTierForm({
                                                ...tierForm, price: e.target.value
                                            })} required/>
                                        </div>
                                    </div>
                                    {/*<div className="mt-12">*/}
                                    {/*    <label className="form-label">JSON Preview</label>*/}
                                    {/*    <pre className="bg-neutral-50 p-12 radius-8" style={{*/}
                                    {/*        maxHeight: 220, overflow: "auto"*/}
                                    {/*    }}>{JSON.stringify(tierJsonPreview, null, 2)}</pre>*/}
                                    {/*</div>*/}
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-neutral-400"
                                            onClick={() => setShowTierModal(false)}>Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary-600">Save</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </>)}

            {/* Special Pricing Modal */}
            {showSpecialModal && (<>
                <div
                    className="modal-backdrop fade show"

                ></div>
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    role="dialog"
                    style={{
                        zIndex: 1050, display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                >
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h6 className="modal-title">{specialForm.id ? "Update" : "Create"} Special
                                    Pricing</h6>
                                <button type="button" className="btn-close"
                                        onClick={() => setShowSpecialModal(false)}></button>
                            </div>
                            <form onSubmit={submitSpecialPricing}>
                                <div className="modal-body">
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label">Product</label>
                                            <Select
                                                classNamePrefix="react-select"
                                                placeholder={loadingProducts ? "Loading products..." : "Select product"}
                                                isClearable
                                                isSearchable
                                                options={productOptions}
                                                value={productOptions.find((o) => String(o.value) === String(specialForm.productId)) || null}
                                                onChange={(opt) => {
                                                    const pid = opt?.value || "";
                                                    setSpecialForm({...specialForm, productId: pid, variantId: ""});
                                                    if (pid) loadVariantsForProduct(pid);
                                                    else setVariantOptions([]);
                                                }}
                                                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                                menuPosition="fixed"
                                                styles={{menuPortal: (base) => ({...base, zIndex: 2000})}}
                                                formatOptionLabel={(opt) => {
                                                    const imgBase = (process.env.REACT_APP_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
                                                    const thumbUrl = opt.image || opt.thumb ? ((opt.image || opt.thumb).startsWith("http") ? (opt.image || opt.thumb) : `${imgBase}${opt.image || opt.thumb}`) : "";
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
                                        <div className="col-md-6">
                                            <label className="form-label">Variant</label>
                                            <Select
                                                classNamePrefix="react-select"
                                                placeholder={!specialForm.productId ? "Select product first" : loadingVariants ? "Loading variants..." : variantOptions.length === 0 ? "No variants" : "Select variant"}
                                                isClearable
                                                isSearchable
                                                options={variantOptions}
                                                value={variantOptions.find((o) => String(o.value) === String(specialForm.variantId)) || null}
                                                onChange={(opt) => setSpecialForm({
                                                    ...specialForm,
                                                    variantId: opt?.value || ""
                                                })}
                                                isDisabled={!specialForm.productId || loadingVariants || variantOptions.length === 0}
                                                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                                menuPosition="fixed"
                                                styles={{menuPortal: (base) => ({...base, zIndex: 2000})}}
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">Special Price</label>
                                            <input type="number" step="0.01" className="form-control"
                                                   value={specialForm.specialPrice}
                                                   onChange={(e) => setSpecialForm({
                                                       ...specialForm, specialPrice: e.target.value
                                                   })} required/>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">Start Date</label>
                                            <input type="datetime-local" className="form-control"
                                                   value={specialForm.startDate} onChange={(e) => setSpecialForm({
                                                ...specialForm, startDate: e.target.value
                                            })}/>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">End Date</label>
                                            <input type="datetime-local" className="form-control"
                                                   value={specialForm.endDate} onChange={(e) => setSpecialForm({
                                                ...specialForm, endDate: e.target.value
                                            })}/>
                                        </div>
                                        <div className="md-3 d-flex align-items-center ">
                                            <label className="form-check-label"
                                                   htmlFor="productStatus">Active</label>
                                            <div className="form-switch switch-primary">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={specialForm.status}
                                                    onChange={(e) => setSpecialForm({
                                                        ...specialForm, status: e.target.checked
                                                    })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-neutral-400"
                                            onClick={() => setShowSpecialModal(false)}>Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary-600">Save</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </>)}

            <ToastContainer position="top-right" autoClose={2000}/>
        </div>
    </MasterLayout>);
};

export default PricingPage;
