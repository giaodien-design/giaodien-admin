import { Prisma } from "@/generated/prisma"

// Base types từ Prisma
export type Screen = Prisma.ScreenGetPayload<{
  include: {
    app: true
  }
}>

// Type cho screen detail (với app info)
export type ScreenWithApp = Prisma.ScreenGetPayload<{
  include: {
    app: {
      select: {
        id: true
        name: true
        slug: true
        brandColor: true
      }
    }
  }
}>

// Type cho create/update
export type ScreenCreateInput = Prisma.ScreenCreateInput
export type ScreenUpdateInput = Prisma.ScreenUpdateInput
