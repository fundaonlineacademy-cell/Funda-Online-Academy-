(()=>{
  'use strict';
  if(!/(^|\/)login\.html$/i.test(window.location.pathname))return;
  if(window.__fundaLoginLayoutOrderRestore)return;
  window.__fundaLoginLayoutOrderRestore=true;

  const style=document.createElement('style');
  style.id='fundaLoginLayoutOrderRestoreStyle';
  style.textContent=`
    @media (max-width:1023px){
      .brand-panel{order:1!important}
      .auth-panel{order:2!important}
    }
  `;
  document.head.appendChild(style);
})();
