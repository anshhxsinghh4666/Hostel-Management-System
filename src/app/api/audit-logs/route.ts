import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { auditService } from "@/lib/services/audit.service";
import { handleApiError } from "@/lib/utils/error-handler";
import { successResponse, unauthorizedResponse, forbiddenResponse } from "@/lib/utils/api-response";
import { canViewAuditLogs } from "@/lib/permissions/permissions";
import { Role } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const actorRole = session.user.role as Role;
    if (!canViewAuditLogs(actorRole)) {
      return forbiddenResponse("You do not have permission to view audit logs");
    }

    const { searchParams } = new URL(request.url);
    const rawPage = parseInt(searchParams.get("page") || "1", 10);
    const rawLimit = parseInt(searchParams.get("limit") || "10", 10);
    const query = {
      page: Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1,
      limit: Number.isFinite(rawLimit) && rawLimit > 0 && rawLimit <= 100 ? rawLimit : 10,
      userId: searchParams.get("userId") || undefined,
      action: searchParams.get("action") || undefined,
      entity: searchParams.get("entity") || undefined,
      from: searchParams.get("from") || undefined,
      to: searchParams.get("to") || undefined,
    };

    const result = await auditService.getLogs(query);

    return successResponse(result.data, undefined, 200, result.meta);
  } catch (error) {
    return handleApiError(error);
  }
}
