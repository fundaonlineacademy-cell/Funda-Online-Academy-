# Funda Online Academy — No-Surprise Change Protocol

Purpose: keep development fast **without allowing unrelated regressions**.

## A. Before editing

For each task, write down four things:

1. **Owner request** — the exact behaviour Aziwe Futhe asked to change.
2. **In scope** — pages/features/files reasonably required for that request.
3. **Out of scope** — related areas that must remain untouched.
4. **Regression checks** — existing behaviour that must still work when the task is complete.

If the required fix crosses into an out-of-scope protected area, treat that as a blocker and obtain explicit owner approval before changing it.

## B. Default change strategy

Use the smallest reliable change that fixes the requested issue at its source.

Preferred order:

1. Fix the authoritative source of the wrong behaviour.
2. Remove or consolidate a conflicting override when the scope explicitly includes that cleanup.
3. Add a narrowly scoped compatibility layer only when source cleanup is unsafe in the current task.
4. Use a temporary emergency override only when explicitly accepted as temporary.

Do not add another observer/timer/override merely because an existing override is difficult to understand.

### Legacy / cleanup dependency safety

“Legacy” is not a deletion instruction. Before removing, redirecting, renaming, disabling or replacing any file, route, script, function, table, RPC, policy, migration hook, form, loader or compatibility layer:

1. Prove whether it is still referenced by any approved live page, route, script loader, form action, redirect, event hook, referral flow, authentication path, database function or deployment/runtime dependency.
2. Trace both direct and indirect callers. A file can still be required even when users never navigate to it directly.
3. Confirm the replacement already contains the complete working behaviour before retiring the old dependency.
4. Run the adjacent approved journey end-to-end after the cleanup. For route changes, verify there is no redirect loop or dead end.
5. Preserve migration/audit history unless there is a separately approved reason to remove it.
6. If dependency status is uncertain, **do not delete or redirect it**. Treat uncertainty as a blocker and inspect further.

The goal of cleanup is to remove obsolete or harmful behaviour that can disturb the approved system — not to remove working dependencies. **Fix up; do not break up.**

## C. Branching and live-site safety

- `main` is the live approved baseline.
- Substantial work starts from the current `main` head on a dedicated branch.
- A pull request is the default route for cross-cutting, authentication, payment, database, portal, or global-loader changes.
- A direct `main` commit should be limited to a tiny, explicit correction with a known blast radius.
- Do not bundle unrelated improvements into the same branch or PR.

## D. Protected-area approval

The following changes require explicit scope confirmation in the PR/task notes:

- The final owner-approved Home page (`index.html`). It must not be changed unless Aziwe Futhe explicitly reopens the Home page.
- Shared/global scripts that execute on or can alter the Home page. These may change for other approved work only when the Home-page final state is regression-checked and deliberately preserved.
- The final owner-approved Browse Courses page (`courses-public.html`). It must not be changed unless Aziwe Futhe explicitly reopens Browse Courses.
- Shared/global scripts that execute on or can alter Browse Courses. These may change for other approved work only when the Browse Courses final state is regression-checked and deliberately preserved.
- Academy Map destination routing is protected. Public/private destinations must keep their approved role-appropriate login or public route unless the owner explicitly requests a routing change.
- The final owner-approved Login section is protected: `login.html`, `ambassador-login.html`, `reset-password.html`, Staff Access Code enforcement, approved role routing and password-recovery destinations must not change unless Aziwe Futhe explicitly reopens Login.
- The final owner-approved Ambassador system is protected end-to-end: public programme, application/agreement, application status, activation, Ambassador Login/recovery/logout, portal/dashboard, referral attribution, privacy-limited referral display, confirmed earnings, ranks/compensation, banking, support/Your Voice, marketing resources, announcements and Admin-side Ambassador controls must not change unless Aziwe Futhe explicitly reopens the Ambassador system.
- The final owner-approved Create Student Account journey is protected: `create-account.html`, the working `auth.html` registration form, required Student profile fields, Terms & Privacy acceptance, strong-password rules, official transparent logo, account/profile creation, referral handoff and onboarding/course-selection handoff must not change unless Aziwe Futhe explicitly reopens Student registration.
- The final owner-approved Enrollment Step 1 — Choose Your Course behaviour is protected. Step 1-specific course-browser logic must not change without explicit owner approval; shared onboarding changes must prove the approved Step 1 remains intact.
- The final owner-approved Enrollment Step 2 — Student Type behaviour is protected. Step 2-specific legacy verification logic must not change without explicit owner approval; shared onboarding/draft/legacy changes must prove the approved Step 2 remains intact.
- Ambassador server-side ownership/RLS/RPC/payment-eligibility controls must not be weakened or replaced by browser-only access control.
- `auth.html` is currently the working Student registration form reached from `create-account.html`; it is not a disposable legacy redirect target. Do not retire or redirect it unless the complete tested registration implementation and Ambassador referral-claim hook have first been migrated. Retired `auth.js` and malformed duplicate reset implementations must remain absent.
- `supabase-config.js` or any global loader.
- Login/authentication/role routing.
- Supabase schema/RLS/RPC/storage/auth/production-data changes.
- Student, Admin/Staff, or Ambassador portal shell/navigation changes.
- Payment/bank details/payment-plan rules.
- Course progression, assessments, completion, certificates, or verification.
- Public catalogue/onboarding flows.
- System-wide typography/colour/layout changes.

