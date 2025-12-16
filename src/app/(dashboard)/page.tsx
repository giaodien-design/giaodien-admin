import { Suspense } from 'react';
import Link from 'next/link';
import { getDashboardStats } from '@/lib/actions/dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  IconApps,
  IconGitBranch,
  IconPhoto,
  IconCategory,
  IconPlus,
  IconStack2,
  IconComponents
} from '@tabler/icons-react';

// Revalidate every 60 seconds
export const revalidate = 60;

async function DashboardContent() {
  const result = await getDashboardStats();

  if (!result.success) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Failed to load dashboard data. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }

  const { counts, recentApps, recentFlows } = result.data;

  return (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Apps</CardTitle>
            <IconApps className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.apps}</div>
            <p className="text-xs text-muted-foreground">Applications in database</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Flows</CardTitle>
            <IconGitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.flows}</div>
            <p className="text-xs text-muted-foreground">User flow templates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Screens</CardTitle>
            <IconPhoto className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.screens}</div>
            <p className="text-xs text-muted-foreground">Screen screenshots</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <IconCategory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.categories}</div>
            <p className="text-xs text-muted-foreground">App categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Screen Types</CardTitle>
            <IconStack2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.screenTypes}</div>
            <p className="text-xs text-muted-foreground">Screen classifications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">UI Elements</CardTitle>
            <IconComponents className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.uiElements}</div>
            <p className="text-xs text-muted-foreground">UI component tags</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Content */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent Apps */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Apps</CardTitle>
            <CardDescription>Latest applications added to the database</CardDescription>
          </CardHeader>
          <CardContent>
            {recentApps.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentApps.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">
                        <Link href={`/apps/${app.id}`} className="hover:underline">
                          {app.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {app.category ? (
                          <Badge variant="secondary">{app.category.name}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">No apps yet</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Flows */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Flows</CardTitle>
            <CardDescription>Latest user flow templates</CardDescription>
          </CardHeader>
          <CardContent>
            {recentFlows.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Screens</TableHead>
                    <TableHead className="text-right">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentFlows.map((flow) => (
                    <TableRow key={flow.id}>
                      <TableCell className="font-medium">
                        <Link href={`/flows`} className="hover:underline">
                          {flow.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{flow._count.screens} screens</Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {new Date(flow.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">No flows yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/apps/create">
                <IconPlus className="mr-2 h-4 w-4" />
                Add New App
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/flows">
                <IconGitBranch className="mr-2 h-4 w-4" />
                Manage Flows
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/categories">
                <IconCategory className="mr-2 h-4 w-4" />
                Manage Categories
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/screen-types">
                <IconStack2 className="mr-2 h-4 w-4" />
                Screen Types
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/ui-elements">
                <IconComponents className="mr-2 h-4 w-4" />
                UI Elements
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <>
      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tables Skeleton */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((j) => (
                  <Skeleton key={j} className="h-10 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-32" />
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export default function DashboardPage() {
  return (
    <>
      {/* Header */}
      <div className="py-4">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Content Overview</p>
      </div>

      {/* Dashboard Content */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </>
  );
}


