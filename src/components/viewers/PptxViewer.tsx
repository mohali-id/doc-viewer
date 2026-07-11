import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { ViewerProps } from '../../types';

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '8px 16px',
    borderBottom: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-secondary)',
    flexShrink: 0,
  },
  button: {
    padding: '4px 12px',
    border: '1px solid var(--border-color)',
    borderRadius: '4px',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    fontSize: '14px',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  slideInfo: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
  body: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  sidebar: {
    width: '160px',
    overflowY: 'auto',
    borderRight: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-secondary)',
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flexShrink: 0,
  },
  thumbnail: {
    padding: '12px 8px',
    border: '2px solid var(--border-color)',
    borderRadius: '4px',
    backgroundColor: 'var(--bg-primary)',
    cursor: 'pointer',
    fontSize: '11px',
    color: 'var(--text-secondary)',
    textAlign: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  thumbnailActive: {
    borderColor: 'var(--accent-color)',
    backgroundColor: 'var(--bg-primary)',
  },
  slideArea: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    overflow: 'auto',
  },
  slideCard: {
    width: '100%',
    maxWidth: '720px',
    minHeight: '400px',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '40px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  slideText: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: 'var(--text-primary)',
    whiteSpace: 'pre-wrap',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    fontSize: '16px',
    color: 'var(--text-secondary)',
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    fontSize: '16px',
    color: '#e53e3e',
    padding: '20px',
    textAlign: 'center',
  },
};

interface SlideContent {
  index: number;
  texts: string[];
}

const PptxViewer: React.FC<ViewerProps> = ({ file }) => {
  const [slides, setSlides] = useState<SlideContent[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const extractSlides = async () => {
      try {
        setLoading(true);
        setError(null);
        const zip = await JSZip.loadAsync(file.data);

        const slideFiles: string[] = [];
        zip.forEach((path) => {
          if (/^ppt\/slides\/slide\d+\.xml$/.test(path)) {
            slideFiles.push(path);
          }
        });

        slideFiles.sort((a, b) => {
          const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0');
          const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0');
          return numA - numB;
        });

        const parsed: SlideContent[] = [];
        for (let i = 0; i < slideFiles.length; i++) {
          const xmlContent = await zip.file(slideFiles[i])?.async('string');
          if (xmlContent) {
            const texts = extractTextsFromXml(xmlContent);
            parsed.push({ index: i + 1, texts });
          }
        }

        setSlides(parsed);
        setCurrentSlide(0);
      } catch (err) {
        setError(`Failed to parse presentation: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };
    extractSlides();
  }, [file.data]);

  const extractTextsFromXml = (xml: string): string[] => {
    const texts: string[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');
    const textNodes = doc.getElementsByTagName('a:t');
    let currentParagraph = '';

    for (let i = 0; i < textNodes.length; i++) {
      const node = textNodes[i];
      const text = node.textContent || '';
      const parent = node.parentElement;
      const grandparent = parent?.parentElement;

      if (grandparent?.tagName === 'a:p' || parent?.tagName === 'a:r') {
        currentParagraph += text;
      }

      const nextNode = textNodes[i + 1];
      const nextParent = nextNode?.parentElement?.parentElement;
      const currentGp = grandparent;

      if (!nextNode || nextParent !== currentGp) {
        if (currentParagraph.trim()) {
          texts.push(currentParagraph.trim());
        }
        currentParagraph = '';
      }
    }

    if (currentParagraph.trim()) {
      texts.push(currentParagraph.trim());
    }

    return texts;
  };

  const prevSlide = () => setCurrentSlide((s) => Math.max(s - 1, 0));
  const nextSlide = () => setCurrentSlide((s) => Math.min(s + 1, slides.length - 1));

  if (loading) return <div style={styles.loading}>Loading presentation...</div>;
  if (error) return <div style={styles.error}>{error}</div>;
  if (slides.length === 0) return <div style={styles.loading}>No slides found</div>;

  const current = slides[currentSlide];

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <button
          style={{ ...styles.button, ...(currentSlide <= 0 ? styles.buttonDisabled : {}) }}
          onClick={prevSlide}
          disabled={currentSlide <= 0}
        >
          ‹ Prev
        </button>
        <span style={styles.slideInfo}>
          Slide {currentSlide + 1} of {slides.length}
        </span>
        <button
          style={{ ...styles.button, ...(currentSlide >= slides.length - 1 ? styles.buttonDisabled : {}) }}
          onClick={nextSlide}
          disabled={currentSlide >= slides.length - 1}
        >
          Next ›
        </button>
      </div>
      <div style={styles.body}>
        <div style={styles.sidebar}>
          {slides.map((slide, idx) => (
            <div
              key={idx}
              style={{ ...styles.thumbnail, ...(idx === currentSlide ? styles.thumbnailActive : {}) }}
              onClick={() => setCurrentSlide(idx)}
            >
              Slide {slide.index}
              {slide.texts.length > 0 && (
                <div style={{ marginTop: '4px', fontSize: '10px' }}>
                  {slide.texts[0].substring(0, 30)}
                  {slide.texts[0].length > 30 ? '...' : ''}
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={styles.slideArea}>
          <div style={styles.slideCard}>
            {current.texts.length > 0 ? (
              current.texts.map((text, idx) => (
                <p key={idx} style={{ ...styles.slideText, marginBottom: '12px' }}>
                  {text}
                </p>
              ))
            ) : (
              <p style={{ ...styles.slideText, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                (No text content on this slide)
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PptxViewer;
