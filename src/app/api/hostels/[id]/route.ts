import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { hostelService } from "@/lib/services/hostel.service";
import { updateHostelSchema } from "@/lib/validations/hostel.schema";
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
    const hostel = await hostelService.getHostelById(id);

    return successResponse(hostel);
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
      return forbiddenResponse("You do not have permission to edit hostels");
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateHostelSchema.parse(body);

    const hostel = await hostelService.updateHostel(actorRole, session.user.id, id, data);

    return successResponse(hostel, "Hostel updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
