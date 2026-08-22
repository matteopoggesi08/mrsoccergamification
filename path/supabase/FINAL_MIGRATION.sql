-- SOCCERMRGAMIFICATION v3 FINAL
-- Run after schema.sql and v2 migration.
-- Idempotent: safe to run again.

create table if not exists public.season_settings(
  season_id uuid primary key references public.seasons(id) on delete cascade,
  win_points integer not null default 3,
  draw_points integer not null default 1,
  loss_points integer not null default 0,
  penalty_mode text not null default 'SUBTRACT' check(penalty_mode in ('SUBTRACT','IGNORE')),
  insight_baseline_days integer not null default 28 check(insight_baseline_days between 7 and 90),
  default_training_duration integer not null default 90 check(default_training_duration between 0 and 300),
  updated_at timestamptz not null default now()
);

insert into public.season_settings(season_id)
select id from public.seasons
on conflict(season_id) do nothing;

alter table public.season_settings enable row level security;
grant select,insert,update,delete on public.season_settings to authenticated;

create or replace function public.ensure_season_settings()
returns trigger language plpgsql security definer set search_path=public as $fn$
begin
  insert into public.season_settings(season_id) values(new.id) on conflict(season_id) do nothing;
  return new;
end;
$fn$;

drop trigger if exists season_settings_after_insert on public.seasons;
create trigger season_settings_after_insert after insert on public.seasons for each row execute function public.ensure_season_settings();

create index if not exists idx_season_members_user_status on public.season_members(user_id,status);
create index if not exists idx_requests_season_status on public.season_access_requests(season_id,status,requested_at desc);
create index if not exists idx_matches_session on public.matches(session_id);
create index if not exists idx_match_events_match on public.match_events(match_id,minute);
create index if not exists idx_fines_player on public.fines(player_id,issued_at desc);
create index if not exists idx_fine_types_season_active on public.fine_types(season_id,active,name);
create index if not exists idx_training_goals_player on public.training_game_goals(player_id,training_game_id);

-- Authorization helpers: season owner is always OWNER.
create or replace function public.is_member(s uuid)
returns boolean language sql stable security definer set search_path=public as $fn$
  select exists(select 1 from public.seasons where id=s and owner_id=auth.uid())
  or exists(select 1 from public.season_members where season_id=s and user_id=auth.uid() and status='ACTIVE');
$fn$;

create or replace function public.role_is(s uuid,r season_role[])
returns boolean language sql stable security definer set search_path=public as $fn$
  select exists(select 1 from public.seasons where id=s and owner_id=auth.uid() and 'OWNER'::season_role=any(r))
  or exists(select 1 from public.season_members where season_id=s and user_id=auth.uid() and status='ACTIVE' and role=any(r));
$fn$;

create or replace function public.can_do(s uuid,p text)
returns boolean language sql stable security definer set search_path=public as $fn$
  select exists(select 1 from public.seasons where id=s and owner_id=auth.uid())
  or exists(select 1 from public.season_members where season_id=s and user_id=auth.uid() and status='ACTIVE' and (role='OWNER' or coalesce((permissions->>p)::boolean,false)));
$fn$;

-- Owner memberships.
insert into public.season_members(season_id,user_id,role,status,permissions,accepted_at)
select s.id,s.owner_id,'OWNER','ACTIVE',jsonb_build_object('players',true,'sessions',true,'attendance',true,'workload',true,'games',true,'matches',true,'leaderboard',true,'fines',true,'reports',true,'members',true),now()
from public.seasons s
where not exists(select 1 from public.season_members sm where sm.season_id=s.id and sm.user_id=s.owner_id);

update public.season_members set status='ACTIVE',role='OWNER',permissions=jsonb_build_object('players',true,'sessions',true,'attendance',true,'workload',true,'games',true,'matches',true,'leaderboard',true,'fines',true,'reports',true,'members',true),accepted_at=coalesce(accepted_at,now()) where role='OWNER';

-- Rebuild policies on data tables. We deliberately do not create a DELETE policy for players:
-- hard deletion is only possible through the secure hard_delete_player() function and only without history.
do $drop$
declare p record;
begin
 for p in select policyname,tablename from pg_policies where schemaname='public' and tablename in('season_members','season_access_requests','players','sessions','matches','match_callups','match_player_stats','match_events','attendance_records','player_session_loads','training_games','training_game_players','training_game_goals','leaderboard_penalties','fine_types','fines','fine_payments','player_access_tokens','activity_logs','season_settings') loop
  execute format('drop policy if exists %I on public.%I',p.policyname,p.tablename);
 end loop;
