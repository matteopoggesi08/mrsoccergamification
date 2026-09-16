'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function createMatchAction(trainingId: string, formData: FormData) {
  const supabase = await createClient();
  const teamAName = (formData.get('teamAName') as string) || 'Squadra A';
  const teamBName = (formData.get('teamBName') as string) || 'Squadra B';

  await supabase.from('matches').insert({
    training_id: trainingId,
    team_a_name: teamAName,
    team_b_name: teamBName,
  });

  revalidatePath(`/allenamenti/${trainingId}/partitelle`);
}

export async function assignPlayerToMatchAction(
  matchId: string,
  trainingId: string,
  playerId: string,
  teamSide: 'A' | 'B' | null
) {
  const supabase = await createClient();

  if (teamSide === null) {
    await supabase.from('match_players').delete().eq('match_id', matchId).eq('player_id', playerId);
  } else {
    await supabase
      .from('match_players')
      .upsert(
        { match_id: matchId, player_id: playerId, team_side: teamSide },
        { onConflict: 'match_id,player_id' }
      );
  }

  revalidatePath(`/allenamenti/${trainingId}/partitelle`);
}

export async function setMatchPlayerMinutesAction(
  matchId: string,
  trainingId: string,
  playerId: string,
  minutes: number
) {
  const supabase = await createClient();
  await supabase
    .from('match_players')
    .update({ minutes_played: minutes })
    .eq('match_id', matchId)
    .eq('player_id', playerId);
  revalidatePath(`/allenamenti/${trainingId}/partitelle`);
}
export async function updateMatchScoreAction(
  matchId: string,
  trainingId: string,
  scoreA: number,
  scoreB: number
) {
  const supabase = await createClient();
  await supabase.from('matches').update({ score_a: scoreA, score_b: scoreB }).eq('id', matchId);
  revalidatePath(`/allenamenti/${trainingId}/partitelle`);
  revalidatePath('/classifica');
}

export async function deleteMatchAction(matchId: string, trainingId: string) {
  const supabase = await createClient();
  await supabase.from('matches').delete().eq('id', matchId);
  revalidatePath(`/allenamenti/${trainingId}/partitelle`);
  revalidatePath('/classifica');
}
