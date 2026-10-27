import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import {
  Shield,
  Bell,
  User,
  LogOut,
  ChevronDown,
  Sparkles,
  Search,
  CheckCircle,
  Menu,
} from "lucide-react";

export const Navbar = ({ onToggleSidebar }) => {
  const { user, role, quickLogin, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const navigate = useNavigate();

  const handleRoleSwitch = async (newRole) => {
    await quickLogin(newRole);
    setRoleSwitcherOpen(false);
    navigate("/");
  };

  const roleColors = {
    ADMIN: "bg-purple-100 text-purple-800 border-purple-200",
    SELLER: "bg-blue-100 text-blue-800 border-blue-200",
    COURIER: "bg-cyan-100 text-cyan-800 border-cyan-200",
    RETURN_CENTER: "bg-emerald-100 text-emerald-800 border-emerald-200",
    CUSTOMER: "bg-amber-100 text-amber-800 border-amber-200",
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900 tracking-tight hidden sm:inline">
              Return Fraud Prevention Network
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Local EVM Active
            </span>
          </div>
        </div>

        {/* Right: Quick Role Switcher, Profile & Actions */}
        <div className="flex items-center gap-3">
          {/* Quick Demo Switcher */}
          <div className="relative">
            <button
              onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Role:</span>
              <span className={`px-2 py-0.5 rounded font-bold border text-[11px] ${roleColors[role] || "bg-slate-200 text-slate-800"}`}>
                {role}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {roleSwitcherOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-in fade-in">
                <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Switch Active Role (Demo)
                </div>
                {[
                  { r: "ADMIN", label: "Security Administrator" },
                  { r: "RETURN_CENTER", label: "Return Center Inspector" },
                  { r: "SELLER", label: "Apex Electronics (Seller)" },
                  { r: "COURIER", label: "SwiftLogistics Courier" },
                  { r: "CUSTOMER", label: "Sarah Jenkins (Buyer)" },
                ].map(({ r, label }) => (
                  <button
                    key={r}
                    onClick={() => handleRoleSwitch(r)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${role === r ? "font-bold text-blue-600 bg-blue-50/50" : "text-slate-700"}`}
                  >
                    <div>
                      <div className="font-medium">{r}</div>
                      <div className="text-[10px] text-slate-400">{label}</div>
                    </div>
                    {role === r && <CheckCircle className="w-4 h-4 text-blue-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[120px]">
                  {user?.name || "User"}
                </div>
                <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                  {user?.email || "user@returnchain.io"}
                </div>
              </div>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-800 truncate">{user?.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                    navigate("/login");
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
