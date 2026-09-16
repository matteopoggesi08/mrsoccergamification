import { getActiveTeam } from '@/lib/active-team';
import { createTournamentAction } from '@/actions/tournaments.actions';
import { TournamentBlock } from '@/components/trainings/tournament-block';
import { Button } from '@/components/ui/button';
import { TrainingTabs } from '@/components/trainings/training-tabs';

export default async function TorneiPage({
  params,
}: {
  params: Promise<{ trainingId: string }>;
}) {
  const { trainingId } = await params;
  const { supabase } = await getActiveTeam();

  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('id, name, mode')
    .eq('training_id', trainingId);

  const createAction = createTournamentAction.bind(null, trainingId);

  return (
    <div className="space-y-4">
      <TrainingTabs trainingId={trainingId} />
      <h2 className="text-lg font-semibold">Tornei</h2>

      <form action={createAction} className="space-y-2 rounded-xl border bg-card p-3">
        <input name="name" placeholder="Nome torneo" className="h-10 w-full rounded-lg border px-2 text-sm" />
        <input
          name="teamNames"
          placeholder="Squadre separate da virgola (es. Rossi, Blu, Verdi)"
          className="h-10 w-full rounded-lg border px-2 text-sm"
        />
        <select name="mode" className="h-10 w-full rounded-lg border px-2 text-sm">
          <option value="risultati">Inserimento risultati</option>
          <option value="classifica">Inserimento classifica finale</option>
        </select>
        <Button type="submit">Crea torneo</Button>
      </form>

      {(tournaments ?? []).map((t) => (
        <TournamentBlock key={t.id} tournamentId={t.id} trainingId={trainingId} mode={t.mode} name={t.name} />
      ))}
    </div>
  );
}
