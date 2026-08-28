import { VISUAL_FORMATS } from '@apex/types';

import { PencilIcon, SparkIcon } from '@/components/icons';
import { LocaleLink } from '@/components/locale-link';
import { Card, CardDivider, CardHeader } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { PendingBar } from '@/components/ui/pending-bar';
import { SubmitButton } from '@/components/ui/submit-button';
import { getI18n } from '@/i18n/get-dictionary';
import { generatePost } from '@/lib/actions';
import { cn } from '@/lib/cn';
import { getBrandGuidelines } from '@/lib/data';

export const maxDuration = 60;

type Mode = 'ai_suggestion' | 'custom_brief';

interface PageParams {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageParams) {
  const { locale } = await params;
  const { dictionary } = await getI18n(locale);
  return { title: `${dictionary.meta.create} · Madeforth Social AI` };
}

function FieldShell({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] uppercase tracking-[0.12em] text-text-muted">{label}</span>
        {hint ? <span className="text-[11px] text-text-muted">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

const INPUT_CLASS =
  'w-full rounded-md border border-border-subtle bg-surface-raised px-3 py-2.5 text-sm text-text-primary outline-none transition-colors duration-150 placeholder:text-text-muted focus:border-accent';

export default async function CreatePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ mode?: string; error?: string }>;
}) {
  const [{ mode, error }, { locale }, guidelines] = await Promise.all([
    searchParams,
    params,
    getBrandGuidelines(),
  ]);
  const { dictionary } = await getI18n(locale);
  const copy = dictionary.create;
  const activeMode: Mode = mode === 'custom_brief' ? 'custom_brief' : 'ai_suggestion';
  const errorMessage =
    error && error in copy.errors ? copy.errors[error as keyof typeof copy.errors] : null;
  const pillars = guidelines?.content_pillars ?? [];
  const modes: Array<{ id: Mode; title: string; description: string }> = [
    { id: 'ai_suggestion', ...copy.modes.aiSuggestion },
    { id: 'custom_brief', ...copy.modes.customBrief },
  ];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader title={copy.title} description={copy.description} />

      {errorMessage ? (
        <p className="rounded-md border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {errorMessage}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {modes.map((option) => {
          const active = option.id === activeMode;
          const Icon = option.id === 'ai_suggestion' ? SparkIcon : PencilIcon;
          return (
            <LocaleLink
              key={option.id}
              href={`/create?mode=${option.id}`}
              className={cn(
                'rounded-lg border p-4 transition-colors duration-150',
                active
                  ? 'border-accent bg-accent-soft'
                  : 'border-border-subtle bg-surface hover:border-border-strong',
              )}
            >
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-md',
                  active ? 'bg-accent/20 text-accent' : 'bg-surface-raised text-text-secondary',
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <p
                className={cn(
                  'mt-3 text-sm font-medium',
                  active ? 'text-accent' : 'text-text-primary',
                )}
              >
                {option.title}
              </p>
              <p className="mt-1 text-xs text-text-secondary">{option.description}</p>
            </LocaleLink>
          );
        })}
      </div>

      <Card>
        <CardHeader title={copy.brief.title} />
        <CardDivider />
        <form action={generatePost} className="flex flex-col">
          <input type="hidden" name="locale" value={locale} />
          <div className="flex flex-col gap-5 p-5">
            {activeMode === 'custom_brief' ? (
              <FieldShell label={copy.brief.whatShouldThisBeAbout} hint={copy.brief.optional}>
                <textarea
                  name="brief"
                  rows={4}
                  maxLength={2000}
                  placeholder={copy.brief.placeholder}
                  className={cn(INPUT_CLASS, 'resize-none')}
                />
              </FieldShell>
            ) : (
              <p className="rounded-md border border-border-subtle bg-surface-raised px-3 py-2.5 text-sm text-text-secondary">
                {copy.brief.aiDecidesDescription}
              </p>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <FieldShell
                label={copy.fields.contentPillar}
                hint={pillars.length === 0 ? copy.fields.noneDefinedYet : copy.brief.optional}
              >
                <select name="contentPillar" defaultValue="" className={INPUT_CLASS}>
                  <option value="">{copy.fields.letAiDecide}</option>
                  {pillars.map((pillar) => (
                    <option key={pillar.key} value={pillar.name}>
                      {pillar.name}
                    </option>
                  ))}
                </select>
              </FieldShell>
              <FieldShell label={copy.fields.visualFormat} hint={copy.brief.optional}>
                <select name="visualFormat" defaultValue="" className={INPUT_CLASS}>
                  <option value="">{copy.fields.letAiDecide}</option>
                  {VISUAL_FORMATS.map((format) => (
                    <option key={format} value={format}>
                      {dictionary.visualFormat[format]}
                    </option>
                  ))}
                </select>
              </FieldShell>
              <FieldShell label={copy.fields.publishDate} hint={copy.brief.optional}>
                <input type="date" name="publishDate" className={INPUT_CLASS} />
              </FieldShell>
              <FieldShell label={copy.fields.language}>
                <select name="language" defaultValue={locale} className={INPUT_CLASS}>
                  <option value="en">{copy.languages.english}</option>
                  <option value="tr">{copy.languages.turkish}</option>
                  <option value="both">{copy.languages.both}</option>
                </select>
              </FieldShell>
            </div>
          </div>

          <CardDivider />
          <div className="flex flex-col gap-4 px-5 py-4">
            <PendingBar
              message={dictionary.pending.generating}
              elapsedSuffix={dictionary.pending.elapsedSuffix}
              slowNotice={dictionary.pending.slowNotice}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-text-muted">{copy.fieldsNotice}</p>
              <SubmitButton
                label={copy.generateButton}
                pendingLabel={dictionary.pending.generateButton}
                icon={<SparkIcon className="h-4 w-4" />}
              />
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
