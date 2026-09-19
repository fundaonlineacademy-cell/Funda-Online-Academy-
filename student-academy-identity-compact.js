(()=>{"use strict";
if(!/(^|\/)dashboard\.html$/i.test(location.pathname))return;

function installStyle(){
  if(document.getElementById("studentAcademyIdentityCompactStyle"))return;
  const style=document.createElement("style");
  style.id="studentAcademyIdentityCompactStyle";
  style.textContent=`
#studentAcademyIdentitySummary,#studentAcademyIdentityModal,#studentAcademyIdentityModal #academy-identity,#studentAcademyIdentityModal #academy-identity *{font-family:"Source Sans 3","Segoe UI",Roboto,Helvetica,Arial,sans-serif!important}
#studentAcademyIdentitySummary{margin:28px 0 2px;padding:22px 24px;border:1px solid #dbe6f2;border-radius:24px;background:#fff;box-shadow:0 5px 16px rgba(20,49,77,.05)}
#studentAcademyIdentitySummary .saiRow{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}
#studentAcademyIdentitySummary .saiKicker{margin:0;color:#9a6c0d;font-size:11px;letter-spacing:.17em;font-weight:900;text-transform:uppercase}
#studentAcademyIdentitySummary h2{margin:7px 0 0;color:#17324a!important;font-size:22px;line-height:1.3;font-weight:900}
#studentAcademyIdentitySummary .saiText{margin:9px 0 0;color:#455565;font-size:14px;line-height:1.65;font-weight:600}
#studentAcademyIdentitySummary button{flex:0 0 auto;min-height:46px;padding:12px 17px;border:0;border-radius:13px;background:#071d49;color:#fff;font-size:12px;font-weight:900;cursor:pointer}
#studentAcademyIdentitySummary button:hover{background:#0b2f70}
#studentAcademyIdentityModal{display:none;position:fixed;inset:0;z-index:99999;background:rgba(2,12,28,.72);padding:18px;overflow-y:auto}
#studentAcademyIdentityModal.is-open{display:block}
#studentAcademyIdentityModal .saiModalShell{max-width:980px;margin:22px auto;background:#fff;border-radius:24px;box-shadow:0 24px 70px rgba(3,16,31,.28);overflow:hidden}
#studentAcademyIdentityModal .saiModalTop{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 16px;background:#071d49;color:#fff;border-bottom:1px solid rgba(255,255,255,.12)}
#studentAcademyIdentityModal .saiModalTop strong{font-size:13px;letter-spacing:.04em}
#studentAcademyIdentityModal .saiClose{min-height:40px;padding:9px 14px;border:1px solid rgba(255,255,255,.25);border-radius:11px;background:rgba(255,255,255,.10);color:#fff;font-size:12px;font-weight:900;cursor:pointer}
#studentAcademyIdentityModal .saiModalContent{padding:0}
#studentAcademyIdentityModal #academy-identity{margin:0!important;border:0!important;border-radius:0!important;box-shadow:none!important}
body.sdV2:not([data-sd-view="dashboard"]) #studentAcademyIdentitySummary{display:none!important}
@media(max-width:700px){
  #studentAcademyIdentitySummary{padding:19px 18px}
  #studentAcademyIdentitySummary .saiRow{flex-direction:column}
  #studentAcademyIdentitySummary button{width:100%}
  #studentAcademyIdentityModal{padding:10px}
  #studentAcademyIdentityModal .saiModalShell{margin:10px auto;border-radius:18px}
}
`;
  document.head.appendChild(style);
}

function compactIdentity(){
  if(document.getElementById("studentAcademyIdentitySummary"))return true;
  const identity=document.getElementById("academy-identity");
  if(!identity)return false;

  installStyle();

  const summary=document.createElement("section");
  summary.id="studentAcademyIdentitySummary";
  summary.setAttribute("aria-labelledby","studentAcademyIdentityHeading");
  summary.innerHTML=`
    <div class="saiRow">
      <div>
        <p class="saiKicker">Our Academy Identity</p>
        <h2 id="studentAcademyIdentityHeading">What Funda Online Academy Stands For</h2>
        <p class="saiText">Learn. Grow. Achieve. View the Academy's Vision, Mission, Purpose, Core Values, Strategic Objectives and Commitment.</p>
      </div>
      <button id="openStudentAcademyIdentity" type="button" aria-haspopup="dialog" aria-controls="studentAcademyIdentityModal">View Academy Identity</button>
    </div>`;

  identity.parentNode.insertBefore(summary,identity);

  const modal=document.createElement("div");
  modal.id="studentAcademyIdentityModal";
  modal.setAttribute("role","dialog");
  modal.setAttribute("aria-modal","true");
  modal.setAttribute("aria-labelledby","studentAcademyIdentityModalTitle");
  modal.innerHTML=`
    <div class="saiModalShell">
      <div class="saiModalTop">
        <strong id="studentAcademyIdentityModalTitle">Funda Online Academy Identity</strong>
        <button class="saiClose" id="closeStudentAcademyIdentity" type="button">Close</button>
      </div>
      <div class="saiModalContent"></div>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelector(".saiModalContent").appendChild(identity);

  const openButton=summary.querySelector("#openStudentAcademyIdentity");
  const closeButton=modal.querySelector("#closeStudentAcademyIdentity");
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
  modal.addEventListener("click",e=>{if(e.target===modal)close();});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&modal.classList.contains("is-open"))close();});

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
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();