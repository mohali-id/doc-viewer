import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { ViewerProps } from '../../types';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100%',
    overflow: 'auto',
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
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  button: {
    padding: '4px 12px',
    border: '1px solid var(--border-color)',
    borderRadius: '4px',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    fontSize: '16px',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  pageInfo: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
  canvasContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px',
    gap: '16px',
  },
  canvas: {
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
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

const PdfViewer: React.FC<ViewerProps> = ({ file }) => {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const loadPdf = async () => {
      try {
        setLoading(true);
        setError(null);
        // Copy the ArrayBuffer to prevent "detached ArrayBuffer" error
        // pdfjs-dist transfers ownership of the buffer internally
        const dataCopy = file.data.slice(0);
        const doc = await pdfjsLib.getDocument({ data: dataCopy }).promise;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
      } catch (err) {
        setError(`Failed to load PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };
    loadPdf();
  }, [file.data]);

  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;
    try {
      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale: zoom });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({ canvasContext: context, viewport, canvas } as any).promise;
    } catch (err) {
      setError(`Failed to render page: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [pdfDoc, currentPage, zoom]);

  useEffect(() => {
    renderPage();
  }, [renderPage]);

  const zoomIn = () => setZoom((z) => Math.min(z + 0.25, 3.0));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const prevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const nextPage = () => setCurrentPage((p) => Math.min(p + 1, numPages));

  if (loading) return <div style={styles.loading}>Loading PDF...</div>;
  if (error) return <div style={styles.error}>{error}</div>;

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <button
          style={{ ...styles.button, ...(currentPage <= 1 ? styles.buttonDisabled : {}) }}
          onClick={prevPage}
          disabled={currentPage <= 1}
        >
          ‹ Prev
        </button>
        <span style={styles.pageInfo}>
          Page {currentPage} of {numPages}
        </span>
        <button
          style={{ ...styles.button, ...(currentPage >= numPages ? styles.buttonDisabled : {}) }}
          onClick={nextPage}
          disabled={currentPage >= numPages}
        >
          Next ›
        </button>
        <button style={styles.button} onClick={zoomOut}>
          -
        </button>
        <span style={styles.pageInfo}>{Math.round(zoom * 100)}%</span>
        <button style={styles.button} onClick={zoomIn}>
          +
        </button>
      </div>
      <div style={styles.canvasContainer}>
        <canvas ref={canvasRef} style={styles.canvas} />
      </div>
    </div>
  );
};

export default PdfViewer;
