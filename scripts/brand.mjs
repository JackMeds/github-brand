import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { renderBanner, renderAvatar, png, esc } from './render.mjs';

export const START = '<!-- jackmeds-brand:start -->';
export const END = '<!-- jackmeds-brand:end -->';
const root = fileURLToPath(new URL('../', import.meta.url));
const version = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8')).version;
const safeRelative = (s) => typeof s === 'string' && s.length > 0 && !path.isAbsolute(s) && !s.split(/[\\/]/).includes('..') && !s.includes('\\');

export function validateManifest(m) {
  if (!m || m.schemaVersion !== 1) throw new Error('project-brand.json requires schemaVersion: 1');
  for (const key of ['repo', 'displayName', 'wordmark', 'category', 'kind', 'accent', 'accentDark']) {
    if (typeof m[key] !== 'string' || !m[key].trim()) throw new Error('Missing manifest field: ' + key);
  }
  if (!/^JackMeds\/[A-Za-z0-9._-]+$/.test(m.repo)) throw new Error('Expected a JackMeds repository');
  if (!['profile', 'voice', 'chart', 'pipeline', 'memory', 'modules'].includes(m.kind)) throw new Error('Unknown specimen kind');
  for (const key of ['accent', 'accentDark']) if (!/^#[0-9a-f]{6}$/i.test(m[key])) throw new Error('Invalid color: ' + key);
  if (!m.tagline || typeof m.tagline.en !== 'string' || !m.tagline.en.trim()) throw new Error('English tagline required');
  if (!Array.isArray(m.tags) || !m.tags.length || m.tags.some(t => typeof t !== 'string')) throw new Error('tags must be a string array');
  if (!Array.isArray(m.readmes) || !m.readmes.length || m.readmes.some(s => !safeRelative(s))) throw new Error('readmes must stay inside the repository');
  if (m.readmes.some(s => path.posix.normalize(s) !== s || !/\.(md|markdown)$/i.test(s) || s.split('/').some(p => p.toLowerCase() === '.git') || /^assets\/brand\//i.test(s))) {
    throw new Error('readmes must be normalized Markdown paths outside Git metadata and generated assets');
  }
  if (new Set(m.readmes.map(s => s.toLowerCase())).size !== m.readmes.length) throw new Error('readmes must be distinct');
  if (m.proof && !safeRelative(m.proof)) throw new Error('proof must stay inside the repository');
  for (const [name, url] of Object.entries(m.links || {})) {
    if (!/^https:\/\//.test(url)) throw new Error('Public link must be HTTPS: ' + name);
    new URL(url);
  }
  if (m.pilot && m.kind !== 'profile' && !m.proof) throw new Error('Pilot requires a real proof image');
  return m;
}

export function header(m, readme = 'README.md') {
  const prefix = path.posix.relative(path.posix.dirname(readme), 'assets/brand') || '.';
  return START + '\n<picture>\n'
    + '  <source media="(prefers-color-scheme: dark)" srcset="' + prefix + '/hero-dark.svg">\n'
    + '  <img src="' + prefix + '/hero-light.svg" alt="' + esc(m.displayName + ' — ' + m.tagline.en) + '" width="1200">\n'
    + '</picture>\n' + END;
}

export function replaceHeader(body, content) {
  const starts = body.split(START).length - 1, ends = body.split(END).length - 1;
  if (!starts && !ends) return content + '\n\n' + body;
  if (starts !== 1 || ends !== 1 || body.indexOf(END) < body.indexOf(START)) throw new Error('Refusing malformed/duplicate brand markers');
  return body.slice(0, body.indexOf(START)) + content + body.slice(body.indexOf(END) + END.length);
}

export async function expectedAssets(m) {
  const light = renderBanner(m, 'light'), dark = renderBanner(m, 'dark');
  const social = renderBanner(m, 'light', true);
  const fontFiles = ['InstrumentSans.ttf', 'IBMPlexMono-Regular.ttf', 'SourceHanSansSC-Regular.otf'];
  const fingerprints = {};
  for (const file of fontFiles) fingerprints[file] = createHash('sha256').update(await fs.readFile(path.join(root, 'assets/fonts', file))).digest('hex');
  const licenses = await Promise.all(['InstrumentSans-OFL.txt', 'IBMPlexMono-OFL.txt', 'SourceHanSans-LICENSE.txt'].map(f => fs.readFile(path.join(root, 'assets/fonts', f), 'utf8').then(text => f + '\n\n' + text)));
  const files = new Map([
    ['hero-light.svg', Buffer.from(light)], ['hero-dark.svg', Buffer.from(dark)],
    ['social-preview.svg', Buffer.from(social)], ['social-preview.png', png(social)],
    ['FONT-LICENSES.txt', Buffer.from('Brand lettering is outlined from the following fonts. Their licenses are preserved here.\n\n' + licenses.join('\n\n'))],
    ['build.json', Buffer.from(JSON.stringify({ toolkit: 'JackMeds/github-brand', version, manifestSha256: createHash('sha256').update(JSON.stringify(m)).digest('hex'), fonts: fingerprints }, null, 2) + '\n')]
  ]);
  if (m.kind === 'profile') {
    files.set('avatar.svg', Buffer.from(renderAvatar()));
    files.set('avatar.png', png(renderAvatar()));
  }
  if (files.get('social-preview.png').length >= 1_000_000) throw new Error('Social preview must be below 1 MB');
  return files;
}

async function assertNoSymlink(rootPath, relative) {
  let current = rootPath;
  for (const part of relative.split('/')) {
    current = path.join(current, part);
    try { if ((await fs.lstat(current)).isSymbolicLink()) throw new Error('Refusing symlink path: ' + relative); }
    catch (e) { if (e.code !== 'ENOENT') throw e; }
  }
}
async function writeChanged(file, bytes) {
  const next = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  try { if ((await fs.readFile(file)).equals(next)) return; } catch (e) { if (e.code !== 'ENOENT') throw e; }
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, next);
}
// Ignore fenced examples when checking links or collecting heading anchors.
function withoutCodeBlocks(body) {
  let fence;
  return body.replace(/<!--[\s\S]*?-->/g, '').split(/\r?\n/).map(line => {
    if (fence) {
      if (new RegExp('^ {0,3}' + fence[0] + '{' + fence.length + ',}[ \\t]*$').test(line)) fence = undefined;
      return '';
    }
    const opening = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (opening) { fence = opening[1]; return ''; }
    return line;
  }).join('\n');
}

function markdownTargets(body) {
  const definitions = new Map(), targets = [];
  const normalize = label => label.trim().replace(/\s+/g, ' ').toLowerCase();
  const source = withoutCodeBlocks(body)
    .replace(/^ {0,3}\[([^\]\n]+)\]:[ \t]*(?:\n[ \t]*)?(<[^>\n]+>|\S+)[^\n]*$/gm, (_, label, target) => {
      if (!definitions.has(normalize(label))) definitions.set(normalize(label), target);
      return '';
    })
    .replace(/(`+)[\s\S]*?\1(?!`)/g, '');
  for (const match of source.matchAll(/!?\[[^\]\n]*\]\(\s*(<[^>\n]+>|[^)\s]+)(?:\s+["'][^)]*)?\s*\)/g)) targets.push(match[1]);
  for (const match of source.matchAll(/!?\[([^\]\n]+)\](?:\[([^\]\n]*)\])?/g)) {
    if (source[match.index + match[0].length] === '(') continue;
    const target = definitions.get(normalize(match[2] || match[1]));
    if (target) targets.push(target);
  }
  for (const match of source.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)) targets.push(match[1]);
  for (const match of source.matchAll(/\bsrcset=["']([^"']+)["']/g)) {
    if (/^data:/i.test(match[1])) continue;
    targets.push(...match[1].split(',').map(entry => entry.trim().split(/\s+/)[0]));
  }
  return targets;
}

function markdownAnchors(body) {
  const source = withoutCodeBlocks(body), anchors = new Set(), used = new Set();
  const addHeading = heading => {
    const text = heading.trim().replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\[([^\]]+)\]\[[^\]]*\]/g, '$1').replace(/(\*{1,3}|_{1,3})(.*?)\1/g, '$2')
      .replace(/<[^>]*>/g, '').replace(/&(?:amp|lt|gt|quot|apos|nbsp);/g, entity => ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'", '&nbsp;': ' ' }[entity]));
    const base = text.toLowerCase().replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, '').replace(/\s/g, '-');
    let slug = base, suffix = 0;
    while (used.has(slug)) slug = base + '-' + ++suffix;
    used.add(slug); anchors.add(slug);
  };
  for (const match of source.matchAll(/\b(?:id|name)=["']([^"']+)["']/g)) anchors.add(match[1]);
  const lines = source.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const atx = lines[i].match(/^ {0,3}#{1,6}[ \t]+(.*?)(?:[ \t]+#+[ \t]*)?$/);
    if (atx) addHeading(atx[1]);
    else if (i + 1 < lines.length && lines[i].trim() && /^ {0,3}(?:=+|-+)[ \t]*$/.test(lines[i + 1])) {
      addHeading(lines[i].trim()); i++;
    }
  }
  return anchors;
}

