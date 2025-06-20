import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ReminderProvider } from './contexts/ReminderContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Settings from './pages/Settings';
import './App.css';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Public Route Component (redirects to dashboard if already authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
};

const SplashScreen: React.FC = () => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-dark-900 text-white">
    <div className="w-24 h-24 bg-purple-600 rounded-2xl flex items-center justify-center mb-6 animate-bounce">
      <span className="text-4xl font-bold text-white">SN</span>
    </div>
    <h1 className="text-3xl font-bold text-gradient mb-2">SpeakNote Remind</h1>
    <p className="text-lg text-dark-300">by techwithron</p>
  </div>
);

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <Layout>
            <Settings />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="App">
      {showSplash && <SplashScreen />}
      <AuthProvider>
        <ReminderProvider>
          <AppRoutes />
        </ReminderProvider>
      </AuthProvider>
    </div>
  );
};

export default App; 