import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import TranslationPage from './pages/TranslationPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import './App.css';
import type { ReactNode } from 'react';

// Protected Route wrapper component
function ProtectedRoute({ children }: { children: ReactNode }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--github-bg-primary)'
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid var(--github-border)',
                    borderTopColor: 'var(--color-primary-green)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }} />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}

function AppContent() {
    const { user, loading } = useAuth();

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: 'var(--github-bg-primary)'
        }}>
            {/* Only show Navbar on authenticated pages or when user is logged in */}
            {(user || loading) && <Navbar />}

            <Routes>
                {/* Public Routes */}
                <Route path="/" element={user ? <DashboardPage /> : <LandingPage />} />

                {/* Auth callback - handles OAuth token */}
                <Route path="/auth/callback" element={<AuthCallbackPage />} />

                {/* Protected Routes */}
                <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/dashboard/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

                {/* Translation Page (can be public or protected based on your preference) */}
                <Route path="/translate/:owner/:repo/pr/:number" element={<TranslationPage />} />
            </Routes>
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
