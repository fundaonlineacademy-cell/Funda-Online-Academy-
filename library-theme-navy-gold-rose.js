(()=>{
if(!/digital-library\.html$/i.test(location.pathname))return;
const css=document.createElement('style');
css.id='funda-library-premium-theme';
css.textContent=`
:root{--navy:#020817!important;--navy2:#06132c!important;--royal:#102a59!important;--gold:#d5aa45!important;--rose:#c96f8d!important;--rose-soft:#f8e9ef!important;--ink:#121d34!important;--line:#e6dce2!important;--soft:#faf6f8!important}
body{background:linear-gradient(180deg,#f8f2f5 0,#f4f5f8 42%,#eef2f7 100%)!important}
.navy{background:linear-gradient(108deg,#020817 0%,#06132c 56%,#111633 84%,#5d263e 135%)!important}
header.navy{border-bottom:2px solid #d5aa45!important;box-shadow:0 8px 28px rgba(2,8,23,.27)!important}
header .brand{color:#fff!important;letter-spacing:.025em}header img{border:1px solid rgba(213,170,69,.78)!important;box-shadow:0 0 0 3px rgba(255,255,255,.055)}
.card,.resource{border-color:#e7dce2!important;box-shadow:0 6px 20px rgba(2,8,23,.065)!important}.card{background:linear-gradient(180deg,#fff 0%,#fffcfd 100%)!important}
.sidebar-btn{color:#3d465a!important}.sidebar-btn.active,.sidebar-btn:hover{background:linear-gradient(90deg,#030b1d,#10244a)!important;color:#fff!important;box-shadow:inset 3px 0 #d5aa45!important}.sidebar-btn.active span,.sidebar-btn:hover span{color:#fff!important}
.chip{border-color:#e3d7de!important;background:#fff!important;color:#263249!important}.chip:hover{border-color:#c96f8d!important;color:#78304b!important}.chip.active{background:linear-gradient(100deg,#030b1d,#102a59)!important;color:#fff!important;border-color:#d5aa45!important;box-shadow:0 3px 10px rgba(2,8,23,.17)!important}
.cover{background:linear-gradient(145deg,#030b1d 0%,#102a59 64%,#873d58 112%)!important;border:1px solid rgba(213,170,69,.75)!important}.cover:after{content:'';position:absolute;top:0;right:0;width:22px;height:22px;background:linear-gradient(135deg,transparent 49%,rgba(213,170,69,.9) 50%);pointer-events:none}
.btn.primary{background:linear-gradient(100deg,#030b1d,#102a59)!important;color:#fff!important;border:1px solid rgba(213,170,69,.72)!important}.btn.primary:hover{background:#0b2148!important}.btn.alt{background:#fff!important;border-color:#decfd8!important;color:#07142e!important}.btn.alt:hover{background:#f8e9ef!important;border-color:#c96f8d!important;color:#6f2944!important}
.progress{background:#eee5ea!important}.progress>span{background:linear-gradient(90deg,#c96f8d,#d5aa45)!important}
.rightcol>.navy{border:1px solid #d5aa45!important}.stat{background:linear-gradient(145deg,#fffdfd,#faedf2)!important;border-color:rgba(213,170,69,.4)!important}
#content>div.card:first-child{border-top:3px solid #d5aa45!important;position:relative;overflow:hidden}#content>div.card:first-child:after{content:'';position:absolute;right:-42px;top:-58px;width:130px;height:130px;border-radius:50%;background:rgba(201,111,141,.12);pointer-events:none}
#content h1,#content h2,.rightcol .text-\[\#06152f\]{color:#030b1d!important}[data-feature="notes"]{border-left:2px solid rgba(201,111,141,.5)}
.leftcol>div:last-child{background:linear-gradient(145deg,#fff8e7,#faeaf0)!important;border-color:#e2c98f!important}.rightcol>div:last-child{background:linear-gradient(145deg,#fff7e5,#fae9ef)!important;border-color:#e0c485!important}
.topsearch input{border:1px solid rgba(213,170,69,.48)!important;box-shadow:0 4px 14px rgba(0,0,0,.09)!important}.topsearch input:focus{outline:2px solid rgba(201,111,141,.28)!important;border-color:#d5aa45!important}
#avatar{background:linear-gradient(145deg,#d5aa45,#c96f8d)!important;color:#030b1d!important;border:1px solid rgba(255,255,255,.55)}
header button[title="Notifications"]{color:#d5aa45!important}header button[title="Help"]{color:#f1c6d4!important}
`;document.head.appendChild(css);
})();