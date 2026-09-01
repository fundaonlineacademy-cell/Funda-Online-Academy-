window.SUPABASE_URL =
  "https://nzwfowwoazmpnwfrednh.supabase.co";

window.SUPABASE_ANON_KEY =
  "sb_publishable_fuB02obKKaki0dRsirVVAw_Wyo99pVP";

window.FUNDA_ADMIN_EMAIL = "";

const identityUi = document.createElement('script'); identityUi.src = 'academy-identity.js?v=' + Date.now(); document.head.appendChild(identityUi);
const publicMarketing = document.createElement('script'); publicMarketing.src = 'marketing-public-tracking.js?v=' + Date.now(); document.head.appendChild(publicMarketing);
const createAccountRoute = document.createElement('script'); createAccountRoute.src = 'create-account-route-fix.js?v=' + Date.now(); document.head.appendChild(createAccountRoute);
const ambassadorReferral = document.createElement('script'); ambassadorReferral.src = 'ambassador-referral-tracking.js?v=' + Date.now(); document.head.appendChild(ambassadorReferral);
const textContrast = document.createElement('script'); textContrast.src = 'funda-text-contrast.js?v=20260901-black-text'; document.head.appendChild(textContrast);

if (/(^|\/)(index|courses-public|course-view|employers|ambassadors|login)\.html$/i.test(window.location.pathname) || /\/$/.test(window.location.pathname)) {
  const employerPublic=document.createElement('script'); employerPublic.src='public-employer-link.js?v='+Date.now(); document.head.appendChild(employerPublic);
  const ambassadorPublic=document.createElement('script'); ambassadorPublic.src='public-ambassador-link.js?v='+Date.now(); document.head.appendChild(ambassadorPublic);
  const learnerTestimonial=document.createElement('script'); learnerTestimonial.src='public-learner-testimonial-name.js?v='+Date.now(); document.head.appendChild(learnerTestimonial);
}

if (/onboarding\.html$/i.test(window.location.pathname)) {
  ['onboarding-integrity-payments.js','onboarding-bank-details-multi.js','enrolment-terms-payment-guard.js'].forEach(file=>{const s=document.createElement('script');s.src=file+'?v='+Date.now();document.head.appendChild(s)});
}

if (/(admin-v2|dashboard)\.html$/i.test(window.location.pathname)) {
  const calendarLinks=document.createElement('script');calendarLinks.src='calendar-dashboard-links.js?v='+Date.now();document.head.appendChild(calendarLinks);
  const consultationModes=document.createElement('script');consultationModes.src='consultation-professional-modes.js?v='+Date.now();document.head.appendChild(consultationModes);
  const profilePhoto=document.createElement('script');profilePhoto.src='profile-photo-upload.js?v='+Date.now();document.head.appendChild(profilePhoto);
}

if (/(student-calendar|admin-calendar)\.html$/i.test(window.location.pathname)) {
  const calendarPolish=document.createElement('script');calendarPolish.src='calendar-page-polish.js?v='+Date.now();document.head.appendChild(calendarPolish);
}

if (/admin-v2\.html$/i.test(window.location.pathname)) {
  const files=['admin-theme-navy-gold.js','admin-document-vault.js','admin-career-workplace-support.js','admin-employer-partnerships.js','admin-graduate-employment-pipeline.js','admin-employer-partner-governance.js','admin-employer-mobile-polish.js','admin-report-centre.js','admin-executive-safe.js','admin-finance-live-sync.js','admin-header-interactions.js','admin-finance-control-centre.js','admin-payment-proof-review.js','admin-governance-safe.js','admin-executive-actions.js','admin-executive-action-summary.js','admin-communication-v2.js','admin-communication-management.js','admin-communication-force-v2.js','admin-marketing-safe.js','admin-ambassador-partnerships.js','admin-ambassador-outreach-campaigns.js','admin-ambassador-mobile-polish.js','admin-support-safe.js','admin-consultations.js','admin-enrolments-safe.js','admin-academic-qa-safe.js','admin-course-qa-review.js','admin-course-inspector.js','admin-security-safe.js','admin-hr-safe.js','admin-hr-leave-live-fix.js','admin-staff-invite-redirect-fix.js','admin-hr-contract-fix.js','admin-hr-compliance-safe.js','admin-hr-training-performance-safe.js','admin-audit-compliance-safe.js','admin-accounting-safe.js','admin-library-safe.js'];
  files.forEach(file=>{const s=document.createElement('script');s.src=file+'?v='+Date.now();document.head.appendChild(s)});
}

