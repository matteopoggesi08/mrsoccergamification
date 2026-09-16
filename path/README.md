# MrSoccerGamification

Diario digitale degli allenamenti per allenatori dilettanti. Next.js 15 (App Router) + TypeScript + Tailwind + shadcn-style UI + Supabase (Postgres/Auth/Storage/RLS).

## Setup

### 1. Supabase
1. Crea un progetto su supabase.com.
2. Esegui le migration in ordine (`supabase/migrations/000*.sql`) dal SQL editor di Supabase, oppure con la CLI:
   ```
   supabase link --project-ref <tuo-project-ref>
   supabase db push
   ```
3. Crea un bucket **privato** chiamato `player-photos` in Storage.
4. (Opzionale, dati di prova) esegui `supabase/seed.sql` dopo aver registrato un utente e sostituito l'UUID placeholder.

### 2. Variabili d'ambiente
Copia `.env.example` in `.env.local` e compila con i valori di Project Settings → API su Supabase.

### 3. Sviluppo locale
```
npm install
npm run dev
```

### 4. Deploy
- **GitHub**: inizializza il repo (`git init && git add . && git commit -m "init"`) e collegalo su GitHub.
- **Vercel**: importa il repo, aggiungi le stesse variabili d'ambiente di `.env.example` nelle Project Settings di Vercel, deploy.
- Dopo il primo deploy, aggiorna `NEXT_PUBLIC_SITE_URL` con l'URL reale (serve per generare correttamente i link `/player/{token}`).

### 5. Rigenerare i tipi TypeScript dal database
`types/database.types.ts` è scritto a mano per il primo avvio. Dopo il deploy delle migration, rigeneralo con:
```
npm run types:generate
```
(richiede `SUPABASE_PROJECT_ID` come variabile d'ambiente e supabase CLI installata).

## Cosa è incluso
Vedi `docs/development-plan.md` per lo stato dettagliato di ogni area funzionale e `docs/architecture.md` per le decisioni architetturali.

## Note importanti prima di andare in produzione
- **Non testato con una build reale**: questo progetto è stato scritto senza accesso a `npm install`/`next build` in questo ambiente. Prima del deploy, esegui `npm run build` in locale e correggi eventuali errori di tipo o import mancanti.
- **shadcn/ui**: sono stati creati manualmente solo i componenti base (`button`, `input`, `label`) nello stile shadcn. Per gli altri componenti (dialog, dropdown, toast, ecc.) usa `npx shadcn@latest add <componente>` una volta avviato il progetto in locale.
- **Tornei modalità "risultati"**: la UI genera un girone all'italiana semplice; l'assegnazione dei giocatori alle squadre del torneo (tabella `tournament_team_players`) esiste nello schema ma non ha ancora una UI dedicata.
- **Inviti collaboratori**: funzionano solo se la persona ha già un account MrSoccerGamification. Un vero flusso di invito via email (con link di registrazione) richiede un servizio email (es. Resend) non ancora integrato.
- **Test automatici**: non inclusi in questa consegna. Consigliato aggiungere Vitest + Testing Library per le funzioni di calcolo (`get_team_standings`, `get_player_workload`) prima del rilascio.
