'use client';

import { useState, useEffect } from 'react';
import { getAllUIElements, createUIElement, updateUIElement, deleteUIElement, toggleUiElementRecommendation } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { IconPlus, IconEdit, IconTrash, IconStarFilled } from '@tabler/icons-react';
import { Skeleton } from '@/components/ui/skeleton';
import { RecommendationToggle } from '@/components/recommendation-toggle';

interface UIElement {
  id: string;
  name: string;
  slug: string;
  isRecommended?: boolean;
  screens?: { id: string }[];
}

export default function UIElementsManagementPage() {
  const [uiElements, setUIElements] = useState<UIElement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UIElement | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const result = await getAllUIElements();
      if (result.success && result.data) {
        setUIElements(result.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set('name', name.trim());
      formData.set('slug', slug.trim() || name.trim().toLowerCase().replace(/\s+/g, '-'));

      const result = await createUIElement(formData);
      if (result.success) {
        setIsDialogOpen(false);
        resetForm();
        await loadData();
      } else {
        alert(result.error || 'Failed to create UI element');
      }
    } catch (error) {
      console.error('Failed to create UI element:', error);
      alert(error instanceof Error ? error.message : 'Failed to create UI element');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !name.trim()) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set('name', name.trim());
      formData.set('slug', slug.trim() || name.trim().toLowerCase().replace(/\s+/g, '-'));

      const result = await updateUIElement(editingItem.id, formData);
      if (result.success) {
        setIsDialogOpen(false);
        setEditingItem(null);
        resetForm();
        await loadData();
      } else {
        alert(result.error || 'Failed to update UI element');
      }
    } catch (error) {
      console.error('Failed to update UI element:', error);
      alert(error instanceof Error ? error.message : 'Failed to update UI element');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this UI element? It will be removed from all screens using it.')) {
      return;
    }

    try {
      const result = await deleteUIElement(id);
      if (result.success) {
        await loadData();
      } else {
        alert(result.error || 'Failed to delete UI element');
      }
    } catch (error) {
      console.error('Failed to delete UI element:', error);
      alert('Failed to delete UI element');
    }
  };

  const openEditDialog = (item: UIElement) => {
    setEditingItem(item);
    setName(item.name);
    setSlug(item.slug);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingItem(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setName('');
    setSlug('');
  };

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value);
    if (!editingItem) {
      setSlug(value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    }
  };

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-between py-4">
          <div>
            <Skeleton className="h-8 w-40 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <IconStarFilled className="h-4 w-4 text-yellow-500" />
                    <span>Recommended</span>
                  </div>
                </TableHead>
                <TableHead>Screens Count</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3].map((i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-5 w-9 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between py-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">UI Elements</h1>
          <p className="text-muted-foreground">Manage UI elements for tagging screens (e.g., Button, Modal, Tab Bar)</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <IconPlus className="mr-2 h-4 w-4" />
              Create New UI Element
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={editingItem ? handleEdit : handleCreate}>
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Edit UI Element' : 'Create New UI Element'}</DialogTitle>
                <DialogDescription>
                  {editingItem ? 'Update the UI element details' : 'Create a new UI element for tagging screens'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g., Button, Modal, Tab Bar"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
                    placeholder="e.g., button, modal, tab-bar"
                    required
                  />
                  <p className="text-xs text-muted-foreground">URL-friendly identifier (lowercase, hyphens only)</p>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !name.trim()}>
                  {isSubmitting
                    ? editingItem ? 'Updating...' : 'Creating...'
                    : editingItem ? 'Update UI Element' : 'Create UI Element'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <IconStarFilled className="h-4 w-4 text-yellow-500" />
                  <span>Recommended</span>
                </div>
              </TableHead>
              <TableHead>Screens Count</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {uiElements && uiElements.length > 0 ? (
              uiElements.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.slug}</Badge>
                  </TableCell>
                  <TableCell>
                    <RecommendationToggle
                      id={item.id}
                      isRecommended={item.isRecommended ?? false}
                      onToggle={toggleUiElementRecommendation}
                      label={`Toggle recommendation for ${item.name}`}
                    />
                  </TableCell>
                  <TableCell>{item.screens?.length || 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(item)}>
                        <IconEdit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                        <IconTrash className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No UI elements found. Create your first UI element to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}


