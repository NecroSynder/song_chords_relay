// ==========================================
// 1. CHORD CONFIGURATION & TRACKING
// ==========================================

// Configured as objects to store file paths and their respective song keys
const chordFiles = [
  // EXAMPLE: { path: "chords/the-joy.md", key: "D" },
  // Add additional markdown chord files here: { path: "chords/filename.md", key: "C#" }
];

// ==========================================
// 2. MARKDOWN PARSER (Pure Function)
// ==========================================

const MARKDOWN_RULES = [
  // --- 1. COMPOUND RULES (Must go first) ---
  // Catches *~comment~*
  {
    regex: /\*~(.*?)~\*/g,
    replacement: '<span class="obsidian-comment"><em>$1</em></span>',
  },

  // Catches ~*comment*~
  {
    regex: /~\*(.*?)\*~/g,
    replacement: '<span class="obsidian-comment"><em>$1</em></span>',
  },

  // --- 2. STANDARD RULES ---
  // Catches **bold**
  { regex: /\*\*(.*?)\*\*/g, replacement: "<strong>$1</strong>" },

  // Catches *italic*
  { regex: /\*(.*?)\*/g, replacement: "<em>$1</em>" },

  // Catches ~comment~ (Standard non-italic comment)
  {
    regex: /~(.*?)~/g,
    replacement: '<span class="obsidian-comment">$1</span>',
  },
];

function parseMarkdown(text) {
  return text
    .split("\n")
    .map((line) => {
      let trimmedLine = line.trim();
      let headingLevel = 0;

      const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.*)/);
      if (headingMatch) {
        headingLevel = headingMatch[1].length;
        trimmedLine = headingMatch[2];
      }

      MARKDOWN_RULES.forEach(({ regex, replacement }) => {
        trimmedLine = trimmedLine.replace(regex, replacement);
      });

      if (headingLevel > 0) {
        return `<h${headingLevel}>${trimmedLine}</h${headingLevel}>`;
      }
      return `<div class="obsidian-line">${trimmedLine || "&nbsp;"}</div>`;
    })
    .join("\n");
}

// ==========================================
// 3. ASYNC CARD RENDERING
// ==========================================

async function loadAndRenderChords() {
  const container = document.getElementById("chord-container");
  if (!container) return;

  // --- Handle Empty State ---
  if (!chordFiles || chordFiles.length === 0) {
    container.innerHTML = `
      <div class="empty-state-message">
        Chords will be added when there is a new Line-Up.
      </div>
    `;
    buildNavigation(); // Clears out desktop & mobile song menus cleanly
    return;
  }

  try {
    const fetchPromises = chordFiles.map((file) =>
      fetch(file.path).then((res) => {
        if (!res.ok) throw new Error(`Could not fetch ${file.path}`);
        return res.text();
      }),
    );

    const markdownTexts = await Promise.all(fetchPromises);
    const fragment = document.createDocumentFragment();

    markdownTexts.forEach((markdownText, index) => {
      const card = document.createElement("section");
      card.className = "markdown-reading-view";
      card.id = `chord-card-${index}`;

      // Store the key inside data attributes to make it accessible to navigation builders
      card.dataset.key = chordFiles[index].key || "";

      card.innerHTML = parseMarkdown(markdownText);
      fragment.appendChild(card);
    });

    container.appendChild(fragment);

    // Build Navigation immediately after cards are in the DOM
    buildNavigation();

    if (typeof renderMathInElement === "function") {
      renderMathInElement(container, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
          { left: "\\(", right: "\\)", display: false },
        ],
        throwOnError: false,
      });
    }
  } catch (error) {
    console.error("Error processing chord files:", error);
  }
}

// ==========================================
// 4. NAVIGATION MAP GENERATION ENGINE
// ==========================================

