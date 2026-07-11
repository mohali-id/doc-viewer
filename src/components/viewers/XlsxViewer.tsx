import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { ViewerProps } from '../../types';

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100%',
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
  },
  tabs: {
    display: 'flex',
    gap: '0',
    borderBottom: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-secondary)',
    overflowX: 'auto',
    flexShrink: 0,
  },
  tab: {
    padding: '8px 16px',
    border: 'none',
    borderBottom: '2px solid transparent',
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '13px',
    whiteSpace: 'nowrap',
  },
  tabActive: {
    borderBottomColor: 'var(--accent-color)',
    color: 'var(--text-primary)',
    backgroundColor: 'var(--bg-primary)',
  },
  tableWrapper: {
    flex: 1,
    overflow: 'auto',
    padding: '8px',
  },
  table: {
    borderCollapse: 'collapse',
    fontSize: '13px',
    whiteSpace: 'nowrap',
  },
  th: {
    padding: '6px 12px',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontWeight: 600,
    position: 'sticky',
    top: 0,
  },
  td: {
    padding: '6px 12px',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
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

interface SheetData {
  name: string;
  rows: string[][];
}

const XlsxViewer: React.FC<ViewerProps> = ({ file }) => {
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const parse = async () => {
      try {
        setLoading(true);
        setError(null);

        if (file.fileType === 'csv') {
          const text = new TextDecoder().decode(file.data);
          const result = Papa.parse<string[]>(text, { header: false });
          setSheets([{ name: 'Sheet1', rows: result.data }]);
        } else {
          const data = new Uint8Array(file.data);
          const workbook = XLSX.read(data, { type: 'array' });
          const parsed: SheetData[] = workbook.SheetNames.map((name) => {
            const sheet = workbook.Sheets[name];
            const rows: string[][] = XLSX.utils.sheet_to_json(sheet, {
              header: 1,
              defval: '',
            });
            return { name, rows };
          });
          setSheets(parsed);
        }
        setActiveSheet(0);
      } catch (err) {
        setError(`Failed to parse spreadsheet: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };
    parse();
  }, [file.data, file.fileType]);

  if (loading) return <div style={styles.loading}>Loading spreadsheet...</div>;
  if (error) return <div style={styles.error}>{error}</div>;
  if (sheets.length === 0) return <div style={styles.loading}>No data found</div>;

  const currentSheet = sheets[activeSheet];

  return (
    <div style={styles.container}>
      {sheets.length > 1 && (
        <div style={styles.tabs}>
          {sheets.map((sheet, idx) => (
            <button
              key={sheet.name}
              style={{ ...styles.tab, ...(idx === activeSheet ? styles.tabActive : {}) }}
              onClick={() => setActiveSheet(idx)}
            >
              {sheet.name}
            </button>
          ))}
        </div>
      )}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            {currentSheet.rows.length > 0 && (
              <tr>
                {currentSheet.rows[0].map((cell, i) => (
                  <th key={i} style={styles.th}>
                    {cell}
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {currentSheet.rows.slice(1).map((row, rowIdx) => (
              <tr key={rowIdx}>
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} style={styles.td}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default XlsxViewer;
