import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import TranslationPage from './pages/TranslationPage';
import './App.css';

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

                {/* Protected Routes */}
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/dashboard/settings" element={<SettingsPage />} />

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
