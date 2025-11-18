import React, {useEffect, useState} from "react";
import Breadcrumb from "../../components/Breadcrumb";
import TableDataLayer from "../../components/TableDataLayer";
import {toast} from "react-hot-toast";
import Swal from "sweetalert2";
import Select from "react-select";
// Removed status/search filter actions per new spec
import flashApi from "../../api/flashSalesApi";
import {listVariants} from "../../api/variantsApi";
import MasterLayout from "../../masterLayout/MasterLayout";
import ProductApi from "../../api/productApi";

const FlashSalesPage = () => {
  // Removed status/search from global state per new spec
  const [list, setList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [variantsMap, setVariantsMap] = useState({}); // { [productId]: [{value,label}] }

  // react-select performs its own filtering; use raw productOptions directly

  const [form, setForm] = useState({
    id: undefined,
    title: "",
    products: [{productId: "", variantId: "", flashPrice: "", stockLimit: ""}],
    startDate: "",
    endDate: "",
    status: "scheduled", // scheduled | active | ended
  });

  const resetForm = () => {
    setForm({
      id: undefined,
      title: "",
      products: [{productId: "", variantId: "", flashPrice: "", stockLimit: ""}],
      startDate: "",
      endDate: "",
      status: "scheduled",
    });
  };

  const loadProducts = () => {
    return ProductApi.getProducts({page: 1, limit: 100})
        .then((data) => {
          const prodList = Array.isArray(data?.data.items) ? data.data.items : Array.isArray(data) ? data : [];
          setProducts(prodList);
          if (Array.isArray(prodList)) {
            setProductOptions(
                prodList.map((p) => ({
                  value: p._id,
                  label: p.name || p.title || p.sku || p._id,
                  thumbnail: p.thumbnail || p.image || (Array.isArray(p.images) && p.images[0]) || "",
                }))
            );
          } else {
            setProductOptions([]);
          }
        })
        .catch(() => {
          setProductOptions([]);
        });
  };

  const fetchFlashSales = (params = {}) => {
    setLoadingList(true);
    setErrorMsg(null);
    return flashApi
        .listFlashSales(params)
        .then((res) => {
          if (res && res.success) {
            const data = Array.isArray(res.data) ? res.data : [];
            setList(data);
          } else if (Array.isArray(res)) {
            setList(res);
          } else if (res && Array.isArray(res.items)) {
            setList(res.items);
          } else {
            setList([]);
            toast.error("Failed to load flash sales");
          }
        })
        .catch(() => {
          setList([]);
          setErrorMsg("Server error");
          toast.error("Server error");
        })
        .finally(() => setLoadingList(false));
  };

  useEffect(() => {
    fetchFlashSales();
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Countdown timer state: updates every second when any active sale exists
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const anyActive = (Array.isArray(list) ? list : []).some((it) => getComputedStatus(it) === "active");
    if (!anyActive) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [list]);

  const getComputedStatus = (it) => {
    const start = it.startDate ? new Date(it.startDate) : null;
    const end = it.endDate ? new Date(it.endDate) : null;
    const declared = it.status || form.status;
    if (end && Date.now() > end.getTime()) return "ended";
    if (start && end && Date.now() >= start.getTime() && Date.now() <= end.getTime()) return "active";
    if (start && Date.now() < start.getTime()) return "scheduled";
    return declared || "scheduled";
  };

  // Optional timeLeft for active status (hidden from table per new spec)
  const timeLeft = (endDate) => {
    if (!endDate) return "";
    const diff = new Date(endDate).getTime() - now;
    if (diff <= 0) return "00:00:00";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  const tableHeaders = ["Title", "Products", "Flash Price", "Stock Limit", "Start Date", "End Date", "Status"];

  const resolveProductInfoHtml = (pid) => {
    const p = products.find((x) => x._id === pid);
    const name = p?.name || p?.title || pid;
    const img = p?.thumbnail || p?.image || (Array.isArray(p?.images) && p?.images[0]);
    if (img) {
      return `<div class="d-flex align-items-center gap-8"><img src="${img}" alt="thumb" style="width:20px;height:20px;object-fit:cover;border-radius:4px;"/><span>${name}</span></div>`;
    }
    return name;
  };

  const tableData = (Array.isArray(list) ? list : []).map((it) => {
    const status = getComputedStatus(it);
    const badge = status === "active"
        ? `<span class='px-24 py-4 rounded-pill fw-medium text-sm bg-success-focus text-success-main'>active</span>`
        : status === "scheduled"
            ? `<span class='px-24 py-4 rounded-pill fw-medium text-sm bg-warning-focus text-warning-main'>scheduled</span>`
            : `<span class='px-24 py-4 rounded-pill fw-medium text-sm bg-neutral-200 text-neutral-700'>ended</span>`;

    const entries = Array.isArray(it.products) ? it.products : [];
    const firstTwo = entries.slice(0, 2);
    const namesHtml = firstTwo
        .map((e) => resolveProductInfoHtml(e.productId || e.product))
        .join(", ");
    const moreCount = entries.length > 2 ? entries.length - 2 : 0;
    const productsCell = moreCount > 0 ? `${namesHtml} + ${moreCount} more` : namesHtml || "-";

    const first = entries[0] || {};
    const flashPriceCell = typeof first.flashPrice !== "undefined" ? String(first.flashPrice) : "-";
    const stockLimitCell = typeof first.stockLimit !== "undefined" ? String(first.stockLimit) : "-";

    return {
      title: it.title || "",
      products: productsCell,
      flashprice: flashPriceCell,
      stocklimit: stockLimitCell,
      startdate: it.startDate ? new Date(it.startDate).toLocaleString() : "",
      enddate: it.endDate ? new Date(it.endDate).toLocaleString() : "",
      status: badge,
      _id: it._id,
    };
  });

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (row) => {
    const target = (Array.isArray(list) ? list : []).find((x) => x._id === row._id);
    if (!target) return;
    const entries = Array.isArray(target.products) ? target.products : (Array.isArray(target.items) ? target.items : []);
    setForm({
      id: target._id,
      title: target.title || "",
      products: entries.map((e) => ({
        productId: String(e.productId || e.product || e.id || ""),
        variantId: String(e.variantId || e.variant || e.vid || ""),
        flashPrice: e.flashPrice ?? "",
        stockLimit: e.stockLimit ?? "",
      })),
      startDate: target.startDate ? String(target.startDate).slice(0, 16) : "",
      endDate: target.endDate ? String(target.endDate).slice(0, 16) : "",
      status: target.status || getComputedStatus(target),
    });
    // Prefetch variant options for existing products so variant selects are populated
    entries.forEach((e) => {
      const pid = e.productId || e.product || e.id;
      if (pid && !variantsMap[pid]) {
        listVariants({page: 1, limit: 200, productId: pid})
            .then((data) => {
              const vList = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
              const opts = (Array.isArray(vList) ? vList : []).map((v) => ({
                value: v._id,
                label: v.name || v.sku || v._id
              }));
              setVariantsMap((prev) => ({...prev, [pid]: opts}));
            })
            .catch(() => {
            });
      }
    });
    setShowModal(true);
  };

  const [showViewModal, setShowViewModal] = useState(false);
  const [viewItem, setViewItem] = useState(null);

  const openView = (row) => {
    const target = (Array.isArray(list) ? list : []).find((x) => x._id === row._id);
    if (!target) return;
    const entries = Array.isArray(target.products) ? target.products : [];
    // Ensure variants are loaded for each product in the sale
    entries.forEach((e) => {
      const pid = e.productId || e.product;
      if (pid && !variantsMap[pid]) {
        listVariants({page: 1, limit: 200, productId: pid})
            .then((data) => {
              const vList = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
              const opts = (Array.isArray(vList) ? vList : []).map((v) => ({
                value: v._id,
                label: v.name || v.sku || v._id
              }));
              setVariantsMap((prev) => ({...prev, [pid]: opts}));
            })
            .catch(() => {
            });
      }
    });
    setViewItem(target);
    setShowViewModal(true);
  };

  const handleDelete = (row) => {
    const target = (Array.isArray(list) ? list : []).find((x) => x._id === row._id);
    if (!target) return;
    Swal.fire({
      title: "Delete this flash sale?",
      text: `Title: ${target.title || "(untitled)"}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it",
      customClass: {
        title: "text-md fw-semibold",
        htmlContainer: "text-sm",
        confirmButton: "btn btn-sm btn-danger",
        cancelButton: "btn btn-sm btn-light",
        popup: "p-3 rounded-3",
      },
    }).then((result) => {
      if (!result.isConfirmed) return;
      flashApi
          .deleteFlashSale(target._id)
          .then((res) => {
            if (res && res.success) {
              toast.success("Flash sale deleted");
              fetchFlashSales();
            } else {
              toast.error("Failed to delete flash sale");
            }
          })
          .catch(() => toast.error("Server error"));
    });
  };

  const validateForm = () => {
    const errs = [];
    if (!String(form.title).trim()) errs.push("Title is required");
    const validItems = Array.isArray(form.products) && form.products.length > 0 && form.products.every((it) => String(it.productId).trim() && Number(it.flashPrice) >= 0 && Number(it.stockLimit) >= 0);
    if (!validItems) errs.push("Add at least one product with valid flash price and stock limit");
    if (!form.startDate || !form.endDate) errs.push("Start and End dates are required");
    if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate)) errs.push("End date must be after start date");
    if (!form.status || !["scheduled", "active", "ended"].includes(form.status)) errs.push("Status must be scheduled, active, or ended");
    if (errs.length) {
      errs.forEach((e) => toast.error(e));
      return false;
    }
    return true;
  };

  const submitForm = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    const payload = {
      title: String(form.title).trim(),
      products: (Array.isArray(form.products) ? form.products : []).map((it) => ({
        productId: it.productId,
        variantId: it.variantId || undefined,
        flashPrice: Number(it.flashPrice),
        stockLimit: Number(it.stockLimit)
      })),
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
      status: form.status,
    };
    const refresh = () => fetchFlashSales();
    if (form.id) {
      flashApi
          .updateFlashSale(form.id, payload)
          .then((res) => {
            if (res && res._id) {
              toast.success("Flash sale updated");
            } else if (res && res.success) {
              toast.success("Flash sale updated");
            } else {
              toast.error("Failed to update flash sale");
              return;
            }
            setShowModal(false);
            resetForm();
            refresh();
          })
          .catch(() => toast.error("Server error"));
    } else {
      flashApi
          .createFlashSale(payload)
          .then((res) => {
            if (res && (res._id || res.success)) {
              toast.success("Flash sale created");
            } else {
              toast.error("Failed to create flash sale");
              return;
            }
            setShowModal(false);
            resetForm();
            refresh();
          })
          .catch(() => toast.error("Server error"));
    }
  };

  // Removed status filter and search handlers per new spec

  const addItemRow = () => {
    setForm({
      ...form,
      products: [...form.products, {productId: "", variantId: "", flashPrice: "", stockLimit: ""}]
    });
  };
  const updateItemRow = (idx, field, value) => {
    setForm((prev) => {
      const next = [...(Array.isArray(prev.products) ? prev.products : [])];
      next[idx] = {...(next[idx] || {productId: "", variantId: "", flashPrice: "", stockLimit: ""}), [field]: value};
      return {...prev, products: next};
    });
  };
  const removeItemRow = (idx) => {
    const next = form.products.filter((_, i) => i !== idx);
    setForm({
      ...form,
      products: next.length ? next : [{productId: "", variantId: "", flashPrice: "", stockLimit: ""}]
    });
  };

  const onProductSelect = (idx, productId) => {
    const pid = productId ? String(productId) : "";
    // Single functional update to avoid batched state overwrite
    setForm((prev) => {
      const next = [...(Array.isArray(prev.products) ? prev.products : [])];
      const row = {...(next[idx] || {productId: "", variantId: "", flashPrice: "", stockLimit: ""})};
      row.productId = pid;
      row.variantId = ""; // reset variant when product changes
      next[idx] = row;
      return {...prev, products: next};
    });
    if (!pid) return;
    if (!variantsMap[pid]) {
      listVariants({page: 1, limit: 200, productId: pid})
          .then((data) => {
            const vList = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
            const opts = (Array.isArray(vList) ? vList : []).map((v) => ({
              value: v._id,
              label: v.name || v.sku || v._id
            }));
            setVariantsMap((prev) => ({...prev, [pid]: opts}));
          })
          .catch(() => {
          });
    }
  };

  // const parseSelectMultiple = (e) => Array.from(e.target.selectedOptions).map((o) => o.value);

  return (
      <MasterLayout>
        <Breadcrumb title="Flash Sales"/>

        <div className="d-flex flex-wrap align-items-center justify-content-between mb-16 gap-8">
          <button className="btn btn-primary-600" onClick={openCreate}>
            <i className="ri-add-line me-1"/> New Flash Sale
          </button>
        </div>

        <div className="card">
          <div className="card-body">
            <div style={{overflowX: "auto"}}>
              {loadingList ? (
                  <div className="text-center py-24">Loading flash sales…</div>
              ) : (
                  <TableDataLayer
                      title="Flash Sales"
                      headers={tableHeaders}
                      data={tableData}
                      onView={(row) => openView(row)}
                      onEdit={(row) => openEdit(row)}
                      onDelete={(row) => handleDelete(row)}
                  />
              )}
            </div>
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
                  }}
              >
                <div className="modal-dialog modal-xl">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">{form.id ? "Edit" : "Create"} Flash Sale</h5>
                      <button type="button" className="btn-close" onClick={() => setShowModal(false)}/>
                    </div>

                    <form onSubmit={submitForm}>
                      <div className="modal-body">
                        <div className="row g-3">
                          <div className="col-md-12">
                            <label className="form-label">Title *</label>
                            <input type="text"
                                   className={`form-control ${!form.title?.trim() ? "is-invalid" : ""}`}
                                   value={form.title}
                                   onChange={(e) => setForm({...form, title: e.target.value})}
                                   required/>
                          </div>

                          <div className="col-md-12">
                            <hr/>
                            <h6 className="mb-0">Products</h6></div>
                          {(Array.isArray(form.products) ? form.products : []).map((it, idx) => (
                              <div className="col-md-12" key={idx}>
                                <div className="row g-2 align-items-end">
                                  <div className="col-md-4">
                                    <label className="form-label">Product *</label>
                                    <Select
                                        classNamePrefix="react-select"
                                        placeholder="Select product"
                                        isClearable
                                        isSearchable
                                        options={productOptions}
                                        value={productOptions.find((o) => String(o.value) === String(it.productId)) || null}
                                        onChange={(opt) => onProductSelect(idx, opt ? opt.value : "")}
                                    />
                                  </div>

                                  <div className="col-md-3">
                                    <label className="form-label">Variant</label>
                                    <Select
                                        classNamePrefix="react-select"
                                        placeholder="Select variant"
                                        isClearable
                                        isSearchable
                                        isDisabled={!it.productId}
                                        options={variantsMap[it.productId] || []}
                                        value={(variantsMap[it.productId] || []).find((o) => String(o.value) === String(it.variantId)) || null}
                                        onChange={(opt) => updateItemRow(idx, "variantId", opt ? opt.value : "")}
                                    />
                                  </div>

                                  <div className="col-md-2">
                                    <label className="form-label">Flash Price *</label>
                                    <input type="number" min={0.01} step="0.01"
                                           className="form-control" value={it.flashPrice}
                                           onChange={(e) => updateItemRow(idx, "flashPrice", e.target.value)}
                                           required/>
                                  </div>
                                  <div className="col-md-2">
                                    <label className="form-label">Stock Limit *</label>
                                    <input type="number" min={1} step="1"
                                           className="form-control"
                                           value={it.stockLimit}
                                           onChange={(e) => updateItemRow(idx, "stockLimit", e.target.value)}
                                           required/>
                                  </div>
                                  <div className="col-md-1">
                                    <button type="button" className="btn btn-neutral-400"
                                            onClick={() => removeItemRow(idx)}>
                                      <i className="ri-delete-bin-line"/>
                                    </button>
                                  </div>
                                </div>
                              </div>
                          ))}
                          <div className="col-md-12">
                            <button type="button" className="btn btn-light" onClick={addItemRow}>
                              <i className="ri-add-line me-1"/> Add Another Product
                            </button>
                          </div>

                          <div className="col-md-4">
                            <label className="form-label">Start Date *</label>
                            <input type="datetime-local" className="form-control"
                                   value={form.startDate}
                                   onChange={(e) => setForm({...form, startDate: e.target.value})}
                                   required/>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">End Date *</label>
                            <input type="datetime-local" className="form-control"
                                   value={form.endDate}
                                   onChange={(e) => setForm({...form, endDate: e.target.value})}
                                   required/>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Status *</label>
                            <select className="form-select" value={form.status}
                                    onChange={(e) => setForm({...form, status: e.target.value})}
                                    required>
                              <option value="scheduled">scheduled</option>
                              <option value="active">active</option>
                              <option value="ended">ended</option>
                            </select>
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
        {showViewModal && viewItem && (
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
                  }}
              >
                <div className="modal-dialog modal-lg">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">View Flash Sale</h5>
                      <button type="button" className="btn-close"
                              onClick={() => setShowViewModal(false)}/>
                    </div>
                    <div className="modal-body">
                      <div className="row g-3">
                        <div className="col-md-12">
                          <div className="d-flex align-items-center justify-content-between">
                            <h6 className="mb-0">{viewItem.title || "(untitled)"}</h6>
                            <div dangerouslySetInnerHTML={{
                              __html: (
                                  getComputedStatus(viewItem) === "active"
                                      ? "<span class='badge rounded-pill bg-success'>active</span>"
                                      : getComputedStatus(viewItem) === "scheduled"
                                          ? "<span class='badge rounded-pill bg-warning'>scheduled</span>"
                                          : "<span class='badge rounded-pill bg-neutral-400'>ended</span>"
                              )
                            }}/>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-text">Start</div>
                          <div>{viewItem.startDate ? new Date(viewItem.startDate).toLocaleString() : ""}</div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-text">End</div>
                          <div>{viewItem.endDate ? new Date(viewItem.endDate).toLocaleString() : ""}</div>
                        </div>
                        <div className="col-md-12">
                          <hr/>
                          <h6 className="mb-2">Products</h6>
                          <div className="table-responsive">
                            <table className="table">
                              <thead>
                              <tr>
                                <th>Product</th>
                                <th>Variant</th>
                                <th>Flash Price</th>
                                <th>Stock Limit</th>
                              </tr>
                              </thead>
                              <tbody>
                              {(Array.isArray(viewItem.products) ? viewItem.products : []).map((p, i) => {
                                const product = products.find((x) => x._id === (p.productId || p.product));
                                const productName = product?.name || product?.title || (p.productId || p.product);
                                const vOpts = variantsMap[p.productId || p.product] || [];
                                const vMatch = vOpts.find((vo) => vo.value === (p.variantId || p.variant));
                                const variantName = vMatch?.label || (p.variantId || p.variant || "-");
                                return (
                                    <tr key={i}>
                                      <td>{productName}</td>
                                      <td>{variantName}</td>
                                      <td>{typeof p.flashPrice !== "undefined" ? p.flashPrice : "-"}</td>
                                      <td>{typeof p.stockLimit !== "undefined" ? p.stockLimit : "-"}</td>
                                    </tr>
                                );
                              })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-text">Created</div>
                          <div>{viewItem.createdAt ? new Date(viewItem.createdAt).toLocaleString() : ""}</div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-text">Updated</div>
                          <div>{viewItem.updatedAt ? new Date(viewItem.updatedAt).toLocaleString() : ""}</div>
                        </div>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-neutral-400"
                              onClick={() => setShowViewModal(false)}>Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
        )}
      </MasterLayout>
  );
};

export default FlashSalesPage;
