'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { uploadPlayerPhoto } from '@/services/storage.service';
import { playerSchema } from '@/features/players/schemas';

export type PlayerActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

export async function createPlayerAction(
  teamId: string,
  _prevState: PlayerActionState,
  formData: FormData
): Promise<PlayerActionState> {
  const parsed = playerSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    jerseyNumber: formData.get('jerseyNumber') || undefined,
    position: formData.get('position') || undefined,
    phone: formData.get('phone') || undefined,
    birthDate: formData.get('birthDate') || undefined,
    notes: formData.get('notes') || undefined,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: player, error } = await supabase
    .from('players')
    .insert({
      team_id: teamId,
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      jersey_number: parsed.data.jerseyNumber ?? null,
      position: parsed.data.position ?? null,
      phone: parsed.data.phone ?? null,
      birth_date: parsed.data.birthDate ?? null,
      notes: parsed.data.notes ?? null,
    })
    .select('id')
    .single();

  if (error || !player) return { error: 'Impossibile creare il giocatore.' };

  // link giocatore generato automaticamente
  await supabase.from('player_tokens').insert({ player_id: player.id });

  const photo = formData.get('photo') as File | null;
  if (photo && photo.size > 0) {
    try {
      const url = await uploadPlayerPhoto(supabase, teamId, player.id, photo);
      await supabase.from('players').update({ photo_url: url }).eq('id', player.id);
    } catch {
      // Upload foto non essenziale alla creazione del giocatore: se lo
      // storage non è configurato (bucket player-photos assente), il
      // giocatore viene comunque creato senza foto invece di bloccarsi.
    }
  }

  revalidatePath('/squadra/rosa');
  redirect('/squadra/rosa');
}

export async function updatePlayerAction(
  playerId: string,
  teamId: string,
  _prevState: PlayerActionState,
  formData: FormData
): Promise<PlayerActionState> {
  const parsed = playerSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    jerseyNumber: formData.get('jerseyNumber') || undefined,
    position: formData.get('position') || undefined,
    phone: formData.get('phone') || undefined,
    birthDate: formData.get('birthDate') || undefined,
    notes: formData.get('notes') || undefined,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();

  const photo = formData.get('photo') as File | null;
  let photoUrl: string | undefined;
  if (photo && photo.size > 0) {
    try {
      photoUrl = await uploadPlayerPhoto(supabase, teamId, playerId, photo);
    } catch {
      // Upload foto non essenziale: se lo storage non è configurato,
      // si salvano comunque le altre modifiche senza bloccare il form.
    }
  }

  const { error } = await supabase
    .from('players')
    .update({
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      jersey_number: parsed.data.jerseyNumber ?? null,
      position: parsed.data.position ?? null,
      phone: parsed.data.phone ?? null,
      birth_date: parsed.data.birthDate ?? null,
      notes: parsed.data.notes ?? null,
      ...(photoUrl ? { photo_url: photoUrl } : {}),
    })
    .eq('id', playerId);

  if (error) return { error: 'Impossibile salvare le modifiche.' };

  revalidatePath('/squadra/rosa');
  redirect('/squadra/rosa');
}

export async function deletePlayerAction(playerId: string) {
  const supabase = await createClient();
  await supabase.from('players').delete().eq('id', playerId);
  revalidatePath('/squadra/rosa');
}

export async function regeneratePlayerTokenAction(playerId: string) {
  const supabase = await createClient();
  // player_tokens.player_id è UNIQUE: rigenerare significa sovrascrivere
  // il token esistente (invalidando così quello vecchio), non crearne uno
  // nuovo. Vedi funzione SQL regenerate_player_token in 0004.
  await supabase.rpc('regenerate_player_token', { p_player_id: playerId });
  revalidatePath(`/squadra/rosa/${playerId}`);
}
