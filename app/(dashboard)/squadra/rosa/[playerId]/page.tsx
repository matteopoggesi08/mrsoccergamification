import { notFound } from 'next/navigation';
import { Link2, RefreshCw, Trash2, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { getActiveTeam } from '@/lib/active-team';
import { updatePlayerAction, deletePlayerAction, regeneratePlayerTokenAction } from '@/actions/players.actions';
import { PlayerForm } from '@/components/players/player-form';

export default async function GiocatorePage({
  params,
}: {
  params: Promise<{ playerId: string }>;
}) {
  const { playerId } = await params;
  const { supabase, activeTeam } = await getActiveTeam();

  const { data: player } = await supabase
    .from('players')
    .select('*')
    .eq('id', playerId)
    .eq('team_id', activeTeam.id)
    .single();

  if (!player) notFound();

  const { data: tokenRow } = await supabase
    .from('player_tokens')
    .select('token')
    .eq('player_id', playerId)
    .single();

  const playerLink = tokenRow ? `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/player/${tokenRow.token}` : null;
  const updateAction = updatePlayerAction.bind(null, playerId, activeTeam.id);
  const deleteAction = deletePlayerAction.bind(null, playerId);
  const regenerateAction = regeneratePlayerTokenAction.bind(null, playerId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {player.first_name} {player.last_name}
        </h2>
        <Link
          href={`/squadra/rosa/${player.id}/carichi`}
          className="flex items-center gap-1 text-sm text-primary"
        >
          <TrendingUp className="h-4 w-4" /> Carichi
        </Link>
      </div>

      <div className="rounded-xl border bg-card p-4 space-y-3">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Link2 className="h-4 w-4" /> Link giocatore (sola lettura, senza login)
        </p>
        {playerLink && (
          <p className="break-all rounded-lg bg-muted p-2 text-xs text-muted-foreground">
            {playerLink}
          </p>
        )}
        <form action={regenerateAction}>
          <button
            type="submit"
            className="flex items-center gap-1 text-sm text-primary underline"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Rigenera link (invalida il precedente)
          </button>
        </form>
      </div>

      <PlayerForm action={updateAction} player={player} submitLabel="Salva modifiche" />

      <form action={deleteAction}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 py-2.5 text-sm font-medium text-destructive"
        >
          <Trash2 className="h-4 w-4" /> Rimuovi dalla rosa
        </button>
      </form>
    </div>
  );
}
