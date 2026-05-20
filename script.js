// ==========================================
// 1. CHORD CONFIGURATION & TRACKING
// ==========================================

const chordFiles = [
    'chords/more-than-able.md',
    'chords/sing-the-name.md',
    // Add additional markdown chord files here
];

// ==========================================
// 2. MARKDOWN PARSER (Pure Function)
// ==========================================

const MARKDOWN_RULES = [
    { regex: /~\*(.*?)\~\*/g, replacement: '<span class="obsidian-comment"><em>$1</em></span>' },
    { regex: /\*\*(.*?)\*\*/g, replacement: '<strong>$1</strong>' },
    { regex: /\*(.*?)\*/g, replacement: '<em>$1</em>' },
    { regex: /~(.*?)~/g, replacement: '<span class="obsidian-comment">$1</span>' },
    { regex: /([1-7][b#]?)\^(\{.*?\}|\\text\{.*?\}|[a-zA-Z0-9]+)/g, replacement: '\\($1^$2\\)' }
];

function parseMarkdown(text) {
    return text.split('\n').map(line => {
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
        return `<div class="obsidian-line">${trimmedLine || '&nbsp;'}</div>`;
    }).join('\n');
}

// ==========================================
// 3. ASYNC CARD RENDERING
// ==========================================

async function loadAndRenderChords() {
    const container = document.getElementById('chord-container');
    if (!container) return;

    try {
        const fetchPromises = chordFiles.map(file => 
            fetch(file).then(res => {
                if (!res.ok) throw new Error(`Could not fetch ${file}`);
                return res.text();
            })
        );

        const markdownTexts = await Promise.all(fetchPromises);
        const fragment = document.createDocumentFragment();

        markdownTexts.forEach((markdownText, index) => {
            const card = document.createElement('section');
            card.className = 'markdown-reading-view';
            card.id = `chord-card-${index}`;
            card.innerHTML = parseMarkdown(markdownText);
            fragment.appendChild(card);
        });

        container.appendChild(fragment);

        // Build Navigation immediately after cards are in the DOM
        buildNavigation();

        if (typeof renderMathInElement === 'function') {
            renderMathInElement(container, {
                delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '$', right: '$', display: false },
                    { left: '\\(', right: '\\)', display: false }
                ],
                throwOnError: false
            });
        }
    } catch (error) {
        console.error('Error processing chord files:', error);
    }
}

// ==========================================
// 4. NAVIGATION MAP GENERATION ENGINE
// ==========================================

function buildNavigation() {
    const tocContent = document.getElementById('toc-content');
    const mobileSongsContent = document.getElementById('mobile-songs-content');
    const cards = document.querySelectorAll('.markdown-reading-view');
    
    if (tocContent) tocContent.innerHTML = '';
    if (mobileSongsContent) mobileSongsContent.innerHTML = '';
    
    cards.forEach((card, index) => {
        const heading = card.querySelector('h1, h2, h3, h4, h5, h6');
        const titleText = heading ? heading.textContent : `Song ${index + 1}`;
        
        // --- 1. Desktop TOC Button ---
        if (tocContent) {
            const navBtn = document.createElement('button');
            navBtn.textContent = titleText;
            navBtn.title = titleText;
            navBtn.addEventListener('click', () => {
                card.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            tocContent.appendChild(navBtn);
        }
        
        // --- 2. Mobile Dropdown Button ---
        if (mobileSongsContent) {
            const mobileBtn = document.createElement('button');
            mobileBtn.textContent = titleText;
            mobileBtn.addEventListener('click', () => {
                // Calculate scroll position factoring in the fixed mobile header (70px offset)
                const offsetPosition = card.getBoundingClientRect().top + window.scrollY - 70;
                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                
                closeAllMobileDropdowns(); // Close dropdown after selection
            });
            mobileSongsContent.appendChild(mobileBtn);
        }
    });
}

// ==========================================
// 5. INTERACTION TOGGLES
// ==========================================

function initThemeToggle(toggleBtnId, iconId, storageKey = 'chord-theme') {
    const themeToggleBtn = document.getElementById(toggleBtnId);
    const themeIcon = document.getElementById(iconId);
    
    if (!themeToggleBtn || !themeIcon) return;

    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(storageKey, theme);
        themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
    };

    const savedTheme = localStorage.getItem(storageKey) || 'light';
    applyTheme(savedTheme);

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        applyTheme(currentTheme === 'light' ? 'dark' : 'light');
    });
}

