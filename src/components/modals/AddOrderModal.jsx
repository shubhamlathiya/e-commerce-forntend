import React, { useEffect, useMemo, useState } from "react";
import apiClient from "../../api/client";
import productApi from "../../api/productApi";
import pricingApi from "../../api/pricingApi";
import variantsApi from "../../api/variantsApi";
import Select from "react-select";

// Enhanced Add Order Modal with Variant Support and Searchable Dropdowns
const EnhancedAddOrderModal = ({ show, onClose, onSubmit, creating }) => {
  const [formData, setFormData] = useState({
    userId: '',
    items: [{ productId: '', variantId: '', quantity: 1, price: 0, name: '' }],
    shippingAddress: {
      name: '',
      addressLine1: '',
      city: '',
      state: '',
      zip: '',
      country: '',
      phone: ''
    },
    billingAddress: {},
    paymentMethod: 'cod',
    status: 'placed',
    couponCode: '',
    totals: { discount: 0, shipping: 0, tax: 0 }
  });

  const [products, setProducts] = useState([]);
  const [variants, setVariants] = useState({});
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Calculate totals
  const calculateTotals = useMemo(() => {
    const subtotal = formData.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    const discount = formData.totals.discount || 0;
    const shipping = formData.totals.shipping || 0;
    const tax = formData.totals.tax || 0;

    const grandTotal = subtotal - discount + shipping + tax;

    return {
      subtotal,
      discount,
      shipping,
      tax,
      grandTotal: Math.max(0, grandTotal)
    };
  }, [formData.items, formData.totals]);

  // Fetch products and users on modal open
  useEffect(() => {
    if (show) {
      fetchInitialData();
    }
  }, [show]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Fetch products
      const productsRes = await productApi.getProducts();
      const productsList = Array.isArray(productsRes?.data?.items)
          ? productsRes.data.items
          : Array.isArray(productsRes?.data)
              ? productsRes.data
              : (Array.isArray(productsRes) ? productsRes : []);
      setProducts(productsList);

      // Fetch users
      const usersRes = await apiClient.get("/api/admin/users", { params: { page: 1, limit: 100 } });
      const usersData = Array.isArray(usersRes?.data?.users)
          ? usersRes.data.users
          : Array.isArray(usersRes?.data?.items)
              ? usersRes.data.items
              : (Array.isArray(usersRes?.data) ? usersRes.data : []);
      setUsers(usersData);

    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch variants when product is selected
  const fetchProductVariants = async (productId, itemIndex) => {
    if (!productId) return;

    try {
      const variantsRes = await variantsApi.listVariants({ productId });
      const variantsList = Array.isArray(variantsRes?.data)
          ? variantsRes.data
          : Array.isArray(variantsRes?.data?.items)
              ? variantsRes.data.items
              : Array.isArray(variantsRes?.items)
                  ? variantsRes.items
                  : [];

      setVariants(prev => ({
        ...prev,
        [productId]: variantsList
      }));

      // If no variants, use product price
      if (variantsList.length === 0) {
        const product = products.find(p => (p._id || p.id) === productId);
        if (product) {
          // Try to get product pricing

          try {
            const pricingRes = await pricingApi.getProductPricing({ productId });

            const pricingData = pricingRes || pricingRes || {};
            const basePrice = pricingData.basePrice || product.price || 0;

            // Update the selected item in formData with base price
            setFormData(prev => {
              const newItems = [...prev.items];
              const currentItem = { ...newItems[itemIndex] };

              currentItem.price = basePrice;
              currentItem.name = product.title || product.name || "Unnamed Product";

              newItems[itemIndex] = currentItem;
              return { ...prev, items: newItems };
            });
          } catch (error) {
            console.error('Error fetching product pricing:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching variants:', error);
      // If variant fetch fails, still allow product selection
      setVariants(prev => ({
        ...prev,
        [productId]: []
      }));
    }
  };

  const updateItem = (index, updates) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], ...updates };
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', variantId: '', quantity: 1, price: 0, name: '' }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, items: newItems }));
    }
  };

  const applyCoupon = async () => {
    if (!formData.couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setLoading(true);
    try {
      const couponRes = await fetch(`/api/coupons/validate/${formData.couponCode}`);
      const couponData = await couponRes.json();

      if (couponData.valid) {
        const discount = calculateDiscount(couponData.coupon, calculateTotals.subtotal);
        setFormData(prev => ({
          ...prev,
          totals: { ...prev.totals, discount }
        }));
        setCouponApplied(true);
        setCouponError('');
      } else {
        setCouponError(couponData.message || 'Invalid coupon code');
      }
    } catch (error) {
      setCouponError('Failed to validate coupon');
    } finally {
      setLoading(false);
    }
  };

  const calculateDiscount = (coupon, subtotal) => {
    if (coupon.discountType === 'percentage') {
      return (subtotal * coupon.discountValue) / 100;
    } else if (coupon.discountType === 'fixed') {
      return Math.min(coupon.discountValue, subtotal);
    }
    return 0;
  };

  const removeCoupon = () => {
    setFormData(prev => ({
      ...prev,
      couponCode: '',
      totals: { ...prev.totals, discount: 0 }
    }));
    setCouponApplied(false);
    setCouponError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const orderData = {
      userId: formData.userId || undefined,
      items: formData.items.map(item => ({
        productId: item.productId,
        variantId: item.variantId || undefined,
        name: item.name,
        quantity: Number(item.quantity || 1),
        price: Number(item.price || 0),
        total: Number(item.price || 0) * Number(item.quantity || 1)
      })),
      paymentMethod: formData.paymentMethod,
      shippingAddress: formData.shippingAddress,
      billingAddress: Object.keys(formData.billingAddress || {}).length ? formData.billingAddress : formData.shippingAddress,
      totals: { ...formData.totals, grandTotal: calculateTotals.grandTotal },
      couponCode: formData.couponCode || undefined,
      status: formData.status,
      orderNumber: `ORD-${Date.now()}`,
      placedAt: new Date().toISOString()
    };

    onSubmit(orderData);
  };

  // Searchable dropdown options
  const userOptions = useMemo(() =>
      users.map(user => ({
        value: user._id || user.id,
        label: user.name || user.fullName || user.email || user.phone || "User",
        email: user.email || "",
        phone: user.phone || "",
        avatar: (user.profile && user.profile.picture) ? user.profile.picture : null,
      })), [users]);

  const productOptions = useMemo(() =>
      products.map(product => ({
        value: product._id || product.id,
        label: product.title || product.name || product.slug || "Product",
        sku: product.sku,
        price: product.price || 0,
        image: product.image || undefined,
        thumb: product.thumbnail || (Array.isArray(product.images) && product.images[0]) || undefined,
      })), [products]);

  const getVariantOptions = (productId) => {
    const productVariants = variants[productId] || [];
    return productVariants.map(variant => ({
      value: variant._id || variant.id,
      label: `${variant.sku} - ₹${variant.price || 0}`,
      price: variant.price || 0,
      attributes: variant.attributes || [],
      displayAttributes: variant.displayAttributes ||
          (Array.isArray(variant.attributes) ? variant.attributes.map(attr => `${attr.name}: ${attr.value}`).join(', ') : '')
    }));
  };

  if (!show) return null;

  return (
      <>
        <div className="modal-backdrop fade show"></div>
        <div className="modal fade show d-block" tabIndex="-1" role="dialog"
             style={{ zIndex: 1050, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="modal-dialog modal-xl" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create New Order</h5>
                <button type="button" className="btn-close" onClick={onClose} />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {loading && <div className="alert alert-info">Loading...</div>}

                  <div className="row g-3">
                    {/* User Selection */}
                    <div className="col-md-6">
                      <label className="form-label">Customer (optional)</label>
                      <Select
                          classNamePrefix="react-select"
                          placeholder="Select customer..."
                          isClearable
                          isSearchable
                          options={userOptions}
                          value={userOptions.find(u => String(u.value) === String(formData.userId)) || null}
                          onChange={(opt) => setFormData(prev => ({
                            ...prev,
                            userId: opt?.value || "",
                            shippingAddress: {
                              ...prev.shippingAddress,
                              name: opt?.label || ""
                            }
                          }))}
                          menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                          menuPosition="fixed"
                          styles={{ menuPortal: base => ({ ...base, zIndex: 2000 }) }}
                          formatOptionLabel={(opt) => {
                            const avatarUrl = opt.avatar && String(opt.avatar).startsWith("http")
                                ? String(opt.avatar)
                                : null;
                            return (
                                <div className="d-flex align-items-center gap-2">
                                  {avatarUrl ? (
                                      <img
                                          src={avatarUrl}
                                          alt="avatar"
                                          style={{ width: 24, height: 24, objectFit: "cover", borderRadius: "50%" }}
                                      />
                                  ) : (
                                      <span className="badge bg-secondary rounded-circle" style={{ width: 24, height: 24 }} />
                                  )}
                                  <div className="d-flex flex-column">
                                    <span>{opt.label}</span>
                                    <small className="text-muted">
                                      {[opt.email, opt.phone].filter(Boolean).join(" · ")}
                                    </small>
                                  </div>
                                </div>
                            );
                          }}
                      />
                      <div className="form-text">Clear selection to create a guest order.</div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Payment Method</label>
                      <select
                          className="form-select"
                          value={formData.paymentMethod}
                          onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      >
                        <option value="cod">Cash on Delivery</option>
                        <option value="razorpay">Razorpay</option>
                        <option value="stripe">Stripe</option>
                        <option value="bank">Bank Transfer</option>
                      </select>
                    </div>

                    {/* Order Items */}
                    <div className="col-12">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <h6 className="mb-0">Items</h6>
                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={addItem}>
                          Add Item
                        </button>
                      </div>
                      <div className="table-responsive">
                        <table className="table align-middle">
                          <thead>
                          <tr>
                            <th style={{ width: '35%' }}>Product & Variant</th>
                            <th style={{ width: '15%' }}>Qty</th>
                            <th style={{ width: '20%' }}>Unit Price</th>
                            <th style={{ width: '20%' }}>Line Total</th>
                            <th style={{ width: '10%' }}></th>
                          </tr>
                          </thead>
                          <tbody>
                          {formData.items.map((item, index) => (
                              <tr key={index}>
                                <td>
                                  <div className="row g-2">
                                    <div className="col-12">
                                      <label className="form-label small mb-1">Product</label>
                                      <Select
                                          classNamePrefix="react-select"
                                          placeholder="Select product..."
                                          isClearable
                                          isSearchable
                                          options={productOptions}
                                          value={productOptions.find(p => String(p.value) === String(item.productId)) || null}
                                          onChange={async (opt) => {
                                            const productId = opt?.value || "";
                                            const productName = opt?.label || "";

                                            updateItem(index, {
                                              productId,
                                              variantId: "",
                                              name: productName,
                                              price: 0
                                            });

                                            if (productId) {
                                              await fetchProductVariants(productId, index);
                                            }
                                          }}
                                          menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                          menuPosition="fixed"
                                          styles={{ menuPortal: base => ({ ...base, zIndex: 2000 }) }}
                                          formatOptionLabel={(opt) => {
                                            const imgBase = "http://localhost:8000";
                                            const raw = opt.image || opt.thumb;
                                            const thumbUrl = raw
                                                ? (String(raw).startsWith("http") ? String(raw) : `${imgBase}${raw}`)
                                                : "";
                                            return (
                                                <div className="d-flex align-items-center gap-2">
                                                  {thumbUrl ? (
                                                      <img
                                                          src={thumbUrl}
                                                          alt="thumb"
                                                          style={{ width: 24, height: 24, objectFit: "cover", borderRadius: 4 }}
                                                      />
                                                  ) : (
                                                      <span className="badge bg-secondary rounded" style={{ width: 24, height: 24 }} />
                                                  )}
                                                  <div>
                                                    <div>{opt.label}</div>
                                                    <small className="text-muted">{opt.sku}</small>
                                                  </div>
                                                </div>
                                            );
                                          }}
                                      />
                                    </div>
                                    {item.productId && (
                                        <div className="col-12">
                                          <label className="form-label small mb-1">Variant</label>
                                          <Select
                                              classNamePrefix="react-select"
                                              placeholder="Select variant..."
                                              isClearable
                                              isSearchable
                                              options={getVariantOptions(item.productId)}
                                              value={getVariantOptions(item.productId).find(v => String(v.value) === String(item.variantId)) || null}
                                              onChange={(opt) => {
                                                const variantId = opt?.value || "";
                                                const variantPrice = opt?.price || 0;
                                                const variantName = opt?.displayAttributes ?
                                                    `${item.name} - ${opt.displayAttributes}` : item.name;

                                                updateItem(index, {
                                                  variantId,
                                                  price: variantPrice,
                                                  name: variantName
                                                });
                                              }}
                                              menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                              menuPosition="fixed"
                                              styles={{ menuPortal: base => ({ ...base, zIndex: 2000 }) }}
                                              formatOptionLabel={(opt) => (
                                                  <div>
                                                    <div>{opt.label}</div>
                                                    {opt.displayAttributes && (
                                                        <small className="text-muted">{opt.displayAttributes}</small>
                                                    )}
                                                  </div>
                                              )}
                                          />
                                        </div>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <input
                                      type="number"
                                      className="form-control"
                                      value={item.quantity}
                                      min={1}
                                      onChange={(e) => updateItem(index, { quantity: Number(e.target.value || 1) })}
                                  />
                                </td>
                                <td>
                                  <input
                                      type="number"
                                      className="form-control"
                                      value={item.price}
                                      min={0}
                                      step={0.01}
                                      onChange={(e) => updateItem(index, { price: Number(e.target.value || 0) })}
                                  />
                                </td>
                                <td>₹{(item.price * item.quantity).toFixed(2)}</td>
                                <td>
                                  {formData.items.length > 1 && (
                                      <button
                                          type="button"
                                          className="btn btn-sm btn-outline-danger"
                                          onClick={() => removeItem(index)}
                                      >
                                        Remove
                                      </button>
                                  )}
                                </td>
                              </tr>
                          ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Coupon Code */}
                    <div className="col-md-6">
                      <label className="form-label">Coupon Code</label>
                      <div className="input-group">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Enter coupon code"
                            value={formData.couponCode}
                            onChange={(e) => setFormData(prev => ({ ...prev, couponCode: e.target.value }))}
                            disabled={couponApplied}
                        />
                        {!couponApplied ? (
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={applyCoupon}
                                disabled={loading}
                            >
                              Apply
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="btn btn-outline-danger"
                                onClick={removeCoupon}
                            >
                              Remove
                            </button>
                        )}
                      </div>
                      {couponError && <div className="text-danger small mt-1">{couponError}</div>}
                    </div>

                    {/* Shipping Address */}
                    <div className="col-md-6">
                      <label className="form-label">Shipping Address</label>
                      <input
                          className="form-control mb-2"
                          placeholder="Name"
                          value={formData.shippingAddress.name}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            shippingAddress: { ...prev.shippingAddress, name: e.target.value }
                          }))}
                      />
                      <input
                          className="form-control mb-2"
                          placeholder="Address Line 1"
                          value={formData.shippingAddress.addressLine1}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            shippingAddress: { ...prev.shippingAddress, addressLine1: e.target.value }
                          }))}
                      />
                      <div className="row g-2">
                        <div className="col-md-4">
                          <input
                              className="form-control"
                              placeholder="City"
                              value={formData.shippingAddress.city}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                shippingAddress: { ...prev.shippingAddress, city: e.target.value }
                              }))}
                          />
                        </div>
                        <div className="col-md-4">
                          <input
                              className="form-control"
                              placeholder="State"
                              value={formData.shippingAddress.state}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                shippingAddress: { ...prev.shippingAddress, state: e.target.value }
                              }))}
                          />
                        </div>
                        <div className="col-md-4">
                          <input
                              className="form-control"
                              placeholder="ZIP"
                              value={formData.shippingAddress.zip}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                shippingAddress: { ...prev.shippingAddress, zip: e.target.value }
                              }))}
                          />
                        </div>
                      </div>
                      <div className="row g-2 mt-2">
                        <div className="col-md-8">
                          <input
                              className="form-control"
                              placeholder="Country"
                              value={formData.shippingAddress.country}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                shippingAddress: { ...prev.shippingAddress, country: e.target.value }
                              }))}
                          />
                        </div>
                        <div className="col-md-4">
                          <input
                              className="form-control"
                              placeholder="Phone"
                              value={formData.shippingAddress.phone}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                shippingAddress: { ...prev.shippingAddress, phone: e.target.value }
                              }))}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="col-md-6">
                      <label className="form-label">Order Summary</label>
                      <div className="card">
                        <div className="card-body">
                          <table className="table table-sm">
                            <tbody>
                            <tr>
                              <td>Subtotal:</td>
                              <td className="text-end">₹{calculateTotals.subtotal.toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td>Discount:</td>
                              <td className="text-end text-danger">-₹{calculateTotals.discount.toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td>Shipping:</td>
                              <td className="text-end">
                                <input
                                    type="number"
                                    className="form-control form-control-sm d-inline-block"
                                    style={{ width: '80px' }}
                                    value={formData.totals.shipping}
                                    onChange={(e) => setFormData(prev => ({
                                      ...prev,
                                      totals: { ...prev.totals, shipping: Number(e.target.value) || 0 }
                                    }))}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td>Tax:</td>
                              <td className="text-end">
                                <input
                                    type="number"
                                    className="form-control form-control-sm d-inline-block"
                                    style={{ width: '80px' }}
                                    value={formData.totals.tax}
                                    onChange={(e) => setFormData(prev => ({
                                      ...prev,
                                      totals: { ...prev.totals, tax: Number(e.target.value) || 0 }
                                    }))}
                                />
                              </td>
                            </tr>
                            <tr className="fw-bold fs-5">
                              <td>Grand Total:</td>
                              <td className="text-end">₹{calculateTotals.grandTotal.toFixed(2)}</td>
                            </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={onClose}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={creating || formData.items.length === 0}>
                    {creating ? 'Creating Order...' : 'Create Order'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </>
  );
};

export default EnhancedAddOrderModal;