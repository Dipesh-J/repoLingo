import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FaGithub, FaArrowRight, FaCheck } from 'react-icons/fa';
import Typewriter from '../components/Typewriter';
import { GlobeIcon, BrainIcon, MergeIcon, DownloadIcon, PullRequestIcon, SparklesIcon } from '../components/Icons';

export default function LandingPage() {
    const { login, error, loading } = useAuth();

    const features = [
        {
            icon: GlobeIcon,
            title: 'Multi-Language Support',
            description: 'Translate PR descriptions and comments into 80+ languages instantly.'
        },
        {
            icon: BrainIcon,
            title: 'Context-Aware Translation',
            description: 'Preserves code blocks, markdown formatting, and technical terms.'
        },
        {
            icon: MergeIcon,
            title: 'Seamless Integration',
            description: 'Works automatically with your GitHub workflow. Just install and go.'
        }
    ];

    const steps = [
        { step: 1, title: 'Install the App', description: 'Add repoLingo to your repositories', icon: DownloadIcon },
        { step: 2, title: 'Open a PR', description: 'Create or view any Pull Request', icon: PullRequestIcon },
        { step: 3, title: 'Translate', description: 'Use the translation dashboard link', icon: SparklesIcon }
    ];

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--github-bg-primary)',
            color: 'var(--github-text-primary)'
        }}>
            {/* Hero Section */}
            <section style={{
                padding: '80px 24px',
                maxWidth: '1200px',
                margin: '0 auto',
                textAlign: 'center'
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {/* Badge */}
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 16px',
                        background: 'rgba(147, 222, 133, 0.1)',
                        border: '1px solid rgba(147, 222, 133, 0.2)',
                        borderRadius: '100px',
                        fontSize: '14px',
                        color: 'var(--color-primary-green)',
                        marginBottom: '24px'
                    }}>
                        <FaGithub />
                        GitHub App
                    </div>

                    {/* Headline */}
                    <h1 style={{
                        fontSize: 'clamp(40px, 6vw, 64px)',
                        fontWeight: 700,
                        lineHeight: 1.1,
                        marginBottom: '24px',
                        background: 'linear-gradient(135deg, #fff 0%, #a0aec0 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Translate GitHub PRs<br />
                        <span style={{
                            background: 'linear-gradient(135deg, var(--color-primary-green), #4 ade80)',
                            WebkitBackgroundClip: 'text'
                        }}>
                            in any language
                        </span>
                    </h1>

                    {/* Typewriter Animation */}
                    <div style={{
                        margin: '0 auto 32px',
                        display: 'flex',
                        justifyContent: 'center'
                    }}>
                        <Typewriter />
                    </div>

                    {/* Subheadline */}
                    <p style={{
                        fontSize: '20px',
                        color: 'var(--github-text-secondary)',
                        maxWidth: '600px',
                        margin: '0 auto 40px',
                        lineHeight: 1.6
                    }}>
                        Bridge language barriers in your open source projects. Translate PR descriptions and comments instantly while preserving code and formatting.
                    </p>

                    {/* Error Message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                padding: '12px 20px',
                                background: 'rgba(248, 81, 73, 0.15)',
                                border: '1px solid rgba(248, 81, 73, 0.4)',
                                borderRadius: '8px',
                                color: '#f85149',
                                fontSize: '14px',
                                marginBottom: '24px',
                                maxWidth: '400px',
                                margin: '0 auto 24px'
                            }}
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* CTA Button */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={login}
                        disabled={loading}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '16px 32px',
                            fontSize: '18px',
                            fontWeight: 600,
                            background: 'linear-gradient(135deg, var(--color-primary-green), #6fdd55)',
                            color: '#000',
                            border: 'none',
                            borderRadius: '12px',
                            cursor: loading ? 'wait' : 'pointer',
                            boxShadow: '0 4px 20px rgba(147, 222, 133, 0.3)',
                            transition: 'all 0.2s'
                        }}
                    >
                        <FaGithub size={20} />
                        {loading ? 'Loading...' : 'Get Started with GitHub'}
                        {!loading && <FaArrowRight size={16} />}
                    </motion.button>

                    <p style={{
                        fontSize: '14px',
                        color: 'var(--github-text-muted)',
                        marginTop: '16px'
                    }}>
                        Free for public repositories
                    </p>
                </motion.div>
            </section>

            {/* How It Works */}
            <section style={{
                padding: '60px 24px',
                background: 'var(--github-bg-secondary)',
                borderTop: '1px solid var(--github-border)',
                borderBottom: '1px solid var(--github-border)'
            }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <h2 style={{
                        fontSize: '32px',
                        fontWeight: 600,
                        textAlign: 'center',
                        marginBottom: '48px'
                    }}>
                        How It Works
                    </h2>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '32px'
                    }}>
                        {steps.map((item, index) => (
                            <motion.div
                                key={item.step}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 + 0.2 }}
                                style={{
                                    padding: '32px',
                                    background: 'var(--glass-bg)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '12px',
                                    position: 'relative',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    textAlign: 'center'
                                }}
                            >
                                <div style={{
                                    marginBottom: '24px',
                                    position: 'relative',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    height: '100px',
                                    width: '100px',
                                    background: 'rgba(35, 134, 54, 0.1)',
                                    borderRadius: '50%',
                                    border: '1px solid var(--color-primary-green)'
                                }}>
                                    <item.icon
                                        width={48}
                                        height={48}
                                        color="var(--color-primary-green)"
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        right: 0,
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        background: 'var(--color-primary-green)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '14px',
                                        fontWeight: 700,
                                        color: '#000',
                                        border: '2px solid var(--github-bg-secondary)'
                                    }}>
                                        {item.step}
                                    </div>
                                </div>
                                <h3 style={{
                                    fontSize: '18px',
                                    fontWeight: 600,
                                    marginBottom: '8px'
                                }}>
                                    {item.title}
                                </h3>
                                <p style={{
                                    fontSize: '14px',
                                    color: 'var(--github-text-secondary)',
                                    margin: 0
                                }}>
                                    {item.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section style={{
                padding: '80px 24px',
                maxWidth: '1200px',
                margin: '0 auto'
            }}>
                <h2 style={{
                    fontSize: '32px',
                    fontWeight: 600,
                    textAlign: 'center',
                    marginBottom: '48px'
                }}>
                    Features
                </h2>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '24px'
                }}>
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 + 0.3 }}
                            style={{
                                padding: '32px',
                                background: 'var(--glass-bg)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '12px'
                            }}
                        >
                            <div style={{
                                width: '60px',
                                height: '60px',
                                marginBottom: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(35, 134, 54, 0.1)',
                                borderRadius: '12px',
                                color: 'var(--color-primary-green)'
                            }}>
                                <feature.icon
                                    width={32}
                                    height={32}
                                />
                            </div>
                            <h3 style={{
                                fontSize: '18px',
                                fontWeight: 600,
                                marginBottom: '8px'
                            }}>
                                {feature.title}
                            </h3>
                            <p style={{
                                fontSize: '14px',
                                color: 'var(--github-text-secondary)',
                                margin: 0,
                                lineHeight: 1.6
                            }}>
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Supported Languages Preview */}
            <section style={{
                padding: '60px 24px',
                textAlign: 'center',
                background: 'var(--github-bg-secondary)',
                borderTop: '1px solid var(--github-border)'
            }}>
                <h2 style={{
                    fontSize: '24px',
                    fontWeight: 600,
                    marginBottom: '24px'
                }}>
                    80+ Languages Supported
                </h2>
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: '12px',
                    maxWidth: '800px',
                    margin: '0 auto'
                }}>
                    {['English', 'Spanish', 'French', 'German', 'Japanese', 'Chinese', 'Hindi', 'Portuguese', 'Russian', 'Arabic', 'Korean', 'Italian'].map(lang => (
                        <span
                            key={lang}
                            style={{
                                padding: '8px 16px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--github-border)',
                                borderRadius: '100px',
                                fontSize: '14px',
                                color: 'var(--github-text-secondary)'
                            }}
                        >
                            {lang}
                        </span>
                    ))}
                    <span style={{
                        padding: '8px 16px',
                        background: 'rgba(147, 222, 133, 0.1)',
                        border: '1px solid rgba(147, 222, 133, 0.3)',
                        borderRadius: '100px',
                        fontSize: '14px',
                        color: 'var(--color-primary-green)'
                    }}>
                        +70 more
                    </span>
                </div>
            </section>

            {/* Final CTA */}
            <section style={{
                padding: '80px 24px',
                textAlign: 'center'
            }}>
                <h2 style={{
                    fontSize: '32px',
                    fontWeight: 600,
                    marginBottom: '16px'
                }}>
                    Ready to break language barriers?
                </h2>
                <p style={{
                    fontSize: '16px',
                    color: 'var(--github-text-secondary)',
                    marginBottom: '32px'
                }}>
                    Start translating PRs in your repositories today.
                </p>
                <button
                    onClick={login}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '14px 28px',
                        fontSize: '16px',
                        fontWeight: 600,
                        background: 'var(--github-text-primary)',
                        color: 'var(--github-bg-primary)',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer'
                    }}
                >
                    <FaGithub size={18} />
                    Sign in with GitHub
                </button>
            </section>

            {/* Footer */}
            <footer style={{
                padding: '24px',
                textAlign: 'center',
                borderTop: '1px solid var(--github-border)',
                fontSize: '14px',
                color: 'var(--github-text-muted)'
            }}>
                Built with <FaCheck style={{ color: 'var(--color-primary-green)', margin: '0 4px' }} /> for the open source community
            </footer>
        </div>
    );
}
