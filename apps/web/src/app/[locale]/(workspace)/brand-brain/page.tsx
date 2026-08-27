import { BrainIcon, PencilIcon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardDivider, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { getI18n } from '@/i18n/get-dictionary';
import { getBrandGuidelines, getCurrentBrand } from '@/lib/data';

interface PageParams {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageParams) {
  const { locale } = await params;
  const { dictionary } = await getI18n(locale);
  return { title: `${dictionary.meta.brandBrain} · Apex Social AI` };
}

function TextBlock({
  label,
  value,
  emptyLabel,
}: {
  label: string;
  value: string | null;
  emptyLabel: string;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.12em] text-text-muted">{label}</p>
      {value ? (
        <p className="mt-1.5 text-sm leading-relaxed text-text-primary">{value}</p>
      ) : (
        <p className="mt-1.5 text-sm text-text-muted">{emptyLabel}</p>
      )}
    </div>
  );
}

function ListBlock({
  label,
  values,
  emptyLabel,
}: {
  label: string;
  values: string[];
  emptyLabel: string;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.12em] text-text-muted">{label}</p>
      {values.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-2">
          {values.map((value) => (
            <li
              key={value}
              className="rounded-full border border-border-subtle bg-surface-raised px-2.5 py-1 text-xs text-text-secondary"
            >
              {value}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1.5 text-sm text-text-muted">{emptyLabel}</p>
      )}
    </div>
  );
}

export default async function BrandBrainPage({ params }: PageParams) {
  const { locale } = await params;
  const [brand, guidelines, { dictionary }] = await Promise.all([
    getCurrentBrand(),
    getBrandGuidelines(),
    getI18n(locale),
  ]);
  const copy = dictionary.brandBrain;

  if (!guidelines) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <PageHeader title={copy.title} description={copy.description(copy.yourBrand)} />
        <Card>
          <EmptyState
            icon={<BrainIcon className="h-5 w-5" />}
            title={copy.emptyTitle}
            description={copy.emptyDescription}
            action={
              brand ? (
                <ButtonLink href="/brand-brain/edit" variant="primary">
                  <PencilIcon className="h-4 w-4" />
                  {copy.edit}
                </ButtonLink>
              ) : undefined
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader
        title={copy.title}
        description={copy.description(brand?.name ?? copy.yourBrand)}
        action={
          <ButtonLink href="/brand-brain/edit">
            <PencilIcon className="h-4 w-4" />
            {copy.edit}
          </ButtonLink>
        }
      />

      <Card>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <BrainIcon className="h-4 w-4 text-accent" />
              {copy.positioning.title}
            </span>
          }
        />
        <CardDivider />
        <div className="grid gap-5 p-5 sm:grid-cols-2">
          <TextBlock
            label={copy.positioning.mission}
            value={guidelines.mission}
            emptyLabel={copy.positioning.notDefined}
          />
          <TextBlock
            label={copy.positioning.vision}
            value={guidelines.vision}
            emptyLabel={copy.positioning.notDefined}
          />
          <TextBlock
            label={copy.positioning.positioning}
            value={guidelines.positioning}
            emptyLabel={copy.positioning.notDefined}
          />
          <TextBlock
            label={copy.positioning.targetAudience}
            value={guidelines.target_audience}
            emptyLabel={copy.positioning.notDefined}
          />
        </div>
      </Card>

      <Card>
        <CardHeader title={copy.contentPillars.title} />
        <CardDivider />
        {guidelines.content_pillars.length > 0 ? (
          <div className="flex flex-col divide-y divide-border-subtle">
            {guidelines.content_pillars.map((pillar) => (
              <div key={pillar.key} className="flex items-start justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary">{pillar.name}</p>
                  <p className="mt-0.5 text-xs text-text-secondary">{pillar.description}</p>
                </div>
                <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-1 text-xs text-accent">
                  {Math.round(pillar.target_share * 100)}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title={copy.contentPillars.emptyTitle}
            description={copy.contentPillars.emptyDescription}
          />
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={copy.voiceAndCopy.title} />
          <CardDivider />
          <div className="flex flex-col gap-5 p-5">
            <ListBlock
              label={copy.voiceAndCopy.toneAttributes}
              values={guidelines.tone_of_voice?.attributes ?? []}
              emptyLabel={copy.voiceAndCopy.nothingDefined}
            />
            <ListBlock
              label={copy.voiceAndCopy.always}
              values={guidelines.copy_rules?.do ?? []}
              emptyLabel={copy.voiceAndCopy.nothingDefined}
            />
            <ListBlock
              label={copy.voiceAndCopy.never}
              values={guidelines.copy_rules?.dont ?? []}
              emptyLabel={copy.voiceAndCopy.nothingDefined}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title={copy.visualRules.title} />
          <CardDivider />
          <div className="flex flex-col gap-5 p-5">
            <ListBlock
              label={copy.visualRules.palette}
              values={guidelines.visual_rules?.palette ?? []}
              emptyLabel={copy.voiceAndCopy.nothingDefined}
            />
            <ListBlock
              label={copy.visualRules.typography}
              values={guidelines.visual_rules?.typography ?? []}
              emptyLabel={copy.voiceAndCopy.nothingDefined}
            />
            <ListBlock
              label={copy.visualRules.avoid}
              values={guidelines.visual_rules?.avoid ?? []}
              emptyLabel={copy.voiceAndCopy.nothingDefined}
            />
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title={copy.forbiddenClaims.title} />
        <CardDivider />
        <div className="p-5">
          <p className="mb-3 text-xs text-text-secondary">{copy.forbiddenClaims.notice}</p>
          <ListBlock
            label={copy.forbiddenClaims.claims}
            values={guidelines.forbidden_claims}
            emptyLabel={copy.voiceAndCopy.nothingDefined}
          />
        </div>
      </Card>
    </div>
  );
}
