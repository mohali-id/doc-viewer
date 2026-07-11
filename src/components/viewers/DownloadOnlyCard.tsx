import React from 'react';
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
};

const DownloadOnlyCard: React.FC<ViewerProps> = ({ file }) => {
  const extension = getFileExtension(file.name);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.icon}>&#128196;</div>
        <div style={styles.title}>No Preview Available</div>
        <div style={styles.fileName}>{file.name}</div>
        <div style={styles.meta}>
          <span>Size: {formatFileSize(file.size)}</span>
          <span>Type: {extension ? `.${extension}` : file.type || 'Unknown'}</span>
        </div>
      </div>
    </div>
  );
};

export default DownloadOnlyCard;
