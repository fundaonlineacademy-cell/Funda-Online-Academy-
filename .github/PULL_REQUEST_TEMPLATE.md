# FOA Change Scope

## Owner request
<!-- Copy the exact requested outcome. Do not broaden it. -->

## In scope
<!-- Pages/features/files allowed to change. -->

## Out of scope
<!-- Explicitly list nearby behaviour that must remain unchanged. -->

## Protected-state check
- [ ] I read `AGENTS.md`.
- [ ] I read `FOA_APPROVED_STATE.md`.
- [ ] I read `FOA_CHANGE_CONTROL.md`.
- [ ] No previously rejected/retired behaviour was restored.
- [ ] No trial UI choice was expanded without explicit approval.
- [ ] The final approved Home page remains unchanged unless the owner explicitly reopened it.
- [ ] The final approved Browse Courses page remains unchanged unless the owner explicitly reopened it.
- [ ] Approved Academy Map public/private destination routing remains intact unless explicitly changed.

## Protected change authorization
<!-- Use `yes` only when the owner's request explicitly requires touching a protected area. -->
OWNER-APPROVED-PROTECTED-CHANGE: no

<!-- Use `yes` only when Aziwe Futhe explicitly reopens the approved final Home page for a direct index.html change. -->
OWNER-APPROVED-HOMEPAGE-CHANGE: no

<!-- Use `yes` when a changed file can execute on or affect the Home page and the final approved Home-page render/behaviour was regression-checked. -->
HOMEPAGE-REGRESSION-CHECKED: no

<!-- Use `yes` only when Aziwe Futhe explicitly reopens the final Browse Courses page for a direct courses-public.html change. -->
OWNER-APPROVED-BROWSE-COURSES-CHANGE: no

<!-- Use `yes` when a changed file can execute on or affect Browse Courses and its final approved render/behaviour was regression-checked. -->
BROWSE-COURSES-REGRESSION-CHECKED: no

<!-- Use `yes` only when the owner explicitly asked for a broad/cross-portal change. -->
OWNER-APPROVED-BROAD-CHANGE: no

## Files changed
<!-- List the files and why each one needed to change. -->

## Behaviour deliberately preserved
<!-- State what nearby behaviour was checked and intentionally left unchanged. -->

## Regression checks performed
- [ ] Requested path tested
- [ ] Adjacent path tested
- [ ] Desktop checked where applicable
- [ ] Mobile checked where applicable
- [ ] Role separation checked where applicable
- [ ] Supabase/RLS/data safety checked where applicable
- [ ] Final approved Home-page design/behaviour preserved where applicable
- [ ] Final approved Browse Courses design/behaviour preserved where applicable
- [ ] Academy Map approved destination routing preserved where applicable
- [ ] Student/Admin/Ambassador portal boundaries preserved where applicable

## Remaining risk or blocker
<!-- Be explicit. If none, write `None known after the checks above.` -->
