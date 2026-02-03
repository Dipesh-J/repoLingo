import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

export interface User {
    id: string;
    login: string;
    name: string | null;
    email: string | null;
    avatarUrl: string;
    createdAt: string;
}

export interface UserPreferences {
    userId: string;
    defaultTargetLanguage: string;
    autoTranslate: boolean;
    emailNotifications: boolean;
}

export interface Installation {
    id: number;
    accountLogin: string;
    accountType: string;
    accountAvatarUrl: string;
    repositorySelection: string;
    repositories: {
        id: number;
        name: string;
        fullName: string;
        private: boolean;
    }[];
}

export interface TranslationRecord {
    id: string;
    userId: string;
    owner: string;
    repo: string;
    prNumber: number;
    prTitle: string;
    sourceLanguage: string;
    targetLanguage: string;
    contentType: 'description' | 'comment';
    translatedAt: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    preferences: UserPreferences | null;
    installations: Installation[];
    installUrl: string | null;
    history: TranslationRecord[];
    stats: {
        total: number;
        byLanguage: Record<string, number>;
        byRepo: Record<string, number>;
    } | null;
    login: () => void;
    logout: () => void;
    refreshUser: () => Promise<void>;
    refreshInstallations: () => Promise<void>;
    refreshHistory: () => Promise<void>;
    updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [preferences, setPreferences] = useState<UserPreferences | null>(null);
    const [installations, setInstallations] = useState<Installation[]>([]);
    const [installUrl, setInstallUrl] = useState<string | null>(null);
    const [history, setHistory] = useState<TranslationRecord[]>([]);
    const [stats, setStats] = useState<AuthContextType['stats']>(null);

    // Check for authentication on mount
    const refreshUser = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/auth/me`, {
                credentials: 'include'
            });

            if (res.ok) {
                const userData = await res.json();
                setUser(userData);
                setError(null);
            } else {
                setUser(null);
            }
        } catch (err) {
            console.error('Auth check failed:', err);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch user preferences
    const refreshPreferences = useCallback(async () => {
        if (!user) return;
        try {
            const res = await fetch(`${API_BASE}/api/preferences`, {
                credentials: 'include'
            });
            if (res.ok) {
                const prefs = await res.json();
                setPreferences(prefs);
            }
        } catch (err) {
            console.error('Failed to fetch preferences:', err);
        }
    }, [user]);

    // Fetch installations
    const refreshInstallations = useCallback(async () => {
        if (!user) return;
        try {
            const res = await fetch(`${API_BASE}/api/installations`, {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setInstallations(data.installations || []);
                setInstallUrl(data.installUrl || null);
            }
        } catch (err) {
            console.error('Failed to fetch installations:', err);
        }
    }, [user]);

    // Fetch translation history
    const refreshHistory = useCallback(async () => {
        if (!user) return;
        try {
            const res = await fetch(`${API_BASE}/api/history`, {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setHistory(data.history || []);
                setStats(data.stats || null);
            }
        } catch (err) {
            console.error('Failed to fetch history:', err);
        }
    }, [user]);

    // Update preferences
    const updatePreferencesHandler = useCallback(async (updates: Partial<UserPreferences>) => {
        const res = await fetch(`${API_BASE}/api/preferences`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ error: 'Failed to update preferences' }));
            throw new Error(errorData.error || 'Failed to update preferences');
        }

        const updated = await res.json();
        setPreferences(updated);
    }, []);

    // Initial auth check
    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    // Load user data when authenticated
    useEffect(() => {
        if (user) {
            refreshPreferences();
            refreshInstallations();
            refreshHistory();
        }
    }, [user, refreshPreferences, refreshInstallations, refreshHistory]);

    // Handle URL error params (from OAuth errors)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const errorParam = params.get('error');
        if (errorParam) {
            const errorMessages: Record<string, string> = {
                'oauth_denied': 'GitHub authorization was denied.',
                'invalid_state': 'Invalid OAuth state. Please try again.',
                'token_exchange': 'Failed to authenticate with GitHub.',
                'user_fetch': 'Failed to fetch your GitHub profile.',
                'config': 'Server configuration error. Please contact support.',
                'server_error': 'An unexpected error occurred. Please try again.'
            };
            setError(errorMessages[errorParam] || 'Authentication failed.');
            // Clean up URL
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const login = useCallback(() => {
        window.location.href = `${API_BASE}/auth/github`;
    }, []);

    const logout = useCallback(() => {
        window.location.href = `${API_BASE}/auth/logout`;
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            error,
            preferences,
            installations,
            installUrl,
            history,
            stats,
            login,
            logout,
            refreshUser,
            refreshInstallations,
            refreshHistory,
            updatePreferences: updatePreferencesHandler
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
