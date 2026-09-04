// One-off helper: walk docs/design/components, extract each component's
// hand-written <Name>Props interface body (for cfg.dtsPropsFor) and locate
// its <Name>.prompt.md (for cfg.docsMap), then merge into .design-sync/config.json.
// Run once from the Wiggy repo root: node .design-sync/build-config.mjs
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const COMP_ROOT = 'docs/design/components';
const CONFIG_PATH = '.design-sync/config.json';

function walk(dir) {
  const out = [];
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function extractPropsBody(dtsText, name) {
  const marker = `export interface ${name}Props`;
  const idx = dtsText.indexOf(marker);
  if (idx < 0) return null;
  const braceStart = dtsText.indexOf('{', idx);
  if (braceStart < 0) return null;
  let depth = 0, i = braceStart;
  for (; i < dtsText.length; i++) {
    if (dtsText[i] === '{') depth++;
    else if (dtsText[i] === '}') { depth--; if (depth === 0) break; }
  }
  let body = dtsText.slice(braceStart + 1, i).replace(/^\n/, '').replace(/\s+$/, '');

  // Inline any auxiliary interfaces declared earlier in the same file
  // (dtsPropsFor has no prelude slot — the body must be self-contained).
  const auxRx = /export interface (\w+) \{([^}]*)\}/g;
  let m;
  while ((m = auxRx.exec(dtsText))) {
    const [, auxName, auxBody] = m;
    if (auxName === `${name}Props`) continue;
    const inline = `{ ${auxBody.trim().replace(/;\s*/g, '; ').replace(/;\s*$/, '')} }`;
    body = body.replace(new RegExp(`\\b${auxName}\\b`, 'g'), inline);
  }
  return body;
}

const files = walk(COMP_ROOT);
const jsxFiles = files.filter((f) => f.endsWith('.jsx'));

const dtsPropsFor = {};
const docsMap = {};
const missing = { dts: [], prompt: [] };

for (const jsx of jsxFiles) {
  const name = jsx.split('/').pop().replace(/\.jsx$/, '');
  const dtsPath = jsx.replace(/\.jsx$/, '.d.ts');
  const promptPath = jsx.replace(/\.jsx$/, '.prompt.md');

  if (existsSync(dtsPath)) {
    const body = extractPropsBody(readFileSync(dtsPath, 'utf8'), name);
    if (body) dtsPropsFor[name] = body;
    else missing.dts.push(name + ' (no matching interface found)');
  } else {
    missing.dts.push(name);
  }

  if (existsSync(promptPath)) {
    docsMap[name] = relative('.', promptPath);
  } else {
    missing.prompt.push(name);
  }
}

let cfg = {};
if (existsSync(CONFIG_PATH)) cfg = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));

cfg.dtsPropsFor = { ...(cfg.dtsPropsFor ?? {}), ...dtsPropsFor };
cfg.docsMap = { ...(cfg.docsMap ?? {}), ...docsMap };

writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2) + '\n');

console.log(`components found: ${jsxFiles.length}`);
console.log(`dtsPropsFor entries: ${Object.keys(dtsPropsFor).length}`);
console.log(`docsMap entries: ${Object.keys(docsMap).length}`);
console.log(`missing .d.ts: ${JSON.stringify(missing.dts)}`);
console.log(`missing .prompt.md: ${JSON.stringify(missing.prompt)}`);
