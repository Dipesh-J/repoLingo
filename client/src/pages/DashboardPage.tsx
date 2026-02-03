import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FaPlus, FaGithub, FaHistory, FaGlobeAmericas, FaSync } from 'react-icons/fa';
import HowItWorks from '../components/HowItWorks';
import RepoCard from '../components/RepoCard';
import TranslationHistoryCard from '../components/TranslationHistoryCard';
import DemoPreview from '../components/DemoPreview';

export default function DashboardPage() {
    const { user, loading, installations, installUrl, history, stats, refreshInstallations, refreshHistory } = useAuth();
    const navigate = useNavigate();

    // Loading states for refresh buttons
    const [refreshingRepos, setRefreshingRepos] = useState(false);
    const [refreshingHistory, setRefreshingHistory] = useState(false);

    // Redirect to landing if not authenticated
    useEffect(() => {
        if (!loading && !user) {
            navigate('/');
        }
    }, [user, loading, navigate]);

    const handleRefreshRepos = async () => {
        setRefreshingRepos(true);
        await refreshInstallations();
        setRefreshingRepos(false);
    };

    const handleRefreshHistory = async () => {
        setRefreshingHistory(true);
        await refreshHistory();
        setRefreshingHistory(false);
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
                <style>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    if (!user) return null;

    const totalRepos = installations.reduce((sum, inst) => sum + (inst.repositories?.length || 0), 0);

    return (
        <div style={{
            minHeight: 'calc(100vh - 60px)',
            padding: '32px 24px',
            maxWidth: '1400px',
            margin: '0 auto'
        }}>
            {/* Welcome Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: '32px' }}
            >
                <h1 style={{
                    fontSize: '28px',
                    fontWeight: 600,
                    marginBottom: '8px'
                }}>
                    Welcome back, {user.name || user.login}!
                </h1>
                <p style={{
                    fontSize: '16px',
                    color: 'var(--github-text-secondary)'
                }}>
                    Manage your repositories and translations from here.
                </p>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginBottom: '32px'
                }}
            >
                <StatCard
                    icon={<FaGithub />}
                    label="Repositories"
                    value={totalRepos}
                    color="#8b949e"
                />
                <StatCard
                    icon={<FaHistory />}
                    label="Translations"
                    value={stats?.total || 0}
                    color="var(--color-primary-green)"
                />
                <StatCard
                    icon={<FaGlobeAmericas />}
                    label="Languages Used"
                    value={stats ? Object.keys(stats.byLanguage).length : 0}
                    color="#0ea5e9"
                />
            </motion.div>

            {/* Main Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 380px)',
                gap: '24px'
            }}>
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* How It Works (for new users) */}
                    {installations.length === 0 && <HowItWorks installUrl={installUrl} />}

                    {/* Repositories Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        style={{
                            background: 'var(--glass-bg)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '12px',
                            overflow: 'hidden'
                        }}
                    >
                        <div style={{
                            padding: '16px 20px',
                            borderBottom: '1px solid var(--glass-border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
                                Your Repositories
                            </h2>
                            <RefreshButton
                                onClick={handleRefreshRepos}
                                loading={refreshingRepos}
                            />
                        </div>

                        <div style={{ padding: '16px' }}>
                            {installations.length === 0 ? (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '40px 20px'
                                }}>
                                    <div style={{
                                        width: '64px',
                                        height: '64px',
                                        borderRadius: '50%',
                                        background: 'rgba(255,255,255,0.05)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 16px',
                                        color: 'var(--github-text-muted)'
                                    }}>
                                        <FaGithub size={28} />
                                    </div>
                                    <h3 style={{
                                        fontSize: '16px',
                                        fontWeight: 600,
                                        marginBottom: '8px'
                                    }}>
                                        No repositories yet
                                    </h3>
                                    <p style={{
                                        fontSize: '14px',
                                        color: 'var(--github-text-muted)',
                                        marginBottom: '20px'
                                    }}>
                                        Install repoLingo on your repositories to get started.
                                    </p>
                                    {installUrl && (
                                        <a
                                            href={installUrl}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '10px 20px',
                                                background: 'var(--color-primary-green)',
                                                color: 'white',
                                                borderRadius: '8px',
                                                fontSize: '14px',
                                                fontWeight: 600,
                                                textDecoration: 'none'
                                            }}
                                        >
                                            <FaPlus size={12} />
                                            Install on Repositories
                                        </a>
                                    )}
                                </div>
                            ) : (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                    gap: '12px'
                                }}>
                                    {installations.map(installation => (
                                        installation.repositories?.map(repo => (
                                            <RepoCard
                                                key={repo.id}
                                                repo={repo}
                                                accountLogin={installation.accountLogin}
                                                accountAvatarUrl={installation.accountAvatarUrl}
                                                translationCount={stats?.byRepo[repo.fullName] || 0}
                                            />
                                        ))
                                    ))}

                                    {/* Add More Card */}
                                    {installUrl && (
                                        <a
                                            href={installUrl}
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                padding: '24px',
                                                border: '2px dashed var(--github-border)',
                                                borderRadius: '8px',
                                                color: 'var(--github-text-muted)',
                                                textDecoration: 'none',
                                                transition: 'all 0.2s',
                                                minHeight: '100px'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.borderColor = 'var(--color-primary-green)';
                                                e.currentTarget.style.color = 'var(--color-primary-green)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.borderColor = 'var(--github-border)';
                                                e.currentTarget.style.color = 'var(--github-text-muted)';
                                            }}
                                        >
                                            <FaPlus size={20} />
                                            <span style={{ fontSize: '14px', fontWeight: 500 }}>Add More</span>
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Demo Preview */}
                    <DemoPreview />
                </div>

                {/* Right Column - Translation History */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    style={{
                        background: 'var(--glass-bg)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        height: 'fit-content',
                        position: 'sticky',
                        top: '80px'
                    }}
                >
                    <div style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid var(--glass-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
                            Recent Translations
                        </h2>
                        <RefreshButton
                            onClick={handleRefreshHistory}
                            loading={refreshingHistory}
                        />
                    </div>

                    <div style={{
                        maxHeight: '500px',
                        overflowY: 'auto'
                    }}>
                        {history.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '40px 20px',
                                color: 'var(--github-text-muted)'
                            }}>
                                <FaHistory size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                                <p style={{ fontSize: '14px', margin: 0 }}>
                                    No translations yet.<br />
                                    Translate a PR to see history here.
                                </p>
                            </div>
                        ) : (
                            <div style={{ padding: '8px' }}>
                                {history.slice(0, 10).map(record => (
                                    <TranslationHistoryCard key={record.id} record={record} />
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

// Refresh Button Component with loading state
function RefreshButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
    return (
        <button
            onClick={onClick}
            disabled={loading}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 500,
                background: loading ? 'rgba(35, 134, 54, 0.15)' : 'transparent',
                border: `1px solid ${loading ? 'var(--color-primary-green)' : 'var(--color-primary-green)'}`,
                borderRadius: '6px',
                color: 'var(--color-primary-green)',
                cursor: loading ? 'wait' : 'pointer',
                transition: 'all 0.2s',
                opacity: loading ? 0.8 : 1
            }}
            onMouseEnter={(e) => {
                if (!loading) {
                    e.currentTarget.style.background = 'rgba(35, 134, 54, 0.15)';
                }
            }}
            onMouseLeave={(e) => {
                if (!loading) {
                    e.currentTarget.style.background = 'transparent';
                }
            }}
        >
            <FaSync
                size={10}
                style={{
                    animation: loading ? 'spin 1s linear infinite' : 'none'
                }}
            />
            {loading ? 'Refreshing...' : 'Refresh'}
        </button>
    );
}

// Stat Card Component
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
    return (
        <div style={{
            padding: '20px',
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
        }}>
            <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: `${color}20`,
                color: color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
            }}>
                {icon}
            </div>
            <div>
                <div style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    lineHeight: 1
                }}>
                    {value}
                </div>
                <div style={{
                    fontSize: '13px',
                    color: 'var(--github-text-muted)',
                    marginTop: '4px'
                }}>
                    {label}
                </div>
            </div>
        </div>
    );
}
