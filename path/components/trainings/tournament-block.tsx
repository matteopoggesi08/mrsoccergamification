import { revalidatePath } from 'next/cache';
import { getActiveTeam } from '@/lib/active-team';
import { TournamentMatchRow } from '@/components/trainings/tournament-match-row';
import { TournamentStandingRow } from '@/components/trainings/tournament-standing-row';
import { TournamentAddMatchForm } from '@/components/trainings/tournament-add-match-form';
import { Button } from '@/components/ui/button';

export async function TournamentBlock({
  tournamentId,
  trainingId,
  mode,
  name,
}: {
  tournamentId: string;
  trainingId: string;
  mode: string;
  name: string;
}) {
  const { supabase } = await getActiveTeam();
  const { data: teams } = await supabase
    .from('tournament_teams')
    .select('id, name')
    .eq('tournament_id', tournamentId);

  if (mode === 'classifica') {
    const { data: standings } = await supabase
      .from('tournament_standing_entries')
      .select('tournament_team_id, final_position, points')
      .eq('tournament_id', tournamentId);

    const byTeam = new Map((standings ?? []).map((s) => [s.tournament_team_id, s]));

    return (
      <div className="rounded-xl border bg-card p-3">
        <p className="mb-2 font-medium">{name}</p>
        {(teams ?? []).map((t) => (
          <TournamentStandingRow
            key={t.id}
            tournamentId={tournamentId}
            trainingId={trainingId}
            tournamentTeamId={t.id}
            teamName={t.name}
            initialPosition={byTeam.get(t.id)?.final_position}
            initialPoints={byTeam.get(t.id)?.points}
          />
        ))}
      </div>
    );
  }

  // modalità risultati: tutte le combinazioni round-robin come esempio,
  // il mister può cancellare quelle non giocate direttamente da Supabase
  // Studio o estendere con un pulsante "aggiungi partita" (v2)
  const { data: matches } = await supabase
    .from('tournament_matches')
    .select('id, team_a_id, team_b_id, score_a, score_b')
    .eq('tournament_id', tournamentId);

  const teamName = (id: string) => teams?.find((t) => t.id === id)?.name ?? '?';

  return (
    <div className="rounded-xl border bg-card p-3">
      <p className="mb-2 font-medium">{name}</p>
      {(matches ?? []).length === 0 && (
        <CreateRoundRobinForm tournamentId={tournamentId} trainingId={trainingId} teams={teams ?? []} />
      )}
      {(matches ?? []).map((m) => (
        <TournamentMatchRow
          key={m.id}
          matchId={m.id}
          trainingId={trainingId}
          teamAName={teamName(m.team_a_id)}
          teamBName={teamName(m.team_b_id)}
          initialScoreA={m.score_a}
          initialScoreB={m.score_b}
        />
      ))}
      <div className="mt-2">
        <TournamentAddMatchForm tournamentId={tournamentId} trainingId={trainingId} teams={teams ?? []} />
      </div>
    </div>
  );
}

function CreateRoundRobinForm({
  tournamentId,
  trainingId,
  teams,
}: {
  tournamentId: string;
  trainingId: string;
  teams: { id: string; name: string }[];
}) {
  async function generate() {
    'use server';
    const { supabase } = await getActiveTeam();
    const pairs: { team_a_id: string; team_b_id: string; tournament_id: string }[] = [];
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        pairs.push({ tournament_id: tournamentId, team_a_id: teams[i]!.id, team_b_id: teams[j]!.id });
      }
    }
    if (pairs.length > 0) await supabase.from('tournament_matches').insert(pairs);
    revalidatePath(`/allenamenti/${trainingId}/tornei`);
  }

  return (
    <form action={generate}>
      <Button type="submit" variant="outline">
        Genera partite (girone all&apos;italiana)
      </Button>
    </form>
  );
}
