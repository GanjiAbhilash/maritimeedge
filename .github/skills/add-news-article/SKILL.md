---
name: add-news-article
description: 'Create a new maritime news article page and news card. Use when: adding news, writing article, creating customs update, adding circular coverage, port news, DGFT notification, freight rate update.'
argument-hint: 'Topic, port/region, circular number if applicable'
---

# Add News Article

Creates a full article HTML page in `articles/` and adds a corresponding news card to `news.html`.

## When to Use
- Adding a new customs circular or DGFT notification article
- Writing a port operations update
- Covering freight rate changes or EXIM policy updates
- Any new news content for the site

## Procedure

### Step 1 — Gather Facts
Before writing ANYTHING, confirm these are real and verifiable:
- Exact circular/notification number and date
- Issuing authority (CBIC, DGFT, Port Trust, etc.)
- Affected ports, terminals, CFS, ICDs
- Key stakeholders impacted
- If ANY fact cannot be verified, mark it with `[VERIFY]`

### Step 2 — Create the Article File
Create `articles/<slug>.html` following this structure:

```
Slug format: <port/region>-<topic>-<month>-<year>.html
Example: chennai-customs-updates-april-2026.html
```

Required elements in order:
1. `<!DOCTYPE html>` with `lang="en"`
2. `<head>` with:
   - `<title>` — Subject-first headline + " — MaritimeEdge" (under 60 chars)
   - `<meta name="description">` — 150-160 chars
   - `<meta property="og:title">` and `og:description`
   - Favicon SVG
   - `<link rel="stylesheet" href="../css/styles.css">`
3. Navbar — Use `../` prefix for ALL links, NO active state on any link
4. Page header with `← Back to News` link, title, badges, date
5. Article section (max-width 800px container):
   - `.article__hero-image` with Unsplash photo (`?w=1200&q=80`)
   - Opening paragraph with 5W1H
   - Subheadings with `<h2>` tags
   - Source/circular reference
   - Advisory/action box using the project's advisory box pattern
6. Newsletter section with `id="newsletter-form"`
7. Footer matching other pages (with Vasera Global link)
8. `<script src="../js/script.js"></script>`

### Step 3 — Write the Headline
Headlines MUST answer the main subject first:
- **Bad:** "Chennai Customs Updates — April 2026"
- **Good:** "Chennai Customs Mandates Body-Worn Cameras at All ICD Inspections From 1 April 2026"

### Step 4 — Add News Card to news.html
Insert a new `<article class="news-card">` in the grid on `news.html`:

```html
<article class="news-card" data-category="CATEGORY">
  <div class="news-card__img">
    <img src="https://images.unsplash.com/photo-[ID]?w=600&q=80" alt="DESCRIPTIVE ALT" loading="lazy">
    <div class="news-card__img-overlay"></div>
    <span class="news-card__img-badge badge badge--glass">PORT_NAME</span>
  </div>
  <div class="news-card__body">
    <div class="news-card__meta"><span class="badge badge--blue">BADGE</span><span>DATE</span></div>
    <h3 class="news-card__title"><a href="articles/SLUG.html">HEADLINE</a></h3>
    <p class="news-card__summary">SUMMARY (2-3 sentences)</p>
    <a href="articles/SLUG.html" class="news-card__link">Read full story →</a>
  </div>
</article>
```

- `data-category`: One of `ports`, `customs`, `rates`, `policy`
- Badge classes: `badge--blue` (Customs/Port), `badge--orange` (Policy), `badge--green` (Rates)
- Place newest articles FIRST in the grid

### Step 5 — Validate
- [ ] Headline is subject-first, answers WHAT and WHY
- [ ] Article has `.article__hero-image` with valid Unsplash URL
- [ ] All facts are real or marked `[VERIFY]`
- [ ] Circular numbers and dates are accurate
- [ ] Navbar uses `../` paths, no link is active
- [ ] Footer matches other pages
- [ ] Newsletter form has `id="newsletter-form"`
- [ ] News card added to `news.html` with correct `data-category`
- [ ] News card links match article filename
- [ ] All external links have `target="_blank" rel="noopener"`
