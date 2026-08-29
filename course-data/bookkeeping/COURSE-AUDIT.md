# Professional Certificate in Bookkeeping — Course Audit

## Audit status
**Source build:** COMPLETE  
**Structure audit:** PASSED  
**Assessment audit:** PASSED  
**South African tax/payroll source check:** PASSED for the exact rates and thresholds used in the course  
**Production reconciliation:** APPROVED for controlled in-place deployment that preserves existing learner progress.

## 1. Source structure
The authoritative repository contains 10 modules with 8 lessons each: **80 lessons total**.

Every module contains:
- `lesson-1.md` through `lesson-8.md`
- `formative-assessment.md`
- `summative-assessment-bank.md`

Automated source retrieval confirmed all 80 lesson files and all 20 assessment files are available successfully from the main repository branch.

### Approved module structure
1. Bookkeeping Foundations
2. Source Documents & Transaction Analysis
3. Journals, Ledgers & Trial Balance
4. Cashbooks, Petty Cash & Bank Reconciliation
5. Debtors, Creditors, Invoicing & Credit Control
6. Adjustments & Basic Financial Reporting
7. Computerised Bookkeeping & QuickBooks Fundamentals
8. VAT, Tax Records & SARS Awareness
9. Payroll Administration & Payroll Records
10. Practical Bookkeeping Project

## 2. Lesson quality audit
All 80 lessons contain substantive instructional content. Automated checks found:
- successful source retrieval: 80/80
- minimum lesson size: more than 4,700 characters
- no placeholder or empty lesson files
- modern lesson pattern used throughout: study time, learning outcomes, relevance, teaching content, practical application, knowledge check, feedback, key takeaways and visual guidance.

Six integrative/practical lessons use scenario- or project-led headings instead of the exact `Key Terms` / `Main Lesson Content` labels used by standard theory lessons. Their substantive content remains complete; the variation is intentional and appropriate to practical application rather than a missing-content defect.

## 3. Assessment architecture audit
There are 20 source assessment banks.

### Formative assessments
Every one of the 10 modules contains:
- exactly 32 MCQs
- exactly 4 questions grouped under each of the 8 lesson headings
- 15 questions delivered per learner attempt
- 70% pass standard
- maximum 3 attempts
- answer-position distribution: **A = 8, B = 8, C = 8, D = 8**

Total formative-bank questions: **320**.

### Summative assessments
Every one of the 10 modules contains:
- exactly 52 MCQs
- coverage across the module's eight lessons
- 25 questions delivered per learner attempt
- 70% pass standard
- maximum 3 attempts
- answer-position distribution: **A = 13, B = 13, C = 13, D = 13**

Total summative-bank questions: **520**.

### Course assessment total
**840 protected question-bank questions** are expected after production deployment.

## 4. Assessment quality controls
The assessment review applied these standards:
- one clearly best answer per question
- plausible but incorrect distractors
- correct-answer positions deliberately balanced
- no dependence on learners seeing answer keys
- arithmetic and bookkeeping mechanics aligned with lesson examples
- formative questions remain traceable to specific lessons
- summative questions test both knowledge and applied bookkeeping judgement.

## 5. South African tax and payroll accuracy check
High-risk current figures were rechecked against current SARS material during the final audit.

### VAT
The course correctly uses:
- standard VAT rate: **15%**
- from 1 April 2026, general compulsory VAT registration threshold: taxable supplies exceeding **R2.3 million per annum**
- from 1 April 2026, general voluntary-registration threshold: **R120,000**, subject to applicable conditions and exceptions.

The VAT tax-invoice lesson is aligned to the SARS VAT 404 framework used in the course, including the R5,000 full/abridged invoice boundary and the required-document-information principle. Learners are instructed to use current SARS guidance for live transactions rather than treating course examples as personalised tax advice.

### Payroll
The payroll course material correctly teaches:
- PAYE uses current SARS deduction tables/rules rather than a flat percentage
- ordinary UIF contributions: **1% employee + 1% employer**, subject to applicable UIF rules
- current SARS-published UIF remuneration ceiling used in the course: **R17,712 per month / R212,544 annually**, giving a maximum ordinary 1% employee contribution of **R177.12 per month** at that ceiling
- SDL is generally **1% of leviable remuneration** for liable employers
- current general SDL non-registration/exemption threshold referenced in the course: **R500,000** over the applicable 12-month remuneration test, subject to the statutory exemptions and rules
- EMP201 figures should reconcile to payroll registers and ledger controls.

The course expressly requires current official guidance to be checked in live practice because tax rules, rates and thresholds can change.

## 6. Bookkeeping mechanics and calculation review
Worked examples use double-entry consistently and reinforce these controls:
- total debits equal total credits
- customer receipts settle receivables rather than recreating sales
- supplier payments settle payables rather than recreating expenses
- bank reconciliation separates timing differences from actual errors
- debtors and creditors control accounts reconcile to subsidiary records
- period-end adjustments require evidence and authority
- an agreeing trial balance does not prove every classification is correct
- reporting balances trace back to adjusted trial balance and supporting schedules.

The Module 10 capstone uses internally consistent opening-balance, reconciliation, depreciation and profit calculations and teaches learners not to create unexplained balancing journals.

## 7. Production safety preflight
The live Bookkeeping course currently has:
- course ID: `fcbe0c39-c31f-4a39-833f-7b89d553bef2`
- 10 existing module records
- 80 existing lesson records
- 1 approved enrolment
- 1 existing completed lesson-progress row
- 1 legacy published final course assessment
- 0 assessment attempts for the legacy assessment.

The existing progress row is linked to **Module 1, Lesson 1** lesson ID:
`416dd8ef-dc15-472e-ad0b-74f4db053b39`

This lesson ID must remain unchanged during deployment.

## 8. Required production reconciliation method
Because learner progress already exists, production deployment must **not delete and recreate lessons**.

The approved method is:
1. preserve the existing course ID;
2. preserve all 10 existing module IDs;
3. update module names/descriptions to the approved structure;
4. update each of the 80 existing lesson rows **in place** by module number + lesson number, preserving every lesson ID;
5. archive/deactivate the superseded legacy final assessment;
6. create 10 formative and 10 summative module assessments;
7. load exactly 320 formative + 520 summative = **840** protected questions;
8. use the existing secure database-driven module assessment runtime;
9. retain direct answer-key protection for learners;
10. verify the existing enrolment and completed progress row after deployment;
11. run final module, lesson, assessment, question, progress and runtime checks before declaring the course live-ready.

## 9. Audit conclusion
The Bookkeeping repository source is approved for controlled production deployment. No further drafting is required before reconciliation. The key production constraint is preservation of the existing lesson identifiers and learner-progress relationship while replacing legacy lesson content in place.
