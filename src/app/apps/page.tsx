import { Suspense } from 'react';
import { getApps } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DeleteAppButton } from '@/components/delete-app-button';
import { IconPlus } from '@tabler/icons-react';
import { Skeleton } from '@/components/ui/skeleton';

// Revalidate every 60 seconds
export const revalidate = 60;

async function AppsList() {
  const { data: apps } = await getApps();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {apps && apps.length > 0 ? (
        apps.map((app) => (
          <Card key={app.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                {app.icon && (
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img src={app.icon} alt={app.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <CardTitle className="flex items-center gap-2 flex-wrap">
                    <span className="truncate">{app.name}</span>
                    <Badge variant="secondary">{app.platform}</Badge>
                  </CardTitle>
                  <CardDescription className="mt-1.5 truncate">{app.slug}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {app.description || 'No description provided'}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {app.screens.length} screen
                  {app.screens.length !== 1 ? 's' : ''}
                </span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <a href={`/apps/${app.id}`}>View</a>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <a href={`/apps/${app.id}/edit`}>Edit</a>
                  </Button>
                  <DeleteAppButton appId={app.id} appName={app.name} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="col-span-full">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No apps found. Create your first app to get started.</p>
              <Button asChild>
                <a href="/apps/create">
                  <IconPlus className="mr-2 h-4 w-4" />
                  Create New App
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function AppsListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-16 w-full mb-4" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function AppsPage() {
  return (
    <>
      <div className="flex items-center justify-between py-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Apps</h1>
          <p className="text-muted-foreground">Manage your applications and their content</p>
        </div>
        <Button asChild>
          <a href="/apps/create">
            <IconPlus className="mr-2 h-4 w-4" />
            Create New App
          </a>
        </Button>
      </div>

      <Suspense fallback={<AppsListSkeleton />}>
        <AppsList />
      </Suspense>
    </>
  );
}
