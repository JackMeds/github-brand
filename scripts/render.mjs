import opentype from 'opentype.js';
import { Resvg } from '@resvg/resvg-js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const fontDir = fileURLToPath(new URL('../assets/fonts/', import.meta.url));
const cache = new Map();
function font(role) {
  if (!cache.has(role)) {
    const file = { display: 'InstrumentSans.ttf', mono: 'IBMPlexMono-Regular.ttf', zh: 'SourceHanSansSC-Regular.otf' }[role];
    cache.set(role, opentype.loadSync(path.join(fontDir, file)));
  }
  return cache.get(role);
}
export const esc = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
export const palettes = {
  light: { paper: '#F6F7F2', ink: '#171A1F', muted: '#59616B', rule: '#CDD1CA', blue: '#2E5BFF' },
  dark: { paper: '#0F1217', ink: '#EDF0F5', muted: '#A6AFBD', rule: '#363D46', blue: '#91ACFF' }
};

export function label(text, x, y, size, color, role = 'display', maxWidth = Infinity) {
  const face = font(role);
  for (const glyph of face.stringToGlyphs(text)) {
    if (glyph.index === 0) throw new Error('Font missing glyph in: ' + text);
  }
  const width = face.getAdvanceWidth(text, size);
  const fitted = width > maxWidth ? size * maxWidth / width : size;
  return '<path fill="' + color + '" d="' + face.getPath(text, x, y, fitted).toPathData(2) + '"/>';
}
function line(x1, y1, x2, y2, color, width = 1, extra = '') {
  // Transcendental math differs in its last bits across CPU/libm combinations.
  // SVG coordinates are an output format: round before serializing, not after.
  const coordinate = value => Number(value.toFixed(3));
  return '<line x1="' + coordinate(x1) + '" y1="' + coordinate(y1) + '" x2="' + coordinate(x2) + '" y2="' + coordinate(y2) + '" stroke="' + color + '" stroke-width="' + coordinate(width) + '" ' + extra + '/>';
}
function rect(x, y, w, h, color, extra = '') {
  return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + color + '" ' + extra + '/>';
}

export function jmMark(x, y, size, color) {
  // An open J and folded M share the same vertical rhythm. No font dependency.
  return '<g transform="translate(' + x + ' ' + y + ') scale(' + size / 64 + ')" fill="none" stroke="' + color + '" stroke-width="7" stroke-linejoin="miter">'
    + '<path d="M5 15H24V43Q24 54 13 54H5"/><path d="M34 54V15L46 34L59 15V54"/>'
    + '</g>';
}

function specimen(kind, accent, p) {
  const out = [];
  if (kind === 'voice') {
    // Readable sentence segments turn into an amplitude field, with one active word.
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 6 - (r % 2); c++) out.push(rect(-125 + c * 43, -101 + r * 18, 32, 5, r === 1 && c === 2 ? accent : p.rule));
    }
    for (let i = 0; i < 43; i++) {
      const envelope = Math.pow(Math.sin(i / 42 * Math.PI), 1.3);
      const h = (15 + Math.abs(Math.sin(i * 0.62)) * 130) * envelope + 5;
      out.push(line(-126 + i * 6, 21 - h / 2, -126 + i * 6, 21 + h / 2, accent, 3));
    }
    out.push(line(-143, 100, 139, 100, p.rule), rect(-28, 96, 25, 8, accent));
  } else if (kind === 'chart') {
    out.push('<g transform="rotate(-12)">');
    out.push(rect(-116, -116, 232, 232, 'none', 'stroke="' + accent + '" stroke-width="2"'));
    for (const v of [-58, 0, 58]) {
      out.push(line(v, -116, v, 116, p.rule), line(-116, v, 116, v, p.rule));
    }
    out.push(rect(-58, -58, 116, 116, p.paper, 'stroke="' + accent + '" stroke-width="2"'));
    out.push('<circle r="31" fill="none" stroke="' + accent + '" stroke-width="2"/>');
    out.push(line(-24, 0, 24, 0, accent, 2), line(0, -24, 0, 24, accent, 2));
    const cells = [[-86, -86], [30, -86], [88, -28], [30, 88], [-86, 30]];
    for (let i = 0; i < cells.length; i++) {
      out.push(rect(cells[i][0] - 7, cells[i][1] - 7, 14, 14, i === 2 ? accent : p.ink));
    }
    out.push('</g>');
  } else if (kind === 'pipeline') {
    out.push('<g transform="rotate(-8)">');
    const boxes = [[-128, -98, 115, 68], [-35, -15, 146, 92], [-119, 98, 92, 26]];
    out.push('<path d="M-71-29V30H-35M38 78V110H-26" fill="none" stroke="' + accent + '" stroke-width="3"/>');
    for (let i = 0; i < boxes.length; i++) {
      const [x, y, w, h] = boxes[i];
      out.push(rect(x, y, w, h, p.paper, 'stroke="' + (i === 1 ? accent : p.ink) + '" stroke-width="2"'));
      if (i === 0) out.push('<path d="M-82-80L-82-49L-54-64Z" fill="' + accent + '"/>');
      if (i === 1) for (let k = 0; k < 5; k++) out.push(rect(x + 16, y + 17 + k * 13, (k % 2 ? 66 : 104), 4, k === 2 ? accent : p.rule));
      if (i === 2) out.push(label('MD / JSON', x + 10, y + 18, 12, p.ink, 'mono'));
    }
    out.push('</g>');
  } else if (kind === 'memory') {
    out.push(line(-139, -96, -139, 123, accent, 2));
    for (let i = 0; i < 3; i++) {
      const x = -115 + i * 31, y = -112 + i * 69;
      out.push(line(-139, y + 35, x, y + 35, p.rule), rect(-144, y + 30, 10, 10, accent));
      out.push('<g transform="rotate(' + [-8, 4, -4][i] + ' ' + x + ' ' + y + ')">');
      out.push(rect(x, y, 186, 111, p.paper, 'stroke="' + p.ink + '" stroke-width="1.5"'));
      out.push(rect(x + 11, y + 12, 52, 52, accent, 'opacity="' + (0.15 + i * 0.1) + '"'));
      out.push('<path d="M' + (x + 12) + ' ' + (y + 63) + 'L' + (x + 34) + ' ' + (y + 31) + 'L' + (x + 63) + ' ' + (y + 63) + 'Z" fill="' + accent + '"/>');
      for (let j = 0; j < 3; j++) out.push(rect(x + 76, y + 18 + j * 13, j === 2 ? 68 : 96, 4, p.rule));
      out.push(rect(x + 12, y + 83, 130, 4, p.ink), '</g>');
    }
  } else if (kind === 'profile') {
    const colors = ['#168A90', '#C65243', '#B94572', '#64834F'];
    const kinds = ['voice', 'chart', 'pipeline', 'memory'];
    for (let i = 0; i < 4; i++) {
      const x = (i % 2 ? 76 : -76), y = i < 2 ? -73 : 79;
      out.push('<g transform="translate(' + x + ' ' + y + ') scale(.43)">' + specimen(kinds[i], colors[i], p) + '</g>');
    }
    out.push(line(0, -145, 0, 145, p.rule), line(-145, 0, 145, 0, p.rule));
  } else {
    // Legacy projects receive a compact, honest source-module specimen.
    for (let i = 0; i < 3; i++) {
      const x = -120 + i * 55, y = -106 + i * 62;
      out.push(rect(x, y, 150, 90, p.paper, 'stroke="' + (i === 1 ? accent : p.rule) + '" stroke-width="2"'));
      out.push(rect(x, y, 6, 90, accent), line(x + 22, y + 28, x + 62, y + 28, p.ink, 4));
      out.push(line(x + 22, y + 60, x + 125, y + 60, p.rule, 3));
    }
  }
  return out.join('');
}

