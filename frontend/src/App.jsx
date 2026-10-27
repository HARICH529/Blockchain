import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { AppLayout } from "./components/AppLayout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Products } from "./pages/Products";
import { ProductDetail } from "./pages/ProductDetail";
import { PublicVerify } from "./pages/PublicVerify";
import { Orders } from "./pages/Orders";
import { Custody } from "./pages/Custody";
import { Returns } from "./pages/Returns";
import { VerificationCenter } from "./pages/VerificationCenter";
import { FraudCases } from "./pages/FraudCases";
import { AuditExplorer } from "./pages/AuditExplorer";
import { Users } from "./pages/Users";
import { DemoGuide } from "./pages/DemoGuide";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role) && role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default function App() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/verify/:id" element={<PublicVerify />} />

      {/* Protected App Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="products/:id" element={<ProductDetail />} />
        <Route path="orders" element={<Orders />} />
        <Route path="custody" element={<Custody />} />
        <Route path="returns" element={<Returns />} />
        <Route
          path="verify-center"
          element={
            <ProtectedRoute allowedRoles={["RETURN_CENTER", "ADMIN"]}>
              <VerificationCenter />
            </ProtectedRoute>
          }
        />
        <Route
          path="fraud"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "RETURN_CENTER", "SELLER"]}>
              <FraudCases />
            </ProtectedRoute>
          }
        />
        <Route
          path="audit"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AuditExplorer />
            </ProtectedRoute>
          }
        />
        <Route
          path="users"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route path="demo" element={<DemoGuide />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
