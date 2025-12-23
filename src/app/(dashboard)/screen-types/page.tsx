'use client';

import { useState, useEffect } from 'react';
import { getAllScreenTypes, createScreenType, updateScreenType, deleteScreenType, toggleScreenTypeRecommendation } from '@/lib/actions';
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

interface ScreenType {
  id: string;
  name: string;
  slug: string;
  isRecommended?: boolean;
  screens?: { id: string }[];
}

export default function ScreenTypesManagementPage() {
  const [screenTypes, setScreenTypes] = useState<ScreenType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScreenType | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const result = await getAllScreenTypes();
      if (result.success && result.data) {
        setScreenTypes(result.data);
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

      const result = await createScreenType(formData);
      if (result.success) {
        setIsDialogOpen(false);
        resetForm();
        await loadData();
      } else {
        alert(result.error || 'Failed to create screen type');
      }
    } catch (error) {
      console.error('Failed to create screen type:', error);
      alert(error instanceof Error ? error.message : 'Failed to create screen type');
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

      const result = await updateScreenType(editingItem.id, formData);
      if (result.success) {
        setIsDialogOpen(false);
        setEditingItem(null);
        resetForm();
        await loadData();
      } else {
        alert(result.error || 'Failed to update screen type');
      }
    } catch (error) {
      console.error('Failed to update screen type:', error);
      alert(error instanceof Error ? error.message : 'Failed to update screen type');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this screen type? Screens using this type will have their type unset.')) {
      return;
    }

    try {
      const result = await deleteScreenType(id);
      if (result.success) {
        await loadData();
      } else {
        alert(result.error || 'Failed to delete screen type');
      }
    } catch (error) {
      console.error('Failed to delete screen type:', error);
      alert('Failed to delete screen type');
    }
  };

  const openEditDialog = (item: ScreenType) => {
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
          <h1 className="text-3xl font-bold tracking-tight">Screen Types</h1>
          <p className="text-muted-foreground">Manage screen types for categorizing screens (e.g., Login, Home, Profile)</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <IconPlus className="mr-2 h-4 w-4" />
              Create New Screen Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={editingItem ? handleEdit : handleCreate}>
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Edit Screen Type' : 'Create New Screen Type'}</DialogTitle>
                <DialogDescription>
                  {editingItem ? 'Update the screen type details' : 'Create a new screen type for categorizing screens'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g., Login, Home, Profile"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
                    placeholder="e.g., login, home, profile"
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
                    : editingItem ? 'Update Screen Type' : 'Create Screen Type'}
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
            {screenTypes && screenTypes.length > 0 ? (
              screenTypes.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.slug}</Badge>
                  </TableCell>
                  <TableCell>
                    <RecommendationToggle
                      id={item.id}
                      isRecommended={item.isRecommended ?? false}
                      onToggle={toggleScreenTypeRecommendation}
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
                  No screen types found. Create your first screen type to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}


