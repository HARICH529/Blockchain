import React, { useState, useEffect } from "react";
import { orderApi, productApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { StatusBadge } from "../components/StatusBadge";
import { BlockchainBadge } from "../components/BlockchainBadge";
import {
  Truck,
  Plus,
  Send,
  CheckCircle,
  Package,
  Calendar,
  MapPin,
  RefreshCw,
  X,
  AlertCircle,
} from "lucide-react";

export const Orders = () => {
  const { role, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create Order Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [orderForm, setOrderForm] = useState({
    orderId: `RC-ORD-${Math.floor(5000 + Math.random() * 5000)}`,
    productId: "",
    street: "500 West Madison St",
    city: "Chicago",
    state: "IL",
    postalCode: "60661",
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await orderApi.getAll();
      if (res.data.success) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      console.error("Error loading orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const openCreateModal = async () => {
    try {
      const pRes = await productApi.getAll({ status: "REGISTERED" });
      if (pRes.data.success) {
        setAvailableProducts(pRes.data.products);
        if (pRes.data.products.length > 0) {
          setOrderForm((prev) => ({ ...prev, productId: pRes.data.products[0].productId }));
        }
      }
      setIsCreateOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setActionError("");
    setActionLoading(true);
    try {
      const res = await orderApi.create({
        orderId: orderForm.orderId,
        productId: orderForm.productId,
        shippingAddress: {
          street: orderForm.street,
          city: orderForm.city,
          state: orderForm.state,
          postalCode: orderForm.postalCode,
          country: "USA",
        },
      });
      if (res.data.success) {
        setIsCreateOpen(false);
        setOrderForm({
          orderId: `RC-ORD-${Math.floor(5000 + Math.random() * 5000)}`,
          productId: "",
          street: "500 West Madison St",
          city: "Chicago",
          state: "IL",
          postalCode: "60661",
        });
        loadOrders();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispatch = async (orderId) => {
    try {
      await orderApi.dispatch(orderId, { location: "Regional Logistics Outbound Dock #1" });
      loadOrders();
    } catch (err) {
      console.error("Dispatch error:", err);
      alert("Dispatch error: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeliver = async (orderId) => {
    try {
      await orderApi.deliver(orderId, {
        location: "Customer Residence Doorstep",
        signatureProof: `Customer_Electronic_Signature_Ord_${orderId}`,
      });
      loadOrders();
    } catch (err) {
      console.error("Delivery error:", err);
      alert("Delivery error: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Orders & Fulfillment</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            End-to-end customer order tracking with blockchain dispatch and delivery milestones
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Demo Order</span>
          </button>
          <button
            onClick={loadOrders}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Product Passport</th>
                <th className="px-4 py-3">Customer & Address</th>
                <th className="px-4 py-3">Fulfillment Status</th>
                <th className="px-4 py-3">Milestone Dates</th>
                <th className="px-4 py-3 text-right">Authorized Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-slate-400">
                    No orders recorded. Click "Create Demo Order" to add one.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      {o.orderId}
                      <div className="text-[10px] text-slate-400 font-normal">
                        Amount: ${o.totalAmount}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{o.product?.name || "Product"}</div>
                      <div className="font-mono text-[11px] text-blue-600">
                        {o.productId}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div className="font-medium text-slate-800">{o.customer?.name || "Customer"}</div>
                      <div className="text-[11px] text-slate-400">
                        {o.shippingAddress?.city}, {o.shippingAddress?.state}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-500">
                      {o.deliveredAt ? (
                        <span className="text-emerald-700 font-medium">
                          Delivered: {new Date(o.deliveredAt).toLocaleDateString()}
                        </span>
                      ) : o.dispatchedAt ? (
                        <span className="text-blue-700 font-medium">
                          Dispatched: {new Date(o.dispatchedAt).toLocaleDateString()}
                        </span>
                      ) : (
                        <span>Created: {new Date(o.createdAt).toLocaleDateString()}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        {o.status === "PENDING" && (role === "SELLER" || role === "ADMIN") && (
                          <button
                            onClick={() => handleDispatch(o.orderId)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs"
                          >
                            <Send className="w-3 h-3" />
                            <span>Dispatch</span>
                          </button>
                        )}
                        {(o.status === "DISPATCHED" || o.status === "IN_TRANSIT") &&
                          (role === "COURIER" || role === "ADMIN") && (
                            <button
                              onClick={() => handleDeliver(o.orderId)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-xs"
                            >
                              <CheckCircle className="w-3 h-3" />
                              <span>Deliver</span>
                            </button>
                          )}
                        {o.status === "DELIVERED" && (
                          <span className="text-xs text-slate-400 font-medium italic">
                            Delivered
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Order Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 text-sm">Create New Order</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleCreateOrder} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700">Order ID</label>
                <input
                  type="text"
                  required
                  value={orderForm.orderId}
                  onChange={(e) => setOrderForm({ ...orderForm, orderId: e.target.value })}
                  className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700">Select Available Product</label>
                {availableProducts.length === 0 ? (
                  <p className="mt-1 text-slate-500 italic">No available registered products. Register one first.</p>
                ) : (
                  <select
                    value={orderForm.productId}
                    onChange={(e) => setOrderForm({ ...orderForm, productId: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {availableProducts.map((p) => (
                      <option key={p.productId} value={p.productId}>
                        {p.productId} — {p.name} (${p.price})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-medium text-slate-700">Street Address</label>
                <input
                  type="text"
                  required
                  value={orderForm.street}
                  onChange={(e) => setOrderForm({ ...orderForm, street: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-medium text-slate-700">City</label>
                  <input
                    type="text"
                    required
                    value={orderForm.city}
                    onChange={(e) => setOrderForm({ ...orderForm, city: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700">State</label>
                  <input
                    type="text"
                    required
                    value={orderForm.state}
                    onChange={(e) => setOrderForm({ ...orderForm, state: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700">ZIP</label>
                  <input
                    type="text"
                    required
                    value={orderForm.postalCode}
                    onChange={(e) => setOrderForm({ ...orderForm, postalCode: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || availableProducts.length === 0}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm disabled:opacity-50"
                >
                  {actionLoading ? "Creating..." : "Confirm Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
