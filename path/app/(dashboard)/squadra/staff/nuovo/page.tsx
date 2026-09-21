import { getActiveTeam } from '@/lib/active-team';
import { createStaffAction } from '@/actions/staff.actions';
import { StaffForm } from '@/components/staff/staff-form';

export default async function NuovoStaffPage() {
  const { activeTeam } = await getActiveTeam();
  const action = createStaffAction.bind(null, activeTeam.id);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Nuovo membro dello staff</h2>
      <StaffForm action={action} submitLabel="Aggiungi allo staff" />
    </div>
  );
}
