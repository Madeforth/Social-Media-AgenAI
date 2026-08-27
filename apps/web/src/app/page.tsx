export default function HomePage() {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-md rounded-xl border border-border-subtle bg-surface p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-accent">Apex Social AI</p>
        <h1 className="mt-3 text-2xl font-semibold text-text-primary">Workspace bootstrapped</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Monorepo, design tokens and shared domain types are in place. Product screens land in the
          next milestone.
        </p>
      </div>
    </main>
  );
}