function buildNavigation() {
  const tocContent = document.getElementById("toc-content");
  const mobileSongsContent = document.getElementById("mobile-songs-content");
  const cards = document.querySelectorAll(".markdown-reading-view");

  if (tocContent) tocContent.innerHTML = "";
  if (mobileSongsContent) mobileSongsContent.innerHTML = "";

  cards.forEach((card, index) => {
    const heading = card.querySelector("h1, h2, h3, h4, h5, h6");
    const titleText = heading ? heading.textContent : `Song ${index + 1}`;
    const songKey = card.dataset.key;

    // Structured inner HTML containing isolated title and key badge elements
    const buttonHTML = `
      <span class="song-title">${titleText}</span>
      ${songKey ? `<span class="song-key">${songKey}</span>` : ""}
    `;

    // --- 1. Desktop TOC Button ---
    if (tocContent) {
      const navBtn = document.createElement("button");
      navBtn.innerHTML = buttonHTML;
      navBtn.title = titleText;
      navBtn.addEventListener("click", () => {
        card.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      tocContent.appendChild(navBtn);
    }

    // --- 2. Mobile Dropdown Button ---
    if (mobileSongsContent) {
      const mobileBtn = document.createElement("button");
      mobileBtn.innerHTML = buttonHTML;
      mobileBtn.addEventListener("click", () => {
        // Calculate scroll position factoring in the fixed mobile header (70px offset)
        const offsetPosition =
          card.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo({ top: offsetPosition, behavior: "smooth" });

        closeAllMobileDropdowns(); // Close dropdown after selection
      });
      mobileSongsContent.appendChild(mobileBtn);
    }
  });

  // --- 3. ScrollSpy (Active Highlight Observer) ---
  const tocButtons = document.querySelectorAll("#toc-content button");
  const mobileButtons = document.querySelectorAll(
    "#mobile-songs-content button",
  );

  // Observer options to trigger when a card hits the upper portion of the screen
  const observerOptions = {
    root: null,
    rootMargin: "-20% 0px -60% 0px",
    threshold: 0,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // Find which card is currently intersecting the view
        const activeIndex = Array.from(cards).indexOf(entry.target);

        // Toggle active class on Desktop TOC
        tocButtons.forEach((btn, i) => {
          btn.classList.toggle("active", i === activeIndex);
        });

        // Toggle active class on Mobile TOC
        mobileButtons.forEach((btn, i) => {
          btn.classList.toggle("active", i === activeIndex);
        });
      }
    });
  }, observerOptions);

  // Attach the observer to every chord card
  cards.forEach((card) => observer.observe(card));
}

// ==========================================
// 5. INTERACTION TOGGLES
// ==========================================

function initThemeToggle(toggleBtnId, iconId, storageKey = "chord-theme") {
  const themeToggleBtn = document.getElementById(toggleBtnId);
  const themeIcon = document.getElementById(iconId);
  const themeMeta = document.getElementById("theme-color-meta");

  if (!themeToggleBtn || !themeIcon) return;

  const applyTheme = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(storageKey, theme);
    themeIcon.textContent = theme === "light" ? "🌙" : "☀️";

    // --- Sync Mobile Navigation Bar Color ---
    if (themeMeta) {
      const metaColor = theme === "light" ? "#fbc2eb" : "#1f150c";
      themeMeta.setAttribute("content", metaColor);
    }
  };

  const savedTheme = localStorage.getItem(storageKey) || "light";
  applyTheme(savedTheme);

  themeToggleBtn.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    applyTheme(currentTheme === "light" ? "dark" : "light");
  });
}

function initLegendToggle() {
  const legendCard = document.getElementById("legend-card");
  const toggleBtn = document.getElementById("legend-toggle");
  const legendHeader = legendCard.querySelector(".legend-header");

  if (!legendCard || !toggleBtn || !legendHeader) return;

  const isCollapsed = localStorage.getItem("legend-collapsed") === "true";
  if (isCollapsed) {
    legendCard.classList.add("is-collapsed");
    toggleBtn.innerHTML = "＋";
    toggleBtn.setAttribute("aria-expanded", "false");
  }

  // Apply the click listener to the entire header
  legendHeader.addEventListener("click", () => {
    const nowCollapsed = legendCard.classList.toggle("is-collapsed");
    localStorage.setItem("legend-collapsed", nowCollapsed);
    toggleBtn.innerHTML = nowCollapsed ? "＋" : "─";
    toggleBtn.setAttribute("aria-expanded", !nowCollapsed);
  });
}

