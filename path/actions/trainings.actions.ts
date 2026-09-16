'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function createTrainingAction(teamId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const sessionDate = (formData.get('sessionDate') as string) || new Date().toISOString().slice(0, 10);
  const title = (formData.get('title') as string) || null;
  const sessionType = (formData.get('sessionType') as 'allenamento' | 'partita') || 'allenamento';

  const { data: training, error } = await supabase
    .from('trainings')
    .insert({ team_id: teamId, session_date: sessionDate, title, session_type: sessionType, created_by: user.id })
    .select('id')
    .single();

  if (error || !training) {
    throw new Error('Impossibile creare la seduta.');
  }

  revalidatePath('/allenamenti');
  redirect(`/allenamenti/${training.id}`);
}

export async function updateTrainingAction(trainingId: string, formData: FormData) {
  const supabase = await createClient();

  const title = (formData.get('title') as string) || null;
  const sessionDate = formData.get('sessionDate') as string;
  const notes = (formData.get('notes') as string) || null;
  const sessionType = (formData.get('sessionType') as 'allenamento' | 'partita') || 'allenamento';

  await supabase
    .from('trainings')
    .update({ title, session_date: sessionDate, notes, session_type: sessionType })
    .eq('id', trainingId);

  revalidatePath(`/allenamenti/${trainingId}`);
  revalidatePath('/allenamenti');
}

export async function deleteTrainingAction(trainingId: string) {
  const supabase = await createClient();
  await supabase.from('trainings').delete().eq('id', trainingId);
  revalidatePath('/allenamenti');
  redirect('/allenamenti');
}
