# Funda Online Academy — Ambassador System-Wide Audited Lock

**Owner:** Aziwe Futhe, Founder & CEO  
**Lock date:** 23 September 2026 (South Africa)  
**Audited runtime checkpoint:** `57fa9d7f64ea1e710c8d184716f5019f1d0bbd0d`

## Owner decision

After the final Ambassador Portal improvement cycle and a full code, database, security, relationship, tracking and operational audit, the complete Funda Online Academy Ambassador system is owner-authorised for system-wide lock.

This lock protects the approved working system. It does **not** freeze legitimate operational data. New applications, referrals, Student enrolments, verified payments, earnings, payouts, banking updates, announcements, marketing resources, support activity and Your Voice submissions may continue through the approved workflows.

Future defects or requested improvements are change requests. They do not automatically reopen the Ambassador system.

## Protected Ambassador journey

The protected end-to-end journey is:

**Public Ambassador Programme → Ambassador Application / login creation / programme agreement → Academy review → approved, waitlisted or declined status → activation → Ambassador Login → Ambassador Portal**

The protected authentication behaviour includes:

- Ambassador Login remains separate from Student and Staff/Admin login.
- Email/password sign-in remains required.
- The server-side Ambassador application-status gate remains required.
- Forgot Password remains tied to the registered Ambassador email and the approved recovery flow.
- Expired/invalid portal sessions return to Ambassador Login.
- Logout signs out the local Ambassador session and returns to Ambassador Login.
- Pending, waitlisted and declined applicants remain outside full operational Ambassador tools.

## Protected canonical Portal navigation

Only the following canonical sidebar destinations are approved. Duplicate navigation entries must not be restored.

### MAIN
- My Dashboard
- Programme Guide
- My Referrals
- Rank Progress
- Compensation Plan

### FINANCE
- My Earnings
- Payment History
- My Banking

### RESOURCES
- Marketing Resources
- Announcements
- Help & Support
- Programme Rules

### ACCOUNT
- My Referral Link
- My Profile

### YOUR VOICE
- Your Voice

There is one canonical navigation entry for earnings, banking and announcements. The retired duplicate labels **Earnings Breakdown**, **Bank Details** and **Notifications** must not be reintroduced unless the owner explicitly reopens navigation.

## Protected presentation and usability

The current professional Ambassador Portal presentation is part of the lock:

- Source Sans 3 is the approved Ambassador Portal UI font.
- The current dark-navy branded header and footer remain protected.
- The current working header search remains protected.
- The current boxed sidebar-tab presentation, active blue state and current champagne / blue-grey visual treatment remain protected.
- The current professional card, table, form, notice and responsive readability treatment remains protected.
- Academy Identity remains compact.
- Footer Ambassador support contact details and approved portal destinations remain protected.
- My Referrals remains limited to 10 visible records per page with Previous / Next controls.
- Marketing Resources remains limited to 6 visible resources per page with the approved Preview & Details workflow.
- Announcements retain the approved official-message hierarchy and readable sender/message presentation.

## Protected referral attribution and Student handoff

The approved Ambassador referral link is:

**Ambassador referral link → Student Account Creation → working Student registration → secure eligible referral claim → Student onboarding**

The following rules are locked:

- The Ambassador referral URL points directly to `create-account.html?ref=CODE`.
- The referral code is preserved into the working Student registration form.
- Referral ownership is established only for an eligible newly-created Student account through the server-side claim function.
- A referral-link click by itself is not authoritative attribution.
- Existing attribution is permanent and cannot be overwritten by another Ambassador code.
- Cached/old referral intent cannot claim an established Student account.
- Self-referral is prohibited server-side.
- Raw referral records are not directly readable by Ambassadors.
- Ambassador-visible referral information remains privacy-limited.
- My Referrals search, status filtering and 10-per-page pagination remain protected.

## Protected earnings, payment and compensation rules

Confirmed direct commission remains based only on the approved server-side eligibility chain:

**recorded referral + active Student account + Admin-approved enrolment + Admin-verified payment + approved active Ambassador**

The following values and controls are protected:

- Direct commission: **15%** of verified qualifying revenue.
- A confirmed commission must have a valid linked enrolment and eligible verified payment.
- The payment/enrolment verification guard remains server-side.
- One confirmed direct commission record remains unique per eligible payment.
- If the linked payment/enrolment later fails eligibility, the commission is reversed/held under the approved audit rules.
- Unconfirmed referrals remain R0 / not yet earned.
- Portal earnings remain restricted to approved/paid eligible records.

Protected cumulative rank thresholds:

- Ambassador: R0–R9,999
- Bronze: R10,000–R24,999
- Silver: R25,000–R49,999
- Gold: R50,000–R99,999
- Platinum: R100,000–R249,999
- Diamond: R250,000–R499,999
- Executive: R500,000–R999,999
- Elite: R1,000,000+

Protected one-time achievement bonuses:

- Bronze: R500
- Silver: R1,000
- Gold: R2,500
- Platinum: R5,000
- Diamond: R10,000
- Executive: R20,000
- Elite: R45,000

Protected monthly-performance caps:

- Gold: up to R5,000
- Platinum: up to R8,000
- Diamond: up to R12,000
- Executive: up to R18,000
- Elite: up to R25,000

The direct-referral-only model remains protected. Do not introduce downlines, recruitment commission, team overrides or network-marketing mechanics without explicit owner approval.

## Protected payment schedule and banking

The current Ambassador payment guidance is protected:

