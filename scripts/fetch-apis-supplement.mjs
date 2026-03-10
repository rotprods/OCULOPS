/**
 * ANTIGRAVITY OS — API Supplement Harvester
 * Adds more unique APIs to the existing catalog via GitHub Code Search
 * Runs the queries that were rate-limited in the main harvester.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../src/data/api-mega-catalog.json');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let GH_TOKEN = '';
try {
  GH_TOKEN = execSync('gh auth token', { encoding: 'utf8' }).trim();
  console.log(`  GitHub token: ✓`);
} catch {
  console.log(`  GitHub token: ✗`);
}

async function fetchJSON(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'antigravity-os-harvester/1.0',
        ...(GH_TOKEN ? { Authorization: `Bearer ${GH_TOKEN}` } : {}),
      },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      if (res.status === 403 || res.status === 429) {
        return { _rateLimited: true, status: res.status, body };
      }
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch (e) {
    console.warn(`  [WARN] ${url.slice(0, 80)}: ${e.message}`);
    return null;
  }
}

function dedup(apis) {
  const seen = new Set();
  return apis.filter((a) => {
    const key = (a.url || '').toLowerCase().replace(/\/$/, '').replace(/^https?:\/\//, '');
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Code search queries not yet covered (missed due to rate limit)
const CODE_QUERIES = [
  'filename:openapi.yaml openapi',
  'filename:swagger.json swagger',
  'filename:swagger.yaml swagger',
  'filename:api.yaml paths',
  'filename:api.json paths info',
  // Additional unique angles
  'filename:openapi.json info title paths',
  'filename:swagger.yaml info title paths',
  'filename:openapi.yml openapi 3',
  'filename:swagger.yml swagger 2',
  'api-docs.json in:path openapi',
];

async function codeSearch(query, maxPages = 10) {
  const results = [];
  console.log(`\n  Query: ${query}`);

  for (let page = 1; page <= maxPages; page++) {
    const url = `https://api.github.com/search/code?q=${encodeURIComponent(query)}&per_page=100&page=${page}`;
    let data = null;
    let retries = 0;

    while (retries < 4) {
      data = await fetchJSON(url);
      if (!data) { retries++; await sleep(10000); continue; }
      if (data._rateLimited) {
        const wait = retries < 2 ? 65000 : 120000;
        console.log(`\n    [rate limit ${data.status}] waiting ${wait / 1000}s...`);
        await sleep(wait);
        retries++;
        continue;
      }
      break;
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
    process.stdout.write(`\r    page ${page}: ${fetched}/${total} found    `);
    if (fetched >= total) break;

    await sleep(7000); // code_search limit: 10/min → 6s minimum
  }
  console.log(`\n    → ${results.length} entries`);
  return results;
}

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log(' ANTIGRAVITY OS — API Supplement Harvester');
  console.log('═══════════════════════════════════════════════');

  // Load existing catalog
  let existing = { apis: [], total: 0, sources: {}, categories: {} };
  try {
    const raw = await fs.readFile(OUT_FILE, 'utf8');
    existing = JSON.parse(raw);
    console.log(`\n  Existing catalog: ${existing.total} APIs`);
  } catch {
    console.log('  No existing catalog found, starting fresh.');
  }

  const newEntries = [];

  for (const q of CODE_QUERIES) {
    const entries = await codeSearch(q);
    newEntries.push(...entries);
    await sleep(65000); // wait between queries for secondary rate limit
  }

  // Merge with existing
  const merged = dedup([...existing.apis, ...newEntries]);

  // Recount by category
  const byCategory = {};
  for (const api of merged) {
    const cat = api.category || 'General';
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  }

  const output = {
    generated_at: new Date().toISOString(),
    total: merged.length,
    sources: {
      ...existing.sources,
      'github-code-search-supplement': newEntries.length,
    },
    categories: byCategory,
    apis: merged,
  };

  await fs.writeFile(OUT_FILE, JSON.stringify(output, null, 2), 'utf8');

  console.log('\n═══════════════════════════════════════════════');
  console.log(` DONE`);
  console.log(`   Previous: ${existing.total} APIs`);
  console.log(`   New raw:  ${newEntries.length} entries`);
  console.log(`   Total:    ${merged.length} unique APIs`);
  console.log(`   Output:   src/data/api-mega-catalog.json`);
  console.log('═══════════════════════════════════════════════');
}

main().catch(console.error);
