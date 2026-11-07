# Existing-photo framing — 7 November 2026

The owner asked to improve the current pictures without replacing them or resizing the accepted cards. Original image files, URLs, people, colours and practical activities remain unchanged. Course-specific vertical framing gives the visible people and work 15–55% more vertical display space inside the existing 96px bands, reducing the extreme vertical compression of full-portrait stretch. Only peripheral background/foreground is trimmed; there is no generated replacement, decorative fill, blur or centred inset. Unknown future image filenames keep their existing full-image treatment.

The 35 original sources were visually checked with their framing rectangles to retain faces, hands and the essential activity/equipment. Desktop, tablet and phone card dimensions/columns must match the previous renderer; the change does not enlarge cards. Some widening remains because full-width shallow bands and portrait source photos have different aspect ratios. Sharpening alone cannot remove that geometric constraint.

Changed rendering: `onboarding-course-browser.js` framing metadata/helper/styles and its cache reference in `onboarding.html`. Original assets, public course pages and all course data remain unchanged. The unrelated rejected replacement-image branch is not part of this change.


## Completed layout checks

All 35 image files are byte-identical to the live baseline. The current live catalogue's IDs, titles, URLs, prices and durations match the checked fixture. The same originals fill the image band at every size; no blank side area is added. Card dimensions match the previous renderer exactly:

| Viewport px | Columns | Existing card heights px | Comparison |
| --- | --- | --- | --- |
| 1280 | 4 | 246 | Exact match |
| 768 | 2 | 246 | Exact match |
| 1023 | 2 | 246 | Exact match |
| 1024 | 4 | 264, 246 | Exact match |
| 390 | 2 | 285, 302 | Exact match |
| 320 | 2 | 326, 343 | Exact match |

Image bands remain 96px high. There is no horizontal page overflow at any checked width. A local browser review checked all 35 framing rectangles against the original people, hands and equipment. Actual signed-in target-device review remains with the owner; no production account or enrolment was created for these checks.
