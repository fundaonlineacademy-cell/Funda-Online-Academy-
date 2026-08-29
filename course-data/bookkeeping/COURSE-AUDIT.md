# Professional Certificate in Bookkeeping — Course Audit

## Audit status
**Source build:** COMPLETE  
**Structure audit:** PASSED  
**Assessment audit:** PASSED  
**South African tax/payroll source check:** PASSED for the exact rates and thresholds used in the course  
**Production reconciliation:** COMPLETE  
**Post-deployment integrity checks:** PASSED

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
All 80 lessons contain substantive instructional content. Automated source checks found:
- successful source retrieval: 80/80
- minimum source lesson size: more than 4,700 characters
- no placeholder or empty lesson files
- modern lesson pattern used throughout: study time, learning outcomes, relevance, teaching content, practical application, knowledge check, feedback, key takeaways and visual guidance.

Six integrative/practical lessons use scenario- or project-led headings instead of the exact `Key Terms` / `Main Lesson Content` labels used by standard theory lessons. Their substantive content remains complete; the variation is intentional and appropriate to practical application rather than a missing-content defect.

After production conversion, all 80 lessons contain formatted HTML, no repository title-heading leakage, no missing titles and no short placeholder content. Production lesson HTML ranges from more than 5,100 characters to more than 10,500 characters.

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
Production contains **840 protected assessment-bank questions**.

## 4. Assessment quality controls
The assessment review applied these standards:
- one clearly best answer per question
- plausible but incorrect distractors
- correct-answer positions deliberately balanced
- no dependence on learners seeing answer keys
- arithmetic and bookkeeping mechanics aligned with lesson examples
- formative questions remain traceable to specific lessons
- summative questions test both knowledge and applied bookkeeping judgement.

Post-deployment database checks confirmed every module retained the exact source-bank counts and answer-key balance:
- formative: 32 questions, A/B/C/D = 8/8/8/8
- summative: 52 questions, A/B/C/D = 13/13/13/13.

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

## 7. Production safety preflight and learner-progress preservation
Before deployment, the live Bookkeeping course had:
- course ID: `fcbe0c39-c31f-4a39-833f-7b89d553bef2`
- 10 existing module records
- 80 existing lesson records
- 1 approved enrolment
- 1 existing completed lesson-progress row
- 1 legacy published final course assessment
- 0 assessment attempts.

The existing progress row was linked to Module 1, Lesson 1 lesson ID:
`416dd8ef-dc15-472e-ad0b-74f4db053b39`

Production deployment updated all lessons **in place** and did not delete/recreate lesson rows. After deployment, the same progress row remains completed against the same lesson ID, now titled `The Role of Bookkeeping in a Business`.

## 8. Production deployment result
Controlled production reconciliation is complete.

Final live state:
- **10 modules**
- **80 lessons**
- **20 active published module assessments**
- **840 protected assessment-bank questions**
- **1 archived legacy final assessment**
- **1 approved enrolment preserved**
- **1 completed lesson-progress row preserved**
- **0 unintended assessment attempts**.

The legacy `Final Course Assessment` was renamed and deactivated as `Legacy Final Course Assessment (Archived)`.

The secure generic module-assessment runtime is reused. Direct learner access to `assessment_questions` remains protected by the existing admin-only RLS policy.

## 9. Runtime acceptance check
An authenticated-style runtime check was performed using the enrolled learner context for Module 1 Formative.

Result:
- status: `locked_lessons`
- total lessons: 8
- completed lessons: 1
- no attempt consumed.

This confirms that the deployed Bookkeeping course correctly recognises the preserved learner progress and applies the prerequisite that all eight module lessons must be completed before the formative assessment opens.

## 10. Cleanup
Temporary HTTP/Markdown/assessment parsing helpers used for source validation and deployment were removed after successful verification. No temporary deployment helper remains as part of the permanent course runtime.

## 11. Final conclusion
The Professional Certificate in Bookkeeping is fully rebuilt, audited, reconciled to production and integrity-checked. The authoritative source is retained in GitHub, the production database now reflects the approved 10-module/80-lesson structure, assessment security and answer-bank architecture are intact, and the pre-existing learner enrolment and completed lesson progress were preserved.
