import { Suspense } from "react";
import { getAppById, updateApp, getAllFlows, createScreens, getScreensByAppId } from "@/lib/actions";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteAppForm } from "@/components/delete-app-form";
import { notFound } from "next/navigation";
import { EditAppFormClient } from "./edit-form-client";

// Revalidate every 60 seconds
export const revalidate = 60;

async function EditAppForm({ id }: { id: string }) {
  const [appResult, flowsResult, screensResult] = await Promise.all([
    getAppById(id),
    getAllFlows(),
    getScreensByAppId(id),
  ]);

  if (!appResult.success || !appResult.data) {
    notFound();
  }

  const app = appResult.data;
  const flows = flowsResult.success ? flowsResult.data : [];
  const screens = screensResult.success ? screensResult.data : [];

  return (
    <EditAppFormClient
      app={app}
      flows={flows.map((f) => ({ id: f.id, name: f.name }))}
      existingScreens={screens}
    />
  );
}

function EditAppSkeleton() {
  return (
    <div className="max-w-4xl mx-auto w-full py-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-32 mb-2" />
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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
