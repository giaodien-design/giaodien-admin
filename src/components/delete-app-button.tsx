'use client';

import { deleteApp } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { IconTrash } from '@tabler/icons-react';

export function DeleteAppButton({ appId, appName }: { appId: string; appName: string }) {
  const handleDelete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!confirm(`Are you sure you want to delete "${appName}"? This action cannot be undone.`)) {
      return;
    }

    const formData = new FormData();
    formData.append('appId', appId);
    await deleteApp(formData);
  };

  return (
    <form onSubmit={handleDelete}>
      <input type="hidden" name="appId" value={appId} />
      <Button type="submit" variant="ghost" size="sm">
        <IconTrash className="h-4 w-4" />
      </Button>
    </form>
  );
}
