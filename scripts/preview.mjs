import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { esc } from './render.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const workspace=path.resolve(root,'../github-brand-workspace');
const out=path.join(root,'dist/preview');
await fs.mkdir(out,{recursive:true});
const names=(await fs.readdir(path.join(root,'projects'))).filter(f=>f.endsWith('.json'));
const projects=await Promise.all(names.map(async file=>({dir:file.slice(0,-5),...JSON.parse(await fs.readFile(path.join(root,'projects',file),'utf8'))})));
const deliveries=JSON.parse(await fs.readFile(path.join(root,'release/prs.json'),'utf8')).entries;
const order=deliveries.filter(entry=>!['toolkit','cutover'].includes(entry.unit)).map(entry=>entry.repo);
projects.sort((a,b)=>order.indexOf(a.repo)-order.indexOf(b.repo));
let sections='';
for(const m of projects){
  const destination=path.join(out,m.dir);
  const delivery=deliveries.find(entry=>entry.repo===m.repo && entry.unit!=='cutover');
  const reviewUrl=delivery?.pr || 'https://github.com/'+m.repo;
  await fs.mkdir(destination,{recursive:true});
  await fs.cp(path.join(workspace,m.dir,'assets/brand'),destination,{recursive:true});
  const proof=m.proof?'<details><summary>真实产品证据 / Product proof</summary><a href="'+m.dir+'/product-proof.png"><img class="proof" src="'+m.dir+'/product-proof.png" alt="'+esc(m.displayName)+' product proof"></a><p>示例数据；来源和步骤见各仓库 docs/brand-proof.md。</p></details>':'';
  sections+='<section id="p'+m.dir+'"><div class="section-head"><h2>'+esc(m.displayName)+'</h2><a href="'+esc(reviewUrl)+'" target="_blank" rel="noreferrer">'+(delivery?'查看草稿 PR':'Repository')+' ↗</a></div><img class="hero" src="'+m.dir+'/hero-light.svg" data-light="'+m.dir+'/hero-light.svg" data-dark="'+m.dir+'/hero-dark.svg" alt="'+esc(m.displayName+' — '+m.tagline.en)+'"><div class="caption"><p>'+esc(m.tagline.zh||m.tagline.en)+'</p><a href="'+m.dir+'/social-preview.png">Social preview · 1280×640 ↗</a></div>'+proof+'</section>';
}
const html='<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>JackMeds · Brand review</title><style>'
  + ':root{--bg:#f6f7f2;--ink:#171a1f;--muted:#59616b;--rule:#cdd1ca;--accent:#2e5bff;color-scheme:light}html[data-theme=dark]{--bg:#0f1217;--ink:#edf0f5;--muted:#a6afbd;--rule:#363d46;--accent:#91acff;color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.7 -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif}a{color:var(--accent);text-underline-offset:4px}main{max-width:1280px;margin:auto;padding:36px 48px}.mast{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--rule);padding-bottom:22px;font:12px/1.5 monospace;letter-spacing:1.5px}.tools{display:flex;gap:8px}button{background:transparent;color:var(--ink);border:1px solid var(--rule);padding:9px 15px;cursor:pointer}button[aria-pressed=true]{background:var(--ink);color:var(--bg)}h1{font-size:clamp(36px,5vw,68px);line-height:1.18;letter-spacing:-2px;font-weight:500;margin:50px 0 25px}.intro{max-width:850px;color:var(--muted);margin-bottom:30px}.jump{display:flex;gap:18px;flex-wrap:wrap;border-bottom:1px solid var(--rule);padding-bottom:34px;font-size:14px}section{margin:44px 0 64px}.section-head{display:flex;justify-content:space-between;gap:20px;align-items:baseline;margin-bottom:18px}h2{font-size:23px;font-weight:500;margin:0}h2 span{font:14px monospace;color:var(--muted);margin-right:12px}.section-head a{font-size:13px}.hero{width:100%;height:auto;display:block;border:1px solid var(--rule)}.caption{display:flex;align-items:baseline;justify-content:space-between;gap:20px;color:var(--muted);font-size:14px}.caption a{white-space:nowrap}details{border-top:1px solid var(--rule);margin-top:12px;padding-top:15px}summary{cursor:pointer;font-size:14px}.proof{display:block;width:100%;height:auto;max-height:740px;object-fit:contain;margin-top:18px}details p{font-size:13px;color:var(--muted)}footer{padding:20px 0 40px;border-top:1px solid var(--rule);color:var(--muted);font-size:13px}@media(max-width:600px){main{padding:20px 16px}.mast{gap:12px;letter-spacing:0}.section-head,.caption{display:block}.section-head a{display:inline-block;margin-top:5px}.caption a{white-space:normal}h1{margin-top:32px}section{margin:32px 0 44px}}'
  + '</style></head><body><main><header class="mast"><span>JM / FUNCTIONAL SPECIMEN / REVIEW EDITION</span><div class="tools"><button id="light" aria-pressed="true">浅色</button><button id="dark" aria-pressed="false">深色</button></div></header><h1>不寻常的想法。<br>看得见的作品。</h1><p class="intro">JackMeds GitHub 品牌改造预览。12 个仓库共用一套排版和作者标记，四个试点以真实功能形成不同图形。所有变更通过独立 PR 审阅，头像、Pins 和命序地址切换在审核后发布。</p><nav class="jump">'+projects.map(m=>'<a href="#p'+m.dir+'">'+esc(m.wordmark)+'</a>').join('')+'</nav>'+sections+'<footer>原创 JM 标记 · Instrument Sans / 思源黑体 / IBM Plex Mono · SVG 字体已转轮廓 · 原有许可证和作者署名保留</footer></main><script>function theme(t){document.documentElement.dataset.theme=t;document.querySelectorAll(".hero").forEach(img=>img.src=img.dataset[t]);["light","dark"].forEach(k=>document.getElementById(k).setAttribute("aria-pressed",String(k===t)))}document.getElementById("light").onclick=()=>theme("light");document.getElementById("dark").onclick=()=>theme("dark");</script></body></html>';
await fs.writeFile(path.join(out,'index.html'),html);
await fs.mkdir(path.join(root,'assets/examples'),{recursive:true});
for(const name of ['JackMeds','flowloud']) await fs.copyFile(path.join(out,name,'social-preview.png'),path.join(root,'assets/examples',name+'.png'));
console.log('Preview: '+path.join(out,'index.html'));
if(process.argv.includes('--serve')){
  const server=http.createServer(async(req,res)=>{
    try{
      const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
      const file=path.resolve(out,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
      if(!file.startsWith(out+path.sep)){res.writeHead(403).end();return;}
      const bytes=await fs.readFile(file);
      const mime={'.html':'text/html; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.json':'application/json'}[path.extname(file)]||'application/octet-stream';
      res.writeHead(200,{'content-type':mime,'cache-control':'no-store'});res.end(bytes);
    }catch{res.writeHead(404).end('Not found');}
  });
  server.listen(0,'127.0.0.1',()=>console.log('Preview URL: http://127.0.0.1:'+server.address().port+'/'));
}
