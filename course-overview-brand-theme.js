(()=>{
if(!/course-view\.html$/i.test(location.pathname))return;
const style=document.createElement('style');
style.id='fundaCourseOverviewBrandTheme';
style.textContent=`
:root{--funda-deep:#03122f;--funda-navy:#071d49;--funda-navy2:#0b2f70;--funda-gold:#c99a2e;--funda-gold-soft:#f1cf79;--funda-rose:#b85f7d;--funda-rose-soft:#f5dbe4;--funda-cream:#fff8ea;--funda-ivory:#fbf6ec;--funda-rosewash:#f8e9ee}
html{background:var(--funda-deep)}
body{background:
radial-gradient(circle at 8% 6%,rgba(201,154,46,.20),transparent 24rem),
radial-gradient(circle at 94% 18%,rgba(184,95,125,.20),transparent 28rem),
radial-gradient(circle at 48% 72%,rgba(24,73,139,.25),transparent 38rem),
linear-gradient(155deg,#020d25 0%,#061a42 42%,#071d49 72%,#030f29 100%)!important;
background-attachment:fixed!important;color:#eaf0f8;min-height:100vh}
body:before{content:'';position:fixed;inset:0;pointer-events:none;z-index:-1;background-image:linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px);background-size:42px 42px;mask-image:linear-gradient(to bottom,rgba(0,0,0,.7),transparent 80%)}
header{background:rgba(3,18,47,.92)!important;border-color:rgba(241,207,121,.22)!important;box-shadow:0 12px 32px rgba(0,0,0,.22)}
header .brand div:first-child{color:#fff!important}header a[href='courses-public.html']{color:#f4e7bd!important}header a[href='login.html']{background:linear-gradient(135deg,#c99a2e,#e1b950)!important;color:#071d49!important;box-shadow:0 8px 22px rgba(201,154,46,.22)}
main{position:relative}
#loading,#errorBox{background:linear-gradient(145deg,#fbf6ec,#f8e9ee)!important;border-color:rgba(241,207,121,.34)!important;color:#24364f!important}
#courseContent>div>section{background:linear-gradient(150deg,#fbf6ec 0%,#fff8ea 58%,#f8e9ee 125%)!important;border-color:rgba(241,207,121,.30)!important;box-shadow:0 26px 70px rgba(0,0,0,.28)!important}
#courseHero{background:linear-gradient(135deg,#03122f 0%,#0b2f70 58%,#b85f7d 112%)!important}
#heroOverlay{background:linear-gradient(to top,rgba(3,18,47,.88),rgba(3,18,47,.2),rgba(3,18,47,.08))!important}
#courseCategory{background:#f5dbe4!important;color:#7c3450!important}#courseDuration{background:#fff1c9!important;color:#75550b!important}
#courseContent aside>div:first-child{background:linear-gradient(155deg,#fbf6ec 0%,#fff4dc 64%,#f5dbe4 130%)!important;border-color:rgba(201,154,46,.42)!important;box-shadow:0 24px 58px rgba(0,0,0,.26)!important}
#courseContent aside>div:last-child{background:linear-gradient(145deg,#fff1c9,#f5dbe4)!important;border-color:rgba(201,154,46,.42)!important}
#enrollBtn{background:linear-gradient(135deg,#071d49,#0b2f70)!important;box-shadow:0 12px 28px rgba(7,29,73,.24)!important}
#enrollBtn:hover{background:linear-gradient(135deg,#0b2f70,#123e82)!important}
#createAccountLink{background:#f7ead8!important;border-color:#d8b85e!important;color:#071d49!important}
.feature{background:linear-gradient(145deg,#fbf6ec 0%,#fff2d8 65%,#f5dbe4 130%)!important;border-color:rgba(201,154,46,.28)!important}
#courseContent .bg-white,#courseContent .bg-\[\#fbfdff\],#courseContent .bg-\[\#fff\]{background-color:transparent!important}
body .rpoIntro,body .bahero,body .copHero,body [class*='PremiumIntro']{box-shadow:0 24px 62px rgba(0,0,0,.24)!important}
body .rpoSection,body .basec,body .copSection{border-color:rgba(201,154,46,.28)!important;background:linear-gradient(150deg,#fbf6ec,#fff7e8 72%,#f8e9ee 130%)!important}
body .cpcard,body .bacard,body .cpoutcome,body .baoutcome,body .cpapply div,body .baapply div,body .cpmodule,body .bamodule{background:linear-gradient(145deg,#fbf6ec,#fff7e6 74%,#f8e9ee 135%)!important;border-color:rgba(201,154,46,.24)!important}
body .cpinclude,body .bainclude{background:#f7ead8!important;border-color:rgba(201,154,46,.26)!important}
footer{background:rgba(3,18,47,.88)!important;border-color:rgba(241,207,121,.18)!important;color:#cbd7e7!important}footer *{color:#cbd7e7!important}
@media(max-width:700px){body{background-attachment:scroll!important;background:radial-gradient(circle at 90% 7%,rgba(184,95,125,.2),transparent 20rem),radial-gradient(circle at 8% 20%,rgba(201,154,46,.16),transparent 18rem),linear-gradient(160deg,#020d25,#071d49 60%,#03122f)!important}main{padding-top:20px!important;padding-bottom:28px!important}header{background:rgba(3,18,47,.97)!important}}
`;
document.head.appendChild(style);
document.body.classList.add('fundaCourseOverviewBrand');
})();