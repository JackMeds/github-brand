import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { validateManifest, replaceHeader, header, checkLinks, run, START, END } from '../scripts/brand.mjs';
import { renderBanner, png } from '../scripts/render.mjs';

const m = {
  schemaVersion: 1, repo: 'JackMeds/example', displayName: 'Example / 示例',
  wordmark: 'Example', localName: '示例', number: '09', category: 'source tool',
  kind: 'pipeline', accent: '#B83B69', accentDark: '#F199B6',
  tagline: { en: 'Turn useful ideas into working software.', zh: '把想法做成软件。' },
  tags: ['local-first', 'source'], readmes: ['README.md']
};
test('validates manifest boundaries and refuses unknown renderer or unsafe paths', () => {
  assert.equal(validateManifest(m), m);
  for (const patch of [{readmes:['../README.md']}, {readmes:['/etc/passwd']}, {readmes:['.git/config']}, {readmes:['project-brand.json']}, {readmes:['.git/notes.md']}, {readmes:['assets/brand/notes.md']}, {readmes:['README.md','readme.md']}, {readmes:['docs/./README.md']}, {kind:'unknown'}, {accent:'red" onload="bad'}, {links:{demo:'javascript:alert(1)'}}]) {
    assert.throws(() => validateManifest({...m, ...patch}));
  }
});
test('header updates are idempotent and preserve hand-written prose byte-for-byte', () => {
  const body = '# Example\n\nManual text.\n';
  const once = replaceHeader(body, header(m));
  assert.equal(replaceHeader(once, header(m)), once);
  assert.equal(once.slice(once.indexOf(END) + END.length + 2), body);
  assert.throws(() => replaceHeader(START + body, header(m)));
  assert.throws(() => replaceHeader(once + END, header(m)));
  assert.match(header({...m, displayName:'A < B & "C"'}), /A &lt; B &amp; &quot;C&quot;/);
});
test('banners are deterministic outlined SVGs with exact export dimensions', () => {
  const a = renderBanner(m);
  assert.equal(a, renderBanner(m));
  assert.match(a, /width="1200" height="360"/);
  assert.doesNotMatch(a, /<text|<script|foreignObject|font-family|https?:\/\/(?!www.w3.org)/);
  const social = png(renderBanner(m, 'light', true));
  assert.equal(social.readUInt32BE(16), 1280);
  assert.equal(social.readUInt32BE(20), 640);
  assert.ok(social.length < 1_000_000);
  assert.notEqual(renderBanner(m, 'dark'), a);
});
test('generate/check preserves prose and detects drift without writing', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'jackmeds-brand-test-'));
  try {
    await fs.writeFile(path.join(tmp, 'project-brand.json'), JSON.stringify(m));
    await fs.writeFile(path.join(tmp, 'README.md'), '# Example\n\n[Guide](docs/guide.md)\n');
    await fs.mkdir(path.join(tmp, 'docs'));
    await fs.writeFile(path.join(tmp, 'docs/guide.md'), '# Guide\n\nWorking instructions.\n');
    await run('generate', tmp);
    await run('check', tmp);
    const before = await fs.readFile(path.join(tmp, 'README.md'), 'utf8');
    await fs.appendFile(path.join(tmp, 'assets/brand/hero-light.svg'), 'drift');
    await assert.rejects(run('check', tmp), /drift/);
    assert.equal(await fs.readFile(path.join(tmp, 'README.md'), 'utf8'), before);
    assert.ok((await fs.readFile(path.join(tmp, 'assets/brand/hero-light.svg'), 'utf8')).endsWith('drift'));
  } finally { await fs.rm(tmp, {recursive:true, force:true}); }
});
test('generation refuses a symlink destination before changing README', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'jackmeds-brand-links-'));
  try {
    await fs.writeFile(path.join(tmp, 'project-brand.json'), JSON.stringify(m));
    await fs.writeFile(path.join(tmp, 'README.md'), '# Untouched\n');
    await fs.mkdir(path.join(tmp, 'assets'));
    await fs.mkdir(path.join(tmp, 'other'));
    await fs.symlink(path.join(tmp, 'other'), path.join(tmp, 'assets/brand'));
    await assert.rejects(run('generate', tmp), /symlink/);
    assert.equal(await fs.readFile(path.join(tmp, 'README.md'), 'utf8'), '# Untouched\n');
  } finally { await fs.rm(tmp, {recursive:true, force:true}); }
});

