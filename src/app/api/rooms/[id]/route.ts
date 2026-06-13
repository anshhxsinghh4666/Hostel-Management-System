import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { roomService } from "@/lib/services/room.service";
import { updateRoomSchema } from "@/lib/validations/room.schema";
import { handleApiError } from "@/lib/utils/error-handler";
import { successResponse, unauthorizedResponse, forbiddenResponse } from "@/lib/utils/api-response";
import { canManageStudents } from "@/lib/permissions/permissions";
import { Role } from "@/lib/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const { id } = await params;
    const room = await roomService.getRoomById(id);

    return successResponse(room);
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
    if (!canManageStudents(actorRole)) {
      return forbiddenResponse("You do not have permission to edit rooms");
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateRoomSchema.parse(body);

    const room = await roomService.updateRoom(actorRole, session.user.id, id, data);

    return successResponse(room, "Room updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
