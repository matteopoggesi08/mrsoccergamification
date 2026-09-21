import { createServiceRoleClient } from '@/lib/supabase/service-role';
import type { AttendanceHistoryEntry } from '@/types/domain';

/**
 * Unico punto di accesso ai dati dell'Area Giocatore. Bypassa la RLS
 * (service_role) solo dopo aver verificato che il token esista e sia
 * attivo: da qui in poi tutte le query sono filtrate esplicitamente per
 * player_id/team_id, quindi il giocatore vede solo i propri dati.
 */
export async function getPlayerDataByToken(token: string) {
  const supabase = createServiceRoleClient();

  const { data: tokenRow } = await supabase
    .from('player_tokens')
    .select('player_id, is_active')
    .eq('token', token)
    .single();

  if (!tokenRow || !tokenRow.is_active) return null;

  const playerId = tokenRow.player_id;

  const { data: player } = await supabase.from('players').select('*').eq('id', playerId).single();
  if (!player) return null;

  const [{ data: standings }, { data: trainings }, { data: workload }] = await Promise.all([
    supabase.rpc('get_team_standings', { p_team_id: player.team_id }),
    supabase
      .from('attendances')
      .select('status, trainings(id, session_date, title)')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.rpc('get_player_workload', { p_player_id: playerId }),
  ]);

  const standingsList: {
    player_id: string;
    full_name: string;
    points: number;
    attendances_count: number;
    matches_count: number;
    minutes_total: number;
    win_rate: number;
    penalty_points: number;
  }[] = standings ?? [];
  const playerStanding = standingsList.find((s) => s.player_id === playerId);
  const position = standingsList.findIndex((s) => s.player_id === playerId) + 1;

  return {
    player,
    standing: playerStanding,
    position,
    trainings: (trainings ?? []) as unknown as AttendanceHistoryEntry[],
    workload: workload ?? [],
  };
}
