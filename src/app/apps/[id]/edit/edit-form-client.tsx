'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { updateApp, createScreens, getAllCategories, reorderScreens } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DeleteAppForm } from '@/components/delete-app-form';
import { MultiImageUpload, type ScreenUpload } from '@/components/multi-image-upload';
import { SortableScreenCard } from '@/components/sortable-screen-card';
import { Badge } from '@/components/ui/badge';
import { createAppVersion, deleteAppVersion } from '@/lib/actions';
import { IconX } from '@tabler/icons-react';

interface Flow {
  id: string;
  name: string;
}

interface AppVersion {
  id: string;
  name: string;
  createdAt: Date;
  _count: {
    screens: number;
  };
}

interface ScreenType {
  id: string;
  name: string;
  slug: string;
}

interface UIElement {
  id: string;
  name: string;
  slug: string;
}

interface AppVersion {
  id: string;
  name: string;
  createdAt: Date;
  _count: {
    screens: number;
  };
}

interface Screen {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  order?: number;
  flowId: string | null;
  flow: {
    id: string;
    name: string;
  } | null;
  appVersionId?: string | null;
  appVersion?: AppVersion | null;
  viewCount: number;
  likeCount: number;
  screenTypeId?: string | null;
  screenType?: ScreenType | null;
  uiElements?: UIElement[];
}

interface App {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  platform: string;
  icon: string | null;
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
  versions: AppVersion[];
}

