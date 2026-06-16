# Portfolio

Drop a folder per project into `projects/`, then build.

## Add a project

1. `mkdir projects/my-new-project`
2. Add `info.md`:
   ```
   ---
   title: My New Project
   date: 2026-06-16
   tags: web, design
   link: https://example.com
   ---

   A short description of the project. Multiple paragraphs are fine.
   ```
3. Drop any images (`.jpg`, `.png`, `.gif`, `.webp`, `.svg`) into the same folder. The first image (alphabetically) becomes the card cover.

## Build

```
npm run build       # one-time build into docs/
npm run watch       # rebuild automatically as you edit projects/
npm run serve       # preview docs/ at http://localhost:8080
```

## Publish to GitHub Pages

```
git init
git add .
git commit -m "Initial portfolio"
gh repo create portfolio --public --source=. --push
```

Then on GitHub: Settings → Pages → Deploy from branch → select `main` and folder `/docs` → Save. Your site will be live at `https://<username>.github.io/portfolio/`.

After that, every time you add/edit a project: `npm run build`, then `git add -A && git commit -m "update" && git push`.
