---
applyTo: "js/script.js"
description: "Rules for editing the main JavaScript file. Use when: modifying JS, adding interactivity, form handling."
---

# JavaScript Rules

## Compatibility
- Vanilla JS only — no frameworks, no ES modules, no import/export
- `addEventListener`, `querySelector`, `fetch`, `IntersectionObserver` are the core APIs
- Must work in Chrome 90+, Firefox 90+, Safari 15+, Edge 90+

## Structure
All code runs inside a single `DOMContentLoaded` event listener. Sections:
1. Mobile navigation toggle
2. Navbar scroll effect (`navbar--scrolled`)
3. Scroll reveal animations (`.fade-up`, `.stagger-children`)
4. Counter animation for hero stats
5. Filter buttons (news, jobs, directory)
6. Newsletter form submission
7. RFQ form submission

## Forms
- Newsletter: POST with `{type: 'subscriber', email, timestamp, source}`
- RFQ: POST with `{type: 'rfq', fullName, email, phone, company, ...fields, timestamp}`
- Both use `mode: 'no-cors'` to the Google Apps Script endpoint
- NEVER expose the Google Script URL in comments

## Security
- No inline `onclick` or `javascript:` URIs
- No API keys or secrets in this file
- All event handlers attached via `addEventListener`
