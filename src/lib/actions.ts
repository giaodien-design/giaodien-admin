'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// Zod schemas for XSS protection
const createAppSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim()
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Name can only contain letters, numbers, spaces, hyphens and underscores'),

  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(50, 'Slug must be less than 50 characters')
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers and hyphens'),

  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .trim()
    .optional()
    .nullable()
    .transform((val) => {
      if (!val) return null;
      // Strip any HTML tags
      return val.replace(/<[^>]*>/g, '');
    }),

  platform: z.enum(['IOS', 'ANDROID', 'WEB'], {
    message: 'Platform must be IOS, ANDROID, or WEB'
  }),

  icon: z.string().url('Icon must be a valid URL').max(500, 'Icon URL too long').optional().nullable(),

  category: z.string().max(100, 'Category must be less than 100 characters').trim().optional().nullable(),

  categoryId: z.string().cuid('Invalid category ID format').optional().nullable(),

  brandColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Brand color must be a valid hex color (e.g., #FF5733)')
    .optional()
    .nullable(),

  websiteUrl: z.string().url('Must be a valid URL').max(200, 'URL too long').optional().nullable(),

  thumbnailUrl: z
    .string()
    .url('Thumbnail must be a valid URL')
    .max(500, 'Thumbnail URL too long')
    .optional()
    .nullable(),

  sortOrder: z.number().int().default(0).optional()
});

// Example: Get all apps (cached for 60 seconds)
export async function getApps() {
  try {
    const apps = await prisma.app.findMany({
      where: { isPublished: true },
      include: {
        screens: {
          select: {
            id: true
          }
        }
      },
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }]
    });
    return { success: true, data: apps };
  } catch (error) {
    console.error('Failed to fetch apps:', error);
    return { success: false, error: 'Failed to fetch apps' };
  }
}

// Flow validation schema
const createFlowSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim()
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Name can only contain letters, numbers, spaces, hyphens and underscores'),

  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .trim()
    .optional()
    .nullable()
    .transform((val) => {
      if (!val) return null;
      return val.replace(/<[^>]*>/g, '');
    }),

  sortOrder: z.number().int().default(0).optional()
});

// Example: Create new app with XSS protection
export async function createApp(formData: FormData) {
  let appId: string;

  try {
    // 🛡️ Validate and sanitize input
    const sortOrderValue = formData.get('sortOrder');
    const categoryIdValue = formData.get('categoryId');
    const validated = createAppSchema.parse({
      name: formData.get('name'),
      slug: formData.get('slug'),
      description: formData.get('description'),
      platform: formData.get('platform'),
      icon: formData.get('icon') || null,
      category: formData.get('category') || null, // Keep for legacy support
      categoryId: categoryIdValue || null,
      brandColor: formData.get('brandColor') || null,
      websiteUrl: formData.get('websiteUrl') || null,
      thumbnailUrl: formData.get('thumbnailUrl') || null,
      sortOrder: sortOrderValue ? parseInt(sortOrderValue as string) || 0 : 0
    });

    // Safe to use validated data
    const app = await prisma.app.create({
      data: {
        name: validated.name,
        slug: validated.slug,
        description: validated.description,
        platform: validated.platform,
        icon: validated.icon,
        legacyCategory: validated.category, // Store in legacy field
        categoryId: validated.categoryId,
        brandColor: validated.brandColor,
        websiteUrl: validated.websiteUrl,
        thumbnailUrl: validated.thumbnailUrl,
        sortOrder: validated.sortOrder
      }
    });

    appId = app.id;
    revalidatePath('/apps');
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Return validation errors to user
      console.error('Validation error:', error.issues);
      throw new Error(error.issues.map((e: z.ZodIssue) => e.message).join(', '));
    }
    console.error('Failed to create app:', error);
    throw new Error('Failed to create app');
  }

  // Redirect to app detail page
  redirect(`/apps/${appId}`);
}

