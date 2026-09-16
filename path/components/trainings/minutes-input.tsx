'use client';

import { useState } from 'react';
import { Minus, Plus, Check } from 'lucide-react';
import { setTrainingMinutesAction } from '@/actions/minutes.actions';
import { useSaveFeedback } from '@/hooks/use-save-feedback';

const STEP = 5;

export function MinutesInput({
  trainingId,
  playerId,
  playerName,
  initialMinutes,
}: {
  trainingId: string;
  playerId: string;
  playerName: string;
  initialMinutes?: number;
}) {
  const [minutes, setMinutes] = useState(initialMinutes ?? 0);
  const { saved, run } = useSaveFeedback();

  function save(next: number) {
    const clamped = Math.max(0, next);
    setMinutes(clamped);
    run(() => setTrainingMinutesAction(trainingId, playerId, clamped));
  }

  return (
    <div className="flex items-center justify-between rounded-xl border bg-card p-3">
      <span className="flex items-center gap-1.5 font-medium">
        {playerName}
        {saved && <Check className="h-3.5 w-3.5 text-green-600" />}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Diminuisci"
          onClick={() => save(minutes - STEP)}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground active:scale-95"
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          type="number"
          value={minutes}
          onChange={(e) => save(Number(e.target.value))}
          className="h-8 w-14 rounded-lg border text-center text-sm"
        />
        <button
          type="button"
          aria-label="Aumenta"
          onClick={() => save(minutes + STEP)}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary active:scale-95"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
