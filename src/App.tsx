import React, { useState, useEffect, useCallback } from 'react';
import { FileItem } from './types';
import { detectFileType, getFileNameFromUrl, generateId } from './utils/fileUtils';
import FileViewer from './components/FileViewer';
import UploadArea from './components/UploadArea';
import LoadingIndicator from './components/LoadingIndicator';
import ErrorDisplay from './components/ErrorDisplay';
import './App.css';

const App: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  const activeFile = files.find((f) => f.id === activeFileId) || null;

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const fetchFileFromUrl = useCallback(async (url: string) => {
    setLoading(true);
    setError(null);
    setFileUrl(url);

    try {
      if (url.startsWith('blob:')) {
        throw new Error(
          'URL blob tidak bisa dibuka dari query parameter. Blob URL hanya valid di tab/sesi yang membuatnya. Gunakan URL http/https publik atau upload file langsung.'
        );
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }

      const data = await response.arrayBuffer();
      const name = getFileNameFromUrl(url);
      const contentType = response.headers.get('content-type') || '';
      const fileType = detectFileType(name, contentType, data);

      const fileItem: FileItem = {
        id: generateId(),
        name,
        size: data.byteLength,
        type: contentType,
        data,
        fileType,
        url,
      };

      setFiles([fileItem]);
      setActiveFileId(fileItem.id);
    } catch (err: unknown) {
      const message =
        err instanceof TypeError
          ? url.startsWith('http://') || url.startsWith('https://')
            ? 'Gagal mengambil file. Kemungkinan CORS diblokir atau jaringan bermasalah. Pastikan server file mengizinkan Access-Control-Allow-Origin.'
            : 'Gagal mengambil file dari URL yang diberikan.'
          : err instanceof Error
            ? err.message
            : 'An unknown error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const url = params.get('file');
    if (url) {
      fetchFileFromUrl(url);
    }
  }, [fetchFileFromUrl]);

  const handleFilesAdded = (newFiles: FileItem[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
    if (newFiles.length > 0) {
      setActiveFileId(newFiles[0].id);
    }
    setError(null);
  };

  const handleRetry = () => {
    if (fileUrl) {
      fetchFileFromUrl(fileUrl);
    }
  };

  const handleDownload = () => {
    if (!activeFile) return;
    const blob = new Blob([activeFile.data], { type: activeFile.type || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app">
      {activeFile && (
        <button className="download-fab" onClick={handleDownload} title="Download file">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
      )}

      <button
        className="theme-fab"
        onClick={() => setDarkMode(!darkMode)}
        title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {darkMode ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3a6 6 0 1 0 9 9 9 9 0 1 1-9-9" />
          </svg>
        )}
      </button>

      <div className="viewer-area viewer-area-full">
        {loading && <LoadingIndicator message="Fetching file..." />}
        {error && <ErrorDisplay message={error} url={fileUrl || undefined} onRetry={handleRetry} />}
        {!loading && !error && activeFile && <FileViewer file={activeFile} />}
        {!loading && !error && !activeFile && <UploadArea onFilesAdded={handleFilesAdded} />}
      </div>
    </div>
  );
};

export default App;
