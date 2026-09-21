'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { setTournamentStandingAction } from '@/actions/tournaments.actions';
import { useSaveFeedback } from '@/hooks/use-save-feedback';

export function TournamentStandingRow({
  tournamentId,
  trainingId,
  tournamentTeamId,
  teamName,
  initialPosition,
  initialPoints,
}: {
  tournamentId: string;
  trainingId: string;
  tournamentTeamId: string;
  teamName: string;
  initialPosition?: number;
  initialPoints?: number;
}) {
  const [position, setPosition] = useState(initialPosition ?? 0);
  const [points, setPoints] = useState(initialPoints ?? 0);
  const { saved, run } = useSaveFeedback();

  function save() {
    run(() => setTournamentStandingAction(tournamentId, trainingId, tournamentTeamId, position, points));
  }

  return (
    <div className="flex items-center gap-2 py-1.5 text-sm">
      <span className="flex-1 truncate">{teamName}</span>
      <input
        type="number"
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        onBlur={save}
        placeholder="Pos."
        className="h-8 w-14 rounded border text-center"
      />
      <input
        type="number"
        value={points}
        onChange={(e) => setPoints(Number(e.target.value))}
        onBlur={save}
        placeholder="Punti"
        className="h-8 w-14 rounded border text-center"
      />
      {saved && <Check className="h-3.5 w-3.5 shrink-0 text-green-600" />}
    </div>
  );
}
