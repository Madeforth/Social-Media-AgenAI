import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-xs uppercase tracking-[0.18em] text-accent">404</p>
      <h1 className="text-2xl font-semibold text-text-primary">Bu sayfa mevcut değil</h1>
      <p className="max-w-sm text-sm text-text-secondary">
        Bağlantı eski olabilir veya işaret ettiği gönderi kaldırılmış olabilir.
      </p>
      <Link
        href="/tr"
        className="mt-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-[#04252b] transition-colors duration-150 hover:bg-accent-strong"
      >
        Panele dön
      </Link>
    </main>
  );
}
