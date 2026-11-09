import React, { useEffect, useState } from 'react';
import { ViewerProps } from '../../types';
import { formatFileSize, getFileExtension } from '../../utils/fileUtils';

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100%',
    overflow: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    padding: '24px',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    padding: '40px',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-secondary)',
    maxWidth: '400px',
    width: '100%',
    textAlign: 'center',
  },
  icon: {
    fontSize: '48px',
    color: 'var(--text-secondary)',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  fileName: {
    fontSize: '15px',
    fontWeight: 500,
    color: 'var(--text-primary)',
    wordBreak: 'break-all',
  },
  meta: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '8px',
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid var(--accent-color, #3b82f6)',
    backgroundColor: 'var(--accent-color, #3b82f6)',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 500,
    textDecoration: 'none',
    cursor: 'pointer',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    color: 'var(--text-primary)',
    borderColor: 'var(--border-color)',
  },
};

/** Reads Content-Length with a HEAD request; resolves null if CORS or the server hides it. */
async function fetchRemoteSize(url: string, signal: AbortSignal): Promise<number | null> {
  try {
    const res = await fetch(url, { method: 'HEAD', signal });
    const len = Number(res.headers.get('content-length'));
    return res.ok && len > 0 ? len : null;
  } catch {
    return null;
  }
}

const DownloadOnlyCard: React.FC<ViewerProps> = ({ file }) => {
  const extension = getFileExtension(file.name);
  const [remoteSize, setRemoteSize] = useState<number | null>(null);
  const [localHref, setLocalHref] = useState<string | null>(null);

  // Remote file: link to the original URL. Uploaded/fetched file: link to its bytes.
  const remoteUrl = file.passthrough ? file.url : undefined;

  useEffect(() => {
    if (remoteUrl || file.data.byteLength === 0) return;
    const href = URL.createObjectURL(new Blob([file.data], { type: file.type || 'application/octet-stream' }));
    setLocalHref(href);
    return () => URL.revokeObjectURL(href);
  }, [remoteUrl, file.data, file.type]);

  useEffect(() => {
    if (!remoteUrl || !/^https?:$/.test(new URL(remoteUrl, window.location.href).protocol)) return;
    const controller = new AbortController();
    fetchRemoteSize(remoteUrl, controller.signal).then((size) => {
      if (!controller.signal.aborted) setRemoteSize(size);
    });
    return () => controller.abort();
  }, [remoteUrl]);

  const size = file.size > 0 ? file.size : remoteSize;
  const href = remoteUrl ?? localHref;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.icon}>&#128196;</div>
        <div style={styles.title}>No Preview Available</div>
        <div style={styles.fileName}>{file.name}</div>
        <div style={styles.meta}>
          {size ? <span>Size: {formatFileSize(size)}</span> : null}
          <span>Type: {extension ? `.${extension}` : file.type || 'Unknown'}</span>
        </div>
        {href && (
          <div style={styles.actions}>
            {/* `download` is honoured for same-origin and blob URLs; cross-origin
                links fall back to the server's own Content-Disposition. */}
            <a href={href} download={file.name} style={styles.button}>
              Download
            </a>
            {remoteUrl && (
              <a
                href={remoteUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...styles.button, ...styles.secondaryButton }}
              >
                Buka di tab baru
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DownloadOnlyCard;
