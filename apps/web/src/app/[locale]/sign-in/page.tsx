import { ApexMarkIcon } from '@/components/icons';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { hasLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { notFound } from 'next/navigation';

interface SignInPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}

export default async function SignInPage({ params, searchParams }: SignInPageProps) {
  const { locale: rawLocale } = await params;
  if (!hasLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;

  const [{ next }, dict] = await Promise.all([searchParams, getDictionary(locale)]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border border-border-subtle bg-surface p-8 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-accent-soft">
          <ApexMarkIcon className="h-6 w-6 text-accent" />
        </div>
        <h1 className="mt-5 text-xl font-semibold tracking-tight text-text-primary">
          {dict.signIn.title}
        </h1>
        <p className="mt-2 text-sm text-text-secondary">{dict.signIn.subtitle}</p>
        <div className="mt-6">
          <GoogleSignInButton locale={locale} label={dict.signIn.continueWithGoogle} next={next} />
        </div>
      </div>
    </div>
  );
}
