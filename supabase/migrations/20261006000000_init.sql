-- BloomDesk · first slice: schools, members, classes, children, attendance.
-- Every row belongs to one school. Row level security lets a signed-in user see
-- only the schools they are a member of. New schools are created through the
-- create_school() function so the creator becomes the owner in one step.

-- ---------- Types ----------
create type public.member_role as enum ('owner', 'admin', 'teacher', 'parent');
create type public.class_level as enum ('playgroup', 'nursery', 'lkg', 'ukg', 'daycare', 'other');
create type public.attendance_status as enum ('present', 'absent', 'late', 'leave');

-- ---------- Tables ----------
create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 2 and 120),
  city text,
  phone text,
  timezone text not null default 'Asia/Kolkata',
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create table public.school_members (
  school_id uuid not null references public.schools (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null,
  full_name text,
  created_at timestamptz not null default now(),
  primary key (school_id, user_id)
);
create index school_members_user_idx on public.school_members (user_id);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 60),
  level public.class_level not null default 'other',
  capacity int check (capacity is null or capacity between 1 and 500),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (school_id, name),
  unique (id, school_id)
);

create table public.children (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  class_id uuid,
  full_name text not null check (length(btrim(full_name)) between 1 and 120),
  date_of_birth date,
  gender text check (gender in ('girl', 'boy', 'other')),
  parent_name text,
  parent_phone text check (parent_phone is null or parent_phone ~ '^[6-9][0-9]{9}$'),
  joined_on date not null default current_date,
  status text not null default 'active' check (status in ('active', 'left')),
  notes text,
  created_at timestamptz not null default now(),
  unique (id, school_id),
  -- A child's class must belong to the same school.
  foreign key (class_id, school_id) references public.classes (id, school_id) on delete set null (class_id)
);
create index children_school_class_idx on public.children (school_id, class_id);

create table public.attendance (
  child_id uuid not null,
  school_id uuid not null,
  date date not null,
  status public.attendance_status not null,
  class_id uuid,
  note text,
  marked_by uuid references auth.users (id) on delete set null default auth.uid(),
  marked_at timestamptz not null default now(),
  primary key (child_id, date),
  foreign key (child_id, school_id) references public.children (id, school_id) on delete cascade,
  foreign key (class_id, school_id) references public.classes (id, school_id) on delete set null (class_id)
);
create index attendance_school_date_idx on public.attendance (school_id, date);

-- ---------- Helpers ----------
-- True when the signed-in user holds one of the roles in the school.
-- security definer so policies can read school_members without recursing into its own policy.
create function public.has_school_role(p_school uuid, p_roles public.member_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.school_members m
    where m.school_id = p_school
      and m.user_id = (select auth.uid())
      and m.role = any (p_roles)
  );
$$;

create function public.is_school_staff(p_school uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_school_role(p_school, array['owner', 'admin', 'teacher']::public.member_role[]);
$$;

create function public.is_school_admin(p_school uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_school_role(p_school, array['owner', 'admin']::public.member_role[]);
$$;

-- Creates a school and makes the caller its owner. Optionally adds the usual four classes.
create function public.create_school(
  p_name text,
  p_city text default null,
  p_owner_name text default null,
  p_add_default_classes boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_school uuid;
begin
  if v_user is null then
    raise exception 'You need to be signed in to create a school.' using errcode = '42501';
  end if;

  insert into public.schools (name, city, created_by)
  values (btrim(p_name), nullif(btrim(coalesce(p_city, '')), ''), v_user)
  returning id into v_school;

  insert into public.school_members (school_id, user_id, role, full_name)
  values (v_school, v_user, 'owner', nullif(btrim(coalesce(p_owner_name, '')), ''));

  if p_add_default_classes then
    insert into public.classes (school_id, name, level, sort_order) values
      (v_school, 'Playgroup', 'playgroup', 1),
      (v_school, 'Nursery', 'nursery', 2),
      (v_school, 'LKG', 'lkg', 3),
      (v_school, 'UKG', 'ukg', 4);
  end if;

  return v_school;
end;
$$;

revoke execute on function public.has_school_role(uuid, public.member_role[]) from public, anon;
revoke execute on function public.is_school_staff(uuid) from public, anon;
revoke execute on function public.is_school_admin(uuid) from public, anon;
revoke execute on function public.create_school(text, text, text, boolean) from public, anon;
grant execute on function public.has_school_role(uuid, public.member_role[]) to authenticated;
grant execute on function public.is_school_staff(uuid) to authenticated;
grant execute on function public.is_school_admin(uuid) to authenticated;
grant execute on function public.create_school(text, text, text, boolean) to authenticated;

-- ---------- Row level security ----------
alter table public.schools enable row level security;
alter table public.school_members enable row level security;
alter table public.classes enable row level security;
alter table public.children enable row level security;
alter table public.attendance enable row level security;

-- Schools: members can read; owners and admins can edit. Created only through create_school().
create policy "members read their school" on public.schools
  for select to authenticated using (public.has_school_role(id, array['owner', 'admin', 'teacher', 'parent']::public.member_role[]));
create policy "admins update their school" on public.schools
  for update to authenticated using (public.is_school_admin(id)) with check (public.is_school_admin(id));

-- Members: you can see your own memberships, and staff can see everyone in their school.
-- Inviting and removing people comes later through dedicated functions.
create policy "read own or same-school memberships" on public.school_members
  for select to authenticated using (user_id = (select auth.uid()) or public.is_school_staff(school_id));

-- Classes: staff read, owners and admins manage.
create policy "staff read classes" on public.classes
  for select to authenticated using (public.is_school_staff(school_id));
create policy "admins add classes" on public.classes
  for insert to authenticated with check (public.is_school_admin(school_id));
create policy "admins edit classes" on public.classes
  for update to authenticated using (public.is_school_admin(school_id)) with check (public.is_school_admin(school_id));
create policy "admins delete classes" on public.classes
  for delete to authenticated using (public.is_school_admin(school_id));

-- Children: staff read, owners and admins manage.
create policy "staff read children" on public.children
  for select to authenticated using (public.is_school_staff(school_id));
create policy "admins add children" on public.children
  for insert to authenticated with check (public.is_school_admin(school_id));
create policy "admins edit children" on public.children
  for update to authenticated using (public.is_school_admin(school_id)) with check (public.is_school_admin(school_id));
create policy "admins delete children" on public.children
  for delete to authenticated using (public.is_school_admin(school_id));

-- Attendance: all staff (including teachers) read and mark; owners and admins can delete.
create policy "staff read attendance" on public.attendance
  for select to authenticated using (public.is_school_staff(school_id));
create policy "staff mark attendance" on public.attendance
  for insert to authenticated with check (public.is_school_staff(school_id));
create policy "staff change attendance" on public.attendance
  for update to authenticated using (public.is_school_staff(school_id)) with check (public.is_school_staff(school_id));
create policy "admins delete attendance" on public.attendance
  for delete to authenticated using (public.is_school_admin(school_id));
