create extension if not exists pgcrypto;
create type season_role as enum('OWNER','COLLABORATOR','CAPTAIN');
create type member_status as enum('PENDING','ACTIVE','REJECTED','REMOVED');
create type session_type as enum('TRAINING','MATCH');
create type attendance_status as enum('PRESENT','ABSENT');
create type absence_reason as enum('INJURED','OTHER','UNJUSTIFIED');
create type match_location as enum('HOME','AWAY');
create type callup_status as enum('CALLED_UP','SUSPENDED','INJURED','TECHNICAL_CHOICE','OTHER');
create type game_team as enum('A','B');
create type fine_status as enum('OPEN','PARTIALLY_PAID','PAID','CANCELLED');

create table profiles(id uuid primary key references auth.users(id) on delete cascade,email text,full_name text,avatar_url text,created_at timestamptz default now());
create table seasons(id uuid primary key default gen_random_uuid(),owner_id uuid not null references profiles(id),name text not null,team_name text not null,sporting_year text not null,access_code text unique not null,created_at timestamptz default now(),updated_at timestamptz default now());
create table season_members(id uuid primary key default gen_random_uuid(),season_id uuid references seasons(id) on delete cascade,user_id uuid references profiles(id) on delete cascade,role season_role not null,status member_status default 'PENDING',permissions jsonb default '{}'::jsonb,created_at timestamptz default now(),accepted_at timestamptz,unique(season_id,user_id));
create table season_access_requests(id uuid primary key default gen_random_uuid(),season_id uuid references seasons(id) on delete cascade,requester_id uuid references profiles(id) on delete cascade,status member_status default 'PENDING',requested_at timestamptz default now(),resolved_at timestamptz,resolved_by uuid references profiles(id));
create table players(id uuid primary key default gen_random_uuid(),season_id uuid references seasons(id) on delete cascade,first_name text not null,last_name text not null,shirt_number int,position text,notes text,status text default 'ACTIVE',created_at timestamptz default now(),archived_at timestamptz);
create table sessions(id uuid primary key default gen_random_uuid(),season_id uuid references seasons(id) on delete cascade,session_date date not null,session_type session_type not null,title text,notes text,created_by uuid references profiles(id),created_at timestamptz default now(),updated_at timestamptz default now());
create table matches(id uuid primary key default gen_random_uuid(),session_id uuid unique references sessions(id) on delete cascade,opponent text not null,venue match_location not null,home_score int,away_score int,notes text,created_at timestamptz default now());
create table match_callups(id uuid primary key default gen_random_uuid(),match_id uuid references matches(id) on delete cascade,player_id uuid references players(id) on delete cascade,status callup_status not null,notes text,unique(match_id,player_id));
create table match_player_stats(id uuid primary key default gen_random_uuid(),match_id uuid references matches(id) on delete cascade,player_id uuid references players(id) on delete cascade,started boolean default false,minutes_played int default 0,rpe numeric(3,1),unique(match_id,player_id));
create table match_events(id uuid primary key default gen_random_uuid(),match_id uuid references matches(id) on delete cascade,player_id uuid references players(id) on delete set null,event_type text not null,minute int,metadata jsonb default '{}'::jsonb,created_at timestamptz default now());
create table attendance_records(id uuid primary key default gen_random_uuid(),session_id uuid references sessions(id) on delete cascade,player_id uuid references players(id) on delete cascade,status attendance_status not null,absence_reason absence_reason,unique(session_id,player_id));
create table player_session_loads(id uuid primary key default gen_random_uuid(),session_id uuid references sessions(id) on delete cascade,player_id uuid references players(id) on delete cascade,rpe numeric(3,1),duration_minutes int default 90,load numeric generated always as(case when rpe is not null then rpe*duration_minutes else null end) stored,unique(session_id,player_id));
create table training_games(id uuid primary key default gen_random_uuid(),session_id uuid references sessions(id) on delete cascade,name text default 'Partitella',team_a_score int default 0,team_b_score int default 0,created_at timestamptz default now());
create table training_game_players(id uuid primary key default gen_random_uuid(),training_game_id uuid references training_games(id) on delete cascade,player_id uuid references players(id) on delete cascade,team game_team not null,unique(training_game_id,player_id));
create table training_game_goals(id uuid primary key default gen_random_uuid(),training_game_id uuid references training_games(id) on delete cascade,player_id uuid references players(id) on delete set null,team game_team not null,minute int);
create table leaderboard_penalties(id uuid primary key default gen_random_uuid(),season_id uuid references seasons(id) on delete cascade,player_id uuid references players(id) on delete cascade,points int not null,reason text not null,created_by uuid references profiles(id),created_at timestamptz default now());
create table fine_types(id uuid primary key default gen_random_uuid(),season_id uuid references seasons(id) on delete cascade,name text not null,default_amount numeric(10,2) not null,active boolean default true);
create table fines(id uuid primary key default gen_random_uuid(),season_id uuid references seasons(id) on delete cascade,player_id uuid references players(id) on delete cascade,fine_type_id uuid references fine_types(id) on delete set null,amount numeric(10,2) not null,description text,status fine_status default 'OPEN',issued_by uuid references profiles(id),issued_at timestamptz default now());
create table fine_payments(id uuid primary key default gen_random_uuid(),fine_id uuid references fines(id) on delete cascade,amount numeric(10,2) not null,payment_date date default current_date,recorded_by uuid references profiles(id),notes text);
create table player_access_tokens(id uuid primary key default gen_random_uuid(),player_id uuid references players(id) on delete cascade,token_hash text unique not null,created_at timestamptz default now(),expires_at timestamptz,revoked_at timestamptz,last_used_at timestamptz);
create table activity_logs(id uuid primary key default gen_random_uuid(),season_id uuid references seasons(id) on delete cascade,actor_user_id uuid references profiles(id),action text not null,entity_type text,entity_id uuid,metadata jsonb default '{}'::jsonb,created_at timestamptz default now());

