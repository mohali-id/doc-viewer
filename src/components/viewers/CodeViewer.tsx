import React, { useState, useEffect, useRef } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import { ViewerProps } from '../../types';
import { getLanguageFromExtension } from '../../utils/fileUtils';

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100%',
    overflow: 'auto',
    backgroundColor: '#ffffff',
    color: '#24292e',
  },
  wrapper: {
    display: 'flex',
    fontFamily: '"Fira Code", "JetBrains Mono", "Cascadia Code", Consolas, monospace',
    fontSize: '14px',
    lineHeight: '1.6',
    minHeight: '100%',
  },
  lineNumbers: {
    padding: '16px 12px',
    textAlign: 'right',
    userSelect: 'none',
    color: '#999',
    borderRight: '1px solid #e1e4e8',
    backgroundColor: '#f6f8fa',
    position: 'sticky',
    left: 0,
    minWidth: '48px',
  },
  codeArea: {
    flex: 1,
    padding: '16px',
    overflow: 'auto',
    margin: 0,
    backgroundColor: '#ffffff',
  },
  code: {
    margin: 0,
    padding: 0,
    fontFamily: 'inherit',
    backgroundColor: 'transparent',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    fontSize: '16px',
    color: '#6a737d',
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

const CodeViewer: React.FC<ViewerProps> = ({ file }) => {
  const [highlightedHtml, setHighlightedHtml] = useState('');
  const [lineCount, setLineCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    try {
      setLoading(true);
      setError(null);

      const decoder = new TextDecoder();
      const text = decoder.decode(file.data);
      const lines = text.split('\n');
      setLineCount(lines.length);

      const language = getLanguageFromExtension(file.name);

      let result: string;
      if (language && language !== 'plaintext' && hljs.getLanguage(language)) {
        result = hljs.highlight(text, { language }).value;
      } else {
        result = hljs.highlightAuto(text).value;
      }

      setHighlightedHtml(result);
    } catch (err) {
      setError(`Failed to highlight code: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [file.data, file.name]);

  if (loading) return <div style={styles.loading}>Loading code...</div>;
  if (error) return <div style={styles.error}>{error}</div>;

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <div style={styles.lineNumbers}>
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i + 1}>{i + 1}</div>
          ))}
        </div>
        <pre style={styles.codeArea}>
          <code
            ref={codeRef}
            style={styles.code}
            className="hljs"
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        </pre>
      </div>
    </div>
  );
};

export default CodeViewer;