end;
$drop$;

create policy sm_select on public.season_members for select using(user_id=auth.uid() or role_is(season_id,array['OWNER']::season_role[]));
create policy sm_owner on public.season_members for all using(role_is(season_id,array['OWNER']::season_role[])) with check(role_is(season_id,array['OWNER']::season_role[]));

create policy ar_select on public.season_access_requests for select using(requester_id=auth.uid() or role_is(season_id,array['OWNER']::season_role[]));
create policy ar_insert on public.season_access_requests for insert with check(requester_id=auth.uid());
create policy ar_owner on public.season_access_requests for update using(role_is(season_id,array['OWNER']::season_role[])) with check(role_is(season_id,array['OWNER']::season_role[]));

create policy pl_select on public.players for select using(is_member(season_id));
create policy pl_insert on public.players for insert with check(can_do(season_id,'players'));
create policy pl_update on public.players for update using(can_do(season_id,'players')) with check(can_do(season_id,'players'));

create policy se_select on public.sessions for select using(is_member(season_id));
create policy se_write on public.sessions for all using(can_do(season_id,'sessions')) with check(can_do(season_id,'sessions'));

create policy match_select on public.matches for select using(exists(select 1 from public.sessions s where s.id=matches.session_id and is_member(s.season_id)));
create policy match_write on public.matches for all using(exists(select 1 from public.sessions s where s.id=matches.session_id and can_do(s.season_id,'matches'))) with check(exists(select 1 from public.sessions s where s.id=matches.session_id and can_do(s.season_id,'matches')));
create policy call_select on public.match_callups for select using(exists(select 1 from public.matches m join public.sessions s on s.id=m.session_id where m.id=match_callups.match_id and is_member(s.season_id)));
create policy call_write on public.match_callups for all using(exists(select 1 from public.matches m join public.sessions s on s.id=m.session_id where m.id=match_callups.match_id and can_do(s.season_id,'matches'))) with check(exists(select 1 from public.matches m join public.sessions s on s.id=m.session_id where m.id=match_callups.match_id and can_do(s.season_id,'matches')));
create policy stat_select on public.match_player_stats for select using(exists(select 1 from public.matches m join public.sessions s on s.id=m.session_id where m.id=match_player_stats.match_id and is_member(s.season_id)));
create policy stat_write on public.match_player_stats for all using(exists(select 1 from public.matches m join public.sessions s on s.id=m.session_id where m.id=match_player_stats.match_id and can_do(s.season_id,'matches'))) with check(exists(select 1 from public.matches m join public.sessions s on s.id=m.session_id where m.id=match_player_stats.match_id and can_do(s.season_id,'matches')));
create policy event_select on public.match_events for select using(exists(select 1 from public.matches m join public.sessions s on s.id=m.session_id where m.id=match_events.match_id and is_member(s.season_id)));
create policy event_write on public.match_events for all using(exists(select 1 from public.matches m join public.sessions s on s.id=m.session_id where m.id=match_events.match_id and can_do(s.season_id,'matches'))) with check(exists(select 1 from public.matches m join public.sessions s on s.id=m.session_id where m.id=match_events.match_id and can_do(s.season_id,'matches')));

create policy att_select on public.attendance_records for select using(exists(select 1 from public.sessions s where s.id=attendance_records.session_id and is_member(s.season_id)));
create policy att_write on public.attendance_records for all using(exists(select 1 from public.sessions s where s.id=attendance_records.session_id and can_do(s.season_id,'attendance'))) with check(exists(select 1 from public.sessions s where s.id=attendance_records.session_id and can_do(s.season_id,'attendance')));

create policy load_select on public.player_session_loads for select using(exists(select 1 from public.sessions s where s.id=player_session_loads.session_id and is_member(s.season_id)));
create policy load_write on public.player_session_loads for all using(exists(select 1 from public.sessions s where s.id=player_session_loads.session_id and can_do(s.season_id,'workload'))) with check(exists(select 1 from public.sessions s where s.id=player_session_loads.session_id and can_do(s.season_id,'workload')));

