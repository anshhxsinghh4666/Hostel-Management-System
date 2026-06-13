import { NextRequest } from "next/server";
import { registerSchema } from "@/lib/validations/auth.schema";
import { authService } from "@/lib/services/auth.service";
import { handleApiError } from "@/lib/utils/error-handler";
import { successResponse } from "@/lib/utils/api-response";
import { rateLimit, rateLimitResponse, getClientIp } from "@/lib/utils/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { success } = rateLimit(`register:${ip}`, 3, 60000);
    if (!success) return rateLimitResponse();

    const body = await request.json();
    const data = registerSchema.parse(body);

    const user = await authService.register(data);

    return successResponse(user, "Registration successful", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