create index players_season on players(season_id);create index sessions_season_date on sessions(season_id,session_date);create index loads_player on player_session_loads(player_id,session_id);create index logs_season on activity_logs(season_id,created_at desc);

create or replace function is_member(s uuid) returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from season_members where season_id=s and user_id=auth.uid() and status='ACTIVE')$$;
create or replace function role_is(s uuid,r season_role[]) returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from season_members where season_id=s and user_id=auth.uid() and status='ACTIVE' and role=any(r))$$;
create or replace function can_do(s uuid,p text) returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from season_members where season_id=s and user_id=auth.uid() and status='ACTIVE' and (role='OWNER' or coalesce((permissions->>p)::boolean,false)))$$;

create or replace function new_user() returns trigger language plpgsql security definer set search_path=public as $$begin insert into profiles(id,email,full_name,avatar_url) values(new.id,new.email,new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'avatar_url') on conflict do nothing;return new;end$$;
create trigger auth_profile after insert on auth.users for each row execute function new_user();

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

create or replace view fine_balances as select f.*,coalesce(sum(fp.amount),0) paid,greatest(f.amount-coalesce(sum(fp.amount),0),0) residual from fines f left join fine_payments fp on fp.fine_id=f.id group by f.id;

create or replace view training_leaderboard as
with x as(select tgp.player_id,s.season_id,tg.id,tg.team_a_score,tg.team_b_score,tgp.team,
case when (tgp.team='A' and tg.team_a_score>tg.team_b_score) or (tgp.team='B' and tg.team_b_score>tg.team_a_score) then 3 when tg.team_a_score=tg.team_b_score then 1 else 0 end pts,
case when tgp.team='A' then tg.team_a_score else tg.team_b_score end gf,case when tgp.team='A' then tg.team_b_score else tg.team_a_score end ga
from training_game_players tgp join training_games tg on tg.id=tgp.training_game_id join sessions s on s.id=tg.session_id),
a as(select player_id,season_id,count(*) games,sum((pts=3)::int) wins,sum((pts=1)::int) draws,sum((pts=0)::int) losses,sum(pts) points,sum(gf) gf,sum(ga) ga from x group by player_id,season_id),
p as(select player_id,season_id,sum(points) penalty from leaderboard_penalties group by player_id,season_id)
select a.*,a.gf-a.ga gd,coalesce(p.penalty,0) penalty_points,a.points-coalesce(p.penalty,0) final_points from a left join p using(player_id,season_id);

create or replace view player_match_summary as
select m.id match_id,s.season_id,s.session_date,m.opponent,m.venue,m.home_score,m.away_score,
p.id player_id,p.first_name,p.last_name,c.status callup_status,coalesce(st.started,false) started,coalesce(st.minutes_played,0) minutes_played,st.rpe,
count(e.id) filter(where e.event_type='GOAL') goals
from matches m join sessions s on s.id=m.session_id cross join players p
left join match_callups c on c.match_id=m.id and c.player_id=p.id
left join match_player_stats st on st.match_id=m.id and st.player_id=p.id
left join match_events e on e.match_id=m.id and e.player_id=p.id
group by m.id,s.season_id,s.session_date,m.opponent,m.venue,m.home_score,m.away_score,p.id,p.first_name,p.last_name,c.status,st.started,st.minutes_played,st.rpe;

