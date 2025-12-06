import React, { useEffect, useMemo, useState } from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import TableDataLayer from "../../components/TableDataLayer";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { getTabCategories, deleteTabCategory, updateTabCategory } from "../../api/catalogApi";

const TabCategoriesPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("sortOrder");
  const [sortOrder, setSortOrder] = useState("asc");
  const [loading, setLoading] = useState(false);

  const placeholder = "/assets/images/user-list/user-list1.png";
  const IMG_BASE = (process.env.REACT_APP_API_BASE_URL).replace(/\/$/, "");

  const resolveImageUrl = (p) => {
    if (!p) return placeholder;
    const s = String(p);
    if (s.startsWith("http")) return s;
    if (s.startsWith("/")) return `${IMG_BASE}${s}`;
    return `${IMG_BASE}/${s}`;
  };

  const fetchTabs = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search: search || undefined,
        status: statusFilter || undefined,
        sortBy,
        sortOrder
      };

      const res = await getTabCategories(params);

      if (res.success) {
        setItems(res.data || []);
        setPage(res.meta?.page || page);
        setLimit(res.meta?.limit || limit);
        setTotalPages(res.meta?.totalPages || 1);
        setTotal(res.meta?.total || 0);
      } else {
        toast.error(res.message || "Failed to load tab categories");
        setItems([]);
      }

    } catch (e) {
      console.error("Failed to load tabs:", e);
      toast.error(e.response?.data?.message || "Failed to load tab categories");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTabs();
  }, [page, limit, statusFilter, sortBy, sortOrder]);

  const onSearch = () => {
    setPage(1);
    fetchTabs();
  };

  const handleDelete = async (row) => {
    if (!window.confirm("Are you sure you want to delete this tab category?")) {
      return;
    }
    try {
      await deleteTabCategory(row.id);
      toast.success("Tab category deleted successfully");
      fetchTabs();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error.response?.data?.message || "Failed to delete tab category");
    }
  };

  const handleToggleStatus = async (row) => {
    try {
      const newStatus = !row.isActive;
      await updateTabCategory(row.id, { status: newStatus });
      toast.success(`Tab category ${newStatus ? 'activated' : 'deactivated'} successfully`);
      fetchTabs();
    } catch (error) {
      console.error("Toggle status error:", error);
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStatusBadge = (isActive) => {
    const className = isActive
        ? 'bg-success-focus text-success-main px-24 py-4 rounded-pill fw-medium text-sm'
        : 'bg-danger-focus text-danger-main px-24 py-4 rounded-pill fw-medium text-sm';
    const text = isActive ? 'Active' : 'Inactive';

    return `<span class="${className}">${text}</span>`;
  };

  // New function to render color preview
  const renderColorPreview = (color) => {
    if (!color) return 'N/A';
    return `
      <div class="d-flex align-items-center gap-2">
        <div style="width: 20px; height: 20px; background-color: ${color}; border-radius: 4px; border: 1px solid #ddd;"></div>
        <span>${color}</span>
      </div>
    `;
  };

  return (
      <MasterLayout>
        <Breadcrumb title="Catalog / Tab Categories" />
        <div className="card h-100 p-0 radius-12">
          <div className="card-header bg-neutral-100 border-bottom py-16 px-24 d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-8 flex-wrap">
              <h6 className="text-lg mb-0">Tab Categories</h6>
              <input
                  className="form-control"
                  style={{ maxWidth: 260 }}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or slug"
                  onKeyPress={(e) => e.key === 'Enter' && onSearch()}
              />
              <button className="btn btn-light" onClick={onSearch}>Search</button>
              <select
                  className="form-select"
                  style={{ maxWidth: 160 }}
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <select
                  className="form-select"
                  style={{ maxWidth: 160 }}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="sortOrder">Sort by Order</option>
                <option value="name">Sort by Name</option>
                <option value="createdAt">Sort by Date</option>
              </select>
              <select
                  className="form-select"
                  style={{ maxWidth: 140 }}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="asc">Asc</option>
                <option value="desc">Desc</option>
              </select>
            </div>
            <div className="d-flex align-items-center gap-8">
              <button
                  className="btn btn-primary-600"
                  onClick={() => navigate("/tab-categories/create")}
              >
                Add New Tab
              </button>
            </div>
          </div>

          <div className="card-body p-24">
            {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
            ) : (
                <>
                  <div className="mb-3">
                    <span className="text-muted">Total: {total} tab categories</span>
                  </div>

                  <TableDataLayer
                      title="Tab Categories"
                      headers={["#", "Icon", "Name", "Slug", "Categories", "Colors", "Order", "Status", "Created", "Actions"]}
                      data={items.map((t, i) => {
                        const iconEl = (
                            <img
                                src={t.icon ? resolveImageUrl(t.icon) : placeholder}
                                alt="Icon"
                                style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 8 }}
                                onError={(e) => (e.currentTarget.src = placeholder)}
                            />
                        );

                        const statusBadge = renderStatusBadge(t.isActive);

                        // Categories count
                        const catsCount = Array.isArray(t.categories) ? t.categories.length : 0;

                        // Color previews
                        const colorsHtml = `
                    <div class="d-flex flex-column gap-1">
                      <div class="d-flex align-items-center gap-2">
                        <div style="width: 12px; height: 12px; background-color: ${t.color || '#4CAF72'}; border-radius: 2px;"></div>
                        <small>${t.color || '#4CAF72'}</small>
                      </div>
                      <div class="d-flex align-items-center gap-2">
                        <div style="width: 12px; height: 12px; background-color: ${t.headerColor || '#4CAF72'}; border-radius: 2px;"></div>
                        <small>${t.headerColor || '#4CAF72'}</small>
                      </div>
                      <div class="d-flex align-items-center gap-2">
                        <div style="width: 12px; height: 12px; background-color: ${t.lightColor || '#CFF5DE'}; border-radius: 2px;"></div>
                        <small>${t.lightColor || '#CFF5DE'}</small>
                      </div>
                    </div>
                  `;

                        return {
                          "#": (page - 1) * limit + i + 1,
                          icon: iconEl,
                          name: t.name || 'N/A',
                          slug: t.slug || 'N/A',
                          categories: `${catsCount} categories`,
                          colors: colorsHtml,
                          order: t.sortOrder || 0,
                          status: statusBadge,
                          created: formatDate(t.createdAt),
                          id: t.id || t._id,
                          isActive: t.isActive,
                          originalData: t
                        };
                      })}
                      onEdit={(row) => navigate(`/tab-categories/${row.id}/edit`)}
                      onDelete={(row) => handleDelete(row)}
                      onToggle={(row) => handleToggleStatus(row)}
                      showToggle={true}
                      showEdit={true}
                      showDelete={true}
                  />

                  {/* Pagination */}
                  {totalPages > 1 && (
                      <div className="d-flex align-items-center justify-content-between mt-4">
                        <div className="d-flex gap-2">
                          <button
                              className="btn btn-light"
                              disabled={page <= 1}
                              onClick={() => setPage(p => Math.max(1, p - 1))}
                          >
                            Previous
                          </button>
                          <button
                              className="btn btn-light"
                              disabled={page >= totalPages}
                              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          >
                            Next
                          </button>
                        </div>
                        <div className="d-flex align-items-center gap-3">
                          <span>Page {page} of {totalPages}</span>
                          <select
                              className="form-select"
                              style={{ maxWidth: 100 }}
                              value={limit}
                              onChange={(e) => {
                                setLimit(Number(e.target.value));
                                setPage(1);
                              }}
                          >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                          </select>
                          <span>per page</span>
                        </div>
                      </div>
                  )}
                </>
            )}
          </div>
        </div>

        <ToastContainer position="top-right" autoClose={3000} />
      </MasterLayout>
  );
};

export default TabCategoriesPage;