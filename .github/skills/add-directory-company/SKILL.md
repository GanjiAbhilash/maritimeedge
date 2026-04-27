---
name: add-directory-company
description: 'Add a verified company to the logistics directory. Use when: adding company, listing forwarder, adding shipping line, new CHA entry, CFS operator, directory update.'
argument-hint: 'Company name, category, website'
---

# Add Directory Company

Adds a verified, real company card to `directory.html`.

## When to Use
- Adding a freight forwarder, shipping line, CHA, or CFS/ICD operator
- Expanding the directory with new verified companies

## Critical Rules
- **Every company must be real and currently operating**
- Company name must match official legal/trading name
- Website URL must be correct and currently active
- Founding year, HQ location, and services must be accurate
- If any detail is unverifiable, mark with `[VERIFY]`

## Procedure

### Step 1 — Verify Company Details
Confirm all of the following are real and accurate:
- Official company name
- Headquarters location
- Founding year
- Website URL (must be live)
- Services offered
- Category classification

### Step 2 — Add Company Card to directory.html
Insert a new `.dir-card` in the grid:

```html
<div class="dir-card" data-category="CATEGORY">
  <div class="dir-card__logo">
    <img src="https://logo.clearbit.com/DOMAIN" alt="COMPANY logo" onerror="this.parentElement.innerHTML='<span style=font-size:1.2rem;font-weight:800;color:var(--primary)>ABBR</span>'">
  </div>
  <div class="dir-card__body">
    <h3 class="dir-card__title">COMPANY NAME</h3>
    <p class="dir-card__category">CATEGORY LABEL</p>
    <p class="dir-card__desc">DESCRIPTION — services, specialties, scale of operations. 2-3 sentences.</p>
    <div class="dir-card__meta">
      <span>📍 CITY, STATE (HQ) · COVERAGE</span>
      <span>📅 Founded YEAR · EXTRA_INFO</span>
      <span>🌐 <a href="https://www.DOMAIN" target="_blank" rel="noopener" style="color:var(--accent-dark)">DOMAIN</a></span>
    </div>
    <a href="contact.html" class="btn btn--primary btn--sm">Get Quote →</a>
  </div>
</div>
```

### Category Reference

| `data-category` | Category Label |
|---|---|
| `forwarder` | Freight Forwarder / 3PL |
| `shipping-line` | Shipping Line |
| `cha` | CHA / Customs Broker |
| `cfs` | CFS / ICD Operator |

### Step 3 — Validate
- [ ] Company is real and currently operating
- [ ] Company name matches official name
- [ ] `data-category` matches: `forwarder`, `shipping-line`, `cha`, or `cfs`
- [ ] Website URL is correct and live
- [ ] Founding year is accurate
- [ ] HQ location is accurate
- [ ] Logo uses Clearbit with `onerror` fallback
- [ ] Website link has `target="_blank" rel="noopener"`
- [ ] "Get Quote" button links to `contact.html`
