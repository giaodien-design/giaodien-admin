'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateApp, createScreens, getAllCategories } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DeleteAppForm } from '@/components/delete-app-form';
import { MultiImageUpload, type ScreenUpload } from '@/components/multi-image-upload';
import { ScreenCard } from '@/components/screen-card';
import { Badge } from '@/components/ui/badge';

interface Flow {
  id: string;
  name: string;
}

interface Screen {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  flowId: string | null;
  flow: {
    id: string;
    name: string;
  } | null;
}

interface App {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  platform: string;
  icon: string | null;
  category: string | null;
  categoryId: string | null;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  brandColor: string | null;
  websiteUrl: string | null;
  thumbnailUrl: string | null;
  sortOrder: number;
}

interface EditAppFormClientProps {
  app: App;
  flows: Flow[];
  existingScreens: Screen[];
}

export function EditAppFormClient({ app, flows, existingScreens }: EditAppFormClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingScreens, setIsSubmittingScreens] = useState(false);
  const [selectedFlowId, setSelectedFlowId] = useState<string>('');
  const [screens, setScreens] = useState<ScreenUpload[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(app.categoryId || '');

  // Group existing screens by flow
  const screensByFlow = existingScreens.reduce(
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
        screens: Screen[];
      }
    >
  );

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      // Add the category ID from state
      if (selectedCategoryId) {
        formData.set('categoryId', selectedCategoryId);
      } else {
        formData.set('categoryId', '');
      }
      await updateApp(app.id, formData);
      router.refresh();
    } catch (error) {
      console.error('Failed to update app:', error);
      alert(error instanceof Error ? error.message : 'Failed to update app');
      setIsSubmitting(false);
    }
  };

  const handleSubmitScreens = async () => {
    if (!selectedFlowId) {
      alert('Please select a flow before uploading screens');
      return;
    }

    if (screens.length === 0) {
      alert('Please add at least one screen');
      return;
    }

    // Validate screens are uploaded
    const unuploadedScreens = screens.filter((s) => !s.imageUrl);
    if (unuploadedScreens.length > 0) {
      alert(`Please upload all screens to S3 first. ${unuploadedScreens.length} screen(s) pending.`);
      return;
    }

    setIsSubmittingScreens(true);

    try {
      // Prepare screen data with the selected flow
      const screenData = screens.map((s) => ({
        title: s.title,
        description: s.description || undefined,
        imageUrl: s.imageUrl,
        flowId: selectedFlowId
      }));

      const result = await createScreens(app.id, screenData);
      if (result.success) {
        // Reset form
        setScreens([]);
        setSelectedFlowId('');
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to create screens:', error);
      alert(error instanceof Error ? error.message : 'Failed to create screens');
    } finally {
      setIsSubmittingScreens(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full py-6 space-y-6">
      {/* App Metadata Form */}
      <Card>
        <CardHeader>
          <CardTitle>Edit App</CardTitle>
          <CardDescription>Update application details</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">App Name *</Label>
              <Input id="name" name="name" placeholder="e.g., Instagram, Facebook" defaultValue={app.name} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input id="slug" name="slug" placeholder="e.g., instagram, facebook" defaultValue={app.slug} required />
              <p className="text-sm text-muted-foreground">URL-friendly identifier (lowercase, no spaces)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                placeholder="Brief description of the app..."
                defaultValue={app.description || ''}
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
              <Label htmlFor="category-select">Category</Label>
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId} disabled={isSubmitting}>
                <SelectTrigger id="category-select">
                  <SelectValue placeholder="Select a category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Website URL</Label>
              <Input
                id="websiteUrl"
                name="websiteUrl"
                type="url"
                placeholder="https://example.com"
                defaultValue={app.websiteUrl || ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="iconUrl">Icon URL</Label>
              <Input
                id="iconUrl"
                name="icon"
                type="url"
                placeholder="https://example.com/icon.png"
                defaultValue={app.icon || ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
              <Input
                id="thumbnailUrl"
                name="thumbnailUrl"
                type="url"
                placeholder="https://example.com/thumbnail.png"
                defaultValue={app.thumbnailUrl || ''}
              />
              <p className="text-sm text-muted-foreground">Cover image for the App Card</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input id="sortOrder" name="sortOrder" type="number" placeholder="0" defaultValue={app.sortOrder} />
              <p className="text-sm text-muted-foreground">
                Controls the app's position on the homepage (lower numbers appear first)
              </p>
            </div>

            <div className="flex gap-3 justify-between">
              <DeleteAppForm appId={app.id} appName={app.name} />

              <div className="flex gap-3">
                <Button type="button" variant="outline" asChild>
                  <a href={`/apps/${app.id}`}>Cancel</a>
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Screen Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Screens</CardTitle>
          <CardDescription>Upload screenshots and assign them to a flow</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Flow Selection */}
          <div className="space-y-2">
            <Label htmlFor="flow-select">Select Flow *</Label>
            <Select value={selectedFlowId} onValueChange={setSelectedFlowId} disabled={isSubmittingScreens}>
              <SelectTrigger id="flow-select">
                <SelectValue placeholder="Select a flow to assign screens to" />
              </SelectTrigger>
              <SelectContent>
                {flows.map((flow) => (
                  <SelectItem key={flow.id} value={flow.id}>
                    {flow.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              All screens uploaded below will be assigned to the selected flow
            </p>
          </div>

          <Separator />

          {/* Multi Image Upload */}
          <MultiImageUpload
            onScreensChange={setScreens}
            maxFiles={20}
            flows={[]} // Don't show individual flow selection since we're using the dropdown above
          />

          <Separator />

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setScreens([]);
                setSelectedFlowId('');
              }}
              disabled={isSubmittingScreens}
            >
              Clear
            </Button>
            <Button
              type="button"
              onClick={handleSubmitScreens}
              disabled={isSubmittingScreens || screens.length === 0 || !selectedFlowId}
            >
              {isSubmittingScreens ? 'Uploading Screens...' : 'Upload Screens'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Screens Grouped by Flow */}
      {existingScreens.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Screens by Flow</CardTitle>
            <CardDescription>Existing screens organized by their assigned flow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
                {Object.keys(screensByFlow).indexOf(flowKey) < Object.keys(screensByFlow).length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
