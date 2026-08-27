import { notFound } from 'next/navigation';

import { Button, ButtonLink } from '@/components/ui/button';
import { Card, CardDivider, CardHeader } from '@/components/ui/card';
import { FieldLabel, Input, Textarea } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { getI18n } from '@/i18n/get-dictionary';
import { editPostVersion } from '@/lib/actions';
import { getPost } from '@/lib/data';

interface PageParams {
  params: Promise<{ locale: string; postId: string }>;
}

export async function generateMetadata({ params }: PageParams) {
  const { locale, postId } = await params;
  const [post, { dictionary }] = await Promise.all([getPost(postId), getI18n(locale)]);
  return {
    title: `${dictionary.postDetail.edit} · ${post?.concept_title ?? dictionary.meta.postFallback} · Apex Social AI`,
  };
}

export default async function EditPostPage({ params }: PageParams) {
  const { locale, postId } = await params;
  const [post, { dictionary }] = await Promise.all([getPost(postId), getI18n(locale)]);
  if (!post) notFound();
  const copy = dictionary.postDetail;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader title={`${copy.edit} · ${post.concept_title}`} />

      <form action={editPostVersion} className="flex flex-col gap-6">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="postId" value={post.id} />

        <Card>
          <CardHeader title={copy.copy.title} />
          <CardDivider />
          <div className="flex flex-col gap-5 p-5">
            <FieldLabel label={copy.copy.headline}>
              <Input
                name="headline"
                defaultValue={post.version.headline}
                maxLength={150}
                required
              />
            </FieldLabel>
            <FieldLabel label={copy.copy.supportingCopy}>
              <Textarea
                name="supportingCopy"
                defaultValue={post.version.supporting_copy}
                rows={3}
              />
            </FieldLabel>
            <FieldLabel label={copy.copy.caption}>
              <Textarea
                name="caption"
                defaultValue={post.version.caption}
                rows={5}
                maxLength={2200}
                required
              />
            </FieldLabel>
            <FieldLabel label={copy.copy.callToAction}>
              <Input name="cta" defaultValue={post.version.cta} maxLength={150} />
            </FieldLabel>
            <FieldLabel label={copy.copy.hashtags} hint={dictionary.brandBrain.editForm.listHint}>
              <Textarea name="hashtags" defaultValue={post.version.hashtags.join('\n')} rows={3} />
            </FieldLabel>
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <ButtonLink href={`/posts/${post.id}`} variant="ghost">
            {dictionary.brandBrain.editForm.cancel}
          </ButtonLink>
          <Button type="submit" variant="primary">
            {dictionary.brandBrain.editForm.save}
          </Button>
        </div>
      </form>
    </div>
  );
}
