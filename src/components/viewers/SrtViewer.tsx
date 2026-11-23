import React, { useMemo } from 'react';
import { ViewerProps } from '../../types';
import { parseSrt } from '../../utils/srt';

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100%',
    overflow: 'auto',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
  },
  header: {
    position: 'sticky',
    top: 0,
    padding: '8px 16px',
    fontSize: '14px',
    color: 'var(--text-secondary)',
    borderBottom: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-secondary)',
  },
  list: { maxWidth: '880px', margin: '0 auto', padding: '8px 16px' },
  cue: {
    display: 'grid',
    gridTemplateColumns: '48px 220px 1fr',
    gap: '12px',
    padding: '10px 0',
    borderBottom: '1px solid var(--border-color)',
    fontSize: '15px',
    lineHeight: 1.5,
  },
  index: { color: 'var(--text-secondary)', textAlign: 'right' },
  time: {
    color: 'var(--text-secondary)',
    fontFamily: 'Consolas, "Cascadia Code", monospace',
    fontSize: '13px',
    paddingTop: '2px',
  },
  text: { whiteSpace: 'pre-wrap' },
  empty: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'var(--text-secondary)',
  },
};

const SrtViewer: React.FC<ViewerProps> = ({ file }) => {
  const cues = useMemo(() => parseSrt(new TextDecoder().decode(file.data)), [file.data]);

  if (cues.length === 0) return <div style={styles.empty}>Tidak ada subtitle yang valid di file ini.</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>{cues.length} subtitle</div>
      <div style={styles.list}>
        {cues.map((cue) => (
          <div key={cue.index} style={styles.cue}>
            <span style={styles.index}>{cue.index}</span>
            <span style={styles.time}>
              {cue.start} → {cue.end}
            </span>
            <span style={styles.text}>{cue.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SrtViewer;
