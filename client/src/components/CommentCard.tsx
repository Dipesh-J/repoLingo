import { formatDistanceToNow } from 'date-fns';
import SkeletonLoader from './SkeletonLoader';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const githubCodeTheme = {
    ...vscDarkPlus,
    'pre[class*="language-"]': {
        ...vscDarkPlus['pre[class*="language-" ]'],
        background: '#161b22',
        border: '1px solid #30363d',
    },
};

interface CommentProps {
    id?: number;
    user?: {
        login: string;
        avatar_url: string;
    };
    created_at?: string;
    body: string;
    loading?: boolean;
    selectable?: boolean;
    selected?: boolean;
    onSelect?: (id: number, selected: boolean) => void;
    badges?: string[];
}

export default function CommentCard({
    id,
    user,
    created_at,
    body,
    loading,
    selectable = false,
    selected = false,
    onSelect,
    badges = []
}: CommentProps) {
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                gap: '16px',
                marginBottom: '16px'
            }}>
                {/* Avatar skeleton */}
                <SkeletonLoader width="40px" height="40px" borderRadius="50%" />

                {/* Card skeleton */}
                <div style={{
                    flex: 1,
                    border: '1px solid #30363d',
                    borderRadius: '6px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        padding: '8px 16px',
                        background: '#161b22',
                        borderBottom: '1px solid #30363d',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <SkeletonLoader width="100px" height="14px" />
                        <SkeletonLoader width="80px" height="14px" />
                    </div>
                    <div style={{ padding: '16px', background: '#0d1117' }}>
                        <SkeletonLoader width="90%" height="14px" marginBottom="8px" />
                        <SkeletonLoader width="70%" height="14px" />
                    </div>
                </div>
            </div>
        );
    }

    const MarkdownRenderer = ({ content }: { content: string }) => (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '')
                    return !inline && match ? (
                        <SyntaxHighlighter
                            style={githubCodeTheme}
                            language={match[1]}
                            PreTag="div"
                            customStyle={{
                                background: '#161b22',
                                border: '1px solid #30363d',
                                borderRadius: '6px',
                                padding: '12px',
                                margin: '12px 0',
                                fontSize: '13px'
                            }}
                            {...props}
                        >
                            {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                    ) : (
                        <code className={className} {...props} style={{
                            background: 'rgba(110,118,129,0.4)',
                            padding: '0.2em 0.4em',
                            borderRadius: '6px',
                            fontSize: '85%'
                        }}>
                            {children}
                        </code>
                    )
                }
            }}
        >
            {content}
        </ReactMarkdown>
    );

    const handleCardClick = () => {
        if (selectable && onSelect && id !== undefined) {
            onSelect(id, !selected);
        }
    };

    return (
        <div
            onClick={selectable ? handleCardClick : undefined}
            style={{
                display: 'flex',
                gap: '16px',
                marginBottom: '16px',
                alignItems: 'flex-start',
                cursor: selectable ? 'pointer' : 'default',
                opacity: (selectable && !selected) ? 0.8 : 1,
                transition: 'all 0.2s ease'
            }}
        >
            {/* Avatar Column */}
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '40px', flexShrink: 0 }}>
                {user && (
                    <img
                        src={user.avatar_url}
                        alt={user.login}
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            flexShrink: 0,
                            position: 'relative',
                            zIndex: 1,
                            backgroundColor: '#0d1117',
                            objectFit: 'cover'
                        }}
                    />
                )}
            </div>

            {/* Comment Card - GitHub Style with Highlight */}
            <div style={{
                flex: 1,
                border: selected ? '1px solid var(--color-primary-green)' : '1px solid #30363d', // Green border when selected
                borderRadius: '6px',
                overflow: 'visible',
                background: selected ? 'rgba(35, 134, 54, 0.1)' : '#0d1117', // Slight green tint when selected
                position: 'relative',
                boxShadow: selected ? '0 0 0 2px var(--color-green-glow)' : 'none',
                transition: 'all 0.2s ease'
            }}>
                {/* Arrow pointer */}
                <div style={{
                    position: 'absolute',
                    top: '11px',
                    left: '-15px',
                    width: '16px',
                    height: '16px',
                    pointerEvents: 'none',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '1px',
                        left: '10px',
                        width: '12px',
                        height: '12px',
                        background: selected ? (selected ? '#1c2128' : '#161b22') : '#161b22', // Adjust if possible but header matches
                        borderLeft: selected ? '1px solid var(--color-primary-green)' : '1px solid #30363d',
                        borderBottom: selected ? '1px solid var(--color-primary-green)' : '1px solid #30363d',
                        transform: 'rotate(45deg)',
                        boxShadow: selected ? '-1px 1px 0 0 var(--color-primary-green)' : '-1px 1px 0 0 #30363d'
                    }} />
                </div>
                {/* Header */}
                <div style={{
                    padding: '8px 16px',
                    background: selected ? 'rgba(35, 134, 54, 0.15)' : '#161b22',
                    borderBottom: selected ? '1px solid var(--color-primary-green)' : '1px solid #30363d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '14px',
                    borderTopLeftRadius: '5px',
                    borderTopRightRadius: '5px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, color: '#c9d1d9' }}>
                            {user?.login || 'Unknown'}
                        </span>
                        {badges.map((badge, i) => (
                            <span key={i} style={{
                                fontSize: '12px',
                                padding: '0 7px',
                                border: '1px solid #30363d',
                                borderRadius: '2em',
                                color: '#8b949e',
                                fontWeight: 500
                            }}>
                                {badge}
                            </span>
                        ))}
                        {created_at && (
                            <span style={{ color: '#8b949e' }}>
                                commented {formatDistanceToNow(new Date(created_at))} ago
                            </span>
                        )}
                    </div>
                </div>

                {/* Body */}
                <div className="markdown-body" style={{
                    padding: '16px',
                    fontSize: '14px',
                    lineHeight: 1.5,
                    color: '#c9d1d9'
                }}>
                    <MarkdownRenderer content={body} />
                </div>
            </div>
        </div>
    );
}
