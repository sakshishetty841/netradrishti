import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './i18n/LanguageContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AshaDashboard } from './pages/AshaDashboard';
import { UploadScan } from './pages/UploadScan';
import { ScanResult } from './pages/ScanResult';
import { PatientDetails } from './pages/PatientDetails';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { AdminDashboard } from './pages/AdminDashboard';

const HomeRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ASHA') return <Navigate to="/asha" replace />;
  if (user.role === 'PHC_DOCTOR') return <Navigate to="/doctor" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  return <Navigate to="/login" replace />;
};

export function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-[#FFF9F2] text-[#243B53] flex flex-col font-sans">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* ASHA Routes */}
                <Route
                  path="/asha"
                  element={
                    <ProtectedRoute allowedRoles={['ASHA', 'ADMIN']}>
                      <AshaDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/upload-scan"
                  element={
                    <ProtectedRoute allowedRoles={['ASHA', 'ADMIN']}>
                      <UploadScan />
                    </ProtectedRoute>
                  }
                />

                {/* Patient Details & Scan Results */}
                <Route
                  path="/patients/:id"
                  element={
                    <ProtectedRoute>
                      <PatientDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/scans/:id"
                  element={
                    <ProtectedRoute>
                      <ScanResult />
                    </ProtectedRoute>
                  }
                />

                {/* Doctor Routes */}
                <Route
                  path="/doctor"
                  element={
                    <ProtectedRoute allowedRoles={['PHC_DOCTOR', 'ADMIN']}>
                      <DoctorDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Catch-all redirect */}
                <Route path="*" element={<HomeRedirect />} />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
