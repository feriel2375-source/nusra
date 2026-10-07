
create type public.app_role as enum ('contributor','reviewer','editor','admin');
create type public.person_status as enum ('DETAINED','RELEASED','MISSING','UNKNOWN','OTHER');
create type public.publication_status as enum ('DRAFT','PENDING_REVIEW','VERIFIED','PUBLISHED','ARCHIVED');
create type public.verification_status as enum ('VERIFIED','SOURCE_ONE','UNDER_VERIFICATION','LIMITED_INFORMATION');
create type public.risk_level as enum ('LOW','MEDIUM','HIGH','CRITICAL');
create type public.submission_status as enum ('PENDING','UNDER_REVIEW','APPROVED','NEEDS_MORE_INFO','REJECTED','PUBLISHED');
create type public.doc_visibility as enum ('PUBLIC','REVIEWERS_ONLY','INTERNAL','UNPUBLISHED');
create type public.content_visibility as enum ('PUBLIC','INTERNAL');
create type public.source_type as enum ('OFFICIAL','NGO','MEDIA','DOCUMENT','WITNESS','FAMILY','OTHER');
create type public.report_status as enum ('NEW','IN_REVIEW','RESOLVED','CLOSED');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('reviewer','editor','admin'))
$$;
create or replace function public.can_edit(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('editor','admin'))
$$;

create policy "own roles or admin" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
grant insert, delete on public.user_roles to authenticated;
create policy "admin insert roles" on public.user_roles for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "admin delete roles" on public.user_roles for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create policy "own profile or admin read" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_staff(auth.uid()));
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid());

-- first admin bootstrap
create or replace function public.claim_first_admin()
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return false; end if;
  insert into public.profiles(id, email) values (auth.uid(), (auth.jwt()->>'email')) on conflict (id) do nothing;
  if exists (select 1 from public.user_roles where role = 'admin') then return false; end if;
  insert into public.user_roles(user_id, role) values (auth.uid(), 'admin');
  return true;
end $$;
grant execute on function public.claim_first_admin() to authenticated;

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

create table public.persons (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  display_name text,
  photo_url text,
  nationality text,
  country text,
  city_if_safe text,
  status public.person_status not null default 'UNKNOWN',
  birth_year_if_safe int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create sequence public.case_number_seq;
create table public.cases (
  id uuid primary key default gen_random_uuid(),
  case_number text not null unique default ('NSR-C-' || lpad(nextval('public.case_number_seq')::text, 4, '0')),
  slug text not null unique,
  person_id uuid references public.persons(id) on delete set null,
  title text not null,
  summary text,
  story text,
  known_facts text,
  attributed_claims text,
  unverified_info text,
  country text,
  case_type text not null default 'اعتقال',
  person_status public.person_status not null default 'UNKNOWN',
  status_label text,
  publication_status public.publication_status not null default 'DRAFT',
  verification_status public.verification_status not null default 'LIMITED_INFORMATION',
  risk_level public.risk_level not null default 'MEDIUM',
  needs text[] not null default '{}',
  detention_date date,
  last_known_update timestamptz default now(),
  public_visibility boolean not null default true,
  checklist jsonb not null default '{}',
  review_notes text,
  created_by uuid,
  reviewed_by uuid,
  published_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);
create trigger cases_updated before update on public.cases for each row execute function public.set_updated_at();
create trigger persons_updated before update on public.persons for each row execute function public.set_updated_at();

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.cases(id) on delete cascade,
  name text not null,
  type public.source_type not null default 'OTHER',
  url text,
  publication_date date,
  reliability text not null default 'MEDIUM',
  notes text,
  is_public boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table public.case_updates (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  title text not null,
  update_type text not null default 'تحديث',
  summary text,
  content text,
  source_id uuid references public.sources(id) on delete set null,
  verification_status public.verification_status not null default 'UNDER_VERIFICATION',
  visibility public.content_visibility not null default 'PUBLIC',
  is_published boolean not null default false,
  created_by uuid,
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create table public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  event_date date not null,
  title text not null,
  description text,
  source_id uuid references public.sources(id) on delete set null,
  verification_status public.verification_status not null default 'UNDER_VERIFICATION',
  visibility public.content_visibility not null default 'PUBLIC',
  created_at timestamptz not null default now()
);

create sequence public.submission_ref_seq;
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  reference_number text not null unique default ('NSR-2026-' || lpad(nextval('public.submission_ref_seq')::text, 6, '0')),
  case_id uuid references public.cases(id) on delete set null,
  submission_type text not null,
  content text not null,
  source_description text,
  can_name_source boolean,
  has_document boolean not null default false,
  submitter_name text,
  submitter_email text,
  risk_answer text not null default 'UNSURE',
  payload jsonb not null default '{}',
  status public.submission_status not null default 'PENDING',
  reviewer_id uuid,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger submissions_updated before update on public.submissions for each row execute function public.set_updated_at();

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.cases(id) on delete set null,
  submission_id uuid references public.submissions(id) on delete cascade,
  title text,
  file_name text not null,
  file_path text not null,
  file_type text,
  visibility public.doc_visibility not null default 'UNPUBLISHED',
  uploaded_by uuid,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.cases(id) on delete set null,
  report_type text not null,
  description text not null,
  reporter_email text,
  status public.report_status not null default 'NEW',
  reviewed_by uuid,
  resolution text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger reports_updated before update on public.reports for each row execute function public.set_updated_at();

create table public.help_actions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  type text not null,
  title text not null,
  description text,
  url text,
  safe boolean not null default true,
  visibility public.content_visibility not null default 'PUBLIC',
  created_at timestamptz not null default now()
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text, email text, message_type text not null, subject text not null, message text not null,
  status text not null default 'NEW',
  created_at timestamptz not null default now()
);

