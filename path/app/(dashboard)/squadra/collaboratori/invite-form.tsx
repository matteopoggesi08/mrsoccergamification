'use client';

import { useActionState } from 'react';
import { inviteCollaboratorAction, type InviteState } from '@/actions/collaborators.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const initialState: InviteState = null;

export function InviteForm({ teamId }: { teamId: string }) {
  const action = inviteCollaboratorAction.bind(null, teamId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-2 rounded-xl border bg-card p-3">
      <Input name="email" type="email" placeholder="Email del collaboratore" required />
      <select name="role" className="h-10 w-full rounded-lg border px-2 text-sm">
        <option value="collaboratore">Collaboratore</option>
        <option value="vice">Vice allenatore</option>
      </select>
      {state?.message && <p className="text-sm text-muted-foreground">{state.message}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Invio…' : 'Invita'}
      </Button>
    </form>
  );
}
