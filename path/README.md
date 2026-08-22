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

## Database migration v4

For an existing Supabase project, run `supabase/FINAL_MIGRATION.sql` once in SQL Editor. It is idempotent and adds programmed absences, configurable call-up labels, improved player match summaries and audit coverage. Do not rerun the older schema files on top of an existing production database.

## v5 — Test fisici

Aggiunta la sezione **Test** con **Yo-Yo Test Livello 1 (YYIR1)**:
- registrazione per data e giocatore;
- distanza totale in metri;
- livello finale opzionale;
- indicazione automatica basata su fasce di riferimento documentate;
- storico dei test;
- visualizzazione dell'ultimo risultato nel profilo giocatore e nel Player Portal;
- report PDF dei test.

Per il database, eseguire `supabase/FINAL_MIGRATION.sql` dopo la sostituzione della cartella `path`.
