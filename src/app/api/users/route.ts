import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { userService } from "@/lib/services/user.service";
import { createUserSchema, userQuerySchema } from "@/lib/validations/user.schema";
import { handleApiError } from "@/lib/utils/error-handler";
import { successResponse, unauthorizedResponse, forbiddenResponse } from "@/lib/utils/api-response";
import { canCreateUser } from "@/lib/permissions/permissions";
import { Role } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const query = userQuerySchema.parse(Object.fromEntries(searchParams));

    const result = await userService.getUsers(query);

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
    if (!canCreateUser(actorRole)) {
      return forbiddenResponse("You do not have permission to create users");
    }

    const body = await request.json();
    const data = createUserSchema.parse(body);

    const user = await userService.createUser(actorRole, session.user.id, data);

    return successResponse(user, "User created successfully", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
