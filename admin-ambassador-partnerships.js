(()=>{
'use strict';
if(!/admin-v2\.html$/i.test(location.pathname)||window.__fundaAmbassadorAdmin)return;
window.__fundaAmbassadorAdmin=true;
// Legacy creator-partnership CRM retired on 2026-09-16.
// The Admin dashboard now uses ambassador_programme_applications together with
// admin-ambassador-programme-v2.js, admin-ambassador-finance-v2.js and
// admin-ambassador-support-marketing.js as the single Ambassador programme path.
})();