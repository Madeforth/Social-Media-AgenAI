'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { defaultLocale, hasLocale } from '@/i18n/config';

import { getCurrentUser } from './auth';
import { getServerSupabase } from './supabase-server';

const COMBINING_DIACRITICS = /[̀-ͯ]/g;

/** `brands.slug` is `^[a-z0-9]+(-[a-z0-9]+)*$` — derive one from the brand name. */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(COMBINING_DIACRITICS, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Creates one organization (the caller becomes its `OWNER` via the database
 * trigger) and one brand inside it. V1 is one implicit brand per
 * organization — this is the entire "brand selection" surface for now.
 */
export async function createOrganizationAndBrand(formData: FormData): Promise<void> {
  const brandName = String(formData.get('brandName') ?? '').trim();
  const locale = String(formData.get('locale') ?? defaultLocale);
  if (!brandName) return;

  const user = await getCurrentUser();
  if (!user) redirect(`/${hasLocale(locale) ? locale : defaultLocale}/sign-in`);

  const supabase = await getServerSupabase();

  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .insert({ name: `${brandName}'s workspace`, owner_user_id: user.id })
    .select('id')
    .single();

  if (orgError || !organization) return;

  const slug = slugify(brandName) || 'brand';
  await supabase.from('brands').insert({
    organization_id: organization.id,
    name: brandName,
    slug,
  });

  revalidatePath(`/${hasLocale(locale) ? locale : defaultLocale}`, 'layout');
}

export async function signOutAction(formData: FormData): Promise<void> {
  const locale = String(formData.get('locale') ?? defaultLocale);
  const supabase = await getServerSupabase();
  await supabase.auth.signOut();
  redirect(`/${hasLocale(locale) ? locale : defaultLocale}/sign-in`);
}
