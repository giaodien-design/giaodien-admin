import { Prisma } from "@/generated/prisma"

// Base types từ Prisma
export type App = Prisma.AppGetPayload<{
  include: {
    screens: true
    _count: {
      select: {
        screens: true
      }
    }
  }
}>

// Type cho API response với preview screens
export type AppWithPreview = Prisma.AppGetPayload<{
  include: {
    screens: {
      take: 3
    }
    _count: {
      select: {
        screens: true
      }
    }
  }
}>

// Type cho list (không include screens)
export type AppListItem = Prisma.AppGetPayload<{
  include: {
    _count: {
      select: {
        screens: true
      }
    }
  }
}>

// Type cho create/update
export type AppCreateInput = Prisma.AppCreateInput
export type AppUpdateInput = Prisma.AppUpdateInput