Approval for one protected area does not imply approval for another.

## E. Supabase rules

When database work is required:

- Prefer additive and idempotent migrations.
- Preserve production data.
- Do not drop columns/tables/policies/functions or weaken RLS unless explicitly requested and understood.
- Do not write directly to production data just to make UI testing pass.
- Keep authentication and authorization checks server-side/database-side where appropriate; do not rely only on browser UI hiding.
- Record the migration/RPC/policy that changed and the rollback/recovery approach.

## F. UI rules

When a UI fix is requested:

- Preserve existing approved structure, wording, colour, spacing, controls, navigation, and responsive ordering unless they are part of the request.
- The Home page is a final approved surface. Do not redesign, restyle, reorder, add, remove or rewrite Home-page content or behaviour unless the owner explicitly reopens it.
- Browse Courses is a final approved surface. Preserve its course cards, filters, FAQs, WhatsApp-focused contact area, navigation, typography, spacing and responsive structure unless the owner explicitly reopens it.
- Login is a final approved surface. Preserve the Student / Staff-Admin selector, strict Staff Access Code requirement, Ambassador Login separation, Forgot Password flow, approved destinations and responsive ordering unless the owner explicitly reopens it.
- The Ambassador programme/application/login/portal are final approved surfaces. Preserve their structure, wording, compensation/rank presentation, privacy-limited referral summaries, banking/security presentation, tickets/Your Voice, navigation and responsive behaviour unless the owner explicitly reopens the Ambassador system.
- Create Student Account is a final approved surface. Preserve the required profile fields, Student Terms & Privacy acceptance, strong-password standard, official transparent logo, referral handoff, profile creation and optional immediate course-selection behaviour unless the owner explicitly reopens Student registration.
- Enrollment Step 1 — Choose Your Course is a final approved surface. Preserve the active-course catalogue, 10-per-page pagination, Previous/Next controls, responsive card grid, search, View more, Select/Clear Selection, Continue, branding and typography unless the owner explicitly reopens Step 1. Changes to Steps 2–5 must leave Step 1 unchanged except for verified shared compatibility work.
- Enrollment Step 2 — Student Type is a final approved surface. Preserve the four Student Type paths, evidence/ID requirements, 70%/50%/25% provisional-discount safeguards, certificate/historical verification, manual-review fallback, Back/Continue navigation, draft restoration and approved presentation unless the owner explicitly reopens Step 2. Changes to Steps 3–5 must leave Step 2 unchanged except for verified shared compatibility work.
- Test both desktop and mobile when responsive behaviour is touched.
- Do not replace a page-specific fix with a global CSS/JS change unless the owner asked for a global change.
- Do not expand a trial design choice to other portals/pages.

## G. Regression checklist

Run the subset relevant to the change, and for protected/global changes run all adjacent checks:

### Authentication
- Student login remains Student-only and uses the approved shared Login.
- Staff/Admin login keeps role checks and requires email + password + assigned Staff Access Code.
- Ambassador login remains separate and keeps its application-status gate.
- Forgot Password sends recovery to the registered email and uses the approved reset-password flow.
- Password recovery returns to the correct login entry after a successful update.
- Create Student Account, Ambassador Portal Login and Browse Courses links keep their approved destinations.
- Create Student Account opens a usable registration form and does not loop between `create-account.html` and `auth.html`.
- Ambassador referral codes survive the Create Student Account → registration form journey and can still be claimed only by an eligible newly created Student account.
- Correct role redirects remain intact.
- No login route exposes another portal or introduces an unapproved fourth portal.
- Retired `auth.js` / duplicate reset implementations remain absent from active use.
- Create Student Account still requires Name, Surname, Gender, Phone/WhatsApp, Email + Confirm Email, Password + Confirm Password and Student Terms & Privacy acceptance.
- New Student passwords still require at least 8 characters with a letter, a number and a special symbol.
- Existing account passwords are not invalidated by the new-account password rule.
- A Student account can be created before a course is selected; later course selection/onboarding remains available.
- Eligible Ambassador referral attribution is claimed through the Student account-creation path and cannot be overwritten by a later Ambassador code.

