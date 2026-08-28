window.SUPABASE_URL =
  "https://nzwfowwoazmpnwfrednh.supabase.co";

window.SUPABASE_ANON_KEY =
  "sb_publishable_fuB02obKKaki0dRsirVVAw_Wyo99pVP";

window.FUNDA_ADMIN_EMAIL = "";

const identityUi = document.createElement('script'); identityUi.src = 'academy-identity.js?v=' + Date.now(); document.head.appendChild(identityUi);
const publicMarketing = document.createElement('script'); publicMarketing.src = 'marketing-public-tracking.js?v=' + Date.now(); document.head.appendChild(publicMarketing);

if (/admin-v2\.html$/i.test(window.location.pathname)) {
  // Stable Admin stack: each upgrade owns one navigation surface only.
  // No whole-document MutationObservers and no duplicate Communication controller.
  const files=['admin-theme-navy-gold.js','admin-report-centre.js','admin-executive-safe.js','admin-finance-control-centre.js','admin-governance-safe.js','admin-communication-v2.js'];
  files.forEach(file=>{const s=document.createElement('script');s.src=file+'?v='+Date.now();document.head.appendChild(s)});
}
