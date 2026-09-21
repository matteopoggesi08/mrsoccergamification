import { getActiveTeam } from '@/lib/active-team';
import { MinutesInput } from '@/components/trainings/minutes-input';
import { TrainingTabs } from '@/components/trainings/training-tabs';

export default async function MinutaggiPage({
  params,
}: {
  params: Promise<{ trainingId: string }>;
}) {
  const { trainingId } = await params;
  const { supabase, activeTeam } = await getActiveTeam();

  const [{ data: players }, { data: entries }] = await Promise.all([
    supabase.from('players').select('id, first_name, last_name').eq('team_id', activeTeam.id),
    supabase.from('training_minutes').select('player_id, minutes').eq('training_id', trainingId),
  ]);

  const byPlayer = new Map((entries ?? []).map((e) => [e.player_id, e.minutes]));

  return (
    <div className="space-y-4">
      <TrainingTabs trainingId={trainingId} />
      <div>
        <h2 className="text-lg font-semibold">Minutaggi</h2>
        <p className="text-sm text-muted-foreground">Minuti giocati da ciascun giocatore in questa seduta</p>
      </div>
      <div className="space-y-2">
        {(players ?? []).map((p) => (
          <MinutesInput
            key={p.id}
            trainingId={trainingId}
            playerId={p.id}
            playerName={`${p.first_name} ${p.last_name}`}
            initialMinutes={byPlayer.get(p.id)}
          />
        ))}
      </div>
    </div>
  );
}
