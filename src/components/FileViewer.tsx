import React, { Suspense } from 'react';
import { FileItem } from '../types';
import LoadingIndicator from './LoadingIndicator';
import { DownloadOnlyCard } from './viewers';

const PdfViewer = React.lazy(() => import('./viewers/PdfViewer'));
const DocxViewer = React.lazy(() => import('./viewers/DocxViewer'));
const XlsxViewer = React.lazy(() => import('./viewers/XlsxViewer'));
const PptxViewer = React.lazy(() => import('./viewers/PptxViewer'));
const ImageViewer = React.lazy(() => import('./viewers/ImageViewer'));
const CodeViewer = React.lazy(() => import('./viewers/CodeViewer'));
const VideoViewer = React.lazy(() => import('./viewers/VideoViewer'));
const OldFormatViewer = React.lazy(() => import('./viewers/OldFormatViewer'));

interface FileViewerProps {
  file: FileItem;
}

const FileViewer: React.FC<FileViewerProps> = ({ file }) => {
  const renderViewer = () => {
    switch (file.fileType) {
      case 'pdf':
        return <PdfViewer file={file} />;
      case 'docx':
        return <DocxViewer file={file} />;
      case 'xlsx':
      case 'csv':
        return <XlsxViewer file={file} />;
      case 'pptx':
        return <PptxViewer file={file} />;
      case 'image':
        return <ImageViewer file={file} />;
      case 'code':
        return <CodeViewer file={file} />;
      case 'video':
        return <VideoViewer file={file} />;
      case 'doc':
      case 'ppt':
        return <OldFormatViewer file={file} />;
      default:
        return <DownloadOnlyCard file={file} />;
    }
  };

  return (
    <Suspense fallback={<LoadingIndicator message="Loading viewer..." />}>
      {renderViewer()}
    </Suspense>
  );
};

export default FileViewer;
