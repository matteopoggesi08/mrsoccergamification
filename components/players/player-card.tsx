import Link from 'next/link';
import { User } from 'lucide-react';
import { POSITION_LABELS } from '@/constants/positions';
import type { Database } from '@/types/database.types';

type Player = Database['public']['Tables']['players']['Row'];

export function PlayerCard({ player }: { player: Player }) {
  return (
    <Link
      href={`/squadra/rosa/${player.id}`}
      className="flex items-center gap-3 rounded-xl border bg-card p-3 active:scale-[0.99]"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
        {player.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={player.photo_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <User className="h-6 w-6 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {player.first_name} {player.last_name}
          {player.jersey_number != null && (
            <span className="ml-2 text-muted-foreground">#{player.jersey_number}</span>
          )}
        </p>
        {player.position && (
          <p className="text-sm text-muted-foreground">{POSITION_LABELS[player.position]}</p>
        )}
      </div>
    </Link>
  );
}
