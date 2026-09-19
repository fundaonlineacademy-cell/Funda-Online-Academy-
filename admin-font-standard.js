// FUNDA ONLINE ACADEMY — ADMIN APPROVED FONT STANDARD
// Owner-approved 19 September 2026.
// Applies Source Sans 3 to the complete Admin Command Center, including all
// dynamically rendered department tabs, forms, tables, dialogs and injected modules.
(()=>{
  'use strict';
  if(window.__foaAdminFontStandard)return;
  window.__foaAdminFontStandard=true;

  const FONT='"Source Sans 3","Segoe UI",Roboto,Helvetica,Arial,sans-serif';

  // Keep the approved web font available even when admin-v2.html rewrites the
  // document with admin-v2-core.html.
  if(![...document.querySelectorAll('link[rel="stylesheet"]')].some(
    l=>/fonts\.googleapis\.com\/css2.*Source(?:\+|%20)Sans(?:\+|%20)3/i.test(l.href)
  )){
    const pre=document.createElement('link');
    pre.rel='preconnect';
    pre.href='https://fonts.googleapis.com';
    document.head.appendChild(pre);

    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href='https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600;700;800;900&display=swap';
    document.head.appendChild(link);
  }

  let style=document.getElementById('foaAdminFontStandard');
  if(!style){
    style=document.createElement('style');
    style.id='foaAdminFontStandard';
    document.head.appendChild(style);
  }

  style.textContent=`
    :root{
      --foa-admin-font:${FONT};
    }

    html,body,
    .app,.side,.main,.top,.content,
    #nav,#view,
    body div,body main,body section,body article,body header,body footer,body aside,body nav,
    body h1,body h2,body h3,body h4,body h5,body h6,
    body p,body a,body button,body input,body select,body textarea,body option,body optgroup,
    body label,body legend,body summary,body details,
    body ul,body ol,body li,body dl,body dt,body dd,
    body table,body caption,body thead,body tbody,body tfoot,body tr,body th,body td,
    body small,body strong,body b,body em,body blockquote,body figcaption,
    body span:not(.material-icons):not(.material-symbols-outlined):not([class^="fa-"]):not([class*=" fa-"]){
      font-family:var(--foa-admin-font)!important;
    }

    button,input,select,textarea{
      font-family:var(--foa-admin-font)!important;
    }

    body code,body pre,body kbd,body samp{
      font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace!important;
    }
  `;

  document.documentElement.classList.add('foa-admin-source-sans-3');
})();