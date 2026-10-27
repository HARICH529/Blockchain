import axios from "axios";

const API = axios.create({
  baseURL: "/api",
});

// Attach JWT token from localStorage
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("returnchain_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized and on a protected route, token may be expired
      if (!window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/verify/")) {
        // localStorage.removeItem("returnchain_token");
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (data) => API.post("/auth/login", data),
  register: (data) => API.post("/auth/register", data),
  getProfile: () => API.get("/auth/profile"),
  getDemoAccounts: () => API.get("/auth/demo-accounts"),
};

// Products API
export const productApi = {
  getAll: (params) => API.get("/products", { params }),
  getById: (id) => API.get(`/products/${id}`),
  register: (data) => API.post("/products/register", data),
  verifyPublic: (id) => API.get(`/products/public-verify/${id}`),
};

// Orders API
export const orderApi = {
  getAll: (params) => API.get("/orders", { params }),
  getById: (id) => API.get(`/orders/${id}`),
  create: (data) => API.post("/orders/create", data),
  dispatch: (id, data) => API.post(`/orders/${id}/dispatch`, data),
  deliver: (id, data) => API.post(`/orders/${id}/deliver`, data),
};

// Custody API
export const custodyApi = {
  getByProductId: (productId) => API.get(`/custody/${productId}`),
  record: (data) => API.post("/custody/record", data),
};

// Returns API
export const returnApi = {
  getAll: (params) => API.get("/returns", { params }),
  getById: (id) => API.get(`/returns/${id}`),
  request: (data) => API.post("/returns/request", data),
  pickup: (id, data) => API.post(`/returns/${id}/pickup`, data),
  receive: (id, data) => API.post(`/returns/${id}/receive`, data),
  updateRefundStatus: (id, data) => API.post(`/returns/${id}/refund-status`, data),
};

// Verification API
export const verificationApi = {
  verifyItem: (data) => API.post("/verification/verify", data),
};

// Fraud API
export const fraudApi = {
  getAll: (params) => API.get("/fraud", { params }),
  getById: (id) => API.get(`/fraud/${id}`),
  assign: (id, data) => API.post(`/fraud/${id}/assign`, data),
  resolve: (id, data) => API.post(`/fraud/${id}/resolve`, data),
};

// Audit API
export const auditApi = {
  getLogs: (params) => API.get("/audit/logs", { params }),
  getBlockchainExplorer: () => API.get("/audit/blockchain-explorer"),
};

// Users API
export const userApi = {
  getAll: (params) => API.get("/users", { params }),
  updateRole: (id, role) => API.patch(`/users/${id}/role`, { role }),
  toggleStatus: (id) => API.patch(`/users/${id}/status`),
};

// Stats API
export const statsApi = {
  getDashboard: () => API.get("/stats/dashboard"),
};

export default API;
