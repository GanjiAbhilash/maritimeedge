---
name: pre-deploy-check
description: 'Run pre-deployment validation checklist before pushing to main. Use when: deploying, pushing, final review, QA check, pre-deploy, validate site, check for errors.'
---

# Pre-Deploy Check

Validates the entire MaritimeEdge site before pushing to `main` (auto-deploys via GitHub Pages).

## When to Use
- Before any `git push` to `main`
- After making changes across multiple pages
- Final QA before release

## Procedure

### 1. Cross-Page Consistency
For EVERY HTML file (`index.html`, `news.html`, `jobs.html`, `tools.html`, `directory.html`, `contact.html`, `articles/*.html`):

- [ ] Navbar links are correct (articles use `../` prefix)
- [ ] Correct page has `navbar__link--active` (articles have NONE active)
- [ ] Footer content is identical across all pages
- [ ] Footer includes Vasera Global link (`https://vaseraglobal.com`)
- [ ] Newsletter form exists with `id="newsletter-form"`
- [ ] `<script src="js/script.js">` is present (articles: `../js/script.js`)

### 2. Branding & Colors
- [ ] SVG logo uses `stroke="#0EA5E9"` everywhere (NOT `#0052CC`)
- [ ] No `#0052CC` colors remain anywhere in the codebase
- [ ] Accent color is consistently `#0EA5E9`

### 3. Images
- [ ] All `<img>` tags have descriptive `alt` text
- [ ] Below-fold images have `loading="lazy"`
- [ ] Unsplash URLs use correct format: `photo-[ID]?w=[WIDTH]&q=[QUALITY]`
- [ ] Every news article has `.article__hero-image`
- [ ] Every news card has a thumbnail image
- [ ] Clearbit logos have `onerror` text fallback

### 4. Links & Security
- [ ] All external links have `target="_blank" rel="noopener"`
- [ ] Internal links use correct relative paths
- [ ] No broken `href="#"` links without `<!-- TODO -->` comment
- [ ] No API keys or secrets in client-side code

### 5. Functionality
- [ ] Filter buttons work on `news.html`, `jobs.html`, `directory.html`
- [ ] Mobile nav toggle works on all pages
- [ ] Scroll animations trigger correctly
- [ ] Newsletter form submits without console errors
- [ ] RFQ form on `contact.html` submits correctly

### 6. SEO
- [ ] Every page has `<title>` under 60 chars with "MaritimeEdge"
- [ ] Every page has `<meta name="description">` (150-160 chars)
- [ ] Every page has `og:title` and `og:description`
- [ ] Semantic HTML used (`<article>`, `<nav>`, `<section>`, `<footer>`)

### 7. Compatibility
- [ ] No ES modules, CSS nesting, or `@layer`
- [ ] No inline `onclick` or `javascript:` URIs
- [ ] `-webkit-backdrop-filter` used alongside `backdrop-filter`
- [ ] Touch targets are at least 44x44px

### 8. Data Integrity
- [ ] No fabricated company names, circular numbers, or statistics
- [ ] All directory companies are real and verifiable
- [ ] All job listings are India-based with real companies
- [ ] All news references real events with accurate dates/circulars
- [ ] Any unverified data is marked with `[VERIFY]` or `[PLACEHOLDER]`

### 9. Files
- [ ] `CNAME` file exists and is unmodified
- [ ] No `.bak` files accidentally referenced
- [ ] `css/styles.css` and `js/script.js` are the only asset files referenced
