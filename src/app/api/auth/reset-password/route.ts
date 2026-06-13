import { NextRequest } from "next/server";
import { resetPasswordSchema } from "@/lib/validations/auth.schema";
import { authService } from "@/lib/services/auth.service";
import { handleApiError } from "@/lib/utils/error-handler";
import { successResponse } from "@/lib/utils/api-response";
import { rateLimit, rateLimitResponse, getClientIp } from "@/lib/utils/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { success } = rateLimit(`reset-password:${ip}`, 3, 60000);
    if (!success) return rateLimitResponse();

    const body = await request.json();
    const data = resetPasswordSchema.parse(body);

    await authService.resetPassword(data.token, data.newPassword);

    return successResponse(null, "Password reset successful");
  } catch (error) {
    return handleApiError(error);
  }
}
