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

  // ─── Subscription Payment Modal ────────────────────────────
  const SUBSCRIPTION_FEE = '₹2,000';

  function closeSubscriptionPayment() {
    const modal = document.getElementById('subscribe-modal');
    if (!modal) return;
    modal.classList.remove('modal--open');
    document.body.style.overflow = '';
  }

  function showSubscriptionPayment(email) {
    const pathPrefix = window.location.pathname.indexOf('/articles/') !== -1 ? '../' : '';
    let modal = document.getElementById('subscribe-modal');

    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'modal';
      modal.id = 'subscribe-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-label', 'Complete your subscription payment');
      modal.innerHTML =
        '<div class="modal__backdrop" data-close></div>' +
        '<div class="modal__box">' +
          '<button type="button" class="modal__close" data-close aria-label="Close">&times;</button>' +
          '<h3 class="modal__title">Complete Your Subscription — ' + SUBSCRIPTION_FEE + '</h3>' +
          '<p class="modal__text">Scan the QR code with any UPI app and pay ' + SUBSCRIPTION_FEE + ' to activate your subscription.</p>' +
          '<img class="modal__qr" src="' + pathPrefix + 'assets/subscription-qr.png" alt="UPI QR code to pay the MaritimeEdge subscription fee">' +
          '<p class="modal__email"></p>' +
          '<p class="modal__note">Once we receive your payment, you will get your subscription confirmation email.</p>' +
        '</div>';
      document.body.appendChild(modal);

      modal.addEventListener('click', (ev) => {
        if (ev.target.hasAttribute('data-close')) closeSubscriptionPayment();
      });
    }

    modal.querySelector('.modal__email').textContent = 'Subscribing as ' + email;
    modal.classList.add('modal--open');
    document.body.style.overflow = 'hidden';
  }

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') closeSubscriptionPayment();
  });

  // ─── Newsletter Form Submission ────────────────────────────
  const newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const emailInput = newsletterForm.querySelector('input[name="email"]');
      const submitBtn = newsletterForm.querySelector('button[type="submit"]');
      const msgEl = newsletterForm.querySelector('#newsletter-msg');
      const email = emailInput.value.trim();

      if (!email) return;

      const setMessage = (text, kind) => {
        if (!msgEl) return;
        msgEl.textContent = text;
        msgEl.className = 'newsletter__msg' + (kind ? ' newsletter__msg--' + kind : '');
      };

      const originalText = submitBtn.textContent;
      setMessage('', '');
      submitBtn.textContent = 'Subscribing...';
      submitBtn.disabled = true;

      const finish = (btnText, msg, kind, bg) => {
        setMessage(msg, kind);
        submitBtn.textContent = btnText;
        submitBtn.style.background = bg;
        submitBtn.style.color = '#fff';
        setTimeout(() => {
          submitBtn.textContent = originalText;
          submitBtn.style.background = '';
          submitBtn.style.color = '';
          submitBtn.disabled = false;
        }, 3000);
      };

      const payload = JSON.stringify({
        type: 'subscriber',
        email: email,
        timestamp: new Date().toISOString(),
        source: window.location.pathname
      });

      // Local record covers the case where the response can't be read cross-origin.
      const storageKey = 'me_subscribed_emails';
      const normalized = email.toLowerCase();
      let known;
      try {
        known = JSON.parse(localStorage.getItem(storageKey)) || [];
      } catch (err) {
        known = [];
      }
      let duplicate = known.indexOf(normalized) !== -1;

      try {
        let responded = false;
        try {
          const res = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: payload
          });
          responded = true;
          const result = await res.json();
          duplicate = result.status === 'duplicate';
        } catch (readError) {
          if (!responded) {
            await fetch(GOOGLE_SCRIPT_URL, {
              method: 'POST',
              mode: 'no-cors',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: payload
            });
          }
        }

        emailInput.value = '';

        if (duplicate) {
          finish('Already Subscribed', 'You are already subscribed with this email.', 'info', '#F59E0B');
        } else {
          known.push(normalized);
          try {
            localStorage.setItem(storageKey, JSON.stringify(known));
          } catch (err) { /* storage unavailable — non-critical */ }
          finish('✓ Registered!', 'Almost there — complete the ₹2,000 payment to activate your subscription.', 'success', '#10B981');
          showSubscriptionPayment(email);
        }
      } catch (error) {
        finish('Error — Try Again', 'Subscription failed. Please try again.', 'error', '#EF4444');
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
        shipmentValue: rfqForm.querySelector('#shipmentValue').value.trim(),
        containerCount: rfqForm.querySelector('#containerCount').value.trim(),
        incoterm: rfqForm.querySelector('#incoterm').value,
        readyDate: rfqForm.querySelector('#readyDate').value,
        deliveryDate: rfqForm.querySelector('#deliveryDate').value,
        message: rfqForm.querySelector('#message').value.trim(),
        timestamp: new Date().toISOString()
      };

      try {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
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

  // ─── Registration Form (Transporter / Co-loader) ───────────
  const registrationForm = document.getElementById('registration-form');
  if (registrationForm) {
    const escapeHtml = (str) => String(str).replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[ch]);

    registrationForm.querySelectorAll('input[name="membership"]').forEach((radio) => {
      radio.addEventListener('change', () => {
        registrationForm.querySelectorAll('.plan-card').forEach((card) => {
          card.classList.toggle('plan-card--active', card.contains(radio) && radio.checked);
        });
      });
    });

    registrationForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = registrationForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Submitting...';
      submitBtn.disabled = true;

      const selectedPlan = registrationForm.querySelector('input[name="membership"]:checked');
      const feeLabel = selectedPlan.getAttribute('data-fee-label') || '';

      const formData = {
        type: 'registration',
        membership: selectedPlan.value,
        fee: selectedPlan.getAttribute('data-fee') || '',
        companyName: registrationForm.querySelector('#companyName').value.trim(),
        email: registrationForm.querySelector('#regEmail').value.trim(),
        phone: registrationForm.querySelector('#regPhone').value.trim(),
        address: registrationForm.querySelector('#address').value.trim(),
        district: registrationForm.querySelector('#district').value.trim(),
        state: registrationForm.querySelector('#state').value,
        pincode: registrationForm.querySelector('#pincode').value.trim(),
        country: 'India',
        timestamp: new Date().toISOString()
      };

      try {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(formData)
        });

        registrationForm.innerHTML =
          '<div class="payment-panel">' +
            '<h2 class="form__title" style="margin-bottom:8px;">Complete Your ' + escapeHtml(formData.membership) + ' Registration</h2>' +
            '<p class="payment-panel__text">Scan the QR code below with any UPI app' +
              (feeLabel ? ' and pay <strong>' + escapeHtml(feeLabel) + '</strong>' : '') + '.</p>' +
            '<img class="payment-panel__qr" src="assets/subscription-qr.png" alt="UPI QR code to pay the MaritimeEdge registration fee">' +
            '<p class="payment-panel__meta">Registering <strong>' + escapeHtml(formData.companyName) + '</strong><br>' + escapeHtml(formData.email) + '</p>' +
            '<p class="payment-panel__note">Once we receive your payment, you will get your confirmation email.</p>' +
            '<a href="index.html" class="btn btn--primary" style="margin-top:24px;">Back to Home</a>' +
          '</div>';
        window.scrollTo({ top: registrationForm.offsetTop - 100, behavior: 'smooth' });
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

  // ─── Quote Form — URL Params & Submission ──────────────────
  const quoteForm = document.getElementById('quote-form');
  if (quoteForm) {
    var params = new URLSearchParams(window.location.search);
    var rfqId = params.get('rfq') || '';
    var partnerId = params.get('partner') || '';
    var token = params.get('token') || '';

    // Populate hidden fields
    var rfqIdField = document.getElementById('rfqId');
    var partnerIdField = document.getElementById('partnerId');
    var tokenField = document.getElementById('token');
    if (rfqIdField) rfqIdField.value = rfqId;
    if (partnerIdField) partnerIdField.value = partnerId;
    if (tokenField) tokenField.value = token;

    // Populate RFQ summary from URL params (anonymized data from email link)
    var summaryFields = {
      'qs-rfqId': rfqId,
      'qs-origin': params.get('origin') || '—',
      'qs-destination': params.get('dest') || '—',
      'qs-cargo': params.get('cargo') || '—',
      'qs-shipmentType': params.get('type') || '—',
      'qs-weight': params.get('weight') ? params.get('weight') + ' kg' : '—',
      'qs-containers': params.get('containers') || '—',
      'qs-incoterm': params.get('incoterm') || '—',
      'qs-deadline': params.get('deadline') || '—'
    };

    Object.keys(summaryFields).forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.textContent = summaryFields[id];
    });

    // Validate required URL params
    if (!rfqId || !partnerId || !token) {
      quoteForm.innerHTML = '<div style="text-align:center;padding:48px 0;"><div style="width:64px;height:64px;border-radius:50%;background:#FEE2E2;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:2rem;">✕</div><h2 class="form__title" style="margin-bottom:12px;">Invalid Quote Link</h2><p style="color:var(--text-secondary);line-height:1.7;">This quote link is missing required parameters. Please use the link from your email notification.</p><a href="index.html" class="btn btn--primary" style="margin-top:28px;">Back to Home</a></div>';
      return;
    }

    quoteForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      var submitBtn = quoteForm.querySelector('button[type="submit"]');
      var originalText = submitBtn.textContent;
      submitBtn.textContent = 'Submitting...';
      submitBtn.disabled = true;

      var quoteData = {
        type: 'quote',
        rfqId: rfqId,
        partnerId: partnerId,
        token: token,
        quotedPrice: quoteForm.querySelector('#quotedPrice').value.trim(),
        transitTime: quoteForm.querySelector('#transitTime').value.trim(),
        validity: quoteForm.querySelector('#validity').value.trim(),
        breakdown: quoteForm.querySelector('#quoteBreakdown').value.trim(),
        notes: quoteForm.querySelector('#quoteNotes').value.trim(),
        timestamp: new Date().toISOString()
      };

      try {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(quoteData)
        });

        var quoteInfo = document.getElementById('quote-info');
        if (quoteInfo) quoteInfo.style.display = 'none';

        quoteForm.innerHTML = '<div style="text-align:center;padding:48px 0;"><div style="width:64px;height:64px;border-radius:50%;background:var(--success-light);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:2rem;">✓</div><h2 class="form__title" style="margin-bottom:12px;">Quotation Submitted!</h2><p style="color:var(--text-secondary);margin-top:8px;line-height:1.7;">Thank you for your quote on <strong>' + rfqId + '</strong>. We will notify you if your quote is shortlisted.</p><p style="color:var(--text-light);margin-top:16px;font-size:0.9rem;">You will receive a confirmation via email and Telegram shortly.</p><a href="index.html" class="btn btn--primary" style="margin-top:28px;">Back to Home</a></div>';
      } catch (error) {
        submitBtn.textContent = 'Error — Try Again';
        submitBtn.style.background = '#EF4444';
        setTimeout(function() {
          submitBtn.textContent = originalText;
          submitBtn.style.background = '';
          submitBtn.disabled = false;
        }, 3000);
      }
    });
  }
});