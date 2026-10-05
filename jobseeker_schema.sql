-- TABLES
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text, email text,
  role text not null default 'seeker' check (role in ('seeker','employer','admin')),
  phone text default '', skills text default '',
  education text default '', experience text default ''
);

create table jobs (
  id bigint generated always as identity primary key,
  title text, company text, location text, category text, type text,
  salary text, skills text[] default '{}', description text,
  posted_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

create table applications (
  id bigint generated always as identity primary key,
  job_id bigint references jobs(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  status text not null default 'Pending'
    check (status in ('Pending','Approved','Rejected','Accepted','Declined')),
  applied_at date default current_date,
  unique (job_id, user_id)
);

create table saved_jobs (
  id bigint generated always as identity primary key,
  user_id uuid references profiles(id) on delete cascade,
  job_id bigint references jobs(id) on delete cascade,
  unique (user_id, job_id)
);

-- HELPERS
create function my_role() returns text language sql security definer stable
set search_path = public as $$ select role from profiles where id = auth.uid() $$;

create function is_admin() returns boolean language sql security definer stable
set search_path = public as $$ select coalesce(my_role() = 'admin', false) $$;

-- AUTO-CREATE PROFILE (admin ay hindi pwedeng piliin sa register)
create function handle_new_user() returns trigger language plpgsql security definer
set search_path = public as $$
begin
  insert into profiles (id, name, email, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'name',''), new.email,
    case when new.raw_user_meta_data->>'role' = 'employer' then 'employer' else 'seeker' end);
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function handle_new_user();

-- SECURITY (RLS)
alter table profiles enable row level security;
alter table jobs enable row level security;
alter table applications enable row level security;
alter table saved_jobs enable row level security;

revoke update on profiles from authenticated;
grant update (name, phone, skills, education, experience) on profiles to authenticated;

create policy "profiles read" on profiles for select using (
  id = auth.uid() or is_admin() or exists (
    select 1 from applications a join jobs j on j.id = a.job_id
    where a.user_id = profiles.id and j.posted_by = auth.uid()));
create policy "profiles update own" on profiles for update using (id = auth.uid());

create policy "jobs public read" on jobs for select using (true);
create policy "jobs insert" on jobs for insert
  with check (my_role() in ('employer','admin') and posted_by = auth.uid());
create policy "jobs delete" on jobs for delete
  using (posted_by = auth.uid() or is_admin());

create policy "apps read" on applications for select using (
  user_id = auth.uid() or is_admin() or exists (
    select 1 from jobs j where j.id = applications.job_id and j.posted_by = auth.uid()));
create policy "apps insert" on applications for insert
  with check (user_id = auth.uid() and my_role() = 'seeker');
create policy "apps review" on applications for update
  using (status = 'Pending' and (is_admin() or exists (
    select 1 from jobs j where j.id = applications.job_id and j.posted_by = auth.uid())))
  with check (status in ('Approved','Rejected'));
create policy "apps respond" on applications for update
  using (user_id = auth.uid() and status = 'Approved')
  with check (status in ('Accepted','Declined'));

create policy "saved own" on saved_jobs for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- DEFAULT JOBS
insert into jobs (title, company, location, category, type, salary, skills, description) values
('Frontend Developer','Tech Solutions Inc.','Manila','IT','Full Time','₱35,000 - ₱50,000','{HTML,CSS,JavaScript}','Develop responsive and user-friendly websites and web applications.'),
('Backend Developer','Digital Systems','Quezon City','IT','Full Time','₱40,000 - ₱60,000','{PHP,MySQL,API}','Build APIs, databases, and backend services for business applications.'),
('UI/UX Designer','Creative Studio','Cebu','Design','Full Time','₱30,000 - ₱45,000','{Figma,"UI Design",UX}','Create attractive and user-friendly digital interfaces.'),
('IT Support Specialist','Global IT Corp.','Davao','IT','Full Time','₱25,000 - ₱35,000','{Networking,Windows,Linux}','Provide technical support and troubleshoot hardware and software problems.'),
('Digital Marketing Specialist','Marketing Pro','Manila','Marketing','Remote','₱30,000 - ₱45,000','{SEO,"Social Media",Analytics}','Develop digital marketing campaigns and manage social media platforms.'),
('Data Analyst','DataWorks','Quezon City','Finance','Full Time','₱38,000 - ₱55,000','{Excel,SQL,"Power BI"}','Analyze data and create reports and dashboards for business decisions.');