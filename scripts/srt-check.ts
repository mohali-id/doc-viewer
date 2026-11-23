// Self-check for the SRT parser. Run: node scripts/srt-check.ts
import assert from 'node:assert/strict';
import { parseSrt } from '../src/utils/srt.ts';

const sample =
  '﻿1\r\n00:00:01,000 --> 00:00:02,500\r\n<i>Halo</i> dunia\r\nbaris dua\r\n\r\n' +
  '2\n00:00:03.000 --> 00:00:04,000 X1:0\n{\\an8}Atas\n\n\n' +
  'sampah tanpa timing\n\n' +
  '00:01:00,000 --> 00:01:01,000\nTanpa nomor\n';

const cues = parseSrt(sample);
assert.equal(cues.length, 3);
assert.deepEqual(cues[0], { index: 1, start: '00:00:01,000', end: '00:00:02,500', text: 'Halo dunia\nbaris dua' });
assert.deepEqual(cues[1], { index: 2, start: '00:00:03,000', end: '00:00:04,000', text: 'Atas' });
assert.equal(cues[2].text, 'Tanpa nomor');
assert.deepEqual(parseSrt(''), []);
console.log('srt-check OK');