async function containedPath(repo, relative) {
  const resolved = path.resolve(repo, relative), rel = path.relative(repo, resolved);
  if (rel === '..' || rel.startsWith('..' + path.sep) || path.isAbsolute(rel)) throw new Error('link leaves repository: ' + relative);
  await assertNoSymlink(repo, rel.split(path.sep).join('/'));
  await fs.access(resolved);
  return resolved;
}

export async function checkLinks(repoPath, readmes) {
  const repo = await fs.realpath(repoPath), errors = [], queue = [...readmes], seen = new Set(), documents = new Map();
  const load = async resolved => {
    if (!documents.has(resolved)) {
      const body = await fs.readFile(resolved, 'utf8');
      documents.set(resolved, { targets: markdownTargets(body), anchors: markdownAnchors(body) });
    }
    return documents.get(resolved);
  };
  while (queue.length) {
    const rel = queue.shift();
    if (seen.has(rel)) continue;
    seen.add(rel);
    let document;
    try { document = await load(await containedPath(repo, rel)); }
    catch (e) { errors.push(rel + ': ' + e.message); continue; }
    for (let target of document.targets) {
      target = target.replace(/^<|>$/g, '');
      if (/^(?:https?:|mailto:|data:|chrome:|edge:|\/\/)/i.test(target)) continue;
      let clean, fragment;
      try {
        clean = decodeURIComponent(target.split(/[?#]/)[0]);
        fragment = target.includes('#') ? decodeURIComponent(target.slice(target.indexOf('#') + 1)) : '';
      } catch { errors.push(rel + ': malformed link ' + target); continue; }
      let resolved;
      try { resolved = await containedPath(repo, clean ? path.resolve(repo, path.dirname(rel), clean) : rel); }
      catch (e) { errors.push(rel + ': ' + (e.code === 'ENOENT' ? 'missing ' + target : e.message)); continue; }
      if (/\.(md|markdown)$/i.test(resolved)) {
        queue.push(path.relative(repo, resolved));
        if (fragment && !/^L\d+(?:-L\d+)?$/.test(fragment)) {
          const { anchors } = await load(resolved);
          if (!anchors.has(fragment) && !anchors.has(fragment.replace(/^user-content-/, ''))) errors.push(rel + ': missing anchor ' + target);
        }
      }
    }
  }
  return errors;
}

export async function run(mode, repoPath) {
  if (!['generate', 'check'].includes(mode)) throw new Error('Use generate or check');
  const repo = await fs.realpath(repoPath);
  const m = validateManifest(JSON.parse(await fs.readFile(path.join(repo, 'project-brand.json'), 'utf8')));
  const assets = await expectedAssets(m), errors = [];
  // Validate every target and marker before any generation writes.
  const readmes = [];
  for (const file of m.readmes) {
    await assertNoSymlink(repo, file);
    const body = await fs.readFile(path.join(repo, file), 'utf8');
    readmes.push([file, body, replaceHeader(body, header(m, file))]);
  }
  await assertNoSymlink(repo, 'assets/brand');
  for (const [file] of assets) await assertNoSymlink(repo, 'assets/brand/' + file);
  for (const [file, bytes] of assets) {
    const destination = path.join(repo, 'assets/brand', file);
    if (mode === 'generate') await writeChanged(destination, bytes);
    else {
      try { if (!(await fs.readFile(destination)).equals(bytes)) errors.push('Generated asset drift: ' + file); }
      catch { errors.push('Missing generated asset: ' + file); }
    }
  }
  for (const [file, old, next] of readmes) {
    if (mode === 'generate') await writeChanged(path.join(repo, file), next);
    else if (old !== next) errors.push('Generated header drift: ' + file);
  }
  if (mode === 'check') {
    if (m.proof) {
      try {
        await assertNoSymlink(repo, m.proof);
        const proof = await fs.readFile(path.join(repo, m.proof));
        if (!proof.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) errors.push('Proof must be a real PNG: ' + m.proof);
      } catch (e) { errors.push(e.code === 'ENOENT' ? 'Missing product proof: ' + m.proof : 'Invalid product proof: ' + e.message); }
    }
    errors.push(...await checkLinks(repo, m.readmes));
  }
  if (errors.length) throw new Error(errors.join('\n'));
  return { repo: m.repo, mode, generated: assets.size, readmes: m.readmes.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const idx = process.argv.indexOf('--repo');
  if (idx < 0 || !process.argv[idx + 1]) {
    console.error('Usage: node scripts/brand.mjs <generate|check> --repo /path/to/repo');
    process.exitCode = 2;
  } else {
    try { console.log(JSON.stringify(await run(process.argv[2], process.argv[idx + 1]), null, 2)); }
    catch (e) { console.error(e.message); process.exitCode = 1; }
  }
}
