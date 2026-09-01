// FUNDA ONLINE ACADEMY — STUDENT DASHBOARD READABILITY
// Accessibility-focused contrast layer. Keeps navy/gold branding and layout intact.
(()=>{
'use strict';
if(!/dashboard\.html$/i.test(location.pathname)||window.__fundaStudentReadability)return;
window.__fundaStudentReadability=true;
const style=document.createElement('style');
style.id='funda-student-readability';
style.textContent=`
/* Default body copy: stronger readable navy-charcoal */
body{color:#10233f!important}
main p,main li,main label,main td,main dd,main .text-slate-500,main .text-slate-600,main .text-gray-500,main .text-gray-600{color:#334155!important}
/* Secondary/supporting copy must remain clearly legible on light cards */
main [class*="text-slate-4"],main [class*="text-gray-4"]{color:#475569!important}
/* Form guidance and placeholders: readable but still visually secondary */
main input,main textarea,main select{color:#10233f!important}
main input::placeholder,main textarea::placeholder{color:#64748b!important;opacity:1!important}
/* Preserve intentional light text on dark/navy surfaces */
header,header *,main .hero,main .hero *{color:inherit}
/* Keep status/accent semantics where explicit colours are used */
main .text-green-600,main .text-green-700,main .text-red-600,main .text-red-700,main .text-amber-600,main .text-amber-700,main .text-blue-600,main .text-blue-700{color:revert!important}
`;
document.head.appendChild(style);
})();