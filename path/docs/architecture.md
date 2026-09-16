# MrSoccerGamification — Architettura

## Stack confermato
Next.js 15 (App Router, Server Actions), TypeScript strict (no `any`), Tailwind CSS, shadcn/ui, Lucide, React Hook Form + Zod, Supabase (Postgres/Auth/Storage/RLS), Vercel.

## Struttura cartelle

```
app/
  (auth)/
    login/
    register/
  (dashboard)/
    dashboard/
    stagioni/
    squadra/
      rosa/
      collaboratori/
      impostazioni/
    allenamenti/
      [trainingId]/
        presenze/
        partitelle/
        tornei/
        rpe/
    classifica/
    log/
  player/[token]/          # area giocatore, no-auth
  api/                     # solo per webhook (es. auth callback)
  layout.tsx
  globals.css

components/
  ui/                      # shadcn primitives
  layout/                  # shell, navbar mobile, bottom-nav
  shared/                  # componenti generici riusabili

features/
  seasons/
  players/
  trainings/
  attendances/
  matches/
  tournaments/
  rpe/
  standings/
  collaborators/
  activity-log/
  player-area/
  (ogni feature: components/, schemas.ts, types.ts)

actions/                   # Server Actions, un file per feature
  seasons.actions.ts
  players.actions.ts
  trainings.actions.ts
  ...

hooks/
  use-toast.ts
  use-team-context.ts
  ...

lib/
  supabase/
    server.ts              # client server-side (RLS attiva, cookie-based)
    client.ts               # client browser
    service-role.ts         # client service_role, SOLO per area giocatore token
  auth/
  utils.ts

services/                  # logica di dominio pura, chiamata dalle actions
  standings.service.ts
  workload.service.ts       # ACWR, monotonia, strain
  tokens.service.ts

types/
  database.types.ts          # generato da `supabase gen types typescript`
  domain.ts

database/
  migrations/ -> supabase/migrations
  seed.sql -> supabase/seed.sql

constants/
  roles.ts
  rpe-scale.ts

providers/
  theme-provider.tsx
  team-provider.tsx

middleware.ts               # refresh sessione Supabase + guard route
```

## Principi chiave

1. **Server Actions come unico punto di scrittura.** Nessuna chiamata Supabase diretta dai componenti client per le mutazioni. Le Server Action validano con Zod, chiamano `services/`, e fanno `revalidatePath`.
2. **RLS come ultima linea di difesa, non l'unica.** Le Server Action verificano comunque il ruolo (allenatore/vice/collaboratore) prima di eseguire operazioni sensibili (es. solo l'allenatore può rigenerare il link giocatore o cancellare la stagione).
3. **Event Sourcing per la classifica.** Non esiste una tabella `standings`. `get_team_standings()` (funzione SQL) e `standings.service.ts` la ricalcolano sempre da `matches`, `match_players`, `penalties`. Questo garantisce che modificare un risultato passato aggiorni automaticamente la classifica, senza incoerenze.
4. **Area giocatore isolata.** `/player/[token]` non usa `auth.uid()`: una Server Action dedicata verifica il token contro `player_tokens` con un client `service_role` (server-only, mai nel bundle client) e restituisce solo dati in sola lettura del giocatore proprietario del token.
5. **Mobile-first, 2 minuti per seduta.** Ogni step dei form (presenze, RPE, risultato partitella) è pensato per essere completato con il minor numero di tap: liste con toggle rapido invece di dropdown, numeri grandi, salvataggio automatico per sezione (non un unico form gigante).
6. **Componenti piccoli.** Ogni modulo della seduta (Presenze, Partitelle, Tornei, RPE, Minutaggi) è un componente indipendente con il proprio stato e la propria Server Action, montato dentro la pagina `allenamenti/[trainingId]`.

## Autenticazione e sessione
- Supabase Auth: **Email/Password** (metodo principale, nessuna configurazione esterna richiesta) **+ Google OAuth opzionale** (pulsante "Continua con Google" su login/registrazione, funziona solo se configuri il provider — vedi `docs/deploy-guide.md`, sezione 2.5; se non lo configuri, l'app funziona comunque normalmente con email/password).
- Alla registrazione (email o Google), un trigger SQL (`handle_new_user`, aggiornato in migration 0006) crea automaticamente la riga in `profiles`, leggendo nome/foto da Google quando disponibili.
- `app/auth/callback/route.ts` gestisce il ritorno da Google e scambia il `code` con una sessione.
- `middleware.ts` aggiorna la sessione ad ogni richiesta e reindirizza a `/login` le rotte protette; `/`, `/login`, `/register`, `/player` e `/auth` restano pubbliche.
- `lib/supabase/server.ts` usa `@supabase/ssr` con cookie httpOnly.

## Multi-tenancy
- Ogni riga è raggiungibile solo tramite la catena `season → team → dati`.
- Un `coach_id` in `seasons` identifica il proprietario. I `team_members` estendono l'accesso a vice/collaboratori sulla singola squadra (non sull'intera stagione di altre squadre).
- Una stagione può contenere **più squadre** (es. Under 15 e Under 17 nella stessa stagione 2025/2026): lo schema lo supporta nativamente, nessuna modifica necessaria.

## Prossimi documenti
- `development-plan.md`: dettaglio delle 15 milestone, ordine di implementazione e criteri di completamento.
