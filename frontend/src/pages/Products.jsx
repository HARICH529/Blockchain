import React, { useState, useEffect } from "react";
import { productApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { StatusBadge } from "../components/StatusBadge";
import { BlockchainBadge } from "../components/BlockchainBadge";
import { QRCodeModal } from "../components/QRCodeModal";
import { Link } from "react-router-dom";
import {
  Package,
  Plus,
  Search,
  Filter,
  QrCode,
  ExternalLink,
  ShieldCheck,
  Check,
  AlertCircle,
  X,
  RefreshCw,
} from "lucide-react";

export const Products = () => {
  const { role } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [qrModalProduct, setQrModalProduct] = useState(null);

  // Registration Modal State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [regForm, setRegForm] = useState({
    productId: `RC-PROD-${Math.floor(1000 + Math.random() * 9000)}`,
    name: "",
    category: "Electronics",
    manufacturer: "",
    model: "",
    serialNumber: `SN-${Date.now().toString().slice(-6)}`,
    price: 499,
    location: "Genesis Fulfillment Facility",
  });
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await productApi.getAll(params);
      if (res.data.success) {
        setProducts(res.data.products);
      }
    } catch (err) {
      console.error("Error loading products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [categoryFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadProducts();
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError("");
    setRegSuccess("");
    setRegLoading(true);
    try {
      const res = await productApi.register(regForm);
      if (res.data.success) {
        setRegSuccess("Product passport registered & anchored to blockchain!");
        setTimeout(() => {
          setIsRegisterOpen(false);
          setRegSuccess("");
          setRegForm({
            productId: `RC-PROD-${Math.floor(1000 + Math.random() * 9000)}`,
            name: "",
            category: "Electronics",
            manufacturer: "",
            model: "",
            serialNumber: `SN-${Date.now().toString().slice(-6)}`,
            price: 499,
            location: "Genesis Fulfillment Facility",
          });
          loadProducts();
        }, 1200);
      }
    } catch (err) {
      setRegError(err.response?.data?.message || err.message);
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Product Registry</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographic digital identities with tamper-resistant on-chain serial tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(role === "SELLER" || role === "ADMIN") && (
            <button
              onClick={() => setIsRegisterOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Register Product</span>
            </button>
          )}
          <button
            onClick={loadProducts}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Product ID, Name, Serial Number, or Manufacturer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
          >
            <option value="">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Audio">Audio</option>
            <option value="Computing">Computing</option>
            <option value="Wearables">Wearables</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="REGISTERED">REGISTERED</option>
            <option value="DISPATCHED">DISPATCHED</option>
            <option value="IN_TRANSIT">IN_TRANSIT</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="RETURN_REQUESTED">RETURN_REQUESTED</option>
            <option value="RETURN_RECEIVED">RETURN_RECEIVED</option>
            <option value="RETURN_VERIFIED">RETURN_VERIFIED</option>
            <option value="RETURN_FLAGGED">RETURN_FLAGGED</option>
          </select>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Product Passport</th>
                <th className="px-4 py-3">Category & OEM</th>
                <th className="px-4 py-3">Serial Number</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Blockchain Tx</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-slate-400">
                    No registered products match your criteria.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setQrModalProduct(p)}
                          className="p-1 rounded bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600 transition-colors"
                          title="View Digital QR Passport"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <div>
                          <div className="font-semibold text-slate-900">{p.name}</div>
                          <div className="font-mono text-[11px] text-blue-600 font-semibold">
                            {p.productId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>{p.category}</div>
                      <div className="text-[11px] text-slate-400">{p.manufacturer} • ${p.price}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-700 font-medium">
                      {p.serialNumber}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3">
                      <BlockchainBadge txHash={p.txHash} blockNumber={p.blockNumber} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          to={`/products/${p.productId}`}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                        >
                          Details
                        </Link>
                        <button
                          onClick={() => setQrModalProduct(p)}
                          className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium transition-colors"
                        >
                          QR
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Code Modal */}
      <QRCodeModal
        product={qrModalProduct}
        isOpen={Boolean(qrModalProduct)}
        onClose={() => setQrModalProduct(null)}
      />

      {/* Register Product Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Register New Product</h3>
                  <p className="text-xs text-slate-500">Mints verifiable product passport on blockchain</p>
                </div>
              </div>
              <button
                onClick={() => setIsRegisterOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {regError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            {regSuccess && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{regSuccess}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700">Product ID</label>
                  <input
                    type="text"
                    required
                    value={regForm.productId}
                    onChange={(e) => setRegForm({ ...regForm, productId: e.target.value })}
                    className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700">Serial Number</label>
                  <input
                    type="text"
                    required
                    value={regForm.serialNumber}
                    onChange={(e) => setRegForm({ ...regForm, serialNumber: e.target.value })}
                    className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sony WH-1000XM5 Headphones"
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700">Category</label>
                  <select
                    value={regForm.category}
                    onChange={(e) => setRegForm({ ...regForm, category: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Audio">Audio</option>
                    <option value="Computing">Computing</option>
                    <option value="Wearables">Wearables</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700">Price (USD)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={regForm.price}
                    onChange={(e) => setRegForm({ ...regForm, price: Number(e.target.value) })}
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700">Manufacturer</label>
                  <input
                    type="text"
                    placeholder="e.g. Sony Corp"
                    value={regForm.manufacturer}
                    onChange={(e) => setRegForm({ ...regForm, manufacturer: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700">Model</label>
                  <input
                    type="text"
                    placeholder="e.g. WH-1000XM5"
                    value={regForm.model}
                    onChange={(e) => setRegForm({ ...regForm, model: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700">Registration Facility / Origin</label>
                <input
                  type="text"
                  value={regForm.location}
                  onChange={(e) => setRegForm({ ...regForm, location: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={regLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm disabled:opacity-50"
                >
                  {regLoading ? "Recording to Blockchain..." : "Mint & Anchor Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
