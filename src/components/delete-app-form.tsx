"use client";

import { deleteApp } from "@/lib/actions";
import { Button } from "@/components/ui/button";

export function DeleteAppForm({
  appId,
  appName,
}: {
  appId: string;
  appName: string;
}) {
  return (
    <form action={deleteApp}>
      <input type="hidden" name="appId" value={appId} />
      <Button
        type="submit"
        variant="destructive"
        onClick={(e) => {
          if (
            !confirm(
              `Are you sure you want to delete "${appName}"? This action cannot be undone.`
            )
          ) {
            e.preventDefault();
          }
        }}
      >
        Delete App
      </Button>
    </form>
  );
}

