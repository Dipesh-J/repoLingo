import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { FaRegClock, FaGithub } from 'react-icons/fa';
import { GoGitPullRequest, GoGitMerge, GoIssueClosed } from 'react-icons/go';

interface PRMetadataHeaderProps {
    owner: string;
    repo: string;
    number: string;
    title: string;
    state: string;
    user: {
        login: string;
        avatar_url: string;
    };
    created_at: string;
    head: {
        ref: string;
        label: string;
    };
    base: {
        ref: string;
        label: string;
    };
    loading?: boolean;
}

export default function PRMetadataHeader({
    owner,
    repo,
    number,
    title,
    state,
    user,
    created_at,
    head,
    base,
    loading = false
}: PRMetadataHeaderProps) {

    const getStateColor = (state: string) => {
        switch (state) {
            case 'open': return '#238636';
            case 'merged': return '#8957e5';
            case 'closed': return '#da3633';
            default: return '#8b949e';
        }
    };

    const getStateIcon = (state: string) => {
        switch (state) {
            case 'open': return <GoGitPullRequest />;
            case 'merged': return <GoGitMerge />;
            case 'closed': return <GoIssueClosed />;
            default: return <GoGitPullRequest />;
        }
    };

    if (loading) return null; // Or return a specific header skeleton

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pr-header"
            style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid var(--glass-border)',
                padding: '20px 32px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                zIndex: 10
            }}
        >
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                        <h1 style={{
                            fontSize: '24px',
                            fontWeight: 600,
                            color: 'var(--github-text-primary)',
                            margin: '0 0 8px 0',
                            lineHeight: 1.3
                        }}>
                            {title} <span style={{ color: 'var(--github-text-muted)', fontWeight: 300 }}>#{number}</span>
                        </h1>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'var(--github-text-secondary)' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 12px',
                                borderRadius: '100px',
                                backgroundColor: getStateColor(state),
                                color: 'white',
                                fontWeight: 500,
                                textTransform: 'capitalize'
                            }}>
                                {getStateIcon(state)}
                                {state}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <img
                                    src={user.avatar_url}
                                    alt={user.login}
                                    style={{ width: '20px', height: '20px', borderRadius: '50%' }}
                                />
                                <span style={{ fontWeight: 600, color: 'var(--github-text-primary)' }}>{user.login}</span>
                                <span>wants to merge into <code style={{ backgroundColor: 'rgba(110,118,129,0.4)', padding: '2px 6px', borderRadius: '4px', color: 'var(--github-text-primary)' }}>{base.ref}</code></span>
                                <span>from <code style={{ backgroundColor: 'rgba(110,118,129,0.4)', padding: '2px 6px', borderRadius: '4px', color: 'var(--github-text-primary)' }}>{head.ref}</code></span>
                            </div>

                            <span style={{ margin: '0 4px' }}>•</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <FaRegClock /> {created_at && formatDistanceToNow(new Date(created_at))} ago
                            </span>
                        </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: 'var(--github-text-muted)',
                            fontSize: '14px'
                        }}>
                            <FaGithub size={16} />
                            <span>{owner} / {repo}</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
