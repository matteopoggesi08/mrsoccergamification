import{supabase}from'./supabase';
export const login=()=>supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:`${window.location.origin}/mrsoccergamification/`}});
export const logout=()=>supabase.auth.signOut();
