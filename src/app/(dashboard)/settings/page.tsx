import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getPremiumModeStatus } from '@/lib/actions/settings';
import { PremiumModeToggle } from './premium-mode-toggle';

// Revalidate on every request to ensure fresh data
export const dynamic = 'force-dynamic';

async function SettingsContent() {
  const isPremiumActive = await getPremiumModeStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Flags</CardTitle>
        <CardDescription>Manage system-wide feature toggles</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-sm font-medium">Premium Mode</div>
            <div className="text-sm text-muted-foreground">
              Enable to lock premium apps and require subscription.
            </div>
          </div>
          <PremiumModeToggle initialValue={isPremiumActive} />
        </div>
      </CardContent>
    </Card>
  );
}

function SettingsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-5 w-9 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  return (
    <>
      {/* Header */}
      <div className="py-4">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage system configuration</p>
      </div>

      {/* Settings Content */}
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsContent />
      </Suspense>
    </>
  );
}
