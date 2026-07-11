import React, { useEffect, useState } from 'react';
import { ViewerProps } from '../../types';

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100%',
    backgroundColor: 'var(--bg-primary)',
  },
  frame: {
    width: '100%',
    height: '100%',
    border: 'none',
    backgroundColor: '#fff',
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

const HtmlViewer: React.FC<ViewerProps> = ({ file }) => {
  const [iframeSrc, setIframeSrc] = useState<string>('');

  useEffect(() => {
    if (file.url) {
      setIframeSrc(file.url);
      return;
    }

    const blob = new Blob([file.data], { type: file.type || 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    setIframeSrc(blobUrl);

    return () => {
      URL.revokeObjectURL(blobUrl);
    };
  }, [file.url, file.data, file.type]);

  if (!iframeSrc) return <div style={styles.error}>Failed to load HTML.</div>;

  return (
    <div style={styles.container}>
      <iframe
        title={file.name}
        src={iframeSrc}
        style={styles.frame}
      />
    </div>
  );
};

export default HtmlViewer;
