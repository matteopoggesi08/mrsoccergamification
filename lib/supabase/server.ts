import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// NOTA: il client non è tipizzato con <Database> volutamente. Diverse
// versioni minori di @supabase/supabase-js/postgrest-js richiedono forme
// leggermente diverse per il generic dello schema (campi come
// "Relationships", struttura di Functions/Views, ecc.); indovinarle a
// mano senza le dipendenze reali installate ha causato build fallite.
// I tipi applicativi (types/domain.ts, services/*) restano comunque
// tipizzati; solo il risultato grezzo delle query Supabase è "any".
// Quando rigeneri types/database.types.ts con `npm run types:generate`
// puoi reintrodurre createServerClient<Database>(...) in sicurezza.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // chiamato da un Server Component: ignorabile, il middleware
            // si occupa comunque di rinfrescare la sessione.
          }
        },
      },
    }
  );
}
