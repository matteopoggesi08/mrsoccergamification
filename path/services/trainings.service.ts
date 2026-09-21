import type { createClient } from '@/lib/supabase/server';

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type TrainingSummary = {
  id: string;
  session_date: string;
  title: string | null;
  session_type: 'allenamento' | 'partita';
  presences_count: number;
  absences_count: number;
  matches_count: number;
  avg_rpe: number | null;
};

/**
 * Non lancia mai un'eccezione: se la funzione SQL get_trainings_summary
 * non esiste ancora (migration 0008 non eseguita su Supabase), la
 * pagina mostra semplicemente una lista vuota invece di andare in
 * crash con "Application error".
 */
export async function getTrainingsSummary(
  supabase: SupabaseServerClient,
  teamId: string
): Promise<TrainingSummary[]> {
  const { data, error } = await supabase.rpc('get_trainings_summary', { p_team_id: teamId });
  if (error) {
    console.error('get_trainings_summary fallita (migration 0008 eseguita su Supabase?):', error);
    return [];
  }
  return data ?? [];
}
