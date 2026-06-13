import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { studentService } from "@/lib/services/student.service";
import { updateStudentSchema } from "@/lib/validations/student.schema";
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
    const student = await studentService.getStudentById(id);

    return successResponse(student);
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
      return forbiddenResponse("You do not have permission to edit students");
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateStudentSchema.parse(body);

    const student = await studentService.updateStudent(actorRole, session.user.id, id, data);

    return successResponse(student, "Student updated successfully");
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
    if (!canManageStudents(actorRole)) {
      return forbiddenResponse("You do not have permission to deactivate students");
    }

    const { id } = await params;
    const student = await studentService.deactivateStudent(actorRole, session.user.id, id);

    return successResponse(student, "Student deactivated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
