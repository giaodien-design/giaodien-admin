'use client';

import { useState, useEffect } from 'react';
import { getAllFlows, createFlow, updateFlow, updateFlowSortOrder, toggleFlowRecommendation } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { IconPlus, IconEdit, IconStarFilled } from '@tabler/icons-react';
import { Skeleton } from '@/components/ui/skeleton';
import { FlowForm } from '@/components/flow-form';
import { RecommendationToggle } from '@/components/recommendation-toggle';

export default function FlowsManagementPage() {
  const [flows, setFlows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingFlow, setEditingFlow] = useState<any | null>(null);
  const [editingSortOrder, setEditingSortOrder] = useState<string | null>(null);
  const [sortOrderValues, setSortOrderValues] = useState<Record<string, number>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const flowsResult = await getAllFlows();

      if (flowsResult.success && flowsResult.data) {
        setFlows(flowsResult.data);
        // Initialize sortOrder values
        const initialSortOrders: Record<string, number> = {};
        flowsResult.data.forEach((flow: any) => {
          initialSortOrders[flow.id] = flow.sortOrder ?? 0;
        });
        setSortOrderValues(initialSortOrders);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFlow = async (data: { name: string; description: string; sortOrder: number }) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set('name', data.name);
      if (data.description) {
        formData.set('description', data.description);
      }
      formData.set('sortOrder', data.sortOrder.toString());

      const result = await createFlow(formData);
      if (result.success) {
        setIsCreateDialogOpen(false);
        await loadData();
      }
    } catch (error) {
      console.error('Failed to create flow:', error);
      alert(error instanceof Error ? error.message : 'Failed to create flow');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditFlow = async (data: { name: string; description: string; sortOrder: number }) => {
    if (!editingFlow) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set('name', data.name);
      if (data.description) {
        formData.set('description', data.description);
      }
      formData.set('sortOrder', data.sortOrder.toString());

      const result = await updateFlow(editingFlow.id, formData);
      if (result.success) {
        setIsEditDialogOpen(false);
        setEditingFlow(null);
        await loadData();
      }
    } catch (error) {
      console.error('Failed to update flow:', error);
      alert(error instanceof Error ? error.message : 'Failed to update flow');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (flow: any) => {
    setEditingFlow(flow);
    setIsEditDialogOpen(true);
  };

  const handleSortOrderChange = async (flowId: string, newSortOrder: number) => {
    setSortOrderValues((prev) => ({
      ...prev,
      [flowId]: newSortOrder
    }));

    const result = await updateFlowSortOrder(flowId, newSortOrder);
    if (!result.success) {
      // Revert on error
      await loadData();
      alert('Failed to update sort order');
    }
  };

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-between py-4">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full mb-4" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-20" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between py-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Flows</h1>
          <p className="text-muted-foreground">Manage flows across all your applications</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className="mr-2 h-4 w-4" />
              Create New Flow
            </Button>
          </DialogTrigger>
          <FlowForm
            flow={null}
            isOpen={isCreateDialogOpen}
            onClose={() => setIsCreateDialogOpen(false)}
            onSubmit={handleCreateFlow}
            isSubmitting={isSubmitting}
          />
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <FlowForm
            flow={editingFlow}
            isOpen={isEditDialogOpen}
            onClose={() => {
              setIsEditDialogOpen(false);
              setEditingFlow(null);
            }}
            onSubmit={handleEditFlow}
            isSubmitting={isSubmitting}
          />
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {flows && flows.length > 0 ? (
          flows.map((flow) => (
            <Card key={flow.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="flex items-center gap-2 flex-wrap">
                      <span className="truncate">{flow.name}</span>
                      <Badge variant="secondary">Sort: {sortOrderValues[flow.id] ?? 0}</Badge>
                      {flow.isRecommended && (
                        <IconStarFilled className="h-4 w-4 text-yellow-500" />
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1.5">Global Flow Category</CardDescription>
                  </div>
                  <RecommendationToggle
                    id={flow.id}
                    isRecommended={flow.isRecommended ?? false}
                    onToggle={toggleFlowRecommendation}
                    label={`Toggle recommendation for ${flow.name}`}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {flow.description || 'No description provided'}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {flow.screens.length} screen
                    {flow.screens.length !== 1 ? 's' : ''}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(flow)}>
                      <IconEdit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    {editingSortOrder === flow.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={sortOrderValues[flow.id] ?? 0}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            setSortOrderValues((prev) => ({
                              ...prev,
                              [flow.id]: value
                            }));
                          }}
                          onBlur={() => {
                            handleSortOrderChange(flow.id, sortOrderValues[flow.id] ?? 0);
                            setEditingSortOrder(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSortOrderChange(flow.id, sortOrderValues[flow.id] ?? 0);
                              setEditingSortOrder(null);
                            } else if (e.key === 'Escape') {
                              setEditingSortOrder(null);
                              loadData();
                            }
                          }}
                          className="w-20 h-8"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => setEditingSortOrder(flow.id)}>
                        <IconEdit className="h-3 w-3 mr-1" />
                        Edit Sort
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground mb-4">No flows found. Create your first flow to get started.</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
