import React, { useState, useEffect, useRef } from 'react';
import { ViewerProps } from '../../types';

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
    padding: '16px',
  },
  video: {
    maxWidth: '100%',
    maxHeight: 'calc(100% - 60px)',
    borderRadius: '8px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
    outline: 'none',
  },
  error: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '12px',
    color: '#e53e3e',
    padding: '20px',
    textAlign: 'center',
  },
  info: {
    marginTop: '8px',
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
};

const VideoViewer: React.FC<ViewerProps> = ({ file }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const mimeMap: Record<string, string> = {
        mp4: 'video/mp4',
        webm: 'video/webm',
        ogg: 'video/ogg',
        ogv: 'video/ogg',
        mov: 'video/quicktime',
        avi: 'video/x-msvideo',
        mkv: 'video/x-matroska',
      };
      const mimeType = mimeMap[ext] || 'video/mp4';
      const blob = new Blob([file.data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    } catch (err) {
      setError(`Gagal memuat video: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [file.data, file.name]);

  const handleError = () => {
    setError(
      'Browser tidak dapat memutar format video ini. Coba download dan putar dengan media player.'
    );
  };

  if (error) {
    return (
      <div style={styles.error}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p>{error}</p>
      </div>
    );
  }

  if (!blobUrl) return null;

  return (
    <div style={styles.container}>
      <video
        ref={videoRef}
        src={blobUrl}
        controls
        controlsList="nodownload"
        style={styles.video}
        onError={handleError}
      >
        Browser Anda tidak mendukung tag video.
      </video>
      <p style={styles.info}>
        {file.name} &mdash; Gunakan kontrol video untuk play, pause, dan atur volume
      </p>
    </div>
  );
};

export default VideoViewer;
