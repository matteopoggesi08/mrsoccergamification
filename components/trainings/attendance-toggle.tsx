'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { setAttendanceAction } from '@/actions/attendances.actions';
import { useSaveFeedback } from '@/hooks/use-save-feedback';
import { cn } from '@/lib/utils';

type Props = {
  trainingId: string;
  playerId: string;
  playerName: string;
  initialStatus: 'presente' | 'assente' | null;
};

export function AttendanceToggle({ trainingId, playerId, playerName, initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const { saved, run } = useSaveFeedback();

  function set(next: 'presente' | 'assente') {
    setStatus(next); // aggiornamento immediato, non aspetta la rete
    run(() => setAttendanceAction(trainingId, playerId, next));
  }

  return (
    <div className="flex items-center justify-between rounded-xl border bg-card p-3">
      <span className="flex items-center gap-1.5 font-medium">
        {playerName}
        {saved && <Check className="h-3.5 w-3.5 text-green-600" />}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => set('presente')}
          className={cn(
            'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors active:scale-95',
            status === 'presente' ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'
          )}
        >
          Presente
        </button>
        <button
          type="button"
          onClick={() => set('assente')}
          className={cn(
            'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors active:scale-95',
            status === 'assente' ? 'bg-destructive text-white' : 'bg-muted text-muted-foreground'
          )}
        >
          Assente
        </button>
      </div>
    </div>
  );
}
