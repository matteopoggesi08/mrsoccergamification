import type { createClient } from '@/lib/supabase/server';

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type WorkloadPoint = {
  training_date: string;
  session_load: number;
  acute_load: number | null;
  chronic_load: number | null;
  acwr: number | null;
  monotony: number | null;
  strain: number | null;
};

/** ACWR: <0.8 sottocarico, 0.8-1.3 ottimale, >1.5 rischio infortunio elevato */
export function acwrInsight(acwr: number | null): string | null {
  if (acwr == null) return null;
  if (acwr > 1.5) return 'Carico in forte aumento: rischio infortunio elevato, valuta di alleggerire.';
  if (acwr > 1.3) return 'Carico in aumento rispetto alla media: monitora la settimana.';
  if (acwr < 0.8) return 'Settimana leggera rispetto alla media recente: possibile decondizionamento.';
  return 'Carico in range ottimale.';
}

export async function getPlayerWorkload(
  supabase: SupabaseServerClient,
  playerId: string
): Promise<WorkloadPoint[]> {
  const { data, error } = await supabase.rpc('get_player_workload', { p_player_id: playerId });
  if (error) {
    console.error('get_player_workload fallita:', error);
    return [];
  }
  return data ?? [];
}