create table public.site_settings (
  id int primary key default 1 check (id = 1),
  data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  entity text not null,
  entity_id uuid,
  case_id uuid,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

-- GRANTS
grant select on public.persons, public.cases, public.sources, public.case_updates, public.timeline_events, public.documents, public.help_actions, public.site_settings to anon;
grant select, insert, update, delete on public.persons, public.cases, public.sources, public.case_updates, public.timeline_events, public.documents, public.help_actions, public.submissions, public.reports, public.contact_messages, public.site_settings to authenticated;
grant select on public.audit_logs to authenticated;
grant all on public.persons, public.cases, public.sources, public.case_updates, public.timeline_events, public.documents, public.help_actions, public.submissions, public.reports, public.contact_messages, public.site_settings, public.audit_logs to service_role;

alter table public.persons enable row level security;
alter table public.cases enable row level security;
alter table public.sources enable row level security;
alter table public.case_updates enable row level security;
alter table public.timeline_events enable row level security;
alter table public.documents enable row level security;
alter table public.help_actions enable row level security;
alter table public.submissions enable row level security;
alter table public.reports enable row level security;
alter table public.contact_messages enable row level security;
alter table public.site_settings enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.case_is_public(_case_id uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.cases where id = _case_id and publication_status = 'PUBLISHED' and public_visibility)
$$;

-- public reads
create policy "public published cases" on public.cases for select to anon, authenticated using (publication_status = 'PUBLISHED' and public_visibility);
create policy "public persons of published cases" on public.persons for select to anon, authenticated using (exists (select 1 from public.cases c where c.person_id = persons.id and c.publication_status='PUBLISHED' and c.public_visibility));
create policy "public sources" on public.sources for select to anon, authenticated using (is_public and public.case_is_public(case_id));
create policy "public updates" on public.case_updates for select to anon, authenticated using (visibility='PUBLIC' and is_published and public.case_is_public(case_id));
create policy "public timeline" on public.timeline_events for select to anon, authenticated using (visibility='PUBLIC' and public.case_is_public(case_id));
create policy "public docs" on public.documents for select to anon, authenticated using (visibility='PUBLIC' and public.case_is_public(case_id));
create policy "public help" on public.help_actions for select to anon, authenticated using (visibility='PUBLIC' and safe and public.case_is_public(case_id));
create policy "public settings" on public.site_settings for select to anon, authenticated using (true);

-- staff reads
create policy "staff read cases" on public.cases for select to authenticated using (public.is_staff(auth.uid()));
create policy "staff read persons" on public.persons for select to authenticated using (public.is_staff(auth.uid()));
create policy "staff read sources" on public.sources for select to authenticated using (public.is_staff(auth.uid()));
create policy "staff read updates" on public.case_updates for select to authenticated using (public.is_staff(auth.uid()));
create policy "staff read timeline" on public.timeline_events for select to authenticated using (public.is_staff(auth.uid()));
create policy "staff read docs" on public.documents for select to authenticated using (public.is_staff(auth.uid()) and (visibility <> 'INTERNAL' or public.can_edit(auth.uid())));
create policy "staff read help" on public.help_actions for select to authenticated using (public.is_staff(auth.uid()));
create policy "staff read submissions" on public.submissions for select to authenticated using (public.is_staff(auth.uid()));
create policy "staff update submissions" on public.submissions for update to authenticated using (public.is_staff(auth.uid()));
create policy "staff read reports" on public.reports for select to authenticated using (public.is_staff(auth.uid()));
create policy "staff update reports" on public.reports for update to authenticated using (public.is_staff(auth.uid()));
create policy "staff read contact" on public.contact_messages for select to authenticated using (public.is_staff(auth.uid()));
create policy "staff update contact" on public.contact_messages for update to authenticated using (public.is_staff(auth.uid()));
create policy "admin read audit" on public.audit_logs for select to authenticated using (public.can_edit(auth.uid()));

-- editor writes
create policy "editor write cases" on public.cases for all to authenticated using (public.can_edit(auth.uid())) with check (public.can_edit(auth.uid()));
create policy "editor write persons" on public.persons for all to authenticated using (public.can_edit(auth.uid())) with check (public.can_edit(auth.uid()));
create policy "editor write sources" on public.sources for all to authenticated using (public.can_edit(auth.uid())) with check (public.can_edit(auth.uid()));
create policy "editor write updates" on public.case_updates for all to authenticated using (public.can_edit(auth.uid())) with check (public.can_edit(auth.uid()));
create policy "editor write timeline" on public.timeline_events for all to authenticated using (public.can_edit(auth.uid())) with check (public.can_edit(auth.uid()));
create policy "editor write docs" on public.documents for all to authenticated using (public.can_edit(auth.uid())) with check (public.can_edit(auth.uid()));
create policy "editor write help" on public.help_actions for all to authenticated using (public.can_edit(auth.uid())) with check (public.can_edit(auth.uid()));
create policy "admin write settings" on public.site_settings for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- publish guard
create or replace function public.guard_publish() returns trigger language plpgsql set search_path = public as $$
declare k text;
begin
  if new.publication_status = 'PUBLISHED' and (tg_op = 'INSERT' or old.publication_status is distinct from 'PUBLISHED') then
    if auth.uid() is not null then
      foreach k in array array['name','date','source','sources_reviewed','docs_reviewed','no_sensitive','risk_set','fact_vs_claim','verification_set','summary_clear','help_safe'] loop
        if coalesce((new.checklist->>k)::boolean, false) = false then
          raise exception 'لا يمكن النشر قبل استكمال قائمة التحقق (%).', k;
        end if;
      end loop;
      new.published_by = auth.uid();
    end if;
    new.published_at = coalesce(new.published_at, now());
  end if;
  return new;
end $$;
create trigger cases_guard_publish before insert or update on public.cases for each row execute function public.guard_publish();

-- audit
create or replace function public.audit_trigger() returns trigger language plpgsql security definer set search_path = public as $$
declare act text; cid uuid;
begin
  if tg_table_name = 'cases' then
    cid := coalesce(new.id, old.id);
    if tg_op = 'INSERT' then act := 'CASE_CREATED';
    elsif tg_op = 'DELETE' then act := 'CASE_DELETED';
    elsif new.publication_status = 'PUBLISHED' and old.publication_status <> 'PUBLISHED' then act := 'CASE_PUBLISHED';
    elsif new.publication_status = 'ARCHIVED' and old.publication_status <> 'ARCHIVED' then act := 'CASE_ARCHIVED';
    elsif new.verification_status <> old.verification_status then act := 'VERIFICATION_CHANGED';
    else act := 'CASE_UPDATED'; end if;
  elsif tg_table_name = 'submissions' then
    cid := coalesce(new.case_id, old.case_id);
    if tg_op = 'INSERT' then act := 'SUBMISSION_RECEIVED';
    elsif new.status = 'APPROVED' and old.status <> 'APPROVED' then act := 'SUBMISSION_APPROVED';
    elsif new.status = 'REJECTED' and old.status <> 'REJECTED' then act := 'SUBMISSION_REJECTED';
    else act := 'SUBMISSION_UPDATED'; end if;
  elsif tg_table_name = 'documents' then
    cid := coalesce(new.case_id, old.case_id);
    act := case when tg_op='INSERT' then 'DOCUMENT_UPLOADED' when tg_op='DELETE' then 'DOCUMENT_DELETED' else 'DOCUMENT_UPDATED' end;
  elsif tg_table_name = 'user_roles' then
    act := 'USER_ROLE_CHANGED';
  else
    act := upper(tg_table_name) || '_' || tg_op;
  end if;
  insert into public.audit_logs(actor_id, action, entity, entity_id, case_id, old_value, new_value)
  values (auth.uid(), act, tg_table_name, coalesce(new.id, old.id), cid,
    case when tg_op <> 'INSERT' then to_jsonb(old) end,
    case when tg_op <> 'DELETE' then to_jsonb(new) end);
  return coalesce(new, old);
end $$;
create trigger audit_cases after insert or update or delete on public.cases for each row execute function public.audit_trigger();
create trigger audit_submissions after insert or update on public.submissions for each row execute function public.audit_trigger();
create trigger audit_documents after insert or update or delete on public.documents for each row execute function public.audit_trigger();
create trigger audit_roles after insert or delete on public.user_roles for each row execute function public.audit_trigger();
create trigger audit_updates after insert or update or delete on public.case_updates for each row execute function public.audit_trigger();
create trigger audit_sources after insert or update or delete on public.sources for each row execute function public.audit_trigger();

-- public submission RPCs (no account needed)
create or replace function public.submit_information(
  _case_id uuid, _type text, _content text, _source text, _can_name_source boolean,
  _has_document boolean, _name text, _email text, _risk text, _payload jsonb default '{}'
) returns json language plpgsql security definer set search_path = public as $$
declare r public.submissions;
begin
  if _content is null or length(trim(_content)) < 5 or length(_content) > 10000 then raise exception 'invalid content'; end if;
  if _type is null or length(_type) > 50 then raise exception 'invalid type'; end if;
  if _email is not null and length(_email) > 255 then raise exception 'invalid email'; end if;
  if _name is not null and length(_name) > 120 then raise exception 'invalid name'; end if;
  if _risk not in ('YES','NO','UNSURE') then _risk := 'UNSURE'; end if;
  insert into public.submissions(case_id, submission_type, content, source_description, can_name_source, has_document, submitter_name, submitter_email, risk_answer, payload)
  values (_case_id, _type, trim(_content), left(_source, 2000), _can_name_source, coalesce(_has_document,false), nullif(trim(_name),''), nullif(trim(_email),''), _risk, coalesce(_payload,'{}'))
  returning * into r;
  return json_build_object('id', r.id, 'reference_number', r.reference_number);
end $$;
grant execute on function public.submit_information(uuid,text,text,text,boolean,boolean,text,text,text,jsonb) to anon, authenticated;

create or replace function public.attach_submission_document(_submission_id uuid, _file_name text, _file_path text, _file_type text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.submissions where id = _submission_id and created_at > now() - interval '30 minutes') then raise exception 'invalid submission'; end if;
  if _file_path not like ('submissions/' || _submission_id::text || '/%') then raise exception 'invalid path'; end if;
  insert into public.documents(submission_id, case_id, title, file_name, file_path, file_type, visibility)
  select _submission_id, s.case_id, left(_file_name,200), left(_file_name,200), _file_path, _file_type, 'UNPUBLISHED' from public.submissions s where s.id = _submission_id;
end $$;
grant execute on function public.attach_submission_document(uuid,text,text,text) to anon, authenticated;

create or replace function public.submit_report(_case_id uuid, _type text, _description text, _email text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if _description is null or length(trim(_description)) < 5 or length(_description) > 5000 then raise exception 'invalid'; end if;
  insert into public.reports(case_id, report_type, description, reporter_email) values (_case_id, left(_type,50), trim(_description), nullif(left(_email,255),''));
end $$;
grant execute on function public.submit_report(uuid,text,text,text) to anon, authenticated;

create or replace function public.submit_contact(_name text, _email text, _type text, _subject text, _message text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if _message is null or length(trim(_message)) < 5 or length(_message) > 5000 or length(coalesce(_subject,'')) > 200 then raise exception 'invalid'; end if;
  insert into public.contact_messages(name, email, message_type, subject, message) values (left(_name,120), left(_email,255), left(_type,50), trim(_subject), trim(_message));
end $$;
grant execute on function public.submit_contact(text,text,text,text,text) to anon, authenticated;

-- storage
create policy "anon upload submission docs" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = 'submissions');
create policy "staff read docs storage" on storage.objects for select to authenticated
  using (bucket_id = 'documents' and public.is_staff(auth.uid()));
create policy "editor write docs storage" on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and public.can_edit(auth.uid()));
create policy "editor delete docs storage" on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and public.can_edit(auth.uid()));

