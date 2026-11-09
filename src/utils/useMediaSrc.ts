import { useEffect, useState } from 'react';
import { FileItem } from '../types';

/**
 * Returns a `src` usable by <img>/<video>/<audio>.
 * Passthrough files use their original URL directly; uploaded/fetched files
 * get a temporary object URL built from their bytes.
 */
export function useMediaSrc(file: FileItem, mimeType: string): string | null {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const directSrc = file.passthrough ? file.url ?? null : null;

  useEffect(() => {
    if (directSrc) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(new Blob([file.data], { type: mimeType }));
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [directSrc, file.data, mimeType]);

  return directSrc ?? objectUrl;
}
