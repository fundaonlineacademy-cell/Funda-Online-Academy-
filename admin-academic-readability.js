(()=>{
'use strict';
if(!/admin-v2\.html$/i.test(location.pathname)||window.__fundaAcademicReadability)return;
window.__fundaAcademicReadability=true;
const install=()=>{
  if(document.getElementById('fundaAcademicReadability'))return;
  const s=document.createElement('style');
  s.id='fundaAcademicReadability';
  s.textContent=`
  #view .aqHero,
  #view .aqCard,#view .aqPanel,
  #view .cqaWrap,#view .cqaPanel,
  #view .aci,#view .aciPanel,#view .aciDetail,
  #view .aiPanel,#view .aiModal,
  #view .adp,#view .adt{
    font-family:'Source Sans 3','Segoe UI',Arial,sans-serif;
  }
  #view .aqHero b{font-size:12px!important}
  #view .aqHero h2{font-size:22px!important}
  #view .aqHero p{font-size:14px!important;line-height:1.55!important}
  #view .aqCard span,#view .aqMeta,#view .aqNotice{font-size:12px!important;line-height:1.5!important}
  #view .aqBtn,#view .aqSelect{font-size:13px!important}
  #view .aqTable{font-size:13px!important}
  #view .aqTable th{font-size:11px!important}
  #view .aqPill{font-size:11px!important}

  #view .cqaPanel h3{font-size:15px!important}
  #view .cqaPanel p,#view .cqaField{font-size:13px!important;line-height:1.5!important}
  #view .cqaBtn{font-size:13px!important}
  #view .cqaStat span,#view .cqaMsg{font-size:12px!important}
  #view .cqaTable{font-size:12px!important}
  #view .cqaTable th,#view .cqaPill{font-size:11px!important}

  #view .aci h3,#view .aciPanel h3{font-size:15px!important}
  #view .aci p,#view .aciMeta,#view .aciDetail,#view .aciSel,#view .aciBtn{font-size:12px!important;line-height:1.55!important}
  #view .aciTable{font-size:12px!important}
  #view .aciTable th,#view .aciPill{font-size:11px!important}

  #view .aiHead h3{font-size:16px!important}
  #view .aiHead p,#view .aiNote,#view .aiInput,#view .aiBtn{font-size:12px!important;line-height:1.5!important}
  #view .aiStat span{font-size:11px!important}
  #view .aiTable{font-size:12px!important}
  #view .aiTable th,#view .aiPill{font-size:11px!important}

  #view .adp h3,#view .adtTool h3{font-size:15px!important}
  #view .adp p,#view .adtTool p{font-size:12px!important;line-height:1.55!important}
  #view .adpTable{font-size:12px!important}
  #view .adpTable th{font-size:11px!important}
  #view .adpBtn,#view .adtBtn{font-size:12px!important}
  #view .adpPill,#view .adtPill{font-size:11px!important}
  `;
  document.head.appendChild(s);
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();