"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getAppById, getAllFlows } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function CreateFlowsPage() {
  const params = useParams();
  const appId = params.id as string;
  const router = useRouter();

  useEffect(() => {
    // Redirect to app detail page since flows are now global
    // Users should manage flows from the /flows page
    router.push(`/apps/${appId}`);
  }, [appId, router]);

  return (
    <div className="max-w-2xl mx-auto w-full py-6">
      <Card>
        <CardHeader>
          <CardTitle>Redirecting...</CardTitle>
          <CardDescription>
            Flows are now managed globally. Redirecting to app page.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto w-full py-6">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto w-full py-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Flows for {appName}</CardTitle>
          <CardDescription>
            Flows help organize screens into logical groups (e.g., "Onboarding Flow", "Checkout Flow"). You can skip this and add flows later.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add Flow Form */}
          <form onSubmit={handleAddFlow} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="flowName">Flow Name *</Label>
              <Input
                id="flowName"
                value={newFlowName}
                onChange={(e) => setNewFlowName(e.target.value)}
                placeholder="e.g., Onboarding Flow, Checkout Flow"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="flowDescription">Description</Label>
              <textarea
                id="flowDescription"
                value={newFlowDescription}
                onChange={(e) => setNewFlowDescription(e.target.value)}
                placeholder="Brief description of this flow..."
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <Button type="submit" disabled={isSubmitting || !newFlowName.trim()}>
              <IconPlus className="mr-2 h-4 w-4" />
              {isSubmitting ? "Adding..." : "Add Flow"}
            </Button>
          </form>

          <Separator />

          {/* Existing Flows */}
          {flows.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Existing Flows</h3>
              <div className="space-y-2">
                {flows.map((flow) => (
                  <div
                    key={flow.id}
                    className="flex items-start justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{flow.name}</p>
                      {flow.description && (
                        <p className="text-sm text-muted-foreground">
                          {flow.description}
                        </p>
                      )}
                    </div>
                    <IconCheck className="h-5 w-5 text-green-600" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Continue Button */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/apps")}
            >
              Skip for Now
            </Button>
            <Button type="button" onClick={handleContinue}>
              Continue to App
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