-- SEED
insert into public.site_settings(id, data) values (1, '{"platform_name":"نُصرة","tagline":"صوتٌ للمظلوم، ودعوةٌ لنصرته.","email":"info@nusra.org","allow_submissions":true,"show_public_stats":true}');

insert into public.persons(id, full_name, photo_url, nationality, country, city_if_safe, status, birth_year_if_safe) values
('a0000000-0000-4000-8000-000000000001','أحمد محمد','/images/p1.jpg','مصري','مصر','القاهرة','DETAINED',1996),
('a0000000-0000-4000-8000-000000000002','ليلى منصور','/images/p2.jpg','سودانية','السودان',null,'DETAINED',1990),
('a0000000-0000-4000-8000-000000000003','يوسف عبد الله','/images/p3.jpg','جزائري','الجزائر',null,'DETAINED',1975),
('a0000000-0000-4000-8000-000000000004','فاطمة الزهراء',null,'مغربية','المغرب',null,'MISSING',1994),
('a0000000-0000-4000-8000-000000000005','خالد سعيد',null,'تونسي','تونس','صفاقس','RELEASED',1988),
('a0000000-0000-4000-8000-000000000006','سلمى خالد',null,'سورية','سوريا',null,'MISSING',1999),
('a0000000-0000-4000-8000-000000000007','عمر إبراهيم',null,'يمني','اليمن',null,'DETAINED',1985),
('a0000000-0000-4000-8000-000000000008','مريم حسن',null,'فلسطينية','فلسطين',null,'DETAINED',2001),
('a0000000-0000-4000-8000-000000000009','سلمان علي',null,'عراقي','العراق',null,'UNKNOWN',1980),
('a0000000-0000-4000-8000-000000000010','نور الهدى',null,'أردنية','الأردن',null,'OTHER',1997);

