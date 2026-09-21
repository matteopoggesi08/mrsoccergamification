'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { setRpeAction } from '@/actions/rpe.actions';
import { useSaveFeedback } from '@/hooks/use-save-feedback';
import { cn } from '@/lib/utils';

export function RpeInput({
  trainingId,
  playerId,
  playerName,
  initialRpe,
  initialDuration,
}: {
  trainingId: string;
  playerId: string;
  playerName: string;
  initialRpe?: number;
  initialDuration?: number;
}) {
  const [rpe, setRpe] = useState(initialRpe ?? 0);
  const [duration, setDuration] = useState(initialDuration ?? 60);
  const { saved, run } = useSaveFeedback();

  function save(nextRpe: number, nextDuration: number) {
    if (nextRpe < 1) return;
    run(() => setRpeAction(trainingId, playerId, nextRpe, nextDuration));
  }

  return (
    <div className="space-y-2 rounded-xl border bg-card p-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-medium">
          {playerName}
          {saved && <Check className="h-3.5 w-3.5 text-green-600" />}
        </span>
        <input
          type="number"
          value={duration}
          min={1}
          onChange={(e) => {
            const v = Number(e.target.value);
            setDuration(v);
            save(rpe, v);
          }}
          className="h-8 w-16 rounded border text-center text-sm"
        />
      </div>
      <div className="flex gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => {
              setRpe(n);
              save(n, duration);
            }}
            className={cn(
              'h-8 flex-1 rounded text-xs font-semibold transition-colors active:scale-95',
              n === rpe ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
