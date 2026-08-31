/**
 * AOSHA Platform - Interactive JavaScript
 * Modular Vanilla JS for Moodle Session Detection, i18n Language Switcher, Theme Switcher, Navigation, FAQ, and Modals
 */

(function () {
  'use strict';

  // Configuration
  const CONFIG = {
    moodleUrl: 'https://lms.aosha.sa',
    loginStatusFile: '/login_status.php',
    demoModalId: 'demo-modal',
    themeStorageKey: 'aosha_theme_mode',
    langStorageKey: 'aosha_lang_mode',
    toastTimeout: 4000
  };

  // State
  const state = {
    moodleUser: null,
    isMenuOpen: false,
    isModalOpen: false,
    currentTheme: 'dark',
    currentLang: 'ar'
  };

  // DOM Elements
  const header = document.getElementById('main-header');
  const mobileMenuBtn = document.getElementById('mobile-menu-toggle');
  const navMenu = document.getElementById('nav-menu');
  const userChip = document.getElementById('moodle-user-chip');
  const userBtn = document.getElementById('user-badge-btn');
  const userDropdown = document.getElementById('user-dropdown');
  const userNameEl = document.getElementById('user-name-text');
  const userAvatarEl = document.getElementById('user-avatar-placeholder');
  const guestLoginBtn = document.getElementById('guest-login-btn');
  const modalOverlay = document.getElementById(CONFIG.demoModalId);
  const demoForm = document.getElementById('demo-request-form');
  const themeToggleBtns = document.querySelectorAll('.theme-toggle-btn');
  const langBtns = document.querySelectorAll('.lang-btn');

  /**
   * 1. Bilingual Internationalization (AR / EN Switcher)
   */
  function initLanguage() {
    let savedLang = 'ar';
    try {
      savedLang = localStorage.getItem(CONFIG.langStorageKey) || 'ar';
    } catch (e) {
      savedLang = 'ar';
    }

    setLanguage(savedLang, false);

    langBtns.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const selected = this.getAttribute('data-lang');
        if (selected && selected !== state.currentLang) {
          setLanguage(selected, true);
        }
      });
    });
  }

  function setLanguage(lang, savePreference) {
    if (typeof TRANSLATIONS === 'undefined' || !TRANSLATIONS[lang]) return;
    state.currentLang = lang;
    const t = TRANSLATIONS[lang];

    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    if (t.page_title) {
      document.title = t.page_title;
    }

    // Update active class on all lang buttons
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      const bLang = btn.getAttribute('data-lang');
      btn.classList.toggle('active', bLang === lang);
      btn.setAttribute('aria-pressed', bLang === lang ? 'true' : 'false');
    });

    // Update plain text content
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      const key = el.getAttribute('data-i18n');
      if (t[key] !== undefined) {
        el.textContent = t[key];
      }
    });

    // Update HTML content (with markup)
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      const key = el.getAttribute('data-i18n-html');
      if (t[key] !== undefined) {
        el.innerHTML = t[key];
      }
    });

    // Update input placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      const key = el.getAttribute('data-i18n-placeholder');
      if (t[key] !== undefined) {
        el.setAttribute('placeholder', t[key]);
      }
    });

    // Update titles / tooltips
    document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      const key = el.getAttribute('data-i18n-title');
      if (t[key] !== undefined) {
        el.setAttribute('title', t[key]);
      }
    });

    if (savePreference) {
      try {
        localStorage.setItem(CONFIG.langStorageKey, lang);
      } catch (e) {
        console.warn('LocalStorage not available for language preference');
      }
    }
  }

  /**
   * 2. Instant Light / Dark Mode Switcher (No Page Reload)
   */
  function initTheme() {
    let savedTheme = 'dark';
    try {
      savedTheme = localStorage.getItem(CONFIG.themeStorageKey) || 'dark';
    } catch (e) {
      savedTheme = 'dark';
    }

    setTheme(savedTheme, false);

    themeToggleBtns.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const newTheme = state.currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme, true);
      });
    });
  }

  function setTheme(theme, savePreference) {
    state.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);

    themeToggleBtns.forEach(function (btn) {
      const label = theme === 'dark' ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن';
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', label);
    });

    if (savePreference) {
      try {
        localStorage.setItem(CONFIG.themeStorageKey, theme);
      } catch (e) {
        console.warn('LocalStorage not available');
      }
    }
  }

  /**
   * 3. Detect Moodle Session via login_status.php
   */
  function detectMoodleSession() {
    if (!window.fetch) return;

    const endpoint = CONFIG.moodleUrl + CONFIG.loginStatusFile;

    fetch(endpoint, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(function (data) {
        if (data && data.loggedin) {
          state.moodleUser = {
            id: data.id || null,
            username: data.username || '',
            fullname: data.fullname || data.username || 'User',
            firstname: data.firstname || '',
            avatar: data.avatar || ''
          };
          renderLoggedInState();
        } else {
          renderGuestState();
        }
      })
      .catch(function (error) {
        console.info('[AOSHA Moodle Bridge] Session check inactive or cross-origin pending:', error.message);
        renderGuestState();
      });
  }

  /**
   * Render User Logged In UI
   */
  function renderLoggedInState() {
    if (!userChip) return;

    const user = state.moodleUser;
    const displayName = user.firstname || user.fullname.split(' ')[0] || user.fullname;

    if (userNameEl) {
      userNameEl.textContent = displayName;
      userNameEl.setAttribute('title', user.fullname);
    }

    if (userAvatarEl) {
      if (user.avatar && user.avatar.length > 5) {
        userAvatarEl.innerHTML = '<img src="' + user.avatar + '" alt="' + user.fullname + '" />';
      } else {
        const initial = (user.fullname || 'U').charAt(0).toUpperCase();
        userAvatarEl.textContent = initial;
      }
    }

    userChip.classList.add('is-active');
    if (guestLoginBtn) {
      guestLoginBtn.style.display = 'none';
    }

    const mobileLoginLink = document.querySelector('.mobile-login-link');
    if (mobileLoginLink) {
      mobileLoginLink.textContent = 'LMS (' + displayName + ')';
      mobileLoginLink.href = CONFIG.moodleUrl + '/my/';
    }
  }

  /**
   * Render Guest UI
   */
  function renderGuestState() {
    if (userChip) {
      userChip.classList.remove('is-active');
    }
    if (guestLoginBtn) {
      guestLoginBtn.style.display = 'inline-flex';
    }
  }

  /**
   * 4. Header Scroll Effect
   */
  function handleHeaderScroll() {
    if (!header) return;
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  /**
   * 5. Mobile Menu Toggle
   */
  function setupMobileMenu() {
    if (!mobileMenuBtn || !navMenu) return;

    mobileMenuBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      state.isMenuOpen = !state.isMenuOpen;
      navMenu.classList.toggle('open', state.isMenuOpen);
      mobileMenuBtn.setAttribute('aria-expanded', state.isMenuOpen);
    });

    const links = navMenu.querySelectorAll('a');
    links.forEach(function (link) {
      link.addEventListener('click', function () {
        state.isMenuOpen = false;
        navMenu.classList.remove('open');
      });
    });

    document.addEventListener('click', function (e) {
      if (state.isMenuOpen && !navMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
        state.isMenuOpen = false;
        navMenu.classList.remove('open');
      }
    });
  }

  /**
   * 6. User Dropdown Toggle
   */
  function setupUserDropdown() {
    if (!userBtn || !userDropdown) return;

    userBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      userDropdown.classList.toggle('show');
    });

    document.addEventListener('click', function (e) {
      if (!userDropdown.contains(e.target) && !userBtn.contains(e.target)) {
        userDropdown.classList.remove('show');
      }
    });
  }

  /**
   * 7. FAQ Accordion
   */
  function setupFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    if (!faqItems.length) return;

    faqItems.forEach(function (item) {
      const questionBtn = item.querySelector('.faq-question');
      if (!questionBtn) return;

      questionBtn.addEventListener('click', function () {
        const isActive = item.classList.contains('active');

        faqItems.forEach(function (otherItem) {
          if (otherItem !== item) {
            otherItem.classList.remove('active');
            const otherBtn = otherItem.querySelector('.faq-question');
            if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
          }
        });

        item.classList.toggle('active', !isActive);
        questionBtn.setAttribute('aria-expanded', !isActive ? 'true' : 'false');
      });
    });
  }

  /**
   * 8. Demo Request Modal
   */
  function setupModal() {
    if (!modalOverlay) return;

    const openBtns = document.querySelectorAll('[data-open-modal="demo"]');
    openBtns.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        openModal();
      });
    });

    const closeBtns = modalOverlay.querySelectorAll('[data-close-modal]');
    closeBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        closeModal();
      });
    });

    modalOverlay.addEventListener('click', function (e) {
      if (e.target === modalOverlay) {
        closeModal();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && state.isModalOpen) {
        closeModal();
      }
    });

    if (demoForm) {
      demoForm.addEventListener('submit', function (e) {
        e.preventDefault();
        handleFormSubmit(this);
      });
    }
  }

  function openModal() {
    if (!modalOverlay) return;
    state.isModalOpen = true;
    modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modalOverlay) return;
    state.isModalOpen = false;
    modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  function handleFormSubmit(form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerHTML : '';

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>' + (state.currentLang === 'ar' ? 'جاري الإرسال...' : 'Submitting...') + '</span>';
    }

    setTimeout(function () {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
      form.reset();
      closeModal();
      const msg = typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[state.currentLang]
        ? TRANSLATIONS[state.currentLang].toast_success
        : 'شكراً لتواصلك مع أوشى!';
      showToast(msg);
    }, 1200);
  }

  /**
   * 9. Toast Notifications
   */
  function showToast(message) {
    let toast = document.getElementById('aosha-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'aosha-toast';
      toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: #112613;
        color: #fffad1;
        padding: 16px 28px;
        border-radius: 12px;
        border: 1px solid #cba321;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        font-weight: 700;
        font-size: 0.95rem;
        z-index: 9999;
        transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
        opacity: 0;
        text-align: center;
        max-width: 90%;
      `;
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';

    setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(100px)';
    }, CONFIG.toastTimeout);
  }

  /**
   * 10. Animated Counters on Scroll
   */
  function setupCounters() {
    const counterEls = document.querySelectorAll('.counter-val');
    if (!counterEls.length || !window.IntersectionObserver) return;

    const observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.getAttribute('data-target'), 10) || 0;
          let current = 0;
          const duration = 1500;
          const stepTime = 30;
          const totalSteps = duration / stepTime;
          const increment = Math.ceil(target / totalSteps) || 1;

          const timer = setInterval(function () {
            current += increment;
            if (current >= target) {
              el.textContent = target;
              clearInterval(timer);
            } else {
              el.textContent = current;
            }
          }, stepTime);

          obs.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    counterEls.forEach(function (el) {
      observer.observe(el);
    });
  }

  /**
   * 11. Back to Top Button
   */
  function setupBackToTop() {
    const backToTopBtn = document.getElementById('back-to-top');
    if (!backToTopBtn) return;

    window.addEventListener('scroll', function () {
      if (window.scrollY > 400) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    }, { passive: true });

    backToTopBtn.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  /**
   * 12. WebMCP (Web Model Context Protocol) Browser Integration
   */
  function initWebMCP() {
    const modelContext = (typeof navigator !== 'undefined' && navigator.modelContext) 
      || (typeof window !== 'undefined' && window.modelContext);

    // Expose fallback agent helper on window for browser-based AI sidecars & extensions
    window.AOSHA_AGENT_TOOLS = {
      getOverview: function () {
        return {
          platform: 'AOSHA Unified Platform',
          tracks: [
            { id: 1, name: 'Facility Classification (Six Stars)', url: 'https://aosha.sa/#track-1' },
            { id: 2, name: 'HSSE Management Systems', url: 'https://aosha.sa/#track-2' },
            { id: 3, name: 'Inspection, Auditing & Reporting', url: 'https://aosha.sa/#track-3' },
            { id: 4, name: 'Training & Qualifications (LMS)', url: 'https://aosha.sa/#track-4', lmsUrl: 'https://lms.aosha.sa' }
          ],
          contact: { email: 'info@aosha.sa', phone: '00966504351155', location: 'Riyadh, KSA' }
        };
      },
      openDemoModal: function (track) {
        openModal();
        if (track) {
          const sel = document.getElementById('interested-track');
          if (sel) sel.value = track;
        }
        return { status: 'modal_opened', message: 'Demo request modal opened successfully' };
      }
    };

    if (!modelContext || typeof modelContext.provideContext !== 'function') {
      return;
    }

    try {
      modelContext.provideContext({
        name: 'AOSHA Platform Assistant',
        description: 'Enables AI agents to query AOSHA facility classification, safety courses, inspection templates, and book enterprise demos.',
        tools: [
          {
            name: 'get_aosha_overview',
            description: 'Get an overview of AOSHA four operational tracks and portal endpoints.',
            inputSchema: {
              type: 'object',
              properties: {}
            },
            execute: async function () {
              return {
                platform: 'AOSHA Platform',
                description: 'Integrated B2B SaaS for Classification, HSSE, Inspection, and LMS Training.',
                portalUrl: 'https://aosha.sa',
                moodleLmsUrl: 'https://lms.aosha.sa',
                hq: 'Riyadh, Saudi Arabia'
              };
            }
          },
          {
            name: 'request_demo',
            description: 'Trigger the interactive demo request form for an organization.',
            inputSchema: {
              type: 'object',
              properties: {
                track: {
                  type: 'string',
                  enum: ['all', 'classification', 'hsse', 'audit', 'lms'],
                  description: 'Target operational track'
                }
              }
            },
            execute: async function (args) {
              openModal();
              if (args && args.track) {
                const sel = document.getElementById('interested-track');
                if (sel) sel.value = args.track;
              }
              return { success: true, message: 'Demo modal opened for user' };
            }
          }
        ]
      });
      console.info('[AOSHA WebMCP] Context provided successfully to browser modelContext');
    } catch (e) {
      console.warn('[AOSHA WebMCP] Registration notice:', e.message);
    }
  }

  /**
   * Initialize Everything on DOM Load
   */
  document.addEventListener('DOMContentLoaded', function () {
    initLanguage();
    initTheme();
    detectMoodleSession();
    setupMobileMenu();
    setupUserDropdown();
    setupFAQ();
    setupModal();
    setupCounters();
    setupBackToTop();
    initWebMCP();

    window.addEventListener('scroll', handleHeaderScroll, { passive: true });
    handleHeaderScroll();
  });

})();
