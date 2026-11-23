export interface SrtCue {
  index: number;
  start: string;
  end: string;
  text: string;
}

// Hours are optional in WebVTT (mm:ss.ttt).
const TIMING = /((?:\d{1,2}:)?\d{2}:\d{2}[,.]\d{1,3})\s*-->\s*((?:\d{1,2}:)?\d{2}:\d{2}[,.]\d{1,3})/;

/** Normalizes to SRT style hh:mm:ss,ttt. */
const normalizeTime = (t: string) => (t.split(':').length === 2 ? `00:${t}` : t).replace('.', ',');

/**
 * Parses SRT or WebVTT text into cues. Blocks without a timing line
 * (WEBVTT header, NOTE, STYLE, garbage) are skipped.
 */
export function parseSrt(text: string): SrtCue[] {
  const cues: SrtCue[] = [];
  const blocks = text.replace(/^﻿/, '').replace(/\r\n?/g, '\n').split(/\n\s*\n/);
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    const timingAt = lines.findIndex((l) => TIMING.test(l));
    if (timingAt === -1) continue;
    const [, start, end] = lines[timingAt].match(TIMING)!;
    const body = lines
      .slice(timingAt + 1)
      .join('\n')
      .replace(/<[^>]+>/g, '') // <i>, <b>, <font ...>, VTT <v Name>, <c.cls>, <00:00:01.000>
      .replace(/\{\\[^}]*\}/g, ''); // ASS-style overrides like {\an8}
    cues.push({ index: cues.length + 1, start: normalizeTime(start), end: normalizeTime(end), text: body });
  }
  return cues;
}
