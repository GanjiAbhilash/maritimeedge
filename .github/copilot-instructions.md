# Copilot Instructions for MaritimeEdge

## Project Context
MaritimeEdge is a static HTML/CSS/JS website for Indian maritime/shipping logistics intelligence. Hosted on GitHub Pages. No frameworks, no build tools. A Vasera Global initiative.

## Critical Rules — READ BEFORE EVERY CHANGE

### 1. NO FAKE DATA — EVER
- Never fabricate company names, CBIC circulars, DGFT notifications, port statistics, URLs, phone numbers, or any factual data.
- Every company in the directory must be a real, verifiable company with accurate details (name, HQ, founding year, website URL, services).
- Every news article must reference real events, real circular numbers, and real dates. Do not invent government notifications.
- If data is unknown, use `[VERIFY]` or `[PLACEHOLDER]` markers — never present guesses as facts.
- Statistics (TEU volumes, rate percentages, port rankings) must be sourced or marked as approximate with `[VERIFY]`.

### 2. NO ASSUMPTIONS
- Do not assume a URL exists — verify or mark it.
- Do not assume a CSS class exists — check `css/styles.css` first.
- Do not assume a JS selector will match — check the HTML element IDs/classes.
- Do not assume an image URL loads — use the exact Unsplash format: `https://images.unsplash.com/photo-[ID]?w=[WIDTH]&q=[QUALITY]`.
- Do not assume form field names — check `google-apps-script/Code.gs` and `js/script.js` for expected fields.

### 3. NEWS HEADLINE FORMAT
Headlines must ANSWER THE MAIN SUBJECT FIRST, then provide context:
- ❌ "Chennai Customs Updates — April 2026"
- ✅ "Chennai Customs Mandates Body-Worn Cameras at All ICD Inspections From 1 April 2026"

Article structure: Headline → Opening paragraph (5W1H) → Source/circular reference → Detailed content → Actionable summary box.

Every article MUST have a hero image (`.article__hero-image`).

### 4. VALIDATION BEFORE CHANGES
Before modifying any file:
- Verify navbar links match across all pages
- Verify footer content is consistent
- Verify SVG logo uses `stroke="#0EA5E9"` (not `#0052CC`)
- Verify internal links use correct relative paths (`../` for articles)
- Verify external links have `target="_blank" rel="noopener"`
- Verify all `<img>` tags have descriptive `alt` text and `loading="lazy"` for below-fold images

### 5. COMPATIBILITY
- No ES modules, no CSS nesting, no `@layer`
- Must work in Chrome 90+, Firefox 90+, Safari 15+, Edge 90+
- All JS in `js/script.js` using vanilla `addEventListener`, `querySelector`, `fetch`, `IntersectionObserver`
- Mobile-first responsive: works at 320px width

### 6. SECURITY
- No API keys or secrets in client-side code
- Google Apps Script URL is the only external endpoint
- All forms use client-side validation (required, email type)
- External links always use `rel="noopener"`

## File Structure Quick Reference
```
index.html, news.html, jobs.html, tools.html, directory.html, contact.html
css/styles.css — All styles, CSS variables in :root
js/script.js — All JS (nav toggle, scroll animations, form submissions)
articles/*.html — News articles (use ../ for asset paths)
google-apps-script/Code.gs — Backend (do not expose URL in comments)
```

## Design System
- Primary: `#0A2463` (navy), Accent: `#0EA5E9` (sky blue)
- Font: Inter from Google Fonts
- BEM-like class naming: `.block__element--modifier`
- Scroll animations: `.fade-up`, `.stagger-children`

## Forms
- Newsletter: POST to Google Script with `{type: 'subscriber', email, timestamp, source}`
- RFQ: POST to Google Script with `{type: 'rfq', fullName, email, phone, company, origin, destination, shipmentType, cargoWeight, commodity, incoterm, readyDate, message, timestamp}`
- Both use `mode: 'no-cors'`
