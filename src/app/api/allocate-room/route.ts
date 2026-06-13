import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { allocationService } from "@/lib/services/allocation.service";
import { allocateRoomSchema } from "@/lib/validations/room.schema";
import { handleApiError } from "@/lib/utils/error-handler";
import { successResponse, unauthorizedResponse, forbiddenResponse } from "@/lib/utils/api-response";
import { canManageStudents } from "@/lib/permissions/permissions";
import { Role } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const actorRole = session.user.role as Role;
    if (!canManageStudents(actorRole)) {
      return forbiddenResponse("You do not have permission to allocate rooms");
    }

    const body = await request.json();
    const { studentId, roomId } = allocateRoomSchema.parse(body);

    const student = await allocationService.allocateRoom(actorRole, session.user.id, studentId, roomId);

    return successResponse(student, "Room allocated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
