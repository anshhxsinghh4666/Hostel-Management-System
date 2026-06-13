import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { handleApiError } from "@/lib/utils/error-handler";
import { successResponse, unauthorizedResponse, notFoundResponse, errorResponse } from "@/lib/utils/api-response";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const student = await prisma.student.findFirst({
      where: { email: session.user.email! },
    });
    if (!student) return notFoundResponse("Student profile not found");

    const body = await request.json();
    const { gatePassId, newDepartureTime, reason } = body;

    if (!gatePassId || !newDepartureTime || !reason) {
      return errorResponse("All fields are required", 400);
    }

    const gatePass = await prisma.gatePass.findFirst({
      where: {
        id: gatePassId,
        request: { studentId: student.id },
      },
    });

    if (!gatePass) return notFoundResponse("Gate pass not found");
    if (gatePass.status !== "ACTIVE") {
      return errorResponse("Gate pass is not active", 400);
    }

    const existingExtension = await prisma.stayExtension.findFirst({
      where: { gatePassId, status: "PENDING" },
    });
    if (existingExtension) {
      return errorResponse("A pending extension request already exists for this pass", 400);
    }

    const extension = await prisma.stayExtension.create({
      data: {
        gatePassId,
        requestedDepartureTime: newDepartureTime,
        reason,
      },
    });

    await prisma.notification.create({
      data: {
        userId: session.user.id,
        title: "Stay Extension Request Submitted",
        message: `Extension request for gate pass ${gatePass.passNumber} has been submitted.`,
      },
    });

    return successResponse(extension, "Stay extension request submitted successfully", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