// Create app with screens (no redirect, returns app ID)
export async function createAppWithScreens(
  formData: FormData,
  screens: Array<{
    title: string;
    description?: string;
    imageUrl: string;
    flowId?: string;
    appVersionId?: string;
  }>
) {
  try {
    // Validate and sanitize input
    const sortOrderValue = formData.get('sortOrder');
    const categoryIdValue = formData.get('categoryId');
    const validated = createAppSchema.parse({
      name: formData.get('name'),
      slug: formData.get('slug'),
      description: formData.get('description'),
      platform: formData.get('platform'),
      icon: formData.get('icon') || null,
      category: formData.get('category') || null, // Keep for legacy support
      categoryId: categoryIdValue || null,
      brandColor: formData.get('brandColor') || null,
      websiteUrl: formData.get('websiteUrl') || null,
      thumbnailUrl: formData.get('thumbnailUrl') || null,
      sortOrder: sortOrderValue ? parseInt(sortOrderValue as string) || 0 : 0
    });

    // Validate appVersionId if provided (it's a UUID)
    const appVersionIdSchema = z.string().uuid('Invalid app version ID format').optional().nullable();

    // Validate screens
    const validatedScreens = screens.map((screen) => {
      const baseScreen = createScreenSchema.parse(screen);
      const validatedAppVersionId = screen.appVersionId 
        ? appVersionIdSchema.parse(screen.appVersionId) 
        : null;
      return {
        ...baseScreen,
        flowId: screen.flowId || null,
        appVersionId: validatedAppVersionId
      };
    });

    // Create app and screens in a transaction
    const app = await prisma.app.create({
      data: {
        name: validated.name,
        slug: validated.slug,
        description: validated.description,
        platform: validated.platform,
        icon: validated.icon,
        legacyCategory: validated.category, // Store in legacy field
        categoryId: validated.categoryId,
        brandColor: validated.brandColor,
        websiteUrl: validated.websiteUrl,
        thumbnailUrl: validated.thumbnailUrl,
        sortOrder: validated.sortOrder,
        screens: {
          create: validatedScreens
        }
      }
    });

    revalidatePath('/apps');
    revalidatePath(`/apps/${app.id}`);
    revalidatePath(`/apps/${app.id}/edit`);

    return { success: true, appId: app.id };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues);
      throw new Error(error.issues.map((e: z.ZodIssue) => e.message).join(', '));
    }
    console.error('Failed to create app with screens:', error);
    throw new Error('Failed to create app with screens');
  }
}

// Example: Increment screen view count with validation
export async function incrementScreenView(screenId: string) {
  try {
    // Validate ID format (cuid)
    const idSchema = z.string().cuid('Invalid screen ID format');
    const validatedId = idSchema.parse(screenId);

    await prisma.screen.update({
      where: { id: validatedId },
      data: { viewCount: { increment: 1 } }
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Invalid ID:', error.issues);
      return { success: false, error: 'Invalid screen ID' };
    }
    console.error('Failed to increment view:', error);
    return { success: false, error: 'Failed to increment view' };
  }
}

// Get single app by ID (optimized query)
export async function getAppById(appId: string) {
  try {
    const idSchema = z.string().cuid('Invalid app ID format');
    const validatedId = idSchema.parse(appId);

    const app = await prisma.app.findUnique({
      where: { id: validatedId },
      include: {
        screens: {
          select: {
            id: true,
            title: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    if (!app) {
      return { success: false, error: 'App not found' };
    }

    return { success: true, data: app };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Invalid ID:', error.issues);
      return { success: false, error: 'Invalid app ID' };
    }
    console.error('Failed to fetch app:', error);
    return { success: false, error: 'Failed to fetch app' };
  }
}

// Update app with XSS protection
export async function updateApp(appId: string, formData: FormData) {
  try {
    // Validate ID format
    const idSchema = z.string().cuid('Invalid app ID format');
    const validatedId = idSchema.parse(appId);

    // Validate and sanitize input
    const sortOrderValue = formData.get('sortOrder');
    const categoryIdValue = formData.get('categoryId');
    const validated = createAppSchema.parse({
      name: formData.get('name'),
      slug: formData.get('slug'),
      description: formData.get('description'),
      platform: formData.get('platform'),
      icon: formData.get('icon') || null,
      category: formData.get('category') || null, // Keep for legacy support
      categoryId: categoryIdValue || null,
      brandColor: formData.get('brandColor') || null,
      websiteUrl: formData.get('websiteUrl') || null,
      thumbnailUrl: formData.get('thumbnailUrl') || null,
      sortOrder: sortOrderValue ? parseInt(sortOrderValue as string) || 0 : 0
    });

    await prisma.app.update({
      where: { id: validatedId },
      data: {
        name: validated.name,
        slug: validated.slug,
        description: validated.description,
        platform: validated.platform,
        icon: validated.icon,
        legacyCategory: validated.category, // Store in legacy field
        categoryId: validated.categoryId,
        brandColor: validated.brandColor,
        websiteUrl: validated.websiteUrl,
        thumbnailUrl: validated.thumbnailUrl,
        sortOrder: validated.sortOrder
      }
    });

    revalidatePath('/apps');
    revalidatePath(`/apps/${validatedId}/edit`);
    revalidatePath(`/apps/${validatedId}`);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues);
      throw new Error(error.issues.map((e: z.ZodIssue) => e.message).join(', '));
    }
    console.error('Failed to update app:', error);
    throw new Error('Failed to update app');
  }

  redirect(`/apps/${appId}`);
}

// Delete app with validation
export async function deleteApp(formData: FormData) {
  const appId = formData.get('appId') as string;

  try {
    // Validate ID format
    const idSchema = z.string().cuid('Invalid app ID format');
    const validatedId = idSchema.parse(appId);

    await prisma.app.delete({
      where: { id: validatedId }
    });

    revalidatePath('/apps');
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Invalid ID:', error.issues);
      throw new Error('Invalid app ID');
    }
    console.error('Failed to delete app:', error);
    throw new Error('Failed to delete app');
  }

  redirect('/apps');
}

// App Version management
const createAppVersionSchema = z.object({
  appId: z.string().cuid('Invalid app ID format'),
  name: z
    .string()
    .min(1, 'Version name is required')
    .max(50, 'Version name must be less than 50 characters')
    .trim()
});

// Get all versions for an app
export async function getAppVersions(appId: string) {
  try {
    const idSchema = z.string().cuid('Invalid app ID format');
    const validatedId = idSchema.parse(appId);

    const versions = await prisma.appVersion.findMany({
      where: { appId: validatedId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            screens: true
          }
        }
      }
    });

    return { success: true, data: versions };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Invalid ID:', error.issues);
      return { success: false, error: 'Invalid app ID' };
    }
    console.error('Failed to fetch app versions:', error);
    return { success: false, error: 'Failed to fetch app versions' };
  }
}