create policy tg_select on public.training_games for select using(exists(select 1 from public.sessions s where s.id=training_games.session_id and is_member(s.season_id)));
create policy tg_write on public.training_games for all using(exists(select 1 from public.sessions s where s.id=training_games.session_id and can_do(s.season_id,'games'))) with check(exists(select 1 from public.sessions s where s.id=training_games.session_id and can_do(s.season_id,'games')));
create policy tgp_select on public.training_game_players for select using(exists(select 1 from public.training_games g join public.sessions s on s.id=g.session_id where g.id=training_game_players.training_game_id and is_member(s.season_id)));
create policy tgp_write on public.training_game_players for all using(exists(select 1 from public.training_games g join public.sessions s on s.id=g.session_id where g.id=training_game_players.training_game_id and can_do(s.season_id,'games'))) with check(exists(select 1 from public.training_games g join public.sessions s on s.id=g.session_id where g.id=training_game_players.training_game_id and can_do(s.season_id,'games')));
create policy tgg_select on public.training_game_goals for select using(exists(select 1 from public.training_games g join public.sessions s on s.id=g.session_id where g.id=training_game_goals.training_game_id and is_member(s.season_id)));
create policy tgg_write on public.training_game_goals for all using(exists(select 1 from public.training_games g join public.sessions s on s.id=g.session_id where g.id=training_game_goals.training_game_id and can_do(s.season_id,'games'))) with check(exists(select 1 from public.training_games g join public.sessions s on s.id=g.session_id where g.id=training_game_goals.training_game_id and can_do(s.season_id,'games')));

create policy pen_select on public.leaderboard_penalties for select using(is_member(season_id));
create policy pen_write on public.leaderboard_penalties for all using(can_do(season_id,'leaderboard')) with check(can_do(season_id,'leaderboard'));

create policy ft_select on public.fine_types for select using(is_member(season_id));
create policy ft_write on public.fine_types for all using(can_do(season_id,'fines')) with check(can_do(season_id,'fines'));
create policy fine_select on public.fines for select using(is_member(season_id));
create policy fine_write on public.fines for all using(can_do(season_id,'fines')) with check(can_do(season_id,'fines'));
create policy fp_select on public.fine_payments for select using(exists(select 1 from public.fines f where f.id=fine_payments.fine_id and is_member(f.season_id)));
create policy fp_write on public.fine_payments for all using(exists(select 1 from public.fines f where f.id=fine_payments.fine_id and can_do(f.season_id,'fines'))) with check(exists(select 1 from public.fines f where f.id=fine_payments.fine_id and can_do(f.season_id,'fines')));

create policy token_select on public.player_access_tokens for select using(exists(select 1 from public.players p where p.id=player_access_tokens.player_id and is_member(p.season_id)));
create policy token_write on public.player_access_tokens for all using(exists(select 1 from public.players p where p.id=player_access_tokens.player_id and can_do(p.season_id,'players'))) with check(exists(select 1 from public.players p where p.id=player_access_tokens.player_id and can_do(p.season_id,'players')));
create policy log_select on public.activity_logs for select using(is_member(season_id));

create policy settings_select on public.season_settings for select using(is_member(season_id));
create policy settings_owner on public.season_settings for all using(role_is(season_id,array['OWNER']::season_role[])) with check(role_is(season_id,array['OWNER']::season_role[]));

-- Fine balance view: security invoker so RLS remains effective.
create or replace view public.fine_balances with (security_invoker=true) as
select f.*,coalesce(sum(fp.amount),0)::numeric as paid,greatest(f.amount-coalesce(sum(fp.amount),0),0)::numeric as residual
from public.fines f left join public.fine_payments fp on fp.fine_id=f.id group by f.id;

