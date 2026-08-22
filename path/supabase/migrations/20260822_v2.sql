-- SOCCERMRGAMIFICATION v2 migration for the existing MVP database.
-- Run this in Supabase SQL Editor AFTER the original schema.sql.

-- OWNER must always be recognized even if the membership row was missing.
create or replace function public.is_member(s uuid) returns boolean language sql stable security definer set search_path=public as $$
select exists(select 1 from public.seasons where id=s and owner_id=auth.uid())
   or exists(select 1 from public.season_members where season_id=s and user_id=auth.uid() and status='ACTIVE');$$;

create or replace function public.role_is(s uuid,r season_role[]) returns boolean language sql stable security definer set search_path=public as $$
select exists(select 1 from public.seasons where id=s and owner_id=auth.uid() and 'OWNER'::season_role=any(r))
   or exists(select 1 from public.season_members where season_id=s and user_id=auth.uid() and status='ACTIVE' and role=any(r));$$;

create or replace function public.can_do(s uuid,p text) returns boolean language sql stable security definer set search_path=public as $$
select exists(select 1 from public.seasons where id=s and owner_id=auth.uid())
   or exists(select 1 from public.season_members where season_id=s and user_id=auth.uid() and status='ACTIVE' and (role='OWNER' or coalesce((permissions->>p)::boolean,false)));$$;

-- Ensure existing owners have a membership row.
insert into public.season_members(season_id,user_id,role,status,permissions,accepted_at)
select s.id,s.owner_id,'OWNER','ACTIVE',jsonb_build_object('players',true,'sessions',true,'attendance',true,'workload',true,'games',true,'matches',true,'leaderboard',true,'fines',true,'reports',true,'members',true),now()
from public.seasons s
where not exists(select 1 from public.season_members m where m.season_id=s.id and m.user_id=s.owner_id);

update public.season_members set status='ACTIVE',permissions=jsonb_build_object('players',true,'sessions',true,'attendance',true,'workload',true,'games',true,'matches',true,'leaderboard',true,'fines',true,'reports',true,'members',true),accepted_at=coalesce(accepted_at,now()) where role='OWNER';

-- Rebuild policies so owner writes work consistently and permissions stay server-side.
do $$declare p record; begin
for p in select policyname,tablename from pg_policies where schemaname='public' and tablename in ('players','sessions','matches','match_callups','match_player_stats','match_events','attendance_records','player_session_loads','training_games','training_game_players','training_game_goals','leaderboard_penalties','fine_types','fines','fine_payments','player_access_tokens','season_members','season_access_requests') loop execute format('drop policy if exists %I on public.%I',p.policyname,p.tablename); end loop; end$$;

create policy sm_select on public.season_members for select using(user_id=auth.uid() or role_is(season_id,array['OWNER']::season_role[]));
create policy sm_owner on public.season_members for all using(role_is(season_id,array['OWNER']::season_role[])) with check(role_is(season_id,array['OWNER']::season_role[]));
create policy ar_select on public.season_access_requests for select using(requester_id=auth.uid() or role_is(season_id,array['OWNER']::season_role[]));
create policy ar_insert on public.season_access_requests for insert with check(requester_id=auth.uid());
create policy ar_owner on public.season_access_requests for update using(role_is(season_id,array['OWNER']::season_role[]));
create policy pl_select on public.players for select using(is_member(season_id));
create policy pl_write on public.players for all using(can_do(season_id,'players')) with check(can_do(season_id,'players'));
create policy se_select on public.sessions for select using(is_member(season_id));
create policy se_write on public.sessions for all using(can_do(season_id,'sessions')) with check(can_do(season_id,'sessions'));
create policy match_all on public.matches for all using(exists(select 1 from sessions s where s.id=matches.session_id and can_do(s.season_id,'matches'))) with check(exists(select 1 from sessions s where s.id=matches.session_id and can_do(s.season_id,'matches')));
create policy call_all on public.match_callups for all using(exists(select 1 from matches m join sessions s on s.id=m.session_id where m.id=match_callups.match_id and can_do(s.season_id,'matches'))) with check(exists(select 1 from matches m join sessions s on s.id=m.session_id where m.id=match_callups.match_id and can_do(s.season_id,'matches')));
create policy stat_all on public.match_player_stats for all using(exists(select 1 from matches m join sessions s on s.id=m.session_id where m.id=match_player_stats.match_id and can_do(s.season_id,'matches'))) with check(exists(select 1 from matches m join sessions s on s.id=m.session_id where m.id=match_player_stats.match_id and can_do(s.season_id,'matches')));
create policy event_all on public.match_events for all using(exists(select 1 from matches m join sessions s on s.id=m.session_id where m.id=match_events.match_id and can_do(s.season_id,'matches'))) with check(exists(select 1 from matches m join sessions s on s.id=m.session_id where m.id=match_events.match_id and can_do(s.season_id,'matches')));
create policy att_all on public.attendance_records for all using(exists(select 1 from sessions s where s.id=attendance_records.session_id and can_do(s.season_id,'attendance'))) with check(exists(select 1 from sessions s where s.id=attendance_records.session_id and can_do(s.season_id,'attendance')));
create policy load_select on public.player_session_loads for select using(exists(select 1 from sessions s where s.id=player_session_loads.session_id and is_member(s.season_id)));
create policy load_write on public.player_session_loads for all using(exists(select 1 from sessions s where s.id=player_session_loads.session_id and can_do(s.season_id,'workload'))) with check(exists(select 1 from sessions s where s.id=player_session_loads.session_id and can_do(s.season_id,'workload')));
create policy tg_select on public.training_games for select using(exists(select 1 from sessions s where s.id=training_games.session_id and is_member(s.season_id)));
create policy tg_write on public.training_games for all using(exists(select 1 from sessions s where s.id=training_games.session_id and can_do(s.season_id,'games'))) with check(exists(select 1 from sessions s where s.id=training_games.session_id and can_do(s.season_id,'games')));
create policy tgp_all on public.training_game_players for all using(exists(select 1 from training_games g join sessions s on s.id=g.session_id where g.id=training_game_players.training_game_id and can_do(s.season_id,'games'))) with check(exists(select 1 from training_games g join sessions s on s.id=g.session_id where g.id=training_game_players.training_game_id and can_do(s.season_id,'games')));
create policy tgg_all on public.training_game_goals for all using(exists(select 1 from training_games g join sessions s on s.id=g.session_id where g.id=training_game_goals.training_game_id and can_do(s.season_id,'games'))) with check(exists(select 1 from training_games g join sessions s on s.id=g.session_id where g.id=training_game_goals.training_game_id and can_do(s.season_id,'games')));
create policy pen_all on public.leaderboard_penalties for all using(can_do(season_id,'leaderboard')) with check(can_do(season_id,'leaderboard'));
create policy ft_all on public.fine_types for all using(role_is(season_id,array['OWNER','COLLABORATOR','CAPTAIN']::season_role[])) with check(role_is(season_id,array['OWNER','COLLABORATOR','CAPTAIN']::season_role[]));
create policy fine_all on public.fines for all using(role_is(season_id,array['OWNER','COLLABORATOR','CAPTAIN']::season_role[])) with check(role_is(season_id,array['OWNER','COLLABORATOR','CAPTAIN']::season_role[]));
create policy fp_all on public.fine_payments for all using(exists(select 1 from fines f where f.id=fine_payments.fine_id and role_is(f.season_id,array['OWNER','COLLABORATOR','CAPTAIN']::season_role[]))) with check(exists(select 1 from fines f where f.id=fine_payments.fine_id and role_is(f.season_id,array['OWNER','COLLABORATOR','CAPTAIN']::season_role[])));
create policy token_all on public.player_access_tokens for all using(exists(select 1 from players p where p.id=player_access_tokens.player_id and can_do(p.season_id,'players'))) with check(exists(select 1 from players p where p.id=player_access_tokens.player_id and can_do(p.season_id,'players')));
create policy log_select on public.activity_logs for select using(is_member(season_id));

