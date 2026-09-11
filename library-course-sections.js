(()=>{
'use strict';
// Legacy renderer retired. library-course-sections-v2.js is the authoritative
// course-section experience. Keeping this file as a no-op preserves cached
// references without mounting duplicate UI or event handlers.
if(!/digital-library\.html$/i.test(location.pathname))return;
window.__fundaLegacyCourseSectionsRetired=true;
})();