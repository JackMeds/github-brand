import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {esc, label, palettes} from './render.mjs';

export const START='<!-- jackmeds-live:start -->', END='<!-- jackmeds-live:end -->';
const slug=/^JackMeds\/[A-Za-z0-9._-]+$/;
const date=value=>typeof value==='string' && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value));
export function validateConfig(c) {
  if(c?.schemaVersion!==1 || !Array.isArray(c.projects) || c.projects.length!==4) throw new Error('Configure exactly four featured projects');
  const seen=new Set();
  for(const p of c.projects){
    if(!slug.test(p.repo) || !/^[a-z0-9-]+$/.test(p.id) || seen.has(p.id) || !p.name || typeof p.name!=='string') throw new Error('Invalid project identity');
    if(!/^#[0-9a-f]{6}$/i.test(p.accent) || !/^#[0-9a-f]{6}$/i.test(p.accentDark)) throw new Error('Invalid project color');
    seen.add(p.id);
  }
  if(new Set(c.projects.map(p=>p.repo.toLowerCase())).size!==4) throw new Error('Duplicate repository');
  return c;
}
export function normalizeRepository(p, repo, release) {
  if(repo?.private!==false || repo.full_name?.toLowerCase()!==p.repo.toLowerCase()) throw new Error('Expected the configured public repository');
  for(const key of ['stargazers_count','forks_count']) if(!Number.isSafeInteger(repo[key]) || repo[key]<0) throw new Error('Invalid API count');
  if(repo.pushed_at!==null && !date(repo.pushed_at)) throw new Error('Invalid push date');
  if(repo.language!==null && typeof repo.language!=='string') throw new Error('Invalid language');
  if(release!==null && (release.draft!==false || release.prerelease!==false || !date(release.published_at))) throw new Error('Expected a published stable release');
  return {repo:p.repo,stars:repo.stargazers_count,forks:repo.forks_count,language:repo.language,pushedAt:repo.pushed_at,releaseAt:release?.published_at??null};
}
export async function collect(config, request, now=new Date()) {
  validateConfig(config);
  const projects=await Promise.all(config.projects.map(async p=>{
    const repo=await request(`/repos/${p.repo}`);
    // Verify visibility before treating a release 404 as "no stable release".
    if(repo.private!==false) throw new Error('Private repositories are excluded');
    const release=await request(`/repos/${p.repo}/releases/latest`, true);
    return normalizeRepository(p,repo,release);
  }));
  return {schemaVersion:1,fetchedAt:now.toISOString(),projects};
}
export function validateSnapshot(config, snapshot) {
  if(snapshot?.schemaVersion!==1 || !date(snapshot.fetchedAt) || snapshot.projects?.length!==config.projects.length) throw new Error('Invalid snapshot');
  snapshot.projects.forEach((s,i)=>{
    if(s.repo!==config.projects[i].repo) throw new Error('Snapshot order/config mismatch');
    normalizeRepository(config.projects[i],{full_name:s.repo,private:false,stargazers_count:s.stars,forks_count:s.forks,language:s.language,pushed_at:s.pushedAt},s.releaseAt===null?null:{draft:false,prerelease:false,published_at:s.releaseAt});
  });
  return snapshot;
}
export function renderCard(p,s,fetchedAt,theme='light') {
  const c=palettes[theme], accent=theme==='dark'?p.accentDark:p.accent;
  const language=s.language && /^[\x20-\x7e]{1,30}$/.test(s.language)?s.language:'Not specified';
  const day=value=>value?value.slice(0,10):'None yet';
  const description=`${p.name}: ${s.stars} stars, ${s.forks} forks; ${language}. Last push ${day(s.pushedAt)}. Latest stable release ${day(s.releaseAt)}. Fetched ${fetchedAt}.`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="250" viewBox="0 0 520 250" role="img" aria-labelledby="title desc"><title id="title">${esc(p.name)}</title><desc id="desc">${esc(description)}</desc><rect x=".5" y=".5" width="519" height="249" rx="3" fill="${c.paper}" stroke="${c.rule}"/><path d="M1 1H519" stroke="${accent}" stroke-width="5"/>`
    +label(p.name,24,50,32,c.ink,'zh',472)
    +label(`${s.stars} stars  /  ${s.forks} forks`,24,94,23,accent,'mono',472)
    +label(language,24,130,23,c.ink,'mono',472)
    +label(`Last push       ${day(s.pushedAt)}`,24,168,19,c.muted,'mono',472)
    +label(`Stable release  ${day(s.releaseAt)}`,24,197,19,c.muted,'mono',472)
    +label(`API snapshot / ${fetchedAt.slice(0,16).replace('T',' ')} UTC`,24,230,13,c.muted,'mono',472)+'</svg>\n';
}
export function section(config,snapshot) {
  const cards=config.projects.map((p,i)=>{
    const s=snapshot.projects[i];
    const alt=`${p.name}: ${s.stars} stars, ${s.forks} forks; ${s.language||'language unspecified'}; last push ${s.pushedAt?.slice(0,10)||'none'}; stable release ${s.releaseAt?.slice(0,10)||'none'}`;
    return `<a href="https://github.com/${p.repo}"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/live/${p.id}-dark.svg"><img src="assets/live/${p.id}-light.svg" alt="${esc(alt)}" width="400"></picture></a>`;
  });
  return [START,'<p>',...cards,'</p>','',`数据采集 / Fetched: ${snapshot.fetchedAt.replace('T',' ').replace('.000Z',' UTC')}`,
    '','合并后每 6 小时尝试刷新；这不是即时数据，GitHub 调度与图片缓存可能延迟。API 失败时保留上次成功结果。',
    '','<details><summary>文字版数据 / Text version</summary>','',
    ...config.projects.map((p,i)=>{const s=snapshot.projects[i];return `- **${p.name}** — ${s.stars} stars · ${s.forks} forks · ${s.language||'未标注语言'} · 最近推送 ${s.pushedAt?.slice(0,10)||'无'} · 最新稳定版 ${s.releaseAt?.slice(0,10)||'暂无'}`;}),
    '','</details>',END].join('\n');
}
export function replaceSection(body,next) {
  if(body.split(START).length!==2 || body.split(END).length!==2 || body.indexOf(START)>body.indexOf(END)) throw new Error('Expected one live section marker pair');
  return body.slice(0,body.indexOf(START))+next+body.slice(body.indexOf(END)+END.length);
}
async function request(endpoint,allow404=false) {
  const headers={Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
  if(process.env.GH_TOKEN) headers.Authorization=`Bearer ${process.env.GH_TOKEN}`;
  const response=await fetch('https://api.github.com'+endpoint,{headers,redirect:'error',signal:AbortSignal.timeout(20000)});
  if(allow404 && response.status===404)return null;
  if(!response.ok)throw new Error(`GitHub API ${response.status} at ${endpoint}; keeping previous snapshot`);
  return response.json();
}
async function noSymlink(root,relative) {
  let current=root;
  for(const part of relative.split('/')){
    current=path.join(current,part);
    try{if((await fs.lstat(current)).isSymbolicLink())throw new Error('Refusing symlink: '+relative);}
    catch(e){if(e.code!=='ENOENT')throw e;}
  }
}
export async function run(mode,repoPath,api=request) {
  if(!['refresh','check'].includes(mode))throw new Error('Use refresh or check');
  const root=await fs.realpath(repoPath);
  for(const p of ['profile-widgets.json','README.md','assets/live/snapshot.json'])await noSymlink(root,p);
  const config=validateConfig(JSON.parse(await fs.readFile(path.join(root,'profile-widgets.json'),'utf8')));
  const body=await fs.readFile(path.join(root,'README.md'),'utf8');
  replaceSection(body,START+'\n'+END); // Validate before any API request or write.
  const snapshot=validateSnapshot(config,mode==='refresh'?await collect(config,api):JSON.parse(await fs.readFile(path.join(root,'assets/live/snapshot.json'),'utf8')));
  const files=new Map([['assets/live/snapshot.json',JSON.stringify(snapshot,null,2)+'\n'],['README.md',replaceSection(body,section(config,snapshot))]]);
  for(const [i,p] of config.projects.entries())for(const theme of ['light','dark'])files.set(`assets/live/${p.id}-${theme}.svg`,renderCard(p,snapshot.projects[i],snapshot.fetchedAt,theme));
  for(const file of files.keys())await noSymlink(root,file);
  // Fetch, validate and render every card before touching the last good result.
  for(const [file,content] of files){
    const target=path.join(root,file);
    if(mode==='check'){if(await fs.readFile(target,'utf8')!==content)throw new Error('Live widget drift: '+file);}
    else{await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,content);}
  }
  return {mode,projects:config.projects.length,fetchedAt:snapshot.fetchedAt};
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{if(!process.argv[3])throw new Error('Usage: node scripts/profile.mjs <refresh|check> /path/to/profile');console.log(await run(process.argv[2],process.argv[3]));}
  catch(e){console.error(e.message);process.exitCode=1;}
}
