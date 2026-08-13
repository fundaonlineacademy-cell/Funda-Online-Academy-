# Funda Online Academy — Login & Admin Setup

This package upgrades the original static site to use Supabase for real student accounts, course data and enrolments.

## What is included

- `index.html` — public website
- `auth.html` — Student Login / Register / password reset
- `dashboard.html` — Student dashboard
- `admin.html` — Your private course-management dashboard
- `schema.sql` — Database tables, security rules and the initial 27-course catalogue
- `supabase-config.js` — where you add your Supabase project URL and anon key
- `site.js`, `auth.js`, `dashboard.js`, `admin.js` — site functionality
- `styles.css` — responsive design
- `logo.png` — your academy logo

## Step 1 — Create a Supabase project

Create a Supabase account/project. A free project is enough to start testing.

In the Supabase dashboard:
1. Create a new project.
2. Open the SQL Editor.
3. Open this project's `schema.sql`.
4. Copy all of its contents into the SQL Editor and run it.

The SQL creates:
- student profiles
- courses
- enrolments
- student/admin security rules
- the initial course catalogue

## Step 2 — Connect the website

In the Supabase dashboard, find your project's API settings.

Open `supabase-config.js` and replace:

PASTE_YOUR_SUPABASE_PROJECT_URL_HERE
PASTE_YOUR_SUPABASE_ANON_KEY_HERE

with the project's URL and public/anon key.

Do NOT put a `service_role` key in the website.

Also replace:

PASTE_YOUR_ADMIN_EMAIL_HERE

with the email address you will use for your academy admin account.

Note: the admin email variable is kept as a reminder/identifier; actual admin security is controlled by the `profiles.role` database field.

## Step 3 — Create your admin account

Open the website and use Create Account with your own admin email.

After the account is created and confirmed, go back to Supabase SQL Editor and run:

update public.profiles
set role='admin'
where id=(select id from auth.users where email='YOUR_EMAIL_HERE');

Replace YOUR_EMAIL_HERE with your actual admin email.

Then open:

admin.html

and log in using that account.

## Step 4 — Student accounts

Students use:

auth.html

They can:
- create an account
- log in
- reset their password
- open their dashboard
- see their enrolments
- request enrolment in available courses

## Step 5 — Course management

Inside `admin.html`, you can:
- add courses
- edit course names
- edit prices
- edit categories
- edit duration
- edit descriptions
- edit modules
- add an image URL
- activate courses
- delete courses
- approve/complete/cancel enrolment requests

The course name has a database UNIQUE rule, so the same course cannot accidentally be inserted twice.

## Important catalogue rule

The initial catalogue was entered from the screenshots supplied for this project.

Confirmed prices include:
- Cashier — R450
- Customer Service — R550
- Merchandising — R440
- Hotel Receptionist — R550
- Food and Beverage — R450
- Food and Safety — R900
- Petrol Station Attendant — R900
- Skills in Childcare and Young People Development — R900
- Introduction to Fire and Safety — R499

When adding future screenshots/courses, compare them against the existing catalogue first. Do not create a second copy of an existing course.

## Deploying to Netlify

After connecting Supabase:
1. Keep all files in this folder.
2. Upload the folder to your Netlify site, or connect the folder's GitHub repository to Netlify.
3. In Supabase Authentication settings, add your Netlify website address as the Site URL / redirect URL.
4. Test Register → Login → Dashboard → Enrolment.
5. Test Admin Login → Course Manager → Add/Edit Course.

## Security

Never publish a Supabase `service_role` key in this website.

The browser uses only the public anon key. Database Row Level Security is used so:
- students can access their own enrolments
- students cannot edit courses
- only profiles marked `admin` can manage courses
- only admins can change enrolment statuses

## Next development stage

After login is working, the next useful upgrade is to add:
- proper course detail pages
- course materials/lessons
- student progress
- certificate management
- course image uploads
- admin student management
- payment/enrolment workflow


## Current project connection

This package is pre-connected to the Supabase project URL and publishable key supplied for this Funda Online Academy project.

Because the original schema was already run in Supabase, run `migration_category.sql` once in the SQL Editor before using the Admin Dashboard. This adds the category field used by the website.

Do not replace the publishable key with a secret/service_role key.
