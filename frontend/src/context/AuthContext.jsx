import React, { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("returnchain_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("returnchain_token") || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem("returnchain_token");
      if (storedToken) {
        try {
          const res = await authApi.getProfile();
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem("returnchain_user", JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn("Session expired or invalid:", err.message);
          logout();
        }
      }
      setLoading(false);
    };
    verifySession();
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    if (res.data.success) {
      setUser(res.data.user);
      setToken(res.data.token);
      localStorage.setItem("returnchain_token", res.data.token);
      localStorage.setItem("returnchain_user", JSON.stringify(res.data.user));
    }
    return res.data;
  };

  const quickLogin = async (role) => {
    const roleEmailMap = {
      ADMIN: "admin@returnchain.io",
      SELLER: "seller@apple.com",
      COURIER: "courier@fedex.com",
      RETURN_CENTER: "inspector@returncenter.com",
      CUSTOMER: "customer@gmail.com",
    };
    const email = roleEmailMap[role] || "admin@returnchain.io";
    return login(email, "password123");
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("returnchain_token");
    localStorage.removeItem("returnchain_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        quickLogin,
        logout,
        isAuthenticated: Boolean(token && user),
        role: user?.role || "GUEST",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
