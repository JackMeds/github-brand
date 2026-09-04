import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const repo = path.resolve(process.argv[2] || path.join(root,'../github-brand-workspace/mingxu'));
const { chromium } = createRequire(path.join(repo, 'package.json'))('playwright');
const output = path.join(repo,'assets/brand/product-proof.png');
await fs.mkdir(path.dirname(output),{recursive:true});
const browser = await chromium.launch({headless:true, channel:'chromium'});
try {
  const page = await browser.newPage({viewport:{width:1440,height:1000},locale:'en-US',colorScheme:'light',reducedMotion:'reduce'});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('https://astrocopy.jackmeds.top/',{waitUntil:'networkidle'});
  await page.getByRole('button',{name:'Prefer not to enter data yet? Try the full flow with a fictional example'}).click();
  await page.getByRole('heading',{name:'Fictional example',exact:true}).waitFor({state:'visible'});
  await page.locator('#birth').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));
  await page.screenshot({path:output,animations:'disabled'});
  const record={url:page.url(),title:await page.title(),capturedAt:new Date().toISOString(),baseline:execFileSync('git',['rev-parse','origin/HEAD'],{cwd:repo,encoding:'utf8'}).trim(),fixture:'Site built-in Fictional example (1996-06-18 10:30, female, Asia/Shanghai)',pageErrors:errors,viewport:{width:1440,height:1000}};
  await fs.mkdir(path.join(root,'output/playwright/mingxu-proof'),{recursive:true});
  await fs.writeFile(path.join(root,'output/playwright/mingxu-proof/capture.json'),JSON.stringify(record,null,2)+'\n');
  console.log(JSON.stringify(record,null,2));
  if(errors.length)throw new Error(errors.join('\n'));
}finally{await browser.close();}
