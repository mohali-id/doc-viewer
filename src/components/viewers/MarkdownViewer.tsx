import React, { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { ViewerProps } from '../../types';

const contentStyles = `
  .md-content { max-width: 860px; margin: 0 auto; padding: 32px 40px; line-height: 1.7; font-size: 16px; }
  .md-content h1, .md-content h2 { border-bottom: 1px solid var(--border-color); padding-bottom: 0.3em; }
  .md-content h1, .md-content h2, .md-content h3, .md-content h4 { margin: 1.4em 0 0.6em; }
  .md-content p, .md-content ul, .md-content ol, .md-content pre, .md-content table, .md-content blockquote { margin: 0 0 1em; }
  .md-content ul, .md-content ol { padding-left: 2em; }
  .md-content a { color: var(--accent-color); }
  .md-content img { max-width: 100%; }
  .md-content code { font-family: Consolas, "Cascadia Code", monospace; font-size: 0.9em; background: var(--bg-secondary); padding: 0.15em 0.35em; border-radius: 4px; }
  .md-content pre { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px; padding: 12px 16px; overflow: auto; }
  .md-content pre code { background: none; padding: 0; }
  .md-content blockquote { border-left: 4px solid var(--border-color); padding-left: 1em; color: var(--text-secondary); }
  .md-content table { border-collapse: collapse; display: block; overflow: auto; }
  .md-content th, .md-content td { border: 1px solid var(--border-color); padding: 6px 12px; }
  .md-content hr { border: none; border-top: 1px solid var(--border-color); margin: 1.5em 0; }
`;

const MarkdownViewer: React.FC<ViewerProps> = ({ file }) => {
  const html = useMemo(() => {
    const text = new TextDecoder().decode(file.data);
    // Sanitize: markdown may contain raw HTML (scripts, event handlers).
    return DOMPurify.sanitize(marked.parse(text, { async: false, gfm: true }));
  }, [file.data]);

  return (
    <div style={{ height: '100%', overflow: 'auto', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <style>{contentStyles}</style>
      <div className="md-content" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
};

export default MarkdownViewer;
