window.SUPABASE_URL =
  "https://nzwfowwoazmpnwfrednh.supabase.co";

window.SUPABASE_ANON_KEY =
  "sb_publishable_fuB02obKKaki0dRsirVVAw_Wyo99pVP";

window.FUNDA_ADMIN_EMAIL = "";

// Admin Command Center enhancement layer. Kept conditional so student/public pages are unaffected.
if (/admin-v2\.html$/i.test(window.location.pathname)) {
  const adminEnhancements = document.createElement('script');
  adminEnhancements.src = 'admin-enhancements.js?v=20260828-system-control';
  adminEnhancements.defer = true;
  document.head.appendChild(adminEnhancements);
}
