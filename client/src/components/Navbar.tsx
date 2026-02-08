import { useState, useRef, useEffect } from 'react';
import logoIcon from '../assets/logo-icon.svg';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaGithub, FaChevronDown, FaSignOutAlt, FaCog, FaHome } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
    const { user, login, logout, loading } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const location = useLocation();

    // Close menu on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isActive = (path: string) => location.pathname === path;

    return (
        <nav style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 24px',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid var(--glass-border)',
            position: 'sticky',
            top: 0,
            zIndex: 1000
        }}>
            {/* Logo */}
            <Link to="/" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                textDecoration: 'none',
                color: 'var(--github-text-primary)'
            }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '40px'
                    }}
                >
                    <img
                        src={logoIcon}
                        alt="repoLingo Logo"
                        style={{ height: '32px' }}
                    />
                </motion.div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{
                        fontWeight: 700,
                        fontSize: '20px',
                        letterSpacing: '-0.5px',
                        background: 'linear-gradient(90deg, #fff, #93DE85)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        repoLingo
                    </span>
                </div>
            </Link>

            {/* Navigation Links (when authenticated) */}
            {user && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)'
                }}>
                    <Link
                        to="/dashboard"
                        style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: 500,
                            textDecoration: 'none',
                            color: isActive('/dashboard') ? 'var(--github-text-primary)' : 'var(--github-text-secondary)',
                            background: isActive('/dashboard') ? 'rgba(255,255,255,0.1)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <FaHome size={14} />
                        Dashboard
                    </Link>
                    <Link
                        to="/dashboard/settings"
                        style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: 500,
                            textDecoration: 'none',
                            color: isActive('/dashboard/settings') ? 'var(--github-text-primary)' : 'var(--github-text-secondary)',
                            background: isActive('/dashboard/settings') ? 'rgba(255,255,255,0.1)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <FaCog size={14} />
                        Settings
                    </Link>
                </div>
            )}

            {/* User Menu / Sign In Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {loading ? (
                    <div style={{
                        width: '100px',
                        height: '36px',
                        borderRadius: '6px',
                        background: 'rgba(255,255,255,0.1)',
                        animation: 'pulse 1.5s infinite'
                    }} />
                ) : user ? (
                    <div ref={menuRef} style={{ position: 'relative' }}>
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '6px 12px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--github-border)',
                                borderRadius: '6px',
                                color: 'var(--github-text-primary)',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <img
                                src={user.avatarUrl}
                                alt={user.login}
                                style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%'
                                }}
                            />
                            <span style={{ fontSize: '14px', fontWeight: 500 }}>{user.login}</span>
                            <FaChevronDown
                                size={10}
                                style={{
                                    transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.2s'
                                }}
                            />
                        </button>

                        <AnimatePresence>
                            {menuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.15 }}
                                    style={{
                                        position: 'absolute',
                                        top: '100%',
                                        right: 0,
                                        marginTop: '8px',
                                        background: 'var(--github-bg-secondary)',
                                        border: '1px solid var(--github-border)',
                                        borderRadius: '8px',
                                        boxShadow: '0 8px 24px rgba(1,4,9,0.8)',
                                        overflow: 'hidden',
                                        minWidth: '180px'
                                    }}
                                >
                                    <div style={{
                                        padding: '12px 16px',
                                        borderBottom: '1px solid var(--github-border)'
                                    }}>
                                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--github-text-primary)' }}>
                                            {user.name || user.login}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--github-text-muted)', marginTop: '2px' }}>
                                            @{user.login}
                                        </div>
                                    </div>
                                    <Link
                                        to="/dashboard/settings"
                                        onClick={() => setMenuOpen(false)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            padding: '10px 16px',
                                            color: 'var(--github-text-secondary)',
                                            textDecoration: 'none',
                                            fontSize: '14px',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <FaCog size={14} />
                                        Settings
                                    </Link>
                                    <button
                                        onClick={() => { setMenuOpen(false); logout(); }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            padding: '10px 16px',
                                            color: '#f85149',
                                            background: 'transparent',
                                            border: 'none',
                                            width: '100%',
                                            textAlign: 'left',
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(248,81,73,0.1)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <FaSignOutAlt size={14} />
                                        Sign out
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ) : (
                    <button
                        onClick={login}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 16px',
                            background: 'var(--github-text-primary)',
                            color: 'var(--github-bg-primary)',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        <FaGithub size={16} />
                        Sign in with GitHub
                    </button>
                )}
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 0.4; }
                    50% { opacity: 0.7; }
                }
            `}</style>
        </nav>
    );
}
