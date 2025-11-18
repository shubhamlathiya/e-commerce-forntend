import React, {useEffect, useMemo, useState} from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import TableDataLayer from "../../components/TableDataLayer";
import Swal from "sweetalert2";
import {toast, ToastContainer} from "react-toastify";
import {useDispatch, useSelector} from "react-redux";
import {
    getAllCategories,
    getCategoryTree,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    openCreateModal,
    openEditModal,
    closeModal,
    setFormField,
    resetForm,
} from "../../features/catalog/categoriesSlice";

// Helper: build slug from name
const toSlug = (str = "") => str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, " ")
    .replace(/-+/g, " ");

// Helper: flatten category tree into options with path labels
const flattenTreeWithPaths = (tree, path = []) => {
    const out = [];
    (tree || []).forEach((node) => {
        const currentPath = [...path, node.name];
        out.push({id: node._id || node.id, label: currentPath.join(" > ")});
        if (Array.isArray(node.children) && node.children.length) {
            out.push(...flattenTreeWithPaths(node.children, currentPath));
        }
    });
    return out;
};

const CategoriesPage = () => {
    const dispatch = useDispatch();
    const {
        items = [], categoryTree = [], form = {
            name: "",
            slug: "",
            parentId: "",
            icon: "",
            image: "",
            status: true,
            isFeatured: false,
            sortOrder: 0,
            metaTitle: "",
            metaDescription: "",
        }, modalOpen = false, current = null, page: slicePage = 1, limit: sliceLimit = 10, totalPages = 1,
    } = useSelector((s) => s.categories || {});

    const [page, setPage] = useState(Number(slicePage) || 1);
    const limit = Number(sliceLimit) || 10;
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("list"); // 'list' | 'tree'
    const [userEditedSlug, setUserEditedSlug] = useState(false);
    const [iconFile, setIconFile] = useState(null);
    const [imageFile, setImageFile] = useState(null);

    const parentOptions = useMemo(() => [{
        id: "", label: "None"
    }, ...flattenTreeWithPaths(categoryTree)], [categoryTree]);

    useEffect(() => {
        dispatch(getAllCategories({page, limit}));
        dispatch(getCategoryTree());
    }, [dispatch, page, limit]);

    useEffect(() => {
        if (slicePage && slicePage !== page) setPage(Number(slicePage));
    }, [slicePage]);

    const handleSearch = () => {
        dispatch(getAllCategories({page: 1, limit, search}));
    };

    const handleSubmit = async (e) => {
        e?.preventDefault?.();
        const hasFiles = !!iconFile || !!imageFile;
        let payload;
        if (hasFiles) {
            payload = new FormData();
            payload.append("name", (form.name || "").trim());
            if ((form.slug || "").trim()) payload.append("slug", (form.slug || "").trim());
            if (form.parentId) payload.append("parentId", form.parentId);
            payload.append("status", (!!form.status).toString());
            payload.append("isFeatured", (!!form.isFeatured).toString());
            payload.append("sortOrder", String(Number(form.sortOrder) || 0));
            if ((form.metaTitle || "").trim()) payload.append("metaTitle", (form.metaTitle || "").trim());
            if ((form.metaDescription || "").trim()) payload.append("metaDescription", (form.metaDescription || "").trim());
            if (iconFile) payload.append("icon", iconFile);
            else if ((form.icon || "").trim()) payload.append("icon", (form.icon || "").trim());
            if (imageFile) payload.append("image", imageFile);
            else if ((form.image || "").trim()) payload.append("image", (form.image || "").trim());
        } else {
            payload = {
                name: (form.name || "").trim(),
                slug: (form.slug || "").trim() || undefined,
                parentId: form.parentId || undefined,
                icon: (form.icon || "").trim() || undefined,
                image: (form.image || "").trim() || undefined,
                status: !!form.status,
                isFeatured: !!form.isFeatured,
                sortOrder: Number(form.sortOrder) || 0,
                metaTitle: (form.metaTitle || "").trim() || undefined,
                metaDescription: (form.metaDescription || "").trim() || undefined,
            };
        }

        try {
            if (current?._id || current?.id) {
                const id = current._id || current.id;
                await dispatch(updateCategory({id, data: payload})).unwrap();
                toast.success("🔄 Category updated");
            } else {
                await dispatch(createCategory(payload)).unwrap();
                toast.success("✅ Category created");
            }
            dispatch(getAllCategories({page, limit}));
            dispatch(getCategoryTree());
            dispatch(closeModal());
            dispatch(resetForm());
            setUserEditedSlug(false);
            setIconFile(null);
            setImageFile(null);
        } catch (err) {
            toast.error("❌ Error saving category");
        }
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: "Delete Category",
            text: "Are you sure you want to delete this category?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#dc3545",
            customClass: {
                title: "text-md fw-semibold",
                htmlContainer: "text-sm",
                confirmButton: "btn btn-sm btn-danger",
                cancelButton: "btn btn-sm btn-light",
                popup: "p-3 rounded-3",
            },
        }).then(async (result) => {
            if (!result.isConfirmed) return;
            try {
                await dispatch(deleteCategory(id)).unwrap();
                toast.info("🗑️ Category deleted");
                dispatch(getAllCategories({page, limit}));
                dispatch(getCategoryTree());
            } catch (err) {
                toast.error("❌ Error deleting category");
            }
        });
    };

    const openCreate = () => {
        dispatch(resetForm());
        dispatch(openCreateModal());
        setUserEditedSlug(false);
    };

    const openEdit = async (cat) => {
        const id = cat?._id || cat?.id;

        if (!id) {
            // Fallback: open with provided row data
            dispatch(openEditModal({
                ...cat,
                status: !!cat.status,
                isFeatured: !!cat.isFeatured,
            }));
            setUserEditedSlug(true); // prevent auto-overwriting slug when editing
            return;
        }

        try {
            const result = await dispatch(getCategoryById(id)).unwrap();
            const full = result?.data || result || {};
            dispatch(
                openEditModal({
                    ...full,
                    status: !!full.status,
                    isFeatured: !!full.isFeatured,
                })
            );
            setUserEditedSlug(true);
        } catch (err) {
            // If API fails, still open modal with available data
            dispatch(openEditModal({
                ...cat,
                status: !!cat.status,
                isFeatured: !!cat.isFeatured,
            }));
            setUserEditedSlug(true);
        }
    };

    const renderTree = (nodes) => (
        <ul className="category-tree list-unstyled ps-3 position-relative">
            {(nodes || []).map((node) => (
                <li
                    key={node._id || node.id}
                    className="position-relative ps-3 mb-2"
                    style={{
                        borderLeft: "1px solid #dee2e6",
                        marginLeft: "12px",
                    }}
                >
                    <div
                        className="d-flex align-items-center gap-2 py-1 px-2 rounded hover-bg-light"
                        style={{
                            backgroundColor: "#f9fafb",
                            transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = "#eef2f6")
                        }
                        onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = "#f9fafb")
                        }
                    >
                        <i
                            className="ri-folder-2-line text-warning"
                            style={{fontSize: "1.1rem"}}
                        />
                        <span className="fw-medium flex-grow-1">{node.name}</span>

                        <button
                            className="btn btn-sm btn-light text-success border-0"
                            onClick={() => openEdit(node)}
                            aria-label="Edit"
                        >
                            <i className="ri-edit-line"/>
                        </button>
                        <button
                            className="btn btn-sm btn-light text-danger border-0"
                            onClick={() => handleDelete(node._id || node.id)}
                            aria-label="Delete"
                        >
                            <i className="ri-delete-bin-line"/>
                        </button>
                    </div>

                    {Array.isArray(node.children) && node.children.length > 0 && (
                        <div className="ms-3 mt-1">{renderTree(node.children)}</div>
                    )}
                </li>
            ))}
        </ul>
    );

    // Image base URL and resolver for relative backend paths
    const IMG_BASE = ("http://localhost:8000").replace(/\/$/, "");
    const placeholder = "/assets/images/user-list/user-list1.png";
    const resolveImageUrl = (p) => {
        if (!p) return placeholder;
        const s = String(p);
        if (s.startsWith("http")) return s;
        return `${IMG_BASE}${s.startsWith("/") ? s : `/${s}`}`;
    };

    return (<MasterLayout>
        <Breadcrumb title="Catalog / Categories"/>
        <div className="card h-100 p-0 radius-12">
            <div
                className="card-header bg-neutral-100 border-bottom py-16 px-24 d-flex align-items-center justify-content-between">
                <div>
                    <h6 className="text-lg mb-0">Categories</h6>
                </div>
                <div className="d-flex align-items-center gap-8">
                    <div className="btn-group" role="group">
                        <button
                            className={`btn btn-sm ${activeTab === "list" ? "btn-primary-600" : "btn-neutral-400"}`}
                            onClick={() => setActiveTab("list")}
                        >
                            List
                        </button>
                        <button
                            className={`btn btn-sm ${activeTab === "tree" ? "btn-primary-600" : "btn-neutral-400"}`}
                            onClick={() => setActiveTab("tree")}
                        >
                            Tree View
                        </button>
                    </div>
                    <button className="btn btn-primary-600" onClick={openCreate}>
                        <i className="ri-add-line me-1"/> Add Category
                    </button>
                </div>
            </div>

            <div className="card-body p-24">
                {activeTab === "list" ? (<>
                    <TableDataLayer
                        title="Category List"
                        headers={["#", "Icon", "Image", "Name", "Slug", "Parent", "Status", "Featured"]}
                        data={items.map((c, i) => {
                            const statusBadge = c.status
                                ? `<span class='bg-success-focus text-success-main px-24 py-4 rounded-pill fw-medium text-sm'>Active</span>`
                                : `<span class='bg-danger-focus text-danger-main px-24 py-4 rounded-pill fw-medium text-sm'>Inactive</span>`;

                            const placeholder = "/assets/images/user-list/user-list1.png";
                            const iconEl = (
                                <img
                                    src={c.icon ? resolveImageUrl(c.icon) : placeholder}
                                    alt="Icon"
                                    style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 8 }}
                                    onError={(e) => (e.currentTarget.src = placeholder)}
                                />
                            );
                            const imageEl = (
                                <img
                                    src={c.image ? resolveImageUrl(c.image) : placeholder}
                                    alt="Image"
                                    style={{ width: 56, height: 40, objectFit: "cover", borderRadius: 8 }}
                                    onError={(e) => (e.currentTarget.src = placeholder)}
                                />
                            );

                            return {
                                "#": (page - 1) * limit + i + 1,
                                icon: iconEl,
                                image: imageEl,
                                name: c.name,
                                slug: c.slug,
                                parent: c.parent?.name || c.parentName || "Root",
                                status: statusBadge,
                                featured: c.isFeatured
                                    ? "<span class='bg-success-focus text-success-main px-24 py-4 rounded-pill fw-medium text-sm'>Yes</span>"
                                    : "<span class='bg-warning-focus text-warning-main px-24 py-4 rounded-pill fw-medium text-sm'>No</span>",
                                id: c._id, // include for edit context
                            };
                        })}
                        onView={(row) => {
                            setActiveTab("tree");
                            // Optionally, could focus to the node in tree view
                        }}
                        onEdit={(row) => openEdit(row)}
                        onDelete={(row) => handleDelete(row.id)}
                    />

                </>) : (<div>
                    {renderTree(categoryTree)}
                </div>)}
            </div>
        </div>

        {modalOpen && (<>
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
                    <div className="modal-content radius-12 shadow-lg border-0">
                        {/* Header */}
                        <div className="modal-header border-0 pb-0">
                            <h5 className="modal-title fw-bold">
                                {current?._id ? "Edit Category" : "Add Category"}
                            </h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={() => dispatch(closeModal())}
                            />
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body pt-3">
                                <div className="container-fluid">
                                    <div className="row g-4">
                                        {/* Left Column */}
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label fw-semibold">Name</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={form.name || ""}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        dispatch(setFormField({ field: "name", value: val }));
                                                        if (!userEditedSlug) {
                                                            dispatch(
                                                                setFormField({ field: "slug", value: toSlug(val) })
                                                            );
                                                        }
                                                    }}
                                                    required
                                                />
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label fw-semibold">Slug</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={form.slug || ""}
                                                    onChange={(e) => {
                                                        setUserEditedSlug(true);
                                                        dispatch(
                                                            setFormField({ field: "slug", value: e.target.value })
                                                        );
                                                    }}
                                                />
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label fw-semibold">
                                                    Parent Category
                                                </label>
                                                <select
                                                    className="form-select"
                                                    value={form.parentId || ""}
                                                    onChange={(e) =>
                                                        dispatch(
                                                            setFormField({ field: "parentId", value: e.target.value })
                                                        )
                                                    }
                                                >
                                                    {parentOptions.map((opt) => (
                                                        <option key={opt.id || "none"} value={opt.id || ""}>
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label fw-semibold">Icon (upload)</label>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="form-control"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0] || null;
                                                        setIconFile(file);
                                                    }}
                                                />
                                                {(iconFile || form.icon) && (
                                                    <div className="mt-2 d-flex align-items-center gap-8">
                                                        {iconFile ? (
                                                            <img
                                                                src={URL.createObjectURL(iconFile)}
                                                                alt="Icon preview"
                                                                style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8 }}
                                                                onError={(e) => (e.currentTarget.src = placeholder)}
                                                            />
                                                        ) : (
                                                            form.icon ? (
                                                                <img
                                                                    src={resolveImageUrl(form.icon)}
                                                                    alt="Icon"
                                                                    style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8 }}
                                                                    onError={(e) => (e.currentTarget.src = placeholder)}
                                                                />
                                                            ) : null
                                                        )}
                                                        <span className="text-muted small">Icon Preview</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mb-3">
                                                <div className="form-switch switch-purple d-flex align-items-center gap-3">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        role="switch"
                                                        id="category-active-switch"
                                                        checked={!!form.status}
                                                        onChange={(e) =>
                                                            dispatch(setFormField({ field: "status", value: e.target.checked }))
                                                        }
                                                    />
                                                    <label
                                                        className="form-check-label line-height-1 fw-medium text-secondary-light"
                                                        htmlFor="category-active-switch"
                                                    >
                                                        Active
                                                    </label>
                                                </div>
                                            </div>

                                            <div className="mb-3">
                                                <div className="form-switch switch-purple d-flex align-items-center gap-3">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        role="switch"
                                                        id="category-featured-switch"
                                                        checked={!!form.isFeatured}
                                                        onChange={(e) =>
                                                            dispatch(
                                                                setFormField({ field: "isFeatured", value: e.target.checked })
                                                            )
                                                        }
                                                    />
                                                    <label
                                                        className="form-check-label line-height-1 fw-medium text-secondary-light"
                                                        htmlFor="category-featured-switch"
                                                    >
                                                        Featured
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column */}
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label fw-semibold">Category Image (upload)</label>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="form-control"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0] || null;
                                                        setImageFile(file);
                                                    }}
                                                />
                                                {(imageFile || form.image) && (
                                                    <div className="mt-2 text-center">
                                                        <img
                                                            src={imageFile ? URL.createObjectURL(imageFile) : resolveImageUrl(form.image)}
                                                            alt="Preview"
                                                            style={{
                                                                maxWidth: 120,
                                                                maxHeight: 120,
                                                                borderRadius: 8,
                                                                objectFit: "cover",
                                                            }}
                                                            onError={(e) => (e.currentTarget.src = placeholder)}
                                                        />
                                                        <div className="small text-muted mt-1">Image Preview</div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label fw-semibold">Sort Order</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={form.sortOrder}
                                                    disabled
                                                />
                                                <div className="small text-muted mt-1">Auto-calculated</div>
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label fw-semibold">Meta Title</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={form.metaTitle || ""}
                                                    onChange={(e) =>
                                                        dispatch(
                                                            setFormField({ field: "metaTitle", value: e.target.value })
                                                        )
                                                    }
                                                />
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label fw-semibold">Meta Description</label>
                                                <textarea
                                                    className="form-control"
                                                    rows={3}
                                                    value={form.metaDescription || ""}
                                                    onChange={(e) =>
                                                        dispatch(
                                                            setFormField({
                                                                field: "metaDescription",
                                                                value: e.target.value,
                                                            })
                                                        )
                                                    }
                                                />
                                                <div
                                                    className="text-end text-secondary-light mt-1"
                                                    style={{ fontSize: 12 }}
                                                >
                                                    {String(form.metaDescription || "").length} chars
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="modal-footer border-0 pt-0">
                                <button
                                    type="button"
                                    className="btn btn-light"
                                    onClick={() => dispatch(closeModal())}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary px-4">
                                    {current?._id ? "Update" : "Create"}
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

export default CategoriesPage;

