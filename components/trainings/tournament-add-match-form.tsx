'use client';

import { useState, useTransition } from 'react';
import { Plus } from 'lucide-react';
import { createTournamentMatchAction } from '@/actions/tournaments.actions';

export function TournamentAddMatchForm({
  tournamentId,
  trainingId,
  teams,
}: {
  tournamentId: string;
  trainingId: string;
  teams: { id: string; name: string }[];
}) {
  const [teamA, setTeamA] = useState(teams[0]?.id ?? '');
  const [teamB, setTeamB] = useState(teams[1]?.id ?? teams[0]?.id ?? '');
  const [isPending, startTransition] = useTransition();

  if (teams.length < 2) return null;

  return (
    <div className="flex items-center gap-2 border-t pt-2">
      <select
        value={teamA}
        onChange={(e) => setTeamA(e.target.value)}
        className="h-8 flex-1 rounded border text-xs"
      >
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <span className="text-xs text-muted-foreground">vs</span>
      <select
        value={teamB}
        onChange={(e) => setTeamB(e.target.value)}
        className="h-8 flex-1 rounded border text-xs"
      >
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={isPending || teamA === teamB}
        onClick={() =>
          startTransition(() => createTournamentMatchAction(tournamentId, trainingId, teamA, teamB))
        }
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary disabled:opacity-40"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
