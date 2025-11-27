import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      queueMicrotask(() => {
        setUser({ token });
      });
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/login", { email, password });

    const token =
      res.data.access_token ||
      res.data.accessToken ||
      res.data.token;

    if (token) {
      localStorage.setItem("token", token);
      setUser({ email });
    }

    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

