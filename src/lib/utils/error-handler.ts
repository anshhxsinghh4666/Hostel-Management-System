import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { errorResponse } from "./api-response";

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const path = issue.path.join(".");
      if (!errors[path]) errors[path] = [];
      errors[path].push(issue.message);
    }
    return errorResponse("Validation failed", 400, errors);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = (error.meta?.target as string[])?.join(", ") || "field";
      return errorResponse(`A record with this ${target} already exists`, 409);
    }
    if (error.code === "P2025") {
      return errorResponse("Record not found", 404);
    }
    return errorResponse("Database error", 500);
  }

  if (error instanceof Error) {
    return errorResponse(error.message, 500);
  }

  return errorResponse("Internal server error", 500);
}
