// FUNDA ONLINE ACADEMY — RESPONSIVE TYPOGRAPHY FOUNDATION
// Keeps existing layouts intact while providing one dependable reading font.
(()=>{
  'use strict';
  if(window.__fundaTypography)return;
  window.__fundaTypography=true;

  const page=window.location.pathname;
  // Official certificate/result layouts use purpose-built print typography.
  if(/\/(?:academic-document|certificate-template|results-template)[^/]*\.html$/i.test(page))return;

  const isAdmin=/\/admin-v2\.html$/i.test(page);
  if(isAdmin)document.documentElement.classList.add('funda-admin-typography');

  const hasInter=[...document.querySelectorAll('link[rel="stylesheet"]')]
    .some(link=>/fonts\.googleapis\.com\/css2.*family=Inter/i.test(link.href));

  if(!hasInter){
    const preconnect=document.createElement('link');
    preconnect.rel='preconnect';
    preconnect.href='https://fonts.googleapis.com';
    document.head.appendChild(preconnect);

    const font=document.createElement('link');
    font.rel='stylesheet';
    font.href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap';
    document.head.appendChild(font);
  }

  const style=document.createElement('style');
  style.id='fundaTypographyFoundation';
  style.textContent=`
    :root{
      --funda-ui-font:"Inter","Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    }

    html{
      font-family:var(--funda-ui-font);
      -webkit-text-size-adjust:100%;
      text-size-adjust:100%;
      text-rendering:optimizeLegibility;
    }

    body,button,input,select,textarea,option{
      font-family:var(--funda-ui-font)!important;
    }

    nav a:not(.brand){
      font-family:var(--funda-ui-font)!important;
    }

    /* The Admin desktop was using Arial and operational copy as small as 8px.
       Increase only its desktop reading text so mobile spacing is unchanged. */
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
