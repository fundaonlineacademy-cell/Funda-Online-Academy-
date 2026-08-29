# Funda Online Academy — Login & Access-Control Audit

**Audit date:** 29 August 2026  
**Scope:** Authentication, profile authorization, student identity creation, password reset routing, staff/admin separation, privileged database RPC exposure.

## Status

The live system was audited conservatively. No learner course content, enrolments, lesson progress, assessment attempts, payments, or existing authentication identities were deleted or rewritten during this work.

## Confirmed working controls

- `admin-v2.html` requires an authenticated user and independently verifies `profiles.role = 'admin'` before loading the Admin Command Center.
- `dashboard.html` requires an authenticated Supabase user before loading student data.
- `profiles` has a `BEFORE UPDATE` trigger using `protect_profile_authorization_fields()` to prevent non-admin users from changing authorization fields such as `role`, `department`, `staff_code`, and `job_title`.
- The `profiles_role_check` database constraint currently permits only `student`, `admin`, and `staff` roles.
- The live assessment RPCs continue to require an authenticated approved enrolment and retain their existing lesson/formative/summative progression rules.

## Corrections completed

### 1. Password reset route compatibility

A correctly named `reset-password.html` was added as an exact compatibility copy of the existing mistakenly named `reset-password. html`. The older file was retained so no historical reference is broken.

GitHub commit: `d2d773cfe3d44242394177f0782bd24414d1564c`

### 2. Profile authorization on insert

Added a restrictive profile-insert authorization rule so a normal authenticated user cannot create their own profile carrying privileged authorization fields. A self-created profile must remain a student profile with no `staff_code`, `department`, or `job_title`. Existing profiles were not modified.

### 3. Student identity creation and update

Tightened `students` RLS so only an authenticated account whose `profiles.role = 'student'` can create or update its own student record. This prevents admin or future staff accounts from being converted into learner identities by calling the student onboarding code directly.

Historical rows were intentionally not deleted.

### 4. Policy acceptance ownership

Tightened the student policy-acceptance INSERT rule so:

- `user_id` must equal the authenticated user;
- the linked `student_id` must belong to that same authenticated user;
- the corresponding profile must be a student;
- policy and declaration acceptance flags must both be true.

### 5. SECURITY DEFINER RPC exposure

Supabase Security Advisor identified several privileged `SECURITY DEFINER` functions that still inherited anonymous execution rights. Anonymous execution was removed from privileged academic, certificate, assessment, HR, library-access and authorization helper functions.

Explicit authenticated execution was retained only where the browser application legitimately needs the function, with the functions' existing internal authorization checks preserved.

Trigger-only helper functions no longer have anonymous/authenticated RPC execution rights.

The intentionally public `get_public_course_catalog()` remains anonymously callable because it is the Academy's public course catalogue endpoint.

### 6. HR sequence generators

`next_staff_code(text)` and `next_hr_contract_number()` now require authenticated Human Resources edit access (or admin access through the existing `has_department_access` logic) before consuming sequence values.

## Important findings still to complete

### Staff routing

The current `login.html` recognises several historical staff-role labels, while the database constraint currently permits only `student`, `admin`, and `staff`. The Admin Command Center correctly admits admins only, and `staff-portal.html` currently admits the `staff` role. Before staff accounts are activated, the login routing should be normalised to:

- `admin` -> `admin-v2.html`
- `staff` -> `staff-portal.html`
- `student` -> student dashboard/onboarding

No live staff account currently depends on the inconsistent route, so this was not changed blindly.

### Legacy `auth.js`

The repository still contains a legacy `auth.js` ending with an unmatched closing brace. The current `auth.html` registration page uses its own inline Supabase logic and does **not** load this legacy file, so current registration is not dependent on that syntax-broken legacy script. The file should be retired or corrected only after confirming there are no remaining pages that reference it.

### Password security

Supabase Security Advisor reports **Leaked Password Protection disabled**. This should be enabled in Auth settings before public launch if supported by the active Supabase plan. Current front-end password validation also accepts six-character passwords; a stronger launch policy should be adopted after checking Supabase Auth configuration so front-end and server-side requirements stay aligned.

## Verification after changes

Post-change live counts were checked to confirm the audit did not remove operational records:

- Profiles: 8
- Student rows: 7
- Enrolments: 34
- Lesson progress rows: 3
- Assessment attempts: 1

The security advisor no longer reports anonymous execution for the privileged functions hardened in this audit. The remaining anonymous `SECURITY DEFINER` warning is the intentionally public course-catalogue RPC.

## Next QA actions

1. Normalize `login.html` staff/admin routing before first staff account activation.
2. Confirm no live page references legacy `auth.js`, then retire or repair it.
3. Enable Supabase leaked-password protection where available.
4. Align minimum password requirements across signup, reset and Supabase Auth configuration.
5. Test student signup -> onboarding -> dashboard using a dedicated test account.
6. Test admin login -> Admin Command Center and verify non-admin rejection.
7. Test a dedicated staff account -> Staff Workspace before staff rollout.
8. Re-run Supabase Security Advisor after final authentication changes.
