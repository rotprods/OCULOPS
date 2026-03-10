/**
 * OCULOPS OS — API Mega Harvester
 * Target: 10,000 APIs from free, no-auth sources
 *
 * Sources:
 * 1. APIs.guru       (~2,500 OpenAPI specs, REST API, no auth)
 * 2. public-apis     (~1,426, GitHub raw markdown, no auth)
 * 3. APIList.fun     (~500, JSON endpoint, no auth)
 * 4. GitHub search   (openapi/swagger files, no auth, rate limited)
 *
 * Output: src/data/api-mega-catalog.json
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../src/data/api-mega-catalog.json');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Get GitHub token from gh CLI
let GH_TOKEN = '';
try {
  GH_TOKEN = execSync('gh auth token', { encoding: 'utf8' }).trim();
  console.log(`  GitHub token: ✓ (5000 req/hour)`);
} catch {
  console.log(`  GitHub token: ✗ (10 req/min, slow mode)`);
}

// ─── helpers ────────────────────────────────────────────────────────────────

function ghHeaders() {
  const h = { 'User-Agent': 'oculops-os-harvester/1.0' };
  if (GH_TOKEN) h['Authorization'] = `Bearer ${GH_TOKEN}`;
  return h;
}

async function fetchJSON(url, label, useGhAuth = false) {
  try {
    const res = await fetch(url, {
      headers: useGhAuth ? ghHeaders() : { 'User-Agent': 'oculops-os-harvester/1.0' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn(`  [WARN] ${label}: ${e.message}`);
    return null;
  }
}

async function fetchText(url, label) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'oculops-os-harvester/1.0' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (e) {
    console.warn(`  [WARN] ${label}: ${e.message}`);
    return null;
  }
}

// Deduplicate by URL
function dedup(apis) {
  const seen = new Set();
  return apis.filter((a) => {
    const key = (a.url || '').toLowerCase().replace(/\/$/, '');
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Source 1: APIs.guru ─────────────────────────────────────────────────────

async function fetchApisGuru() {
  console.log('\n[1/4] APIs.guru — fetching list...');
  const list = await fetchJSON('https://api.apis.guru/v2/list.json', 'apis.guru/list');
  if (!list) return [];

  const providers = Object.keys(list);
  console.log(`      ${providers.length} providers found`);

  const results = [];

  for (const provider of providers) {
    const entry = list[provider];
    const versions = entry.versions || {};
    const latestKey = entry.preferred || Object.keys(versions)[0];
    const latest = versions[latestKey];
    if (!latest) continue;

    const info = latest.info || {};
    results.push({
      name: info.title || provider,
      url: info['x-origin']?.[0]?.url || latest.swaggerUrl || info.contact?.url || '',
      docs: latest.swaggerUrl || '',
      description: info.description?.slice(0, 200) || '',
      category: latest.categories?.[0] || 'General',
      auth: latest.security?.length ? 'api_key' : 'none',
      openapi_version: latest.openapi || latest.swagger || '',
      provider,
      source: 'apis.guru',
    });

    await sleep(10); // tiny delay, they host thousands
  }

  console.log(`      ✓ ${results.length} APIs extracted`);
  return results;
}

// ─── Source 2: public-apis (raw markdown) ────────────────────────────────────

function parsePublicApisMarkdown(md) {
  const results = [];
  let currentCategory = 'Misc';

  const lines = md.split('\n');
  for (const line of lines) {
    // Category header: ## Animals
    if (line.startsWith('## ')) {
      currentCategory = line.replace('## ', '').trim();
      continue;
    }

    // Table row: | Name | [Docs](url) | Description | Auth | HTTPS | Cors |
    if (!line.startsWith('|') || line.startsWith('| ---') || line.startsWith('| API')) continue;

    const cols = line.split('|').map((c) => c.trim()).filter(Boolean);
    if (cols.length < 4) continue;

    const name = cols[0];
    const linkMatch = cols[1]?.match(/\[.*?\]\((.*?)\)/);
    const url = linkMatch?.[1] || '';
    const description = cols[2] || '';
    const auth = (cols[3] || 'unknown').toLowerCase();

    if (!name || name === 'API') continue;

    results.push({
      name,
      url,
      docs: url,
      description: description.slice(0, 200),
      category: currentCategory,
      auth,
      source: 'public-apis',
    });
  }

  return results;
}

async function fetchPublicApis() {
  console.log('\n[2/4] public-apis (GitHub) — fetching markdown...');
  const md = await fetchText(
    'https://raw.githubusercontent.com/public-apis/public-apis/master/README.md',
    'public-apis README'
  );
  if (!md) return [];

  const results = parsePublicApisMarkdown(md);
  console.log(`      ✓ ${results.length} APIs extracted`);
  return results;
}

// ─── Source 3: Multiple JSON endpoints ───────────────────────────────────────

async function fetchJsonSources() {
  console.log('\n[3/4] JSON endpoints — fetching...');
  const results = [];

  // publicapis.org — alternative JSON endpoint for public-apis
  const pa = await fetchJSON('https://api.publicapis.org/entries', 'publicapis.org');
  if (pa?.entries) {
    for (const e of pa.entries) {
      results.push({
        name: e.API || '',
        url: e.Link || '',
        docs: e.Link || '',
        description: (e.Description || '').slice(0, 200),
        category: e.Category || 'General',
        auth: (e.Auth || 'none').toLowerCase(),
        cors: e.Cors,
        https: e.HTTPS,
        source: 'publicapis.org',
      });
    }
    console.log(`      + ${pa.entries.length} from publicapis.org`);
  }

  // APIList.fun — try several possible endpoints
  const funEndpoints = [
    'https://apilist.fun/api/apis',
    'https://apilist.fun/api/list',
    'https://raw.githubusercontent.com/public-apis/public-apis/master/apis.json',
  ];
  for (const ep of funEndpoints) {
    const data = await fetchJSON(ep, ep);
    if (!data) continue;
    const list = Array.isArray(data) ? data : data?.entries || data?.apis || [];
    if (list.length > 0) {
      for (const a of list) {
        results.push({
          name: a.name || a.API || a.title || '',
          url: a.url || a.Link || a.link || a.website || '',
          docs: a.docs || a.documentation || a.url || '',
          description: (a.description || a.Description || '').slice(0, 200),
          category: a.category || a.Category || 'General',
          auth: (a.auth || a.Auth || 'none').toLowerCase(),
          source: 'apilist.fun',
        });
      }
      console.log(`      + ${list.length} from ${ep}`);
      break;
    }
  }

  const clean = results.filter((a) => a.name && a.url);
  console.log(`      ✓ ${clean.length} APIs from JSON sources`);
  return clean;
}

// ─── Source 4: GitHub search ─────────────────────────────────────────────────
// No token: 10 req/min, returns up to 1000 results total (10 pages × 100)
// We search for repos tagged "public-api" or with openapi files

async function fetchGitHubSearch() {
  console.log('\n[4/4] GitHub search — mining openapi repos (no auth, rate limited)...');
  const results = [];

  const queries = [
    'topic:public-api',
    'topic:open-api',
    'topic:rest-api+topic:free',
    'openapi in:readme topic:api',
    'topic:api+topic:free',
    'topic:swagger+topic:api',
    'topic:public-api+stars:>10',
    'awesome-api in:name',
  ];

  for (const q of queries) {
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&per_page=100&page=1`;
    const data = await fetchJSON(url, `github: ${q}`, true);
    if (!data?.items) {
      await sleep(6000); // respect rate limit (10 req/min unauthenticated)
      continue;
    }

    for (const repo of data.items) {
      if (!repo.html_url) continue;
      results.push({
        name: repo.name,
        url: repo.homepage || repo.html_url,
        docs: repo.html_url,
        description: (repo.description || '').slice(0, 200),
        category: repo.topics?.[0] || 'GitHub',
        auth: 'unknown',
        stars: repo.stargazers_count,
        source: 'github',
      });
    }

    console.log(`      + ${data.items.length} from query: ${q}`);
    await sleep(GH_TOKEN ? 500 : 6500);
  }

  // Also search for well-known public-api list repos and parse their readme
  const listRepos = [
    'public-apis/public-apis',       // already done above, skip
    'n0shake/Public-APIs',
    'toddmotto/public-apis',          // archived but large list
    'Kikobeats/awesome-api',
    'TonnyL/Awesome_APIs',
    'APIs-guru/openapi-directory',
    'marcelscruz/public-apis',
    'farizdotid/DAFTAR-API-LOKAL-INDONESIA',
    'hkraji/awesome-services',
    'shime/creative-commons-media',
    '0xRoch/awesome-markdown',
    'jdorfman/awesome-json-datasets',
    'BruceDone/everything-curl',
    'ripienaar/free-for-dev',
    'lukasz-madon/awesome-remote-job',
    'akullpp/awesome-java',
    'vinta/awesome-python',
  ];

  for (const repo of listRepos) {
    if (repo === 'public-apis/public-apis') continue;
    const raw = `https://raw.githubusercontent.com/${repo}/master/README.md`;
    const md = await fetchText(raw, repo);
    if (!md) {
      await sleep(1000);
      continue;
    }
    const parsed = parsePublicApisMarkdown(md);
    if (parsed.length > 0) {
      for (const p of parsed) p.source = `github:${repo}`;
      results.push(...parsed);
      console.log(`      + ${parsed.length} from ${repo}`);
    }
    await sleep(500);
  }

  console.log(`      ✓ ${results.length} entries from GitHub sources`);
  return results;
}

// ─── Source 5: GitHub Code Search (actual openapi/swagger files) ─────────────
// Each result = a real company/project's API spec. 100% unique.
// Authenticated: 10 searches/min, up to 1000 results per query.

async function fetchGitHubCodeSearch() {
  console.log('\n[5/5] GitHub Code Search — real openapi/swagger specs...');
  const results = [];

  const codeQueries = [
    'filename:openapi.json openapi',
    'filename:openapi.yaml openapi',
    'filename:swagger.json swagger',
    'filename:swagger.yaml swagger',
    'filename:api.yaml paths',
    'filename:api.json paths info',
  ];

  for (const q of codeQueries) {
    // GitHub code search: max 10 pages × 100 = 1000 results per query
    // Secondary rate limit: ~10 searches/min → wait 7s between pages, 70s between queries
    for (let page = 1; page <= 10; page++) {
      const url = `https://api.github.com/search/code?q=${encodeURIComponent(q)}&per_page=100&page=${page}`;

      let data = null;
      let retries = 0;
      while (retries < 3) {
        data = await fetchJSON(url, `code: ${q} p${page}`, true);
        if (data && !data.message?.includes('rate limit')) break;
        // Rate limited: wait 70s and retry
        console.log(`\n      [rate limit] waiting 70s...`);
        await sleep(70000);
        retries++;
      }

      if (!data?.items?.length) break;

      for (const item of data.items) {
        const repo = item.repository;
        results.push({
          name: repo.full_name,
          url: repo.homepage || `https://github.com/${repo.full_name}`,
          docs: item.html_url,
          description: (repo.description || '').slice(0, 200),
          category: repo.topics?.[0] || 'API Spec',
          auth: 'unknown',
          stars: repo.stargazers_count,
          source: 'github-code-search',
        });
      }

      const total = Math.min(data.total_count || 0, 1000);
      const fetched = Math.min(page * 100, total);
      process.stdout.write(`\r      [${q}] ${fetched}/${total}    `);

      if (fetched >= total) break;
      await sleep(7000); // 7s between pages (< 10 req/min for code search)
    }
    console.log();
    await sleep(70000); // 70s between different queries (secondary rate limit reset)
  }

  console.log(`      ✓ ${results.length} real API specs found`);
  return results;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log(' OCULOPS OS — API Mega Harvester');
  console.log('═══════════════════════════════════════════');

  // Run sequentially to respect rate limits on GitHub
  const guru = await fetchApisGuru();
  const publicApis = await fetchPublicApis();
  const jsonSources = await fetchJsonSources();
  const github = await fetchGitHubSearch();
  const codeSearch = await fetchGitHubCodeSearch();

  const allApis = dedup([...guru, ...publicApis, ...jsonSources, ...github, ...codeSearch]);

  const byCategory = {};
  for (const api of allApis) {
    const cat = api.category || 'General';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(api);
  }

  const output = {
    generated_at: new Date().toISOString(),
    total: allApis.length,
    sources: {
      'apis.guru': guru.length,
      'public-apis': publicApis.length,
      'json-sources': jsonSources.length,
      'github': github.length,
      'github-code-search': codeSearch.length,
    },
    categories: Object.fromEntries(
      Object.entries(byCategory).map(([k, v]) => [k, v.length])
    ),
    apis: allApis,
  };

  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true });
  await fs.writeFile(OUT_FILE, JSON.stringify(output, null, 2), 'utf8');

  console.log('\n═══════════════════════════════════════════');
  console.log(` DONE — ${allApis.length} unique APIs`);
  console.log(` Output: src/data/api-mega-catalog.json`);
  console.log('───────────────────────────────────────────');
  console.log(' Sources:');
  for (const [src, count] of Object.entries(output.sources)) {
    console.log(`   ${src.padEnd(15)} ${count}`);
  }
  console.log('═══════════════════════════════════════════');
}

main().catch(console.error);
