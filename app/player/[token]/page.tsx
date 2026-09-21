import { notFound } from 'next/navigation';
import { getPlayerDataByToken } from '@/features/player-area/get-player-data';
import { WorkloadChart } from '@/components/players/workload-chart';
import type { WorkloadPoint } from '@/services/workload.service';

/**
 * Postgrest restituisce la relazione "trainings" annidata come oggetto
 * singolo (è una relazione many-to-one via training_id), ma senza lo
 * schema Database tipizzato lato client TypeScript non può esserne
 * certo a priori. Questa funzione gestisce difensivamente entrambe le
 * forme possibili, così un'eventuale differenza tra il tipo dichiarato
 * e il dato reale non rompe silenziosamente la UI.
 */
function normalizeTraining(
  value: unknown
): { id: string; session_date: string; title: string | null } | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value as { id: string; session_date: string; title: string | null };
}

export default async function PlayerAreaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await getPlayerDataByToken(token);

  if (!data) notFound();

  const { player, standing, position, trainings, workload } = data;
  const workloadData = (workload ?? []) as unknown as WorkloadPoint[];
  const latestWorkload = workloadData[workloadData.length - 1];

  return (
    <div className="min-h-dvh bg-background px-4 py-6">
      <div className="mx-auto max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold">
            {player.first_name} {player.last_name}
          </h1>
          <p className="text-sm text-muted-foreground">Area giocatore · sola lettura</p>
        </div>

        {standing && (
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-xl border bg-card p-3">
              <p className="text-2xl font-bold">{position}°</p>
              <p className="text-muted-foreground">Posizione</p>
            </div>
            <div className="rounded-xl border bg-card p-3">
              <p className="text-2xl font-bold">{standing.points}</p>
              <p className="text-muted-foreground">Punti</p>
            </div>
            <div className="rounded-xl border bg-card p-3">
              <p className="text-2xl font-bold">{standing.attendances_count}</p>
              <p className="text-muted-foreground">Presenze</p>
            </div>
          </div>
        )}

        {workloadData.length > 0 && (
          <div>
            <p className="mb-2 font-medium">Andamento carico (ACWR)</p>
            <WorkloadChart data={workloadData} />
            {latestWorkload && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Ultimo valore: ACWR {latestWorkload.acwr ?? '–'} · Monotonia{' '}
                {latestWorkload.monotony ?? '–'}
              </p>
            )}
          </div>
        )}

        <div>
          <p className="mb-2 font-medium">Storico allenamenti</p>
          <div className="space-y-1.5">
            {trainings.map((t, i) => {
              const training = normalizeTraining(t.trainings);
              return (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-sm"
                >
                  <span>{training?.title || 'Seduta'}</span>
                  <span className={t.status === 'presente' ? 'text-green-600' : 'text-destructive'}>
                    {t.status === 'presente' ? 'Presente' : 'Assente'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
