import { auth } from "@/lib/auth/auth";
import { reportsService } from "@/lib/services/reports.service";
import { handleApiError } from "@/lib/utils/error-handler";
import { successResponse, unauthorizedResponse } from "@/lib/utils/api-response";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const params = {
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      search: searchParams.get("search") || undefined,
      status: searchParams.get("status") || undefined,
    };

    const data = await reportsService.getStudentReport(params);
    return successResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}
