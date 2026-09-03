// Funda Online Academy — profile photo feature retired.
// No profile-photo UI or repaint logic runs on Academy dashboards.
// This legacy bootstrap remains loaded by dashboard.html; it now only loads
// the independent secure certificate access module.
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
})();
