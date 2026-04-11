import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateEmergency from './pages/CreateEmergency';
import RequestDetails from './pages/RequestDetails';
import NotificationHistory from './pages/NotificationHistory';
import AppNavbar from './components/AppNavbar';

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium tracking-wide text-slate-700">Loading...</p>
      </div>
    </div>
  );
}

function PrivateRoute({ role = 'any', children }) {
  const { isAuthenticated, isLoading, isHelper, isRequester } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'helper' && !isHelper) {
    return <Navigate to="/dashboard" replace />;
  }

  if (role === 'requester' && !isRequester) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 [font-family:Inter,sans-serif] text-slate-900">
      <AppNavbar />
      {children}
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/dashboard"
        element={
          <PrivateRoute role="any">
            <Dashboard />
          </PrivateRoute>
        }
      />

      <Route
        path="/emergency/create"
        element={
          <PrivateRoute role="requester">
            <CreateEmergency />
          </PrivateRoute>
        }
      />

      <Route
        path="/emergency/:id"
        element={
          <PrivateRoute role="any">
            <RequestDetails />
          </PrivateRoute>
        }
      />

      <Route
        path="/notification/history"
        element={
          <PrivateRoute role="any">
            <NotificationHistory />
          </PrivateRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
