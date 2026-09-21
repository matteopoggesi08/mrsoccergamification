import { getActiveTeam } from '@/lib/active-team';
import { inviteCollaboratorAction, removeCollaboratorAction } from '@/actions/collaborators.actions';
import { TEAM_ROLE_LABELS } from '@/constants/roles';
import { InviteForm } from './invite-form';

export default async function CollaboratoriPage() {
  const { supabase, activeTeam } = await getActiveTeam();

  const { data: members } = await supabase
    .from('team_members')
    .select('id, role, profiles(full_name)')
    .eq('team_id', activeTeam.id);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Collaboratori</h2>

      <InviteForm teamId={activeTeam.id} />

      <div className="space-y-2">
        {(members ?? []).map((m) => (
          <div key={m.id} className="flex items-center justify-between rounded-xl border bg-card p-3">
            <div>
              <p className="font-medium">
                {(m.profiles as unknown as { full_name: string } | null)?.full_name ?? 'Utente'}
              </p>
              <p className="text-sm text-muted-foreground">{TEAM_ROLE_LABELS[m.role as 'vice' | 'collaboratore']}</p>
            </div>
            <form action={removeCollaboratorAction.bind(null, m.id, activeTeam.id)}>
              <button type="submit" className="text-sm text-destructive">
                Rimuovi
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
