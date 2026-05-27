/**
 * ADA MONTOYA — PORTFOLIO
 * main.js
 *
 * TABLE OF CONTENTS
 * ─────────────────
 * 1.  Utility helpers
 * 2.  Custom cursor
 * 3.  Sticky navigation
 * 4.  Mobile menu
 * 5.  Smooth scroll (anchor links)
 * 6.  Scroll reveal (IntersectionObserver)
 * 7.  Contact form validation & submission
 * 8.  Footer — auto year
 * 9.  Init (runs everything)
 */

'use strict';

/* ================================================================
   1. UTILITY HELPERS
================================================================ */

/**
 * Shorthand querySelector
 * @param {string} selector
 * @param {Element} [scope=document]
 * @returns {Element|null}
 */
const $ = (selector, scope = document) => scope.querySelector(selector);

/**
 * Shorthand querySelectorAll → Array
 * @param {string} selector
 * @param {Element} [scope=document]
 * @returns {Element[]}
 */
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

/**
 * Add event listener with optional delegation
 */
const on = (el, event, handler) => el?.addEventListener(event, handler);


/* ================================================================
   2. CUSTOM CURSOR
   Smooth lagging cursor that follows the mouse with lerp.
   Expands on hover over interactive elements.
================================================================ */
function initCursor() {
  const cursor = $('#cursor');

  // Don't run on touch devices
  if (!cursor || window.matchMedia('(hover: none)').matches) return;

  let mouseX = -100, mouseY = -100;   // raw mouse position
  let cursorX = -100, cursorY = -100; // smoothed position
  let rafId;

  // Track mouse position
  on(document, 'mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // Lerp (linear interpolate) for smooth lag
  function lerp(start, end, factor) {
    return start + (end - start) * factor;
  }

  function animateCursor() {
    cursorX = lerp(cursorX, mouseX, 0.6);
    cursorY = lerp(cursorY, mouseY, 0.6);

    cursor.style.left = `${cursorX}px`;
    cursor.style.top  = `${cursorY}px`;

    rafId = requestAnimationFrame(animateCursor);
  }

  animateCursor();

  // Expand on hover over interactive elements
  const hoverTargets = $$('a, button, .project-card, .skill-pill, .social-btn, input, textarea');

  hoverTargets.forEach((el) => {
    on(el, 'mouseenter', () => cursor.classList.add('is-expanded'));
    on(el, 'mouseleave', () => cursor.classList.remove('is-expanded'));
  });

  // Shrink when leaving the window
  on(document, 'mouseleave', () => cursor.classList.remove('is-expanded'));
}


/* ================================================================
   3. STICKY NAVIGATION
   Adds .is-scrolled class after user scrolls past 60px,
   which triggers the frosted glass effect in CSS.
================================================================ */
function initStickyNav() {
  const nav = $('#nav');
  if (!nav) return;

  const THRESHOLD = 60;

  function updateNav() {
    nav.classList.toggle('is-scrolled', window.scrollY > THRESHOLD);
  }

  // Use passive listener for scroll performance
  on(window, 'scroll', updateNav, { passive: true });

  // Run once on load in case page is already scrolled
  updateNav();
}


/* ================================================================
   4. MOBILE MENU
   Toggles the mobile nav drawer open/closed.
   Also closes when a nav link is clicked (smooth UX).
================================================================ */
function initMobileMenu() {
  const hamburger = $('#hamburger');
  const mobileMenu = $('#mobileMenu');
  if (!hamburger || !mobileMenu) return;

  function openMenu() {
    hamburger.classList.add('is-open');
    mobileMenu.classList.add('is-open');
    hamburger.setAttribute('aria-expanded', 'true');
    mobileMenu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // prevent scroll behind menu
  }

  function closeMenu() {
    hamburger.classList.remove('is-open');
    mobileMenu.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function toggleMenu() {
    const isOpen = hamburger.classList.contains('is-open');
    isOpen ? closeMenu() : openMenu();
  }

  on(hamburger, 'click', toggleMenu);

  // Close on link click
  $$('.mobile-link', mobileMenu).forEach((link) => {
    on(link, 'click', closeMenu);
  });

  // Close on Escape key
  on(document, 'keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
}


/* ================================================================
   5. SMOOTH SCROLL
   Handles anchor link clicks with offset for sticky nav height.
================================================================ */
function initSmoothScroll() {
  on(document, 'click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const target = $(link.getAttribute('href'));
    if (!target) return;

    e.preventDefault();

    // Offset for fixed nav height
    const navHeight = $('#nav')?.offsetHeight ?? 70;
    const targetTop = target.getBoundingClientRect().top + window.scrollY - navHeight;

    window.scrollTo({ top: targetTop, behavior: 'smooth' });
  });
}


/* ================================================================
   6. SCROLL REVEAL
   Uses IntersectionObserver to add .is-visible when elements
   enter the viewport. CSS handles the transition.
================================================================ */
function initScrollReveal() {
  const revealEls = $$('.reveal');
  if (!revealEls.length) return;

  // Respect reduced motion preference
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target); // fire once only
        }
      });
    },
    {
      threshold: 0.1,    // trigger when 10% visible
      rootMargin: '0px 0px -40px 0px', // slight bottom offset
    }
  );

  revealEls.forEach((el) => observer.observe(el));
}


