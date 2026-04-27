---
description: 'Audit a MaritimeEdge HTML page for common issues. Use when: reviewing page, checking for bugs, validating HTML, page audit, finding issues.'
---

Audit the specified MaritimeEdge HTML page for these issues:

1. **Navbar**: Correct links? Correct active state? Logo SVG uses `#0EA5E9`?
2. **Footer**: Matches other pages? Vasera Global link present? Social links exist?
3. **Newsletter**: Form with `id="newsletter-form"` present?
4. **Images**: All have `alt` text? Below-fold have `loading="lazy"`? Unsplash URLs valid?
5. **Links**: External have `target="_blank" rel="noopener"`? Internal paths correct?
6. **SEO**: Title under 60 chars? Description 150-160 chars? OG tags present?
7. **Security**: No inline event handlers? No exposed API keys?
8. **Data**: No fabricated facts? All companies/circulars real or marked `[VERIFY]`?

Report each issue found with the line number and a fix.