// Create a new app version
export async function createAppVersion(appId: string, name: string) {
  try {
    const validated = createAppVersionSchema.parse({ appId, name });

    // Check if app exists
    const app = await prisma.app.findUnique({
      where: { id: validated.appId }
    });

    if (!app) {
      return { success: false, error: 'App not found' };
    }

    // Check if version name already exists for this app
    const existingVersion = await prisma.appVersion.findFirst({
      where: {
        appId: validated.appId,
        name: validated.name
      }
    });

    if (existingVersion) {
      return { success: false, error: 'Version name already exists for this app' };
    }

    const version = await prisma.appVersion.create({
      data: {
        appId: validated.appId,
        name: validated.name
      }
    });

    revalidatePath(`/apps/${appId}/edit`);
    revalidatePath(`/apps/${appId}`);

    return { success: true, data: version };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues);
      return { success: false, error: error.issues[0]?.message || 'Validation failed' };
    }
    console.error('Failed to create app version:', error);
    return { success: false, error: 'Failed to create app version' };
  }
}

// Delete an app version
export async function deleteAppVersion(versionId: string) {
  try {
    const idSchema = z.string().uuid('Invalid version ID format');
    const validatedId = idSchema.parse(versionId);

    // Get version to find appId for revalidation
    const version = await prisma.appVersion.findUnique({
      where: { id: validatedId },
      select: { appId: true, _count: { select: { screens: true } } }
    });

    if (!version) {
      return { success: false, error: 'Version not found' };
    }

    // Check if version has screens
    if (version._count.screens > 0) {
      return {
        success: false,
        error: 'Cannot delete version that has screens. Please remove or reassign screens first.'
      };
    }

    await prisma.appVersion.delete({
      where: { id: validatedId }
    });

    revalidatePath(`/apps/${version.appId}/edit`);
    revalidatePath(`/apps/${version.appId}`);

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Invalid ID:', error.issues);
      return { success: false, error: 'Invalid version ID' };
    }
    console.error('Failed to delete app version:', error);
    return { success: false, error: 'Failed to delete app version' };
  }
}

// Screen validation schema
const createScreenSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters').trim(),

  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .trim()
    .optional()
    .nullable()
    .transform((val) => {
      if (!val) return null;
      return val.replace(/<[^>]*>/g, '');
    }),

  imageUrl: z.string().url('Image URL must be valid').max(500, 'Image URL too long'),

  tags: z.array(z.string()).optional().default([])
});

