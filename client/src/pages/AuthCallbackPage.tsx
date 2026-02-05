import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AUTH_TOKEN_KEY = 'auth_token';

/**
 * Auth callback page - handles the token from OAuth redirect
 * The server redirects here with the token in the URL hash fragment
 */
export default function AuthCallbackPage() {
    const navigate = useNavigate();

    useEffect(() => {
        // Extract token from URL hash fragment
        const hash = window.location.hash;
        
        if (hash) {
            const params = new URLSearchParams(hash.substring(1)); // Remove the # prefix
            const token = params.get('token');
            
            if (token) {
                // Store token in localStorage
                localStorage.setItem(AUTH_TOKEN_KEY, token);
                
                // Clean up URL and redirect to dashboard
                window.history.replaceState({}, '', '/auth/callback');
                navigate('/dashboard', { replace: true });
                return;
            }
        }

        // If no token found, check for error or redirect to home
        const searchParams = new URLSearchParams(window.location.search);
        const error = searchParams.get('error');
        
        if (error) {
            navigate(`/?error=${error}`, { replace: true });
        } else {
            navigate('/', { replace: true });
        }
    }, [navigate]);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--github-bg-primary)',
            color: 'var(--github-text-primary)'
        }}>
            <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid var(--github-border)',
                borderTopColor: 'var(--color-primary-green)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }} />
            <p style={{ marginTop: '16px', color: 'var(--github-text-secondary)' }}>
                Completing sign in...
            </p>
        </div>
    );
}
