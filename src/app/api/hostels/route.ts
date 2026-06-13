import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { hostelService } from "@/lib/services/hostel.service";
import { createHostelSchema, hostelQuerySchema } from "@/lib/validations/hostel.schema";
import { handleApiError } from "@/lib/utils/error-handler";
import { successResponse, unauthorizedResponse, forbiddenResponse } from "@/lib/utils/api-response";
import { canManageStudents } from "@/lib/permissions/permissions";
import { Role } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const simple = searchParams.get("simple");

    if (simple === "true") {
      const hostels = await hostelService.getAllHostels();
      return successResponse(hostels);
    }

    const query = hostelQuerySchema.parse(Object.fromEntries(searchParams));
    const result = await hostelService.getHostels(query);

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
      return forbiddenResponse("You do not have permission to create hostels");
    }

    const body = await request.json();
    const data = createHostelSchema.parse(body);

    const hostel = await hostelService.createHostel(actorRole, session.user.id, data);

    return successResponse(hostel, "Hostel created successfully", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
