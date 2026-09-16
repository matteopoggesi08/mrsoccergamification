import { OnboardingForm } from './onboarding-form';

export default function OnboardingPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Crea la tua prima squadra</h1>
          <p className="text-sm text-muted-foreground">
            Ti servono meno di 30 secondi. Potrai aggiungerne altre in seguito.
          </p>
        </div>
        <OnboardingForm />
      </div>
    </div>
  );
}
