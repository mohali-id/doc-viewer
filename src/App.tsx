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

  return (
    <div className="app">
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
