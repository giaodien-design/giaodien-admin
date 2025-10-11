import { createApp } from "@/lib/actions";
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

export default function CreateAppPage() {
  return (
    <div className="max-w-2xl mx-auto w-full py-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New App</CardTitle>
          <CardDescription>
            Add a new application to your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createApp} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">App Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Instagram, Facebook"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                name="slug"
                placeholder="e.g., instagram, facebook"
                required
              />
              <p className="text-sm text-muted-foreground">
                URL-friendly identifier (lowercase, no spaces)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                placeholder="Brief description of the app..."
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="platform">Platform *</Label>
              <Select name="platform" defaultValue="IOS">
                <SelectTrigger id="platform">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IOS">iOS</SelectItem>
                  <SelectItem value="ANDROID">Android</SelectItem>
                  <SelectItem value="WEB">Web</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                name="category"
                placeholder="e.g., Social Media, Productivity"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Website URL</Label>
              <Input
                id="websiteUrl"
                name="websiteUrl"
                type="url"
                placeholder="https://example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="iconUrl">Icon URL</Label>
              <Input
                id="iconUrl"
                name="iconUrl"
                type="url"
                placeholder="https://example.com/icon.png"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" asChild>
                <a href="/apps">Cancel</a>
              </Button>
              <Button type="submit">Create App</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
