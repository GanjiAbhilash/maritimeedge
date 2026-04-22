// ========== Mobile Nav Toggle ==========
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.navbar__toggle');
  const menu = document.querySelector('.navbar__menu');

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      menu.classList.toggle('navbar__menu--open');
      toggle.classList.toggle('active');
    });

    // Close menu on link click
    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        menu.classList.remove('navbar__menu--open');
        toggle.classList.remove('active');
      });
    });
  }

  // ========== Navbar Scroll Effect ==========
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('navbar--scrolled', window.scrollY > 10);
    });
  }

  // ========== Newsletter Form ==========
  const newsletterForm = document.querySelector('.newsletter__form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = newsletterForm.querySelector('.newsletter__input');
      if (input && input.value.trim()) {
        alert('Thank you for subscribing! You\'ll receive our latest updates.');
        input.value = '';
      }
    });
  }

  // ========== RFQ / Contact Form ==========
  const rfqForm = document.getElementById('rfq-form');
  if (rfqForm) {
    rfqForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const success = document.querySelector('.form__success');
      if (success) {
        success.classList.add('show');
        rfqForm.reset();
        setTimeout(() => success.classList.remove('show'), 5000);
      }
    });
  }

  // ========== Filter Buttons ==========
  const filterBtns = document.querySelectorAll('.filter-bar__btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const parent = btn.closest('.filter-bar');
      parent.querySelectorAll('.filter-bar__btn').forEach(b => b.classList.remove('filter-bar__btn--active'));
      btn.classList.add('filter-bar__btn--active');

      const filter = btn.dataset.filter;
      const cards = btn.closest('.section, main').querySelectorAll('[data-category]');
      cards.forEach(card => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // ========== Active Nav Link ==========
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar__link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('navbar__link--active');
    }
  });
});
