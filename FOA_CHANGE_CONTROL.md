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
- Test both desktop and mobile when responsive behaviour is touched.
- Do not replace a page-specific fix with a global CSS/JS change unless the owner asked for a global change.
- Do not expand a trial design choice to other portals/pages.

## G. Regression checklist

Run the subset relevant to the change, and for protected/global changes run all adjacent checks:

### Authentication
- Student login remains Student-only.
- Staff/Admin login keeps role checks and Staff Access Code protection.
- Correct role redirects remain intact.
- No login route exposes another portal.

### Student
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
- Application/login remains separate from Student access.
- Referral links still point to the intended registration journey.
- Referral attribution still works.
- Earnings/banking/programme views are not altered by unrelated work.

### Public site
- Final approved Home-page design, wording, navigation, course-card controls, contact details and responsive behaviour remain unchanged unless explicitly reopened by the owner.
- Home-page course cards keep non-clickable bodies with separate **View Course** and **Enroll Now** actions.
- The General Enquiries address remains `info@fundaonlineacademy.co.za`.
- Courses page keeps approved controls/layout.
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
