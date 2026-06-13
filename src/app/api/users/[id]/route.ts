import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { userService } from "@/lib/services/user.service";
import { updateUserSchema } from "@/lib/validations/user.schema";
import { handleApiError } from "@/lib/utils/error-handler";
import { successResponse, unauthorizedResponse, forbiddenResponse } from "@/lib/utils/api-response";
import { canEditUser, canDeleteUser } from "@/lib/permissions/permissions";
import { Role } from "@/lib/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const { id } = await params;
    const user = await userService.getUserById(id);

    return successResponse(user);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const actorRole = session.user.role as Role;
    if (!canEditUser(actorRole)) {
      return forbiddenResponse("You do not have permission to edit users");
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateUserSchema.parse(body);

    const user = await userService.updateUser(actorRole, session.user.id, id, data);

    return successResponse(user, "User updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const actorRole = session.user.role as Role;
    if (!canDeleteUser(actorRole)) {
      return forbiddenResponse("You do not have permission to delete users");
    }

    const { id } = await params;
    const user = await userService.suspendUser(actorRole, session.user.id, id);

    return successResponse(user, "User suspended successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
