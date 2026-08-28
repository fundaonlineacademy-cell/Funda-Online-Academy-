(()=>{
if(!/digital-library\.html$/i.test(location.pathname))return;
const css=`
:root{--navy:#030b1d!important;--navy2:#071735!important;--royal:#0b234d!important;--gold:#d5aa45!important;--ink:#111b31!important;--line:#e5dce3!important;--soft:#fbf7f9!important;--blush:#c96f8d;--blush-soft:#f8e9ef}
body{background:linear-gradient(180deg,#f8f3f6 0,#f3f5f9 280px,#eef2f7 100%)!important}
.navy{background:linear-gradient(108deg,#020817 0%,#06132c 52%,#111633 82%,#5d263e 132%)!important;border-bottom:2px solid #d5aa45!important;box-shadow:0 8px 28px rgba(3,11,29,.24)!important}
.card{border-color:#e8dfe5!important;box-shadow:0 7px 24px rgba(3,11,29,.07)!important}
.sidebar-btn{color:#3e475d!important}.sidebar-btn.active,.sidebar-btn:hover{background:linear-gradient(90deg,#071735,#16254a)!important;color:#fff!important;box-shadow:inset 3px 0 #d5aa45!important}
.chip{border-color:#e2d6de!important;background:#fff!important;color:#28324a!important}.chip:hover{border-color:#c96f8d!important;color:#7c304d!important}.chip.active{background:linear-gradient(100deg,#071735,#102a59)!important;color:#fff!important;border-color:#d5aa45!important;box-shadow:0 3px 10px rgba(7,23,53,.16)!important}
.resource{border-color:#e7dde3!important;box-shadow:0 5px 18px rgba(3,11,29,.055)!important}.resource:hover{border-color:#d9b7c5!important;box-shadow:0 9px 24px rgba(3,11,29,.1)!important;transform:translateY(-1px);transition:.18s ease}
.cover{background:linear-gradient(145deg,#071735 0%,#0d2754 62%,#7e3854 125%)!important;box-shadow:inset 0 0 0 1px rgba(213,170,69,.38)!important}
.btn.primary{background:linear-gradient(100deg,#06132c,#102a59)!important;color:#fff!important;border:1px solid rgba(213,170,69,.48)!important}.btn.primary:hover{box-shadow:0 4px 12px rgba(3,11,29,.2)!important}.btn.alt{border-color:#dfd2da!important;color:#18243d!important}.btn.alt:hover{background:#f8e9ef!important;border-color:#c96f8d!important;color:#702c47!important}
.progress{background:#eee6eb!important}.progress>span{background:linear-gradient(90deg,#c96f8d,#d5aa45)!important}
#content h1,#content h2,.leftcol .text-\[11px\]{color:#030b1d!important}
.text-\[\#c99a2e\]{color:#b78927!important}
.bg-\[\#f2f6fd\]{background:#fbf3f6!important}.border-\[\#dce5f1\]{border-color:#eadbe2!important}
.rightcol>div:first-child{background:linear-gradient(145deg,#06132c,#0c234c)!important;border-color:#d5aa45!important}
.topsearch input{border:1px solid rgba(213,170,69,.32)!important;box-shadow:0 2px 12px rgba(0,0,0,.08)!important}.topsearch input:focus{border-color:#d5aa45!important;box-shadow:0 0 0 3px rgba(213,170,69,.14)!important}
#avatar{background:linear-gradient(145deg,#d5aa45,#c96f8d)!important;color:#071735!important;box-shadow:0 0 0 2px rgba(255,255,255,.18)!important}
header button[title="Notifications"]{color:#d5aa45!important}header button[title="Help"]{color:#f0c7d5!important}
`;
const s=document.createElement('style');s.id='funda-library-luxury-theme';s.textContent=css;document.head.appendChild(s);
})();