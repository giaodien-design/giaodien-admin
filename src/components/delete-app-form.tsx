'use client';

import { deleteApp } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function DeleteAppForm({ appId, appName }: { appId: string; appName: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${appName}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);

    try {
      const formData = new FormData();
      formData.append('appId', appId);
      await deleteApp(formData);
    } catch (error) {
      console.error('Failed to delete app:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete app');
      setIsDeleting(false);
    }
  };

  return (
    <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
      {isDeleting ? 'Deleting...' : 'Delete App'}
    </Button>
  );
}
