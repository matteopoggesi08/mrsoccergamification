'use client';

import { useState } from 'react';
import { Trash2, Check } from 'lucide-react';
import { updateTournamentMatchAction, deleteTournamentMatchAction } from '@/actions/tournaments.actions';
import { useSaveFeedback } from '@/hooks/use-save-feedback';

export function TournamentMatchRow({
  matchId,
  trainingId,
  teamAName,
  teamBName,
  initialScoreA,
  initialScoreB,
}: {
  matchId: string;
  trainingId: string;
  teamAName: string;
  teamBName: string;
  initialScoreA: number;
  initialScoreB: number;
}) {
  const [a, setA] = useState(initialScoreA);
  const [b, setB] = useState(initialScoreB);
  const { saved, run } = useSaveFeedback();

  function save() {
    run(() => updateTournamentMatchAction(matchId, trainingId, a, b));
  }

  return (
    <div className="flex items-center justify-center gap-2 py-1.5 text-sm">
      <span className="flex-1 truncate text-right">{teamAName}</span>
      <input
        type="number"
        value={a}
        onChange={(e) => setA(Number(e.target.value))}
        onBlur={save}
        className="h-8 w-12 rounded border text-center"
      />
      <span>–</span>
      <input
        type="number"
        value={b}
        onChange={(e) => setB(Number(e.target.value))}
        onBlur={save}
        className="h-8 w-12 rounded border text-center"
      />
      <span className="flex-1 truncate">{teamBName}</span>
      {saved && <Check className="h-3.5 w-3.5 shrink-0 text-green-600" />}
      <button
        type="button"
        aria-label="Elimina partita"
        onClick={() => run(() => deleteTournamentMatchAction(matchId, trainingId))}
        className="ml-1 shrink-0 text-muted-foreground"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
