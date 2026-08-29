# E-commerce & Online Store
## Module 4: Orders, Payments, Fulfilment & Delivery
### Lesson 1: Order Lifecycle & Order Status Management

**Estimated study time:** 40–45 minutes

## Learning Outcomes
By the end of this lesson, you should be able to:
1. Explain the main stages in an e-commerce order lifecycle.
2. Distinguish clearly between order, payment and fulfilment statuses.
3. Identify risks caused by incorrect or premature status changes.
4. Apply a controlled order-processing workflow from checkout to completion.
5. Record, investigate and escalate order exceptions using reliable evidence.
6. Use order records to support customer service, finance and fulfilment teams.

## Why This Lesson Matters
An online sale does not end when a customer clicks **Place order**. The order still has to move through several operational stages: the transaction must be recorded, payment must be confirmed, stock must be allocated, the correct item must be picked and packed, delivery must be arranged and the customer must receive accurate updates.

When order statuses are handled badly, one error can affect several teams at once. A warehouse may dispatch an unpaid order. Customer service may tell a customer that a parcel has shipped when it has not. Finance may treat a cancelled order as revenue. A duplicate fulfilment may be created because a completed order was reopened incorrectly.

Good order management therefore depends on accurate records, controlled status changes and clear responsibility at every stage.

## Key Terms / Vocabulary
- **Order** — A recorded request from a customer to purchase goods or services.
- **Order status** — The current stage of an order, such as pending, confirmed, completed or cancelled.
- **Payment status** — The state of money collection, such as pending, authorised, paid, failed, partially refunded or refunded.
- **Fulfilment status** — The operational stage of preparing and sending the order.
- **Stock allocation** — Reserving the required inventory for a specific order.
- **Dispatch** — Handing a prepared order into the approved delivery or collection process.
- **Exception** — A problem preventing the normal workflow from continuing.
- **Order number** — A unique reference used to identify and trace an order.
- **Audit trail** — A record of important actions, status changes and updates.

## Main Lesson Content
### 1. Understand the complete order lifecycle
A typical physical-goods order can move through the following stages:
1. Customer submits checkout.
2. The system creates an order record.
3. Payment status is verified.
4. Stock is allocated to the order.
5. The correct products and variants are picked.
6. The order is checked and packed.
7. Delivery or collection is arranged.
8. The parcel is dispatched or marked ready for collection.
9. Tracking or collection evidence is recorded.
10. Delivery or collection is completed.
11. The order is closed according to the store's process.

The exact labels depend on the platform, but the underlying events should be understood consistently by staff.

### 2. Keep order, payment and fulfilment statuses separate
These statuses answer different questions.

**Order status** asks: *What is the overall state of the transaction?*

**Payment status** asks: *Has the money been successfully collected, failed, refunded or remained pending?*

**Fulfilment status** asks: *Have the goods been allocated, picked, packed or dispatched?*

An order can therefore exist while payment is still pending. A payment can be successful while fulfilment has not started. A parcel can be dispatched while the order remains open until the business confirms delivery or another completion event.

Treating these as one status creates operational risk.

### 3. Use evidence before changing status
Statuses should describe real events, not desired outcomes. Staff should not mark an order paid because a customer says payment was made. They should verify the approved payment record. Likewise, fulfilment should not be marked complete until the required operational work has actually occurred.

A useful control principle is:

**No important status change without supporting evidence.**

Examples of evidence include verified payment records, stock-allocation records, pick/pack confirmation, courier tracking, collection confirmation or refund records.

### 4. Allocate stock carefully
A paid order does not automatically mean the required stock exists. The system or staff should confirm that the exact variant is available and allocated.

If a customer orders size 8 black shoes, allocating size 9 or a different colour is not an acceptable substitution unless the customer approves the change through the authorised process.

Stock shortages should remain visible as exceptions until resolved.

### 5. Prevent duplicate fulfilment
Duplicate fulfilment can occur when two staff members process the same order, when a system integration sends repeated instructions or when status changes are misunderstood.

Controls can include:
- one authoritative order record;
- clear ownership of fulfilment stages;
- scanning or SKU checks;
- system locks or processed indicators where available; and
- review of unusual duplicate tracking or dispatch records.

