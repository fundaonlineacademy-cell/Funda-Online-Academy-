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
  .app{grid-template-columns:292px minmax(0,1fr)!important}
  .side{width:292px!important;padding:24px 20px 28px!important;background:linear-gradient(180deg,#fffdf7 0%,#fffaf0 58%,#fffdf8 100%)!important;border-right:1px solid #ead9ad!important;box-shadow:18px 0 50px rgba(2,17,36,.18)!important;color:#17324a!important;scrollbar-color:#d4aa42 #f8f0dc}
  .brand{padding:0 8px 20px!important;background:transparent!important;color:#17324a!important;border-bottom:1px solid #ead9ad!important;font-size:18px!important;line-height:1.18!important}
  .brand small{margin-top:6px!important;color:#8a5f09!important;font-size:10px!important;line-height:1.45!important;letter-spacing:.18em!important}
  .sideLabel{padding:18px 8px 6px!important;color:#8a5f09!important;font-size:10px!important;font-weight:900!important;letter-spacing:.16em!important}
  #directDeptLabel{color:#8a5f09!important}
  .nav{display:grid!important;gap:5px!important;margin-top:18px!important}
  .nav button{min-height:46px!important;padding:12px 13px!important;border:0!important;border-radius:12px!important;background:transparent!important;color:#17324a!important;font-size:13px!important;font-weight:800!important;line-height:1.35!important}
  .nav button:hover{background:#fff3cf!important;color:#17324a!important}
  .nav button.on{background:linear-gradient(90deg,#f5dd9a 0%,#e1b84c 100%)!important;color:#17324a!important;box-shadow:0 5px 15px rgba(184,133,22,.16)!important}
  .nav button:focus-visible{outline:3px solid #d4aa42!important;outline-offset:2px!important}
  html body .side .brand.funda-strong-text.funda-strong-text{color:#17324a!important}
  html body .side .brand small.funda-strong-text.funda-strong-text,
  html body .side .sideLabel.funda-strong-text.funda-strong-text{color:#8a5f09!important}
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
    .side{width:min(88vw,320px)!important;padding:21px 17px 26px!important;box-shadow:18px 0 45px rgba(3,16,31,.26)!important}
    .top{background:linear-gradient(110deg,var(--funda-navy-950),var(--funda-navy-800))!important}
  }
  `;
  document.head.appendChild(s);
})();

// Direct, one-time bridge from the legacy Communication Hub to the upgraded centre.
// This avoids cache-dependent nav binding and does not use observers or polling.
(()=>{
  if(!/admin-v2\.html$/i.test(location.pathname)) return;
  const ensureCommunicationV2=()=>new Promise(resolve=>{
    if(window.FundaCommunicationCentre){resolve();return;}
    let existing=document.querySelector('script[data-funda-communication-direct]');
    if(existing){existing.addEventListener('load',resolve,{once:true});return;}
    const s=document.createElement('script');
    s.dataset.fundaCommunicationDirect='1';
    s.src='admin-communication-v2.js?v=20260828-direct-bridge-'+Date.now();
    s.onload=resolve;
    document.head.appendChild(s);
  });
  window.addEventListener('load',async()=>{
    await ensureCommunicationV2();
    const legacy=window.communication;
    if(typeof legacy!=='function'||legacy.__fundaV2Bridge)return;
    function upgradedCommunication(){
      legacy.apply(this,arguments);
      setTimeout(()=>window.FundaCommunicationCentre?.open(),0);
    }
    upgradedCommunication.__fundaV2Bridge=true;
    window.communication=upgradedCommunication;
    if(window.current==='communication') window.FundaCommunicationCentre?.open();
  },{once:true});
})();
