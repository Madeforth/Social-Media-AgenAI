import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-xs uppercase tracking-[0.18em] text-accent">404</p>
      <h1 className="text-2xl font-semibold text-text-primary">This page does not exist</h1>
      <p className="max-w-sm text-sm text-text-secondary">
        The link may be stale, or the post it pointed at was removed.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-[#04252b] transition-colors duration-150 hover:bg-accent-strong"
      >
        Back to dashboard
      </Link>
    </main>
  );
}
