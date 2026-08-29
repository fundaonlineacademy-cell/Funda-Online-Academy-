# E-commerce & Online Store
## Module 2: Online Store Planning, Platforms & Setup
### Lesson 8: Testing & Launch-readiness of an Online Store

**Estimated study time:** 40–45 minutes

## Learning Outcomes
By the end of this lesson, you should be able to:
1. Explain why an online store should be systematically tested before public launch.
2. Test the major customer journey from discovery to order confirmation.
3. Identify functional, content, mobile, accessibility and operational launch risks.
4. Record defects using a practical launch-readiness checklist.
5. Make a reasoned go, conditional-go or no-go recommendation for a store launch.

## Why This Lesson Matters
A store can look complete while important functions are broken. A failed payment, incorrect delivery charge, inaccessible menu, missing product variant or confirmation email sent to the wrong address can immediately damage customer confidence. Launch testing is therefore not an optional final glance. It is a structured quality-control process that checks whether the store, people and supporting operations are ready to accept real customer orders.

## Key Terms / Vocabulary
- **Quality assurance (QA)** — Planned activities used to check that a product or process meets defined requirements and works as intended.
- **Test case** — A defined scenario, action and expected result used to test a feature or process.
- **Defect** — A problem where the actual behaviour, content or result differs from what is required or expected.
- **Regression testing** — Rechecking existing functions after a change to make sure the change has not broken something that previously worked.
- **Responsive testing** — Checking whether a website remains usable across different screen sizes and device conditions.
- **Accessibility testing** — Checking whether people with different abilities and input methods can perceive, understand and operate the store.
- **Launch blocker** — A serious defect or risk that should be resolved before the store begins accepting normal customer transactions.
- **Go/no-go decision** — A formal decision about whether the store is sufficiently ready to launch.

## Main Lesson Content
### 1. Launch readiness is more than website appearance
The purpose of launch testing is to verify the complete service, not only the home page. An e-commerce store connects catalogue data, navigation, search, customer accounts, cart logic, checkout, payment services, inventory, delivery settings, emails, policies, analytics and operational processes. A weakness in any important connection can affect the customer.

A disciplined launch process begins with requirements. The team asks what the store is supposed to do and then tests whether it actually does those things. This is stronger than browsing randomly and deciding that the site “looks fine.”

### 2. Test the complete customer journey
A useful end-to-end test begins as a customer might: open the store on a device, find a product, review information, choose a variant, add it to the cart, change quantity, proceed to checkout, enter customer and delivery information, select delivery, complete an approved test-payment process and inspect the confirmation.

The tester then checks what happened behind the scenes. Was the order created correctly? Was stock adjusted as expected? Did the correct confirmation reach the customer? Did the store owner receive the required notification? Is the order visible with the correct items, amount, payment state and delivery information?

Testing should include more than the ideal path. Try an invalid discount code, unavailable product, incorrect form entry or cancelled payment where the platform safely supports those test scenarios. The goal is to understand both successful and unsuccessful journeys.

### 3. Verify catalogue and content quality
Product pages should be reviewed for accurate titles, descriptions, images, prices, variants, stock states and categorisation. Links should work. Placeholder text, sample products and unfinished pages should be removed or deliberately hidden. Contact information and policies should be complete and consistent.

Spelling and presentation matter, but factual accuracy matters more. A beautiful page with the wrong price, size or delivery expectation can cause financial loss and customer disputes. Catalogue testing should therefore compare the storefront against the approved source information.

### 4. Test mobile and responsive behaviour
Many customers shop using phones, so mobile testing cannot be treated as a reduced version of desktop testing. Test menus, search, filters, product galleries, variant selectors, cart controls, forms, policy links and checkout on small screens. Check whether buttons can be tapped comfortably and whether important content is hidden behind overlays.

Responsive testing should use several viewport sizes and, where practical, real devices and browsers. A page that technically resizes can still be difficult to use. Test orientation changes, long product names and realistic content rather than only ideal examples.

### 5. Include accessibility in launch quality
Accessibility improves the ability of people with disabilities to use the store and often improves usability for everyone. Testing should include keyboard navigation, visible focus, meaningful headings, understandable labels, image alternatives where appropriate, readable contrast, useful error messages and predictable navigation. Checkout forms deserve special attention because they contain critical customer and transaction information.

The W3C Web Accessibility Initiative recommends clear labels and instructions for forms, consistent navigation and keyboard-operable interactive elements. Long processes are often easier to understand when divided into logical steps with clear progress. Accessibility should be considered throughout design and development, but a launch review is an important checkpoint.

### 6. Test payments safely
Payment testing must follow the payment provider’s supported test or sandbox process where available. Teams should not make unsafe experiments with real customer credentials or expose sensitive payment information. Confirm successful test payments, declined/cancelled scenarios where supported, order status, confirmation messages and the relationship between payment status and fulfilment.

