(()=>{
'use strict';
if(!/(^|\/)courses-public\.html$/i.test(location.pathname))return;
if(document.querySelector('script[data-funda-public-enrollment-faq]'))return;
const s=document.createElement('script');
s.src='courses-public-enrollment-faq.js?v=20260917-enroll-anytime-v1';
s.async=true;
s.dataset.fundaPublicEnrollmentFaq='1';
document.head.appendChild(s);
})();
