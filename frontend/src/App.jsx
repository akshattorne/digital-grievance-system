import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AnonymousTrackPage } from './pages/AnonymousTrackPage';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { SubmitComplaintPage } from './pages/SubmitComplaintPage';
import { ComplaintDetailPage } from './pages/ComplaintDetailPage';
import { DistrictAdminDashboard } from './pages/DistrictAdminDashboard';
import { OfficerDashboard } from './pages/OfficerDashboard';

// Role Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading user session...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <main style={{ flex: 1 }}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/track" element={<AnonymousTrackPage />} />
                <Route path="/submit" element={<SubmitComplaintPage />} />
                <Route path="/complaints/:id" element={<ComplaintDetailPage />} />

                {/* Registered Citizen Dashboard */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['CITIZEN']}>
                      <CitizenDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* District Admin Dashboard */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['DISTRICT_ADMIN']}>
                      <DistrictAdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Grievance Officer Dashboard */}
                <Route
                  path="/officer"
                  element={
                    <ProtectedRoute allowedRoles={['OFFICER']}>
                      <OfficerDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
}
