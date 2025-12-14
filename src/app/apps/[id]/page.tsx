import { Suspense } from 'react';
import { getAppById, getScreensByAppId } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { IconEdit, IconExternalLink } from '@tabler/icons-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ScreenCard } from '@/components/screen-card';

// Revalidate every 60 seconds
export const revalidate = 60;

async function AppDetailContent({ appId }: { appId: string }) {
  const [appResult, screensResult] = await Promise.all([getAppById(appId), getScreensByAppId(appId)]);

  if (!appResult.success || !appResult.data) {
    notFound();
  }

  const app = appResult.data;
  const screens = screensResult.success ? screensResult.data : [];

  return (
    <div className="space-y-6">
      {/* App Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              {app.icon && (
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                  <img src={app.icon} alt={app.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <CardTitle className="text-3xl">{app.name}</CardTitle>
                  <Badge variant="secondary">{app.platform}</Badge>
                  {!app.isPublished && <Badge variant="outline">Unpublished</Badge>}
                </div>
                <CardDescription className="text-base">{app.slug}</CardDescription>
              </div>
            </div>
            <Button asChild>
              <Link href={`/apps/${app.id}/edit`}>
                <IconEdit className="mr-2 h-4 w-4" />
                Edit App
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {app.description && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{app.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {app.category && (
              <div>
                <h3 className="text-sm font-semibold mb-1">Category</h3>
                <p className="text-muted-foreground">{app.category.name}</p>
              </div>
            )}
            {!app.category && app.legacyCategory && (
              <div>
                <h3 className="text-sm font-semibold mb-1">Category</h3>
                <p className="text-muted-foreground">{app.legacyCategory}</p>
              </div>
            )}
            {app.brandColor && (
              <div>
                <h3 className="text-sm font-semibold mb-1">Brand Color</h3>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded border" style={{ backgroundColor: app.brandColor }} />
                  <span className="text-muted-foreground">{app.brandColor}</span>
                </div>
              </div>
            )}
            {app.websiteUrl && (
              <div>
                <h3 className="text-sm font-semibold mb-1">Website</h3>
                <a
                  href={app.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  Visit
                  <IconExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold mb-1">Screens</h3>
              <p className="text-muted-foreground">
                {screens?.length || 0} screen{screens?.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="text-xs text-muted-foreground pt-2 border-t">
            Created: {new Date(app.createdAt).toLocaleDateString()} • Updated:{' '}
            {new Date(app.updatedAt).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>

      {/* Screens Gallery Grouped by Flow */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Screens</h2>
          <Button variant="outline" asChild>
            <Link href={`/apps/${app.id}/edit`}>Add Screens</Link>
          </Button>
        </div>

        {screens && screens.length > 0 ? (
          (() => {
            // Group screens by flow
            const screensByFlow = screens.reduce(
              (acc, screen) => {
                const flowKey = screen.flowId || 'no-flow';
                if (!acc[flowKey]) {
                  acc[flowKey] = {
                    flow: screen.flow,
                    screens: []
                  };
                }
                acc[flowKey].screens.push(screen);
                return acc;
              },
              {} as Record<
                string,
                {
                  flow: { id: string; name: string } | null;
                  screens: typeof screens;
                }
              >
            );

            return (
              <div className="space-y-6">
                {Object.entries(screensByFlow).map(([flowKey, { flow, screens: flowScreens }]) => (
                  <div key={flowKey} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{flow ? flow.name : 'No Flow'}</h3>
                      <Badge variant="secondary">
                        {flowScreens.length} screen{flowScreens.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {flowScreens.map((screen) => (
                        <ScreenCard key={screen.id} screen={screen} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No screens added yet. Add screens to showcase your app.</p>
              <Button asChild>
                <Link href={`/apps/${app.id}/edit`}>Add Screens</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function AppDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <Skeleton className="w-20 h-20 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="aspect-[9/16]" />
        ))}
      </div>
    </div>
  );
}

export default function AppDetailPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<AppDetailSkeleton />}>
      <AppDetailContent appId={params.id} />
    </Suspense>
  );
}
