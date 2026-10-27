import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  ShieldAlert,
  Package,
  Truck,
  RotateCcw,
  QrCode,
  SearchCheck,
  FileText,
  Users,
  Compass,
  Link2,
  ShieldCheck,
} from "lucide-react";

export const Sidebar = ({ isOpen, onClose }) => {
  const { role } = useAuth();

  const getNavItemsForRole = (currentRole) => {
    switch (currentRole) {
      case "CUSTOMER":
        return [
          { to: "/", icon: LayoutDashboard, label: "Customer Dashboard" },
          { to: "/orders", icon: Truck, label: "My Orders & Delivery" },
          { to: "/returns", icon: RotateCcw, label: "My Return Requests" },
          { to: "/products", icon: Package, label: "Product Catalog" },
          { to: "/custody", icon: Link2, label: "Item Tracking" },
          { to: "/demo", icon: Compass, label: "Demo Guide", badge: "Guide", badgeColor: "bg-slate-100 text-slate-700" },
        ];
      case "SELLER":
        return [
          { to: "/", icon: LayoutDashboard, label: "Merchant Dashboard" },
          { to: "/products", icon: Package, label: "My Products & Catalog", badge: "Brand", badgeColor: "bg-blue-100 text-blue-800" },
          { to: "/orders", icon: Truck, label: "Orders & Fulfillment" },
          { to: "/returns", icon: RotateCcw, label: "Returns on My Products" },
          { to: "/custody", icon: Link2, label: "Chain of Custody" },
          { to: "/fraud", icon: ShieldAlert, label: "Brand Fraud Cases", badge: "Alerts", badgeColor: "bg-amber-100 text-amber-800" },
          { to: "/demo", icon: Compass, label: "Demo Guide", badge: "Guide", badgeColor: "bg-slate-100 text-slate-700" },
        ];
      case "COURIER":
        return [
          { to: "/", icon: LayoutDashboard, label: "Logistics Dashboard" },
          { to: "/orders", icon: Truck, label: "Outbound Deliveries", badge: "Routes", badgeColor: "bg-sky-100 text-sky-800" },
          { to: "/returns", icon: RotateCcw, label: "Doorstep Return Pickups", badge: "Intake", badgeColor: "bg-amber-100 text-amber-800" },
          { to: "/custody", icon: Link2, label: "Custody Milestones" },
          { to: "/demo", icon: Compass, label: "Demo Guide", badge: "Guide", badgeColor: "bg-slate-100 text-slate-700" },
        ];
      case "RETURN_CENTER":
        return [
          { to: "/", icon: LayoutDashboard, label: "Inspection Dashboard" },
          {
            to: "/verify-center",
            icon: SearchCheck,
            label: "Verification Center",
            badge: "Inspection",
            badgeColor: "bg-blue-600 text-white",
          },
          { to: "/returns", icon: RotateCcw, label: "Return Intake Queue", badge: "Processing", badgeColor: "bg-indigo-100 text-indigo-800" },
          { to: "/fraud", icon: ShieldAlert, label: "Fraud Investigations", badge: "Cases", badgeColor: "bg-rose-100 text-rose-800" },
          { to: "/products", icon: Package, label: "Product Registry" },
          { to: "/custody", icon: Link2, label: "Chain of Custody" },
          { to: "/demo", icon: Compass, label: "Demo Guide", badge: "Guide", badgeColor: "bg-slate-100 text-slate-700" },
        ];
      case "ADMIN":
      default:
        return [
          { to: "/", icon: LayoutDashboard, label: "Executive Dashboard" },
          {
            to: "/verify-center",
            icon: SearchCheck,
            label: "Verification Center",
            badge: "Inspection",
            badgeColor: "bg-blue-600 text-white",
          },
          { to: "/products", icon: Package, label: "Product Management" },
          { to: "/orders", icon: Truck, label: "Orders & Transit" },
          { to: "/custody", icon: Link2, label: "Chain of Custody" },
          { to: "/returns", icon: RotateCcw, label: "Return Requests" },
          { to: "/fraud", icon: ShieldAlert, label: "Fraud Investigations" },
          { to: "/audit", icon: FileText, label: "Audit & Blockchain" },
          { to: "/users", icon: Users, label: "User Management" },
          {
            to: "/demo",
            icon: Compass,
            label: "Demo Scenarios A & B",
            badge: "Live Guide",
            badgeColor: "bg-emerald-100 text-emerald-800",
          },
        ];
    }
  };

  const navItems = getNavItemsForRole(role);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-slate-200/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-sky-500 text-white flex items-center justify-center shadow-sm shadow-blue-500/20">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-slate-900">
              Return<span className="text-blue-600">Chain</span>
            </span>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide">
              AUTHENTICITY LEDGER
            </p>
          </div>
        </div>

        {/* Active Role Scope Indicator */}
        <div className="px-3 pt-3">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Access Role</span>
              <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                {role || "GUEST"}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 leading-tight font-medium">
              {role === "CUSTOMER" && "Scope: Personal purchases & returns"}
              {role === "SELLER" && "Scope: Brand products & fulfillment"}
              {role === "COURIER" && "Scope: Deliveries & doorstep pickups"}
              {role === "RETURN_CENTER" && "Scope: Intake & verification"}
              {role === "ADMIN" && "Scope: Full platform & audit"}
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Authorized Modules
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-blue-50 text-blue-700 font-semibold shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-tight ${
                      item.badgeColor || "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Smart Contract Info Footer */}
        <div className="p-3 border-t border-slate-200/80 bg-slate-50/60 m-3 rounded-xl border">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
            <span>Smart Contract</span>
            <span className="text-[10px] text-emerald-600 font-mono">ReturnChain.sol</span>
          </div>
          <p className="mt-1 text-[10px] text-slate-400 font-mono truncate">
            0x5FbDB2315678afecb367f032d93F642f64180aa3
          </p>
        </div>
      </aside>
    </>
  );
};
