'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhotoInput } from './photo-input';
import { POSITION_LABELS } from '@/constants/positions';
import type { PlayerActionState } from '@/actions/players.actions';
import type { Database } from '@/types/database.types';

type Player = Database['public']['Tables']['players']['Row'];

type Props = {
  action: (state: PlayerActionState, formData: FormData) => Promise<PlayerActionState>;
  player?: Player;
  submitLabel: string;
};

const initialState: PlayerActionState = null;

export function PlayerForm({ action, player, submitLabel }: Props) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="flex justify-center">
        <PhotoInput defaultPhotoUrl={player?.photo_url} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">Nome</Label>
          <Input id="firstName" name="firstName" defaultValue={player?.first_name} required />
          {state?.fieldErrors?.firstName && (
            <p className="text-sm text-destructive">{state.fieldErrors.firstName[0]}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">Cognome</Label>
          <Input id="lastName" name="lastName" defaultValue={player?.last_name} required />
          {state?.fieldErrors?.lastName && (
            <p className="text-sm text-destructive">{state.fieldErrors.lastName[0]}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="jerseyNumber">Numero maglia</Label>
          <Input
            id="jerseyNumber"
            name="jerseyNumber"
            type="number"
            defaultValue={player?.jersey_number ?? undefined}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="position">Ruolo</Label>
          <select
            id="position"
            name="position"
            defaultValue={player?.position ?? ''}
            className="h-11 w-full rounded-xl border border-input bg-background px-3 text-base"
          >
            <option value="">—</option>
            {Object.entries(POSITION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="phone">Telefono</Label>
          <Input id="phone" name="phone" defaultValue={player?.phone ?? undefined} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="birthDate">Data di nascita</Label>
          <Input
            id="birthDate"
            name="birthDate"
            type="date"
            defaultValue={player?.birth_date ?? undefined}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Note</Label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={player?.notes ?? undefined}
          rows={3}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-base"
        />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Salvataggio…' : submitLabel}
      </Button>
    </form>
  );
}
