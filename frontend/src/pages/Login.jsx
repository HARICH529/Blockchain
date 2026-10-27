import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Shield, Sparkles, Lock, Mail, ArrowRight, CheckCircle2 } from "lucide-react";

export const Login = () => {
  const { login, quickLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Invalid login credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuick = async (role) => {
    setError("");
    setLoading(true);
    try {
      await quickLogin(role);
      navigate(from, { replace: true });
    } catch (err) {
      setError("Quick login failed: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const demoRoles = [
    { role: "ADMIN", title: "Security Administrator", email: "admin@returnchain.io", desc: "Full platform audit, fraud case resolution, user governance" },
    { role: "RETURN_CENTER", title: "Return Center Inspector", email: "inspector@returncenter.com", desc: "Intake scanning, physical item inspection, fraud rule execution" },
    { role: "SELLER", title: "Apex Electronics (Seller)", email: "seller@apple.com", desc: "Product passport minting, order dispatch, custody logging" },
    { role: "COURIER", title: "SwiftLogistics Courier", email: "courier@fedex.com", desc: "Pickup, in-transit milestones, delivery signature recording" },
    { role: "CUSTOMER", title: "Sarah Jenkins (Buyer)", email: "customer@gmail.com", desc: "Order history, return request filing, refund tracking" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-sky-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
          <Shield className="w-7 h-7" />
        </div>
        <h2 className="mt-4 text-2xl font-extrabold text-slate-900 tracking-tight">
          Return<span className="text-blue-600">Chain</span>
        </h2>
        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
          Blockchain Product Identity & Chain-of-Custody System for E-Commerce Return Fraud Prevention
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/80 rounded-2xl sm:px-10">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* 1-Click Demo Accounts Selector */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                1-Click Role Switcher (Academic & Evaluation Demo)
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {demoRoles.map(({ role, title, email: rEmail, desc }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleQuick(role)}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all group flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600">
                        {title}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono font-medium">
                        {role}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-medium">Or Sign In with Credentials</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700">Email Address</label>
              <div className="mt-1 relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@returnchain.io"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">Password</label>
              <div className="mt-1 relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-xs font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Sign In to ReturnChain"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