-- RLS
alter table profiles enable row level security;alter table seasons enable row level security;alter table season_members enable row level security;alter table season_access_requests enable row level security;
alter table players enable row level security;alter table sessions enable row level security;alter table matches enable row level security;alter table match_callups enable row level security;alter table match_player_stats enable row level security;alter table match_events enable row level security;alter table attendance_records enable row level security;alter table player_session_loads enable row level security;alter table training_games enable row level security;alter table training_game_players enable row level security;alter table training_game_goals enable row level security;alter table leaderboard_penalties enable row level security;alter table fine_types enable row level security;alter table fines enable row level security;alter table fine_payments enable row level security;alter table player_access_tokens enable row level security;alter table activity_logs enable row level security;

create policy p_self on profiles for all using(id=auth.uid()) with check(id=auth.uid());
create policy s_select on seasons for select using(owner_id=auth.uid() or is_member(id));create policy s_insert on seasons for insert with check(owner_id=auth.uid());create policy s_update on seasons for update using(owner_id=auth.uid());
create policy sm_select on season_members for select using(user_id=auth.uid() or role_is(season_id,array['OWNER']::season_role[]));create policy sm_owner on season_members for all using(role_is(season_id,array['OWNER']::season_role[])) with check(role_is(season_id,array['OWNER']::season_role[]));
create policy ar_select on season_access_requests for select using(requester_id=auth.uid() or role_is(season_id,array['OWNER']::season_role[]));create policy ar_insert on season_access_requests for insert with check(requester_id=auth.uid());create policy ar_owner on season_access_requests for update using(role_is(season_id,array['OWNER']::season_role[]));

create policy pl_select on players for select using(is_member(season_id));create policy pl_write on players for all using(can_do(season_id,'players')) with check(can_do(season_id,'players'));
create policy se_select on sessions for select using(is_member(season_id));create policy se_write on sessions for all using(can_do(season_id,'sessions')) with check(can_do(season_id,'sessions'));

create policy match_all on matches for all using(exists(select 1 from sessions s where s.id=matches.session_id and can_do(s.season_id,'matches'))) with check(exists(select 1 from sessions s where s.id=matches.session_id and can_do(s.season_id,'matches')));
create policy call_all on match_callups for all using(exists(select 1 from matches m join sessions s on s.id=m.session_id where m.id=match_callups.match_id and can_do(s.season_id,'matches'))) with check(exists(select 1 from matches m join sessions s on s.id=m.session_id where m.id=match_callups.match_id and can_do(s.season_id,'matches')));
create policy stat_all on match_player_stats for all using(exists(select 1 from matches m join sessions s on s.id=m.session_id where m.id=match_player_stats.match_id and can_do(s.season_id,'matches'))) with check(exists(select 1 from matches m join sessions s on s.id=m.session_id where m.id=match_player_stats.match_id and can_do(s.season_id,'matches')));
create policy event_all on match_events for all using(exists(select 1 from matches m join sessions s on s.id=m.session_id where m.id=match_events.match_id and can_do(s.season_id,'matches'))) with check(exists(select 1 from matches m join sessions s on s.id=m.session_id where m.id=match_events.match_id and can_do(s.season_id,'matches')));

create policy att_all on attendance_records for all using(exists(select 1 from sessions s where s.id=attendance_records.session_id and can_do(s.season_id,'attendance'))) with check(exists(select 1 from sessions s where s.id=attendance_records.session_id and can_do(s.season_id,'attendance')));
create policy load_select on player_session_loads for select using(exists(select 1 from sessions s where s.id=player_session_loads.session_id and is_member(s.season_id)));create policy load_write on player_session_loads for all using(exists(select 1 from sessions s where s.id=player_session_loads.session_id and can_do(s.season_id,'workload'))) with check(exists(select 1 from sessions s where s.id=player_session_loads.session_id and can_do(s.season_id,'workload')));

create policy tg_select on training_games for select using(exists(select 1 from sessions s where s.id=training_games.session_id and is_member(s.season_id)));create policy tg_write on training_games for all using(exists(select 1 from sessions s where s.id=training_games.session_id and can_do(s.season_id,'games'))) with check(exists(select 1 from sessions s where s.id=training_games.session_id and can_do(s.season_id,'games')));
create policy tgp_all on training_game_players for all using(exists(select 1 from training_games g join sessions s on s.id=g.session_id where g.id=training_game_players.training_game_id and can_do(s.season_id,'games'))) with check(exists(select 1 from training_games g join sessions s on s.id=g.session_id where g.id=training_game_players.training_game_id and can_do(s.season_id,'games')));
create policy tgg_all on training_game_goals for all using(exists(select 1 from training_games g join sessions s on s.id=g.session_id where g.id=training_game_goals.training_game_id and can_do(s.season_id,'games'))) with check(exists(select 1 from training_games g join sessions s on s.id=g.session_id where g.id=training_game_goals.training_game_id and can_do(s.season_id,'games')));

