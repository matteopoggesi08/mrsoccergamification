import Link from 'next/link';
import { PlusCircle, Users, Swords, Activity, CalendarDays } from 'lucide-react';
import { getActiveTeam } from '@/lib/active-team';
import { getTrainingsSummary } from '@/services/trainings.service';
import { cn } from '@/lib/utils';

export default async function AllenamentiPage() {
  const { supabase, activeTeam } = await getActiveTeam();
  const trainings = await getTrainingsSummary(supabase, activeTeam.id);

  const totalSessions = trainings.length;
  const totalPresences = trainings.reduce((sum, t) => sum + t.presences_count, 0);
  const totalMatches = trainings.reduce((sum, t) => sum + t.matches_count, 0);
  const rpeValues = trainings.map((t) => t.avg_rpe).filter((v): v is number => v != null);
  const avgRpeSeason = rpeValues.length
    ? Math.round((rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length) * 10) / 10
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Sedute</h2>
        <Link
          href="/allenamenti/nuovo"
          className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
        >
          <PlusCircle className="h-4 w-4" /> Nuova
        </Link>
      </div>

      {totalSessions > 0 && (
        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-xl border bg-card p-2.5 text-center">
            <p className="text-lg font-semibold">{totalSessions}</p>
            <p className="text-[11px] text-muted-foreground">Sedute</p>
          </div>
          <div className="rounded-xl border bg-card p-2.5 text-center">
            <p className="text-lg font-semibold">{totalPresences}</p>
            <p className="text-[11px] text-muted-foreground">Presenze tot.</p>
          </div>
          <div className="rounded-xl border bg-card p-2.5 text-center">
            <p className="text-lg font-semibold">{totalMatches}</p>
            <p className="text-[11px] text-muted-foreground">Partitelle</p>
          </div>
          <div className="rounded-xl border bg-card p-2.5 text-center">
            <p className="text-lg font-semibold">{avgRpeSeason ?? '–'}</p>
            <p className="text-[11px] text-muted-foreground">RPE medio</p>
          </div>
        </div>
      )}

      {trainings.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Nessuna seduta registrata ancora.
        </p>
      ) : (
        <div className="space-y-2">
          {trainings.map((t) => {
            const isPartita = t.session_type === 'partita';
            return (
              <Link
                key={t.id}
                href={`/allenamenti/${t.id}`}
                className="block rounded-xl border bg-card p-3.5 transition-colors hover:bg-accent"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{t.title || 'Seduta'}</span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[11px] font-medium',
                        isPartita ? 'bg-orange-500/15 text-orange-600' : 'bg-primary/10 text-primary'
                      )}
                    >
                      {isPartita ? 'Partita' : 'Allenamento'}
                    </span>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {new Date(t.session_date).toLocaleDateString('it-IT', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {t.presences_count} presenti
                    {t.absences_count > 0 ? ` · ${t.absences_count} assenti` : ''}
                  </span>
                  {t.matches_count > 0 && (
                    <span className="flex items-center gap-1">
                      <Swords className="h-3.5 w-3.5" />
                      {t.matches_count} partitell{t.matches_count === 1 ? 'a' : 'e'}
                    </span>
                  )}
                  {t.avg_rpe != null && (
                    <span className="flex items-center gap-1">
                      <Activity className="h-3.5 w-3.5" />
                      RPE medio {t.avg_rpe}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
