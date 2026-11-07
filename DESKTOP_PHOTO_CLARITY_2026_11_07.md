# Desktop course-photo clarity — 7 November 2026

## Scope

Owner request: improve desktop picture clarity while preserving the current photographs, approved framing, full-width fit, card dimensions, mobile presentation and multiple-course selection.

Allowed surfaces: the photo renderer in `onboarding-course-browser.js`, its cache reference in `onboarding.html`, this record and the focused entry in `FOA_APPROVED_STATE.md`.

Out of scope: replacement/generated photographs, changed image assets or catalogue URLs, layout changes, new crops, selection/totals/drafts, authentication, registration, payment rules, other pages and production data.

Regression checks: identical card/band geometry and framing; original image URLs and alternative text; desktop source loading, resizing and fallback; unchanged phone/tablet rendering; search, pagination, multiple selections and totals, Continue/Back. Browser checks use the existing disposable public-catalogue fixture, with no production account, application or payment writes.

## Rendering

On desktop only (at least 1024 CSS pixels), draw the original photo directly into a canvas sized for the displayed band and screen pixel density. Use the existing exact source frame in one high-quality downsample, followed by a small luminance-only detail correction (thresholded, at most seven levels out of 255). The original image remains in place with its unchanged URL, alternative text and lazy loading. Display the decorative canvas only after successful rendering. Unsupported canvas/readback or cross-origin restrictions keep the original image rendering available.

Phones/tablets keep the approved image CSS, without a visible canvas. A single viewport-resize handler redraws only the current page's photos; no polling, MutationObserver, additional script or dependency is added. The accepted portrait-to-wide-band geometry still limits how much tiny facial detail fits into a 96px-high picture.

## Verification

- Compared the existing CSS scaling, positioning without a transform, direct high-quality sampling and the bounded final-size correction in a local browser. The chosen rendering retains the existing frame; the visible improvement is modest, not a new photograph or a promise to recover unavailable detail.
- Browser geometry comparison against live baseline `3f5f8e9c429be937a676cba6fdc692259ee5eb38` passed at 1280, 1024, 1023, 768, 390 and 320px. Card dimensions, columns, original-image styles/source frames and 96px image bands match exactly, with no horizontal page overflow. Initial mobile loading creates no canvases; moving from desktop to mobile hides them. Returning to desktop redraws at the new dimensions.
- All 35 current photos rendered across the unchanged 10/10/10/5 pages. Search/clear, two-course selection (R3,900 + R1,950 = R5,850), removal/reselection, search/page persistence, saved-selection restoration and Continue to Student Type/Back passed in the isolated preview. No production account, application or payment was created.
- With canvas unavailable, the original ten images remain visible and no canvas is inserted. The existing missing-image graduation placeholder stays 96px high.
- Isolated renderer checks passed DPR 1/2 backing dimensions, exact source crop, high-quality smoothing, bounded luminance changes, unchanged alpha/flat colour, cached redraw, mobile gating, lazy/detached images and canvas/context/draw/readback failure paths. These use the actual renderer source with isolated dependencies; physical high-DPI/target-device review remains with the owner.
- JavaScript syntax and diff whitespace checks passed. Source comparison confirms all non-photo browser logic is unchanged and `onboarding.html` changes only its browser-script cache version (apart from final-newline normalisation). All 35 original WebP assets are byte-identical. Authentication/account creation, registration, draft/payment modules, course data and other pages remain at the baseline source.

Changed files: `onboarding-course-browser.js`, `onboarding.html`, `FOA_APPROVED_STATE.md` and this record. Browser proof was saved from the local public-catalogue preview. Live release verification checks the production HTML and browser script against the tested file bytes after merge; an authenticated review on the owner's desktop remains outstanding.
