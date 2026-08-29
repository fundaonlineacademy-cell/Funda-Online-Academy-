(()=>{
if(!/course-view\.html$/i.test(location.pathname))return;
const style=document.createElement('style');
style.id='fundaCourseOverviewBrandTheme';
style.textContent=`
:root{--funda-deep:#21384d;--funda-navy:#2d4b63;--funda-navy2:#46677f;--funda-gold:#c99a2e;--funda-rose:#b85f7d;--funda-rose-soft:#f5dbe4;--funda-cream:#fff4dc;--funda-ivory:#fff6e4;--funda-text:#243750;--funda-copy:#495968}
html{background:#21384d}
body{background:radial-gradient(circle at 8% 8%,rgba(70,103,127,.10),transparent 25rem),radial-gradient(circle at 94% 16%,rgba(184,95,125,.12),transparent 28rem),linear-gradient(155deg,#eceeea 0%,#f4eee6 52%,#f4e3e8 100%)!important;background-attachment:fixed!important;color:var(--funda-text)!important;min-height:100vh}
body:before{display:none!important}
header{background:linear-gradient(100deg,#21384d,#2d4b63)!important;border-color:rgba(201,154,46,.34)!important;box-shadow:0 8px 24px rgba(33,56,77,.16)!important}
header .brand div:first-child{color:#f7f2e7!important}header a[href='courses-public.html']{color:#fff4dc!important}header a[href='login.html']{background:linear-gradient(135deg,#d5aa43,#e2bd62)!important;color:#21384d!important;box-shadow:0 8px 22px rgba(201,154,46,.18)!important}
main{position:relative}
#loading,#errorBox{background:linear-gradient(145deg,#fff6e4,#f6ece7)!important;border-color:rgba(201,154,46,.30)!important;color:#243750!important}
#courseContent>div>section{background:linear-gradient(150deg,#fff6e4 0%,#f8f5ef 62%,#f5e5e9 125%)!important;border-color:rgba(70,103,127,.22)!important;box-shadow:0 18px 48px rgba(48,70,88,.13)!important}
#courseHero{background:linear-gradient(135deg,#2d4b63 0%,#46677f 68%,#b85f7d 125%)!important}
#heroOverlay{background:linear-gradient(to top,rgba(33,56,77,.72),rgba(33,56,77,.12),transparent)!important}
#courseCategory{background:#f5dbe4!important;color:#713148!important}#courseDuration{background:#fff0c9!important;color:#71520f!important}
#courseContent aside>div:first-child{background:linear-gradient(155deg,#fff6e4 0%,#fff0d1 64%,#f5dbe4 130%)!important;border-color:rgba(201,154,46,.36)!important;box-shadow:0 18px 42px rgba(48,70,88,.12)!important}
#courseContent aside>div:last-child{background:linear-gradient(145deg,#fff0cf,#f5dbe4)!important;border-color:rgba(201,154,46,.34)!important}
#enrollBtn{background:linear-gradient(135deg,#2d4b63,#46677f)!important;box-shadow:0 10px 24px rgba(45,75,99,.20)!important}
#enrollBtn:hover{background:linear-gradient(135deg,#35576f,#52768e)!important}
#createAccountLink{background:#fff4dc!important;border-color:#d8b85e!important;color:#21384d!important}
.feature{background:linear-gradient(145deg,#fff6e4 0%,#fff0d5 68%,#f5dbe4 135%)!important;border-color:rgba(201,154,46,.25)!important}
#courseContent .bg-white,#courseContent .bg-\[\#fbfdff\],#courseContent .bg-\[\#fff\]{background-color:transparent!important}
/* Strong readable typography across all premium overview injectors */
#courseContent h1,#courseContent h2,#courseContent h3,#courseContent h4,#courseContent strong,#courseContent .text-\[\#071D49\],body .rpoSection h2,body .rpoSection h3,body .basec h2,body .basec h3,body .copSection h2,body .copSection h3{color:#21384d!important}
#courseContent p,#courseContent li,#courseContent .text-slate-400,#courseContent .text-slate-500,#courseContent .text-slate-600,#courseContent .text-slate-700,body .rpoSection p,body .rpoSection li,body .basec p,body .basec li,body .copSection p,body .copSection li{color:#495968!important;opacity:1!important}
body .rpoIntro,body .bahero,body .copHero,body [class*='PremiumIntro']{box-shadow:0 18px 46px rgba(48,70,88,.13)!important}
body .rpoSection,body .basec,body .copSection{border-color:rgba(70,103,127,.20)!important;background:linear-gradient(150deg,#fff6e4,#f8f5ef 72%,#f5e5e9 130%)!important;color:#243750!important}
body .cpcard,body .bacard,body .cpoutcome,body .baoutcome,body .cpapply div,body .baapply div,body .cpmodule,body .bamodule{background:linear-gradient(145deg,#fff6e4,#f8f5ef 74%,#f5e5e9 135%)!important;border-color:rgba(70,103,127,.20)!important;color:#243750!important}
body .cpinclude,body .bainclude{background:#fff0d5!important;border-color:rgba(201,154,46,.25)!important;color:#243750!important}
footer{background:#21384d!important;border-color:rgba(201,154,46,.24)!important;color:#e8edf0!important}footer *{color:#e8edf0!important}
@media(max-width:700px){body{background-attachment:scroll!important;background:radial-gradient(circle at 90% 8%,rgba(184,95,125,.10),transparent 20rem),radial-gradient(circle at 8% 20%,rgba(201,154,46,.10),transparent 18rem),linear-gradient(160deg,#eceeea,#f4eee6 60%,#f4e3e8)!important}main{padding-top:20px!important;padding-bottom:28px!important}header{background:linear-gradient(100deg,#21384d,#2d4b63)!important}}
`;
document.head.appendChild(style);
document.body.classList.add('fundaCourseOverviewBrand');
})();