import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const workspace = path.resolve(root, '../github-brand-workspace');
const api = (args) => JSON.parse(execFileSync('gh', ['api', ...args], {encoding:'utf8', maxBuffer:8_000_000}));
const user = api(['users/JackMeds']);
const repos = api(['users/JackMeds/repos?per_page=100']).filter(r => !r.private && r.name !== 'github-brand');
const pins = api(['graphql', '-f', 'query={user(login:"JackMeds"){pinnedItems(first:6,types:REPOSITORY){nodes{... on Repository{nameWithOwner url}}}}}']);
const out = path.join(root, 'baselines/2026-09-refresh');
try {
  await fs.access(path.join(out, 'metadata.json'));
  throw new Error('Rollback baseline already exists. Preserve it; capture a new dated baseline for a later refresh.');
} catch (error) { if (error.code !== 'ENOENT') throw error; }
await fs.mkdir(path.join(out, 'readmes'), {recursive:true});
const result = {
  capturedAt: new Date().toISOString(),
  profile: {name:user.name,bio:user.bio,avatar_url:user.avatar_url,blog:user.blog,company:user.company,location:user.location},
  pins: pins.data.user.pinnedItems.nodes,
  repositories: []
};
for (const repo of repos) {
  const entry = Object.fromEntries(['name','full_name','description','homepage','topics','fork','archived','default_branch','html_url'].map(key => [key,repo[key]]));
  entry.license = repo.license?.spdx_id ?? null;
  const dir = path.join(workspace, repo.name === 'sizhu-astro-ai' ? 'mingxu' : repo.name);
  try {
    const ref = execFileSync('git', ['symbolic-ref','refs/remotes/origin/HEAD'],{cwd:dir,encoding:'utf8'}).trim();
    entry.baselineCommit = execFileSync('git',['rev-parse',ref],{cwd:dir,encoding:'utf8'}).trim();
    const readme = execFileSync('git',['show',ref + ':README.md'],{cwd:dir,encoding:'utf8'});
    await fs.writeFile(path.join(out, 'readmes', repo.name + '.md'), readme);
  } catch { entry.readmeSnapshot = 'not available locally; fork/archived repositories are read-only'; }
  result.repositories.push(entry);
}
await fs.writeFile(path.join(out,'metadata.json'),JSON.stringify(result,null,2)+'\n');
console.log('Public rollback baseline captured for '+repos.length+' repositories at '+out);
