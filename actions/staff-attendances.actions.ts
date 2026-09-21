'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function setStaffAttendanceAction(
  trainingId: string,
  staffId: string,
  status: 'presente' | 'assente'
) {
  const supabase = await createClient();
  await supabase
    .from('staff_attendances')
    .upsert(
      { training_id: trainingId, staff_id: staffId, status },
      { onConflict: 'training_id,staff_id' }
    );
  // Niente revalidate della pagina stessa: lo stato locale del
  // componente già riflette il cambio.
}
