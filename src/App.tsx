import React, { useState, useEffect, useCallback } from 'react';
import { FileItem } from './types';
import { detectFileType, getFileNameFromUrl, generateId } from './utils/fileUtils';
import Sidebar from './components/Sidebar';
import Toolbar from './components/Toolbar';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }

      const data = await response.arrayBuffer();
      const name = getFileNameFromUrl(url);
      const fileType = detectFileType(name);
      const contentType = response.headers.get('content-type') || '';

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
      const message = err instanceof TypeError
        ? 'CORS error: Unable to fetch the file. The server does not allow cross-origin requests.'
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

  const handleSelectFile = (id: string) => {
    setActiveFileId(id);
    setSidebarOpen(false);
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    if (activeFileId === id) {
      setActiveFileId(files.length > 1 ? files.find((f) => f.id !== id)?.id || null : null);
    }
  };

  const handleClose = () => {
    setActiveFileId(null);
  };

  const handleDownload = () => {
    if (!activeFile) return;
    const blob = new Blob([activeFile.data], { type: activeFile.type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRetry = () => {
    if (fileUrl) {
      fetchFileFromUrl(fileUrl);
    }
  };

  return (
    <div className="app">
      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        title="Toggle sidebar"
      >
        ☰
      </button>

      <button
        className="theme-toggle"
        onClick={() => setDarkMode(!darkMode)}
        title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {darkMode ? '☀️' : '🌙'}
      </button>

      <div className={`sidebar-wrapper ${sidebarOpen ? 'open' : ''}`}>
        <Sidebar
          files={files}
          activeFileId={activeFileId}
          onSelectFile={handleSelectFile}
          onRemoveFile={handleRemoveFile}
        />
      </div>

      <main className="main-content">
        <Toolbar file={activeFile} onClose={handleClose} onDownload={handleDownload} />

        <div className="viewer-area">
          {loading && <LoadingIndicator message="Fetching file..." />}
          {error && <ErrorDisplay message={error} url={fileUrl || undefined} onRetry={handleRetry} />}
          {!loading && !error && activeFile && <FileViewer file={activeFile} />}
          {!loading && !error && !activeFile && <UploadArea onFilesAdded={handleFilesAdded} />}
        </div>
      </main>
    </div>
  );
};

export default App;
