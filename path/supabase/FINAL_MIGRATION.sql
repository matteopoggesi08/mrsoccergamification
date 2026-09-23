-- LEGACY COMPATIBILITY ENTRY POINT
-- Use supabase/MASTER_FINAL.sql instead. This file intentionally contains
-- the same safe reconciliation script and never manages auth.users triggers.
-- ============================================================
-- SOCCERMRGAMIFICATION - SUPABASE MASTER RECONCILIATION
-- Safe for an existing database: does NOT DROP, TRUNCATE or DELETE
-- existing business data.
--
-- This script:
--   1. Creates missing base objects.
--   2. Adds missing v3/v4/v5 columns and tables.
--   3. Rebuilds authorization functions and RLS policies.
--   4. Rebuilds views AFTER all columns exist.
--   5. Rebuilds audit triggers.
--
-- IMPORTANT: run this whole file as one query in Supabase SQL Editor.
-- ============================================================
create extension if not exists pgcrypto;



do $enum$
begin
  if not exists (select 1 from pg_type where typname = 'season_role') then
    create type public.season_role as enum('OWNER','COLLABORATOR','CAPTAIN');
  end if;
end;
$enum$;
do $enum$
begin
  if not exists (select 1 from pg_type where typname = 'member_status') then
    create type public.member_status as enum('PENDING','ACTIVE','REJECTED','REMOVED');
  end if;
end;
$enum$;
do $enum$
begin
  if not exists (select 1 from pg_type where typname = 'session_type') then
    create type public.session_type as enum('TRAINING','MATCH');
  end if;
end;
$enum$;
do $enum$
begin
  if not exists (select 1 from pg_type where typname = 'attendance_status') then
    create type public.attendance_status as enum('PRESENT','ABSENT');
  end if;
end;
$enum$;
do $enum$
begin
  if not exists (select 1 from pg_type where typname = 'absence_reason') then
    create type public.absence_reason as enum('INJURED','OTHER','UNJUSTIFIED');
  end if;
end;
$enum$;
do $enum$
begin
  if not exists (select 1 from pg_type where typname = 'match_location') then
    create type public.match_location as enum('HOME','AWAY');
  end if;
end;
$enum$;
do $enum$
begin
  if not exists (select 1 from pg_type where typname = 'callup_status') then
    create type public.callup_status as enum('CALLED_UP','SUSPENDED','INJURED','TECHNICAL_CHOICE','OTHER');
  end if;
end;
$enum$;
do $enum$
begin
  if not exists (select 1 from pg_type where typname = 'game_team') then
    create type public.game_team as enum('A','B');
  end if;
end;
$enum$;
do $enum$
begin
  if not exists (select 1 from pg_type where typname = 'fine_status') then
    create type public.fine_status as enum('OPEN','PARTIALLY_PAID','PAID','CANCELLED');
  end if;
end;
$enum$;


create extension if not exists pgcrypto;










