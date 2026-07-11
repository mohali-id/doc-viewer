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
  const [fitZoom, setFitZoom] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const renderTaskRef = useRef<any>(null);

  const disposePdfDoc = async (doc: pdfjsLib.PDFDocumentProxy | null) => {
    if (!doc) return;
    const disposable = doc as any;
    if (typeof disposable.destroy === 'function') {
      await disposable.destroy();
      return;
    }
    if (typeof disposable.cleanup === 'function') {
      disposable.cleanup();
    }
  };

  useEffect(() => {
    let disposed = false;

    const loadPdf = async () => {
      try {
        setLoading(true);
        setError(null);
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
          renderTaskRef.current = null;
        }
        if (pdfDocRef.current) {
          await disposePdfDoc(pdfDocRef.current);
          pdfDocRef.current = null;
          setPdfDoc(null);
        }
        // Copy the ArrayBuffer to prevent "detached ArrayBuffer" error
        // pdfjs-dist transfers ownership of the buffer internally
        const dataCopy = file.data.slice(0);
        const loadingTask = pdfjsLib.getDocument({ data: dataCopy });
        const doc = await loadingTask.promise;
        if (disposed) {
          await disposePdfDoc(doc);
          return;
        }
        pdfDocRef.current = doc;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
      } catch (err) {
        if (disposed) return;
        setError(`Failed to load PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        if (!disposed) setLoading(false);
      }
    };

    loadPdf();

    return () => {
      disposed = true;
    };
  }, [file.data]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let cancelled = false;

    const renderPage = async () => {
      try {
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
          try {
            await renderTaskRef.current.promise;
          } catch {
            // ignore cancel errors
          }
          renderTaskRef.current = null;
        }

        const page = await pdfDoc.getPage(currentPage);
        if (cancelled || !canvasRef.current) return;

        const viewport = page.getViewport({ scale: zoom });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderTask = page.render({ canvasContext: context, viewport, canvas } as any);
        renderTaskRef.current = renderTask;

        await renderTask.promise;
        if (renderTaskRef.current === renderTask) {
          renderTaskRef.current = null;
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof Error && err.name === 'RenderingCancelledException') return;
        setError(`Failed to render page: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };

    renderPage();

    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdfDoc, currentPage, zoom]);

  const applyAutoFit = useCallback(async () => {
    if (!pdfDoc || !canvasContainerRef.current) return;
    try {
      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale: 1 });
      const container = canvasContainerRef.current;
      if (!container) return;

      const padding = 32;
      const availableWidth = Math.max(container.clientWidth - padding, 1);
      const availableHeight = Math.max(container.clientHeight - padding, 1);
      const scaleX = availableWidth / viewport.width;
      const scaleY = availableHeight / viewport.height;
      const nextFitZoom = Math.min(scaleX, scaleY, 1);

      setFitZoom(nextFitZoom);
      setZoom(nextFitZoom);
    } catch {
      // ignore fit calculation errors
    }
  }, [pdfDoc, currentPage]);

  useEffect(() => {
    void applyAutoFit();
  }, [applyAutoFit]);

  useEffect(() => {
    const onResize = () => {
      void applyAutoFit();
    };

    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, [applyAutoFit]);

  useEffect(() => {
    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
      if (pdfDocRef.current) {
        void disposePdfDoc(pdfDocRef.current);
        pdfDocRef.current = null;
      }
    };
  }, []);

  const zoomIn = () => setZoom((z) => Math.min(z + 0.25, 3.0));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.25, fitZoom));
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
      <div ref={canvasContainerRef} style={styles.canvasContainer}>
        <canvas ref={canvasRef} style={styles.canvas} />
      </div>
    </div>
  );
};

export default PdfViewer;
