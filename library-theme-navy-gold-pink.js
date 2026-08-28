(()=>{
if(!/digital-library\.html$/i.test(location.pathname))return;
const style=document.createElement('style');
style.id='funda-library-lux-theme';
style.textContent=`
:root{--navy:#050d21!important;--navy2:#091936!important;--royal:#10264f!important;--gold:#d4a72c!important;--ink:#172033!important;--line:#e6d9df!important;--soft:#fbf7f9!important;--rose:#c86b86;--rose-soft:#f7e8ee}
body{background:linear-gradient(135deg,#f7f3f5 0%,#f3f5f9 52%,#fff7f9 100%)!important}
.navy{background:linear-gradient(112deg,#030919 0%,#07142d 52%,#171127 100%)!important;border-bottom:1px solid rgba(212,167,44,.38)}
header.navy{box-shadow:0 12px 30px rgba(3,9,25,.22)!important}
.card,.resource{border-color:#eadde2!important;box-shadow:0 6px 20px rgba(5,13,33,.065)!important}
.sidebar-btn.active,.sidebar-btn:hover{background:linear-gradient(90deg,#f9edf1,#fff8e8)!important;color:#07142d!important;box-shadow:inset 3px 0 #d4a72c}
.chip{border-color:#eadde2!important;background:#fff!important;color:#253047!important}.chip:hover{border-color:#c86b86!important;background:#fff7fa!important}.chip.active{background:linear-gradient(100deg,#07142d,#171127)!important;color:#f6dc8c!important;border-color:#d4a72c!important}
.cover{background:linear-gradient(145deg,#07142d 0%,#15152f 58%,#7e344f 100%)!important;box-shadow:inset 0 0 0 1px rgba(212,167,44,.32)}
.btn.primary{background:linear-gradient(100deg,#07142d,#15152f)!important;color:#fff!important;box-shadow:0 3px 10px rgba(5,13,33,.16)}.btn.primary:hover{box-shadow:0 4px 14px rgba(200,107,134,.24)!important}.btn.alt{border-color:#eadde2!important;color:#07142d!important}.btn.alt:hover{background:#fff6f9!important;border-color:#c86b86!important}
.progress{background:#f0e5e9!important}.progress>span{background:linear-gradient(90deg,#d4a72c,#c86b86)!important}
.rightcol>.navy{background:linear-gradient(145deg,#050d21,#101a35 70%,#35172b)!important;border:1px solid rgba(212,167,44,.42)!important}
.rightcol .stat{border-color:rgba(212,167,44,.25)!important}
#content>.card:first-child{border-top:3px solid #d4a72c!important;background:linear-gradient(100deg,#fff 0%,#fff 72%,#fff6f9 100%)!important}
#content>.card:first-child p:first-child{color:#c08c13!important}
[data-feature="notes"]{color:#8f3e5b!important}
.leftcol>div:last-child{background:linear-gradient(145deg,#fff8e8,#f9edf1)!important;border-color:#e4c974!important}
.rightcol>div:last-child{background:linear-gradient(145deg,#fff8e8,#f9edf1)!important;border-color:#e4c974!important}
#search:focus{box-shadow:0 0 0 3px rgba(212,167,44,.2),0 0 0 5px rgba(200,107,134,.12)!important}
::selection{background:#c86b86;color:#fff}
`;
document.head.appendChild(style);
})();