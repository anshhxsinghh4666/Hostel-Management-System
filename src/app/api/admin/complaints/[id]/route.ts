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
    const { status, adminRemark } = body;

    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) return notFoundResponse("Complaint not found");

    const validStatuses = ["PENDING", "IN_PROGRESS", "RESOLVED"];
    if (status && !validStatuses.includes(status)) {
      return errorResponse("Invalid status", 400);
    }

    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(adminRemark !== undefined && { adminRemark }),
      },
    });

    const student = await prisma.student.findUnique({ where: { id: complaint.studentId } });
    const user = await prisma.user.findFirst({ where: { email: student?.email } });

    if (user) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: "Complaint Status Updated",
          message: `Your complaint "${complaint.subject}" status has been updated to ${status || complaint.status}.${adminRemark ? ` Remark: ${adminRemark}` : ""}`,
        },
      });
    }

    return successResponse(updated, "Complaint updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const role = session.user.role;
    if (role !== "SUPER_ADMIN") {
      return unauthorizedResponse("Access denied");
    }

    const { id } = await params;
    await prisma.complaint.delete({ where: { id } });
    return successResponse(null, "Complaint deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
