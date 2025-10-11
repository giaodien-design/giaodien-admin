// App types
export type {
  App,
  AppWithPreview,
  AppListItem,
  AppCreateInput,
  AppUpdateInput,
} from "./app"

// Screen types
export type {
  Screen,
  ScreenWithApp,
  ScreenCreateInput,
  ScreenUpdateInput,
} from "./screen"

// API Response types
export type ApiResponse<T> =
  | {
      success: true
      data: T
    }
  | {
      success: false
      error: string
    }

export type PaginatedResponse<T> =
  | {
      success: true
      data: T[]
      pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
      }
    }
  | {
      success: false
      error: string
    }
