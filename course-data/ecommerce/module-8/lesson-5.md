# E-commerce & Online Store
## Module 8: Practical Online Store Project
### Lesson 5: Configure Payments, Orders, Fulfilment & Delivery

**Estimated study time:** 40–45 minutes

## Learning Outcomes
By the end of this lesson, you should be able to:
1. Configure a realistic payment and order workflow for the capstone store.
2. Define fulfilment steps from paid order to dispatch.
3. Create practical delivery zones and rates.
4. Document refund, cancellation and delivery-exception processes.
5. Test the operational journey using approved test methods.

## Why This Lesson Matters
A store is only useful if it can turn a customer order into a controlled transaction and fulfil it accurately. The capstone must therefore show what happens after checkout: how payment is verified, how stock is allocated, how items are picked and packed, how delivery is charged and how exceptions are handled.

## Key Terms / Vocabulary
- **Payment flow** — The sequence used to submit, verify and record payment.
- **Fulfilment workflow** — The operational process used to prepare and dispatch an order.
- **Delivery zone** — A geographic area governed by delivery rules.
- **Order exception** — A problem that interrupts normal processing.
- **Reconciliation** — Comparing related records to confirm that they agree.
- **Test transaction** — A controlled transaction used to verify store behaviour without unsafe use of live customer information.

## Main Lesson Content
### 1. Define payment methods
Choose realistic payment methods supported by the project platform or test environment. Document how staff will know whether payment is pending, paid, failed or refunded. Payment should be verified through the approved system rather than customer screenshots.

### 2. Build the order workflow
Create a sequence from order submission through payment verification, stock allocation, picking, packing, dispatch, tracking and completion. Define which statuses are used at each stage.

### 3. Build fulfilment controls
The project should show how staff verify SKU, variant and quantity before dispatch. Add a final pack check and a process for damaged, missing or unavailable stock.

### 4. Configure delivery
Define realistic delivery zones, rates, free-shipping thresholds if used, and collection options. Delivery promises should match the operational plan. Test several addresses and order values to confirm that the correct option appears.

### 5. Define exceptions
Document what happens when payment fails, a customer requests cancellation, stock is unavailable, a parcel is delayed or a refund is required. The process should state who owns the next action.

### 6. Reconcile the test order
After a test transaction, compare the order, payment status, stock movement, fulfilment record, tracking or collection state and any customer notifications. These records should tell the same story.

## Worked Example / Demonstration
StudyBox SA configures a standard courier rate of R85 and free delivery above R900. A test order of R950 correctly receives free delivery. Payment is processed through the approved test flow, stock decreases, the picking list shows the correct SKUs, and the order moves to dispatch only after the pack check.

## Practical Activity
Run at least three project test scenarios: successful paid order, failed/pending payment, and an order requiring a delivery or stock exception. Record expected result, actual result and corrective action.

## Knowledge Check
1. Why should payment status be verified through the approved system?
2. What should happen before dispatch?
3. Why should several delivery addresses be tested?
4. What is an order exception?
5. Why should a test order be reconciled across systems?

## Feedback / Explanation
1. It is the authoritative source for transaction status.
2. Stock, SKU, variant, quantity and packaging should be verified.
3. Delivery rules can vary by location and order conditions.
4. A problem that interrupts normal processing.
5. Reconciliation confirms that the digital and operational records agree.

## Key Takeaways
- Payments, orders and fulfilment must operate as one connected workflow.
- Status changes should reflect verified events.
- Delivery rules should be realistic and tested.
- Exceptions need documented ownership and resolution steps.
- Test transactions should be reconciled before launch.

## Visual Learning Guidance
**Recommended visual:** Checkout → Payment Verified → Stock Allocated → Pick → Pack → Dispatch → Delivery → Reconciliation.

**Caption:** “A practical online store must prove that the transaction works from customer payment through to operational completion.”