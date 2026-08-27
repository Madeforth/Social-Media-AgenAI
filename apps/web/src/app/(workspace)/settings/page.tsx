import { MOCK_BRAND } from '@apex/mocks';

import { PlugIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardDivider, CardHeader } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';

export const metadata = { title: 'Settings · Apex Social AI' };

function Row({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
      <div className="min-w-0">
        <p className="text-sm text-text-primary">{title}</p>
        <p className="mt-0.5 text-xs text-text-secondary">{description}</p>
      </div>
      {action}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader title="Settings" description="Integrations, notifications and account." />

      <Card>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <PlugIcon className="h-4 w-4 text-accent" />
              Integrations
            </span>
          }
        />
        <CardDivider />
        <div className="divide-y divide-border-subtle">
          <Row
            title="Instagram"
            description="Publishing and metrics run through the Meta Graph API. Tokens are stored server-side and never reach this browser."
            action={<Button variant="primary">Connect</Button>}
          />
          <Row
            title="Gemini"
            description="Configured as a Supabase secret. The key is only ever read inside an Edge Function."
            action={<span className="text-xs text-text-muted">Server-side</span>}
          />
        </div>
      </Card>

      <Card>
        <CardHeader title="Brand" />
        <CardDivider />
        <div className="divide-y divide-border-subtle">
          <Row
            title={MOCK_BRAND.name}
            description={MOCK_BRAND.description ?? 'No description yet.'}
            action={<Button>Manage</Button>}
          />
          <Row
            title="Add a brand"
            description="The data model is multi-brand from the start."
            action={<Button>New brand</Button>}
          />
        </div>
      </Card>

      <Card>
        <CardHeader title="Notifications" />
        <CardDivider />
        <div className="divide-y divide-border-subtle">
          <Row
            title="Approval required"
            description="Push a notification when a generated post is waiting for review."
            action={<span className="text-xs text-text-muted">Not configured</span>}
          />
          <Row
            title="Publish failures"
            description="Alert when a scheduled post fails to publish."
            action={<span className="text-xs text-text-muted">Not configured</span>}
          />
        </div>
      </Card>
    </div>
  );
}
