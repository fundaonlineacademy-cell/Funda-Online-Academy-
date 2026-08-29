# E-commerce & Online Store
## Module 8: Practical Online Store Project
### Lesson 7: Full-store Testing, Security Checks & Launch Readiness

**Estimated study time:** 45–50 minutes

## Learning Outcomes
By the end of this lesson, you should be able to:
1. Test the complete customer journey before launch.
2. Identify functional, content, operational, accessibility and security defects.
3. Classify issues by severity and launch risk.
4. Retest corrections and perform regression checks.
5. Make an evidence-based go, conditional-go or no-go decision.

## Why This Lesson Matters
The capstone store should be treated like a real launch. A site can look finished while checkout is broken, product information is inaccurate, delivery rates are wrong or administrator accounts are insecure. The learner must therefore prove that the store works end to end rather than assuming that completed design means launch readiness.

## Key Terms / Vocabulary
- **End-to-end test** — A test covering the complete customer and operational journey.
- **Regression test** — Rechecking existing functions after a change.
- **Launch blocker** — A defect or risk serious enough to prevent launch.
- **Severity** — The level of impact a defect may cause.
- **Go/no-go decision** — A formal decision about launch readiness.
- **Test evidence** — Screenshots, records or results showing what was tested and what happened.

## Main Lesson Content
### 1. Test the complete journey
Start as a customer would: discover the store, browse categories, open a product, choose a variant, add to cart, review totals, complete checkout using approved test methods and inspect the confirmation. Then verify order, payment, stock and fulfilment records behind the scenes.

### 2. Test realistic edge cases
Include unavailable stock, invalid form input, failed or pending payment, discount rules, remote delivery addresses and mobile layouts. The project should show that error handling is understandable and safe.

### 3. Review content and compliance
Check product titles, descriptions, prices, images, policies, contact information and promotional claims. Confirm that transaction review and correction are available before final order placement and that important terms are easy to find.

### 4. Review accessibility and mobile usability
Test readable content, labels, keyboard access, meaningful image alternatives where appropriate, focus behaviour and mobile controls. Important functions should not depend on a large desktop screen.

### 5. Review security basics
Confirm MFA on important accounts where supported, appropriate staff permissions, trusted integrations, current software and a backup/recovery approach. No real sensitive customer or payment credentials should be used for unsafe testing.

### 6. Classify and fix defects
A spelling error may be low severity. Wrong pricing, checkout failure, exposed personal information or incorrect payment status may be launch blockers. Record the defect, owner, correction and retest evidence.

### 7. Make a launch decision
A go decision means critical requirements are satisfied and no unacceptable blockers remain. A conditional go may allow documented low-risk issues. A no-go is appropriate when serious transaction, security, compliance or operational risk remains.

## Worked Example / Demonstration
During final testing, the learner finds a broken social icon, one missing image alternative and a delivery rule that charges R0 for a remote region that should be R180. The delivery error is corrected before launch because it creates financial and operational risk. The accessibility issue is also fixed, while the cosmetic icon is documented as lower priority.

## Practical Activity
Create a launch-readiness test sheet with at least 25 test cases. Include customer journey, mobile, accessibility, payment, delivery, policies, marketing links, security and back-office order handling. Record pass/fail, severity and retest evidence.

## Knowledge Check
1. Why is visual review alone insufficient?
2. What is regression testing?
3. Give two examples of launch blockers.
4. Why should security be included in launch testing?
5. What distinguishes a go from a no-go decision?

## Feedback / Explanation
1. Important transaction and operational functions can fail while pages look correct.
2. Rechecking previously working functions after a change.
3. Examples include checkout failure, materially wrong pricing or exposed sensitive data.
4. The store may function but still expose unacceptable risk.
5. A go has no unacceptable blockers; a no-go still has serious unresolved risk.

## Key Takeaways
- The final project must be tested end to end.
- Edge cases reveal problems that ideal-path testing can miss.
- Content, accessibility, security and operations all affect launch readiness.
- Defects should be prioritised, fixed and retested.
- Launch decisions should be based on evidence rather than appearance.

## Visual Learning Guidance
**Recommended visual:** Discover → Product → Cart → Checkout → Payment → Order → Fulfilment → Delivery, with QA checkpoints across the flow.

**Caption:** “Launch readiness means the whole store works safely, accurately and consistently from customer action to business operation.”