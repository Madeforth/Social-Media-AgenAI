import { BrainIcon, PencilIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardDivider, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { getBrandGuidelines, getCurrentBrand } from '@/lib/data';

export const metadata = { title: 'Brand Brain · Apex Social AI' };

function TextBlock({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.12em] text-text-muted">{label}</p>
      {value ? (
        <p className="mt-1.5 text-sm leading-relaxed text-text-primary">{value}</p>
      ) : (
        <p className="mt-1.5 text-sm text-text-muted">
          Not defined yet — the AI works better once this is filled in.
        </p>
      )}
    </div>
  );
}

function ListBlock({ label, values }: { label: string; values: string[] }) {
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
        <p className="mt-1.5 text-sm text-text-muted">Nothing defined yet.</p>
      )}
    </div>
  );
}

export default async function BrandBrainPage() {
  const [brand, guidelines] = await Promise.all([getCurrentBrand(), getBrandGuidelines()]);

  if (!guidelines) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <PageHeader title="Brand Brain" description="Everything the AI knows about your brand." />
        <Card>
          <EmptyState
            icon={<BrainIcon className="h-5 w-5" />}
            title="No brand defined yet"
            description="Mission, positioning, tone, visual rules and content pillars are entered here. The AI reads all of it before it writes anything."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader
        title="Brand Brain"
        description={`Everything the AI knows about ${brand?.name ?? 'your brand'}.`}
        action={
          <Button>
            <PencilIcon className="h-4 w-4" />
            Edit
          </Button>
        }
      />

      <Card>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <BrainIcon className="h-4 w-4 text-accent" />
              Positioning
            </span>
          }
        />
        <CardDivider />
        <div className="grid gap-5 p-5 sm:grid-cols-2">
          <TextBlock label="Mission" value={guidelines.mission} />
          <TextBlock label="Vision" value={guidelines.vision} />
          <TextBlock label="Positioning" value={guidelines.positioning} />
          <TextBlock label="Target audience" value={guidelines.target_audience} />
        </div>
      </Card>

      <Card>
        <CardHeader title="Content pillars" />
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
            title="No content pillars yet"
            description="Pillars keep the AI from drifting into one format. Define a few and the strategy layer balances between them."
          />
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Voice and copy rules" />
          <CardDivider />
          <div className="flex flex-col gap-5 p-5">
            <ListBlock
              label="Tone attributes"
              values={guidelines.tone_of_voice?.attributes ?? []}
            />
            <ListBlock label="Always" values={guidelines.copy_rules?.do ?? []} />
            <ListBlock label="Never" values={guidelines.copy_rules?.dont ?? []} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Visual rules" />
          <CardDivider />
          <div className="flex flex-col gap-5 p-5">
            <ListBlock label="Palette" values={guidelines.visual_rules?.palette ?? []} />
            <ListBlock label="Typography" values={guidelines.visual_rules?.typography ?? []} />
            <ListBlock label="Avoid" values={guidelines.visual_rules?.avoid ?? []} />
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Forbidden claims" />
        <CardDivider />
        <div className="p-5">
          <p className="mb-3 text-xs text-text-secondary">
            The AI is told never to state these, whatever the brief says.
          </p>
          <ListBlock label="Claims" values={guidelines.forbidden_claims} />
        </div>
      </Card>
    </div>
  );
}
