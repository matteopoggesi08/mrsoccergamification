'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function setRpeAction(
  trainingId: string,
  playerId: string,
  rpe: number,
  durationMinutes: number
) {
  const supabase = await createClient();
  await supabase.from('rpe_entries').upsert(
    { training_id: trainingId, player_id: playerId, rpe, duration_minutes: durationMinutes },
    { onConflict: 'training_id,player_id' }
  );
  // Niente revalidate della pagina stessa: lo stato locale già riflette
  // il cambio. Aggiorniamo solo le pagine dei carichi che dipendono da
  // questo dato.
  revalidatePath('/squadra/rosa', 'layout');
}
