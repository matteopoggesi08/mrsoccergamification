'use client';

import { useActionState } from 'react';
import { createSeasonWithTeamAction, type OnboardingActionState } from '@/actions/seasons.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const initialState: OnboardingActionState = null;

export function OnboardingForm() {
  const [state, formAction, isPending] = useActionState(createSeasonWithTeamAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="seasonName">Nome stagione</Label>
        <Input id="seasonName" name="seasonName" placeholder="2025/2026" required />
        {state?.fieldErrors?.seasonName && (
          <p className="text-sm text-destructive">{state.fieldErrors.seasonName[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="teamName">Nome squadra</Label>
        <Input id="teamName" name="teamName" placeholder="Under 15" required />
        {state?.fieldErrors?.teamName && (
          <p className="text-sm text-destructive">{state.fieldErrors.teamName[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category">Categoria (opzionale)</Label>
        <Input id="category" name="category" placeholder="Giovanissimi" />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Creazione in corso…' : 'Crea squadra'}
      </Button>
    </form>
  );
}
