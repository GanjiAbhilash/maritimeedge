// ============================================================
// MaritimeEdge — Client-side JavaScript
// Google Sheets integration for Newsletter + RFQ
// ============================================================

// Replace with your deployed Google Apps Script Web App URL
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwo2UBKVfrkAZmceIZPzhyVB36FqhDiC6SS8qWt53xhtfNnrcolvl8jhOGX5p6pO_8zAw/exec';

// ─── Mobile Navigation Toggle ────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.navbar__toggle');
  const menu = document.querySelector('.navbar__menu');

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      menu.classList.toggle('navbar__menu--open');
      toggle.classList.toggle('navbar__toggle--active');
    });

    // Close menu when a link is clicked
    menu.querySelectorAll('.navbar__link').forEach(link => {
      link.addEventListener('click', () => {
        menu.classList.remove('navbar__menu--open');
        toggle.classList.remove('navbar__toggle--active');
      });
    });
  }

  // ─── Navbar Scroll Effect ──────────────────────────────────
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('navbar--scrolled', window.scrollY > 50);
    });
  }

  // ─── Filter Buttons ────────────────────────────────────────
  const filterBtns = document.querySelectorAll('.filter-bar__btn');
  if (filterBtns.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;

        // Update active button
        filterBtns.forEach(b => b.classList.remove('filter-bar__btn--active'));
        btn.classList.add('filter-bar__btn--active');

        // Filter cards
        const cards = btn.closest('.container').querySelectorAll('[data-category]');
        cards.forEach(card => {
          if (filter === 'all' || card.dataset.category === filter) {
            card.style.display = '';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }

  // ─── Newsletter Form Submission ────────────────────────────
  const newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const emailInput = newsletterForm.querySelector('input[name="email"]');
      const submitBtn = newsletterForm.querySelector('button[type="submit"]');
      const email = emailInput.value.trim();

      if (!email) return;

      // Loading state
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Subscribing...';
      submitBtn.disabled = true;

      try {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'subscriber',
            email: email,
            timestamp: new Date().toISOString(),
            source: window.location.pathname
          })
        });

        // Since no-cors returns opaque response, assume success
        emailInput.value = '';
        submitBtn.textContent = '✓ Subscribed!';
        submitBtn.style.background = '#00875A';
        setTimeout(() => {
          submitBtn.textContent = originalText;
          submitBtn.style.background = '';
          submitBtn.disabled = false;
        }, 3000);
      } catch (error) {
        submitBtn.textContent = 'Error — Try Again';
        submitBtn.style.background = '#DE350B';
        setTimeout(() => {
          submitBtn.textContent = originalText;
          submitBtn.style.background = '';
          submitBtn.disabled = false;
        }, 3000);
      }
    });
  }

  // ─── RFQ Form Submission ───────────────────────────────────
  const rfqForm = document.getElementById('rfq-form');
  if (rfqForm) {
    rfqForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = rfqForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Submitting...';
      submitBtn.disabled = true;

      // Collect all form data
      const formData = {
        type: 'rfq',
        fullName: rfqForm.querySelector('#fullName').value.trim(),
        email: rfqForm.querySelector('#email').value.trim(),
        phone: rfqForm.querySelector('#phone').value.trim(),
        company: rfqForm.querySelector('#company').value.trim(),
        origin: rfqForm.querySelector('#origin').value,
        destination: rfqForm.querySelector('#destination').value.trim(),
        shipmentType: rfqForm.querySelector('#shipmentType').value,
        cargoWeight: rfqForm.querySelector('#cargoWeight').value.trim(),
        commodity: rfqForm.querySelector('#commodity').value.trim(),
        incoterm: rfqForm.querySelector('#incoterm').value,
        readyDate: rfqForm.querySelector('#readyDate').value,
        message: rfqForm.querySelector('#message').value.trim(),
        timestamp: new Date().toISOString()
      };

      try {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        // Show success
        rfqForm.innerHTML = `
          <div style="text-align:center;padding:40px 0;">
            <div style="font-size:3rem;margin-bottom:16px;">✅</div>
            <h2 class="form__title">Quote Request Submitted!</h2>
            <p style="color:var(--text-secondary);margin-top:8px;">Thank you, ${formData.fullName}. Our verified freight forwarders will respond to <strong>${formData.email}</strong> within 24 business hours.</p>
            <p style="color:var(--text-secondary);margin-top:16px;font-size:0.9rem;">Route: <strong>${formData.origin}</strong> → <strong>${formData.destination}</strong> (${formData.shipmentType})</p>
            <a href="index.html" class="btn btn--primary" style="margin-top:24px;">Back to Home</a>
          </div>
        `;
      } catch (error) {
        submitBtn.textContent = 'Error — Try Again';
        submitBtn.style.background = '#DE350B';
        setTimeout(() => {
          submitBtn.textContent = originalText;
          submitBtn.style.background = '';
          submitBtn.disabled = false;
        }, 3000);
      }
    });
  }
});
