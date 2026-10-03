/* SmartPark - runtime configuration.
   GitHub Pages -> MOCK (browser-only demo data). Anywhere else -> REAL (Flask API).
   Add ?mode=mock or ?mode=real to any page URL to override (remembered in this browser). */
(function () {
    var forced = null;
    try {
        var m = new URLSearchParams(window.location.search).get('mode');
        if (m === 'mock' || m === 'real') localStorage.setItem('sp_mode', m);
        forced = localStorage.getItem('sp_mode');
    } catch (e) { /* storage unavailable */ }
    var auto = window.location.hostname.includes('github.io') ? 'MOCK' : 'REAL';
    window.CONFIG = {
        MODE: forced ? forced.toUpperCase() : auto,
        API_URL: 'http://localhost:5000/api',
        APP_NAME: 'SmartPark',
        VERSION: '1.0.0'
    };
})();
