import { getActiveTeam } from '@/lib/active-team';
import { createTrainingAction } from '@/actions/trainings.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default async function NuovoAllenamentoPage() {
  const { activeTeam } = await getActiveTeam();
  const action = createTrainingAction.bind(null, activeTeam.id);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Nuova seduta</h2>
      <form action={action} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Tipo di seduta</Label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium has-[:checked]:border-primary has-[:checked]:bg-primary/10">
              <input
                type="radio"
                name="sessionType"
                value="allenamento"
                defaultChecked
                className="accent-primary"
              />
              Allenamento
            </label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium has-[:checked]:border-primary has-[:checked]:bg-primary/10">
              <input type="radio" name="sessionType" value="partita" className="accent-primary" />
              Partita
            </label>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sessionDate">Data</Label>
          <Input id="sessionDate" name="sessionDate" type="date" defaultValue={today} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="title">Titolo (opzionale)</Label>
          <Input id="title" name="title" placeholder="Seduta tecnica" />
        </div>
        <Button type="submit">Crea e inizia seduta</Button>
      </form>
    </div>
  );
}
