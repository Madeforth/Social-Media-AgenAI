import { redirect } from 'next/navigation';

import { Button, ButtonLink } from '@/components/ui/button';
import { Card, CardDivider, CardHeader } from '@/components/ui/card';
import { FieldLabel, Input, Textarea } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { getI18n } from '@/i18n/get-dictionary';
import { updateBrandGuidelines } from '@/lib/actions';
import { getBrandGuidelines, getCurrentBrand } from '@/lib/data';

interface PageParams {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageParams) {
  const { locale } = await params;
  const { dictionary } = await getI18n(locale);
  return { title: `${dictionary.brandBrain.editForm.title} · Madeforth Social AI` };
}

const lines = (values: string[] | undefined): string => (values ?? []).join('\n');

export default async function EditBrandBrainPage({ params }: PageParams) {
  const { locale } = await params;
  const [brand, guidelines, { dictionary }] = await Promise.all([
    getCurrentBrand(),
    getBrandGuidelines(),
    getI18n(locale),
  ]);
  const copy = dictionary.brandBrain.editForm;

  if (!brand) redirect(`/${locale}/settings`);

  const pillarLines = (guidelines?.content_pillars ?? [])
    .map(
      (pillar) =>
        `${pillar.name} | ${pillar.description} | ${Math.round(pillar.target_share * 100)}`,
    )
    .join('\n');

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader title={copy.title} />

      <form action={updateBrandGuidelines} className="flex flex-col gap-6">
        <input type="hidden" name="locale" value={locale} />

        <Card>
          <CardHeader title={dictionary.brandBrain.positioning.title} />
          <CardDivider />
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            <FieldLabel label={copy.fields.mission}>
              <Textarea name="mission" defaultValue={guidelines?.mission ?? ''} />
            </FieldLabel>
            <FieldLabel label={copy.fields.vision}>
              <Textarea name="vision" defaultValue={guidelines?.vision ?? ''} />
            </FieldLabel>
            <FieldLabel label={copy.fields.positioning}>
              <Textarea name="positioning" defaultValue={guidelines?.positioning ?? ''} />
            </FieldLabel>
            <FieldLabel label={copy.fields.targetAudience}>
              <Textarea name="targetAudience" defaultValue={guidelines?.target_audience ?? ''} />
            </FieldLabel>
          </div>
        </Card>

        <Card>
          <CardHeader title={dictionary.brandBrain.contentPillars.title} />
          <CardDivider />
          <div className="p-5">
            <FieldLabel label={copy.fields.contentPillars} hint={copy.pillarsHint}>
              <Textarea name="contentPillars" rows={5} defaultValue={pillarLines} />
            </FieldLabel>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title={dictionary.brandBrain.voiceAndCopy.title} />
            <CardDivider />
            <div className="flex flex-col gap-5 p-5">
              <FieldLabel label={copy.fields.toneAttributes} hint={copy.listHint}>
                <Textarea
                  name="toneAttributes"
                  defaultValue={lines(guidelines?.tone_of_voice?.attributes)}
                />
              </FieldLabel>
              <FieldLabel label={copy.fields.toneDo} hint={copy.listHint}>
                <Textarea name="toneDo" defaultValue={lines(guidelines?.tone_of_voice?.do)} />
              </FieldLabel>
              <FieldLabel label={copy.fields.toneDont} hint={copy.listHint}>
                <Textarea name="toneDont" defaultValue={lines(guidelines?.tone_of_voice?.dont)} />
              </FieldLabel>
              <FieldLabel label={copy.fields.copyLanguage}>
                <Input
                  name="copyLanguage"
                  defaultValue={guidelines?.copy_rules?.language ?? locale}
                />
              </FieldLabel>
              <FieldLabel label={copy.fields.readingLevel}>
                <Input
                  name="readingLevel"
                  defaultValue={guidelines?.copy_rules?.reading_level ?? ''}
                />
              </FieldLabel>
              <FieldLabel label={copy.fields.copyDo} hint={copy.listHint}>
                <Textarea name="copyDo" defaultValue={lines(guidelines?.copy_rules?.do)} />
              </FieldLabel>
              <FieldLabel label={copy.fields.copyDont} hint={copy.listHint}>
                <Textarea name="copyDont" defaultValue={lines(guidelines?.copy_rules?.dont)} />
              </FieldLabel>
            </div>
          </Card>

          <Card>
            <CardHeader title={dictionary.brandBrain.visualRules.title} />
            <CardDivider />
            <div className="flex flex-col gap-5 p-5">
              <FieldLabel label={copy.fields.palette} hint={copy.listHint}>
                <Textarea name="palette" defaultValue={lines(guidelines?.visual_rules?.palette)} />
              </FieldLabel>
              <FieldLabel label={copy.fields.typography} hint={copy.listHint}>
                <Textarea
                  name="typography"
                  defaultValue={lines(guidelines?.visual_rules?.typography)}
                />
              </FieldLabel>
              <FieldLabel label={copy.fields.composition} hint={copy.listHint}>
                <Textarea
                  name="composition"
                  defaultValue={lines(guidelines?.visual_rules?.composition)}
                />
              </FieldLabel>
              <FieldLabel label={copy.fields.visualAvoid} hint={copy.listHint}>
                <Textarea
                  name="visualAvoid"
                  defaultValue={lines(guidelines?.visual_rules?.avoid)}
                />
              </FieldLabel>
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader title={dictionary.brandBrain.forbiddenClaims.title} />
          <CardDivider />
          <div className="p-5">
            <FieldLabel label={copy.fields.forbiddenClaims} hint={copy.listHint}>
              <Textarea name="forbiddenClaims" defaultValue={lines(guidelines?.forbidden_claims)} />
            </FieldLabel>
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <ButtonLink href="/brand-brain" variant="ghost">
            {copy.cancel}
          </ButtonLink>
          <Button type="submit" variant="primary">
            {copy.save}
          </Button>
        </div>
      </form>
    </div>
  );
}
