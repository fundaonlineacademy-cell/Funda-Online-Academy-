(()=>{
if(!/digital-library\.html$/i.test(location.pathname))return;
const css=`
:root{--navy:#030b1d!important;--navy2:#071a3d!important;--royal:#102b62!important;--gold:#d7ad4a!important;--pink:#d58aa5!important;--pink-soft:#f9edf2!important;--ink:#101a31!important;--line:#e5d9dd!important;--soft:#f8f5f6!important}
body{background:linear-gradient(180deg,#f8f5f6 0,#f4f6fa 45%,#f7f4f5 100%)!important;color:var(--ink)!important}
.navy{background:linear-gradient(112deg,#020817 0%,#06152f 52%,#0b2149 82%,#3b1730 135%)!important;border-bottom:1px solid rgba(215,173,74,.38)!important}
header.navy{box-shadow:0 10px 30px rgba(3,11,29,.22)!important}
header img{border:1px solid rgba(215,173,74,.6)!important;box-shadow:0 0 0 3px rgba(213,138,165,.10)!important}
.desktopBrandText>div:first-child{color:#fff!important}.desktopBrandText>div:last-child{color:#e4bd62!important}
.topsearch input{border:1px solid rgba(215,173,74,.30)!important;box-shadow:inset 0 0 0 1px rgba(213,138,165,.06)!important}
.card{border-color:#e5d9dd!important;box-shadow:0 7px 22px rgba(3,11,29,.07)!important}
.sidebar-btn.active,.sidebar-btn:hover{background:linear-gradient(90deg,#fff3f6,#f6ead1)!important;color:#071a3d!important;box-shadow:inset 3px 0 0 #d7ad4a!important}
.chip{border-color:#e4d7db!important}.chip:hover{border-color:#d58aa5!important;background:#fff8fa!important}.chip.active{background:linear-gradient(100deg,#071a3d,#102b62)!important;color:#fff!important;border-color:#d7ad4a!important;box-shadow:0 3px 10px rgba(3,11,29,.12)!important}
.resource{border-color:#e5d9dd!important;box-shadow:0 5px 15px rgba(3,11,29,.045)!important}.resource:hover{border-color:#d7ad4a!important;box-shadow:0 9px 24px rgba(3,11,29,.10)!important;transform:translateY(-1px);transition:.18s ease}
.cover{background:linear-gradient(145deg,#102b62 0%,#06152f 58%,#7a3656 130%)!important;box-shadow:inset 0 0 0 1px rgba(215,173,74,.35)!important}
.btn.primary{background:linear-gradient(100deg,#071a3d,#102b62)!important;color:#fff!important;border:1px solid rgba(215,173,74,.42)!important}.btn.primary:hover{box-shadow:0 4px 12px rgba(7,26,61,.2)!important}.btn.alt:hover{border-color:#d58aa5!important;background:#fff7fa!important}
.progress{background:#eee7e9!important}.progress>span{background:linear-gradient(90deg,#d7ad4a 0%,#d58aa5 100%)!important}
.rightcol>.navy{background:linear-gradient(145deg,#030b1d 0%,#071a3d 68%,#5b2945 125%)!important;border:1px solid rgba(215,173,74,.45)!important}.stat{border-color:rgba(215,173,74,.24)!important}
.rightcol .card{border-top:2px solid rgba(215,173,74,.55)!important}
.rightcol>div:last-child{background:linear-gradient(135deg,#fff8f2,#faeef3)!important;border-color:#e5c8d2!important}
#content>.card:first-child{position:relative;overflow:hidden;border-top:2px solid #d7ad4a!important}#content>.card:first-child:after{content:'';position:absolute;width:130px;height:130px;border-radius:50%;right:-55px;top:-75px;background:radial-gradient(circle,rgba(213,138,165,.18),rgba(215,173,74,.05) 58%,transparent 60%);pointer-events:none}
h1,h2,h3,.brand{letter-spacing:-.015em}h1,h2,h3{color:#071a3d!important}
[data-funda-mobile-menu],#fundaMobileMenu{border-color:#d7ad4a!important}
`;
const s=document.createElement('style');s.id='fundaLibraryPremiumTheme';s.textContent=css;document.head.appendChild(s);
})();