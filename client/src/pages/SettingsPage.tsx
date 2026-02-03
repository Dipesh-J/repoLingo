import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FaSave, FaGlobe, FaBell, FaMagic, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { languages } from '../languages';

export default function SettingsPage() {
    const { user, loading, preferences, updatePreferences } = useAuth();
    const navigate = useNavigate();
    const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [defaultLanguage, setDefaultLanguage] = useState('en');
    const [autoTranslate, setAutoTranslate] = useState(false);
    const [emailNotifications, setEmailNotifications] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (savedTimerRef.current) {
                clearTimeout(savedTimerRef.current);
            }
        };
    }, []);

    // Redirect if not authenticated
    useEffect(() => {
        if (!loading && !user) {
            navigate('/');
        }
    }, [user, loading, navigate]);

    // Load preferences
    useEffect(() => {
        if (preferences) {
            setDefaultLanguage(preferences.defaultTargetLanguage);
            setAutoTranslate(preferences.autoTranslate);
            setEmailNotifications(preferences.emailNotifications);
        }
    }, [preferences]);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSaved(false);

        // Clear any existing timer
        if (savedTimerRef.current) {
            clearTimeout(savedTimerRef.current);
            savedTimerRef.current = null;
        }

        try {
            await updatePreferences({
                defaultTargetLanguage: defaultLanguage,
                autoTranslate,
                emailNotifications
            });
            setSaved(true);
            savedTimerRef.current = setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to save preferences. Please try again.';
            setError(message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{
                minHeight: 'calc(100vh - 60px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
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

    if (!user) return null;

    return (
        <div style={{
            minHeight: 'calc(100vh - 60px)',
            padding: '32px 24px',
            maxWidth: '800px',
            margin: '0 auto'
        }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 style={{
                    fontSize: '28px',
                    fontWeight: 600,
                    marginBottom: '8px'
                }}>
                    Settings
                </h1>
                <p style={{
                    fontSize: '16px',
                    color: 'var(--github-text-secondary)',
                    marginBottom: '32px'
                }}>
                    Manage your translation preferences and notifications.
                </p>

                {/* Settings Card */}
                <div style={{
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '12px',
                    overflow: 'hidden'
                }}>
                    {/* Default Language */}
                    <div style={{
                        padding: '20px 24px',
                        borderBottom: '1px solid var(--glass-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                background: 'rgba(14, 165, 233, 0.15)',
                                color: '#0ea5e9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <FaGlobe size={18} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
                                    Default Target Language
                                </h3>
                                <p style={{ fontSize: '13px', color: 'var(--github-text-muted)', margin: 0 }}>
                                    Pre-selected language when you open the translator
                                </p>
                            </div>
                        </div>
                        <select
                            value={defaultLanguage}
                            onChange={(e) => setDefaultLanguage(e.target.value)}
                            style={{
                                padding: '8px 12px',
                                background: 'var(--github-bg-secondary)',
                                border: '1px solid var(--github-border)',
                                borderRadius: '6px',
                                color: 'var(--github-text-primary)',
                                fontSize: '14px',
                                minWidth: '180px',
                                cursor: 'pointer'
                            }}
                        >
                            {languages.filter(l => l.popular).map(lang => (
                                <option key={lang.code} value={lang.code}>
                                    {lang.nativeName} ({lang.code})
                                </option>
                            ))}
                            <option disabled>──────────</option>
                            {languages.filter(l => !l.popular).map(lang => (
                                <option key={lang.code} value={lang.code}>
                                    {lang.nativeName} ({lang.code})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Auto Translate */}
                    <div style={{
                        padding: '20px 24px',
                        borderBottom: '1px solid var(--glass-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                background: 'rgba(168, 85, 247, 0.15)',
                                color: '#a855f7',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <FaMagic size={18} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
                                    Auto-Translate
                                </h3>
                                <p style={{ fontSize: '13px', color: 'var(--github-text-muted)', margin: 0 }}>
                                    Automatically translate when opening a PR (coming soon)
                                </p>
                            </div>
                        </div>
                        <ToggleSwitch
                            checked={autoTranslate}
                            onChange={setAutoTranslate}
                            disabled={true}
                            ariaLabel="Auto-Translate"
                        />
                    </div>

                    {/* Email Notifications */}
                    <div style={{
                        padding: '20px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                background: 'rgba(251, 191, 36, 0.15)',
                                color: '#fbbf24',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <FaBell size={18} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
                                    Email Notifications
                                </h3>
                                <p style={{ fontSize: '13px', color: 'var(--github-text-muted)', margin: 0 }}>
                                    Receive updates about new features (coming soon)
                                </p>
                            </div>
                        </div>
                        <ToggleSwitch
                            checked={emailNotifications}
                            onChange={setEmailNotifications}
                            disabled={true}
                            ariaLabel="Email Notifications"
                        />
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            marginTop: '16px',
                            padding: '12px 16px',
                            background: 'rgba(248, 81, 73, 0.15)',
                            border: '1px solid rgba(248, 81, 73, 0.3)',
                            borderRadius: '8px',
                            color: '#f85149',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}
                    >
                        <FaExclamationTriangle />
                        {error}
                    </motion.div>
                )}

                {/* Save Button */}
                <div style={{
                    marginTop: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 24px',
                            background: 'var(--color-primary-green)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: saving ? 'wait' : 'pointer',
                            opacity: saving ? 0.7 : 1,
                            transition: 'all 0.2s'
                        }}
                    >
                        {saving ? (
                            <>Saving...</>
                        ) : saved ? (
                            <>
                                <FaCheck />
                                Saved!
                            </>
                        ) : (
                            <>
                                <FaSave />
                                Save Preferences
                            </>
                        )}
                    </button>

                    {saved && (
                        <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            style={{
                                color: 'var(--color-primary-green)',
                                fontSize: '14px'
                            }}
                        >
                            Preferences updated successfully!
                        </motion.span>
                    )}
                </div>

                {/* Account Section */}
                <div style={{ marginTop: '48px' }}>
                    <h2 style={{
                        fontSize: '18px',
                        fontWeight: 600,
                        marginBottom: '16px'
                    }}>
                        Account
                    </h2>
                    <div style={{
                        background: 'var(--glass-bg)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '12px',
                        padding: '20px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                    }}>
                        <img
                            src={user.avatarUrl}
                            alt={user.login}
                            style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%'
                            }}
                        />
                        <div>
                            <div style={{ fontSize: '16px', fontWeight: 600 }}>
                                {user.name || user.login}
                            </div>
                            <div style={{ fontSize: '14px', color: 'var(--github-text-muted)' }}>
                                @{user.login}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

// Toggle Switch Component
function ToggleSwitch({ checked, onChange, disabled = false, ariaLabel }: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    ariaLabel: string;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={ariaLabel}
            onClick={() => !disabled && onChange(!checked)}
            disabled={disabled}
            style={{
                width: '44px',
                height: '24px',
                borderRadius: '12px',
                background: checked ? 'var(--color-primary-green)' : 'var(--github-border)',
                border: 'none',
                padding: '2px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                transition: 'background 0.2s',
                position: 'relative'
            }}
        >
            <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'white',
                transition: 'transform 0.2s',
                transform: checked ? 'translateX(20px)' : 'translateX(0)'
            }} />
        </button>
    );
}