test('link checks support repository roots, reference links and Markdown fragments', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'jackmeds-brand-references-'));
  try {
    await fs.mkdir(path.join(tmp, 'docs'));
    await fs.writeFile(path.join(tmp, 'README.md'), [
      '# Home', '', '[Root](./)', '[Self](#home)', '[English][en]', '[Guide][]', '[Shortcut]',
      '[Spaces](<docs/a guide.md>)', '[Duplicate](docs/guide.md#repeat-1)',
      '[Custom](docs/guide.md#custom)', '[Setext](docs/guide.md#second)',
      '[Inline heading](docs/guide.md#quick-start)', '',
      '[EN]: docs/guide.md#%E5%BF%AB%E9%80%9F%E5%BC%80%E5%A7%8B "Guide"',
      '[Guide]: docs/guide.md', '[Shortcut]: docs/a%20guide.md', '',
      '`[Not a link](missing-inline.md)`', '```markdown', '[Not a link](missing-fenced.md)', '````',
    ].join('\n'));
    await fs.writeFile(path.join(tmp, 'docs/guide.md'), [
      '# 快速开始', '', '[Back](../README.md#home)', '[Root](../)',
      '## Repeat', '## Repeat', '## Quick `start`', '<a id="custom"></a>', '', 'Second', '------',
    ].join('\n'));
    await fs.writeFile(path.join(tmp, 'docs/a guide.md'), '# A guide\n');
    assert.deepEqual(await checkLinks(tmp, ['README.md']), []);
    await fs.appendFile(path.join(tmp, 'README.md'), '\n[Broken][missing]\n[missing]: docs/missing.md\n[Bad anchor](docs/guide.md#absent)\n');
    const errors = await checkLinks(tmp, ['README.md']);
    assert.ok(errors.some(error => error.includes('missing docs/missing.md')));
    assert.ok(errors.some(error => error.includes('missing anchor docs/guide.md#absent')));
    assert.equal(errors.length, 2);
  } finally { await fs.rm(tmp, {recursive:true, force:true}); }
});

test('recursive Markdown links reject symlink files and directories before reading them', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'jackmeds-brand-read-boundary-'));
  try {
    const repo = path.join(tmp, 'repo'), outside = path.join(tmp, 'outside');
    await fs.mkdir(repo); await fs.mkdir(outside);
    await fs.writeFile(path.join(outside, 'private.md'), '[Private](should-never-be-read.txt)\n');
    await fs.symlink(path.join(outside, 'private.md'), path.join(repo, 'file.md'));
    await fs.symlink(outside, path.join(repo, 'docs'));
    await fs.writeFile(path.join(repo, 'README.md'), '[File](file.md)\n[Directory](docs/private.md)\n[Escape](../outside/private.md)\n');
    const errors = await checkLinks(repo, ['README.md']);
    assert.equal(errors.length, 3);
    assert.equal(errors.filter(error => /symlink/.test(error)).length, 2);
    assert.ok(errors.some(error => error.includes('link leaves repository')));
    assert.ok(errors.every(error => !error.includes('should-never-be-read')));
    assert.match((await checkLinks(repo, ['file.md']))[0], /symlink/);
  } finally { await fs.rm(tmp, {recursive:true, force:true}); }
});

test('proof validation rejects symlink paths without modifying the source or target', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'jackmeds-brand-proof-boundary-'));
  try {
    const repo = path.join(tmp, 'repo'), outside = path.join(tmp, 'outside');
    await fs.mkdir(repo); await fs.mkdir(outside);
    await fs.writeFile(path.join(repo, 'project-brand.json'), JSON.stringify({...m, proof: 'proof/product.png'}));
    await fs.writeFile(path.join(repo, 'README.md'), '# Example\n');
    const bytes = Buffer.from([137,80,78,71,13,10,26,10]);
    await fs.writeFile(path.join(outside, 'product.png'), bytes);
    await fs.symlink(outside, path.join(repo, 'proof'));
    await run('generate', repo);
    const before = await fs.readFile(path.join(repo, 'README.md'));
    await assert.rejects(run('check', repo), /Invalid product proof: Refusing symlink/);
    assert.deepEqual(await fs.readFile(path.join(repo, 'README.md')), before);
    assert.deepEqual(await fs.readFile(path.join(outside, 'product.png')), bytes);
  } finally { await fs.rm(tmp, {recursive:true, force:true}); }
});
