import { motion } from 'framer-motion';
import { FaAlignLeft, FaComments } from 'react-icons/fa';

interface TabNavigationProps {
    activeTab: 'description' | 'comments';
    onTabChange: (tab: 'description' | 'comments') => void;
    commentCount?: number;
}

export default function TabNavigation({ activeTab, onTabChange, commentCount = 0 }: TabNavigationProps) {
    return (
        <div style={{
            display: 'flex',
            gap: '4px',
            padding: '4px',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(10px)',
            borderRadius: '8px',
            border: '1px solid var(--glass-border)',
            width: 'fit-content'
        }}>
            <TabButton
                isActive={activeTab === 'description'}
                onClick={() => onTabChange('description')}
                icon={<FaAlignLeft />}
                label="Description"
            />
            <TabButton
                isActive={activeTab === 'comments'}
                onClick={() => onTabChange('comments')}
                icon={<FaComments />}
                label="Conversation"
                count={commentCount}
            />
        </div>
    );
}

function TabButton({ isActive, onClick, icon, label, count }: any) {
    return (
        <button
            onClick={onClick}
            className="tab-button"
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                background: 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: isActive ? 'var(--github-text-primary)' : 'var(--github-text-secondary)',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 0.2s ease',
                position: 'relative'
            }}
        >
            {isActive && (
                <motion.div
                    layoutId="activeTab"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(35, 134, 54, 0.15)',
                        border: '1px solid var(--color-primary-green)',
                        borderRadius: '6px',
                        zIndex: -1
                    }}
                />
            )}
            {icon}
            <span>{label}</span>
            {count > 0 && (
                <span style={{
                    background: 'var(--github-border)',
                    color: 'var(--github-text-primary)',
                    padding: '0 6px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {count}
                </span>
            )}
        </button>
    );
}
