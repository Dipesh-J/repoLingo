import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const languages = [
    { name: 'TypeScript', color: '#3178C6' },
    { name: 'Python', color: '#3776AB' },
    { name: 'Rust', color: '#DEA584' },
    { name: 'Go', color: '#00ADD8' }
];

const phrases = [
    "Translating Pull Requests...",
    "Understanding Context...",
    "Bridging Language Gaps...",
    "Decorating Code Reviews..."
];

export default function Typewriter() {
    const [text, setText] = useState('');
    const [phraseIndex, setPhraseIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [langIndex, setLangIndex] = useState(0);

    useEffect(() => {
        const currentPhrase = phrases[phraseIndex];
        const typeSpeed = isDeleting ? 50 : 100;

        const timeout = setTimeout(() => {
            if (!isDeleting && text.length < currentPhrase.length) {
                // Typing
                setText(currentPhrase.slice(0, text.length + 1));
            } else if (isDeleting && text.length > 0) {
                // Deleting
                setText(currentPhrase.slice(0, text.length - 1));
            } else if (!isDeleting && text.length === currentPhrase.length) {
                // Finished typing, wait before deleting
                setTimeout(() => setIsDeleting(true), 2000);
            } else if (isDeleting && text.length === 0) {
                // Finished deleting, move to next phrase
                setIsDeleting(false);
                setPhraseIndex((prev) => (prev + 1) % phrases.length);
                setLangIndex((prev) => (prev + 1) % languages.length);
            }
        }, typeSpeed);

        return () => clearTimeout(timeout);
    }, [text, isDeleting, phraseIndex]);

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '1.2rem',
            fontFamily: 'monospace',
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
            <span style={{ color: 'var(--github-text-muted)' }}>&gt;</span>
            <span style={{
                color: languages[langIndex].color,
                fontWeight: 600
            }}>
                {text}
            </span>
            <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                style={{
                    width: '8px',
                    height: '20px',
                    background: 'var(--color-primary-green)',
                    display: 'inline-block'
                }}
            />
        </div>
    );
}
