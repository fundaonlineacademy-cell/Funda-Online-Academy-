// Funda Online Academy — profile photo feature retired.
// No profile-photo UI or repaint logic runs on Academy dashboards.
// This legacy bootstrap remains loaded by dashboard.html; it now only loads
// independent secure academic-record access modules.
(()=>{
  'use strict';
  window.__fundaProfilePhotoUpload = true;
  if(!document.querySelector('script[data-funda-certificates]')){
    const s=document.createElement('script');
    s.src='student-certificates-dashboard-link.js?v=20260903-secure-certificates';
    s.async=true;
    s.dataset.fundaCertificates='1';
    document.head.appendChild(s);
  }
  if(!document.querySelector('script[data-funda-results]')){
    const s=document.createElement('script');
    s.src='student-results-dashboard-link.js?v=20260903-official-results';
    s.async=true;
    s.dataset.fundaResults='1';
    document.head.appendChild(s);
  }
})();
