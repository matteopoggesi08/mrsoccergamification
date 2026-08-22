# SOCCERMRGAMIFICATION v4 — checklist

## Core
- Google OAuth only
- Seasons, access code, access requests
- OWNER / COLLABORATOR / CAPTAIN permissions with database RLS
- Mobile-first navigation

## Squad
- Create/edit/archive/restore players
- Trash for archived players
- Confirmed permanent delete
- Safe personal player token with revocation

## Sessions
- Training / match
- Training attendance with three absence reasons
- Default training duration 90 minutes
- RPE 1–10 and session-RPE
- Match call-ups, custom statuses, minutes, starters, RPE
- Match events with create/edit/delete
- Training games with teams, scores and goals

## Attendance
- Historical attendance
- Player/period/session filters
- Programmed absences reminder
- Daily expected availability count
- 14-day availability calendar
- Programmed absences never overwrite actual session attendance

## Workload
- Daily/weekly/monthly aggregation
- Volume, load, average RPE and trends
- Team and individual comparison
- Structured descriptive insights
- No automatic injury-risk diagnosis or universal thresholds
- Scientific methodology documented in LOAD_METHODOLOGY.md

## Gamification
- Training-game leaderboard
- Configurable 3/1/0 scoring
- Configurable penalty handling
- Goal leaderboard

## Fines
- Fine types CRUD
- Assign fines
- Partial/full payments
- Residual balances
- Captain access according to permissions

## Player portal
- Token-only access
- Personal statistics
- Match history
- Minutes/goals/call-up status
- Workload and trends
- Scientific descriptive insights
- Week/month/season/custom filters
- PDF for the exact selected period

## Reports
- Season summary
- Squad
- Sessions
- Attendance
- Workload
- Minutes
- Leaderboard
- Fines
- Player statistics
- Team trend

## Audit and security
- Database audit log
- Human-readable activity UI
- RLS policies
- Token hashing/revocation
- Data isolation by season
- Hard delete protection when historical data exists

## v5 additions / final QA
- [x] Presenze con registro cronologico giorno per giorno.
- [x] Assenze programmate separate dalle presenze reali.
- [x] Profilo giocatore con grafico carico e insight individuale basato sulla baseline configurata.
- [x] Player Portal con insight individuale strutturato.
- [x] Tipologie multe con nome, descrizione, importo e stato attivo.
- [x] Storico penalità classifica.
- [x] Report Yo-Yo IR1.
- [x] Sezione Test → Yo-Yo Test Livello 1.
- [x] Storico test e ultimo risultato nel profilo giocatore/Player Portal.
- [x] RLS e audit log per i risultati dei test.
- [x] Hard-delete giocatore bloccato se esistono risultati Yo-Yo storici.
