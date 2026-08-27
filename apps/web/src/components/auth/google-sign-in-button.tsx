'use client';

import { useState } from 'react';

import { GoogleIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import type { Locale } from '@/i18n/config';
import { getSupabaseClient } from '@/lib/supabase';

interface GoogleSignInButtonProps {
  locale: Locale;
  label: string;
  next?: string;
}

export function GoogleSignInButton({ locale, label, next }: GoogleSignInButtonProps) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    const supabase = getSupabaseClient();
    const callbackUrl = new URL('/auth/callback', window.location.origin);
    callbackUrl.searchParams.set('locale', locale);
    if (next) callbackUrl.searchParams.set('next', next);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl.toString() },
    });

    if (error) setPending(false);
  }

  return (
    <Button variant="primary" size="md" className="w-full" disabled={pending} onClick={handleClick}>
      <GoogleIcon className="h-4 w-4" />
      {label}
    </Button>
  );
}
