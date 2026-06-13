import { NextRequest } from "next/server";
import { forgotPasswordSchema } from "@/lib/validations/auth.schema";
import { authService } from "@/lib/services/auth.service";
import { handleApiError } from "@/lib/utils/error-handler";
import { successResponse } from "@/lib/utils/api-response";
import { rateLimit, rateLimitResponse, getClientIp } from "@/lib/utils/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { success } = rateLimit(`forgot-password:${ip}`, 3, 60000);
    if (!success) return rateLimitResponse();

    const body = await request.json();
    const data = forgotPasswordSchema.parse(body);

    const result = await authService.forgotPassword(data.email);

    if (result?.token) {
      return successResponse(
        { token: result.token },
        "Password reset token generated"
      );
    }

    return successResponse(null, "If the email exists, a reset link has been sent");
  } catch (error) {
    return handleApiError(error);
  }
}
