// tools/scan-repo.js
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const KEYWORDS = [
  'translate', 'scroll', 'language', 'lang', 'btn',
  'bottle', 'supersalsa', 'endboss', 'chicken', 'chick',
  'audio', 'sound', 'status', 'bar', 'hp'
];
const EXTS = ['.js', '.ts', '.html', '.css', '.json'];
const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'out', 'build', 'coverage'];
const CONTEXT = 1; // lines before/after

function walk(dir) {
  return fs.readdirSync(dir).flatMap((name) => {
    const p = path.join(dir, name);
    const s = fs.statSync(p);
    if (s.isDirectory()) {
      if (IGNORE_DIRS.includes(name)) return [];
      return walk(p);
    }
    return s.isFile() ? [p] : [];
  });
}

function scanFile(file) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  const hits = [];

  lines.forEach((line, i) => {
    const low = line.toLowerCase();
    KEYWORDS.forEach((k) => {
      if (low.includes(k)) {
        const from = Math.max(0, i - CONTEXT);
        const to = Math.min(lines.length - 1, i + CONTEXT);
        hits.push({
          line: i + 1,
          keyword: k,
          context: lines.slice(from, to + 1).map((l, idx) => ({
            rel: from + idx + 1,
            text: l.trim().slice(0, 300)
          }))
        });
      }
    });
  });

  return hits;
}

function extractHtmlIds(file) {
  const html = fs.readFileSync(file, 'utf8');
  const idRegex = /id="([^"]+)"/g;
  const ids = [];
  let m;
  while ((m = idRegex.exec(html))) ids.push(m[1]);
  return ids;
}

const files = walk(ROOT).filter((f) => EXTS.includes(path.extname(f)));
const report = [];
const stats = { totalFiles: files.length, filesWithHits: 0, keywordCounts: {} };

files.forEach((file) => {
  const rel = path.relative(ROOT, file);
  const hits = scanFile(file);
  const entry = { file: rel };
  if (hits.length) {
    entry.hits = hits;
    stats.filesWithHits++;
    hits.forEach(h => {
      stats.keywordCounts[h.keyword] = (stats.keywordCounts[h.keyword] || 0) + 1;
    });
  }
  if (file.endsWith('.html')) {
    const ids = extractHtmlIds(file);
    if (ids.length) entry.ids = ids;
  }
  if (entry.hits || entry.ids) report.push(entry);
});

const outDir = path.join(ROOT, 'reports');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
const outPath = path.join(outDir, 'repo-scan-report.json');

fs.writeFileSync(outPath, JSON.stringify({
  generatedAt: new Date().toISOString(),
  root: path.basename(ROOT),
  stats,
  report
}, null, 2));

console.log(`✔ Created ${path.relative(ROOT, outPath)}`);
console.log(`   Files scanned: ${stats.totalFiles}, with hits: ${stats.filesWithHits}`);
console.log('   Keyword counts:', stats.keywordCounts);
