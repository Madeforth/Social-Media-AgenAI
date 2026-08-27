import { InboxIcon } from '@/components/icons';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { getI18n } from '@/i18n/get-dictionary';

interface PageParams {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageParams) {
  const { locale } = await params;
  const { dictionary } = await getI18n(locale);
  return { title: `${dictionary.meta.inbox} · Apex Social AI` };
}

export default async function InboxPage({ params }: PageParams) {
  const { locale } = await params;
  const { dictionary } = await getI18n(locale);
  const copy = dictionary.inbox;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader title={copy.title} description={copy.description} />
      <Card>
        <EmptyState
          icon={<InboxIcon className="h-5 w-5" />}
          title={copy.emptyTitle}
          description={copy.emptyDescription}
        />
      </Card>
    </div>
  );
}
