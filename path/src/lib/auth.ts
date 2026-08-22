import { supabase } from './supabase';

const getRedirectUrl = () => {
  return `${window.location.origin}/mrsoccergamification/#/`;
};

export const login = () =>
  supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: getRedirectUrl(),
    },
  });

export const logout = () => supabase.auth.signOut();
