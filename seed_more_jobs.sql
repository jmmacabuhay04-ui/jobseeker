-- =========================================================
-- DAGDAG NA JOBS (para may laman ang lahat ng 12 categories)
-- Patakbuhin sa Supabase: SQL Editor -> New query -> Run
-- Ligtas patakbuhin kahit ilang beses: hindi nito dodoblehin ang job
-- na pareho ang title at company.
-- =========================================================

insert into jobs (title, company, location, category, type, salary, skills, description)
select v.title, v.company, v.location, v.category, v.type, v.salary, v.skills::text[], v.description
from (values
  -- IT & Development
  ('Junior Web Developer','Kalye Labs','Makati City','IT','Full Time','₱25,000 - ₱32,000','{HTML,CSS,JavaScript,Git}','Build and maintain client websites with the senior dev team.'),
  ('IT Intern','Bayan Digital Services','Batangas City','IT','Internship','₱6,000 allowance','{"Basic networking","MS Office","Hardware troubleshooting"}','Assist the IT team with setup, repairs and help-desk tickets. Open to BSIT/BSCS students.'),

  -- Design & Creative
  ('Graphic Designer','Habi Creative Co.','Pasig City','Design','Full Time','₱22,000 - ₱30,000','{Photoshop,Illustrator,Canva}','Create social media graphics, posters and brand materials.'),
  ('Video Editor','Sinag Media','Remote (PH)','Design','Remote','₱20,000 - ₱28,000','{"Premiere Pro","CapCut","Motion graphics"}','Edit short-form videos for YouTube, TikTok and Facebook.'),

  -- Marketing & Sales
  ('Sales Associate','Tindahan Retail Group','Lipa City','Marketing','Full Time','₱16,000 - ₱20,000 + commission','{Communication,"Customer handling","Product knowledge"}','Assist walk-in customers, close sales and keep the store floor organized.'),
  ('Social Media Assistant','Lakbay Travel','Remote (PH)','Marketing','Part Time','₱12,000 - ₱15,000','{Canva,Copywriting,"Meta Business Suite"}','Plan, write and schedule posts for our travel pages.'),

  -- Business & Management
  ('Operations Supervisor','Sampaguita Logistics','Calamba, Laguna','Business','Full Time','₱30,000 - ₱40,000','{Leadership,Scheduling,Excel}','Lead a team of 12, track daily deliveries and solve operational issues.'),
  ('Admin Assistant','Malaya Business Center','Ortigas, Pasig','Business','Full Time','₱18,000 - ₱22,000','{"MS Office",Filing,"Email handling"}','Handle documents, scheduling and front-desk tasks for the office.'),

  -- Finance & Accounting
  ('Accounting Assistant','Sampaguita Holdings','Batangas City','Finance','Full Time','₱22,000 - ₱26,000','{Excel,Bookkeeping,QuickBooks}','Record transactions, prepare reconciliations and support month-end close.'),
  ('Payroll Officer','Tanglaw Corp.','Makati City','Finance','Full Time','₱28,000 - ₱35,000','{Payroll,"SSS/PhilHealth/Pag-IBIG",Excel}','Process semi-monthly payroll and government contributions.'),

  -- Healthcare & Medical
  ('Staff Nurse','Lingap Medical Center','Batangas City','Healthcare','Full Time','₱28,000 - ₱35,000','{"PRC license","Patient care",BLS}','Provide bedside care in the medical-surgical ward. Rotating shifts.'),
  ('Pharmacy Assistant','BotiKalusugan Pharmacy','Lipa City','Healthcare','Part Time','₱13,000 - ₱16,000','{"Customer service",Inventory,"Basic pharmacology"}','Assist the pharmacist, manage stock and serve customers at the counter.'),

  -- Education & Training
  ('ICT Teacher','Lipa Science Academy','Lipa City','Education','Full Time','₱28,000 - ₱32,000','{Teaching,Python,"Lesson planning"}','Teach ICT and basic programming to Grade 10 students.'),
  ('Online English Tutor','Turo Online','Remote (PH)','Education','Remote','₱180 - ₱250 per hour','{English,"Lesson delivery",Patience}','Teach one-on-one English lessons to students abroad. Flexible schedule.'),

  -- Engineering & Technical
  ('Junior Civil Engineer','Tibay Builders','Tanauan, Batangas','Engineering','Full Time','₱25,000 - ₱32,000','{AutoCAD,"Site inspection","Quantity estimation"}','Support site engineers with plans, estimates and daily inspections.'),
  ('Electrical Technician','Liwanag Power Services','Sto. Tomas, Batangas','Engineering','Full Time','₱20,000 - ₱25,000','{"Electrical wiring",Troubleshooting,"Safety standards"}','Install and maintain electrical systems for commercial clients.'),

  -- Human Resources
  ('HR Assistant','Bayanihan Staffing','Quezon City','HR','Full Time','₱20,000 - ₱25,000','{Recruitment,"201 files","MS Office"}','Screen applicants, schedule interviews and keep employee records updated.'),
  ('Recruitment Intern','PeopleFirst PH','Remote (PH)','HR','Internship','₱5,000 allowance','{Communication,"LinkedIn sourcing",Excel}','Help the recruitment team source and contact candidates.'),

  -- Customer Service
  ('Customer Service Representative','Agos Contact Solutions','Lipa City','Customer Service','Full Time','₱18,000 - ₱24,000','{"English communication","Typing 35 wpm","Problem solving"}','Answer customer calls and chats for a US telecom account. Night shift.'),
  ('Chat Support Agent','Kuwento Commerce','Remote (PH)','Customer Service','Remote','₱17,000 - ₱21,000','{"Written English",Multitasking,"Zendesk"}','Respond to customer chats and emails for an online store.'),

  -- Manufacturing & Production
  ('Production Operator','Kalinga Electronics','Lima Technology Center, Malvar','Manufacturing','Full Time','₱15,000 - ₱18,000','{"Assembly line",Teamwork,"5S"}','Assemble electronic parts and follow quality checks on the line.'),
  ('Quality Control Inspector','Ani Food Products','Sto. Tomas, Batangas','Manufacturing','Full Time','₱18,000 - ₱22,000','{"Quality inspection","GMP","Attention to detail"}','Inspect products and record quality results for each production batch.'),

  -- Other
  ('Delivery Rider','Hatid Express','Batangas City','Other','Full Time','₱16,000 - ₱20,000','{"Driver''s license","Own motorcycle","Navigation apps"}','Deliver parcels within Batangas City and nearby towns.'),
  ('Barista','Kape Kanto','Lipa City','Other','Part Time','₱12,000 - ₱14,000','{"Coffee preparation","Customer service",Cleanliness}','Prepare drinks and serve customers in a busy neighborhood café.')
) as v(title, company, location, category, type, salary, skills, description)
where not exists (
  select 1 from jobs j where j.title = v.title and j.company = v.company
);
