# Personal Website (GitHub Pages) — plain HTML/CSS/JS

This is a **no-build-step** website: just static files. You edit JSON + drop in PDFs/images, push to GitHub, and GitHub Pages hosts it.

---

## 1) Folder map (where to put things)

- **index.html** — the whole website (single page with tabs that scroll to sections)
- **assets/**
  - **css/styles.css** — site styling
  - **js/site.js** — renders content from JSON files
  - **img/** — your photos (e.g., `profile.jpg`)
  - **icons/** — small always-present icons (SVG preferred)
- **data/**
  - **site.json** — your email, address, nav tabs, hero quick links
  - **publications.json** — your publications list
  - **demos.json** — demos list
  - **teaching.json** — teaching entries
  - **outreach.json** — outreach entries
- **files/**
  - **cv/CV.pdf** — your CV (exact file name recommended)
  - **publications/** — PDFs for papers (any names you want; match the paths in `data/publications.json`)
  - **media/** — any extra PDFs (syllabi, slides, etc.)

---

## 2) Quick edit checklist (first-time setup)

1. Replace the placeholder email/address + links:
   - Edit **data/site.json**
2. Add your photo:
   - Put your image at **assets/img/profile.jpg** (or change the filename in `index.html`)
3. Add your CV:
   - Put your PDF at **files/cv/CV.pdf**
4. Add papers:
   - Put PDFs in **files/publications/**
   - Update **data/publications.json** so each paper points to its PDF
5. Optional: add icons for “always-present” links:
   - Put SVGs in **assets/icons/**
   - Update the badge links in `index.html` (search for `badge-row`)

---

## 3) Local preview (recommended)

Because this site loads JSON via `fetch()`, opening `index.html` directly (file://) may not work in some browsers.

Use *one* of these:

### Option A — Python (built-in on macOS)
```bash
cd YOUR-FOLDER
python3 -m http.server 8000
```
Then open: http://localhost:8000

### Option B — VS Code “Live Server”
If you use VS Code, install the Live Server extension and click “Go Live”.

---

## 4) Deploy on GitHub Pages (simple)

### If you want the site at: https://YOURUSERNAME.github.io/

1. Create a new repo **named exactly**: `YOURUSERNAME.github.io`
2. Upload these files to the repo root (same level as `index.html`)
3. Go to **Settings → Pages**
4. Under “Build and deployment” choose:
   - **Source**: Deploy from a branch
   - **Branch**: `main` (root)
5. Save. Your site will appear at `https://YOURUSERNAME.github.io/`

### If you want the site at: https://YOURUSERNAME.github.io/REPO/
You can use any repo name, but set Pages to deploy from `main` (root).  
(Links in this template are *relative*, so it works either way.)

---

## 5) Adding a new tab later (easy)

1. Add a new section in `index.html`:
```html
<section id="newtab" class="section">
  <div class="container">
    <h2>New Tab</h2>
    <p>...</p>
  </div>
</section>
```

2. Add it to `data/site.json`:
```json
{"id":"newtab","label":"New Tab"}
```

---

## 6) Notes

- If something looks “blank” on GitHub Pages, it’s usually a broken file path.
- Keep PDF paths **relative**, like `files/publications/MyPaper.pdf`.

---

If you want, you can delete the placeholder entries in the JSON files once you add your real content.


## Publication images (thumbnails)
Put one image per paper in `assets/img/pubs/` and set the `image` field for that entry in `data/publications.json`.
Example: `"image": "assets/img/pubs/myers2025.png"`


## Presentations
- Put poster/talk PDFs in `files/presentations/`
- List entries in `data/presentations.json`
- For a YouTube embed, add `youtubeId` (the part after `v=`).
