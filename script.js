// ==========================================
// 1. CHORD CONFIGURATION & TRACKING
// ==========================================

const chordFiles = [
    'chords/more-than-able.md'
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

async function loadAndRenderChords() {
    const container = document.getElementById('chord-container');
    if (!container) return;

    try {
        // Optimization: Fetch all markdown files in parallel instead of sequentially
        const fetchPromises = chordFiles.map(file => 
            fetch(file).then(res => {
                if (!res.ok) throw new Error(`Could not fetch ${file}`);
                return res.text();
            })
        );

        const markdownTexts = await Promise.all(fetchPromises);
        
        // Optimization: Use a DocumentFragment to minimize DOM reflows
        const fragment = document.createDocumentFragment();

        markdownTexts.forEach(markdownText => {
            const card = document.createElement('section');
            card.className = 'markdown-reading-view';
            card.innerHTML = parseMarkdown(markdownText);
            fragment.appendChild(card);
        });

        container.appendChild(fragment);

        // Trigger universal KaTeX mathematical post-render scan on container
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

window.addEventListener('DOMContentLoaded', () => {
    loadAndRenderChords();
    initThemeToggle('theme-toggle', 'theme-icon');
    initLegendToggle();
});