import { auth } from "@/lib/auth/auth";
import { analyticsService } from "@/lib/services/analytics.service";
import { handleApiError } from "@/lib/utils/error-handler";
import { successResponse, unauthorizedResponse } from "@/lib/utils/api-response";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const data = await analyticsService.getAnalyticsData();
    return successResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}
