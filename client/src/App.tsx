import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TranslationPage from './pages/TranslationPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/translate/:owner/:repo/pr/:number" element={<TranslationPage />} />
        <Route path="/" element={
          <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            backgroundColor: 'var(--github-bg-primary)',
            textAlign: 'center'
          }}>
            <div style={{
              maxWidth: '600px',
              padding: '48px',
              borderRadius: '6px',
              backgroundColor: 'var(--github-bg-secondary)',
              border: '1px solid var(--github-border)',
              boxShadow: '0 8px 24px rgba(1, 4, 9, 0.5)'
            }}>
              <h1 style={{
                fontSize: '32px',
                fontWeight: '600',
                marginBottom: '16px',
                color: 'var(--github-text-primary)',
                lineHeight: '1.25'
              }}>
                Lingo Translator
              </h1>
              <p style={{
                fontSize: '16px',
                color: 'var(--github-text-secondary)',
                marginTop: '8px',
                lineHeight: '1.5'
              }}>
                Waiting for translation requests...
              </p>
              <div style={{
                marginTop: '24px',
                padding: '16px',
                backgroundColor: 'var(--github-bg-primary)',
                borderRadius: '6px',
                border: '1px solid var(--github-border)'
              }}>
                <p style={{ 
                  color: 'var(--github-text-secondary)', 
                  fontSize: '14px', 
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  Ready to translate GitHub PR descriptions
                </p>
              </div>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
