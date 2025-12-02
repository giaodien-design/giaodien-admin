"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FlowFormProps {
  flow?: {
    id: string;
    name: string;
    description?: string | null;
    sortOrder: number;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description: string; sortOrder: number }) => Promise<void>;
  isSubmitting: boolean;
}

export function FlowForm({
  flow,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: FlowFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState<number>(0);

  const isEditMode = !!flow;

  // Reset form when dialog opens/closes or flow changes
  useEffect(() => {
    if (isOpen) {
      if (flow) {
        setName(flow.name || "");
        setDescription(flow.description || "");
        setSortOrder(flow.sortOrder ?? 0);
      } else {
        setName("");
        setDescription("");
        setSortOrder(0);
      }
    }
  }, [isOpen, flow]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await onSubmit({
      name: name.trim(),
      description: description.trim(),
      sortOrder,
    });
  };

  return (
    <DialogContent>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Flow" : "Create New Flow"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the flow details below"
              : "Create a new global flow category (e.g., Onboarding, Login, Checkout)"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="flowName">Flow Name *</Label>
            <Input
              id="flowName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Onboarding, Login, Checkout"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="flowDescription">Description</Label>
            <textarea
              id="flowDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this flow..."
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="flowSortOrder">Sort Order</Label>
            <Input
              id="flowSortOrder"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
              placeholder="0"
              min="0"
            />
            <p className="text-xs text-muted-foreground">
              Lower numbers appear first in the flows grid
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !name.trim()}>
            {isSubmitting
              ? isEditMode
                ? "Saving..."
                : "Creating..."
              : isEditMode
                ? "Save Changes"
                : "Create Flow"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

