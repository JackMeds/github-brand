import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// A provenance capture for an offline README example, not a BiliDigest UI.
const workspace = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const repo = resolve(process.argv[2] || resolve(workspace, 'github-brand-workspace/BiliDigest'));
const pythonPath = resolve(process.argv[3] || resolve(workspace, 'BiliDigest/.venv/bin/python'));
const output = resolve(process.argv[4] || resolve(workspace, 'output/playwright/bilidigest-proof'));
const env = { ...process.env, PATH: `${dirname(pythonPath)}:${process.env.PATH}`, PYTHONDONTWRITEBYTECODE: '1' };
function run(command, args) {
  const result = spawnSync(command, args, { cwd: repo, env, encoding: 'utf8' });
  if (result.error || result.status !== 0) throw new Error(result.error?.message || result.stderr || `${command} exited ${result.status}`);
  return { command, args, exitCode: result.status, stdout: result.stdout, stderr: result.stderr };
}
const fixture = {
  video: { title: '示例字幕：把想法写成笔记', bvid: 'EXAMPLE_OFFLINE' },
  subtitle: { lan: 'zh-CN', lan_doc: '中文（示例字幕）' },
  body: [
    { from: 0, to: 6, content: '先记录一个值得保留的想法。' },
    { from: 12, to: 18, content: '为它补上来源，方便回到原处。' },
    { from: 28, to: 35, content: '用时间戳，把回看变成下一步。' },
  ],
};
const conversionCode = `import json\nfrom tools.bili_subtitle import body_to_markdown\nfixture = json.loads(${JSON.stringify(JSON.stringify(fixture))})\nprint(body_to_markdown(fixture["video"], fixture["subtitle"], fixture["body"]), end="")`;
const identity = run('python', ['-c', 'import sys; from tools import bili_subtitle; print(sys.executable); print(bili_subtitle.__file__); print(sys.version.split()[0])']);
const help = run('python', ['-m', 'tools.bilidigest', '--help']);
const conversion = run('python', ['-c', conversionCode]);
const commit = run('git', ['rev-parse', 'HEAD']).stdout.trim();
const [interpreter, modulePath, pythonVersion] = identity.stdout.trim().split('\n');
if (!modulePath.startsWith(`${repo}/`)) throw new Error(`Unexpected import source: ${modulePath}`);
if (!conversion.stdout.includes('[00:28]') || !conversion.stdout.includes('EXAMPLE_OFFLINE')) throw new Error('Expected fictional transcript output is missing');
mkdirSync(output, { recursive: true });
const record = { capturedAt: new Date().toISOString(), sourceRepo: repo, commit, interpreter, pythonVersion, modulePath, fixture, help, conversion };
writeFileSync(resolve(output, 'capture.json'), JSON.stringify(record, null, 2) + '\n');
writeFileSync(resolve(output, 'cli-help.txt'), help.stdout);
writeFileSync(resolve(output, 'example.md'), conversion.stdout);
writeFileSync(resolve(output, 'fixture.json'), JSON.stringify(fixture, null, 2) + '\n');
const escape = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const rows = fixture.body.map((line) => `<div class="line"><span>${String(Math.floor(line.from / 60)).padStart(2, '0')}:${String(line.from % 60).padStart(2, '0')}</span><p>${escape(line.content)}</p></div>`).join('');
const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><title>BiliDigest · Offline proof</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#F6F7F2;color:#171A1F;font-family:"PingFang SC","Noto Sans CJK SC",sans-serif}.page{width:1600px;padding:58px 64px 38px}.masthead{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px}.brand{font:700 18px ui-monospace,SFMono-Regular,monospace;letter-spacing:4px}.brand b{color:#C52E68}.badge{font:600 14px ui-monospace,SFMono-Regular,monospace;border:1px solid #C52E68;color:#A91E54;padding:10px 14px;letter-spacing:1px}h1{font-size:47px;letter-spacing:-2px;line-height:1.25;margin:0 0 13px;font-weight:650}.intro{color:#61666A;font-size:18px;margin:0 0 34px}.grid{display:grid;grid-template-columns:610px 1fr;gap:26px}.label{font:600 13px ui-monospace,SFMono-Regular,monospace;letter-spacing:1.8px;margin:0 0 14px;color:#747B80}.card{border:1px solid #D6DCD4;background:#FFF;padding:23px 25px}.terminal{border-top:3px solid #C52E68}.command{font:600 17px ui-monospace,SFMono-Regular,monospace;margin:0 0 20px;color:#9D204E}pre{font-family:ui-monospace,SFMono-Regular,"PingFang SC",monospace;white-space:pre-wrap;overflow-wrap:anywhere;font-size:16px;line-height:1.64;margin:0}.input{margin-top:22px}.input h2{font-size:18px;margin:0 0 17px}.line{display:flex;gap:18px;border-top:1px solid #EBEEE7;padding:13px 0}.line:last-child{padding-bottom:0}.line span{font:500 15px ui-monospace,SFMono-Regular,monospace;color:#B12C5E;padding-top:2px}.line p{font-size:18px;margin:0}.result{background:#171A1F;color:#EDF0F5;border:none;border-top:3px solid #C52E68;padding:24px 28px;min-height:100%}.result .command{color:#F090B3;font-size:17px;border-bottom:1px solid #3B3F45;padding-bottom:18px;margin-bottom:22px}.result pre{font-size:17px;line-height:1.85}.foot{display:flex;justify-content:space-between;gap:20px;font-size:14px;color:#6D7479;border-top:1px solid #D6DCD4;margin-top:27px;padding-top:20px}.foot strong{font-weight:500;color:#9D204E}.muted{font:12px ui-monospace,SFMono-Regular,monospace;letter-spacing:1px}
</style></head><body><main class="page">
<div class="masthead"><div class="brand"><b>03 /</b> BILIDIGEST</div><div class="badge">OFFLINE EXAMPLE · 示例字幕</div></div>
<h1>字幕，变成可回看的笔记。</h1>
<p class="intro">实际运行 CLI 帮助与字幕转换函数；下方记录来自本地源码执行。</p>
<div class="grid"><section><p class="label">01 / ACTUAL CLI STDOUT</p><div class="card terminal"><p class="command">$ python -m tools.bilidigest --help</p><pre>${escape(help.stdout)}</pre></div><div class="card input"><h2>输入：三条虚构字幕</h2>${rows}</div></section>
<section><p class="label">02 / ACTUAL MARKDOWN OUTPUT</p><div class="card result"><p class="command">body_to_markdown(video, subtitle, body)</p><pre>${escape(conversion.stdout)}</pre></div></section></div>
<footer class="foot"><span><strong>示例数据</strong> · EXAMPLE_OFFLINE 为无效占位 ID，链接未访问。</span><span>未登录 · 未请求 B站 API · 未生成 AI 摘要</span><span class="muted">SOURCE ${commit.slice(0, 8)} · PY ${pythonVersion}</span></footer>
</main></body></html>`;
writeFileSync(resolve(output, 'index.html'), html);
console.log(JSON.stringify({ output, commit, interpreter, modulePath, helpExitCode: help.exitCode, conversionExitCode: conversion.exitCode, help: help.stdout, markdown: conversion.stdout }, null, 2));
