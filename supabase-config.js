window.SUPABASE_URL =
  "https://nzwfowwoazmpnwfrednh.supabase.co";

window.SUPABASE_ANON_KEY =
  "sb_publishable_fuB02obKKaki0dRsirVVAw_Wyo99pVP";

window.FUNDA_ADMIN_EMAIL = "";

const identityUi = document.createElement('script'); identityUi.src = 'academy-identity.js?v=' + Date.now(); document.head.appendChild(identityUi);
const publicMarketing = document.createElement('script'); publicMarketing.src = 'marketing-public-tracking.js?v=' + Date.now(); document.head.appendChild(publicMarketing);

if (/admin-v2\.html$/i.test(window.location.pathname)) {
  // Stable Admin stack: each upgrade owns one navigation surface only.
  // No whole-document MutationObservers and no duplicate department controllers.
  const files=['admin-theme-navy-gold.js','admin-report-centre.js','admin-executive-safe.js','admin-finance-control-centre.js','admin-governance-safe.js','admin-communication-v2.js','admin-marketing-safe.js','admin-support-safe.js','admin-enrolments-safe.js','admin-academic-qa-safe.js','admin-security-safe.js','admin-hr-safe.js','admin-hr-contract-fix.js','admin-hr-compliance-safe.js','admin-hr-training-performance-safe.js','admin-audit-compliance-safe.js','admin-accounting-safe.js'];
  files.forEach(file=>{const s=document.createElement('script');s.src=file+'?v='+Date.now();document.head.appendChild(s)});
}

if (/dashboard\.html$/i.test(window.location.pathname)) {
  const studentSupport=document.createElement('script');
  studentSupport.src='student-support-portal.js?v='+Date.now();
  document.head.appendChild(studentSupport);
}

if (/library-admin\.html$/i.test(window.location.pathname)) {
  const libraryUpload=document.createElement('script');
  libraryUpload.src='library-admin-upload.js?v='+Date.now();
  document.head.appendChild(libraryUpload);
}

if (/digital-library\.html$/i.test(window.location.pathname)) {
  ['library-secure-files.js','library-notes-progress.js','library-reader.js','library-smart-discovery.js','library-usability-polish.js','library-theme-navy-gold-rose.js'].forEach(file=>{
    const s=document.createElement('script');
    s.src=file+'?v='+Date.now();
    document.head.appendChild(s);
  });
}
