import Link from 'next/link';
import {
  CheckSquare,
  Swords,
  Trophy,
  Activity,
  Users,
  Link2,
  ArrowRight,
} from 'lucide-react';

const FEATURES = [
  {
    icon: CheckSquare,
    title: 'Seduta in 2 minuti',
    desc: 'Presenze, partitelle, tornei e RPE in pochi tap, pensato per il campo, non per la scrivania.',
  },
  {
    icon: Activity,
    title: 'Carichi e prevenzione infortuni',
    desc: 'ACWR, monotonia e strain calcolati automaticamente da ogni RPE, con avvisi su sovraccarico.',
  },
  {
    icon: Trophy,
    title: 'Classifica sempre corretta',
    desc: 'Ricalcolata da zero ad ogni modifica: cambi un risultato vecchio, i punti si aggiornano da soli.',
  },
  {
    icon: Users,
    title: 'Collaboratori',
    desc: 'Vice e collaboratori possono inserire dati con te, ogni modifica resta nel log attività.',
  },
  {
    icon: Link2,
    title: 'Area giocatore',
    desc: 'Un link personale, senza registrazione, per far vedere ai ragazzi classifica e storico presenze.',
  },
  {
    icon: Swords,
    title: 'Partitelle e tornei',
    desc: 'Squadre create al volo, punti 3-1-0 automatici, tornei a girone o a classifica finale.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="flex items-center justify-between px-4 py-4 sm:px-8">
        <span className="text-lg font-semibold">MrSoccerGamification</span>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Accedi
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Registrati
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-24 pt-10 sm:px-8 sm:pt-16">
        <section className="text-center">
          <h1 className="text-3xl font-bold leading-tight sm:text-5xl">
            Il diario digitale dei tuoi allenamenti
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            Fatto per allenatori dilettanti che vogliono registrare una seduta in meno di 2
            minuti — non un gestionale, un diario veloce da usare a bordo campo.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-medium text-primary-foreground"
            >
              Inizia gratis <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-border px-6 py-3 text-base font-medium"
            >
              Ho già un account
            </Link>
          </div>
        </section>

        <section className="mt-20 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border bg-card p-5">
              <Icon className="h-6 w-6 text-primary" strokeWidth={1.75} />
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </section>

        <section className="mt-20 rounded-2xl border bg-card p-6 text-center sm:p-10">
          <h2 className="text-xl font-semibold sm:text-2xl">Pronto per la prossima stagione?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Crea la tua squadra in meno di 30 secondi. Nessuna carta di credito richiesta.
          </p>
          <Link
            href="/register"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-medium text-primary-foreground"
          >
            Crea il tuo account <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>

      <footer className="border-t px-4 py-6 text-center text-xs text-muted-foreground sm:px-8">
        MrSoccerGamification — diario digitale degli allenamenti
      </footer>
    </div>
  );
}
