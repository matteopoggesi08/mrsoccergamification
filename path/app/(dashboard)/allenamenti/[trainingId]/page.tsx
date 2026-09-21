import { notFound } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import { getActiveTeam } from '@/lib/active-team';
import { updateTrainingAction, deleteTrainingAction } from '@/actions/trainings.actions';
import { TrainingTabs } from '@/components/trainings/training-tabs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default async function AllenamentoHubPage({
  params,
}: {
  params: Promise<{ trainingId: string }>;
}) {
  const { trainingId } = await params;
  const { supabase, activeTeam } = await getActiveTeam();

  const { data: training } = await supabase
    .from('trainings')
    .select('id, session_date, title, notes, session_type')
    .eq('id', trainingId)
    .eq('team_id', activeTeam.id)
    .single();

  if (!training) notFound();

  const updateAction = updateTrainingAction.bind(null, trainingId);
  const deleteAction = deleteTrainingAction.bind(null, trainingId);
  const isPartita = training.session_type === 'partita';

  return (
    <div className="space-y-4">
      <TrainingTabs trainingId={trainingId} />

      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{training.title || 'Seduta'}</h2>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                isPartita ? 'bg-orange-500/15 text-orange-600' : 'bg-primary/10 text-primary'
              )}
            >
              {isPartita ? 'Partita' : 'Allenamento'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {new Date(training.session_date).toLocaleDateString('it-IT', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
        </div>
      </div>

      <details className="group rounded-xl border bg-card p-3">
        <summary className="flex cursor-pointer items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <Pencil className="h-3.5 w-3.5" /> Modifica seduta
        </summary>
        <form action={updateAction} className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border p-2 text-sm font-medium has-[:checked]:border-primary has-[:checked]:bg-primary/10">
              <input
                type="radio"
                name="sessionType"
                value="allenamento"
                defaultChecked={!isPartita}
                className="accent-primary"
              />
              Allenamento
            </label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border p-2 text-sm font-medium has-[:checked]:border-primary has-[:checked]:bg-primary/10">
              <input
                type="radio"
                name="sessionType"
                value="partita"
                defaultChecked={isPartita}
                className="accent-primary"
              />
              Partita
            </label>
          </div>
          <input
            name="title"
            defaultValue={training.title ?? ''}
            placeholder="Titolo (es. Seduta tecnica)"
            className="h-10 w-full rounded-lg border px-2 text-sm"
          />
          <input
            name="sessionDate"
            type="date"
            defaultValue={training.session_date}
            required
            className="h-10 w-full rounded-lg border px-2 text-sm"
          />
          <textarea
            name="notes"
            defaultValue={training.notes ?? ''}
            placeholder="Note sulla seduta (opzionale)"
            rows={2}
            className="w-full rounded-lg border px-2 py-1.5 text-sm"
          />
          <Button type="submit" className="w-auto px-4">
            Salva
          </Button>
        </form>
        <form action={deleteAction} className="mt-2">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-destructive/30 py-2 text-sm text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" /> Elimina seduta
          </button>
        </form>
      </details>

      <p className="text-center text-xs text-muted-foreground">
        Usa le schede sopra per muoverti tra Presenze, Partitelle, Tornei, RPE e Minutaggi
      </p>
    </div>
  );
}
