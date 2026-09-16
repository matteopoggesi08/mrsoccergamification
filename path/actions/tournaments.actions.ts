'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function createTournamentAction(trainingId: string, formData: FormData) {
  const supabase = await createClient();
  const name = (formData.get('name') as string) || 'Torneo';
  const mode = (formData.get('mode') as 'risultati' | 'classifica') || 'risultati';

  const { data: tournament, error } = await supabase
    .from('tournaments')
    .insert({ training_id: trainingId, name, mode })
    .select('id')
    .single();

  if (!error && tournament) {
    const teamNames = (formData.get('teamNames') as string)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (teamNames.length > 0) {
      await supabase
        .from('tournament_teams')
        .insert(teamNames.map((name) => ({ tournament_id: tournament.id, name })));
    }
  }

  revalidatePath(`/allenamenti/${trainingId}/tornei`);
}

export async function createTournamentMatchAction(
  tournamentId: string,
  trainingId: string,
  teamAId: string,
  teamBId: string
) {
  const supabase = await createClient();
  if (teamAId === teamBId) return;
  await supabase
    .from('tournament_matches')
    .insert({ tournament_id: tournamentId, team_a_id: teamAId, team_b_id: teamBId });
  revalidatePath(`/allenamenti/${trainingId}/tornei`);
}

export async function deleteTournamentMatchAction(matchId: string, trainingId: string) {
  const supabase = await createClient();
  await supabase.from('tournament_matches').delete().eq('id', matchId);
  revalidatePath(`/allenamenti/${trainingId}/tornei`);
}

export async function updateTournamentMatchAction(
  matchId: string,
  trainingId: string,
  scoreA: number,
  scoreB: number
) {
  const supabase = await createClient();
  await supabase
    .from('tournament_matches')
    .update({ score_a: scoreA, score_b: scoreB })
    .eq('id', matchId);
  // Niente revalidate: lo stato locale del componente riflette già il
  // punteggio aggiornato.
}

export async function setTournamentStandingAction(
  tournamentId: string,
  trainingId: string,
  tournamentTeamId: string,
  finalPosition: number,
  points: number
) {
  const supabase = await createClient();
  await supabase.from('tournament_standing_entries').upsert(
    {
      tournament_id: tournamentId,
      tournament_team_id: tournamentTeamId,
      final_position: finalPosition,
      points,
    },
    { onConflict: 'tournament_id,tournament_team_id' }
  );
  // Niente revalidate: lo stato locale del componente riflette già i
  // valori aggiornati.
}
