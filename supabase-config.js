window.SUPABASE_URL =
  "https://nzwfowwoazmpnwfrednh.supabase.co";

window.SUPABASE_ANON_KEY =
  "sb_publishable_fuB02obKKaki0dRsirVVAw_Wyo99pVP";

window.FUNDA_ADMIN_EMAIL = "";

// Admin Command Center enhancement layers. Kept conditional so student/public pages are unaffected.
if (/admin-v2\.html$/i.test(window.location.pathname)) {
  const adminEnhancements = document.createElement('script');
  adminEnhancements.src = 'admin-enhancements.js?v=20260828-normal-typography';
  adminEnhancements.defer = true;
  document.head.appendChild(adminEnhancements);

  const adminProfileArchitecture = document.createElement('script');
  adminProfileArchitecture.src = 'admin-profile-architecture.js?v=20260828-executive-identity';
  adminProfileArchitecture.defer = true;
  document.head.appendChild(adminProfileArchitecture);
}
