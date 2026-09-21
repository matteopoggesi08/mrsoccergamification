import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import { getActiveTeam } from '@/lib/active-team';
import { StaffCard } from '@/components/staff/staff-card';

export default async function StaffPage() {
  const { supabase, activeTeam } = await getActiveTeam();

  const { data: staff } = await supabase
    .from('staff_members')
    .select('id, first_name, last_name, role')
    .eq('team_id', activeTeam.id)
    .order('created_at');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Staff tecnico</h2>
        <Link
          href="/squadra/staff/nuovo"
          className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
        >
          <UserPlus className="h-4 w-4" /> Aggiungi
        </Link>
      </div>

      {!staff || staff.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Nessun membro dello staff ancora. Vice allenatori, preparatori, fisioterapisti…
        </p>
      ) : (
        <div className="space-y-2">
          {staff.map((s) => (
            <StaffCard key={s.id} staff={s} />
          ))}
        </div>
      )}
    </div>
  );
}
