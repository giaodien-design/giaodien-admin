"use client";

import { useState, useEffect } from "react";
import { createApp, createAppWithScreens, getAllFlows, getAllCategories } from "@/lib/actions";
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
import { ImageUpload } from "@/components/image-upload";
import {
  MultiImageUpload,
  type ScreenUpload,
} from "@/components/multi-image-upload";
import { Separator } from "@/components/ui/separator";

export default function CreateAppPage() {
  const [iconUrl, setIconUrl] = useState("");
  const [screens, setScreens] = useState<ScreenUpload[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [flows, setFlows] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedFlowId, setSelectedFlowId] = useState<string>("");
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  useEffect(() => {
    async function loadData() {
      const [flowsResult, categoriesResult] = await Promise.all([
        getAllFlows(),
        getAllCategories(),
      ]);
      if (flowsResult.success && flowsResult.data) {
        setFlows(flowsResult.data.map((f) => ({ id: f.id, name: f.name })));
      }
      if (categoriesResult.success && categoriesResult.data) {
        setCategories(categoriesResult.data.map((c) => ({ id: c.id, name: c.name })));
      }
    }
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      // Add the icon URL from state
      if (iconUrl) {
        formData.set("icon", iconUrl);
      }
      // Add the category ID from state
      if (selectedCategoryId) {
        formData.set("categoryId", selectedCategoryId);
      }

      // Validate screens are uploaded
      const unuploadedScreens = screens.filter((s) => !s.imageUrl);
      if (unuploadedScreens.length > 0) {
        alert(
          `Please upload all screens to S3 first. ${unuploadedScreens.length} screen(s) pending.`
        );
        setIsSubmitting(false);
        return;
      }

      // Prepare screen data - use selected flow for all screens if provided
      const screenData = screens.map((s) => ({
        title: s.title,
        description: s.description || undefined,
        imageUrl: s.imageUrl,
        flowId: selectedFlowId || undefined, // Use selected flow for all screens, or undefined if none selected
      }));

      // Create app with screens
      if (screens.length > 0) {
        const result = await createAppWithScreens(formData, screenData);
        if (result.success) {
          window.location.href = `/apps/${result.appId}`;
        }
      } else {
        // Create app without screens
        await createApp(formData);
        window.location.href = "/apps";
      }
    } catch (error) {
      console.error("Failed to create app:", error);
      alert(error instanceof Error ? error.message : "Failed to create app");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full py-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New App</CardTitle>
          <CardDescription>
            Add a new application to your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>App Icon</Label>
              <ImageUpload
                onUploadComplete={setIconUrl}
                label="Upload App Icon"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">App Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Instagram, Facebook"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                name="slug"
                placeholder="e.g., instagram, facebook"
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
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="platform">Platform *</Label>
              <Select name="platform" defaultValue="IOS">
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
                value={selectedCategoryId}
                onValueChange={setSelectedCategoryId}
                disabled={isSubmitting}
              >
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brandColor">Brand Color</Label>
              <Input
                id="brandColor"
                name="brandColor"
                type="text"
                placeholder="#FF5733"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
              <p className="text-sm text-muted-foreground">
                Hex color code (e.g., #FF5733)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
              <Input
                id="thumbnailUrl"
                name="thumbnailUrl"
                type="url"
                placeholder="https://example.com/thumbnail.png"
              />
              <p className="text-sm text-muted-foreground">
                Cover image for the App Card
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                placeholder="0"
                defaultValue="0"
                min="0"
              />
              <p className="text-sm text-muted-foreground">
                Controls the app's position on the homepage (lower numbers appear first)
              </p>
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Screen Images</h3>
                <p className="text-sm text-muted-foreground">
                  Upload screenshots and assign them to a flow (optional)
                </p>
              </div>

              {/* Flow Selection */}
              {flows.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="flow-select">Select Flow (Optional)</Label>
                  <Select
                    value={selectedFlowId}
                    onValueChange={setSelectedFlowId}
                    disabled={isSubmitting}
                  >
                  <SelectTrigger id="flow-select">
                    <SelectValue placeholder="Select a flow to assign all screens to (optional)" />
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
              )}

              <MultiImageUpload
                onScreensChange={setScreens}
                maxFiles={20}
                flows={[]} // Don't show individual flow selection since we're using the dropdown above
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                asChild
                disabled={isSubmitting}
              >
                <a href="/apps">Cancel</a>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create App"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
