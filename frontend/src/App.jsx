// src/App.jsx
// Root application router with distinct Public, User Portal, and Admin Portal workflows.

import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

// Route Guards
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import UserPortalLayout from './layouts/UserPortalLayout';
import AdminPortalLayout from './layouts/AdminPortalLayout';

// Public Pages
import Landing from './pages/public/Landing';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import ForgotPassword from './pages/public/ForgotPassword';

// User Portal Pages
import UserDashboard from './pages/user/UserDashboard';
import AnalyzePage from './pages/user/AnalyzePage';
import ReportsPage from './pages/user/ReportsPage';
import HistoryPage from './pages/user/HistoryPage';
import ProfilePage from './pages/user/ProfilePage';
import SettingsPage from './pages/user/SettingsPage';
import HelpPage from './pages/user/HelpPage';

// Admin Portal Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAnalyses from './pages/admin/AdminAnalyses';
import AdminRules from './pages/admin/AdminRules';
import AdminFeedback from './pages/admin/AdminFeedback';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';

function Application() {
  const { user, loading: authLoading, updatePreferences } = useAuth();
  const [language, setLanguageState] = useState(() => {
    const savedLanguage = localStorage.getItem('trustlens_language');
    return ['en', 'te', 'hi'].includes(savedLanguage) ? savedLanguage : 'en';
  });
  const [seniorMode, setSeniorMode] = useState(false);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    if (!authLoading && ['en', 'te', 'hi'].includes(user?.language)) {
      setLanguageState(user.language);
      localStorage.setItem('trustlens_language', user.language);
    }
  }, [authLoading, user?.language]);

  const setLanguage = (nextLanguage) => {
    if (!['en', 'te', 'hi'].includes(nextLanguage)) return;
    setLanguageState(nextLanguage);
    localStorage.setItem('trustlens_language', nextLanguage);
    document.documentElement.lang = nextLanguage;

    if (user) {
      updatePreferences({ language: nextLanguage }).catch((error) => {
        console.warn('Could not sync the language preference to the profile:', error.message);
      });
    }
  };

  return (
    <LanguageProvider value={{ language, setLanguage }}>
      <BrowserRouter>
        <Routes>
          {/* ========================================================= */}
          {/* 1. PUBLIC EXPERIENCE                                      */}
          {/* ========================================================= */}
          <Route
            element={
              <PublicLayout
                language={language}
                setLanguage={setLanguage}
                seniorMode={seniorMode}
                setSeniorMode={setSeniorMode}
              />
            }
          >
            <Route
              path="/"
              element={
                <Landing
                  language={language}
                  seniorMode={seniorMode}
                />
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/help" element={<HelpPage />} />
          </Route>

          {/* ========================================================= */}
          {/* 2. USER SAAS PORTAL (Protected by JWT Auth)               */}
          {/* ========================================================= */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <UserPortalLayout
                  language={language}
                  setLanguage={setLanguage}
                  seniorMode={seniorMode}
                  setSeniorMode={setSeniorMode}
                />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<UserDashboard />} />
            <Route
              path="analyze"
              element={
                <AnalyzePage
                  language={language}
                  seniorMode={seniorMode}
                />
              }
            />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route
              path="settings"
              element={
                <SettingsPage
                  language={language}
                  setLanguage={setLanguage}
                  seniorMode={seniorMode}
                  setSeniorMode={setSeniorMode}
                />
              }
            />
            <Route path="help" element={<HelpPage />} />
          </Route>

          {/* ========================================================= */}
          {/* 3. ADMIN PORTAL (Protected by Admin Role Clearance)       */}
          {/* ========================================================= */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPortalLayout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="analyses" element={<AdminAnalyses />} />
            <Route path="rules" element={<AdminRules />} />
            <Route path="feedback" element={<AdminFeedback />} />
            <Route path="audit-logs" element={<AdminAuditLogs />} />
            <Route path="settings" element={<AdminRules />} />
          </Route>

          {/* Fallback to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <Application />
    </AuthProvider>
  );
}

export default App;
