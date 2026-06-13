import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { handleApiError } from "@/lib/utils/error-handler";
import { successResponse, unauthorizedResponse, notFoundResponse, errorResponse } from "@/lib/utils/api-response";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const student = await prisma.student.findFirst({
      where: { email: session.user.email! },
    });
    if (!student) return notFoundResponse("Student profile not found");

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const [leaves, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where: { studentId: student.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.leaveRequest.count({ where: { studentId: student.id } }),
    ]);

    return successResponse(leaves, undefined, 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const student = await prisma.student.findFirst({
      where: { email: session.user.email! },
    });
    if (!student) return notFoundResponse("Student profile not found");

    const body = await request.json();
    const { fromDate, toDate, reason, emergencyContact, parentName } = body;

    if (!fromDate || !toDate || !reason || !emergencyContact || !parentName) {
      return errorResponse("All fields are required", 400);
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);

    if (to < from) {
      return errorResponse("To date must be after from date", 400);
    }

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        studentId: student.id,
        fromDate: from,
        toDate: to,
        reason,
        emergencyContact,
        parentName,
      },
    });

    await prisma.notification.create({
      data: {
        userId: session.user.id,
        title: "Leave Request Submitted",
        message: `Your leave request from ${fromDate} to ${toDate} has been submitted successfully.`,
      },
    });

    return successResponse(leaveRequest, "Leave request submitted successfully", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
