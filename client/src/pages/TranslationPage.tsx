import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FaArrowRight, FaSpinner, FaExchangeAlt, FaCheckSquare, FaRegSquare } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

import LanguageSelector from '../components/LanguageSelector';
import PRMetadataHeader from '../components/PRMetadataHeader';
import SkeletonLoader from '../components/SkeletonLoader';
import TabNavigation from '../components/TabNavigation';
import CommentCard from '../components/CommentCard';

const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:3000') + '/api';

// GitHub-style syntax highlighter theme
const githubCodeTheme = {
  ...vscDarkPlus,
  'pre[class*="language-"]': {
    ...vscDarkPlus['pre[class*="language-" ]'],
    background: '#0d1117',
    border: '1px solid #30363d',
  },
};

interface PRData {
  title: string;
  body: string;
  url: string;
  state: string;
  number: string;
  created_at: string;
  user: {
    login: string;
    avatar_url: string;
  };
  head: {
    ref: string;
    label: string;
  };
  base: {
    ref: string;
    label: string;
  };
}

interface Comment {
  id: number;
  user: {
    login: string;
    avatar_url: string;
  };
  body: string;
  created_at: string;
}

export default function TranslationPage() {
  const { owner, repo, number } = useParams();
  const [prData, setPrData] = useState<PRData | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);

  const [activeTab, setActiveTab] = useState<'description' | 'comments'>('description');

  const [translated, setTranslated] = useState('');
  const [translatedComments, setTranslatedComments] = useState<Record<number, string>>({});

  const [translating, setTranslating] = useState(false);
  const [targetLang, setTargetLang] = useState('en');
  const [selectedCommentIds, setSelectedCommentIds] = useState<Set<number>>(new Set());

  // Selection handlers
  const handleCommentSelect = (id: number, selected: boolean) => {
    setSelectedCommentIds(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedCommentIds(new Set(comments.map(c => c.id)));
  };

  const handleDeselectAll = () => {
    setSelectedCommentIds(new Set());
  };

  useEffect(() => {
    async function fetchPR() {
      try {
        const res = await axios.get(`${API_BASE}/pr/${owner}/${repo}/${number}`);
        setPrData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchPR();
  }, [owner, repo, number]);

  // Fetch comments when tab switches to 'comments'
  useEffect(() => {
    if (activeTab === 'comments' && comments.length === 0) {
      async function fetchComments() {
        setLoadingComments(true);
        try {
          const res = await axios.get(`${API_BASE}/pr/${owner}/${repo}/${number}/comments`);
          setComments(res.data);
        } catch (err) {
          console.error("Error fetching comments", err);
        } finally {
          setLoadingComments(false);
        }
      }
      fetchComments();
    }
  }, [activeTab, owner, repo, number, comments.length]);

  const handleTranslate = async () => {
    // Include PR info for history tracking (if user is authenticated)
    const prInfo = {
      owner,
      repo,
      number: parseInt(number || '0'),
      title: prData?.title || 'Unknown PR',
      contentType: activeTab as 'description' | 'comment'
    };

    if (activeTab === 'description') {
      if (!prData?.body) return;
      setTranslating(true);
      try {
        const res = await axios.post(`${API_BASE}/translate`, {
          text: prData.body,
          targetLanguage: targetLang,
          prInfo
        }, { withCredentials: true });
        setTranslated(res.data.translation);
      } catch (err) {
        console.error('Translation error:', err);
      } finally {
        setTranslating(false);
      }
    } else {
      // Translate only selected comments
      if (selectedCommentIds.size === 0) return;
      setTranslating(true);
      try {
        // Translate only selected comments concurrently
        const selectedComments = comments.filter(c => selectedCommentIds.has(c.id));
        const promises = selectedComments.map(async (comment) => {
          const res = await axios.post(`${API_BASE}/translate`, {
            text: comment.body,
            targetLanguage: targetLang,
            prInfo: { ...prInfo, contentType: 'comment' }
          }, { withCredentials: true });
          return { id: comment.id, text: res.data.translation };
        });

        const results = await Promise.all(promises);
        const newTranslatedComments = { ...translatedComments };
        results.forEach(r => {
          newTranslatedComments[r.id] = r.text;
        });
        setTranslatedComments(newTranslatedComments);

      } catch (err) {
        console.error('Translation error:', err);
      } finally {
        setTranslating(false);
      }
    }
  };

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
                background: '#0d1117',
                border: '1px solid #30363d',
                borderRadius: '6px',
                padding: '16px',
                margin: '16px 0',
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

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      color: 'var(--github-text-primary)'
    }}>

      {/* Dynamic Header */}
      <AnimatePresence mode='wait'>
        {loading ? (
          <motion.div
            key="header-skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              padding: '20px 32px',
              borderBottom: '1px solid var(--glass-border)',
              background: 'var(--glass-bg)'
            }}
          >
            <SkeletonLoader height="32px" width="40%" marginBottom="16px" />
            <div style={{ display: 'flex', gap: '12px' }}>
              <SkeletonLoader height="24px" width="80px" borderRadius="100px" />
              <SkeletonLoader height="24px" width="200px" />
            </div>
          </motion.div>
        ) : prData ? (
          <PRMetadataHeader
            key="header-real"
            owner={owner || ''}
            repo={repo || ''}
            number={number || ''}
            title={prData.title}
            state={prData.state}
            user={prData.user}
            created_at={prData.created_at}
            head={prData.head}
            base={prData.base}
          />
        ) : null}
      </AnimatePresence>

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        overflow: 'hidden',
        padding: '24px',
        maxWidth: '1600px',
        width: '100%',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column'
      }}>

        {/* Controls Toolbar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '24px',
          position: 'relative',
          zIndex: 100
        }}>

          <TabNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            commentCount={comments.length}
          />

          <div style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(10px)',
            padding: '6px',
            borderRadius: '8px',
            border: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}>
            <LanguageSelector
              value={targetLang}
              onChange={setTargetLang}
            />
            <button
              onClick={handleTranslate}
              disabled={translating || loading || !prData || (activeTab === 'comments' && selectedCommentIds.size === 0)}
              className="btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 16px',
                fontSize: '14px',
                fontWeight: 600,
                borderRadius: '6px',
                border: 'none',
                cursor: translating ? 'wait' : 'pointer'
              }}
            >
              {translating ? (
                <>
                  <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Translating...</span>
                </>
              ) : (
                <>
                  <FaExchangeAlt />
                  <span>Translate</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Split View Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          flex: 1,
          minHeight: 0
        }}>

          {/* Original Column */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            style={{
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(10px)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: 'var(--glass-shadow)'
            }}
          >
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid var(--glass-border)',
              background: 'rgba(255,255,255,0.02)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
                {activeTab === 'description' ? 'Original Description' : 'Original Thread'}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {activeTab === 'comments' && comments.length > 0 && (
                  <>
                    <button
                      onClick={handleSelectAll}
                      disabled={selectedCommentIds.size === comments.length}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        fontSize: '12px',
                        background: 'transparent',
                        border: '1px solid var(--github-border)',
                        borderRadius: '4px',
                        color: 'var(--github-text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      <FaCheckSquare size={12} />
                      Select All
                    </button>
                    <button
                      onClick={handleDeselectAll}
                      disabled={selectedCommentIds.size === 0}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        fontSize: '12px',
                        background: 'transparent',
                        border: '1px solid var(--github-border)',
                        borderRadius: '4px',
                        color: 'var(--github-text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      <FaRegSquare size={12} />
                      Deselect
                    </button>
                    <span style={{
                      fontSize: '12px',
                      color: 'var(--github-text-muted)',
                      padding: '2px 8px',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '100px'
                    }}>
                      {selectedCommentIds.size}/{comments.length} selected
                    </span>
                  </>
                )}
                <span style={{ fontSize: '12px', color: 'var(--github-text-secondary)', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '100px' }}>Markdown</span>
              </div>
            </div>

            <div className={activeTab === 'description' ? "markdown-body" : ""} style={{
              flex: 1,
              overflowY: 'auto',
              padding: activeTab === 'description' ? '24px' : '0',
              fontSize: '15px',
              lineHeight: 1.6
            }}>
              {activeTab === 'description' ? (
                loading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <SkeletonLoader height="20px" width="60%" />
                    <SkeletonLoader height="16px" width="90%" />
                    <SkeletonLoader height="16px" width="85%" />
                    <SkeletonLoader height="16px" width="80%" />
                    <SkeletonLoader height="100px" marginTop="16px" />
                  </div>
                ) : prData ? (
                  <MarkdownRenderer content={prData.body} />
                ) : (
                  <div style={{ color: 'var(--github-text-muted)', textAlign: 'center', padding: '40px' }}>Failed to load content</div>
                )
              ) : (
                // Comments View
                loadingComments ? (
                  <div style={{ padding: '24px' }}>
                    <SkeletonLoader height="80px" marginBottom="16px" />
                    <SkeletonLoader height="80px" marginBottom="16px" />
                    <SkeletonLoader height="80px" marginBottom="16px" />
                  </div>
                ) : comments.length > 0 ? (
                  <div style={{ padding: '16px' }}>
                    {comments.map(comment => (
                      <CommentCard
                        key={comment.id}
                        id={comment.id}
                        user={comment.user}
                        created_at={comment.created_at}
                        body={comment.body}
                        selectable={true}
                        selected={selectedCommentIds.has(comment.id)}
                        onSelect={handleCommentSelect}
                      />
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--github-text-muted)' }}>
                    No comments in this conversation.
                  </div>
                )
              )}
            </div>
          </motion.div>

          {/* Translated Column */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(10px)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: 'var(--glass-shadow)'
            }}
          >
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid var(--glass-border)',
              background: 'rgba(255,255,255,0.02)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
                Translated <span style={{ color: 'var(--github-text-muted)', fontWeight: 400 }}>({targetLang.toUpperCase()})</span>
              </h2>
            </div>

            <div className={activeTab === 'description' ? "markdown-body" : ""} style={{
              flex: 1,
              overflowY: 'auto',
              padding: activeTab === 'description' ? '24px' : '0',
              fontSize: '15px',
              lineHeight: 1.6,
              position: 'relative'
            }}>
              {translating ? (
                <div style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '16px',
                  color: 'var(--github-text-secondary)'
                }}>
                  <FaSpinner size={32} style={{ animation: 'spin 1.5s linear infinite', opacity: 0.7 }} />
                  <p>Translating {activeTab === 'description' ? 'description' : 'conversation'}...</p>
                </div>
              ) : (
                activeTab === 'description' ? (
                  translated ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} >
                      <MarkdownRenderer content={translated} />
                    </motion.div>
                  ) : (
                    <EmptyState />
                  )
                ) : (
                  // Comments Translation View - only show translated comments
                  Object.keys(translatedComments).length > 0 ? (
                    <div style={{ padding: '16px' }}>
                      {comments
                        .filter(comment => translatedComments[comment.id] !== undefined)
                        .map(comment => (
                          <CommentCard
                            key={comment.id}
                            id={comment.id}
                            user={comment.user}
                            created_at={comment.created_at}
                            body={translatedComments[comment.id]}
                          />
                        ))}
                    </div>
                  ) : selectedCommentIds.size > 0 ? (
                    <EmptyState message="Click 'Translate' to translate selected comments" />
                  ) : (
                    <EmptyState message="Select comments to translate" />
                  )
                )
              )}
            </div>
          </motion.div>

        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .markdown-body {
           color: var(--github-text-primary);
        }
        .markdown-body h1, .markdown-body h2 {
           border-bottom-color: var(--glass-border);
        }
        .markdown-body blockquote {
           color: var(--github-text-secondary);
           border-left-color: var(--github-border);
        }
        .markdown-body a {
           color: var(--github-link);
        }
      `}</style>
    </div>
  );
}

function EmptyState({ message = "Select a language and translate" }: { message?: string }) {
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--github-text-muted)',
      opacity: 0.6
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px'
      }}>
        <FaArrowRight size={24} />
      </div>
      <p>{message}</p>
    </div>
  );
}
