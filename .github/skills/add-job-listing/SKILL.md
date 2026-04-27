---
name: add-job-listing
description: 'Add a verified job listing to the jobs page. Use when: posting job, adding career listing, updating job board, new shipping job, logistics vacancy, port job opening.'
argument-hint: 'Job title, company, location, source URL'
---

# Add Job Listing

Adds a verified, India-based job card to `jobs.html`.

## When to Use
- Adding a new job listing from Indeed, Naukri, LinkedIn, or company careers page
- Updating the job board with new openings
- Adding jobs in port/terminal, CFS, ICD, or dry port categories

## Critical Rules
- **Every job must be from a real, verifiable company**
- **Only India-based jobs** — exclude international listings
- Job titles, companies, locations, salary bands must match the source
- "Confidential" employer is acceptable when the source uses it
- Application URL must be a working, real link

## Procedure

### Step 1 — Verify the Job
Confirm these details are real:
- Company name (must be real and operating)
- Job title (must match source listing)
- Location (must be in India)
- Application URL (must be a working link)
- If any detail is unverifiable, mark with `[VERIFY]`

### Step 2 — Add Job Card to jobs.html
Insert a new `.job-card` div in the grid. Place newest jobs at the TOP.

```html
<div class="job-card" data-category="CATEGORY">
  <div class="job-card__top">
    <div class="job-card__logo"><img src="https://logo.clearbit.com/COMPANY_DOMAIN" alt="COMPANY logo" onerror="this.style.display='none';this.parentNode.innerHTML='<span class=job-card__logo-text>ABBR</span>'"></div>
    <span class="job-card__type-badge job-card__type-badge--CATEGORY">EMOJI LABEL</span>
  </div>
  <div class="job-card__header">
    <h3 class="job-card__title">JOB TITLE</h3>
    <p class="job-card__company">COMPANY — CITY, India</p>
  </div>
  <div class="job-card__tags">
    <span class="job-card__tag">📍 CITY</span>
    <span class="job-card__tag">📅 X+ yrs</span>
    <span class="job-card__tag">👥 DEPARTMENT</span>
    <span class="job-card__tag">🏢 LEVEL</span>
  </div>
  <p class="job-card__desc">DESCRIPTION (1-2 sentences about the role)</p>
  <div class="job-card__footer">
    <div><span class="job-card__salary">SALARY BAND</span><span class="job-card__source">via SOURCE</span></div>
    <a href="APPLICATION_URL" target="_blank" rel="noopener" class="btn btn--primary btn--sm">Apply →</a>
  </div>
</div>
```

### Category Reference

| `data-category` | Badge Class | Emoji + Label |
|---|---|---|
| `port-terminal` | `job-card__type-badge--port-terminal` | ⚓ Port / Terminal |
| `cfs` | `job-card__type-badge--cfs` | 📦 CFS |
| `icd` | `job-card__type-badge--icd` | 🚂 ICD |
| `dry-port` | `job-card__type-badge--dry-port` | 🏭 Dry Port |

### Logo Handling
- Use Clearbit: `https://logo.clearbit.com/COMPANY_DOMAIN`
- Always include `onerror` fallback: shows abbreviated company name
- For confidential employers: `<span class="job-card__logo-text">Conf.</span>`

### Step 3 — Validate
- [ ] Company is real and verifiable
- [ ] Location is in India
- [ ] `data-category` matches one of: `port-terminal`, `cfs`, `icd`, `dry-port`
- [ ] Application link has `target="_blank" rel="noopener"`
- [ ] Application URL is a real, working link
- [ ] Logo uses Clearbit with `onerror` fallback
- [ ] Salary band is included (even if approximate)
- [ ] Source attribution is included (e.g., "via Naukri", "via Indeed India")
