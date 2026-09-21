'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type InviteState = { message?: string } | null;

export async function inviteCollaboratorAction(
  teamId: string,
  _prevState: InviteState,
  formData: FormData
): Promise<InviteState> {
  const supabase = await createClient();
  const email = formData.get('email') as string;
  const role = (formData.get('role') as 'vice' | 'collaboratore') || 'collaboratore';

  const { data, error } = await supabase.rpc('invite_collaborator_by_email', {
    p_team_id: teamId,
    p_email: email,
    p_role: role,
  });

  if (error) return { message: 'Errore. Solo l\'allenatore può invitare.' };
  if (data === 'not_found') {
    return { message: 'Nessun utente registrato con questa email. Deve prima creare un account.' };
  }

  revalidatePath('/squadra/collaboratori');
  return { message: 'Collaboratore aggiunto.' };
}

export async function removeCollaboratorAction(teamMemberId: string, teamId: string) {
  const supabase = await createClient();
  await supabase.from('team_members').delete().eq('id', teamMemberId);
  revalidatePath('/squadra/collaboratori');
}
