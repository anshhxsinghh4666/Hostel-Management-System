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
    const { status, adminComment } = body;

    const leaveRequest = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!leaveRequest) return notFoundResponse("Leave request not found");

    const validStatuses = ["PENDING", "APPROVED", "REJECTED"];
    if (status && !validStatuses.includes(status)) {
      return errorResponse("Invalid status", 400);
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(adminComment !== undefined && { adminComment }),
      },
    });

    const student = await prisma.student.findUnique({ where: { id: leaveRequest.studentId } });
    const user = await prisma.user.findFirst({ where: { email: student?.email } });

    if (user) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: `Leave ${status === "APPROVED" ? "Approved" : "Rejected"}`,
          message: `Your leave request from ${leaveRequest.fromDate.toISOString().split("T")[0]} to ${leaveRequest.toDate.toISOString().split("T")[0]} has been ${status?.toLowerCase() || "updated"}.${adminComment ? ` Comment: ${adminComment}` : ""}`,
        },
      });
    }

    return successResponse(updated, `Leave request ${status?.toLowerCase() || "updated"} successfully`);
  } catch (error) {
    return handleApiError(error);
  }
}
