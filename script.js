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
1/3 5 *~one time, change the chord from 5 to 7~*
6 5
4$^2$ 4$^\\text{m6}$
 REPEAT REFRAIN/VAMP 1

**Tag (Who am I to deny ...)**
6 5
4$^2$ 4$^\\text{m6}$    *~one last run change from 4$^\\text{m6}$ to 2~* 
REPEAT TAG

**Breakdown Chorus**
1 (4/1 1)  | 1 1/7 4
6 5$^{\\text{(add4)}}$ 4$^2$ | 6 5$^{\\text{(add4)}}$ 4
1 (4/1 1)  | 1 1/7 4
6 5$^{\\text{(add4)}}$ 4$^2$ 
6 5$^{\\text{(add4)}}$ 4 4$^\\text{m6}$

**Channel *~or another new bridge~***
1
1/7
1$^2$/7$b$
4$^2$/6 2$^7$
1
1/7
1$^2$/7$b$
4$^2$/6 2$^7$

**Vamp 2 (You’re not done...)**
1
1$^2$/7$b$
4$^2$/6
4$^\\text{m6}$/6$b$ *~passing chord optional: 4~* 
REPEAT VAMP 2 2x
~Alt. Chords~
1
~*experimental: Bass 7$b$ then pass to (octave 2 7$b$ 6) || the rest: 7$b^{\\text{add9}}$/2 then 4$^2$/6~*
4$^\\text{m6}$/6$b$ *~passing chord to end: (1 4$^\\text{m6}$)~*

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

Final Chord
1`;

// 2. Parser to convert Markdown into HTML
function renderMarkdown(text) {
    const lines = text.split('\n');
    let htmlOutput = '';

    lines.forEach(line => {
        let trimmedLine = line.trim();
        
        // if (!trimmedLine) {
        //     htmlOutput += '<div style="height: 16px;"></div>';
        //     return;
        // }

        // 1. Check if the line is a Markdown heading (Starts with 1-6 '#' followed by a space)
        let isHeading = false;
        let headingLevel = 0;
        const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.*)/);
        
        if (headingMatch) {
            headingLevel = headingMatch[1].length; // Counts how many '#' there are
            trimmedLine = headingMatch[2];         // Removes the '#' so we just style the text
            isHeading = true;
        }

        // 2. Apply your inline formatting rules to the text
        // A. Handle your combined italicized comment syntax
        trimmedLine = trimmedLine.replace(/~\*(.*?)\~\*/g, '<span class="obsidian-comment"><em>$1</em></span>');

        // B. Convert Obsidian **bold** text
        trimmedLine = trimmedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // C. Convert standard Obsidian *italics* text
        trimmedLine = trimmedLine.replace(/\*(.*?)\*/g, '<em>$1</em>');

        // D. Convert standalone ~comments~ (Keeps text as-is, no parentheses)
        trimmedLine = trimmedLine.replace(/~(.*?)~/g, '<span class="obsidian-comment">$1</span>');

        // E. Automatic LaTeX fallback wrapper for raw exponents
        trimmedLine = trimmedLine.replace(/([1-7][b#]?)\^(\{.*?\}|\\text\{.*?\}|[a-zA-Z0-9]+)/g, '\\($1^$2\\)');

        // 3. Output the correct HTML tag based on whether it is a heading or normal line
        if (isHeading) {
            htmlOutput += `<h${headingLevel}>${trimmedLine}</h${headingLevel}>`;
        } else {
            htmlOutput += `<div class="obsidian-line">${trimmedLine}</div>`;
        }
    });

    // 3. Inject into the page
    const container = document.getElementById('obsidian-render');
    container.innerHTML = htmlOutput;

    // 4. Trigger KaTeX to render all math blocks ($...$ and \Custom Exponents\)
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

// Run the script once the page loads
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        renderMarkdown(rawMarkdown);
    }, 50);
});

// --- THEME TOGGLE LOGIC ---
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

// Check browser local storage for a saved theme, default to 'light'
const savedTheme = localStorage.getItem('chord-theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
updateIcon(savedTheme);

// Listen for clicks on the button
themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    // Apply the new theme and save it
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('chord-theme', newTheme);
    updateIcon(newTheme);
});

// Switch the emoji icon based on the theme
function updateIcon(theme) {
    themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
}