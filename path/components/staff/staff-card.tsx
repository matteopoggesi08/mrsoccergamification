import Link from 'next/link';
import { UserCog } from 'lucide-react';

type Staff = {
  id: string;
  first_name: string;
  last_name: string;
  role: string | null;
};

export function StaffCard({ staff }: { staff: Staff }) {
  return (
    <Link
      href={`/squadra/staff/${staff.id}`}
      className="flex items-center gap-3 rounded-xl border bg-card p-3 active:scale-[0.99]"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted">
        <UserCog className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {staff.first_name} {staff.last_name}
        </p>
        {staff.role && <p className="text-sm text-muted-foreground">{staff.role}</p>}
      </div>
    </Link>
  );
}