-- Configurable leaderboard. Default remains 3/1/0.
create or replace view public.training_leaderboard_v3 with (security_invoker=true) as
with x as(
 select tgp.player_id,s.season_id,tg.id,tg.team_a_score,tg.team_b_score,tgp.team,
 case when (tgp.team='A' and tg.team_a_score>tg.team_b_score) or (tgp.team='B' and tg.team_b_score>tg.team_a_score) then coalesce(ss.win_points,3)
      when tg.team_a_score=tg.team_b_score then coalesce(ss.draw_points,1) else coalesce(ss.loss_points,0) end pts,
 case when tgp.team='A' then tg.team_a_score else tg.team_b_score end gf,
 case when tgp.team='A' then tg.team_b_score else tg.team_a_score end ga
 from public.training_game_players tgp join public.training_games tg on tg.id=tgp.training_game_id join public.sessions s on s.id=tg.session_id left join public.season_settings ss on ss.season_id=s.season_id
),a as(
 select player_id,season_id,count(*) games,sum((pts=coalesce((select win_points from public.season_settings z where z.season_id=x.season_id),3))::int) wins,sum((pts=coalesce((select draw_points from public.season_settings z where z.season_id=x.season_id),1))::int) draws,sum((pts=coalesce((select loss_points from public.season_settings z where z.season_id=x.season_id),0))::int) losses,sum(pts) points,sum(gf) gf,sum(ga) ga from x group by player_id,season_id
),p as(select player_id,season_id,sum(points) penalty from public.leaderboard_penalties group by player_id,season_id)
select a.*,a.gf-a.ga gd,coalesce(p.penalty,0) penalty_points,case when coalesce((select penalty_mode from public.season_settings ss where ss.season_id=a.season_id),'SUBTRACT')='SUBTRACT' then a.points-coalesce(p.penalty,0) else a.points end final_points,
pl.first_name,pl.last_name
from a left join p using(player_id,season_id) join public.players pl on pl.id=a.player_id;

grant select on public.fine_balances to authenticated;
grant select on public.training_leaderboard_v3 to authenticated;
grant select on public.player_match_summary to authenticated;

create or replace view public.player_match_summary with (security_invoker=true) as
select m.id match_id,s.season_id,s.session_date,m.opponent,m.venue,m.home_score,m.away_score,
p.id player_id,p.first_name,p.last_name,c.status callup_status,coalesce(st.started,false) started,coalesce(st.minutes_played,0) minutes_played,st.rpe,
count(e.id) filter(where e.event_type='GOAL') goals
from public.matches m join public.sessions s on s.id=m.session_id cross join public.players p
left join public.match_callups c on c.match_id=m.id and c.player_id=p.id
left join public.match_player_stats st on st.match_id=m.id and st.player_id=p.id
left join public.match_events e on e.match_id=m.id and e.player_id=p.id
group by m.id,s.season_id,s.session_date,m.opponent,m.venue,m.home_score,m.away_score,p.id,p.first_name,p.last_name,c.status,st.started,st.minutes_played,st.rpe;

-- Safe hard delete: only OWNER and only when no historical record exists.
create or replace function public.hard_delete_player(p_id uuid)
returns boolean language plpgsql security definer set search_path=public as $fn$
declare sid uuid; n integer;
begin
 select season_id into sid from public.players where id=p_id;
 if sid is null then return false; end if;
 if not exists(select 1 from public.seasons where id=sid and owner_id=auth.uid()) then raise exception 'not authorized'; end if;
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
 if n>0 then return false; end if;
 delete from public.players where id=p_id;
 return true;
end;
$fn$;
revoke all on function public.hard_delete_player(uuid) from public;
grant execute on function public.hard_delete_player(uuid) to authenticated;

