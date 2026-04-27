---
applyTo: "css/styles.css"
description: "Rules for editing the main stylesheet. Use when: modifying CSS, adding styles, changing design."
---

# CSS Rules

## Design System Variables
All colors, spacing, and tokens are defined in `:root`. Always use CSS variables instead of hardcoded values:
- `var(--primary)` = `#0A2463` (navy)
- `var(--accent)` = `#0EA5E9` (sky blue) — NEVER use `#0052CC`
- `var(--gold)` = `#F59E0B`
- `var(--success)` = `#10B981`
- `var(--text)`, `var(--text-secondary)`, `var(--text-light)` for text
- `var(--bg)`, `var(--bg-alt)` for backgrounds
- `var(--radius)`, `var(--shadow)`, `var(--transition)` for common tokens

## Naming Convention
BEM-like: `.block__element--modifier`
Examples: `.news-card__title`, `.filter-bar__btn--active`, `.job-card__type-badge--cfs`

## Compatibility
- No CSS nesting
- No `@layer`
- No `!important` unless absolutely necessary
- Use `-webkit-backdrop-filter` alongside `backdrop-filter`
- Must work at 320px width (mobile-first)

## Touch Targets
All interactive elements must be at least 44x44px.

## Cards
- Border radius: 16px (`var(--radius)`)
- Subtle shadows using `var(--shadow)` tokens
- Hover lift effects using `transform: translateY(-4px)` and increased shadow