### 6. Manage order exceptions
Common exceptions include:
- failed or pending payment;
- duplicate order submission;
- unavailable stock;
- incorrect or incomplete delivery address;
- suspicious transaction signals;
- requested cancellation;
- damaged stock before packing;
- courier service failure; and
- mismatch between order and payment records.

Staff should not hide exceptions by forcing the order into a completed status. The issue should be recorded, investigated and escalated where authority is required.

### 7. Understand cancellation timing
The correct cancellation process depends partly on where the order is in the lifecycle. An unpaid order may be cancelled without a refund. A paid but unfulfilled order may require a refund after cancellation. An order already dispatched may require a return process rather than a simple pre-dispatch cancellation.

This is why staff should check both payment and fulfilment status before promising an outcome.

### 8. Use customer communication that matches the real status
Customer messages should reflect verified information. For example:
- “Payment received” should be sent only after the approved system confirms it.
- “Your order has shipped” should be linked to actual dispatch.
- “Your refund has been processed” should distinguish between submission of a refund and completion by the payment provider where necessary.

Accurate status communication reduces avoidable complaints.

### 9. Maintain an audit trail
Important actions should be traceable. Depending on the system, the audit trail may record who changed a status, when it changed, what the previous value was and why the change occurred.

Audit trails help investigate disputes and repeat errors. They also support accountability when several teams interact with the same order.

### 10. Reconcile orders before closing them
Before an order is considered complete, the relevant records should tell a consistent story: payment, stock, fulfilment, dispatch, delivery and any refund or cancellation should agree.

If the store shows “delivered” but there is no dispatch record, the discrepancy should be investigated rather than ignored.

## Worked Example / Demonstration
A customer orders two pairs of running shoes. The platform creates order #A1048 immediately, but the payment status remains **pending**.

A warehouse employee sees the new order and prepares to pick the shoes. The correct process is to stop and verify the payment status first. Once the payment provider confirms the transaction as paid, the system allocates the exact two variants. The picker checks each SKU, the parcel is packed, courier tracking is attached and only then is the fulfilment status updated to dispatched.

Later, the courier records successful delivery. Customer service can now see a complete timeline from order creation through payment, stock allocation, dispatch and delivery.

If the payment had failed, the parcel would never have entered fulfilment. That single control prevents a direct financial loss.

## Practical Activity
Draw an order-status workflow containing at least ten stages from checkout to completion. For each stage, add:
- one possible error;
- the evidence required before progressing;
- the staff role responsible; and
- the action to take if the process cannot continue.

Then create three exception scenarios: failed payment, unavailable stock and customer cancellation after dispatch. Explain how each should be handled differently.

## Knowledge Check
1. What is the difference between order status, payment status and fulfilment status?
2. Why should an order not be dispatched while payment remains pending?
3. What is stock allocation?
4. Give four examples of order exceptions.
5. Why can cancellation after dispatch require a different process from cancellation before fulfilment?
6. What is an audit trail used for?
7. Why should an order not be marked complete merely to remove it from an open-order list?

## Feedback / Explanation
1. Order status describes the overall transaction, payment status describes money collection and fulfilment status describes preparation and dispatch.
2. Payment has not yet been verified, so dispatch could create a financial loss.
3. Reserving the exact inventory required for a specific order.
4. Examples include failed payment, unavailable stock, incorrect address and suspicious transaction signals.
5. Goods may already be in the delivery process, so a return or interception workflow may be required.
6. It records important actions and changes for traceability and investigation.
7. Status must reflect the real operational event; hiding exceptions weakens controls and customer service.

## Key Takeaways
- An order is a multi-stage operational workflow, not a single checkout event.
- Payment, order and fulfilment statuses must remain distinct.
- Important status changes should be supported by reliable evidence.
- Exact stock variants should be allocated before fulfilment.
- Exceptions must remain visible until properly resolved.
- Customer communication should match the verified order state.
- Audit trails and reconciliation improve accountability and reduce repeat errors.

## Visual Learning Guidance
**Recommended visual:** Order Submitted → Payment Verified → Stock Allocated → Pick → Pack → Dispatch → Tracking → Delivery → Reconciliation → Complete, with an Exception route branching from each stage.

**Caption:** “Reliable order management depends on accurate status transitions supported by evidence at every stage.”