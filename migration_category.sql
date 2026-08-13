-- Funda Online Academy: add the category field used by the website.
alter table public.courses
add column if not exists category text not null default 'Course';

-- Optional categories for the existing catalogue.
update public.courses set category = case title
  when 'Cashier' then 'Retail'
  when 'Customer Service' then 'Workplace Skills'
  when 'Merchandising' then 'Retail'
  when 'Hotel Receptionist' then 'Hospitality'
  when 'Food and Beverage' then 'Hospitality'
  when 'Food and Safety' then 'Food & Hospitality'
  when 'Petrol Station Attendant' then 'Fuel Retail'
  when 'Basic Skills in Farming' then 'Agriculture'
  when 'Housekeeping' then 'Hospitality'
  when 'Warehouse Associate' then 'Logistics'
  when 'Professional Cleaning' then 'Cleaning Services'
  when 'Painting Skills' then 'Construction'
  when 'Receptionist Skills' then 'Workplace Skills'
  when 'Basic Skills in Carpentry' then 'Construction'
  when 'Introduction to Construction' then 'Construction'
  when 'Basic Skills in Fashion Design' then 'Fashion'
  when 'Nail Artistry' then 'Beauty'
  when 'Introduction to Sewing' then 'Fashion'
  when 'Hair Styling' then 'Beauty'
  when 'Computer Skills' then 'Digital Skills'
  when 'Baking Basics' then 'Food Skills'
  when 'Make-Up Artistry' then 'Beauty'
  when 'Skills in Business Administration' then 'Business'
  when 'Basic Skills in Retail Management' then 'Retail'
  when 'Gardening' then 'Agriculture'
  when 'Skills in Childcare and Young People Development' then 'Care Skills'
  when 'Introduction to Fire and Safety' then 'Safety'
  else category
end;
