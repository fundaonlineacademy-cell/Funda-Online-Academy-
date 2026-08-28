(()=>{
  if(document.getElementById('fundaNavyGoldTheme')) return;
  const s=document.createElement('style');
  s.id='fundaNavyGoldTheme';
  s.textContent=`
  :root{
    --funda-navy-950:#03101f;
    --funda-navy-900:#06172d;
    --funda-navy-800:#0a2344;
    --funda-navy-700:#12345d;
    --funda-gold:#d4af58;
    --funda-gold-soft:#ead79d;
    --funda-gold-pale:#f6edd6;
    --funda-ivory:#f7f4ec;
    --funda-ink:#10213f;
    --funda-muted:#667085;
    --funda-line:#ddd7ca;
  }
  body{background:linear-gradient(135deg,#f7f4ec 0%,#fbfaf7 52%,#edf2f7 100%)!important;color:var(--funda-ink)!important}
  .side{background:radial-gradient(circle at 15% 7%,rgba(212,175,88,.16),transparent 27%),linear-gradient(165deg,var(--funda-navy-950) 0%,var(--funda-navy-900) 54%,var(--funda-navy-800) 100%)!important;border-right:1px solid rgba(212,175,88,.24)!important;box-shadow:12px 0 34px rgba(3,16,31,.17)!important}
  .brand{background:transparent!important;color:#fff!important;border-bottom:1px solid rgba(255,255,255,.11)!important}
  .brand small{color:var(--funda-gold)!important}
  .sideLabel{color:#b8c4d5!important}
  #directDeptLabel{color:var(--funda-gold-soft)!important}
  .nav button{color:#dbe4f0!important;border-left:3px solid transparent!important}
  .nav button:hover{background:rgba(255,255,255,.07)!important;color:#fff!important;border-left-color:rgba(212,175,88,.55)!important}
  .nav button.on{background:linear-gradient(135deg,var(--funda-gold) 0%,var(--funda-gold-soft) 100%)!important;color:var(--funda-navy-900)!important;border-left-color:#fff4cb!important;box-shadow:0 8px 22px rgba(212,175,88,.22)!important}
  .top{background:radial-gradient(circle at 12% 0%,rgba(212,175,88,.14),transparent 28%),linear-gradient(100deg,var(--funda-navy-950) 0%,var(--funda-navy-900) 48%,var(--funda-navy-800) 100%)!important;border-bottom:1px solid rgba(212,175,88,.22)!important;box-shadow:0 8px 26px rgba(3,16,31,.22)!important}
  .top input{background:rgba(255,255,255,.08)!important;border:1px solid rgba(234,215,157,.30)!important;color:#fff!important}
  .top input:focus{outline:none!important;border-color:var(--funda-gold)!important;box-shadow:0 0 0 3px rgba(212,175,88,.14)!important}
  .top input::placeholder{color:#d9e2ee!important}
  .adminBell{background:rgba(255,255,255,.07)!important;border:1px solid rgba(212,175,88,.30)!important}
  .adminAvatar{background:linear-gradient(135deg,var(--funda-gold),var(--funda-gold-soft))!important;color:var(--funda-navy-900)!important;border-color:#fff6d8!important;box-shadow:0 4px 14px rgba(212,175,88,.23)!important}
  .adminIdentityText b{color:#fff!important}
  .adminIdentityText small{color:var(--funda-gold-soft)!important}
  .adminProfileMenu{border-color:#d8cfbb!important;box-shadow:0 22px 55px rgba(3,16,31,.30)!important}
  .adminProfileMenu .signout{background:linear-gradient(135deg,var(--funda-navy-900),var(--funda-navy-800))!important}
  .content{background:transparent!important}
  .execHead2 h1,.section2 h2{color:var(--funda-navy-900)!important}
  .execHead2 .badge.green{background:var(--funda-gold-pale)!important;color:#6f5315!important;border:1px solid #e4cf98!important}
  .health2,.dept2,.rail2,.audit2,.panel,.card,.metric,.row{background:rgba(255,255,255,.97)!important;border-color:var(--funda-line)!important;box-shadow:0 9px 26px rgba(6,23,45,.07)!important}
  .health2{border-top:3px solid var(--funda-gold)!important}
  .health2 h3,.dept2 h3,.rail2 h3,.health2 strong,.dept2 b,.stat2 b,.goalHead2 b{color:var(--funda-navy-900)!important}
  .dept2{border-top:2px solid transparent!important}
  .dept2:hover{border-color:#cdb56e!important;border-top-color:var(--funda-gold)!important;transform:translateY(-1px);box-shadow:0 12px 30px rgba(6,23,45,.10)!important}
  .bar2{background:#eee9df!important}
  .bar2 i{background:linear-gradient(90deg,var(--funda-navy-700),var(--funda-gold))!important}
  .auditRow2{border-bottom-color:#eee8dc!important}
  .auditDot2{background:var(--funda-navy-700)!important}
  .auditDot2.warn{background:#b88517!important}
  .tag2{background:#edf2f8!important;color:var(--funda-navy-700)!important}
  .tag2.warn{background:var(--funda-gold-pale)!important;color:#7a5915!important}
  .download2,.btn.blue{background:linear-gradient(135deg,var(--funda-navy-900),var(--funda-navy-800))!important;color:#fff!important;border:1px solid rgba(212,175,88,.30)!important}
  .btn.light{background:#fff!important;color:var(--funda-navy-900)!important;border-color:#d8cfbb!important}
  .btn.light:hover{background:var(--funda-gold-pale)!important;border-color:#d7bd77!important}
  .field{border-color:#d9d4c8!important;background:#fff!important}
  .field:focus{outline:none!important;border-color:var(--funda-gold)!important;box-shadow:0 0 0 3px rgba(212,175,88,.12)!important}
  .panel h2,.card h3,.row h3,.metric strong{color:var(--funda-navy-900)!important}
  .metric{border-top:3px solid var(--funda-gold)!important}
  .badge:not(.green):not(.amber):not(.red){background:var(--funda-gold-pale)!important;color:#735718!important}
  @media(max-width:820px){
    .side{box-shadow:14px 0 34px rgba(3,16,31,.30)!important}
    .top{background:linear-gradient(110deg,var(--funda-navy-950),var(--funda-navy-800))!important}
  }
  `;
  document.head.appendChild(s);
})();