# Copilot Instructions for MaritimeEdge

## Project Context
MaritimeEdge is a static HTML/CSS/JS website for Indian maritime/shipping logistics intelligence. Hosted on GitHub Pages. No frameworks, no build tools. A Vasera Global initiative.

**Domain:** maritimeedge.com
**Repository:** GanjiAbhilash/maritimeedge (GitHub Pages, auto-deploys on push to `main`)
**Parent Company:** [Vasera Global](https://vaseraglobal.com)

---

## Critical Rules — READ BEFORE EVERY CHANGE

### 1. NO FAKE DATA — EVER
- Never fabricate company names, CBIC circulars, DGFT notifications, port statistics, URLs, phone numbers, or any factual data.
- Every company in the directory must be a real, verifiable company with accurate details (name, HQ, founding year, website URL, services).
- Every news article must reference real events, real circular numbers, and real dates. Do not invent government notifications.
- If data is unknown, use `[VERIFY]` or `[PLACEHOLDER]` markers — never present guesses as facts.
- Statistics (TEU volumes, rate percentages, port rankings) must be sourced or marked as approximate with `[VERIFY]`.
- Placeholder data is only acceptable when clearly marked with `[PLACEHOLDER]` or `XXXX` (e.g., phone: `+91 22 XXXX XXXX`). Never present placeholders as real data.

### 2. NO ASSUMPTIONS
- Do not assume a URL exists — verify or mark it.
- Do not assume a CSS class exists — check `css/styles.css` first.
- Do not assume a JS selector will match — check the HTML element IDs/classes.
- Do not assume an image URL loads — use the exact Unsplash format: `https://images.unsplash.com/photo-[ID]?w=[WIDTH]&q=[QUALITY]`.
- Do not assume form field names — check `google-apps-script/Code.gs` and `js/script.js` for expected fields.
- Do not assume an anchor link `href="#"` is intentional — add `<!-- TODO: Link to real page -->` comment.

### 3. NEWS HEADLINE FORMAT
Headlines must ANSWER THE MAIN SUBJECT FIRST, then provide context:
- ❌ "Chennai Customs Updates — April 2026"
- ❌ "Important Circular from CBIC"
- ✅ "Chennai Customs Mandates Body-Worn Cameras at All ICD Inspections From 1 April 2026"
- ✅ "JNPT Waives Bill of Entry for Returned Export Containers After Hormuz Disruption"

Article structure:
1. **Headline** → Answers WHAT happened and WHY it matters
2. **Opening paragraph** → 5W1H (Who, What, When, Where, Why, How) in 2-3 sentences
3. **Source/circular reference** → Exact circular number, date, issuing authority
4. **Detailed content** → Policy explanation, impact analysis, affected parties
5. **Actionable summary box** → What stakeholders should do now
6. **Hero image** → Every article MUST have `.article__hero-image` with Unsplash photo

### 4. VALIDATION BEFORE CHANGES
Before modifying any file:
- Verify navbar links match across all pages (correct active state per page)
- Verify footer content is consistent across all pages
- Verify SVG logo uses `stroke="#0EA5E9"` (not `#0052CC`)
- Verify internal links use correct relative paths (`../` for articles)
- Verify external links have `target="_blank" rel="noopener"`
- Verify all `<img>` tags have descriptive `alt` text and `loading="lazy"` for below-fold images
- Verify newsletter form exists on every page with id `newsletter-form`
- Verify all pages link to Vasera Global with correct URL (`https://vaseraglobal.com`)

### 5. COMPATIBILITY
- No ES modules, no CSS nesting, no `@layer`
- Must work in Chrome 90+, Firefox 90+, Safari 15+, Edge 90+
- iOS Safari 15+, Chrome for Android
- All JS in `js/script.js` using vanilla `addEventListener`, `querySelector`, `fetch`, `IntersectionObserver`
- Mobile-first responsive: works at 320px width
- Touch targets must be at least 44x44px
- `backdrop-filter` needs `-webkit-` prefix for Safari
- No `!important` overrides unless absolutely necessary

### 6. SECURITY
- No API keys, tokens, or secrets in client-side code
- Google Apps Script URL is the only external endpoint
- All forms use client-side validation (required, email type)
- External links always use `rel="noopener"` with `target="_blank"`
- No inline `onclick` or `javascript:` URIs — all JS in `script.js`

---

## File Structure
```
index.html, news.html, jobs.html, tools.html, directory.html, contact.html
css/styles.css         — All styles, CSS variables in :root
js/script.js           — All JS (nav toggle, scroll animations, form submissions)
articles/*.html        — News articles (use ../ for asset paths)
google-apps-script/
  Code.gs              — Backend (do not expose URL in comments)
CNAME                  — Custom domain config (do not modify or delete)
```

## Design System
- Primary: `#0A2463` (navy), Accent: `#0EA5E9` (sky blue), Gold: `#F59E0B`, Success: `#10B981`
- Font: Inter from Google Fonts (400, 500, 600, 700, 800, 900)
- BEM-like class naming: `.block__element--modifier`
- Scroll animations: `.fade-up`, `.stagger-children` (IntersectionObserver in script.js)
- Glassmorphism navbar: transparent → solid on scroll (`navbar--scrolled`)
- Cards: rounded corners (16px), subtle shadows, hover lift effects

## Forms
- Newsletter: POST to Google Script with `{type: 'subscriber', email, timestamp, source}`
- RFQ: POST to Google Script with `{type: 'rfq', fullName, email, phone, company, origin, destination, shipmentType, cargoWeight, commodity, incoterm, readyDate, message, timestamp}`
- Both use `mode: 'no-cors'`

## Images
- Unsplash URL format: `https://images.unsplash.com/photo-[ID]?w=[WIDTH]&q=[QUALITY]`
- Hero bg: `?w=1920&q=80`, Article hero: `?w=1200&q=80`, Card thumb: `?w=600&q=80`
- Company logos: Clearbit API (`https://logo.clearbit.com/[domain]`) with `onerror` text fallback
- Every news article MUST have a hero image (`.article__hero-image`)
- Every news card MUST have a thumbnail (`.news-card__img img`)
- All below-fold images: `loading="lazy"`

## SEO
- `<title>` — Descriptive, includes "MaritimeEdge", under 60 chars
- `<meta name="description">` — 150-160 chars
- `<meta property="og:title">`, `og:description`, `og:image` on every page
- Semantic HTML: `<article>`, `<nav>`, `<section>`, `<footer>`
- Descriptive `alt` text on all images

## Directory Rules
- Every company listed must be a real, operating company
- Company names must match official legal/trading name
- Website URLs must be correct and currently active
- Founding years, HQ locations, and services must be accurate
- `data-category` must match filter bar options (forwarder, shipping-line, cha, cfs)

## Pre-Deployment Checklist
1. Open every HTML page in browser and verify rendering
2. Test mobile nav toggle on each page
3. Test newsletter form submission
4. Test RFQ form (contact.html)
5. Verify all news card links go to correct articles
6. Verify filter buttons work on news.html, jobs.html, directory.html
7. Test scroll animations on index.html
8. Check no console errors on any page
9. Verify all images load (no 404s)
10. Verify no `#0052CC` colors remain (should all be `#0EA5E9`)
