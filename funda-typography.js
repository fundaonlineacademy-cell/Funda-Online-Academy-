// FUNDA ONLINE ACADEMY — APPROVED TYPOGRAPHY FOUNDATION
// Source Sans 3 is the approved Academy typeface across public and portal interfaces.
// Existing page-specific sizing, spacing, colours and readability rules remain unchanged.
(()=>{
  'use strict';
  if(window.__fundaTypography && document.getElementById('fundaTypographyFoundation'))return;
  window.__fundaTypography=true;

  const page=window.location.pathname;
  // Official issued certificate/result layouts keep their purpose-built print typography.
  // Their surrounding management and verification interfaces still use the Academy UI font.
  if(/\/(?:academic-document|certificate-template|results-template)[^/]*\.html$/i.test(page))return;

  const isAdmin=/(?:^|\/)(?:admin(?:-[^/]*)?|library-admin)\.html$/i.test(page);
  if(isAdmin)document.documentElement.classList.add('funda-admin-typography');
  document.documentElement.classList.add('funda-source-sans-3');

  const stylesheets=[...document.querySelectorAll('link[rel="stylesheet"]')];
  const hasSourceSans=stylesheets.some(link=>/fonts\.googleapis\.com\/css2.*family=Source(?:\+|%20)Sans(?:\+|%20)3/i.test(link.href));

  if(!hasSourceSans){
    const hasGooglePreconnect=[...document.querySelectorAll('link[rel="preconnect"]')].some(link=>/fonts\.googleapis\.com/i.test(link.href));
    if(!hasGooglePreconnect){
      const preconnect=document.createElement('link');
      preconnect.rel='preconnect';
      preconnect.href='https://fonts.googleapis.com';
      document.head.appendChild(preconnect);
    }
    const font=document.createElement('link');
    font.rel='stylesheet';
    font.href='https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600;700;800;900&display=swap';
    document.head.appendChild(font);
  }

  if(document.getElementById('fundaTypographyFoundation'))return;
  const style=document.createElement('style');
  style.id='fundaTypographyFoundation';
  style.textContent=`
    :root{
      --funda-ui-font:"Source Sans 3","Segoe UI",Roboto,Helvetica,Arial,sans-serif;
      --funda-desktop-heading-font:"Source Sans 3","Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    }

    html{
      font-family:var(--funda-ui-font)!important;
      -webkit-text-size-adjust:100%;
      text-size-adjust:100%;
      text-rendering:optimizeLegibility;
    }

    /*
      One approved Academy font across the visible interface. This deliberately
      overrides legacy Inter, Montserrat, Manrope and Arial declarations without
      changing any page's font sizes, weights, spacing or layout.
    */
    body,
    body div,body main,body section,body article,body header,body footer,body aside,body nav,
    body h1,body h2,body h3,body h4,body h5,body h6,
    body p,body a,body button,body input,body select,body textarea,body option,body optgroup,
    body label,body legend,body summary,body details,
    body ul,body ol,body li,body dl,body dt,body dd,
    body table,body caption,body thead,body tbody,body tfoot,body tr,body th,body td,
    body small,body strong,body b,body em,body blockquote,body figcaption,
    body span:not(.material-icons):not(.material-symbols-outlined):not([class^="fa-"]):not([class*=" fa-"]){
      font-family:var(--funda-ui-font)!important;
    }

    body code,body pre,body kbd,body samp{
      font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace!important;
    }

    /* Common legacy/navigation selectors retained as an additional safeguard. */
    .brand,.brand b,.brand strong,
    .mainnav,.main-nav,.nav,.navbtn,.sdNav,
    .side nav,.sidebar nav,.sideBackOffice,.sdBrand,
    .destination,.footer-brand,.footerBrand,.font-sans{
      font-family:var(--funda-ui-font)!important;
    }

    /* The Admin desktop historically used very small operational copy.
       Keep the approved readability corrections while using Source Sans 3. */
    html.funda-admin-typography{
      --m:#475569;
      --funda-muted:#475569;
    }

    html.funda-admin-typography .head p,
    html.funda-admin-typography .panel p,
    html.funda-admin-typography .card p,
    html.funda-admin-typography .row p,
    html.funda-admin-typography .metric small,
    html.funda-admin-typography .muted,
    html.funda-admin-typography .execHead p,
    html.funda-admin-typography .health small,
    html.funda-admin-typography .dept small,
    html.funda-admin-typography .rail small,
    html.funda-admin-typography .section small,
    html.funda-admin-typography .auditRow p,
    html.funda-admin-typography .stat,
    html.funda-admin-typography .goalHead,
    html.funda-admin-typography .tbl th{
      color:#334155!important;
    }

    @media (min-width:821px){
      html.funda-admin-typography .nav button{
        font-size:14px!important;
        line-height:1.45!important;
      }
      html.funda-admin-typography .execHead h1{
        font-size:24px!important;
        line-height:1.2!important;
      }
      html.funda-admin-typography .execHead p{
        font-size:14px!important;
        line-height:1.55!important;
      }
      html.funda-admin-typography .health h3,
      html.funda-admin-typography .dept h3,
      html.funda-admin-typography .rail h3{
        font-size:14px!important;
        line-height:1.4!important;
      }
      html.funda-admin-typography .health strong{
        font-size:23px!important;
        line-height:1.25!important;
      }
      html.funda-admin-typography .health small,
      html.funda-admin-typography .dept small,
      html.funda-admin-typography .rail small{
        font-size:13px!important;
        line-height:1.55!important;
      }
      html.funda-admin-typography .section h2{
        font-size:19px!important;
        line-height:1.3!important;
      }
      html.funda-admin-typography .section small,
      html.funda-admin-typography .dept b{
        font-size:13px!important;
        line-height:1.5!important;
      }
      html.funda-admin-typography .auditRow b{
        font-size:13px!important;
        line-height:1.4!important;
      }
      html.funda-admin-typography .auditRow p,
      html.funda-admin-typography .stat,
      html.funda-admin-typography .goalHead{
        font-size:12px!important;
        line-height:1.5!important;
      }
      html.funda-admin-typography .tag{
        font-size:10px!important;
      }
      html.funda-admin-typography .safeId b{
        font-size:13px!important;
      }
      html.funda-admin-typography .safeId small{
        font-size:11px!important;
      }
      html.funda-admin-typography .panel p,
      html.funda-admin-typography .card p,
      html.funda-admin-typography .row p,
      html.funda-admin-typography .metric p{
        font-size:14px!important;
        line-height:1.55!important;
      }
      html.funda-admin-typography .tbl{
        font-size:13px!important;
      }
      html.funda-admin-typography .tbl th{
        font-size:11px!important;
      }
      html.funda-admin-typography .btn{
        font-size:13px!important;
      }
    }
  `;
  document.head.appendChild(style);
})();
