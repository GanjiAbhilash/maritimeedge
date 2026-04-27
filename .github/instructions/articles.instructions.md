---
applyTo: "articles/**"
description: "Rules for article HTML files inside the articles/ directory. Use when: editing article pages, reviewing article code."
---

# Article File Rules

When editing any file in `articles/`:

## Path Prefixes
- All asset paths use `../` prefix: `../css/styles.css`, `../js/script.js`
- All navbar links use `../` prefix: `../index.html`, `../news.html`, etc.
- CTA button: `../contact.html`

## Navbar
- NO link should have `navbar__link--active` class (articles aren't a top-level page)
- Logo links to `../index.html`

## Required Elements
- `.article__hero-image` with `<img>` using Unsplash URL (`?w=1200&q=80`)
- `← Back to News` link pointing to `../news.html`
- Badges for port/region and category
- Date in header
- Newsletter section with `id="newsletter-form"`
- Footer matching all other pages (with Vasera Global link)

## Content Rules
- Headline follows subject-first format
- Opening paragraph covers 5W1H
- All circular/notification numbers must be real or marked `[VERIFY]`
- Include advisory/action box for stakeholder next steps

## SEO
- `<title>`: Subject-first headline + " — MaritimeEdge" (under 60 chars)
- `<meta name="description">`: 150-160 characters
- `og:title` and `og:description` meta tags required
