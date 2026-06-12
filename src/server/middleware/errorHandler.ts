import { NextResponse } from "next/server";

export interface ErrorResponse {
  message: string;
  error?: string;
  statusCode: number;
}

export class ApiError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);

  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        message: error.message,
        error: error.message,
        statusCode: error.statusCode,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      {
        message: "Internal Server Error",
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
        statusCode: 500,
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      message: "Unknown Error",
      error: "An unexpected error occurred",
      statusCode: 500,
    },
    { status: 500 }
  );
}

export function createErrorResponse(message: string, statusCode: number = 500): NextResponse {
  return NextResponse.json(
    {
      message,
      error: message,
      statusCode,
    },
    { status: statusCode }
  );
}

// Utility functions for common errors
export const errorResponses = {
  unauthorized: () => createErrorResponse("Unauthorized", 401),
  forbidden: () => createErrorResponse("Forbidden", 403),
  notFound: (resource = "Resource") => createErrorResponse(`${resource} not found`, 404),
  badRequest: (message = "Bad Request") => createErrorResponse(message, 400),
  conflict: (message = "Conflict") => createErrorResponse(message, 409),
  serverError: (message = "Internal Server Error") => createErrorResponse(message, 500),
};
