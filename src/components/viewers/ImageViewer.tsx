import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    gap: '8px',
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
    fontSize: '13px',
  },
  zoomInfo: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    minWidth: '50px',
    textAlign: 'center',
  },
  imageArea: {
    flex: 1,
    overflow: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
  },
  image: {
    maxWidth: 'none',
    maxHeight: 'none',
    transition: 'transform 0.1s ease',
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

const ImageViewer: React.FC<ViewerProps> = ({ file }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1.0);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const blob = new Blob([file.data], { type: file.type || 'image/png' });
      const objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setError(`Failed to load image: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [file.data, file.type]);

  const zoomIn = () => setZoom((z) => Math.min(z + 0.25, 5.0));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.25));
  const fitToScreen = () => setZoom(1.0);
  const actualSize = () => setZoom(1.0);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((z) => Math.max(0.25, Math.min(5.0, z + delta)));
    }
  }, []);

  if (error) return <div style={styles.error}>{error}</div>;
  if (!url) return <div style={styles.loading}>Loading image...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <button style={styles.button} onClick={zoomOut}>
          -
        </button>
        <span style={styles.zoomInfo}>{Math.round(zoom * 100)}%</span>
        <button style={styles.button} onClick={zoomIn}>
          +
        </button>
        <button style={styles.button} onClick={fitToScreen}>
          Fit
        </button>
        <button style={styles.button} onClick={actualSize}>
          1:1
        </button>
      </div>
      <div style={styles.imageArea} ref={containerRef} onWheel={handleWheel}>
        <img
          src={url}
          alt={file.name}
          style={{
            ...styles.image,
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        />
      </div>
    </div>
  );
};

export default ImageViewer;
