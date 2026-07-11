export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  data: ArrayBuffer;
  fileType: FileType;
  url?: string;
}

export type FileType =
  | 'pdf'
  | 'docx'
  | 'xlsx'
  | 'csv'
  | 'html'
  | 'image'
  | 'video'
  | 'code'
  | 'unknown';

export interface ViewerProps {
  file: FileItem;
}
