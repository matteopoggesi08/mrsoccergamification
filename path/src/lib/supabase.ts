import{createClient}from'@supabase/supabase-js';
const u=import.meta.env.VITE_SUPABASE_URL,k=import.meta.env.VITE_SUPABASE_ANON_KEY;
export const configured=!!u&&!!k&&!u.includes('YOUR-PROJECT')&&!k.includes('YOUR_');
export const supabase=createClient(u||'https://placeholder.supabase.co',k||'placeholder');
