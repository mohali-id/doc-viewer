export interface SrtCue {
  index: number;
  start: string;
  end: string;
  text: string;
}

const TIMING = /(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3})/;

/** Parses SRT text into cues; blocks without a timing line are skipped. */
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
      .replace(/<[^>]+>/g, '') // <i>, <b>, <font ...>
      .replace(/\{\\[^}]*\}/g, ''); // ASS-style overrides like {\an8}
    cues.push({ index: cues.length + 1, start: start.replace('.', ','), end: end.replace('.', ','), text: body });
  }
  return cues;
}
