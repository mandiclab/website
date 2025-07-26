document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('theme-toggle');
  const langToggle = document.getElementById('lang-toggle');
  const root = document.documentElement;
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');

  let theme = localStorage.getItem('theme') || 'dark';
  let lang = localStorage.getItem('lang') || 'en';
  let allowHideNavbar = true;
  let lastScroll = 0;

  root.setAttribute('data-theme', theme);

  function setFavicon(theme) {
    const faviconPath = theme === "light"
      ? "assets/favicon/favicon-dark.ico"
      : "assets/favicon/favicon-light.ico";

    // ukloni stare favicone
    const existing = document.querySelectorAll("link[rel='icon']");
    existing.forEach(el => el.remove());

    // dodaj novi favicon
    const link = document.createElement("link");
    link.rel = "icon";
    link.href = faviconPath;
    document.head.appendChild(link);
  }

  setFavicon(theme); // inicijalno postavi favicon

  const translations = {
    en: {
      home: "Home",
      whatsnew: "What's New",
      projects: "Projects",
      about: "About",
      contact: "Contact",
      language: "English"
    },
    sr: {
      home: "Почетна",
      whatsnew: "Шта је ново",
      projects: "Пројекти",
      about: "О нама",
      contact: "Контакт",
      language: "Српски"
    }
  };

  function updateThemeIcon(currentLang) {
    if (!currentLang) currentLang = localStorage.getItem('lang') || 'en';
    const currentTheme = root.getAttribute('data-theme') || 'dark';
    const themeLabels = {
      en: { dark: 'Dark', light: 'Light' },
      sr: { dark: 'Тамно', light: 'Светло' }
    };
    themeToggle.textContent = themeLabels[currentLang][currentTheme];
  }

  function setLanguage(selectedLang) {
    lang = selectedLang;

    document.querySelectorAll('[data-lang]').forEach(el => {
      const isTarget = el.getAttribute('data-lang') === lang;
      el.hidden = !isTarget;

      const originalId = el.getAttribute('data-original-id');
      const id = originalId || el.getAttribute('id');
      if (!isTarget && id) {
        el.removeAttribute('id');
        el.setAttribute('data-original-id', id);
      } else if (isTarget && !el.getAttribute('id') && originalId) {
        el.setAttribute('id', originalId);
        el.removeAttribute('data-original-id');
      }
    });

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (translations[lang][key]) {
        el.textContent = translations[lang][key];
      }
    });

    localStorage.setItem('lang', lang);
    updateThemeIcon(lang);
    refreshObservers();
    window.dispatchEvent(new Event('scroll'));
  }

  // Theme toggle
  themeToggle.addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    setFavicon(theme);
    updateThemeIcon(lang);
  });

  // Language toggle
  langToggle.addEventListener('click', () => {
    lang = lang === 'en' ? 'sr' : 'en';
    setLanguage(lang);
  location.reload();
  });

  // Scroll fade-in
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  function refreshObservers() {
    observer.disconnect();
    document.querySelectorAll('.fade-section').forEach(section => {
      if (!section.hidden) observer.observe(section);
    });
  }

  refreshObservers();

  // Sticky navbar
  window.addEventListener('scroll', () => {
    if (!allowHideNavbar) return;

    const currentScroll = window.pageYOffset;
    navbar.style.top = (currentScroll > lastScroll && currentScroll > 100) ? '-100px' : '0';
    lastScroll = currentScroll;

    // Update active nav link
    const sections = Array.from(document.querySelectorAll('section[id]')).filter(s => !s.hidden);
    let currentSection = '';
    const scrollPosition = window.scrollY + window.innerHeight / 2;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionBottom = sectionTop + section.offsetHeight;
      if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
        currentSection = section.getAttribute('id');
      }
    });

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();

    allowHideNavbar = false; // odmah blokiramo sakrivanje

    const targetId = link.getAttribute('href').replace('#', '');
    const targetSection = document.getElementById(targetId);

    if (targetSection) {
      window.scrollTo({
        top: targetSection.offsetTop - 120,
        behavior: 'smooth'
      });

      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    }

    // Ne čekamo dugo — ali čekamo da scroll završi
    clearTimeout(window._navbarUnlockTimeout);
    window._navbarUnlockTimeout = setTimeout(() => {
      allowHideNavbar = true;
    }, 800);
  });
});
  });

  // Hamburger toggle
  hamburger.addEventListener('click', () => {
    document.querySelector('.nav-links').classList.toggle('active');
  });

  // Prevent navbar from hiding after link click
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      ignoreScroll = true;
      setTimeout(() => {
        ignoreScroll = false;
      }, 1000);
    });
  });

  // Init
  setLanguage(lang);
  updateThemeIcon(lang);
  window.dispatchEvent(new Event('scroll'));

  const activeLink = document.querySelector('.nav-link.active');
  if (!activeLink) {
    const homeLink = document.querySelector('.nav-link[href="#home"]');
    if (homeLink) homeLink.classList.add('active');
  }
  setLanguage(lang);
  updateThemeIcon(lang);
  window.dispatchEvent(new Event('scroll'));
});


document.addEventListener("DOMContentLoaded", () => {
  const imagePaths = [
    "assets/project-photos/djc-diy/001.webp",
    "assets/project-photos/djc-diy/002.webp",
    "assets/project-photos/djc-diy/003.webp",
    "assets/project-photos/djc-diy/004.webp",
    "assets/project-photos/djc-diy/005.webp",
    "assets/project-photos/djc-diy/006.webp",
  ];

  let currentIndex = 0;
  const slideshowImages = document.querySelectorAll(".project-slideshow");

  if (slideshowImages.length > 0) {
    setInterval(() => {
      currentIndex = (currentIndex + 1) % imagePaths.length;
      slideshowImages.forEach(img => {
        img.style.opacity = 0;
        setTimeout(() => {
          img.src = imagePaths[currentIndex];
          img.style.opacity = 1;
        }, 600);
      });
    }, 4000);
  }
});

function enforceAspectRatio(containerSelector, ratioWidth, ratioHeight) {
  const containers = document.querySelectorAll(containerSelector);
  containers.forEach(container => {
    const width = container.offsetWidth;
    const height = width * (ratioHeight / ratioWidth);
    container.style.height = `${height}px`;
  });
}

// Prvi poziv kad se učita stranica
document.addEventListener("DOMContentLoaded", () => {
  enforceAspectRatio('.project-image-container', 16, 9);
});

// Ponovno podešavanje pri promeni veličine prozora
window.addEventListener("resize", () => {
  enforceAspectRatio('.project-image-container', 16, 9);
});

function startSlideshow() {
  document.querySelectorAll(".project-slideshow").forEach(slideshow => {
    const base = slideshow.dataset.base;
    const count = parseInt(slideshow.dataset.count || "1");
    let index = 1;

    if (slideshow.dataset.intervalId) return; // prevent duplicate intervals

    const intervalId = setInterval(() => {
      index = (index % count) + 1;
      slideshow.src = `${base}${String(index).padStart(3, '0')}.png`;
    }, 4000);

    slideshow.dataset.intervalId = intervalId;
  });
}
