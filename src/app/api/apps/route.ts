import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { ApiResponse, AppWithPreview } from "@/types"

export async function GET() {
  try {
    const apps = await prisma.app.findMany({
      include: {
        screens: {
          take: 3,
        },
        _count: {
          select: {
            screens: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json<ApiResponse<AppWithPreview[]>>({
      success: true,
      data: apps,
    })
  } catch (error) {
    console.error("Error fetching apps:", error)
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: "Failed to fetch apps",
      },
      { status: 500 }
    )
  }
}
