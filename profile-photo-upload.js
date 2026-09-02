// Funda Online Academy — profile photo feature retired.
// The optional avatar upload experiment was removed to restore the original
// Admin and Student dashboard header behaviour and avoid unnecessary runtime
// observers. Existing profile avatar data is left untouched in the database,
// but no profile-photo UI or repaint logic runs on Academy dashboards.
(()=>{
  'use strict';
  window.__fundaProfilePhotoUpload = true;
})();