- Approved earnings for a month are normally scheduled for the **5th of the following month**.
- If the 5th falls on Saturday, Sunday or a South African public holiday, the scheduled payday moves backward to the previous business day.
- Ambassadors do not manually withdraw funds from the portal.
- Finance processes approved payouts through the controlled payout workflow.

Banking security remains protected:

- Banking is own-account only.
- The portal does not read the raw payout-details table directly.
- The safe banking RPC returns only the account ending / last four digits, not the stored full account number.
- Updating banking details resets Finance verification to pending.
- Full banking data must never be exposed back to the Ambassador browser.
- Finance verification remains required before future payments are processed.

## Protected marketing and communications

Marketing Resources remains an **Academy-issued-materials-only** area.

Ambassadors must not:

- create, edit or generate unofficial Funda Online Academy posters/adverts using AI, design tools or third-party templates unless specifically authorised by the Academy;
- invent promotions, discounts, sales, competitions or special offers;
- make unsupported claims about accreditation, employment, admission, refunds or guaranteed outcomes.

Announcements remains the canonical official Ambassador communication area. The removed duplicate Notifications tab must not be restored.

## Protected support, Programme Rules and Your Voice

- Support tickets and replies remain private, account-bound and traceable.
- An Ambassador cannot read another Ambassador's support records.
- Programme Agreement acceptance remains version/hash-specific where required.
- Your Voice remains restricted to authenticated approved active Ambassador accounts.
- Suggestions, complaints and compliments remain linked to the submitting Ambassador and routed under the approved server-side rules.
- Confidential complaint behaviour remains protected.

## Protected live / refresh behaviour

The current non-destructive live reconciliation architecture is part of the lock:

- RLS-safe Realtime changes are listened to for approved Ambassador operational sources.
- Secure own-record RPCs remain the authoritative data source where direct table access is intentionally restricted.
- Browser focus, pageshow and return-to-visible reconciliation remain available.
- A five-minute fallback reconciliation remains available while the portal is open.
- Silent reconciliation is debounced and must not overlap itself.
- Current section and scroll position are preserved during silent live reconciliation.
- Automatic redraw is suppressed while editable fields are actively being used and while protected modal workflows are open.
- Realtime channels/timers are cleaned up on page exit.
- Support/referral data that is intentionally not directly exposed through Realtime is refreshed through the secure reconciliation path.

Do not replace the current live architecture with destructive page reloads or browser-only tracking.

## Security lock

The following security boundaries were verified at lock time and are protected:

- Relevant Ambassador tables have Row Level Security enabled.
- An authenticated Ambassador can read the safe own-account views/RPCs but cannot directly read raw referral rows or raw payout-detail rows.
- An unrelated authenticated account returns zero Ambassador own-record data.
- An anonymous session returns zero private Ambassador application/referral/earnings/payout/banking/support data.
- The current public Ambassador application agreement is intentionally public.
- Browser Ambassador code contains no service-role / privileged Supabase secret.
- Server-side own-account RPCs verify `auth.uid()` and/or the bound Ambassador application.
- Admin-only Ambassador earning/performance controls retain server-side Admin checks.
- Support insert/read policies remain ownership-bound.
- Realtime Postgres Changes remain subject to the existing RLS boundary.
- Stored Student private data remains outside the Ambassador portal.

Do not weaken these controls, replace them with UI hiding, or grant direct raw-data access merely to simplify frontend work.

## Audit integrity result at lock time

The live audit found:

- 0 approved active Ambassador accounts missing a referral code
- 0 duplicate referral codes
- 0 duplicate Student referral attribution
- 0 self-referrals
- 0 referral rows missing an Ambassador application
- 0 recorded referrals missing the required Student profile
- 0 confirmed direct commissions with an invalid rate
- 0 confirmed direct commissions linked to an ineligible payment
- 0 duplicate direct commission rows for a payment
- 0 confirmed commission rows missing enrolment/payment linkage
- 0 eligible verified payments missing their confirmed commission record
- 0 confirmed commission records without an eligible verified payment
- 0 payout records missing an Ambassador application
- 0 payout-detail records missing an Ambassador application
- 0 duplicate payout-detail records for an Ambassador application
- 0 support tickets missing an Ambassador application
- 0 support messages missing their ticket
- 0 unvalidated constraints on Ambassador tables

At the audited checkpoint, eligible verified revenue and confirmed qualifying revenue matched exactly, and the confirmed direct commission matched the protected 15% rule.

The audit did **not** mutate production records.

## Dynamic records are not frozen

This lock protects structure, authorization, business rules, tracking, presentation and approved workflows. It does not freeze legitimate live data.

The following may continue changing through approved workflows:

- Ambassador applications and statuses
- referral records
- Student enrolment/payment states
- confirmed earnings and rank progress
- payouts
- verified banking state
- marketing resources
- announcements
- support tickets/replies
- Programme Agreement acceptance
- profile updates
- Your Voice submissions/responses

## Change-control rule after lock

No future Ambassador change may be made merely because a developer considers it cleaner, newer or more convenient.

Any future change must:

1. be explicitly reopened by Aziwe Futhe;
2. identify the exact affected Ambassador area;
3. use the smallest reliable change;
4. preserve every unaffected locked area;
5. preserve server-side/RLS security boundaries;
6. run Ambassador regression checks;
7. record the owner-approved scope in the pull request;
8. update this lock record if the owner changes the approved standard.

**Fix up; do not break up.**

## Verification boundary

This lock is based on the repository/runtime audit plus live production-database relationship, authorization and read-only access tests. The model did not impersonate the owner's physical browser session. Physical UI review performed by the owner remains the final human check for device-specific rendering.
