import React from 'react';
import { FileItem } from '../types';
import { formatFileSize } from '../utils/fileUtils';

interface ToolbarProps {
  file: FileItem | null;
  onClose: () => void;
  onDownload: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ file, onClose, onDownload }) => {
  if (!file) {
    return <div className="toolbar toolbar-empty" />;
  }

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <span className="toolbar-filename" title={file.name}>{file.name}</span>
        <span className="toolbar-filesize">{formatFileSize(file.size)}</span>
        <span className="toolbar-badge">{file.fileType.toUpperCase()}</span>
      </div>
      <div className="toolbar-right">
        <button className="toolbar-btn" onClick={onDownload} title="Download">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 2v9M4 8l4 4 4-4M2 14h12" />
          </svg>
        </button>
        <button className="toolbar-btn" onClick={onClose} title="Close">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
