import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { allocationService } from "@/lib/services/allocation.service";
import { allocationQuerySchema } from "@/lib/validations/room.schema";
import { handleApiError } from "@/lib/utils/error-handler";
import { successResponse, unauthorizedResponse, forbiddenResponse } from "@/lib/utils/api-response";
import { canManageStudents } from "@/lib/permissions/permissions";
import { Role } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const actorRole = session.user.role as Role;
    if (!canManageStudents(actorRole)) {
      return forbiddenResponse("You do not have permission to view allocations");
    }

    const { searchParams } = new URL(request.url);
    const query = allocationQuerySchema.parse(Object.fromEntries(searchParams));

    const result = await allocationService.getAllocations(actorRole, query);

    return successResponse(result.data, undefined, 200, result.meta);
  } catch (error) {
    return handleApiError(error);
  }
}
