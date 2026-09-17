# FOA architecture cleanup note — 17 September 2026

Owner-approved cleanup: separate unrelated responsibilities that had accumulated in `ambassador-referral-tracking.js` without changing approved behaviour.

## Result

- Ambassador referral tracking remains in `ambassador-referral-tracking.js`.
- Staff/Admin Staff Access Code login protection lives in `staff-access-code-login.js` and is loaded only on `login.html`.
- Public Courses enrol-anytime FAQ loading lives in `courses-public-faq-loader.js` and is loaded only on `courses-public.html`.
- `supabase-config.js` remains the page-specific loader; this cleanup adds only those two explicit page-scoped module loads.

## Behaviour preserved

- Staff/Admin password + Staff Access Code + role checks and redirects.
- Student accounts cannot use the Staff/Admin route.
- Ambassador referral registration attribution and permanent registration links.
- Public course enrol-anytime FAQ loading.
- Approved login layout and public Courses control presentation.

No Supabase schema, RLS, RPC, data, HTML layout, styling, onboarding, course content, or payment behaviour was changed by this cleanup.
