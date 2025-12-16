'use server';

import { prisma } from '@/lib/prisma';

export interface DashboardStats {
  counts: {
    apps: number;
    flows: number;
    screens: number;
    categories: number;
    screenTypes: number;
    uiElements: number;
  };
  recentApps: Array<{
    id: string;
    name: string;
    slug: string;
    category: { id: string; name: string } | null;
    createdAt: Date;
  }>;
  recentFlows: Array<{
    id: string;
    name: string;
    description: string | null;
    _count: { screens: number };
    createdAt: Date;
  }>;
}

export async function getDashboardStats(): Promise<{ success: true; data: DashboardStats } | { success: false; error: string }> {
  try {
    // Fetch all counts in parallel
    const [
      appsCount,
      flowsCount,
      screensCount,
      categoriesCount,
      screenTypesCount,
      uiElementsCount,
      recentApps,
      recentFlows
    ] = await Promise.all([
      // Counts
      prisma.app.count(),
      prisma.flow.count(),
      prisma.screen.count(),
      prisma.category.count(),
      prisma.screenType.count(),
      prisma.uIElement.count(),
      
      // Recent apps (5 most recent)
      prisma.app.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          category: {
            select: {
              id: true,
              name: true
            }
          },
          createdAt: true
        }
      }),
      
      // Recent flows (5 most recent)
      prisma.flow.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          _count: {
            select: { screens: true }
          },
          createdAt: true
        }
      })
    ]);

    return {
      success: true,
      data: {
        counts: {
          apps: appsCount,
          flows: flowsCount,
          screens: screensCount,
          categories: categoriesCount,
          screenTypes: screenTypesCount,
          uiElements: uiElementsCount
        },
        recentApps,
        recentFlows
      }
    };
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return {
      success: false,
      error: 'Failed to fetch dashboard statistics'
    };
  }
}

