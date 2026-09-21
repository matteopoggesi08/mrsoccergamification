import { createBrowserClient } from '@supabase/ssr';

// Vedi nota in lib/supabase/server.ts sul perché non tipizziamo il
// client con <Database> qui.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
