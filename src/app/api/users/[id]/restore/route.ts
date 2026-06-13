import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { userService } from "@/lib/services/user.service";
import { handleApiError } from "@/lib/utils/error-handler";
import { successResponse, unauthorizedResponse, forbiddenResponse } from "@/lib/utils/api-response";
import { canRestoreUser } from "@/lib/permissions/permissions";
import { Role } from "@/lib/types";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const actorRole = session.user.role as Role;
    if (!canRestoreUser(actorRole)) {
      return forbiddenResponse("You do not have permission to restore users");
    }

    const { id } = await params;
    const user = await userService.restoreUser(actorRole, session.user.id, id);

    return successResponse(user, "User restored successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
