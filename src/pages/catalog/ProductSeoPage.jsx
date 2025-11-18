import React, { useEffect, useMemo, useState } from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import { getSeo, updateSeo, deleteSeo, listSeo } from "../../api/seoService";
import ProductApi from "../../api/productApi";
import Select from "react-select";

const Field = ({ label, children, required }) => (
    <div className="mb-12">
        <label className="form-label text-sm mb-4">
            {label} {required && <span className="text-danger">*</span>}
        </label>
        {children}
    </div>
);

const ProductSeoPage = () => {
    const [products, setProducts] = useState([]);
    const [productSearch, setProductSearch] = useState("");
    const [selectedProductId, setSelectedProductId] = useState("");
    const [seo, setSeo] = useState({
        metaTitle: "",
        metaDescription: "",
        keywords: [],
        slug: "",
        canonicalUrl: "",
    });

    const [loadingProducts, setLoadingProducts] = useState(false);
    const [loadingSeo, setLoadingSeo] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [noSeoMessage, setNoSeoMessage] = useState("");
    const [seoItems, setSeoItems] = useState([]);

    // Load products
    useEffect(() => {
        const loadProducts = async () => {
            setLoadingProducts(true);
            try {
                const data = await ProductApi.getProducts();

                const items = Array.isArray(data)
                    ? data
                    : data?.data.items || data?.data || data?.results || [];

                const mappedProducts = items.map((p, i) => ({
                    id: p._id || p.id,
                    title: p.title || p.name || `Product ${i + 1}`,
                    slug: p.slug || "",
                    // normalized thumbnail field for selector rendering
                    thumb:
                        p.thumbnailUrl ||
                        p.thumbnail ||
                        p.thumb ||
                        p.thumbnailPath ||
                        p.image ||
                        (Array.isArray(p.images) && p.images[0]) ||
                        "",
                }));

                setProducts(mappedProducts);
            } catch (e) {
                console.error(e);
                toast.error("Failed to load products");
            } finally {
                setLoadingProducts(false);
            }
        };
        loadProducts();
    }, []);

    // Filter products by search
    const filteredProducts = useMemo(() => {
        const q = productSearch.trim().toLowerCase();
        if (!q) return products;
        return products.filter((p) =>
            String(p.title || "").toLowerCase().includes(q)
        );
    }, [products, productSearch]);

    const currentProduct = useMemo(() => {
        return products.find((p) => String(p.id) === String(selectedProductId)) || null;
    }, [products, selectedProductId]);

    // Build options for searchable dropdown with thumbnails
    const productOptions = useMemo(() => {
        const opts = (products || []).map((p) => ({
            value: p.id,
            label: p.title || p.name || String(p.id),
            thumb:
                p.thumb ||
                p.thumbnailUrl ||
                p.thumbnail ||
                p.thumbnailPath ||
                p.image ||
                (Array.isArray(p.images) && p.images[0]) ||
                "",
        }));
        const q = productSearch.trim().toLowerCase();
        return q ? opts.filter((o) => o.label.toLowerCase().includes(q)) : opts;
    }, [products, productSearch]);

    const selectedProductOption = useMemo(() => {
        const val = selectedProductId || "";
        if (!val) return null;
        return productOptions.find((o) => String(o.value) === String(val)) || { value: val, label: String(val) };
    }, [selectedProductId, productOptions]);

    // Select a product and load its SEO
    const selectProduct = async (productId) => {
        setSelectedProductId(productId);
        if (!productId) {
            setSeo({
                metaTitle: "",
                metaDescription: "",
                keywords: [],
                slug: "",
                canonicalUrl: "",
            });
            setNoSeoMessage("");
            return;
        }

        setLoadingSeo(true);
        setNoSeoMessage("");

        try {
            const { data } = await getSeo(productId);
            const payload = data?.data || data || {};

            setSeo({
                metaTitle: payload.metaTitle || "",
                metaDescription: payload.metaDescription || "",
                keywords: Array.isArray(payload.keywords)
                    ? payload.keywords
                    : String(payload.keywords || "")
                        .split(",")
                        .map((k) => k.trim())
                        .filter(Boolean),
                slug: payload.slug || currentProduct?.slug || "",
                canonicalUrl: payload.canonicalUrl || "",
            });

            if (!Object.keys(payload).length) {
                setNoSeoMessage("No SEO details found. You can create one below.");
            }
        } catch (err) {
            const status = err?.response?.status;
            if (status === 404) {
                setSeo({
                    metaTitle: "",
                    metaDescription: "",
                    keywords: [],
                    slug: currentProduct?.slug || "",
                    canonicalUrl: "",
                });
                setNoSeoMessage("No SEO details found. You can create one below.");
            } else {
                toast.error("Failed to load SEO details");
            }
        } finally {
            setLoadingSeo(false);
        }
    };

    // Add and remove keywords
    const addKeywordByInput = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const val = e.target.value.trim();
            if (!val) return;
            setSeo((s) => ({
                ...s,
                keywords: Array.from(new Set([...s.keywords, val])),
            }));
            e.target.value = "";
        }
    };

    const removeKeyword = (kw) => {
        setSeo((s) => ({
            ...s,
            keywords: s.keywords.filter((k) => k !== kw),
        }));
    };

    const resetForm = () => {
        setSeo({
            metaTitle: "",
            metaDescription: "",
            keywords: [],
            slug: currentProduct?.slug || "",
            canonicalUrl: "",
        });
        setNoSeoMessage("");
    };

    // Save SEO
    const saveSeo = async (e) => {
        e.preventDefault();
        if (!selectedProductId) {
            toast.error("Please select a product first");
            return;
        }
        if (!seo.metaTitle || !seo.metaDescription) {
            toast.error("Meta Title and Meta Description are required");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                metaTitle: seo.metaTitle.trim(),
                metaDescription: seo.metaDescription.trim(),
                keywords: seo.keywords,
                slug: seo.slug.trim(),
                canonicalUrl: seo.canonicalUrl.trim(),
            };

            await updateSeo(selectedProductId, payload);
            toast.success("SEO metadata saved successfully.");

            // Refresh SEO list
            try {
                const resp = await listSeo();
                const list = resp?.items || resp?.data || resp || [];
                setSeoItems(Array.isArray(list) ? list : []);
            } catch {}
        } catch (err) {
            const msg =
                err?.response?.data?.message || err?.message || "Failed to save SEO";
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    // Delete SEO
    const onDelete = () => {
        if (!selectedProductId) return;

        Swal.fire({
            title: "Delete SEO",
            text: "Are you sure you want to delete this product's SEO metadata?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#dc3545",
        }).then(async (result) => {
            if (!result.isConfirmed) return;
            setDeleting(true);

            try {
                await deleteSeo(selectedProductId);
                toast.info("SEO metadata deleted.");
                resetForm();
            } catch {
                toast.error("Failed to delete SEO metadata");
            } finally {
                setDeleting(false);
            }
        });
    };

    return (
        <MasterLayout>
            <Breadcrumb title="Catalog / Product SEO" />

            <div className="card h-100 p-0 radius-12">
                <div className="card-header bg-neutral-100 border-bottom py-16 px-24 d-flex align-items-center justify-content-between">
                    <h6 className="text-lg mb-0">Product SEO</h6>
                </div>

                <div className="card-body p-24">
                    {/* Product selector */}
                    <div className="mb-16">
                        <div className="row">
                            <div className="col-md-6">
                                <Field label="Product" required>
                                    <Select
                                        classNamePrefix="select"
                                        placeholder="Search and select a product"
                                        isClearable
                                        isSearchable
                                        isLoading={loadingProducts}
                                        options={productOptions}
                                        value={selectedProductOption}
                                        menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                        menuPosition="fixed"
                                        styles={{ menuPortal: (base) => ({ ...base, zIndex: 2000 }) }}
                                        onChange={(opt) => selectProduct(opt?.value || "")}
                                        onMenuOpen={() => {
                                            if ((products || []).length === 0 && !loadingProducts) {
                                                (async () => {
                                                    setLoadingProducts(true);
                                                    try {
                                                        const resp = await ProductApi.getProducts({ page: 1, limit: 200 });
                                                        const arr = resp?.data?.items || resp?.data || resp || [];
                                                        const mapped = (arr || []).map((p, i) => ({
                                                            id: p._id || p.id,
                                                            title: p.title || p.name || `Product ${i + 1}`,
                                                            slug: p.slug || "",
                                                            thumb:
                                                                p.thumbnailUrl ||
                                                                p.thumbnail ||
                                                                p.thumb ||
                                                                p.thumbnailPath ||
                                                                p.image ||
                                                                (Array.isArray(p.images) && p.images[0]) ||
                                                                "",
                                                        }));
                                                        setProducts(mapped);
                                                    } catch (e) {
                                                        console.error(e);
                                                        toast.error("Failed to load products");
                                                    } finally {
                                                        setLoadingProducts(false);
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
                                                        <img
                                                            src={thumbUrl}
                                                            alt="thumb"
                                                            style={{ width: 24, height: 24, objectFit: "cover", borderRadius: 4 }}
                                                        />
                                                    ) : (
                                                        <span className="badge bg-neutral-200" style={{ width: 24, height: 24 }} />
                                                    )}
                                                    <span>{opt.label}</span>
                                                </div>
                                            );
                                        }}
                                    />
                                </Field>
                            </div>
                        </div>
                    </div>

                    {loadingSeo && <div className="alert alert-info">Loading SEO details…</div>}
                    {noSeoMessage && !loadingSeo && (
                        <div className="alert alert-warning">{noSeoMessage}</div>
                    )}

                    {/* SEO Form */}
                    <form onSubmit={saveSeo}>
                        <div className="row">
                            <div className="col-md-6">
                                <Field label="Meta Title" required>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={seo.metaTitle}
                                        onChange={(e) =>
                                            setSeo((s) => ({ ...s, metaTitle: e.target.value }))
                                        }
                                        disabled={!selectedProductId || saving}
                                        required
                                    />
                                </Field>
                            </div>
                            <div className="col-md-6">
                                <Field label="Slug">
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={seo.slug}
                                        onChange={(e) =>
                                            setSeo((s) => ({ ...s, slug: e.target.value }))
                                        }
                                        disabled={!selectedProductId || saving}
                                    />
                                </Field>
                            </div>
                        </div>

                        <Field label="Meta Description" required>
              <textarea
                  className="form-control"
                  rows={4}
                  value={seo.metaDescription}
                  onChange={(e) =>
                      setSeo((s) => ({ ...s, metaDescription: e.target.value }))
                  }
                  disabled={!selectedProductId || saving}
                  required
              />
                        </Field>

                        <Field label="Keywords">
                            <div className="d-flex flex-column gap-8">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Type keyword and press Enter"
                                    onKeyDown={addKeywordByInput}
                                    disabled={!selectedProductId || saving}
                                />
                                <div className="d-flex flex-wrap gap-8">
                                    {(seo.keywords || []).map((kw) => (
                                        <span
                                            key={kw}
                                            className="badge bg-primary-100 text-primary-700 d-flex align-items-center gap-6"
                                        >
                      {kw}
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-link text-danger"
                                                onClick={() => removeKeyword(kw)}
                                            >
                        <i className="ri-close-line" />
                      </button>
                    </span>
                                    ))}
                                </div>
                            </div>
                        </Field>


                        <div className="d-flex justify-content-end gap-8 mt-16">
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={resetForm}
                                disabled={!selectedProductId || saving}
                            >
                                Reset
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger-600"
                                onClick={onDelete}
                                disabled={!selectedProductId || deleting || saving}
                            >
                                Delete
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary-600"
                                disabled={!selectedProductId || saving}
                            >
                                Save
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <ToastContainer
                position="top-right"
                autoClose={2000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                pauseOnHover
                draggable
            />
        </MasterLayout>
    );
};

export default ProductSeoPage;