insert into public.cases(id, slug, person_id, title, summary, story, known_facts, attributed_claims, unverified_info, country, case_type, person_status, status_label, publication_status, verification_status, risk_level, needs, detention_date, last_known_update, published_at) values
('c0000000-0000-4000-8000-000000000001','ahmed-mohamed','a0000000-0000-4000-8000-000000000001','قضية أحمد محمد','بحسب المصادر المتاحة، تم توقيفه في مارس 2025، ومنذ ذلك الوقت تتابع أسرته أخبار قضيته وتبحث عن معلومات حول وضعه.','أحمد شاب في أواخر العشرينات، كان يعمل مهندسًا قبل توقيفه. توقّف التواصل مع أسرته بعد توقيفه، ولا تزال المعلومات المتاحة حول وضعه محدودة.','تم توقيفه بتاريخ 12 مارس 2025.
لم يُسمح لأسرته بزيارته حتى تاريخ آخر تحديث.','بحسب منظمة حقوقية محلية، نُقل إلى مركز احتجاز آخر في مايو 2025.
بحسب أسرته، لم يُوجَّه إليه اتهام رسمي معروف.','لم نتمكن من التحقق من مكان احتجازه الحالي.
لم نتمكن من التحقق من وضعه الصحي.','مصر','اعتقال','DETAINED','معتقل منذ مارس 2025','PUBLISHED','VERIFIED','MEDIUM','{معلومة,مساعدة قانونية}','2025-03-12','2026-10-04','2025-04-01'),
('c0000000-0000-4000-8000-000000000002','layla-mansour','a0000000-0000-4000-8000-000000000002','قضية ليلى منصور','توقّف التواصل مع أسرتها بعد توقيفها في مايو 2024، ولا تزال المعلومات المتاحة حول وضعها محدودة.','ليلى معلّمة، عُرفت بعملها التطوعي في مجتمعها. تتابع أسرتها قضيتها منذ توقيفها.','تم توقيفها في 3 مايو 2024.','بحسب مصدر إعلامي، نُقلت إلى مكان احتجاز في العاصمة.','لم نتمكن من التحقق من سبب التوقيف.','السودان','اعتقال','DETAINED','معتقلة منذ مايو 2024','PUBLISHED','SOURCE_ONE','HIGH','{مصدر,تحديث}','2024-05-03','2026-09-30','2024-06-01'),
('c0000000-0000-4000-8000-000000000003','youssef-abdallah','a0000000-0000-4000-8000-000000000003','قضية يوسف عبد الله','بحسب المصادر المتاحة، اعتُقل في سبتمبر 2024، وتسعى أسرته للوصول إلى محامٍ يتابع قضيته.','يوسف أب لثلاثة أبناء، عمل لسنوات في التجارة.','اعتُقل في 20 سبتمبر 2024.
عُرضت قضيته على جهة قضائية مرة واحدة على الأقل.','بحسب أسرته، تأجلت الجلسة عدة مرات.','لم نتمكن من التحقق من التهم الموجهة.','الجزائر','اعتقال','DETAINED','معتقل منذ سبتمبر 2024','PUBLISHED','VERIFIED','MEDIUM','{مساعدة قانونية}','2024-09-20','2026-09-28','2024-10-10'),
('c0000000-0000-4000-8000-000000000004','fatima-zahra','a0000000-0000-4000-8000-000000000004','قضية فاطمة الزهراء','انقطع التواصل معها منذ أغسطس 2024، وتبحث أسرتها عن أي معلومة قد تساعد في معرفة مكانها.','فاطمة طالبة دراسات عليا، آخر تواصل معروف معها كان في أغسطس 2024.','آخر تواصل معروف كان في 8 أغسطس 2024.','بحسب أصدقائها، كانت تخطط للسفر.','لم نتمكن من التحقق من أي معلومة حول مكانها الحالي.','المغرب','فقدان تواصل','MISSING','مفقودة منذ أغسطس 2024','PUBLISHED','UNDER_VERIFICATION','HIGH','{معلومة,مصدر}','2024-08-08','2026-09-25','2024-09-01'),
('c0000000-0000-4000-8000-000000000005','khaled-said','a0000000-0000-4000-8000-000000000005','قضية خالد سعيد','أُفرج عنه في 2026 بعد احتجاز دام عدة أشهر، وتبقى القضية موثقة لحفظ ما جرى.','خالد صحفي مستقل، احتُجز عدة أشهر ثم أُفرج عنه.','احتُجز في يناير 2025.
أُفرج عنه في فبراير 2026.','بحسب نقابة الصحفيين، كان احتجازه مرتبطًا بعمله.','—','تونس','اعتقال','RELEASED','أُفرج عنه في فبراير 2026','PUBLISHED','VERIFIED','LOW','{تحديث}','2025-01-15','2026-09-20','2025-02-01'),
('c0000000-0000-4000-8000-000000000006','salma-khaled','a0000000-0000-4000-8000-000000000006','قضية سلمى خالد','فُقد أثرها في 2023، ولا تزال أسرتها تنتظر أي خبر عنها.','سلمى شابة في العشرينات، فُقد أثرها خلال تنقّلها بين مدينتين.','آخر ظهور معروف كان في ديسمبر 2023.','بحسب شاهد، شوهدت عند نقطة تفتيش.','لم نتمكن من التحقق من رواية الشاهد.','سوريا','اختفاء','MISSING','مفقودة منذ ديسمبر 2023','PUBLISHED','LIMITED_INFORMATION','CRITICAL','{معلومة,مصدر,تحقق}','2023-12-10','2026-09-18','2024-01-15'),
('c0000000-0000-4000-8000-000000000007','omar-ibrahim','a0000000-0000-4000-8000-000000000007','قضية عمر إبراهيم','بحسب المصادر المتاحة، احتُجز في أغسطس 2025، ولم تتمكن أسرته من التواصل معه منذ ذلك الحين.','عمر طبيب عمل في مستشفى ميداني.','احتُجز في 8 أغسطس 2025.','بحسب منظمة دولية، طُلب الإفراج عنه.','لم نتمكن من التحقق من مكان احتجازه.','اليمن','اعتقال','DETAINED','معتقل منذ أغسطس 2025','PUBLISHED','SOURCE_ONE','HIGH','{مصدر,مساعدة قانونية}','2025-08-08','2026-10-02','2025-09-01'),
('c0000000-0000-4000-8000-000000000008','maryam-hassan','a0000000-0000-4000-8000-000000000008','قضية مريم حسن','طالبة جامعية اعتُقلت في 2025، وتتابع أسرتها جلسات قضيتها.','مريم طالبة في كلية الآداب.','اعتُقلت في 2 فبراير 2025.','بحسب محاميها، مُدد احتجازها.','—','فلسطين','اعتقال','DETAINED','معتقلة منذ فبراير 2025','PUBLISHED','VERIFIED','HIGH','{ترجمة,تحديث}','2025-02-02','2026-10-01','2025-03-01'),
('c0000000-0000-4000-8000-000000000009','salman-ali','a0000000-0000-4000-8000-000000000009','قضية سلمان علي','معلومات أولية تخضع للمراجعة.','—',null,null,null,'العراق','فقدان تواصل','UNKNOWN','غير معروف','PENDING_REVIEW','UNDER_VERIFICATION','MEDIUM','{معلومة}','2025-06-01','2026-09-10',null),
('c0000000-0000-4000-8000-000000000010','nour-alhuda','a0000000-0000-4000-8000-000000000010','قضية نور الهدى','مسودة قضية جديدة بانتظار استكمال المعلومات.','—',null,null,null,'الأردن','أخرى','OTHER','—','DRAFT','LIMITED_INFORMATION','LOW','{مصدر}',null,'2026-09-05',null);
select setval('public.case_number_seq', 10);

insert into public.sources(case_id, name, type, url, publication_date, reliability, notes) values
('c0000000-0000-4000-8000-000000000001','منظمة حقوقية محلية','NGO','https://example.org/report-1','2025-03-20','HIGH','تقرير موثق بشهادات'),
('c0000000-0000-4000-8000-000000000001','بيان رسمي','OFFICIAL',null,'2025-04-02','MEDIUM','بيان مقتضب'),
('c0000000-0000-4000-8000-000000000001','أسرة الشخص','FAMILY',null,'2025-03-13','MEDIUM','شهادة مباشرة'),
('c0000000-0000-4000-8000-000000000002','صحيفة إقليمية','MEDIA','https://example.org/news-2','2024-05-10','MEDIUM','تقرير صحفي'),
('c0000000-0000-4000-8000-000000000002','شاهد عيان','WITNESS',null,'2024-05-04','LOW','لم يُتحقق من هويته علنًا'),
('c0000000-0000-4000-8000-000000000003','محامي الأسرة','OTHER',null,'2024-11-01','HIGH','إفادة قانونية'),
('c0000000-0000-4000-8000-000000000003','منظمة حقوقية دولية','NGO','https://example.org/report-3','2025-01-15','HIGH',null),
('c0000000-0000-4000-8000-000000000003','وثيقة محكمة','DOCUMENT',null,'2025-02-10','HIGH','نسخة مراجعة'),
('c0000000-0000-4000-8000-000000000004','أصدقاء الشخص','WITNESS',null,'2024-08-20','LOW',null),
('c0000000-0000-4000-8000-000000000004','موقع إخباري','MEDIA','https://example.org/news-4','2024-09-02','MEDIUM',null),
('c0000000-0000-4000-8000-000000000005','نقابة الصحفيين','NGO','https://example.org/union','2025-01-20','HIGH',null),
('c0000000-0000-4000-8000-000000000005','بيان الإفراج','OFFICIAL',null,'2026-02-11','HIGH',null),
('c0000000-0000-4000-8000-000000000006','شاهد','WITNESS',null,'2024-01-05','LOW','رواية غير مؤكدة'),
('c0000000-0000-4000-8000-000000000006','أسرة الشخص','FAMILY',null,'2023-12-15','MEDIUM',null),
('c0000000-0000-4000-8000-000000000007','منظمة دولية','NGO','https://example.org/report-7','2025-08-25','HIGH',null),
('c0000000-0000-4000-8000-000000000007','زملاء العمل','WITNESS',null,'2025-08-10','MEDIUM',null),
('c0000000-0000-4000-8000-000000000008','محامي الدفاع','OTHER',null,'2025-06-01','HIGH',null),
('c0000000-0000-4000-8000-000000000008','وكالة أنباء','MEDIA','https://example.org/news-8','2025-02-05','MEDIUM',null),
('c0000000-0000-4000-8000-000000000008','منظمة طلابية','NGO',null,'2025-02-20','MEDIUM',null),
('c0000000-0000-4000-8000-000000000009','رسالة من قريب','FAMILY',null,'2025-06-10','LOW','قيد المراجعة');

insert into public.case_updates(case_id, title, update_type, summary, verification_status, is_published, created_at, published_at) values
('c0000000-0000-4000-8000-000000000001','إضافة مصدر جديد','مصدر جديد','أُضيف تقرير من منظمة حقوقية يوثّق ظروف التوقيف.','VERIFIED',true,'2026-10-04','2026-10-04'),
('c0000000-0000-4000-8000-000000000001','تحديث حول الزيارات','تحديث','أفادت الأسرة بأنها لم تتمكن من الزيارة حتى الآن.','SOURCE_ONE',true,'2026-08-15','2026-08-15'),
('c0000000-0000-4000-8000-000000000002','تحديث حالة','تغيّر الحالة','ورد ما يفيد بنقلها إلى مكان احتجاز آخر.','UNDER_VERIFICATION',true,'2026-09-30','2026-09-30'),
('c0000000-0000-4000-8000-000000000002','طلب معلومات','طلب معلومة','تحتاج القضية إلى مصادر إضافية حول مكان الاحتجاز.','LIMITED_INFORMATION',true,'2026-07-01','2026-07-01'),
('c0000000-0000-4000-8000-000000000003','تأجيل جلسة','تحديث قانوني','تأجلت جلسة النظر في القضية إلى موعد لاحق.','VERIFIED',true,'2026-09-28','2026-09-28'),
('c0000000-0000-4000-8000-000000000003','مراجعة وثيقة','مراجعة','تمت مراجعة وثيقة قضائية والتحقق منها.','VERIFIED',true,'2026-06-10','2026-06-10'),
('c0000000-0000-4000-8000-000000000004','شهادة جديدة','شهادة','وردت شهادة من صديقة تخضع للتحقق.','UNDER_VERIFICATION',true,'2026-09-25','2026-09-25'),
('c0000000-0000-4000-8000-000000000005','الإفراج','تغيّر الحالة','أُفرج عنه بعد احتجاز دام نحو عام.','VERIFIED',true,'2026-02-12','2026-02-12'),
('c0000000-0000-4000-8000-000000000005','تحديث ختامي','تحديث','عاد إلى أسرته ويتابع حياته.','SOURCE_ONE',true,'2026-09-20','2026-09-20'),
('c0000000-0000-4000-8000-000000000006','لا تحديثات جديدة','طلب معلومة','مرّت مدة طويلة دون معلومات جديدة؛ أي معلومة قد تساعد.','LIMITED_INFORMATION',true,'2026-09-18','2026-09-18'),
('c0000000-0000-4000-8000-000000000007','مطالبة دولية','مصدر جديد','طالبت منظمة دولية بالكشف عن مكان احتجازه.','SOURCE_ONE',true,'2026-10-02','2026-10-02'),
('c0000000-0000-4000-8000-000000000008','تمديد الاحتجاز','تحديث قانوني','مُدد احتجازها بحسب محاميها.','VERIFIED',true,'2026-10-01','2026-10-01'),
('c0000000-0000-4000-8000-000000000008','طلب ترجمة','طلب مساعدة','تحتاج وثائق القضية إلى ترجمة للإنجليزية.','VERIFIED',true,'2026-08-01','2026-08-01'),
('c0000000-0000-4000-8000-000000000007','ملاحظة داخلية','داخلي','ملاحظة للمراجعين فقط.','UNDER_VERIFICATION',false,'2026-09-01',null),
('c0000000-0000-4000-8000-000000000009','معلومة أولية','تحديث','بانتظار المراجعة.','UNDER_VERIFICATION',false,'2026-09-10',null);

insert into public.timeline_events(case_id, event_date, title, description, verification_status) values
('c0000000-0000-4000-8000-000000000001','2025-03-12','بداية الحالة','تم توقيفه بحسب الأسرة ومصدر حقوقي.','VERIFIED'),
('c0000000-0000-4000-8000-000000000001','2025-03-20','ورد مصدر جديد','تقرير منظمة حقوقية محلية.','VERIFIED'),
('c0000000-0000-4000-8000-000000000001','2025-05-05','تمت مراجعة المصدر','راجع فريق التحقق التقرير.','VERIFIED'),
('c0000000-0000-4000-8000-000000000001','2026-10-04','آخر تحديث','إضافة مصدر جديد.','VERIFIED'),
('c0000000-0000-4000-8000-000000000002','2024-05-03','بداية الحالة','توقيفها بحسب مصدر إعلامي.','SOURCE_ONE'),
('c0000000-0000-4000-8000-000000000002','2026-09-30','نقل محتمل','معلومة قيد التحقق.','UNDER_VERIFICATION'),
('c0000000-0000-4000-8000-000000000003','2024-09-20','بداية الحالة','الاعتقال.','VERIFIED'),
('c0000000-0000-4000-8000-000000000003','2025-02-10','جلسة أولى','عرض على جهة قضائية.','VERIFIED'),
('c0000000-0000-4000-8000-000000000004','2024-08-08','آخر تواصل','آخر تواصل معروف.','UNDER_VERIFICATION'),
('c0000000-0000-4000-8000-000000000005','2025-01-15','الاحتجاز','بداية الاحتجاز.','VERIFIED'),
('c0000000-0000-4000-8000-000000000005','2026-02-11','الإفراج','أُفرج عنه.','VERIFIED'),
('c0000000-0000-4000-8000-000000000006','2023-12-10','آخر ظهور','آخر ظهور معروف.','LIMITED_INFORMATION'),
('c0000000-0000-4000-8000-000000000007','2025-08-08','بداية الحالة','الاحتجاز.','SOURCE_ONE'),
('c0000000-0000-4000-8000-000000000008','2025-02-02','بداية الحالة','الاعتقال.','VERIFIED'),
('c0000000-0000-4000-8000-000000000008','2026-10-01','تمديد الاحتجاز','بحسب المحامي.','VERIFIED');

insert into public.help_actions(case_id, type, title, description) values
('c0000000-0000-4000-8000-000000000001','info','أدلي بمعلومة','إن كانت لديك معلومة موثوقة عن مكان احتجازه.'),
('c0000000-0000-4000-8000-000000000001','legal','ساعد في الوصول إلى جهة قانونية','تحتاج الأسرة إلى محامٍ متخصص.'),
('c0000000-0000-4000-8000-000000000003','legal','مساعدة قانونية','متابعة الجلسات المؤجلة.'),
('c0000000-0000-4000-8000-000000000006','verify','ساعد في التحقق','التحقق من رواية الشاهد.'),
('c0000000-0000-4000-8000-000000000008','translate','ساعد في الترجمة','ترجمة الوثائق إلى الإنجليزية.');

insert into public.submissions(case_id, submission_type, content, source_description, submitter_name, submitter_email, risk_answer, status, created_at) values
('c0000000-0000-4000-8000-000000000001','EXISTING_CASE','سمعت من قريب أنه نُقل مؤخرًا.','قريب للعائلة',null,null,'UNSURE','PENDING','2026-10-02'),
('c0000000-0000-4000-8000-000000000002','SOURCE','رابط تقرير جديد عن القضية.','موقع إخباري','سارة','sara@example.com','NO','UNDER_REVIEW','2026-09-30'),
('c0000000-0000-4000-8000-000000000003','DOCUMENT','صورة من قرار تأجيل الجلسة.','المحامي',null,null,'NO','APPROVED','2026-09-28'),
('c0000000-0000-4000-8000-000000000004','UPDATE','قد تكون شوهدت في مدينة أخرى.','شاهد',null,null,'YES','NEEDS_MORE_INFO','2026-09-25'),
(null,'NEW_CASE','أخي انقطع التواصل معه منذ شهرين.','الأسرة','محمد','m@example.com','YES','PENDING','2026-09-22'),
('c0000000-0000-4000-8000-000000000006','CORRECTION','تاريخ آخر ظهور غير دقيق.','صديقة',null,null,'NO','REJECTED','2026-09-20'),
('c0000000-0000-4000-8000-000000000007','SOURCE','بيان جديد لمنظمة.','منظمة',null,null,'NO','PUBLISHED','2026-09-18'),
('c0000000-0000-4000-8000-000000000008','EXISTING_CASE','موعد الجلسة القادمة.','المحامي',null,null,'NO','PENDING','2026-10-03'),
(null,'NEW_CASE','حالة اعتقال لطالب.','زميل',null,null,'UNSURE','PENDING','2026-10-01'),
('c0000000-0000-4000-8000-000000000005','UPDATE','عاد إلى عمله.','صديق',null,null,'NO','UNDER_REVIEW','2026-09-15');

insert into public.reports(case_id, report_type, description, reporter_email, status, created_at) values
('c0000000-0000-4000-8000-000000000002','WRONG_INFO','تاريخ التوقيف غير دقيق.',null,'NEW','2026-10-03'),
('c0000000-0000-4000-8000-000000000004','SENSITIVE_INFO','الملخص يحتوي اسم مدينة حساس.','x@example.com','IN_REVIEW','2026-09-30'),
('c0000000-0000-4000-8000-000000000001','CORRECTION','يرجى تحديث المهنة.',null,'NEW','2026-09-28'),
('c0000000-0000-4000-8000-000000000006','DELETION','طلب من الأسرة بحذف الصورة.',null,'IN_REVIEW','2026-09-25'),
('c0000000-0000-4000-8000-000000000005','OTHER','رابط المصدر لا يعمل.',null,'CLOSED','2026-09-02');