export function renderBanner(m, theme = 'light', social = false) {
  const p = palettes[theme];
  const accent = theme === 'dark' ? (m.accentDark || m.accent) : m.accent;
  const w = social ? 1280 : 1200, h = social ? 640 : 360;
  const left = 54, titleY = social ? 258 : 167;
  const motifX = social ? 1010 : 979, motifY = social ? 313 : 173;
  const tagline = m.tagline.en;
  const parts = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-labelledby="title desc">',
    '<title id="title">' + esc(m.displayName) + '</title><desc id="desc">' + esc(tagline) + '</desc>',
    rect(0, 0, w, h, p.paper), rect(0, 0, 8, h, accent),
    jmMark(left, 28, 30, p.ink),
    label('JACKMEDS / SOFTWARE LAB', 103, 49, 13, p.muted, 'mono'),
    label(m.category.toUpperCase(), social ? 859 : 831, 49, 12, p.muted, 'mono', social ? 367 : 315),
    line(left, 72, w - left, 72, p.rule),
    label(m.wordmark || m.displayName, left, titleY, social ? 95 : 82, p.ink, 'display', social ? 710 : 725)
  ];
  if (m.localName) parts.push(label(m.localName, left + 3, titleY + (social ? 61 : 48), social ? 34 : 27, accent, 'zh', 695));
  parts.push(label(tagline, left + 3, titleY + (social ? 128 : 87), social ? 29 : 24, p.ink, 'display', social ? 704 : 726));
  if (social && m.tagline.zh) parts.push(label(m.tagline.zh, left + 3, titleY + 174, 23, p.muted, 'zh', 730));
  parts.push('<g transform="translate(' + motifX + ' ' + motifY + ') scale(' + (social ? 1.22 : 0.89) + ')">' + specimen(m.kind, accent, p) + '</g>');
  const footerY = social ? 543 : 297;
  parts.push(line(left, footerY, w - left, footerY, p.rule));
  parts.push(label(m.tags.join('  /  ').toUpperCase(), left, footerY + 35, 12, p.muted, 'mono', 800));
  parts.push(label('JACKMEDS', w - 151, footerY + 35, 12, accent, 'mono'));
  parts.push('</svg>\n');
  return parts.join('');
}

export function renderAvatar(theme = 'light') {
  const p = palettes[theme];
  return '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><title>JackMeds JM mark</title>'
    + rect(0, 0, 512, 512, p.paper) + rect(0, 0, 26, 512, p.blue)
    + jmMark(92, 82, 330, p.ink) + rect(360, 405, 49, 12, p.blue) + '</svg>\n';
}
export function png(svg) {
  return new Resvg(svg, { font: { loadSystemFonts: false } }).render().asPng();
}
