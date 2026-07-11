import { FileType } from '../types';

const EXT_MAP: Record<string, FileType> = {
  pdf: 'pdf',
  docx: 'docx',
  xlsx: 'xlsx',
  csv: 'csv',
  // Video
  mp4: 'video',
  webm: 'video',
  ogg: 'video',
  ogv: 'video',
  mov: 'video',
  avi: 'video',
  mkv: 'video',
  // Image
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  gif: 'image',
  webp: 'image',
  svg: 'image',
  bmp: 'image',
  txt: 'code',
  php: 'code',
  py: 'code',
  js: 'code',
  ts: 'code',
  tsx: 'code',
  jsx: 'code',
  json: 'code',
  html: 'html',
  htm: 'html',
  css: 'code',
  scss: 'code',
  less: 'code',
  java: 'code',
  c: 'code',
  cpp: 'code',
  h: 'code',
  hpp: 'code',
  sql: 'code',
  md: 'code',
  yml: 'code',
  yaml: 'code',
  sh: 'code',
  bash: 'code',
  xml: 'code',
  go: 'code',
  rs: 'code',
  rb: 'code',
  swift: 'code',
  kt: 'code',
  dart: 'code',
  lua: 'code',
  r: 'code',
  ini: 'code',
  toml: 'code',
  env: 'code',
  log: 'code',
};

const MIME_MAP: Record<string, FileType> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'text/csv': 'csv',
  // Video
  'video/mp4': 'video',
  'video/webm': 'video',
  'video/ogg': 'video',
  'video/quicktime': 'video',
  'video/x-msvideo': 'video',
  'video/x-matroska': 'video',
  // Image
  'image/png': 'image',
  'image/jpeg': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'image/svg+xml': 'image',
  'text/plain': 'code',
  'text/html': 'html',
  'application/xhtml+xml': 'html',
  'text/css': 'code',
  'application/javascript': 'code',
  'application/json': 'code',
  'text/markdown': 'code',
  'text/xml': 'code',
  'application/xml': 'code',
};

// Magic number signatures
const MAGIC_NUMBERS: { bytes: number[]; offset?: number; type: FileType }[] = [
  { bytes: [0x25, 0x50, 0x44, 0x46], type: 'pdf' }, // %PDF
  { bytes: [0x89, 0x50, 0x4E, 0x47], type: 'image' }, // PNG
  { bytes: [0xFF, 0xD8, 0xFF], type: 'image' }, // JPEG
  { bytes: [0x47, 0x49, 0x46, 0x38], type: 'image' }, // GIF
  { bytes: [0x00, 0x00, 0x00, 0x1C, 0x66, 0x74, 0x79, 0x70], type: 'video' }, // MP4 ftyp
  { bytes: [0x1A, 0x45, 0xDF, 0xA3], type: 'video' }, // MKV/WebM
];

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length < 2) return '';
  return parts[parts.length - 1].toLowerCase();
}

export function detectFileTypeFromExtension(filename: string): FileType {
  const ext = getFileExtension(filename);
  return EXT_MAP[ext] || 'unknown';
}

export function detectFileTypeFromMime(mimeType: string): FileType {
  return MIME_MAP[mimeType] || 'unknown';
}

export function detectFileTypeFromMagic(buffer: ArrayBuffer): FileType | null {
  const view = new Uint8Array(buffer.slice(0, 16));
  for (const sig of MAGIC_NUMBERS) {
    const offset = sig.offset || 0;
    let match = true;
    for (let i = 0; i < sig.bytes.length; i++) {
      if (view[offset + i] !== sig.bytes[i]) {
        match = false;
        break;
      }
    }
    if (match) return sig.type;
  }
  return null;
}

export function detectFileType(
  filename: string,
  mimeType?: string,
  buffer?: ArrayBuffer
): FileType {
  // First try extension
  const extType = detectFileTypeFromExtension(filename);
  if (extType !== 'unknown') return extType;

  // Then try MIME type
  if (mimeType) {
    const mimeFileType = detectFileTypeFromMime(mimeType);
    if (mimeFileType !== 'unknown') return mimeFileType;
  }

  // Then try magic numbers
  if (buffer) {
    const magicType = detectFileTypeFromMagic(buffer);
    if (magicType) return magicType;
  }

  return 'unknown';
}

export function getLanguageFromExtension(filename: string): string {
  const ext = getFileExtension(filename);
  const langMap: Record<string, string> = {
    js: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    jsx: 'javascript',
    py: 'python',
    rb: 'ruby',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    h: 'c',
    hpp: 'cpp',
    cs: 'csharp',
    go: 'go',
    rs: 'rust',
    swift: 'swift',
    kt: 'kotlin',
    php: 'php',
    html: 'html',
    css: 'css',
    scss: 'scss',
    less: 'less',
    json: 'json',
    xml: 'xml',
    yml: 'yaml',
    yaml: 'yaml',
    md: 'markdown',
    sql: 'sql',
    sh: 'bash',
    bash: 'bash',
    txt: 'plaintext',
    ini: 'ini',
    toml: 'ini',
    dart: 'dart',
    lua: 'lua',
    r: 'r',
    log: 'plaintext',
    env: 'bash',
  };
  return langMap[ext] || 'plaintext';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileNameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    const segments = path.split('/').filter(Boolean);
    if (segments.length > 0) {
      return decodeURIComponent(segments[segments.length - 1]);
    }
  } catch {
    // fallback
  }
  return 'document';
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function validateFileSize(size: number): { valid: boolean; message?: string } {
  if (size > MAX_FILE_SIZE) {
    return {
      valid: false,
      message: `File terlalu besar (${formatFileSize(size)}). Maksimal ${formatFileSize(MAX_FILE_SIZE)}.`,
    };
  }
  return { valid: true };
}
