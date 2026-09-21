import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import { getActiveTeam } from '@/lib/active-team';
import { PlayerCard } from '@/components/players/player-card';

export default async function RosaPage() {
  const { supabase, activeTeam } = await getActiveTeam();

  const { data: players } = await supabase
    .from('players')
    .select('*')
    .eq('team_id', activeTeam.id)
    .order('jersey_number', { ascending: true, nullsFirst: false });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Rosa</h2>
        <Link
          href="/squadra/rosa/nuovo"
          className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
        >
          <UserPlus className="h-4 w-4" /> Aggiungi
        </Link>
      </div>

      {!players || players.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Nessun giocatore ancora. Aggiungi il primo della rosa.
        </p>
      ) : (
        <div className="space-y-2">
          {players.map((p) => (
            <PlayerCard key={p.id} player={p} />
          ))}
        </div>
      )}
    </div>
  );
}