create table if not exists profiles(id uuid primary key references auth.users(id) on delete cascade,email text,full_name text,avatar_url text,created_at timestamptz default now());
create table if not exists seasons(id uuid primary key default gen_random_uuid(),owner_id uuid not null references profiles(id),name text not null,team_name text not null,sporting_year text not null,access_code text unique not null,created_at timestamptz default now(),updated_at timestamptz default now());
create table if not exists season_members(id uuid primary key default gen_random_uuid(),season_id uuid references seasons(id) on delete cascade,user_id uuid references profiles(id) on delete cascade,role season_role not null,status member_status default 'PENDING',permissions jsonb default '{}'::jsonb,created_at timestamptz default now(),accepted_at timestamptz,unique(season_id,user_id));
create table if not exists season_access_requests(id uuid primary key default gen_random_uuid(),season_id uuid references seasons(id) on delete cascade,requester_id uuid references profiles(id) on delete cascade,status member_status default 'PENDING',requested_at timestamptz default now(),resolved_at timestamptz,resolved_by uuid references profiles(id));
create table if not exists players(id uuid primary key default gen_random_uuid(),season_id uuid references seasons(id) on delete cascade,first_name text not null,last_name text not null,shirt_number int,position text,notes text,status text default 'ACTIVE',created_at timestamptz default now(),archived_at timestamptz);
create table if not exists sessions(id uuid primary key default gen_random_uuid(),season_id uuid references seasons(id) on delete cascade,session_date date not null,session_type session_type not null,title text,notes text,created_by uuid references profiles(id),created_at timestamptz default now(),updated_at timestamptz default now());
create table if not exists matches(id uuid primary key default gen_random_uuid(),session_id uuid unique references sessions(id) on delete cascade,opponent text not null,venue match_location not null,home_score int,away_score int,notes text,created_at timestamptz default now());
create table if not exists match_callups(id uuid primary key default gen_random_uuid(),match_id uuid references matches(id) on delete cascade,player_id uuid references players(id) on delete cascade,status callup_status not null,notes text,unique(match_id,player_id));
create table if not exists match_player_stats(id uuid primary key default gen_random_uuid(),match_id uuid references matches(id) on delete cascade,player_id uuid references players(id) on delete cascade,started boolean default false,minutes_played int default 0,rpe numeric(3,1),unique(match_id,player_id));
create table if not exists match_events(id uuid primary key default gen_random_uuid(),match_id uuid references matches(id) on delete cascade,player_id uuid references players(id) on delete set null,event_type text not null,minute int,metadata jsonb default '{}'::jsonb,created_at timestamptz default now());
create table if not exists attendance_records(id uuid primary key default gen_random_uuid(),session_id uuid references sessions(id) on delete cascade,player_id uuid references players(id) on delete cascade,status attendance_status not null,absence_reason absence_reason,unique(session_id,player_id));
create table if not exists player_session_loads(id uuid primary key default gen_random_uuid(),session_id uuid references sessions(id) on delete cascade,player_id uuid references players(id) on delete cascade,rpe numeric(3,1),duration_minutes int default 90,load numeric generated always as(case when rpe is not null then rpe*duration_minutes else null end) stored,unique(session_id,player_id));
create table if not exists training_games(id uuid primary key default gen_random_uuid(),session_id uuid references sessions(id) on delete cascade,name text default 'Partitella',team_a_score int default 0,team_b_score int default 0,created_at timestamptz default now());
create table if not exists training_game_players(id uuid primary key default gen_random_uuid(),training_game_id uuid references training_games(id) on delete cascade,player_id uuid references players(id) on delete cascade,team game_team not null,unique(training_game_id,player_id));
create table if not exists training_game_goals(id uuid primary key default gen_random_uuid(),training_game_id uuid references training_games(id) on delete cascade,player_id uuid references players(id) on delete set null,team game_team not null,minute int);
create table if not exists leaderboard_penalties(id uuid primary key default gen_random_uuid(),season_id uuid references seasons(id) on delete cascade,player_id uuid references players(id) on delete cascade,points int not null,reason text not null,created_by uuid references profiles(id),created_at timestamptz default now());
create table if not exists fine_types(id uuid primary key default gen_random_uuid(),season_id uuid references seasons(id) on delete cascade,name text not null,default_amount numeric(10,2) not null,active boolean default true);
create table if not exists fines(id uuid primary key default gen_random_uuid(),season_id uuid references seasons(id) on delete cascade,player_id uuid references players(id) on delete cascade,fine_type_id uuid references fine_types(id) on delete set null,amount numeric(10,2) not null,description text,status fine_status default 'OPEN',issued_by uuid references profiles(id),issued_at timestamptz default now());
create table if not exists fine_payments(id uuid primary key default gen_random_uuid(),fine_id uuid references fines(id) on delete cascade,amount numeric(10,2) not null,payment_date date default current_date,recorded_by uuid references profiles(id),notes text);
create table if not exists player_access_tokens(id uuid primary key default gen_random_uuid(),player_id uuid references players(id) on delete cascade,token_hash text unique not null,created_at timestamptz default now(),expires_at timestamptz,revoked_at timestamptz,last_used_at timestamptz);
create table if not exists activity_logs(id uuid primary key default gen_random_uuid(),season_id uuid references seasons(id) on delete cascade,actor_user_id uuid references profiles(id),action text not null,entity_type text,entity_id uuid,metadata jsonb default '{}'::jsonb,created_at timestamptz default now());

create index if not exists players_season on players(season_id);create index if not exists sessions_season_date on sessions(season_id,session_date);create index if not exists loads_player on player_session_loads(player_id,session_id);create index if not exists logs_season on activity_logs(season_id,created_at desc);

create or replace function is_member(s uuid) returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from season_members where season_id=s and user_id=auth.uid() and status='ACTIVE')$$;
create or replace function role_is(s uuid,r season_role[]) returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from season_members where season_id=s and user_id=auth.uid() and status='ACTIVE' and role=any(r))$$;
create or replace function can_do(s uuid,p text) returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from season_members where season_id=s and user_id=auth.uid() and status='ACTIVE' and (role='OWNER' or coalesce((permissions->>p)::boolean,false)))$$;

