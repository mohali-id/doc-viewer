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
  const [fitZoom, setFitZoom] = useState(1.0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

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
  const fitToScreen = () => setZoom(fitZoom);
  const actualSize = () => setZoom(1.0);

  const applyAutoFit = useCallback(() => {
    const container = containerRef.current;
    const image = imageRef.current;
    if (!container || !image) return;

    const naturalWidth = image.naturalWidth;
    const naturalHeight = image.naturalHeight;
    if (!naturalWidth || !naturalHeight) return;

    const padding = 32;
    const availableWidth = Math.max(container.clientWidth - padding, 1);
    const availableHeight = Math.max(container.clientHeight - padding, 1);
    const scaleX = availableWidth / naturalWidth;
    const scaleY = availableHeight / naturalHeight;
    const nextFitZoom = Math.min(scaleX, scaleY, 1);

    setFitZoom(nextFitZoom);
    setZoom(nextFitZoom);
  }, []);

  useEffect(() => {
    const onResize = () => {
      applyAutoFit();
    };

    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, [applyAutoFit]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((z) => Math.max(0.25, Math.min(5.0, z + delta)));
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoom <= fitZoom) return;
    const el = containerRef.current;
    if (!el) return;

    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const el = containerRef.current;
    if (!el) return;

    e.preventDefault();
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    el.scrollLeft = dragStartRef.current.scrollLeft - dx;
    el.scrollTop = dragStartRef.current.scrollTop - dy;
  };

  const stopDragging = () => {
    setIsDragging(false);
  };

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
      <div
          style={{
            ...styles.imageArea,
            cursor: zoom > fitZoom ? (isDragging ? 'grabbing' : 'grab') : 'default',
            userSelect: isDragging ? 'none' : 'auto',
          }}
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
      >
        <img
          ref={imageRef}
          src={url}
          alt={file.name}
          draggable={false}
          onLoad={applyAutoFit}
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
