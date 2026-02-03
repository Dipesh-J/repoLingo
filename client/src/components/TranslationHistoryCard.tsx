import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FaArrowRight, FaFileAlt, FaComment } from 'react-icons/fa';
import type { TranslationRecord } from '../context/AuthContext';

interface TranslationHistoryCardProps {
    record: TranslationRecord;
}

// Language code to name mapping (subset)
const languageNames: Record<string, string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    ja: 'Japanese',
    zh: 'Chinese',
    hi: 'Hindi',
    pt: 'Portuguese',
    ru: 'Russian',
    ar: 'Arabic',
    ko: 'Korean',
    it: 'Italian',
    nl: 'Dutch',
    pl: 'Polish',
    tr: 'Turkish'
};

export default function TranslationHistoryCard({ record }: TranslationHistoryCardProps) {
    const targetLangName = languageNames[record.targetLanguage] || record.targetLanguage.toUpperCase();

    return (
        <Link
            to={`/translate/${record.owner}/${record.repo}/pr/${record.prNumber}`}
            style={{
                display: 'block',
                padding: '12px 16px',
                borderRadius: '8px',
                textDecoration: 'none',
                color: 'var(--github-text-primary)',
                transition: 'background 0.2s',
                marginBottom: '4px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
            <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
            }}>
                {/* Icon */}
                <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(35, 134, 54, 0.15)',
                    color: 'var(--color-primary-green)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                }}>
                    {record.contentType === 'comment' ? <FaComment size={14} /> : <FaFileAlt size={14} />}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}>
                        {record.owner}/{record.repo}
                        <span style={{ color: 'var(--github-text-muted)', marginLeft: '6px' }}>
                            #{record.prNumber}
                        </span>
                    </div>

                    <div style={{
                        fontSize: '12px',
                        color: 'var(--github-text-secondary)',
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            background: 'rgba(14, 165, 233, 0.15)',
                            color: '#0ea5e9',
                            borderRadius: '100px',
                            fontSize: '11px',
                            fontWeight: 500
                        }}>
                            {targetLangName}
                        </span>
                        <span style={{ color: 'var(--github-text-muted)' }}>
                            {formatDistanceToNow(new Date(record.translatedAt))} ago
                        </span>
                    </div>
                </div>

                {/* Arrow */}
                <FaArrowRight size={12} style={{ color: 'var(--github-text-muted)', flexShrink: 0 }} />
            </div>
        </Link>
    );
}
