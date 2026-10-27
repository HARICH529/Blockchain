import React, { useState, useEffect } from "react";
import { userApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  Users as UsersIcon,
  Search,
  Shield,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  UserCheck,
} from "lucide-react";

export const Users = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const res = await userApi.getAll(params);
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await userApi.updateRole(userId, newRole);
      loadUsers();
    } catch (err) {
      alert("Error updating role: " + (err.response?.data?.message || err.message));
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      await userApi.toggleStatus(userId);
      loadUsers();
    } catch (err) {
      alert("Error toggling account status: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">User & Role Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin governance: Role-based authorization, credential security & account activation
          </p>
        </div>
        <button
          onClick={loadUsers}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors self-start"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by User Name, Email, or Organization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="SELLER">SELLER</option>
            <option value="COURIER">COURIER</option>
            <option value="RETURN_CENTER">RETURN_CENTER</option>
            <option value="CUSTOMER">CUSTOMER</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Email Address</th>
                <th className="px-4 py-3">Organization</th>
                <th className="px-4 py-3">Assigned Role</th>
                <th className="px-4 py-3">Account Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                        {u.name.charAt(0)}
                      </div>
                      <span>{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">
                    {u.email}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {u.organization || "Independent"}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      disabled={u._id === currentUser?.id}
                      className="px-2 py-1 rounded-md text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none disabled:opacity-50"
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="SELLER">SELLER</option>
                      <option value="COURIER">COURIER</option>
                      <option value="RETURN_CENTER">RETURN_CENTER</option>
                      <option value="CUSTOMER">CUSTOMER</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                        u.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {u.isActive ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleToggleStatus(u._id)}
                      disabled={u._id === currentUser?.id}
                      className="px-2.5 py-1 rounded text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors disabled:opacity-50"
                    >
                      {u.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
