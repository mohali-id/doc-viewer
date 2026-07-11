import React from 'react';
import { FileItem } from '../types';
import { formatFileSize } from '../utils/fileUtils';

interface SidebarProps {
  files: FileItem[];
  activeFileId: string | null;
  onSelectFile: (id: string) => void;
  onRemoveFile: (id: string) => void;
}

const fileTypeIcons: Record<string, string> = {
  pdf: '📄',
  docx: '📝',
  doc: '📝',
  xlsx: '📊',
  csv: '📋',
  pptx: '📽️',
  ppt: '📽️',
  image: '🖼️',
  video: '🎬',
  code: '💻',
  unknown: '📁',
};

const Sidebar: React.FC<SidebarProps> = ({ files, activeFileId, onSelectFile, onRemoveFile }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Files</h2>
      </div>
      <div className="sidebar-content">
        {files.length === 0 ? (
          <div className="sidebar-empty">
            <p>No files</p>
          </div>
        ) : (
          <ul className="file-list">
            {files.map((file) => (
              <li
                key={file.id}
                className={`file-list-item ${file.id === activeFileId ? 'active' : ''}`}
                onClick={() => onSelectFile(file.id)}
              >
                <span className="file-icon">{fileTypeIcons[file.fileType] || fileTypeIcons.unknown}</span>
                <div className="file-info">
                  <span className="file-name" title={file.name}>{file.name}</span>
                  <span className="file-size">{formatFileSize(file.size)}</span>
                </div>
                <button
                  className="file-remove-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFile(file.id);
                  }}
                  title="Remove file"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
