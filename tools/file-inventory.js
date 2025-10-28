// tools/file-inventory.js
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const scanReport = path.join(ROOT, 'reports', 'repo-scan-report.json');
const outDir = path.join(ROOT, 'reports');
const outFile = path.join(outDir, 'file-inventory.json');

if (!fs.existsSync(scanReport)) {
  console.error('Missing reports/repo-scan-report.json (run EPL-2 scanner first).');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(scanReport, 'utf8'));
const files = (data.report || []).map(r => r.file);

const htmlFiles = files.filter(f => f.endsWith('.html'));
const cssFiles  = files.filter(f => f.endsWith('.css'));
const jsFiles   = files.filter(f => f.endsWith('.js'));

function read(file) {
  try { return fs.readFileSync(path.join(ROOT, file), 'utf8'); } catch { return ''; }
}

function extract(regex, text) {
  const out = []; let m;
  while ((m = regex.exec(text))) out.push(m[1]);
  return out;
}

function parseHtmlEmbeds(file) {
  const src = read(file);
  if (!src) return null;

  // collect element IDs (for i18n mapping via getElementById)
  const elementIds = extract(/id="([^"]+)"/g, src);

  // scripts and styles referenced
  const scripts = extract(/<script[^>]*\ssrc="([^"]+)"[^>]*>/gi, src);
  const styles  = extract(/<link[^>]*rel="stylesheet"[^>]*\shref="([^"]+)"[^>]*>/gi, src);

  // regions (header, nav, footer, sections with ids)
  const headerIds = extract(/<header[^>]*id="([^"]+)"[^>]*>/gi, src);
  const navIds    = extract(/<nav[^>]*id="([^"]+)"[^>]*>/gi, src);
  const footerIds = extract(/<footer[^>]*id="([^"]+)"[^>]*>/gi, src);
  const sectionIds= extract(/<section[^>]*id="([^"]+)"[^>]*>/gi, src);

  return {
    file,
    embeds: {
      scripts,
      styles
    },
    regions: {
      header: headerIds,
      nav: navIds,
      footer: footerIds,
      sections: sectionIds
    },
    elementIds
  };
}

const htmlInventory = htmlFiles.map(parseHtmlEmbeds).filter(Boolean);

const inventory = {
  generatedAt: new Date().toISOString(),
  summary: {
    html: htmlFiles,
    css: cssFiles,
    js: jsFiles
  },
  htmlDetails: htmlInventory
};

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(inventory, null, 2));
console.log('✔ Created', path.relative(ROOT, outFile));
