# Black November Skills Special — approved scope

## Account-first promoter link — 18 November 2026

Owner request: the influencer link must open account creation before course selection. The approved Enkosi entry is now `https://fundaonlineacademy.co.za/create-account.html?promo=ENKOSI30`.

In scope: load the existing promotion-intent helper in `create-account.html` and its authoritative `auth.html` form, and preserve the validated code in the existing handoff. The helper stores only a proposed code in this browser tab. Payment still requires Apply code and server confirmation. Account creation itself does not earn commission.

Out of scope: registration form/design, required details, Terms/Privacy, password validation, authentication/session rules, profile creation, existing-user/role routes, Ambassador referral ownership, course selection, payment/commission calculations, public catalogue, global loaders and database records. All remain unchanged.

Required regression checks: direct account entry with ENKOSI30 and BLACKNOV30; empty/invalid code; existing referral and next parameters; approved session reset; auth form and onboarding handoff source identity; code retained into the existing payment field; account form usability on phone/desktop; deployed-source and live account-first route. Use isolated fixtures for registration/payment checks, with no real account creation or Terms acceptance.

Verification: 53 isolated checks passed using the actual helper, entry and registration scripts, with fictional local signup/profile/policy responses. They cover code normalisation/validation, normal and mixed referral/next links, local sign-out, required Terms and strong-password gates, Student-only signup, profile/policy writes, onboarding handoff and the existing payment-code prefill contract. The auth source is identical to the live baseline after removing the single new helper include. Browser preview confirmed the account form at 390px and 1280px frame widths without horizontal overflow; Terms remained unchecked. No live user, registration, consent, payment or referral was submitted.

Owner request: activate a 30% Black November course promotion ending 30 November 2026, with a general code and Enkosi Gxonono's unique code. The owner expressly agreed to a privately configured campaign commission on discounted verified payments.

In scope: public promotion notices and code handoff, code entry during enrolment and additional-course checkout, server-validated discounted quotes and expiry, an Academy-controlled campaign-promoter record, campaign-only commission reporting and payout records, and the narrow marketing-source integration needed to select this promoter. Use BLACKNOV30 and ENKOSI30.

Preserve: original photographs/card dimensions, catalogue fees, all previous-study benefits without stacking, permanent ambassador referral ownership, the existing 15% ambassador programme, account creation/login and agreement acceptance, full/instalment thresholds, exact-cent allocation, banking/proof/verification controls, academic content and all unrelated portal presentation. No login or agreement acceptance is fabricated for the promoter. No test person, application, proof, payment or message is created in production.

Required verification: single/multiple/additional-course quotes; R1,250 → R875 and R1,500 → R1,050; full/2/3 payment thresholds and exact-cent allocations; invalid/expired/self/conflicting-referral codes; no stacking or duplicate commission; own-account and role isolation; later instalment continuity; dynamic reversal and payout bounds; normal checkout and ambassador definitions; desktop/mobile and live deployed-source checks.

## Implementation

- Public notices on Home, Browse Courses and View Course load the active offer from the server. Campaign links preserve a proposed code through account creation without changing authentication. Codes are applied to a server-generated checkout, including the single-course and existing-student paths.
- Catalogue prices remain unchanged. Promotional items retain their normal fee, discount, discounted fee, exact-cent instalment allocation and campaign expiry. The existing payment-submission RPC validates the campaign before inserting enrolments/payments. Submitted enrolments retain their agreed amounts for later payments after the campaign.
- Campaign promoters are separate from Ambassador programme membership. No password, Auth user, signed agreement, platform handle or application score is fabricated. A campaign-only directory entry supports the existing conditional marketing-source question without changing permanent Ambassador ownership.
- The standard 15% earning eligibility excludes payments already owned by a campaign-promoter checkout. General-code receipts retain their original Ambassador eligibility. A conflicting permanent Ambassador attribution cannot use a different promoter's code, but BLACKNOV30 offers the same discount.
- A Finance-authorised report derives campaign commission at the privately agreed rate from canonical verified payments and approved enrolments. Reversals/deletions remove eligibility dynamically. Rates are snapshotted per checkout; rounding conserves the commission across instalments. Controlled payout records cover completed EFTs and cannot exceed current unpaid confirmed earnings. Marketing contains only a link to this separate report.

## Validation before release

- The actual migration compiled and ran twice in isolated PGlite against the inspected production column types. **115 assertions passed**: single/multiple/all 35 course quotes; R1,250 to R875; R1,500 to R1,050; full/2/3-part eligibility and seven/eight-week boundaries; exact row/receipt cents; code normalisation/idempotency; invalid, null, self and conflicting-owner codes; no stacking including a benefit selected after an earlier quote; first/additional course gates and submission; own-account isolation; ordinary checkout and approved previous-study benefit preservation; approval/payment gates; no duplicate Ambassador credit; payout limits; expiry; later payment through the existing native Student payment function; and reversal/privacy/role checks. All fixtures were fictional and local.
- The current HTML and scripts were browser-tested with an isolated fictional account and mocked API responses. Home and Browse notices fit 320/390/1280px frames without document overflow. Single-course new enrolment shows R1,050 and two R525 instalments; full payment, removal to the original R1,500 fee, invalid-code retention, saved-code restoration, Enkosi's directory entry, additional-course R875 full payment, and the configured commission Finance report were observed. New/additional payment and Finance views fit a 390px frame. No final declaration, proof upload, application submission or payout was performed in the browser.
- Changed JavaScript and non-JSON inline HTML scripts pass syntax checks and diff whitespace checks. Original photos, card CSS, Step 1 browser, previous-study engine, registration requirements, login/account-creation/recovery, Ambassador portal and all academic code remain at the reviewed baseline. Those untouched areas are checked by source identity; a full live account-registration or Academy-owner device session is not claimed.

## Release procedure

Apply the additive migration, confirm function and RLS permissions, create the owner-authorised campaign/promoter/code records privately, and publish the reviewed source through the repository's Pages workflow. Enable both codes only when their checkout UI is deployed. Confirm the public offer/dates, source bytes and unchanged Student/enrolment/payment/referral/ledger counts. Existing accounts and historical records are never backfilled for testing.

The directory rollout uses an explicit promotion-directory RPC for updated enrolment clients. The original directory filters out campaign IDs so a tab opened before the release cannot save a campaign UUID into the Ambassador foreign key. Both versions and own-account selection were tested; the compatibility migration also ran twice locally.
