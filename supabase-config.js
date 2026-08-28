window.SUPABASE_URL =
  "https://nzwfowwoazmpnwfrednh.supabase.co";

window.SUPABASE_ANON_KEY =
  "sb_publishable_fuB02obKKaki0dRsirVVAw_Wyo99pVP";

window.FUNDA_ADMIN_EMAIL = "";

// Shared Academy identity: vision, mission, purpose, values and strategy.
const identityUi = document.createElement('script');
identityUi.src = 'academy-identity.js?v=' + Date.now();
document.head.appendChild(identityUi);

// Admin Command Center direct UI layer. Student/public pages are unaffected.
if (/admin-v2\.html$/i.test(window.location.pathname)) {
  const adminUi = document.createElement('script');
  adminUi.src = 'admin-ui-direct.js?v=' + Date.now();
  document.head.appendChild(adminUi);

  const adminTheme = document.createElement('script');
  adminTheme.src = 'admin-theme-navy-gold.js?v=' + Date.now();
  document.head.appendChild(adminTheme);

  const adminReports = document.createElement('script');
  adminReports.src = 'admin-report-centre.js?v=' + Date.now();
  document.head.appendChild(adminReports);
}
