window.SUPABASE_URL =
  "https://nzwfowwoazmpnwfrednh.supabase.co";

window.SUPABASE_ANON_KEY =
  "sb_publishable_fuB02obKKaki0dRsirVVAw_Wyo99pVP";

window.FUNDA_ADMIN_EMAIL = "";

// Keep one Supabase auth client per browser page. Several Academy features load
// together on the dashboards; sharing the client prevents competing token
// refreshes from making a valid session briefly look signed out.
(() => {
  'use strict';
  if (window.__fundaSharedAuthInstalled || !window.supabase?.createClient) return;
  window.__fundaSharedAuthInstalled = true;

  const originalCreateClient = window.supabase.createClient.bind(window.supabase);
  let sharedClient = window.__fundaSharedSupabaseClient || null;
  const restoreInFlight = new WeakMap();
  const rawAuthMethods = new WeakMap();
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  const messageOf = error => String(error?.message || error?.name || error || '').toLowerCase();
  const isMissingSession = error => {
    const message = messageOf(error);
    return !error ||
      error?.name === 'AuthSessionMissingError' ||
      message.includes('auth session missing') ||
      message.includes('session_not_found') ||
      message.includes('refresh token not found') ||
      message.includes('invalid refresh token');
  };

  window.supabase.createClient = (url, key, options = {}) => {
    if (url !== window.SUPABASE_URL || key !== window.SUPABASE_ANON_KEY) {
      return originalCreateClient(url, key, options);
    }
    if (sharedClient) return sharedClient;
    const authOptions = {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      ...(options.auth || {})
    };
    sharedClient = originalCreateClient(url, key, {...options, auth: authOptions});
    const rawGetSession = sharedClient.auth.getSession.bind(sharedClient.auth);
    const rawGetUser = sharedClient.auth.getUser.bind(sharedClient.auth);
    rawAuthMethods.set(sharedClient, {getSession: rawGetSession, getUser: rawGetUser});

    try {
    let lastKnownSession = null;
    sharedClient.auth.onAuthStateChange((event, session) => {
      if (session?.user) lastKnownSession = session;
      if (event === 'SIGNED_OUT') lastKnownSession = null;
    });

    // Existing pages use getSession/getUser directly. Give those calls a short,
    // bounded recovery window so one refresh race or network interruption does
    // not become a false logout.
    sharedClient.auth.getSession = async (...args) => {
      let lastResult = {data: {session: null}, error: null};
      let cleanMissing = 0;
      for (const delay of [0, 180, 450]) {
        if (delay) await pause(delay);
        try {
          const result = await rawGetSession(...args);
          lastResult = result;
          if (result.data?.session?.user) {
            lastKnownSession = result.data.session;
            return result;
          }
          if (!result.error || isMissingSession(result.error)) cleanMissing += 1;
          else cleanMissing = 0;
          if (cleanMissing >= 2) {
            lastKnownSession = null;
            return result;
          }
        } catch (error) {
          cleanMissing = 0;
          lastResult = {data: {session: null}, error};
        }
      }
      return lastKnownSession
        ? {data: {session: lastKnownSession}, error: null}
        : lastResult;
    };

    sharedClient.auth.getUser = async (...args) => {
      let lastResult = {data: {user: null}, error: null};
      let cleanMissing = 0;
      for (const delay of [0, 180, 450]) {
        if (delay) await pause(delay);
        try {
          const result = await rawGetUser(...args);
          lastResult = result;
          if (result.data?.user) return result;
          if (!result.error || isMissingSession(result.error)) cleanMissing += 1;
          else cleanMissing = 0;
          if (cleanMissing >= 2) {
            lastKnownSession = null;
            return result;
          }
        } catch (error) {
          cleanMissing = 0;
          lastResult = {data: {user: null}, error};
        }
      }
      if (!lastKnownSession) {
        try {
          const sessionResult = await rawGetSession();
          if (sessionResult.data?.session?.user) lastKnownSession = sessionResult.data.session;
        } catch (_) {}
      }
      return lastKnownSession?.user
        ? {data: {user: lastKnownSession.user}, error: null}
        : lastResult;
    };
    } catch (error) {
      console.warn('The shared session recovery layer could not be installed; standard authentication remains available.', error);
    }

    window.__fundaSharedSupabaseClient = sharedClient;
    window.__fundaSessionClient = sharedClient;
    return sharedClient;
  };

  async function restore(client, options = {}) {
    if (!client?.auth) {
      return {session: null, user: null, error: new Error('Authentication service unavailable'), confirmedSignedOut: false};
    }
    if (restoreInFlight.has(client)) return restoreInFlight.get(client);

    const operation = (async () => {
      const waits = Array.isArray(options.waits) ? options.waits : [0, 250, 700, 1400];
      let cleanMissingChecks = 0;
      let lastTransientError = null;
      const raw = rawAuthMethods.get(client);
      const getSession = raw?.getSession || client.auth.getSession.bind(client.auth);
      const getUser = raw?.getUser || client.auth.getUser.bind(client.auth);

      for (const delay of waits) {
        if (delay) await pause(delay);
        let cleanMissing = true;
        let session = null;

        try {
          const sessionResult = await getSession();
          session = sessionResult.data?.session || null;
          if (session?.user) {
            return {session, user: session.user, error: null, confirmedSignedOut: false};
          }
          if (sessionResult.error && !isMissingSession(sessionResult.error)) {
            cleanMissing = false;
            lastTransientError = sessionResult.error;
          }
        } catch (error) {
          if (!isMissingSession(error)) {
            cleanMissing = false;
            lastTransientError = error;
          }
        }

        try {
          const userResult = await getUser();
          if (userResult.data?.user) {
            return {session, user: userResult.data.user, error: null, confirmedSignedOut: false};
          }
          if (userResult.error && !isMissingSession(userResult.error)) {
            cleanMissing = false;
            lastTransientError = userResult.error;
          }
        } catch (error) {
          if (!isMissingSession(error)) {
            cleanMissing = false;
            lastTransientError = error;
          }
        }

        cleanMissingChecks = cleanMissing ? cleanMissingChecks + 1 : 0;
        if (cleanMissingChecks >= 2) {
          return {session: null, user: null, error: null, confirmedSignedOut: true};
        }
      }

      return {
        session: null,
        user: null,
        error: lastTransientError || new Error('The secure session could not be verified.'),
        confirmedSignedOut: false
      };
    })();

    restoreInFlight.set(client, operation);
    try {
      return await operation;
    } finally {
      restoreInFlight.delete(client);
    }
  }

  window.FundaAuth = Object.freeze({restore, isMissingSession});
})();