if (/staff-portal\.html$/i.test(window.location.pathname)) {
  ['staff-password-access.js','staff-session-switch.js','staff-onboarding-status.js','staff-finance-workspace.js'].forEach(file=>{const s=document.createElement('script');s.src=file+'?v='+Date.now();document.head.appendChild(s)});
}

if (/(courses-public|course-view)\.html$/i.test(window.location.pathname)) {
  const s=document.createElement('script');s.src='public-course-value.js?v='+Date.now();document.head.appendChild(s);
  const careerAreas=document.createElement('script');careerAreas.src='course-career-skill-areas.js?v='+Date.now();document.head.appendChild(careerAreas);
  if (/courses-public\.html$/i.test(window.location.pathname)) {
    const brand=document.createElement('script');brand.src='courses-public-brand-theme.js?v='+Date.now();document.head.appendChild(brand);
    const searchPolish=document.createElement('script');searchPolish.src='course-search-mobile-polish.js?v='+Date.now();document.head.appendChild(searchPolish);
  }
  if (/course-view\.html$/i.test(window.location.pathname)) {
    const runtimeFix=document.createElement('script');runtimeFix.src='course-view-runtime-fix.js?v='+Date.now();document.head.appendChild(runtimeFix);
    ['retail-course-overview-premium.js','bookkeeping-premium-overview.js','office-administration-premium-overview.js','carpentry-premium-overview.js','business-administration-premium-overview.js','all-courses-premium-overview.js','course-overview-subject-specific.js','course-overview-brand-theme.js','course-career-support-promo.js'].forEach(file=>{const premium=document.createElement('script');premium.src=file+'?v='+Date.now();document.head.appendChild(premium)});
  }
}

if (/dashboard\.html$/i.test(window.location.pathname)) {
  ['student-registration-route-guard.js','student-payment-review-feedback.js','student-career-workplace-support.js','student-employer-opportunities.js','student-employment-readiness.js','student-support-portal.js','student-support-ticket-feedback.js','student-consultations.js','student-module-assessments.js','student-communication-centre.js','student-dashboard-tab-navigation.js'].forEach(file=>{const s=document.createElement('script');s.src=file+'?v='+Date.now();document.head.appendChild(s)});
}

if (/course-study\.html$/i.test(window.location.pathname)) {
  const graphicRecovery=document.createElement('script');graphicRecovery.src='graphic-design-workspace-recovery.js?v='+Date.now();document.head.appendChild(graphicRecovery);
}

if (/library-admin\.html$/i.test(window.location.pathname)) {
  ['library-admin-upload.js','library-admin-mobile.js'].forEach(file=>{const s=document.createElement('script');s.src=file+'?v='+Date.now();document.head.appendChild(s)});
}

if (/digital-library\.html$/i.test(window.location.pathname)) {
  ['student-library-approval-guard.js','library-secure-files.js','library-notes-progress.js','library-reader.js','library-smart-discovery.js','library-usability-polish.js','library-theme-navy-gold-rose.js','library-theme-premium.js','library-course-sections.js','library-course-sections-v2.js','library-course-focus-view.js','library-student-collections.js','library-final-qc.js'].forEach(file=>{const s=document.createElement('script');s.src=file+'?v='+Date.now();document.head.appendChild(s)});
}
