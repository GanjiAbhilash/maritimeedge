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

  // ─── 8. Customer Portal — Session Helpers ──────────────────
  var PORTAL_KEY = 'me_portal_session';
  var PORTAL_PAGE_SIZE = 12;

  var PORTAL_STATUS = {
    booked:    'Booked',
    assigned:  'Vehicle Assigned',
    loading:   'Reported for Loading',
    loaded:    'Loaded (EIR Issued)',
    transit:   'In Transit',
    gatein:    'Gate-In ICD',
    delivered: 'Delivered',
    hold:      'On Hold'
  };

  function portalReadSession() {
    var raw;
    try {
      raw = window.localStorage.getItem(PORTAL_KEY);
    } catch (err) {
      return null;
    }
    if (!raw) return null;

    var session;
    try {
      session = JSON.parse(raw);
    } catch (err) {
      return null;
    }
    if (!session || !session.email) return null;
    if (session.expiresAt && new Date(session.expiresAt).getTime() < Date.now()) {
      portalClearSession();
      return null;
    }
    return session;
  }

  function portalWriteSession(session) {
    try {
      window.localStorage.setItem(PORTAL_KEY, JSON.stringify(session));
    } catch (err) {
      /* storage unavailable (private mode) — session lasts for this page only */
    }
  }

  function portalClearSession() {
    try {
      window.localStorage.removeItem(PORTAL_KEY);
    } catch (err) {
      /* nothing to clear */
    }
  }

  // Apps Script replies with CORS headers on the final redirect, so a
  // text/plain POST is readable while still being a simple CORS request.
  function portalApi(payload) {
    return fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    }).then(function(res) {
      if (!res.ok) throw new Error('Request failed');
      return res.json();
    });
  }

  function portalShowMsg(el, text, kind) {
    if (!el) return;
    el.textContent = text;
    el.className = 'auth__msg auth__msg--visible auth__msg--' + (kind || 'info');
  }

  function portalHideMsg(el) {
    if (!el) return;
    el.textContent = '';
    el.className = 'auth__msg';
  }

  function portalBusy(form, busy, busyLabel) {
    var btn = form.querySelector('button[type="submit"]');
    if (!btn) return;
    if (busy) {
      btn.dataset.label = btn.dataset.label || btn.textContent;
      btn.textContent = busyLabel || 'Please wait…';
      btn.disabled = true;
    } else {
      btn.textContent = btn.dataset.label || btn.textContent;
      btn.disabled = false;
    }
  }

  // ─── 9. Login / Sign Up Page ───────────────────────────────
  var authTabs = document.querySelectorAll('.auth__tab');

  if (authTabs.length) {
    var authPanels = document.querySelectorAll('.auth__panel');

    var activateAuthTab = function(name) {
      authTabs.forEach(function(tab) {
        var on = tab.dataset.authTab === name;
        tab.classList.toggle('auth__tab--active', on);
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      authPanels.forEach(function(panel) {
        var on = panel.id === 'auth-panel-' + name;
        panel.classList.toggle('auth__panel--active', on);
        panel.hidden = !on;
      });
    };

    authTabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        activateAuthTab(tab.dataset.authTab);
      });
    });

    document.querySelectorAll('[data-auth-goto]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        activateAuthTab(btn.dataset.authGoto);
      });
    });

    if (window.location.hash === '#signup') activateAuthTab('signup');
    if (window.location.hash === '#admin') activateAuthTab('admin');
    if (window.location.hash === '#forgot') activateAuthTab('forgot');

    var existing = portalReadSession();
    if (existing) {
      portalShowMsg(
        document.getElementById('login-msg'),
        'You are already signed in as ' + existing.email + '. Open your dashboard, or sign in below with a different account.',
        'info'
      );
    }
  }

  var loginForm = document.getElementById('login-form');
  var adminForm = document.getElementById('admin-form');
  var signupForm = document.getElementById('signup-form');

  function portalHandleSignIn(form, msgEl, type, roleLabel) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      portalHideMsg(msgEl);

      var email = form.querySelector('input[type="email"]').value.trim().toLowerCase();
      var password = form.querySelector('input[type="password"]').value;

      if (!email || password.length < 6) {
        portalShowMsg(msgEl, 'Enter a valid email address and your password.', 'error');
        return;
      }

      portalBusy(form, true, 'Signing in…');

      portalApi({
        type: type,
        email: email,
        password: password,
        timestamp: new Date().toISOString()
      }).then(function(res) {
        if (!res || res.status !== 'success') {
          portalBusy(form, false);
          portalShowMsg(msgEl, (res && res.message) || 'Invalid email or password.', 'error');
          return;
        }
        portalWriteSession({
          token: res.token,
          email: res.email || email,
          name: res.contactName || res.name || roleLabel,
          company: res.companyName || '',
          role: res.role || (type === 'admin-login' ? 'admin' : 'customer'),
          expiresAt: res.expiresAt || new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
        });
        window.location.href = 'dashboard.html';
      }).catch(function() {
        portalBusy(form, false);
        portalShowMsg(msgEl, 'The booking portal service is not reachable right now. Check your connection or try again shortly.', 'error');
        portalOfferPreview(msgEl, type === 'admin-login' ? 'admin' : 'customer', email);
      });
    });
  }

  // When the backend is unreachable the dashboard can still be opened with
  // clearly-labelled sample records so the layout can be reviewed.
  function portalOfferPreview(msgEl, role, email) {
    if (!msgEl || msgEl.querySelector('button')) return;

    var wrap = document.createElement('div');
    wrap.style.marginTop = '10px';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'auth__link-btn';
    btn.textContent = 'Open the dashboard with sample data instead';
    btn.addEventListener('click', function() {
      portalWriteSession({
        token: '',
        demo: true,
        email: email || 'sample.customer@example.com',
        name: role === 'admin' ? 'Administrator (sample)' : 'Sample Customer',
        company: role === 'admin' ? 'MaritimeEdge Operations' : 'Sample Trading Co.',
        role: role,
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
      });
      window.location.href = 'dashboard.html';
    });

    wrap.appendChild(btn);
    msgEl.appendChild(wrap);
  }

  if (loginForm) portalHandleSignIn(loginForm, document.getElementById('login-msg'), 'customer-login', 'Customer');
  if (adminForm) portalHandleSignIn(adminForm, document.getElementById('admin-msg'), 'admin-login', 'Administrator');

  if (signupForm) {
    var signupMsg = document.getElementById('signup-msg');

    signupForm.addEventListener('submit', function(e) {
      e.preventDefault();
      portalHideMsg(signupMsg);

      var password = document.getElementById('signupPassword').value;
      var confirm = document.getElementById('signupConfirm').value;
      var email = document.getElementById('signupEmail').value.trim().toLowerCase();

      if (password.length < 8) {
        portalShowMsg(signupMsg, 'Choose a password of at least 8 characters.', 'error');
        return;
      }
      if (password !== confirm) {
        portalShowMsg(signupMsg, 'The two passwords do not match.', 'error');
        return;
      }
      if (!document.getElementById('signupTerms').checked) {
        portalShowMsg(signupMsg, 'Please confirm your details before creating the account.', 'error');
        return;
      }

      portalBusy(signupForm, true, 'Creating account…');

      portalApi({
        type: 'customer-signup',
        companyName: document.getElementById('signupCompany').value.trim(),
        contactName: document.getElementById('signupName').value.trim(),
        email: email,
        phone: document.getElementById('signupPhone').value.trim(),
        password: password,
        source: 'login.html',
        timestamp: new Date().toISOString()
      }).then(function(res) {
        portalBusy(signupForm, false);
        if (!res || res.status !== 'success') {
          portalShowMsg(signupMsg, (res && res.message) || 'We could not create the account. Please try again.', 'error');
          return;
        }
        signupForm.reset();
        portalShowMsg(signupMsg, 'Account created. You can now sign in with ' + email + '.', 'success');
        var loginEmail = document.getElementById('loginEmail');
        if (loginEmail) loginEmail.value = email;
      }).catch(function() {
        portalBusy(signupForm, false);
        portalShowMsg(signupMsg, 'The booking portal service is not reachable right now. Please try again shortly.', 'error');
      });
    });
  }

  // ─── 10. Forgot Password Request ───────────────────────────
  var forgotForm = document.getElementById('forgot-form');

  if (forgotForm) {
    var forgotMsg = document.getElementById('forgot-msg');

    forgotForm.addEventListener('submit', function(e) {
      e.preventDefault();
      portalHideMsg(forgotMsg);

      var email = document.getElementById('forgotEmail').value.trim().toLowerCase();
      if (!email || email.indexOf('@') < 1) {
        portalShowMsg(forgotMsg, 'Enter the email address on your account.', 'error');
        return;
      }

      portalBusy(forgotForm, true, 'Sending…');

      portalApi({
        type: 'password-reset-request',
        email: email,
        timestamp: new Date().toISOString()
      }).then(function(res) {
        portalBusy(forgotForm, false);
        // The backend deliberately returns the same answer for known and
        // unknown addresses, so the wording here must stay neutral too.
        portalShowMsg(
          forgotMsg,
          (res && res.message) || 'If an account exists for that email address, a reset link is on its way.',
          'success'
        );
        forgotForm.reset();
      }).catch(function() {
        portalBusy(forgotForm, false);
        portalShowMsg(forgotMsg, 'The booking portal service is not reachable right now. Please try again shortly.', 'error');
      });
    });
  }

  // ─── 11. Reset Password Page ───────────────────────────────
  var resetForm = document.getElementById('reset-form');

  if (resetForm) {
    var resetMsg = document.getElementById('reset-msg');
    var resetWrap = document.getElementById('reset-wrap');
    var resetInvalid = document.getElementById('reset-invalid');
    var resetToken = new URLSearchParams(window.location.search).get('token') || '';

    // Keep the token out of the address bar, history and any outbound referrer.
    if (resetToken && window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (!resetToken) {
      resetWrap.hidden = true;
      resetInvalid.hidden = false;
    }

    resetForm.addEventListener('submit', function(e) {
      e.preventDefault();
      portalHideMsg(resetMsg);

      var password = document.getElementById('resetPassword').value;
      var confirm = document.getElementById('resetConfirm').value;

      if (password.length < 8) {
        portalShowMsg(resetMsg, 'Choose a password of at least 8 characters.', 'error');
        return;
      }
      if (password !== confirm) {
        portalShowMsg(resetMsg, 'The two passwords do not match.', 'error');
        return;
      }

      portalBusy(resetForm, true, 'Saving…');

      portalApi({
        type: 'password-reset-confirm',
        token: resetToken,
        password: password,
        timestamp: new Date().toISOString()
      }).then(function(res) {
        portalBusy(resetForm, false);
        if (!res || res.status !== 'success') {
          portalShowMsg(resetMsg, (res && res.message) || 'This reset link is invalid or has expired. Please request a new one.', 'error');
          return;
        }
        resetForm.reset();
        resetToken = '';
        portalShowMsg(resetMsg, 'Password updated. Redirecting you to sign in…', 'success');
        setTimeout(function() { window.location.href = 'login.html'; }, 2000);
      }).catch(function() {
        portalBusy(resetForm, false);
        portalShowMsg(resetMsg, 'The booking portal service is not reachable right now. Please try again shortly.', 'error');
      });
    });
  }

  // ─── 12. Bookings Dashboard ────────────────────────────────
  var dashContent = document.getElementById('dash-content');

  if (dashContent) {
    var dashGuard = document.getElementById('dash-guard');
    var dashGuardMsg = document.getElementById('dash-guard-msg');
    var dashGuardLink = document.getElementById('dash-guard-link');
    var dashRows = document.getElementById('dash-rows');
    var dashEmpty = document.getElementById('dash-empty');
    var dashCount = document.getElementById('dash-count');
    var dashPagination = document.getElementById('dash-pagination');
    var dashSearch = document.getElementById('dash-search');
    var dashStatus = document.getElementById('dash-status');
    var dashCustomer = document.getElementById('dash-customer');
    var dashNotice = document.getElementById('dash-notice');
    var customerColHead = document.getElementById('th-customer');

    var session = portalReadSession();
    var allBookings = [];
    var currentPage = 1;

    if (!session) {
      dashGuardMsg.textContent = 'Your session has expired or you are not signed in.';
      dashGuardLink.style.display = '';
      return;
    }

    var isAdmin = session.role === 'admin';

    // ── Rendering helpers ──
    function cell(text, className) {
      var td = document.createElement('td');
      if (className) td.className = className;
      td.textContent = text;
      return td;
    }

    function statusKey(raw) {
      var value = String(raw || '').toLowerCase();
      if (PORTAL_STATUS[value]) return value;
      if (value.indexOf('hold') > -1 || value.indexOf('cancel') > -1) return 'hold';
      if (value.indexOf('deliver') > -1) return 'delivered';
      if (value.indexOf('gate') > -1 || value.indexOf('icd') > -1) return 'gatein';
      if (value.indexOf('transit') > -1) return 'transit';
      if (value.indexOf('eir') > -1 || value.indexOf('loaded') > -1) return 'loaded';
      if (value.indexOf('loading') > -1 || value.indexOf('reported') > -1) return 'loading';
      if (value.indexOf('assign') > -1 || value.indexOf('vehicle') > -1) return 'assigned';
      return 'booked';
    }

    function normalizeBooking(row) {
      return {
        jobId: String(row.jobId || row.bookingId || row.id || '—'),
        rfqId: row.rfqId || '—',
        enquiryDate: row.enquiryDate || '',
        customerCompany: row.customerCompany || row.company || '',
        customerEmail: row.customerEmail || row.email || '',
        contactName: row.contactName || '',
        portOfLoading: row.portOfLoading || '—',
        portOfDischarge: row.portOfDischarge || '—',
        shipmentType: row.shipmentType || '—',
        cargoType: row.cargoType || '—',
        cargoWeight: row.cargoWeight || '—',
        containerCount: row.containerCount || '—',
        incoterm: row.incoterm || '—',
        readyDate: row.readyDate || '—',
        transportCompany: row.transportCompany || '—',
        vehicleType: row.vehicleType || '—',
        vehicleNo: row.vehicleNo || '—',
        driverName: row.driverName || '—',
        driverPhone: row.driverPhone || '—',
        driverLicence: row.driverLicence || '—',
        driverAadhaarLast4: row.driverAadhaarLast4 || '—',
        driverPassNo: row.driverPassNo || '—',
        passValidTill: row.passValidTill || '—',
        eirNumber: row.eirNumber || '—',
        status: statusKey(row.status),
        transportCharges: row.transportCharges || '—',
        paymentStatus: row.paymentStatus || '—',
        pickupDate: row.pickupDate || '—',
        deliveryDate: row.deliveryDate || '—',
        lastUpdated: row.lastUpdated || '',
        remarks: row.remarks || ''
      };
    }

    function statusPill(key) {
      var span = document.createElement('span');
      span.className = 'status-pill status-pill--' + key;
      span.textContent = PORTAL_STATUS[key];
      return span;
    }

    function filteredBookings() {
      var term = (dashSearch.value || '').trim().toLowerCase();
      var status = dashStatus.value;
      var customer = dashCustomer && !dashCustomer.hidden ? dashCustomer.value : 'all';

      return allBookings.filter(function(b) {
        if (status !== 'all' && b.status !== status) return false;
        if (customer !== 'all' && b.customerEmail !== customer) return false;
        if (!term) return true;
        return [
          b.jobId, b.rfqId, b.portOfLoading, b.portOfDischarge, b.transportCompany,
          b.driverName, b.vehicleNo, b.vehicleType, b.eirNumber, b.driverLicence,
          b.cargoType, b.customerCompany, b.customerEmail
        ].join(' ').toLowerCase().indexOf(term) > -1;
      });
    }

    function renderStats() {
      var counts = { total: allBookings.length, transit: 0, port: 0, delivered: 0, hold: 0 };
      allBookings.forEach(function(b) {
        if (b.status === 'transit' || b.status === 'loaded') counts.transit++;
        else if (b.status === 'assigned' || b.status === 'loading') counts.port++;
        else if (b.status === 'gatein' || b.status === 'delivered') counts.delivered++;
        else if (b.status === 'hold') counts.hold++;
      });

      document.getElementById('stat-total').textContent = counts.total;
      document.getElementById('stat-transit').textContent = counts.transit;
      document.getElementById('stat-port').textContent = counts.port;
      document.getElementById('stat-delivered').textContent = counts.delivered;
      document.getElementById('stat-hold').textContent = counts.hold;

      if (isAdmin) {
        document.getElementById('stat-total-note').textContent = 'Across all customer accounts';
      }    }

    function renderPagination(totalItems) {
      dashPagination.textContent = '';
      var pages = Math.ceil(totalItems / PORTAL_PAGE_SIZE);
      if (pages <= 1) return;

      var addBtn = function(label, page, disabled, active) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pagination__btn' + (active ? ' pagination__btn--active' : '');
        btn.textContent = label;
        btn.disabled = !!disabled;
        if (!disabled && !active) {
          btn.addEventListener('click', function() {
            currentPage = page;
            renderTable();
            dashPagination.scrollIntoView({ behavior: 'smooth', block: 'center' });
          });
        }
        dashPagination.appendChild(btn);
      };

      addBtn('‹', currentPage - 1, currentPage === 1, false);

      var start = Math.max(1, currentPage - 2);
      var end = Math.min(pages, start + 4);
      start = Math.max(1, end - 4);
      for (var p = start; p <= end; p++) addBtn(String(p), p, false, p === currentPage);

      addBtn('›', currentPage + 1, currentPage === pages, false);

      var info = document.createElement('span');
      info.className = 'pagination__info';
      info.textContent = 'Page ' + currentPage + ' of ' + pages;
      dashPagination.appendChild(info);
    }

    function renderTable() {
      var list = filteredBookings();
      var pages = Math.max(1, Math.ceil(list.length / PORTAL_PAGE_SIZE));
      if (currentPage > pages) currentPage = pages;

      var slice = list.slice((currentPage - 1) * PORTAL_PAGE_SIZE, currentPage * PORTAL_PAGE_SIZE);

      dashRows.textContent = '';
      dashEmpty.hidden = list.length > 0;
      dashCount.textContent = list.length + (list.length === 1 ? ' job' : ' jobs');

      slice.forEach(function(b) {
        var tr = document.createElement('tr');

        var idTd = document.createElement('td');
        var idStrong = document.createElement('span');
        idStrong.className = 'booking-table__id';
        idStrong.textContent = b.jobId;
        var idSub = document.createElement('span');
        idSub.className = 'booking-table__sub';
        idSub.textContent = b.rfqId;
        idTd.appendChild(idStrong);
        idTd.appendChild(idSub);
        tr.appendChild(idTd);

        if (isAdmin) {
          var custTd = document.createElement('td');
          custTd.appendChild(document.createTextNode(b.customerCompany || '—'));
          var custSub = document.createElement('span');
          custSub.className = 'booking-table__sub';
          custSub.textContent = b.customerEmail;
          custTd.appendChild(custSub);
          tr.appendChild(custTd);
        }

        var routeTd = cell(b.portOfLoading + ' → ' + b.portOfDischarge, 'booking-table__route');
        var routeSub = document.createElement('span');
        routeSub.className = 'booking-table__sub';
        routeSub.textContent = b.shipmentType;
        routeTd.appendChild(routeSub);
        tr.appendChild(routeTd);

        var cargoTd = cell(b.cargoType);
        var cargoSub = document.createElement('span');
        cargoSub.className = 'booking-table__sub';
        cargoSub.textContent = b.cargoWeight;
        cargoTd.appendChild(cargoSub);
        tr.appendChild(cargoTd);

        var vehTd = cell(b.vehicleType);
        var vehSub = document.createElement('span');
        vehSub.className = 'booking-table__sub';
        vehSub.textContent = b.vehicleNo;
        vehTd.appendChild(vehSub);
        tr.appendChild(vehTd);

        var transTd = cell(b.transportCompany);
        var transSub = document.createElement('span');
        transSub.className = 'booking-table__sub';
        transSub.textContent = b.driverName + ' · ' + b.driverPhone;
        transTd.appendChild(transSub);
        tr.appendChild(transTd);

        tr.appendChild(cell(b.eirNumber));

        var statusTd = document.createElement('td');
        statusTd.appendChild(statusPill(b.status));
        tr.appendChild(statusTd);

        var actionTd = document.createElement('td');
        var viewBtn = document.createElement('button');
        viewBtn.type = 'button';
        viewBtn.className = 'booking-table__btn';
        viewBtn.textContent = 'Details';
        viewBtn.addEventListener('click', function() { openBooking(b); });
        actionTd.appendChild(viewBtn);

        if (isAdmin && !session.demo) {
          var editBtn = document.createElement('button');
          editBtn.type = 'button';
          editBtn.className = 'booking-table__btn';
          editBtn.style.marginLeft = '6px';
          editBtn.textContent = 'Update';
          editBtn.addEventListener('click', function() { openJobForm('edit', b); });
          actionTd.appendChild(editBtn);
        }

        tr.appendChild(actionTd);

        dashRows.appendChild(tr);
      });

      renderPagination(list.length);
    }

    // ── Booking detail modal ──
    var modal = document.getElementById('booking-modal');
    var modalTitle = document.getElementById('booking-modal-title');
    var modalSubtitle = document.getElementById('booking-modal-subtitle');
    var modalBody = document.getElementById('booking-modal-body');
    var modalClose = document.getElementById('booking-modal-close');
    var lastFocused = null;

    function detailBlock(title, pairs) {
      var block = document.createElement('div');
      block.className = 'detail-block';

      var heading = document.createElement('div');
      heading.className = 'detail-block__title';
      heading.textContent = title;
      block.appendChild(heading);

      var grid = document.createElement('div');
      grid.className = 'detail-grid';
      pairs.forEach(function(pair) {
        var item = document.createElement('div');
        item.className = 'detail-item';
        var label = document.createElement('div');
        label.className = 'detail-item__label';
        label.textContent = pair[0];
        var value = document.createElement('div');
        value.className = 'detail-item__value';
        value.textContent = pair[1] || '—';
        item.appendChild(label);
        item.appendChild(value);
        grid.appendChild(item);
      });
      block.appendChild(grid);
      return block;
    }

    function openBooking(b) {
      lastFocused = document.activeElement;
      modalTitle.textContent = 'Job ' + b.jobId;

      modalSubtitle.textContent = '';
      modalSubtitle.appendChild(statusPill(b.status));
      var sub = document.createElement('span');
      sub.style.marginLeft = '10px';
      sub.textContent = b.portOfLoading + ' → ' + b.portOfDischarge;
      modalSubtitle.appendChild(sub);

      modalBody.textContent = '';

      if (isAdmin) {
        modalBody.appendChild(detailBlock('Customer', [
          ['Company', b.customerCompany],
          ['Contact', b.contactName],
          ['Email', b.customerEmail]
        ]));
      }

      modalBody.appendChild(detailBlock('Job', [
        ['Job ID', b.jobId],
        ['RFQ ID', b.rfqId],
        ['Enquiry Date', b.enquiryDate],
        ['Port of Loading', b.portOfLoading],
        ['Port of Discharge', b.portOfDischarge],
        ['Cargo Ready Date', b.readyDate]
      ]));

      modalBody.appendChild(detailBlock('Cargo', [
        ['Cargo Type', b.cargoType],
        ['Cargo Weight', b.cargoWeight],
        ['Shipment Type', b.shipmentType],
        ['Container Count', b.containerCount],
        ['Incoterm', b.incoterm]
      ]));

      modalBody.appendChild(detailBlock('Transport', [
        ['Transport Company', b.transportCompany],
        ['Type of Vehicle', b.vehicleType],
        ['Vehicle No.', b.vehicleNo],
        ['EIR Number', b.eirNumber],
        ['Pickup Date', b.pickupDate],
        ['Delivery Date', b.deliveryDate]
      ]));

      modalBody.appendChild(detailBlock('Driver', [
        ['Driver Name', b.driverName],
        ['Driver Phone', b.driverPhone],
        ['Driving Licence', b.driverLicence],
        ['Aadhaar', b.driverAadhaarLast4],
        ['Driver Pass No.', b.driverPassNo],
        ['Pass Valid Till', b.passValidTill]
      ]));

      modalBody.appendChild(detailBlock('Commercials', [
        ['Transport Charges', b.transportCharges],
        ['Payment Status', b.paymentStatus],
        ['Last Updated', b.lastUpdated],
        ['Remarks', b.remarks]
      ]));

      modal.hidden = false;
      modal.classList.add('modal--open');
      document.body.style.overflow = 'hidden';
      modalClose.focus();
    }

    function closeBooking() {
      modal.classList.remove('modal--open');
      modal.hidden = true;
      document.body.style.overflow = '';
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    modalClose.addEventListener('click', closeBooking);
    modal.addEventListener('click', function(e) {
      if (e.target === modal) closeBooking();
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal.classList.contains('modal--open')) closeBooking();
    });

    // ── Header, filters, session controls ──
    function renderIdentity() {
      var label = session.company || session.name || session.email;
      document.getElementById('dash-avatar').textContent = label.trim().charAt(0).toUpperCase();
      document.getElementById('dash-user-name').textContent = label;
      document.getElementById('dash-user-meta').textContent =
        (isAdmin ? 'Administrator · ' : 'Customer account · ') + session.email;

      if (isAdmin) {
        document.getElementById('dash-heading').textContent = 'All Customer Jobs';
        document.getElementById('dash-subheading').textContent =
          'Administrator view — every job across all customer accounts, with transporter, driver and EIR details.';
        customerColHead.hidden = false;
        dashCustomer.hidden = false;
      }
    }

    function renderCustomerFilter() {
      if (!isAdmin) return;
      var seen = {};
      allBookings.forEach(function(b) {
        if (b.customerEmail && !seen[b.customerEmail]) {
          seen[b.customerEmail] = b.customerCompany || b.customerEmail;
        }
      });

      // Rebuilt on every load, so keep the current choice across refreshes.
      var previous = dashCustomer.value;
      dashCustomer.textContent = '';
      var all = document.createElement('option');
      all.value = 'all';
      all.textContent = 'All customers';
      dashCustomer.appendChild(all);

      Object.keys(seen).sort().forEach(function(email) {
        var opt = document.createElement('option');
        opt.value = email;
        opt.textContent = seen[email];
        dashCustomer.appendChild(opt);
      });

      dashCustomer.value = seen[previous] ? previous : 'all';
    }

    function showNotice(text, kind) {
      dashNotice.textContent = '';
      var div = document.createElement('div');
      div.className = 'notice notice--' + kind;
      div.textContent = text;
      dashNotice.appendChild(div);
    }

    function revealDashboard() {
      dashGuard.hidden = true;
      dashContent.hidden = false;
    }

    function loadBookings() {
      if (session.demo) {
        allBookings = portalDemoBookings().map(normalizeBooking);
        showNotice(
          'Sample data — the job service is not connected, so these records are generated placeholders for layout preview only. They are not real jobs.',
          'warn'
        );
        renderIdentity();
        renderCustomerFilter();
        renderStats();
        renderTable();
        revealDashboard();
        return;
      }

      portalApi({
        type: 'customer-bookings',
        token: session.token,
        email: session.email,
        role: session.role
      }).then(function(res) {
        if (!res || res.status !== 'success') {
          portalClearSession();
          dashGuardMsg.textContent = (res && res.message) || 'Your session is no longer valid. Please sign in again.';
          dashGuardLink.style.display = '';
          return;
        }
        allBookings = (res.bookings || []).map(normalizeBooking);
        renderIdentity();
        renderCustomerFilter();
        renderStats();
        renderTable();
        if (!allBookings.length) {
          showNotice('No jobs are linked to this account yet. Once our team creates a job against one of your enquiries it will appear here automatically.', 'info');
        }
        revealDashboard();
        if (isAdmin) loadOpsQueue();
      }).catch(function() {
        dashGuardMsg.textContent = 'The booking service is not reachable right now. Please refresh in a moment.';
        dashGuardLink.style.display = '';
      });
    }

    // ── Admin ops: create a job from an RFQ, update an existing job ──
    var opsPanel = document.getElementById('ops-panel');
    var opsList = document.getElementById('ops-list');
    var jobModal = document.getElementById('job-form-modal');
    var jobForm = document.getElementById('job-form');
    var jobMsg = document.getElementById('jf-msg');
    var jobStatuses = Object.keys(PORTAL_STATUS).map(function(k) { return PORTAL_STATUS[k]; });
    var jobFormMode = 'create';
    var jobFormTarget = null;

    function loadOpsQueue() {
      if (!opsPanel || session.demo) return;
      opsPanel.hidden = false;
      opsList.textContent = 'Loading queue…';

      portalApi({ type: 'admin-jobs-queue', token: session.token }).then(function(res) {
        if (!res || res.status !== 'success') {
          opsList.textContent = (res && res.message) || 'Could not load the queue.';
          return;
        }
        if (res.statuses && res.statuses.length) jobStatuses = res.statuses;
        renderOpsQueue(res.awaiting || []);
      }).catch(function() {
        opsList.textContent = 'Queue unavailable right now.';
      });
    }

    function renderOpsQueue(rows) {
      opsList.textContent = '';

      if (!rows.length) {
        var empty = document.createElement('p');
        empty.className = 'ops__empty';
        empty.textContent = 'Every RFQ already has a job.';
        opsList.appendChild(empty);
        return;
      }

      rows.forEach(function(r) {
        var card = document.createElement('div');
        card.className = 'ops-card';

        var id = document.createElement('div');
        id.className = 'ops-card__id';
        id.textContent = r.rfqId + ' · ' + r.rfqStatus;
        card.appendChild(id);

        var meta = document.createElement('div');
        meta.className = 'ops-card__meta';
        [
          r.company || r.email,
          r.origin + ' → ' + r.destination,
          (r.commodity || '') + ' · ' + (r.cargoWeight || '')
        ].forEach(function(line, i) {
          if (i) meta.appendChild(document.createElement('br'));
          meta.appendChild(document.createTextNode(line));
        });
        card.appendChild(meta);

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ops-card__btn';
        btn.textContent = 'Create Job';
        btn.addEventListener('click', function() { openJobForm('create', r); });
        card.appendChild(btn);

        opsList.appendChild(card);
      });
    }

    function setJobField(id, value) {
      document.getElementById(id).value = value || '';
    }

    function fillStatusOptions(selected) {
      var sel = document.getElementById('jf-status');
      sel.textContent = '';
      jobStatuses.forEach(function(s) {
        var opt = document.createElement('option');
        opt.textContent = s;
        if (s === selected) opt.selected = true;
        sel.appendChild(opt);
      });
    }

    function openJobForm(mode, target) {
      jobFormMode = mode;
      jobFormTarget = target;
      portalHideMsg(jobMsg);

      ['jf-transport', 'jf-vehicle-type', 'jf-vehicle-no', 'jf-eir', 'jf-pickup', 'jf-delivery',
       'jf-driver-name', 'jf-driver-phone', 'jf-driver-dl', 'jf-driver-aadhaar', 'jf-driver-pass',
       'jf-pass-valid', 'jf-charges', 'jf-remarks'].forEach(function(id) { setJobField(id, ''); });

      document.getElementById('jf-charges-hint').textContent = '';
      var prefill = document.getElementById('job-form-prefill');
      prefill.textContent = '';

      if (mode === 'create') {
        document.getElementById('job-form-title').textContent = 'Create Job from ' + target.rfqId;
        document.getElementById('job-form-subtitle').textContent = 'Visible to ' + target.email;
        document.getElementById('jf-submit').textContent = 'Create Job';
        prefill.textContent = 'Loading enquiry…';
        fillStatusOptions('Booked');

        portalApi({ type: 'admin-rfq-prefill', token: session.token, rfqId: target.rfqId }).then(function(res) {
          if (!res || res.status !== 'success') {
            prefill.textContent = (res && res.message) || 'Could not load the RFQ.';
            return;
          }
          var d = res.rfq;
          prefill.textContent = d.company + ' (' + d.contactName + ') · ' + d.email +
            ' — ' + d.origin + ' → ' + d.destination +
            ' · ' + d.commodity + ' · ' + d.cargoWeight +
            ' · ' + d.shipmentType + ' · ' + d.containerCount + ' ctr · ' + d.incoterm;

          if (res.statuses && res.statuses.length) {
            jobStatuses = res.statuses;
            fillStatusOptions('Booked');
          }
          if (d.suggestedCharges) {
            setJobField('jf-charges', d.suggestedCharges);
            document.getElementById('jf-charges-hint').textContent = 'Pre-filled from the lowest quote on this RFQ.';
          }
          if (d.alreadyHasJob) {
            portalShowMsg(jobMsg, 'A job already exists for this RFQ.', 'error');
          }
        }).catch(function() {
          prefill.textContent = 'Could not load the RFQ.';
        });
      } else {
        document.getElementById('job-form-title').textContent = 'Update ' + target.jobId;
        document.getElementById('job-form-subtitle').textContent = target.rfqId + ' · ' + target.customerEmail;
        document.getElementById('jf-submit').textContent = 'Save Changes';
        prefill.textContent = target.portOfLoading + ' → ' + target.portOfDischarge +
          ' · ' + target.cargoType + ' · ' + target.cargoWeight;

        fillStatusOptions(PORTAL_STATUS[target.status]);
        var dash = '—';
        setJobField('jf-transport', target.transportCompany === dash ? '' : target.transportCompany);
        setJobField('jf-vehicle-type', target.vehicleType === dash ? '' : target.vehicleType);
        setJobField('jf-vehicle-no', target.vehicleNo === dash ? '' : target.vehicleNo);
        setJobField('jf-eir', target.eirNumber === dash ? '' : target.eirNumber);
        setJobField('jf-driver-name', target.driverName === dash ? '' : target.driverName);
        setJobField('jf-driver-phone', target.driverPhone === dash ? '' : target.driverPhone);
        setJobField('jf-driver-dl', target.driverLicence === dash ? '' : target.driverLicence);
        setJobField('jf-driver-pass', target.driverPassNo === dash ? '' : target.driverPassNo);
        setJobField('jf-charges', target.transportCharges === dash ? '' : target.transportCharges);
        setJobField('jf-remarks', target.remarks);
        document.getElementById('jf-payment').value =
          ['Pending', 'Partly Paid', 'Paid'].indexOf(target.paymentStatus) > -1 ? target.paymentStatus : 'Pending';
        document.getElementById('jf-charges-hint').textContent = 'Blank fields are left unchanged.';
      }

      jobModal.hidden = false;
      jobModal.classList.add('modal--open');
      document.body.style.overflow = 'hidden';
      document.getElementById('job-form-close').focus();
    }

    function closeJobForm() {
      jobModal.classList.remove('modal--open');
      jobModal.hidden = true;
      document.body.style.overflow = '';
      setJobField('jf-driver-aadhaar', '');
      jobFormTarget = null;
    }

    document.getElementById('job-form-close').addEventListener('click', closeJobForm);
    jobModal.addEventListener('click', function(e) { if (e.target === jobModal) closeJobForm(); });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && jobModal.classList.contains('modal--open')) closeJobForm();
    });
    document.getElementById('ops-refresh').addEventListener('click', loadOpsQueue);

    jobForm.addEventListener('submit', function(e) {
      e.preventDefault();
      if (!jobFormTarget) return;
      portalHideMsg(jobMsg);
      portalBusy(jobForm, true, 'Saving…');

      var fields = {
        transportCompany: document.getElementById('jf-transport').value.trim(),
        vehicleType: document.getElementById('jf-vehicle-type').value.trim(),
        vehicleNo: document.getElementById('jf-vehicle-no').value.trim(),
        eirNumber: document.getElementById('jf-eir').value.trim(),
        pickupDate: document.getElementById('jf-pickup').value,
        deliveryDate: document.getElementById('jf-delivery').value,
        driverName: document.getElementById('jf-driver-name').value.trim(),
        driverPhone: document.getElementById('jf-driver-phone').value.trim(),
        driverLicence: document.getElementById('jf-driver-dl').value.trim(),
        driverAadhaar: document.getElementById('jf-driver-aadhaar').value.trim(),
        driverPassNo: document.getElementById('jf-driver-pass').value.trim(),
        passValidTill: document.getElementById('jf-pass-valid').value,
        status: document.getElementById('jf-status').value,
        transportCharges: document.getElementById('jf-charges').value.trim(),
        paymentStatus: document.getElementById('jf-payment').value,
        remarks: document.getElementById('jf-remarks').value.trim()
      };

      var payload = jobFormMode === 'create'
        ? { type: 'admin-create-job', token: session.token, rfqId: jobFormTarget.rfqId, fields: fields }
        : { type: 'admin-update-job', token: session.token, jobId: jobFormTarget.jobId, fields: fields };

      portalApi(payload).then(function(res) {
        portalBusy(jobForm, false);
        if (!res || res.status !== 'success') {
          portalShowMsg(jobMsg, (res && res.message) || 'Could not save the job.', 'error');
          return;
        }
        setJobField('jf-driver-aadhaar', '');
        closeJobForm();
        currentPage = 1;
        loadBookings();
      }).catch(function() {
        portalBusy(jobForm, false);
        portalShowMsg(jobMsg, 'The service is not reachable right now. Please try again.', 'error');
      });
    });

    dashSearch.addEventListener('input', function() {
      currentPage = 1;
      renderTable();
    });
    dashStatus.addEventListener('change', function() {
      currentPage = 1;
      renderTable();
    });
    dashCustomer.addEventListener('change', function() {
      currentPage = 1;
      renderTable();
    });

    document.getElementById('dash-refresh').addEventListener('click', function() {
      currentPage = 1;
      loadBookings();
    });

    document.getElementById('dash-logout').addEventListener('click', function() {
      portalClearSession();
      window.location.href = 'login.html';
    });

    loadBookings();
  }

  // ─── 13. Sample Booking Generator (layout preview only) ────
  // Produces clearly-labelled placeholder records. Never presented as real
  // job data — the dashboard always shows a warning banner alongside it.
  function portalDemoBookings() {
    var params = new URLSearchParams(window.location.search);
    var requested = parseInt(params.get('records'), 10);
    var count = Math.min(100, Math.max(10, isNaN(requested) ? 42 : requested));

    var seed = 20260906;
    var rand = function(max) {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return Math.floor((seed / 2147483648) * max);
    };

    var loadPorts = [
      'Chennai', 'Nhava Sheva (JNPT)', 'Mundra', 'Kattupalli', 'Cochin',
      'Visakhapatnam', 'Haldia', 'Deendayal (Kandla)', 'V.O. Chidambaranar (Tuticorin)',
      'Krishnapatnam', 'Pipavav', 'Kamarajar (Ennore)'
    ];
    var dischargePorts = [
      'ICD Bangalore', 'ICD Tughlakabad', 'ICD Whitefield', 'ICD Sanathnagar',
      'ICD Hyderabad', 'ICD Ludhiana', 'ICD Nagpur', 'ICD Coimbatore',
      'ICD Ahmedabad', 'ICD Jaipur'
    ];
    var vehicleTypes = [
      '20ft Trailer', '40ft Trailer', 'Multi-Axle Trailer', 'Low-Bed Trailer',
      '32ft Single Axle', '32ft Multi Axle', 'Container Truck 14T', 'Reefer Truck'
    ];
    var shipmentTypes = ['FCL 20ft', 'FCL 40ft', 'FCL 40ft HC', 'LCL', 'Reefer 20ft', 'Reefer 40ft'];
    var commodities = [
      'Cotton yarn', 'Basmati rice', 'Pharmaceutical formulations', 'Auto components',
      'Granite slabs', 'Frozen marine products', 'Engineering goods', 'Textiles and apparel',
      'Ceramic tiles', 'Organic chemicals', 'Leather goods', 'Spices'
    ];
    var incoterms = ['FOB', 'CIF', 'CFR', 'EXW', 'DAP', 'FCA'];
    var statuses = ['booked', 'assigned', 'loading', 'loaded', 'transit', 'gatein', 'delivered', 'hold'];
    var stateCodes = ['TN', 'KA', 'MH', 'GJ', 'AP', 'TS', 'KL', 'DL', 'HR', 'WB'];
    var companies = [
      'Sample Exports Pvt Ltd', 'Sample Textiles Ltd', 'Sample Agro Traders',
      'Sample Pharma Exports', 'Sample Engineering Works'
    ];

    var pad = function(n, len) {
      var s = String(n);
      while (s.length < len) s = '0' + s;
      return s;
    };
    var dateStr = function(offsetDays) {
      var d = new Date(Date.now() + offsetDays * 86400000);
      return d.toISOString().slice(0, 10);
    };

    var jobs = [];
    for (var i = 1; i <= count; i++) {
      var status = statuses[rand(statuses.length)];
      var booked = -(rand(120) + 5);
      var num = pad(i, 3);
      var hasEir = ['loaded', 'transit', 'gatein', 'delivered'].indexOf(status) > -1;

      jobs.push({
        jobId: 'ME-JOB-' + num,
        rfqId: 'ME-RFQ-' + num,
        enquiryDate: dateStr(booked),
        customerCompany: companies[i % companies.length],
        customerEmail: 'sample' + ((i % companies.length) + 1) + '@example.com',
        contactName: 'Contact ' + pad((i % 9) + 1, 2) + ' [placeholder]',
        portOfLoading: loadPorts[rand(loadPorts.length)],
        portOfDischarge: dischargePorts[rand(dischargePorts.length)],
        shipmentType: shipmentTypes[rand(shipmentTypes.length)],
        cargoType: commodities[rand(commodities.length)],
        cargoWeight: (2000 + rand(24000)) + ' kg',
        containerCount: String(1 + rand(4)),
        incoterm: incoterms[rand(incoterms.length)],
        readyDate: dateStr(booked + 3),
        transportCompany: 'Sample Transporter ' + pad((i % 12) + 1, 2),
        vehicleType: vehicleTypes[rand(vehicleTypes.length)],
        vehicleNo: stateCodes[i % stateCodes.length] + ' ' + pad(rand(48) + 1, 2) + ' XX ' + pad(rand(9999), 4),
        driverName: 'Driver ' + pad((i % 25) + 1, 2) + ' [placeholder]',
        driverPhone: '+91 98XXX XX' + pad((i % 25) + 1, 3),
        driverLicence: stateCodes[i % stateCodes.length] + pad(rand(99), 2) + ' XXXXXXX' + pad((i % 25) + 1, 3),
        driverAadhaarLast4: 'XXXX XXXX ' + pad(rand(9999), 4),
        driverPassNo: 'PASS-' + pad(rand(9999), 4),
        passValidTill: dateStr(booked + 90),
        eirNumber: hasEir ? 'EIR' + pad(100000 + rand(899999), 6) : 'Not issued yet',
        status: status,
        transportCharges: '₹' + (18 + rand(60)) + ',000 [placeholder]',
        paymentStatus: rand(2) ? 'Paid' : 'Pending',
        pickupDate: dateStr(booked + 4),
        deliveryDate: status === 'delivered' ? dateStr(booked + 12 + rand(8)) : 'Not yet delivered',
        lastUpdated: dateStr(-rand(5)),
        remarks: 'SAMPLE RECORD — not a real job'
      });
    }
    return jobs;
  }
});