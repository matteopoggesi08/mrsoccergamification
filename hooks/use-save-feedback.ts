'use client';

import { useState, useTransition } from 'react';

/**
 * Pattern usato in tutti i moduli della seduta (Presenze, Partitelle,
 * Tornei, RPE, Minutaggi): l'interfaccia si aggiorna subito (chi chiama
 * questo hook deve già aver aggiornato lo stato locale PRIMA di
 * invocare `run`), e "saved" diventa true per ~1.2s dopo che il
 * salvataggio sul server è confermato, per dare un riscontro visivo
 * senza bloccare l'interazione in attesa della rete.
 */
export function useSaveFeedback() {
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<void> | void) {
    startTransition(async () => {
      await action();
      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
    });
  }

  return { saved, isPending, run };
}