const sessionManager = document.createElement('script');
sessionManager.src = 'funda-session-manager.js?v=20260913-session-v1';
document.head.appendChild(sessionManager);

// Profile-photo experiment retired. Set this before any legacy cached copy of
// profile-photo-upload.js can run so the original Admin/Student header remains.
window.__fundaProfilePhotoUpload = true;

const identityUi = document.createElement('script'); identityUi.src = 'academy-identity.js?v=' + Date.now(); document.head.appendChild(identityUi);
const publicMarketing = document.createElement('script'); publicMarketing.src = 'marketing-public-tracking.js?v=' + Date.now(); document.head.appendChild(publicMarketing);
const createAccountRoute = document.createElement('script'); createAccountRoute.src = 'create-account-route-fix.js?v=' + Date.now(); document.head.appendChild(createAccountRoute);
const ambassadorReferral = document.createElement('script'); ambassadorReferral.src = 'ambassador-referral-tracking.js?v=' + Date.now(); document.head.appendChild(ambassadorReferral);
const typographyUi = document.createElement('script'); typographyUi.src = 'funda-typography.js?v=20260912-responsive-readability'; document.head.appendChild(typographyUi);
const textContrast = document.createElement('script'); textContrast.src = 'funda-text-contrast.js?v=20260901-black-text'; document.head.appendChild(textContrast);

