"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createScreens, getAllFlows, getAppById } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  MultiImageUpload,
  type ScreenUpload,
} from "@/components/multi-image-upload";

export default function AddScreensPage() {
  const params = useParams();
  const appId = params.id as string;
  const router = useRouter();
  const [appName, setAppName] = useState<string>("");
  const [flows, setFlows] = useState<Array<{ id: string; name: string }>>([]);
  const [screens, setScreens] = useState<ScreenUpload[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!appId) return;

      const [appResult, flowsResult] = await Promise.all([
        getAppById(appId),
        getAllFlows(),
      ]);

      if (appResult.success && appResult.data) {
        setAppName(appResult.data.name);
      }

      if (flowsResult.success && flowsResult.data) {
        setFlows(flowsResult.data.map((f) => ({ id: f.id, name: f.name })));
      }

      setIsLoading(false);
    }
    loadData();
  }, [appId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appId) return;

    setIsSubmitting(true);

    try {
      // Validate screens are uploaded
      const unuploadedScreens = screens.filter((s) => !s.imageUrl);
      if (unuploadedScreens.length > 0) {
        alert(
          `Please upload all screens to S3 first. ${unuploadedScreens.length} screen(s) pending.`
        );
        setIsSubmitting(false);
        return;
      }

      if (screens.length === 0) {
        alert("Please add at least one screen");
        setIsSubmitting(false);
        return;
      }

      // Prepare screen data
      const screenData = screens.map((s) => ({
        title: s.title,
        description: s.description || undefined,
        imageUrl: s.imageUrl,
        flowId: s.flowId || undefined,
      }));

      const result = await createScreens(appId, screenData);
      if (result.success) {
        router.push(`/apps/${appId}`);
      }
    } catch (error) {
      console.error("Failed to create screens:", error);
      alert(error instanceof Error ? error.message : "Failed to create screens");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto w-full py-6">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full py-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Screens to {appName}</CardTitle>
          <CardDescription>
            Upload screenshots and assign them to flows (optional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Screen Images</h3>
                <p className="text-sm text-muted-foreground">
                  Upload screenshots and select which flow they belong to
                </p>
              </div>
              <MultiImageUpload
                onScreensChange={setScreens}
                maxFiles={20}
                flows={flows}
              />
            </div>

            <Separator />

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/apps/${appId}`)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || screens.length === 0}>
                {isSubmitting ? "Adding Screens..." : "Add Screens"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

