# PCA QA Preview Load Hotfix

Date: 11 October 2026

## Issue
The internal QA PCA page could stop loading after the QA Save/Submit preview helper was added.

## Root cause
The helper observed `disabled` and `data-locked` changes across the whole PCA shell and, inside the observer callback, changed those same attributes again. This could continuously retrigger the observer and block the browser main thread.

## Fix
- Removed the broad subtree MutationObserver.
- Observe only the QA preview notice becoming visible, then disconnect that observer.
- Keep only two bounded fallback checks after page load.
- Update button attributes only when their values actually need to change.

## Protection
The real learner PCA workflow, storage, submission rules, assessment scoring, payments, enrolments, results and certificates are unchanged.