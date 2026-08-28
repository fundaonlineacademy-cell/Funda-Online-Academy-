(()=>{
  if(!/admin-v2\.html$/i.test(location.pathname)) return;
  const active=()=>{const b=document.querySelector('#nav button.on,#nav button.active,.nav button.on,.nav button.active');return !!b&&/communication/i.test(b.textContent||'')};
  const open=()=>{try{window.FundaCommunicationCentre?.open?.()}catch(e){console.error('Communication Centre:',e)}};
  function install(){
    // Own the Communication navigation surface after the legacy Admin has finished loading.
    // Do not render the legacy communication screen first; launch the enhanced centre directly.
    window.communication=function(){setTimeout(open,0)};
    document.addEventListener('click',e=>{
      const b=e.target.closest?.('#nav button,.nav button');
      if(!b||!/communication/i.test(b.textContent||'')) return;
      setTimeout(open,50);
    },false);
    if(active()) setTimeout(open,80);
  }
  if(document.readyState==='complete') setTimeout(install,0);
  else window.addEventListener('load',()=>setTimeout(install,0),{once:true});
})();
