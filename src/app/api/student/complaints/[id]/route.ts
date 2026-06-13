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

    const complaint = await prisma.complaint.findFirst({
      where: { id, studentId: student.id },
    });
    if (!complaint) return notFoundResponse("Complaint not found");

    return successResponse(complaint);
  } catch (error) {
    return handleApiError(error);
  }
}
