import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import {
    getProducts,
    deleteProduct as deleteProductThunk,
    setLimit,
} from "../../features/catalog/productsSlice";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import TableDataLayer from "../../components/TableDataLayer";
import { useNavigate } from "react-router-dom";
import {
    openSeoModal,
    closeSeoModal,
    setSeoField,
    getProductSeo,
    upsertProductSeo,
    deleteProductSeo,
} from "../../features/catalog/productSeoSlice";

const ProductPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { items, page, limit, status } = useSelector((s) => s.products);
    const { modalOpen: seoModalOpen, seo, currentProductId, } = useSelector((s) => s.productSeo || {});


    const [search, setSearch] = useState("");


    useEffect(() => {
        dispatch(getProducts({ page, limit, search }));
    }, [dispatch, page, limit, search]);



    const openCreate = () => {
        navigate("/products/create");
    };

    // const openEdit = (product) => {
    //     const productId = product?._id || product?.id;
    //     if (productId) {
    //         navigate(`/products/edit/${productId}`);
    //     }
    // };

    const handleDelete = async (product) => {
        const id = product?._id || product?.id;
        if (!id) return;

        const res = await Swal.fire({
            icon: "warning",
            title: "Delete product?",
            text: `This will remove ${product.title}. Continue?`,
            showCancelButton: true,
            confirmButtonText: "Delete",
            cancelButtonText: "Cancel",
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
            await dispatch(deleteProductThunk(id)).unwrap();
            toast.success("Product deleted successfully");
            dispatch(getProducts({ page, limit }));
        } catch (err) {
            toast.error(typeof err === "string" ? err : err?.message || "Delete failed");
        }
    };


    const onSeo = async (product) => {
        const productId = product?._id || product?.id;
        if (!productId) return;

        dispatch(openSeoModal(productId));
        try {
            await dispatch(getProductSeo(productId)).unwrap();
        } catch (e) {
            // errors handled via slice
        }
    };

    const onViewDetails = (product) => {
        const productId = product?._id || product?.id;
        if (productId) {
            navigate(`/products/${productId}`);
        }
    };

    // Prepare table data according to template structure
    const tableData = Array.isArray(items)
        ? items
            .filter((p) => p) // filter out null or undefined products
            .map((product, index) => {
                const normalizePath = (path) => {
                    if (!path) return "assets/images/user-list/user-list1.png";
                    return path.startsWith("http")
                        ? path
                        : `http://localhost:8000${path.startsWith("/") ? path : `/${path}`}`;
                };

                const thumbnail = product?.thumbnail ? (
                    <img
                        src={`http://localhost:8000${product.thumbnail}`}
                        alt={product?.title || "Product"}
                        style={{
                            width: "50px",
                            height: "50px",
                            borderRadius: "6px",
                            objectFit: "cover",
                        }}
                        onError={(e) => (e.currentTarget.src = "/assets/images/no-image.png")}
                    />
                ) : (
                    <img
                        src={normalizePath(product?.thumbnail)}
                        alt={product?.title || "Product"}
                        className="flex-shrink-0 me-12 radius-8"
                        onError={(e) =>
                            (e.currentTarget.src = "assets/images/user-list/user-list1.png")
                        }
                    />
                );

                const statusBadge = product?.status ? (
                    <span className="badge bg-success-600 rounded-pill">Active</span>
                ) : (
                    <span className="badge bg-danger-600 rounded-pill">Inactive</span>
                );

                const featuredBadge = product?.isFeatured ? (
                    <span className="badge bg-warning-600 rounded-pill">Featured</span>
                ) : null;

                const brandName = product?.brandId?.name || product?.brandName || "-";
                const categoryNames = Array.isArray(product?.categoryIds)
                    ? product.categoryIds
                        .map((cat) => (typeof cat === "object" ? cat.name : cat))
                        .join(", ")
                    : "-";

                return {
                    "#": (page - 1) * limit + index + 1,
                    thumbnail,
                    title: product?.title || "-",
                    sku: product?.sku || "-",
                    brand: brandName,
                    categories: categoryNames,
                    type: product?.type || "simple",
                    status: (
                        <>
                            {statusBadge} {featuredBadge}
                        </>
                    ),
                    id: product?._id || product?.id || "-",
                };
            })
        : [];




    return (
        <MasterLayout>
            <Breadcrumb title="Catalog / Products" />

            <div className="card h-100 p-0 radius-12">
                <div className="card-header bg-neutral-100 border-bottom py-16 px-24 d-flex align-items-center justify-content-between">
                    <h6 className="text-lg mb-0">Products</h6>
                    <div className="d-flex gap-8 align-items-center">
                        <input
                            type="text"
                            className="form-control w-auto"
                            placeholder="Search products..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && dispatch(getProducts({ page: 1, limit, search }))}
                        />
                        <select
                            value={limit}
                            onChange={(e) => dispatch(setLimit(Number(e.target.value)))}
                            className="form-select w-auto"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <button
                            className="btn btn-primary-600"
                            onClick={openCreate}
                            disabled={status === 'loading'}
                        >
                            {status === 'loading' ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" />
                                    Loading...
                                </>
                            ) : (
                                <>
                                    <i className="ri-add-line me-1" /> Add Product
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="card-body p-24">
                    {status === 'loading' ? (
                        <div className="text-center py-4">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-2">Loading products...</p>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-4">
                            <i className="ri-inbox-line text-muted" style={{ fontSize: '3rem' }} />
                            <p className="mt-2 text-muted">No products found</p>
                            <button className="btn btn-primary-600 mt-2" onClick={openCreate}>
                                <i className="ri-add-line me-1" /> Create Your First Product
                            </button>
                        </div>
                    ) : (
                        <>
                            <div style={{ overflowX: "auto" }}>
                                <TableDataLayer
                                    title="Product List"
                                    headers={["#","thumbnail", "title", "sku", "brand", "categories", "type", "status"]}
                                    data={tableData}
                                    onView={(row) => onViewDetails(row)}
                                    onEdit={(row) => onViewDetails(row)}
                                    onDelete={(row) => handleDelete(row)}
                                    onSeo={(row) => onSeo(row)}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* SEO Modal */}
            {seoModalOpen && (<div className="modal-backdrop fade show"></div>)}
            {seoModalOpen && (
                <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ background: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Product SEO</h5>
                                <button className="btn-close" onClick={() => dispatch(closeSeoModal())} />
                            </div>
                            <div className="modal-body">
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    try {
                                        const payload = {
                                            metaTitle: seo?.metaTitle || "",
                                            metaDescription: seo?.metaDescription || "",
                                            keywords: Array.isArray(seo?.keywords)
                                                ? seo.keywords
                                                : String(seo?.keywords || "")
                                                    .split(",")
                                                    .map((k) => k.trim())
                                                    .filter(Boolean),
                                            canonicalUrl: seo?.canonicalUrl || "",
                                            slug: seo?.slug || "",
                                        };
                                        await dispatch(upsertProductSeo({ productId: currentProductId, data: payload })).unwrap();
                                        toast.success("SEO settings saved successfully");
                                        dispatch(closeSeoModal());
                                    } catch (err) {
                                        toast.error(typeof err === "string" ? err : err?.message || "Failed to save SEO settings");
                                    }
                                }}>
                                    <div className="mb-3">
                                        <label className="form-label">
                                            Meta Title <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={seo?.metaTitle || ""}
                                            onChange={(e) => dispatch(setSeoField({ field: "metaTitle", value: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">
                                            Meta Description <span className="text-danger">*</span>
                                        </label>
                                        <textarea
                                            className="form-control"
                                            rows={3}
                                            value={seo?.metaDescription || ""}
                                            onChange={(e) => dispatch(setSeoField({ field: "metaDescription", value: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Keywords (comma-separated)</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={Array.isArray(seo?.keywords) ? seo.keywords.join(", ") : (seo?.keywords || "")}
                                            onChange={(e) => dispatch(setSeoField({ field: "keywords", value: e.target.value }))}
                                            placeholder="keyword1, keyword2, keyword3"
                                        />
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">Canonical URL</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={seo?.canonicalUrl || ""}
                                                    onChange={(e) => dispatch(setSeoField({ field: "canonicalUrl", value: e.target.value }))}
                                                    placeholder="https://example.com/product-url"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">Slug</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={seo?.slug || ""}
                                                    onChange={(e) => dispatch(setSeoField({ field: "slug", value: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="d-flex justify-content-between">
                                        <button type="submit" className="btn btn-primary-600">
                                            <i className="ri-save-line me-1" /> Save SEO
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-danger-600"
                                            onClick={async () => {
                                                const res = await Swal.fire({
                                                    icon: "warning",
                                                    title: "Delete SEO Settings?",
                                                    text: "This will remove all SEO settings for this product.",
                                                    showCancelButton: true,
                                                    confirmButtonText: "Delete",
                                                    cancelButtonText: "Cancel",
                                                });
                                                if (!res.isConfirmed) return;
                                                try {
                                                    await dispatch(deleteProductSeo(currentProductId)).unwrap();
                                                    toast.success("SEO settings deleted successfully");
                                                    dispatch(closeSeoModal());
                                                } catch (err) {
                                                    toast.error(typeof err === "string" ? err : err?.message || "Failed to delete SEO settings");
                                                }
                                            }}
                                        >
                                            <i className="ri-delete-bin-line me-1" /> Delete SEO
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                pauseOnHover
                draggable
            />
        </MasterLayout>
    );
};

export default ProductPage;
