import React, { useState, useEffect } from 'react';
import mammoth from 'mammoth';
import DOMPurify from 'dompurify';
import { ViewerProps } from '../../types';

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100%',
    overflow: 'auto',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
  },
  content: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '32px 40px',
    lineHeight: '1.7',
    fontSize: '16px',
    fontFamily: 'Georgia, "Times New Roman", serif',
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

const contentStyles = `
  .docx-content h1, .docx-content h2, .docx-content h3,
  .docx-content h4, .docx-content h5, .docx-content h6 {
    color: var(--text-primary);
    margin-top: 1.5em;
    margin-bottom: 0.5em;
  }
  .docx-content p {
    margin-bottom: 1em;
    color: var(--text-primary);
  }
  .docx-content table {
    border-collapse: collapse;
    width: 100%;
    margin: 1em 0;
  }
  .docx-content td, .docx-content th {
    border: 1px solid var(--border-color);
    padding: 8px 12px;
  }
  .docx-content img {
    max-width: 100%;
    height: auto;
  }
  .docx-content ul, .docx-content ol {
    margin-bottom: 1em;
    padding-left: 2em;
  }
  .docx-content li {
    margin-bottom: 0.25em;
  }
  .docx-content a {
    color: var(--accent-color);
  }
`;

const DocxViewer: React.FC<ViewerProps> = ({ file }) => {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const convert = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await mammoth.convertToHtml({ arrayBuffer: file.data });
        const sanitized = DOMPurify.sanitize(result.value);
        setHtml(sanitized);
      } catch (err) {
        setError(`Failed to render document: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };
    convert();
  }, [file.data]);

  if (loading) return <div style={styles.loading}>Loading document...</div>;
  if (error) return <div style={styles.error}>{error}</div>;

  return (
    <div style={styles.container}>
      <style>{contentStyles}</style>
      <div
        className="docx-content"
        style={styles.content}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
};

export default DocxViewer;
