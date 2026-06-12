import { NextRequest, NextResponse } from "next/server"
import { FEATURE_NAMEService } from "@/server/services/TEMPLATE.service"
import { Logger, LogTags, categorizeError, ValidationError, DatabaseError } from "@/lib/logger"
import { requireAuth } from "@/server/utils/apiHelpers"
import { sanitizeString } from "@/lib/validation"

/**
 * FEATURE_NAME Controller
 * Handles HTTP request/response for FEATURE_NAME-related operations
 * Delegates business logic to FEATURE_NAMEService
 */
export class FEATURE_NAMEController {
  private featureService: FEATURE_NAMEService

  constructor() {
    this.featureService = new FEATURE_NAMEService()
  }

  /**
   * Get items with filters
   * GET /api/FEATURE_NAME?param1=value&param2=value&limit=20
   */
  async getItems(request: NextRequest): Promise<NextResponse> {
    Logger.d(LogTags.API_REQUEST, 'Get FEATURE_NAME request received')

    try {
      const { searchParams } = new URL(request.url)
      
      const filters = {
        param1: searchParams.get("param1"),
        param2: searchParams.get("param2"),
        limit: parseInt(searchParams.get("limit") || "20")
      }

      Logger.d(LogTags.API_REQUEST, 'Fetching items with filters', { filters })

      const items = await this.featureService.getItems(filters)

      Logger.i(LogTags.API_RESPONSE, `Successfully fetched ${items.length} items`)
      
      return NextResponse.json(items)
    } catch (error) {
      return this.handleError(error, 'Failed to fetch items')
    }
  }

  /**
   * Get single item by ID
   * GET /api/FEATURE_NAME/:id
   */
  async getItemById(request: NextRequest, id: string): Promise<NextResponse> {
    Logger.d(LogTags.API_REQUEST, 'Get item by ID request received', { id })

    try {
      if (!id) {
        return NextResponse.json({ error: "ID is required" }, { status: 400 })
      }

      const item = await this.featureService.getItemById(id)

      if (!item) {
        Logger.w(LogTags.API_REQUEST, 'Item not found', { id })
        return NextResponse.json({ error: "Item not found" }, { status: 404 })
      }

      Logger.i(LogTags.API_RESPONSE, 'Item fetched successfully', { id })
      
      return NextResponse.json(item)
    } catch (error) {
      return this.handleError(error, 'Failed to fetch item')
    }
  }

  /**
   * Create new item
   * POST /api/FEATURE_NAME
   */
  async createItem(request: NextRequest): Promise<NextResponse> {
    Logger.d(LogTags.API_REQUEST, 'Create FEATURE_NAME request received')

    try {
      const authResult = await requireAuth()
      if (authResult instanceof NextResponse) {
        return authResult
      }

      const body = await request.json()
      const userId = authResult.userId

      // Validate required fields
      const validation = this.validateItemData(body)
      if (!validation.valid) {
        Logger.w(LogTags.API_REQUEST, 'Validation failed', { errors: validation.errors })
        return NextResponse.json({ error: validation.errors[0] }, { status: 400 })
      }

      // Sanitize inputs
      const itemData = {
        field1: sanitizeString(body.field1),
        field2: body.field2 ? sanitizeString(body.field2) : undefined,
        // Add more fields...
      }

      Logger.d(LogTags.API_REQUEST, 'Creating item', { userId })

      const item = await this.featureService.createItem(userId, itemData)

      Logger.i(LogTags.API_RESPONSE, 'Item created successfully', { itemId: item.id, userId })
      
      return NextResponse.json(item, { status: 201 })
    } catch (error) {
      return this.handleError(error, 'Failed to create item')
    }
  }

  /**
   * Update item
   * PUT /api/FEATURE_NAME/:id
   */
  async updateItem(request: NextRequest, id: string): Promise<NextResponse> {
    Logger.d(LogTags.API_REQUEST, 'Update item request received', { id })

    try {
      const authResult = await requireAuth()
      if (authResult instanceof NextResponse) {
        return authResult
      }

      const body = await request.json()
      const userId = authResult.userId

      // Sanitize update data
      const updateData: any = {}
      if (body.field1 !== undefined) updateData.field1 = sanitizeString(body.field1)
      if (body.field2 !== undefined) updateData.field2 = sanitizeString(body.field2)
      // Add more fields...

      const item = await this.featureService.updateItem(id, userId, updateData)

      if (!item) {
        return NextResponse.json({ error: "Item not found or unauthorized" }, { status: 404 })
      }

      Logger.i(LogTags.API_RESPONSE, 'Item updated successfully', { id, userId })
      
      return NextResponse.json(item)
    } catch (error) {
      return this.handleError(error, 'Failed to update item')
    }
  }

  /**
   * Delete item
   * DELETE /api/FEATURE_NAME/:id
   */
  async deleteItem(request: NextRequest, id: string): Promise<NextResponse> {
    Logger.d(LogTags.API_REQUEST, 'Delete item request received', { id })

    try {
      const authResult = await requireAuth()
      if (authResult instanceof NextResponse) {
        return authResult
      }

      const userId = authResult.userId

      const result = await this.featureService.deleteItem(id, userId)

      if (!result.success) {
        Logger.w(LogTags.API_REQUEST, result.message, { id, userId })
        return NextResponse.json({ error: result.message }, { status: result.notFound ? 404 : 403 })
      }

      Logger.i(LogTags.API_RESPONSE, 'Item deleted successfully', { id, userId })
      
      return NextResponse.json({ message: "Item deleted successfully" })
    } catch (error) {
      return this.handleError(error, 'Failed to delete item')
    }
  }

  /**
   * Validate item data
   */
  private validateItemData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Add validation rules
    if (!data.field1 || typeof data.field1 !== 'string') {
      errors.push("Field1 is required")
    }

    if (data.field1 && (data.field1.trim().length < 1 || data.field1.trim().length > 100)) {
      errors.push("Field1 must be between 1 and 100 characters")
    }

    // Add more validations...

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Centralized error handling
   */
  private handleError(error: unknown, defaultMessage: string): NextResponse {
    const categorizedError = categorizeError(error)

    if (categorizedError instanceof ValidationError) {
      Logger.w(LogTags.API_ERROR, `Validation error: ${categorizedError.message}`)
      return NextResponse.json({ error: categorizedError.message }, { status: 400 })
    }

    if (categorizedError instanceof DatabaseError) {
      Logger.e(LogTags.DB_ERROR, `Database error: ${categorizedError.message}`, { error: categorizedError })
      return NextResponse.json({ error: "Database error occurred" }, { status: 500 })
    }

    Logger.e(LogTags.API_ERROR, `Unexpected error: ${categorizedError.message}`, { error: categorizedError })
    return NextResponse.json({ error: defaultMessage }, { status: 500 })
  }
}