-- Full player portal payload, scoped only by an unguessable token hash.
create or replace function public.player_portal_data(h text)
returns jsonb language plpgsql security definer set search_path=public as $fn$
declare pid uuid; sid uuid; result jsonb;
begin
 select p.id,p.season_id into pid,sid from public.player_access_tokens t join public.players p on p.id=t.player_id where t.token_hash=h and t.revoked_at is null and (t.expires_at is null or t.expires_at>now()) limit 1;
 if pid is null then return null; end if;
 update public.player_access_tokens set last_used_at=now() where token_hash=h;
 result:=jsonb_build_object(
  'player',(select jsonb_build_object('player_id',p.id,'first_name',p.first_name,'last_name',p.last_name,'season_id',p.season_id) from public.players p where p.id=pid),
  'season',(select jsonb_build_object('name',s.name,'team_name',s.team_name,'sporting_year',s.sporting_year) from public.seasons s where s.id=sid),
  'settings',(select jsonb_build_object('insight_baseline_days',ss.insight_baseline_days,'default_training_duration',ss.default_training_duration) from public.season_settings ss where ss.season_id=sid),
  'loads',coalesce((select jsonb_agg(x order by x.session_date desc) from (select l.id,l.rpe,l.duration_minutes,l.load,s.session_date,s.session_type from public.player_session_loads l join public.sessions s on s.id=l.session_id where l.player_id=pid)x),'[]'::jsonb),
  'matches',coalesce((select jsonb_agg(x order by x.session_date desc) from (select * from public.player_match_summary where player_id=pid)x),'[]'::jsonb),
  'fines',coalesce((select jsonb_agg(x) from (select * from public.fine_balances where player_id=pid)x),'[]'::jsonb),
  'attendance',coalesce((select jsonb_agg(x order by x.session_date desc) from (select a.status,a.absence_reason,s.session_date,s.session_type from public.attendance_records a join public.sessions s on s.id=a.session_id where a.player_id=pid)x),'[]'::jsonb),
  'leaderboard',(select to_jsonb(x) from (select * from public.training_leaderboard_v3 where player_id=pid and season_id=sid limit 1)x),
  'yoyo',coalesce((select jsonb_agg(x order by x.test_date desc) from (select id,test_date,distance_m,final_level,notes from public.yoyo_ir1_results where player_id=pid order by test_date desc)x),'[]'::jsonb)
 ); return result;
end;
$fn$;
revoke all on function public.player_portal_data(text) from public;grant execute on function public.player_portal_data(text) to anon,authenticated;

create or replace function public.touch_player_token(h text) returns void language plpgsql security definer set search_path=public as $fn$
begin update public.player_access_tokens set last_used_at=now() where token_hash=h and revoked_at is null and (expires_at is null or expires_at>now()); end;
$fn$;
revoke all on function public.touch_player_token(text) from public;grant execute on function public.touch_player_token(text) to anon,authenticated;

-- Audit trigger covering all important season mutations.
create or replace function public.audit_row() returns trigger language plpgsql security definer set search_path=public as $fn$
declare sid uuid; eid uuid;
begin
eid=coalesce(new.id,old.id);
if TG_TABLE_NAME='seasons' then sid=coalesce(new.id,old.id);
elsif TG_TABLE_NAME in('players','sessions','leaderboard_penalties','fine_types','fines','season_members','season_access_requests','season_settings') then sid=coalesce(new.season_id,old.season_id);
elsif TG_TABLE_NAME='matches' then select s.season_id into sid from public.sessions s where s.id=coalesce(new.session_id,old.session_id);
elsif TG_TABLE_NAME in('match_callups','match_player_stats','match_events') then select s.season_id into sid from public.matches m join public.sessions s on s.id=m.session_id where m.id=coalesce(new.match_id,old.match_id);
elsif TG_TABLE_NAME='attendance_records' or TG_TABLE_NAME='player_session_loads' then select s.season_id into sid from public.sessions s where s.id=coalesce(new.session_id,old.session_id);
elsif TG_TABLE_NAME='training_games' then select s.season_id into sid from public.sessions s where s.id=coalesce(new.session_id,old.session_id);
elsif TG_TABLE_NAME in('training_game_players','training_game_goals') then select s.season_id into sid from public.training_games g join public.sessions s on s.id=g.session_id where g.id=coalesce(new.training_game_id,old.training_game_id);
elsif TG_TABLE_NAME='fine_payments' then select f.season_id into sid from public.fines f where f.id=coalesce(new.fine_id,old.fine_id);
elsif TG_TABLE_NAME='player_access_tokens' then select p.season_id into sid from public.players p where p.id=coalesce(new.player_id,old.player_id);
elsif TG_TABLE_NAME='activity_logs' then return coalesce(new,old);
end if;
if sid is not null then insert into public.activity_logs(season_id,actor_user_id,action,entity_type,entity_id,metadata) values(sid,auth.uid(),TG_OP,TG_TABLE_NAME,eid,jsonb_build_object('source','database_trigger')); end if;
return coalesce(new,old);
end;
$fn$;

