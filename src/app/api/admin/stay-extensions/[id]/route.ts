import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { handleApiError } from "@/lib/utils/error-handler";
import { successResponse, unauthorizedResponse, notFoundResponse, errorResponse } from "@/lib/utils/api-response";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const role = session.user.role;
    if (role !== "SUPER_ADMIN" && role !== "HOSTEL_ADMIN") {
      return unauthorizedResponse("Access denied");
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      return errorResponse("Invalid status. Use APPROVED or REJECTED.", 400);
    }

    const extension = await prisma.stayExtension.findUnique({
      where: { id },
      include: {
        gatePass: {
          include: {
            request: { include: { student: true } },
          },
        },
      },
    });
    if (!extension) return notFoundResponse("Extension request not found");

    const updated = await prisma.$transaction(async (tx) => {
      const ext = await tx.stayExtension.update({
        where: { id },
        data: { status },
      });

      if (status === "APPROVED") {
        const [hours, minutes] = extension.requestedDepartureTime.split(":").map(Number);
        const newValidTo = new Date(extension.gatePass.validTo);
        newValidTo.setHours(hours, minutes, 0, 0);

        await tx.gatePass.update({
          where: { id: extension.gatePassId },
          data: { validTo: newValidTo },
        });
      }

      return ext;
    });

    const studentUser = await prisma.user.findFirst({
      where: { email: extension.gatePass.request.student.email },
    });
    if (studentUser) {
      await prisma.notification.create({
        data: {
          userId: studentUser.id,
          title: `Stay Extension ${status === "APPROVED" ? "Approved" : "Rejected"}`,
          message: `Your stay extension request for pass ${extension.gatePass.passNumber} has been ${status.toLowerCase()}.`,
        },
      });
    }

    return successResponse(updated, `Extension request ${status.toLowerCase()}`);
  } catch (error) {
    return handleApiError(error);
  }
}
