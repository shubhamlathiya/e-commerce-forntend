import React, {useEffect, useState} from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import TableDataLayer from "../../components/TableDataLayer";
import PaginationLayer from "../../components/PaginationLayer";
import Swal from "sweetalert2";
import {toast, ToastContainer} from "react-toastify";
import {useDispatch, useSelector} from "react-redux";
import {
    getAllBrands,
    createBrand,
    updateBrand,
    deleteBrand,
    openCreateModal,
    openEditModal,
    closeModal,
    setFormField,
    resetForm,
    getBrandById,
} from "../../features/catalog/brandsSlice";
import apiClient from "../../api/client";
import {Icon} from "@iconify/react"; // ensure you have axios instance here

// Base URL and helpers for images and website
const IMG_BASE = ("http://localhost:8000").replace(/\/$/, "");
const placeholderImage = "/assets/images/user-list/user-list1.png";
const resolveImageUrl = (p) => {
    if (!p) return placeholderImage;
    const s = String(p);
    if (s.startsWith("http")) return s;
    return `${IMG_BASE}${s.startsWith("/") ? s : `/${s}`}`;
};
const normalizeWebsite = (url) => {
    if (!url) return "";
    const s = String(url).trim();
    if (/^https?:\/\//i.test(s)) return s;
    return `http://${s}`;
};

const BrandsPage = () => {
    const dispatch = useDispatch();
    const {
        items = [], form = {
            name: "", slug: "", logo: "", description: "", website: "", status: true, isFeatured: false,
        }, modalOpen = false, current = null, page: slicePage = 1, limit: sliceLimit = 10, totalPages = 1,
    } = useSelector((s) => s.brands || {});

    const [page, setPage] = useState(Number(slicePage) || 1);
    const limit = Number(sliceLimit) || 10;
    const [previewImage, setPreviewImage] = useState(form.logo || "");
    const [file, setFile] = useState(null); // <-- holds real File object

    useEffect(() => {
        dispatch(getAllBrands({page, limit}));
    }, [dispatch, page, limit]);

    //  handle image upload
    const handleImageUpload = (e) => {
        const uploadedFile = e.target.files[0];
        if (!uploadedFile) return;
        const src = URL.createObjectURL(uploadedFile);
        setPreviewImage(src);
        setFile(uploadedFile);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const formData = new FormData();
            formData.append("name", form.name.trim());
            if (form.slug) formData.append("slug", form.slug.trim());
            if (form.description) formData.append("description", form.description.trim());
            if (form.website) formData.append("website", form.website.trim());
            formData.append("status", form.status ? "true" : "false");
            formData.append("isFeatured", form.isFeatured ? "true" : "false");

            // Append logo if new file selected
            if (file) {
                formData.append("logo", file); // multer expects "logo"
            }

            // Create or update brand
            if (current?._id) {
                await apiClient.put(`/api/catalog/brands/${current._id}`, formData, {
                    headers: {"Content-Type": "multipart/form-data"},
                });
                toast.success(" Brand updated successfully");
            } else {
                await apiClient.post("/api/catalog/brands", formData, {
                    headers: {"Content-Type": "multipart/form-data"},
                });
                toast.success("🎉 Brand created successfully");
            }

            // Refresh data and reset UI
            dispatch(getAllBrands({page, limit}));
            dispatch(resetForm());
            dispatch(closeModal());
            setPreviewImage("");
            setFile(null);
        } catch (err) {
            console.error("Brand save error:", err);
            toast.error(" Failed to save brand");
        }
    };


    const handleDelete = (id) => {
        Swal.fire({
            title: "Delete Brand?",
            text: "This action can't be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Delete",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#dc3545",
            customClass: {
                title: "text-md fw-semibold",   // medium title
                htmlContainer: "text-sm",       // smaller body text
                confirmButton: "btn btn-sm btn-danger",
                cancelButton: "btn btn-sm btn-light",
                popup: "p-3 rounded-3",         // tidy padding
            },
        }).then(async (res) => {
            if (!res.isConfirmed) return;
            try {
                await dispatch(deleteBrand(id)).unwrap();
                toast.info("Brand deleted");
                dispatch(getAllBrands({ page, limit }));
            } catch {
                toast.error("Delete failed");
            }
        });
    };


    const openCreate = () => {
        dispatch(resetForm());
        setPreviewImage("");
        setFile(null);
        dispatch(openCreateModal());
    };

    const openEdit = async (brand) => {
        const id = brand?._id || brand?.id;

        if (!id) {
            // Fallback to row data if no id present
            dispatch(openEditModal(brand));
            setPreviewImage(brand?.logo ? resolveImageUrl(brand.logo) : placeholderImage);
            setFile(null);
            return;
        }

        try {
            const result = await dispatch(getBrandById(id)).unwrap();
            const full = result?.data || result || {};
            dispatch(openEditModal(full));
            setPreviewImage(full?.logo ? resolveImageUrl(full.logo) : placeholderImage);
            setFile(null);
        } catch (err) {
            // If API fails, still open modal with available data
            dispatch(openEditModal(brand));
            setPreviewImage(brand?.logo ? resolveImageUrl(brand.logo) : placeholderImage);
            setFile(null);
        }
    };

    const tableData = items.map((brand, index) => {
        // ✅ Show brand logo (or fallback)
        const logo = (
            <img
                src={brand.logo ? resolveImageUrl(brand.logo) : placeholderImage}
                alt={brand.name || "Brand Logo"}
                style={{
                    width: "50px",
                    height: "50px",
                    objectFit: "cover",
                    borderRadius: "6px",
                }}
                onError={(e) => {
                    e.currentTarget.src = placeholderImage;
                }}
            />
        );

        // ✅ Status badge
        const statusBadge = brand.status
            ? <span className="badge bg-success-600 rounded-pill">Active</span>
            : <span className="badge bg-danger-600 rounded-pill">Inactive</span>;

        // ✅ Featured badge
        const featuredBadge = brand.isFeatured
            ? <span className="badge bg-warning-600 rounded-pill">Featured</span>
            : null;
        const name = brand.name;
        return {
            "#": (page - 1) * limit + index + 1,
            logo,
            name: name,
            website: brand.website ? (
                <a
                    href={normalizeWebsite(brand.website)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#0d6efd" }}
                >
                    {brand.name || brand.website}
                </a>
            ) : (
                "—"
            ),
            featured: brand.isFeatured ? (
                <span className="badge bg-primary rounded-pill">Yes</span>
            ) : (
                <span className="badge bg-primary rounded-pill">No</span>
            ),
            status: (
                <>
                    {statusBadge} {featuredBadge}
                </>
            ),
            id: brand._id || brand.id,
        };
    });


    return (<MasterLayout>
        <Breadcrumb title="Catalog / Brands"/>
        <div className="card h-100 p-0 radius-12">
            <div
                className="card-header bg-neutral-100 border-bottom py-16 px-24 d-flex align-items-center justify-content-between">
                <h6 className="text-lg mb-0">Brands</h6>
                <button className="btn btn-primary-600" onClick={openCreate}>
                    <i className="ri-add-line me-1"/> Add Brand
                </button>
            </div>

            <div className="card-body p-24">
                <TableDataLayer
                    title="Brand List"
                    headers={["#", "Logo", "Name", "Website", "Featured", "Status"]}
                    data={tableData}
                    onEdit={(row) => openEdit(row)}
                    onDelete={(row) => handleDelete(row.id)}
                    rowClassName="hover-row"
                />
            </div>
        </div>

        {/* Modal Section */}
        {modalOpen && (<>
            <div className="modal-backdrop fade show"></div>
            <div
                className="modal fade show d-block"
                tabIndex="-1"
                role="dialog"
                style={{
                    zIndex: 1050, display: "flex", alignItems: "center", justifyContent: "center",
                }}
            >
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content radius-12 shadow-lg">
                        <div className="modal-header text-white">
                            <h6 className="modal-title mb-0">
                                {current?._id ? "Edit Brand" : "Add Brand"}
                            </h6>
                            <button
                                type="button"
                                className="btn-close btn-close-white"
                                onClick={() => dispatch(closeModal())}
                            ></button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="row g-3">
                                    {/* Name */}
                                    <div className="col-md-6">
                                        <label className="form-label">Brand Name</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={form.name || ""}
                                            onChange={(e) => dispatch(setFormField({
                                                field: "name", value: e.target.value
                                            }))}
                                            required
                                        />
                                    </div>

                                    {/* Slug */}
                                    <div className="col-md-6">
                                        <label className="form-label">Slug</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={form.slug || ""}
                                            onChange={(e) => dispatch(setFormField({
                                                field: "slug", value: e.target.value
                                            }))}
                                        />
                                    </div>

                                    {/* Logo Upload */}
                                    <div className="col-md-6">
                                        <label className="form-label">Brand Logo</label>
                                        <div className="d-flex align-items-center gap-3 flex-wrap">
                                            {previewImage && (<div
                                                className="position-relative h-120-px w-120-px border radius-8 overflow-hidden bg-neutral-50">
                                                <button
                                                    type="button"
                                                    className="uploaded-img__remove position-absolute top-0 end-0 text-danger bg-white rounded-circle border-0 p-1"
                                                    onClick={() => {
                                                        setPreviewImage("");
                                                        setFile(null);
                                                    }}
                                                >
                                                    <Icon icon="radix-icons:cross-2"/>
                                                </button>
                                                <img
                                                    className="w-100 h-100 object-fit-cover"
                                                    src={previewImage}
                                                    alt="Preview"
                                                    onError={(e) => (e.currentTarget.src = placeholderImage)}
                                                />
                                            </div>)}

                                            <label
                                                className="upload-file-multiple h-120-px w-120-px border radius-8 overflow-hidden border-dashed bg-neutral-50 d-flex align-items-center flex-column justify-content-center gap-1"
                                                htmlFor="upload-file"
                                            >
                                                <Icon
                                                    icon="solar:camera-outline"
                                                    className="text-xl text-secondary-light"
                                                />
                                                <span className="fw-semibold text-secondary-light">Upload</span>
                                                <input
                                                    id="upload-file"
                                                    type="file"
                                                    hidden
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    {/* Description (optional - removed from table) */}

                                    {/* Website */}
                                    <div className="col-md-6">
                                        <label className="form-label">Website (URL)</label>
                                        <input
                                            type="url"
                                            className="form-control"
                                            value={form.website || ""}
                                            onChange={(e) => dispatch(setFormField({
                                                field: "website", value: e.target.value
                                            }))}
                                        />
                                    </div>

                                    {/* Switches */}
                                    <div className="col-12 d-flex justify-content-between mt-3">
                                        <div className="form-switch d-flex align-items-center gap-3">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                role="switch"
                                                checked={!!form.status}
                                                onChange={(e) => dispatch(setFormField({
                                                    field: "status", value: e.target.checked
                                                }))}
                                            />
                                            <label
                                                className="form-check-label text-secondary-light">Active</label>
                                        </div>

                                        <div className="form-switch d-flex align-items-center gap-3">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                role="switch"
                                                checked={!!form.isFeatured}
                                                onChange={(e) => dispatch(setFormField({
                                                    field: "isFeatured", value: e.target.checked
                                                }))}
                                            />
                                            <label
                                                className="form-check-label text-secondary-light">Featured</label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-neutral-400"
                                    onClick={() => dispatch(closeModal())}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary-600">
                                    {current?._id ? "Update Brand" : "Create Brand"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>)}

        <ToastContainer position="top-right" autoClose={2000}/>
    </MasterLayout>);
};

export default BrandsPage;