// Create multiple screens for an app
export async function createScreens(
  appId: string,
  screens: Array<{
    title: string;
    description?: string;
    imageUrl: string;
    tags?: string[];
    flowId?: string;
    appVersionId?: string;
    // screenType is deprecated - use flowId instead
  }>
) {
  try {
    // Validate app ID
    const idSchema = z.string().cuid('Invalid app ID format');
    const validatedAppId = idSchema.parse(appId);

    // Validate appVersionId if provided (it's a UUID)
    const appVersionIdSchema = z.string().uuid('Invalid app version ID format').optional().nullable();

    // Validate each screen
    const validatedScreens = screens.map((screen) => {
      const baseScreen = createScreenSchema.parse(screen);
      const validatedAppVersionId = screen.appVersionId 
        ? appVersionIdSchema.parse(screen.appVersionId) 
        : null;
      return {
        ...baseScreen,
        flowId: screen.flowId || null,
        appVersionId: validatedAppVersionId
      };
    });

    // Create all screens in a transaction
    await prisma.$transaction(
      validatedScreens.map((screen) =>
        prisma.screen.create({
          data: {
            ...screen,
            appId: validatedAppId
          }
        })
      )
    );

    revalidatePath('/apps');
    revalidatePath(`/apps/${validatedAppId}`);
    revalidatePath(`/apps/${validatedAppId}/edit`);

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues);
      throw new Error(error.issues.map((e: z.ZodIssue) => e.message).join(', '));
    }
    console.error('Failed to create screens:', error);
    throw new Error('Failed to create screens');
  }
}

// Get screens for an app
export async function getScreensByAppId(appId: string) {
  try {
    const idSchema = z.string().cuid('Invalid app ID format');
    const validatedId = idSchema.parse(appId);

    const screens = await prisma.screen.findMany({
      where: { appId: validatedId, isPublished: true },
      include: {
        flow: {
          select: {
            id: true,
            name: true
          }
        },
        screenType: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        appVersion: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            _count: {
              select: {
                screens: true
              }
            }
          }
        },
        uiElements: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }]
    });

    return { success: true, data: screens };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Invalid ID:', error.issues);
      return { success: false, error: 'Invalid app ID' };
    }
    console.error('Failed to fetch screens:', error);
    return { success: false, error: 'Failed to fetch screens' };
  }
}

// Create a global flow
export async function createFlow(formData: FormData) {
  try {
    // Validate and sanitize input
    const sortOrderValue = formData.get('sortOrder');
    const validated = createFlowSchema.parse({
      name: formData.get('name'),
      description: formData.get('description') || null,
      sortOrder: sortOrderValue ? parseInt(sortOrderValue as string) || 0 : 0
    });

    // Create flow
    const flow = await prisma.flow.create({
      data: validated
    });

    revalidatePath('/flows');

    return { success: true, data: flow };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues);
      throw new Error(error.issues.map((e: z.ZodIssue) => e.message).join(', '));
    }
    console.error('Failed to create flow:', error);
    throw new Error('Failed to create flow');
  }
}

// Get flows for an app (deprecated: flows are now global, returns all flows)
export async function getFlowsByAppId(appId: string) {
  try {
    // Flows are now global, so return all flows regardless of appId
    // This function is kept for backward compatibility
    const flows = await prisma.flow.findMany({
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }]
    });

    return { success: true, data: flows };
  } catch (error) {
    console.error('Failed to fetch flows:', error);
    return { success: false, error: 'Failed to fetch flows' };
  }
}

// Get all flows
export async function getAllFlows() {
  try {
    const flows = await prisma.flow.findMany({
      include: {
        screens: {
          select: {
            id: true
          }
        }
      },
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }]
    });

    return { success: true, data: flows };
  } catch (error) {
    console.error('Failed to fetch flows:', error);
    return { success: false, error: 'Failed to fetch flows' };
  }
}

// Update flow sortOrder
export async function updateFlowSortOrder(flowId: string, sortOrder: number) {
  try {
    const idSchema = z.string().cuid('Invalid flow ID format');
    const validatedId = idSchema.parse(flowId);

    const sortOrderSchema = z.number().int();
    const validatedSortOrder = sortOrderSchema.parse(sortOrder);

    await prisma.flow.update({
      where: { id: validatedId },
      data: { sortOrder: validatedSortOrder }
    });

    revalidatePath('/flows');

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues);
      return { success: false, error: 'Invalid input' };
    }
    console.error('Failed to update flow sortOrder:', error);
    return { success: false, error: 'Failed to update flow sortOrder' };
  }
}

