import { InboxIcon } from '@/components/icons';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';

export const metadata = { title: 'Inbox · Apex Social AI' };

export default function InboxPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader title="Inbox" description="Comments and direct messages, in one place." />
      <Card>
        <EmptyState
          icon={<InboxIcon className="h-5 w-5" />}
          title="Inbox is not part of V1"
          description="The navigation slot and the data model are reserved so this can be switched on without a migration."
        />
      </Card>
    </div>
  );
}
