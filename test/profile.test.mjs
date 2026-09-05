import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {collect,normalizeRepository,validateConfig,validateSnapshot,renderCard,replaceSection,START,END,run} from '../scripts/profile.mjs';
const config={schemaVersion:1,projects:['one','two','three','four'].map(id=>({id,repo:'JackMeds/'+id,name:id,accent:'#007E87',accentDark:'#69D7DB'}))};
const repo=p=>({full_name:p.repo,private:false,stargazers_count:12,forks_count:2,language:'TypeScript',pushed_at:'2026-09-01T12:00:00Z'});
const api=async(endpoint)=>endpoint.endsWith('/latest')?null:repo(config.projects.find(p=>endpoint==='/repos/'+p.repo));
test('profile config and API boundary reject private, mismatched and malformed data',()=>{
  assert.equal(validateConfig(config),config);
  assert.throws(()=>validateConfig({...config,projects:[...config.projects.slice(1),config.projects[1]]}));
  assert.throws(()=>validateConfig({...config,projects:config.projects.map(p=>({...p,id:'../outside'}))}));
  for(const patch of [{private:true},{stargazers_count:-1},{forks_count:NaN},{full_name:'Other/one'},{pushed_at:'bad'}])assert.throws(()=>normalizeRepository(config.projects[0],{...repo(config.projects[0]),...patch},null));
  assert.throws(()=>normalizeRepository(config.projects[0],repo(config.projects[0]),{draft:true,prerelease:false,published_at:'2026-09-01T00:00:00Z'}));
});
test('collection preserves no-release status and all-or-nothing errors',async()=>{
  const s=await collect(config,api,new Date('2026-09-05T00:00:00Z'));
  assert.equal(s.projects.length,4);assert.equal(s.projects[0].releaseAt,null);
  assert.equal(validateSnapshot(config,s),s);
  assert.throws(()=>validateSnapshot(config,{...s,projects:[...s.projects].reverse()}));
  await assert.rejects(collect(config,async()=>{throw new Error('API 403');}),/API 403/);
});
test('cards are accessible, outlined and deterministic without project indexes',()=>{
  const p=config.projects[0],s=normalizeRepository(p,repo(p),null);
  const a=renderCard(p,s,'2026-09-05T00:00:00Z');
  assert.equal(a,renderCard(p,s,'2026-09-05T00:00:00Z'));
  assert.match(a,/width="520" height="250"/);assert.match(a,/<desc id="desc">one: 12 stars/);
  assert.doesNotMatch(a,/<text|<script|foreignObject|font-family/);
  assert.notEqual(a,renderCard(p,s,'2026-09-05T00:00:00Z','dark'));
});
test('live section preserves handwritten prose and rejects broken markers',()=>{
  const body='Intro\n'+START+'\nold\n'+END+'\nManual';
  const next=START+'\nnew\n'+END;
  assert.equal(replaceSection(body,next),'Intro\n'+next+'\nManual');
  assert.equal(replaceSection(replaceSection(body,next),next),replaceSection(body,next));
  assert.throws(()=>replaceSection('no markers',next));
  assert.throws(()=>replaceSection(body+END,next));
});
test('refresh/check roundtrip; API errors and drift retain the previous result',async()=>{
  const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'jm-profile-test-'));
  try{
    await fs.writeFile(path.join(tmp,'profile-widgets.json'),JSON.stringify(config));
    await fs.writeFile(path.join(tmp,'README.md'),'Intro\n'+START+'\n'+END+'\nManual');
    await run('refresh',tmp,api);await run('check',tmp);
    const before=await fs.readFile(path.join(tmp,'README.md'));
    await assert.rejects(run('refresh',tmp,async()=>{throw new Error('API 429');}),/API 429/);
    assert.deepEqual(await fs.readFile(path.join(tmp,'README.md')),before);
    await fs.appendFile(path.join(tmp,'assets/live/one-light.svg'),'drift');
    await assert.rejects(run('check',tmp),/drift/);
    assert.deepEqual(await fs.readFile(path.join(tmp,'README.md')),before);
  }finally{await fs.rm(tmp,{recursive:true,force:true});}
});
test('refresh refuses symlink outputs and does not alter the README',async()=>{
  const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'jm-profile-symlink-'));
  try{
    await fs.writeFile(path.join(tmp,'profile-widgets.json'),JSON.stringify(config));
    const body=START+'\n'+END;
    await fs.writeFile(path.join(tmp,'README.md'),body);
    await fs.mkdir(path.join(tmp,'assets'));await fs.mkdir(path.join(tmp,'outside'));
    await fs.symlink(path.join(tmp,'outside'),path.join(tmp,'assets/live'));
    await assert.rejects(run('refresh',tmp,api),/symlink/);
    assert.equal(await fs.readFile(path.join(tmp,'README.md'),'utf8'),body);
  }finally{await fs.rm(tmp,{recursive:true,force:true});}
});