// Update multiple flows' sortOrder (batch update)
export async function updateFlowsSortOrder(updates: Array<{ flowId: string; sortOrder: number }>) {
  try {
    await prisma.$transaction(
      updates.map(({ flowId, sortOrder }) =>
        prisma.flow.update({
          where: { id: flowId },
          data: { sortOrder }
        })
      )
    );

    revalidatePath('/flows');

    return { success: true };
  } catch (error) {
    console.error('Failed to update flows sortOrder:', error);
    return { success: false, error: 'Failed to update flows sortOrder' };
  }
}

// Update flow (name, description)
export async function updateFlow(flowId: string, formData: FormData) {
  try {
    const idSchema = z.string().cuid('Invalid flow ID format');
    const validatedId = idSchema.parse(flowId);

    const sortOrderValue = formData.get('sortOrder');
    const validated = createFlowSchema.parse({
      name: formData.get('name'),
      description: formData.get('description') || null,
      sortOrder: sortOrderValue ? parseInt(sortOrderValue as string) || 0 : 0
    });

    await prisma.flow.update({
      where: { id: validatedId },
      data: validated
    });

    revalidatePath('/flows');

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues);
      throw new Error(error.issues.map((e: z.ZodIssue) => e.message).join(', '));
    }
    console.error('Failed to update flow:', error);
    throw new Error('Failed to update flow');
  }
}

// Delete a screen
export async function deleteScreen(screenId: string) {
  try {
    const idSchema = z.string().cuid('Invalid screen ID format');
    const validatedId = idSchema.parse(screenId);

    await prisma.screen.delete({
      where: { id: validatedId }
    });

    revalidatePath('/apps');
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Invalid ID:', error.issues);
      return { success: false, error: 'Invalid screen ID' };
    }
    console.error('Failed to delete screen:', error);
    return { success: false, error: 'Failed to delete screen' };
  }
}

// Category validation schema
const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim()
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Name can only contain letters, numbers, spaces, hyphens and underscores'),

  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(50, 'Slug must be less than 50 characters')
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers and hyphens')
});

// Get all categories
export async function getAllCategories() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        apps: {
          select: {
            id: true
          }
        }
      },
      orderBy: [{ name: 'asc' }]
    });

    return { success: true, data: categories };
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return { success: false, error: 'Failed to fetch categories' };
  }
}

// Create a category
export async function createCategory(formData: FormData) {
  try {
    const validated = createCategorySchema.parse({
      name: formData.get('name'),
      slug: formData.get('slug')
    });

    const category = await prisma.category.create({
      data: validated
    });

    revalidatePath('/categories');

    return { success: true, data: category };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues);
      throw new Error(error.issues.map((e: z.ZodIssue) => e.message).join(', '));
    }
    console.error('Failed to create category:', error);
    throw new Error('Failed to create category');
  }
}

// Update a category
export async function updateCategory(categoryId: string, formData: FormData) {
  try {
    const idSchema = z.string().cuid('Invalid category ID format');
    const validatedId = idSchema.parse(categoryId);

    const validated = createCategorySchema.parse({
      name: formData.get('name'),
      slug: formData.get('slug')
    });

    await prisma.category.update({
      where: { id: validatedId },
      data: validated
    });

    revalidatePath('/categories');
    revalidatePath('/apps');

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues);
      throw new Error(error.issues.map((e: z.ZodIssue) => e.message).join(', '));
    }
    console.error('Failed to update category:', error);
    throw new Error('Failed to update category');
  }
}

// Delete a category
export async function deleteCategory(categoryId: string) {
  try {
    const idSchema = z.string().cuid('Invalid category ID format');
    const validatedId = idSchema.parse(categoryId);

    await prisma.category.delete({
      where: { id: validatedId }
    });

    revalidatePath('/categories');
    revalidatePath('/apps');

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Invalid ID:', error.issues);
      return { success: false, error: 'Invalid category ID' };
    }
    console.error('Failed to delete category:', error);
    return { success: false, error: 'Failed to delete category' };
  }
}

// ============================================
// ScreenType Actions
// ============================================

// ScreenType validation schema
const createScreenTypeSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim()
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Name can only contain letters, numbers, spaces, hyphens and underscores'),

  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(50, 'Slug must be less than 50 characters')
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers and hyphens')
});

