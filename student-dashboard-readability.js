// FUNDA ONLINE ACADEMY — STUDENT DASHBOARD READABILITY
// Accessibility-focused contrast layer. Keeps navy/gold branding and layout intact.
(()=>{
'use strict';
if(!/dashboard\.html$/i.test(location.pathname)||window.__fundaStudentReadability)return;
window.__fundaStudentReadability=true;
const style=document.createElement('style');
style.id='funda-student-readability';
style.textContent=`
/* Strong readable default on light dashboard surfaces */
body{color:#10233f!important}
main p,main li,main label,main td,main dd,
main .text-slate-400,main .text-slate-500,main .text-slate-600,
main .text-gray-400,main .text-gray-500,main .text-gray-600{color:#334155!important}
main small,main .muted{color:#475569!important}

/* Form content and guidance */
main input,main textarea,main select{color:#10233f!important}
main input::placeholder,main textarea::placeholder{color:#64748b!important;opacity:1!important}

/* DARK / BLUE HERO SURFACES: force proper high contrast. */
main .hero{color:#fff!important}
main .hero h1,main .hero h2,main .hero h3,main .hero h4,
main .hero strong,main .hero b{color:#fff!important}
main .hero p,main .hero li,main .hero span:not([class*="text-[#e4c777]"]):not([class*="text-[#E4C777]"]){color:#e8f0ff!important}
main .hero .text-blue-100,main .hero [class*="text-blue-100"]{color:#e8f0ff!important}
main .hero .text-white,main .hero [class*="text-white"]{color:#fff!important}
main .hero [class*="text-[#e4c777]"],main .hero [class*="text-[#E4C777]"]{color:#f1d27a!important}

/* Light cards / status areas: readable secondary copy */
main .card p,main .soft p,main section:not(.hero) p{color:#334155!important}
main .card .text-slate-500,main .card .text-slate-600,
main .soft .text-slate-500,main .soft .text-slate-600{color:#475569!important}

/* Preserve semantic/status colours */
main .text-green-600,main .text-green-700,
main .text-emerald-600,main .text-emerald-700,
main .text-red-600,main .text-red-700,
main .text-amber-600,main .text-amber-700,
main .text-blue-600,main .text-blue-700,
main .text-violet-600,main .text-violet-700{color:revert!important}
`;
document.head.appendChild(style);
})();