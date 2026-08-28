(()=>{
if(!/digital-library\.html$/i.test(location.pathname))return;
const css=document.createElement('style');
css.id='funda-library-premium-theme';
css.textContent=`
:root{--navy:#071426!important;--navy2:#0b1d36!important;--royal:#122b4f!important;--gold:#d6ad55!important;--rose:#c86f86!important;--rose-soft:#f8e9ee!important;--ink:#152033!important;--line:#e4dccd!important;--soft:#f8f5f1!important}
body{background:linear-gradient(180deg,#f7f3ee 0,#f5f7fa 45%,#f8f4f5 100%)!important}
.navy{background:linear-gradient(115deg,#06111f 0%,#0a1c34 58%,#132a48 100%)!important}
header.navy{border-bottom:2px solid #d6ad55!important;box-shadow:0 8px 28px rgba(7,20,38,.24)!important}
header .brand{color:#fff!important;letter-spacing:.025em}header img{border:1px solid rgba(214,173,85,.75)!important;box-shadow:0 0 0 3px rgba(255,255,255,.06)}
.card,.resource{border-color:#e5ddcf!important;box-shadow:0 6px 20px rgba(7,20,38,.065)!important}
.card{background:linear-gradient(180deg,#fff 0%,#fffdfb 100%)!important}
.sidebar-btn{color:#3c4657!important}.sidebar-btn.active,.sidebar-btn:hover{background:linear-gradient(90deg,#071426,#102a4c)!important;color:#fff!important;box-shadow:inset 3px 0 0 #d6ad55!important}.sidebar-btn.active span,.sidebar-btn:hover span{color:#fff!important}
.chip{border-color:#e2d8c7!important;background:#fffdfb!important;color:#26354a!important}.chip:hover{border-color:#d6ad55!important}.chip.active{background:#071426!important;color:#fff!important;border-color:#d6ad55!important;box-shadow:0 3px 10px rgba(7,20,38,.16)!important}
.cover{background:linear-gradient(145deg,#071426 0%,#142f52 62%,#9b5368 100%)!important;border:1px solid rgba(214,173,85,.75)!important}.cover:after{content:'';position:absolute;top:0;right:0;width:22px;height:22px;background:linear-gradient(135deg,transparent 49%,rgba(214,173,85,.88) 50%);pointer-events:none}
.btn.primary{background:linear-gradient(100deg,#071426,#173456)!important;color:#fff!important;border:1px solid #d6ad55!important}.btn.primary:hover{background:#0c203a!important}.btn.alt{background:#fffdfb!important;border-color:#dbc99f!important;color:#071426!important}.btn.alt:hover{background:#fbf2dd!important}
.progress{background:#eee7df!important}.progress>span{background:linear-gradient(90deg,#d6ad55,#c86f86)!important}
.rightcol>.navy{border:1px solid #d6ad55!important}.stat{background:linear-gradient(145deg,#fffdfb,#f9eef1)!important;border-color:rgba(214,173,85,.42)!important}
#content>div.card:first-child{border-top:3px solid #d6ad55!important;position:relative;overflow:hidden}#content>div.card:first-child:after{content:'';position:absolute;right:-42px;top:-58px;width:130px;height:130px;border-radius:50%;background:rgba(200,111,134,.10);pointer-events:none}
#content h1,#content h2,.rightcol .text-\[\#06152f\]{color:#071426!important}
[data-feature="notes"]{border-left:2px solid rgba(200,111,134,.45)}
.leftcol>div:last-child{background:linear-gradient(145deg,#fff8e9,#faedf1)!important;border-color:#e4cda1!important}
.rightcol>div:last-child{background:linear-gradient(145deg,#fff7e5,#f9e9ee)!important;border-color:#e1c68e!important}
.topsearch input{border:1px solid rgba(214,173,85,.55)!important;box-shadow:0 4px 14px rgba(0,0,0,.08)!important}.topsearch input:focus{outline:2px solid rgba(200,111,134,.32)!important;border-color:#d6ad55!important}
#avatar{background:linear-gradient(145deg,#d6ad55,#b8677d)!important;color:#071426!important;border:1px solid rgba(255,255,255,.55)}
`;document.head.appendChild(css);
})();