// Get all screen types
export async function getAllScreenTypes() {
  try {
    const screenTypes = await prisma.screenType.findMany({
      include: {
        screens: {
          select: {
            id: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return { success: true, data: screenTypes };
  } catch (error) {
    console.error('Failed to fetch screen types:', error);
    return { success: false, error: 'Failed to fetch screen types' };
  }
}

// Alias for consistency with other actions
export const getScreenTypes = getAllScreenTypes;

// Create a screen type
export async function createScreenType(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    // Auto-generate slug from name if not provided
    const slugValue = formData.get('slug') as string;
    const slug = slugValue || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const validated = createScreenTypeSchema.parse({
      name,
      slug
    });

    const screenType = await prisma.screenType.create({
      data: validated
    });

    revalidatePath('/screen-types');
    revalidatePath('/apps');

    return { success: true, data: screenType };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues);
      return { success: false, error: error.issues.map((e: z.ZodIssue) => e.message).join(', ') };
    }
    console.error('Failed to create screen type:', error);
    return { success: false, error: 'Failed to create screen type' };
  }
}

// Update a screen type
export async function updateScreenType(screenTypeId: string, formData: FormData) {
  try {
    const idSchema = z.string().cuid('Invalid screen type ID format');
    const validatedId = idSchema.parse(screenTypeId);

    const name = formData.get('name') as string;
    // Auto-generate slug from name if not provided
    const slugValue = formData.get('slug') as string;
    const slug = slugValue || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const validated = createScreenTypeSchema.parse({
      name,
      slug
    });

    await prisma.screenType.update({
      where: { id: validatedId },
      data: validated
    });

    revalidatePath('/screen-types');
    revalidatePath('/apps');

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues);
      return { success: false, error: error.issues.map((e: z.ZodIssue) => e.message).join(', ') };
    }
    console.error('Failed to update screen type:', error);
    return { success: false, error: 'Failed to update screen type' };
  }
}

// Delete a screen type
export async function deleteScreenType(screenTypeId: string) {
  try {
    const idSchema = z.string().cuid('Invalid screen type ID format');
    const validatedId = idSchema.parse(screenTypeId);

    await prisma.screenType.delete({
      where: { id: validatedId }
    });

    revalidatePath('/screen-types');
    revalidatePath('/apps');

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Invalid ID:', error.issues);
      return { success: false, error: 'Invalid screen type ID' };
    }
    console.error('Failed to delete screen type:', error);
    return { success: false, error: 'Failed to delete screen type' };
  }
}

// ============================================
// UIElement Actions
// ============================================

// UIElement validation schema
const createUIElementSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim()
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Name can only contain letters, numbers, spaces, hyphens and underscores'),

  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(50, 'Slug must be less than 50 characters')
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers and hyphens')
});

// Get all UI elements
export async function getAllUIElements() {
  try {
    const uiElements = await prisma.uIElement.findMany({
      include: {
        screens: {
          select: {
            id: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return { success: true, data: uiElements };
  } catch (error) {
    console.error('Failed to fetch UI elements:', error);
    return { success: false, error: 'Failed to fetch UI elements' };
  }
}

// Alias for consistency
export const getUIElements = getAllUIElements;

// Create a UI element
export async function createUIElement(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    // Auto-generate slug from name if not provided
    const slugValue = formData.get('slug') as string;
    const slug = slugValue || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const validated = createUIElementSchema.parse({
      name,
      slug
    });

    const uiElement = await prisma.uIElement.create({
      data: validated
    });

    revalidatePath('/ui-elements');
    revalidatePath('/apps');

    return { success: true, data: uiElement };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues);
      return { success: false, error: error.issues.map((e: z.ZodIssue) => e.message).join(', ') };
    }
    console.error('Failed to create UI element:', error);
    return { success: false, error: 'Failed to create UI element' };
  }
}

// Update a UI element
export async function updateUIElement(uiElementId: string, formData: FormData) {
  try {
    const idSchema = z.string().cuid('Invalid UI element ID format');
    const validatedId = idSchema.parse(uiElementId);

    const name = formData.get('name') as string;
    // Auto-generate slug from name if not provided
    const slugValue = formData.get('slug') as string;
    const slug = slugValue || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const validated = createUIElementSchema.parse({
      name,
      slug
    });

    await prisma.uIElement.update({
      where: { id: validatedId },
      data: validated
    });

    revalidatePath('/ui-elements');
    revalidatePath('/apps');

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues);
      return { success: false, error: error.issues.map((e: z.ZodIssue) => e.message).join(', ') };
    }
    console.error('Failed to update UI element:', error);
    return { success: false, error: 'Failed to update UI element' };
  }
}

// Delete a UI element
export async function deleteUIElement(uiElementId: string) {
  try {
    const idSchema = z.string().cuid('Invalid UI element ID format');
    const validatedId = idSchema.parse(uiElementId);

    await prisma.uIElement.delete({
      where: { id: validatedId }
    });

    revalidatePath('/ui-elements');
    revalidatePath('/apps');

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Invalid ID:', error.issues);
      return { success: false, error: 'Invalid UI element ID' };
    }
    console.error('Failed to delete UI element:', error);
    return { success: false, error: 'Failed to delete UI element' };
  }
}

