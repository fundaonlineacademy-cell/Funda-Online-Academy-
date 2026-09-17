# Funda Online Academy — Repository Instructions for Coding Agents

These instructions apply to every coding agent, AI assistant, automated refactor, and developer working in this repository.

## 1. Owner authority

The product owner is Aziwe Futhe, Founder & CEO of Funda Online Academy (FOA).

**FOA OWNER RULE:** Do not redesign, restore, refactor, remove, reposition, rename, recolour, rewrite, or otherwise change any existing approved behaviour unless Aziwe Futhe explicitly requested that specific change.

If the owner asks to fix **A**, preserve **B through Z** unless changing them is technically unavoidable. Do not interpret access to GitHub or Supabase as permission to make adjacent improvements.

A previous owner rejection overrides developer preference. A feature, layout, wording, behaviour, workflow, or design that the owner rejected must not be reintroduced unless the owner explicitly requests it again.

## 2. Read the protected state before editing

Before changing runtime code, read:

1. `FOA_APPROVED_STATE.md`
2. `FOA_CHANGE_CONTROL.md`
3. Any page- or feature-specific notes referenced there.

If the requested change conflicts with a protected decision, stop and surface the conflict instead of silently overriding the protected state.

## 3. Scope lock is mandatory

For every task, establish a narrow scope before editing:

- Requested behaviour: what must change.
- Allowed surfaces: pages/components/files that may change.
- Out of scope: everything not required for the requested behaviour.
- Required regression checks: existing behaviour that must remain unchanged.

Do not perform broad cleanup, formatting, modernization, dependency changes, UI polish, copy changes, or refactors as side effects.

If an unexpected dependency requires changes outside the scope, do not make those changes silently. Treat it as a blocker requiring explicit owner approval.

## 4. Protected surfaces

Treat the following as high-risk/protected by default:

- Login/authentication and role routing.
- Student Dashboard and Student Library.
- Admin Command Center and Staff Workspace.
- Ambassador application, portal, referrals, earnings, banking, and programme administration.
- Public course catalogue and course overview.
- Student onboarding/enrolment and payment flow.
- Certificates and verification.
- Communication Centre, notifications, support, complaints/suggestions/compliments.
- Course content, module/lesson counts, assessments, progress tracking, and completion rules.
- Supabase schema, RLS policies, RPCs, authentication, storage, Edge Functions, and production data.
- Global loaders and shared runtime files, especially `supabase-config.js`.

A task touching one protected surface does not grant permission to change another.

## 5. Do not stack patches on patches

Prefer fixing the authoritative source of behaviour.

Do not add another timer, MutationObserver, injected script, global override, or `!important` rule merely to fight an existing override unless the owner explicitly asks for a temporary emergency patch.

If two scripts are competing over the same UI or behaviour, identify the ownership conflict and resolve it in a dedicated refactor. Do not add a third competing layer.

Do not place unrelated features in the same script. For example, Ambassador referral code must not become the long-term home for Staff/Admin login behaviour or public-course FAQ behaviour.

## 6. Git workflow

For substantial or cross-cutting work, use a dedicated branch and pull request. Keep `main` as the live approved baseline.

Direct-to-`main` changes are reserved for tiny, explicitly requested corrections where the blast radius is known and regression risk is low.

One pull request should normally represent one owner request or one tightly related correction.

## 7. Supabase/data safety

Do not make destructive database changes, drop data, weaken RLS, bypass authentication, broaden permissions, or alter production records unless explicitly requested and required.

Schema changes should be additive/idempotent where practical and must preserve existing live data.

Never use a data fix as a substitute for understanding an application-code regression.

## 8. Verification before completion

Before declaring a task complete:

- Confirm only intended files/surfaces changed.
- Compare the diff against the stated scope.
- Re-check protected decisions relevant to the touched area.
- Test the requested path and at least the immediately adjacent path.
- Confirm desktop/mobile behaviour when UI is involved.
- Confirm role separation when authentication/portal code is involved.
- Confirm no approved wording, layout, navigation, payment, assessment, or access rule was silently restored or removed.

## 9. Completion report

Every completed coding task should report:

- What the owner requested.
- What changed.
- Files changed.
- What was deliberately left unchanged.
- Regression checks performed.
- Any remaining blocker or risk.

Never report an untested assumption as a verified result.
