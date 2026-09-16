import { getActiveTeam } from '@/lib/active-team';
import { getTeamStandings } from '@/services/standings.service';
import { createPenaltyAction } from '@/actions/penalties.actions';
import { Button } from '@/components/ui/button';

export default async function ClassificaPage() {
  const { supabase, activeTeam } = await getActiveTeam();
  const standings = await getTeamStandings(supabase, activeTeam.id);
  const { data: players } = await supabase
    .from('players')
    .select('id, first_name, last_name')
    .eq('team_id', activeTeam.id);

  const penaltyAction = createPenaltyAction.bind(null, activeTeam.id);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Classifica</h2>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-xs text-muted-foreground">
            <tr>
              <th className="p-2 text-left">#</th>
              <th className="p-2 text-left">Giocatore</th>
              <th className="p-2">Pt</th>
              <th className="p-2">V</th>
              <th className="p-2">N</th>
              <th className="p-2">P</th>
              <th className="p-2">Pres.</th>
              <th className="p-2">Min.</th>
              <th className="p-2">%V</th>
              <th className="p-2">Pen.</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s, i) => (
              <tr key={s.player_id} className="border-t">
                <td className="p-2">{i + 1}</td>
                <td className="p-2 font-medium">{s.full_name}</td>
                <td className="p-2 text-center font-semibold">{s.points}</td>
                <td className="p-2 text-center">{s.wins}</td>
                <td className="p-2 text-center">{s.draws}</td>
                <td className="p-2 text-center">{s.losses}</td>
                <td className="p-2 text-center">{s.attendances_count}</td>
                <td className="p-2 text-center">{s.minutes_total}</td>
                <td className="p-2 text-center">{s.win_rate}%</td>
                <td className="p-2 text-center text-destructive">
                  {s.penalty_points > 0 ? `-${s.penalty_points}` : '–'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <details className="rounded-xl border bg-card p-3">
        <summary className="cursor-pointer text-sm font-medium">Aggiungi penalità</summary>
        <form action={penaltyAction} className="mt-3 space-y-2">
          <select name="playerId" required className="h-10 w-full rounded-lg border px-2 text-sm">
            {(players ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.first_name} {p.last_name}
              </option>
            ))}
          </select>
          <input
            name="points"
            type="number"
            placeholder="Punti da togliere"
            required
            className="h-10 w-full rounded-lg border px-2 text-sm"
          />
          <input
            name="reason"
            placeholder="Motivazione (opzionale)"
            className="h-10 w-full rounded-lg border px-2 text-sm"
          />
          <Button type="submit">Applica penalità</Button>
        </form>
      </details>
    </div>
  );
}
