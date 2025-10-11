import { Suspense } from "react";
import { getAppById, updateApp } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteAppForm } from "@/components/delete-app-form";
import { notFound } from "next/navigation";

// Revalidate every 60 seconds
export const revalidate = 60;

async function EditAppForm({ id }: { id: string }) {
  const result = await getAppById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const app = result.data;
  const updateAppWithId = updateApp.bind(null, id);

  return (
    <div className="max-w-2xl mx-auto w-full py-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit App</CardTitle>
          <CardDescription>Update application details</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateAppWithId} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">App Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Instagram, Facebook"
                defaultValue={app.name}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                name="slug"
                placeholder="e.g., instagram, facebook"
                defaultValue={app.slug}
                required
              />
              <p className="text-sm text-muted-foreground">
                URL-friendly identifier (lowercase, no spaces)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                placeholder="Brief description of the app..."
                defaultValue={app.description || ""}
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="platform">Platform *</Label>
              <Select name="platform" defaultValue={app.platform}>
                <SelectTrigger id="platform">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IOS">iOS</SelectItem>
                  <SelectItem value="ANDROID">Android</SelectItem>
                  <SelectItem value="WEB">Web</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                name="category"
                placeholder="e.g., Social Media, Productivity"
                defaultValue={app.category || ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Website URL</Label>
              <Input
                id="websiteUrl"
                name="websiteUrl"
                type="url"
                placeholder="https://example.com"
                defaultValue={app.websiteUrl || ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="iconUrl">Icon URL</Label>
              <Input
                id="iconUrl"
                name="iconUrl"
                type="url"
                placeholder="https://example.com/icon.png"
                defaultValue={app.icon || ""}
              />
            </div>

            <div className="flex gap-3 justify-between">
              <DeleteAppForm appId={app.id} appName={app.name} />

              <div className="flex gap-3">
                <Button type="button" variant="outline" asChild>
                  <a href="/apps">Cancel</a>
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function EditAppSkeleton() {
  return (
    <div className="max-w-2xl mx-auto w-full py-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-32 mb-2" />
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <div className="flex gap-3 justify-between pt-4">
            <Skeleton className="h-10 w-32" />
            <div className="flex gap-3">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function EditAppPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<EditAppSkeleton />}>
      <EditAppForm id={id} />
    </Suspense>
  );
}
