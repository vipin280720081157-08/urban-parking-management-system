/* SmartPark - light / dark theme toggle (persisted in localStorage). */
function initTheme() {
    const btn = document.getElementById('theme-toggle');
    if (!btn || btn.dataset.ready) return;
    btn.dataset.ready = '1';

    const setIcon = () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        btn.innerHTML = `<i data-lucide="${isDark ? 'sun' : 'moon'}"></i>`;
        btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
        if (window.lucide) lucide.createIcons();
    };

    btn.addEventListener('click', () => {
        const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        setIcon();
        document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: next } }));
    });
    setIcon();
}
document.addEventListener('DOMContentLoaded', initTheme);
