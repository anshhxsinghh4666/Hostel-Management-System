import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { roomService } from "@/lib/services/room.service";
import { createRoomSchema, roomQuerySchema } from "@/lib/validations/room.schema";
import { handleApiError } from "@/lib/utils/error-handler";
import { successResponse, unauthorizedResponse, forbiddenResponse } from "@/lib/utils/api-response";
import { canManageStudents } from "@/lib/permissions/permissions";
import { Role } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const query = roomQuerySchema.parse(Object.fromEntries(searchParams));

    const result = await roomService.getRooms(query);

    return successResponse(result.data, undefined, 200, result.meta);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const actorRole = session.user.role as Role;
    if (!canManageStudents(actorRole)) {
      return forbiddenResponse("You do not have permission to create rooms");
    }

    const body = await request.json();
    const data = createRoomSchema.parse(body);

    const room = await roomService.createRoom(actorRole, session.user.id, data);

    return successResponse(room, "Room created successfully", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
