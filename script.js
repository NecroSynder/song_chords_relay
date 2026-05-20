// 1. Your raw text content
const rawMarkdown = `
# More Than Able

**Intro**
1 1$^{\\text{sus}}$ 1 5/7 4
1 1$^{\\text{sus}}$ 6 5 4

**Verse 1**
1 4$^2$/1
1/7 4$^2$/6
6 5$^{\\text{(add4)}}$
4$^2$ 1 4$^2$/6

**Verse 2**
1 4$^2$/1
1 4$^2$/1
6 5$^{\\text{(add4)}}$ 4$^2$
1 5/7

**Chorus 1**
1 (4/1 1)  | 1 1/7 4
6 5$^{\\text{(add4)}}$ 4$^2$ | 6 5$^{\\text{(add4)}}$ 4
1 (4/1 1)  | 1 1/7 4
6 5$^{\\text{(add4)}}$ 4$^2$ 
6 5$^{\\text{(add4)}}$ 4 2$^7$

Turnaround
1 4/1 1 4/1 

**Verse 3**
1 4/1
1 4/1
6 5$^{\\text{(add4)}}$
4$^2$ 1
5/7

**Chorus 1**
1 (4/1 1)  | 1 1/7 4
6 5$^{\\text{(add4)}}$ 4$^2$ | 6 5$^{\\text{(add4)}}$ 4
1 (4/1 1)  | 1 1/7 4
6 5$^{\\text{(add4)}}$ 4$^2$ 
6 5$^{\\text{(add4)}}$ 4 2$^7$

**Bridge**
1 
5/1 4$^2$/1
1
5/1 4$^2$/1 

**Bridge 2**
1
5$^{\\text{sus}}$ (6 5$^{\\text{sus}}$ 4$^2$)
1
5$^{\\text{sus}}$ (6 5$^{\\text{sus}}$ 4$^2$)

**Bridge 2 Alt.**
1
2$^7$ (6 5$^{\\text{sus}}$ 4$^2$)
1
2$^7$ (6 5$^{\\text{sus}}$ 4$^2$)

**Refrain/Vamp 1**
1 4$^2$/1
1 4$^2$/1
1/3 5 *~(one time, change the chord from 5 to 7)~*
6 5
4$^2$ 4$^\\text{m6}$
 REPEAT REFRAIN/VAMP 1

**Tag (Who am I to deny ...)**
6 5
4$^2$ 4$^\\text{m6}$ *~(one last run change from 4$^\\text{m6}$ to 2)~*  
REPEAT TAG

**Breakdown Chorus**
1 (4/1 1)  | 1 1/7 4
6 5$^{\\text{(add4)}}$ 4$^2$ | 6 5$^{\\text{(add4)}}$ 4
1 (4/1 1)  | 1 1/7 4
6 5$^{\\text{(add4)}}$ 4$^2$ 
6 5$^{\\text{(add4)}}$ 4 4$^\\text{m6}$

**Channel *~(or another new bridge)~***
1
1/7
1$^2$/7$b$
4$^2$/6 2$^7$
1
1/7
1$^2$/7$b$
4$^2$/6 2$^7$

**Vamp 2 (You're not done...)**
1
1$^2$/7$b$
4$^2$/6
4$^\\text{m6}$/6$b$ *~passing chord optional: 4~* 
REPEAT VAMP 2 2x
~Alt. Chords~
1
~*experimental: Bass 7$b$ then pass to (octave 2 7$b$ 6) || the rest: 7$b^{\\text{add9}}$/2 then 4$^2$/6~*
4$^\\text{m6}$/6$b$ *~(passing chord after: 1 4$^\\text{m6}$)~*

**Tag**
6 5$^{\\text{(add4)}}$ 
4$^2$ 2$^7$
6 5$^{\\text{(add4)}}$ 
4$^2$ 4$^\\text{m6}$

**Final Chorus**
1 (4/1 1)  | 1 1/7 4
6 5$^{\\text{(add4)}}$ 4$^2$ | 6 5$^{\\text{(add4)}}$ 4
1 (4/1 1)  | 1 1/7 4
6 5$^{\\text{(add4)}}$ 4$^2$ 
6 5$^{\\text{(add4)}}$ 4 4$^\\text{m6}$

**Tag**
6 5$^{\\text{(add4)}}$ 4 4$^\\text{m6}$
REPEAT TAG as desired

**Final Chord**
1`;
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

/**
 * Injects markdown into a container and triggers KaTeX rendering.
 * @param {string} text - The raw markdown text.
 * @param {string} containerId - The ID of the target DOM element.
 */
function renderContentToDOM(text, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = parseMarkdown(text);

    // Trigger KaTeX to render all math blocks
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
// 4. INITIALIZATION
// ==========================================

window.addEventListener('DOMContentLoaded', () => {
    // Note: If KaTeX fails to find elements because it hasn't initialized yet, 
    // you can restore the setTimeout or, better yet, use requestAnimationFrame.
    if (typeof rawMarkdown !== 'undefined') {
        renderContentToDOM(rawMarkdown, 'obsidian-render');
    }

    initThemeToggle('theme-toggle', 'theme-icon');
});