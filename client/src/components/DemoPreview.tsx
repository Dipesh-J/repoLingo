import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlay, FaExchangeAlt, FaCheck } from 'react-icons/fa';

export default function DemoPreview() {
    const [step, setStep] = useState(0);
    const [translating, setTranslating] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    const originalText = `## Description

This PR adds a new user authentication flow using OAuth 2.0.

### Changes
- Added login with GitHub
- Added session management
- Updated user profile page

\`\`\`typescript
const user = await authenticate(token);
\`\`\`

Please review and let me know if you have questions!`;

    const translatedText = `## Descripcion

Este PR agrega un nuevo flujo de autenticacion de usuario usando OAuth 2.0.

### Cambios
- Agregado inicio de sesion con GitHub
- Agregado gestion de sesiones
- Actualizada pagina de perfil de usuario

\`\`\`typescript
const user = await authenticate(token);
\`\`\`

Por favor revise y hagame saber si tiene preguntas!`;

    const handleDemo = () => {
        setStep(1);
        setTranslating(true);
        timerRef.current = setTimeout(() => {
            setTranslating(false);
            setStep(2);
        }, 1500);
    };

    const resetDemo = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        setStep(0);
        setTranslating(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
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
                    See It In Action
                </h2>
                {step === 0 ? (
                    <button
                        onClick={handleDemo}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 16px',
                            background: 'var(--color-primary-green)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        <FaPlay size={10} />
                        Run Demo
                    </button>
                ) : (
                    <button
                        onClick={resetDemo}
                        style={{
                            padding: '8px 16px',
                            background: 'transparent',
                            border: '1px solid var(--github-border)',
                            color: 'var(--github-text-secondary)',
                            borderRadius: '6px',
                            fontSize: '13px',
                            cursor: 'pointer'
                        }}
                    >
                        Reset
                    </button>
                )}
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1px',
                background: 'var(--github-border)'
            }}>
                {/* Original */}
                <div style={{ background: 'var(--github-bg-primary)', padding: '16px' }}>
                    <div style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--github-text-muted)',
                        marginBottom: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        Original (English)
                    </div>
                    <div style={{
                        fontSize: '13px',
                        lineHeight: 1.6,
                        color: 'var(--github-text-secondary)',
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'ui-monospace, monospace'
                    }}>
                        {originalText.slice(0, 200)}...
                    </div>
                </div>

                {/* Translated */}
                <div style={{ background: 'var(--github-bg-primary)', padding: '16px', position: 'relative' }}>
                    <div style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--github-text-muted)',
                        marginBottom: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        Translated (Spanish)
                        {step === 2 && (
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '2px 8px',
                                background: 'rgba(35, 134, 54, 0.15)',
                                color: 'var(--color-primary-green)',
                                borderRadius: '100px',
                                fontSize: '10px',
                                fontWeight: 600
                            }}>
                                <FaCheck size={8} />
                                Done
                            </span>
                        )}
                    </div>

                    <AnimatePresence mode="wait">
                        {step === 0 && (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '100px',
                                    color: 'var(--github-text-muted)',
                                    fontSize: '13px'
                                }}
                            >
                                Click "Run Demo" to see translation
                            </motion.div>
                        )}

                        {step === 1 && translating && (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '100px',
                                    gap: '12px'
                                }}
                            >
                                <FaExchangeAlt
                                    size={24}
                                    style={{
                                        color: 'var(--color-primary-green)',
                                        animation: 'pulse 1s infinite'
                                    }}
                                />
                                <span style={{ color: 'var(--github-text-secondary)', fontSize: '13px' }}>
                                    Translating...
                                </span>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    fontSize: '13px',
                                    lineHeight: 1.6,
                                    color: 'var(--github-text-secondary)',
                                    whiteSpace: 'pre-wrap',
                                    fontFamily: 'ui-monospace, monospace'
                                }}
                            >
                                {translatedText.slice(0, 200)}...
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div style={{
                padding: '12px 20px',
                background: 'rgba(255,255,255,0.02)',
                borderTop: '1px solid var(--glass-border)',
                fontSize: '12px',
                color: 'var(--github-text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                <FaCheck style={{ color: 'var(--color-primary-green)' }} />
                Code blocks and markdown formatting are preserved during translation
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(1.1); }
                }
            `}</style>
        </motion.div>
    );
}
