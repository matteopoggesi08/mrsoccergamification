'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { StaffActionState } from '@/actions/staff.actions';

type Staff = {
  first_name: string;
  last_name: string;
  role: string | null;
  phone: string | null;
  notes: string | null;
};

type Props = {
  action: (state: StaffActionState, formData: FormData) => Promise<StaffActionState>;
  staff?: Staff;
  submitLabel: string;
};

const initialState: StaffActionState = null;

export function StaffForm({ action, staff, submitLabel }: Props) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">Nome</Label>
          <Input id="firstName" name="firstName" defaultValue={staff?.first_name} required />
          {state?.fieldErrors?.firstName && (
            <p className="text-sm text-destructive">{state.fieldErrors.firstName[0]}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">Cognome</Label>
          <Input id="lastName" name="lastName" defaultValue={staff?.last_name} required />
          {state?.fieldErrors?.lastName && (
            <p className="text-sm text-destructive">{state.fieldErrors.lastName[0]}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="role">Ruolo</Label>
        <Input
          id="role"
          name="role"
          placeholder="Vice allenatore, Preparatore atletico, Fisioterapista…"
          defaultValue={staff?.role ?? undefined}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">Telefono</Label>
        <Input id="phone" name="phone" defaultValue={staff?.phone ?? undefined} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Note</Label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={staff?.notes ?? undefined}
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
