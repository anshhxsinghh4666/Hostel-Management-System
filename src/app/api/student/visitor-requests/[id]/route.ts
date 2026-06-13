import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { handleApiError } from "@/lib/utils/error-handler";
import { successResponse, unauthorizedResponse, notFoundResponse } from "@/lib/utils/api-response";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const student = await prisma.student.findFirst({
      where: { email: session.user.email! },
    });
    if (!student) return notFoundResponse("Student profile not found");

    const { id } = await params;
    const visitorRequest = await prisma.visitorRequest.findFirst({
      where: { id, studentId: student.id },
      include: {
        visitor: true,
        gatePass: {
          include: {
            logs: true,
            stayExtension: true,
          },
        },
      },
    });

    if (!visitorRequest) return notFoundResponse("Visitor request not found");

    return successResponse(visitorRequest);
  } catch (error) {
    return handleApiError(error);
  }
}
