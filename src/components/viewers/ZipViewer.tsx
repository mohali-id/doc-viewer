import React, { useEffect, useState } from 'react';
import JSZip from 'jszip';
import { ViewerProps } from '../../types';
import { formatFileSize } from '../../utils/fileUtils';

interface Entry {
  path: string;
  dir: boolean;
  size: number;
  date: Date;
}

const cell: React.CSSProperties = { padding: '6px 12px', borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap' };
const message: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 20, textAlign: 'center' };

const ZipViewer: React.FC<ViewerProps> = ({ file }) => {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setEntries(null);
    setError(null);
    JSZip.loadAsync(file.data)
      .then((zip) => {
        if (cancelled) return;
        const list = Object.values(zip.files).map((f) => ({
          path: f.name,
          dir: f.dir,
          // shortcut: JSZip has no public uncompressed size; _data is internal. Upgrade if JSZip changes it.
          size: (f as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize ?? 0,
          date: f.date,
        }));
        setEntries(list.sort((a, b) => a.path.localeCompare(b.path)));
      })
      .catch((err) => {
        if (!cancelled) setError(`Gagal membaca ZIP: ${err instanceof Error ? err.message : 'Unknown error'}`);
      });
    return () => {
      cancelled = true;
    };
  }, [file.data]);

  if (error) return <div style={{ ...message, color: '#e53e3e' }}>{error}</div>;
  if (!entries) return <div style={{ ...message, color: 'var(--text-secondary)' }}>Membaca isi ZIP...</div>;

  const files = entries.filter((e) => !e.dir);
  const total = files.reduce((sum, e) => sum + e.size, 0);

  return (
    <div style={{ height: '100%', overflow: 'auto', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div style={{ position: 'sticky', top: 0, padding: '8px 16px', fontSize: 14, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
        {files.length} file · {formatFileSize(total)} setelah diekstrak
      </div>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: 'left', color: 'var(--text-secondary)' }}>
            <th style={cell}>Nama</th>
            <th style={{ ...cell, textAlign: 'right' }}>Ukuran</th>
            <th style={cell}>Diubah</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.path}>
              <td style={{ ...cell, whiteSpace: 'normal', wordBreak: 'break-all' }}>
                {e.dir ? '📁' : '📄'} {e.path}
              </td>
              <td style={{ ...cell, textAlign: 'right' }}>{e.dir ? '' : formatFileSize(e.size)}</td>
              <td style={cell}>{e.date.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ZipViewer;
