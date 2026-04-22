// ============================================================
// MaritimeEdge — Client-side JavaScript
// Scroll animations, Navigation, Google Sheets integration
// ============================================================

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwo2UBKVfrkAZmceIZPzhyVB36FqhDiC6SS8qWt53xhtfNnrcolvl8jhOGX5p6pO_8zAw/exec';

document.addEventListener('DOMContentLoaded', () => {

  // ─── Mobile Navigation Toggle ────────────────────────────
  const toggle = document.querySelector('.navbar__toggle');
  const menu = document.querySelector('.navbar__menu');

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      menu.classList.toggle('navbar__menu--open');
      toggle.classList.toggle('navbar__toggle--active');
      document.body.style.overflow = menu.classList.contains('navbar__menu--open') ? 'hidden' : '';
    });

    menu.querySelectorAll('.navbar__link, .navbar__cta').forEach(link => {
      link.addEventListener('click', () => {
        menu.classList.remove('navbar__menu--open');
        toggle.classList.remove('navbar__toggle--active');
        document.body.style.overflow = '';
      });
    });
  }

  // ─── Navbar Scroll Effect ──────────────────────────────────
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('navbar--scrolled', window.scrollY > 50);
      lastScroll = window.scrollY;
    }, { passive: true });
  }

  // ─── Scroll Reveal Animations ──────────────────────────────
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -60px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.fade-up, .stagger-children').forEach(el => {
    observer.observe(el);
  });

  // ─── Counter Animation for Hero Stats ──────────────────────
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const text = el.textContent;
        const match = text.match(/^(\d+)/);
        if (match) {
          const target = parseInt(match[1], 10);
          const suffix = text.replace(match[1], '');
          const duration = 1500;
          const start = performance.now();

          const animate = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(target * eased);
            el.textContent = current + suffix;
            if (progress < 1) requestAnimationFrame(animate);
          };

          requestAnimationFrame(animate);
        }
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.hero__stat-value').forEach(el => {
    counterObserver.observe(el);
  });

  // ─── Filter Buttons ────────────────────────────────────────
  const filterBtns = document.querySelectorAll('.filter-bar__btn');
  if (filterBtns.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;

        filterBtns.forEach(b => b.classList.remove('filter-bar__btn--active'));
        btn.classList.add('filter-bar__btn--active');

        const cards = btn.closest('.container').querySelectorAll('[data-category]');
        cards.forEach((card, i) => {
          const show = filter === 'all' || card.dataset.category === filter;
          card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
          if (show) {
            card.style.display = '';
            card.style.opacity = '0';
            card.style.transform = 'translateY(10px)';
            setTimeout(() => {
              card.style.opacity = '1';
              card.style.transform = 'translateY(0)';
            }, i * 50);
          } else {
            card.style.opacity = '0';
            card.style.transform = 'translateY(10px)';
            setTimeout(() => { card.style.display = 'none'; }, 300);
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

        emailInput.value = '';
        submitBtn.textContent = '✓ Subscribed!';
        submitBtn.style.background = '#10B981';
        submitBtn.style.color = '#fff';
        setTimeout(() => {
          submitBtn.textContent = originalText;
          submitBtn.style.background = '';
          submitBtn.style.color = '';
          submitBtn.disabled = false;
        }, 3000);
      } catch (error) {
        submitBtn.textContent = 'Error — Try Again';
        submitBtn.style.background = '#EF4444';
        submitBtn.style.color = '#fff';
        setTimeout(() => {
          submitBtn.textContent = originalText;
          submitBtn.style.background = '';
          submitBtn.style.color = '';
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

        rfqForm.innerHTML = `
          <div style="text-align:center;padding:48px 0;">
            <div style="width:64px;height:64px;border-radius:50%;background:var(--success-light);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:2rem;">✓</div>
            <h2 class="form__title" style="margin-bottom:12px;">Quote Request Submitted!</h2>
            <p style="color:var(--text-secondary);margin-top:8px;line-height:1.7;">Thank you, <strong>${formData.fullName}</strong>. Our verified freight forwarders will respond to <strong>${formData.email}</strong> within 24 business hours.</p>
            <p style="color:var(--text-light);margin-top:16px;font-size:0.9rem;">Route: <strong>${formData.origin}</strong> → <strong>${formData.destination}</strong> (${formData.shipmentType})</p>
            <a href="index.html" class="btn btn--primary" style="margin-top:28px;">Back to Home</a>
          </div>
        `;
      } catch (error) {
        submitBtn.textContent = 'Error — Try Again';
        submitBtn.style.background = '#EF4444';
        setTimeout(() => {
          submitBtn.textContent = originalText;
          submitBtn.style.background = '';
          submitBtn.disabled = false;
        }, 3000);
      }
    });
  }
});