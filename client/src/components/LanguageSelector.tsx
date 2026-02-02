import { useState, useRef, useEffect } from 'react';
import { FaGlobe, FaChevronDown, FaSearch, FaTimes } from 'react-icons/fa';
import { languages, popularLanguages, searchLanguages } from '../languages';
import type { Language } from '../languages';

interface LanguageSelectorProps {
  value: string;
  onChange: (code: string) => void;
}

export default function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedLanguage = languages.find(lang => lang.code === value) || languages[0];

  const filteredLanguages = searchQuery
    ? searchLanguages(searchQuery)
    : [...popularLanguages, ...languages.filter(lang => !lang.popular)];

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredLanguages.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredLanguages.length) {
          onChange(filteredLanguages[highlightedIndex].code);
          setIsOpen(false);
          setSearchQuery('');
          setHighlightedIndex(-1);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleSelect = (code: string) => {
    onChange(code);
    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(-1);
  };

  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[role="option"]');
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '5px 12px',
          backgroundColor: 'var(--github-bg-secondary)',
          border: '1px solid var(--github-border)',
          borderRadius: '6px',
          color: 'var(--github-text-primary)',
          cursor: 'pointer',
          fontSize: '14px',
          transition: 'all 0.2s cubic-bezier(0.3, 0, 0.5, 1)',
          minWidth: '200px',
          justifyContent: 'space-between'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--github-bg-tertiary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--github-bg-secondary)';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FaGlobe size={14} color="var(--github-text-secondary)" />
          <span>{selectedLanguage.nativeName}</span>
          <span style={{ color: 'var(--github-text-muted)', fontSize: '12px' }}>
            ({selectedLanguage.code})
          </span>
        </div>
        <FaChevronDown 
          size={12} 
          color="var(--github-text-secondary)"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '4px',
            backgroundColor: 'var(--github-bg-secondary)',
            border: '1px solid var(--github-border)',
            borderRadius: '6px',
            boxShadow: '0 8px 24px rgba(1, 4, 9, 0.8)',
            zIndex: 1000,
            minWidth: '300px',
            maxWidth: '400px',
            maxHeight: '400px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Search input */}
          <div style={{
            padding: '8px',
            borderBottom: '1px solid var(--github-border)',
            position: 'sticky',
            top: 0,
            backgroundColor: 'var(--github-bg-secondary)',
            zIndex: 1
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              backgroundColor: 'var(--github-bg-primary)',
              border: '1px solid var(--github-border)',
              borderRadius: '6px'
            }}>
              <FaSearch size={12} color="var(--github-text-muted)" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(-1);
                }}
                placeholder="Search languages..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--github-text-primary)',
                  fontSize: '14px',
                  outline: 'none'
                }}
                onKeyDown={handleKeyDown}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setHighlightedIndex(-1);
                    searchInputRef.current?.focus();
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--github-text-muted)',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <FaTimes size={10} />
                </button>
              )}
            </div>
          </div>

          {/* Language list */}
          <div
            ref={listRef}
            style={{
              overflowY: 'auto',
              maxHeight: '340px'
            }}
          >
            {filteredLanguages.length === 0 ? (
              <div style={{
                padding: '16px',
                textAlign: 'center',
                color: 'var(--github-text-muted)',
                fontSize: '14px'
              }}>
                No languages found
              </div>
            ) : (
              <>
                {!searchQuery && popularLanguages.length > 0 && (
                  <>
                    <div style={{
                      padding: '8px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--github-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      borderBottom: '1px solid var(--github-border)'
                    }}>
                      Popular
                    </div>
                    {popularLanguages.map((lang, index) => (
                      <LanguageOption
                        key={lang.code}
                        language={lang}
                        isSelected={lang.code === value}
                        isHighlighted={index === highlightedIndex}
                        onSelect={() => handleSelect(lang.code)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                      />
                    ))}
                    <div style={{
                      padding: '8px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--github-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      borderTop: '1px solid var(--github-border)',
                      borderBottom: '1px solid var(--github-border)',
                      marginTop: '4px'
                    }}>
                      All Languages
                    </div>
                  </>
                )}
                {(searchQuery ? filteredLanguages : languages.filter(lang => !lang.popular)).map((lang, index) => {
                  const actualIndex = searchQuery 
                    ? index 
                    : popularLanguages.length + index;
                  return (
                    <LanguageOption
                      key={lang.code}
                      language={lang}
                      isSelected={lang.code === value}
                      isHighlighted={actualIndex === highlightedIndex}
                      onSelect={() => handleSelect(lang.code)}
                      onMouseEnter={() => setHighlightedIndex(actualIndex)}
                    />
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface LanguageOptionProps {
  language: Language;
  isSelected: boolean;
  isHighlighted: boolean;
  onSelect: () => void;
  onMouseEnter: () => void;
}

function LanguageOption({ language, isSelected, isHighlighted, onSelect, onMouseEnter }: LanguageOptionProps) {
  return (
    <div
      role="option"
      aria-selected={isSelected}
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      style={{
        padding: '8px 12px',
        cursor: 'pointer',
        backgroundColor: isHighlighted 
          ? 'var(--github-bg-tertiary)' 
          : isSelected 
            ? 'rgba(0, 255, 136, 0.1)' 
            : 'transparent',
        color: isSelected ? 'var(--color-primary-green)' : 'var(--github-text-primary)',
        fontSize: '14px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        transition: 'background-color 0.1s ease',
        borderLeft: isSelected ? '2px solid var(--color-primary-green)' : '2px solid transparent'
      }}
    >
      <div>
        <div style={{ fontWeight: isSelected ? 600 : 400 }}>
          {language.nativeName}
        </div>
        <div style={{ 
          fontSize: '12px', 
          color: 'var(--github-text-muted)',
          marginTop: '2px'
        }}>
          {language.name}
        </div>
      </div>
      <div style={{
        fontSize: '12px',
        color: 'var(--github-text-muted)',
        fontFamily: 'monospace'
      }}>
        {language.code}
      </div>
    </div>
  );
}
