import { motion } from 'framer-motion';
import { FaGithub } from 'react-icons/fa';

interface HowItWorksProps {
    installUrl: string | null;
}

export default function HowItWorks({ installUrl }: HowItWorksProps) {
    const steps = [
        {
            number: 1,
            title: 'Install the App',
            description: 'Add repoLingo to your GitHub repositories. Choose which repos to enable.',
            action: installUrl ? (
                <a
                    href={installUrl}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        background: 'var(--color-primary-green)',
                        color: 'white',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                        textDecoration: 'none',
                        marginTop: '12px'
                    }}
                >
                    <FaGithub size={14} />
                    Install Now
                </a>
            ) : null
        },
        {
            number: 2,
            title: 'Open a Pull Request',
            description: 'Create or view any PR in an enabled repository. A translation link appears in the checks.',
            action: null
        },
        {
            number: 3,
            title: 'Translate Instantly',
            description: 'Click the link to open the translation dashboard. Select your language and translate!',
            action: null
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                background: 'linear-gradient(135deg, rgba(35, 134, 54, 0.1) 0%, rgba(14, 165, 233, 0.1) 100%)',
                border: '1px solid rgba(35, 134, 54, 0.3)',
                borderRadius: '12px',
                padding: '24px'
            }}
        >
            <h2 style={{
                fontSize: '18px',
                fontWeight: 600,
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
            }}>
                <span style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'var(--color-primary-green)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px'
                }}>
                    ?
                </span>
                Getting Started
            </h2>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px'
            }}>
                {steps.map((step, index) => (
                    <div key={step.number} style={{ position: 'relative' }}>
                        {/* Connector line */}
                        {index < steps.length - 1 && (
                            <div 
                                className="connector-line"
                                style={{
                                    position: 'absolute',
                                    top: '20px',
                                    left: 'calc(100% - 10px)',
                                    width: '40px',
                                    height: '2px',
                                    background: 'var(--github-border)'
                                }} 
                            />
                        )}

                        <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px'
                        }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: 'rgba(255,255,255,0.1)',
                                border: '2px solid var(--color-primary-green)',
                                color: 'var(--color-primary-green)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px',
                                fontWeight: 700,
                                flexShrink: 0
                            }}>
                                {step.number}
                            </div>
                            <div>
                                <h3 style={{
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    marginBottom: '4px'
                                }}>
                                    {step.title}
                                </h3>
                                <p style={{
                                    fontSize: '13px',
                                    color: 'var(--github-text-secondary)',
                                    margin: 0,
                                    lineHeight: 1.5
                                }}>
                                    {step.description}
                                </p>
                                {step.action}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                .connector-line {
                    display: none;
                }
                @media (min-width: 768px) {
                    .connector-line {
                        display: block;
                    }
                }
            `}</style>
        </motion.div>
    );
}