create policy pen_all on leaderboard_penalties for all using(can_do(season_id,'leaderboard')) with check(can_do(season_id,'leaderboard'));
create policy ft_all on fine_types for all using(role_is(season_id,array['OWNER','COLLABORATOR','CAPTAIN']::season_role[])) with check(role_is(season_id,array['OWNER','COLLABORATOR','CAPTAIN']::season_role[]));
create policy fine_all on fines for all using(role_is(season_id,array['OWNER','COLLABORATOR','CAPTAIN']::season_role[])) with check(role_is(season_id,array['OWNER','COLLABORATOR','CAPTAIN']::season_role[]));
create policy fp_all on fine_payments for all using(exists(select 1 from fines f where f.id=fine_payments.fine_id and role_is(f.season_id,array['OWNER','COLLABORATOR','CAPTAIN']::season_role[]))) with check(exists(select 1 from fines f where f.id=fine_payments.fine_id and role_is(f.season_id,array['OWNER','COLLABORATOR','CAPTAIN']::season_role[])));
create policy token_all on player_access_tokens for all using(exists(select 1 from players p where p.id=player_access_tokens.player_id and can_do(p.season_id,'players'))) with check(exists(select 1 from players p where p.id=player_access_tokens.player_id and can_do(p.season_id,'players')));
create policy log_select on activity_logs for select using(is_member(season_id));

-- Audit logging trigger: logs INSERT/UPDATE/DELETE on important tables.
create or replace function audit_row() returns trigger language plpgsql security definer set search_path=public as $$
declare sid uuid; eid uuid; begin
eid=coalesce(new.id,old.id);
if TG_TABLE_NAME='seasons' then sid=coalesce(new.id,old.id);
elsif TG_TABLE_NAME='players' then sid=coalesce(new.season_id,old.season_id);
elsif TG_TABLE_NAME='sessions' then sid=coalesce(new.season_id,old.season_id);
elsif TG_TABLE_NAME='leaderboard_penalties' then sid=coalesce(new.season_id,old.season_id);
elsif TG_TABLE_NAME='fine_types' then sid=coalesce(new.season_id,old.season_id);
elsif TG_TABLE_NAME='fines' then sid=coalesce(new.season_id,old.season_id);
elsif TG_TABLE_NAME='season_members' then sid=coalesce(new.season_id,old.season_id);
elsif TG_TABLE_NAME='season_access_requests' then sid=coalesce(new.season_id,old.season_id);
elsif TG_TABLE_NAME='activity_logs' then return coalesce(new,old);
else
select s.season_id into sid from sessions s where s.id=coalesce(new.session_id,old.session_id);
end if;
if sid is not null then insert into activity_logs(season_id,actor_user_id,action,entity_type,entity_id,metadata) values(sid,auth.uid(),TG_OP,TG_TABLE_NAME,eid,jsonb_build_object('source','database_trigger'));end if;
return coalesce(new,old);end$$;

do $$ declare t text;begin for t in select unnest(array['players','sessions','matches','match_callups','match_player_stats','match_events','attendance_records','player_session_loads','training_games','training_game_players','training_game_goals','leaderboard_penalties','fine_types','fines','fine_payments','season_members','season_access_requests']) loop execute format('drop trigger if exists audit_%I on %I',t,t);execute format('create trigger audit_%I after insert or update or delete on %I for each row execute function audit_row()',t,t);end loop;end$$;

-- Default permissions are granted when owner accepts a collaborator; CAPTAIN gets fines only.

-- v4 additions
create table if not exists programmed_absences(id uuid primary key default gen_random_uuid(),season_id uuid not null references seasons(id) on delete cascade,player_id uuid not null references players(id) on delete cascade,start_date date not null,end_date date not null,reason text,notes text,created_by uuid references profiles(id),created_at timestamptz default now(),updated_at timestamptz default now(),constraint programmed_absences_dates check(end_date>=start_date));
create index if not exists programmed_absences_season_dates on programmed_absences(season_id,start_date,end_date);
create table if not exists callup_status_options(id uuid primary key default gen_random_uuid(),season_id uuid not null references seasons(id) on delete cascade,code text not null,label text not null,active boolean not null default true,created_at timestamptz default now(),unique(season_id,code));
alter table match_callups add column if not exists custom_status text;

-- v5 additions (FINAL_MIGRATION.sql remains the canonical upgrade path)
alter table fine_types add column if not exists description text;
create table if not exists yoyo_ir1_results(id uuid primary key default gen_random_uuid(),season_id uuid not null references seasons(id) on delete cascade,player_id uuid not null references players(id) on delete cascade,test_date date not null,distance_m integer not null check(distance_m>=0 and distance_m<=10000),final_level text,notes text,created_by uuid references profiles(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(season_id,player_id,test_date));
alter table yoyo_ir1_results enable row level security;
