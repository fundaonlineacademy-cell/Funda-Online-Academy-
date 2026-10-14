-- Remove exact prompt reuse from the Bookkeeping formal assessment banks.

begin;

create temporary table _bookkeeping_prompt_fix (
  module_number integer not null,
  assessment_kind text not null,
  question_number integer not null,
  question_text text not null,
  primary key (module_number, assessment_kind, question_number)
) on commit drop;

insert into _bookkeeping_prompt_fix values
(1, 'summative', 43, 'A bookkeeper needs a consistent ledger code for every transaction category. Which structure provides that organised account list?'),
(2, 'summative', 7, 'A business issues a R12,000 sales invoice on credit. Which balance normally increases before payment is received?'),
(2, 'summative', 13, 'A valid supplier invoice for office supplies is accepted on credit. Which balances normally increase at capture?'),
(3, 'summative', 2, 'An authorised non-routine correction cannot be entered through the routine sales, purchases or cash journals. Which journal is most appropriate?'),
(3, 'summative', 7, 'Which record serves as the main collection of accounts in which transaction effects accumulate?'),
(3, 'summative', 9, 'Office equipment is acquired. Which listed account normally increases with a debit?'),
(3, 'summative', 13, 'A journal entry is transferred into the affected ledger accounts. What process is taking place?'),
(3, 'summative', 23, 'Which document lists ledger balances to test debit-credit arithmetic agreement before further reporting?'),
(3, 'summative', 29, 'An amount of 63 is entered as 36. Which error has occurred?'),
(3, 'summative', 35, 'Which account summarises detailed subsidiary records in the general ledger?'),
(4, 'summative', 1, 'Which record is used to capture bank and cash receipts and payments systematically?'),
(4, 'summative', 2, 'A R5,000 debtor receipt appears in the bank. Which entry reduces the customer balance?'),
(4, 'summative', 21, 'After valid bank charges and corrections are posted, what is the resulting book balance called?'),
(4, 'summative', 23, 'The cashbook includes a receipt not yet shown by the bank. How is it classified?'),
(4, 'summative', 29, 'During reconciliation, a transaction appears in only one record and no counterpart is confirmed. What is it?'),
(5, 'formative', 24, 'Separating payment preparation, approval and release primarily reduces which risk?'),
(5, 'summative', 9, 'Which document bills a customer for goods or services already supplied?'),
(5, 'summative', 11, 'A customer returns goods previously sold on credit and the reduction is approved. Which document records the reduction of the customer’s balance?'),
(5, 'summative', 16, 'A customer payment is matched to the correct account and invoice. What process is this?'),
(5, 'summative', 22, 'At month end, which purpose is served by comparing a supplier statement with the creditor account?'),
(5, 'summative', 27, 'Which balances are compared when reconciling Debtors Control?'),
(5, 'summative', 28, 'Which report groups unpaid customer balances by how long they have been outstanding?'),
(5, 'summative', 31, 'A customer account shows an unexplained credit. What should happen before any refund or reallocation?'),
(5, 'summative', 38, 'Before contacting overdue customers, which information should collection follow-up rely on?'),
(5, 'summative', 49, 'Approved supplier credit notes are on the account before a payment run. Why must they be processed before the payment amount is finalised?'),
(6, 'formative', 3, 'A June expense is invoiced only in July. Which period-end adjustment may be required for June?'),
(6, 'formative', 31, 'Which measure equals current assets minus current liabilities?'),
(6, 'summative', 6, 'An expense belongs to the current period but has not yet been recorded or paid. What is it?'),
(6, 'summative', 7, 'A payment made now secures a benefit in a future reporting period. What is the future portion?'),
(6, 'summative', 15, 'Which balance represents the total depreciation recognised on an asset up to the reporting date?'),
(6, 'summative', 21, 'Which estimate reduces receivables for expected collection losses under the entity’s policy?'),
(6, 'summative', 25, 'After approved period-end adjustments are posted, which trial-balance version is prepared?'),
(6, 'summative', 39, 'Which equality expresses the relationship among assets, liabilities and equity?'),
(6, 'summative', 41, 'Which listed item represents an amount the business owes?'),
(6, 'summative', 45, 'A reported amount differs from the prior period or expectation. What is the difference called?'),
(6, 'summative', 47, 'Current assets are R200,000 and current liabilities are R150,000. Which formula identifies the R50,000 measure?'),
(7, 'formative', 22, 'Which entry is used to cancel the accounting effect of an earlier posting?'),
(7, 'summative', 2, 'Customers, suppliers and ledger accounts are examples of which core system records or settings?'),
(7, 'summative', 4, 'Which record history lets a reviewer trace transactions and later changes?'),
(7, 'summative', 14, 'Before live processing, the total opening customer schedule should agree with which balance?'),
(7, 'summative', 31, 'An incorrect prior posting must be cancelled with an opposite accounting entry. What is that entry?'),
(8, 'summative', 2, 'A VAT vendor charges VAT on taxable sales. What is that VAT called?'),
(8, 'summative', 1, 'A vendor makes a standard-rated supply in October 2026. Which VAT rate should be used before considering any special treatment?'),
(8, 'summative', 4, 'How should zero-rated and exempt supplies be understood for VAT classification?'),
(8, 'summative', 8, 'An invoice’s VAT treatment cannot be resolved from the available evidence. What should the bookkeeper do?'),
(8, 'summative', 26, 'Which declaration does a VAT vendor submit for a tax period?'),
(8, 'summative', 36, 'Which income-tax mechanism uses advance payments based on estimated taxable income?'),
(9, 'summative', 5, 'Which payroll amount represents total earnings before authorised deductions?'),
(10, 'formative', 26, 'Which report presents income, expenses and the resulting profit or loss for a period?'),
(10, 'summative', 5, 'Which structure supports consistent classification and reporting of transactions?'),
(10, 'summative', 22, 'At year-end, what is the portion of a payment that relates to a future period called?'),
(10, 'summative', 35, 'A reconciliation difference recurs every month. What term describes the underlying reason it keeps happening?');

do $$
declare
  matched_count integer;
begin
  select count(*) into matched_count
  from _bookkeeping_prompt_fix f
  join public.course_modules m
    on m.course_id = 'fcbe0c39-c31f-4a39-833f-7b89d553bef2'::uuid
   and m.module_number = f.module_number
  join public.assessments a
    on a.course_id = m.course_id
   and a.module_id = m.id
   and a.active is true
   and a.status = 'published'
   and lower(a.title) like '%' || f.assessment_kind || '%'
  join public.assessment_questions q
    on q.assessment_id = a.id
   and q.question_number = f.question_number;

  if matched_count <> 52 then
    raise exception 'Bookkeeping prompt guard failed: matched %, expected 52', matched_count;
  end if;
end $$;

update public.assessment_questions q
set question_text = f.question_text
from _bookkeeping_prompt_fix f
join public.course_modules m
  on m.course_id = 'fcbe0c39-c31f-4a39-833f-7b89d553bef2'::uuid
 and m.module_number = f.module_number
join public.assessments a
  on a.course_id = m.course_id
 and a.module_id = m.id
 and a.active is true
 and a.status = 'published'
 and lower(a.title) like '%' || f.assessment_kind || '%'
where q.assessment_id = a.id
  and q.question_number = f.question_number;

commit;
