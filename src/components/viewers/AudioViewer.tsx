import React, { useState, useEffect, useRef } from 'react';
import { ViewerProps } from '../../types';
import { formatFileSize, getFileExtension } from '../../utils/fileUtils';
import { useMediaSrc } from '../../utils/useMediaSrc';

const MIME_MAP: Record<string, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  oga: 'audio/ogg',
  opus: 'audio/ogg; codecs=opus',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  flac: 'audio/flac',
  weba: 'audio/webm',
};

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    overflow: 'auto',
    padding: '16px',
  },
  card: {
    width: '100%',
    maxWidth: '520px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    padding: '32px 24px',
    borderRadius: '12px',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
  },
  icon: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--accent-color, #3b82f6)',
    color: '#fff',
  },
  name: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    textAlign: 'center',
    wordBreak: 'break-word',
  },
  meta: {
    margin: 0,
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  audio: {
    width: '100%',
    outline: 'none',
  },
  speedRow: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '6px',
    alignItems: 'center',
    fontSize: '13px',
    color: 'var(--text-secondary)',
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
};

const speedButtonStyle = (active: boolean): React.CSSProperties => ({
  padding: '4px 10px',
  borderRadius: '999px',
  border: '1px solid var(--border-color)',
  backgroundColor: active ? 'var(--accent-color, #3b82f6)' : 'transparent',
  color: active ? '#fff' : 'var(--text-primary)',
  cursor: 'pointer',
  fontSize: '12px',
});

function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

const AudioViewer: React.FC<ViewerProps> = ({ file }) => {
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(1);
  const audioRef = useRef<HTMLAudioElement>(null);
  const mimeType = MIME_MAP[getFileExtension(file.name)] || file.type || 'audio/mpeg';
  const blobUrl = useMediaSrc(file, mimeType);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  // A direct URL can finish loading metadata before React's listener is attached.
  useEffect(() => {
    const el = audioRef.current;
    if (el && el.readyState >= 1) setDuration(el.duration);
  }, [blobUrl]);

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

  const durationText = formatDuration(duration);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.icon}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </div>
        <p style={styles.name}>{file.name}</p>
        <p style={styles.meta}>
          {[file.size > 0 ? formatFileSize(file.size) : null, durationText || null]
            .filter(Boolean)
            .join(' · ') || (file.passthrough ? 'Streaming dari URL' : '')}
        </p>
        <audio
          ref={audioRef}
          src={blobUrl}
          controls
          controlsList="nodownload"
          preload="metadata"
          style={styles.audio}
          onDurationChange={(e) => setDuration(e.currentTarget.duration)}
          onLoadedMetadata={(e) => {
            setDuration(e.currentTarget.duration);
            e.currentTarget.playbackRate = speed;
          }}
          onError={() =>
            setError(
              file.passthrough
                ? 'Audio tidak dapat diputar. URL mungkin tidak bisa diakses atau formatnya tidak didukung browser.'
                : 'Browser tidak dapat memutar format audio ini. Coba download dan putar dengan media player.'
            )
          }
        >
          Browser Anda tidak mendukung tag audio.
        </audio>
        <div style={styles.speedRow}>
          <span>Kecepatan:</span>
          {SPEEDS.map((s) => (
            <button key={s} type="button" style={speedButtonStyle(s === speed)} onClick={() => setSpeed(s)}>
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AudioViewer;