do $trig$
declare t text;
begin
 for t in select unnest(array['seasons','players','sessions','matches','match_callups','match_player_stats','match_events','attendance_records','player_session_loads','training_games','training_game_players','training_game_goals','leaderboard_penalties','fine_types','fines','fine_payments','player_access_tokens','season_members','season_access_requests','season_settings']) loop
  execute format('drop trigger if exists audit_%I on public.%I',t,t);
  execute format('create trigger audit_%I after insert or update or delete on public.%I for each row execute function public.audit_row()',t,t);
 end loop;
end;
$trig$;

-- Basic data validation.
alter table public.players drop constraint if exists players_shirt_number_check;
alter table public.players add constraint players_shirt_number_check check(shirt_number is null or shirt_number between 1 and 99);
alter table public.player_session_loads drop constraint if exists load_rpe_check;
alter table public.player_session_loads add constraint load_rpe_check check(rpe is null or rpe between 1 and 10);
alter table public.player_session_loads drop constraint if exists load_duration_check;
alter table public.player_session_loads add constraint load_duration_check check(duration_minutes between 0 and 300);
alter table public.match_player_stats drop constraint if exists match_rpe_check;
alter table public.match_player_stats add constraint match_rpe_check check(rpe is null or rpe between 1 and 10);
alter table public.match_player_stats drop constraint if exists match_minutes_check;
alter table public.match_player_stats add constraint match_minutes_check check(minutes_played between 0 and 130);
alter table public.fine_payments drop constraint if exists fine_payment_positive;
alter table public.fine_payments add constraint fine_payment_positive check(amount>0);

-- END v3

-- v4: programmed absences + configurable call-up labels
create table if not exists public.programmed_absences(
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint programmed_absences_dates check(end_date>=start_date)
);
create index if not exists idx_programmed_absences_season_dates on public.programmed_absences(season_id,start_date,end_date);
create index if not exists idx_programmed_absences_player on public.programmed_absences(player_id,start_date,end_date);
alter table public.programmed_absences enable row level security;
drop policy if exists pa_select on public.programmed_absences;
drop policy if exists pa_write on public.programmed_absences;
create policy pa_select on public.programmed_absences for select using(is_member(season_id));
create policy pa_write on public.programmed_absences for all using(can_do(season_id,'attendance')) with check(can_do(season_id,'attendance'));

alter table public.match_callups add column if not exists custom_status text;
create table if not exists public.callup_status_options(
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  code text not null,
  label text not null,
  active boolean not null default true,
  created_at timestamptz default now(),
  unique(season_id,code)
);
create index if not exists idx_callup_status_options_season on public.callup_status_options(season_id,active,label);
alter table public.callup_status_options enable row level security;
drop policy if exists cso_select on public.callup_status_options;
drop policy if exists cso_write on public.callup_status_options;
create policy cso_select on public.callup_status_options for select using(is_member(season_id));
create policy cso_write on public.callup_status_options for all using(can_do(season_id,'matches')) with check(can_do(season_id,'matches'));

-- Seed one optional custom label only when the season has none; built-in labels remain in the UI.
-- The table is intentionally empty by default so every season can define only what it needs.

-- Extend audit coverage to the new tables.
create or replace function public.audit_row() returns trigger language plpgsql security definer set search_path=public as $fn$
declare sid uuid; eid uuid;
begin
eid=coalesce(new.id,old.id);
if TG_TABLE_NAME='seasons' then sid=coalesce(new.id,old.id);
elsif TG_TABLE_NAME in('players','sessions','leaderboard_penalties','fine_types','fines','season_members','season_access_requests','season_settings','programmed_absences','callup_status_options') then sid=coalesce(new.season_id,old.season_id);
elsif TG_TABLE_NAME='matches' then select s.season_id into sid from public.sessions s where s.id=coalesce(new.session_id,old.session_id);
elsif TG_TABLE_NAME in('match_callups','match_player_stats','match_events') then select s.season_id into sid from public.matches m join public.sessions s on s.id=m.session_id where m.id=coalesce(new.match_id,old.match_id);
elsif TG_TABLE_NAME='attendance_records' or TG_TABLE_NAME='player_session_loads' then select s.season_id into sid from public.sessions s where s.id=coalesce(new.session_id,old.session_id);
elsif TG_TABLE_NAME='training_games' then select s.season_id into sid from public.sessions s where s.id=coalesce(new.session_id,old.session_id);
elsif TG_TABLE_NAME in('training_game_players','training_game_goals') then select s.season_id into sid from public.training_games g join public.sessions s on s.id=g.session_id where g.id=coalesce(new.training_game_id,old.training_game_id);
elsif TG_TABLE_NAME='fine_payments' then select f.season_id into sid from public.fines f where f.id=coalesce(new.fine_id,old.fine_id);
elsif TG_TABLE_NAME='player_access_tokens' then select p.season_id into sid from public.players p where p.id=coalesce(new.player_id,old.player_id);
elsif TG_TABLE_NAME='activity_logs' then return coalesce(new,old);
end if;
if sid is not null then insert into public.activity_logs(season_id,actor_user_id,action,entity_type,entity_id,metadata) values(sid,auth.uid(),TG_OP,TG_TABLE_NAME,eid,jsonb_build_object('source','database_trigger')); end if;
return coalesce(new,old);
end;
$fn$;

