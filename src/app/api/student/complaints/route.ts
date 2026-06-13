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

    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({
        where: { studentId: student.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.complaint.count({ where: { studentId: student.id } }),
    ]);

    return successResponse(complaints, undefined, 200, {
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
    const { category, subject, description, priority } = body;

    if (!category || !subject || !description) {
      return errorResponse("Category, subject, and description are required", 400);
    }

    const validCategories = ["ELECTRICAL", "PLUMBING", "INTERNET", "FURNITURE", "CLEANING", "OTHER"];
    const validPriorities = ["LOW", "MEDIUM", "HIGH"];

    if (!validCategories.includes(category)) {
      return errorResponse("Invalid category", 400);
    }
    if (priority && !validPriorities.includes(priority)) {
      return errorResponse("Invalid priority", 400);
    }

    const complaint = await prisma.complaint.create({
      data: {
        studentId: student.id,
        category,
        subject,
        description,
        priority: priority || "MEDIUM",
      },
    });

    await prisma.notification.create({
      data: {
        userId: session.user.id,
        title: "Complaint Submitted",
        message: `Your complaint "${subject}" has been submitted successfully.`,
      },
    });

    return successResponse(complaint, "Complaint submitted successfully", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