function initLegendToggle() {
    const legendCard = document.getElementById('legend-card');
    const toggleBtn = document.getElementById('legend-toggle');
    if (!legendCard || !toggleBtn) return;

    const isCollapsed = localStorage.getItem('legend-collapsed') === 'true';
    if (isCollapsed) {
        legendCard.classList.add('is-collapsed');
        toggleBtn.innerHTML = '＋';
        toggleBtn.setAttribute('aria-expanded', 'false');
    }

    toggleBtn.addEventListener('click', () => {
        const nowCollapsed = legendCard.classList.toggle('is-collapsed');
        localStorage.setItem('legend-collapsed', nowCollapsed);
        toggleBtn.innerHTML = nowCollapsed ? '＋' : '─';
        toggleBtn.setAttribute('aria-expanded', !nowCollapsed);
    });
}

function initTOCToggle() {
    const tocCard = document.getElementById('toc-card');
    const toggleBtn = document.getElementById('toc-toggle');
    if (!tocCard || !toggleBtn) return;

    const isCollapsed = localStorage.getItem('toc-collapsed') === 'true';
    if (isCollapsed) {
        tocCard.classList.add('is-collapsed');
        toggleBtn.innerHTML = '＋';
        toggleBtn.setAttribute('aria-expanded', 'false');
    }

    toggleBtn.addEventListener('click', () => {
        const nowCollapsed = tocCard.classList.toggle('is-collapsed');
        localStorage.setItem('toc-collapsed', nowCollapsed);
        toggleBtn.innerHTML = nowCollapsed ? '＋' : '─';
        toggleBtn.setAttribute('aria-expanded', !nowCollapsed);
    });
}

// ==========================================
// 6. SMART MOBILE SCROLL & DRAWER CONTROL
// ==========================================
let lastScrollY = window.scrollY;

function closeAllMobileDropdowns() {
    const songsToggle = document.getElementById('mobile-songs-toggle');
    const legendToggle = document.getElementById('mobile-legend-toggle');
    const songsContent = document.getElementById('mobile-songs-content');
    const legendContent = document.getElementById('mobile-legend-content');

    if (songsToggle) songsToggle.classList.remove('is-active');
    if (legendToggle) legendToggle.classList.remove('is-active');
    if (songsContent) songsContent.classList.remove('is-active');
    if (legendContent) legendContent.classList.remove('is-active');
}

function initMobileNavbar() {
    const navbar = document.getElementById('mobile-navbar');
    const songsToggle = document.getElementById('mobile-songs-toggle');
    const legendToggle = document.getElementById('mobile-legend-toggle');
    const songsContent = document.getElementById('mobile-songs-content');
    const legendContent = document.getElementById('mobile-legend-content');
    
    if (!navbar) return;

    // Helper to toggle a specific section (Accordion Style)
    const toggleSection = (activeToggle, activeContent) => {
        const isCurrentlyActive = activeToggle.classList.contains('is-active');
        closeAllMobileDropdowns(); // Close everything first
        
        // If it wasn't active, open it up
        if (!isCurrentlyActive) {
            activeToggle.classList.add('is-active');
            activeContent.classList.add('is-active');
        }
    };

    if (songsToggle && songsContent) {
        songsToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSection(songsToggle, songsContent);
        });
    }

    if (legendToggle && legendContent) {
        legendToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSection(legendToggle, legendContent);
        });
    }

    // Handle show-on-scroll-up / hide-on-scroll-down
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        // Prevent action on iOS elastic scroll bounce
        if (currentScrollY <= 0) return;

        if (currentScrollY > lastScrollY && currentScrollY > 60) {
            // Scrolling Down -> Hide Menu Bar & Close the drawer
            navbar.classList.add('nav-hidden');
            closeAllMobileDropdowns();
        } else if (currentScrollY < lastScrollY) {
            // Scrolling Up -> Show Menu Bar
            navbar.classList.remove('nav-hidden');
        }
        
        lastScrollY = currentScrollY;
    }, { passive: true });

    // Dismiss menu when tapping outside anywhere on the document
    document.addEventListener('click', (e) => {
        if (!navbar.contains(e.target)) {
            closeAllMobileDropdowns();
        }
    });
}

// ==========================================
// 7. LIFECYCLE INITIALIZATION
// ==========================================

window.addEventListener('DOMContentLoaded', () => {
    loadAndRenderChords();
    initThemeToggle('theme-toggle', 'theme-icon');
    initLegendToggle();
    initTOCToggle();
    initMobileNavbar();
});