do $trig$
declare t text;
begin
 for t in select unnest(array['seasons','players','sessions','matches','match_callups','match_player_stats','match_events','attendance_records','player_session_loads','training_games','training_game_players','training_game_goals','leaderboard_penalties','fine_types','fines','fine_payments','player_access_tokens','season_members','season_access_requests','season_settings','programmed_absences','callup_status_options']) loop
  execute format('drop trigger if exists audit_%I on public.%I',t,t);
  execute format('create trigger audit_%I after insert or update or delete on public.%I for each row execute function public.audit_row()',t,t);
 end loop;
end;
$trig$;

-- More human-friendly player match summaries: retain all season matches for the player,
-- while keeping call-up/stat/event fields nullable when the player was not involved.
create or replace view public.player_match_summary with (security_invoker=true) as
select m.id match_id,s.season_id,s.session_date,m.opponent,m.venue,m.home_score,m.away_score,
p.id player_id,p.first_name,p.last_name,c.status callup_status,c.custom_status,coalesce(st.started,false) started,coalesce(st.minutes_played,0) minutes_played,st.rpe,
count(e.id) filter(where e.event_type='GOAL') goals
from public.matches m
join public.sessions s on s.id=m.session_id
join public.players p on p.season_id=s.season_id
left join public.match_callups c on c.match_id=m.id and c.player_id=p.id
left join public.match_player_stats st on st.match_id=m.id and st.player_id=p.id
left join public.match_events e on e.match_id=m.id and e.player_id=p.id
group by m.id,s.season_id,s.session_date,m.opponent,m.venue,m.home_score,m.away_score,p.id,p.first_name,p.last_name,c.status,c.custom_status,st.started,st.minutes_played,st.rpe;

-- v4: hard delete also checks programmed absences.
create or replace function public.hard_delete_player(p_id uuid)
returns boolean language plpgsql security definer set search_path=public as $fn$
declare sid uuid; n integer;
begin
 select season_id into sid from public.players where id=p_id;
 if sid is null then return false; end if;
 if not exists(select 1 from public.seasons where id=sid and owner_id=auth.uid()) then raise exception 'not authorized'; end if;
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
 if n>0 then return false; end if;
 delete from public.players where id=p_id;
 return true;
end;
$fn$;
revoke all on function public.hard_delete_player(uuid) from public;
grant execute on function public.hard_delete_player(uuid) to authenticated;

-- v5: fine type descriptions
alter table public.fine_types add column if not exists description text;

-- v5: physical tests - Yo-Yo Intermittent Recovery Test Level 1
create table if not exists public.yoyo_ir1_results(
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  test_date date not null,
  distance_m integer not null check(distance_m >= 0 and distance_m <= 10000),
  final_level text,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(season_id,player_id,test_date)
);
create index if not exists idx_yoyo_ir1_season_date on public.yoyo_ir1_results(season_id,test_date desc);
create index if not exists idx_yoyo_ir1_player_date on public.yoyo_ir1_results(player_id,test_date desc);
alter table public.yoyo_ir1_results enable row level security;
drop policy if exists yoyo_select on public.yoyo_ir1_results;
drop policy if exists yoyo_write on public.yoyo_ir1_results;
create policy yoyo_select on public.yoyo_ir1_results for select using(is_member(season_id));
create policy yoyo_write on public.yoyo_ir1_results for all using(can_do(season_id,'tests')) with check(can_do(season_id,'tests'));
grant select,insert,update,delete on public.yoyo_ir1_results to authenticated;

