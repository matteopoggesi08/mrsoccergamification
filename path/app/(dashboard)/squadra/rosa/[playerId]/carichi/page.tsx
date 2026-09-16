import { notFound } from 'next/navigation';
import { getActiveTeam } from '@/lib/active-team';
import { getPlayerWorkload, acwrInsight } from '@/services/workload.service';
import { WorkloadChart } from '@/components/players/workload-chart';

export default async function CarichiPage({
  params,
}: {
  params: Promise<{ playerId: string }>;
}) {
  const { playerId } = await params;
  const { supabase, activeTeam } = await getActiveTeam();

  const { data: player } = await supabase
    .from('players')
    .select('id, first_name, last_name')
    .eq('id', playerId)
    .eq('team_id', activeTeam.id)
    .single();

  if (!player) notFound();

  const workload = await getPlayerWorkload(supabase, playerId);
  const latest = workload[workload.length - 1];
  const insight = latest ? acwrInsight(latest.acwr) : null;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">
        Carichi · {player.first_name} {player.last_name}
      </h2>

      {workload.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Ancora nessun dato RPE per questo giocatore.
        </p>
      ) : (
        <>
          <WorkloadChart data={workload} />

          {insight && (
            <div className="rounded-xl border bg-card p-3 text-sm">
              <p className="font-medium">Insight</p>
              <p className="text-muted-foreground">{insight}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-xl border bg-card p-2">
              <p className="text-muted-foreground">ACWR</p>
              <p className="text-lg font-semibold">{latest?.acwr ?? '–'}</p>
            </div>
            <div className="rounded-xl border bg-card p-2">
              <p className="text-muted-foreground">Monotonia</p>
              <p className="text-lg font-semibold">{latest?.monotony ?? '–'}</p>
            </div>
            <div className="rounded-xl border bg-card p-2">
              <p className="text-muted-foreground">Strain</p>
              <p className="text-lg font-semibold">{latest?.strain ?? '–'}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
