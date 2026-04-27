---
description: 'Generate a complete page scaffold with navbar, header, content area, newsletter, and footer. Use when: creating new page, page template, new HTML page.'
---

Create a new MaritimeEdge HTML page with the standard layout.

Use these exact components in order:
1. `<!DOCTYPE html>` with full `<head>` (charset, viewport, title, description, og tags, favicon, stylesheet)
2. Navbar with logo, all 6 links (Home, News, Jobs, Tools, Directory, Get Quote CTA), and mobile toggle
3. `.page-header` section with eyebrow, title, and description
4. Main content section(s)
5. Newsletter section with `id="newsletter-form"`
6. Footer with brand, 4-column grid (Platform, Company, Indian Ports), social links, Vasera Global attribution, bottom bar
7. `<script src="js/script.js"></script>`

Set `navbar__link--active` on the correct nav link for this page.
Mark the page title as: `[PAGE_TITLE] — MaritimeEdge`

The user will specify what content goes in the main section.