create or replace function public.new_user() returns trigger
language plpgsql security definer set search_path=public
as $$
begin
  insert into public.profiles(id,email,full_name,avatar_url)
  values(
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    email=excluded.email,
    full_name=coalesce(excluded.full_name,public.profiles.full_name),
    avatar_url=coalesce(excluded.avatar_url,public.profiles.avatar_url);
  return new;
end;
$$;

-- IMPORTANT:
-- The existing public.new_user trigger on auth.users is managed separately.
-- This master intentionally does NOT create, drop, or replace auth_profile.
-- Existing authentication trigger is preserved unchanged.

-- Owner accepts a request and can choose role/permissions.
create or replace function resolve_access(req uuid,new_role season_role,new_permissions jsonb) returns void language plpgsql security definer set search_path=public as $$
declare r season_access_requests; begin select * into r from season_access_requests where id=req for update;
if not role_is(r.season_id,array['OWNER']::season_role[]) then raise exception 'not authorized';end if;
update season_access_requests set status='ACTIVE',resolved_at=now(),resolved_by=auth.uid() where id=req;
insert into season_members(season_id,user_id,role,status,permissions,accepted_at) values(r.season_id,r.requester_id,new_role,'ACTIVE',coalesce(new_permissions,'{}'::jsonb),now())
on conflict(season_id,user_id) do update set role=excluded.role,status='ACTIVE',permissions=excluded.permissions,accepted_at=now();
end$$;

-- Secure player token lookup: only hash is queried, and revoked tokens cannot be used.
create or replace function player_by_token(h text) returns table(player_id uuid,first_name text,last_name text,season_id uuid)
language sql security definer set search_path=public as $$select p.id,p.first_name,p.last_name,p.season_id from player_access_tokens t join players p on p.id=t.player_id where t.token_hash=h and t.revoked_at is null and (t.expires_at is null or t.expires_at>now()) limit 1$$;



-- ============================================================
-- V3/V4/V5 DATA STRUCTURES
-- ============================================================

create table if not exists public.season_settings(
  season_id uuid primary key references public.seasons(id) on delete cascade,
  win_points integer not null default 3,
  draw_points integer not null default 1,
  loss_points integer not null default 0,
  penalty_mode text not null default 'SUBTRACT',
  insight_baseline_days integer not null default 28,
  default_training_duration integer not null default 90,
  updated_at timestamptz not null default now()
);

alter table public.season_settings drop constraint if exists season_settings_penalty_mode_check;
alter table public.season_settings add constraint season_settings_penalty_mode_check
  check (penalty_mode in ('SUBTRACT','IGNORE')) not valid;

alter table public.season_settings drop constraint if exists season_settings_baseline_check;
alter table public.season_settings add constraint season_settings_baseline_check
  check (insight_baseline_days between 7 and 90) not valid;

alter table public.season_settings drop constraint if exists season_settings_duration_check;
alter table public.season_settings add constraint season_settings_duration_check
  check (default_training_duration between 0 and 300) not valid;

insert into public.season_settings(season_id)
select id from public.seasons
on conflict (season_id) do nothing;

create table if not exists public.programmed_absences(
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.programmed_absences drop constraint if exists programmed_absences_dates;
alter table public.programmed_absences add constraint programmed_absences_dates
  check (end_date >= start_date) not valid;

alter table public.match_callups add column if not exists custom_status text;

create table if not exists public.callup_status_options(
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  code text not null,
  label text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(season_id,code)
);

alter table public.fine_types add column if not exists description text;

create table if not exists public.yoyo_ir1_results(
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  test_date date not null,
  distance_m integer not null,
  final_level text,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(season_id,player_id,test_date)
);

alter table public.yoyo_ir1_results drop constraint if exists yoyo_ir1_distance_check;
alter table public.yoyo_ir1_results add constraint yoyo_ir1_distance_check
  check(distance_m between 0 and 10000) not valid;

-- Useful indexes
create index if not exists idx_season_members_user_status on public.season_members(user_id,status);
create index if not exists idx_requests_season_status on public.season_access_requests(season_id,status,requested_at desc);
create index if not exists idx_matches_session on public.matches(session_id);
create index if not exists idx_match_events_match on public.match_events(match_id,minute);
create index if not exists idx_fines_player on public.fines(player_id,issued_at desc);
create index if not exists idx_programmed_absences_season_dates on public.programmed_absences(season_id,start_date,end_date);
create index if not exists idx_programmed_absences_player on public.programmed_absences(player_id,start_date,end_date);
create index if not exists idx_callup_status_options_season on public.callup_status_options(season_id,active,label);
create index if not exists idx_yoyo_ir1_season_date on public.yoyo_ir1_results(season_id,test_date desc);
create index if not exists idx_yoyo_ir1_player_date on public.yoyo_ir1_results(player_id,test_date desc);

-- Missing safety constraints are added as NOT VALID so old data is never rejected.
alter table public.players drop constraint if exists players_shirt_number_check;
alter table public.players add constraint players_shirt_number_check
  check (shirt_number is null or shirt_number between 1 and 99) not valid;

alter table public.player_session_loads drop constraint if exists load_rpe_check;
alter table public.player_session_loads add constraint load_rpe_check
  check (rpe is null or rpe between 1 and 10) not valid;

alter table public.player_session_loads drop constraint if exists load_duration_check;
alter table public.player_session_loads add constraint load_duration_check
  check (duration_minutes between 0 and 300) not valid;

alter table public.match_player_stats drop constraint if exists match_rpe_check;
alter table public.match_player_stats add constraint match_rpe_check
  check (rpe is null or rpe between 1 and 10) not valid;

alter table public.match_player_stats drop constraint if exists match_minutes_check;
alter table public.match_player_stats add constraint match_minutes_check
  check (minutes_played between 0 and 130) not valid;

alter table public.fine_payments drop constraint if exists fine_payment_positive;
alter table public.fine_payments add constraint fine_payment_positive
  check (amount > 0) not valid;



-- ============================================================
-- AUTHORIZATION / BUSINESS FUNCTIONS
-- ============================================================

create or replace function public.is_member(s uuid)
returns boolean
language sql stable security definer set search_path=public
as $fn$
  select exists(
    select 1 from public.seasons se
    where se.id=s and se.owner_id=auth.uid()
  )
  or exists(
    select 1 from public.season_members sm
    where sm.season_id=s and sm.user_id=auth.uid() and sm.status='ACTIVE'
  );
$fn$;

create or replace function public.role_is(s uuid, r season_role[])
returns boolean
language sql stable security definer set search_path=public
as $fn$
  select exists(
    select 1 from public.seasons se
    where se.id=s and se.owner_id=auth.uid() and 'OWNER'::season_role=any(r)
  )
  or exists(
    select 1 from public.season_members sm
    where sm.season_id=s and sm.user_id=auth.uid()
      and sm.status='ACTIVE' and sm.role=any(r)
  );
$fn$;

create or replace function public.can_do(s uuid, p text)
returns boolean
language sql stable security definer set search_path=public
as $fn$
  select exists(
    select 1 from public.seasons se
    where se.id=s and se.owner_id=auth.uid()
  )
  or exists(
    select 1 from public.season_members sm
    where sm.season_id=s and sm.user_id=auth.uid()
      and sm.status='ACTIVE'
      and (
        sm.role='OWNER'
        or coalesce((sm.permissions->>p)::boolean,false)
      )
  );
$fn$;

-- Keep every existing season owner recognized as OWNER.
insert into public.season_members(
  season_id,user_id,role,status,permissions,accepted_at
)
select s.id,s.owner_id,'OWNER'::season_role,'ACTIVE'::member_status,
       jsonb_build_object(
         'players',true,'sessions',true,'attendance',true,'workload',true,
         'games',true,'matches',true,'leaderboard',true,'fines',true,'tests',true,
         'reports',true
       ),
       now()
from public.seasons s
where not exists(
  select 1 from public.season_members sm
  where sm.season_id=s.id and sm.user_id=s.owner_id
);

update public.season_members sm
set permissions = coalesce(sm.permissions,'{}'::jsonb)
  || jsonb_build_object(
      'players',true,'sessions',true,'attendance',true,'workload',true,
      'games',true,'matches',true,'leaderboard',true,'fines',true,'tests',true,
      'reports',true
     )
where sm.role='OWNER';

-- Season settings auto-create.
create or replace function public.ensure_season_settings()
returns trigger
language plpgsql security definer set search_path=public
as $fn$
begin
  insert into public.season_settings(season_id)
  values(new.id)
  on conflict(season_id) do nothing;
  return new;
end;
$fn$;

drop trigger if exists season_settings_after_insert on public.seasons;
create trigger season_settings_after_insert
after insert on public.seasons
for each row execute function public.ensure_season_settings();

-- New Google users -> profile.
create or replace function public.new_user()
returns trigger
language plpgsql security definer set search_path=public
as $fn$
begin
  insert into public.profiles(id,email,full_name,avatar_url)
  values(
    new.id,new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict(id) do update set
    email=excluded.email,
    full_name=coalesce(excluded.full_name,public.profiles.full_name),
    avatar_url=coalesce(excluded.avatar_url,public.profiles.avatar_url);
  return new;
end;
$fn$;

-- Idempotent: remove the trigger if it already exists, then recreate it.

-- Access request resolution.
create or replace function public.resolve_access(
  req uuid,new_role season_role,new_permissions jsonb
)
returns void
language plpgsql security definer set search_path=public
as $fn$
declare r public.season_access_requests%rowtype;
begin
  select * into r from public.season_access_requests where id=req for update;
  if r.id is null then raise exception 'request not found'; end if;
  if not public.role_is(r.season_id,array['OWNER']::season_role[]) then
    raise exception 'not authorized';
  end if;

  update public.season_access_requests
  set status='ACTIVE',resolved_at=now(),resolved_by=auth.uid()
  where id=req;

  insert into public.season_members(
    season_id,user_id,role,status,permissions,accepted_at
  )
  values(
    r.season_id,r.requester_id,new_role,'ACTIVE',
    coalesce(new_permissions,'{}'::jsonb),now()
  )
  on conflict(season_id,user_id) do update set
    role=excluded.role,
    status='ACTIVE',
    permissions=excluded.permissions,
    accepted_at=now();
end;
$fn$;

-- Token lookup and portal.
create or replace function public.player_by_token(h text)
returns table(player_id uuid,first_name text,last_name text,season_id uuid)
language sql security definer set search_path=public
as $fn$
  select p.id,p.first_name,p.last_name,p.season_id
  from public.player_access_tokens t
  join public.players p on p.id=t.player_id
  where t.token_hash=h
    and t.revoked_at is null
    and (t.expires_at is null or t.expires_at>now())
  limit 1;
$fn$;

create or replace function public.touch_player_token(h text)
returns void
language plpgsql security definer set search_path=public
as $fn$
begin
  update public.player_access_tokens
  set last_used_at=now()
  where token_hash=h
    and revoked_at is null
    and (expires_at is null or expires_at>now());
end;
$fn$;

create or replace function public.hard_delete_player(p_id uuid)
returns boolean
language plpgsql security definer set search_path=public
as $fn$
declare sid uuid; n integer;
begin
  select season_id into sid from public.players where id=p_id;
  if sid is null then return false; end if;
  if not exists(select 1 from public.seasons where id=sid and owner_id=auth.uid()) then
    raise exception 'not authorized';
  end if;

  select count(*) into n from public.attendance_records where player_id=p_id;
  n:=n+(select count(*) from public.player_session_loads where player_id=p_id);
  n:=n+(select count(*) from public.match_callups where player_id=p_id);
  n:=n+(select count(*) from public.match_player_stats where player_id=p_id);
  n:=n+(select count(*) from public.match_events where player_id=p_id);
  n:=n+(select count(*) from public.training_game_players where player_id=p_id);
  n:=n+(select count(*) from public.training_game_goals where player_id=p_id);
  n:=n+(select count(*) from public.leaderboard_penalties where player_id=p_id);
  n:=n+(select count(*) from public.fines where player_id=p_id);
  n:=n+(select count(*) from public.player_access_tokens where player_id=p_id);
  n:=n+(select count(*) from public.programmed_absences where player_id=p_id);
  n:=n+(select count(*) from public.yoyo_ir1_results where player_id=p_id);

  if n>0 then return false; end if;
  delete from public.players where id=p_id;
  return true;
end;
$fn$;

create or replace function public.player_portal_data(h text)
returns jsonb
language plpgsql security definer set search_path=public
as $fn$
declare pid uuid; sid uuid; result jsonb;
begin
  select p.id,p.season_id into pid,sid
  from public.player_access_tokens t
  join public.players p on p.id=t.player_id
  where t.token_hash=h and t.revoked_at is null
    and (t.expires_at is null or t.expires_at>now())
  limit 1;

  if pid is null then return null; end if;

  update public.player_access_tokens
  set last_used_at=now()
  where token_hash=h;

  result:=jsonb_build_object(
    'player',(select jsonb_build_object(
      'player_id',p.id,'first_name',p.first_name,'last_name',p.last_name,
      'season_id',p.season_id
    ) from public.players p where p.id=pid),
    'season',(select jsonb_build_object(
      'name',s.name,'team_name',s.team_name,'sporting_year',s.sporting_year
    ) from public.seasons s where s.id=sid),
    'settings',(select jsonb_build_object(
      'insight_baseline_days',ss.insight_baseline_days,
      'default_training_duration',ss.default_training_duration
    ) from public.season_settings ss where ss.season_id=sid),
    'loads',coalesce((
      select jsonb_agg(x order by x.session_date desc)
      from (
        select l.id,l.rpe,l.duration_minutes,l.load,s.session_date,s.session_type
        from public.player_session_loads l
        join public.sessions s on s.id=l.session_id
        where l.player_id=pid
      ) x
    ),'[]'::jsonb),
    'matches',coalesce((
      select jsonb_agg(x order by x.session_date desc)
      from (
        select * from public.player_match_summary where player_id=pid
      ) x
    ),'[]'::jsonb),
    'fines',coalesce((
      select jsonb_agg(x) from (
        select * from public.fine_balances where player_id=pid
      ) x
    ),'[]'::jsonb),
    'attendance',coalesce((
      select jsonb_agg(x order by x.session_date desc)
      from (
        select a.status,a.absence_reason,s.session_date,s.session_type
        from public.attendance_records a
        join public.sessions s on s.id=a.session_id
        where a.player_id=pid
      ) x
    ),'[]'::jsonb),
    'leaderboard',(select to_jsonb(x) from (
      select * from public.training_leaderboard_v3
      where player_id=pid and season_id=sid limit 1
    ) x),
    'yoyo',coalesce((
      select jsonb_agg(x order by x.test_date desc)
      from (
        select id,test_date,distance_m,final_level,notes
        from public.yoyo_ir1_results where player_id=pid
      ) x
    ),'[]'::jsonb)
  );
  return result;
end;
$fn$;

-- Audit trigger.
create or replace function public.audit_row()
returns trigger
language plpgsql security definer set search_path=public
as $fn$
declare sid uuid; eid uuid;
begin
  eid=coalesce(new.id,old.id);

  if TG_TABLE_NAME='seasons' then sid=coalesce(new.id,old.id);
  elsif TG_TABLE_NAME in(
    'players','sessions','leaderboard_penalties','fine_types','fines',
    'season_members','season_access_requests','season_settings',
    'programmed_absences','callup_status_options','yoyo_ir1_results'
  ) then sid=coalesce(new.season_id,old.season_id);
  elsif TG_TABLE_NAME='matches' then
    select s.season_id into sid from public.sessions s
    where s.id=coalesce(new.session_id,old.session_id);
  elsif TG_TABLE_NAME in('match_callups','match_player_stats','match_events') then
    select s.season_id into sid
    from public.matches m join public.sessions s on s.id=m.session_id
    where m.id=coalesce(new.match_id,old.match_id);
  elsif TG_TABLE_NAME in('attendance_records','player_session_loads') then
    select s.season_id into sid from public.sessions s
    where s.id=coalesce(new.session_id,old.session_id);
  elsif TG_TABLE_NAME='training_games' then
    select s.season_id into sid from public.sessions s
    where s.id=coalesce(new.session_id,old.session_id);
  elsif TG_TABLE_NAME in('training_game_players','training_game_goals') then
    select s.season_id into sid
    from public.training_games g join public.sessions s on s.id=g.session_id
    where g.id=coalesce(new.training_game_id,old.training_game_id);
  elsif TG_TABLE_NAME='fine_payments' then
    select f.season_id into sid from public.fines f
    where f.id=coalesce(new.fine_id,old.fine_id);
  elsif TG_TABLE_NAME='player_access_tokens' then
    select p.season_id into sid from public.players p
    where p.id=coalesce(new.player_id,old.player_id);
  elsif TG_TABLE_NAME='activity_logs' then
    return coalesce(new,old);
  end if;

  if sid is not null then
    insert into public.activity_logs(
      season_id,actor_user_id,action,entity_type,entity_id,metadata
    ) values(
      sid,auth.uid(),TG_OP,TG_TABLE_NAME,eid,
      jsonb_build_object('source','database_trigger')
    );
  end if;

  return coalesce(new,old);
end;
$fn$;



-- ============================================================
-- VIEWS
-- ============================================================

create or replace view public.fine_balances with (security_invoker=true) as
select f.*,
       coalesce(sum(fp.amount),0)::numeric as paid,
       greatest(f.amount-coalesce(sum(fp.amount),0),0)::numeric as residual
from public.fines f
left join public.fine_payments fp on fp.fine_id=f.id
group by f.id;

create or replace view public.training_leaderboard_v3 with (security_invoker=true) as
with x as(
  select
    tgp.player_id,
    s.season_id,
    tg.id,
    tg.team_a_score,
    tg.team_b_score,
    tgp.team,
    case
      when (tgp.team='A' and tg.team_a_score>tg.team_b_score)
        or (tgp.team='B' and tg.team_b_score>tg.team_a_score)
        then coalesce(ss.win_points,3)
      when tg.team_a_score=tg.team_b_score
        then coalesce(ss.draw_points,1)
      else coalesce(ss.loss_points,0)
    end pts,
    case when tgp.team='A' then tg.team_a_score else tg.team_b_score end gf,
    case when tgp.team='A' then tg.team_b_score else tg.team_a_score end ga
  from public.training_game_players tgp
  join public.training_games tg on tg.id=tgp.training_game_id
  join public.sessions s on s.id=tg.session_id
  left join public.season_settings ss on ss.season_id=s.season_id
),
a as(
  select
    player_id,season_id,count(*) games,
    sum((pts=coalesce((select win_points from public.season_settings z where z.season_id=x.season_id),3))::int) wins,
    sum((pts=coalesce((select draw_points from public.season_settings z where z.season_id=x.season_id),1))::int) draws,
    sum((pts=coalesce((select loss_points from public.season_settings z where z.season_id=x.season_id),0))::int) losses,
    sum(pts) points,sum(gf) gf,sum(ga) ga
  from x group by player_id,season_id
),
p as(
  select player_id,season_id,sum(points) penalty
  from public.leaderboard_penalties group by player_id,season_id
)
select
  a.*,a.gf-a.ga gd,
  coalesce(p.penalty,0) penalty_points,
  case when coalesce(
    (select penalty_mode from public.season_settings ss where ss.season_id=a.season_id),
    'SUBTRACT'
  )='SUBTRACT'
  then a.points-coalesce(p.penalty,0)
  else a.points end final_points,
  pl.first_name,pl.last_name
from a
left join p using(player_id,season_id)
join public.players pl on pl.id=a.player_id;

-- IMPORTANT:
-- The existing player_match_summary has 15 columns.
-- PostgreSQL permits adding a new column only at the END with
-- CREATE OR REPLACE VIEW. Therefore custom_status is column 16.
create or replace view public.player_match_summary with (security_invoker=true) as
select
  m.id match_id,
  s.season_id,
  s.session_date,
  m.opponent,
  m.venue,
  m.home_score,
  m.away_score,
  p.id player_id,
  p.first_name,
  p.last_name,
  c.status callup_status,
  coalesce(st.started,false) started,
  coalesce(st.minutes_played,0) minutes_played,
  st.rpe,
  count(e.id) filter(where e.event_type='GOAL') goals,
  c.custom_status
from public.matches m
join public.sessions s on s.id=m.session_id
join public.players p on p.season_id=s.season_id
left join public.match_callups c
  on c.match_id=m.id and c.player_id=p.id
left join public.match_player_stats st
  on st.match_id=m.id and st.player_id=p.id
left join public.match_events e
  on e.match_id=m.id and e.player_id=p.id
group by
  m.id,s.season_id,s.session_date,m.opponent,m.venue,
  m.home_score,m.away_score,p.id,p.first_name,p.last_name,
  c.status,st.started,st.minutes_played,st.rpe,c.custom_status;

grant select on public.fine_balances to authenticated;
grant select on public.training_leaderboard_v3 to authenticated;
grant select on public.player_match_summary to authenticated;



-- ============================================================
-- RLS + POLICIES
-- ============================================================

alter table public.profiles enable row level security;
alter table public.seasons enable row level security;
alter table public.season_members enable row level security;
alter table public.season_access_requests enable row level security;
alter table public.players enable row level security;
alter table public.sessions enable row level security;
alter table public.matches enable row level security;
alter table public.match_callups enable row level security;
alter table public.match_player_stats enable row level security;
alter table public.match_events enable row level security;
alter table public.attendance_records enable row level security;
alter table public.player_session_loads enable row level security;
alter table public.training_games enable row level security;
alter table public.training_game_players enable row level security;
alter table public.training_game_goals enable row level security;
alter table public.leaderboard_penalties enable row level security;
alter table public.fine_types enable row level security;
alter table public.fines enable row level security;
alter table public.fine_payments enable row level security;
alter table public.player_access_tokens enable row level security;
alter table public.activity_logs enable row level security;
alter table public.season_settings enable row level security;
alter table public.programmed_absences enable row level security;
alter table public.callup_status_options enable row level security;
alter table public.yoyo_ir1_results enable row level security;

-- Remove policies managed by this master so reruns are safe.
do $drop$
declare p record;
begin
  for p in
    select schemaname,tablename,policyname
    from pg_policies
    where schemaname='public'
      and tablename in (
        'profiles','seasons','season_members','season_access_requests',
        'players','sessions','matches','match_callups','match_player_stats',
        'match_events','attendance_records','player_session_loads',
        'training_games','training_game_players','training_game_goals',
        'leaderboard_penalties','fine_types','fines','fine_payments',
        'player_access_tokens','activity_logs','season_settings',
        'programmed_absences','callup_status_options','yoyo_ir1_results'
      )
  loop
    execute format('drop policy if exists %I on %I.%I',p.policyname,p.schemaname,p.tablename);
  end loop;
end;
$drop$;

create policy p_self on public.profiles
for all using(id=auth.uid()) with check(id=auth.uid());

create policy s_select on public.seasons
for select using(owner_id=auth.uid() or public.is_member(id));
create policy s_insert on public.seasons
for insert with check(owner_id=auth.uid());
create policy s_update on public.seasons
for update using(owner_id=auth.uid()) with check(owner_id=auth.uid());

create policy sm_select on public.season_members
for select using(user_id=auth.uid() or public.role_is(season_id,array['OWNER']::season_role[]));
create policy sm_owner on public.season_members
for all using(public.role_is(season_id,array['OWNER']::season_role[]))
with check(public.role_is(season_id,array['OWNER']::season_role[]));

create policy ar_select on public.season_access_requests
for select using(requester_id=auth.uid() or public.role_is(season_id,array['OWNER']::season_role[]));
create policy ar_insert on public.season_access_requests
for insert with check(requester_id=auth.uid());
create policy ar_owner on public.season_access_requests
for update using(public.role_is(season_id,array['OWNER']::season_role[]))
with check(public.role_is(season_id,array['OWNER']::season_role[]));

create policy pl_select on public.players
for select using(public.is_member(season_id));
create policy pl_write on public.players
for all using(public.can_do(season_id,'players'))
with check(public.can_do(season_id,'players'));

create policy se_select on public.sessions
for select using(public.is_member(season_id));
create policy se_write on public.sessions
for all using(public.can_do(season_id,'sessions'))
with check(public.can_do(season_id,'sessions'));

create policy match_all on public.matches
for all using(exists(
  select 1 from public.sessions s
  where s.id=matches.session_id and public.can_do(s.season_id,'matches')
))
with check(exists(
  select 1 from public.sessions s
  where s.id=matches.session_id and public.can_do(s.season_id,'matches')
));

create policy call_all on public.match_callups
for all using(exists(
  select 1 from public.matches m join public.sessions s on s.id=m.session_id
  where m.id=match_callups.match_id and public.can_do(s.season_id,'matches')
))
with check(exists(
  select 1 from public.matches m join public.sessions s on s.id=m.session_id
  where m.id=match_callups.match_id and public.can_do(s.season_id,'matches')
));

create policy stat_all on public.match_player_stats
for all using(exists(
  select 1 from public.matches m join public.sessions s on s.id=m.session_id
  where m.id=match_player_stats.match_id and public.can_do(s.season_id,'matches')
))
with check(exists(
  select 1 from public.matches m join public.sessions s on s.id=m.session_id
  where m.id=match_player_stats.match_id and public.can_do(s.season_id,'matches')
));

create policy event_all on public.match_events
for all using(exists(
  select 1 from public.matches m join public.sessions s on s.id=m.session_id
  where m.id=match_events.match_id and public.can_do(s.season_id,'matches')
))
with check(exists(
  select 1 from public.matches m join public.sessions s on s.id=m.session_id
  where m.id=match_events.match_id and public.can_do(s.season_id,'matches')
));

create policy att_all on public.attendance_records
for all using(exists(
  select 1 from public.sessions s
  where s.id=attendance_records.session_id and public.can_do(s.season_id,'attendance')
))
with check(exists(
  select 1 from public.sessions s
  where s.id=attendance_records.session_id and public.can_do(s.season_id,'attendance')
));

create policy load_select on public.player_session_loads
for select using(exists(
  select 1 from public.sessions s
  where s.id=player_session_loads.session_id and public.is_member(s.season_id)
));
create policy load_write on public.player_session_loads
for all using(exists(
  select 1 from public.sessions s
  where s.id=player_session_loads.session_id and public.can_do(s.season_id,'workload')
))
with check(exists(
  select 1 from public.sessions s
  where s.id=player_session_loads.session_id and public.can_do(s.season_id,'workload')
));

create policy tg_select on public.training_games
for select using(exists(
  select 1 from public.sessions s
  where s.id=training_games.session_id and public.is_member(s.season_id)
));
create policy tg_write on public.training_games
for all using(exists(
  select 1 from public.sessions s
  where s.id=training_games.session_id and public.can_do(s.season_id,'games')
))
with check(exists(
  select 1 from public.sessions s
  where s.id=training_games.session_id and public.can_do(s.season_id,'games')
));

create policy tgp_all on public.training_game_players
for all using(exists(
  select 1 from public.training_games g join public.sessions s on s.id=g.session_id
  where g.id=training_game_players.training_game_id and public.can_do(s.season_id,'games')
))
with check(exists(
  select 1 from public.training_games g join public.sessions s on s.id=g.session_id
  where g.id=training_game_players.training_game_id and public.can_do(s.season_id,'games')
));

create policy tgg_all on public.training_game_goals
for all using(exists(
  select 1 from public.training_games g join public.sessions s on s.id=g.session_id
  where g.id=training_game_goals.training_game_id and public.can_do(s.season_id,'games')
))
with check(exists(
  select 1 from public.training_games g join public.sessions s on s.id=g.session_id
  where g.id=training_game_goals.training_game_id and public.can_do(s.season_id,'games')
));

create policy pen_all on public.leaderboard_penalties
for all using(public.can_do(season_id,'leaderboard'))
with check(public.can_do(season_id,'leaderboard'));

create policy ft_all on public.fine_types
for all using(public.can_do(season_id,'fines'))
with check(public.can_do(season_id,'fines'));

create policy fine_all on public.fines
for all using(public.can_do(season_id,'fines'))
with check(public.can_do(season_id,'fines'));

create policy fp_all on public.fine_payments
for all using(exists(
  select 1 from public.fines f
  where f.id=fine_payments.fine_id and public.can_do(f.season_id,'fines')
))
with check(exists(
  select 1 from public.fines f
  where f.id=fine_payments.fine_id and public.can_do(f.season_id,'fines')
));

create policy token_all on public.player_access_tokens
for all using(exists(
  select 1 from public.players p
  where p.id=player_access_tokens.player_id and public.can_do(p.season_id,'players')
))
with check(exists(
  select 1 from public.players p
  where p.id=player_access_tokens.player_id and public.can_do(p.season_id,'players')
));

create policy log_select on public.activity_logs
for select using(public.is_member(season_id));

create policy settings_select on public.season_settings
for select using(public.is_member(season_id));
create policy settings_owner on public.season_settings
for all using(public.role_is(season_id,array['OWNER']::season_role[]))
with check(public.role_is(season_id,array['OWNER']::season_role[]));

create policy pa_select on public.programmed_absences
for select using(public.is_member(season_id));
create policy pa_write on public.programmed_absences
for all using(public.can_do(season_id,'attendance'))
with check(public.can_do(season_id,'attendance'));

create policy cso_select on public.callup_status_options
for select using(public.is_member(season_id));
create policy cso_write on public.callup_status_options
for all using(public.can_do(season_id,'matches'))
with check(public.can_do(season_id,'matches'));

create policy yoyo_select on public.yoyo_ir1_results
for select using(public.is_member(season_id));
create policy yoyo_write on public.yoyo_ir1_results
for all using(public.can_do(season_id,'tests'))
with check(public.can_do(season_id,'tests'));

-- Privilege layer: RLS still decides access.
grant select,insert,update,delete on all tables in schema public to authenticated;
grant select on public.player_match_summary to authenticated;
grant select on public.fine_balances to authenticated;
grant select on public.training_leaderboard_v3 to authenticated;
grant execute on function public.player_by_token(text) to anon,authenticated;
grant execute on function public.player_portal_data(text) to anon,authenticated;
grant execute on function public.touch_player_token(text) to anon,authenticated;
grant execute on function public.hard_delete_player(uuid) to authenticated;

-- Audit triggers.
do $trig$
declare t text;
begin
  for t in
    select unnest(array[
      'seasons','players','sessions','matches','match_callups',
      'match_player_stats','match_events','attendance_records',
      'player_session_loads','training_games','training_game_players',
      'training_game_goals','leaderboard_penalties','fine_types','fines',
      'fine_payments','player_access_tokens','season_members',
      'season_access_requests','season_settings','programmed_absences',
      'callup_status_options','yoyo_ir1_results'
    ])
  loop
    execute format('drop trigger if exists audit_%I on public.%I',t,t);
    execute format(
      'create trigger audit_%I after insert or update or delete on public.%I for each row execute function public.audit_row()',
      t,t
    );
  end loop;
end;
$trig$;

-- Backfill settings for every existing season.
insert into public.season_settings(season_id)
select id from public.seasons
on conflict(season_id) do nothing;

-- ============================================================
-- END MASTER RECONCILIATION
-- ============================================================
