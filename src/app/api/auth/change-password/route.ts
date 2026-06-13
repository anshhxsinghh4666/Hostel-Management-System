import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { authService } from "@/lib/services/auth.service";
import { changePasswordSchema } from "@/lib/validations/profile.schema";
import { handleApiError } from "@/lib/utils/error-handler";
import { successResponse, unauthorizedResponse } from "@/lib/utils/api-response";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const body = await request.json();
    const data = changePasswordSchema.parse(body);

    await authService.changePassword(
      session.user.id,
      data.currentPassword,
      data.newPassword
    );

    return successResponse(null, "Password changed successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
