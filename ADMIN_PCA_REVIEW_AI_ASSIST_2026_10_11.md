# FOA Admin PCA Assessment & Verification

Date: 11 October 2026
Status: Implementation branch — pending owner physical review and merge
Scope owner: Funda Online Academy CEO

## Owner-approved workflow

The Practical Competence Assessment (PCA) AI assistance belongs on the Admin side under Academic, Assessments & Content. It must not run as a learner-facing grading tool.

Approved sequence:

1. Learner submits PCA evidence.
2. Submission status becomes `submitted` and learner evidence is locked.
3. Authorised Admin/assessor opens the PCA Review Queue.
4. Admin may click **Run AI Pre-Assessment**.
5. The AI receives the exact course-specific PCA task, evidence requirements, rubric, critical-criterion rule and submitted evidence.
6. The AI produces a private advisory pre-assessment: evidence relevance/coverage, criterion suggestions, possible weighted score, critical-criterion concerns and flags.
7. The authorised human assessor opens the evidence, accepts/changes/rejects the AI suggestions and completes every rubric criterion.
8. **Save Human Review** records the assessor work but does not release an outcome to the learner.
9. **Verify & Finalise** calculates the authoritative PCA result from the human-saved rubric only.
10. Only after human finalisation does the PCA become `competent`, `not_yet_competent`, or `final_not_yet_competent`.
11. Where permitted, Admin may separately authorise the one structured resubmission.

## Human-control rule

AI is advisory only. It cannot directly change `pca_submissions.status`, `rubric_score`, `critical_criteria_met`, learner feedback, course completion, results or certificates. The final outcome is derived server-side from the human assessor's saved criterion levels using the approved course rubric.

The Admin interface must display AI output as **AI SUGGESTION — NOT FINAL**.

## Course-specific assessment

The AI does not use one generic PCA rule. For each submission it loads that course's current `course_end_requirements.pca_task_config`, including:

- purpose and task instructions;
- required components;
- evidence requirements;
- assessment criteria and weights;
- Level 0–4 rubric scale;
- critical criteria and minimum critical level;
- safety/access requirements where configured.

This is required so, for example, Bookkeeping evidence is reviewed against the Bookkeeping PCA while Baking evidence is reviewed against the Baking PCA.

## Evidence handling

PCA evidence remains in the private `pca-evidence` storage bucket. The Admin assessor opens evidence through short-lived signed URLs.

The AI service also uses short-lived signed URLs and `store:false` for OpenAI Responses requests. Supported automatic evidence review in v1:

- JPG / JPEG
- PNG
- WEBP
- PDF
- DOCX
- XLSX
- PPTX
- TXT

MP4/video and any unsupported/unreadable evidence are explicitly flagged for manual review rather than treated as assessed.

## Scoring and finalisation

The human assessor must score every current course criterion from Level 0 to Level 4. The server reloads the authoritative rubric from the course configuration and calculates the weighted score itself.

Competent requires:

- overall weighted score at or above the configured PCA minimum (normally 60%); and
- every critical criterion meeting the configured minimum level (currently Level 3).

If either condition fails, the first permitted attempt is `not_yet_competent`; after the final permitted attempt the outcome is `final_not_yet_competent`.

## Security controls

- Admin PCA RPCs are `SECURITY DEFINER` but also perform `is_admin()` checks.
- RPC execution is granted to `authenticated` and explicitly revoked from `anon`.
- AI/review tables use RLS and expose Admin SELECT only.
- AI pre-assessment records are database-bound to the same PCA submission before they can be referenced by a human review.
- Learners cannot read the private AI pre-assessment or Admin review records.
- Existing learner evidence/storage controls are unchanged.
- Existing payment, enrolment, Formative/Summative scoring, results and certificate logic is unchanged by this Admin feature.

## Shared Admin regression boundaries

The only change to `admin-v2.html` is one additional isolated script include for the PCA review workspace. Existing script order and logic for Ambassador operations, IT/Security, Finance, Student Support, Marketing, Communication and other Admin departments remain unchanged.

The PCA workspace uses manual Refresh only and introduces no polling or automatic refresh into Academic, Assessments & Content.

## Current limitations / test status

- There are currently zero real PCA submissions, so a full evidence-to-AI-to-human-finalisation production test cannot yet be completed with real learner evidence.
- The deployed Edge Function fails safely to manual assessment if `OPENAI_API_KEY` is not configured. Environment secret presence cannot be inspected through the available management interface and must be confirmed by an authorised runtime test.
- No PCA course task has been activated for ordinary learners by this work.
- The Admin UI remains on the dedicated feature branch until owner review and explicit merge approval.
