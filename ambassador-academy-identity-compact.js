(()=>{
"use strict";
if(!/(^|\/)ambassador-portal-v2\.html$/i.test(location.pathname))return;
if(window.__fundaAmbassadorCompactAcademyIdentity)return;
window.__fundaAmbassadorCompactAcademyIdentity=true;

function installStyle(){
  if(document.getElementById("ambassadorAcademyIdentityCompactStyle"))return;
  const style=document.createElement("style");
  style.id="ambassadorAcademyIdentityCompactStyle";
  style.textContent=`
#ambassadorAcademyIdentitySummary{margin:14px 0 2px;padding:18px 20px;border:1px solid #dbe4ea;border-radius:14px;background:#fff;box-shadow:0 4px 18px rgba(18,57,85,.07)}
#ambassadorAcademyIdentitySummary .aaiRow{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}
#ambassadorAcademyIdentitySummary .aaiKicker{margin:0;color:#9b721c;font-size:9px;letter-spacing:.14em;font-weight:900;text-transform:uppercase}
#ambassadorAcademyIdentitySummary h2{margin:5px 0 0;color:#17324a!important;font-size:19px;line-height:1.3}
#ambassadorAcademyIdentitySummary .aaiText{margin:7px 0 0;color:#667583;font-size:12px;line-height:1.55}
#ambassadorAcademyIdentitySummary button{flex:0 0 auto;min-height:42px;padding:10px 14px;border:0;border-radius:10px;background:#173f62;color:#fff;font-size:11px;font-weight:900;cursor:pointer}
#ambassadorAcademyIdentitySummary button:hover{background:#0b2b49}
#ambassadorAcademyIdentityModal{display:none;position:fixed;inset:0;z-index:100000;background:rgba(2,10,24,.75);padding:18px;overflow-y:auto}
#ambassadorAcademyIdentityModal.is-open{display:block}
#ambassadorAcademyIdentityModal .aaiModalShell{max-width:940px;margin:20px auto;background:#fff;border-radius:18px;box-shadow:0 30px 80px rgba(0,0,0,.35);overflow:hidden}
#ambassadorAcademyIdentityModal .aaiModalTop{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:15px 17px;background:linear-gradient(135deg,#07172f,#0b2b49);color:#fff}
#ambassadorAcademyIdentityModal .aaiModalTop strong{font-size:13px;letter-spacing:.03em}
#ambassadorAcademyIdentityModal .aaiClose{min-height:40px;padding:9px 14px;border:1px solid rgba(255,255,255,.24);border-radius:10px;background:rgba(255,255,255,.10);color:#fff;font-size:11px;font-weight:900;cursor:pointer}
#ambassadorAcademyIdentityModal .aaiModalContent{padding:0}
#ambassadorAcademyIdentityModal #academy-identity{margin:0!important;border:0!important;border-radius:0!important;box-shadow:none!important}
@media(max-width:700px){
  #ambassadorAcademyIdentitySummary{padding:17px 16px}
  #ambassadorAcademyIdentitySummary .aaiRow{flex-direction:column}
  #ambassadorAcademyIdentitySummary button{width:100%}
  #ambassadorAcademyIdentityModal{padding:10px}
  #ambassadorAcademyIdentityModal .aaiModalShell{margin:10px auto;border-radius:16px}
}
`;
  document.head.appendChild(style);
}

function compactIdentity(){
  if(document.getElementById("ambassadorAcademyIdentitySummary"))return true;
  const identity=document.getElementById("academy-identity");
  const dashboard=document.querySelector('.section[data-section="dashboard"]');
  if(!identity||!dashboard)return false;

  installStyle();

  const summary=document.createElement("section");
  summary.id="ambassadorAcademyIdentitySummary";
  summary.setAttribute("aria-labelledby","ambassadorAcademyIdentityHeading");
  summary.innerHTML=`
    <div class="aaiRow">
      <div>
        <p class="aaiKicker">Our Academy Identity</p>
        <h2 id="ambassadorAcademyIdentityHeading">What Funda Online Academy Stands For</h2>
        <p class="aaiText">Learn. Grow. Achieve. View the Academy's Vision, Mission, Purpose, Core Values, Strategic Objectives and Commitment.</p>
      </div>
      <button id="openAmbassadorAcademyIdentity" type="button" aria-haspopup="dialog" aria-controls="ambassadorAcademyIdentityModal">View Academy Identity</button>
    </div>`;
  dashboard.appendChild(summary);

  const modal=document.createElement("div");
  modal.id="ambassadorAcademyIdentityModal";
  modal.setAttribute("role","dialog");
  modal.setAttribute("aria-modal","true");
  modal.setAttribute("aria-labelledby","ambassadorAcademyIdentityModalTitle");
  modal.innerHTML=`
    <div class="aaiModalShell">
      <div class="aaiModalTop">
        <strong id="ambassadorAcademyIdentityModalTitle">Funda Online Academy Identity</strong>
        <button class="aaiClose" id="closeAmbassadorAcademyIdentity" type="button">Close</button>
      </div>
      <div class="aaiModalContent"></div>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelector(".aaiModalContent").appendChild(identity);

  const openButton=summary.querySelector("#openAmbassadorAcademyIdentity");
  const closeButton=modal.querySelector("#closeAmbassadorAcademyIdentity");
  let previousFocus=null;

  const open=()=>{
    previousFocus=document.activeElement;
    modal.classList.add("is-open");
    document.body.style.overflow="hidden";
    closeButton.focus();
  };
  const close=()=>{
    modal.classList.remove("is-open");
    document.body.style.overflow="";
    if(previousFocus&&typeof previousFocus.focus==="function")previousFocus.focus();
  };

  openButton.addEventListener("click",open);
  closeButton.addEventListener("click",close);
  modal.addEventListener("click",event=>{if(event.target===modal)close();});
  document.addEventListener("keydown",event=>{if(event.key==="Escape"&&modal.classList.contains("is-open"))close();});

  return true;
}

function boot(){
  if(compactIdentity())return;
  let tries=0;
  const timer=setInterval(()=>{
    tries+=1;
    if(compactIdentity()||tries>=30)clearInterval(timer);
  },150);
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});
else boot();
})();