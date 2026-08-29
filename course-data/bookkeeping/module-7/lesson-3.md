# Professional Certificate in Bookkeeping
## Module 7: Computerised Bookkeeping & QuickBooks Fundamentals
### Lesson 3: Customers, Suppliers and Opening Information

**Estimated study time:** 45–50 minutes

## Learning Outcomes
By the end of this lesson, you should be able to:
1. Set up customer and supplier master records accurately.
2. Identify essential versus unnecessary master-data fields.
3. Load opening debtor and creditor information from reconciled sources.
4. Prevent duplicate and incorrect master records.
5. Apply access, confidentiality and change-control practices to master data.

## Why This Lesson Matters
Customer and supplier master records drive invoices, statements, payments and reporting. A duplicate supplier or wrong customer opening balance can create errors that remain hidden across many later transactions.

## Key Terms
- **Master record** — Core system record for a customer, supplier or other recurring entity.
- **Opening receivable** — Amount a customer already owes when the new system begins.
- **Opening payable** — Amount already owed to a supplier at migration date.
- **Duplicate master** — More than one system record representing the same customer or supplier.
- **Master-data change** — Update to core details such as name, contact or banking information.

## Main Lesson Content
### 1. Use verified identity information
Capture legal/trading name, contact information, addresses, payment terms and approved tax information as required by the organisation.

### 2. Avoid unnecessary personal information
Only capture information needed for the legitimate bookkeeping and business process. Master data should not become a collection point for irrelevant private details.

### 3. Search before creating
Before adding a supplier, search by name, registration/tax identifiers where appropriate, contact details and existing account codes. Duplicate supplier accounts can enable duplicate invoice capture or split statement history.

### 4. Opening debtor balances
Opening customer balances should agree to the reconciled Debtors Control and customer-ageing schedule at migration date. Where invoice-level detail is required, load or preserve it carefully so later receipts can be allocated correctly.

### 5. Opening creditor balances
Supplier openings should agree to Creditors Control and supplier reconciliations. Missing credits or invoices should be resolved before migration if practical.

### 6. Banking details
Supplier bank details are high-risk master data. New or changed banking details should use independent verification and authorised change procedures.

### 7. Terms and limits
Customer payment terms and credit limits affect collections and exception reporting. Do not alter them without the relevant authority.

### 8. Master-data access
Limit who can create and change customers/suppliers. Systems that log changes provide a valuable audit trail.

### 9. Opening-balance audit
After migration, compare:
- total customer balances to Debtors Control;
- total supplier balances to Creditors Control;
- ageing totals to source schedules;
- selected individual balances to original records.

## Worked Example
The old system shows Supplier ABC balance R18,000. During migration, two supplier records are created accidentally—`ABC Supplies` and `ABC (Pty) Ltd`—and the opening balance is loaded to one while a new invoice is captured to the other. The creditor total may still be mathematically correct, but supplier reconciliation becomes fragmented. The duplicate should be resolved through the software's controlled merge/correction process if supported.

## Practical Activity
Create a customer/supplier migration checklist including identity, duplicate search, terms, opening balance, invoice detail, bank-detail verification, user access and post-load reconciliation.

## Knowledge Check
1. What is a master record?
2. Why should duplicate supplier records be avoided?
3. What should customer opening balances reconcile to?
4. Why may invoice-level opening detail matter?
5. How should supplier bank-detail changes be controlled?
6. Who should change customer credit limits?
7. Why restrict master-data access?
8. What should be reconciled after migration?

## Feedback / Explanation
1. Core recurring entity information used by the system.
2. Duplicates fragment history and increase duplicate-payment/capture risk.
3. Debtors Control and the approved customer schedule.
4. Future receipts may need allocation to specific open invoices.
5. Independent verification and authorised change procedure.
6. The authorised credit/management role.
7. Master changes can redirect transactions and payments.
8. Customer/supplier totals, control accounts, ageing and selected balances.

## Key Takeaways
- Accurate master data protects every later transaction.
- Opening balances must come from reconciled records.
- Duplicate masters weaken control.
- Banking and credit-limit changes require authority.
- Migration is complete only after post-load reconciliation.

## Visual Learning Guidance
**Recommended visual:** Verify Entity → Search Duplicate → Create Master → Load Reconciled Opening → Set Controls → Post-load Reconcile

**Caption:** “Clean master data keeps computerised debtor and creditor records trustworthy.”