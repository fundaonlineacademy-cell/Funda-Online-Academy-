# PCA QA Preview Load Hotfix

Date: 11 October 2026

## Issue
The internal QA PCA page could stop loading after the QA Save/Submit preview helper was added.

## Root cause
The helper observed `disabled` and `data-locked` changes across the whole PCA shell and, inside the observer callback, changed those same attributes again. That could continuously retrigger the observer and block the browser main thread.

## Fix
- Remove the broad subtree MutationObserver.
- Observe only the QA preview notice becoming visible.
- Keep two bounded fallback checks after page load.
- Update button attributes only when their values actually need to change.
- Bump the helper script cache version so mobile browsers receive the corrected file.

## Protection
The real learner PCA workflow, storage, submission rules, assessment scoring, payments, enrolments, results and certificates are unchanged.