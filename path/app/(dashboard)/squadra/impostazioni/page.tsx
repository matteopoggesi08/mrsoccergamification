import Link from 'next/link';
import { Users, FileClock, Settings as SettingsIcon } from 'lucide-react';
import { getActiveTeam } from '@/lib/active-team';

export default async function ImpostazioniPage() {
  const { activeTeam } = await getActiveTeam();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Impostazioni</h2>
        <p className="text-sm text-muted-foreground">
          {activeTeam.name} · {activeTeam.seasonName}
        </p>
      </div>

      <div className="space-y-2">
        <Link
          href="/squadra/collaboratori"
          className="flex items-center gap-3 rounded-xl border bg-card p-4"
        >
          <Users className="h-5 w-5 text-primary" />
          <span className="font-medium">Collaboratori</span>
        </Link>
        <Link href="/log" className="flex items-center gap-3 rounded-xl border bg-card p-4">
          <FileClock className="h-5 w-5 text-primary" />
          <span className="font-medium">Log attività</span>
        </Link>
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4 opacity-60">
          <SettingsIcon className="h-5 w-5" />
          <span className="font-medium">Gestione stagioni (archivia/duplica rosa) — v2</span>
        </div>
      </div>
    </div>
  );
}
