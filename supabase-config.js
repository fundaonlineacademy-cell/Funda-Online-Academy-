window.SUPABASE_URL =
  "https://nzwfowwoazmpnwfrednh.supabase.co";

window.SUPABASE_ANON_KEY =
  "sb_publishable_fuB02obKKaki0dRsirVVAw_Wyo99pVP";

window.FUNDA_ADMIN_EMAIL = "";

// Admin Command Center enhancement layers. Kept conditional so student/public pages are unaffected.
if (/admin-v2\.html$/i.test(window.location.pathname)) {
  // admin-v2 keeps its authenticated runtime in top-level lexical variables.
  // Bridge those variables onto window so enhancement scripts can detect the ready state.
  const adminRuntimeBridge = document.createElement('script');
  adminRuntimeBridge.src = 'admin-runtime-bridge.js?v=20260828-runtime-fix';
  adminRuntimeBridge.defer = true;
  document.head.appendChild(adminRuntimeBridge);

  const adminEnhancements = document.createElement('script');
  adminEnhancements.src = 'admin-enhancements.js?v=20260828-runtime-fix';
  adminEnhancements.defer = true;
  document.head.appendChild(adminEnhancements);

  const adminProfileArchitecture = document.createElement('script');
  adminProfileArchitecture.src = 'admin-profile-architecture.js?v=20260828-runtime-fix';
  adminProfileArchitecture.defer = true;
  document.head.appendChild(adminProfileArchitecture);
}
