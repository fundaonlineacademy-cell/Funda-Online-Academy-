# Funda Online Academy — PCA Evidence Submission Workflow

Date: 11 October 2026  
Owner authority: Aziwe Futhe — Business Owner & CEO

## Purpose

This controlled workflow enables learners to upload and submit PCA evidence securely after the required final Summative Assessment has been passed and after the course-specific PCA task has been academically approved and activated.

## Learner workflow

1. Open the PCA in the final module.
2. Review the task brief, evidence requirements, safety controls and rubric.
3. Upload required evidence files.
4. Add optional evidence notes linking files to task components.
5. Save the PCA as a draft and return later if needed.
6. Confirm the learner declaration.
7. Submit the PCA for assessment.
8. Submitted evidence becomes read-only unless a structured resubmission is authorised.

## Supported evidence

The private `pca-evidence` storage bucket supports JPG, PNG, WEBP, PDF, DOCX, XLSX, PPTX, TXT and MP4 files. The storage limit is 50 MB per file. The learner interface limits one PCA submission to 20 attached files.

## Security and access

- The storage bucket is private.
- Learner paths are scoped to `user_id/course_id/submission_id/file`.
- A learner can upload, replace or remove evidence only while the related PCA submission is in Draft status.
- Learners can read only their own PCA evidence.
- Admin users can manage PCA evidence for assessment/administration purposes.
- On final submission the server verifies that every evidence path exists in the private PCA bucket and belongs to the learner/course/submission.
- Formal PCA submission is server-controlled and requires the learner declaration.

## Save Draft and final submission

`prepare_pca_submission(course_id)` creates or reopens the correct draft attempt only when the learner is eligible. It respects the approved one-resubmission rule and does not create a second attempt unless a resubmission has been formally authorised.

`submit_pca_submission(submission_id)` verifies the learner, Draft status, active PCA task, learner declaration and stored evidence before changing the attempt to Submitted.

## Internal QA account

The approved internal QA account can inspect the full PCA task and test local file selection. QA preview does not create a PCA submission, upload a learner file or record a Course Evaluation. This preserves the account as an inspection tool rather than producing false learner evidence.

## Regression scope

The implementation is limited to the PCA evidence workspace and its private evidence storage controls. It does not alter payment, enrolment, existing formal assessment scoring, results, certificates, login, Ambassador or public-course runtime files.

## Protection

This workflow does not activate any draft PCA task. Course-specific PCA activation remains separately controlled by academic QA and lesson-alignment approval. Existing lessons, Knowledge Checks, Formative/Summative assessment logic, payments, results and certificates are outside this change.
