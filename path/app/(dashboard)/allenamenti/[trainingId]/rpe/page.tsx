import { getActiveTeam } from '@/lib/active-team';
import { RpeInput } from '@/components/trainings/rpe-input';
import { TrainingTabs } from '@/components/trainings/training-tabs';

export default async function RpePage({
  params,
}: {
  params: Promise<{ trainingId: string }>;
}) {
  const { trainingId } = await params;
  const { supabase, activeTeam } = await getActiveTeam();

  const [{ data: players }, { data: entries }] = await Promise.all([
    supabase.from('players').select('id, first_name, last_name').eq('team_id', activeTeam.id),
    supabase.from('rpe_entries').select('player_id, rpe, duration_minutes').eq('training_id', trainingId),
  ]);

  const byPlayer = new Map((entries ?? []).map((e) => [e.player_id, e]));

  return (
    <div className="space-y-4">
      <TrainingTabs trainingId={trainingId} />
      <div>
        <h2 className="text-lg font-semibold">RPE e Carichi</h2>
        <p className="text-sm text-muted-foreground">Scala di Borg 1–10 · durata in minuti</p>
      </div>
      <div className="space-y-2">
        {(players ?? []).map((p) => (
          <RpeInput
            key={p.id}
            trainingId={trainingId}
            playerId={p.id}
            playerName={`${p.first_name} ${p.last_name}`}
            initialRpe={byPlayer.get(p.id)?.rpe}
            initialDuration={byPlayer.get(p.id)?.duration_minutes}
          />
        ))}
      </div>
    </div>
  );
}
