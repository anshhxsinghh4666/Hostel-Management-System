import { auth } from "@/lib/auth/auth";
import { dashboardService } from "@/lib/services/dashboard.service";
import { handleApiError } from "@/lib/utils/error-handler";
import { successResponse, unauthorizedResponse } from "@/lib/utils/api-response";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const stats = await dashboardService.getStats();

    return successResponse(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
