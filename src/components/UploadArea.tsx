import React, { useRef, useState, useCallback } from 'react';
import { FileItem } from '../types';
import { detectFileType, generateId, validateFileSize } from '../utils/fileUtils';

interface UploadAreaProps {
  onFilesAdded: (files: FileItem[]) => void;
}

const UploadArea: React.FC<UploadAreaProps> = ({ onFilesAdded }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(async (fileList: FileList) => {
    const items: FileItem[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];

      if (!validateFileSize(file.size)) {
        alert(`File "${file.name}" is too large. Maximum size is 100MB.`);
        continue;
      }

      const data = await file.arrayBuffer();
      const fileType = detectFileType(file.name);

      items.push({
        id: generateId(),
        name: file.name,
        size: file.size,
        type: file.type,
        data,
        fileType,
      });
    }

    if (items.length > 0) {
      onFilesAdded(items);
    }
  }, [onFilesAdded]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <div
      className={`upload-area ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={handleInputChange}
      />
      <div className="upload-icon">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M24 32V16M18 22l6-6 6 6" />
          <path d="M8 32v4a4 4 0 004 4h24a4 4 0 004-4v-4" />
        </svg>
      </div>
      <p className="upload-text">Drag & drop file here or click to browse</p>
      <p className="upload-hint">Supports PDF, DOCX, XLSX, CSV, PPTX, images, and code files</p>
    </div>
  );
};

export default UploadArea;
