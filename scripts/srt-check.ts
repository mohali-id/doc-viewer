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

const vtt =
  'WEBVTT - judul\n\nNOTE komentar\n\nSTYLE\n::cue { color: red }\n\n' +
  'intro\n01:02.500 --> 01:04.000 align:start line:0\n<v Budi>Halo <c.kuning>semua</c></v>\n\n' +
  '01:00:00.000 --> 01:00:01.000\n<00:00:00.500>Karaoke\n';
const vcues = parseSrt(vtt);
assert.equal(vcues.length, 2);
assert.deepEqual(vcues[0], { index: 1, start: '00:01:02,500', end: '00:01:04,000', text: 'Halo semua' });
assert.deepEqual(vcues[1], { index: 2, start: '01:00:00,000', end: '01:00:01,000', text: 'Karaoke' });
console.log('srt-check OK');
