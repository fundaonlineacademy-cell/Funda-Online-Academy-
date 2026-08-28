window.SUPABASE_URL =
  "https://nzwfowwoazmpnwfrednh.supabase.co";

window.SUPABASE_ANON_KEY =
  "sb_publishable_fuB02obKKaki0dRsirVVAw_Wyo99pVP";

window.FUNDA_ADMIN_EMAIL = "";

const identityUi = document.createElement('script'); identityUi.src = 'academy-identity.js?v=' + Date.now(); document.head.appendChild(identityUi);
const publicMarketing = document.createElement('script'); publicMarketing.src = 'marketing-public-tracking.js?v=' + Date.now(); document.head.appendChild(publicMarketing);

if (/admin-v2\.html$/i.test(window.location.pathname)) {
  // Stable core only. Heavy dashboard/department overlays are excluded from
  // startup so the Admin Command Center remains responsive on desktop/mobile.
  // Finance has been refactored to bind once without a whole-document observer.
  const files=['admin-theme-navy-gold.js','admin-report-centre.js','admin-finance-control-centre.js'];
  files.forEach(file=>{const s=document.createElement('script');s.src=file+'?v='+Date.now();document.head.appendChild(s)});
}
