import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getTeamsForCurrentUser } from '@/services/teams.service';
import { redirect } from 'next/navigation';

/**
 * Risolve la squadra attiva lato server (usato da tutte le pagine sotto
 * (dashboard) che non hanno bisogno dell'intero TeamProvider client-side).
 * Stessa logica del layout: cookie active_team_id, altrimenti prima squadra.
 */
export async function getActiveTeam() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const teams = await getTeamsForCurrentUser(supabase, user.id);
  if (teams.length === 0) redirect('/onboarding');

  const cookieStore = await cookies();
  const preferredTeamId = cookieStore.get('active_team_id')?.value;
  // teams.length === 0 è già stato gestito col redirect sopra, quindi
  // teams[0] esiste sempre qui: l'asserzione è sicura a runtime.
  const activeTeam = teams.find((t) => t.id === preferredTeamId) ?? teams[0]!;

  return { supabase, user, teams, activeTeam };
}
