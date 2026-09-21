import type { createClient } from '@/lib/supabase/server';
import type { TeamSummary } from '@/types/domain';

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Restituisce tutte le squadre a cui l'utente ha accesso, come proprietario
 * (coach di una season) o come collaboratore/vice (team_members), con il
 * ruolo effettivo per ciascuna.
 */
export async function getTeamsForCurrentUser(
  supabase: SupabaseServerClient,
  userId: string
): Promise<TeamSummary[]> {
  const { data: ownedTeams, error: ownedError } = await supabase
    .from('teams')
    .select('id, name, category, logo_url, season_id, seasons!inner(id, name, coach_id)')
    .eq('seasons.coach_id', userId);

  if (ownedError) throw ownedError;

  const { data: memberTeams, error: memberError } = await supabase
    .from('team_members')
    .select('role, teams!inner(id, name, category, logo_url, season_id, seasons!inner(id, name))')
    .eq('user_id', userId);

  if (memberError) throw memberError;

  const owned: TeamSummary[] = (ownedTeams ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    category: t.category,
    logoUrl: t.logo_url,
    seasonId: t.season_id,
    seasonName: (t.seasons as unknown as { name: string }).name,
    role: 'allenatore',
  }));

  const member: TeamSummary[] = (memberTeams ?? []).map((m) => {
    const team = m.teams as unknown as {
      id: string;
      name: string;
      category: string | null;
      logo_url: string | null;
      season_id: string;
      seasons: { name: string };
    };
    return {
      id: team.id,
      name: team.name,
      category: team.category,
      logoUrl: team.logo_url,
      seasonId: team.season_id,
      seasonName: team.seasons.name,
      role: m.role as TeamSummary['role'],
    };
  });

  const merged = new Map<string, TeamSummary>();
  [...owned, ...member].forEach((t) => merged.set(t.id, t));
  return Array.from(merged.values());
}
