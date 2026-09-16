'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function createPenaltyAction(teamId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const playerId = formData.get('playerId') as string;
  const points = Number(formData.get('points'));
  const reason = (formData.get('reason') as string) || null;

  await supabase.from('penalties').insert({
    team_id: teamId,
    player_id: playerId,
    points,
    reason,
    created_by: user.id,
  });

  revalidatePath('/classifica');
}
