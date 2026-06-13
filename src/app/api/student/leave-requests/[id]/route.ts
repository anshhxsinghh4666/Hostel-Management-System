import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { handleApiError } from "@/lib/utils/error-handler";
import { successResponse, unauthorizedResponse, notFoundResponse } from "@/lib/utils/api-response";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const { id } = await params;

    const student = await prisma.student.findFirst({
      where: { email: session.user.email! },
    });
    if (!student) return notFoundResponse("Student profile not found");

    const leaveRequest = await prisma.leaveRequest.findFirst({
      where: { id, studentId: student.id },
    });
    if (!leaveRequest) return notFoundResponse("Leave request not found");

    return successResponse(leaveRequest);
  } catch (error) {
    return handleApiError(error);
  }
}
