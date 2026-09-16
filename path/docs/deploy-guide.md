# Guida al deploy — MrSoccerGamification

Segui i 3 blocchi in ordine: **GitHub → Supabase → Vercel**. In totale 20-30 minuti.

---

## 1. GitHub

### 1.1 Estrai lo ZIP e prepara il repo
```bash
unzip mrsoccergamification.zip -d mrsoccergamification
cd mrsoccergamification
git init
git add .
git commit -m "MrSoccerGamification - versione iniziale"
```

### 1.2 Crea il repository su GitHub
1. Vai su [github.com/new](https://github.com/new)
2. Nome repo: `mrsoccergamification` (o quello che preferisci)
3. Lascialo **vuoto** (niente README/gitignore/licenza, li hai già)
4. Crea il repo

### 1.3 Collega e carica
GitHub ti mostrerà i comandi esatti dopo la creazione; sono simili a:
```bash
git remote add origin https://github.com/TUO-USERNAME/mrsoccergamification.git
git branch -M main
git push -u origin main
```

Verifica: aprendo il repo su GitHub devi vedere tutte le cartelle (`app/`, `supabase/`, `docs/`, ecc.).

---

## 2. Supabase

### 2.1 Crea il progetto
1. Vai su [supabase.com](https://supabase.com) → **New project**
2. Scegli nome, password del database (salvala, ti servirà raramente ma tienila) e regione (scegli quella più vicina ai tuoi utenti, es. Europe/Frankfurt)
3. Attendi 1-2 minuti che il progetto sia pronto

### 2.2 Esegui le migration (crea le tabelle)
Vai su **SQL Editor** (menu laterale) e apri, uno alla volta, i file da `supabase/migrations/` **in ordine numerico**:

1. `0001_initial_schema.sql`
2. `0002_auth_trigger.sql`
3. `0003_onboarding_function.sql`
4. `0004_regenerate_token_function.sql`
5. `0005_invite_collaborator.sql`
6. `0006_google_oauth_metadata.sql`
7. `0007_training_minutes.sql`
8. `0008_session_type_and_summary.sql`

Per ognuno: copia tutto il contenuto del file, incollalo nell'SQL Editor, premi **Run**. Deve terminare senza errori prima di passare al file successivo.

> In alternativa, se hai la Supabase CLI installata in locale:
> ```bash
> supabase link --project-ref <il-tuo-project-ref>
> supabase db push
> ```

### 2.3 Bucket foto giocatori (facoltativo — puoi saltarlo)
Se vuoi la foto profilo dei giocatori:
1. Vai su **Storage** → **New bucket**
2. Nome: `player-photos`
3. **Importante**: lascialo **privato** (non public), le policy RLS della migration gestiscono già gli accessi corretti

Se salti questo passaggio, l'app funziona comunque normalmente: il selettore foto resta visibile nel form giocatore ma non fa nulla se usato (nessun errore, il giocatore viene creato/modificato senza foto). Puoi crearlo in qualsiasi momento in futuro, senza bisogno di ridistribuire l'app.

### 2.4 Recupera le chiavi API
Vai su **Project Settings → API**. Ti servono 3 valori per il prossimo blocco:
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role key** (sotto "Project API keys", clicca "Reveal") → `SUPABASE_SERVICE_ROLE_KEY`

⚠️ La `service_role key` bypassa tutta la sicurezza (RLS): non condividerla mai, non metterla mai in variabili `NEXT_PUBLIC_*`, non committarla su GitHub.

### 2.5 Configura il login con Google (facoltativo — puoi saltarlo)
L'app funziona già perfettamente con email/password senza questo passaggio. Fallo solo se vuoi anche il pulsante "Continua con Google":
1. Vai su [console.cloud.google.com](https://console.cloud.google.com) → crea un progetto (o usane uno esistente)
2. **APIs & Services → OAuth consent screen**: configuralo in modalità "External", compila nome app ed email di supporto
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID** → tipo "Web application"
4. In **Authorized redirect URIs** aggiungi l'URL di callback che trovi su Supabase: **Authentication → Sign In / Providers → Google** ti mostra l'URL esatto da copiare (è del tipo `https://<tuo-project-ref>.supabase.co/auth/v1/callback`)
5. Copia **Client ID** e **Client Secret** generati da Google
6. Torna su Supabase → **Authentication → Sign In / Providers → Google**, attiva il toggle, incolla Client ID e Client Secret, salva

Se salti questo passaggio, il pulsante Google resta visibile nell'app ma darà un errore se cliccato — email/password funziona comunque normalmente, indipendentemente da questo.

### 2.6 (Opzionale) Dati di prova
Se vuoi partire con dati finti per testare l'app:
1. Registra un primo utente dall'app (dopo il deploy su Vercel, blocco 3) oppure da **Authentication → Users → Add user** su Supabase
2. Copia il suo `UID`
3. Apri `supabase/seed.sql`, sostituisci l'UUID placeholder con quello copiato
4. Eseguilo nell'SQL Editor

---

## 3. Vercel

### 3.1 Importa il repository
1. Vai su [vercel.com/new](https://vercel.com/new)
2. Collega il tuo account GitHub se non l'hai già fatto
3. Seleziona il repo `mrsoccergamification` → **Import**
4. Framework Preset: Vercel riconosce automaticamente **Next.js**, non toccare nulla

### 3.2 Configura le variabili d'ambiente
Prima di premere Deploy, apri **Environment Variables** e aggiungi le 4 chiavi (stessi nomi di `.env.example`):

| Nome | Valore |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | dal punto 2.4 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | dal punto 2.4 |
| `SUPABASE_SERVICE_ROLE_KEY` | dal punto 2.4 |
| `NEXT_PUBLIC_SITE_URL` | per ora metti un valore provvisorio, es. `https://placeholder.vercel.app` (lo correggi al punto 3.4) |

### 3.3 Deploy
Premi **Deploy**. Vercel installa le dipendenze e builda il progetto (2-4 minuti).

> Se la build fallisce: apri i log di build in Vercel, quasi sempre è un errore TypeScript o un import mancante. Il codice non è mai stato compilato con `npm run build` reale in precedenza (vedi `docs/development-plan.md`), quindi metti in conto qualche piccola correzione al primo giro — i log ti indicano riga e file esatti.

### 3.4 Correggi l'URL del sito
1. Una volta live, copia l'URL reale assegnato da Vercel (es. `https://mrsoccergamification-tuonome.vercel.app`) — o collega un dominio personalizzato da **Settings → Domains**
2. Torna in **Settings → Environment Variables**, aggiorna `NEXT_PUBLIC_SITE_URL` con l'URL reale
3. Vai su **Deployments**, apri i "..." sull'ultimo deploy → **Redeploy** (serve per applicare la nuova variabile)

Questo passaggio è importante: `NEXT_PUBLIC_SITE_URL` è usato per generare i link `/player/{token}` mostrati ai giocatori.

### 3.5 Primo accesso
1. Apri l'URL dell'app → **Registrati** con email e password (oppure "Continua con Google" se l'hai configurato)
2. Verrai reindirizzato automaticamente alla creazione della prima stagione/squadra (onboarding)
3. Da lì: aggiungi qualche giocatore, crea un allenamento, prova Presenze/Partitelle/RPE/Classifica

---

## Checklist finale

- [ ] Repo GitHub pubblicato con tutti i file
- [ ] 5 migration eseguite su Supabase senza errori
- [ ] Bucket `player-photos` creato (privato)
- [ ] 4 variabili d'ambiente impostate su Vercel
- [ ] Build Vercel completata senza errori
- [ ] `NEXT_PUBLIC_SITE_URL` aggiornato con l'URL reale + redeploy
- [ ] Registrazione e primo login funzionanti
- [ ] Link giocatore (`/player/{token}`) verificato aprendolo in incognito

## Problemi comuni

**"Errore Supabase: relation does not exist"** → una migration non è stata eseguita o è fallita a metà. Controlla in **Database → Tables** su Supabase quali tabelle mancano e ri-esegui la migration corrispondente.

**Foto giocatore non si carica** → verifica che il bucket si chiami esattamente `player-photos` e che la migration 0001 (che contiene le policy Storage implicite via RLS sulle tabelle) sia stata eseguita.

**Login funziona ma dashboard resta bianca / redirect loop** → controlla che `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` su Vercel corrispondano esattamente (senza spazi extra) a quelli di Supabase, poi redeploy.

**Link giocatore non funziona** → controlla che `NEXT_PUBLIC_SITE_URL` sia stato aggiornato e che tu abbia rifatto il redeploy dopo averlo cambiato (le variabili d'ambiente su Vercel si applicano solo ai deploy successivi, non retroattivamente).