/* ================================================================
   7. CONTACT FORM
   Client-side validation + submission handler.
   Replace the fake submit with a real API call (e.g. Formspree).
================================================================ */
function initContactForm() {
  const form = $('#contactForm');
  if (!form) return;

  const submitBtn = $('#submitBtn', form);

  /**
   * Validate a single field
   * @param {HTMLElement} input
   * @returns {boolean} isValid
   */
  function validateField(input) {
    const group = input.closest('.form-group');
    const errorEl = $('.form-error', group);
    let errorMsg = '';

    if (!input.value.trim()) {
      errorMsg = 'This field is required.';
    } else if (input.type === 'email') {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(input.value)) {
        errorMsg = 'Please enter a valid email address.';
      }
    } else if (input.tagName === 'TEXTAREA' && input.value.trim().length < 10) {
      errorMsg = 'Your message is a little short — tell me more!';
    }

    group.classList.toggle('is-error', !!errorMsg);
    if (errorEl) errorEl.textContent = errorMsg;

    return !errorMsg;
  }

  // Live validation: clear error once user starts fixing the field
  $$('input, textarea', form).forEach((input) => {
    on(input, 'input', () => {
      const group = input.closest('.form-group');
      if (group.classList.contains('is-error')) {
        validateField(input);
      }
    });
  });

  /**
   * Set button to success / loading / idle state
   * @param {'loading'|'sent'|'idle'} state
   */
  function setButtonState(state) {
    const states = {
      loading: { text: 'Sending…',      cls: '',         disabled: true },
      sent:    { text: '✓ Message Sent', cls: 'is-sent',  disabled: true },
      idle:    {
        text: `Send Message <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                 <path d="M2 8h12M10 4l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
               </svg>`,
        cls: '',
        disabled: false
      },
    };

    const s = states[state];
    submitBtn.innerHTML  = s.text;
    submitBtn.className  = `btn btn--submit ${s.cls}`.trim();
    submitBtn.disabled   = s.disabled;
  }

  on(form, 'submit', async (e) => {
    e.preventDefault();

    // Validate all fields
    const fields = $$('input, textarea', form);
    const allValid = fields.map(validateField).every(Boolean);
    if (!allValid) return;

    setButtonState('loading');

    try {
      const response = await fetch('https://formspree.io/f/xeedpnao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          name:    form.name.value,
          email:   form.email.value,
          message: form.message.value,
        }),
      });
      if (!response.ok) throw new Error('Network error');

      setButtonState('sent');
      form.reset();

      // Reset button after 4 seconds
      setTimeout(() => setButtonState('idle'), 4000);

    } catch (err) {
      console.error('Form submission error:', err);
      submitBtn.textContent = 'Something went wrong — try again';
      submitBtn.style.background = '#d04040';
      submitBtn.disabled = false;

      setTimeout(() => setButtonState('idle'), 3000);
    }
  });
}


/* ================================================================
   8. AUTO YEAR
   Keeps the footer copyright year always current.
================================================================ */
function initAutoYear() {
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}


/* ================================================================
   9. INIT
   Run everything once the DOM is ready.
================================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initCursor();
  initStickyNav();
  initMobileMenu();
  initSmoothScroll();
  initScrollReveal();
  initContactForm();
  initAutoYear();
});
