import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { handleApiError } from "@/lib/utils/error-handler";
import { successResponse, unauthorizedResponse, notFoundResponse, errorResponse } from "@/lib/utils/api-response";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const body = await request.json();
    const { qrToken } = body;

    if (!qrToken) {
      return errorResponse("QR token is required", 400);
    }

    const gatePass = await prisma.gatePass.findUnique({
      where: { qrToken },
      include: {
        request: {
          include: {
            visitor: true,
            student: {
              include: { hostel: true, room: true },
            },
          },
        },
        logs: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!gatePass) {
      return notFoundResponse("Invalid QR code. No gate pass found.");
    }

    const now = new Date();
    let status: "valid" | "expired" | "revoked" = "valid";
    let message = "Gate pass is valid";

    if (gatePass.status === "REVOKED") {
      status = "revoked";
      message = "Gate pass has been revoked";
    } else if (gatePass.status === "EXPIRED" || now > gatePass.validTo) {
      status = "expired";
      message = "Gate pass has expired";
    } else if (now < gatePass.validFrom) {
      status = "expired";
      message = "Gate pass is not yet valid";
    }

    const latestLog = gatePass.logs[0];
    const visitorStatus = latestLog
      ? latestLog.checkOutTime
        ? "Exited"
        : "Inside Hostel"
      : "Not Checked In";

    return successResponse({
      status,
      message,
      gatePass: {
        passNumber: gatePass.passNumber,
        validFrom: gatePass.validFrom,
        validTo: gatePass.validTo,
        passStatus: gatePass.status,
      },
      visitor: gatePass.request.visitor,
      student: {
        name: `${gatePass.request.student.firstName} ${gatePass.request.student.lastName}`,
        registrationNumber: gatePass.request.student.registrationNumber,
        roomNumber: gatePass.request.student.room?.roomNumber || "N/A",
        hostel: gatePass.request.student.hostel?.hostelName || "N/A",
      },
      visitDetails: {
        date: gatePass.request.visitDate,
        purpose: gatePass.request.purpose,
        arrivalTime: gatePass.request.arrivalTime,
        departureTime: gatePass.request.departureTime,
      },
      visitorStatus,
      lastLog: latestLog,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
