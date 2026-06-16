#!/usr/bin/env node
// Scans projects/*/info.md + images, generates static site/ output.
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PROJECTS_DIR = path.join(ROOT, "projects");
const SITE_DIR = path.join(ROOT, "docs");
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"]);

function parseFrontMatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw.trim() };
  const meta = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    value = value.replace(/^["']|["']$/g, "");
    meta[key] = value;
  }
  return { meta, body: match[2].trim() };
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

// Minimal markdown: paragraphs + blank-line breaks. Good enough for short project blurbs.
function markdownToHtml(md) {
  return md
    .split(/\n\s*\n/)
    .map((para) => `<p>${escapeHtml(para.trim()).replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

function loadProject(slug) {
  const dir = path.join(PROJECTS_DIR, slug);
  const infoPath = path.join(dir, "info.md");
  if (!fs.existsSync(infoPath)) return null;

  const { meta, body } = parseFrontMatter(fs.readFileSync(infoPath, "utf8"));
  const images = fs.readdirSync(dir)
    .filter((f) => IMAGE_EXTS.has(path.extname(f).toLowerCase()))
    .sort();

  return {
    slug,
    title: meta.title || slug,
    date: meta.date || "",
    tags: meta.tags ? meta.tags.split(",").map((t) => t.trim()) : [],
    link: meta.link || "",
    summary: meta.summary || "",
    body,
    images,
  };
}

function loadAllProjects() {
  if (!fs.existsSync(PROJECTS_DIR)) return [];
  return fs.readdirSync(PROJECTS_DIR)
    .filter((f) => fs.statSync(path.join(PROJECTS_DIR, f)).isDirectory())
    .map(loadProject)
    .filter(Boolean)
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

function pageShell(title, content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="${title === "Portfolio" ? "" : "../"}assets/style.css">
</head>
<body>
<header><a href="${title === "Portfolio" ? "" : "../../"}index.html" class="home-link">&larr; Portfolio</a></header>
<main>
${content}
</main>
</body>
</html>`;
}

function buildIndex(projects) {
  const cards = projects.map((p) => {
    const cover = p.images[0]
      ? `<img src="projects/${p.slug}/${p.images[0]}" alt="${escapeHtml(p.title)}" loading="lazy">`
      : "";
    return `<a class="card" href="projects/${p.slug}/index.html">
  ${cover}
  <h2>${escapeHtml(p.title)}</h2>
  <p>${escapeHtml(p.summary)}</p>
</a>`;
  }).join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Portfolio</title>
<link rel="stylesheet" href="assets/style.css">
</head>
<body>
<header><h1>Portfolio</h1></header>
<main class="grid">
${cards}
</main>
</body>
</html>`;
  fs.writeFileSync(path.join(SITE_DIR, "index.html"), html);
}

function buildProjectPage(p) {
  const dir = path.join(SITE_DIR, "projects", p.slug);
  fs.mkdirSync(dir, { recursive: true });

  for (const img of p.images) {
    fs.copyFileSync(path.join(PROJECTS_DIR, p.slug, img), path.join(dir, img));
  }

  const gallery = p.images.map((img) =>
    `<img src="${img}" alt="${escapeHtml(p.title)}" loading="lazy">`
  ).join("\n");

  const tags = p.tags.length
    ? `<div class="tags">${p.tags.map((t) => `<span>${escapeHtml(t)}</span>`).join("")}</div>`
    : "";

  const link = p.link
    ? `<p><a href="${escapeHtml(p.link)}" target="_blank" rel="noopener">View project &rarr;</a></p>`
    : "";

  const content = `<h1>${escapeHtml(p.title)}</h1>
${p.date ? `<p class="date">${escapeHtml(p.date)}</p>` : ""}
${tags}
<div class="gallery">${gallery}</div>
${markdownToHtml(p.body)}
${link}`;

  fs.writeFileSync(path.join(dir, "index.html"), pageShell(p.title, content));
}

function copyStyle() {
  const assetsDir = path.join(SITE_DIR, "assets");
  fs.mkdirSync(assetsDir, { recursive: true });
  fs.copyFileSync(path.join(__dirname, "style.css"), path.join(assetsDir, "style.css"));
}

function main() {
  fs.rmSync(SITE_DIR, { recursive: true, force: true });
  fs.mkdirSync(SITE_DIR, { recursive: true });
  copyStyle();

  const projects = loadAllProjects();
  buildIndex(projects);
  for (const p of projects) buildProjectPage(p);

  console.log(`Built ${projects.length} project(s) into site/`);
}

main();
