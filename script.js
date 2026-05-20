// ==========================================
// 1. CHORD CONFIGURATION & TRACKING
// ==========================================

const chordFiles = [
    'chords/more-than-able.md',
    'chords/sing-the-name.md',
    // Add additional chord files here
];

// ==========================================
// 2. MARKDOWN PARSER (Pure Function)
// ==========================================

const MARKDOWN_RULES = [
    { regex: /~\*(.*?)\~\*/g, replacement: '<span class="obsidian-comment"><em>$1</em></span>' },
    { regex: /\*\*(.*?)\*\*/g, replacement: '<strong>$1</strong>' },
    { regex: /\*(.*?)\*/g, replacement: '<em>$1</em>' },
    { regex: /~(.*?)~/g, replacement: '<span class="obsidian-comment">$1</span>' },
    // Converts custom chord syntax into standard LaTeX for KaTeX
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
        return `<div class="obsidian-line">${trimmedLine || '&nbsp;'}</div>`; // Preserves empty lines for spacing
    }).join('\n');
}

// ==========================================
// 3. ASYNC MULTI-CARD INJECTION ENGINE
// ==========================================

// Update your existing loadAndRenderChords function
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

        // Added an index to give each card a unique ID if needed down the road
        markdownTexts.forEach((markdownText, index) => {
            const card = document.createElement('section');
            card.className = 'markdown-reading-view';
            card.id = `chord-card-${index}`; 
            card.innerHTML = parseMarkdown(markdownText);
            fragment.appendChild(card);
        });

        container.appendChild(fragment);

        // Build the navigation right after the cards have been rendered
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
// 4. INTERACTION SYSTEM MANAGERS
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

    // Check localStorage state persistence
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

// ==========================================
// 5. LIFECYCLE INITIALIZATION
// ==========================================

// Update your initialization listener
window.addEventListener('DOMContentLoaded', () => {
    loadAndRenderChords();
    initThemeToggle('theme-toggle', 'theme-icon');
    initLegendToggle();
    initTOCToggle(); // Initialize TOC interaction
});

function buildNavigation() {
    const tocContent = document.getElementById('toc-content');
    if (!tocContent) return;
    
    tocContent.innerHTML = ''; 
    const cards = document.querySelectorAll('.markdown-reading-view');
    
    cards.forEach((card, index) => {
        const heading = card.querySelector('h1, h2, h3, h4, h5, h6');
        const titleText = heading ? heading.textContent : `Song ${index + 1}`;
        
        const navBtn = document.createElement('button');
        navBtn.textContent = titleText;
        
        navBtn.addEventListener('click', () => {
            // Smoothly scroll to the card
            card.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // UX FIX: Auto-collapse the TOC on mobile/tablets after clicking
            if (window.innerWidth <= 1200) {
                const tocCard = document.getElementById('toc-card');
                const toggleBtn = document.getElementById('toc-toggle');
                
                if (tocCard && !tocCard.classList.contains('is-collapsed')) {
                    tocCard.classList.add('is-collapsed');
                    localStorage.setItem('toc-collapsed', 'true');
                    toggleBtn.innerHTML = '＋';
                    toggleBtn.setAttribute('aria-expanded', 'false');
                }
            }
        });
        
        tocContent.appendChild(navBtn);
    });
}

// Add a toggle function for the new TOC (similar to the legend toggle)
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