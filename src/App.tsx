import React, { useState, useEffect, useCallback } from 'react';
import { FileItem, FileType } from './types';
import { detectFileType, getFileNameFromUrl, generateId } from './utils/fileUtils';
import FileViewer from './components/FileViewer';
import UploadArea from './components/UploadArea';
import LoadingIndicator from './components/LoadingIndicator';
import ErrorDisplay from './components/ErrorDisplay';
import './App.css';

const PASSTHROUGH_TYPES: FileType[] = ['image', 'video', 'audio'];
const TYPE_HINTS: FileType[] = ['pdf', 'docx', 'xlsx', 'csv', 'html', 'image', 'video', 'audio', 'code'];

const App: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [typeHint, setTypeHint] = useState<FileType | undefined>(undefined);
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

  const resolveFileParam = useCallback((value: string) => {
    const raw = value.trim();
    if (!raw) return raw;

    if (/^(https?:\/\/|blob:)/i.test(raw)) {
      return raw;
    }

    const normalized = raw.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');

    try {
      const decoded = atob(padded).trim();
      if (/^(https?:\/\/|blob:)/i.test(decoded)) {
        return decoded;
      }
    } catch {
      // Not a valid base64 value, use raw value as-is.
    }

    return raw;
  }, []);

  const fetchFileFromUrl = useCallback(async (url: string, typeHint?: FileType) => {
    setLoading(true);
    setError(null);
    setFileUrl(url);

    try {
      const name = getFileNameFromUrl(url);
      const guessedType = typeHint ?? detectFileType(name);

      // Image/video/audio: hand the URL straight to the media element.
      // No download, no CORS requirement, and the browser can stream/seek.
      if (PASSTHROUGH_TYPES.includes(guessedType)) {
        const fileItem: FileItem = {
          id: generateId(),
          name,
          size: 0,
          type: '',
          data: new ArrayBuffer(0),
          fileType: guessedType,
          url,
          passthrough: true,
        };
        setFiles([fileItem]);
        setActiveFileId(fileItem.id);
        return;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }

      const data = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || '';
      const fileType = typeHint ?? detectFileType(name, contentType, data);

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
          ? url.startsWith('blob:')
            ? 'Gagal membaca blob URL. Blob URL hanya valid selama tab yang membuatnya masih terbuka dan dari origin yang sama. Untuk gambar/video/audio, tambahkan parameter &type=image|video|audio agar diputar langsung.'
            : url.startsWith('http://') || url.startsWith('https://')
              ? 'Gagal mengambil file. Kemungkinan CORS diblokir atau jaringan bermasalah. Pastikan server file mengizinkan Access-Control-Allow-Origin. Untuk gambar/video/audio tanpa ekstensi, tambahkan parameter &type=image|video|audio.'
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
    const fileParam = params.get('file');
    if (fileParam) {
      const resolvedUrl = resolveFileParam(fileParam);
      const typeParam = params.get('type')?.trim().toLowerCase() as FileType | undefined;
      const typeHint = typeParam && TYPE_HINTS.includes(typeParam) ? typeParam : undefined;
      setTypeHint(typeHint);
      fetchFileFromUrl(resolvedUrl, typeHint);
    }
  }, [fetchFileFromUrl, resolveFileParam]);

  const handleFilesAdded = (newFiles: FileItem[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
    if (newFiles.length > 0) {
      setActiveFileId(newFiles[0].id);
    }
    setError(null);
  };

  const handleRetry = () => {
    if (fileUrl) {
      fetchFileFromUrl(fileUrl, typeHint);
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
