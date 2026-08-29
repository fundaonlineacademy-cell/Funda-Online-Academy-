# Office Administration Certificate: From Admin to PA — Source Audit

## Audit status
**Source build:** COMPLETE  
**Audit stage:** COMPLETE for structure, assessment architecture, answer-position balance, and high-risk legal/privacy scope.  
**Production reconciliation:** READY, subject to controlled database replacement that preserves the existing enrolment record.

## 1. Course structure
The approved rebuild contains eight modules with eight lessons each (64 lessons total):

1. Office Administration Foundations
2. Professional Communication
3. Documents, Filing & Records
4. Customer & Office Front Desk
5. Diaries, Meetings & Travel
6. Personal Assistant Skills
7. Office Technology, Information & Confidentiality
8. Practical Admin-to-PA Project

Each module source directory contains:
- `lesson-1.md` through `lesson-8.md`
- `formative-assessment.md`
- `summative-assessment-bank.md`

The previous live database structure has 10 lesson records per module and is treated as legacy material to be replaced only during controlled production reconciliation.

## 2. Lesson quality standard
The rebuilt lessons use the agreed modern course pattern, including as appropriate:
- estimated study time
- learning outcomes
- lesson relevance / why the lesson matters
- key terms
- structured teaching content
- practical or workplace examples
- practical activity
- knowledge check
- feedback / explanations
- key takeaways
- visual learning guidance

Lesson depth varies according to subject complexity rather than artificial padding. Narrower topics are kept concise while complex operational topics receive deeper treatment.

## 3. Assessment architecture
Every module contains two assessment banks:

### Formative
- 32 MCQs per module
- 4 questions traceable to each of the 8 lessons
- 15 questions delivered per attempt
- 70% pass standard
- maximum 3 attempts

### Summative
- 52 MCQs per module
- coverage across all 8 lessons
- 25 questions delivered per attempt
- 70% pass standard
- maximum 3 attempts

Course totals after deployment should therefore be:
- 8 formative assessments
- 8 summative assessments
- 256 formative-bank questions
- 416 summative-bank questions
- 672 protected assessment-bank questions in total

## 4. Assessment answer-position audit
A systematic answer-key audit identified over-concentration of correct answers in option A in several banks. This was corrected without changing the underlying correct response.

### Summative banks
All 8 module summative banks are now balanced to:
- A = 13
- B = 13
- C = 13
- D = 13

### Formative banks
All 8 module formative banks are now balanced to:
- A = 8
- B = 8
- C = 8
- D = 8

Modules 1–4 were already balanced on inspection. Modules 5–8 were corrected where necessary.

## 5. Question-quality checks
The assessment review applied these controls:
- one clearly best answer
- distractors remain plausible but incorrect
- answer position does not reveal a predictable pattern across the bank
- no change to the factual meaning of the correct answer during rebalancing
- wording remains aligned to lesson content and workplace application
- questions avoid requiring unsupported legal conclusions

## 6. South African relevance and legal/privacy scope
The course uses South African workplace context where relevant, including rand-denominated examples.

Module 7 Lesson 7 covers POPIA at workplace-awareness level. It correctly teaches administrators to recognise personal information, use authorised processes, limit unnecessary collection/access, protect physical and digital records, and escalate privacy incidents or complex requests through the organisation's authorised privacy/compliance function. The lesson explicitly avoids presenting itself as individual legal advice.

The course intentionally avoids inventing universal legal retention periods because actual retention requirements depend on record type, applicable law, organisational policy, legal holds and other context.

## 7. Production safety inspection
Before replacing the legacy live course, the production database was checked.

Current live Office Administration state at the time of this audit:
- 8 modules
- 80 legacy lesson records (10 per module)
- 1 enrolment
- 0 lesson-progress rows for this course
- 1 legacy assessment
- 0 assessment attempts

This means the rebuild can be reconciled without destroying learner lesson progress or assessment attempts because none currently exist for this course. The existing course enrolment must be preserved.

## 8. Production reconciliation requirements
The production deployment must:
1. preserve the existing course and enrolment identifiers where practical;
2. replace the 80 legacy lesson records with the approved 64-lesson source structure;
3. update module names/content to the approved eight-module structure;
4. create 16 active module assessments (formative + summative for each module);
5. load exactly 672 protected assessment-bank questions;
6. archive or deactivate the superseded legacy assessment rather than presenting it to learners;
7. use the generic secure database-driven assessment runtime already established for module assessments;
8. keep correct answers inaccessible through direct learner SELECT access;
9. run post-deployment counts and integrity checks before declaring the course live-ready.

## 9. Audit conclusion
The repository source is approved for controlled production reconciliation. The remaining work is deployment and post-deployment verification, not further course drafting.
