'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { signInAction, signInWithGoogleAction, type AuthActionState } from '@/actions/auth.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoogleIcon } from '@/components/shared/google-icon';

const initialState: AuthActionState = null;

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(signInAction, initialState);

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
          {state?.fieldErrors?.email && (
            <p className="text-sm text-destructive">{state.fieldErrors.email[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
          {state?.fieldErrors?.password && (
            <p className="text-sm text-destructive">{state.fieldErrors.password[0]}</p>
          )}
        </div>

        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

        <Button type="submit" disabled={isPending}>
          {isPending ? 'Accesso in corso…' : 'Accedi'}
        </Button>
      </form>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        oppure
        <div className="h-px flex-1 bg-border" />
      </div>

      <form action={signInWithGoogleAction}>
        <Button type="submit" variant="outline" className="flex items-center justify-center gap-2">
          <GoogleIcon />
          Continua con Google
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Non hai un account?{' '}
        <Link href="/register" className="font-medium text-foreground underline">
          Registrati
        </Link>
      </p>
    </div>
  );
}
