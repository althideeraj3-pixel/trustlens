// src/context/AuthContext.jsx
// Global Authentication context with JWT token persistence and role detection.

import React, { createContext, useState, useEffect, useContext } from 'react';
import { apiLogin, apiRegister, apiGetMe, apiUpdateProfile } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('trustlens_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state by verifying existing token
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('trustlens_token');
      if (storedToken) {
        try {
          const res = await apiGetMe();
          if (res.success && res.user) {
            setUser(res.user);
            // Apply user preference to body
            if (res.user.seniorMode) {
              document.body.classList.add('senior-mode');
            } else {
              document.body.classList.remove('senior-mode');
            }
          } else {
            logout();
          }
        } catch (err) {
          console.warn('Session expired or invalid token:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    const res = await apiLogin(email, password);
    if (res.success && res.token) {
      localStorage.setItem('trustlens_token', res.token);
      setToken(res.token);
      setUser(res.user);
      if (res.user.seniorMode) {
        document.body.classList.add('senior-mode');
      }
      return res.user;
    }
  };

  const register = async (name, email, password, language = 'en', seniorMode = false) => {
    const res = await apiRegister(name, email, password, language, seniorMode);
    if (res.success && res.token) {
      localStorage.setItem('trustlens_token', res.token);
      setToken(res.token);
      setUser(res.user);
      if (res.user.seniorMode) {
        document.body.classList.add('senior-mode');
      }
      return res.user;
    }
  };

  const logout = () => {
    localStorage.removeItem('trustlens_token');
    setToken(null);
    setUser(null);
    document.body.classList.remove('senior-mode');
  };

  const updatePreferences = async (data) => {
    const res = await apiUpdateProfile(data);
    if (res.success && res.user) {
      setUser(res.user);
      if (res.user.seniorMode) {
        document.body.classList.add('senior-mode');
      } else {
        document.body.classList.remove('senior-mode');
      }
      return res.user;
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        isAdmin,
        login,
        register,
        logout,
        updatePreferences
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
