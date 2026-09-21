import { PlusCircle, Users, Trophy, Settings } from 'lucide-react';
import { QuickActionCard } from '@/components/shared/quick-action-card';

export default function DashboardPage() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Ciao Mister 👋</h2>
        <p className="text-sm text-muted-foreground">Cosa vuoi fare oggi?</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <QuickActionCard
          href="/allenamenti/nuovo"
          label="Nuovo Allenamento"
          icon={PlusCircle}
          variant="primary"
        />
        <QuickActionCard href="/squadra/rosa" label="Rosa" icon={Users} />
        <QuickActionCard href="/classifica" label="Classifica" icon={Trophy} />
        <QuickActionCard href="/squadra/impostazioni" label="Impostazioni" icon={Settings} />
      </div>
    </div>
  );
}
