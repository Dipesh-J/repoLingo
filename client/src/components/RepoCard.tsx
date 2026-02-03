import { FaLock, FaGlobeAmericas, FaArrowRight, FaCodeBranch } from 'react-icons/fa';

interface RepoCardProps {
    repo: {
        id: number;
        name: string;
        fullName: string;
        private: boolean;
    };
    accountLogin: string;
    accountAvatarUrl: string;
    translationCount: number;
}

export default function RepoCard({ repo, accountLogin, accountAvatarUrl, translationCount }: RepoCardProps) {
    return (
        <div style={{
            padding: '16px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--github-border)',
            borderRadius: '8px',
            transition: 'all 0.2s'
        }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--github-text-muted)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--github-border)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
            }}
        >
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '12px'
            }}>
                <img
                    src={accountAvatarUrl}
                    alt={accountLogin}
                    style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%'
                    }}
                />
                <span style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--github-text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1
                }}>
                    {repo.fullName}
                </span>
                {repo.private && (
                    <FaLock size={12} style={{ color: 'var(--github-text-muted)' }} title="Private" />
                )}
            </div>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '12px',
                    color: 'var(--github-text-muted)'
                }}>
                    <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <FaGlobeAmericas size={10} />
                        {translationCount} translations
                    </span>
                </div>

                <a
                    href={`https://github.com/${repo.fullName}/pulls`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        color: 'var(--github-link)',
                        textDecoration: 'none'
                    }}
                >
                    <FaCodeBranch size={10} />
                    PRs
                    <FaArrowRight size={8} />
                </a>
            </div>
        </div>
    );
}
