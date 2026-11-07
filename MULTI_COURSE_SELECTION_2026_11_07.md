# Multi-course selection and total — scope

Owner request: select more than one course and see the combined total, keeping the current course cards and photos; allow a foundation for future owner-defined combos. Publish after checks. No combo price or discount is authorised yet.

Implementation scope: authoritative course-browser selection/summary, onboarding selection/context, account-scoped draft restoration, registration course context and successful-payment continuation to the remaining selection. Keep separate existing per-course enrolment and payment records, exact instalment rules, legacy verification, access checks and Admissions & Finance review. No combined-transfer mechanism or new database changes. The course-selection UI explicitly explains that enrolment and payment are completed per course.

Required checks: add/remove/clear, cents-accurate sum, selections across search and all pages, restoration against current active course data and own-account drafts, single-course compatibility, existing/submitted course guard, remaining selections after success/failure, no silent checkout loss, original image URLs and card dimensions unchanged, responsive desktop/tablet/phone, Student Type round trip, source preservation of fee/validation/RPC code except the queue continuation.

## Implementation and verification

- Select/remove/clear any courses across search and 10/10/10/5 catalogue pages. The summary derives current fees in integer cents, stores only selected IDs, and shows a collapsible course list.
- Own-account draft restoration filters IDs against the active catalogue and restores them before any fresh page can overwrite the saved navigation. Old single-course drafts remain compatible. Local two-account checks show choices do not cross accounts.
- Example browser checks: Bookkeeping R3,900 + Business Administration R1,950 = R5,850; add Event Management R2,900 = R8,750; remove Bookkeeping = R4,850. Refresh retains choices and totals. Continue reaches the correct current course's Student Type; Back preserves every selection.
- The existing course-specific verification and payment checks remain authoritative. One course is completed at a time; the app explicitly states this. No new combined-transfer mechanism, R5,000 combo or promotion is invented.
- Submission tests exercise the actual enhanced-submit function with isolated dependencies: success removes only the submitted course and redirects to remaining choices; payment failure removes nothing; single-course completion preserves the Dashboard route; full payment and a verified-benefit fee retain the same payment amounts/RPC options. A local browser simulation also verifies successful-completion draft watching and remaining-course restoration without any production writes.
- Registration/profile fields, identity checks, fee/instalment calculations, legacy entitlement/evidence, payment proof/RPC parameters, banking, approval and access rules are source-preserved. Only post-success queue continuation changes in payment submission.
- The loader edit changes only the registration-flow script cache reference. Original course photographs and card dimensions are preserved by the separate framing correction in the same owner request.

## Limitations

This implements selection, totals and a saved queue of individual applications, not a shared basket payment or discounted combo product. Authenticated target-device review remains with the owner. Browser and submission checks use isolated fixtures/mocks, never live test accounts or payments.
