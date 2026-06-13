import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { allocationService } from "@/lib/services/allocation.service";
import { allocateRoomSchema, transferRoomSchema } from "@/lib/validations/room.schema";
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
      return forbiddenResponse("You do not have permission to manage allocations");
    }

    const body = await request.json();
    const { studentId, roomId } = allocateRoomSchema.parse(body);

    const student = await allocationService.allocateRoom(actorRole, session.user.id, studentId, roomId);

    return successResponse(student, "Room allocated successfully", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const actorRole = session.user.role as Role;
    if (!canManageStudents(actorRole)) {
      return forbiddenResponse("You do not have permission to manage allocations");
    }

    const body = await request.json();

    if (body.action === "transfer") {
      const { studentId, newRoomId } = transferRoomSchema.parse(body);
      const student = await allocationService.transferRoom(actorRole, session.user.id, studentId, newRoomId);
      return successResponse(student, "Room transferred successfully");
    }

    if (body.action === "vacate") {
      const { studentId } = body;
      if (!studentId) throw new Error("studentId is required");
      const student = await allocationService.vacateRoom(actorRole, session.user.id, studentId);
      return successResponse(student, "Room vacated successfully");
    }

    throw new Error("Invalid action. Use 'transfer' or 'vacate'");
  } catch (error) {
    return handleApiError(error);
  }
}
