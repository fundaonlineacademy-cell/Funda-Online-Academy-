-- Funda Online Academy database
-- Run this in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'student' check (role in ('student','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  price integer not null check (price >= 0),
  category text not null default 'General',
  duration text,
  description text,
  modules jsonb not null default '[]'::jsonb,
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','completed','cancelled')),
  created_at timestamptz not null default now(),
  unique(student_id, course_id)
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name','Student'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.enrollments enable row level security;

drop policy if exists "profiles own or admin select" on public.profiles;
create policy "profiles own or admin select" on public.profiles for select
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles admin update" on public.profiles;
create policy "profiles admin update" on public.profiles for update
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read active courses" on public.courses;
create policy "public read active courses" on public.courses for select
using (active = true or public.is_admin());

drop policy if exists "admin insert courses" on public.courses;
create policy "admin insert courses" on public.courses for insert
with check (public.is_admin());

drop policy if exists "admin update courses" on public.courses;
create policy "admin update courses" on public.courses for update
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin delete courses" on public.courses;
create policy "admin delete courses" on public.courses for delete
using (public.is_admin());

drop policy if exists "students read own enrollments" on public.enrollments;
create policy "students read own enrollments" on public.enrollments for select
using (student_id = auth.uid() or public.is_admin());

drop policy if exists "students create own enrollment" on public.enrollments;
create policy "students create own enrollment" on public.enrollments for insert
with check (student_id = auth.uid());

drop policy if exists "admin update enrollments" on public.enrollments;
create policy "admin update enrollments" on public.enrollments for update
using (public.is_admin()) with check (public.is_admin());

-- Initial course catalogue from the screenshots supplied by the owner.
insert into public.courses (name,price,category,duration,modules)
values
('Cashier',450,'Retail','1–2 Weeks','["Retail customer service foundation", "POS / till basics", "Scanning, returns & voids", "Cash handling", "Card, EFT & vouchers", "Float, cash-up & balancing", "Theft prevention & company policy", "Difficult customers"]'::jsonb),
('Petrol Station Attendant',900,'Fuel Retail','1 Week','["Customer service", "Forecourt operations", "Fuel station safety", "Fuel handling awareness", "Professional conduct", "Workplace communication"]'::jsonb),
('Merchandising',440,'Retail','1–2 Weeks','["Merchandising foundations", "Product presentation", "Displays & shelf standards", "Stock awareness", "Promotions & displays", "Workplace standards"]'::jsonb),
('Customer Service',550,'Workplace Skills','1–2 Weeks','["Customer service foundations", "Professional communication", "Customer needs", "Handling complaints", "Difficult customers", "Service excellence"]'::jsonb),
('Hotel Receptionist',550,'Hospitality','1–2 Weeks','["Front office foundations", "Guest reception", "Reservations basics", "Telephone & email etiquette", "Guest complaints", "Professional presentation"]'::jsonb),
('Food and Beverage',450,'Hospitality','1–2 Weeks','["Food & beverage foundations", "Customer service", "Table service basics", "Food safety awareness", "Professional hygiene", "Guest satisfaction"]'::jsonb),
('Food and Safety',900,'Food & Hospitality','3–4 Weeks','["Food safety foundations", "Personal hygiene", "Safe food handling", "Cross-contamination awareness", "Cleaning and sanitation", "Workplace food safety"]'::jsonb),
('Skills in Childcare and Young People Development',900,'Care Skills','3–4 Weeks','["Childcare foundations", "Child development", "Safety and wellbeing", "Communication with children", "Activities and learning", "Professional practice"]'::jsonb),
('Hair Styling',3500,'Beauty','Flexible','["Hair styling foundations", "Hair preparation", "Styling techniques", "Client consultation", "Salon hygiene", "Professional practice"]'::jsonb),
('Computer Skills',3500,'Digital Skills','Flexible','["Computer basics", "File and folder management", "Internet and email", "Word processing", "Spreadsheets", "Digital safety"]'::jsonb),
('Basic Skills in Farming',550,'Agriculture','Flexible','["Soil basics", "Crop production", "Plant care", "Watering", "Basic farm safety", "Harvesting awareness"]'::jsonb),
('Baking Basics',2500,'Food Skills','3–4 Weeks','["Baking equipment", "Ingredient functions", "Mixing methods", "Bread basics", "Cakes and pastries", "Food hygiene"]'::jsonb),
('Make-Up Artistry',4000,'Beauty','2–3 Weeks','["Make-up tools", "Skin preparation", "Foundation and complexion", "Eye make-up", "Colour basics", "Professional client practice"]'::jsonb),
('Basic Skills in Carpentry',1200,'Construction','Flexible','["Carpentry tools", "Measuring and marking", "Wood types", "Basic joints", "Safe tool use", "Basic projects"]'::jsonb),
('Introduction to Construction',950,'Construction','Flexible','["Construction basics", "Methods and sequence", "Site safety", "Tools and materials", "Basic construction terminology", "Workplace practice"]'::jsonb),
('Basic Skills in Fashion Design',2600,'Fashion','6–8 Weeks','["Fashion design foundations", "Measurements", "Design concepts", "Fabric basics", "Pattern basics", "Garment construction"]'::jsonb),
('Nail Artistry',3500,'Beauty','Flexible','["Nail care", "Tools and hygiene", "Basic manicure", "Nail art techniques", "Client preparation", "Professional practice"]'::jsonb),
('Introduction to Sewing',3500,'Fashion','Flexible','["Sewing machine basics", "Tools and equipment", "Fabric handling", "Basic stitches", "Simple garment construction", "Sewing safety"]'::jsonb),
('Housekeeping',550,'Hospitality','1 Week','["Housekeeping foundations", "Cleaning procedures", "Room preparation", "Linen handling", "Hygiene and safety", "Professional standards"]'::jsonb),
('Introduction to Fire and Safety',499,'Safety','Flexible','["Fire safety foundations", "Hazard awareness", "Emergency procedures", "Fire prevention", "Workplace safety", "Basic response principles"]'::jsonb),
('Warehouse Associate',750,'Logistics','Flexible','["Warehouse operations", "Stock handling", "Receiving and dispatch", "Storage basics", "Safety procedures", "Workplace organisation"]'::jsonb),
('Professional Cleaning',450,'Cleaning Services','1 Week','["Cleaning equipment", "Cleaning methods", "Chemical safety", "Workplace hygiene", "Professional standards", "Cleaning schedules"]'::jsonb),
('Skills in Business Administration',1200,'Business','3–4 Weeks','["Office administration", "Communication", "Document management", "Customer service", "Scheduling", "Basic workplace organisation"]'::jsonb),
('Painting Skills',450,'Construction','1 Week','["Surface preparation", "Tools and materials", "Priming", "Painting techniques", "Finishing", "Workplace safety"]'::jsonb),
('Basic Skills in Retail Management',1200,'Retail','3–4 Weeks','["Retail operations", "Stock management", "Merchandising", "Customer service", "Team supervision", "Basic retail administration"]'::jsonb),
('Receptionist Skills',900,'Workplace Skills','4–6 Weeks','["Reception duties", "Telephone etiquette", "Visitor management", "Appointments", "Professional communication", "Front-desk organisation"]'::jsonb),
('Gardening',950,'Agriculture','3–4 Weeks','["Garden planning", "Soil preparation", "Planting", "Watering", "Pruning", "Garden maintenance"]'::jsonb)
on conflict (name) do update set
 price=excluded.price,
 category=excluded.category,
 duration=excluded.duration,
 modules=excluded.modules,
 updated_at=now();

-- IMPORTANT: after you create your own account, run this one line with your email
-- (replace the email below). This gives your account administrator access.
-- update public.profiles set role='admin' where id=(select id from auth.users where email='YOUR_EMAIL_HERE');
