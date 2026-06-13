import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { authService } from "@/lib/services/auth.service";
import { handleApiError } from "@/lib/utils/error-handler";
import { successResponse, unauthorizedResponse } from "@/lib/utils/api-response";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorizedResponse();
    }

    await authService.logout(session.user.id);

    return successResponse(null, "Logged out successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
