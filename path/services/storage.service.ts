import type { createClient } from '@/lib/supabase/server';

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const BUCKET = 'player-photos';
const MAX_DIMENSION = 512;

/**
 * Riceve un File già ridimensionato lato client (vedi
 * components/players/photo-input.tsx, che usa canvas prima dell'upload
 * per restare entro MAX_DIMENSION px e formato webp) e lo carica su
 * Supabase Storage nel bucket privato player-photos.
 */
export async function uploadPlayerPhoto(
  supabase: SupabaseServerClient,
  teamId: string,
  playerId: string,
  file: File
): Promise<string> {
  const path = `${teamId}/${playerId}-${Date.now()}.webp`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: 'image/webp',
    upsert: true,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export const PLAYER_PHOTO_MAX_DIMENSION = MAX_DIMENSION;
