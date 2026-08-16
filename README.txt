FUNDA ONLINE ACADEMY PTY LTD — UPGRADED WEBSITE

This is the upgraded version of the original website.

Main upgrades:
- Real student registration/login using Supabase
- Student dashboard
- Admin dashboard
- Course database
- Add/edit/delete courses
- Exact course prices from supplied screenshots
- Enrolment requests
- Admin enrolment status management
- Duplicate course protection
- Responsive mobile design

IMPORTANT:
The website needs a Supabase project before student login works.
Follow SETUP.md.

Initial catalogue contains 27 courses. Prices are stored as individual course prices, not a generic "starting from R440".

The supplied logo is included as logo.png.


SYSTEM NOTE: dashboard.html is the student dashboard. course-study.html is the protected learning page opened after an approved enrolment. dashboard.js and course-study.js are the current student-side files.

IMPORTANT DATABASE NOTE
-----------------------
A safe database repair script is included as REPAIR_DATABASE.sql. It is only needed
if Supabase reports a missing column/table in the existing project. Run it once in
Supabase SQL Editor. The website code has also been made compatible with the current
enrollments.enrollment_status column so the student enrolment screen does not require
an additional status column.
