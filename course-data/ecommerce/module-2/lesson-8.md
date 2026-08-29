# E-commerce & Online Store
## Module 2: Online Store Planning, Platforms & Setup
### Lesson 8: Testing & Launch-readiness of an Online Store

**Estimated study time:** 45–50 minutes

## Learning Outcomes
By the end of this lesson, you should be able to:
1. Explain why an online store should be systematically tested before launch.
2. Test the customer journey from product discovery through order confirmation.
3. Identify functional, content, mobile, accessibility and operational defects.
4. Record defects by severity and ownership.
5. Make an evidence-based go, conditional-go or no-go recommendation.

## Why This Lesson Matters
A store can look complete while important functions are broken. Payment failure, incorrect delivery charges, missing variants or unusable mobile checkout can damage customer confidence from the first order. Launch readiness is therefore a structured quality-control process covering the website and the operation behind it.

## Key Terms / Vocabulary
- **Quality assurance (QA)** — Planned activities used to check that requirements are met.
- **Test case** — A defined scenario, action and expected result.
- **Defect** — A problem where actual behaviour or content does not meet the requirement.
- **Regression testing** — Rechecking existing functions after a change.
- **Launch blocker** — A serious issue that should be resolved before normal customer transactions begin.
- **Go/no-go decision** — A formal decision about launch readiness.
- **Severity** — Classification of the impact or risk of a defect.

## Main Lesson Content
### 1. Test the complete service
E-commerce connects catalogue data, search, cart, checkout, payment, stock, delivery, communication and staff processes. A launch test should therefore verify more than the homepage.

### 2. Build test cases from requirements
Every important requirement should have an expected result. If the business requires free delivery above R800, test values below, at and above the threshold. If unsupported regions should be blocked, test realistic addresses.

### 3. Test the end-to-end purchase journey
A practical test can include:
1. discover a product;
2. review information;
3. select a variant;
4. add to cart;
5. change quantity;
6. enter checkout information;
7. select delivery;
8. complete an approved test payment;
9. inspect confirmation;
10. verify the order record behind the scenes.

The digital and operational results should agree.

### 4. Test more than the successful path
Where safely supported, test invalid discount codes, failed payments, unavailable stock, incomplete form fields and unsupported addresses. A store must handle errors clearly rather than work only when everything is perfect.

### 5. Review content quality
Check product titles, images, prices, variants, stock states, links, contact information and policies. Placeholder content and contradictory information should be removed or corrected.

### 6. Test mobile and accessibility
Review menus, search, filters, galleries, cart, forms and checkout on representative screen sizes. Check keyboard access, visible focus, understandable labels, useful error messages and important image alternatives where appropriate.

### 7. Test payments safely
Use the payment provider's approved sandbox or test method where available. Do not expose real sensitive credentials for testing. Confirm that successful, pending or failed payment states create the correct order behaviour.

### 8. Test operational readiness
The website can be technically ready while the business is not. Confirm stock, packaging, order-monitoring responsibility, courier processes, customer-service channels, return handling and escalation procedures.

### 9. Record defects consistently
A defect record should contain:
- test case or process;
- steps to reproduce;
- expected result;
- actual result;
- evidence;
- severity;
- responsible owner;
- status;
- retest result.

A spelling issue may be low severity. Incorrect prices, broken checkout, exposed sensitive information or failed payment status can be launch blockers.

### 10. Retest after changes
A fix should be verified and related functions retested. Changing delivery logic for one region can accidentally affect another. Controlled regression testing reduces this risk.

### 11. Make the launch decision
A **go** means critical requirements are satisfied and no unacceptable blockers remain. A **conditional go** may be used when low-risk issues are documented and owned. A **no-go** is appropriate where serious transaction, security, compliance or operational risks remain.

The goal is not perfection. It is a deliberate decision based on evidence and acceptable risk.

## Worked Example / Demonstration
A clothing store plans to launch Friday. Testing finds a slightly cropped image, a mobile filter that overlaps products and a test payment that remains marked pending despite success. The image is low severity, the filter needs correction and the payment-status problem is a launch blocker. The store delays launch until payment handling is corrected and retested.

## Practical Activity
Create a Launch-readiness Test Sheet with at least 20 test cases across navigation, product pages, cart, checkout, payment, delivery, confirmation, mobile usability, accessibility, policy links and back-office order processing. Record Pass/Fail, severity, owner and retest status.

## Knowledge Check
1. Why is homepage browsing insufficient as launch testing?
2. What is the difference between a test case and a defect?
3. Give three mobile areas that should be tested.
4. Why is regression testing necessary after a fix?
5. What type of issue should normally block launch?

## Feedback / Explanation
1. Important failures can exist in checkout, payment, delivery or operations while the homepage looks correct.
2. A test case defines expected behaviour; a defect is a failure to meet it.
3. Examples include navigation, filters, cart, forms and checkout.
4. A change can unintentionally break related functions.
5. A serious issue creating unacceptable customer, financial, security, compliance or operational risk.

## Key Takeaways
- Launch testing must cover the complete e-commerce service.
- Requirements should become test cases.
- Successful and error paths both need testing.
- Mobile, accessibility, payment and operational readiness are launch concerns.
- Defects should be recorded, prioritised, corrected and retested.
- Go/no-go decisions should be evidence-based.

## Visual Learning Guidance
**Recommended visual:** Storefront → Product → Cart → Checkout → Test Payment → Order Record → Fulfilment, with QA checkpoints at each stage.

**Caption:** “A launch-ready store works end to end, including the operational processes behind the screen.”