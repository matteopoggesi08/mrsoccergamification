'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { staffSchema } from '@/features/staff/schemas';

export type StaffActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

export async function createStaffAction(
  teamId: string,
  _prevState: StaffActionState,
  formData: FormData
): Promise<StaffActionState> {
  const parsed = staffSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    role: formData.get('role') || undefined,
    phone: formData.get('phone') || undefined,
    notes: formData.get('notes') || undefined,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('staff_members').insert({
    team_id: teamId,
    first_name: parsed.data.firstName,
    last_name: parsed.data.lastName,
    role: parsed.data.role ?? null,
    phone: parsed.data.phone ?? null,
    notes: parsed.data.notes ?? null,
  });

  if (error) return { error: 'Impossibile aggiungere il membro dello staff.' };

  revalidatePath('/squadra/staff');
  redirect('/squadra/staff');
}

export async function updateStaffAction(
  staffId: string,
  _prevState: StaffActionState,
  formData: FormData
): Promise<StaffActionState> {
  const parsed = staffSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    role: formData.get('role') || undefined,
    phone: formData.get('phone') || undefined,
    notes: formData.get('notes') || undefined,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('staff_members')
    .update({
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      role: parsed.data.role ?? null,
      phone: parsed.data.phone ?? null,
      notes: parsed.data.notes ?? null,
    })
    .eq('id', staffId);

  if (error) return { error: 'Impossibile salvare le modifiche.' };

  revalidatePath('/squadra/staff');
  redirect('/squadra/staff');
}

export async function deleteStaffAction(staffId: string) {
  const supabase = await createClient();
  await supabase.from('staff_members').delete().eq('id', staffId);
  revalidatePath('/squadra/staff');
  redirect('/squadra/staff');
}
