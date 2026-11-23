export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  data: ArrayBuffer;
  fileType: FileType;
  url?: string;
  /** Media rendered straight from `url` without downloading its bytes. */
  passthrough?: boolean;
}

export type FileType =
  | 'pdf'
  | 'docx'
  | 'xlsx'
  | 'pptx'
  | 'csv'
  | 'html'
  | 'image'
  | 'video'
  | 'audio'
  | 'code'
  | 'subtitle'
  | 'markdown'
  | 'zip'
  | 'unknown';

export interface ViewerProps {
  file: FileItem;
}
