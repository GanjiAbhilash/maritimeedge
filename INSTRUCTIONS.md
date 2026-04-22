# MaritimeEdge — Website Instruction Guide

> A comprehensive guide for managing, updating, and maintaining the MaritimeEdge website.  
> MaritimeEdge is an Indian maritime / sea freight intelligence platform — a **Vasera Global** initiative.

---

## Table of Contents

1. [Project Rules & Checks](#project-rules--checks)
2. [Project Overview](#project-overview)
3. [Technology Stack](#technology-stack)
4. [File Structure](#file-structure)
5. [Design System](#design-system)
6. [Page-by-Page Guide](#page-by-page-guide)
7. [News & Article Writing Guidelines](#news--article-writing-guidelines)
8. [Adding New Articles](#adding-new-articles)
9. [Images & Media](#images--media)
10. [Forms & Backend](#forms--backend)
11. [Deployment](#deployment)
12. [SEO & Metadata](#seo--metadata)
13. [Accessibility & Performance](#accessibility--performance)

---

## Project Rules & Checks

### 🚫 NEVER Assume — NEVER Fabricate

These rules are **non-negotiable** and apply to every change made to this project.

#### Data Integrity
- **NEVER create fake data.** Every company name, port name, circular number, date, URL, phone number, email, and statistic must be **real and verifiable**.
- **NEVER invent CBIC circulars, DGFT notifications, or government references.** If you don't know the exact circular number, say so — do not guess.
- **NEVER fabricate company details.** Every company in the directory must exist. Verify the company name, headquarters city, founding year, website URL, and services before adding.
- **NEVER make up statistics** (TEU volumes, port rankings, rate percentages). If data is needed, cite the source or mark it as `[VERIFY]`.
- **Placeholder data is only acceptable** when clearly marked with `[PLACEHOLDER]` or `XXXX` (e.g., phone: `+91 22 XXXX XXXX`). Never present placeholders as real data.

#### URLs & Links
- **NEVER guess or fabricate URLs.** Every external link must point to a real, working website.
- **Verify all website URLs** before adding them to directory cards or article references.
- **External links must use `target="_blank" rel="noopener"`** for security and UX.
- **Internal links must use correct relative paths** — `../` prefix for articles linking to root pages.
- **Anchor links (`href="#"`)** are only acceptable for features not yet built. Add a `<!-- TODO: Link to real page -->` comment.

#### News & Articles
- **NEVER write speculative news.** Every article must be based on a real event, circular, notification, or verifiable development.
- **Every date must be real.** Do not assign arbitrary dates to articles.
- **Every circular/notification number must be accurate** (e.g., "CBIC Circular No. 21/2026-Customs dated 15 April 2026").
- **Do not paraphrase government circulars inaccurately.** If summarizing, preserve the intent and key provisions faithfully.

### ✅ Validation Checks

Before any commit or deployment, validate:

#### HTML Validation
- [ ] All pages have `<!DOCTYPE html>`, `<meta charset="UTF-8">`, `<meta name="viewport">`
- [ ] All `<img>` tags have `alt` attributes (descriptive, not empty)
- [ ] All `<a>` tags have valid `href` values
- [ ] All `<form>` elements have `id` attributes matching JS selectors
- [ ] No duplicate `id` attributes on any page
- [ ] All pages include `<link rel="stylesheet" href="css/styles.css">` (or `../css/styles.css` for articles)
- [ ] All pages include `<script src="js/script.js">` (or `../js/script.js` for articles)

#### CSS Validation
- [ ] No undefined CSS variables used in HTML inline styles
- [ ] All CSS classes referenced in HTML exist in `styles.css`
- [ ] Responsive breakpoints work at 768px and 480px
- [ ] No `!important` overrides unless absolutely necessary

#### JavaScript Validation
- [ ] `GOOGLE_SCRIPT_URL` constant matches the deployed Apps Script URL
- [ ] All `document.querySelector` selectors match existing HTML elements
- [ ] Form submissions handle errors gracefully (try/catch with user feedback)
- [ ] No `console.log` statements in production code
- [ ] IntersectionObserver targets (`.fade-up`, `.stagger-children`) exist in HTML

#### Cross-Page Consistency
- [ ] Navbar links are identical across all pages (correct active state per page)
- [ ] Footer content is identical across all pages
- [ ] Newsletter form exists on every page with id `newsletter-form`
- [ ] SVG logo uses `stroke="#0EA5E9"` consistently (not old `#0052CC`)
- [ ] All pages link to Vasera Global with correct URL (`https://vaseraglobal.com`)

#### Image Checks
- [ ] All Unsplash URLs use the format `https://images.unsplash.com/photo-[ID]?w=[WIDTH]&q=[QUALITY]`
- [ ] No broken image URLs — verify images load before committing
- [ ] All below-fold images have `loading="lazy"`
- [ ] Company logos use Clearbit API with `onerror` text fallback
- [ ] Article hero images exist in all article pages

#### Directory Checks
- [ ] Every company listed is a real, operating company
- [ ] Company names match their official legal/trading name
- [ ] Website URLs are correct and currently active
- [ ] Founding years are accurate
- [ ] HQ locations are accurate
- [ ] Service descriptions reflect actual services offered
- [ ] `data-category` matches filter bar options

#### Security
- [ ] No API keys, tokens, or secrets in client-side code
- [ ] Google Apps Script URL is the only external endpoint
- [ ] All external links use `rel="noopener"` with `target="_blank"`
- [ ] Form inputs are validated client-side (required fields, email format)
- [ ] No inline `onclick` or `javascript:` URIs — all JS in `script.js`

### 🔄 Compatibility

#### Browser Support
- Chrome 90+, Firefox 90+, Safari 15+, Edge 90+
- iOS Safari 15+, Chrome for Android
- No IE11 support required

#### Key Compatibility Rules
- **No ES modules** — script loaded with plain `<script>` tag
- **No CSS nesting** — use flat selectors for Safari compatibility
- **No `@layer`** — not supported in older Safari versions
- **`backdrop-filter`** — used for glassmorphism; has `-webkit-` prefix in CSS
- **IntersectionObserver** — supported in all target browsers
- **`fetch` API** — supported in all target browsers
- **CSS Grid and Flexbox** — fully supported
- **Google Fonts `display=swap`** — ensures text renders during font load

#### Mobile Responsiveness
- All pages must be fully functional at 320px width
- Touch targets must be at least 44x44px
- Mobile nav toggle must work without JavaScript errors
- Forms must be usable on mobile keyboards (correct input types)

### 📋 Pre-Deployment Checklist

```
Before pushing to main:
1. Open every HTML page in a browser and verify rendering
2. Test mobile nav toggle on each page
3. Test newsletter form submission
4. Test RFQ form submission (on contact.html)
5. Verify all news card links go to correct articles
6. Check all article "← All News" and "Get Quote →" links work
7. Verify filter buttons work on news.html, jobs.html, directory.html
8. Test scroll animations fire on index.html
9. Check no console errors on any page
10. Verify all images load (check Network tab for 404s)
```

---

## Project Overview

**MaritimeEdge** provides:
- Indian maritime & customs news
- Sea freight tools (rate calculators, HS code lookup, container tracking, etc.)
- Maritime job listings across Indian ports
- A directory of verified Indian logistics providers
- RFQ (Request for Quote) functionality for ocean freight

**Domain:** maritimeedge.com  
**Repository:** GanjiAbhilash/maritimeedge (GitHub Pages)  
**Parent Company:** [Vasera Global](https://vaseraglobal.com)

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Static HTML5, CSS3, Vanilla JavaScript |
| Hosting | GitHub Pages (via CNAME) |
| Fonts | Google Fonts — Inter (400, 500, 600, 700, 800, 900) |
| Backend (forms) | Google Apps Script → Google Sheets |
| Images | Unsplash (free, high-quality photography) |

**No build tools, no frameworks, no bundlers.** Everything is vanilla and deployment-ready on push.

---

## File Structure

```
maritimeedge/
├── CNAME                          # Custom domain config
├── index.html                     # Homepage
├── news.html                      # News listing page
├── jobs.html                      # Job listings
├── tools.html                     # EXIM tools directory
├── directory.html                 # Logistics company directory
├── contact.html                   # RFQ form & contact info
├── INSTRUCTIONS.md                # This file
├── README.md                      # Repo readme
├── css/
│   └── styles.css                 # Complete design system
├── js/
│   └── script.js                  # Client-side JavaScript
├── articles/
│   └── *.html                     # Individual news articles
└── google-apps-script/
    └── Code.gs                    # Google Apps Script backend
```

---

## Design System

### Colors (CSS Variables)

| Variable | Value | Usage |
|----------|-------|-------|
| `--primary` | `#0A2463` | Navy — headings, navbar bg, hero bg |
| `--primary-mid` | `#1E3A8A` | Mid-tone navy |
| `--accent` | `#0EA5E9` | Sky blue — links, buttons, highlights |
| `--accent-dark` | `#0284C7` | Darker accent for hover states |
| `--gold` | `#F59E0B` | Warm gold — badges, attention |
| `--success` | `#10B981` | Green — success states, checkmarks |
| `--text` | `#0F172A` | Primary text |
| `--text-secondary` | `#475569` | Secondary/body text |
| `--bg` | `#FFFFFF` | Background |
| `--bg-alt` | `#F8FAFC` | Alternating section background |

### Typography

- **Font Family:** Inter (Google Fonts)
- **Headings:** 700–900 weight, navy color
- **Body:** 400–500 weight, secondary text color
- **Base size:** 16px with responsive scaling

### Key UI Components

- **Navbar:** Glassmorphism effect, transparent → solid on scroll (`navbar--scrolled`)
- **Hero:** Full-viewport with background image overlay and floating animated shapes
- **Cards:** Rounded corners (16px), subtle shadows, hover lift effects
- **Badges:** Glass-style badges with backdrop blur (`badge--glass`)
- **Buttons:** Primary (accent blue) and outline variants with hover transitions
- **Sections:** Alternating white/light gray backgrounds with eyebrow text labels

### CSS Class Naming

Uses BEM-like convention:
```
.block__element--modifier

Examples:
.navbar__link
.news-card__img
.filter-bar__btn--active
.hero__stat-value
```

### Scroll Animations

Two CSS classes trigger animations via IntersectionObserver in `script.js`:

- `.fade-up` — Fades in and slides up when scrolled into view
- `.stagger-children` — Staggers child element animations

Add these classes to any element you want animated on scroll.

---

## Page-by-Page Guide

### index.html (Homepage)
- **Hero:** Full-viewport with background image, floating shapes, stat cards (glassmorphism)
- **Trust Bar:** Scrolling port names
- **News Section:** 3 featured news cards with images
- **Port Map:** Image + list of major Indian ports
- **Features:** 4 feature cards (News, Tools, Directory, Jobs)
- **Jobs Preview:** 3 job cards
- **CTA Section:** Call-to-action for quotes
- **Newsletter:** Email subscription form
- **Footer:** 4-column layout

### news.html
- 6 news cards with Unsplash images and glass badges
- Filter bar for categories (All, JNPT, Customs, etc.)
- Each card links to articles in `articles/` folder

### jobs.html
- 8 job cards in 2-column grid
- Filter bar for job categories
- Each card shows location, salary range, tags

### tools.html
- 9 tool cards (HS Code Lookup, Container Tracking, etc.)
- External links to real tools where available

### directory.html
- 9 company/directory cards
- CTA section for listing companies

### contact.html
- Full RFQ form with all shipping fields
- Sidebar with contact info and value propositions
- Submits to Google Apps Script

---

## News & Article Writing Guidelines

### ⚡ CRITICAL: News Must Be Catchy

Every news article must follow this structure:

#### 1. Headline — Answer the Main Subject FIRST

The headline must immediately tell the reader **what happened** and **why it matters**. No vague titles.

**❌ BAD:**
- "Updates from Chennai Customs"
- "April 2026 Maritime News"
- "Important Circular from CBIC"

**✅ GOOD:**
- "Chennai Customs Now Requires Body-Worn Cameras for All Container Inspections"
- "JNPT Allows Re-Export Without Bill of Entry for Returned Containers After Hormuz Disruption"
- "Mundra Port Clears Record 3.2M TEUs — Gujarat Customs Eases CFS Procedures"

#### 2. Opening Paragraph — Main Subject Summary

The first paragraph must answer the **5W1H** (Who, What, When, Where, Why, How) in 2-3 sentences. The reader should understand the full story from this paragraph alone.

**Example:**
> "Starting 1 April 2026, Chennai Customs has made body-worn cameras mandatory during physical examination of all import/export cargo at Inland Container Depots. This move aims to increase transparency and reduce disputes during customs inspections at India's second-busiest port."

#### 3. Body — Reference & Detailed Content

After the opening, provide:
- **Source/Reference:** Cite the specific circular, notification, or official document (e.g., "CBIC Circular No. 21/2026-Customs dated 15 April 2026")
- **Detailed explanation** of the policy/update
- **Impact analysis** — who does this affect and how?
- **Actionable steps** — what should traders/freight forwarders do?
- **Timeline** — any deadlines or effective dates

#### 4. Call-to-Action Box

End every article with an actionable summary box:
```html
<div style="background:var(--bg-secondary);border-left:4px solid var(--primary);padding:20px 24px;margin-top:32px;border-radius:0 8px 8px 0;">
  <h3>What Trade Stakeholders Should Do Now</h3>
  <ul>
    <li>Action item 1</li>
    <li>Action item 2</li>
  </ul>
</div>
```

#### 5. Image — ALWAYS Include an Aesthetic Image

Every article and news card **MUST** have a high-quality image. See the [Images & Media](#images--media) section for sourcing guidelines.

### Tone & Style

- **Professional yet accessible** — write for busy shipping professionals
- **Data-driven** — include numbers, dates, and specifics
- **India-focused** — always frame news in context of Indian ports and trade
- **Actionable** — every article should tell the reader what to do next
- Use **bold** for key terms, port names, and circular numbers
- Use bullet points for lists of provisions, actions, or steps

---

## Adding New Articles

### Step 1: Create the HTML File

Create a new file in `articles/` with a URL-friendly name:
```
articles/[port-or-topic]-[brief-description]-[month-year].html
```

Example: `articles/mundra-port-record-teu-clearance-may-2026.html`

### Step 2: Use This Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[CATCHY HEADLINE] — MaritimeEdge</title>
  <meta name="description" content="[2-sentence summary for SEO, ~155 chars]">
  <meta property="og:title" content="[CATCHY HEADLINE] — MaritimeEdge">
  <meta property="og:description" content="[2-sentence summary]">
  <meta property="og:image" content="[UNSPLASH IMAGE URL]">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚓</text></svg>">
  <link rel="stylesheet" href="../css/styles.css">
</head>
<body>

  <!-- NAVBAR — Copy from any existing article, paths use ../ prefix -->
  <nav class="navbar">
    <div class="container">
      <a href="../index.html" class="navbar__logo">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="15" stroke="#0EA5E9" stroke-width="2"/><path d="M8 20 L16 10 L24 20" stroke="#0EA5E9" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><line x1="16" y1="10" x2="16" y2="26" stroke="#0EA5E9" stroke-width="2" stroke-linecap="round"/><path d="M10 24 Q16 20 22 24" stroke="#0EA5E9" stroke-width="2" stroke-linecap="round"/></svg>
        Maritime<span>Edge</span>
      </a>
      <div class="navbar__menu">
        <a href="../index.html" class="navbar__link">Home</a>
        <a href="../news.html" class="navbar__link">News</a>
        <a href="../jobs.html" class="navbar__link">Jobs</a>
        <a href="../tools.html" class="navbar__link">Tools</a>
        <a href="../directory.html" class="navbar__link">Directory</a>
        <a href="../contact.html" class="btn btn--primary btn--sm navbar__cta">Get Quote</a>
      </div>
      <button class="navbar__toggle" aria-label="Toggle menu"><span></span><span></span><span></span></button>
    </div>
  </nav>

  <!-- PAGE HEADER -->
  <section class="page-header">
    <div class="container">
      <h1 class="page-header__title">[CATCHY HEADLINE]</h1>
      <p class="page-header__desc">[One-line summary]</p>
      <div style="margin-top:16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
        <span class="badge badge--blue">[PORT NAME]</span>
        <span class="badge badge--orange">[CATEGORY]</span>
        <span style="color:rgba(255,255,255,0.7);font-size:0.9rem;">[DATE]</span>
      </div>
    </div>
  </section>

  <!-- ARTICLE CONTENT -->
  <section class="section">
    <div class="container" style="max-width:800px;">
      <div class="article__hero-image">
        <img src="[UNSPLASH IMAGE URL ?w=1200&q=80]" alt="[Descriptive alt text]" loading="lazy">
      </div>
      <article style="line-height:1.8;color:var(--text-secondary);">

        <p style="font-size:1.1rem;font-weight:500;color:var(--text-primary);">
          [OPENING PARAGRAPH — Answer the main subject. 2-3 sentences covering WHO, WHAT, WHEN, WHERE, WHY]
        </p>

        <h2 style="color:var(--primary);margin-top:32px;font-size:1.4rem;">[Section Heading]</h2>
        <p>[Detailed content with <strong>bold key terms</strong>]</p>

        <!-- Add more sections as needed -->

        <!-- ACTIONABLE SUMMARY BOX -->
        <div style="background:var(--bg-secondary);border-left:4px solid var(--primary);padding:20px 24px;margin-top:32px;border-radius:0 8px 8px 0;">
          <h3 style="margin:0 0 12px;color:var(--primary);font-size:1.1rem;">What Trade Stakeholders Should Do Now</h3>
          <ul style="padding-left:20px;margin:0;">
            <li>[Action item 1]</li>
            <li>[Action item 2]</li>
          </ul>
        </div>

      </article>

      <div style="margin-top:40px;padding-top:24px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
        <a href="../news.html" class="btn btn--outline">← All News</a>
        <a href="../contact.html" class="btn btn--primary">Get Sea Freight Quote →</a>
      </div>
    </div>
  </section>

  <!-- NEWSLETTER — Copy from any existing article -->
  <!-- FOOTER — Copy from any existing article -->
  <!-- Include ../js/script.js -->

</body>
</html>
```

### Step 3: Add a Card to news.html

Add a news card to `news.html` in the grid:
```html
<a href="articles/[filename].html" class="news-card" data-category="[category]">
  <div class="news-card__img">
    <img src="[UNSPLASH IMAGE URL ?w=600&q=80]" alt="[Alt text]" loading="lazy">
    <div class="news-card__overlay"></div>
    <span class="badge badge--glass">[PORT / CATEGORY]</span>
  </div>
  <div class="news-card__body">
    <time class="news-card__date">[DATE]</time>
    <h3 class="news-card__title">[CATCHY HEADLINE]</h3>
    <p class="news-card__excerpt">[1-2 sentence summary]</p>
  </div>
</a>
```

### Step 4: Optionally Update Homepage

If this is a top story, replace one of the 3 featured cards in `index.html`.

---

## Images & Media

### Sourcing Images

Use **Unsplash** for all images. These are free, high-quality, and don't require attribution (though it's nice to credit).

**Best search terms for maritime images:**
- `container port`, `shipping containers`, `cargo ship`
- `port terminal`, `crane port`, `logistics warehouse`
- `ocean freight`, `maritime`, `sea vessel`
- `[city name] port` (e.g., "mumbai port", "singapore port")

### Image URL Format

Unsplash images can be resized via URL parameters:
```
https://images.unsplash.com/photo-[ID]?w=[WIDTH]&q=[QUALITY]
```

| Use Case | Width | Quality | Example |
|----------|-------|---------|---------|
| Hero background | 1920 | 80 | `?w=1920&q=80` |
| Article hero | 1200 | 80 | `?w=1200&q=80` |
| News card thumbnail | 600 | 80 | `?w=600&q=80` |
| OG/social share | 1200 | 80 | `?w=1200&q=80` |

### Image Requirements

- **Every news article MUST have a hero image** (`.article__hero-image`)
- **Every news card MUST have a thumbnail** (`.news-card__img img`)
- Always include descriptive `alt` text
- Always add `loading="lazy"` for below-fold images
- Images should be relevant to the port, region, or topic

### Creating Images

If no suitable Unsplash image exists:
1. Use **Canva** or similar tool to create branded graphics
2. Save as PNG, optimize for web (< 500KB)
3. Place in a new `images/` folder
4. Use consistent branding: navy + sky blue + Inter font

---

## Forms & Backend

### Google Apps Script

The backend is powered by Google Apps Script (`google-apps-script/Code.gs`).

**Script URL:** `https://script.google.com/macros/s/AKfycbwo2UBKVfrkAZmceIZPzhyVB36FqhDiC6SS8qWt53xhtfNnrcolvl8jhOGX5p6pO_8zAw/exec`

### Newsletter Subscription

Sends a POST request with:
```json
{
  "type": "subscriber",
  "email": "user@example.com",
  "timestamp": "2026-04-20T10:30:00.000Z",
  "source": "/news.html"
}
```

### RFQ Form

Sends a POST request with:
```json
{
  "type": "rfq",
  "fullName": "...",
  "email": "...",
  "phone": "...",
  "company": "...",
  "origin": "JNPT / Nhava Sheva",
  "destination": "Rotterdam, Netherlands",
  "shipmentType": "FCL 40ft",
  "cargoWeight": "15000",
  "commodity": "Cotton textiles, HS code 5208",
  "incoterm": "FOB",
  "readyDate": "2026-05-01",
  "message": "...",
  "timestamp": "2026-04-20T10:30:00.000Z"
}
```

Both use `mode: 'no-cors'` to avoid CORS issues with Google Apps Script.

---

## Deployment

The site is deployed automatically via **GitHub Pages** on push to `main`.

1. Make changes locally
2. Commit: `git add . && git commit -m "Description of changes"`
3. Push: `git push origin main`
4. GitHub Pages rebuilds automatically (usually < 1 minute)

The CNAME file maps the custom domain. Do not modify or delete it.

---

## SEO & Metadata

Every page should have:
- `<title>` — Descriptive, includes "MaritimeEdge", under 60 chars
- `<meta name="description">` — 150-160 chars, includes key terms
- `<meta property="og:title">` — Same as title
- `<meta property="og:description">` — Same as description
- `<meta property="og:image">` — Unsplash image URL for social sharing
- Semantic HTML (`<article>`, `<nav>`, `<section>`, `<footer>`)
- Descriptive `alt` text on all images

---

## Accessibility & Performance

### Accessibility
- All interactive elements have proper `aria-label` attributes
- Color contrast meets WCAG AA standards (navy on white)
- Mobile navigation is keyboard-accessible
- Forms have proper `<label>` elements with `for` attributes

### Performance
- No build tools = no JS bundle overhead
- Images use `loading="lazy"` for deferred loading
- CSS is a single file (no HTTP overhead)
- Google Fonts loaded with `display=swap` for fast rendering
- No external JS dependencies

---

## Quick Reference: Adding Content

| Task | What to do |
|------|-----------|
| Add news article | Create HTML in `articles/`, add card to `news.html`, optionally update `index.html` |
| Add job listing | Add a `.job-card` div to `jobs.html` with proper `data-category` |
| Add tool | Add a `.tool-card` div to `tools.html` |
| Add directory listing | Add a `.directory-card` div to `directory.html` |
| Change colors | Update CSS variables in `:root` in `styles.css` |
| Update backend | Edit `google-apps-script/Code.gs` and redeploy in Apps Script editor |

---

*Last updated: April 2026*