// ============================================
// Screen Update Action
// ============================================

// Update screen schema
const updateScreenSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters').trim(),

  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .trim()
    .optional()
    .nullable()
    .transform((val) => {
      if (!val) return null;
      return val.replace(/<[^>]*>/g, '');
    }),

  screenTypeId: z.string().cuid('Invalid screen type ID format').optional().nullable(),

  uiElementIds: z.array(z.string().cuid('Invalid UI element ID format')).optional().default([]),

  // Flow assignment - null means remove from flow, undefined means don't change
  flowId: z.string().cuid('Invalid flow ID format').optional().nullable(),

  // App version assignment - null means remove from version, undefined means don't change
  appVersionId: z.string().uuid('Invalid app version ID format').optional().nullable(),

  // Order/position within a flow
  order: z.number().int().min(0).optional()
});

// Update a screen with screenType, uiElements, flowId, appVersionId, and order
export async function updateScreen(
  screenId: string,
  data: {
    title?: string;
    description?: string | null;
    screenTypeId?: string | null;
    uiElementIds?: string[];
    flowId?: string | null;
    appVersionId?: string | null;
    order?: number;
  }
) {
  try {
    // Validate screen ID
    const idSchema = z.string().cuid('Invalid screen ID format');
    const validatedId = idSchema.parse(screenId);

    // Validate input data
    const validated = updateScreenSchema.parse({
      title: data.title,
      description: data.description,
      screenTypeId: data.screenTypeId || null,
      uiElementIds: data.uiElementIds || [],
      flowId: data.flowId,
      appVersionId: data.appVersionId,
      order: data.order
    });

    // First, get the screen to find its appId for revalidation
    const screen = await prisma.screen.findUnique({
      where: { id: validatedId },
      select: { appId: true }
    });

    if (!screen) {
      return { success: false, error: 'Screen not found' };
    }

    // Build the update data object dynamically
    const updateData: {
      title: string;
      description: string | null;
      screenTypeId: string | null;
      uiElements: { set: { id: string }[] };
      flowId?: string | null;
      appVersionId?: string | null;
      order?: number;
    } = {
      title: validated.title,
      description: validated.description,
      screenTypeId: validated.screenTypeId ?? null,
      // For many-to-many: use 'set' to replace all existing connections
      uiElements: {
        set: validated.uiElementIds.map((id) => ({ id }))
      }
    };

    // Only update flowId if it was explicitly provided (including null to remove)
    if (data.flowId !== undefined) {
      updateData.flowId = validated.flowId ?? null;
    }

    // Only update appVersionId if it was explicitly provided (including null to remove)
    if (data.appVersionId !== undefined) {
      updateData.appVersionId = validated.appVersionId ?? null;
    }

    // Only update order if it was provided
    if (validated.order !== undefined) {
      updateData.order = validated.order;
    }

    // Update the screen
    await prisma.screen.update({
      where: { id: validatedId },
      data: updateData
    });

    // Revalidate paths
    revalidatePath('/apps');
    revalidatePath(`/apps/${screen.appId}/edit`);

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues);
      return { success: false, error: error.issues.map((e: z.ZodIssue) => e.message).join(', ') };
    }
    console.error('Failed to update screen:', error);
    return { success: false, error: 'Failed to update screen' };
  }
}

// Reorder screens within a flow or app
const reorderScreensSchema = z.array(
  z.object({
    id: z.string().cuid('Invalid screen ID format'),
    order: z.number().int().min(0, 'Order must be non-negative')
  })
);

