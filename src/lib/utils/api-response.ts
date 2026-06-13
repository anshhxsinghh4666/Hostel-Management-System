import { NextResponse } from "next/server";
import { ApiResponse } from "@/lib/types";

export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200,
  meta?: ApiResponse["meta"]
): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
    ...(meta && { meta }),
  };
  return NextResponse.json(response, { status });
}

export function errorResponse(
  error: string,
  status: number = 400,
  errors?: Record<string, string[]>
): NextResponse {
  const response: ApiResponse = {
    success: false,
    error,
    ...(errors && { errors }),
  };
  return NextResponse.json(response, { status });
}

export function unauthorizedResponse(error: string = "Unauthorized"): NextResponse {
  return errorResponse(error, 401);
}

export function forbiddenResponse(error: string = "Forbidden"): NextResponse {
  return errorResponse(error, 403);
}

export function notFoundResponse(error: string = "Not found"): NextResponse {
  return errorResponse(error, 404);
}
