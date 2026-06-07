/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const SUPABASE_SQL_SCHEMA = `-- ============================================================================
-- PERMISO: STUDENTS PERMISSION & ABSENCE MANAGEMENT DATABASE SCHEMA (SUPABASE)
-- ============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create ENUM types for status and roles
create type user_role as enum ('admin', 'teacher', 'student');
create type attendance_status as enum ('present', 'absent', 'late');
create type leave_type as enum ('sickness', 'compassionate', 'family_activity', 'school_duty', 'other');
create type leave_status as enum ('pending', 'approved', 'rejected');

-- 1. DEPARTMENTS TABLE
create table public.departments (
    id uuid default gen_random_uuid() primary key,
    department_name text not null unique,
    description text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. USERS TABLE (Linked with Supabase Auth auth.users via foreign key trigger)
create table public.users (
    id uuid references auth.users on delete cascade primary key,
    fullname text not null,
    email text not null unique,
    role user_role not null default 'student',
    avatar_url text,
    phone text,
    status text not null check (status in ('active', 'inactive')) default 'active',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. TEACHERS TABLE
create table public.teachers (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade not null unique,
    department_id uuid references public.departments(id) on delete set null,
    specialization text
);

-- 4. CLASSES TABLE
create table public.classes (
    id uuid default gen_random_uuid() primary key,
    class_name text not null,
    department_id uuid references public.departments(id) on delete cascade not null,
    advisor_teacher_id uuid references public.users(id) on delete set null,
    academic_year text not null,
    unique (class_name, academic_year)
);

-- 5. STUDENTS TABLE
create table public.students (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade not null unique,
    student_id text not null unique, -- school numerical registration number
    class_id uuid references public.classes(id) on delete set null,
    department_id uuid references public.departments(id) on delete set null,
    enrollment_year integer not null,
    status text not null check (status in ('active', 'suspended', 'graduated')) default 'active'
);

-- 6. ATTENDANCE TABLE
create table public.attendance (
    id uuid default gen_random_uuid() primary key,
    student_id uuid references public.users(id) on delete cascade not null, -- points to student's user_id
    class_id uuid references public.classes(id) on delete cascade not null,
    attendance_date date not null default current_date,
    status attendance_status not null default 'present',
    checked_by uuid references public.users(id) on delete set null, -- teacher user_id
    remarks text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (student_id, class_id, attendance_date)
);

-- 7. PERMISSION_REQUESTS TABLE
create table public.permission_requests (
    id uuid default gen_random_uuid() primary key,
    student_id uuid references public.users(id) on delete cascade not null, -- points to student user_id
    request_type leave_type not null,
    reason text not null,
    attachment_url text, -- Supabase storage URL for uploaded files
    start_date date not null,
    end_date date not null,
    status leave_status not null default 'pending',
    approved_by uuid references public.users(id) on delete set null, -- approving teacher user_id
    rejection_reason text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    check (start_date <= end_date)
);

-- 8. NOTIFICATIONS TABLE
create table public.notifications (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    title text not null,
    message text not null,
    type text not null check (type in ('info', 'success', 'warning', 'alert')) default 'info',
    is_read boolean default false not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. ACTIVITY_LOGS TABLE
create table public.activity_logs (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete set null,
    action text not null,
    description text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- PERFORMANCE OPTIMIZING INDEXES
-- ============================================================================
create index idx_attendance_date_student on public.attendance (attendance_date, student_id);
create index idx_attendance_class on public.attendance (class_id);
create index idx_permission_student on public.permission_requests (student_id);
create index idx_permission_status on public.permission_requests (status);
create index idx_notifications_user_read on public.notifications (user_id, is_read);
create index idx_students_class on public.students (class_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.departments enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.teachers enable row level security;
alter table public.attendance enable row level security;
alter table public.permission_requests enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_logs enable row level security;

-- USERS POLICIES
create policy "Allow public read access to active users"
    on public.users for select
    using (true);

create policy "Allow admins and owners to update user records"
    on public.users for update
    using (auth.uid() = id or exists (
        select 1 from public.users where id = auth.uid() and role = 'admin'
    ));

-- DEPARTMENTS & CLASSES POLICIES (Read for all authenticated, write for admin only)
create policy "Allow read access to all logged in users"
    on public.departments for select using (auth.role() = 'authenticated');

create policy "Allow write access to admins only"
    on public.departments for all using (
        exists (select 1 from public.users where id = auth.uid() and role = 'admin')
    );

create policy "Allow read access to classes for all users"
    on public.classes for select using (auth.role() = 'authenticated');

create policy "Allow class edits for admins"
    on public.classes for all using (
        exists (select 1 from public.users where id = auth.uid() and role = 'admin')
    );

-- ATTENDANCE POLICIES
create policy "Allow teachers/admins to perform all attendance actions"
    on public.attendance for all using (
        exists (select 1 from public.users where id = auth.uid() and role in ('teacher', 'admin'))
    );

create policy "Students can view their own attendance records"
    on public.attendance for select using (
        auth.uid() = student_id
    );

-- PERMISSION REQUEST POLICIES
create policy "Students can insert permission requests"
    on public.permission_requests for insert
    with check (auth.uid() = student_id);

create policy "Students can view their own requests and linked parents can too"
    on public.permission_requests for select using (
        auth.uid() = student_id
    );

create policy "Teachers and Admins can view and update permission requests"
    on public.permission_requests for all using (
        exists (select 1 from public.users where id = auth.uid() and role in ('teacher', 'admin'))
    );

-- NOTIFICATIONS POLICIES
create policy "Users can view and update their own notifications"
    on public.notifications for select using (auth.uid() = user_id);

create policy "Users can update their own notification read status"
    on public.notifications for update using (auth.uid() = user_id);

-- ============================================================================
-- HELPER TRIGGERS & FUNCTIONS
-- ============================================================================

-- Function to handle public.users registration on auth.users sign-up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, fullname, email, role, avatar_url, phone, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'fullname', 'New User'),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'student'::user_role),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'phone',
    'active'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create user on auth sign up
-- create trigger on_auth_user_created
--   after insert on auth.users
--   for each row execute procedure public.handle_new_user();

-- Trigger for public.users updated_at field update
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_users_updated_at
  before update on public.users
  for each row execute procedure public.handle_updated_at();

-- ============================================================================
-- STORAGE BUCKETS CONFIGURATION (Supabase Storage)
-- ============================================================================
-- Insert statement to initialize the bucket "attachments"
-- insert into storage.buckets (id, name, public) values ('attachments', 'attachments', true);

-- Storage security policies
-- create policy "Allow public viewing of attachments"
--   on storage.objects for select using (bucket_id = 'attachments');

-- create policy "Allow authenticated users to upload attachments"
--   on storage.objects for insert with check (
--     bucket_id = 'attachments' and auth.role() = 'authenticated'
--   );
`;