export async function reorderScreens(items: { id: string; order: number }[]) {
  try {
    // Validate input
    const validated = reorderScreensSchema.parse(items);

    if (validated.length === 0) {
      return { success: false, error: 'No screens provided' };
    }

    // Verify all screens exist before attempting update
    const screenIds = validated.map((item) => item.id);
    const existingScreens = await prisma.screen.findMany({
      where: { id: { in: screenIds } },
      select: { id: true, appId: true }
    });

    if (existingScreens.length !== validated.length) {
      const foundIds = new Set(existingScreens.map((s) => s.id));
      const missingIds = validated.filter((item) => !foundIds.has(item.id));
      return {
        success: false,
        error: `Some screens not found: ${missingIds.map((s) => s.id).join(', ')}`
      };
    }

    // Get the appId from the first screen for revalidation
    const appId = existingScreens[0]?.appId;
    if (!appId) {
      return { success: false, error: 'Could not determine app ID' };
    }

    // Use transaction to ensure all updates succeed or fail together
    await prisma.$transaction(
      validated.map((item) =>
        prisma.screen.update({
          where: { id: item.id },
          data: { order: item.order }
        })
      )
    );

    // Revalidate the app edit page
    revalidatePath(`/apps/${appId}/edit`);
    revalidatePath('/apps');

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues);
      return { success: false, error: error.issues.map((e: z.ZodIssue) => e.message).join(', ') };
    }
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';
    
    // Log the full error for debugging
    console.error('Failed to reorder screens - Full error:', {
      message: errorMessage,
      stack: errorStack,
      error: error
    });
    
    // Check if it's a Prisma validation error about unknown fields
    if (
      errorMessage.includes('Unknown argument') ||
      errorMessage.includes('order') ||
      errorMessage.includes('Unknown field') ||
      errorStack?.includes('PrismaClientValidationError')
    ) {
      return { 
        success: false, 
        error: `The order field may not be recognized. Please restart your Next.js dev server after running: npx prisma generate` 
      };
    }
    
    return { success: false, error: `Failed to reorder screens: ${errorMessage}` };
  }
}

// ============================================
// Recommendation Toggle Actions
// ============================================

// Toggle App recommendation status
export async function toggleAppRecommendation(id: string, isRecommended: boolean) {
  try {
    const idSchema = z.string().cuid('Invalid app ID format');
    const validatedId = idSchema.parse(id);

    const booleanSchema = z.boolean();
    const validatedIsRecommended = booleanSchema.parse(isRecommended);

    await prisma.app.update({
      where: { id: validatedId },
      data: { isRecommended: validatedIsRecommended }
    });

    revalidatePath('/apps');
    revalidatePath(`/apps/${validatedId}`);
    revalidatePath(`/apps/${validatedId}/edit`);

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues);
      return { success: false, error: error.issues[0]?.message || 'Validation failed' };
    }
    console.error('Failed to toggle app recommendation:', error);
    return { success: false, error: 'Failed to toggle app recommendation' };
  }
}

// Toggle ScreenType recommendation status
export async function toggleScreenTypeRecommendation(id: string, isRecommended: boolean) {
  try {
    const idSchema = z.string().cuid('Invalid screen type ID format');
    const validatedId = idSchema.parse(id);

    const booleanSchema = z.boolean();
    const validatedIsRecommended = booleanSchema.parse(isRecommended);

    await prisma.screenType.update({
      where: { id: validatedId },
      data: { isRecommended: validatedIsRecommended }
    });

    revalidatePath('/screen-types');

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues);
      return { success: false, error: error.issues[0]?.message || 'Validation failed' };
    }
    console.error('Failed to toggle screen type recommendation:', error);
    return { success: false, error: 'Failed to toggle screen type recommendation' };
  }
}

// Toggle UIElement recommendation status
export async function toggleUiElementRecommendation(id: string, isRecommended: boolean) {
  try {
    const idSchema = z.string().cuid('Invalid UI element ID format');
    const validatedId = idSchema.parse(id);

    const booleanSchema = z.boolean();
    const validatedIsRecommended = booleanSchema.parse(isRecommended);

    await prisma.uIElement.update({
      where: { id: validatedId },
      data: { isRecommended: validatedIsRecommended }
    });

    revalidatePath('/ui-elements');

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues);
      return { success: false, error: error.issues[0]?.message || 'Validation failed' };
    }
    console.error('Failed to toggle UI element recommendation:', error);
    return { success: false, error: 'Failed to toggle UI element recommendation' };
  }
}

// Toggle Flow recommendation status
export async function toggleFlowRecommendation(id: string, isRecommended: boolean) {
  try {
    const idSchema = z.string().cuid('Invalid flow ID format');
    const validatedId = idSchema.parse(id);

    const booleanSchema = z.boolean();
    const validatedIsRecommended = booleanSchema.parse(isRecommended);

    await prisma.flow.update({
      where: { id: validatedId },
      data: { isRecommended: validatedIsRecommended }
    });

    revalidatePath('/flows');

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues);
      return { success: false, error: error.issues[0]?.message || 'Validation failed' };
    }
    console.error('Failed to toggle flow recommendation:', error);
    return { success: false, error: 'Failed to toggle flow recommendation' };
  }
}
