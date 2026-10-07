import{supabase}from'./supabase';
export const login=()=>supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:`${window.location.origin}/`}});
export const logout=()=>supabase.auth.signOut();
