import { notFound } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { getActiveTeam } from '@/lib/active-team';
import { updateStaffAction, deleteStaffAction } from '@/actions/staff.actions';
import { StaffForm } from '@/components/staff/staff-form';

export default async function StaffDetailPage({
  params,
}: {
  params: Promise<{ staffId: string }>;
}) {
  const { staffId } = await params;
  const { supabase, activeTeam } = await getActiveTeam();

  const { data: staff } = await supabase
    .from('staff_members')
    .select('*')
    .eq('id', staffId)
    .eq('team_id', activeTeam.id)
    .single();

  if (!staff) notFound();

  const updateAction = updateStaffAction.bind(null, staffId);
  const deleteAction = deleteStaffAction.bind(null, staffId);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">
        {staff.first_name} {staff.last_name}
      </h2>

      <StaffForm action={updateAction} staff={staff} submitLabel="Salva modifiche" />

      <form action={deleteAction}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 py-2.5 text-sm font-medium text-destructive"
        >
          <Trash2 className="h-4 w-4" /> Rimuovi dallo staff
        </button>
      </form>
    </div>
  );
}
