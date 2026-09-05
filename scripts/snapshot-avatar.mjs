import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root = fileURLToPath(new URL('../',import.meta.url));
const meta = JSON.parse(await fs.readFile(path.join(root,'baselines/2026-09-refresh/metadata.json'),'utf8'));
const file = path.join(root,'backups/original-avatar.bin');
try { await fs.access(file); throw new Error('Original avatar backup already exists; refusing to overwrite it.'); }
catch(e){if(e.code!=='ENOENT')throw e;}
const response = await fetch(meta.profile.avatar_url);
if(!response.ok || !response.headers.get('content-type')?.startsWith('image/'))throw new Error('Could not retrieve the original avatar image');
const bytes = Buffer.from(await response.arrayBuffer());
await fs.mkdir(path.dirname(file),{recursive:true});
await fs.writeFile(file,bytes,{flag:'wx'});
const record={url:meta.profile.avatar_url,mimeType:response.headers.get('content-type'),bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),capturedAt:new Date().toISOString()};
await fs.writeFile(path.join(root,'backups/original-avatar.json'),JSON.stringify(record,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(record,null,2));