-- Securely update last_used_at from the unauthenticated player portal.
create or replace function public.touch_player_token(h text) returns void language plpgsql security definer set search_path=public as $$begin update player_access_tokens set last_used_at=now() where token_hash=h and revoked_at is null and (expires_at is null or expires_at>now());end$$;
revoke all on function public.touch_player_token(text) from public;grant execute on function public.touch_player_token(text) to anon,authenticated;

-- Player portal needs its own safe access path. The function only accepts a valid token hash.
create or replace function public.player_by_token(h text) returns table(player_id uuid,first_name text,last_name text,season_id uuid) language sql security definer set search_path=public as $$select p.id,p.first_name,p.last_name,p.season_id from player_access_tokens t join players p on p.id=t.player_id where t.token_hash=h and t.revoked_at is null and (t.expires_at is null or t.expires_at>now()) limit 1$$;
revoke all on function public.player_by_token(text) from public;grant execute on function public.player_by_token(text) to anon,authenticated;

-- Prevent accidental negative fine payments.
alter table public.fine_payments drop constraint if exists fine_payment_positive;
alter table public.fine_payments add constraint fine_payment_positive check(amount>0);

-- Faster season lookups.
create index if not exists idx_players_season_status on public.players(season_id,status,last_name);
create index if not exists idx_attendance_session_player on public.attendance_records(session_id,player_id);
create index if not exists idx_load_session_player on public.player_session_loads(session_id,player_id);
create index if not exists idx_match_stats_match_player on public.match_player_stats(match_id,player_id);
create index if not exists idx_game_players_game_player on public.training_game_players(training_game_id,player_id);

create or replace function public.player_portal_data(h text) returns jsonb language plpgsql security definer set search_path=public as $$
declare pid uuid; sid uuid; result jsonb;
begin
  select p.id,p.season_id into pid,sid from player_access_tokens t join players p on p.id=t.player_id
  where t.token_hash=h and t.revoked_at is null and (t.expires_at is null or t.expires_at>now()) limit 1;
  if pid is null then return null; end if;
  result:=jsonb_build_object(
    'player',(select jsonb_build_object('player_id',p.id,'first_name',p.first_name,'last_name',p.last_name,'season_id',p.season_id) from players p where p.id=pid),
    'loads',coalesce((select jsonb_agg(x order by x.session_date desc) from (select l.id,l.rpe,l.duration_minutes,l.load,s.session_date,s.session_type from player_session_loads l join sessions s on s.id=l.session_id where l.player_id=pid) x),'[]'::jsonb),
    'matches',coalesce((select jsonb_agg(x order by x.session_date desc) from (select * from player_match_summary where player_id=pid) x),'[]'::jsonb),
    'fines',coalesce((select jsonb_agg(x) from (select * from fine_balances where player_id=pid) x),'[]'::jsonb),
    'attendance',coalesce((select jsonb_agg(x order by x.session_date desc) from (select a.status,a.absence_reason,s.session_date,s.session_type from attendance_records a join sessions s on s.id=a.session_id where a.player_id=pid) x),'[]'::jsonb),
    'leaderboard',(select to_jsonb(x) from (select * from training_leaderboard where player_id=pid and season_id=sid limit 1) x)
  );
  return result;
end$$;
revoke all on function public.player_portal_data(text) from public;grant execute on function public.player_portal_data(text) to anon,authenticated;
