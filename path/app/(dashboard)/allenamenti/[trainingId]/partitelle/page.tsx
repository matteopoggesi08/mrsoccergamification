import { getActiveTeam } from '@/lib/active-team';
import { createMatchAction } from '@/actions/matches.actions';
import { MatchCard } from '@/components/trainings/match-card';
import { Button } from '@/components/ui/button';
import { TrainingTabs } from '@/components/trainings/training-tabs';

export default async function PartitellePage({
  params,
}: {
  params: Promise<{ trainingId: string }>;
}) {
  const { trainingId } = await params;
  const { supabase, activeTeam } = await getActiveTeam();

  const [{ data: players }, { data: matches }] = await Promise.all([
    supabase.from('players').select('id, first_name, last_name').eq('team_id', activeTeam.id),
    supabase.from('matches').select('*').eq('training_id', trainingId).order('created_at'),
  ]);

  const matchIds = (matches ?? []).map((m) => m.id);
  const { data: matchPlayers } = matchIds.length
    ? await supabase
        .from('match_players')
        .select('match_id, player_id, team_side, minutes_played')
        .in('match_id', matchIds)
    : { data: [] };

  const createAction = createMatchAction.bind(null, trainingId);

  return (
    <div className="space-y-4">
      <TrainingTabs trainingId={trainingId} />
      <h2 className="text-lg font-semibold">Partitelle</h2>

      <form action={createAction} className="flex gap-2 rounded-xl border bg-card p-3">
        <input
          name="teamAName"
          placeholder="Squadra A"
          className="h-10 flex-1 rounded-lg border px-2 text-sm"
        />
        <input
          name="teamBName"
          placeholder="Squadra B"
          className="h-10 flex-1 rounded-lg border px-2 text-sm"
        />
        <Button type="submit" className="w-auto px-4">
          +
        </Button>
      </form>

      <div className="space-y-3">
        {(matches ?? []).map((m) => (
          <MatchCard
            key={m.id}
            match={m}
            trainingId={trainingId}
            players={players ?? []}
            matchPlayers={(matchPlayers ?? []).filter((mp) => mp.match_id === m.id)}
          />
        ))}
      </div>
    </div>
  );
}
