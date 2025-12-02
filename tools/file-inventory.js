// tools/file-inventory.js
/**
 * Simple helper script to generate a file inventory based on
 * the repo scan report (created by tools/scan-repo.js).
 *
 * Input:
 *   reports/repo-scan-report.json
 *
 * Output:
 *   reports/file-inventory.json
 *
 * Includes:
 *   - lists of HTML/CSS/JS files
 *   - basic HTML metadata: embedded scripts/styles, regions and element-ids
 */

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

/**
 * Reads a file as UTF-8, returns empty string on failure.
 *
 * @param {string} file
 * @returns {string}
 */
function read(file) {
  try { return fs.readFileSync(path.join(ROOT, file), 'utf8'); } catch { return ''; }
}

/**
 * Extracts all regex group(1) matches into an array.
 *
 * @param {RegExp} regex
 * @param {string} text
 * @returns {string[]}
 */
function extract(regex, text) {
  const out = []; let m;
  while ((m = regex.exec(text))) out.push(m[1]);
  return out;
}

/**
 * Parses basic embed information from an HTML file:
 * - element IDs
 * - <script src="..."> references
 * - <link rel="stylesheet" href="..."> references
 * - header/nav/footer/section IDs
 *
 * @param {string} file
 * @returns {object|null}
 */
function parseHtmlEmbeds(file) {
  const src = read(file);
  if (!src) return null;

  // Collect element IDs (useful for i18n mapping via getElementById)
  const elementIds = extract(/id="([^"]+)"/g, src);

  // Scripts and styles referenced
  const scripts = extract(/<script[^>]*\ssrc="([^"]+)"[^>]*>/gi, src);
  const styles  = extract(/<link[^>]*rel="stylesheet"[^>]*\shref="([^"]+)"[^>]*>/gi, src);

  // Regions (header, nav, footer, sections with ids)
  const headerIds  = extract(/<header[^>]*id="([^"]+)"[^>]*>/gi, src);
  const navIds     = extract(/<nav[^>]*id="([^"]+)"[^>]*>/gi, src);
  const footerIds  = extract(/<footer[^>]*id="([^"]+)"[^>]*>/gi, src);
  const sectionIds = extract(/<section[^>]*id="([^"]+)"[^>]*>/gi, src);

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
