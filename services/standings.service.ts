import type { createClient } from '@/lib/supabase/server';

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type StandingRow = {
  player_id: string;
  full_name: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  attendances_count: number;
  matches_count: number;
  minutes_total: number;
  win_rate: number;
  penalty_points: number;
};

/** Ricalcolata ad ogni richiesta da matches/penalties (event sourcing). */
export async function getTeamStandings(
  supabase: SupabaseServerClient,
  teamId: string
): Promise<StandingRow[]> {
  const { data, error } = await supabase.rpc('get_team_standings', { p_team_id: teamId });
  if (error) {
    console.error('get_team_standings fallita:', error);
    return [];
  }
  return data ?? [];
}
