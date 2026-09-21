import { getActiveTeam } from '@/lib/active-team';
import { createPlayerAction } from '@/actions/players.actions';
import { PlayerForm } from '@/components/players/player-form';

export default async function NuovoGiocatorePage() {
  const { activeTeam } = await getActiveTeam();
  const action = createPlayerAction.bind(null, activeTeam.id);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Nuovo giocatore</h2>
      <PlayerForm action={action} submitLabel="Aggiungi alla rosa" />
    </div>
  );
}
