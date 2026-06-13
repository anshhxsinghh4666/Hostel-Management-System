import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { handleApiError } from "@/lib/utils/error-handler";
import { successResponse, unauthorizedResponse, notFoundResponse, errorResponse } from "@/lib/utils/api-response";
import { randomBytes } from "crypto";

function generatePassNumber(): string {
  const prefix = "GP";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

function generateQrToken(): string {
  return randomBytes(16).toString("hex");
}

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
    const { status, remarks } = body;

    const visitorRequest = await prisma.visitorRequest.findUnique({
      where: { id },
      include: { student: true },
    });
    if (!visitorRequest) return notFoundResponse("Visitor request not found");

    if (status === "APPROVED") {
      const validFrom = new Date(visitorRequest.visitDate);
      const [arrHours, arrMins] = visitorRequest.arrivalTime.split(":").map(Number);
      validFrom.setHours(arrHours, arrMins, 0, 0);

      const validTo = new Date(visitorRequest.visitDate);
      const [depHours, depMins] = visitorRequest.departureTime.split(":").map(Number);
      validTo.setHours(depHours, depMins, 0, 0);

      const qrToken = generateQrToken();
      const passNumber = generatePassNumber();

      const updated = await prisma.$transaction(async (tx) => {
        const req = await tx.visitorRequest.update({
          where: { id },
          data: { status: "APPROVED", remarks },
        });

        const pass = await tx.gatePass.create({
          data: {
            requestId: id,
            passNumber,
            qrToken,
            validFrom,
            validTo,
          },
        });

        return { ...req, gatePass: pass };
      });

      const studentUser = await prisma.user.findFirst({
        where: { email: visitorRequest.student.email },
      });
      if (studentUser) {
        await prisma.notification.create({
          data: {
            userId: studentUser.id,
            title: "Visitor Request Approved",
            message: `Your visitor request has been approved. Gate pass: ${passNumber}. Valid: ${visitorRequest.arrivalTime} - ${visitorRequest.departureTime}.`,
          },
        });
      }

      return successResponse(updated, "Visitor request approved and gate pass generated");
    } else if (status === "REJECTED") {
      const updated = await prisma.visitorRequest.update({
        where: { id },
        data: { status: "REJECTED", remarks },
        include: { visitor: true, gatePass: true },
      });

      const studentUser = await prisma.user.findFirst({
        where: { email: visitorRequest.student.email },
      });
      if (studentUser) {
        await prisma.notification.create({
          data: {
            userId: studentUser.id,
            title: "Visitor Request Rejected",
            message: `Your visitor request has been rejected.${remarks ? ` Reason: ${remarks}` : ""}`,
          },
        });
      }

      return successResponse(updated, "Visitor request rejected");
    } else {
      return errorResponse("Invalid status. Use APPROVED or REJECTED.", 400);
    }
  } catch (error) {
    return handleApiError(error);
  }
}
