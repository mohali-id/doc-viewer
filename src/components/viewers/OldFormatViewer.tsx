import React, { useState, useEffect } from 'react';
import { ViewerProps } from '../../types';
import { formatFileSize, getFileExtension } from '../../utils/fileUtils';

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    overflow: 'auto',
    padding: '24px',
  },
  card: {
    maxWidth: '600px',
    width: '100%',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '32px',
    backgroundColor: 'var(--bg-secondary)',
    textAlign: 'center',
  },
  icon: {
    marginBottom: '16px',
  },
  title: {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '8px',
    wordBreak: 'break-all' as const,
  },
  meta: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    marginBottom: '20px',
  },
  warningBox: {
    backgroundColor: 'rgba(237, 137, 54, 0.1)',
    border: '1px solid rgba(237, 137, 54, 0.3)',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '20px',
    textAlign: 'left' as const,
  },
  warningTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#ed8936',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  warningText: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
    margin: 0,
  },
  textPreview: {
    backgroundColor: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '20px',
    textAlign: 'left' as const,
    maxHeight: '300px',
    overflow: 'auto',
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
    fontSize: '13px',
    fontFamily: 'monospace',
    color: 'var(--text-secondary)',
  },
  textPreviewLabel: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    marginBottom: '8px',
    textAlign: 'left' as const,
    fontWeight: 600,
  },
  downloadBtn: {
    padding: '10px 24px',
    backgroundColor: 'var(--accent-color)',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  },
  badge: {
    display: 'inline-block',
    padding: '2px 8px',
    backgroundColor: 'rgba(237, 137, 54, 0.2)',
    color: '#ed8936',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    marginBottom: '12px',
  },
};

const OldFormatViewer: React.FC<ViewerProps> = ({ file }) => {
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(true);
  const ext = getFileExtension(file.name);

  const formatLabel = ext === 'doc' ? 'Microsoft Word (.doc)' :
                      ext === 'ppt' ? 'Microsoft PowerPoint (.ppt)' :
                      `.${ext} (format lama)`;

  const newFormat = ext === 'doc' ? '.docx' :
                    ext === 'ppt' ? '.pptx' : '';

  useEffect(() => {
    // Try to extract readable text from the binary file
    const extractText = async () => {
      setExtracting(true);
      try {
        const bytes = new Uint8Array(file.data);
        const chunks: string[] = [];
        let current = '';

        for (let i = 0; i < bytes.length && chunks.length < 200; i++) {
          const byte = bytes[i];
          // Printable ASCII range + common whitespace
          if ((byte >= 0x20 && byte <= 0x7E) || byte === 0x0A || byte === 0x0D || byte === 0x09) {
            current += String.fromCharCode(byte);
          } else {
            if (current.trim().length >= 4) {
              chunks.push(current.trim());
            }
            current = '';
          }
        }
        if (current.trim().length >= 4) {
          chunks.push(current.trim());
        }

        // Filter out binary noise - keep only meaningful text chunks
        const meaningful = chunks.filter(c => {
          // Has at least some word-like content (letters)
          const letterCount = (c.match(/[a-zA-Z]/g) || []).length;
          return letterCount >= 3 && c.length >= 5;
        });

        if (meaningful.length > 0) {
          setExtractedText(meaningful.join('\n'));
        } else {
          setExtractedText(null);
        }
      } catch {
        setExtractedText(null);
      } finally {
        setExtracting(false);
      }
    };

    extractText();
  }, [file.data]);

  const handleDownload = () => {
    const blob = new Blob([file.data]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.icon}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="9" y1="13" x2="15" y2="13" />
            <line x1="9" y1="17" x2="15" y2="17" />
          </svg>
        </div>

        <div style={styles.badge}>Format Lama</div>

        <div style={styles.title}>{file.name}</div>
        <div style={styles.meta}>
          {formatLabel} &bull; {formatFileSize(file.size)}
        </div>

        <div style={styles.warningBox}>
          <div style={styles.warningTitle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Preview Terbatas
          </div>
          <p style={styles.warningText}>
            Format <strong>.{ext}</strong> adalah format biner lama Microsoft Office yang tidak bisa di-render sempurna di browser.
            {newFormat && (
              <> Untuk hasil terbaik, konversi file ke format <strong>{newFormat}</strong> menggunakan Microsoft Office atau LibreOffice.</>
            )}
          </p>
        </div>

        {extracting ? (
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Mengekstrak teks...
          </p>
        ) : extractedText ? (
          <>
            <div style={styles.textPreviewLabel}>Teks yang berhasil diekstrak (preview):</div>
            <div style={styles.textPreview}>{extractedText}</div>
          </>
        ) : (
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Tidak dapat mengekstrak teks dari file ini.
          </p>
        )}

        <button style={styles.downloadBtn} onClick={handleDownload}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download File
        </button>
      </div>
    </div>
  );
};

export default OldFormatViewer;
