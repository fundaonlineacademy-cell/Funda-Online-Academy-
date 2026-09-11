(()=>{
'use strict';
// Legacy theme retired. library-theme-premium.js remains the single active
// Digital Library theme. This no-op preserves old cached references safely.
if(!/digital-library\.html$/i.test(location.pathname))return;
window.__fundaLegacyLibraryThemeRetired=true;
})();