export function EditAppFormClient({ app, flows, existingScreens, versions: initialVersions }: EditAppFormClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingScreens, setIsSubmittingScreens] = useState(false);
  const [selectedFlowId, setSelectedFlowId] = useState<string>('');
  const [selectedUploadVersionId, setSelectedUploadVersionId] = useState<string>('');
  const [screens, setScreens] = useState<ScreenUpload[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(app.categoryId || '');
  const [versions, setVersions] = useState<AppVersion[]>(initialVersions);
  const [newVersionName, setNewVersionName] = useState<string>('');
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [isDeletingVersion, setIsDeletingVersion] = useState<string | null>(null);
  const [selectedVersionFilter, setSelectedVersionFilter] = useState<string>('__all__');
  
  // State for managing screen order (optimistic UI)
  const [screensByFlowState, setScreensByFlowState] = useState<Record<
    string,
    {
      flow: { id: string; name: string } | null;
      screens: Screen[];
    }
  >>({});

  // Sync versions when props change
  useEffect(() => {
    setVersions(initialVersions);
  }, [initialVersions]);

  // Initialize screens state from existing screens
  useEffect(() => {
    const grouped = existingScreens.reduce(
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

    // Sort screens by order field within each flow
    Object.keys(grouped).forEach((flowKey) => {
      grouped[flowKey].screens.sort((a, b) => (a.order || 0) - (b.order || 0));
    });

    setScreensByFlowState(grouped);
  }, [existingScreens]);

  // Configure sensors with activation constraint
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  );

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const result = await getAllCategories();
        if (result.success && result.data) {
          setCategories(result.data);
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    loadCategories();
  }, []);

  // Group existing screens by flow (computed from state)
  const screensByFlow = screensByFlowState;

  // Filter screens by version
  const filteredScreensByFlow = Object.entries(screensByFlow).reduce(
    (acc, [flowKey, { flow, screens: flowScreens }]) => {
      let filtered = flowScreens;

      if (selectedVersionFilter === '__unassigned__') {
        // Show only screens without a version
        filtered = flowScreens.filter((s) => !s.appVersionId);
      } else if (selectedVersionFilter !== '__all__') {
        // Show screens matching the selected version
        filtered = flowScreens.filter((s) => s.appVersionId === selectedVersionFilter);
      }

      // Only include flows that have screens after filtering
      if (filtered.length > 0) {
        acc[flowKey] = { flow, screens: filtered };
      }

      return acc;
    },
    {} as typeof screensByFlow
  );

  // Count screens for filter display
  const unassignedCount = existingScreens.filter((s) => !s.appVersionId).length;

  // Handle drag end event
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    // Find which flow contains the dragged screen
    let sourceFlowKey: string | null = null;
    let sourceScreen: Screen | null = null;

    for (const [flowKey, { screens: flowScreens }] of Object.entries(screensByFlow)) {
      const screen = flowScreens.find((s) => s.id === active.id);
      if (screen) {
        sourceFlowKey = flowKey;
        sourceScreen = screen;
        break;
      }
    }

    if (!sourceFlowKey || !sourceScreen) {
      return;
    }

    // Only allow dragging within the same flow
    const targetScreen = screensByFlow[sourceFlowKey].screens.find((s) => s.id === over.id);
    if (!targetScreen) {
      return; // Dragging outside the same flow is not allowed
    }

    // Get the current screens in the flow
    const flowScreens = [...screensByFlow[sourceFlowKey].screens];
    const oldIndex = flowScreens.findIndex((s) => s.id === active.id);
    const newIndex = flowScreens.findIndex((s) => s.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Optimistic UI update: reorder screens immediately
    const reorderedScreens = [...flowScreens];
    const [removed] = reorderedScreens.splice(oldIndex, 1);
    reorderedScreens.splice(newIndex, 0, removed);

    // Update state optimistically
    setScreensByFlowState((prev) => ({
      ...prev,
      [sourceFlowKey!]: {
        ...prev[sourceFlowKey!],
        screens: reorderedScreens
      }
    }));

    // Prepare the order array for the server action
    const reorderItems = reorderedScreens.map((screen, index) => ({
      id: screen.id,
      order: index
    }));

    // Call server action to persist the new order
    try {
      const result = await reorderScreens(reorderItems);
      if (!result.success) {
        // Revert on error
        setScreensByFlowState((prev) => ({
          ...prev,
          [sourceFlowKey!]: {
            ...prev[sourceFlowKey!],
            screens: flowScreens
          }
        }));
        console.error('Failed to reorder screens:', result.error);
        alert(`Failed to reorder screens: ${result.error}`);
      } else {
        // Refresh to get latest data
        router.refresh();
      }
    } catch (error) {
      // Revert on error
      setScreensByFlowState((prev) => ({
        ...prev,
        [sourceFlowKey!]: {
          ...prev[sourceFlowKey!],
          screens: flowScreens
        }
      }));
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Failed to reorder screens:', error);
      alert(`Failed to reorder screens: ${errorMessage}`);
    }
  };

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
      // Prepare screen data with the selected flow and version
      const screenData = screens.map((s) => ({
        title: s.title,
        description: s.description || undefined,
        imageUrl: s.imageUrl,
        flowId: selectedFlowId,
        appVersionId: selectedUploadVersionId || undefined
      }));

      const result = await createScreens(app.id, screenData);
      if (result.success) {
        // Reset form
        setScreens([]);
        setSelectedFlowId('');
        setSelectedUploadVersionId('');
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to create screens:', error);
      alert(error instanceof Error ? error.message : 'Failed to create screens');
    } finally {
      setIsSubmittingScreens(false);
    }
  };

  const handleCreateVersion = async (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();

    if (!newVersionName.trim()) {
      alert('Please enter a version name');
      return;
    }

    setIsCreatingVersion(true);

    try {
      const result = await createAppVersion(app.id, newVersionName.trim());
      if (result.success && result.data) {
        // Add the new version to the list
        setVersions((prev) => [
          {
            id: result.data!.id,
            name: result.data!.name,
            createdAt: result.data!.createdAt,
            _count: { screens: 0 }
          },
          ...prev
        ]);
        setNewVersionName('');
        router.refresh();
      } else {
        alert(result.error || 'Failed to create version');
      }
    } catch (error) {
      console.error('Failed to create version:', error);
      alert(error instanceof Error ? error.message : 'Failed to create version');
    } finally {
      setIsCreatingVersion(false);
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    if (!confirm('Are you sure you want to delete this version? This action cannot be undone.')) {
      return;
    }

    setIsDeletingVersion(versionId);

    try {
      const result = await deleteAppVersion(versionId);
      if (result.success) {
        // Remove version from list
        setVersions((prev) => prev.filter((v) => v.id !== versionId));
        router.refresh();
      } else {
        alert(result.error || 'Failed to delete version');
      }
    } catch (error) {
      console.error('Failed to delete version:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete version');
    } finally {
      setIsDeletingVersion(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full py-6">
      <Tabs defaultValue="app-info" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="app-info">App Info</TabsTrigger>
          <TabsTrigger value="screens">Screens Management</TabsTrigger>
        </TabsList>

        {/* Tab 1: App Info */}
        <TabsContent value="app-info" className="mt-0">
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
                  <Select
                    value={selectedCategoryId || '__none__'}
                    onValueChange={(val) => setSelectedCategoryId(val === '__none__' ? '' : val)}
                    disabled={isSubmitting}
                  >
                <SelectTrigger id="category-select">
                  <SelectValue placeholder="Select a category (optional)" />
                </SelectTrigger>
                <SelectContent>
                      <SelectItem value="__none__">No Category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

                <Separator />

                <div className="space-y-3">
                  <Label>Versions</Label>
                  <div className="space-y-3">
                    {/* Display existing versions */}
                    {versions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {versions.map((version) => (
                          <Badge
                            key={version.id}
                            variant="secondary"
                            className="flex items-center gap-1.5 px-2 py-1"
                          >
                            <span>{version.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({version._count.screens} screen{version._count.screens !== 1 ? 's' : ''})
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteVersion(version.id)}
                              disabled={isDeletingVersion === version.id || version._count.screens > 0}
                              className="ml-1 hover:bg-destructive/20 rounded-sm p-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                              title={
                                version._count.screens > 0
                                  ? 'Cannot delete version with screens'
                                  : 'Delete version'
                              }
                            >
                              <IconX className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No versions yet</p>
                    )}

                    {/* Create new version */}
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="e.g., v2.0, 2025 Update"
                        value={newVersionName}
                        onChange={(e) => setNewVersionName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !isCreatingVersion && !isSubmitting && newVersionName.trim()) {
                            e.preventDefault();
                            handleCreateVersion(e);
                          }
                        }}
                        disabled={isCreatingVersion || isSubmitting}
                        className="flex-1"
                        maxLength={50}
                      />
                      <Button
                        type="button"
                        onClick={handleCreateVersion}
                        disabled={isCreatingVersion || isSubmitting || !newVersionName.trim()}
                      >
                        {isCreatingVersion ? 'Adding...' : 'Add'}
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

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
        </TabsContent>

        {/* Tab 2: Screens Management */}
        <TabsContent value="screens" className="mt-0 space-y-6">
      {/* Screen Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Screens</CardTitle>
          <CardDescription>Upload screenshots and assign them to a flow</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Flow & Version Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Flow Selection */}
            <div className="space-y-2">
              <Label htmlFor="flow-select">Select Flow *</Label>
              <Select value={selectedFlowId} onValueChange={setSelectedFlowId} disabled={isSubmittingScreens}>
                <SelectTrigger id="flow-select">
                  <SelectValue placeholder="Select a flow" />
                </SelectTrigger>
                <SelectContent>
                  {flows.map((flow) => (
                    <SelectItem key={flow.id} value={flow.id}>
                      {flow.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Version Selection */}
            <div className="space-y-2">
              <Label htmlFor="version-select">Select Version (Optional)</Label>
              <Select 
                value={selectedUploadVersionId || '__none__'} 
                onValueChange={(val) => setSelectedUploadVersionId(val === '__none__' ? '' : val)} 
                disabled={isSubmittingScreens}
              >
                <SelectTrigger id="version-select">
                  <SelectValue placeholder="No version" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No Version</SelectItem>
                  {versions.map((version) => (
                    <SelectItem key={version.id} value={version.id}>
                      {version.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            All screens uploaded below will be assigned to the selected flow and version
          </p>

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
                setSelectedUploadVersionId('');
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Screens by Flow</CardTitle>
                <CardDescription>Existing screens organized by their assigned flow</CardDescription>
              </div>
              
              {/* Version Filter */}
              <div className="flex items-center gap-2">
                <Label htmlFor="version-filter" className="text-sm whitespace-nowrap">
                  Filter by Version:
                </Label>
                <Select value={selectedVersionFilter} onValueChange={setSelectedVersionFilter}>
                  <SelectTrigger id="version-filter" className="w-[180px]">
                    <SelectValue placeholder="Select version" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Versions ({existingScreens.length})</SelectItem>
                    <SelectItem value="__unassigned__" className="text-amber-600">
                      ⚠️ Unassigned ({unassignedCount})
                    </SelectItem>
                    {versions.map((version) => (
                      <SelectItem key={version.id} value={version.id}>
                        {version.name} ({version._count.screens})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.keys(filteredScreensByFlow).length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No screens match the selected filter.
              </p>
            ) : null}
            {Object.entries(filteredScreensByFlow).map(([flowKey, { flow, screens: flowScreens }]) => (
              <div key={flowKey} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{flow ? flow.name : 'No Flow'}</h3>
                  <Badge variant="secondary">
                    {flowScreens.length} screen{flowScreens.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext items={flowScreens.map((s) => s.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {flowScreens.map((screen) => (
                        <SortableScreenCard key={screen.id} screen={screen} flows={flows} versions={versions} />
                  ))}
                </div>
                      </SortableContext>
                    </DndContext>
                {Object.keys(filteredScreensByFlow).indexOf(flowKey) < Object.keys(filteredScreensByFlow).length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
