
// ==========================================
// 1. MARKDOWN PARSER (Pure Function)
// ==========================================

const MARKDOWN_RULES = [
    // A. Combined italicized comment syntax (~*comment*~)
    { regex: /~\*(.*?)\~\*/g, replacement: '<span class="obsidian-comment"><em>$1</em></span>' },
    // B. Obsidian **bold** text
    { regex: /\*\*(.*?)\*\*/g, replacement: '<strong>$1</strong>' },
    // C. Standard Obsidian *italics* text
    { regex: /\*(.*?)\*/g, replacement: '<em>$1</em>' },
    // D. Standalone ~comments~
    { regex: /~(.*?)~/g, replacement: '<span class="obsidian-comment">$1</span>' },
    // E. Automatic LaTeX fallback wrapper for raw exponents
    { regex: /([1-7][b#]?)\^(\{.*?\}|\\text\{.*?\}|[a-zA-Z0-9]+)/g, replacement: '\\($1^$2\\)' }
];

/**
 * Converts a raw markdown string into parsed HTML strings.
 * @param {string} text - The raw markdown text.
 * @returns {string} - The formatted HTML string.
 */
function parseMarkdown(text) {
    return text.split('\n').map(line => {
        let trimmedLine = line.trim();
        let headingLevel = 0;

        // 1. Check for Markdown headings
        const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.*)/);
        if (headingMatch) {
            headingLevel = headingMatch[1].length;
            trimmedLine = headingMatch[2];
        }

        // 2. Apply inline formatting rules
        MARKDOWN_RULES.forEach(({ regex, replacement }) => {
            trimmedLine = trimmedLine.replace(regex, replacement);
        });

        // 3. Wrap in appropriate HTML tags
        if (headingLevel > 0) {
            return `<h${headingLevel}>${trimmedLine}</h${headingLevel}>`;
        }
        return `<div class="obsidian-line">${trimmedLine}</div>`;
    }).join('\n');
}

// ==========================================
// 2. DOM & RENDERER LOGIC
// ==========================================

// Array of your chord files inside the folder
const chordFiles = [
    'chords/more-than-able.md',
    'chords/another-song.md' // Add new songs here
];

/**
 * Fetches markdown files and renders them as individual cards.
 */
async function loadAndRenderChords() {
    const container = document.getElementById('chord-container');
    if (!container) return;

    for (const file of chordFiles) {
        try {
            // Fetch the file content from the folder
            const response = await fetch(file);
            if (!response.ok) throw new Error(`Failed to load ${file}`);
            const text = await response.text();

            // Create a new card element for the song
            const card = document.createElement('div');
            card.className = 'markdown-reading-view';
            
            // Parse the markdown and inject it into the card
            card.innerHTML = parseMarkdown(text);
            
            // Add the card to the main container
            container.appendChild(card);

        } catch (error) {
            console.error(error);
        }
    }

    // Trigger KaTeX to render all math blocks in the whole container after all cards load
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
}

// ==========================================
// 3. THEME MANAGER
// ==========================================

/**
 * Initializes the light/dark mode theme toggle.
 * @param {string} toggleBtnId - The ID of the button.
 * @param {string} iconId - The ID of the icon element.
 * @param {string} storageKey - The localStorage key name.
 */
function initThemeToggle(toggleBtnId, iconId, storageKey = 'chord-theme') {
    const themeToggleBtn = document.getElementById(toggleBtnId);
    const themeIcon = document.getElementById(iconId);
    
    if (!themeToggleBtn || !themeIcon) return;

    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(storageKey, theme);
        themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
    };

    // Load saved theme (default to light)
    const savedTheme = localStorage.getItem(storageKey) || 'light';
    applyTheme(savedTheme);

    // Listen for toggle clicks
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        applyTheme(currentTheme === 'light' ? 'dark' : 'light');
    });
}

// ==========================================
// 3.5 LEGEND TOGGLE MANAGER (SIMPLIFIED)
// ==========================================

function initLegendToggle() {
    const legendCard = document.getElementById('legend-card');
    const toggleBtn = document.getElementById('legend-toggle');
    
    if (!legendCard || !toggleBtn) return;

    // Check if the user previously closed it
    const isCollapsed = localStorage.getItem('legend-collapsed') === 'true';
    
    if (isCollapsed) {
        legendCard.classList.add('is-collapsed');
        toggleBtn.innerHTML = '＋'; 
        toggleBtn.setAttribute('aria-label', 'Expand Legend');
    }

    toggleBtn.addEventListener('click', () => {
        const nowCollapsed = legendCard.classList.toggle('is-collapsed');
        localStorage.setItem('legend-collapsed', nowCollapsed);
        
        // Quick simple sign swap
        if (nowCollapsed) {
            toggleBtn.innerHTML = '＋';
            toggleBtn.setAttribute('aria-label', 'Expand Legend');
        } else {
            toggleBtn.innerHTML = '─';
            toggleBtn.setAttribute('aria-label', 'Collapse Legend');
        }
    });
}

// ==========================================
// 4. INITIALIZATION
// ==========================================

window.addEventListener('DOMContentLoaded', () => {
    loadAndRenderChords();
    initThemeToggle('theme-toggle', 'theme-icon');
    initLegendToggle(); // <-- Fire up the new show/hide engine!
});