### Student
- Enrollment Step 1 loads all active courses from the approved catalogue.
- Enrollment Step 1 shows no more than 10 courses per page and keeps Previous/Next pagination and accurate page status.
- Desktop course cards remain up to 3 across; smaller screens remain responsive without changing the 10-course page size.
- Search and search clear work without dropping active courses from the underlying catalogue.
- View more, Select this course, Clear selection and Continue remain functional.
- Continue carries the currently selected course only; stale/cleared selection must not advance as another course.
- Step 1 branding, typography, course-card information and approved layout remain unchanged unless explicitly reopened.
- Enrollment Step 2 keeps the four approved Student Type options and their current evidence requirements.
- First-time Students are not forced to supply legacy evidence on Step 2.
- Completed-course Legacy Upgrade requires ID + old certificate and only provisionally unlocks 70% after ID/name/course certificate verification.
- Incomplete-course Restart requires ID + prior payment date + non-completion reason + old proof of payment and only provisionally unlocks 50% after verification.
- Returning Student requires ID + proof of previous FOA study and only provisionally unlocks 25% after verification.
- Failed automatic legacy matching does not silently unlock discounted payment; manual verification remains available.
- Step 2 Back/Continue navigation remains correct.
- Draft restoration preserves entered Step 2 values/navigation but requires evidence files to be reselected/re-verified where browser security prevents file restoration.
- Dashboard loads.
- Library loads.
- Sidebar/navigation remains usable.
- Onboarding progress is retained where expected.
- Payments and outstanding balance behaviour remain correct.
- Course progress/assessment navigation is not disturbed.

### Admin/Staff
- Admin Command Center loads for authorized Admin.
- Staff Workspace loads for authorized Staff.
- Notifications/navigation remain available.
- No Student/Ambassador access is broadened accidentally.

### Ambassador
- Public programme and dedicated application/agreement journey remain intact.
- Application status keeps the approved pending/waitlisted/declined/approved boundaries.
- Ambassador Login, Forgot Password, successful portal entry and Logout return paths remain correct.
- Referral links still lead to Student account creation with the Ambassador code preserved.
- Referral ownership is established only through an eligible new account claim and cannot be overwritten by another Ambassador code.
- Privacy-limited referral display remains first-name + surname initial where available, with no private Student contact/ID/payment/assessment/support data exposed.
- **Course not yet selected** remains valid for a referred account that has not enrolled yet.
- Unconfirmed referrals remain R0/not-yet-earned; only approved/paid eligible earnings appear as money.
- Compensation plan, ranks, direct-referral-only rules and no-downline/no-recruitment model remain unchanged.
- Banking remains own-account only, masked after storage and subject to Finance verification.
- Support tickets/replies and Your Voice records remain account-bound and private.
- Marketing resources, announcements, programme rules/agreement, profile and dashboard navigation remain available as approved.
- Admin-side Ambassador programme/finance/support controls remain role-restricted.

### Public site
- Final approved Home-page design, wording, navigation, course-card controls, contact details and responsive behaviour remain unchanged unless explicitly reopened by the owner.
- Home-page course cards keep non-clickable bodies with separate **View Course** and **Enroll Now** actions.
- The General Enquiries address remains `info@fundaonlineacademy.co.za`.
- Browse Courses keeps its final approved controls/layout, FAQ wording, course-card presentation and WhatsApp-focused contact section.
- Browse Courses course images fail gracefully to the approved placeholder rather than exposing a broken-image icon.
- Student Login, Create Student Account, View Course, Academy Map, Employer and Ambassador routes remain correct.
- Academy Map registered-learner routes continue through Student Login; Staff/Admin routes continue through the shared secure Staff/Admin login; public routes remain public.
- Course overview and registration links work.
- Enrol-anytime messaging/FAQ remains present where approved.
- Mobile navigation remains usable.

### Data/security
- RLS/authorization still blocks unauthorized access.
- No destructive data mutation occurred during testing.
- New code does not expose secrets or privileged keys.

## H. Completion note required

Every change should finish with a concise note containing:

- Owner request
- Changed files
- Behaviour changed
- Behaviour explicitly preserved
- Regression checks performed
- Known remaining risk/blocker
- For any cleanup/removal: dependency references checked and replacement verified before retirement

If a check was not run, say so. Never substitute “should work” for a verified result.

## I. Current cleanup sequence

The currently approved regression-control cleanup order is:

1. Freeze and document the current approved baseline.
2. Add repository instructions and PR scope controls.
3. Audit cross-feature/global loaders without changing live behaviour.
4. Separate unrelated responsibilities into dedicated modules one controlled area at a time.
5. Replace competing runtime overrides with one authoritative implementation where safe.
6. Add/strengthen regression checks around login, public courses, onboarding, Student, Admin/Staff, and Ambassador journeys.
7. Only then resume broader feature additions that touch these shared paths.
