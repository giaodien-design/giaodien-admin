"use client";

import { useState } from "react";
import { createApp, createAppWithScreens } from "@/lib/actions";
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      // Add the icon URL from state
      if (iconUrl) {
        formData.set("icon", iconUrl);
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

      // Prepare screen data
      const screenData = screens.map((s) => ({
        title: s.title,
        description: s.description || undefined,
        imageUrl: s.imageUrl,
      }));

      // Create app with screens
      if (screens.length > 0) {
        const result = await createAppWithScreens(formData, screenData);
        if (result.success) {
          window.location.href = "/apps";
        }
      } else {
        // Create app without screens (uses redirect)
        await createApp(formData);
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
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                name="category"
                placeholder="e.g., Social Media, Productivity"
              />
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
              <div className="flex gap-2">
                <Input
                  id="brandColor"
                  name="brandColor"
                  type="color"
                  className="w-20 h-10 p-1"
                />
                <Input
                  type="text"
                  name="brandColorText"
                  placeholder="#000000"
                  className="flex-1"
                  onChange={(e) => {
                    const colorInput = document.getElementById(
                      "brandColor"
                    ) as HTMLInputElement;
                    if (
                      colorInput &&
                      /^#[0-9A-Fa-f]{6}$/.test(e.target.value)
                    ) {
                      colorInput.value = e.target.value;
                    }
                  }}
                />
              </div>
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Screen Images</h3>
                <p className="text-sm text-muted-foreground">
                  Upload screenshots of your app (optional)
                </p>
              </div>
              <MultiImageUpload onScreensChange={setScreens} maxFiles={20} />
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
