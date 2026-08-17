#!/usr/bin/env node
"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = process.cwd();
const ignoredDirs = new Set([".git", ".vercel", "node_modules"]);
const assetExts = new Set([".css", ".js"]);

const htmlFiles = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".html")) {
      htmlFiles.push(fullPath);
    }
  }
}

function isLocalAsset(url) {
  if (!url || url.startsWith("#")) return false;
  if (/^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(url)) return false;
  if (/^(?:data|blob|mailto|tel):/i.test(url)) return false;
  return assetExts.has(path.posix.extname(url.split(/[?#]/, 1)[0]));
}

function versionedUrl(rawUrl, htmlFile) {
  if (!isLocalAsset(rawUrl)) return rawUrl;

  const [urlWithoutHash, hash = ""] = rawUrl.split("#", 2);
  const [assetPath, query = ""] = urlWithoutHash.split("?", 2);
  const assetFsPath = path.resolve(path.dirname(htmlFile), assetPath);

  if (!assetFsPath.startsWith(rootDir + path.sep) && assetFsPath !== rootDir) {
    throw new Error(`Asset outside project root: ${rawUrl} in ${path.relative(rootDir, htmlFile)}`);
  }
  if (!fs.existsSync(assetFsPath)) {
    throw new Error(`Missing asset: ${rawUrl} referenced by ${path.relative(rootDir, htmlFile)}`);
  }

  const hashValue = crypto
    .createHash("sha256")
    .update(fs.readFileSync(assetFsPath))
    .digest("hex")
    .slice(0, 12);

  const params = new URLSearchParams(query);
  params.set("v", hashValue);

  return `${assetPath}?${params.toString()}${hash ? `#${hash}` : ""}`;
}

function updateHtml(html, htmlFile) {
  return html
    .replace(/(<link\b[^>]*\brel=["'][^"']*\bstylesheet\b[^"']*["'][^>]*\bhref=["'])([^"']+)(["'][^>]*>)/gi,
      (match, before, href, after) => before + versionedUrl(href, htmlFile) + after)
    .replace(/(<script\b[^>]*\bsrc=["'])([^"']+)(["'][^>]*>\s*<\/script>)/gi,
      (match, before, src, after) => before + versionedUrl(src, htmlFile) + after);
}

walk(rootDir);

let changedReferences = 0;
let changedFiles = 0;

for (const htmlFile of htmlFiles) {
  const original = fs.readFileSync(htmlFile, "utf8");
  const updated = updateHtml(original, htmlFile);

  if (updated !== original) {
    const beforeRefs = original.match(/\?v=[0-9a-f]{12}/g) || [];
    const afterRefs = updated.match(/\?v=[0-9a-f]{12}/g) || [];
    changedReferences += Math.max(1, Math.abs(afterRefs.length - beforeRefs.length) || afterRefs.length);
    changedFiles++;
    fs.writeFileSync(htmlFile, updated);
  }
}

console.log(`Cache busting complete: ${changedReferences} reference(s) updated in ${changedFiles} HTML file(s).`);