-- Existing collaborators receive the new tests permission. Captains do not.
update public.season_members
set permissions = coalesce(permissions,'{}'::jsonb) || jsonb_build_object('tests', true)
where status='ACTIVE' and role='COLLABORATOR';
update public.season_members
set permissions = coalesce(permissions,'{}'::jsonb) || jsonb_build_object('tests', false)
where status='ACTIVE' and role='CAPTAIN';
update public.season_members
set permissions = coalesce(permissions,'{}'::jsonb) || jsonb_build_object('tests', true)
where status='ACTIVE' and role='OWNER';

-- Add tests to owner permission presets created by earlier migrations.
update public.season_members
set permissions = coalesce(permissions,'{}'::jsonb) || jsonb_build_object('tests', true)
where role='OWNER';

-- Audit coverage for physical tests.
do $trig_tests$
begin
  execute 'drop trigger if exists audit_yoyo_ir1_results on public.yoyo_ir1_results';
  execute 'create trigger audit_yoyo_ir1_results after insert or update or delete on public.yoyo_ir1_results for each row execute function public.audit_row()';
end;
$trig_tests$;

-- Extend audit_row to understand the new test table.
create or replace function public.audit_row() returns trigger language plpgsql security definer set search_path=public as $fn$
declare sid uuid; eid uuid;
begin
eid=coalesce(new.id,old.id);
if TG_TABLE_NAME='seasons' then sid=coalesce(new.id,old.id);
elsif TG_TABLE_NAME in('players','sessions','leaderboard_penalties','fine_types','fines','season_members','season_access_requests','season_settings','programmed_absences','callup_status_options','yoyo_ir1_results') then sid=coalesce(new.season_id,old.season_id);
elsif TG_TABLE_NAME='matches' then select s.season_id into sid from public.sessions s where s.id=coalesce(new.session_id,old.session_id);
elsif TG_TABLE_NAME in('match_callups','match_player_stats','match_events') then select s.season_id into sid from public.matches m join public.sessions s on s.id=m.session_id where m.id=coalesce(new.match_id,old.match_id);
elsif TG_TABLE_NAME='attendance_records' or TG_TABLE_NAME='player_session_loads' then select s.season_id into sid from public.sessions s where s.id=coalesce(new.session_id,old.session_id);
elsif TG_TABLE_NAME='training_games' then select s.season_id into sid from public.sessions s where s.id=coalesce(new.session_id,old.session_id);
elsif TG_TABLE_NAME in('training_game_players','training_game_goals') then select s.season_id into sid from public.training_games g join public.sessions s on s.id=g.session_id where g.id=coalesce(new.training_game_id,old.training_game_id);
elsif TG_TABLE_NAME='fine_payments' then select f.season_id into sid from public.fines f where f.id=coalesce(new.fine_id,old.fine_id);
elsif TG_TABLE_NAME='player_access_tokens' then select p.season_id into sid from public.players p where p.id=coalesce(new.player_id,old.player_id);
elsif TG_TABLE_NAME='activity_logs' then return coalesce(new,old);
end if;
if sid is not null then insert into public.activity_logs(season_id,actor_user_id,action,entity_type,entity_id,metadata) values(sid,auth.uid(),TG_OP,TG_TABLE_NAME,eid,jsonb_build_object('source','database_trigger')); end if;
return coalesce(new,old);
end;
$fn$;

-- Keep the trigger in place after the function replacement.
drop trigger if exists audit_yoyo_ir1_results on public.yoyo_ir1_results;
create trigger audit_yoyo_ir1_results after insert or update or delete on public.yoyo_ir1_results for each row execute function public.audit_row();


-- Final hard-delete guard: preserve Yo-Yo test history as well.
create or replace function public.hard_delete_player(p_id uuid)
returns boolean language plpgsql security definer set search_path=public as $fn$
declare sid uuid; n integer;
begin
 select season_id into sid from public.players where id=p_id;
 if sid is null then return false; end if;
 if not exists(select 1 from public.seasons where id=sid and owner_id=auth.uid()) then raise exception 'not authorized'; end if;
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
revoke all on function public.hard_delete_player(uuid) from public;
grant execute on function public.hard_delete_player(uuid) to authenticated;