A critical rule is that an order should not accidentally be treated as paid merely because a customer reached a confirmation page. The store’s payment and order states must correspond to the actual payment-provider workflow.

### 7. Verify delivery and operational readiness
Delivery settings should be tested using addresses that represent the regions the business intends to serve. Check shipping rates, free-shipping thresholds, collection options, unavailable regions and estimated time information. If the business promises local collection, the collection process must actually be ready.

Operational readiness also includes packaging materials, stock, order-monitoring responsibility, customer-service channels, returns handling and supplier coordination. A website can be technically ready while the business behind it is not. The first orders should not be the first time staff discover how to process an order.

### 8. Record defects by severity
Testing is more useful when findings are recorded consistently. A defect record can include the page or process, steps to reproduce, expected result, actual result, device/browser, screenshot or evidence, severity, owner and status.

Severity helps prioritise work. A spelling error may be minor. A broken product image may be moderate. Checkout failure, incorrect pricing, exposure of sensitive information or an inability to complete the core purchase journey can be a launch blocker. Teams should define severity in relation to customer, financial, security, legal and operational risk.

### 9. Retest after fixes
Fixing a defect does not complete the task until the fix is verified. The tester should repeat the original test and, where appropriate, conduct regression testing around related functions. For example, changing delivery rules to fix one province may unintentionally alter rates elsewhere. Changes near launch should therefore be controlled rather than rushed into production without retesting.

### 10. Make a disciplined launch decision
At the end of testing, the team should review unresolved defects and operational risks. A **go** decision means the agreed critical requirements have been met and no unacceptable launch blockers remain. A **conditional go** may be appropriate when low-risk issues remain but are documented, owned and scheduled. A **no-go** decision is appropriate when serious defects make transactions unsafe, unreliable, misleading or operationally unmanageable.

Delaying a launch can be inconvenient, but launching a store that cannot reliably take orders can be more expensive. The purpose of a go/no-go review is not to demand perfection. It is to make a conscious decision based on evidence and acceptable risk.

## Worked Example / Demonstration
**Scenario:** A small clothing store is scheduled to launch on Friday. During testing, the team finds three issues: one product image is slightly cropped, a mobile filter overlaps the product list, and orders paid through the test gateway remain marked “payment pending.”

**Assessment:** The cropped image is low severity. The filter problem affects mobile shopping and should be corrected. The incorrect payment status is a launch blocker because staff could mishandle paid orders.

**Decision:** The team records a no-go until the payment-status defect is fixed and verified. After the fix, the end-to-end payment and order workflow is retested before launch approval.

## Practical Activity
Create a **Launch-readiness Test Sheet** for an imaginary store. Include at least 15 test cases across:
- Navigation and search
- Product pages
- Cart
- Checkout forms
- Payment test flow
- Delivery settings
- Confirmation messages
- Mobile usability
- Accessibility basics
- Contact and policy links
- Back-office order processing

For every test case record: action, expected result, actual result, pass/fail, severity if failed and corrective owner.

## Knowledge Check
1. Why is browsing the home page insufficient as launch testing?
2. What is the difference between a test case and a defect?
3. Give three areas that should be checked during a mobile store test.
4. Why is regression testing important after a fix?
5. What type of issue should normally prevent a store from launching?

## Feedback / Explanation
1. E-commerce depends on a connected customer and operational journey; a home page can work while checkout, payments, delivery or order processing fails.
2. A test case defines what will be tested and the expected result. A defect is a problem discovered when actual behaviour does not meet the requirement or expectation.
3. Examples include navigation, search, filters, product galleries, cart controls, forms, policy links and checkout.
4. A fix can unintentionally affect related functions, so regression testing checks that previously working behaviour still works.
5. A launch blocker is a serious defect that creates unacceptable transaction, customer, security, financial, compliance or operational risk.

## Key Takeaways
- Launch testing must examine the complete e-commerce service, not just visual appearance.
- End-to-end testing should follow the customer journey and verify back-office results.
- Mobile usability, accessibility, catalogue accuracy, payments and delivery all require deliberate testing.
- Defects should be recorded, prioritised, fixed and retested.
- Payment testing should use approved test methods and protect sensitive information.
- A go/no-go decision should be evidence-based and should not ignore serious launch blockers.

## Visual Learning Guidance
**Recommended visual:** An e-commerce launch-testing flow diagram: Storefront → Product → Cart → Checkout → Test Payment → Order Record → Confirmation → Fulfilment, with QA checkpoints under each stage.

**Caption:** “A launch-ready store is a working end-to-end system. Testing follows the transaction from the customer interface into the operational processes behind it.”