if (/(^|\/)(index|courses-public|course-view|employers|ambassadors|login)\.html$/i.test(window.location.pathname) || /\/$/.test(window.location.pathname)) {
  const academyMapPublic=document.createElement('script'); academyMapPublic.src='public-academy-map-link.js?v='+Date.now(); document.head.appendChild(academyMapPublic);
  const employerPublic=document.createElement('script'); employerPublic.src='public-employer-link.js?v='+Date.now(); document.head.appendChild(employerPublic);
  const ambassadorPublic=document.createElement('script'); ambassadorPublic.src='public-ambassador-link.js?v='+Date.now(); document.head.appendChild(ambassadorPublic);
  const learnerTestimonial=document.createElement('script'); learnerTestimonial.src='public-learner-testimonial-name.js?v='+Date.now(); document.head.appendChild(learnerTestimonial);
}

if (/ambassadors\.html$/i.test(window.location.pathname)) {
  const ambassadorV2=document.createElement('script'); ambassadorV2.src='ambassador-programme-v2.js?v='+Date.now(); document.head.appendChild(ambassadorV2);
}

if (/onboarding\.html$/i.test(window.location.pathname)) {
  ['onboarding-integrity-payments.js','onboarding-bank-details-multi.js','enrolment-terms-payment-guard.js'].forEach(file=>{const s=document.createElement('script');s.src=file+'?v='+Date.now();document.head.appendChild(s)});
}

if (/(admin-v2|dashboard)\.html$/i.test(window.location.pathname)) {
  const calendarLinks=document.createElement('script');calendarLinks.src='calendar-dashboard-links.js?v='+Date.now();document.head.appendChild(calendarLinks);
  const consultationModes=document.createElement('script');consultationModes.src='consultation-professional-modes.js?v='+Date.now();document.head.appendChild(consultationModes);
}

if (/(student-calendar|admin-calendar)\.html$/i.test(window.location.pathname)) {
  const calendarPolish=document.createElement('script');calendarPolish.src='calendar-page-polish.js?v='+Date.now();document.head.appendChild(calendarPolish);
}

if (/admin-v2\.html$/i.test(window.location.pathname)) {
  const files=['admin-theme-navy-gold.js','admin-document-vault.js','admin-career-workplace-support.js','admin-employer-partnerships.js','admin-graduate-employment-pipeline.js','admin-employer-partner-governance.js','admin-employer-mobile-polish.js','admin-report-centre.js','admin-executive-safe.js','admin-finance-live-sync.js','admin-header-interactions.js','admin-staff-identity.js','admin-finance-control-centre.js','admin-payment-proof-review.js','admin-governance-safe.js','admin-executive-actions.js','admin-executive-action-summary.js','admin-communication-v2.js','admin-communication-management.js','admin-communication-force-v2.js','admin-marketing-safe.js','admin-ambassador-partnerships.js','admin-ambassador-outreach-campaigns.js','admin-ambassador-mobile-polish.js','admin-ambassador-programme-v2.js','admin-support-safe.js','admin-consultations.js','admin-enrolments-safe.js','admin-academic-qa-safe.js','admin-course-qa-review.js','admin-course-inspector.js','admin-security-safe.js','admin-hr-safe.js','admin-hr-leave-live-fix.js','admin-staff-invite-redirect-fix.js','admin-hr-contract-fix.js','admin-hr-compliance-safe.js','admin-hr-training-performance-safe.js','admin-audit-compliance-safe.js','admin-accounting-safe.js','admin-library-safe.js'];
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
  ['student-library-approval-guard.js','library-secure-files.js','library-notes-progress.js','library-reader.js','library-smart-discovery.js','library-usability-polish.js','library-theme-navy-gold-rose.js','library-theme-premium.js','library-course-sections.js','library-course-sections-v2.js','library-course-focus-view.js','library-student-collections.js','library-final-qc.js','digital-library-student-shell.js'].forEach(file=>{const s=document.createElement('script');s.src=file+'?v='+Date.now();document.head.appendChild(s)});
}