function initTOCToggle() {
  const tocCard = document.getElementById("toc-card");
  const toggleBtn = document.getElementById("toc-toggle");
  const tocHeader = tocCard.querySelector(".toc-header");

  if (!tocCard || !toggleBtn || !tocHeader) return;

  const isCollapsed = localStorage.getItem("toc-collapsed") === "true";
  if (isCollapsed) {
    tocCard.classList.add("is-collapsed");
    toggleBtn.innerHTML = "＋";
    toggleBtn.setAttribute("aria-expanded", "false");
  }

  // Apply the click listener to the entire header
  tocHeader.addEventListener("click", () => {
    const nowCollapsed = tocCard.classList.toggle("is-collapsed");
    localStorage.setItem("toc-collapsed", nowCollapsed);
    toggleBtn.innerHTML = nowCollapsed ? "＋" : "─";
    toggleBtn.setAttribute("aria-expanded", !nowCollapsed);
  });
}

// ==========================================
// 6. SMART MOBILE SCROLL & DRAWER CONTROL
// ==========================================
let lastScrollY = window.scrollY;
let hideTimer = null;

function closeAllMobileDropdowns() {
  const songsToggle = document.getElementById("mobile-songs-toggle");
  const legendToggle = document.getElementById("mobile-legend-toggle");
  const songsContent = document.getElementById("mobile-songs-content");
  const legendContent = document.getElementById("mobile-legend-content");

  if (songsToggle) songsToggle.classList.remove("is-active");
  if (legendToggle) legendToggle.classList.remove("is-active");
  if (songsContent) songsContent.classList.remove("is-active");
  if (legendContent) legendContent.classList.remove("is-active");
}

function initMobileNavbar() {
  const navbar = document.getElementById("mobile-navbar");
  const songsToggle = document.getElementById("mobile-songs-toggle");
  const legendToggle = document.getElementById("mobile-legend-toggle");
  const songsContent = document.getElementById("mobile-songs-content");
  const legendContent = document.getElementById("mobile-legend-content");

  if (!navbar) return;

  // Helper to toggle a specific section (Accordion Style)
  const toggleSection = (activeToggle, activeContent) => {
    const isCurrentlyActive = activeToggle.classList.contains("is-active");
    closeAllMobileDropdowns(); // Close everything first

    // If it wasn't active, open it up
    if (!isCurrentlyActive) {
      activeToggle.classList.add("is-active");
      activeContent.classList.add("is-active");
    }
  };

  if (songsToggle && songsContent) {
    songsToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleSection(songsToggle, songsContent);
    });
  }

  if (legendToggle && legendContent) {
    legendToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleSection(legendToggle, legendContent);
    });
  }

  // Handle show-on-scroll-up / hide-on-scroll-down
  window.addEventListener(
    "scroll",
    () => {
      const currentScrollY = window.scrollY;

      // Prevent action on iOS elastic scroll bounce
      if (currentScrollY <= 0) return;

      if (currentScrollY > lastScrollY && currentScrollY > 60) {
        // SCROLLING DOWN -> Start a timer to delay the hide
        if (!hideTimer) {
          hideTimer = setTimeout(() => {
            // navbar.classList.add('nav-hidden');
            closeAllMobileDropdowns();
            hideTimer = null;
          }, 600);
        }
      } else if (currentScrollY < lastScrollY) {
        // SCROLLING UP -> Cancel the hide timer instantly and show the menu
        if (hideTimer) {
          clearTimeout(hideTimer);
          hideTimer = null;
        }
        navbar.classList.remove("nav-hidden");
      }

      lastScrollY = currentScrollY;
    },
    { passive: true },
  );

  // Dismiss menu when tapping outside anywhere on the document
  document.addEventListener("click", (e) => {
    if (!navbar.contains(e.target)) {
      closeAllMobileDropdowns();
    }
  });
}

// ==========================================
// 7. LIFECYCLE INITIALIZATION
// ==========================================

window.addEventListener("DOMContentLoaded", () => {
  loadAndRenderChords();
  initThemeToggle("theme-toggle", "theme-icon");
  initLegendToggle();
  initTOCToggle();
  initMobileNavbar();
});
