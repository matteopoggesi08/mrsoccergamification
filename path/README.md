# SOCCERMRGAMIFICATION — FINAL MVP

## Architettura gratuita
- Frontend: React + Vite + TypeScript
- Hosting: GitHub Pages + GitHub Actions
- Backend: Supabase free tier
- Auth: Google OAuth
- Database: PostgreSQL + RLS
- PDF: jsPDF lato client

## Implementato
Home/login Google; dashboard; stagioni; codice privato; richieste accesso; OWNER/COLLABORATOR/CAPTAIN; permessi per collaboratore; rosa e archiviazione; token giocatore casuale SHA-256 con revoca; sedute allenamento/partita; presenze e motivi; RPE/durata/session-RPE; partite, convocazioni, stati, minutaggi, titolare/panchina, RPE, gol con minuto; PDF convocazione; partitelle A/B, risultato, più gol per giocatore; classifica 3/1/0, gol/differenza, penalità; carichi giornalieri/aggregati, 7g vs 7g e insight descrittivo; multe, tipologie, pagamenti parziali/totali, residui; staff; audit log; report PDF; player portal; filtri presenze; player PDF; responsive mobile-first.

## Setup
1. Crea Supabase.
2. Esegui `supabase/schema.sql`.
3. Authentication → Google → abilita OAuth.
4. Configura Site URL e Redirect URL di GitHub Pages.
5. Repository GitHub → Settings → Secrets and variables → Actions:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
6. Settings → Pages → Source = GitHub Actions.
7. Push su `main`.

### Sicurezza
La service-role key NON deve mai essere inserita nel frontend.
RLS è obbligatorio.
Il player portal non usa ID prevedibili: usa token casuale di 256 bit, memorizzato solo come SHA-256, con revoca/expiry.
I dati del player portal sono esposti tramite RPC `player_by_token`.

### Insight scientifici
La misura implementata è session-RPE = RPE × durata. Gli insight sono volutamente descrittivi e non inventano soglie di rischio/infortunio. Per una versione scientificamente documentata con soglie/raccomandazioni specifiche, le soglie vanno selezionate e citate da fonti scientifiche prima di essere attivate.

### QA
Prima del lancio reale eseguire:
- `npm ci`
- `npm run build`
- test OAuth
- test con due account
- test RLS per ogni ruolo
- test token/revoca
- test mobile
- test CRUD e PDF.
