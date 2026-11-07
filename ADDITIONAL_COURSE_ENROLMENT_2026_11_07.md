# Additional Course Enrolment — scoped implementation

Owner-approved request: an already-enrolled student can apply for one or many new short courses before or after completion, keeping one existing account and all prior academic/financial records intact.

## Change surface

- `additional-courses.html`: standalone signed-in existing-student course selection, server-authoritative quotes, official bank display, exact payment amount, proof upload, declarations and pending application submission.
- `dashboard.html`: replace only the “Browse” link adjacent to “My Courses” with “+ Enrol in Another Course”. All old course cards, progress, learning access, payments and dashboard controls are unchanged.
- `supabase/migrations/20261107213500_additional_course_enrolment.sql`: add two authenticated invoker RPC wrappers and two private guarded helpers. Keep original enrolment, combined-payment, fee and legacy-benefit RPC definitions untouched.

## Deliberate safeguards

- Existing submitted, active, approved or completed course enrolment required. Role must be Student.
- Filter already-applied-for courses locally; existing base checkout RPC also rejects duplicates atomically. No same-course retake in this change.
- Reuse the existing Student row and authentication: no account creation and no update of old registration details.
- Use the current course fees as read from the database, with exact fee and installment schedules from the existing combined-checkout RPC. Only *newly selected* courses enter the new quote. Keep current courses, outstanding installments, learning progress and certificates intact.
- Enforce one proof of payment for the new checkout, exact matching amount, approved EFT/deposit method, own-account 5 MB PDF/JPG/PNG upload, required reference and compulsory declarations.
- Reuse the existing atomic/locked/idempotent combined submission and usual Admissions/Finance approval/access barriers; no automatic access or payment verification.
- Additional-course items record `student_category='continuing_student'` instead of falsely labeling an already-enrolled student as `first_time`. The original first-time and legacy discount paths stay unchanged.
- Do **not** grant a new or automatic returning-student discount. Existing verified legacy benefits remain on their existing route; this new direct path is standard-price only and informs students to contact Admissions if a benefit may apply. Future benefit integration requires separate review.
- No existing course price, active flag, photo, assessments, admissions privilege, finance privilege, or student status is modified.

## Verification evidence

- New page inline JavaScript syntax parse passed.
- Isolated mocked browser/data checks passed: already-enrolled course excluded; single course quote and submitted amount; two-course R3,450 quote, R1,150 exact first instalment, R3,450 full option, upload path and separate submission; no prior enrolment blocked; historically completed record allowed; official bank unavailable blocks submission; forged/stale course selection rejected.
- Live database readback confirmed private functions are not anonymously callable and public wrappers are authenticated-only and security-invoker. Anonymous/unsigned requests to both public functions are denied. No migration added or changed existing enrollment/payment data.
- Git branch diff to main adds only this page and migration, changes a single Dashboard My Courses link.
- Security advisors flag **existing** independent issues; no new additional-course RPC appears in the public-definer warning.

## Remaining owner/production-device verification

An actual authenticated Student mobile/desktop browser session, a real bank/proof transaction, and a signed-in Finance review were **not** performed. They must be reviewed under ordinary Academy approval rules. No live payment or real student account was used for development tests. This feature is not automatically locked by implementation.
