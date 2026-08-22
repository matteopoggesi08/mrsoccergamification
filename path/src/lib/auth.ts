import { supabase } from './supabase';

const getRedirectUrl = () => {
  if (import.meta.env.PROD) {
    return `${window.location.origin}/mrsoccergamification/#/`;
  }

  return `${window.location.origin}/#/`;
};

export const login = () =>
  supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: getRedirectUrl(),
    },
  });

export const logout = () => supabase.auth.signOut();
