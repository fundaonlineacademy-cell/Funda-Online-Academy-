# Bookkeeping Course Academic Content Lock — 2026-10-06

**Status:** LOCKED / BASELINED  
**Authority:** Owner/CEO direction during academic QA and housekeeping  
**Academic standard:** FOA-ACA-STD-001 v1.0  
**Course:** Bookkeeping & Financial Administration — Professional Short Course  
**Course ID:** `fcbe0c39-c31f-4a39-833f-7b89d553bef2`

## Lock scope

This document records the approved academic-content baseline for the Bookkeeping & Financial Administration course after course-wide housekeeping.

The baseline covers:

- 10 course modules;
- 80 lessons;
- learner-facing course and module academic metadata;
- the approved staged lesson architecture and learner workspace behavior;
- lesson-level informal Knowledge Checks;
- the approved normal student progression and formal-assessment gating behavior.

Future changes to this academic baseline require explicit owner reopening/change instruction, scoped implementation, verification, and an updated lock record.

## Housekeeping baseline

Database verification completed on 2026-10-06 confirmed:

- 80 lessons present across 10 modules;
- every lesson has exactly 5 staged Main Lesson Content sections;
- lesson overview, outcomes, Key Terms & Concepts glossary, worked example, workplace case, practical activity, Knowledge Check and summary are present;
- all 80 Knowledge Checks use JSON v1 structure with 5 questions per lesson, 4 options per question, valid answer indexes and feedback;
- retired lesson `content` field is blank across the course;
- lesson `assessment_guidance` is blank across the course;
- illustration URL/caption/source metadata is cleared across the course;
- no learner-facing `Professional Certificate in Bookkeeping` legacy wording remains in course/module/lesson academic content;
- no old `Visual Learning Guidance` or old `Estimated study time` blocks remain in lesson content;
- module descriptions and learning outcomes are aligned to the current Professional Short Course structure;
- course-level description, outcomes, study plan, practical projects, materials, certificate wording, assessment wording and career-application wording were aligned to the current 14-week course and approved academic position.

## Approved lesson workspace behavior

The current `course-study.js` implementation was rechecked as part of this lock. It:

- parses `<!--stage:...-->` markers into staged Main Lesson Content;
- renders Lesson Overview/Learning Outcomes, Key Terms & Concepts, staged teaching, Worked Example, Workplace Scenario/Case Study, Practical Activity, Knowledge Check and Lesson Summary;
- treats the Knowledge Check as an informal self-check that does not form part of the formal result and does not block progress;
- provides immediate Knowledge Check feedback and retry behavior;
- writes lesson completion through `lesson_progress` when the learner selects **Finish Lesson**;
- keeps normal module progression locked until the previous module summative assessment has been passed.

The current `module-assessment.js` implementation was also rechecked. Formal assessment state is obtained through authenticated database RPCs and enforces lesson completion and formative-before-summative gating for ordinary learners.

The authorised Internal QA account remains a separate test-only exception used for physical review. It must not create false academic progression or certificate claims.

## Formal assessment-bank scope

Each of the 10 modules currently has:

- one active, published 32-question formative bank; and
- one active, published 52-question summative bank.

These banks were not rewritten during this course-wide housekeeping. Their existence, publication state and question counts were verified. **This academic-content lock does not claim that every formal assessment question has completed the separate full academic question-bank audit.** That remains a separate controlled scope when requested.

## Intentional technical alias retained

The live technical slug remains:

`professional-certificate-in-bookkeeping`

It is retained only for existing route/link stability. It is not the learner-facing academic title and must not be treated as a credential claim. Any future slug change must be handled as a separate route/redirect/link migration so existing links are not broken.

## Change control

The course is now treated as an approved academic baseline. Do not alter its lesson/content baseline as part of unrelated work.

A future Bookkeeping academic change should require:

1. explicit owner instruction to reopen the affected scope;
2. the smallest scoped content/code change required;
3. academic and structural verification of the changed scope;
4. confirmation that ordinary progression, assessments and learner records remain protected; and
5. an updated QA/lock record.

## Systems not changed by this lock

This course housekeeping and lock did not change payment rules, admin-dashboard behavior, platform security configuration, RLS policy design, public-site launch configuration or unrelated courses.

## QA record

Database QA/lock record: `7f0dcdd5-e29a-412d-b3da-b1aab6690fad`

**Final baseline status:** LOCKED / CLEAN / APPROVED FOR CONTINUED USE
