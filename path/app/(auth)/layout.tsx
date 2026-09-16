export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">MrSoccerGamification</h1>
          <p className="text-sm text-muted-foreground">Il diario dei tuoi allenamenti</p>
        </div>
        {children}
      </div>
    </div>
  );
}
