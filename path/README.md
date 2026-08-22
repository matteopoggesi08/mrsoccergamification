# SOCCERMRGAMIFICATION

SaaS mobile-first per allenatori di calcio dilettantistico.

## Stack

- React + Vite
- Supabase Auth / PostgreSQL / RLS
- Google OAuth
- GitHub Pages
- jsPDF
- Recharts
- Lucide React

## Deploy gratuito

Il progetto è predisposto per GitHub Pages. Le variabili client Vite (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`) non sono segreti server-side: la sicurezza reale è affidata a Supabase RLS e alle policy del database. Non inserire mai service-role key nel frontend.

## Configurazione Supabase

1. Esegui `supabase/schema.sql` su un database nuovo.
2. Su un database già esistente, esegui in ordine:
   - `supabase/migrations/20260822_v2.sql`
   - `supabase/migrations/20260822_v3.sql`
3. Configura Google OAuth in Supabase.
4. Site URL: `https://<username>.github.io/mrsoccergamification/`
5. Redirect URL: stesso URL.

## Funzionalità

- Google login
- stagioni e codici privati
- richieste di accesso
- OWNER / COLLABORATORE / CAPITANO
- permessi lato database con RLS
- rosa attiva + cestino + archiviazione
- eliminazione definitiva solo senza storico
- allenamenti e partite
- presenze
- session-RPE e durata
- carichi giornalieri, settimanali, mensili e personalizzati
- insight descrittivi
- convocazioni PDF
- minutaggi e RPE partita
- eventi partita
- partitelle, gol e classifica
- penalità configurabili
- multe e pagamenti
- gestione tipologie di multa
- player portal con token crittograficamente casuale
- PDF giocatore
- report PDF filtrabili
- activity log
- dashboard stagione
