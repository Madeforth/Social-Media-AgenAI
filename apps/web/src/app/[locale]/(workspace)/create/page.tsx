import { VISUAL_FORMATS } from '@apex/types';
import { VISUAL_FORMAT_LABELS } from '@apex/ui';

import { PencilIcon, SparkIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardDivider, CardHeader } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { cn } from '@/lib/cn';
import { getBrandGuidelines } from '@/lib/data';

export const metadata = { title: 'Create with AI · Apex Social AI' };

type Mode = 'ai_suggestion' | 'custom_brief';

const MODES: Array<{ id: Mode; title: string; description: string }> = [
  {
    id: 'ai_suggestion',
    title: 'AI suggestion',
    description: 'The AI reads the brand, the recent history and the pillar balance, then decides.',
  },
  {
    id: 'custom_brief',
    title: 'Custom brief',
    description: 'Describe the idea in your own words and let the AI shape it.',
  },
];

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
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const [{ mode }, guidelines] = await Promise.all([searchParams, getBrandGuidelines()]);
  const activeMode: Mode = mode === 'custom_brief' ? 'custom_brief' : 'ai_suggestion';
  const pillars = guidelines?.content_pillars ?? [];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader
        title="Create with AI"
        description="You should never have to write a long prompt. Pick a mode and the brand does the rest."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {MODES.map((option) => {
          const active = option.id === activeMode;
          const Icon = option.id === 'ai_suggestion' ? SparkIcon : PencilIcon;
          return (
            <a
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
            </a>
          );
        })}
      </div>

      <Card>
        <CardHeader title="Brief" />
        <CardDivider />
        <div className="flex flex-col gap-5 p-5">
          {activeMode === 'custom_brief' ? (
            <FieldShell label="What should this post be about?" hint="Optional">
              <textarea
                rows={4}
                disabled
                placeholder="Describe the idea in your own words."
                className={cn(INPUT_CLASS, 'resize-none')}
              />
            </FieldShell>
          ) : (
            <p className="rounded-md border border-border-subtle bg-surface-raised px-3 py-2.5 text-sm text-text-secondary">
              The AI will pick the objective, the content pillar and the creative format from the
              Brand Brain and the recent content history.
            </p>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <FieldShell
              label="Content pillar"
              hint={pillars.length === 0 ? 'None defined yet' : 'Optional'}
            >
              <select disabled className={INPUT_CLASS}>
                <option>Let the AI decide</option>
                {pillars.map((pillar) => (
                  <option key={pillar.key}>{pillar.name}</option>
                ))}
              </select>
            </FieldShell>
            <FieldShell label="Visual format" hint="Optional">
              <select disabled className={INPUT_CLASS}>
                <option>Let the AI decide</option>
                {VISUAL_FORMATS.map((format) => (
                  <option key={format}>{VISUAL_FORMAT_LABELS[format]}</option>
                ))}
              </select>
            </FieldShell>
            <FieldShell label="Publish date" hint="Optional">
              <input type="date" disabled className={INPUT_CLASS} />
            </FieldShell>
            <FieldShell label="Language">
              <select disabled className={INPUT_CLASS}>
                <option>English</option>
                <option>Türkçe</option>
              </select>
            </FieldShell>
          </div>
        </div>
        <CardDivider />
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <p className="text-xs text-text-muted">
            Generation is wired up in a later milestone — the form is disabled until the Gemini Edge
            Function exists.
          </p>
          <Button variant="primary" disabled>
            <SparkIcon className="h-4 w-4" />
            Generate content
          </Button>
        </div>
      </Card>
    </div>
  );
}
